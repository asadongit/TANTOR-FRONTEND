import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { THEME_BORDER, THEME_TEXT, THEME_ACCENT } from './constants';

export default function PauseModal({ isOpen, title, icon: Icon, maxWidth = 600, bodyPadding = '24px', children }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '52px',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 8000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        pointerEvents: 'auto'
      }}
    >
      {/* Modal Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        style={{
          position: 'relative',
          zIndex: 8001,
          width: '100%',
          maxWidth,
          maxHeight: 'calc(100% - 48px)',
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFFFF',
          borderRadius: 24,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '24px 24px 16px',
          borderBottom: `1px solid ${THEME_BORDER}`,
          background: '#FAFBFC',
          flexShrink: 0
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 900,
            color: THEME_TEXT,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            {Icon && <Icon size={16} color={THEME_ACCENT} />} {title}
          </div>
        </div>

        {/* Modal Body */}
        <div style={{
          padding: bodyPadding,
          overflow: 'auto',
          flex: 1,
          overscrollBehavior: 'contain',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

PauseModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  maxWidth: PropTypes.number,
  bodyPadding: PropTypes.string,
  children: PropTypes.node
};

