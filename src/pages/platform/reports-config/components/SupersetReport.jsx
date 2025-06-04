import { useEffect, useRef, useState } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";
import axios from "axios";
import { X } from "lucide-react";

const SupersetReport = ({ showModal, setShowModal, currentReportName }) => {
  const [isLoading, setIsLoading] = useState(false);

  const SUPERSET_URL = "https://visualization.app.translab.io";
  const GUEST_TOKEN_API = "/api/v1/security/guest_token/";
  const USERNAME = "admin";
  const ROLE_NAME = "Gamma";

  async function loginToSuperset() {
    const loginResponse = await axios.post(
      `${SUPERSET_URL}/api/v1/security/login`,
      {
        username: USERNAME,
        password: "admin",
        provider: "db",
        refresh: true,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return loginResponse.data.access_token;
  }

  async function fetchGuestTokenFromBackend(dashboardId) {
    try {
      const accessToken = await loginToSuperset();

      const sessionResponse = await axios.get(
        `${SUPERSET_URL}/api/v1/security/csrf_token/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        }
      );

      const csrfToken = sessionResponse.data.result;

      const response = await axios.post(
        `${SUPERSET_URL}${GUEST_TOKEN_API}`,
        {
          user: {
            username: USERNAME,
            first_name: "Superset",
            last_name: "Admin",
            roles: [ROLE_NAME],
          },
          resources: [
            {
              type: "dashboard",
              id: dashboardId,
            }
          ],
          rls: [],
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        }
      );

      console.log("Guest token response:", response.data);
      return response.data.token;
    } catch (error) {
      console.error("Error fetching guest token:", error);
      throw error;
    }
  }

  const containerRef = useRef(null);
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
          iframeSandboxExtras: ['allow-same-origin', 'allow-scripts', 'allow-forms'],
          style: {
            width: '100%',
            height: '100%',
            border: 'none',
          }
        });

        const iframe = containerRef.current.querySelector('iframe');
        if (iframe) {
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.style.display = 'block';
          }
        setLoading(false);
      } catch (err) {
        console.error("Error embedding dashboard:", err);
        setError("Failed to load dashboard: " + (err.message || "Unknown error"));
        setLoading(false);
      }
    };

    embedDashboardInstance();
  }, [showModal, currentReportName]);

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
        <button
          className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow hover:bg-gray-200"
          onClick={() => setShowModal(false)}
        >
          <X className="h-5 w-5" />
        </button>
        {loading && <div className="loading">Loading dashboard...</div>}
        {error && <div className="error">{error}</div>}
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
        />
      </div>
    </div>
  );
};

export default SupersetReport;
