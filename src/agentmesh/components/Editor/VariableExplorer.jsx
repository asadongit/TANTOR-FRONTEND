import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useRunStore, useWorkflowStore, useVariablesStore } from '../../store';
import {
  FiSearch, FiCopy, FiCheck, FiChevronRight, FiChevronDown, FiDatabase,
  FiActivity, FiTerminal, FiX, FiList, FiGrid, FiCode, FiInfo, FiArrowLeft,
  FiSliders
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const THEME_ACCENT = 'var(--theme-primary)';
const THEME_BORDER = 'var(--border)';
const THEME_TEXT = 'var(--text-primary)';

// Helper to extract schema path nodes recursively
const getSchemaPaths = (val, currentPath = '') => {
  if (val === null) return [{ path: currentPath || 'root', type: 'null', sample: 'null' }];
  if (Array.isArray(val)) {
    const paths = [{ path: currentPath || 'root', type: `array (${val.length} items)`, sample: `[...]` }];
    if (val.length > 0) {
      const firstItemPaths = getSchemaPaths(val[0], currentPath ? `${currentPath}[*]` : '[*]');
      paths.push(...firstItemPaths);
    }
    return paths;
  }
  if (typeof val === 'object') {
    const paths = [];
    if (currentPath) {
      paths.push({ path: currentPath, type: 'object', sample: '{...}' });
    }
    Object.keys(val).forEach(k => {
      const p = currentPath ? `${currentPath}.${k}` : k;
      paths.push(...getSchemaPaths(val[k], p));
    });
    return paths;
  }
  return [{ path: currentPath || 'root', type: typeof val, sample: String(val) }];
};

// Helper to resolve nested path in object
const getValueByPath = (obj, path) => {
  if (!path) return obj;
  return path.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object') {
      return acc[part];
    }
    return undefined;
  }, obj);
};

// Helper to recursively filter the tree based on search query
const filterTree = (node, search) => {
  if (!search) return node;
  const searchLower = search.toLowerCase();

  const filterNode = (val) => {
    if (val === null || typeof val !== 'object') {
      return String(val).toLowerCase().includes(searchLower) ? val : undefined;
    }

    const isArr = Array.isArray(val);
    const result = isArr ? [] : {};
    let hasMatch = false;

    Object.keys(val).forEach(key => {
      if (key.toLowerCase().includes(searchLower)) {
        if (isArr) {
          result.push(val[key]);
        } else {
          result[key] = val[key];
        }
        hasMatch = true;
      } else {
        const filteredChild = filterNode(val[key]);
        if (filteredChild !== undefined && 
           (!Array.isArray(filteredChild) || filteredChild.length > 0) && 
           (typeof filteredChild !== 'object' || Object.keys(filteredChild).length > 0)) {
          if (isArr) {
            result.push(filteredChild);
          } else {
            result[key] = filteredChild;
          }
          hasMatch = true;
        }
      }
    });

    return hasMatch ? result : undefined;
  };

  return filterNode(node) || {};
};

export default function VariableExplorer({ onClose }) {
  const { latestContext } = useRunStore();
  const { nodes: workflowNodes } = useWorkflowStore();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('vars'); // 'vars' | 'json' | 'table' | 'schema'
  const [selectedPath, setSelectedPath] = useState(''); // Selected path for detail inspection
  const [expandedGroups, setExpandedGroups] = useState(['General', 'System', 'Nodes']);

  // Map IDs to Human Labels
  const nodeLabelMap = Object.fromEntries(workflowNodes.map(n => [n.id, n.data?.label || n.id]));

  // Categorize tree variables
  const variableGroups = useMemo(() => {
    const ctx = latestContext || {};
    const system = {};
    const nodes = {};
    const general = {};

    Object.keys(ctx).forEach(key => {
      if (key === 'nodes' && typeof ctx[key] === 'object' && ctx[key] !== null) {
        // Map node IDs to human names in the display tree
        Object.keys(ctx.nodes).forEach(nodeId => {
          const label = nodeLabelMap[nodeId] || nodeId;
          nodes[`NODE: ${label.toUpperCase()}`] = ctx.nodes[nodeId];
        });
      } else if (['thread_id', 'workflow_id', 'workflow_name', 'user_id', 'target_node_id', 'msg'].includes(key)) {
        system[key] = ctx[key];
      } else {
        general[key] = ctx[key];
      }
    });

    return {
      'System': system,
      'Nodes': nodes,
      'General': general
    };
  }, [latestContext, nodeLabelMap]);

  // Filter tree based on search
  const filteredVariableGroups = useMemo(() => {
    if (!search) return variableGroups;
    return {
      'System': filterTree(variableGroups.System, search),
      'Nodes': filterTree(variableGroups.Nodes, search),
      'General': filterTree(variableGroups.General, search)
    };
  }, [variableGroups, search]);

  // Get current focused data value
  const focusedData = useMemo(() => getValueByPath(latestContext, selectedPath), [latestContext, selectedPath]);

  const copyAllToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(latestContext, null, 2));
    alert("Full context copied to clipboard!");
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev =>
      prev.includes(groupName) ? prev.filter(g => g !== groupName) : [...prev, groupName]
    );
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--bg-secondary, #FFFFFF)',
        borderLeft: `1px solid var(--border)`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: `1px solid var(--border)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-primary, #FAFBFC)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--theme-primary-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--theme-primary)'
          }}>
            <FiDatabase size={16} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: THEME_TEXT, letterSpacing: '-0.01em' }}>Data Explorer</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted, #6B7280)', fontWeight: 600 }}>RUNTIME CONTEXT</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => useVariablesStore.getState().setShowVariablesPanel(true)}
            title="Configure Global Variables"
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#6366F1',
              width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--theme-primary-glow)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <FiSliders size={16} />
          </button>

          <button
            onClick={copyAllToClipboard}
            title="Copy All Context (JSON)"
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#6366F1',
              width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--theme-primary-glow)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <FiCopy size={16} />
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF',
              width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover, #F3F4F6)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <FiX size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        padding: '0 16px',
        background: 'var(--bg-primary, #FAFBFC)',
        gap: 8
      }}>
        {[
          { id: 'vars', label: 'Variables', icon: <FiList size={12} /> },
          { id: 'json', label: 'JSON', icon: <FiCode size={12} /> },
          { id: 'table', label: 'Table', icon: <FiGrid size={12} /> },
          { id: 'schema', label: 'Schema', icon: <FiInfo size={12} /> }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '12px 8px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--theme-primary)' : '2px solid transparent',
                color: isActive ? 'var(--theme-primary)' : 'var(--text-secondary, #6B7280)',
                fontWeight: isActive ? 700 : 500,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.2s',
                outline: 'none'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Breadcrumbs */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid var(--border)`, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <FiSearch style={{ position: 'absolute', left: 12, color: '#9CA3AF' }} size={14} />
          <input
            type="text"
            placeholder={activeTab === 'vars' ? "Search variables..." : "Search data..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              borderRadius: 10,
              border: `1px solid var(--border)`,
              fontSize: 12,
              outline: 'none',
              background: 'var(--bg-primary, #F9FAFB)',
              color: THEME_TEXT,
              fontWeight: 500
            }}
          />
        </div>

        {/* Breadcrumb for Detailed View */}
        {activeTab !== 'vars' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px' }}>
            {selectedPath && (
              <button
                onClick={() => setSelectedPath('')}
                style={{
                  background: 'var(--bg-primary, #F3F4F6)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: 'var(--text-secondary)'
                }}
              >
                <FiArrowLeft size={10} /> Reset
              </button>
            )}
            <PathBreadcrumbs path={selectedPath} onSelectPath={setSelectedPath} />
          </div>
        )}
      </div>

      {/* Scrollable Content Pane */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'vars' && (
          <div style={{ padding: '0 8px' }}>
            {/* System variables */}
            {Object.keys(filteredVariableGroups.System).length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div
                  onClick={() => toggleGroup('System')}
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: 'rgba(0,0,0,0.02)' }}
                >
                  {expandedGroups.includes('System') ? <FiChevronDown size={14} color="#9CA3AF" /> : <FiChevronRight size={14} color="#9CA3AF" />}
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    System ({Object.keys(filteredVariableGroups.System).length})
                  </span>
                </div>
                {expandedGroups.includes('System') && (
                  <div style={{ padding: '4px 0' }}>
                    {Object.keys(filteredVariableGroups.System).map(k => (
                      <VariableTreeNode
                        key={k}
                        label={k}
                        value={filteredVariableGroups.System[k]}
                        path={k}
                        onSelectPath={(path) => { setSelectedPath(path); setActiveTab('json'); }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Nodes variables */}
            {Object.keys(filteredVariableGroups.Nodes).length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div
                  onClick={() => toggleGroup('Nodes')}
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: 'rgba(0,0,0,0.02)' }}
                >
                  {expandedGroups.includes('Nodes') ? <FiChevronDown size={14} color="#9CA3AF" /> : <FiChevronRight size={14} color="#9CA3AF" />}
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Nodes ({Object.keys(filteredVariableGroups.Nodes).length})
                  </span>
                </div>
                {expandedGroups.includes('Nodes') && (
                  <div style={{ padding: '4px 0' }}>
                    {Object.keys(filteredVariableGroups.Nodes).map(groupName => {
                      // Resolve true key in context, mapping "NODE: LABEL" back to "nodes.node_id"
                      const humanLabel = groupName.replace(/^NODE: /, '').toLowerCase();
                      const trueNodeId = workflowNodes.find(n => (n.data?.label || n.id).toLowerCase() === humanLabel)?.id || humanLabel;
                      const basePath = `nodes.${trueNodeId}`;

                      return (
                        <VariableTreeNode
                          key={groupName}
                          label={groupName}
                          value={filteredVariableGroups.Nodes[groupName]}
                          path={basePath}
                          onSelectPath={(path) => { setSelectedPath(path); setActiveTab('json'); }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* General variables */}
            {Object.keys(filteredVariableGroups.General).length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div
                  onClick={() => toggleGroup('General')}
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: 'rgba(0,0,0,0.02)' }}
                >
                  {expandedGroups.includes('General') ? <FiChevronDown size={14} color="#9CA3AF" /> : <FiChevronRight size={14} color="#9CA3AF" />}
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    General ({Object.keys(filteredVariableGroups.General).length})
                  </span>
                </div>
                {expandedGroups.includes('General') && (
                  <div style={{ padding: '4px 0' }}>
                    {Object.keys(filteredVariableGroups.General).map(k => (
                      <VariableTreeNode
                        key={k}
                        label={k}
                        value={filteredVariableGroups.General[k]}
                        path={k}
                        onSelectPath={(path) => { setSelectedPath(path); setActiveTab('json'); }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {Object.keys(filteredVariableGroups.System).length === 0 &&
             Object.keys(filteredVariableGroups.Nodes).length === 0 &&
             Object.keys(filteredVariableGroups.General).length === 0 && (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.5,
                padding: '40px 0'
              }}>
                <FiTerminal size={32} style={{ marginBottom: 12, color: 'var(--theme-primary)' }} />
                <div style={{ fontSize: 13, fontWeight: 600 }}>No variables found</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>Run the workflow to see data</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'json' && (
          <div style={{ padding: '0 8px' }}>
            <JsonTree data={focusedData} path={selectedPath} onSelectPath={setSelectedPath} search={search} />
          </div>
        )}

        {activeTab === 'table' && (
          <div style={{ padding: '0 16px', overflowX: 'auto' }}>
            <TableView data={focusedData} onSelectPath={(k) => setSelectedPath(selectedPath ? `${selectedPath}.${k}` : k)} search={search} />
          </div>
        )}

        {activeTab === 'schema' && (
          <div style={{ padding: '0 16px' }}>
            <SchemaView data={focusedData} search={search} />
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div style={{
        padding: '16px 24px',
        borderTop: `1px solid var(--border)`,
        background: 'var(--bg-primary, #FAFBFC)',
        fontSize: 10,
        color: 'var(--text-muted, #9CA3AF)',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiActivity size={12} color="var(--theme-primary)" />
          LIVE SYNC ACTIVE
        </div>
        {activeTab !== 'vars' && selectedPath && (
          <div style={{ color: 'var(--theme-primary)', fontWeight: 800 }}>
            FOCUS MODE
          </div>
        )}
      </div>
    </div>
  );
}

VariableExplorer.propTypes = {
  onClose: PropTypes.func.isRequired
};

// Path Breadcrumbs Component
function PathBreadcrumbs({ path, onSelectPath }) {
  if (!path) return <span style={{ color: 'var(--text-muted, #9CA3AF)', fontSize: 11 }}>root</span>;
  const parts = path.split('.');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
      <button
        onClick={() => onSelectPath('')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--theme-primary)', padding: 0, fontWeight: 700 }}
      >
        root
      </button>
      {parts.map((part, index) => {
        const subPath = parts.slice(0, index + 1).join('.');
        const isLast = index === parts.length - 1;
        return (
          <React.Fragment key={subPath}>
            <span style={{ color: 'var(--border, #E5E7EB)' }}>/</span>
            {isLast ? (
              <span style={{ color: 'var(--text-primary)' }}>{part}</span>
            ) : (
              <button
                onClick={() => onSelectPath(subPath)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--theme-primary)', padding: 0, fontWeight: 700 }}
              >
                {part}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

PathBreadcrumbs.propTypes = {
  path: PropTypes.string.isRequired,
  onSelectPath: PropTypes.func.isRequired
};

// Collapsible Recursive Variable Tree Node
function VariableTreeNode({ label, value, path, onSelectPath, isRoot = false }) {
  const [expanded, setExpanded] = useState(isRoot);
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const isObj = value !== null && typeof value === 'object';
  const isArr = Array.isArray(value);

  const toggleExpand = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const copyToClipboard = (e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(`{{${path}}}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      if (!window.getSelection().toString()) {
        e.preventDefault();
        e.stopPropagation();
        copyToClipboard();
      }
    }
  };

  const handleDragStart = (e) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', `{{${path}}}`);
    e.dataTransfer.setData('application/agentmesh-variable', path);
  };

  // 1. Array with Object items (Sampling first item)
  if (isArr && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
    const sampleItem = value[0];
    const keys = Object.keys(sampleItem);
    const nodeLabel = `${label} [List: ${value.length} items]`;
    
    return (
      <div style={{ marginLeft: isRoot ? 0 : 12, marginTop: 2 }}>
        <div
          draggable
          onDragStart={handleDragStart}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={toggleExpand}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px',
            borderRadius: 6,
            cursor: 'grab',
            background: isHovered ? 'var(--bg-hover, rgba(0,0,0,0.015))' : 'transparent',
            transition: 'background 0.1s',
            outline: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            {expanded ? <FiChevronDown size={14} color="#9CA3AF" /> : <FiChevronRight size={14} color="#9CA3AF" />}
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nodeLabel}
            </span>
          </div>

          {isHovered && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
              <button
                onClick={() => onSelectPath(path)}
                title="Inspect in details"
                style={{
                  background: 'var(--theme-primary-glow)', border: 'none', borderRadius: 4,
                  color: 'var(--theme-primary)', fontSize: 9, fontWeight: 700,
                  cursor: 'pointer', padding: '2px 6px'
                }}
              >
                Inspect
              </button>
              <button
                onClick={copyToClipboard}
                title={copied ? "Copied!" : "Copy Expression"}
                style={{ background: 'none', border: 'none', color: copied ? '#10B981' : '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 }}
              >
                {copied ? <FiCheck size={11} color="#10B981" /> : <FiCopy size={11} />}
              </button>
            </div>
          )}
        </div>

        {expanded && (
          <div style={{ borderLeft: '1px dashed var(--border)', marginLeft: 14, paddingLeft: 4 }}>
            {keys.map(k => {
              // Inject index '.0.' automatically to target the first item of the array
              const childPath = `${path}.0.${k}`;
              return (
                <VariableTreeNode
                  key={k}
                  label={k}
                  value={sampleItem[k]}
                  path={childPath}
                  onSelectPath={onSelectPath}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 2. Simple Array (Primitives e.g., ["A", "B", "C"])
  if (isArr) {
    const nodeLabel = `${label} [List: ${value.length} items]`;
    return (
      <div style={{ marginLeft: isRoot ? 0 : 12, marginTop: 2 }}>
        <div
          draggable
          onDragStart={handleDragStart}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={toggleExpand}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px',
            borderRadius: 6,
            cursor: 'grab',
            background: isHovered ? 'var(--bg-hover, rgba(0,0,0,0.015))' : 'transparent',
            transition: 'background 0.1s',
            outline: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            {expanded ? <FiChevronDown size={14} color="#9CA3AF" /> : <FiChevronRight size={14} color="#9CA3AF" />}
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nodeLabel}
            </span>
          </div>

          {isHovered && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
              <button
                onClick={() => onSelectPath(path)}
                title="Inspect in details"
                style={{
                  background: 'var(--theme-primary-glow)', border: 'none', borderRadius: 4,
                  color: 'var(--theme-primary)', fontSize: 9, fontWeight: 700,
                  cursor: 'pointer', padding: '2px 6px'
                }}
              >
                Inspect
              </button>
              <button
                onClick={copyToClipboard}
                title={copied ? "Copied!" : "Copy Expression"}
                style={{ background: 'none', border: 'none', color: copied ? '#10B981' : '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 }}
              >
                {copied ? <FiCheck size={11} color="#10B981" /> : <FiCopy size={11} />}
              </button>
            </div>
          )}
        </div>

        {expanded && (
          <div style={{ borderLeft: '1px dashed var(--border)', marginLeft: 14, paddingLeft: 4 }}>
            {value.length > 0 ? (
              <>
                <VariableTreeNode
                  label="0"
                  value={value[0]}
                  path={`${path}.0`}
                  onSelectPath={onSelectPath}
                />
                {value.length > 1 && (
                  <div style={{ marginLeft: 12, marginTop: 2, fontSize: 11, color: '#9CA3AF', fontStyle: 'italic', padding: '4px 8px' }}>
                    ... and {value.length - 1} more items (hidden)
                  </div>
                )}
              </>
            ) : (
              <div style={{ marginLeft: 12, marginTop: 2, fontSize: 11, color: '#9CA3AF', fontStyle: 'italic', padding: '4px 8px' }}>
                (empty list)
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 3. Object (Map)
  if (isObj) {
    const keys = Object.keys(value);
    const nodeLabel = label;
    return (
      <div style={{ marginLeft: isRoot ? 0 : 12, marginTop: 2 }}>
        <div
          draggable
          onDragStart={handleDragStart}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={toggleExpand}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px',
            borderRadius: 6,
            cursor: 'grab',
            background: isHovered ? 'var(--bg-hover, rgba(0,0,0,0.015))' : 'transparent',
            transition: 'background 0.1s',
            outline: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            {expanded ? <FiChevronDown size={14} color="#9CA3AF" /> : <FiChevronRight size={14} color="#9CA3AF" />}
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nodeLabel}
            </span>
          </div>

          {isHovered && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
              <button
                onClick={() => onSelectPath(path)}
                title="Inspect in details"
                style={{
                  background: 'var(--theme-primary-glow)', border: 'none', borderRadius: 4,
                  color: 'var(--theme-primary)', fontSize: 9, fontWeight: 700,
                  cursor: 'pointer', padding: '2px 6px'
                }}
              >
                Inspect
              </button>
              <button
                onClick={copyToClipboard}
                title={copied ? "Copied!" : "Copy Expression"}
                style={{ background: 'none', border: 'none', color: copied ? '#10B981' : '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 }}
              >
                {copied ? <FiCheck size={11} color="#10B981" /> : <FiCopy size={11} />}
              </button>
            </div>
          )}
        </div>

        {expanded && (
          <div style={{ borderLeft: '1px dashed var(--border)', marginLeft: 14, paddingLeft: 4 }}>
            {keys.map(k => {
              const childPath = path ? `${path}.${k}` : k;
              return (
                <VariableTreeNode
                  key={k}
                  label={k}
                  value={value[k]}
                  path={childPath}
                  onSelectPath={onSelectPath}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Primitive Leaf Node
  const displayValue = value === null ? 'null' : String(value);
  const truncatedVal = displayValue.length > 25 ? displayValue.substring(0, 25) + '...' : displayValue;
  
  let valColor = '#059669';
  if (typeof value === 'number') valColor = '#2563EB';
  if (typeof value === 'boolean') valColor = '#D97706';
  if (value === null || value === undefined) valColor = '#6B7280';

  return (
    <div style={{ marginLeft: 12, marginTop: 2 }}>
      <div
        draggable
        onDragStart={handleDragStart}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
          borderRadius: 6,
          cursor: 'grab',
          background: isHovered ? 'var(--bg-hover, rgba(0,0,0,0.015))' : 'transparent',
          transition: 'background 0.1s',
          outline: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#94A3B8', flexShrink: 0 }} />
          <span style={{ fontWeight: 600, color: 'var(--text-secondary, #4B5563)', fontSize: 12, flexShrink: 0 }}>{label}:</span>
          <span style={{ color: valColor, fontSize: 11, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={displayValue}>
            {truncatedVal}
          </span>
        </div>

        {isHovered && (
          <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
            <button
              onClick={copyToClipboard}
              title={copied ? "Copied!" : "Copy Expression"}
              style={{ background: 'none', border: 'none', color: copied ? '#10B981' : '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 }}
            >
              {copied ? <FiCheck size={11} color="#10B981" /> : <FiCopy size={11} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

VariableTreeNode.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  path: PropTypes.string.isRequired,
  onSelectPath: PropTypes.func.isRequired,
  isRoot: PropTypes.bool
};

// Collapsible JSON Tree Viewer Component
function JsonTree({ data, path = '', onSelectPath, search = '' }) {
  const [expanded, setExpanded] = useState({});
  const [copiedPath, setCopiedPath] = useState(null);

  const toggleExpand = (p) => {
    setExpanded(prev => ({ ...prev, [p]: !prev[p] }));
  };

  const copyToClipboard = (text, nodePath) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(nodePath);
    setTimeout(() => {
      setCopiedPath(null);
    }, 2000);
  };

  const handleKeyDown = (e, nodePath) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      if (!window.getSelection().toString()) {
        e.preventDefault();
        e.stopPropagation();
        copyToClipboard(`{{${nodePath}}}`, nodePath);
      }
    }
  };

  const renderNode = (val, currentKey = '', currentPath = '') => {
    const isObj = val !== null && typeof val === 'object';
    const isArr = Array.isArray(val);
    const nodePath = currentPath ? (currentKey ? `${currentPath}.${currentKey}` : currentPath) : currentKey;

    if (isObj) {
      const keys = Object.keys(val);
      const isExpanded = expanded[nodePath] !== false; // Default expanded for levels
      const label = isArr ? `Array(${keys.length})` : `Object(${keys.length})`;

      return (
        <div key={nodePath} style={{ marginLeft: currentPath ? 16 : 0, marginTop: 4 }}>
          <div 
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, nodePath)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 4px', borderRadius: 4, cursor: 'pointer', outline: 'none' }} 
            onClick={() => toggleExpand(nodePath)}
          >
            {isExpanded ? <FiChevronDown size={14} color="#9CA3AF" /> : <FiChevronRight size={14} color="#9CA3AF" />}
            {currentKey && <span style={{ fontWeight: 600, color: 'var(--theme-primary)', fontSize: 12 }}>{currentKey}:</span>}
            <span style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>{label}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onSelectPath(nodePath); }}
              title="Focus on this node"
              style={{
                border: 'none', cursor: 'pointer',
                color: 'var(--theme-primary)', fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', opacity: 0.7, padding: '2px 6px',
                borderRadius: 4, background: 'var(--theme-primary-glow)'
              }}
            >
              Focus
            </button>
          </div>
          {isExpanded && (
            <div style={{ borderLeft: '1px dashed var(--border)', marginLeft: 6, paddingLeft: 6 }}>
              {keys.map(k => renderNode(val[k], k, nodePath))}
            </div>
          )}
        </div>
      );
    }

    const displayVal = val === null ? 'null' : String(val);
    
    // Highlight matching search text
    const searchLower = search.toLowerCase();
    const isMatched = searchLower && (
      currentKey.toLowerCase().includes(searchLower) ||
      displayVal.toLowerCase().includes(searchLower)
    );

    let valColor = '#059669'; // string default
    if (typeof val === 'number') valColor = '#2563EB';
    if (typeof val === 'boolean') valColor = '#D97706';
    if (val === null || val === undefined) valColor = '#6B7280';

    return (
      <div 
        key={nodePath} 
        tabIndex={0}
        onKeyDown={(e) => handleKeyDown(e, nodePath)}
        style={{ 
          marginLeft: currentPath ? 16 : 0, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 6, 
          padding: '2px 4px', 
          fontSize: 12,
          background: isMatched ? 'rgba(234, 179, 8, 0.2)' : 'transparent',
          borderRadius: 4,
          outline: 'none'
        }}
      >
        {currentKey && <span style={{ fontWeight: 600, color: 'var(--text-secondary, #4B5563)' }}>{currentKey}:</span>}
        <span style={{ color: valColor, wordBreak: 'break-all', fontFamily: 'monospace' }}>{displayVal}</span>
        <button
          onClick={() => copyToClipboard(`{{${nodePath}}}`, nodePath)}
          title={copiedPath === nodePath ? "Copied!" : "Copy expression"}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedPath === nodePath ? '#10B981' : '#9CA3AF', display: 'flex', alignItems: 'center', padding: 2 }}
        >
          {copiedPath === nodePath ? <FiCheck size={10} color="#10B981" /> : <FiCopy size={10} />}
        </button>
      </div>
    );
  };

  if (data === undefined) {
    return <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>No context data available</div>;
  }

  return <div style={{ padding: '8px 16px' }}>{renderNode(data, '', path)}</div>;
}

JsonTree.propTypes = {
  data: PropTypes.any,
  path: PropTypes.string,
  onSelectPath: PropTypes.func.isRequired,
  search: PropTypes.string
};

// Spreadsheet Table View Component
function TableView({ data, onSelectPath, search = '' }) {
  if (data === null || data === undefined) {
    return <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>No data available</div>;
  }

  const searchLower = search.toLowerCase();

  // If array of items
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>Empty Array</div>;
    }

    const firstItem = data[0];
    const isArrayOfObjects = typeof firstItem === 'object' && firstItem !== null;

    if (isArrayOfObjects) {
      const allKeys = Array.from(new Set(data.flatMap(item => item ? Object.keys(item) : [])));

      const filteredRows = data.filter(row => {
        if (!search) return true;
        return allKeys.some(k => {
          const val = row[k];
          return String(val || '').toLowerCase().includes(searchLower);
        });
      });

      return (
        <div style={{ width: '100%', overflowX: 'auto', maxHeight: '400px', border: '1px solid var(--border)', borderRadius: 8 }} className="custom-scrollbar">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-primary, #F9FAFB)', zIndex: 1, borderBottom: '2px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 800 }}>#</th>
                {allKeys.map(k => (
                  <th key={k} style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 800 }}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => (
                <tr key={index} style={{ borderBottom: '1px solid var(--border)', background: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>{index}</td>
                  {allKeys.map(k => {
                    const val = row ? row[k] : undefined;
                    const displayVal = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '');
                    return (
                      <td key={k} style={{ padding: '10px 12px', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: 200 }} title={displayVal}>
                        {displayVal}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      const filteredRows = data.filter(item => String(item).toLowerCase().includes(searchLower));
      return (
        <div style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '10px 12px', fontWeight: 800 }}>Index</th>
                <th style={{ padding: '10px 12px', fontWeight: 800 }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{index}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{String(item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }

  // If single object
  if (typeof data === 'object') {
    const keys = Object.keys(data);
    const filteredKeys = keys.filter(k => {
      if (!search) return true;
      const val = data[k];
      const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return k.toLowerCase().includes(searchLower) || valStr.toLowerCase().includes(searchLower);
    });

    return (
      <div style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
          <thead style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '10px 12px', fontWeight: 800 }}>Key</th>
              <th style={{ padding: '10px 12px', fontWeight: 800 }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {filteredKeys.map(k => {
              const val = data[k];
              const displayVal = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '');
              return (
                <tr key={k} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td
                    style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--theme-primary)', cursor: 'pointer' }}
                    onClick={() => onSelectPath(k)}
                    title="Focus key"
                  >
                    {k}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: 250 }} title={displayVal}>
                    {displayVal}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Primitive value
  return (
    <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-primary)', fontFamily: 'monospace', fontSize: 13 }}>
      {String(data)}
    </div>
  );
}

TableView.propTypes = {
  data: PropTypes.any,
  onSelectPath: PropTypes.func.isRequired,
  search: PropTypes.string
};

// Schema View Component
function SchemaView({ data, search = '' }) {
  const schemaPaths = React.useMemo(() => {
    return getSchemaPaths(data);
  }, [data]);

  const filteredSchema = schemaPaths.filter(s => {
    if (!search) return true;
    return s.path.toLowerCase().includes(search.toLowerCase()) || s.type.toLowerCase().includes(search.toLowerCase());
  });

  const getTypeColor = (type) => {
    if (type.startsWith('array')) return { bg: 'rgba(147, 51, 234, 0.1)', text: '#9333EA' };
    if (type === 'object') return { bg: 'rgba(79, 70, 229, 0.1)', text: '#4F46E5' };
    if (type === 'string') return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981' };
    if (type === 'number') return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6' };
    if (type === 'boolean') return { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B' };
    return { bg: 'rgba(107, 114, 128, 0.1)', text: '#6B7280' };
  };

  return (
    <div style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
        <thead style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border)' }}>
          <tr>
            <th style={{ padding: '10px 12px', fontWeight: 800 }}>Field</th>
            <th style={{ padding: '10px 12px', fontWeight: 800 }}>Type</th>
            <th style={{ padding: '10px 12px', fontWeight: 800 }}>Sample</th>
          </tr>
        </thead>
        <tbody>
          {filteredSchema.map((s, index) => {
            const colors = getTypeColor(s.type);
            return (
              <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{s.path}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: colors.bg, color: colors.text, textTransform: 'uppercase' }}>
                    {s.type}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontFamily: 'monospace', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: 150 }} title={s.sample}>
                  {s.sample}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

SchemaView.propTypes = {
  data: PropTypes.any,
  search: PropTypes.string
};
