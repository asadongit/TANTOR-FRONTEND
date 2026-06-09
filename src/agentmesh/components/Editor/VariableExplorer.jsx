import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useRunStore, useWorkflowStore } from '../../store';
import {
  FiSearch, FiCopy, FiChevronRight, FiChevronDown, FiDatabase,
  FiActivity, FiTerminal, FiX
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const THEME_ACCENT = 'var(--theme-primary)';
const THEME_BORDER = 'var(--border)';
const THEME_TEXT = 'var(--text-primary)';

export default function VariableExplorer({ onClose }) {
  const { latestContext } = useRunStore();
  const { nodes: workflowNodes } = useWorkflowStore();
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(['General', 'Nodes']);

  // Map IDs to Human Labels
  const nodeLabelMap = Object.fromEntries(workflowNodes.map(n => [n.id, n.data?.label || n.id]));

  // --- Logic with Smart Sampling (Industry Pattern) ---
  const flattenObject = (obj, prefix = '', depth = 0) => {
    // Safety: don't recurse too deep to avoid browser hang
    if (depth > 10) return {};

    return Object.keys(obj).reduce((acc, k) => {
      const pre = prefix.length ? prefix + '.' : '';
      const currentKey = pre + k;
      const val = obj[k];

      // Handle Array Sampling (Only show first 10 items in explorer)
      if (Array.isArray(val)) {
        acc[currentKey] = val; // Store the array itself

        // Only flatten first 10 items to keep the UI clean
        const sampleSize = Math.min(val.length, 10);
        for (let i = 0; i < sampleSize; i++) {
          if (typeof val[i] === 'object' && val[i] !== null) {
            Object.assign(acc, flattenObject(val[i], `${currentKey}.${i}`, depth + 1));
          } else {
            acc[`${currentKey}.${i}`] = val[i];
          }
        }

        if (val.length > 10) {
          acc[`${currentKey}.[note]`] = `... and ${val.length - 10} more items (Hidden for performance)`;
        }
        return acc;
      }

      // Store the current object/value key
      acc[currentKey] = val;

      if (typeof val === 'object' && val !== null) {
        Object.assign(acc, flattenObject(val, currentKey, depth + 1));
      }
      return acc;
    }, {});
  };

  const toggleGroup = (group) => {
    setExpandedGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(`{{${text}}}`);
  };

  const copyAllToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(latestContext, null, 2));
    alert("Full context copied to clipboard!");
  };

  const fullContext = flattenObject(latestContext);
  
  // Inject dynamic system variables so users know they exist
  if (latestContext && Object.keys(latestContext).length > 0) {
    if (!fullContext['msg']) {
      fullContext['msg'] = "The raw text content of the latest message or chat input";
    }
  }

  const keys = Object.keys(fullContext).sort();

  const filteredKeys = keys.filter(k => {
    const searchLower = search.toLowerCase();
    const keyMatch = k.toLowerCase().includes(searchLower);

    // Check Value Match (even nested JSON)
    const val = fullContext[k];
    const valStr = (typeof val === 'object' ? JSON.stringify(val) : String(val)).toLowerCase();
    const valMatch = valStr.includes(searchLower);

    return keyMatch || valMatch;
  });

  const groups = {
    'General': [],
    'System': []
  };

  filteredKeys.forEach(key => {
    if (key.startsWith('nodes.')) {
      const parts = key.split('.');
      const nodeId = parts[1];
      const label = nodeLabelMap[nodeId] || nodeId;
      const groupName = `NODE: ${label.toUpperCase()}`;
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(key);
    } else if (['thread_id', 'workflow_id', 'workflow_name', 'user_id', 'target_node_id', 'msg'].includes(key)) {
      groups['System'].push(key);
    } else {
      groups['General'].push(key);
    }
  });

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

      {/* Search */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid var(--border)` }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <FiSearch style={{ position: 'absolute', left: 12, color: '#9CA3AF' }} size={14} />
          <input
            type="text"
            placeholder="Search variables..."
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
      </div>

      {/* Scrollable List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0', display: 'flex', flexDirection: 'column' }}>
        {Object.entries(groups).map(([groupName, groupKeys]) => (
          groupKeys.length > 0 && (
            <div key={groupName} style={{ marginBottom: 4 }}>
              <div
                onClick={() => toggleGroup(groupName)}
                style={{
                  padding: '8px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  userSelect: 'none',
                  background: expandedGroups.includes(groupName) ? 'rgba(0,0,0,0.02)' : 'transparent'
                }}
              >
                {expandedGroups.includes(groupName) ? <FiChevronDown size={14} color="#9CA3AF" /> : <FiChevronRight size={14} color="#9CA3AF" />}
                <span style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {groupName} ({groupKeys.length})
                </span>
              </div>

              <AnimatePresence>
                {expandedGroups.includes(groupName) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    {groupKeys.map(key => (
                      <VariableItem
                        key={key}
                        name={key}
                        value={fullContext[key]}
                        onCopy={() => copyToClipboard(key)}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        ))}

        {filteredKeys.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.5
          }}>
            <FiTerminal size={32} style={{ marginBottom: 12, color: 'var(--theme-primary)' }} />
            <div style={{ fontSize: 13, fontWeight: 600 }}>No variables found</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Run the workflow to see data</div>
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
        gap: 8
      }}>
        <FiActivity size={12} color="var(--theme-primary)" />
        LIVE SYNC ACTIVE
      </div>
    </div>
  );
}

function VariableItem({ name, value, onCopy }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
  const isObject = typeof value === 'object' && value !== null;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', `{{${name}}}`);
        e.dataTransfer.setData('application/agentmesh-variable', name);
      }}
      style={{
        padding: '10px 24px',
        borderBottom: '1px solid var(--border-light, rgba(0,0,0,0.02))',
        background: isHovered ? 'var(--bg-hover, rgba(0,0,0,0.015))' : 'transparent',
        transition: 'all 0.15s',
        position: 'relative',
        cursor: 'grab'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            color: THEME_TEXT,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: isObject ? 'var(--theme-primary)' : '#94A3B8' }} />
            {name.endsWith('.data') ? 'FULL PAYLOAD' : name.split('.').pop()}
            {isObject && (
              <span style={{
                fontSize: 8, background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)',
                padding: '1px 4px', borderRadius: 4, fontWeight: 900
              }}>JSON</span>
            )}
          </div>

          <div
            onClick={() => isObject && setIsOpen(!isOpen)}
            style={{
              fontSize: 11,
              color: 'var(--text-secondary, #6B7280)',
              marginTop: 4,
              display: '-webkit-box',
              WebkitLineClamp: isOpen ? 50 : 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              cursor: isObject ? 'pointer' : 'default',
              fontFamily: 'monospace',
              background: 'var(--bg-primary, #F8F9FA)',
              padding: '4px 8px',
              borderRadius: 6,
              border: '1px solid var(--border)'
            }}
          >
            {displayValue}
          </div>
        </div>

        <button
          onClick={onCopy}
          style={{
            width: 28, height: 28, borderRadius: 6,
            background: isHovered ? 'var(--theme-primary)' : 'transparent',
            border: `1px solid ${isHovered ? 'transparent' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: isHovered ? '0 4px 12px rgba(142, 119, 187, 0.2)' : 'none',
            color: isHovered ? 'white' : '#9CA3AF'
          }}
          title="Copy Expression"
        >
          <FiCopy size={12} />
        </button>
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            style={{
              position: 'absolute',
              right: '105%',
              top: 0,
              width: 300,
              maxHeight: 400,
              background: '#1F2937',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              zIndex: 10000,
              border: '1px solid rgba(255,255,255,0.1)',
              overflow: 'auto',
              pointerEvents: 'none'
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 800, color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Value Preview</div>
            <pre style={{
              margin: 0,
              fontSize: 11,
              color: '#F9FAFB',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}>
              {displayValue}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

VariableExplorer.propTypes = {
  onClose: PropTypes.func.isRequired
};

VariableItem.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  onCopy: PropTypes.func.isRequired
};
