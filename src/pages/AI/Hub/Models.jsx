import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCcw,
  ArrowUp,
  ArrowDown,
  Info,
  Sparkles,
  Search,
  Archive,
  Trash2,
  Rocket,
  Palette,
  BookOpen,
  Gauge,
  Loader2,
  Bell,
} from "lucide-react";
import { Icon } from "@iconify-icon/react";
import Breadcrumb from "../../../components/Breadcrumb";
import DataTable from "../../../components/DataTable";
import QuickPredictModal from "./Components/Models/QuickPredictModal";
import DeleteModal from "./Components/DeleteModal";
import { useAuth } from "../../../context/AuthContext";
import { useAIPlayground } from "../../../context/AIPlaygroundContext";
import ModelFlow from "./Components/Models/ModelFlow";
import toast from 'react-hot-toast';

function Models() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState("both");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);
  const [isQuickPredictOpen, setIsQuickPredictOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelsData, setModelsData] = useState([]);
  const [error, setError] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [deployTarget, setDeployTarget] = useState(null);
  const hostnameAI = window._env_?.VITE_AI_API;
  const { token, decodedToken } = useAuth();
  const [isCanvasLoading, setIsCanvasLoading] = useState(false);
  const { setWorkflowState, setDatasetState, setMode, setModelState, setProjectState, setSchedulerState } = useAIPlayground();
  const [dashboardLoading, setDashboardLoading] = useState(false);


  useEffect(() => {
    const fetchModels = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${hostnameAI}/canvas/model_list/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch models");
        }
        const data = await response.json();

        const mappedData = (Array.isArray(data) ? data : []).map((item, index) => ({
          _raw: item,
          id: item.id,
          sno: index + 1,
          run_name: item.run_name,
          description: item.target_variable || item.usecase || "",
          created_date: item.created_at
            ? new Date(item.created_at).toLocaleDateString("en-GB")
            : "",
          project_name:
            item.project_name ??
            item.project ??
            item.projectName ??
            item?.metadata?.project_name ??
            "",
          user_name:
            item.user_name ??
            item.owner ??
            item.created_by ??
            item.createdBy ??
            item?.metadata?.user_name ??
            "",
          type: item.modeling_type,
          status: item.status ?? "Unknown",
        }));


        setModelsData(mappedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, [hostnameAI, token, refreshTrigger]);

  useEffect(() => {
    const fetchDashboardSummary = async () => {
      setDashboardLoading(true);
      try {
        const response = await fetch(`${hostnameAI}/canvas/model_dashboard/summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch dashboard summary");
        const data = await response.json();
        setDashboardSummary(data);
      } catch (err) {
        setDashboardSummary(null);
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboardSummary();
  }, [hostnameAI, token, dashboardRefreshTrigger]);

  const formatPct = (n) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return "0%";
    const rounded =
      Math.abs(num) >= 10 ? Math.round(num) : Math.round(num * 10) / 10;
    return `${rounded}%`;
  };

  const formatLatency = (ms) => {
    const num = Number(ms);
    if (!Number.isFinite(num)) return "0 ms";
    if (num >= 1000) return `${Math.round((num / 1000) * 10) / 10}s`;
    return `${Math.round(num)}ms`;
  };

  const metricsData = useMemo(() => {
    if (dashboardLoading || !dashboardSummary) {
      return [
        { title: "Models", value: null, trend: "up", trendValue: "", icon: "material-symbols:check-circle-outline" },
        { title: "Deployed Models", value: null, trend: "up", trendValue: "", icon: "material-symbols:check-circle-outline" },
        { title: "Avg Accuracy", value: null, trend: "up", trendValue: "", icon: "material-symbols:check-circle-outline" },
        { title: "Avg Latency", value: null, trend: "up", trendValue: "", icon: "material-symbols:check-circle-outline" },
        { title: "Alert Count", value: null, trend: "up", trendValue: "", icon: "material-symbols:check-circle-outline" },
      ];
    }

    const models = dashboardSummary?.counts?.models;
    const deployed = dashboardSummary?.counts?.deployed_models;
    const acc = dashboardSummary?.metrics?.avg_model_accuracy;
    const lat = dashboardSummary?.metrics?.avg_model_latency;

    const toTrend = (t, pct) => {
      if (t === "increased") return "up";
      if (t === "decreased") return "down";
      const num = Number(pct);
      if (!Number.isFinite(num)) return "up";
      return num >= 0 ? "up" : "down";
    };

    return [
      {
        title: "Models",
        value: models?.current ?? 0,
        trend: toTrend(models?.trend, models?.percentage_change),
        trendValue: formatPct(models?.percentage_change),
        icon: "material-symbols:check-circle-outline",
      },
      {
        title: "Deployed Models",
        value: deployed?.current ?? 0,
        trend: toTrend(deployed?.trend, deployed?.percentage_change),
        trendValue: formatPct(deployed?.percentage_change),
        icon: "material-symbols:check-circle-outline",
      },
      {
        title: "Avg Accuracy",
        value:
          acc?.current == null
            ? "0%"
            : `${Math.round(Number(acc.current) * 1000) / 10}%`,
        trend: toTrend(acc?.trend, acc?.percentage_change),
        trendValue: formatPct(acc?.percentage_change),
        icon: "material-symbols:check-circle-outline",
      },
      {
        title: "Avg Latency",
        value: formatLatency(lat?.current),
        trend: toTrend(lat?.trend, lat?.percentage_change),
        trendValue: formatPct(lat?.percentage_change),
        icon: "material-symbols:check-circle-outline",
      },
      {
        title: "Alert Count",
        value: dashboardSummary?.alert_counts ?? 0,
        trend: null,
        trendValue: null,
        icon: "material-symbols:notifications-outline",
      },
    ];
  }, [dashboardSummary, dashboardLoading]);

  const alertsData = useMemo(() => {
    const rows = dashboardSummary?.recent_alerted_runs_per_schedule;
    if (!Array.isArray(rows)) return [];
    return rows.slice(0, 6).map((r) => ({
      name: r.model_run_name || r.schedule_name || "Run",
      issue: r.schedule_name ? `Schedule: ${r.schedule_name}` : "Alert",
      trend: "down",
      type: "drift",
    }));
  }, [dashboardSummary]);

  const modelFlowData = useMemo(() => {
    const count = dashboardSummary?.counts?.models?.current;
    return {
      aiModel: {
        id: "ai-model",
        label: String(count ?? 0),
        sublabel: "All Models",
        x: 30,
        y: 100,
      },
      classificationAgents: [
        { id: "class-1", label: "Classification\nAgent", x: 180, y: 60 },
        { id: "class-2", label: "Classification\nAgent", x: 180, y: 140 },
      ],
      middleAgents: [
        { id: "loan-agent", label: "Loan Agent", color: "#FB923C", x: 320, y: 20 },
        { id: "gst-agent", label: "GST Agent", color: "#FB923C", x: 320, y: 60 },
        { id: "loan-agent-1", label: "Loan Agent 1", color: "#FB923C", x: 320, y: 100 },
        { id: "multi-agent", label: "Multi Agent", color: "#FB923C", x: 320, y: 140 },
        { id: "gst-agent-1", label: "GST Agent 1", color: "#FB923C", x: 320, y: 180 },
      ],
      orchestrationLayer: {
        id: "orchestration",
        label: "Orchestration Agent",
        x: 500,
        y: 90,
      },
      output: { id: "output", label: "Output", x: 660, y: 100 },
    };
  }, [dashboardSummary]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
    setDashboardRefreshTrigger((prev) => prev + 1);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Deployed":
        return "bg-green-100 text-green-700";
      case "Archived":
        return "bg-gray-100 text-gray-600";
      case "In progress":
        return "bg-blue-100 text-blue-700";
      case "Inactive":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const columns = [
    { key: "sno", label: "Sno", sortable: true, width: "90px" },
    {
      key: "run_name",
      label: "Name",
      sortable: true,
      render: (row) => (
        <span
          className="text-purple-600 hover:underline cursor-pointer whitespace-normal break-words break-all"
          onClick={() => openModelLibrary(row)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && openModelLibrary(row)}
          title={row?.run_name ?? ""}
          style={{ overflowWrap: "anywhere" }}
        >
          {row.run_name}
        </span>
      ),
    }
    ,
    { key: "description", width: '250px', label: "Description", sortable: true },
    { key: "created_date", width: '150px', label: "Created Date", sortable: true },
    { key: 'project_name', width: '150px', label: 'Project', sortable: true },
    { key: 'user_name', width: '120px', label: 'Created By', sortable: true },
    { key: "type", width: '120px', label: "Type", sortable: true },
    {
      key: "status",
      label: "Status",
      width: '100px',
      sortable: true,
      render: (row) => (
        <span
          className={`px-3 py-1 rounded-md text-xs font-medium ${getStatusStyle(
            row.status
          )}`}
        >
          {row.status}
        </span>
      ),
    },
    { label: "Action", sortable: false },
  ];

  const handleDelete = (row) => {
    setDeleteTarget(row);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const id = deleteTarget.id || deleteTarget._raw?.id;
      const url = `${hostnameAI}/canvas/model/${id}/delete`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          accept: "application/json",
        },
      });
      if (!resp.ok) throw new Error("Failed to delete model");
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      alert(err.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeploy = (row) => {
    const raw = row?._raw ?? deployTarget;

    setSchedulerState({
      owner_id: '',
      project: raw.project_name || "",
      model: raw.run_name || "",
      model_id: raw.id || "",
      project_id: raw.project_id || "",
      flow_type: 'single_run',
      scheduler: {
        mode: 'auto',
        frequency: '',
        runningDays: [],
        endDateTime: '',
        intervalType: 'single_run',
        intervalValue: '',
        startDateTime: '',
      },
      source: {
        source_conn_type: '',
        source_schema: '',
        source_table: ''
      },
      target: {
        destination_conn_type: '',
        destination_schema: '',
        destination_table: ''
      },
      data_drift_threshold: {
        distribution_drift_threshold: 0,
        statistical_significance_level: 0,
        information_stability_threshold: 0,
        target_stability_threshold: 0
      },
      model_drift_threshold: {
        prediction_drift_threshold: 0,
        performance_drift_threshold: 0
      },
      data_drift_check: 0,
      model_drift_check: 0,
      recipients: [],
      created_by: '',
      workflow_name: ''
    });

    setDeployTarget(row);
    setDeployModalOpen(true);
  };

  const confirmDeploy = () => {
    if (!deployTarget) return;

    try {

      setMode('deploy')

      setDeployModalOpen(false);
      setDeployTarget(null);

      navigate("/ai/orchestration/new");
    } catch (err) {
      toast.error('Failed to navigate to deployment page', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  const openModelLibrary = useCallback(
    (row) => {
      const raw = row?._raw ?? row;
      navigate("/ai/hub/models/library", {
        state: { modelData: raw },
      });
    },
    [navigate]
  );


  const actions = [
    {
      label: "Library",
      icon: <BookOpen className="w-4 h-4" />,
      onClick: openModelLibrary,
      tooltip: "Library",
    },
    {
      label: "F1 Mode",
      icon: <Gauge className="w-4 h-4" />,
      onClick: (row) => console.log("F1 Mode:", row),
      tooltip: "F1 Mode",
    },
    {
      label: "AI Playground",
      icon: <Palette className="w-4 h-4" />,
      onClick: async (row) => {
        setIsCanvasLoading(true);

        try {
          const modelName = row?.run_name || row?._raw?.run_name;
          if (!modelName) {
            throw new Error("Model name not found");
          }

          const modelResponse = await fetch(`${hostnameAI}/canvas/model/${modelName}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              accept: "application/json",
            },
          });

          if (!modelResponse.ok) {
            toast.error('Failed to open AI Playground', {
              duration: 4000,
              position: 'top-right',
            });
            return;
          }

          const modelData = await modelResponse.json();

          const projectName = modelData.project_name;
          const username = decodedToken?.preferred_username || "admin";

          const ingestionParams = new URLSearchParams({
            domain: '',
            project_name: projectName,
            profiling_required: 'false',
            tag: '',
            source: '',
            sub_tag: '',
            table_name: modelData.dataset_name,
            category: '',
            user_name: username
          });

          const ingestionResponse = await fetch(
            `${hostnameAI}/data/ingestion`,
            {
              method: 'POST',
              headers: {
                'accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: ingestionParams.toString()
            }
          );

          if (!ingestionResponse.ok) {
            toast.error('Failed to open AI Playground', {
              duration: 4000,
              position: 'top-right',
            });
            return;
          }

          const ingestionData = await ingestionResponse.json();

          setModelState({ selectedModel: modelData.model_name });

          setProjectState(prev => ({ ...prev, selectedProject: modelData.project_name }));

          setDatasetState({
            tableName: modelData.dataset_name,
            sessionId: ingestionData.session_id || '',
            columnNames: ingestionData.column_names || [],
            profileReportHtml: ingestionData.profile_report_html || ''
          });

          if (modelData?.prefill) {
            const newWorkflowState = {
              modelGenesis: {
                config: modelData.prefill?.data_preprocessing?.request?.genesis || null,
                apiResponse: modelData.prefill?.data_preprocessing?.response?.genesis || null
              },
              dataPreprocessing: {
                step1: {
                  config: modelData.prefill?.data_preprocessing?.request?.initial_clean || null,
                  apiResponse: modelData.prefill?.data_preprocessing?.response?.initial_clean || null
                },
                step2: {
                  config: modelData.prefill?.data_preprocessing?.request?.feature_selection || null,
                  apiResponse: modelData.prefill?.data_preprocessing?.response?.feature_selection || null
                },
                step3: {
                  config: modelData.prefill?.data_preprocessing?.request?.feature_engineering || null,
                  apiResponse: modelData.prefill?.data_preprocessing?.response?.feature_engineering || null
                },
                step4: {
                  config: modelData.prefill?.data_preprocessing?.request?.advanced_transformation || null,
                  apiResponse: modelData.prefill?.data_preprocessing?.response?.advanced_transformation || null
                },
                step5: {
                  config: modelData.prefill?.data_preprocessing?.request?.statistical_analysis || null,
                  apiResponse: modelData.prefill?.data_preprocessing?.response?.statistical_analysis || null
                },
                step6: {
                  config: modelData.prefill?.data_preprocessing?.request?.feature_importance || null,
                  apiResponse: modelData.prefill?.data_preprocessing?.response?.feature_importance || null
                },
                step7: {
                  config: modelData.prefill?.data_preprocessing?.request?.imbalance_handling || null,
                  apiResponse: modelData.prefill?.data_preprocessing?.response?.imbalance_handling || null
                }
              },
              modelSelection: {
                config: modelData.prefill?.training?.request?.training_request || null,
                apiResponse: modelData.prefill?.training?.response || null
              },
              modelInferencing: {
                config: null,
                apiResponse: null
              },
              xai: {
                config: null,
                apiResponse: null
              },
              modelDeployment: {
                config: null,
                apiResponse: null
              }
            };

            setWorkflowState(newWorkflowState);
            setMode('view');
          }

          navigate("/ai/playground/model-genesis", {
            state: {
              mode: "view",
              model: row,
              modelDetails: modelData,
            },
          });

        } catch (error) {
          toast.error('Failed to open AI Playground', {
            duration: 4000,
            position: 'top-right',
          });
        } finally {
          setIsCanvasLoading(false);
        }
      },
      tooltip: "AI Playground",
      disabled: isCanvasLoading,
    },
    {
      label: "Deploy",
      icon: <Rocket className="w-4 h-4" />,
      onClick: handleDeploy,
      tooltip: "Deploy",
    },
    {
      label: "Archive",
      icon: <Archive className="w-4 h-4" />,
      onClick: (row) => console.log("Archive:", row),
      tooltip: "Archive",
    },
    {
      label: "Quick Predict",
      icon: <Sparkles className="w-4 h-4" />,
      onClick: (row) => {
        setSelectedModel(row);
        setIsQuickPredictOpen(true);
      },
      tooltip: "Quick Predict",
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDelete,
      tooltip: "Delete",
    },
  ];

  const filteredData = useMemo(() => {
    // ADD: status filter logic
    const base = modelsData.filter(row => String(row.status).toLowerCase() !== "deleted");
    let statusFiltered = base;
    if (statusFilter === "saved") {
      statusFiltered = base.filter(row => {
        const s = String(row.status ?? '').toLowerCase();
        return s === "saved";
      });
    } else if (statusFilter === "deployed") {
      statusFiltered = base.filter(row => {
        const s = String(row.status ?? '').toLowerCase();
        return s === "deployed";
      });
    } else if (statusFilter === "archived") {
      statusFiltered = base.filter(row => {
        const s = String(row.status ?? '').toLowerCase();
        return s === "archived";
      });
    } else if (statusFilter === "completed") {
      statusFiltered = base.filter(row => {
        const s = String(row.status ?? '').toLowerCase();
        return s === "completed";
      });
    }
    if (!searchTerm.trim()) {
      return statusFiltered;
    }
    const q = searchTerm.toLowerCase();
    return statusFiltered.filter((row) =>
      Object.values(row || {}).some((val) =>
        String(val ?? "")
          .toLowerCase()
          .includes(q)
      )
    );
  }, [searchTerm, modelsData, statusFilter]);

  const AlertsPanel = () => {
    const [showInfo, setShowInfo] = useState(false);

    return (
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-[350px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon
              icon="material-symbols:notifications-outline"
              className="w-5 h-5 text-purple-600"
            />
            <h3 className="text-sm font-semibold text-gray-800">Alerts</h3>
          </div>
          <div className="relative">
            <Info
              className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600"
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
            />
            {showInfo && (
              <div className="absolute right-0 top-6 z-10 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg">
                Model alerts for drift and latency issues.
              </div>
            )}
          </div>
        </div>
        <div className="space-y-3">
          {alertsData.map((alert, index) => (
            <div key={index} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${alert.type === "drift" ? "bg-orange-400" : "bg-blue-400"
                    }`}
                />
                <span className="text-sm text-gray-700">{alert.name}</span>
              </div>
              <span
                className={`text-xs flex items-center gap-1 ${alert.trend === "up" ? "text-green-500" : "text-orange-500"
                  }`}
              >
                {alert.issue}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const DeployModal = () => {
    if (!deployModalOpen) return null;

    const modelName = deployTarget?.run_name || deployTarget?._raw?.run_name || "this model";
    const projectName = deployTarget?.project_name || deployTarget?._raw?.project_name || "Unknown Project";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Rocket className="w-6 h-6 text-[#8e78b7]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Deploy Model</h3>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Project:</span>
                <span className="text-sm font-medium text-gray-900" title={projectName}>
                  {projectName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Model:</span>
                <span className="text-sm font-medium text-gray-900" title={modelName}>
                  {modelName}
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to deploy this model? You will be redirected to the orchestration page to configure the deployment.
          </p>

          <div className="flex gap-3 justify-end">
            <button
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
              onClick={() => {
                setDeployModalOpen(false);
                setDeployTarget(null);
              }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-[#8e78b7] text-white font-medium flex items-center gap-2"
              onClick={confirmDeploy}
            >
              <Rocket className="w-4 h-4" />
              Deploy
            </button>
          </div>
        </div>
      </div>
    );
  };

  const StatsCardWithTrend = ({ label, value, icon: IconCmp, trend, trendValue }) => {
    const isUp = trend === "up";
    const TrendIcon = isUp ? ArrowUp : ArrowDown;
    const trendColor = isUp ? "text-emerald-500" : "text-red-500";

    return (
      <div className="bg-white rounded-xl px-6 py-5 border border-purple-200 flex flex-col justify-between min-h-[120px]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <IconCmp className="w-5 h-5 text-[#8e78b7] shrink-0" />
            <span className="text-gray-900 text-xl font-medium truncate">{label}</span>
          </div>
        </div>

        <div className="flex items-end justify-between mt-6">
          <div className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
            {value == null ? <div className="h-10 w-16 bg-gray-200 rounded animate-pulse" /> : value}
          </div>

          {(trend && trendValue && value != null) ? (
            <div className={`flex items-center gap-2 ${trendColor} text-xl font-semibold leading-none`}>
              <TrendIcon className="w-7 h-7" />
              <span className="tabular-nums">{trendValue}</span>
            </div>
          ) : (
            <div className="h-7 w-14" />
          )}
        </div>
      </div>
    );
  };

  const metricIcon = (key) => {
    switch (key) {
      case "models":
        return BookOpen;
      case "deployed":
        return Rocket;
      case "accuracy":
        return Gauge;
      case "latency":
        return Gauge;
      case "alerts":
        return Bell;
      default:
        return BookOpen;
    }
  };

  const CheckCircleFallback = (props) => <Info {...props} />;

  const statsCards = useMemo(() => {
    const [m1, m2, m3, m4, m5] = metricsData || [];
    return [
      { key: "models", label: "Models", value: m1?.value ?? null, trend: m1?.trend ?? null, trendValue: m1?.trendValue ?? null, icon: metricIcon("models") },
      { key: "deployed", label: "Deployed Models", value: m2?.value ?? null, trend: m2?.trend ?? null, trendValue: m2?.trendValue ?? null, icon: metricIcon("deployed") },
      { key: "accuracy", label: "Accuracy", value: m3?.value ?? null, trend: m3?.trend ?? null, trendValue: m3?.trendValue ?? null, icon: metricIcon("accuracy") },
      { key: "alerts", label: "Alert Count", value: m5?.value ?? null, trend: m5?.trend ?? null, trendValue: m5?.trendValue ?? null, icon: metricIcon("alerts") },

      { key: "latency", label: "Latency", value: m4?.value ?? null, trend: m4?.trend ?? null, trendValue: m4?.trendValue ?? null, icon: metricIcon("latency") },
    ];
  }, [metricsData]);

  return (
    <div className="p-6 space-y-4">
      <Breadcrumb link="/" />

      <div className="flex gap-4 items-center justify-between">
        <h1 className="text-2xl font-semibold">Models</h1>

        <div className="flex items-center gap-2">
          {/* ADD: Status filter dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-10 border border-gray-300 rounded-lg text-sm px-3 bg-white"
              title="Filter by Status"
            >
              <option value="all">All Status</option>
              <option value="saved">Saved</option>
              <option value="deployed">Deployed</option>
              <option value="archived">Archived</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="pl-10 pr-4 py-2 w-[250px] border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          <button
            className={`p-1.5 rounded-lg border ${viewMode === "list"
              ? "bg-gray-100 border-gray-500"
              : "border-gray-300"
              } hover:bg-gray-50`}
            onClick={() => setViewMode(viewMode === "list" ? "both" : "list")}
            title={viewMode === "list" ? "Show All Views" : "Show List Only"}
          >
            <Icon
              icon="material-symbols-light:format-list-bulleted"
              width="25"
              height="22"
              className="text-purple-600"
            />
          </button>

          <button
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            onClick={handleRefresh}
            title="Refresh data"
            disabled={isLoading}
          >
            <RefreshCcw
              className={`h-5 w-5 text-gray-600 ${isLoading ? "animate-spin" : ""
                }`}
            />
          </button>
        </div>
      </div>

      {viewMode !== "list" && (
        <>
          <div className="bg-gradient-to-r from-[#8e78b7] via-purple-300 to-purple-100 rounded-xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {statsCards.map((stat) => (
                <StatsCardWithTrend
                  key={stat.key}
                  label={stat.label}
                  value={stat.value}
                  icon={stat.icon}
                  trend={stat.trend}
                  trendValue={stat.trendValue}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <ModelFlow />
            </div>
            <div>
              <AlertsPanel />
            </div>
          </div>
        </>
      )}

      <DataTable
        columns={columns}
        data={filteredData}
        actions={actions}
        isLoading={isLoading}
        isError={!!error}
        refetch={handleRefresh}
        resetSortTrigger={refreshTrigger}
      />
      <QuickPredictModal
        isOpen={isQuickPredictOpen}
        onClose={() => setIsQuickPredictOpen(false)}
        modelData={selectedModel}
      />
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Model"
        description={`Are you sure you want to delete "${deleteTarget?.run_name || deleteTarget?.id || ''}"? This action cannot be undone.`}
        loading={deleteLoading}
        confirmText="Delete"
      />
      <DeployModal />
      {isCanvasLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center">
              <Loader2 className="w-16 h-16 text-[#8e78b7] animate-spin mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading AI Playground</h3>
              <p className="text-gray-600 text-center">Please wait while we prepare your workspace</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Models;