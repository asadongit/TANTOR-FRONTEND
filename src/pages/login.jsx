import { React, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Tantor from "../assets/Tantor.svg";

const TantorLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginString, setLoginString } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginString("");
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        const origin = location.state?.from?.pathname || "/dashboard";
        navigate(origin);
      } else {
        setLoginString("Invalid username or password");
        setIsLoading(false);
      }
    } catch (err) {
      setLoginString("An unexpected error occurred");
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="w-1/2 bg-[#8e78b7]"></div>

      <div className="w-1/2 flex items-center justify-center p-12">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center">
            <img src={Tantor} alt="Tantor Logo" className="h-10 mr-3" />
          </div>

          <h2 className="text-2xl font-bold mb-2">
            Login to account{" "}
            <iconify-icon
              icon="noto-v1:waving-hand"
              width="25"
              height="25"
            ></iconify-icon>
          </h2>
          <p className="text-gray-500 mb-6">
            Enter your username and password to continue
          </p>

          {(loginString) && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-sm text-red-700">{loginString}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Username"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Password"
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-[#8e78b7] focus:ring-[#8e78b7] border-gray-200 rounded"
                disabled={isLoading}
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-500"
              >
                Remember me
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-[#8e78b7] text-white py-2 rounded-md hover:bg-gray-400 transition-colors relative"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex justify-center items-center">
                  <span className="animate-pulse">Signing in</span>
                  <div className="flex ml-2">
                    <div className="h-2 w-2 bg-white rounded-full mr-1 animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="h-2 w-2 bg-white rounded-full mr-1 animate-bounce" style={{animationDelay: '200ms'}}></div>
                    <div className="h-2 w-2 bg-white rounded-full animate-bounce" style={{animationDelay: '400ms'}}></div>
                  </div>
                </div>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TantorLogin;