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
} from "lucide-react";
import { Icon } from "@iconify-icon/react";
import Breadcrumb from "../../../components/Breadcrumb";
import DataTable from "../../../components/DataTable";
import QuickPredictModal from "./Components/Models/QuickPredictModal";
import DeleteModal from "./Components/DeleteModal";
import { useAuth } from "../../../context/AuthContext";
import { useAIPlayground } from "../../../context/AIPlaygroundContext";

function Models() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState("both");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0); // NEW: force stats refresh
  const [isQuickPredictOpen, setIsQuickPredictOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelsData, setModelsData] = useState([]);
  const [error, setError] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [deployLoading, setDeployLoading] = useState(false);
  const [deployResult, setDeployResult] = useState(null);
  const [deployError, setDeployError] = useState(null);
  const [deployTarget, setDeployTarget] = useState(null);
  const hostnameAI = window._env_?.VITE_AI_API;
  const { token, decodedToken } = useAuth();
  const [isCanvasLoading, setIsCanvasLoading] = useState(false);
  const { setWorkflowState, setDatasetState, setMode, setModelState, setProjectState } = useAIPlayground();
    const [dashboardLoading, setDashboardLoading] = useState(false);


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
          _raw: item, // keep full backend payload for downstream pages
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
        { title: "Active Models", value: null, trend: "up", trendValue: "", icon: "material-symbols:check-circle-outline" },
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
        title: "Active Models",
        value: dashboardSummary?.model_status_counts?.active ?? 0,
        trend: "up",
        trendValue: "",
        icon: "material-symbols:check-circle-outline",
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
    // CHANGED: refresh table + stats; no artificial timeout
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
          className="block min-w-0 whitespace-normal break-words text-[#8e78b7] hover:underline cursor-pointer"
          onClick={() =>
            actions.find(a => a.label === "Library")?.onClick(row)
          }
        >
          {row.run_name}
        </span>
      ),
    },
    { key: "description", label: "Description", sortable: true },
    { key: "created_date", label: "Created Date", sortable: true },
    {key: 'project_name', label: 'Project', sortable: true },
    {key: 'user_name', label: 'Owner', sortable: true },
    { key: "type", label: "Type", sortable: true },
    {
      key: "status",
      label: "Status",
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

  // Deploy action handler
  const handleDeploy = async (row) => {
    setDeployTarget(row);
    setDeployModalOpen(true);
    setDeployLoading(true);
    setDeployResult(null);
    setDeployError(null);
    try {
      const modelName = row?.run_name || row?._raw?.run_name;
      const resp = await fetch(
        `${hostnameAI}/quick/deploy-quick-action?model_name=${encodeURIComponent(modelName)}`,
        {
          headers:
            {
              Authorization: `Bearer ${token}`,
              accept: "application/json",
            },
        }
      );
      const data = await resp.json();
      if (resp.ok && data.success) {
        setDeployResult(data);
      } else {
        setDeployError(data?.message || "Deployment failed");
      }
    } catch (err) {
      setDeployError(err.message || "Deployment failed");
    } finally {
      setDeployLoading(false);
    }
  };

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
            throw new Error("Failed to fetch model details");
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
            throw new Error("Failed to ingest data");
          }

          const ingestionData = await ingestionResponse.json();

          setModelState({selectedModel: modelData.model_name });

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
          console.error("Error loading model:", error);
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
      // onClick: handleDeploy,
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
    if (!searchTerm.trim()) {
      return modelsData.filter(row => String(row.status).toLowerCase() !== "deleted");
    }
    const q = searchTerm.toLowerCase();
    return modelsData
      .filter(row => String(row.status).toLowerCase() !== "deleted")
      .filter((row) =>
        Object.values(row || {}).some((val) =>
          String(val ?? "")
            .toLowerCase()
            .includes(q)
        )
      );
  }, [searchTerm, modelsData]);

  const ModelFlowDiagram = ({ data }) => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showInfo, setShowInfo] = useState(false);

    const handleWheel = useCallback((e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setTransform((prev) => ({
        ...prev,
        scale: Math.min(Math.max(prev.scale * delta, 0.5), 2),
      }));
    }, []);

    const handleMouseDown = useCallback(
      (e) => {
        setIsDragging(true);
        setDragStart({
          x: e.clientX - transform.x,
          y: e.clientY - transform.y,
        });
      },
      [transform.x, transform.y]
    );

    const handleMouseMove = useCallback(
      (e) => {
        if (!isDragging) return;
        setTransform((prev) => ({
          ...prev,
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        }));
      },
      [isDragging, dragStart]
    );

    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
    }, []);

    const resetZoom = () => {
      setTransform({ x: 0, y: 0, scale: 1 });
    };

    return (
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon
              icon="material-symbols:account-tree-outline"
              className="w-5 h-5 text-purple-600"
            />
            <h3 className="text-sm font-semibold text-gray-800">Model Flow</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setTransform((prev) => ({
                  ...prev,
                  scale: Math.min(prev.scale * 1.2, 2),
                }))
              }
              className="p-1 hover:bg-gray-100 rounded text-gray-500"
              title="Zoom In"
            >
              <Icon icon="material-symbols:zoom-in" className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                setTransform((prev) => ({
                  ...prev,
                  scale: Math.max(prev.scale * 0.8, 0.5),
                }))
              }
              className="p-1 hover:bg-gray-100 rounded text-gray-500"
              title="Zoom Out"
            >
              <Icon icon="material-symbols:zoom-out" className="w-4 h-4" />
            </button>
            <button
              onClick={resetZoom}
              className="p-1 hover:bg-gray-100 rounded text-gray-500"
              title="Reset"
            >
              <Icon icon="material-symbols:fit-screen" className="w-4 h-4" />
            </button>
            <div className="relative">
              <Info
                className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600"
                onMouseEnter={() => setShowInfo(true)}
                onMouseLeave={() => setShowInfo(false)}
              />
              {showInfo && (
                <div className="absolute right-0 top-6 z-10 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg">
                  Interactive model flow diagram. Use scroll to zoom, drag to
                  pan.
                </div>
              )}
            </div>
          </div>
        </div>
        <div
          ref={containerRef}
          className="h-[260px] overflow-hidden cursor-grab active:cursor-grabbing rounded-lg bg-gray-50"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 780 240"
            className="w-full h-full"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.1s ease-out",
            }}
          >
            <g className="cursor-pointer hover:opacity-80 transition-opacity">
              <rect
                x={data.aiModel.x}
                y={data.aiModel.y}
                width="100"
                height="60"
                rx="8"
                fill="#7C3AED"
              />
              <text
                x={data.aiModel.x + 50}
                y={data.aiModel.y + 28}
                textAnchor="middle"
                fill="white"
                fontSize="20"
                fontWeight="bold"
              >
                {data.aiModel.label}
              </text>
              <text
                x={data.aiModel.x + 50}
                y={data.aiModel.y + 45}
                textAnchor="middle"
                fill="white"
                fontSize="9"
              >
                {data.aiModel.sublabel}
              </text>
            </g>

            {data.classificationAgents.map((agent, idx) => (
              <g
                key={agent.id}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <rect
                  x={agent.x}
                  y={agent.y}
                  width="90"
                  height="40"
                  rx="8"
                  fill="#EC4899"
                />
                <text
                  x={agent.x + 45}
                  y={agent.y + 15}
                  textAnchor="middle"
                  fill="white"
                  fontSize="9"
                  fontWeight="500"
                >
                  Classification
                </text>
                <text
                  x={agent.x + 45}
                  y={agent.y + 28}
                  textAnchor="middle"
                  fill="white"
                  fontSize="9"
                  fontWeight="500"
                >
                  Agent
                </text>
              </g>
            ))}

            {data.middleAgents.map((agent) => (
              <g
                key={agent.id}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <rect
                  x={agent.x}
                  y={agent.y}
                  width="80"
                  height="32"
                  rx="6"
                  fill={agent.color}
                />
                <text
                  x={agent.x + 40}
                  y={agent.y + 20}
                  textAnchor="middle"
                  fill="white"
                  fontSize="9"
                  fontWeight="500"
                >
                  {agent.label}
                </text>
              </g>
            ))}

            <g className="cursor-pointer hover:opacity-80 transition-opacity">
              <rect
                x={data.orchestrationLayer.x}
                y={data.orchestrationLayer.y}
                width="110"
                height="80"
                rx="8"
                fill="#10B981"
              />
              <text
                x={data.orchestrationLayer.x + 55}
                y={data.orchestrationLayer.y + 38}
                textAnchor="middle"
                fill="white"
                fontSize="9"
                fontWeight="500"
              >
                Orchestration
              </text>
              <text
                x={data.orchestrationLayer.x + 55}
                y={data.orchestrationLayer.y + 52}
                textAnchor="middle"
                fill="white"
                fontSize="9"
                fontWeight="500"
              >
                Agent
              </text>
            </g>

            <g className="cursor-pointer hover:opacity-80 transition-opacity">
              <rect
                x={data.output.x}
                y={data.output.y}
                width="80"
                height="40"
                rx="8"
                fill="#06B6D4"
              />
              <text
                x={data.output.x + 40}
                y={data.output.y + 25}
                textAnchor="middle"
                fill="white"
                fontSize="10"
                fontWeight="600"
              >
                {data.output.label}
              </text>
            </g>

            <path
              d="M130 120 C155 120, 155 80, 180 80"
              stroke="#A78BFA"
              strokeWidth="3"
              fill="none"
              opacity="0.5"
            />
            <path
              d="M130 130 C155 130, 155 160, 180 160"
              stroke="#A78BFA"
              strokeWidth="3"
              fill="none"
              opacity="0.5"
            />

            {data.middleAgents.map((agent, idx) => {
              const sourceY = idx < 2 ? 80 : 160;
              const targetY = agent.y + 16;
              return (
                <path
                  key={`class-to-middle-${agent.id}`}
                  d={`M270 ${sourceY} C295 ${sourceY}, 295 ${targetY}, 320 ${targetY}`}
                  stroke={idx < 2 ? "#EC4899" : "#EC4899"}
                  strokeWidth="2.5"
                  fill="none"
                  opacity="0.4"
                />
              );
            })}

            {data.middleAgents.map((agent) => {
              const sourceY = agent.y + 16;
              return (
                <path
                  key={`middle-to-orch-${agent.id}`}
                  d={`M400 ${sourceY} C450 ${sourceY}, 450 130, 500 130`}
                  stroke="#FB923C"
                  strokeWidth="2.5"
                  fill="none"
                  opacity="0.3"
                />
              );
            })}

            <path
              d="M610 130 C635 130, 635 120, 660 120"
              stroke="#10B981"
              strokeWidth="3"
              fill="none"
              opacity="0.6"
            />
          </svg>
        </div>
      </div>
    );
  };

  const AlertsPanel = () => {
    const [showInfo, setShowInfo] = useState(false);

    return (
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-full">
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
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6 shadow-xl">
          <div className="text-lg font-semibold mb-2">Deploy Model</div>
          {deployLoading && (
            <div className="flex flex-col items-center py-6">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-3" />
              <span className="text-gray-700">Deploying model...</span>
            </div>
          )}
          {!deployLoading && deployResult && (
            <div className="flex flex-col items-center py-6">
              <Icon icon="material-symbols:check-circle-outline" className="w-12 h-12 text-green-500 mb-2" />
              <span className="text-green-700 font-medium mb-1">Deployment Successful!</span>
              <div className="text-xs text-gray-500 text-center">
                Model: <b>{deployResult.model_name}</b>
                <br />
                Project: <b>{deployResult.project_name}</b>
              </div>
            </div>
          )}
          {!deployLoading && deployError && (
            <div className="flex flex-col items-center py-6">
              <Icon icon="material-symbols:error-outline" className="w-12 h-12 text-red-500 mb-2" />
              <span className="text-red-700 font-medium mb-1">Deployment Failed</span>
              <div className="text-xs text-gray-500 text-center">{deployError}</div>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <button
              className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
              onClick={() => setDeployModalOpen(false)}
              disabled={deployLoading}
            >
              Close
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
            <IconCmp className="w-7 h-7 text-[#8e78b7] shrink-0" />
            <span className="text-gray-900 text-xl font-semibold truncate">{label}</span>
          </div>
        </div>

        <div className="flex items-end justify-between mt-6">
          <div className="text-2xl font-extrabold text-gray-900 tabular-nums leading-none">
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

  // ADD: map iconify names -> lucide icons for consistent card header icon
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
      case "active":
        return CheckCircleFallback; // defined below
      default:
        return BookOpen;
    }
  };

  // ADD: tiny fallback icon to avoid extra imports; uses existing lucide "Info" shape if needed
  const CheckCircleFallback = (props) => <Info {...props} />;

  const statsCards = useMemo(() => {
    // keep null values while loading (matches Projects skeleton behavior)
    const [m1, m2, m3, m4, m5] = metricsData || [];
    return [
      { key: "models", label: "Models", value: m1?.value ?? null, trend: m1?.trend ?? null, trendValue: m1?.trendValue ?? null, icon: metricIcon("models") },
      { key: "deployed", label: "Deployed Models", value: m2?.value ?? null, trend: m2?.trend ?? null, trendValue: m2?.trendValue ?? null, icon: metricIcon("deployed") },
      { key: "accuracy", label: "Avg Accuracy", value: m3?.value ?? null, trend: m3?.trend ?? null, trendValue: m3?.trendValue ?? null, icon: metricIcon("accuracy") },
      { key: "latency", label: "Avg Latency", value: m4?.value ?? null, trend: m4?.trend ?? null, trendValue: m4?.trendValue ?? null, icon: metricIcon("latency") },
      { key: "active", label: "Active Models", value: m5?.value ?? null, trend: m5?.trend ?? null, trendValue: m5?.trendValue ?? null, icon: metricIcon("active") },
    ];
  }, [metricsData]);

  return (
    <div className="p-6 space-y-4">
      <Breadcrumb link="/" />

      <div className="flex gap-4 items-center justify-between">
        <h1 className="text-2xl font-semibold">Models</h1>

        <div className="flex items-center gap-2">
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
          {/* REPLACE: Models stats area to match Projects UI */}
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
              <ModelFlowDiagram data={modelFlowData} />
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
      {/* Deploy Modal */}
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