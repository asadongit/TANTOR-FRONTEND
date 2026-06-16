import React from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTrash, FiPlus } from 'react-icons/fi';
import { THEME_BORDER, THEME_TEXT, THEME_ACCENT } from './constants';

export default function HistorySidebar({
  isOpen,
  onClose,
  history = [],
  threadId,
  onOpenThread,
  onDeleteThread,
  onNewConversation
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 2000 }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)', backdropFilter: 'blur(4px)' }}
          />
          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: 320, background: 'white',
              borderRight: `1px solid ${THEME_BORDER}`,
              display: 'flex', flexDirection: 'column',
              boxShadow: '20px 0 50px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{
              padding: '24px 20px', borderBottom: `1px solid ${THEME_BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: THEME_TEXT, letterSpacing: '-0.02em' }}>RUN HISTORY</div>
              <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF' }}>
                <FiX size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }} className="custom-scrollbar">
              {history.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13, fontWeight: 500 }}>
                  No sessions recorded for this workflow yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {history.map((h) => (
                    <div
                      key={h.thread_id}
                      onClick={() => onOpenThread(h.thread_id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          onOpenThread(h.thread_id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 12,
                        cursor: 'pointer',
                        background: threadId === h.thread_id ? 'rgba(142, 119, 187, 0.06)' : 'transparent',
                        border: `1px solid ${threadId === h.thread_id ? 'rgba(142, 119, 187, 0.15)' : 'transparent'}`,
                        display: 'flex', flexDirection: 'column', gap: 2,
                        transition: 'all 0.2s',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        if (threadId !== h.thread_id) e.currentTarget.style.background = '#F9FAFB';
                        const deleteBtn = e.currentTarget.querySelector('.delete-btn');
                        if (deleteBtn) deleteBtn.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        if (threadId !== h.thread_id) e.currentTarget.style.background = 'transparent';
                        const deleteBtn = e.currentTarget.querySelector('.delete-btn');
                        if (deleteBtn) deleteBtn.style.opacity = '0';
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: threadId === h.thread_id ? THEME_ACCENT : THEME_TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 24 }}>
                        {h.first_message}
                      </div>
                      <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>
                        {new Date(h.created_at).toLocaleDateString()} at {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>

                      <button
                        className="delete-btn"
                        onClick={(e) => onDeleteThread(e, h.thread_id)}
                        style={{
                          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                          width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent',
                          color: '#FCA5A5', opacity: 0, transition: 'all 0.2s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <FiTrash size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: 16, borderTop: `1px solid ${THEME_BORDER}` }}>
              <button
                onClick={onNewConversation}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12,
                  background: '#1C1C1E', color: 'white', border: 'none',
                  fontSize: 13, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                <FiPlus size={14} /> NEW SESSION
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

HistorySidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  history: PropTypes.arrayOf(
    PropTypes.shape({
      thread_id: PropTypes.string.isRequired,
      first_message: PropTypes.string,
      created_at: PropTypes.string
    })
  ),
  threadId: PropTypes.string,
  onOpenThread: PropTypes.func.isRequired,
  onDeleteThread: PropTypes.func.isRequired,
  onNewConversation: PropTypes.func.isRequired
};
