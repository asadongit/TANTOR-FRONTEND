import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useLocation, useNavigate, Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  initKeycloak,
  login as kcLogin,
  logout as kcLogout,
  getToken as kcGetToken,
  getKeycloak,
} from "../services/KeycloakService";

const AuthContext = createContext({
  isAuthenticated: false,
  decodedToken: null,
  login: async () => false,
  logout: () => {},
  loginString: "",
  project: "default",
  setSelectedProject: () => {},
  hostnameV1: "",
  hostnameV2: "",
  isInitializing: true,
});

export const AuthProvider = ({ children }) => {
  const hostnameV1 = window._env_?.VITE_FAST_API;
  const hostnameV2 = window._env_?.VITE_FAST_API_V2;

  const [token, setToken] = useState(null);
  const [decodedToken, setDecodedToken] = useState(null);
  const [loginString, setLoginString] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();

  const [project, setProject] = useState(() => "default");

  // Stores the Keycloak session ID (sid claim) of THIS tab's current session.
 
  const currentSessionIdRef = useRef(null);

  const setSelectedProject = (projectId) => {
    if (decodedToken?.preferred_username) {
      localStorage.setItem(`project_${decodedToken.preferred_username}`, projectId);
    }
    setProject(projectId);
  };

  // ─── Shared helper: wipe auth state and send browser to login ──────────────
  const handleSessionDead = () => {
    const kc = getKeycloak();
    console.warn("[Auth] Session terminated. Redirecting to login.");
    setToken(null);
    setDecodedToken(null);
    setProject("default");
    currentSessionIdRef.current = null;
    kc.clearToken();
    kc.login({ redirectUri: `${window.location.origin}/dashboard` });
  };

  
  const triggerSessionCleanup = async (accessToken) => {
    try {
      const res = await fetch(`${hostnameV1}/api/v1/auth/session/cleanup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      console.log("[Auth] Session cleanup:", data.message);
    } catch (e) {
      // Non-fatal — login still proceeds even if this call fails
      console.warn("[Auth] Session cleanup call failed (non-fatal):", e);
    }
  };

  // ─── INIT: wire up Keycloak and its event callbacks ────────────────────────
  useEffect(() => {
    const init = async () => {
      const authenticated = await initKeycloak();
      const kc = getKeycloak();

      if (authenticated) {
        const t = kcGetToken();
        setToken(t);
        try {
          const dt = jwtDecode(t);
          setDecodedToken(dt);
          // Store the session ID of THIS existing session
          currentSessionIdRef.current = dt.sid;
          const savedProject = localStorage.getItem(
            `project_${dt.preferred_username}`
          );
          if (savedProject) setProject(savedProject);
        } catch (e) {
          console.error("Invalid token:", e);
        }
      }

      
      kc.onAuthSuccess = async () => {
        const t = kcGetToken();
        setToken(t);
        try {
          const dt = jwtDecode(t);
          setDecodedToken(dt);
          currentSessionIdRef.current = dt.sid;
        } catch {}

        
        await triggerSessionCleanup(t);
      };

      
      kc.onAuthLogout = () => {
        setToken(null);
        setDecodedToken(null);
        setProject("default");
        currentSessionIdRef.current = null;
      };

    
      kc.onTokenExpired = async () => {
        try {
          const refreshed = await kc.updateToken(30);
          if (refreshed) {
            const t = kcGetToken();
            setToken(t);
            try {
              setDecodedToken(jwtDecode(t));
            } catch {}
          }
        } catch {
          
          handleSessionDead();
        }
      };

      setIsInitializing(false);
    };

    init();
  }, []);

 
  useEffect(() => {
    if (!decodedToken?.preferred_username || !hostnameV2) return;

    const username = decodedToken.preferred_username;
    const protocol = hostnameV2.startsWith("https") ? "wss" : "ws";
    const wsUrl = `${hostnameV2.replace(/^https?:\/\//, `${protocol}://`)}/ws/${username}`;

    let ws;
    let reconnectTimer;
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;

      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "FORCE_LOGOUT") {
            const incomingActiveSessionId = data.active_session_id;
            const mySessionId = currentSessionIdRef.current;

            
            if (
              incomingActiveSessionId &&
              mySessionId &&
              incomingActiveSessionId === mySessionId
            ) {
              console.log(
                "[Auth] FORCE_LOGOUT received — this is the active session. Ignoring."
              );
              return;
            }

          
            console.warn(
              "[Auth] FORCE_LOGOUT received — a new session took over. Logging out."
            );
            handleSessionDead();
          }

          
        } catch {}
      };

      ws.onclose = (event) => {
        
        if (isMounted && event.code !== 1000) {
          reconnectTimer = setTimeout(connect, 5000);
        }
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null; // prevent reconnect attempt on unmount
        ws.close(1000);
      }
    };
  }, [decodedToken, hostnameV2]);

  
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible") return;
      const kc = getKeycloak();
      if (!kc.authenticated) return;

      try {
        
        await kc.updateToken(-1);
        const t = kcGetToken();
        setToken(t);
        try {
          setDecodedToken(jwtDecode(t));
        } catch {}
      } catch {
        
        handleSessionDead();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // ─── Sync project from decoded token ───────────────────────────────────────
  useEffect(() => {
    if (decodedToken?.preferred_username) {
      const savedProject = localStorage.getItem(
        `project_${decodedToken.preferred_username}`
      );
      if (savedProject) {
        setProject(savedProject);
      }
    }
  }, [decodedToken]);

  const login = async () => {
    setLoginString("");
    await kcLogin(true);
    return true;
  };

  const logout = async () => {
    try {
      await kcLogout();
      setToken(null);
      setDecodedToken(null);
      setProject("default");
    } catch (error) {
      console.error("Error during logout:", error);
      window.location.href = `${window.location.origin}`;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        token,
        decodedToken,
        login,
        logout,
        loginString,
        setLoginString,
        project,
        setSelectedProject,
        hostnameV1,
        hostnameV2,
        isInitializing,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
};

export const ProtectedRoute = () => {
  const { isAuthenticated, isInitializing, login } = useAuth();
  const location = useLocation();

  if (isInitializing) return null;

  if (!isAuthenticated) {
    login();
    return null;
  }

  return <Outlet />;
};

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) return null;
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};