import React from 'react';
import PropTypes from 'prop-types';
import { FiInfo, FiCheckCircle, FiAlertTriangle, FiAlertCircle } from 'react-icons/fi';
import { FONT } from './primitives';

export default function InfoBanner({ type = 'info', children, icon: CustomIcon, style = {} }) {
  const configs = {
    info: {
      background: 'rgba(59, 130, 246, 0.05)',
      border: '1px dashed rgba(59, 130, 246, 0.2)',
      color: '#0369A1',
      icon: FiInfo,
    },
    success: {
      background: '#F0FDF4',
      border: '1px solid #BBF7D0',
      color: '#166534',
      icon: FiCheckCircle,
    },
    warning: {
      background: '#FFFBEB',
      border: '1px solid #FDE68A',
      color: '#92400E',
      icon: FiAlertTriangle,
    },
    danger: {
      background: '#FEF2F2',
      border: '1px solid #FEE2E2',
      color: '#EF4444',
      icon: FiAlertCircle,
    },
    neutral: {
      background: '#F8FAFC',
      border: '1px solid var(--border)',
      color: 'var(--text-secondary, #334155)',
      icon: FiInfo,
    },
  };

  const currentConfig = configs[type] || configs.info;
  const Icon = CustomIcon === undefined ? currentConfig.icon : CustomIcon;

  return (
    <div
      style={{
        padding: '12px 16px',
        background: currentConfig.background,
        borderRadius: 12,
        fontSize: 11,
        color: currentConfig.color,
        border: currentConfig.border,
        lineHeight: 1.6,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        fontFamily: FONT,
        marginBottom: 16,
        ...style,
      }}
    >
      {Icon && <Icon size={14} style={{ marginTop: 2, flexShrink: 0 }} />}
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

InfoBanner.propTypes = {
  type: PropTypes.oneOf(['info', 'success', 'warning', 'danger', 'neutral']),
  children: PropTypes.node.isRequired,
  icon: PropTypes.elementType,
  style: PropTypes.object,
};
