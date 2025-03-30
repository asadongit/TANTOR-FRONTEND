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
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      try {
        return jwtDecode(storedToken);
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
      // const response = await fetch(`${hostname}/auth/login`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ username, password }),
      // });

      // const data = await response.json();
      // if (response.ok && data.access_token) {
        try {
          // const decodedToken = jwtDecode(data.access_token);
          const decodedToken = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJhUlJoQV8yeDJSc09ac1VFLVROdk1ucUJ4cEE0X0NLeW84bnVPcUdyTjdNIn0.eyJleHAiOjE3NDMwMjEzNTEsImlhdCI6MTc0MzAxOTczMSwianRpIjoiOTkzMzg3YmItZjJlNS00MDc2LTg3MjAtMjExMmQ5NTY2MDc3IiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay50YW50b3IuaW8vcmVhbG1zL0dhdGVrZWVwZXIiLCJhdWQiOlsiR2VuQUkiLCJyZWFsbS1tYW5hZ2VtZW50Iiwibm92aGkiLCJhY2NvdW50Il0sInN1YiI6IjE0YTZiODk3LTIzMzUtNGNiYS04ZTA5LWE0MjkxMTNkNjViOSIsInR5cCI6IkJlYXJlciIsImF6cCI6ImRhcmNoIiwic2Vzc2lvbl9zdGF0ZSI6ImY1MWEzMWEyLWJkOGItNDgyOC1iZGFhLWI4Njc4YjMzNzhhYyIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtZ2F0ZWtlZXBlciJdfSwicmVzb3VyY2VfYWNjZXNzIjp7IkdlbkFJIjp7InJvbGVzIjpbIkdsb2JhbCJdfSwicmVhbG0tbWFuYWdlbWVudCI6eyJyb2xlcyI6WyJtYW5hZ2UtcmVhbG0iLCJtYW5hZ2UtdXNlcnMiLCJxdWVyeS11c2VycyJdfSwiZGFyY2giOnsicm9sZXMiOlsiZ2xvYmFsLWFkbWluIl19LCJub3ZoaSI6eyJyb2xlcyI6WyJkZWZhdWx0Il19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIiwic2lkIjoiZjUxYTMxYTItYmQ4Yi00ODI4LWJkYWEtYjg2NzhiMzM3OGFjIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJuYW1lIjoibm92aWpvdGggc2luZ2giLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJub3Zpam90aCIsImdpdmVuX25hbWUiOiJub3Zpam90aCIsImZhbWlseV9uYW1lIjoic2luZ2giLCJlbWFpbCI6Im5vdmlqb3RoQHRyYW5zbGFiLmlvIn0.Oyljmukjtz9AYix-f6trwyIxCRTdX1y0uIaAmAgq_zjVDW4L-5VPLMnhfQiQ5GqihOCak4KpBp28UIfPZoTk-qDo4mXST4FxRR16b_RQxqcGGmSBfjytyVYBirI9_OJPiAA9m9fVQV-4pQgcrAYFKpYQKDjU_HgsbSFaYiTdOYmiyjMgZegJRmcj0J1Iu5YvDUkt4-AHSBThr56kEeak9JGBzLfpjm7eWOHo8rRsgUalU_X9Fn-Qlt7GWLJF80BvmSjavGQcXommWtoiBb4Bzbl_9lwv_tmYarNyLCdcW94JYew-C6XAgWuoxQk45wxabBD5anTIFEQQW6mrN4htPQ"
          setToken(decodedToken);
          localStorage.setItem("token", data.access_token);
          return true;
        } catch (error) {
          console.error("Error decoding token:", error);
          return false;
        }
      // }
    } catch (error) {
      console.error("Login error:", error);
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
