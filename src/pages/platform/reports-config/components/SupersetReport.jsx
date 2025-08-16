import { useEffect, useRef, useState } from "react";
import { X, ExternalLink } from "lucide-react";

const SupersetReport = ({ showModal, setShowModal, currentReportName }) => {
  const SUPERSET_URL = window._env_?.VITE_REPORTING_DASHBOARD_URL;
  
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!showModal || !currentReportName) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Reset iframe if it exists
    if (iframeRef.current) {
      iframeRef.current.src = '';
    }

    // Set iframe source with standalone and embed parameters
    setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.src = `${SUPERSET_URL}/superset/dashboard/${currentReportName}/?standalone=true&embed=true`;
      }
    }, 100);
  }, [showModal, currentReportName, SUPERSET_URL]);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError('Failed to load dashboard. Please check the dashboard ID and Superset URL.');
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="dashboard-container" style={{
        width: "100%",
        height: "calc(100vh - 80px)",
        overflow: "hidden",
        position: "relative",
        margin: "0",
        padding: "0",
        backgroundColor: "#fff"
      }}>
        {/* Header with controls */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center shadow-sm">
          <div className="flex items-center">
            <h3 className="text-lg font-medium text-gray-900">Dashboard View</h3>
          </div>
          <button
            className="bg-white rounded-full p-2 shadow hover:bg-gray-200 transition-colors border"
            onClick={() => setShowModal(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-20">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <div className="text-gray-600">Loading dashboard...</div>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-20">
            <div className="text-center max-w-md">
              <div className="text-red-600 mb-2 text-xl">⚠️ Error</div>
              <div className="text-gray-600 mb-4">{error}</div>
            </div>
          </div>
        )}

        {/* Clean iframe container for embedded view */}
        <div
          style={{
            width: "100%",
            height: "calc(100% - 56px)",
            marginTop: "56px",
            border: "none",
            overflow: "hidden",
            position: "relative"
          }}
        >
          <iframe
            ref={iframeRef}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              display: "block"
            }}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-same-origin allow-scripts allow-forms allow-top-navigation-by-user-activation"
            title="Superset Dashboard"
          />
        </div>
      </div>
    </div>
  );
};

export default SupersetReport;