import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflowStore, useUIStore, useRunStore } from '../../../store';
import { listMarketplaceUsecases, listWorkflowCategories, getWorkflow } from '../../../api/agentmesh';
import { FiUser, FiMessageSquare, FiInfo, FiTag, FiX, FiZap, FiBookOpen, FiLoader } from 'react-icons/fi';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import bannerImage from '../../../assets/data/Stack-p-2000.png';
import Pagination from '../../Common/Pagination';
import SwaggerUI from 'swagger-ui-react';
import LibraryHeader from '../../Common/LibraryHeader';
import 'swagger-ui-react/swagger-ui.css';

const PURPLE_THEME = {
  primary: 'var(--theme-primary)',
  bg: 'var(--bg-canvas)',
  accent: 'var(--theme-primary-glow)',
  border: 'var(--border)',
  text: 'var(--theme-primary)'
};

const generateOpenApiSpec = (workflow) => {
  const workflowId = workflow.id;
  const workflowName = workflow.name || "Workflow Agent";
  const workflowDesc = workflow.description || "Autonomous Agentic workflow execution API.";
  
  const serverUrl = window._env_?.VITE_AGENT_MESH || import.meta.env.VITE_AGENT_MESH || 'http://localhost:8000/api/v1/agentmesh';
  const cleanServerUrl = serverUrl.endsWith('/api/v1/agentmesh') ? serverUrl : `${serverUrl}/api/v1/agentmesh`;

  // Parse Form fields if any Form nodes exist in configuration
  const formSchemas = {};
  const config = workflow.config || {};
  const nodes = config.nodes || [];

  nodes.forEach(node => {
    if (node.type === 'form_node' && node.form_fields && node.form_fields.length > 0) {
      const properties = {};
      const required = [];
      node.form_fields.forEach(field => {
        if (field.enabled === false) return;
        const fieldName = field.id || field.name;
        properties[fieldName] = {
          type: field.type === 'number' ? 'number' : field.type === 'boolean' ? 'boolean' : 'string',
          description: field.label || field.placeholder || ""
        };
        if (field.required) {
          required.push(fieldName);
        }
      });
      formSchemas[node.id] = {
        type: 'object',
        properties: properties,
        required: required.length > 0 ? required : undefined,
        description: `Input parameters expected by the Form Node: "${node.label || node.id}"`
      };
    }
  });

  return {
    openapi: "3.0.3",
    info: {
      title: `${workflowName} API`,
      description: `${workflowDesc}\n\nUse this interactive Swagger specification to integrate and communicate with this workflow.`,
      version: `v${workflow.version || 1}`
    },
    servers: [
      {
        url: cleanServerUrl,
        description: "AgentMesh Engine Server"
      }
    ],
    paths: {
      [`/workflow/${workflowId}/execute`]: {
        post: {
          summary: "Execute or Resume Workflow",
          description: "Trigger standard workflow execution or resume a paused/interrupted workflow thread.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    input: {
                      type: "string",
                      description: "Initial prompt or input payload to pass to the workflow entry node.",
                      example: "Hello, run this workflow."
                    },
                    thread_id: {
                      type: "string",
                      description: "Unique conversation/session thread ID to maintain context.",
                      example: "session-12345"
                    },
                    mode: {
                      type: "string",
                      enum: ["run", "stream", "resume"],
                      default: "run",
                      description: "Execution mode. Use 'run' for standard response, 'stream' for SSE token streaming, or 'resume' to continue an interrupted workflow thread."
                    },
                    action: {
                      type: "string",
                      description: "For resume mode: Action to send to the paused node (e.g., 'approve', 'submit').",
                      example: "submit"
                    },
                    payload: {
                      type: "object",
                      description: "For resume mode: The key-value payload to feed back into the interrupted node. If resuming a Form node, pass fields matching the corresponding form schema.",
                      example: {}
                    }
                  },
                  required: ["input"]
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Workflow executed or resumed successfully.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: {
                        type: "string",
                        example: "success"
                      },
                      output: {
                        type: "string",
                        description: "The output produced by the workflow.",
                        example: "Here is the response..."
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      [`/workflow/${workflowId}/threads`]: {
        get: {
          summary: "List Threads",
          description: "Retrieve all active conversation thread IDs associated with this workflow.",
          responses: {
            "200": {
              description: "List of threads retrieved successfully."
            }
          }
        }
      },
      [`/workflow/${workflowId}/thread/{thread_id}`]: {
        get: {
          summary: "Get Thread State & History",
          description: "Fetch step-by-step execution history and inspect whether the workflow is currently paused or interrupted.",
          parameters: [
            {
              name: "thread_id",
              in: "path",
              required: true,
              schema: {
                type: "string"
              },
              description: "The ID of the thread context to retrieve."
            }
          ],
          responses: {
            "200": {
              description: "Thread history and state retrieved successfully.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "success" },
                      thread_id: { type: "string", example: "session-12345" },
                      is_paused: { type: "boolean", example: true, description: "Indicates if the workflow execution is currently halted / waiting for input." },
                      next_node: { type: "string", example: "form_node_1", description: "The ID of the node currently waiting for input." },
                      active_agent: { type: "string", example: "AgentAlpha" },
                      context: { type: "object", description: "The current global context dictionary." }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: formSchemas
    }
  };
};

function MarketplaceListRow({ w, onChat, onDetails, isRunning, idx, isLaunching }) {
  const theme = PURPLE_THEME;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.03 }}
      style={{
        background: 'white',
        border: `1px solid var(--border-light)`,
        borderRadius: 16,
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onClick={() => onDetails(w)}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.borderColor = '#E5E7EB';
        e.currentTarget.style.transform = 'translateX(4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--border-light)';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      {/* Accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'var(--theme-primary)' }} />

      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: theme.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        color: theme.primary,
        border: `1px solid ${theme.border}`
      }}>
        <FiUser size={22} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
          {w.name}
          {isRunning && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ECFDF5', padding: '2px 8px', borderRadius: 20, border: '1px solid #D1FAE5' }}>
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }}
              />
              <span style={{ fontSize: 10, color: '#065F46', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live</span>
            </div>
          )}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span title={`Group: ${w.group || 'Default'}`} style={{ display: 'flex', alignItems: 'center', gap: 4, color: theme.primary, fontWeight: 600, fontSize: 12 }}>
            {w.group || 'Default'}
          </span>
          <span title={`Category: ${w.category || 'General'}`} style={{ display: 'flex', alignItems: 'center', gap: 4, color: theme.primary, fontWeight: 600, fontSize: 12 }}>
            <FiTag size={12} /> {w.category || 'General'}
          </span>
          <span style={{ width: 1, height: 12, background: 'var(--border)' }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.description || 'No description provided for this specialized AI agent.'}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
        {/* Quick Launch Buttons for Agents List */}
        {((w.metadata?.trigger_type === 'button') ? [{ id: w.metadata.trigger_node_id, data: { button_label: w.metadata.button_label, button_input: w.metadata.button_input } }] : (w.config?.nodes || []).filter(n => n.type === 'button_trigger' || n.data?.type === 'button_trigger')).map(n => (
          <button
            key={n.id}
            onClick={async () => {
              const currentWfId = useWorkflowStore.getState().workflowId;
              if (currentWfId !== w.id) {
                useRunStore.getState().reset(); // Reset only if switching agents
              }
              let fullWorkflow = w;
              if (!w.config) {
                try {
                  fullWorkflow = await getWorkflow(w.id);
                } catch (err) {
                  console.error(err);
                  alert("Failed to load workflow details: " + err.message);
                  return;
                }
              }
              useWorkflowStore.getState().loadWorkflowIntoEditor(fullWorkflow);
              const ui = useUIStore.getState();
              ui.setTargetNodeId(n.id);
              ui.setInitialRunInput(n.data?.button_input || 'Start');
              ui.setRunOpen(true);
            }}
            style={{
              height: 32, padding: '0 12px', borderRadius: 8, background: 'var(--theme-primary-glow)', border: 'none',
              color: 'var(--theme-primary)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-primary)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--theme-primary-glow)'; e.currentTarget.style.color = 'var(--theme-primary)'; }}
          >
            <FiZap size={14} /> {n.data?.button_label || n.data?.label || 'Run'}
          </button>
        ))}
        <button
          onClick={() => onChat(w)}
          disabled={isLaunching}
          className="h-8 px-3.5 border-none rounded-lg bg-[var(--theme-primary)] text-white hover:brightness-110 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 text-[11px] font-bold"
        >
          {isLaunching ? <FiLoader className="animate-spin" size={16} /> : <FiMessageSquare size={16} />} {isLaunching ? 'Launching...' : 'Launch'}
        </button>
        <button
          onClick={() => onDetails(w)}
          style={{
            height: 32, border: '1px solid var(--border-light)', borderRadius: 8,
            background: 'white', color: 'var(--text-secondary)', padding: '0 12px', display: 'flex', alignItems: 'center',
            gap: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = 'var(--border-light)'; }}
        >
          <FiInfo size={14} /> Details
        </button>
      </div>
    </motion.div>
  );
}


function MarketplaceCard({ w, onChat, onDetails, isRunning, idx, isLaunching }) {
  const theme = PURPLE_THEME;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.23, 1, 0.32, 1] }}
      style={{
        background: 'white',
        border: `1px solid var(--border-light)`,
        borderRadius: 24,
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        height: '100%',
      }}
      onClick={() => onDetails(w)}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.borderColor = '#E5E7EB';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.borderColor = 'var(--border-light)';
      }}
    >

      <div style={{ padding: '20px 20px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: theme.bg,
            border: `1px solid ${theme.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: theme.primary,
            boxShadow: '0 4px 12px -2px var(--theme-primary-glow)',
            flexShrink: 0
          }}>
            <FiUser size={22} strokeWidth={2} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <h3 style={{
                fontSize: 16, fontWeight: 800, color: 'var(--text-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                letterSpacing: '-0.02em', margin: 0, flex: 1
              }}>
                {w.name}
              </h3>
              {isRunning && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#ECFDF5', padding: '3px 8px', borderRadius: 20, border: '1px solid #D1FAE5', flexShrink: 0, marginLeft: 8 }}>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }}
                  />
                  <span style={{ fontSize: 9, color: '#065F46', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span title={`Group: ${w.group || 'Default'}`} style={{
                fontSize: 10, color: theme.primary, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                background: theme.bg, padding: '1px 6px', borderRadius: 4
              }}>
                {w.group || 'Default'}
              </span>
              <span title={`Category: ${w.category || 'General'}`} style={{
                fontSize: 10, color: theme.primary, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                background: theme.bg, padding: '1px 6px', borderRadius: 4
              }}>
                {w.category || 'General'}
              </span>
            </div>
          </div>
        </div>

        <p style={{
          fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          marginBottom: 12
        }}>
          {w.description || "Deploy this agent for complex task orchestration and real-time processing."}
        </p>
      </div>

      <div style={{
        padding: '12px 16px',
        background: '#F9FAFB',
        borderTop: '1px solid #F3F4F6',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Quick Launch Buttons for Agents Card */}
          {((w.metadata?.trigger_type === 'button') ? [{ id: w.metadata.trigger_node_id, data: { button_label: w.metadata.button_label, button_input: w.metadata.button_input } }] : (w.config?.nodes || []).filter(n => n.type === 'button_trigger' || n.data?.type === 'button_trigger')).map(n => (
            <button
              key={n.id}
              onClick={async (e) => {
                e.stopPropagation();
                const currentWfId = useWorkflowStore.getState().workflowId;
                if (currentWfId !== w.id) {
                  useRunStore.getState().reset(); // Reset only if switching agents
                }
                let fullWorkflow = w;
                if (!w.config) {
                  try {
                    fullWorkflow = await getWorkflow(w.id);
                  } catch (err) {
                    console.error(err);
                    alert("Failed to load workflow details: " + err.message);
                    return;
                  }
                }
                useWorkflowStore.getState().loadWorkflowIntoEditor(fullWorkflow);
                const ui = useUIStore.getState();
                ui.setTargetNodeId(n.id);
                ui.setInitialRunInput(n.data?.button_input || 'Start');
                ui.setRunOpen(true);
              }}
              style={{
                height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid var(--theme-primary-glow)',
                background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--theme-primary)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--theme-primary-glow)'; e.currentTarget.style.color = 'var(--theme-primary)'; }}
            >
              <FiZap size={13} /> {n.data?.button_label || n.data?.label || 'Run'}
            </button>
          ))}
          <button
            onClick={(e) => { e.stopPropagation(); onChat(w); }}
            disabled={isLaunching}
            className="h-9 px-4 rounded-lg border border-[var(--theme-primary-glow)] bg-[var(--theme-primary-glow)] text-[var(--theme-primary)] hover:bg-[var(--theme-primary)] hover:text-white transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-[11px] font-extrabold"
          >
            {isLaunching ? <FiLoader className="animate-spin" size={14} /> : <FiMessageSquare size={14} />} {isLaunching ? 'Launching...' : 'Launch'}
          </button>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onDetails(w); }}
          style={{
            height: 36, width: 36, borderRadius: 8, border: '1px solid #E5E7EB',
            background: 'white', color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
          title="More Details"
          onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
        >
          <FiInfo size={18} />
        </button>
      </div>
    </motion.div>
  );
}

export default function MarketplacePage() {
  const navigate = useNavigate();
  const { workflows, setWorkflows, loadWorkflowIntoEditor } = useWorkflowStore();
  const { setRunOpen } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [launchingId, setLaunchingId] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const [search, setSearch] = useState('');
  // const [searchOpen, setSearchOpen] = useState(false);
  // const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('All');
  const [selectedTagFilter, setSelectedTagFilter] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [groups, setGroups] = useState(['All']);

  // const searchInputRef = useRef(null);
  // const filterPanelRef = useRef(null);
  const containerRef = useRef(null);
  const { scrollY } = useScroll({ container: containerRef });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalWorkflows, setTotalWorkflows] = useState(0);
  const totalPages = Math.ceil(totalWorkflows / pageSize);

  // ⚡ Parallax Effects
  const bannerBgY = useTransform(scrollY, [0, 400], [0, 120]);
  const bannerScale = useTransform(scrollY, [0, 400], [1, 1.3]);
  const bannerOpacity = useTransform(scrollY, [0, 300], [0.12, 0.05]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await listMarketplaceUsecases({
        page: currentPage,
        limit: pageSize,
        search,
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        group: selectedGroupFilter === 'All' ? undefined : selectedGroupFilter,
        tag: selectedTagFilter === 'All' ? undefined : selectedTagFilter
      });
      setWorkflows(r.workflows || []);
      setTotalWorkflows(r.total || 0);

      // Also load categories for filter if not already loaded or to keep fresh
      const catRes = await listWorkflowCategories();
      if (catRes.status === 'success') {
        const uniqueGroups = Array.from(new Set(r.workflows.map(w => w.group || 'Default')));
        setGroups(['All', ...uniqueGroups]);
        setCategories(['All', ...catRes.categories.map(c => typeof c === 'string' ? c : c.name)]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    load();
  }, [search, selectedCategory, selectedGroupFilter, selectedTagFilter, currentPage]);

  // Reset page strictly when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedGroupFilter, selectedTagFilter]);

  // Cleaned up old filter/search handlers (now managed inside LibraryHeader)

  const [swaggerWorkflow, setSwaggerWorkflow] = useState(null);

  const handleChat = async (w) => {
    if (w.launch_mode === 'navigation' && w.navigation_path) {
      navigate(w.navigation_path, { state: { fromMarketplace: true, usecaseName: w.name } });
      return;
    }
    if (w.launch_url === 'swagger') {
      setLaunchingId(w.id);
      let fullWorkflow = w;
      if (!w.config) {
        try {
          fullWorkflow = await getWorkflow(w.id);
        } catch (err) {
          console.error(err);
          alert("Failed to load workflow details: " + err.message);
          setLaunchingId(null);
          return;
        }
      }
      setSwaggerWorkflow(fullWorkflow);
      setLaunchingId(null);
      return;
    }
    if (w.launch_url) {
      window.open(w.launch_url, '_blank', 'noopener,noreferrer');
      return;
    }
    setLaunchingId(w.id);
    const currentWfId = useWorkflowStore.getState().workflowId;
    if (currentWfId !== w.id) {
      useRunStore.getState().reset(); // Reset only if switching agents
    }
    let fullWorkflow = w;
    if (!w.config) {
      try {
        fullWorkflow = await getWorkflow(w.id);
      } catch (err) {
        console.error(err);
        alert("Failed to load workflow details: " + err.message);
        setLaunchingId(null);
        return;
      }
    }
    loadWorkflowIntoEditor(fullWorkflow);
    setRunOpen(true);
    setLaunchingId(null);
  };

  const [selectedAgent, setSelectedAgent] = useState(null);

  const handleDetails = (w) => {
    setSelectedAgent(w);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* ── Details Modal ── */}
      <AnimatePresence>
        {selectedAgent && (
          <MarketplaceDetailsModal
            agent={selectedAgent}
            onClose={() => setSelectedAgent(null)}
            onChat={() => { handleChat(selectedAgent); setSelectedAgent(null); }}
            onSwagger={async () => {
              let fullWorkflow = selectedAgent;
              if (!selectedAgent.config) {
                try {
                  fullWorkflow = await getWorkflow(selectedAgent.id);
                } catch (err) {
                  console.error(err);
                  alert("Failed to load workflow details: " + err.message);
                  return;
                }
              }
              setSwaggerWorkflow(fullWorkflow);
              setSelectedAgent(null);
            }}
            onEdit={async () => {
              let fullWorkflow = selectedAgent;
              if (!selectedAgent.config) {
                try {
                  fullWorkflow = await getWorkflow(selectedAgent.id);
                } catch (err) {
                  console.error(err);
                  alert("Failed to load workflow details: " + err.message);
                  return;
                }
              }
              loadWorkflowIntoEditor(fullWorkflow);
              useUIStore.getState().setActivePage('canvas');
              setSelectedAgent(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Swagger UI Modal ── */}
      <AnimatePresence>
        {swaggerWorkflow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1100,
              background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px'
            }}
            onClick={() => setSwaggerWorkflow(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              style={{
                width: '100%', maxWidth: '1000px', height: '80vh', background: 'white',
                borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 30px 60px rgba(0,0,0,0.2)'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{
                padding: '20px 32px', borderBottom: '1px solid #E2E8F0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#F8FAFC'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1E293B' }}>
                    {swaggerWorkflow.name} API Documentation
                  </h3>
                </div>
                <button
                  onClick={() => setSwaggerWorkflow(null)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#94A3B8', padding: 6, borderRadius: '50%', display: 'flex',
                    alignItems: 'center', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <FiX size={20} />
                </button>
              </div>
              
              {/* Swagger Spec Container */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }} className="swagger-spec-container">
                <SwaggerUI spec={generateOpenApiSpec(swaggerWorkflow)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <LibraryHeader
        title="Marketplace"
        description="Explore community-built agents, tools, and workflows ready to deploy directly into your workspace."
        search={search}
        onSearchChange={setSearch}
        placeholder="Search Marketplace..."
        groups={groups}
        selectedGroup={selectedGroupFilter}
        onGroupChange={setSelectedGroupFilter}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        tags={['All', 'top 10', 'trending', 'hot']}
        selectedTag={selectedTagFilter}
        onTagChange={setSelectedTagFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div
        ref={containerRef}
        style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column' }}
      >
        {/* ── Agent Banner ── */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '240px',
          background: 'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)',
          borderRadius: '24px',
          marginBottom: '40px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 50px rgba(76, 29, 149, 0.15)',
          border: '1px solid rgba(142, 119, 187, 0.2)'
        }}>
          {/* Decorative Image */}
          <motion.img
            src={bannerImage}
            alt="Mesh Stack"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: bannerOpacity,
              pointerEvents: 'none',
              filter: 'hue-rotate(235deg) saturate(2) brightness(1.2)',
              scale: bannerScale,
              y: bannerBgY
            }}
          />

          <div style={{
            position: 'absolute',
            left: '30%',
            top: '-20%',
            width: '60%',
            height: '100%',
            background: 'radial-gradient(circle, rgba(142, 119, 187, 0.2) 0%, transparent 70%)',
            opacity: 0.6,
            filter: 'blur(80px)'
          }} />

          {/* Banner Content */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: '44px',
              fontWeight: 900,
              color: 'white',
              margin: 0,
              letterSpacing: '-0.04em',
              zIndex: 2,
              textAlign: 'center',
              textShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          >
            Specialized Marketplace Mesh
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              position: 'absolute',
              bottom: '24px',
              fontSize: '13px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              zIndex: 2,
              opacity: 0.9,
              background: 'rgba(255,255,255,0.1)',
              padding: '6px 16px',
              borderRadius: '20px',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            Orchestrate High-Performance Autonomous Intelligence
          </motion.div>
        </div>

        {loading && <div style={{ textAlign: 'center', marginTop: 40 }}><div className="loading-spinner" /></div>}

        {!loading && workflows.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            color: '#6B7280'
          }}>
            <FiUser size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 600 }}>No items found in marketplace</div>
            <div style={{ fontSize: 14 }}>Try adjusting your search or create a new agent from the canvas.</div>
          </div>
        )}

        {!loading && workflows.length > 0 && (
          viewMode === 'cards' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
              {workflows.map((w, i) => (
                <MarketplaceCard key={w.id} w={w} idx={i} onChat={handleChat} onDetails={handleDetails} isRunning={false} isLaunching={launchingId === w.id} />
              ))}


            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {workflows.map((w, i) => (
                <MarketplaceListRow key={w.id} w={w} idx={i} onChat={handleChat} onDetails={handleDetails} isRunning={false} isLaunching={launchingId === w.id} />
              ))}
            </div>
          )
        )}

        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      </div>
    </div>
  );
}

function MarketplaceDetailsModal({ agent, onClose, onChat, onEdit, onSwagger }) {
  const [copied, setCopied] = useState(false);
  const theme = PURPLE_THEME;

  const handleCopy = () => {
    navigator.clipboard.writeText(agent.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          width: '100%', maxWidth: 580, background: 'white', borderRadius: 32,
          overflow: 'hidden', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column', position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* Header Visual */}
        <div style={{ height: 160, background: `linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)`, position: 'relative', zIndex: 1, overflow: 'hidden' }}>
          {/* Banner Image Background */}
          <img
            src={bannerImage}
            alt="Mesh Stack"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.3,
              pointerEvents: 'none',
              filter: 'hue-rotate(235deg) saturate(2) brightness(1.2)',
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(30, 27, 75, 0.2), rgba(30, 27, 75, 0.6))',
            pointerEvents: 'none'
          }} />

          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 20, right: 20, width: 36, height: 36,
              borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none',
              color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', backdropFilter: 'blur(4px)', transition: 'all 0.2s',
              zIndex: 2
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            <FiX size={20} />
          </button>
        </div>

        <div style={{ padding: '32px 32px 32px', zIndex: 1, maxHeight: '65vh', overflowY: 'auto' }}>
          {/* App Store Style Header Row */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 24 }}>
            {/* App Icon */}
            <div style={{
              width: 96, height: 96, borderRadius: 22,
              background: `linear-gradient(135deg, ${theme.primary} 0%, #1e1b4b 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', boxShadow: '0 12px 24px -6px rgba(76, 29, 149, 0.3)',
              border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0
            }}>
              <FiUser size={48} />
            </div>

            {/* Title & Metadata */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', margin: '0 0 4px 0', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {agent.name}
              </h2>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#10B981', marginBottom: 6 }}>
                {agent.group || 'Default Group'}
              </div>
              <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>
                {agent.category || 'General'} Usecase
              </div>
            </div>
          </div>

          {/* Horizontal Stats Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #f1f5f9',
            borderBottom: '1px solid #f1f5f9',
            padding: '16px 0',
            marginBottom: 28
          }}>
            {/* Stat 2: Active status */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
                Active
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 650, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                Availability
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 28, background: '#e2e8f0' }} />

            {/* Stat 3: Version */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                border: '1.5px solid #475569',
                borderRadius: 6,
                padding: '2px 6px',
                fontSize: 11,
                fontWeight: 800,
                color: '#475569',
                lineHeight: 1
              }}>
                V{agent.version || 1}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 650, marginTop: 7, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                Version
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Capabilities & Context</div>
            <div style={{ fontSize: 16, color: '#475569', lineHeight: 1.7, fontWeight: 400 }}>
              {agent.description || "Deploy this advanced autonomous agent into your workflow for complex orchestration, real-time data processing, and multi-step reasoning tasks."}
            </div>
          </div>

          {/* Release Dates Row */}
          <div style={{ display: 'flex', gap: 24, fontSize: 12, color: '#64748B', marginBottom: 36, background: '#f8fafc', padding: '12px 20px', borderRadius: 14, border: '1px solid #f1f5f9' }}>
            <div>
              <span style={{ fontWeight: 700, color: '#475569' }}>Released: </span>
              {agent.created_at ? new Date(agent.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
            </div>
            <div style={{ width: 1, height: 16, background: '#cbd5e1', alignSelf: 'center' }} />
            <div>
              <span style={{ fontWeight: 700, color: '#475569' }}>Updated: </span>
              {agent.updated_at ? new Date(agent.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onChat}
              style={{
                flex: 1.5, height: 44, borderRadius: 12, background: 'var(--theme-primary-glow)',
                color: 'var(--theme-primary)', border: '1px solid var(--theme-primary-glow)', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all 0.3s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-primary)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--theme-primary-glow)'; e.currentTarget.style.color = 'var(--theme-primary)'; }}
            >
              <FiMessageSquare size={18} /> Launch Agent
            </button>
            <button
              onClick={onSwagger}
              style={{
                flex: 1, height: 44, borderRadius: 12, background: 'white',
                color: theme.primary, border: '1px solid #e2e8f0', fontWeight: 800, fontSize: 13,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 10, transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = theme.bg; e.currentTarget.style.borderColor = theme.primary; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <FiBookOpen size={18} /> Swagger Spec
            </button>
            <button
              onClick={onEdit}
              style={{
                flex: 1, height: 44, borderRadius: 12, background: 'white',
                color: '#1e293b', border: '1px solid #e2e8f0', fontWeight: 800, fontSize: 13,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 10, transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <FiGrid size={18} /> Configure
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
