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
});

export const AuthProvider = ({ children }) => {
  const hostname = import.meta.env.VITE_FAST_API;
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
        5 * 60 * 1000
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
      const response = await fetch(`${hostname}/auth/login`, {
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
          return true;
        } catch (error) {
          console.error("Error decoding token:", error);
          return false;
        }
      }
    } catch (error) {
      console.error("Login API error:", error);
    }
  
    if (window.location.hostname === "localhost") {
      const fallbackToken = import.meta.env.VITE_ACCESS_TOKEN;
      try {
        setToken(fallbackToken);
        const decodedToken = jwtDecode(fallbackToken);
        setDecodedToken(decodedToken);
        localStorage.setItem("token", fallbackToken);
        return true;
      } catch (error) {
        console.error("Error decoding fallback token:", error);
      }
    }
  
    return false;
  };
  

  const logout = () => {
    setToken(null);
    localStorage.removeItem("token");
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
