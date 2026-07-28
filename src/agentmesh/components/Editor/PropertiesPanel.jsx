import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from "react";
import { useWorkflowStore, useUIStore } from "../../store";
import { listTools, fixGrammar } from "../../api/agentmesh";
import SkillGallery from "./SkillGallery";
import { NODE_TYPES } from "./NodePalette";
import SaveTemplateModal from "./SaveTemplateModal";
import { AUTO_INJECT_TYPES } from "./RunPanelModules/pauseRegistry";

import {
  FiTrash2,
  FiMousePointer,
  FiInfo,
  FiLayers,
  FiSettings,
  FiCpu,
  FiTool,
  FiGitMerge,
  FiTarget,
  FiShare2,
  FiBookOpen,
  FiLink,
  FiPlus,
  FiX,
  FiGlobe,
  FiClock,
  FiRepeat,
  FiFileText,
  FiSearch,
  FiChevronDown,
  FiAlertTriangle,
  FiBox,
  FiSave,
  FiHelpCircle,
  FiCode,
  FiEdit,
  FiMail,
} from "react-icons/fi";
import {
  FONT,
  Field,
  Input,
  Select,
  Toggle,
  CollapsibleSection,
  HitlConfigSection,
  InfoBanner,
} from "./propertypanelModules/SharedComponents";

// Lazy load configuration modules to optimize bundle size and page load speed.
const LAZY_CONFIGS = {
  llm_agent: lazy(() => import("./propertypanelModules/LLMAgentConfig")),
  deep_agent: lazy(() => import("./propertypanelModules/DeepAgentConfig")),
  tool_node: lazy(() => import("./propertypanelModules/ToolNodeConfig")),
  direct_tool: lazy(() => import("./propertypanelModules/DirectToolConfig")),
  supervisor: lazy(() => import("./propertypanelModules/SupervisorConfig")),
  swarm: lazy(() => import("./propertypanelModules/SwarmConfig")),
  webhook: lazy(() => import("./propertypanelModules/WebhookConfig")),
  webhook_response: lazy(
    () => import("./propertypanelModules/WebhookResponseConfig"),
  ),
  cron: lazy(() => import("./propertypanelModules/CronConfig")),
  polling: lazy(() => import("./propertypanelModules/PollingConfig")),
  condition: lazy(() => import("./propertypanelModules/ConditionConfig")),
  wait: lazy(() => import("./propertypanelModules/WaitConfig")),
  join: lazy(() => import("./propertypanelModules/JoinConfig")),
  switch: lazy(() => import("./propertypanelModules/SwitchConfig")),
  set_data: lazy(() => import("./propertypanelModules/SetDataConfig")),
  output_parser: lazy(
    () => import("./propertypanelModules/OutputParserConfig"),
  ),
  chat_model: lazy(() => import("./propertypanelModules/ChatModelConfig")),
  memory: lazy(() => import("./propertypanelModules/MemoryConfig")),
  subgraph: lazy(() => import("./propertypanelModules/SubgraphConfig")),
  router: lazy(() => import("./propertypanelModules/RouterConfig")),
  notification: lazy(() => import("./propertypanelModules/NotificationConfig")),
  splitter: lazy(() => import("./propertypanelModules/SplitterConfig")),
  aggregator: lazy(() => import("./propertypanelModules/AggregatorConfig")),
  payload_builder: lazy(
    () => import("./propertypanelModules/PayloadBuilderConfig"),
  ),
  api_node: lazy(() => import("./propertypanelModules/ApiNodeConfig")),
  form_node: lazy(() => import("./propertypanelModules/FormNodeConfig")),
  camera: lazy(() => import("./propertypanelModules/CameraNodeConfig")),
  file_store: lazy(() => import("./propertypanelModules/FileStoreConfig")),
  debug_node: lazy(() => import("./propertypanelModules/DebugNodeConfig")),
  error_router: lazy(() => import("./propertypanelModules/ErrorRouterConfig")),
  data_cleaning: lazy(
    () => import("./propertypanelModules/DataCleaningConfig"),
  ),
  graph_ingestion: lazy(
    () => import("./propertypanelModules/NetworkGraphConfig"),
  ),
  pii_node: lazy(() => import("./propertypanelModules/PiiNodeConfig")),
  json_transform: lazy(
    () => import("./propertypanelModules/JsonTransformConfig"),
  ),
  classification: lazy(
    () => import("./propertypanelModules/ClassificationConfig"),
  ),
  sensitivity_classifier: lazy(
    () => import("./propertypanelModules/SensitivityClassifierConfig"),
  ),
  vector_ingestion: lazy(
    () => import("./propertypanelModules/IngestionNodeConfig"),
  ),
  rag_node: lazy(() => import("./propertypanelModules/RagNodeConfig")),
  ocr_node: lazy(() => import("./propertypanelModules/OcrNodeConfig")),
  multi_file_ingestion: lazy(
    () => import("./propertypanelModules/MultiFileIngestionConfig"),
  ),
  vision_intelligence: lazy(
    () => import("./propertypanelModules/VisionIntelligenceConfig")
  ),
  json_transform_va: lazy(
    () => import("./propertypanelModules/JsonTransformVaConfig"),
  ),
  pattern_extract: lazy(
    () => import("./propertypanelModules/PatternExtractConfig"),
  ),
  db_node: lazy(() => import("./propertypanelModules/DbNodeConfig")),
  pii_gate_node: lazy(() => import("./propertypanelModules/PiiGateNodeConfig")),
  ingestion_router: lazy(
    () => import("./propertypanelModules/IngestionRouterConfig"),
  ),
  event_emitter: lazy(
    () => import("./propertypanelModules/EventEmitterConfig"),
  ),
  weightage: lazy(() => import("./propertypanelModules/WeightageConfig")),
  template_node: lazy(
    () => import("./propertypanelModules/TemplateNodeConfig"),
  ),
  report_generator: lazy(
    () => import("./propertypanelModules/ReportGeneratorConfig"),
  ),
  ingestion_adapter: lazy(
    () => import("./propertypanelModules/IngestionAdapterConfig"),
  ),
  banking_enrichment: lazy(
    () => import("./propertypanelModules/BankingEnrichmentConfig"),
  ),
  rule_engine: lazy(() => import("./propertypanelModules/RuleEngineConfig")),
  beneficiary_risk: lazy(
    () => import("./propertypanelModules/BeneficiaryRiskConfig"),
  ),
  cardboard: lazy(() => import("./propertypanelModules/CardboardConfig")),
  button_trigger: lazy(() => import("./propertypanelModules/TriggerConfig")),
  auto_trigger: lazy(() => import("./propertypanelModules/TriggerConfig")),
  stt_trigger: lazy(() => import("./propertypanelModules/SttNodeConfig")),
  textToAudio: lazy(() => import("./propertypanelModules/TextToAudioConfig")),
  signature_stamp_extractor: lazy(() => import("./propertypanelModules/SignatureStampExtractorConfig")),
  code_execution: lazy(() => import("./propertypanelModules/CodeExecutionConfig")),
  email_node: lazy(() => import("./propertypanelModules/EmailNodeConfig")),
  group: lazy(() => import("./propertypanelModules/GroupConfig")),
};

function getConfigComp(type) {
  return LAZY_CONFIGS[type] || null;
}

export default function PropertiesPanel() {
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const selectedEdgeId = useUIStore((s) => s.selectedEdgeId);

  // Standard Zustand selectors to avoid reference-creation loop
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);

  // Directly retrieve only the currently selected node/edge
  const node = useMemo(() => {
    const found = nodes.find((n) => n.id === selectedNodeId);
    if (found) return found;
    for (const n of nodes) {
      if (n.data?.type === 'group' && n.data?.internal_nodes) {
        const sub = n.data.internal_nodes.find((sn) => sn.id === selectedNodeId);
        if (sub) return sub;
      }
    }
    return null;
  }, [nodes, selectedNodeId]);
  const edge = useMemo(() => edges.find((e) => e.id === selectedEdgeId), [edges, selectedEdgeId]);

  const setNodeData = useWorkflowStore((s) => s.setNodeData);
  const setEdgeData = useWorkflowStore((s) => s.setEdgeData);
  const removeNode = useWorkflowStore((s) => s.removeNode);
  const setEdges = useWorkflowStore((s) => s.setEdges);
  const setSelectedNode = useUIStore((s) => s.setSelectedNode);
  const setSelectedEdge = useUIStore((s) => s.setSelectedEdge);
  const workflows = useWorkflowStore((s) => s.allWorkflows);
  const currentWorkflowId = useWorkflowStore((s) => s.workflowId);

  const [availableTools, setAvailableTools] = useState([]);
  const [fixingGrammar, setFixingGrammar] = useState(false);
  const [skillGalleryOpen, setSkillGalleryOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const data = node?.data;

  const nodeDesc = useMemo(() => {
    if (!data?.type) return null;
    const info = NODE_TYPES.find((n) => n.type === data.type);
    return info?.detailedDesc || info?.desc || null;
  }, [data?.type]);

  const update = useCallback(
    (patch) => {
      if (selectedNodeId) {
        setNodeData(selectedNodeId, patch);
      }
    },
    [selectedNodeId, setNodeData],
  );

  const handleFixGrammar = useCallback(
    async (targetKey) => {
      if (!data || !data[targetKey]) return;
      try {
        setFixingGrammar(true);
        const res = await fixGrammar(data[targetKey]);
        if (res.status === "success" && res.fixed !== res.original) {
          update({ [targetKey]: res.fixed });
        }
      } catch (e) {
        console.error("Failed to fix grammar:", e);
      } finally {
        setFixingGrammar(false);
      }
    },
    [data, update],
  );

  useEffect(() => {
    listTools({ limit: 1000 })
      .then((res) => {
        setAvailableTools(res.tools || []);
      })
      .catch((err) => console.error("Failed to load tools:", err));
  }, []);

  // 🔄 SMART SYNC: Automatically synchronize tools and settings between connected Agents and Tool Nodes
  // Uses store.getState() to query full nodes/edges list dynamically to avoid re-binding closures on canvas changes
  const syncTools = useCallback(
    (newTools, newConfigs) => {
      if (!data || !node) return;
      const filteredConfigs = {};
      if (newConfigs) {
        newTools.forEach((tName) => {
          if (newConfigs[tName]) filteredConfigs[tName] = newConfigs[tName];
        });
      }

      const patch = { tools: newTools, tool_configs: filteredConfigs };
      update(patch);

      if (
        ["llm_agent", "supervisor", "swarm", "deep_agent"].includes(data.type)
      ) {
        const store = useWorkflowStore.getState();
        const currentEdges = store.edges;
        const currentNodes = store.nodes;
        const connectedEdges = currentEdges.filter((e) => e.source === node.id);
        const connectedToolNodes = connectedEdges
          .map((e) => currentNodes.find((n) => n.id === e.target))
          .filter((n) => n?.data?.type === "tool_node");

        if (connectedToolNodes.length > 0) {
          connectedToolNodes.forEach((tn) => setNodeData(tn.id, patch));
        } else if (newTools.length > 0) {
          const newId = store.addNode("tool_node", {
            x: node.position.x + 350,
            y: node.position.y,
          });

          setTimeout(() => {
            const latestEdges = useWorkflowStore.getState().edges;
            const newEdge = {
              id: `e-${node.id}-${newId}`,
              source: node.id,
              target: newId,
              type: "smoothstep",
              animated: false,
              style: { stroke: "#CBD5E1", strokeWidth: 1.5 },
            };
            store.setEdgesDirty([...latestEdges, newEdge]);
            store.setNodeData(newId, patch);
          }, 50);
        }
      } else if (data.type === "tool_node") {
        const store = useWorkflowStore.getState();
        const currentEdges = store.edges;
        const currentNodes = store.nodes;
        const incomingEdges = currentEdges.filter((e) => e.target === node.id);
        incomingEdges.forEach((e) => {
          const sourceNode = currentNodes.find((n) => n.id === e.source);
          if (
            ["llm_agent", "supervisor", "swarm", "deep_agent"].includes(
              sourceNode?.data?.type,
            )
          ) {
            setNodeData(sourceNode.id, patch);
          }
        });
      }
    },
    [data, node, setNodeData, update],
  );

  const syncToggle = useCallback(
    (key, value) => {
      if (!data || !node) return;
      update({ [key]: value });
      if (["llm_agent", "tool_node", "deep_agent"].includes(data.type)) {
        const store = useWorkflowStore.getState();
        const currentEdges = store.edges;
        const currentNodes = store.nodes;
        const neighbors = [];
        if (data.type === "tool_node") {
          currentEdges
            .filter((e) => e.target === node.id)
            .forEach((e) => {
              const s = currentNodes.find((n) => n.id === e.source);
              if (["llm_agent", "deep_agent"].includes(s?.data?.type))
                neighbors.push(s);
            });
        } else {
          currentEdges
            .filter((e) => e.source === node.id)
            .forEach((e) => {
              const t = currentNodes.find((n) => n.id === e.target);
              if (t?.data?.type === "tool_node") neighbors.push(t);
            });
        }
        neighbors.forEach((n) => setNodeData(n.id, { [key]: value }));
      }
    },
    [data, node, setNodeData, update],
  );

  if (!node && !edge) {
    return (
      <div
        style={{
          padding: 40,
          color: "var(--text-muted)",
          fontSize: 13,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 12,
        }}
      >
        <FiMousePointer size={32} style={{ color: "var(--border)" }} />
        <div style={{ fontWeight: 600 }}>
          Select a node or edge to edit its properties
        </div>
      </div>
    );
  }

  // ── Edge Properties View ──
  if (edge) {
    const updateEdge = (patch) => setEdgeData(edge.id, patch);
    const removeEdge = () => setEdges(edges.filter((e) => e.id !== edge.id));

    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "white",
          fontFamily: FONT,
        }}
      >
        <div
          style={{
            padding: "16px 16px 14px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "#F5F3FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#7C3AED",
              }}
            >
              <FiLink size={15} strokeWidth={1.5} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                Edge Properties
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {edge.source} &rarr; {edge.target}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              removeEdge();
              setSelectedEdge(null);
            }}
            style={{
              width: 30,
              height: 30,
              background: "none",
              border: "none",
              borderRadius: 6,
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <FiTrash2 size={15} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          <InfoBanner type="info">
            Conditional edges are used by <strong>Router</strong> nodes. If a
            node is not a Router, the edge acts as a standard flow connection.
          </InfoBanner>

          <Field
            label="Condition Key"
            hint="The state key to check (e.g., 'next', 'status')."
          >
            <Input
              value={edge.data?.condition?.key || ""}
              onChange={(v) =>
                updateEdge({
                  condition: {
                    ...(edge.data?.condition || { operator: "==" }),
                    key: v,
                  },
                })
              }
              placeholder="e.g. next"
            />
          </Field>

          <Field label="Operator">
            <Select
              value={edge.data?.condition?.operator || "=="}
              onChange={(v) =>
                updateEdge({
                  condition: {
                    ...(edge.data?.condition || { key: "" }),
                    operator: v,
                  },
                })
              }
              options={[
                { value: "==", label: "Equals (==)" },
                { value: "!=", label: "Not Equals (!=)" },
                { value: "contains", label: "Contains" },
                { value: ">", label: "Greater Than (>)" },
                { value: "<", label: "Less Than (<)" },
              ]}
            />
          </Field>

          <Field label="Match Value" hint="The value to compare against.">
            <Input
              value={edge.data?.condition?.value || ""}
              onChange={(v) =>
                updateEdge({
                  condition: {
                    ...(edge.data?.condition || { key: "", operator: "==" }),
                    value: v,
                  },
                })
              }
              placeholder="e.g. true"
            />
          </Field>

          {edge.data?.condition?.key && (
            <div
              style={{
                marginTop: 12,
                padding: "8px 12px",
                background: "#F0FDF4",
                borderRadius: 8,
                border: "1px solid #BBF7D0",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#22C55E",
                }}
              ></div>
              <div style={{ fontSize: 11, color: "#166534", fontWeight: 600 }}>
                Active Condition: {edge.data.condition.key}{" "}
                {edge.data.condition.operator} {edge.data.condition.value}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: 16,
            borderTop: "1px solid var(--border)",
            background: "white",
          }}
        >
          <button
            onClick={() => {
              removeEdge();
              setSelectedEdge(null);
            }}
            style={{
              width: "100%",
              padding: "12px",
              background: "#FEF2F2",
              border: "1px solid #FEE2E2",
              borderRadius: 10,
              color: "#EF4444",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <FiTrash2 size={16} /> Remove Edge
          </button>
        </div>
      </div>
    );
  }

  const nodeIcons = {
    llm_agent: FiCpu,
    tool_node: FiTool,
    router: FiGitMerge,
    supervisor: FiTarget,
    swarm: FiShare2,
    rag_node: FiBookOpen,
    subgraph: FiLink,
    chat_model: FiCpu,
    memory: FiBookOpen,
    webhook: FiGlobe,
    cron: FiClock,
    polling: FiClock,
    splitter: FiRepeat,
    api_node: FiGlobe,
    file_store: FiFileText,
    webhook_response: FiShare2,
    error_router: FiAlertTriangle,
    pattern_extract: FiSearch,
    db_node: FiBox,
    json_transform: FiCode,
    json_transform_va: FiCode,
    condition: FiHelpCircle,
    group: FiLayers,
    signature_stamp_extractor: FiEdit,
    code_execution: FiCode,
    email_node: FiMail,
  };
  const Icon = nodeIcons[data.type] || FiLayers;

  const isSystemNode = ["start", "end"].includes(data.type);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "white",
        fontFamily: FONT,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 16px 14px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "var(--bg-hover)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
            }}
          >
            <Icon size={15} strokeWidth={1.5} />
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              Properties
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                textTransform: "capitalize",
              }}
            >
              {data.type?.replace(/_/g, " ")}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {!isSystemNode && (
            <button
              onClick={() => setSaveModalOpen(true)}
              style={{
                width: 30,
                height: 30,
                background: "none",
                border: "none",
                borderRadius: 6,
                color: "var(--accent-btn)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              title="Save Node as Template"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent-glow)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
              }}
            >
              <FiSave size={15} />
            </button>
          )}
          {!isSystemNode && (
            <button
              onClick={() => {
                removeNode(selectedNodeId);
                setSelectedNode(null);
              }}
              style={{
                width: 30,
                height: 30,
                background: "none",
                border: "none",
                borderRadius: 6,
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              title="Delete Node"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#DC2626";
                e.currentTarget.style.background = "#FEF2F2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.background = "none";
              }}
            >
              <FiTrash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {nodeDesc && (
          <InfoBanner type="neutral">
            {nodeDesc}
          </InfoBanner>
        )}

        {/* Common Label field (only for non-system nodes) */}
        {!isSystemNode && (
          <Field label="Node Label">
            <Input
              value={data.label}
              onChange={(v) => update({ label: v })}
              placeholder="Enter node name…"
            />
          </Field>
        )}

        {/* Node Specific Settings rendering starts here... */}
        {(() => {
          const ConfigComp = getConfigComp(data?.type);
          const canHaveHitl =
            data?.type &&
            !["start", "end", "chat_model", "memory", "cardboard", "group"].includes(data.type) &&
            !AUTO_INJECT_TYPES.includes(data.type);
          const NODES_WITH_INTERNAL_ADVANCED = [
            "llm_agent",
            "deep_agent",
            "direct_tool",
            "supervisor",
            "swarm",
            "tool_node",
            "textToAudio",
            "vision_intelligence",
          ];
          const hasInternalAdvanced =
            canHaveHitl && NODES_WITH_INTERNAL_ADVANCED.includes(data.type);

          const hitlSection = canHaveHitl ? (
            <HitlConfigSection data={data} update={update} />
          ) : null;

          let mainConfigContent = null;
          if (ConfigComp) {
            mainConfigContent = (
              <Suspense
                fallback={
                  <div
                    style={{
                      padding: 12,
                      fontSize: 12,
                      color: "var(--text-muted)",
                    }}
                  >
                    Loading configuration...
                  </div>
                }
              >
                <ConfigComp
                  data={data}
                  update={update}
                  selectedNodeId={selectedNodeId}
                  availableTools={availableTools}
                  syncTools={syncTools}
                  fixingGrammar={fixingGrammar}
                  handleFixGrammar={handleFixGrammar}
                  currentWorkflowId={currentWorkflowId}
                  workflows={workflows}
                  nodes={nodes}
                  edges={edges}
                  syncToggle={syncToggle}
                  setSkillGalleryOpen={setSkillGalleryOpen}
                  hitlSection={hitlSection}
                />
              </Suspense>
            );
          } else if (isSystemNode) {
            mainConfigContent = (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: 13,
                  background: "var(--bg-primary)",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                }}
              >
                <FiInfo size={20} style={{ marginBottom: 8, opacity: 0.5 }} />
                <div>
                  This is a <strong>{data.type?.toUpperCase()}</strong> node and
                  cannot be configured.
                </div>
              </div>
            );
          } else {
            mainConfigContent = (
              <div
                style={{
                  padding: 12,
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                Configuration for {data.type} not yet modularized.
              </div>
            );
          }

          return (
            <>
              {mainConfigContent}

              {canHaveHitl && !hasInternalAdvanced && (
                <div style={{ marginTop: 24 }}>
                  <CollapsibleSection title="Advanced Options">
                    {hitlSection}
                  </CollapsibleSection>
                </div>
              )}
            </>
          );
        })()}
      </div>
      <SkillGallery
        isOpen={skillGalleryOpen}
        onClose={() => setSkillGalleryOpen(false)}
      />
      {saveModalOpen && (
        <SaveTemplateModal
          agentConfig={data}
          onClose={() => setSaveModalOpen(false)}
          onSaved={() => {
            // Success feedback is handled inside the modal or via parent
          }}
        />
      )}
    </div>
  );
}
