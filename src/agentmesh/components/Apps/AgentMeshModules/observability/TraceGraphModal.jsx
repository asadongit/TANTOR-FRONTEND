import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import {
  FiX, FiGitBranch, FiCpu, FiLayers, FiZap,
  FiCheckCircle, FiAlertTriangle, FiShare2, FiBox,
  FiBarChart2, FiGrid, FiClock, FiArrowDown, FiCornerDownRight,
  FiRepeat, FiFilter
} from 'react-icons/fi';
import { fmtTimeShort, fmtSec, fmtInt, fmtUsd, PreviewCell } from './observabilityShared';

const TYPE_COLORS = {
  CHAIN: { bg: '#F4F0FA', border: '#8E77BB', text: '#8E77BB', icon: FiGitBranch },
  GENERATION: { bg: '#EFF6FF', border: '#3B82F6', text: '#2563EB', icon: FiCpu },
  SPAN: { bg: '#ECFDF5', border: '#10B981', text: '#059669', icon: FiLayers },
  EVENT: { bg: '#FEF3C7', border: '#F59E0B', text: '#D97706', icon: FiZap },
};

const isInternalNode = (name) => {
  if (!name) return false;
  const n = String(name).trim();
  return (
    n === '__start__' ||
    n === '__end__' ||
    n === '__pregel_pull' ||
    n === 'universal_entry_router' ||
    n === 'RunnableSequence' ||
    n === 'ChatPromptTemplate' ||
    n === 'PromptTemplate' ||
    n === 'StrOutputParser' ||
    n === 'JsonOutputParser' ||
    n.startsWith('hitl_gate_router_') ||
    n.startsWith('gate_router_') ||
    n.startsWith('pre_gate_') ||
    n.startsWith('post_gate_') ||
    n === 'execute_ocr' ||
    n.startsWith('execute_')
  );
};

const isRawNodeId = (str) => {
  if (!str) return false;
  return /^[a-z0-9]{12,24}$/i.test(String(str).trim());
};

function buildNodeIdToLabelMap(observations = []) {
  const map = new Map();
  observations.forEach((o) => {
    if (!o) return;
    if (o.metadata?.node_id && o.metadata?.node_label && !isRawNodeId(o.metadata.node_label)) {
      map.set(o.metadata.node_id, o.metadata.node_label);
    }
    if (o.metadata?.node_id && o.metadata?.agent_name && !isRawNodeId(o.metadata.agent_name)) {
      map.set(o.metadata.node_id, o.metadata.agent_name);
    }

    const inspectJson = (jsonStr) => {
      if (typeof jsonStr !== 'string' || !jsonStr.includes('nodes')) return;
      try {
        const data = JSON.parse(jsonStr);
        const nodesObj = data?.context?.nodes || data?.nodes;
        if (nodesObj && typeof nodesObj === 'object') {
          Object.entries(nodesObj).forEach(([nid, nval]) => {
            const label = nval?.node_label || nval?.agent_name;
            if (nid && label && !isRawNodeId(label)) {
              map.set(nid, label);
            }
          });
        }
      } catch (e) {}
    };

    inspectJson(o.input);
    inspectJson(o.output);
  });
  return map;
}

const getNodeDisplayName = (o, nodeIdMap = new Map()) => {
  if (!o) return '(unnamed)';

  // 0. GENERATION calls keep model / generation name
  if (o.type === 'GENERATION' || o.kind === 'llm') {
    return o.name && o.name !== '(unnamed)' ? o.name : 'AgentMeshLiteLLM';
  }

  // 1. Match raw node ID directly in nodeIdMap extracted from trace context.nodes
  if (o.name && nodeIdMap.has(o.name)) return nodeIdMap.get(o.name);
  if (o.metadata?.node_id && nodeIdMap.has(o.metadata.node_id)) return nodeIdMap.get(o.metadata.node_id);

  // 2. Check metadata node_label or agent_name
  if (o.metadata?.node_label && !isRawNodeId(o.metadata.node_label)) return o.metadata.node_label;
  if (o.metadata?.agent_name && !isRawNodeId(o.metadata.agent_name)) return o.metadata.agent_name;

  // 3. Check workflowName if present and not a raw ID
  if (o.workflowName && !isRawNodeId(o.workflowName) && o.workflowName !== o.name) {
    return o.workflowName;
  }

  return o.name || '(unnamed)';
};

function collapseNestedSameNameChains(observations = []) {
  if (!observations || observations.length === 0) return [];
  const result = [];
  const activeChainMap = new Map();

  for (let i = 0; i < observations.length; i++) {
    const current = observations[i];
    const nodeKey = current.name || current.id || '';

    if (nodeKey && current.type === 'CHAIN') {
      const prev = activeChainMap.get(nodeKey);
      if (prev) {
        const tPrev = new Date(prev.startTime || 0).getTime();
        const tCurr = new Date(current.startTime || 0).getTime();
        if (Math.abs(tCurr - tPrev) < 4000) {
          // Merge input/output if missing and skip redundant inner wrapper node
          if (!prev.output && current.output) prev.output = current.output;
          if (!prev.input && current.input) prev.input = current.input;
          continue;
        }
      }
      activeChainMap.set(nodeKey, current);
    }
    result.push({ ...current });
  }

  return result;
}

function prepareObservations(observations = [], hideInternal = true) {
  if (!observations || observations.length === 0) return [];

  const nodeIdMap = buildNodeIdToLabelMap(observations);

  // Deduplicate by ID or signature
  const seen = new Set();
  const uniqueObs = [];
  observations.forEach((o) => {
    if (!o) return;
    const key = o.id || `${o.name}-${o.type}-${o.startTime}-${o.endTime || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueObs.push(o);
    }
  });

  const sortedAll = [...uniqueObs].sort((a, b) => {
    const tA = new Date(a.startTime || 0).getTime();
    const tB = new Date(b.startTime || 0).getTime();
    return tA - tB;
  });

  const fullObsMap = new Map(sortedAll.map((o) => [o.id, o]));

  const filtered = hideInternal
    ? sortedAll.filter((o) => !isInternalNode(o?.name))
    : sortedAll;

  const collapsed = collapseNestedSameNameChains(filtered);

  const collapsedSet = new Set(collapsed.map((o) => o.id).filter(Boolean));
  const visibleObsMap = new Map(collapsed.map((o) => [o.id, o]));

  const getNearestVisibleParentId = (obs) => {
    let pId = obs?.parentObservationId;
    while (pId) {
      if (collapsedSet.has(pId)) return pId;
      const parentObs = fullObsMap.get(pId);
      pId = parentObs?.parentObservationId;
    }
    return null;
  };

  const parentChildDepthMap = new Map();

  const getDepth = (obs, idx, list) => {
    if (!obs) return 0;
    if (obs.id && parentChildDepthMap.has(obs.id)) return parentChildDepthMap.get(obs.id);

    const parentId = getNearestVisibleParentId(obs);
    if (parentId && visibleObsMap.has(parentId)) {
      const depth = 1 + getDepth(visibleObsMap.get(parentId), -1, list);
      if (obs.id) parentChildDepthMap.set(obs.id, depth);
      return depth;
    }

    // Heuristic fallback for LLM GENERATION calls following an Agent CHAIN node
    if (obs.type === 'GENERATION' || obs.kind === 'llm') {
      if (idx > 0) {
        const prev = list[idx - 1];
        if (prev && prev.type === 'CHAIN') {
          const prevDepth = prev.depth || 0;
          const depth = prevDepth > 0 ? prevDepth + 1 : 1;
          if (obs.id) parentChildDepthMap.set(obs.id, depth);
          return depth;
        }
      }
    }

    return 0;
  };

  return collapsed.map((o, idx, arr) => {
    const resolvedName = getNodeDisplayName(o, nodeIdMap);
    return {
      ...o,
      name: resolvedName,
      rawName: o.name,
      stepIndex: idx + 1,
      depth: getDepth(o, idx, arr)
    };
  });
}

function buildAggregatedNodes(observations = []) {
  if (!observations || observations.length === 0) return [];

  // Deduplicate
  const seen = new Set();
  const uniqueObs = [];
  observations.forEach((o) => {
    if (!o) return;
    const key = o.id || `${o.name}-${o.type}-${o.startTime}-${o.endTime || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueObs.push(o);
    }
  });

  const sorted = [...uniqueObs].sort((a, b) => {
    const tA = new Date(a.startTime || 0).getTime();
    const tB = new Date(b.startTime || 0).getTime();
    return tA - tB;
  });

  const map = new Map();
  sorted.forEach((o) => {
    const name = o.name || '(unnamed)';
    if (!map.has(name)) {
      map.set(name, {
        name,
        type: o.type,
        count: 0,
        totalLatency: 0,
        totalTokens: 0,
        totalCost: 0,
        errors: 0,
        firstSeenTime: o.startTime
      });
    }
    const grp = map.get(name);
    grp.count += 1;
    grp.totalLatency += (o.latencySec || 0);
    grp.totalTokens += (o.totalTokens || 0);
    grp.totalCost += (o.totalCost || 0);
    if (o.level === 'ERROR') grp.errors += 1;
  });

  return Array.from(map.values());
}

function FlowStepCard({ node, isLast, onOpenContent, selectedId, onSelect }) {
  const style = TYPE_COLORS[node.type] || TYPE_COLORS.SPAN;
  const Icon = style.icon;
  const isSelected = selectedId === node.id;
  const isError = node.level === 'ERROR';
  const indent = Math.min(node.depth * 24, 96);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 720 }}>
      <div style={{ display: 'flex', width: '100%', paddingLeft: indent, position: 'relative' }}>
        {node.depth > 0 && (
          <div style={{
            position: 'absolute', left: indent - 16, top: 16, color: '#94A3B8',
            display: 'flex', alignItems: 'center'
          }}>
            <FiCornerDownRight size={14} />
          </div>
        )}

        <motion.div
          whileHover={{ scale: 1.01 }}
          onClick={() => onSelect(node)}
          style={{
            flex: 1,
            background: isSelected ? '#FAF9FF' : '#FFFFFF',
            border: `1px solid ${isError ? '#EF4444' : isSelected ? '#8E77BB' : '#E2E8F0'}`,
            borderRadius: 12,
            padding: '12px 16px',
            boxShadow: isSelected ? '0 4px 14px rgba(142, 119, 187, 0.15)' : '0 2px 6px rgba(15, 23, 42, 0.03)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, background: style.bg, color: style.text,
                borderRadius: 6, padding: '2px 8px', border: `1px solid ${style.border}`
              }}>
                #{node.stepIndex} {node.type || 'SPAN'}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={14} color={style.text} />
                {node.name || '(unnamed)'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {isError ? (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#E11D48', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FiAlertTriangle size={13} /> ERROR
                </span>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FiCheckCircle size={12} /> OK
                </span>
              )}
              <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>
                {fmtTimeShort(node.startTime)}
              </span>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#F8FAFC', borderRadius: 8, padding: '6px 12px', fontSize: 11.5
          }}>
            <div style={{ display: 'flex', gap: 16, color: '#475569', fontWeight: 600 }}>
              <span>Duration: <strong style={{ color: '#0F172A' }}>{fmtSec(node.latencySec)}</strong></span>
              <span>Tokens: <strong style={{ color: '#0F172A' }}>{node.totalTokens ? fmtInt(node.totalTokens) : '—'}</strong></span>
              <span>Cost: <strong style={{ color: '#0F172A' }}>{fmtUsd(node.totalCost)}</strong></span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {node.modelId && (
                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500, fontFamily: 'monospace' }}>
                  {node.modelId}
                </span>
              )}
              <PreviewCell value={node.output || node.input} onOpen={() => onOpenContent && onOpenContent({
                title: `Step #${node.stepIndex}: ${node.name}`,
                subtitle: `Type: ${node.type} | Duration: ${fmtSec(node.latencySec)}`,
                copyText: JSON.stringify({ input: node.input, output: node.output, metadata: node.metadata }, null, 2),
                sections: [
                  { label: 'Input', text: typeof node.input === 'string' ? node.input : JSON.stringify(node.input, null, 2), size: 'payload' },
                  { label: 'Output', text: typeof node.output === 'string' ? node.output : JSON.stringify(node.output, null, 2), size: 'payload' },
                  { label: 'Metadata', text: JSON.stringify(node.metadata || {}, null, 2), size: 'metadata' },
                ]
              })} />
            </div>
          </div>
        </motion.div>
      </div>

      {!isLast && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 22, justifyContent: 'center' }}>
          <div style={{ width: 2, height: 12, background: '#CBD5E1' }} />
          <FiArrowDown size={11} color="#94A3B8" style={{ marginTop: -2 }} />
        </div>
      )}
    </div>
  );
}

FlowStepCard.propTypes = {
  node: PropTypes.object.isRequired,
  isLast: PropTypes.bool,
  onOpenContent: PropTypes.func,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func,
};

function AggregatedGraphView({ aggregatedNodes }) {
  if (!aggregatedNodes || aggregatedNodes.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 720 }}>
      {aggregatedNodes.map((grp, idx) => {
        const style = TYPE_COLORS[grp.type] || TYPE_COLORS.SPAN;
        const Icon = style.icon;
        const isLast = idx === aggregatedNodes.length - 1;

        return (
          <React.Fragment key={idx}>
            <motion.div
              whileHover={{ scale: 1.01 }}
              style={{
                width: '100%',
                background: '#FFFFFF',
                border: `1.5px solid ${grp.errors > 0 ? '#EF4444' : style.border}`,
                borderRadius: 14,
                padding: '14px 18px',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, background: style.bg, color: style.text,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{grp.name}</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>Type: {grp.type || 'SPAN'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 11.5, fontWeight: 700, background: style.bg, color: style.text,
                    border: `1px solid ${style.border}`, borderRadius: 12, padding: '3px 10px',
                    display: 'flex', alignItems: 'center', gap: 5
                  }}>
                    {grp.count > 1 && <FiRepeat size={12} />}
                    {grp.count} {grp.count === 1 ? 'call' : 'calls (collapsed loop)'}
                  </span>
                </div>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
                background: '#F8FAFC', borderRadius: 8, padding: '8px 12px', fontSize: 11.5
              }}>
                <div>
                  <div style={{ color: '#94A3B8', fontSize: 9.5, fontWeight: 700 }}>AGGREGATE TIME</div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{fmtSec(grp.totalLatency)}</div>
                </div>
                <div>
                  <div style={{ color: '#94A3B8', fontSize: 9.5, fontWeight: 700 }}>TOTAL TOKENS</div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{fmtInt(grp.totalTokens)}</div>
                </div>
                <div>
                  <div style={{ color: '#94A3B8', fontSize: 9.5, fontWeight: 700 }}>TOTAL COST</div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{fmtUsd(grp.totalCost)}</div>
                </div>
              </div>
            </motion.div>

            {!isLast && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 26, justifyContent: 'center' }}>
                <div style={{ width: 2, height: 14, background: '#CBD5E1' }} />
                <FiArrowDown size={12} color="#8E77BB" style={{ marginTop: -2 }} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

AggregatedGraphView.propTypes = {
  aggregatedNodes: PropTypes.array.isRequired,
};

function TimelineWaterfallView({ observations }) {
  if (!observations || observations.length === 0) return null;

  const validTimes = observations.map((o) => new Date(o.startTime).getTime()).filter((t) => !Number.isNaN(t));
  const minTime = validTimes.length ? Math.min(...validTimes) : 0;
  const maxTimes = observations.map((o) => new Date(o.endTime || o.startTime).getTime()).filter((t) => !Number.isNaN(t));
  const maxTime = maxTimes.length ? Math.max(...maxTimes) : minTime + 1000;
  const totalRangeMs = Math.max(maxTime - minTime, 1);

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    pct: pct * 100,
    label: `${((totalRangeMs * pct) / 1000).toFixed(1)}s`
  }));

  return (
    <div style={{ width: '100%', maxWidth: 1100, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
      <div style={{ padding: '14px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>CHRONOLOGICAL EXECUTION TIMELINE (WATERFALL GANTT CHART)</span>
        <span style={{ fontSize: 12, color: '#8E77BB', background: '#F4F0FA', padding: '3px 10px', borderRadius: 6, fontWeight: 700 }}>
          Total Trace Duration: {(totalRangeMs / 1000).toFixed(2)}s
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 20px 6px', borderBottom: '1px solid #F1F5F9', background: '#FAFAFA', fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>
        <div style={{ width: 250, flexShrink: 0 }}>STEP / NODE NAME</div>
        <div style={{ width: 90, flexShrink: 0, textAlign: 'center' }}>OFFSET</div>
        <div style={{ flex: 1, position: 'relative', height: 16 }}>
          {ticks.map((t, i) => (
            <span key={i} style={{ position: 'absolute', left: `${t.pct}%`, transform: 'translateX(-50%)', fontSize: 10 }}>
              {t.label}
            </span>
          ))}
        </div>
        <div style={{ width: 80, flexShrink: 0, textAlign: 'right' }}>TOKENS</div>
      </div>

      <div style={{ padding: '12px 20px 60px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 560, overflowY: 'auto' }}>
        {observations.map((o, idx) => {
          const startMs = new Date(o.startTime).getTime();
          const offsetMs = Math.max(0, startMs - minTime);
          const leftPercent = Math.max(0, Math.min(94, (offsetMs / totalRangeMs) * 100));
          const durationMs = (o.latencySec || 0.05) * 1000;
          const barWidthPercent = Math.max(0.8, Math.min(100 - leftPercent, (durationMs / totalRangeMs) * 100));
          const style = TYPE_COLORS[o.type] || TYPE_COLORS.SPAN;
          const indent = Math.min((o.depth || 0) * 16, 64);

          return (
            <div key={o.id || idx} style={{ display: 'flex', alignItems: 'center', fontSize: 12, height: 28 }}>
              <div
                title={o.name || o.type}
                style={{
                  width: 250, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontWeight: 600, color: '#0F172A', paddingLeft: indent, display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <span style={{ fontSize: 10, color: style.text, fontWeight: 700, background: style.bg, padding: '1px 5px', borderRadius: 4 }}>
                  #{o.stepIndex || idx + 1}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name || o.type}</span>
              </div>

              <div style={{ width: 90, flexShrink: 0, textAlign: 'center', color: '#64748B', fontSize: 11, fontFamily: 'monospace' }}>
                +{offsetMs < 1000 ? `${Math.round(offsetMs)}ms` : `${(offsetMs / 1000).toFixed(2)}s`}
              </div>

              <div style={{ flex: 1, position: 'relative', height: 20, background: '#F8FAFC', borderRadius: 4, display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: `${leftPercent}%`,
                    width: `${barWidthPercent}%`,
                    minWidth: 6,
                    height: 14,
                    background: o.level === 'ERROR' ? '#EF4444' : style.border,
                    borderRadius: 3,
                    opacity: 0.9,
                    transition: 'all 0.15s ease'
                  }}
                />

                <div style={{
                  position: 'absolute',
                  left: `calc(${leftPercent}% + ${Math.max(barWidthPercent, 1.5)}% + 8px)`,
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: style.text,
                  whiteSpace: 'nowrap'
                }}>
                  {fmtSec(o.latencySec)}
                </div>
              </div>

              <div style={{ width: 80, flexShrink: 0, textAlign: 'right', color: '#64748B', fontSize: 11, fontWeight: 600 }}>
                {o.totalTokens ? `${fmtInt(o.totalTokens)} tok` : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

TimelineWaterfallView.propTypes = {
  observations: PropTypes.array.isRequired,
};

export default function TraceGraphModal({ traceDetail, onClose, onOpenContent }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [viewMode, setViewMode] = useState('expanded'); // 'expanded' | 'aggregated' | 'timeline'
  const [hideInternal, setHideInternal] = useState(true);

  if (!traceDetail) return null;

  const rawObservations = traceDetail.observations || [];
  const processedNodes = prepareObservations(rawObservations, hideInternal);
  const aggregated = buildAggregatedNodes(processedNodes);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 24
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        style={{
          width: '94vw', height: '90vh', background: '#F8FAFC',
          borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 24px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F4F0FA', color: '#8E77BB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiShare2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                Langfuse Execution Graph
                <span style={{ fontSize: 12, fontWeight: 600, color: '#8E77BB', background: '#F4F0FA', padding: '2px 8px', borderRadius: 6 }}>
                  {traceDetail.name || 'LangGraph Workflow'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>Trace ID: <strong style={{ fontFamily: 'monospace' }}>{traceDetail.traceId}</strong></span>
                <span>·</span>
                <span>{processedNodes.length} Nodes</span>
                <span>·</span>
                <span>Duration: {fmtSec(traceDetail.durationSec)}</span>
              </div>
            </div>
          </div>

          {/* View Mode & Filter Toggle Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => setHideInternal((prev) => !prev)}
              style={{
                border: hideInternal ? '1px solid #8E77BB' : '1px solid #CBD5E1',
                padding: '6px 13px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                background: hideInternal ? '#F4F0FA' : '#FFFFFF',
                color: hideInternal ? '#8E77BB' : '#475569',
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease'
              }}
              title="Filter out internal LangGraph routers (__start__, universal_entry_router, RunnableSequence, ChatPromptTemplate)"
            >
              <FiFilter size={13} color={hideInternal ? '#8E77BB' : '#64748B'} />
              {hideInternal ? 'Clean Agent Flow' : 'Show Internal Plumbing'}
            </button>
            <div style={{ display: 'flex', background: '#F1F5F9', padding: 3, borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={() => setViewMode('expanded')}
                style={{
                  border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: viewMode === 'expanded' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'expanded' ? '#8E77BB' : '#64748B',
                  cursor: 'pointer', fontFamily: 'inherit', boxShadow: viewMode === 'expanded' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <FiGrid size={13} /> Graph (Expanded)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('aggregated')}
                style={{
                  border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: viewMode === 'aggregated' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'aggregated' ? '#8E77BB' : '#64748B',
                  cursor: 'pointer', fontFamily: 'inherit', boxShadow: viewMode === 'aggregated' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <FiBarChart2 size={13} /> Graph (Aggregated)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                style={{
                  border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: viewMode === 'timeline' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'timeline' ? '#8E77BB' : '#64748B',
                  cursor: 'pointer', fontFamily: 'inherit', boxShadow: viewMode === 'timeline' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <FiClock size={13} /> Timeline Waterfall
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{ border: 'none', background: '#F1F5F9', color: '#64748B', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* View Mode Canvas */}
        <div style={{
          flex: 1, overflow: 'auto', padding: '32px 24px 60px', background: '#F8FAFC',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          {viewMode === 'expanded' ? (
            processedNodes.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748B', margin: 'auto' }}>
                <FiBox size={36} color="#94A3B8" />
                <div style={{ marginTop: 12, fontWeight: 600 }}>No observation nodes available for graph rendering.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                {processedNodes.map((node, i) => (
                  <FlowStepCard
                    key={node.id || i}
                    node={node}
                    isLast={i === processedNodes.length - 1}
                    onOpenContent={onOpenContent}
                    selectedId={selectedNode?.id}
                    onSelect={(n) => setSelectedNode(n)}
                  />
                ))}
              </div>
            )
          ) : viewMode === 'aggregated' ? (
            <AggregatedGraphView aggregatedNodes={aggregated} />
          ) : (
            <TimelineWaterfallView observations={processedNodes} />
          )}
        </div>
      </motion.div>
    </div>
  );
}

TraceGraphModal.propTypes = {
  traceDetail: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onOpenContent: PropTypes.func,
};
