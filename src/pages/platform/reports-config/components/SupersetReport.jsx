// import { useEffect, useRef, useState } from "react";
// import { X, ExternalLink } from "lucide-react";

// const SupersetReport = ({ showModal, setShowModal, currentReportName }) => {
//   const SUPERSET_URL = window._env_?.VITE_REPORTING_DASHBOARD_URL;

//   const iframeRef = useRef(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!showModal || !currentReportName) {
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     // Reset iframe if it exists
//     if (iframeRef.current) {
//       iframeRef.current.src = '';
//     }

//     // Set iframe source with standalone and embed parameters
//     setTimeout(() => {
//       if (iframeRef.current) {
//         iframeRef.current.src = `${SUPERSET_URL}/superset/dashboard/${currentReportName}/?standalone=true&embed=true`;
//       }
//     }, 100);
//   }, [showModal, currentReportName, SUPERSET_URL]);

//   const handleIframeLoad = () => {
//     setLoading(false);
//   };

//   const handleIframeError = () => {
//     setLoading(false);
//     setError('Failed to load dashboard. Please check the dashboard ID and Superset URL.');
//   };

//   if (!showModal) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="dashboard-container" style={{
//         width: "100%",
//         height: "calc(100vh - 80px)",
//         overflow: "hidden",
//         position: "relative",
//         margin: "0",
//         padding: "0",
//         backgroundColor: "#fff"
//       }}>
//         {/* Header with controls */}
//         <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center shadow-sm">
//           <div className="flex items-center">
//             <h3 className="text-lg font-medium text-gray-900">Dashboard View</h3>
//           </div>
//           <button
//             className="bg-white rounded-full p-2 shadow hover:bg-gray-200 transition-colors border"
//             onClick={() => setShowModal(false)}
//           >
//             <X className="h-5 w-5" />
//           </button>
//         </div>

//         {/* Loading state */}
//         {loading && (
//           <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-20">
//             <div className="flex flex-col items-center">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
//               <div className="text-gray-600">Loading dashboard...</div>
//             </div>
//           </div>
//         )}

//         {/* Error state */}
//         {error && (
//           <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-20">
//             <div className="text-center max-w-md">
//               <div className="text-red-600 mb-2 text-xl">⚠️ Error</div>
//               <div className="text-gray-600 mb-4">{error}</div>
//             </div>
//           </div>
//         )}

//         {/* Iframe container with click-blocking overlays */}
//         <div
//           style={{
//             width: "100%",
//             height: "calc(100% - 56px)",
//             marginTop: "1px",
//             border: "none",
//             overflow: "hidden",
//             position: "relative"
//           }}
//         >
//           {/* Block clicks on top header area */}
//           {/* <div
//             style={{
//               position: "absolute",
//               top: "0",
//               left: "0",
//               right: "0",
//               height: "80px", // Adjust based on your Superset header height
//               backgroundColor: "transparent",
//               zIndex: 100,
//               pointerEvents: "auto",
//               cursor: "not-allowed"
//             }}
//             title="Header navigation is disabled"
//             onClick={(e) => {
//               e.preventDefault();
//               e.stopPropagation();
//             }}
//           /> */}

//           {/* Block clicks on left sidebar/menu area */}
//           <div
//             style={{
//               position: "absolute",
//               top: "80px",
//               left: "0",
//               width: "60px", // Adjust based on sidebar width
//               height: "calc(100% - 80px)",
//               backgroundColor: "transparent",
//               zIndex: 100,
//               pointerEvents: "auto",
//               cursor: "not-allowed"
//             }}
//             title="Navigation is disabled"
//             onClick={(e) => {
//               e.preventDefault();
//               e.stopPropagation();
//             }}
//           />

//           {/* Block clicks on right side menu/settings area */}
//           {/* <div
//             style={{
//               position: "absolute",
//               top: "0",
//               right: "0",
//               width: "100px", // Covers settings, user menu, etc.
//               height: "120px",
//               backgroundColor: "transparent",
//               zIndex: 100,
//               pointerEvents: "auto",
//               cursor: "not-allowed"
//             }}
//             title="Settings and navigation are disabled"
//             onClick={(e) => {
//               e.preventDefault();
//               e.stopPropagation();
//             }}
//           /> */}

//           {/* Block clicks on dashboard title/breadcrumb area */}
//           {/* <div
//             style={{
//               position: "absolute",
//               top: "80px",
//               left: "60px",
//               right: "100px",
//               height: "40px", // Height of title/breadcrumb area
//               backgroundColor: "transparent",
//               zIndex: 100,
//               pointerEvents: "auto",
//               cursor: "not-allowed"
//             }}
//             title="Dashboard navigation is disabled"
//             onClick={(e) => {
//               e.preventDefault();
//               e.stopPropagation();
//             }}
//           /> */}

//           <iframe
//             ref={iframeRef}
//             style={{
//               width: "100%",
//               height: "100%",
//               border: "none",
//               display: "block"
//             }}
//             onLoad={handleIframeLoad}
//             onError={handleIframeError}
//             sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
//             title="Superset Dashboard"
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SupersetReport;

import { useEffect, useRef, useState } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";
import axios from "axios";
import { X } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";

const SupersetReport = ({ showModal, setShowModal, currentReportName, dashboardId }) => {
  const [isLoading, setIsLoading] = useState(false);

  const {hostnameV1} = useAuth();

  const SUPERSET_URL = window._env_?.VITE_REPORTING_DASHBOARD_URL;

  const USERNAME = window._env_?.VITE_REPORTING_DASHBOARD_USERNAME;
  const PASSWORD = window._env_?.VITE_REPORTING_DASHBOARD_PASSWORD;
  const ROLE_NAME = window._env_?.VITE_REPORTING_DASHBOARD_ROLE_NAME;

  // async function loginToSuperset() {
  //   const loginResponse = await axios.post(
  //     `${SUPERSET_URL}/api/v1/security/login`,
  //     {
  //       username: USERNAME,
  //       password: PASSWORD,
  //       provider: "db",
  //       refresh: true,
  //     },
  //     {
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   );
  //   return loginResponse.data.access_token;
  // }

  async function fetchGuestTokenFromBackend(dashboardId) {
    try {
      // const accessToken = await loginToSuperset();

      // const sessionResponse = await axios.get(
      //   `${SUPERSET_URL}/api/v1/security/csrf_token/`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${accessToken}`,
      //     },
      //     withCredentials: true,
      //   }
      // );

      // const csrfToken = sessionResponse.data.result;

      // const response = await axios.post(
      //   `${SUPERSET_URL}/api/v1/security/guest_token/`,
      //   {
      //     user: {
      //       username: USERNAME,
      //       first_name: "Superset",
      //       last_name: "Admin",
      //       roles: [ROLE_NAME],
      //     },
      //     resources: [
      //       {
      //         type: "dashboard",
      //         id: dashboardId,
      //       },
      //     ],
      //     rls: [],
      //   },
      //   {
      //     headers: {
      //       "Content-Type": "application/json",
      //       "X-CSRFToken": csrfToken,
      //       Authorization: `Bearer ${accessToken}`,
      //     },
      //     withCredentials: true,
      //   }
      // );

      const response = await fetch(`${hostnameV1}/superset/fetchGuestToken?embed_id=${dashboardId}`);
      const data = await response.json();

      return data["token"] || "";
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

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="dashboard-container"
        style={{
          width: "100%",
          height: "calc(100vh - 80px)",
          overflow: "hidden",
          position: "relative",
          margin: "0",
          padding: "0",
          backgroundColor: "#fff",
        }}
      >
        <div className="flex justify-end mt-2 mb-2">
          <button
            className="mr-4 text-white bg-[#8e78b7] hover:bg-[#a583e3] focus:outline-none focus:ring-2 focus:ring-[#a583e3] dark:focus:ring-[#7d7d7d] rounded-md text-sm px-5 py-2.5 shadow-lg transition duration-200 ease-in-out"
            onClick={() => {
              window.open(`${SUPERSET_URL}/superset/dashboard/${dashboardId}`, "_blank");
            }}
          >
            Edit Report
          </button>
          <button
            className=" mr-2 bg-white shadow pl-1 pr-1 hover:bg-gray-200"
            onClick={() => setShowModal(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

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
