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
  changePassword: () => {},
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

  // ─── Calls backend to kill old sessions and push FORCE_LOGOUT via WebSocket ─
  const triggerSessionCleanup = async (accessToken) => {
    console.log("[Auth] Triggering session cleanup...");
    try {
      const cleanupUrl = `${hostnameV1}/auth/session/cleanup`;
      const res = await fetch(cleanupUrl, {
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
      const kc = getKeycloak();

      kc.onAuthSuccess = () => {
        const t = kcGetToken();
        const dt = jwtDecode(t);
        const newSid = dt?.sid;

        setToken(t);
        try {
          setDecodedToken(dt);
        } catch {}


        // Guard: only trigger cleanup when this is a FRESH login (new session ID).
        // kc.onAuthSuccess can fire on token refreshes in some Keycloak JS versions.
        // Without this guard, cleanup (and FORCE_LOGOUT) would fire repeatedly for
        // the same session, causing WebSocket thrash and redundant notifications.
        
        if (window._env_?.VITE_ENABLE_SESSION_CLEANUP === true && newSid !== currentSessionIdRef.current) {
          currentSessionIdRef.current = newSid;
          triggerSessionCleanup(t);
        }
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
          // Refresh failed — session was killed. Redirect to login.
          handleSessionDead();
        }
      };

      // NOW call init — handlers are already in place
      const authenticated = await initKeycloak();

      if (authenticated) {
        // onAuthSuccess handles state + cleanup for FRESH logins.
        // This block handles check-sso with an EXISTING session (page refresh),
        // where onAuthSuccess may not fire.
        // We set state here but do NOT call triggerSessionCleanup because
        // this is not a new login — no other sessions need to be kicked.
        if (!currentSessionIdRef.current) {
          const t = kcGetToken();
          setToken(t);
          try {
            const dt = jwtDecode(t);
            setDecodedToken(dt);
            currentSessionIdRef.current = dt.sid;
            const savedProject = localStorage.getItem(
              `project_${dt.preferred_username}`
            );
            if (savedProject) setProject(savedProject);
          } catch (e) {
            console.error("Invalid token:", e);
          }
        }
      }

      setIsInitializing(false);
    };

    init();
  }, []);

  // ─── LAYER 1 (PRIMARY): Global WebSocket listening for FORCE_LOGOUT ─────────
  // Opens ONE WebSocket connection per authenticated user at the AuthContext level.
  // Stays open regardless of which page the user is on (unlike page-level hooks).
  //
  // When PC2 logs in and calls /session/cleanup, the backend:
  //   1. Deletes PC1's Keycloak session
  //   2. Sends { type: "FORCE_LOGOUT", active_session_id: "<PC2's sid>" }
  //      to ALL WebSocket connections for this username
  //
  // Both PC1 and PC2 receive the message. The frontend checks:
  //   - If active_session_id === my session ID → I am PC2 (new login) → ignore
  //   - If active_session_id !== my session ID → I am PC1 (old login) → logout
  // Stable string deps: the WebSocket reconnects only when the username changes
  // (actual login/logout), NOT on every token refresh. Previously, decodedToken
  // was an object dep — every setDecodedToken() created a new reference, tearing
  // down and recreating the WebSocket on every token refresh cycle.
  const forceLogoutWsUsername = decodedToken?.preferred_username;
  const forceLogoutWsUrl = hostnameV2;

  useEffect(() => {
    if (!forceLogoutWsUsername || !forceLogoutWsUrl) return;

    const username = forceLogoutWsUsername;
    const protocol = forceLogoutWsUrl.startsWith("https") ? "wss" : "ws";
    const wsUrl = `${forceLogoutWsUrl.replace(/^https?:\/\//, `${protocol}://`)}/ws/${username}`;

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

            // If the active_session_id in the message matches MY session ID,
            // I am the new session (PC2) that just triggered the cleanup.
            // Ignore the message — I should NOT log myself out.
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

            // My session ID does NOT match → I am an old session (PC1). Log out silently.
            console.warn(
              "[Auth] FORCE_LOGOUT received — a new session took over. Logging out."
            );
            handleSessionDead();
          }

          // All other message types (table update events etc.) are ignored here.
          // Component-level useRealtimeUpdate() handles those.
        } catch {}
      };

      ws.onclose = (event) => {
        // Reconnect on unexpected disconnect (1000 = clean intentional close)
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
  }, [forceLogoutWsUsername, forceLogoutWsUrl]);

  // ─── LAYER 2 (SAFETY NET): Tab visibility check ──────────────────────────────
  // NOT polling — fires only when the user switches BACK to this browser tab.
  // Handles the edge case where the tab was sleeping and the WebSocket missed
  // the FORCE_LOGOUT message. Makes ONE network call to verify session validity.
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible") return;
      const kc = getKeycloak();
      if (!kc.authenticated) return;

      try {
        // -1 = force a refresh regardless of token expiry time
        await kc.updateToken(-1);
        const t = kcGetToken();
        setToken(t);
        try {
          setDecodedToken(jwtDecode(t));
        } catch {}
      } catch {
        // Refresh failed → session is dead → redirect to login
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

  const changePassword = async () => {
    try {
      const kc = getKeycloak();
      await kc.login({
        action: "UPDATE_PASSWORD",
        prompt: "login",
        redirectUri: `${window.location.origin}/dashboard`,
      });
    } catch (error) {
      console.error("Keycloak change password redirect failed:", error);
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
        changePassword,
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
