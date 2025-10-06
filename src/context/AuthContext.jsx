import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useLocation, useNavigate, Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { initKeycloak, login as kcLogin, logout as kcLogout, getToken as kcGetToken, getKeycloak } from "../services/KeycloakService";

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
  const inactivityTimerRef = useRef(null);

  const [project, setProject] = useState(() => "default");

  const setSelectedProject = (projectId) => {
    if (decodedToken?.preferred_username) {
      localStorage.setItem(`project_${decodedToken.preferred_username}`, projectId);
    }
    setProject(projectId);
  };

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
          const savedProject = localStorage.getItem(`project_${dt.preferred_username}`);
          if (savedProject) setProject(savedProject);
        } catch (e) {
          console.error("Invalid token:", e);
        }
      }

      // Keep state in sync with Keycloak events
      kc.onAuthSuccess = () => {
        const t = kcGetToken();
        setToken(t);
        try { setDecodedToken(jwtDecode(t)); } catch {}
      };
      kc.onAuthLogout = () => {
        setToken(null);
        setDecodedToken(null);
        setProject("default");
      };
      kc.onTokenExpired = async () => {
        try {
          const refreshed = await kc.updateToken(30);
          if (refreshed) {
            const t = kcGetToken();
            setToken(t);
            try { setDecodedToken(jwtDecode(t)); } catch {}
          }
        } catch (e) {
          kcLogin(true);
        }
      };

      setIsInitializing(false);
    };

    init();
  }, []);

  useEffect(() => {
    if (decodedToken?.preferred_username) {
      const savedProject = localStorage.getItem(`project_${decodedToken.preferred_username}`);
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