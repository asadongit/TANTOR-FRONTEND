import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useLocation, useNavigate, Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext({
  isAuthenticated: false,
  decodedToken: null,
  login: async () => false,
  logout: () => {},
  loginString: "",
  project: "default",
  setSelectedProject: () => {},
  hostnameV1: "",
  hostnameV2: ""
});

export const AuthProvider = ({ children }) => {
  const hostnameV1 = window._env_?.VITE_FAST_API;
  const hostnameV2 = window._env_?.VITE_FAST_API_V2;

  const [token, setToken] = useState(
    () => localStorage.getItem("token") || null
  );
  const [decodedToken, setDecodedToken] = useState(() => {
    if (token) {
      try {
        return jwtDecode(token);
      } catch (error) {
        console.error("Invalid token:", error);
        return null;
      }
    }
    return null;
  });
  const [loginString, setLoginString] = useState("");
  const navigate = useNavigate();
  const inactivityTimerRef = useRef(null);


  const [project, setProject] = useState(() => {
    if (decodedToken?.preferred_username) {
      return localStorage.getItem(`project_${decodedToken.preferred_username}`) || "default";
    }
    return "default";
  });

  const setSelectedProject = (projectId) => {
    if (decodedToken?.preferred_username) {
      localStorage.setItem(`project_${decodedToken.preferred_username}`, projectId);
    }
    setProject(projectId);
  };

  useEffect(() => {
    if (decodedToken?.preferred_username) {
      const savedProject = localStorage.getItem(`project_${decodedToken.preferred_username}`);
      if (savedProject) {
        setProject(savedProject);
      }
    }
  }, [decodedToken]);

  useEffect(() => {
    const logoutDueToInactivity = () => {
      setLoginString(
        "Your session has expired. Please log in again to continue working."
      );
      logout();
    };

    const resetTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(
        logoutDueToInactivity,
        500000 * 600000 * 1000
      );
    };

    if (token) {
      resetTimer();
      window.addEventListener("mousemove", resetTimer);
      window.addEventListener("keydown", resetTimer);
      window.addEventListener("click", resetTimer);
    }

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await fetch(`${hostnameV1}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
  
      const data = await response.json();
      if (response.ok && data.access_token) {
        try {
          setToken(data.access_token);
          const decodedToken = jwtDecode(data.access_token);
          setDecodedToken(decodedToken);
          localStorage.setItem("token", data.access_token);
          
          const savedProject = localStorage.getItem(`project_${decodedToken.preferred_username}`);
          if (savedProject) {
            setProject(savedProject);
          }
          
          return true;
        } catch (error) {
          console.error("Error decoding token:", error);
          return false;
        }
      }
    } catch (error) {
      console.error("Login API error:", error);
    }

    return false;
  };


  const logout = () => {
    setToken(null);
    setDecodedToken(null);
    setProject("default");
    localStorage.removeItem("token");
    // localStorage.removeItem(`project_${decodedToken.preferred_username}`);
    navigate("/");
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
        hostnameV2
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
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};