import React, { memo, useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { NodeResizer } from '@xyflow/react';
import { useUIStore, useWorkflowStore } from '../../../store';
import { FiEdit2, FiCheck, FiTrash2, FiMaximize2, FiLock, FiUnlock } from 'react-icons/fi';

const STICKY_NOTE_COLORS = {
  slate: {
    name: 'Slate',
    headerBg: '#F1F5F9',
    bg: 'rgba(248, 250, 252, 0.85)',
    border: '#CBD5E1',
    text: '#475569',
    accent: '#64748B'
  },
  blue: {
    name: 'Blue',
    headerBg: '#E0F2FE',
    bg: 'rgba(240, 249, 255, 0.85)',
    border: '#93C5FD',
    text: '#0369A1',
    accent: '#3B82F6'
  },
  green: {
    name: 'Green',
    headerBg: '#DCFCE7',
    bg: 'rgba(240, 253, 244, 0.85)',
    border: '#86EFAC',
    text: '#15803D',
    accent: '#22C55E'
  },
  purple: {
    name: 'Purple',
    headerBg: '#F3E8FF',
    bg: 'rgba(250, 245, 255, 0.85)',
    border: '#D8B4FE',
    text: '#6B21A8',
    accent: '#A855F7'
  },
  amber: {
    name: 'Amber',
    headerBg: '#FEF3C7',
    bg: 'rgba(255, 251, 235, 0.85)',
    border: '#FCD34D',
    text: '#B45309',
    accent: '#F59E0B'
  },
  red: {
    name: 'Red',
    headerBg: '#FEE2E2',
    bg: 'rgba(254, 242, 242, 0.85)',
    border: '#FCA5A5',
    text: '#B91C1C',
    accent: '#EF4444'
  },
  pink: {
    name: 'Pink',
    headerBg: '#FCE7F3',
    bg: 'rgba(253, 242, 248, 0.85)',
    border: '#F9A8D4',
    text: '#BE185D',
    accent: '#EC4899'
  }
};

function StickyNoteNode({ id, data, selected }) {
  const setNodeData = useWorkflowStore((s) => s.setNodeData);
  const removeNode = useWorkflowStore((s) => s.removeNode);
  const setSelectedNode = useUIStore((s) => s.setSelectedNode);

  const currentColorKey = data.color || 'slate';
  const colors = STICKY_NOTE_COLORS[currentColorKey] || STICKY_NOTE_COLORS.slate;

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(data.label || 'Sticky Note');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState(data.description || '');
  const [hovered, setHovered] = useState(false);

  const titleInputRef = useRef(null);
  const descInputRef = useRef(null);

  // Sync state with incoming store updates
  useEffect(() => {
    setEditedTitle(data.label || 'Sticky Note');
  }, [data.label]);

  useEffect(() => {
    setEditedDesc(data.description || '');
  }, [data.description]);

  const handleStartEditTitle = (e) => {
    e.stopPropagation();
    setIsEditingTitle(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 50);
  };

  const handleSaveTitle = (e) => {
    if (e) e.stopPropagation();
    setIsEditingTitle(false);
    if (editedTitle.trim() && editedTitle !== data.label) {
      setNodeData(id, { label: editedTitle.trim() });
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setEditedTitle(data.label || 'Sticky Note');
    }
  };

  const handleStartEditDesc = (e) => {
    if (e) e.stopPropagation();
    setIsEditingDesc(true);
    setTimeout(() => {
      descInputRef.current?.focus();
      descInputRef.current?.select();
    }, 50);
  };

  const handleSaveDesc = (e) => {
    if (e) e.stopPropagation();
    setIsEditingDesc(false);
    if (editedDesc !== data.description) {
      setNodeData(id, { description: editedDesc });
    }
  };

  const handleDescKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSaveDesc();
    } else if (e.key === 'Escape') {
      setIsEditingDesc(false);
      setEditedDesc(data.description || '');
    }
  };

  const handleColorSelect = (e, colorKey) => {
    e.stopPropagation();
    setNodeData(id, { color: colorKey });
  };

  const handleToggleLock = (e) => {
    e.stopPropagation();
    setNodeData(id, { locked: !data.locked });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this visual section sticky note?')) {
      removeNode(id);
      setSelectedNode(null);
    }
  };

  return (
    <>
      {/* XYFlow Resizer - Hidden when note is locked */}
      {!data.locked && (
        <NodeResizer
          minWidth={200}
          minHeight={120}
          isVisible={selected}
          lineStyle={{ borderColor: colors.accent, borderWidth: 1.5 }}
          handleStyle={{
            width: 8,
            height: 8,
            background: colors.accent,
            border: '1.5px solid white',
            borderRadius: 2
          }}
        />
      )}

      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: colors.bg,
          border: selected 
            ? `2px solid ${colors.accent}` 
            : `1.5px dashed ${colors.border}`,
          borderRadius: 14,
          boxShadow: selected 
            ? '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)' 
            : '0 1px 3px rgba(0, 0, 0, 0.02)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          overflow: 'hidden',
          fontFamily: "'Inter', sans-serif",
          pointerEvents: 'auto',
          position: 'relative'
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: colors.headerBg,
            borderBottom: `1px solid ${colors.border}`,
            userSelect: 'none',
            cursor: data.locked ? 'default' : 'grab'
          }}
        >
          {/* Label & Title Editing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, overflow: 'hidden' }}>
            {/* Locked Padlock Indicator */}
            {data.locked && (
              <FiLock 
                size={11} 
                style={{ color: colors.text, opacity: 0.7, flexShrink: 0 }} 
                title="This Sticky Note is locked"
              />
            )}

            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={handleTitleKeyDown}
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: colors.text,
                  background: 'white',
                  border: `1.5px solid ${colors.accent}`,
                  borderRadius: 4,
                  padding: '2px 6px',
                  width: '90%',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            ) : (
              <div 
                onDoubleClick={handleStartEditTitle}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: colors.text,
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  cursor: 'text'
                }}
                title="Double click to rename"
              >
                {data.label || 'Sticky Note'}
              </div>
            )}

            {!isEditingTitle && (hovered || selected) && (
              <button
                onClick={handleStartEditTitle}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.text,
                  opacity: 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  padding: 2,
                  borderRadius: 4
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                title="Rename Title"
              >
                <FiEdit2 size={10} />
              </button>
            )}
          </div>

          {/* Color Chooser, Lock Toggle, and Delete Action */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              opacity: (hovered || selected || data.locked) ? 1 : 0,
              transition: 'opacity 0.2s',
              marginLeft: 8
            }}
          >
            {/* Color Dots */}
            {!data.locked && (hovered || selected) && (
              <div style={{ display: 'flex', gap: 4 }}>
                {Object.keys(STICKY_NOTE_COLORS).map((colorKey) => {
                  const isCurrent = colorKey === currentColorKey;
                  const optColors = STICKY_NOTE_COLORS[colorKey];
                  return (
                    <button
                      key={colorKey}
                      onClick={(e) => handleColorSelect(e, colorKey)}
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: optColors.accent,
                        border: isCurrent ? '1.5px solid white' : 'none',
                        boxShadow: isCurrent ? `0 0 0 1px ${optColors.accent}` : 'none',
                        cursor: 'pointer',
                        padding: 0,
                        transform: isCurrent ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.15s'
                      }}
                      title={optColors.name}
                    />
                  );
                })}
              </div>
            )}

            {/* Separator */}
            {!data.locked && (hovered || selected) && (
              <div style={{ width: 1, height: 12, background: colors.border }} />
            )}

            {/* Lock / Unlock Toggle Button */}
            <button
              onClick={handleToggleLock}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: data.locked ? '#EF4444' : colors.text,
                opacity: data.locked ? 0.9 : 0.6,
                display: 'flex',
                alignItems: 'center',
                padding: 2,
                borderRadius: 4
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = data.locked ? 0.9 : 0.6}
              title={data.locked ? 'Unlock Sticky Note (Allow movement/resizing)' : 'Lock Sticky Note (Prevent movement/resizing)'}
            >
              {data.locked ? <FiLock size={12} /> : <FiUnlock size={12} />}
            </button>

            {/* Delete button */}
            {!data.locked && (
              <button
                onClick={handleDelete}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.text,
                  opacity: 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  padding: 2,
                  borderRadius: 4
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = '#EF4444'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.6; e.currentTarget.style.color = colors.text; }}
                title="Delete Sticky Note"
              >
                <FiTrash2 size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Content & Description Area */}
        <div 
          style={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: 12,
            overflow: 'hidden',
            pointerEvents: 'auto'
          }}
        >
          {isEditingDesc ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }} onClick={e => e.stopPropagation()}>
              <textarea
                ref={descInputRef}
                value={editedDesc}
                onChange={(e) => setEditedDesc(e.target.value)}
                onBlur={handleSaveDesc}
                onKeyDown={handleDescKeyDown}
                placeholder="Write description about this area..."
                rows={4}
                style={{
                  fontSize: 11,
                  color: colors.text,
                  background: 'white',
                  border: `1.5px solid ${colors.accent}`,
                  borderRadius: 6,
                  padding: '6px 8px',
                  width: '100%',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  lineHeight: 1.4
                }}
              />
              <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsEditingDesc(false)}
                  style={{
                    padding: '2px 8px',
                    fontSize: 10,
                    borderRadius: 4,
                    border: `1px solid ${colors.border}`,
                    background: 'white',
                    color: colors.text,
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDesc}
                  style={{
                    padding: '2px 8px',
                    fontSize: 10,
                    borderRadius: 4,
                    border: 'none',
                    background: colors.accent,
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div 
              onDoubleClick={handleStartEditDesc}
              style={{
                fontSize: 11,
                color: colors.text,
                opacity: 0.8,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                fontStyle: 'italic',
                cursor: 'text',
                flex: 1,
                userSelect: 'none'
              }}
              title="Double click to edit description"
            >
              {data.description || (
                (hovered || selected) && !data.locked ? (
                  <span style={{ opacity: 0.4, border: '1px dashed transparent', padding: '2px 4px', borderRadius: 4 }}>
                    + Double-click to add a description...
                  </span>
                ) : null
              )}
            </div>
          )}

          {/* Bottom Maximize Indicator (Resize Handle guide) */}
          {selected && !data.locked && !isEditingDesc && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', pointerEvents: 'none' }}>
              <FiMaximize2 
                size={12} 
                style={{ 
                  color: colors.accent,
                  opacity: 0.4,
                  transform: 'rotate(90deg)'
                }} 
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

StickyNoteNode.propTypes = {
  id: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  data: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.string,
    label: PropTypes.string,
    description: PropTypes.string,
    color: PropTypes.string,
    locked: PropTypes.bool
  }).isRequired
};

export default memo(StickyNoteNode);
