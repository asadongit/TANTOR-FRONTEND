import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCcw,
  ArrowUp,
  ArrowDown,
  Info,
  Sparkles,
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
import ArchiveModal from "./Components/ArchieveModal";
import UnarchiveModal from "./Components/UnarchieveModal";
import { useAuth } from "../../../context/AuthContext";
import { useAIPlayground } from "../../../context/AIPlaygroundContext";
import ModelFlow from "./Components/Models/ModelFlow";
import StatusFilterDropdown from "./Components/StateSelector";
import { unarchiveEntity } from "./Components/Hooks";
import { updateRecentAccess } from './Components/Hooks';
import toast from 'react-hot-toast';
import { aithemestyle } from "../../../components/themeContext";
import Modelicon from "../../../assets/ai/models.svg"
import Latencyicon from "../../../assets/ai/latency.svg"
import Deployedicon from "../../../assets/ai/deployed.svg"
import Alerticon from "../../../assets/ai/alerts.svg"
import Accuracyicon from "../../../assets/ai/accuracy.svg"
import searchicon from '../../../assets/ai/search.svg';
import notifications_active from '../../../assets/ai/notifications_active.svg';
import bookmark_add from '../../../assets/ai/bookmark_add.svg';

const rotateAnimation = `
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(-360deg); }
  }
  .icon-rotate {
    animation: rotate 1s linear infinite;
  }
`;

function Models() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(['saved', 'deployed']);
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
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [unarchiveModalOpen, setUnarchiveModalOpen] = useState(false);
  const [unarchiveTarget, setUnarchiveTarget] = useState(null);
  const [unarchiveLoading, setUnarchiveLoading] = useState(false);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [deployTarget, setDeployTarget] = useState(null);
  const hostnameAI = window._env_?.VITE_AI_API;
  const { token, decodedToken } = useAuth();
  const [isCanvasLoading, setIsCanvasLoading] = useState(false);
  const {
    setDatasetState,
    setMode,
    setModelState,
    setProjectState,
    setSchedulerState,
    setIsAIPlaygroundActive,
    setWorkflowsState,
    setActiveWorkflowId,
    createWorkflow,
    updateWorkflowStage,
    updatePreprocessingStep,
  } = useAIPlayground();
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [recentAccessed, setRecentAccessed] = useState([]);
  const [recentAccessedLoading, setRecentAccessedLoading] = useState(false);
  const [recentAccessedError, setRecentAccessedError] = useState(null);


  useEffect(() => {
    const fetchModels = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${hostnameAI}/canvas/model_list`, {
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
          description: item.description || "",
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

  useEffect(() => {
    if (!hostnameAI || !token || !decodedToken?.sub) return;

    const fetchRecentAccessed = async () => {
      setRecentAccessedLoading(true);
      try {
        const resp = await fetch(
          `${hostnameAI}/canvas/entity/recent_access/list?user_id=${decodedToken.sub}&entity_type=model&limit=5`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (resp.ok) {
          const data = await resp.json();
          setRecentAccessed(Array.isArray(data?.recent_entities) ? data.recent_entities : Array.isArray(data) ? data : []);
        } else {
          setRecentAccessedError('Failed to fetch recent accessed');
        }
      } catch (error) {
        setRecentAccessedError(error.message);
      } finally {
        setRecentAccessedLoading(false);
      }
    };

    fetchRecentAccessed();
  }, [hostnameAI, token, decodedToken?.sub, dashboardRefreshTrigger]);

  const formatPct = (n) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return "0%";
    return `${num.toFixed(2)}%`;
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

  const truncate = (str, max = 20) =>
    str.length > max ? `${str.slice(0, max)}…` : str;

  const alertsData = useMemo(() => {
    const rows = dashboardSummary?.recent_alerted_runs_per_schedule;
    if (!Array.isArray(rows)) return [];

    return rows.slice(0, 6).map((r) => {
      const rawName = r.model_run_name || r.schedule_name || "Run";

      return {
        name: truncate(rawName, 40),
        issue: r.schedule_name ? `Schedule: ${r.schedule_name}` : "Alert",
        trend: "down",
        type: "drift",
      };
    });
  }, [dashboardSummary]);


  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
    setDashboardRefreshTrigger((prev) => prev + 1);
    setSearchTerm('');
    toast.success('Refresh successfully');
  };

  const handleLastAccessedClick = async (item) => {
    try {
      const modelResponse = await fetch(`${hostnameAI}/canvas/model/${item.name}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          accept: "application/json",
        },
      });

      if (!modelResponse.ok) {
        toast.error('Failed to load model details', {
          duration: 4000,
          position: 'top-right',
        });
        return;
      }

      const modelData = await modelResponse.json();

      navigate(`/ai/hub/models/library/${encodeURIComponent(String(item.id))}`, {
        state: { modelData },
      });
    } catch (error) {
      toast.error('Failed to open model', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  const getStatusStyle = (status) => {
    const normalized = String(status || '').toLowerCase();
    switch (normalized) {
      case "deployed":
        return "";
      case "archived":
        return "";
      case "saved":
        return "";
      case "in progress":
        return "bg-blue-100 text-blue-700";
      case "inactive":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusStyle_Inline = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === "deployed") {
      return { background: "#FFC93F40", color: "#E08E40" };
    } else if (normalized === "archived") {
      return { background: "#D9D9D980", color: "#666666" };
    } else if (normalized === "saved") {
      return { background: "#2AC79240", color: "#15803d" };
    }
    return {};
  };

  const columns = [
    { key: "sno", label: "Sno", sortable: true, width: "50px" },
    {
      key: "run_name",
      label: "Name",
      sortable: true,
      width: '250px',
      render: (row) => (
          <span
            className="hover:underline cursor-pointer whitespace-normal break-words break-all"
            onClick={() => openModelLibrary(row)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && openModelLibrary(row)}
            title={row?.run_name ?? ""}
            style={{ overflowWrap: "anywhere", color: aithemestyle.iconColor }}
          >
            {row.run_name}
          </span>
      ),
    }
    ,
    { key: "description", width: '150px', label: "Description", sortable: false },
    { key: "created_date", width: '150px', label: "Created Date", sortable: true },
    { key: 'project_name', width: '150px', label: 'Project', sortable: true },
    { key: 'user_name', width: '120px', label: 'Created By', sortable: true },
    { key: "type", width: '120px', label: "Type", sortable: true },
    {
      key: "status",
      label: "Status",
      width: '100px',
      sortable: true,
      render: (row) => {
        const inlineStyle = getStatusStyle_Inline(row.status);
        const baseClass = "inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium";
        const fallbackClass = getStatusStyle(row.status);
        return (
          <span
            className={inlineStyle ? baseClass : `${baseClass} ${fallbackClass}`}
            style={inlineStyle}
          >
            {row.status}
          </span>
        );
      },
    },
    { label: "Action", sortable: false },
  ];

  const handleDelete = (row) => {
    setDeleteTarget(row);
    setDeleteModalOpen(true);
  };

  const handleArchive = (row) => {
    setArchiveTarget(row);
    setArchiveModalOpen(true);
  };

  const handleUnarchive = (row) => {
    setUnarchiveTarget(row);
    setUnarchiveModalOpen(true);
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
      toast.success('Model deleted successfully');
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    setArchiveLoading(true);
    try {
      const id = archiveTarget.id || archiveTarget._raw?.id;
      const name = archiveTarget.run_name || archiveTarget.name;
      const url = `${hostnameAI}/canvas/archive_model/${id}/${name}`;
      const resp = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          accept: "application/json",
        },
      });
      if (!resp.ok) throw new Error("Failed to archive model");
      setArchiveModalOpen(false);
      setArchiveTarget(null);
      setRefreshTrigger((prev) => prev + 1);
      toast.success('Model archived successfully');
    } catch (err) {
      toast.error(err.message || "Archive failed");
    } finally {
      setArchiveLoading(false);
    }
  };

  const confirmUnarchive = async () => {
    if (!unarchiveTarget) return;
    setUnarchiveLoading(true);
    try {
      const id = unarchiveTarget.id || unarchiveTarget._raw?.id;
      await unarchiveEntity({
        component: 'model',
        component_id: id,
        hostnameAI,
        token,
      });
      setUnarchiveModalOpen(false);
      setUnarchiveTarget(null);
      setRefreshTrigger((prev) => prev + 1);
      toast.success('Model unarchived successfully');
    } catch (err) {
      toast.error(err.message || "Unarchive failed");
    } finally {
      setUnarchiveLoading(false);
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
        performance_drift_threshold: -1
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
    async (row) => {
      await updateRecentAccess({
        row,
        entityType: 'model',
        hostnameAI,
        token,
        userId: decodedToken.sub,
        setRecentList: setRecentAccessed,
        setRecentLoading: setRecentAccessedLoading,
      });
      const raw = row?._raw ?? row;
      const modelId = raw?.id || raw?.model_id;
      navigate(`/ai/hub/models/library/${encodeURIComponent(String(modelId))}`, {
        state: { modelData: raw },
      });
    },
    [navigate, hostnameAI, token, decodedToken.sub]
  );


  const actions = [
    {
      label: "Library",
      icon: <BookOpen className="w-4 h-4" />,
      onClick: openModelLibrary,
      tooltip: "Library",
    },
    // {
    //   label: "F1 Mode",
    //   icon: <Gauge className="w-4 h-4" />,
    //   onClick: (row) => console.log("F1 Mode:", row),
    //   tooltip: "F1 Mode",
    // },
    {
      label: "AI Playground",
      icon: <Palette className="w-4 h-4" />,
      onClick: async (row) => {
        await updateRecentAccess({
          row,
          entityType: 'model',
          hostnameAI,
          token,
          userId: decodedToken.sub,
          setRecentList: setRecentAccessed,
          setRecentLoading: setRecentAccessedLoading,
        });
        setIsCanvasLoading(true);

        try {
          const modelName = row?.run_name || row?._raw?.run_name;
          if (!modelName) {
            throw new Error("Model name not found");
          }
          // fetch the parameters needed for AI Playground from the model details endpoint
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
           // fetches the policy IDs using the secure query endpoint to send along with the ingestion request
          const secureQueryResponse = await fetch(
            `${window._env_?.VITE_FAST_API}/secure-query`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ user_query: "" }),
            }
          );

          if (!secureQueryResponse.ok) {
            throw new Error("Failed to fetch policy IDs");
          }

          const secureQueryData = await secureQueryResponse.json();
          const policyIds = secureQueryData.matched_policy_ids;

          const ingestionParams = {
            table_name: modelData.dataset_name,
            project_name: projectName,
            profiling_required: false,
            user_name: username,
            policy_id: policyIds,
          };

          const ingestionResponse = await fetch(
            `${hostnameAI}/ingestion/ingestion`,
            {
              method: 'POST',
              headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(ingestionParams),
            }
          );

          if (!ingestionResponse.ok) {
            toast.error('Failed to open AI Playground ', {
              duration: 4000,
              position: 'top-right',
            });
            return;
          }

          const ingestionData = await ingestionResponse.json();
          const ensembleId = ingestionData.ensemble_id || '';

          if (!ensembleId) {
            throw new Error('Ensemble ID not found in ingestion response');
          }

          setModelState({ selectedModel: modelData.model_name });

          setProjectState(prev => ({ ...prev, selectedProject: modelData.project_name }));

          setDatasetState({
            tableName: modelData.dataset_name,
            ensembleId,
            columnNames: ingestionData.column_names || [],
            profileReportHtml: ingestionData.profile_report_html || '',
            isEnsemble: false,
            WorkflowCount: 1
          });

          const createWorkflowResponse = await fetch(`${hostnameAI}/ingestion/create-workflow`, {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ensemble_id: ensembleId,
              no_of_workflows: 1,
              workflow_names: ['workflow 01']
            })
          });

          if (!createWorkflowResponse.ok) {
            throw new Error(`Failed to create workflow: ${createWorkflowResponse.status}`);
          }

          const createWorkflowData = await createWorkflowResponse.json();
          const workflowEntries = Object.entries(createWorkflowData?.workflows || {});
          const [workflowIdFromMap, workflowNameFromMap] = workflowEntries[0] || [];
          const workflowId = workflowIdFromMap || createWorkflowData?.workflow_ids?.[0];
          const workflowName = workflowNameFromMap || 'workflow 01';

          if (!workflowId) {
            throw new Error('No workflow ID returned from create-workflow API');
          }

          setWorkflowsState({});
          setActiveWorkflowId(null);
          createWorkflow(workflowId, workflowName);

          // creates a prefill for the AI Playground workflow based on the model details so that the user can directly go to the modeling stage in view mode
          if (modelData?.prefill) {
            const preprocessingRequest = modelData.prefill?.data_preprocessing?.request || {};
            const preprocessingResponse = modelData.prefill?.data_preprocessing?.response || {};

            const modelSelectionRequest =
              modelData.prefill?.training?.request ||
              preprocessingRequest?.training ||
              null;

            const modelSelectionResponse =
              modelData.prefill?.training?.response ||
              modelData.prefill?.training ||
              preprocessingResponse?.training ||
              null;

            const step1Request =
              preprocessingRequest?.initial_clean ||
              preprocessingRequest?.feature_selection ||
              null;

            const step1Response =
              preprocessingResponse?.initial_clean ||
              preprocessingResponse?.feature_selection ||
              null;

            updateWorkflowStage('modelGenesis', {
              config: preprocessingRequest?.genesis || null,
              apiResponse: preprocessingResponse?.genesis || null
            }, workflowId);

            updatePreprocessingStep('step1', {
              config: step1Request,
              apiResponse: step1Response
            }, workflowId);

            updatePreprocessingStep('step2', {
              config: preprocessingRequest?.feature_selection || null,
              apiResponse: preprocessingResponse?.feature_selection || null
            }, workflowId);

            updatePreprocessingStep('step3', {
              config: preprocessingRequest?.feature_engineering || null,
              apiResponse: preprocessingResponse?.feature_engineering || null
            }, workflowId);

            updatePreprocessingStep('step4', {
              config: preprocessingRequest?.advanced_transformation || null,
              apiResponse: preprocessingResponse?.advanced_transformation || null
            }, workflowId);

            updatePreprocessingStep('step5', {
              config: preprocessingRequest?.statistical_analysis || null,
              apiResponse: preprocessingResponse?.statistical_analysis || null
            }, workflowId);

            updatePreprocessingStep('step6', {
              config: preprocessingRequest?.feature_importance || null,
              apiResponse: preprocessingResponse?.feature_importance || null
            }, workflowId);

            updatePreprocessingStep('step7', {
              config: preprocessingRequest?.imbalance_handling || null,
              apiResponse: preprocessingResponse?.imbalance_handling || null
            }, workflowId);

            updateWorkflowStage('modelSelection', {
              config: modelSelectionRequest,
              apiResponse: modelSelectionResponse
            }, workflowId);

            updateWorkflowStage('modelInferencing', {
              config: null,
              apiResponse: null
            }, workflowId);

            updateWorkflowStage('xai', {
              config: null,
              apiResponse: null
            }, workflowId);

            updateWorkflowStage('modelDeployment', {
              config: null,
              apiResponse: null
            }, workflowId);

            setMode('view');
            setIsAIPlaygroundActive(true);
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
      onClick: handleArchive,
      tooltip: "Archive",
      show: (row) => String(row.status ?? '').toLowerCase() !== 'archived',
    },
    {
      label: "Unarchive",
      icon: <Archive className="w-4 h-4" />,
      onClick: handleUnarchive,
      tooltip: "Unarchive",
      show: (row) => String(row.status ?? '').toLowerCase() === 'archived',
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

    const statusFiltered = base.filter(row => {
      const rowStatus = String(row.status ?? '').toLowerCase();
      return statusFilter.includes(rowStatus);
    });

    let result = statusFiltered;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = statusFiltered.filter((row) =>
        Object.values(row || {}).some((val) =>
          String(val ?? "")
            .toLowerCase()
            .includes(q)
        )
      );
    }

    // Recalculate sno based on filtered data position
    return result.map((row, index) => ({
      ...row,
      sno: index + 1,
    }));
  }, [searchTerm, modelsData, statusFilter]);

  const AlertsPanel = () => {
    const [showInfo, setShowInfo] = useState(false);

    return (
      <div className="bg-white pt-4 px-4 pb-6 rounded-xl border border-gray-200 shadow-sm h-[350px]">
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-[8px]">
            <img src={notifications_active} alt="Alerts" className="w-[21px] h-[21px]" />
            <h3 className="satoshi-medium-md m-0">Alerts</h3>
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
        <div className="mt-4 overflow-y-auto max-h-[270px] pr-1">
          {alertsData.length === 0 ? (
            <div className="flex items-center justify-center min-h-[200px] text-gray-500 text-sm">
              No Alerts Available
            </div>
          ) : (
            alertsData.map((alert, index) => (
              <div key={index} className="grid items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors" style={{ gridTemplateColumns: "auto 1fr 160px" }}>
                <div className="flex-shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: alert.type === "drift" ? "#fb923c" : "#60a5fa" }} />
                <span className="text-sm text-gray-800 truncate" title={alert.name}>{alert.name}</span>
                <span className={`text-xs font-medium text-left truncate ${alert.trend === "up" ? "text-green-500" : "text-orange-500"}`} title={alert.issue}>
                  {alert.issue}
                </span>
              </div>
            ))
          )}
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

    return (
      <div className="bg-white rounded-xl px-4 py-4 flex flex-col justify-between min-h-[110px]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <IconCmp className="w-[18px] h-[18px] text-[#8e78b7] shrink-0 flex-shrink-0" />
            <span className="satoshi-medium-md m-0 truncate">{label}</span>
          </div>
        </div>

        <div className="flex items-end justify-between mt-4">
          <div className="satoshi-count m-0">
            {value == null ? <div className="h-8 w-14 bg-gray-200 rounded animate-pulse" /> : value}
          </div>

          {(trend && trendValue && value != null) ? (
            <div className={`flex items-center gap-1 text-base font-semibold leading-none`} style={{ color: isUp ? aithemestyle.trendup : aithemestyle.trendDown }}>
              <TrendIcon className="w-4 h-4" />
              <span className="tabular-nums">{trendValue}</span>
            </div>
          ) : (
            <div className="h-5 w-10" />
          )}
        </div>
      </div>
    );
  };

  const metricIcon = (key) => {
    const iconStyle = {
      width: "18px",
      height: "18px",
      position: "relative",
      top: "0px",
      left: "0px",
    };

    switch (key) {
      case "models":
        return () => <img src={Modelicon} alt="Models Icon" style={iconStyle} />;
      case "deployed":
        return () => <img src={Deployedicon} alt="Deployed Icon" style={iconStyle} />;
      case "accuracy":
        return () => <img src={Accuracyicon} alt="Accuracy Icon" style={iconStyle} />;
      case "latency":
        return () => <img src={Latencyicon} alt="Latency Icon" style={iconStyle} />;
      case "alerts":
        return () => <img src={Alerticon} alt="Alerts Icon" style={iconStyle} />;
      default:
        return () => <img src={Modelicon} alt="Default Icon" style={iconStyle} />;
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
    <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 min-h-screen">
      <style>{rotateAnimation}</style>

      <div className="sticky top-0 z-40 bg-gray-50 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6">
        <Breadcrumb link="/" skipLinkSegments={['hub']} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 py-3 sm:py-4 lg:py-6" style={{ height: '18px' }}>
          <h1 className="satoshi-heading mt-[1px]">
            Models
          </h1>

          <div className="flex items-center gap-2">
            {/* ADD: Status filter dropdown */}
            <div className="relative">
              <StatusFilterDropdown
                selectedStatuses={statusFilter}
                onStatusChange={setStatusFilter}
                statusOptions={[
                  { value: 'saved', label: 'Saved' },
                  { value: 'deployed', label: 'Deployed' },
                  { value: 'archived', label: 'Archived' }
                ]}
                style={{ color: '#818181' }}
              />
            </div>

            <div className="relative flex-1 sm:flex-initial">
              <img src={searchicon} alt="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
              <input
                type="text"
                placeholder="Search"
                className="focus:ring-2 focus:ring-[#8E77BB] focus:border-transparent"
                value={searchTerm}
                onChange={handleSearchChange}
                style={{
                  width: '248px',
                  height: '40px',
                  borderRadius: '8px',
                  paddingLeft: '40px',
                  paddingRight: '8px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  borderWidth: '1px',
                  borderColor: '#d1d5db',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  background: '#fff',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            {/* <button
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
            </button> */}

            <button
              className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 h-[40px] flex items-center justify-center"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCcw size={20} className={isLoading ? 'icon-rotate' : ''} style={{ color: '#818181' }} strokeWidth={1.7} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {viewMode !== "list" && (
          <>
            <div className={`${aithemestyle.statsCardGradient270} rounded-xl p-4`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="col-span-2">
              <ModelFlow />
            </div>
            <div>
              <AlertsPanel className="flex flex-col items-start space-y-2" />
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
      <ArchiveModal
        isOpen={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        onConfirm={confirmArchive}
        title="Archive Model"
        description={`Are you sure you want to archive "${archiveTarget?.run_name || archiveTarget?.name || archiveTarget?.id || ''}"? This action can be undone.`}
        loading={archiveLoading}
        confirmText="Archive"
      />
      <UnarchiveModal
        isOpen={unarchiveModalOpen}
        onClose={() => setUnarchiveModalOpen(false)}
        onConfirm={confirmUnarchive}
        title="Unarchive Model"
        description={`Are you sure you want to unarchive "${unarchiveTarget?.run_name || unarchiveTarget?.name || unarchiveTarget?.id || ''}"? This action can be undone.`}
        loading={unarchiveLoading}
        confirmText="Unarchive"
      />
      <DeployModal />
      </div>

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