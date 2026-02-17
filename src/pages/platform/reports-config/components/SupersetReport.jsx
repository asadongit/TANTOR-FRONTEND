import { useEffect, useRef, useState } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";
import axios from "axios";
import { X } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";

const SupersetReport = ({ showModal, setShowModal, currentReportName, dashboardId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const {hostnameV1, token} = useAuth();

  const SUPERSET_URL = window._env_?.VITE_REPORTING_DASHBOARD_URL;
  const USERNAME = window._env_?.VITE_REPORTING_DASHBOARD_USERNAME;
  const PASSWORD = window._env_?.VITE_REPORTING_DASHBOARD_PASSWORD;
  const ROLE_NAME = window._env_?.VITE_REPORTING_DASHBOARD_ROLE_NAME;

  async function fetchGuestTokenFromBackend(dashboardId) {
    try {
      const response = await fetch(
        `${hostnameV1}/superset/fetchGuestToken?embed_id=${dashboardId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      return data["token"] || "";
    } catch (error) {
      console.error("Error fetching guest token:", error);
      throw error;
    }
  }

  const containerRef = useRef(null);
  const modalRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!showModal || !currentReportName || !containerRef.current) return;

    containerRef.current.innerHTML = "";

    const embedDashboardInstance = async () => {
      try {
        setLoading(true);
        setError(null);

        await embedDashboard({
          id: currentReportName,
          supersetDomain: SUPERSET_URL,
          mountPoint: containerRef.current,
          fetchGuestToken: () => fetchGuestTokenFromBackend(currentReportName),
          dashboardUiConfig: {
            hideTitle: false,
            hideChartControls: false,
            hideTab: false,
            filters: {
              visible: true,
              expanded: true,
            },
            showMyChartEditorModal: true,
          },
          iframeSandboxExtras: [
            "allow-same-origin",
            "allow-scripts",
            "allow-forms",
          ],
          style: {
            width: "100%",
            height: "100%",
            border: "none",
          },
        });

        const iframe = containerRef.current.querySelector("iframe");
        if (iframe) {
          iframe.style.width = "100%";
          iframe.style.height = "100%";
          iframe.style.border = "none";
          iframe.style.display = "block";
        }

        setLoading(false);
      } catch (err) {
        console.error("Error embedding dashboard:", err);
        setError(
          "Failed to load dashboard: " + (err.message || "Unknown error")
        );
        setLoading(false);
      }
    };

    embedDashboardInstance();
  }, [showModal, currentReportName]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showModal]);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-2xl flex flex-col w-full h-full max-w-6xl max-h-screen md:max-h-[90vh] overflow-hidden"
        style={{
          maxWidth: "min(100vw - 2rem, 2400px)",
          maxHeight: "min(100vh - 2rem, 95vh)",
        }}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-4 md:px-6 py-1.5 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-lg md:text-xl font-semibold text-slate-900 truncate"></h3>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
            className="mr-4 text-white bg-[#8e78b7] hover:bg-[#a583e3] focus:outline-none focus:ring-2 focus:ring-[#a583e3] dark:focus:ring-[#7d7d7d] rounded-md text-sm px-2.5 py-1.5 shadow-lg transition duration-200 ease-in-out"
              onClick={() => {
                window.open(`${SUPERSET_URL}/superset/dashboard/${dashboardId}`, "_blank");
              }}
            >
              Edit Report
            </button>

            <button
              className="inline-flex items-center justify-center p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors duration-150"
              onClick={() => setShowModal(false)}
              title="Close modal"
              aria-label="Close dashboard"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        
        <div className="flex-1 overflow-auto relative bg-white">

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-20 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
                </div>
                <p className="text-slate-600 font-medium">Loading dashboard...</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-20 backdrop-blur-sm">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
                <div className="flex items-start gap-3">
                  <div className="text-red-600 text-xl">⚠️</div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">
                      Failed to Load Dashboard
                    </h4>
                    <p className="text-slate-600 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            ref={containerRef}
            className="w-full h-full min-h-[500px]"
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SupersetReport;