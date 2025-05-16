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

const ConnectorPanel = ({
  connectorData,
  type,
  onRestartTask,
  onEditConfig,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [showError, setShowError] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const typeColor = type === "source" ? "indigo" : "purple";
  const iconColor = `text-${typeColor}-600`;
  const bgColor = `bg-${typeColor}-50`;
  const borderColor = `border-${typeColor}-200`;

  const failedTask = connectorData.tasks.find(
    (task) => task.state === "FAILED"
  );

  const handleTaskClick = (task) => {
    if (task.state === "FAILED") {
      setSelectedTask(selectedTask?.id === task.id ? null : task);
    }
  };

  return (
    <div
      className={`mb-4 border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white`}
    >
      <div
        className={`p-3 flex items-center justify-between cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
        style={{ background: type === "source" ? "#EEF2FF" : "#F5F3FF" }}
      >
        <div className="flex items-center">
          {expanded ? (
            <ChevronDown className="w-5 h-5 mr-2 text-gray-500" />
          ) : (
            <ChevronRight className="w-5 h-5 mr-2 text-gray-500" />
          )}
          <Database
            className={`w-5 h-5 mr-2 ${
              type === "source" ? "text-indigo-600" : "text-purple-600"
            }`}
          />
          <h3 className="font-medium text-gray-800">
            {type === "source" ? "Source Connector" : "Sink Connector"}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({connectorData.name})
            </span>
          </h3>
          {failedTask && (
            <div className="ml-3 flex items-center">
              <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-xs text-red-600 font-medium">
                Task failure detected
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditConfig(type);
            }}
            className="text-gray-500 hover:text-indigo-600 p-1"
            title="Edit Configuration"
          >
            <Edit size={18} />
          </button>
          <div className="flex items-center">
            {/* <StatusBadge state={connectorData.connector.state} /> */}
          </div>
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
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Worker:</span>
                      <span className="text-gray-800 font-medium">
                        {connectorData.connector.worker_id}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Type:</span>
                      <span className="text-gray-800 font-medium capitalize">
                        {connectorData.type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tasks:</span>
                      <span className="text-gray-800 font-medium">
                        {connectorData.tasks.length}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                    <Copy className="w-4 h-4 mr-1.5 text-gray-500" />
                    Configuration
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
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
                      <button className="text-indigo-600 hover:text-indigo-800 text-xs flex items-center">
                        <Eye size={14} className="mr-1" />
                        View full configuration
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-12 md:col-span-7">
              <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                <Layers className="w-4 h-4 mr-1.5 text-gray-500" />
                Tasks ({connectorData.tasks.length})
              </h4>
              <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {connectorData.tasks.map((task) => (
                    <div key={task.id} className="">
                      <div
                        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 ${
                          task.state === "FAILED"
                            ? "cursor-pointer"
                            : "cursor-default"
                        }`}
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className="flex items-center">
                          {task.state === "RUNNING" && (
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          )}
                          {task.state === "FAILED" && (
                            <XCircle className="w-4 h-4 text-red-500 mr-2" />
                          )}
                          {task.state === "PAUSED" && (
                            <PauseCircle className="w-4 h-4 text-yellow-500 mr-2" />
                          )}
                          <span className="text-gray-800">
                            Task ID: {task.id}
                          </span>
                          {task.state === "FAILED" && (
                            <span className="ml-2 text-xs text-red-600 flex items-center">
                              <AlertCircle size={12} className="mr-1" />
                              Failed
                              <ChevronDown size={14} className="ml-1" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 mr-2">
                            {task.worker_id}
                          </span>
                          <TaskActions task={task} onRestart={onRestartTask} />
                        </div>
                      </div>

                      {selectedTask?.id === task.id && task.trace && (
                        <div className="p-3 bg-red-50 border-t border-red-200 text-sm">
                          <div className="font-medium text-red-800 mb-1">
                            Error Details:
                          </div>
                          <div className="whitespace-pre-wrap text-red-700 bg-white p-2 rounded border border-red-200 font-mono text-xs">
                            {task.trace}
                          </div>
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={() => onRestartTask(task.id)}
                              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-xs flex items-center"
                            >
                              <RotateCw size={14} className="mr-1" />
                              Restart Task
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
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
      <div className="flex items-center justify-between mb-2">
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
      </div>
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

  const openModal = (configType) => {
    setActiveConfigType(configType);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveConfigType(null);
  };

  useEffect(() => {
    if (!cdcId) return;

    const fetchData = async () => {
      try {
        const configsResponse = await axios.get(
          `${hostnameV2}/cdc/${cdcId}/connector-configs`
        );
        const { source: sourceConfigs, target: targetConfigs } =
          configsResponse.data;
        setSourceConfigs(sourceConfigs || []);
        setTargetConfigs(targetConfigs || []);
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
          // metrics: targetStatus?.metrics || {
          //   recordsProcessed: 0,
          //   bytesProcessed: "0 KB",
          //   lagTime: "0s",
          //   lastSyncTime: "",
          //   errors: 0,
          //   throughput: "0 recs/min",
          //   syncSuccess: 0
          // }
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
          console.log("No logs found for connector:", connectorName);
          setLogs([]);
        }
      } catch (error) {
        console.error("Error fetching logs:", error);
        setLogs([]);
      }
    };

    fetchData();

    const intervalId = setInterval(() => {
      fetchData();
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [cdcId, data]);

  useEffect(() => {
    if (data) {
      try {
        console.log("CDC config data:", data);
      } catch (error) {
        console.error("Error fetching job data:", error);
      }
    }
  }, [data]);

  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const handleRestartTask = (taskId) => {
    console.log(`Restarting task ${taskId}`);

    if (jobData) {
      const updatedJobData = { ...jobData };

      const sourceTaskIndex = updatedJobData.source.tasks.findIndex(
        (t) => t.id === taskId
      );
      if (sourceTaskIndex >= 0) {
        updatedJobData.source.tasks[sourceTaskIndex].state = "RUNNING";
        delete updatedJobData.source.tasks[sourceTaskIndex].trace;
      }

      const targetTaskIndex = updatedJobData.target.tasks.findIndex(
        (t) => t.id === taskId
      );
      if (targetTaskIndex >= 0) {
        updatedJobData.target.tasks[targetTaskIndex].state = "RUNNING";
        delete updatedJobData.target.tasks[targetTaskIndex].trace;
      }

      setJobData(updatedJobData);
    }
  };

  const handleEditConfig = (type) => {
    setActiveConfigType(type);
    setIsModalOpen(true);
  };

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
    const [selectedTask, setSelectedTask] = useState(null);
    const handleTaskClick = (task) => {
      if (task.state === "FAILED") {
        setSelectedTask(selectedTask?.id === task.id ? null : task);
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
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div
              className={`${
                type === "source"
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
              // onClick={() => toggleConnectorStatus(sourceConfig?.name, true)}
              className={`p-2 rounded-md text-sm flex items-center ${
                connectorData.connector.state?.toUpperCase() === "RUNNING"
                  ? "bg-red-50 text-red-700 hover:bg-red-100"
                  : "bg-green-50 text-green-700 hover:bg-green-100"
              }`}
            >
              {connectorData.connector.state?.toUpperCase() === "RUNNING" ? (
                <>
                  <Pause size={16} className="mr-1" /> Stop
                </>
              ) : (
                <>
                  <Play size={16} className="mr-1" /> Start
                </>
              )}
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
              <div className="col-span-12 md:col-span-12 flex flex-col md:flex-row gap-6">
                <div className="md:w-5/12 flex flex-col gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                      <Settings className="w-4 h-4 mr-1.5 text-gray-500" />
                      Connector Details
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Worker:</span>
                        <span className="text-gray-800 font-medium">
                          {connectorData.connector.worker_id}
                        </span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Type:</span>
                        <span className="text-gray-800 font-medium capitalize">
                          {type}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tasks:</span>
                        <span className="text-gray-800 font-medium">
                          {connectorData.tasks.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                      <Layers className="w-4 h-4 mr-1.5 text-gray-500" />
                      Tasks ({connectorData.tasks.length})
                    </h4>
                    <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden flex-1">
                      <div className="divide-y divide-gray-200">
                        {connectorData.tasks.map((task) => (
                          <div key={task.id}>
                            <div
                              className={`flex items-center justify-between p-3 hover:bg-gray-100 ${
                                task.state === "FAILED"
                                  ? "cursor-pointer"
                                  : "cursor-default"
                              }`}
                              onClick={() => handleTaskClick(task)}
                            >
                              <div className="flex items-center">
                                {task.state === "RUNNING" && (
                                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                )}
                                {task.state === "FAILED" && (
                                  <XCircle className="w-4 h-4 text-red-500 mr-2" />
                                )}
                                {task.state === "PAUSED" && (
                                  <PauseCircle className="w-4 h-4 text-yellow-500 mr-2" />
                                )}
                                <span className="text-gray-800">
                                  Task ID: {task.id}
                                </span>
                                {task.state === "FAILED" && (
                                  <span className="ml-2 text-xs text-red-600 flex items-center">
                                    <AlertCircle size={12} className="mr-1" />
                                    Failed
                                    <ChevronDown size={14} className="ml-1" />
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center">
                                <span className="text-xs text-gray-500 mr-2">
                                  {task.worker_id}
                                </span>
                                <TaskActions
                                  task={task}
                                  onRestart={onRestartTask}
                                />
                              </div>
                            </div>

                            {selectedTask?.id === task.id && task.trace && (
                              <div className="p-3 bg-red-50 border-t border-red-200 text-sm">
                                <div className="font-medium text-red-800 mb-1">
                                  Error Details:
                                </div>
                                <div className="whitespace-pre-wrap text-red-700 bg-white p-2 rounded border border-red-200 font-mono text-xs">
                                  {task.trace}
                                </div>
                                <div className="mt-2 flex justify-end">
                                  <button
                                    onClick={() => onRestartTask(task.id)}
                                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-xs flex items-center"
                                  >
                                    <RotateCw size={14} className="mr-1" />
                                    Restart Task
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:w-7/12 flex flex-col">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                    <Copy className="w-4 h-4 mr-1.5 text-gray-500" />
                    Configuration
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-200 h-full flex-1">
                    <div className="space-y-2">
                      {Object.entries(connectorData.config).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="grid grid-cols-3 gap-2 items-center text-sm"
                          >
                            <span className="text-gray-600 truncate col-span-1">
                              {key}:
                            </span>
                            <span className="text-gray-800 font-medium truncate col-span-2">
                              {key.includes("database.password") ||
                              key.includes("connection.password")
                                ? "********"
                                : value}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                    {/* <div className="mt-2 pt-2 border-t border-gray-200">
              <button className="text-indigo-600 hover:text-indigo-800 text-xs flex items-center">
                <Eye size={14} className="mr-1" />
                View full configuration
              </button>
            </div> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const TaskActions = ({ task, onRestart }) => {
    const [menuOpen, setMenuOpen] = useState(false);

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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestart(task.id);
                    setMenuOpen(false);
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <RotateCw className="h-4 w-4 mr-2 text-green-600" />
                  Restart Task
                </button>
              )}
              {task.state === "RUNNING" && (
                <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                  <PauseCircle className="h-4 w-4 mr-2 text-yellow-600" />
                  Pause Task
                </button>
              )}
              {task.state === "PAUSED" && (
                <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
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
                  <span>{jobData.target.config["database.hostname"]}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={refreshData}
                  className="flex items-center px-2 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md transition-colors"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-1.5 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-500">Last updated:</span>
                <span className="text-sm font-medium">
                  {jobData.metrics.lastSyncTime}
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <MetricsCard
                title="Records Processed"
                value={jobData.metrics.recordsProcessed.toLocaleString()}
                icon={<Layers className="h-5 w-5 text-indigo-600" />}
                trend={true}
                change={2.3}
              />

              <MetricsCard
                title="Data Volume"
                value={jobData.metrics.bytesProcessed}
                icon={<Database className="h-5 w-5 text-purple-600" />}
                color="purple"
                trend={true}
                change={1.8}
              />

              <MetricsCard
                title="Replication Lag"
                value={jobData.metrics.lagTime}
                icon={<Clock className="h-5 w-5 text-yellow-600" />}
                color="yellow"
                trend={true}
                change={-0.5}
              />

              <MetricsCard
                title="Errors"
                value={jobData.metrics.errors}
                icon={<AlertCircle className="h-5 w-5 text-red-600" />}
                color="red"
                trend={false}
              />

              <MetricsCard
                title="Throughput"
                value={jobData.metrics.throughput}
                icon={<BarChart2 className="h-5 w-5 text-green-600" />}
                color="green"
                trend={true}
                change={1.5}
              />

              <MetricsCard
                title="Sync Success"
                value={`${jobData.metrics.syncSuccess}%`}
                icon={<CheckCircle className="h-5 w-5 text-blue-600" />}
                color="blue"
                trend={true}
                change={0.2}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-t-lg shadow-sm border border-gray-200 mb-5">
          <div className="px-2">
            <nav className="flex space-x-2">
              <button
                className={`py-4 px-3 text-sm font-medium border-b-2 ${
                  activeTab === "overview"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("overview")}
              >
                Overview
              </button>
              <button
                className={`py-4 px-3 text-sm font-medium border-b-2 ${
                  activeTab === "logs"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("logs")}
              >
                Logs
              </button>

              {/* <button
                className={`py-4 px-3 text-sm font-medium border-b-2 ${activeTab === 'metrics' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('metrics')}
              >
                Performance Metrics
              </button> */}
              <button
                className={`py-4 px-3 text-sm font-medium border-b-2 ${
                  activeTab === "configurations"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("configurations")}
              >
                Configuration History
              </button>
              {/* <button
                className={`py-4 px-3 text-sm font-medium border-b-2 ${activeTab === 'Connectors' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('Connectors')}
              >
Connectors              </button> */}
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
              <h3 className="text-lg font-medium text-gray-800 flex items-center">
                <History className="w-5 h-5 mr-2 text-indigo-600" />
                Configuration Version History
              </h3>
              <div className="flex space-x-2">
                <button className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-sm flex items-center">
                  <Plus className="w-4 h-4 mr-1.5" />
                  New Configuration
                </button>
              </div>
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
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sourceConfigs.map((config, idx) => (
                        <tr key={config.config_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{`V${
                            idx + 1
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
                                onClick={() =>
                                  handleActivateConfig({
                                    source_connector_id: config.config_id,
                                  })
                                }
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 cursor-pointer transition-all duration-300 hover:bg-green-50 hover:text-green-700 active:scale-95 active:ring-2 active:ring-green-300 relative group"
                              >
                                <span className="group-hover:opacity-0 transition-opacity duration-200">
                                  Inactive
                                </span>
                                <span className="absolute left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  Activate?
                                </span>
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
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
                          </td>
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
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {targetConfigs.map((config, idx) => (
                        <tr key={config.config_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{`V${
                            idx + 1
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
                                onClick={() =>
                                  handleActivateConfig({
                                    target_connector_id: config.config_id,
                                  })
                                }
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 cursor-pointer transition-all duration-300 hover:bg-green-50 hover:text-green-700 active:scale-95 active:ring-2 active:ring-green-300 relative group"
                              >
                                <span className="group-hover:opacity-0 transition-opacity duration-200">
                                  Inactive
                                </span>
                                <span className="absolute left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  Activate?
                                </span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
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
                          </td>
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
        // onSave={saveChanges}
        // onToggleStatus={toggleConnectorStatus}
      />
    </div>
  );
}
