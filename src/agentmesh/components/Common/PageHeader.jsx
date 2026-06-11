import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiInfo } from 'react-icons/fi';
import PropTypes from 'prop-types';

export default function PageHeader({ title, description, letterSpacing }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: 0,
          letterSpacing: letterSpacing || 'normal'
        }}
      >
        {title}
      </h1>

      <button
        type="button"
        aria-label={`${title} info`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          margin: 0,
          cursor: 'help',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          outline: 'none'
        }}
      >
        <motion.div
          animate={{
            scale: isHovered ? 1.15 : 1,
            color: isHovered ? 'var(--theme-primary)' : 'var(--text-muted)'
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}
        >
          <FiInfo size={16} />
        </motion.div>
      </button>

      {/* Premium Glassmorphic Tooltip */}
      <AnimatePresence>
        {isHovered && description && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              left: 0,
              width: '280px',
              background: 'rgba(15, 23, 42, 0.93)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '12px 14px',
              boxShadow: '0 12px 30px -4px rgba(15, 23, 42, 0.3)',
              zIndex: 999,
              pointerEvents: 'none'
            }}
          >
            {/* Small tooltip indicator arrow */}
            <div
              style={{
                position: 'absolute',
                top: '-5px',
                left: '14px',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderBottom: '5px solid rgba(15, 23, 42, 0.93)'
              }}
            />
            <p
              style={{
                margin: 0,
                fontSize: '12px',
                fontWeight: 500,
                lineHeight: 1.5,
                color: '#E2E8F0',
                letterSpacing: 'normal',
                textAlign: 'left'
              }}
            >
              {description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  letterSpacing: PropTypes.string
};
