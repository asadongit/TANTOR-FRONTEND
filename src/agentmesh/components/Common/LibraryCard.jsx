/**
 * LibraryCard Component
 * 
 * A standardized, reusable card component used across AgentMesh library pages (Agents, APIs, Skills, etc.).
 * It implements a unified, premium layout matching the design patterns of the application:
 * - Header: Icon/Avatar on the left, Title/Name on the right.
 * - Body: Auto-clamped multi-line description and a list of tags (with gray background styling).
 * - Footer Actions: Primary and secondary button triggers, plus a dynamic "More Options" dropdown menu.
 * 
 * CRITICAL: When creating new library resource tabs or grids, use this component instead of writing custom card code.
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

export default function LibraryCard({
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.23, 1, 0.32, 1] }}
      style={{
        background: 'white',
        border: '1px solid var(--border-light)',
        borderRadius: 24,
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: showMore ? 10 : 1,
        height: '100%',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.borderColor = '#E2E8F0';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.borderColor = 'var(--border-light)';
        setShowMore(false);
      }}
    >
      {/* Card Header (Avatar left, Name/Labels right) */}
      <div style={{ padding: '20px 20px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--theme-primary-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--theme-primary)',
            boxShadow: '0 4px 12px -2px var(--theme-primary-glow)',
            flexShrink: 0
          }}>
            {icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: 17, fontWeight: 800, color: 'var(--text-primary)',
              margin: 0, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {title}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p style={{
          fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          marginBottom: 12, margin: '0 0 12px'
        }}>
          {description || "No description provided."}
        </p>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 'auto' }}>
            {tags.map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  background: 'var(--border-light)',
                  color: 'var(--text-secondary)',
                  padding: '2px 8px',
                  borderRadius: 4
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div style={{
        padding: '12px 16px',
        background: '#F9FAFB',
        borderTop: '1px solid #F1F5F9',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        display: 'flex', alignItems: 'center', gap: 8,
        position: 'relative'
      }}>
        {primaryAction && (
          <button
            onClick={(e) => { e.stopPropagation(); primaryAction.onClick(); }}
            style={{
              height: 36, padding: '0 16px', borderRadius: 8, border: 'none',
              background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)', fontSize: 11, fontWeight: 800,
              cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--theme-primary)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--theme-primary-glow)'; e.currentTarget.style.color = 'var(--theme-primary)'; }}
          >
            <span>{primaryAction.label}</span>
          </button>
        )}

        {secondaryAction && (
          <button
            onClick={(e) => { e.stopPropagation(); secondaryAction.onClick(); }}
            style={{
              height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid #E5E7EB',
              background: 'white', color: '#111827', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            <span>{secondaryAction.label}</span>
          </button>
        )}

        <div style={{ flex: 1 }} />

        {moreActions && moreActions.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMore(!showMore); }}
              title="More Options"
              style={{
                width: 36, height: 36, borderRadius: 8, border: '1px solid #E5E7EB',
                background: 'white', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              <FiMoreHorizontal size={18} />
            </button>
            <ActionDropdown actions={moreActions} isOpen={showMore} onClose={() => setShowMore(false)} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

LibraryCard.propTypes = {
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
