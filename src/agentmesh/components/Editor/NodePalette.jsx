import React, { useState, useEffect } from 'react';
import { useWorkflowStore, useUIStore } from '../../store';
import {
  FiPlay, FiSquare, FiCpu, FiBox, FiGitMerge,
  FiTarget, FiShare2, FiBookOpen, FiLink,
  FiSearch, FiGlobe, FiClock, FiVolume2, FiRepeat, FiFileText, FiBell, FiAlertTriangle, FiZap, FiGitBranch, FiActivity, FiCheck, FiEdit, FiFilter, FiShield, FiCamera, FiLayers, FiInbox, FiDatabase, FiServer, FiDownload
} from 'react-icons/fi';

export const NODE_TYPES = [
  // Events & Triggers
  { type: 'webhook',    icon: FiGlobe,     label: 'Webhook',      desc: 'HTTP API Trigger',          bg: '#E0F2FE', color: '#0369A1', category: 'Events & Triggers' },
  { type: 'webhook_response', icon: FiShare2,  label: 'Webhook Response', desc: 'Custom Sync Response',    bg: '#E0F2FE', color: '#0369A1', category: 'Events & Triggers' },
  { type: 'cron',       icon: FiClock,     label: 'Cron',         desc: 'Scheduled Trigger',         bg: '#FEF3C7', color: '#B45309', category: 'Events & Triggers' },
  { type: 'polling',    icon: FiClock,     label: 'Polling Trigger', desc: 'Interval Poller Trigger',   bg: '#FDF2F8', color: '#DB2777', category: 'Events & Triggers' },
  { type: 'button_trigger', icon: FiZap,     label: 'Button',       desc: 'Manual UI Trigger',         bg: '#D1FAE5', color: '#059669', category: 'Events & Triggers' },

  
  // Autonomous Agents
  { type: 'llm_agent',  icon: FiCpu,       label: 'Agent',        desc: 'LLM-powered agent',         bg: '#C9DEFF', color: '#1A56DB', category: 'Autonomous Agents' },
  { type: 'deep_agent', icon: FiCpu,       label: 'Deep Agent',   desc: 'Autonomous Planning Agent', bg: '#E9D5FF', color: '#6B21A8', category: 'Autonomous Agents' },
  { type: 'supervisor', icon: FiTarget,    label: 'Supervisor',   desc: 'Orchestrates workers',      bg: '#C9F5E0', color: '#065F46', category: 'Autonomous Agents' },
  { type: 'swarm',      icon: FiShare2,    label: 'Swarm',        desc: 'Multi-agent handoff',       bg: '#FFD9EE', color: '#9D174D', category: 'Autonomous Agents' },
  { type: 'classification', icon: FiFilter, label: 'Classification Agent', desc: 'Classify data using LLM or Regex', bg: '#C9DEFF', color: '#1A56DB', category: 'Autonomous Agents' },
  
  // Knowledge & RAG
  { type: 'rag_node',   icon: FiBookOpen,  label: 'RAG',          desc: 'Knowledge retrieval',       bg: '#FFF3B8', color: '#92400E', category: 'Knowledge & RAG' },
  { type: 'ingestion_node', icon: FiBox,      label: 'Ingestion',    desc: 'Automated data indexing',   bg: '#E0F2FE', color: '#0EA5E9', category: 'Knowledge & RAG' },
  { type: 'ocr_node',       icon: FiCamera,   label: 'OCR Node',     desc: 'Extract text from images/PDF', bg: '#FDF2F8', color: '#DB2777', category: 'Knowledge & RAG' },

  // External Integrations
  { type: 'tool_node',  icon: FiBox,       label: 'Tool',         desc: 'Executes functions',        bg: '#FFE4B8', color: '#B45309', category: 'External Integrations' },
  { type: 'direct_tool', icon: FiBox,       label: 'Direct Tool',  desc: 'Runs a single tool directly', bg: '#FFF7ED', color: '#F97316', category: 'External Integrations' },
  { type: 'api_node',   icon: FiGlobe,     label: 'API Request',  desc: 'HTTP Request (GET, POST)',  bg: '#E0F2FE', color: '#0EA5E9', category: 'External Integrations' },
  
  // Logic & Routing
  { type: 'router',     icon: FiGitMerge,  label: 'Router',       desc: 'Conditional flow logic',    bg: '#E5D9FF', color: '#7C3AED', category: 'Logic & Routing' },
  { type: 'condition',  icon: FiActivity,  label: 'Condition (If)', desc: 'Binary If/Else gate',       bg: '#FEF3C7', color: '#D97706', category: 'Logic & Routing' },
  { type: 'switch',     icon: FiGitBranch, label: 'Switch',         desc: 'Multi-branch router',       bg: '#E0F2FE', color: '#0369A1', category: 'Logic & Routing' },
  
  // Flow Control
  { type: 'splitter',   icon: FiRepeat,    label: 'Splitter (Loop)', desc: 'Iterate over arrays/lists',  bg: '#FFF7ED', color: '#EA580C', category: 'Flow Control' },
  { type: 'aggregator', icon: FiLayers,    label: 'Aggregator',     desc: 'Collect loop results',      bg: '#E0F2FE', color: '#0369A1', category: 'Flow Control' },
  { type: 'wait',       icon: FiClock,     label: 'Wait',           desc: 'Pause workflow',            bg: '#F1F5F9', color: '#475569', category: 'Flow Control' },
  { type: 'join',       icon: FiCheck,     label: 'Join',           desc: 'Merge parallel paths',      bg: '#ECFDF5', color: '#059669', category: 'Flow Control' },
  { type: 'subgraph',   icon: FiLink,      label: 'Subgraph',     desc: 'Nested workflow',           bg: '#C9F5F5', color: '#065555', category: 'Flow Control' },
  { type: 'form_node',  icon: FiEdit,      label: 'Form Submission', desc: 'User input form',         bg: '#F5F3FF', color: '#7C3AED', category: 'Flow Control' },

  // Document Processing
  { type: 'template_node', icon: FiFileText,  label: 'Template Engine',   desc: 'Render Jinja/Markdown Templates',    bg: '#FDF2F8', color: '#DB2777', category: 'Document Processing' },
  { type: 'report_generator', icon: FiFileText,  label: 'Report Generator',   desc: 'Export data to PDF/Docx/Excel',    bg: '#E0E7FF', color: '#4338CA', category: 'Document Processing' },

  // Data & Storage
  { type: 'set_data',   icon: FiEdit,      label: 'Set Message',    desc: 'Static data/response',      bg: '#F5F3FF', color: '#7C3AED', category: 'Data & Storage' },
  { type: 'output_parser', icon: FiFilter,  label: 'Output Parser',  desc: 'Auto-fix malformed JSON',   bg: '#FEF3C7', color: '#D97706', category: 'Data & Storage' },
  { type: 'data_cleaning', icon: FiFilter,  label: 'Data Cleaning',  desc: 'Clean dataset and run Pandas scripts', bg: '#ECFDF5', color: '#059669', category: 'Data & Storage' },
  { type: 'network_graph', icon: FiDatabase, label: 'Network Graph', desc: 'Ingest into Neo4j graph database', bg: '#EFF6FF', color: '#1D4ED8', category: 'Data & Storage' },
  { type: 'file_store', icon: FiFileText,  label: 'File Store',   desc: 'Save data to CSV/Excel',    bg: '#ECFDF5', color: '#059669', category: 'Data & Storage' },
  { type: 'notification', icon: FiBell,     label: 'Notification', desc: 'In-app alert storage',      bg: '#F0F4FF', color: '#6366F1', category: 'Data & Storage' },
  
  // System & Debug
  { type: 'debug_node',  icon: FiActivity,  label: 'Debug Console',  desc: 'Inspect internal state',    bg: '#F1F5F9', color: '#475569', category: 'System & Debug' },
  { type: 'error_router', icon: FiAlertTriangle, label: 'Error Router', desc: 'Handles system failures', bg: '#FEE2E2', color: '#DC2626', category: 'System & Debug' },
  { type: 'pii_node',   icon: FiShield,    label: 'PII Masking',  desc: 'Redact sensitive data',     bg: '#FFEBEE', color: '#D32F2F', category: 'Security & Privacy' },
  { type: 'sensitivity_classifier', icon: FiShield,   label: 'Sensitivity Classifier', desc: 'Detects PII / PHI / PCI entities in text', bg: '#FEF3C7', color: '#B45309', category: 'Security & Privacy' },

  // Media Services
  { type: 'textToAudio', icon: FiVolume2,   label: 'Text to Audio', desc: 'Converts text to speech',   bg: '#FFE4E1', color: '#C71585', category: 'Media Services' },

  // Visual Organizers
  { type: 'cardboard',   icon: FiLayers,    label: 'Sticky Note',     desc: 'Visual container for canvas organization and notes', bg: '#F1F5F9', color: '#64748B', category: 'Visual Organizers' },

  // Banking
  { type: 'ingestion_adapter', icon: FiDownload,  label: 'Ingestion Adapter', desc: 'Converts raw inputs (ISO8583/XML/CSV/JSON) to Canonical Transaction Schema', bg: '#F5F3FF', color: '#7C3AED', category: 'Banking' },
  { type: 'banking_enrichment', icon: FiServer,   label: 'Banking Pre-Enrichment Node', desc: 'Orchestrates external & internal API data gathering.', bg: '#F5F3FF', color: '#7C3AED', category: 'Banking' },
  { type: 'beneficiary_risk', icon: FiGitBranch,   label: 'Beneficiary Risk Router', desc: 'Evaluates beneficiary (Mule, Age, Velocity) and routes workflow', bg: '#F5F3FF', color: '#7C3AED', category: 'Banking' },
  { type: 'rule_engine', icon: FiShield,    label: 'Rule Engine',    desc: 'Custom Python Rules & Scorecards', bg: '#FEE2E2', color: '#DC2626', category: 'Banking' },
];

export default function NodePalette({ onClose }) {
  const addNode = useWorkflowStore((s) => s.addNode);
  const setNodeData = useWorkflowStore((s) => s.setNodeData);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState({});

  const toggleCategory = (cat) => {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const allNodes = [...NODE_TYPES];

  const filteredNodes = allNodes.filter(n => 
    n.label.toLowerCase().includes(search.toLowerCase()) || 
    n.desc.toLowerCase().includes(search.toLowerCase())
  );
  const CATEGORY_ORDER = [
    'Banking',
    'Events & Triggers', 
    'Visual Organizers',
    'Autonomous Agents', 
    'Knowledge & RAG', 
    'External Integrations', 
    'Logic & Routing', 
    'Flow Control', 
    'Document Processing',
    'Data & Storage', 
    'Security & Privacy',
    'Media Services',
    'System & Debug'
  ];
  const categories = CATEGORY_ORDER.filter(cat => 
    filteredNodes.some(n => n.category === cat)
  );

  const handleDragStart = (e, n) => {
    e.dataTransfer.setData('application/agentmesh-node', n.type);
    if (n.isTemplate && n.config) {
       e.dataTransfer.setData('application/agentmesh-config', JSON.stringify(n.config));
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleAdd = (n) => {
    const id = addNode(n.type, { x: 200 + Math.random() * 300, y: 100 + Math.random() * 200 });
    if (n.isTemplate && n.config && id) {
       setNodeData(id, n.config);
    }
    onClose?.();
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'white', fontFamily: "'Google Sans','Roboto',sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Node library</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, marginBottom: 16 }}>Drag onto canvas or click to add</div>
        
        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes..."
            style={{
              width: '100%',
              padding: '9px 12px 9px 34px',
              background: '#F8F9FB',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'all 0.15s'
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.background = 'white'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = '#F8F9FB'; }}
          />
        </div>
      </div>

      {/* Node list grouped by category */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }} className="msg-scrollbar">
        {categories.map(category => {
          const categoryNodes = filteredNodes.filter(n => n.category === category);
          if (categoryNodes.length === 0) return null;
          
          const isCollapsed = collapsed[category];

          return (
            <div key={category} style={{ marginBottom: 8 }}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <div style={{ 
                  fontSize: 11, 
                  fontWeight: 800, 
                  letterSpacing: '0.05em', 
                  textTransform: 'uppercase', 
                  color: 'var(--text-muted)' 
                }}>
                  {category}
                </div>
                <div style={{ 
                  fontSize: 10, 
                  color: 'var(--text-muted)',
                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}>
                  ▼
                </div>
              </button>

              {/* Category Content */}
              {!isCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                  {categoryNodes.map((n) => {
                    const Icon = n.icon;
                    return (
                      <div
                        key={n.isTemplate ? `template_${n.label}` : n.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, n)}
                        onClick={() => handleAdd(n)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 12px', borderRadius: 8,
                          background: 'white', border: '1px solid transparent',
                          cursor: 'grab', transition: 'all 0.12s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.border = '1px solid var(--border)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.border = '1px solid transparent'; }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: n.bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, color: n.color,
                        }}>
                          <Icon size={16} strokeWidth={2} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{n.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{n.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        
        {filteredNodes.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>🔍</div>
            No nodes match your search
          </div>
        )}
      </div>
    </div>
  );
}
