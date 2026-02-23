import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Activity,
  Database,
  ArrowRight,
  Clock,
  AlertCircle,
  Server,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  RotateCw,
  Info,
  Settings,
  Zap,
  MessageSquare,
  Layers,
  Copy,
  Play,
  PauseCircle,
  History,
  Edit,
  Trash2,
  BarChart2,
  Eye,
  Filter,
  ExternalLink,
  Calendar,
  Search,
  Edit3,
  ChevronUp,
  MoreVertical,
  HardDrive,
  ChevronLeft,
  Plus,
  Pencil,
  Pause,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { useCDCConfigs } from "../../hooks/connectorConfigs";
import axios from "axios";
import { useAuth } from "../../../../../context/AuthContext";
import toast from "react-hot-toast";
import Logs from "./Logs";
import ConfigEditorModal from "./editConfig";
const extractHostnameFromJdbcUrl = (jdbcUrl) => {
  if (!jdbcUrl) return "";

  try {
    if (jdbcUrl.includes("jdbc:postgresql://")) {
      const match = jdbcUrl.match(/jdbc:postgresql:\/\/([^:]+):/);
      return match && match[1] ? match[1] : "";
    } else if (jdbcUrl.includes("jdbc:mysql://")) {
      const match = jdbcUrl.match(/jdbc:mysql:\/\/([^:]+):/);
      return match && match[1] ? match[1] : "";
    } else if (jdbcUrl.includes("jdbc:sqlserver://")) {
      const match = jdbcUrl.match(/jdbc:sqlserver:\/\/([^:]+):/);
      return match && match[1] ? match[1] : "";
    } else if (jdbcUrl.includes("jdbc:oracle:thin:@//")) {
      const match = jdbcUrl.match(/jdbc:oracle:thin:@\/\/([^:]+):/);
      return match && match[1] ? match[1] : "";
    } else {
      const urlMatch = jdbcUrl.match(/jdbc:[^:]+:\/\/([^:\/]+)/);
      return urlMatch && urlMatch[1] ? urlMatch[1] : "";
    }
  } catch (error) {
    console.error("Error extracting hostname from JDBC URL:", error);
    return "";
  }
};

const StatusBadge = ({ state }) => {
  const statusMap = {
    RUNNING: {
      bg: "bg-green-100",
      text: "text-green-700",
      icon: <CheckCircle className="w-4 h-4" />,
    },
    FAILED: {
      bg: "bg-red-100",
      text: "text-red-700",
      icon: <XCircle className="w-4 h-4" />,
    },
    PAUSED: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      icon: <PauseCircle className="w-4 h-4" />,
    },
    STOPPED: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      icon: <AlertCircle className="w-4 h-4" />,
    },
    CREATED: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      icon: <Info className="w-4 h-4" />,
    },
  };

  const status = statusMap[state] || statusMap["FAILED"];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
    >
      {status.icon}
      <span className="ml-1.5">{state}</span>
    </span>
  );
};

const TaskActions = ({ task, onRestart }) => {
  return (
    <div className="flex space-x-1">
      {task.state === "FAILED" && (
        <button
          onClick={() => onRestart(task.id)}
          className="p-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors"
          title="Restart Task"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      )}
      {task.state === "PAUSED" && (
        <button
          className="p-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors"
          title="Resume Task"
        >
          <Play className="w-4 h-4" />
        </button>
      )}
      {task.state === "RUNNING" && (
        <button
          className="p-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors"
          title="Pause Task"
        >
          <PauseCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

const MetricsCard = ({
  title,
  value,
  icon,
  trend,
  change,
  color = "indigo",
}) => {
  const bgColor = `bg-${color}-50`;
  const textColor = `text-${color}-700`;
  const iconBgColor = `bg-${color}-100`;
  const iconColor = `text-${color}-600`;

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      {/* <div className="flex items-center justify-between mb-2">
        <div className={`${iconBgColor} p-2 rounded-md`}>{icon}</div>
        {trend && (
          <span
            className={`text-xs font-medium ${
              change > 0 ? "text-green-600" : "text-red-600"
            } flex items-center`}
          >
            {change > 0 ? "↗" : "↘"} {Math.abs(change)}%
          </span>
        )}
      </div> */}
      <div className="mt-2">
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
    </div>
  );
};

export default function CDCJobView() {
  const [jobData, setJobData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [configHistory, setConfigHistory] = useState([]);
  const [timeRange, setTimeRange] = useState("24h");
  const { cdcId } = useParams();
  const { data, isLoading, isError, refetch } = useCDCConfigs(cdcId);
  const { token, project, hostnameV2 } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeConfigType, setActiveConfigType] = useState(null);
  const [sourceConfigs, setSourceConfigs] = useState([]);
  const [targetConfigs, setTargetConfigs] = useState([]);
  const [selectedErrorTask, setSelectedErrorTask] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [metrics, setMetrics] = useState({
    total_events_seen: 0,
    create_events_seen: 0,
    update_events_seen: 0,
    delete_events_seen: 0,
  });
  const [isAdhocLoading, setIsAdhocLoading] = useState(false);

  const openModal = (configType) => {
    setActiveConfigType(configType);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveConfigType(null);
  };

  const closeErrorModal = () => {
    setIsErrorModalOpen(false);
    setSelectedErrorTask(null);
  };

  const [selectedConnectorName, setselectedConnectorName] = useState("")

  const fetchMetrics = async () => {
    try {
      const metricsResponse = await axios.get(
        `${hostnameV2}/cdc/debezium-metrics`,
        {
          params: { connector_name: selectedConnectorName },
          headers: { accept: "application/json" },
        }
      );
      setMetrics(metricsResponse.data);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      // toast.error("Failed to fetch metrics data");
    }
  };

  useEffect(() => {
    if (selectedConnectorName != "") {
      fetchMetrics();

      const metricIntervalId = setInterval(() => {
        fetchMetrics();
      }, 15000);

      return () => {
        clearInterval(metricIntervalId);
      };
    }
  }, [selectedConnectorName]);

     const fetchData = async () => {
      try {
        const configsResponse = await axios.get(
          `${hostnameV2}/cdc/${cdcId}/connector-configs`
        );
        const { source: sourceConfigs, target: targetConfigs } =
          configsResponse.data;
        setSourceConfigs(sourceConfigs || []);
        setTargetConfigs(targetConfigs || []);
        const connectorName = sourceConfigs[0]?.config?.config?.["topic.prefix"];
        setselectedConnectorName(connectorName)

        if (
          !data?.source_connector?.config?.name ||
          !data?.target_connector?.config?.name
        ) {
          console.warn("Missing connector names, can't fetch status");
          return;
        }

        const sourceStatus = await fetchConnectorStatus(
          data?.source_connector?.config?.name
        );

        const targetStatus = await fetchConnectorStatus(
          data?.target_connector?.config?.name
        );

        const jobData = {
          jobId: data?.cdc_name,
          source: {
            name: data?.source_connector?.config?.name,
            type: "source",
            connector: sourceStatus?.connector || { state: "UNKNOWN" },
            tasks: sourceStatus?.tasks || [],
            config: data?.source_connector?.config?.config || {},
          },
          target: {
            name: data?.target_connector?.config?.name,
            type: "target",
            connector: targetStatus?.connector || { state: "UNKNOWN" },
            tasks: targetStatus?.tasks || [],
            config: data?.target_connector?.config?.config || {},
          },
          metrics: {
            recordsProcessed: 15624,
            bytesProcessed: "42.8 MB",
            lagTime: "5.2s",
            lastSyncTime: "2025-05-03T15:23:47Z",
            errors: 2,
            throughput: "1.2k recs/min",
            syncSuccess: 98.7,
          },
        };

        setJobData(jobData);

        await fetchLokiLogs(data?.source_connector?.config?.name);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const fetchConnectorStatus = async (connectorName) => {
      try {
        const response = await axios.get(
          `${hostnameV2}/cdc/connector-status/${connectorName}`
        );
        return response.data;
      } catch (error) {
        console.error(
          `Failed to fetch status for connector ${connectorName}:`,
          error
        );
        return null;
      }
    };

    const fetchLokiLogs = async (connectorName) => {
      try {
        const response = await axios.get(`${hostnameV2}/cdc/logs/loki`, {
          params: {
            connector_name: connectorName,
          },
        });

        if (
          response.data?.data?.result?.length > 0 &&
          response.data.data.result[0]?.values
        ) {
          const logsData = response.data.data.result[0].values.map((log) => {
            const logMessage = log[1];

            const timestampEndIndex = logMessage.indexOf("]");
            const timestamp = logMessage.substring(1, timestampEndIndex).trim();

            const remainingMessage = logMessage
              .substring(timestampEndIndex + 1)
              .trim();
            const firstSpaceIndex = remainingMessage.indexOf(" ");
            const level =
              firstSpaceIndex > 0
                ? remainingMessage.substring(0, firstSpaceIndex)
                : "INFO";

            const message = remainingMessage
              .substring(firstSpaceIndex + 1)
              .trim();

            return {
              timestamp,
              level,
              connector: "source",
              message,
            };
          });

          setLogs(logsData);
        } else {
          setLogs([]);
        }
      } catch (error) {
        console.error("Error fetching logs:", error);
        setLogs([]);
      }
    };

  useEffect(() => {
    if (!cdcId) return;

    fetchData();

    const intervalId = setInterval(() => {
      fetchData();
    }, 15000);

    return () => {
      clearInterval(intervalId);
    };
  }, [cdcId, data]);

  const refreshData = () => {
    setIsRefreshing(true);
    try{
      fetchMetrics();
      fetchData();
    }catch(err){
      console.error("Error refreshing data ", err);
    }finally{
      setIsRefreshing(false);
      toast.success("Refreshed sucessfully!");
    }
  };

  const handleRestartTask = async (taskId) => {

    if (jobData) {
      let connectorName = '';

      // Determine if it's a source or target task
      const sourceTask = jobData.source.tasks.find(t => t.id === taskId);
      const targetTask = jobData.target.tasks.find(t => t.id === taskId);

      if (sourceTask) {
        connectorName = jobData.source.name;
      } else if (targetTask) {
        connectorName = jobData.target.name;
      } else {
        toast.error("Task not found");
        return;
      }

      toast.loading(`Restarting task ${taskId}...`, { id: 'restart-task' });

      try {
        // Call the new API endpoint
        await axios.post(`${hostnameV2}/cdc/restart-task`, null, {
          params: {
            connector_name: connectorName,
            task_id: taskId
          }
        });

        toast.success("Task restarted successfully", { id: 'restart-task' });

        // Refresh connector status data
        await fetchUpdatedConnectorStatus(connectorName);

        // Refresh the entire page data
        refetch();
      } catch (error) {
        console.error("Failed to restart task:", error);
        toast.error(
          `Failed to restart task: ${error.response?.data?.detail || error.message}`,
          { id: 'restart-task' }
        );
      }
    }
  };

  const handleEditConfig = (type) => {
    setActiveConfigType(type);
    setIsModalOpen(true);
  };

  const handleAdhocSnapshot = async () => {
    setIsAdhocLoading(true);

    try {
      const response = await fetch(`${hostnameV2}/cdc/${cdcId}/adhoc-snapshot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || "Adhoc snapshot triggered successfully");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to trigger adhoc snapshot");
      }
    } catch (error) {
      console.error("Error triggering adhoc snapshot:", error);
      toast.error("Failed to trigger adhoc snapshot");
    } finally {
      setIsAdhocLoading(false);
    }
  }

  // const handleActivateConfig = (configId) => {
  //   // Update the config history to mark the selected config as active
  //   const updatedHistory = configHistory.map(config => ({
  //     ...config,
  //     active: config.config_id === configId
  //   }));

  //   setConfigHistory(updatedHistory);
  // };
  const handleActivateConfig = async (payload) => {
    try {
      await axios.patch(`${hostnameV2}/cdc/${cdcId}`, payload);
      toast.success("Configuration activated successfully!");
      refetch();
    } catch (error) {
      console.error("Error activating config:", error);
      toast.error("Failed to activate configuration.");
    }
  };

  const fetchUpdatedConnectorStatus = async (connectorName) => {
    try {
      const response = await axios.get(
        `${hostnameV2}/cdc/connector-status/${connectorName}`
      );

      if (jobData) {
        const updatedJobData = { ...jobData };

        // If the connector name matches source connector, update source status
        if (connectorName === updatedJobData.source.name) {
          updatedJobData.source.connector = response.data.connector || { state: "UNKNOWN" };
          updatedJobData.source.tasks = response.data.tasks || [];
        }

        // If the connector name matches target connector, update target status
        if (connectorName === updatedJobData.target.name) {
          updatedJobData.target.connector = response.data.connector || { state: "UNKNOWN" };
          updatedJobData.target.tasks = response.data.tasks || [];
        }

        // Only update if the modal is not open or not in editing mode
        if (!isModalOpen) {
          setJobData(updatedJobData);
        }
      }

      return response.data;
    } catch (error) {
      console.error(`Failed to fetch updated status for connector ${connectorName}:`, error);
      toast.error(`Failed to update connector status: ${error.message}`);
      return null;
    }
  };

  if (isLoading || !jobData) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-blue-600 animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-blue-600 animate-pulse delay-75"></div>
            <div className="w-4 h-4 rounded-full bg-blue-600 animate-pulse delay-150"></div>
          </div>
          <p className="mt-2 text-center text-gray-600">
            Loading CDC job data...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
          <div className="flex items-center justify-center mb-4 text-red-500">
            <AlertCircle size={40} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
            Error Loading Data
          </h3>
          <p className="text-gray-600 text-center mb-4">
            {error || "Failed to load CDC job information"}
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const jobStatusColor =
    jobData.source.connector.state === "RUNNING" &&
      jobData.target.connector.state === "RUNNING"
      ? "bg-green-500"
      : jobData.source.connector.state === "FAILED" ||
        jobData.target.connector.state === "FAILED"
        ? "bg-red-500"
        : "bg-yellow-500";

  const ConnectorPanel = ({
    connectorData,
    type,
    onRestartTask,
    onEditConfig,
  }) => {
    const [expanded, setExpanded] = useState(true);
    const [showConfigModal, setShowConfigModal] = useState(false);

    const handleTaskClick = (task) => {
      if (task.state === "FAILED") {
        setSelectedErrorTask(task);
        setIsErrorModalOpen(true);
      }
    };

    const handleConnectorAction = async (action) => {
      try {
        const connectorName = connectorData.name;

        if (!connectorName) {
          toast.error("Connector name not found");
          return;
        }

        toast.loading(`${action}ing connector...`, { id: 'connector-action' });

        const response = await axios.post(`${hostnameV2}/cdc/connector-action`, null, {
          params: {
            connector_name: connectorName,
            action: action
          }
        });

        toast.success(`Connector ${action}ed successfully`, { id: 'connector-action' });

        await fetchUpdatedConnectorStatus(connectorName);

        refetch();

      } catch (error) {
        console.error(`Failed to ${action} connector:`, error);
        toast.error(`Failed to ${action} connector: ${error.response?.data?.detail || error.message}`,
          { id: 'connector-action' });
      }
    };


    const statusColor =
      connectorData.connector.state === "RUNNING"
        ? "bg-green-500"
        : connectorData.connector.state === "FAILED"
          ? "bg-red-500"
          : "bg-yellow-500";
    const renderStatusBadge = (status) => {
      if (!status) return null;
      const statusColors = {
        RUNNING: {
          bg: "bg-green-100",
          text: "text-green-800",
          dot: "bg-green-500",
        },
        STOPPED: {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          dot: "bg-yellow-800",
        },
        FAILED: {
          bg: "bg-red-100",
          text: "text-red-800",
          dot: "bg-red-800",
        },
        PAUSED: {
          bg: "bg-blue-100",
          text: "text-blue-800",
          dot: "bg-blue-800",
        },
        CREATED: {
          bg: "bg-blue-100",
          text: "text-blue-800",
          dot: "bg-blue-800",
        },
      };

      const state = status?.toUpperCase() || "unknown";
      const statusStyle = statusColors[state] || statusColors["FAILED"];
      const isRunning = state === "RUNNING";
      return (
        <span
          className={`px-2 py-1 rounded-full text-sm font-medium flex items-center ${statusStyle.bg} ${statusStyle.text}`}
        >
          <span className="relative ml-1 flex h-2 w-2">
            {isRunning && (
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusStyle.dot} opacity-75`}
              ></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${statusStyle.dot}`}
            ></span>
          </span>
          <span className="ml-2 capitalize">{state}</span>
        </span>
      );
    };

    // Determine which action button to show based on current state
    const isPaused = connectorData.connector.state?.toUpperCase() === "PAUSED";
    const isRunning = connectorData.connector.state?.toUpperCase() === "RUNNING";

    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div
              className={`${type === "source"
                ? "bg-indigo-100 text-indigo-600"
                : "bg-purple-100 text-purple-600"
                } p-2 rounded-md mr-3`}
            >
              {type === "source" ? (
                <Database className="h-5 w-5" />
              ) : (
                <HardDrive className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {connectorData?.name}
                <span className="ml-2 text-sm font-normal text-gray-500 capitalize">
                  ({type} Connector)
                </span>
              </h3>
              <div className="flex items-center mt-1">
                {renderStatusBadge(connectorData.connector.state)}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleConnectorAction(isPaused || !isRunning ? "resume" : "pause")}
              className={`p-2 rounded-md text-sm flex items-center ${isRunning
                ? "bg-red-50 text-red-700 hover:bg-red-100"
                : "bg-green-50 text-green-700 hover:bg-green-100"
                }`}
            >
              {isRunning ? (
                <>
                  <Pause size={16} className="mr-1" /> Pause
                </>
              ) : (
                <>
                  <Play size={16} className="mr-1" /> Resume
                </>
              )}
            </button>
            <button
              onClick={() => handleConnectorAction("restart")}
              className="p-2 rounded-md text-sm flex items-center bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            >
              <RotateCw size={16} className="mr-1" /> Restart
            </button>
            <button
              onClick={() => onEditConfig(type)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center text-sm transition-colors"
            >
              <Edit3 className="h-4 w-4 mr-1.5" />
              Edit Config
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              {expanded ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="p-4">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-5">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                      <Settings className="w-4 h-4 mr-1.5 text-gray-500" />
                      Connector Details
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2 items-center">
                          <span className="text-gray-600 col-span-1">Worker:</span>
                          <span className="text-gray-800 font-medium col-span-2">
                            {connectorData.connector.worker_id}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-center">
                          <span className="text-gray-600 col-span-1">Type:</span>
                          <span className="text-gray-800 font-medium col-span-2 capitalize">
                            {connectorData.type}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-center">
                          <span className="text-gray-600 col-span-1">Tasks:</span>
                          <span className="text-gray-800 font-medium col-span-2">
                            {connectorData.tasks.length}
                          </span>
                        </div>
                      </div>

                      {/* Tasks section under Connector Details */}
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Tasks ({connectorData.tasks.length})</h5>
                        {connectorData.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="mb-2 rounded overflow-hidden"
                            onClick={() => task.state === "FAILED" && handleTaskClick(task)}
                          >
                            <div className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50">
                              <div className="flex items-center">
                                <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full mr-2 ${task.state === "RUNNING"
                                  ? "bg-green-100 text-green-600"
                                  : task.state === "FAILED"
                                    ? "bg-red-100 text-red-600"
                                    : "bg-yellow-100 text-yellow-600"
                                  }`}>
                                  {task.state === "RUNNING" && <CheckCircle className="w-3 h-3" />}
                                  {task.state === "FAILED" && <XCircle className="w-3 h-3" />}
                                  {task.state === "PAUSED" && <PauseCircle className="w-3 h-3" />}
                                </span>
                                <span className="text-sm text-gray-700">Task ID: {task.id}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-xs text-gray-500 mr-2">{task.worker_id}</span>
                                {task.state === "FAILED" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRestartTask(task.id);
                                    }}
                                    className="p-1 text-xs bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100"
                                  >
                                    <RotateCw className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-12 md:col-span-7">
                <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                  <Copy className="w-4 h-4 mr-1.5 text-gray-500" />
                  Configuration
                </h4>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200 h-full">
                  <div className="space-y-2">
                    {Object.entries(connectorData.config)
                      .slice(0, 4)
                      .map(([key, value]) => (
                        <div
                          key={key}
                          className="grid grid-cols-3 gap-2 items-center text-sm"
                        >
                          <span className="text-gray-600 truncate col-span-1">
                            {key}:
                          </span>
                          <span className="text-gray-800 font-medium truncate col-span-2">
                            {key.includes("password") ? "********" : value}
                          </span>
                        </div>
                      ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => setShowConfigModal(true)}
                      className="text-indigo-600 hover:text-indigo-800 text-xs flex items-center"
                    >
                      <Eye size={14} className="mr-1" />
                      View full configuration
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Configuration Modal */}
        {showConfigModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Copy className="w-5 h-5 mr-2 text-indigo-600" />
                  Full Configuration - {type.charAt(0).toUpperCase() + type.slice(1)} Connector
                </h3>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 p-6 overflow-auto">
                <div className="bg-gray-50 p-5 rounded-md border border-gray-200">
                  <div className="space-y-4">
                    {Object.entries(connectorData.config).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-12 gap-4 items-start">
                        <span className="col-span-4 text-sm font-medium text-gray-600 break-words">{key}:</span>
                        <span className="col-span-8 text-sm text-gray-800 break-all">
                          {key.includes("password") || key.includes("secret") ?
                            "********" :
                            (typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value))
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const TaskErrorModal = ({ isOpen, onClose, task }) => {
    if (!isOpen || !task) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <XCircle className="w-5 h-5 text-red-500 mr-2" />
              Task Error Details - Task ID: {task.id}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 p-4 overflow-auto">
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">Worker ID:</span>
                <span className="text-sm text-gray-900">{task.worker_id}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">State:</span>
                <span className="text-sm text-red-600 font-medium">{task.state}</span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-red-700 mb-2">Error Trace:</h4>
              <div className="whitespace-pre-wrap font-mono text-sm bg-red-50 text-red-800 p-3 rounded border border-red-200 max-h-96 overflow-auto">
                {task.trace || "No detailed error trace available"}
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modify the TaskActions component to open the error modal
  const TaskActions = ({ task, onRestart }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const { hostnameV2 } = useAuth();
    const { cdcId } = useParams();
    const { refetch } = useCDCConfigs(cdcId);

    const handleTaskAction = async (action) => {
      try {
        if (action === "restart") {
          onRestart(task.id);
        } else if (action === "viewError" && task.state === "FAILED") {
          setSelectedErrorTask(task);
          setIsErrorModalOpen(true);
        }
        setMenuOpen(false);
      } catch (error) {
        console.error(`Failed to ${action} task:`, error);
        toast.error(`Failed to ${action} task: ${error.message}`);
      }
    };

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="p-1 rounded-full hover:bg-gray-200"
        >
          <MoreVertical className="h-4 w-4 text-gray-600" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white z-10 border border-gray-200">
            <div className="py-1">
              {task.state === "FAILED" && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskAction("restart");
                    }}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <RotateCw className="h-4 w-4 mr-2 text-green-600" />
                    Restart Task
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskAction("viewError");
                    }}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                    View Error Details
                  </button>
                </>
              )}
              {task.state === "RUNNING" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTaskAction("pause");
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <PauseCircle className="h-4 w-4 mr-2 text-yellow-600" />
                  Pause Task
                </button>
              )}
              {task.state === "PAUSED" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTaskAction("resume");
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <Play className="h-4 w-4 mr-2 text-green-600" />
                  Resume Task
                </button>
              )}
              <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                <FileText className="h-4 w-4 mr-2 text-indigo-600" />
                View Logs
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const MetricsCharts = ({ jobData, timeRange }) => {
    const recordsData = [
      { time: "00:00", value: 120 },
      { time: "02:00", value: 240 },
      { time: "04:00", value: 180 },
      { time: "06:00", value: 350 },
      { time: "08:00", value: 410 },
      { time: "10:00", value: 520 },
      { time: "12:00", value: 480 },
      { time: "14:00", value: 650 },
      { time: "16:00", value: 700 },
      { time: "18:00", value: 550 },
      { time: "20:00", value: 400 },
      { time: "22:00", value: 320 },
    ];

    const lagData = [
      { time: "00:00", value: 1.2 },
      { time: "02:00", value: 1.5 },
      { time: "04:00", value: 2.1 },
      { time: "06:00", value: 3.4 },
      { time: "08:00", value: 5.2 },
      { time: "10:00", value: 4.8 },
      { time: "12:00", value: 3.9 },
      { time: "14:00", value: 3.2 },
      { time: "16:00", value: 2.8 },
      { time: "18:00", value: 4.1 },
      { time: "20:00", value: 5.5 },
      { time: "22:00", value: 4.2 },
    ];

    const renderChart = (data, color) => {
      const maxValue = Math.max(...data.map((item) => item.value));

      return (
        <div className="relative h-full">
          <div className="flex h-full items-end space-x-1">
            {data.map((item, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className={`w-full ${color} rounded-t`}
                  style={{ height: `${(item.value / maxValue) * 100}%` }}
                ></div>
                <div className="text-xs text-gray-500 mt-1 rotate-45 origin-top-left transform translate-x-4">
                  {item.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
            <BarChart2 className="w-4 h-4 mr-1.5 text-indigo-600" />
            Records Processed Over Time
          </h4>
          <div className="h-64 bg-white rounded-md">
            {renderChart(recordsData, "bg-indigo-500")}
          </div>
          <div className="mt-4 flex justify-between text-sm text-gray-500">
            <div>
              Total:{" "}
              <span className="font-medium text-gray-700">
                {jobData.metrics.recordsProcessed.toLocaleString()}
              </span>
            </div>
            <div>
              Avg/Hour: <span className="font-medium text-gray-700">650</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
            <Clock className="w-4 h-4 mr-1.5 text-yellow-600" />
            Replication Lag
          </h4>
          <div className="h-64 bg-white rounded-md">
            {renderChart(lagData, "bg-yellow-500")}
          </div>
          <div className="mt-4 flex justify-between text-sm text-gray-500">
            <div>
              Current:{" "}
              <span className="font-medium text-gray-700">
                {jobData.metrics.lagTime}
              </span>
            </div>
            <div>
              Average: <span className="font-medium text-gray-700">4.8s</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ConfigHistoryTable = ({
    configHistory,
    handleActivateConfig,
    type,
  }) => {
    return (
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Modified By
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sourceConfigs?.map((config) => (
                <tr
                  key={`${type}-${config.config_id}`}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    v{config.config_id}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {config.timestamp}
                  </td>
                  {/* <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{config.user}</td> */}
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {config.description}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {config.config_id === data?.source_connector?.config_id ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            await activateConfigAPI(config.config_id);
                          } catch (error) {
                            console.error("Failed to activate config:", error);
                          }
                        }}
                        className="group relative inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 overflow-hidden transition-all duration-300"
                      >
                        <span className="relative z-10">Inactive</span>
                        <span className="absolute inset-0 bg-green-100 text-green-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Active
                        </span>
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end space-x-2">
                      <button
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View Configuration"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!config.active && (
                        <button
                          onClick={() => handleActivateConfig(config.config_id)}
                          className="text-green-600 hover:text-green-900"
                          title="Set as Active"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        className="text-gray-600 hover:text-gray-900"
                        title="Clone Configuration"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };


  return (
    <div className="p-6">
      <main className="">
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center">
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${jobStatusColor} mr-2`}
                  ></span>
                  <h2 className="text-xl font-bold text-gray-800">
                    {jobData.jobId}
                  </h2>
                </div>
                <div className="text-gray-600 mt-1.5 flex items-center">
                  <Database className="h-4 w-4 mr-1 text-indigo-500" />
                  <span className="mr-2">
                    {jobData.source.config["database.hostname"]}
                  </span>
                  <ArrowRight className="h-4 w-4 mx-1 text-gray-400" />
                  <Database className="h-4 w-4 mr-1 text-purple-500" />
                  <span>
                    {jobData.target.config["database.hostname"] ||
                      extractHostnameFromJdbcUrl(jobData.target.config["connection.url"])}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={refreshData}
                  className="flex items-center px-2 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md transition-colors"
                >
                  <RefreshCw
                    className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </button>
                {/* <span className="text-sm text-gray-500">Last updated:</span>
                <span className="text-sm font-medium">
                  {jobData.metrics.lastSyncTime}
                </span> */}
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              <MetricsCard
                title="Total Records Processed"
                value={metrics.total_events_seen}
                icon={<Database className="h-5 w-5" />}
                color="indigo"
              />
              <MetricsCard
                title="Inserted Records"
                value={metrics.create_events_seen}
                icon={<Plus className="h-5 w-5" />}
                color="green"
              />
              <MetricsCard
                title="Deleted Records"
                value={metrics.delete_events_seen}
                icon={<Trash2 className="h-5 w-5" />}
                color="red"
              />
              <MetricsCard
                title="Updated Records"
                value={metrics.update_events_seen}
                icon={<Edit className="h-5 w-5" />}
                color="yellow"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-t-lg shadow-sm border border-gray-200 mb-5">
          <div className="px-2">
            <nav className="flex space-x-2 items-center justify-between">
              <div className="flex space-x-2">
                <button
                  className={`py-4 px-3 text-sm font-medium border-b-2 ${activeTab === "overview"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  onClick={() => setActiveTab("overview")}
                >
                  Overview
                </button>
                <button
                  className={`py-4 px-3 text-sm font-medium border-b-2 ${activeTab === "logs"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  onClick={() => setActiveTab("logs")}
                >
                  Logs
                </button>
                <button
                  className={`py-4 px-3 text-sm font-medium border-b-2 ${activeTab === "configurations"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  onClick={() => setActiveTab("configurations")}
                >
                  Configuration History
                </button>
              </div>

              <div>
                <button
                  className="py-2 px-4 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  onClick={handleAdhocSnapshot}
                  disabled={isAdhocLoading}
                >
                  {isAdhocLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Adhoc Snapshot"
                  )}
                </button>
              </div>
            </nav>
          </div>
        </div>


        {/* <div className="bg-white rounded-b-lg shadow-sm border-x border-b border-gray-200 mb-6 p-6">
          {activeTab === 'overview' && (
            <div className=" */}

        {activeTab === "logs" && <Logs data={data} />}

        {activeTab === "configurations" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <History className="w-5 h-5 mr-2 text-indigo-600" />
                Configuration Version History
              </h3>
              {/* <div className="flex space-x-2">
                <button className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-sm flex items-center">
                  <Plus className="w-4 h-4 mr-1.5" />
                  New Configuration
                </button>
              </div> */}
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                <Database className="w-4 h-4 mr-1.5 text-indigo-500" />
                Source Connector Configurations ({sourceConfigs.length})
              </h4>
              <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          VERSION
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Created At
                        </th>
                        {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Description</th> */}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        {/* <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Actions
                        </th> */}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sourceConfigs.map((config, idx) => (
                        <tr key={config.config_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{`V${idx + 1
                            }`}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {config.config_id}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {new Date().toLocaleString()}
                          </td>
                          {/* <td className="px-4 py-3 text-sm text-gray-900">{config.config?.name || '—'}</td> */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {config.config_id ===
                              data?.source_connector?.config_id ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : (
                              <span
                                // onClick={() =>
                                //   handleActivateConfig({
                                //     source_connector_id: config.config_id,
                                //   })
                                // }
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                              >
                                <span className="group-hover:opacity-0 transition-opacity duration-200">
                                  Inactive
                                </span>
                                {/* <span className="absolute left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  Activate?
                                </span> */}
                              </span>
                            )}
                          </td>

                          {/* <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                            <div className="flex justify-end space-x-2">
                              <button
                                className="text-gray-600 hover:text-gray-900"
                                title="Clone Configuration"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                className="text-gray-600 hover:text-indigo-900"
                                title="View Configuration"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                className="text-gray-600 hover:text-gray-900"
                                title="Clone Configuration"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                className="text-red-600 hover:text-gray-900"
                                title="Clone Configuration"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                <Database className="w-4 h-4 mr-1.5 text-purple-500" />
                Sink Connector Configurations ({targetConfigs.length})
              </h4>
              <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          VERSION
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Created At
                        </th>
                        {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Description</th> */}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        {/* <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Actions
                        </th> */}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {targetConfigs.map((config, idx) => (
                        <tr key={config.config_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{`V${idx + 1
                            }`}</td>

                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {config.config_id}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {new Date().toLocaleString()}
                          </td>
                          {/* <td className="px-4 py-3 text-sm text-gray-900">{config.config?.name || '—'}</td> */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {config.config_id ===
                              data?.target_connector?.config_id ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : (
                              <span
                                // onClick={() =>
                                //   handleActivateConfig({
                                //     target_connector_id: config.config_id,
                                //   })
                                // }
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"

                                // className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 cursor-pointer transition-all duration-300 hover:bg-green-50 hover:text-green-700 active:scale-95 active:ring-2 active:ring-green-300 relative group"

                              >
                                <span className="group-hover:opacity-0 transition-opacity duration-200">
                                  Inactive
                                </span>
                                {/* <span className="absolute left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  Activate?
                                </span> */}
                              </span>
                            )}
                          </td>
                          {/* <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                            <div className="flex justify-end space-x-2">
                              <button
                                className="text-gray-600 hover:text-gray-900"
                                title="Clone Configuration"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                className="text-gray-600 hover:text-indigo-900"
                                title="View Configuration"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                className="text-gray-600 hover:text-gray-900"
                                title="Clone Configuration"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                className="text-red-600 hover:text-gray-900"
                                title="Clone Configuration"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "metrics" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800 flex items-center">
                <BarChart2 className="w-5 h-5 mr-2 text-indigo-600" />
                Performance Metrics
              </h3>
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <label
                    htmlFor="metric-time-range"
                    className="text-sm text-gray-600 mr-2 flex items-center"
                  >
                    <Calendar className="w-4 h-4 mr-1" /> Time Range:
                  </label>
                  <select
                    id="metric-time-range"
                    className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    <option value="24h">Last 24 hours</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                <button className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-sm flex items-center">
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  Export Data
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">
                  Records Processed Over Time
                </h4>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-md border border-gray-200">
                  <div className="text-center text-gray-500">
                    <BarChart2 className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                    <p>Chart Visualization Here</p>
                    <p className="text-xs text-gray-400">
                      Records processed per hour
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex justify-between text-sm text-gray-500">
                  <div>
                    Total:{" "}
                    <span className="font-medium text-gray-700">
                      {jobData.metrics.recordsProcessed.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    Avg/Hour:{" "}
                    <span className="font-medium text-gray-700">650</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">
                  Replication Lag
                </h4>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-md border border-gray-200">
                  <div className="text-center text-gray-500">
                    <Clock className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                    <p>Chart Visualization Here</p>
                    <p className="text-xs text-gray-400">Lag time in seconds</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-between text-sm text-gray-500">
                  <div>
                    Current:{" "}
                    <span className="font-medium text-gray-700">
                      {jobData.metrics.lagTime}
                    </span>
                  </div>
                  <div>
                    Average:{" "}
                    <span className="font-medium text-gray-700">4.8s</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">
                  Throughput
                </h4>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-md border border-gray-200">
                  <div className="text-center text-gray-500">
                    <Zap className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                    <p>Chart Visualization Here</p>
                    <p className="text-xs text-gray-400">Records per minute</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-between text-sm text-gray-500">
                  <div>
                    Current:{" "}
                    <span className="font-medium text-gray-700">
                      {jobData.metrics.throughput}
                    </span>
                  </div>
                  <div>
                    Peak:{" "}
                    <span className="font-medium text-gray-700">
                      1.5k recs/min
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">
                  Error Rate
                </h4>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-md border border-gray-200">
                  <div className="text-center text-gray-500">
                    <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                    <p>Chart Visualization Here</p>
                    <p className="text-xs text-gray-400">Errors per hour</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-between text-sm text-gray-500">
                  <div>
                    Total Errors:{" "}
                    <span className="font-medium text-gray-700">
                      {jobData.metrics.errors}
                    </span>
                  </div>
                  <div>
                    Success Rate:{" "}
                    <span className="font-medium text-gray-700">
                      {jobData.metrics.syncSuccess}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">
                System Resource Utilization
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">CPU Usage</span>
                    <span className="text-sm font-medium text-gray-800">
                      24%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: "24%" }}
                    ></div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Memory Usage</span>
                    <span className="text-sm font-medium text-gray-800">
                      62%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full"
                      style={{ width: "62%" }}
                    ></div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Disk I/O</span>
                    <span className="text-sm font-medium text-gray-800">
                      35%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: "35%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* </div> */}
        {activeTab === "overview" && (
          <>
            {/* <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
        <Server className="w-5 h-5 mr-2 text-indigo-600" />
        Connectors
      </h3> */}

            <ConnectorPanel
              connectorData={jobData.source}
              type="source"
              onRestartTask={handleRestartTask}
              onEditConfig={handleEditConfig}
            />

            <ConnectorPanel
              connectorData={jobData.target}
              type="target"
              onRestartTask={handleRestartTask}
              onEditConfig={handleEditConfig}
            />
          </>
        )}
      </main>

      {/* Config Editor Modal */}
      <ConfigEditorModal
        isOpen={isModalOpen}
        onClose={closeModal}
        configType={activeConfigType}
        configData={
          activeConfigType === "source" ? jobData?.source : jobData?.target
        }
        statusData={
          activeConfigType === "source" ? "sourceStatus" : "targetStatus"
        }
        topicName={data?.topic}
      />

      {/* Add the Task Error Modal */}
      <TaskErrorModal
        isOpen={isErrorModalOpen}
        onClose={closeErrorModal}
        task={selectedErrorTask}
        onRestartTask={handleRestartTask}
      />
    </div>
  );
}
