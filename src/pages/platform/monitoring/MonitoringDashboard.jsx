import { useEffect, useState } from "react";
import { Trash2, Plus, ChevronDown, LayoutDashboard } from "lucide-react";
import { useMonitoringContext } from "./context/monitoringcontext";

import toast from "react-hot-toast";
import MetricViewer from "./components/MetricViewer";

function MonitoringDashboard() {
  const {
    getPods,
    getContainers,
    monitoringConfig,
    setMonitoringConfig,
    dashboards,
    selectedDashboard,
    setSelectedDashboard,
    getPodUptime,
  } = useMonitoringContext();

  const [pods, setPods] = useState([]);
  const [containers, setContainers] = useState([]);
  const [openDashboard, setOpenDashboard] = useState(false);
  const [openMetricViewer, setOpenMetricViewer] = useState(false);
  const [dashboardMenuOpen, setDashboardMenuOpen] = useState(false);
  const [currentPodUptime, setCurrentPodUptime] = useState("");

  useEffect(() => {
    if (!selectedDashboard) return;

    const fetchPods = async () => {
      try {
        const result = await getPods({
          ...monitoringConfig,
          podPrefix: selectedDashboard.podPrefix,
        });
        setPods(result.data || []);
      } catch (error) {
        console.error(error);
        setPods([]);
        toast.error("Failed to fetch pods");
      }
    };
    fetchPods();
  }, [monitoringConfig, selectedDashboard]);

  useEffect(() => {
    const fetchContainers = async () => {
      if (!monitoringConfig.pod) {
        setContainers([]);
        return;
      }

      try {
        const result = await getContainers(monitoringConfig);
        setContainers(result.data || []);
      } catch (error) {
        console.error("Failed to fetch containers:", error);
        setContainers([]);
        toast.error("Failed to fetch containers");
      }

      try {
        const result = await getPodUptime(monitoringConfig);
        setCurrentPodUptime(`${result.toFixed(2)} hours`);
      } catch (error) {
        console.error("Failed to get pod uptime:", error);
        toast.error("Failed to get pod uptime.");
      }
    };

    fetchContainers();
  }, [monitoringConfig]);

  const clearSelection = () => {
    setMonitoringConfig((prev) => ({
      ...prev,
      pod: "",
      container: "",
    }));
    setContainers([]);
    setOpenDashboard(false);
    setOpenMetricViewer(false);
  };

  const handleDashboardSelect = (dashboard) => {
    setSelectedDashboard(dashboard);
    setMonitoringConfig((prev) => ({
      ...prev,
      pod: "",
      container: "",
    }));
    setDashboardMenuOpen(false);
    setOpenDashboard(false);
    setOpenMetricViewer(false);
  };

  return (
    <div className="bg-[#f9fafb] w-full h-full flex flex-col">
      {/* Selector bar */}
      <div className="bg-[#f9fafb] px-4 py-3 shadow-sm border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-3">
          {/* Dashboard selector */}
          <div className="relative min-w-[200px]">
            <button
              className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-md py-1.5 px-3 transition-colors border border-gray-300 w-full"
              onClick={() => setDashboardMenuOpen(!dashboardMenuOpen)}
            >
              <LayoutDashboard className="w-4 h-4 text-purple-700" />
              <span className="text-sm font-medium text-gray-800 truncate">
                {selectedDashboard?.name || "Select Dashboard"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  dashboardMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dashboardMenuOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                <button
                  className="w-full text-left px-3 py-2 text-sm font-medium flex items-center gap-2 text-gray-700 hover:bg-gray-50"
                  onClick={() => handleDashboardSelect(null)}
                >
                  <LayoutDashboard className="w-4 h-4 text-purple-700" />
                  Select Dashboard
                </button>
                {dashboards.map((d) => (
                  <button
                    key={d.id}
                    className={`w-full text-left px-3 py-2 text-sm font-medium flex items-center gap-2 ${
                      selectedDashboard?.id === d.id
                        ? "bg-purple-100 text-purple-800"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => handleDashboardSelect(d)}
                  >
                    <LayoutDashboard className="w-4 h-4 text-purple-700" />
                    {d.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pod selector - only shown when dashboard is selected */}
          {selectedDashboard && (
            <div className="relative min-w-[220px]">
              <select
                className="w-full bg-gray-50 border border-gray-300 text-gray-700 rounded-md py-1.5 pl-3 pr-8 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 appearance-none"
                value={monitoringConfig.pod}
                onChange={(e) => {
                  setMonitoringConfig((prev) => ({
                    ...prev,
                    pod: e.target.value,
                    container: "",
                  }));
                  setOpenMetricViewer(false);
                }}
                disabled={!selectedDashboard}
              >
                <option value="">Select Pod</option>
                {pods.map((p) => (
                  <option key={p.pod} value={p.pod}>
                    {p.pod}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          )}

          {/* Container selector - only shown when pod is selected */}
          {monitoringConfig.pod && (
            <div className="relative min-w-[200px]">
              <select
                className="w-full bg-gray-50 border border-gray-300 text-gray-700 rounded-md py-1.5 pl-3 pr-8 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 appearance-none"
                value={monitoringConfig.container}
                onChange={(e) =>{
                  setMonitoringConfig((prev) => ({
                    ...prev,
                    container: e.target.value,
                  }));
                  setOpenMetricViewer(false);
                }}
              >
                <option value="">Select Container</option>
                {containers.map((c) => (
                  <option key={c.container} value={c.container}>
                    {c.container}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600 hover:bg-gray-100 px-4 py-2 font-medium border border-gray-300 rounded-md disabled:cursor-not-allowed disabled:opacity-50">
              <button className="font-medium" onClick={() => {setOpenMetricViewer(prev => !prev); setOpenDashboard(false);}}>{openMetricViewer ? "Close Metrics" : "Show Metrics" }</button>
            </div>

          {currentPodUptime && (
            <div className="text-sm text-gray-600">
              Pod uptime:{" "}
              <span className="font-medium">{currentPodUptime}</span>
            </div>
          )}
          {/* Action buttons */}
          <div className="flex gap-2 ml-auto">
            <div className="w-full">
              <button
                className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 border border-gray-300 rounded-md disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                  setOpenDashboard(!openDashboard);
                  setOpenMetricViewer(false);
                }}
                disabled={!monitoringConfig.container}
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-purple-700" />
                  <span>Show Dashboard</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    openDashboard ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* {openDashboard && (
                <div className="mt-4 bg-white rounded-lg border border-gray-200 shadow-sm overflow-auto">
                  {
                    dashboards.find((d) => d.id === selectedDashboard?.id)
                      ?.component
                  }
                </div>
              )} */}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="flex-grow bg-white p-4">
        {!selectedDashboard && !openDashboard && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <LayoutDashboard className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-500 mb-2">
              No Dashboard Selected
            </h3>
            <p className="text-gray-500 mb-6">
              Please select a dashboard from the dropdown above
            </p>
            <button
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
              onClick={() => setDashboardMenuOpen(true)}
            >
              <LayoutDashboard className="w-4 h-4" />
              Select Dashboard
            </button>
          </div>
        )}

        {selectedDashboard && !openDashboard && !monitoringConfig.container && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              {selectedDashboard.name} Dashboard
            </h3>
            <p className="text-gray-600 mb-4">
              Please select a pod and container to view metrics
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-md w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Pod:</span>
                <span className="text-sm font-medium">
                  {monitoringConfig.pod || "Not selected"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Container:</span>
                <span className="text-sm font-medium">
                  {monitoringConfig.container || "Not selected"}
                </span>
              </div>
            </div>
          </div>
        )}

        {openDashboard && monitoringConfig.container && selectedDashboard && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full overflow-auto">
            {dashboards.find((d) => d.id === selectedDashboard?.id)?.component}
          </div>
        )}

        {openMetricViewer && monitoringConfig.pod && monitoringConfig.container && (
          <MetricViewer />
        )}
      </div>
    </div>
  );
}

export default MonitoringDashboard;
