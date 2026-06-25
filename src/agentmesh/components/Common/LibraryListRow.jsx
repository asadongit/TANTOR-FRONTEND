/**
 * LibraryListRow Component
 * 
 * A standardized, reusable list view row component used across AgentMesh library pages (Agents, APIs, Skills, etc.).
 * It implements a unified, premium row layout designed for dense lists:
 * - Left edge accent border mapping the theme active color.
 * - Icon/Avatar on the left, next to the Title/Name.
 * - Single-line description preview with tag indicators.
 * - Right aligned action triggers (primary, secondary) and a dynamic "More Options" dropdown menu.
 * 
 * CRITICAL: When creating new library resource tabs or lists, use this component instead of writing custom row code.
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { FiMoreHorizontal } from 'react-icons/fi';

function ActionDropdown({ actions, isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      style={{
        position: 'absolute', top: '100%', right: 0, marginTop: 8,
        background: 'white', border: '1px solid #E5E7EB', borderRadius: 12,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 50,
        minWidth: 160, padding: '6px'
      }}
    >
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={(e) => { e.stopPropagation(); a.onClick(); onClose(); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8, border: 'none', background: 'none',
            fontSize: 13, fontWeight: 500, color: a.variant === 'danger' ? '#EF4444' : '#374151',
            cursor: 'pointer', transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = a.variant === 'danger' ? '#FEF2F2' : '#F3F4F6'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
        >
          {a.icon} {a.label}
        </button>
      ))}
    </motion.div>
  );
}

ActionDropdown.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
    onClick: PropTypes.func.isRequired,
    variant: PropTypes.string
  })).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default function LibraryListRow({
  icon,
  title,
  description,
  tags = [],
  primaryAction,
  secondaryAction,
  moreActions = [],
  idx,
  onClick
}) {
  const [showMore, setShowMore] = useState(false);

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
        zIndex: showMore ? 10 : 1,
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.borderColor = '#E5E7EB';
        e.currentTarget.style.transform = 'translateX(4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--border-light)';
        e.currentTarget.style.transform = 'translateX(0)';
        setShowMore(false);
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'var(--theme-primary)', borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }} />

      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'var(--theme-primary-glow)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        color: 'var(--theme-primary)',
        boxShadow: '0 4px 12px -2px var(--theme-primary-glow)'
      }}>
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {description || "No description provided."}
          </span>
          {tags && tags.length > 0 && (
            <>
              <span style={{ width: 1, height: 12, background: 'var(--border)' }} />
              <div style={{ display: 'flex', gap: 4 }}>
                {tags.map((tag, i) => {
                  const isObj = typeof tag === 'object' && tag !== null;
                  const label = isObj ? tag.label : tag;
                  const hoverTitle = isObj && tag.type ? `${tag.type}: ${tag.label}` : undefined;
                  return (
                    <span key={`${label}-${i}`} title={hoverTitle} style={{ fontSize: 10, color: 'var(--text-muted)' }}>#{label}</span>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            style={{
              height: 32, border: 'none', borderRadius: 8,
              background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)', padding: '0 14px', display: 'flex', alignItems: 'center',
              gap: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-primary)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--theme-primary-glow)'; e.currentTarget.style.color = 'var(--theme-primary)'; }}
          >
            <span>{primaryAction.label}</span>
          </button>
        )}

        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            style={{
              height: 32, border: '1px solid #E5E7EB', borderRadius: 8,
              background: 'white', color: '#111827', padding: '0 12px', display: 'flex', alignItems: 'center',
              gap: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            <span>{secondaryAction.label}</span>
          </button>
        )}

        {moreActions && moreActions.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMore(!showMore)}
              title="More Options"
              style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E7EB',
                background: 'white', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              <FiMoreHorizontal size={16} />
            </button>
            <ActionDropdown actions={moreActions} isOpen={showMore} onClose={() => setShowMore(false)} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

LibraryListRow.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.string),
  primaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired
  }),
  secondaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired
  }),
  moreActions: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
    onClick: PropTypes.func.isRequired,
    variant: PropTypes.string
  })),
  idx: PropTypes.number.isRequired,
  onClick: PropTypes.func
};
