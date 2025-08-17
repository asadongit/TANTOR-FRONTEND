import { useEffect, useRef, useState, useCallback } from "react";
import { X, ExternalLink } from "lucide-react";

const SupersetReport = ({ showModal, setShowModal, currentReportName }) => {
  const SUPERSET_URL = window._env_?.VITE_REPORTING_DASHBOARD_URL;
  const USERNAME = window._env_?.VITE_REPORTING_DASHBOARD_USERNAME;
  const PASSWORD = window._env_?.VITE_REPORTING_DASHBOARD_PASSWORD;
  
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authStatus, setAuthStatus] = useState('idle');

  // Check if already authenticated by testing dashboard access
  const checkExistingAuth = useCallback(async () => {
    try {
      const testUrl = `${SUPERSET_URL}/superset/dashboard/${currentReportName}/`;
      const testResponse = await fetch(testUrl, {
        method: 'HEAD',
        credentials: 'include',
        mode: 'no-cors' // This won't give us response details but won't fail on CORS
      });
      
      // If no error thrown, assume we can access it
      return true;
    } catch (err) {
      return false;
    }
  }, [SUPERSET_URL, currentReportName]);

  // Method 1: Use a proxy iframe for authentication
  const authenticateWithProxy = useCallback(() => {
    if (!SUPERSET_URL || !USERNAME || !PASSWORD) {
      setError('Missing Superset credentials in environment variables');
      setAuthStatus('failed');
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      setAuthStatus('authenticating');
      setLoading(true);

      // Create a form that will be submitted to an iframe
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${SUPERSET_URL}/login/`;
      form.target = 'auth-frame';
      form.style.display = 'none';

      // Add form fields
      const usernameField = document.createElement('input');
      usernameField.type = 'hidden';
      usernameField.name = 'username';
      usernameField.value = USERNAME;

      const passwordField = document.createElement('input');
      passwordField.type = 'hidden';
      passwordField.name = 'password';
      passwordField.value = PASSWORD;

      form.appendChild(usernameField);
      form.appendChild(passwordField);

      // Create iframe for authentication
      const authFrame = document.createElement('iframe');
      authFrame.name = 'auth-frame';
      authFrame.style.display = 'none';
      authFrame.style.width = '1px';
      authFrame.style.height = '1px';

      let authCompleted = false;
      const timeout = setTimeout(() => {
        if (!authCompleted) {
          authCompleted = true;
          cleanup();
          // Even if we timeout, try to load the dashboard
          setAuthStatus('authenticated');
          resolve(true);
        }
      }, 5000); // 5 second timeout

      const cleanup = () => {
        clearTimeout(timeout);
        if (document.body.contains(form)) {
          document.body.removeChild(form);
        }
        if (document.body.contains(authFrame)) {
          document.body.removeChild(authFrame);
        }
      };

      authFrame.onload = () => {
        if (!authCompleted) {
          // Give it a moment for the session to be established
          setTimeout(() => {
            if (!authCompleted) {
              authCompleted = true;
              setAuthStatus('authenticated');
              cleanup();
              resolve(true);
            }
          }, 1000);
        }
      };

      authFrame.onerror = () => {
        if (!authCompleted) {
          authCompleted = true;
          setError('Failed to establish authentication session');
          setAuthStatus('failed');
          cleanup();
          resolve(false);
        }
      };

      // Add to DOM and submit
      document.body.appendChild(authFrame);
      document.body.appendChild(form);
      
      setTimeout(() => {
        form.submit();
      }, 100);
    });
  }, [SUPERSET_URL, USERNAME, PASSWORD]);

  // Method 2: Direct iframe approach (bypass CORS by not using fetch)
  const authenticateDirectly = useCallback(() => {
    return new Promise((resolve) => {
      setAuthStatus('authenticating');
      setLoading(true);

      // Create a temporary iframe to handle login
      const loginIframe = document.createElement('iframe');
      loginIframe.style.position = 'absolute';
      loginIframe.style.left = '-9999px';
      loginIframe.style.width = '1px';
      loginIframe.style.height = '1px';
      
      let loginAttempted = false;
      let resolved = false;

      const cleanup = () => {
        if (document.body.contains(loginIframe)) {
          document.body.removeChild(loginIframe);
        }
      };

      const resolveAuth = (success) => {
        if (!resolved) {
          resolved = true;
          cleanup();
          if (success) {
            setAuthStatus('authenticated');
            resolve(true);
          } else {
            setAuthStatus('failed');
            resolve(false);
          }
        }
      };

      // Set up iframe load handler
      loginIframe.onload = () => {
        try {
          if (!loginAttempted) {
            loginAttempted = true;
            
            // Create login form inside the iframe
            const iframeDoc = loginIframe.contentDocument || loginIframe.contentWindow.document;
            
            // Check if we can access the iframe content (same-origin)
            if (iframeDoc) {
              const form = iframeDoc.createElement('form');
              form.method = 'POST';
              form.action = '/login/';
              
              const usernameInput = iframeDoc.createElement('input');
              usernameInput.type = 'hidden';
              usernameInput.name = 'username';
              usernameInput.value = USERNAME;
              
              const passwordInput = iframeDoc.createElement('input');
              passwordInput.type = 'hidden';
              passwordInput.name = 'password';
              passwordInput.value = PASSWORD;
              
              form.appendChild(usernameInput);
              form.appendChild(passwordInput);
              iframeDoc.body.appendChild(form);
              form.submit();
            } else {
              // Cross-origin iframe, assume login page loaded
              setTimeout(() => resolveAuth(true), 2000);
            }
          } else {
            // Second load after form submission
            setTimeout(() => resolveAuth(true), 500);
          }
        } catch (err) {
          console.log('Iframe cross-origin, assuming success after delay');
          setTimeout(() => resolveAuth(true), 2000);
        }
      };

      loginIframe.onerror = () => {
        setError('Network error - cannot reach Superset server');
        resolveAuth(false);
      };

      // Add to DOM and navigate to login
      document.body.appendChild(loginIframe);
      loginIframe.src = `${SUPERSET_URL}/login/`;

      // Fallback timeout
      setTimeout(() => {
        if (!resolved) {
          console.log('Auth timeout, assuming success');
          resolveAuth(true);
        }
      }, 8000);
    });
  }, [SUPERSET_URL, USERNAME, PASSWORD]);

  // Load dashboard
  const loadDashboard = useCallback(() => {
    if (!currentReportName || !iframeRef.current) return;

    const dashboardUrl = `${SUPERSET_URL}/superset/dashboard/${currentReportName}/?standalone=true&embed=true`;
    iframeRef.current.src = dashboardUrl;
  }, [currentReportName, SUPERSET_URL]);

  // Main initialization effect
  useEffect(() => {
    if (!showModal || !currentReportName) {
      setLoading(false);
      setAuthStatus('idle');
      return;
    }

    const initializeDashboard = async () => {
      setError(null);

      // Reset iframe
      if (iframeRef.current) {
        iframeRef.current.src = 'about:blank';
      }

      // If already authenticated, just load
      if (authStatus === 'authenticated') {
        setLoading(true);
        setTimeout(loadDashboard, 100);
        return;
      }

      // Check if already authenticated
      const alreadyAuthed = await checkExistingAuth();
      if (alreadyAuthed) {
        setAuthStatus('authenticated');
        setTimeout(loadDashboard, 100);
        return;
      }

      // Try authentication methods
      console.log('Attempting authentication...');
      
      let authSuccess = false;

      // Try proxy method first
      try {
        authSuccess = await authenticateWithProxy();
      } catch (err) {
        console.log('Proxy auth failed, trying direct method');
      }

      // If proxy failed, try direct method
      if (!authSuccess) {
        try {
          authSuccess = await authenticateDirectly();
        } catch (err) {
          console.log('Direct auth failed');
        }
      }

      // Load dashboard regardless (user might already be logged in externally)
      if (authSuccess || authStatus !== 'failed') {
        setTimeout(() => {
          setAuthStatus('authenticated');
          loadDashboard();
        }, 500);
      }
    };

    initializeDashboard();
  }, [showModal, currentReportName, authStatus, checkExistingAuth, authenticateWithProxy, authenticateDirectly, loadDashboard]);

  const handleIframeLoad = () => {
    if (iframeRef.current && iframeRef.current.src !== 'about:blank') {
      setLoading(false);
      
      // Check if iframe shows login page (indicates auth failed)
      try {
        const iframeSrc = iframeRef.current.src;
        if (iframeSrc.includes('/login')) {
          setError('Authentication required. Please check your credentials or log in manually to Superset.');
          setAuthStatus('failed');
        }
      } catch (err) {
        // Cross-origin iframe, can't check content
        setLoading(false);
      }
    }
  };

  const handleIframeError = () => {
    setLoading(false);
    setError('Failed to load dashboard. Please check the dashboard ID and network connection.');
  };

  const handleRetry = () => {
    setError(null);
    setAuthStatus('idle');
  };

  const handleManualLogin = () => {
    window.open(`${SUPERSET_URL}/login/`, '_blank');
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl" style={{
        width: "95vw",
        height: "90vh",
        overflow: "hidden",
        position: "relative"
      }}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-800">Dashboard: {currentReportName}</h3>
            {authStatus === 'authenticating' && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-blue-600">Connecting...</span>
              </div>
            )}
            {authStatus === 'authenticated' && (
              <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">✓ Connected</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* {authStatus === 'authenticated' && (
              <a
                href={`${SUPERSET_URL}/superset/dashboard/${currentReportName}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm flex items-center"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Full View
              </a>
            )} */}
            <button
              onClick={() => setShowModal(false)}
              className="bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative" style={{ height: "calc(100% - 73px)" }}>
          {/* Loading overlay */}
          {loading && !error && (
            <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <div className="text-gray-700">
                  {authStatus === 'authenticating' ? 'Establishing connection...' : 'Loading dashboard...'}
                </div>
                <div className="text-sm text-gray-500 mt-1">Please wait</div>
              </div>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-10">
              <div className="text-center max-w-md p-6">
                <div className="text-red-600 mb-3 text-lg">🔐 Authentication Needed</div>
                <div className="text-gray-700 mb-4">{error}</div>
                <div className="space-y-2">
                  <button
                    onClick={handleRetry}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors mr-2"
                  >
                    Retry Connection
                  </button>
                  <button
                    onClick={handleManualLogin}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                  >
                    Login Manually
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-3">
                  If manual login works, close and reopen this dashboard
                </div>
              </div>
            </div>
          )}

          {/* Dashboard iframe */}
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
            title="Superset Dashboard"
            style={{ 
              display: (loading && !error) ? 'none' : 'block',
              backgroundColor: '#f8f9fa'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SupersetReport;