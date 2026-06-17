import React, { memo, useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { useUIStore, useWorkflowStore } from '../../../store';
import {
  FiPlay, FiSquare, FiCpu, FiBox, FiGitMerge,
  FiTarget, FiShare2, FiBookOpen, FiLink, FiZap,
  FiSearch, FiGlobe, FiClock, FiVolume2, FiRepeat, FiFileText, FiBell, FiUser, FiAlertTriangle,
  FiLayers, FiGitBranch, FiActivity, FiCheck, FiEdit, FiFilter, FiShield, FiCamera, FiDownload, FiDatabase, FiInbox, FiServer,
  FiHelpCircle, FiCode, FiSliders
} from 'react-icons/fi';

const NODE_CONFIGS = {
  start: { bg: '#F8F9FA', color: '#10B981', icon: FiPlay, round: 12, fill: true, small: true },
  end: { bg: '#F8F9FA', color: '#EF4444', icon: FiSquare, round: 12, small: true },
  llm_agent: { bg: '#F0F7FF', color: '#3B82F6', icon: FiCpu, round: 16 },
  deep_agent: { bg: '#F5F3FF', color: '#8B5CF6', icon: FiCpu, round: 16 },
  classification: { bg: '#C9DEFF', color: '#1A56DB', icon: FiFilter, round: 16 },
  tool_node: { bg: '#FFF7ED', color: '#F97316', icon: FiBox, round: 14 },
  direct_tool: { bg: '#FFF7ED', color: '#F97316', icon: FiBox, round: 14 },
  button_trigger: { bg: '#D1FAE5', color: '#059669', icon: FiZap, round: 14 },
  auto_trigger: { bg: '#D1FAE5', color: '#059669', icon: FiPlay, round: 14 },
  splitter: { bg: '#FFF7ED', color: '#EA580C', icon: FiRepeat, round: 14 },
  router: { bg: '#F5F3FF', color: '#8B5CF6', icon: FiGitMerge, round: 14 },
  supervisor: { bg: '#ECFDF5', color: '#10B981', icon: FiTarget, round: 14 },
  swarm: { bg: '#FDF2F8', color: '#EC4899', icon: FiShare2, round: 14 },
  rag_node: { bg: '#FFFBEB', color: '#F59E0B', icon: FiBookOpen, round: 14 },
  ingestion_node: { bg: '#F0F9FF', color: '#0EA5E9', icon: FiBox, round: 14 },
  ingestion_adapter: { bg: '#F5F3FF', color: '#7C3AED', icon: FiInbox, round: 14 },
  banking_enrichment: { bg: '#F5F3FF', color: '#7C3AED', icon: FiServer, round: 14 },
  beneficiary_risk: { bg: '#FEF2F2', color: '#EF4444', icon: FiGitBranch, round: 14 },
  ocr_node: { bg: '#FDF2F8', color: '#DB2777', icon: FiCamera, round: 14 },
  subgraph: { bg: '#F0FDFA', color: '#14B8A6', icon: FiLink, round: 14 },
  guardrail: { bg: '#FEFCE8', color: '#EAB308', icon: FiSearch, round: 14 },
  webhook: { bg: '#E0F2FE', color: '#0EA5E9', icon: FiGlobe, round: 14 },
  cron: { bg: '#FEF3C7', color: '#B45309', icon: FiClock, round: 14 },
  polling: { bg: '#FDF2F8', color: '#DB2777', icon: FiClock, round: 14 },
  api_node: { bg: '#E0F2FE', color: '#0EA5E9', icon: FiGlobe, round: 14 },
  condition: { bg: '#FFFBEB', color: '#D97706', icon: FiHelpCircle, round: 14 },
  switch: { bg: '#E0F2FE', color: '#0369A1', icon: FiGitBranch, round: 14 },
  wait: { bg: '#F1F5F9', color: '#475569', icon: FiClock, round: 14 },
  join: { bg: '#ECFDF5', color: '#059669', icon: FiCheck, round: 14 },
  textToAudio: { bg: '#FFE4E1', color: '#C71585', icon: FiVolume2, round: 14 },
  file_store: { bg: '#ECFDF5', color: '#059669', icon: FiFileText, round: 14 },
  notification: { bg: '#F0F4FF', color: '#6366F1', icon: FiBell, round: 14 },
  set_data: { bg: '#F5F3FF', color: '#7C3AED', icon: FiEdit, round: 16 },
  form_node: { bg: '#F5F3FF', color: '#7C3AED', icon: FiEdit, round: 16 },
  template_node: { bg: '#FDF2F8', color: '#DB2777', icon: FiFileText, round: 14 },
  report_generator: { bg: '#E0E7FF', color: '#4338CA', icon: FiFileText, round: 14 },
  error_router: { bg: '#FEF2F2', color: '#DC2626', icon: FiAlertTriangle, round: 14 },
  output_parser: { bg: '#FEF3C7', color: '#D97706', icon: FiFilter, round: 14 },
  json_transform: { bg: '#F5F3FF', color: '#7C3AED', icon: FiCode, round: 14 },
  json_transform_va: { bg: '#E0F2FE', color: '#0369A1', icon: FiCode, round: 14 },
  pii_node: { bg: '#FFEBEE', color: '#D32F2F', icon: FiShield, round: 14 },
  data_cleaning: { bg: '#ECFDF5', color: '#059669', icon: FiFilter, round: 14 },
  network_graph: { bg: '#EFF6FF', color: '#1D4ED8', icon: FiDatabase, round: 14 },
  sensitivity_classifier: { bg: '#FEF3C7', color: '#B45309', icon: FiShield, round: 14 },
  rule_engine: { bg: '#FEE2E2', color: '#DC2626', icon: FiShield, round: 14 },
  weightage: { bg: '#E0F2FE', color: '#0369A1', icon: FiSliders, round: 14 },
  aggregator: { bg: '#F0F9FF', color: '#0EA5E9', icon: FiLayers, round: 14 },
  webhook_response: { bg: '#E0F2FE', color: '#0369A1', icon: FiShare2, round: 14 },
  debug_node:    { bg: '#F1F5F9', color: '#475569', icon: FiActivity, round: 14 },
  pattern_extract: { bg: '#FDF2F8', color: '#DB2777', icon: FiSearch, round: 14 },
  cd_postprocessor: { bg: '#F5F3FF', color: '#6B21A8', icon: FiLayers, round: 14 },
  cd_document_router: { bg: '#ECFDF5', color: '#059669', icon: FiGitMerge, round: 14 },
  ingestion_router: { bg: '#C9F5E0', color: '#065F46', icon: FiLayers, round: 14 },
  event_emitter: { bg: '#E0F2FE', color: '#0369A1', icon: FiGlobe, round: 14 }
};

const logicRowStyle = {
  padding: '6px 12px',
  background: '#F9FAFB',
  borderRadius: 8,
  display: 'flex',
  justifyContent: 'flex-end', // Right-align labels as per image
  alignItems: 'center',
  position: 'relative',
  border: '1px solid #F1F5F9',
  minHeight: 32,
  marginBottom: 4,
  transition: 'all 0.2s ease'
};

const logicHandleStyle = (color, size = 10) => ({
  width: size,
  height: size,
  border: '2.5px solid white',
  background: color,
  position: 'absolute',
  right: - (size / 2 + 12),
  top: '50%',
  transform: 'translateY(-50%)',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  zIndex: 100
});

const SuggestionButton = ({ nodeId, handleId, color, hovered, isLogic = false }) => {
  const setSuggestionSource = useUIStore((s) => s.setSuggestionSource);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  if (!hovered) return null;
  return (
    <div 
      style={{
        position: 'absolute',
        left: isLogic ? 'calc(100% + 12px)' : '100%',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        alignItems: 'center',
        pointerEvents: 'auto',
        zIndex: 1000,
        padding: '10px 0',
      }}
    >
      <div style={{ width: isLogic ? 18 : 28, height: 20, display: 'flex', alignItems: 'center', background: 'transparent', cursor: 'default' }}>
        <div style={{ width: '100%', height: 1.5, backgroundColor: '#CBD5E1' }} />
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setSuggestionSource({ nodeId, handleId });
          setSearchOpen(true);
        }}
        style={{
          width: isLogic ? 18 : 20,
          height: isLogic ? 18 : 20,
          borderRadius: '50%',
          border: '1.5px solid #CBD5E1',
          background: '#FFFFFF',
          color: '#64748B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: isLogic ? 12 : 14,
          fontWeight: 600,
          pointerEvents: 'auto',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'all 0.15s ease',
          padding: 0,
          lineHeight: 1
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.borderColor = color || 'var(--theme-primary, #8e77bb)';
          e.currentTarget.style.color = color || 'var(--theme-primary, #8e77bb)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.borderColor = '#CBD5E1';
          e.currentTarget.style.color = '#64748B';
        }}
      >
        +
      </button>
    </div>
  );
};

function AgentNode({ id, data, selected }) {
  const actualType = data.type || 'llm_agent';
  const config = NODE_CONFIGS[actualType] || NODE_CONFIGS.llm_agent;
  const setSelectedNode = useUIStore((s) => s.setSelectedNode);
  const setSuggestionSource = useUIStore((s) => s.setSuggestionSource);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const canvasHandleSize = useUIStore((s) => s.canvasHandleSize || 10);
  const canvasNodeTheme = useUIStore((s) => s.canvasNodeTheme || 'modern');
  const { nodes, edges } = useWorkflowStore();
  const { updateNodeData } = useReactFlow();
  const [hovered, setHovered] = useState(false);

  const Icon = config.icon || FiCpu;

  const isStart = actualType === 'start';
  const isEnd = actualType === 'end';

  // State Logic Memberships
  const isSwarmMember = nodes.some(n =>
    n.data?.type === 'swarm' &&
    (n.data?.member_ids || []).includes(id)
  );

  // Detect Parallel Execution: Only for Agents/Swarms/Deep Agents
  const isAgentClass = ['llm_agent', 'deep_agent', 'swarm', 'supervisor'].includes(actualType);
  const incomingEdges = edges.filter(e => e.target === id);
  const isParallel = isAgentClass && incomingEdges.some(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    if (!sourceNode) return false;

    // Routers generally don't run branches in parallel, they select one.
    // Swarm nodes also hand off sequentially.
    if (sourceNode.data?.type === 'router' || sourceNode.data?.type === 'swarm') return false;

    // Find all outgoing edges from the same source that are NOT tool edges or error edges
    const siblings = edges.filter(oe =>
      oe.source === edge.source &&
      !nodes.find(n => n.id === oe.target)?.data?.type?.includes('tool') &&
      !nodes.find(n => n.id === oe.target)?.data?.type?.includes('error')
    );
    return siblings.length > 1;
  });

  const isLogicNode = ['condition', 'switch', 'splitter', 'error_router', 'beneficiary_risk'].includes(actualType);

  const getLogicRowStyle = (isActive, activeType) => {
    if (isActive) {
      if (activeType === 'known_fraudster') return { ...logicRowStyle, cursor: 'pointer', background: '#FEF2F2', border: '1px solid #FECACA' };
      if (activeType === 'new_beneficiary') return { ...logicRowStyle, cursor: 'pointer', background: '#FEFCE8', border: '1px solid #FEF08A' };
      if (activeType === 'safe') return { ...logicRowStyle, cursor: 'pointer', background: '#ECFDF5', border: '1px solid #A7F3D0' };
    }
    return {
      ...logicRowStyle,
      background: canvasNodeTheme === 'flat' ? 'white' : '#F9FAFB',
      border: canvasNodeTheme === 'flat' ? '1px solid rgba(0,0,0,0.05)' : '1px solid #F1F5F9'
    };
  };

  return (
    <div
      onClick={(e) => { e.stopPropagation(); setSelectedNode(id); updateNodeData(id, { active_branch_selection: null }); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={data.isRunning ? "node-active-running" : ""}
      style={{
        minWidth: isLogicNode ? 220 : config.small ? 100 : 180,
        background: canvasNodeTheme === 'flat' ? config.bg : 'white',
        border: canvasNodeTheme === 'border'
          ? (selected ? '2.5px solid var(--theme-primary, #8e77bb)' : hovered ? '1.5px solid var(--theme-primary, #8e77bb)' : '1.5px solid #CBD5E1')
          : canvasNodeTheme === 'flat'
            ? (selected ? `2.5px solid ${config.color}` : `1px solid ${config.color}50`)
            : (selected ? '1.5px solid var(--theme-primary, #3B82F6)' : '1px solid rgba(0,0,0,0.08)'),
        borderRadius: config.round,
        boxShadow: canvasNodeTheme === 'flat' || canvasNodeTheme === 'border'
          ? 'none'
          : selected
            ? '0 0 0 3px rgba(59, 130, 246, 0.25), 0 10px 20px -5px rgba(0, 0, 0, 0.15)'
            : hovered ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.025)',
        transform: (canvasNodeTheme === 'flat' || canvasNodeTheme === 'border') ? 'none' : (hovered ? 'translateY(-2px)' : 'none'),
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        padding: isLogicNode ? 0 : '10px 14px',
        display: 'flex',
        flexDirection: isLogicNode ? 'column' : 'row',
        alignItems: isLogicNode ? 'stretch' : 'center',
        gap: isLogicNode ? 0 : 12,
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
        // Critical Fix: Remove overflow hidden to prevent badge/handle cropping
        overflow: 'visible'
      }}
    >
      {/* ── HEADER (FOR LOGIC NODES) ── */}
      {isLogicNode && (
        <div style={{
          padding: '10px 14px',
          background: config.bg,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: canvasNodeTheme === 'border' ? `1.5px solid #CBD5E1` : '1px solid #F1F5F9',
          borderTopLeftRadius: config.round - 1,
          borderTopRightRadius: config.round - 1
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 5px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.02)'
          }}>
            <Icon size={16} color={config.color} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            {config.label || actualType.toUpperCase()}
          </span>
        </div>
      )}

      {/* ── SHARED INPUT TARGET ── */}
      {!isStart && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ width: canvasHandleSize, height: canvasHandleSize, border: '2px solid white', background: '#94A3B8', left: -(canvasHandleSize / 2), top: isLogicNode ? 62 : '50%', transform: 'translateY(-50%)', zIndex: 100 }}
        />
      )}

      {/* ── MAIN BODY ── */}
      {!isLogicNode ? (
        <>
          {/* STANDARD AGENT DESIGN */}
          <div style={{
            width: config.small ? 32 : 40,
            height: config.small ? 32 : 40,
            borderRadius: config.round - 4,
            background: (canvasNodeTheme === 'border' || canvasNodeTheme === 'flat') ? 'white' : config.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: (canvasNodeTheme === 'flat' || canvasNodeTheme === 'border')
              ? 'none'
              : 'inset 0 2px 4px rgba(255, 255, 255, 0.5), inset 0 -2px 4px rgba(0,0,0,0.02), 0 2px 5px rgba(0,0,0,0.05)',
            border: canvasNodeTheme === 'border'
              ? `1.5px solid ${config.color}`
              : canvasNodeTheme === 'flat'
                ? `1px solid ${config.color}30`
                : '1px solid rgba(0,0,0,0.03)'
          }}>
            <Icon size={config.small ? 14 : 20} color={config.color} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
            <span style={{
              fontSize: config.small ? 12 : 14,
              fontWeight: 700,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              lineHeight: 1.2
            }}>
              {data.label || id}
            </span>
            {!config.small && (
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                color: canvasNodeTheme === 'flat' ? `${config.color}ee` : '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: 2
              }}>
                {(data.active_agent || config.label || actualType).replace(/_/g, ' ')}
              </span>
            )}
          </div>

          {!isEnd && actualType !== 'tool_node' && (
            <>
              <Handle
                type="source"
                position={Position.Right}
                style={{ width: canvasHandleSize, height: canvasHandleSize, border: '2px solid white', background: config.color, right: -(canvasHandleSize / 2), top: '50%', transform: 'translateY(-50%)', zIndex: 100 }}
              />
              <SuggestionButton nodeId={id} handleId={null} color={config.color} hovered={hovered} isLogic={false} />
            </>
          )}
        </>
      ) : (
        /* ── ROW-BASED LOGIC BODY (PREMIUM) ── */
        <div style={{ padding: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {actualType === 'beneficiary_risk' && (
              <>
                <div
                  style={getLogicRowStyle(data.active_branch_selection === 'known_fraudster', 'known_fraudster')}
                  onClick={(e) => { e.stopPropagation(); setSelectedNode(id); updateNodeData(id, { active_branch_selection: 'known_fraudster' }); }}
                >
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#EF4444', marginRight: 4 }}>KNOWN FRAUDSTER</span>
                  <Handle type="source" position={Position.Right} id="known_fraudster" style={logicHandleStyle('#EF4444', canvasHandleSize)} />
                  <SuggestionButton nodeId={id} handleId="known_fraudster" color="#EF4444" hovered={hovered} isLogic={true} />
                </div>
                <div
                  style={getLogicRowStyle(data.active_branch_selection === 'new_beneficiary', 'new_beneficiary')}
                  onClick={(e) => { e.stopPropagation(); setSelectedNode(id); updateNodeData(id, { active_branch_selection: 'new_beneficiary' }); }}
                >
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#EAB308', marginRight: 4 }}>NEW BENEFICIARY</span>
                  <Handle type="source" position={Position.Right} id="new_beneficiary" style={logicHandleStyle('#EAB308', canvasHandleSize)} />
                  <SuggestionButton nodeId={id} handleId="new_beneficiary" color="#EAB308" hovered={hovered} isLogic={true} />
                </div>
                <div
                  style={getLogicRowStyle(data.active_branch_selection === 'safe', 'safe')}
                  onClick={(e) => { e.stopPropagation(); setSelectedNode(id); updateNodeData(id, { active_branch_selection: 'safe' }); }}
                >
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#10B981', marginRight: 4 }}>SAFE / TRUSTED</span>
                  <Handle type="source" position={Position.Right} id="safe" style={logicHandleStyle('#10B981', canvasHandleSize)} />
                  <SuggestionButton nodeId={id} handleId="safe" color="#10B981" hovered={hovered} isLogic={true} />
                </div>
              </>
            )}

            {actualType === 'condition' && (
              <>
                <div style={getLogicRowStyle(false)}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', marginRight: 4 }}>PASS</span>
                  <Handle type="source" position={Position.Right} id="true" style={logicHandleStyle('#10B981', canvasHandleSize)} />
                  <SuggestionButton nodeId={id} handleId="true" color="#10B981" hovered={hovered} isLogic={true} />
                </div>
                <div style={getLogicRowStyle(false)}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', marginRight: 4 }}>FAIL</span>
                  <Handle type="source" position={Position.Right} id="false" style={logicHandleStyle('#EF4444', canvasHandleSize)} />
                  <SuggestionButton nodeId={id} handleId="false" color="#EF4444" hovered={hovered} isLogic={true} />
                </div>
              </>
            )}

            {actualType === 'switch' && (
              <>
                {(data.branches || []).map((b, i) => (
                  <div key={i} style={getLogicRowStyle(false)}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#64748B', marginRight: 4 }}>{b.name?.toUpperCase() || `PATH ${i + 1}`}</span>
                    <Handle type="source" position={Position.Right} id={b.name || `path-${i}`} style={logicHandleStyle('#3B82F6', canvasHandleSize)} />
                    <SuggestionButton nodeId={id} handleId={b.name || `path-${i}`} color="#3B82F6" hovered={hovered} isLogic={true} />
                  </div>
                ))}
                <div style={getLogicRowStyle(false)}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#CBD5E1', marginRight: 4 }}>ELSE</span>
                  <Handle type="source" position={Position.Right} id="else" style={logicHandleStyle('#CBD5E1', canvasHandleSize)} />
                  <SuggestionButton nodeId={id} handleId="else" color="#CBD5E1" hovered={hovered} isLogic={true} />
                </div>
              </>
            )}

            {actualType === 'splitter' && (
              <>
                <div style={getLogicRowStyle(false)}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#EA580C', marginRight: 4 }}>LOOP (ITEM)</span>
                  <Handle type="source" position={Position.Right} id="loop" style={logicHandleStyle('#EA580C', canvasHandleSize)} />
                  <SuggestionButton nodeId={id} handleId="loop" color="#EA580C" hovered={hovered} isLogic={true} />
                </div>
                <div style={getLogicRowStyle(false)}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', marginRight: 4 }}>DONE</span>
                  <Handle type="source" position={Position.Right} id="done" style={logicHandleStyle('#94A3B8', canvasHandleSize)} />
                  <SuggestionButton nodeId={id} handleId="done" color="#94A3B8" hovered={hovered} isLogic={true} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── EXTERNAL INDICATORS (Negative Positioning) ── */}

      {/* 1. Parallel Execution Indicator (FiLayers) */}
      {isParallel && (
        <div style={{
          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
          width: 20, height: 20, borderRadius: '50%', background: '#6366F1',
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(99, 102, 241, 0.4)', zIndex: 110, border: '2px solid white'
        }} title="Node running in parallel mode">
          <FiLayers size={10} strokeWidth={3} />
        </div>
      )}

      {/* 2. Swarm Membership Badge (Premium Icon Version) */}
      {isSwarmMember && (
        <div style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          width: 24, height: 24, borderRadius: '50%', background: '#FDF2F8',
          color: '#EC4899', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid white', boxShadow: '0 4px 10px rgba(236, 72, 153, 0.3)',
          zIndex: 140, animation: 'pulse 2s infinite'
        }} title="Member of an Active Swarm">
          <FiShare2 size={12} strokeWidth={3} />
        </div>
      )}

      {/* 3. HITL Interrupts */}
      {data.interrupt_before && (
        <div style={{
          position: 'absolute', top: -12, left: -12, width: 24, height: 24, borderRadius: 8,
          background: 'var(--theme-primary)', border: '2px solid white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)', zIndex: 150,
          animation: 'pulse 2s infinite'
        }} title="Interrupt BEFORE execution (HITL)">
          <FiUser size={12} color="#FFFFFF" />
        </div>
      )}
      {data.interrupt_after && (
        <div style={{
          position: 'absolute', top: -12, right: -12, width: 24, height: 24, borderRadius: 8,
          background: 'var(--theme-primary)', border: '2px solid white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)', zIndex: 150
        }} title="Interrupt AFTER execution (HITL)">
          <FiUser size={12} color="#FFFFFF" />
        </div>
      )}

      {/* 4. Skills Folder Badge */}
      {actualType === 'deep_agent' && (data.skills_dir || (data.skills && data.skills.length > 0)) && (
        <div style={{
          position: 'absolute', bottom: -10, right: -4, background: '#F5F3FF',
          color: '#8B5CF6', borderRadius: 6, padding: '2px 6px',
          fontSize: 8, fontWeight: 800, border: '1px solid #DDD6FE',
          zIndex: 150, display: 'flex', alignItems: 'center', gap: 3,
          boxShadow: '0 2px 4px rgba(139, 92, 246, 0.1)'
        }} title={`Active Skills Folder: ${data.skills_dir}`}>
          <FiBookOpen size={9} /> SKILLS
        </div>
      )}

      {/* 5. Iteration Badge */}
      {data.iteration_policy?.enabled && (
        <div style={{
          position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)',
          width: 20, height: 20, background: '#6366F1', color: 'white',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(99, 102, 241, 0.4)', zIndex: 150, border: '2px solid white'
        }} title="Self-Correction Loop Enabled">
          <FiRepeat size={10} strokeWidth={3} />
        </div>
      )}

      {/* 6. Error Handler Indicator */}
      {data.on_error && (
        <div style={{
          position: 'absolute', bottom: -12, right: 35, transform: 'translateX(50%)',
          width: 20, height: 20, background: '#EF4444', color: 'white',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)', zIndex: 150, border: '2px solid white'
        }} title={`Error Handler: ${data.on_error}`}>
          <FiAlertTriangle size={10} strokeWidth={3} />
        </div>
      )}
    </div>
  );
}

export default memo(AgentNode);
