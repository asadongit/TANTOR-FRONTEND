import React from 'react';
import PropTypes from 'prop-types';
import { FiInfo, FiCheckCircle, FiAlertTriangle, FiAlertCircle } from 'react-icons/fi';
import { FONT } from './primitives';

export default function InfoBanner({ type = 'info', children, icon: CustomIcon, style = {} }) {
  const configs = {
    info: {
      className: 'bg-blue-500/5 border border-dashed border-blue-500/20 text-[#0369A1]',
      icon: FiInfo,
    },
    success: {
      className: 'bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534]',
      icon: FiCheckCircle,
    },
    warning: {
      className: 'bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E]',
      icon: FiAlertTriangle,
    },
    danger: {
      className: 'bg-[#FEF2F2] border border-[#FEE2E2] text-[#EF4444]',
      icon: FiAlertCircle,
    },
    neutral: {
      className: 'bg-[#F8FAFC] border border-[var(--border)] text-[var(--text-secondary,#334155)]',
      icon: FiInfo,
    },
  };

  const currentConfig = configs[type] || configs.info;
  const Icon = CustomIcon === undefined ? currentConfig.icon : CustomIcon;

  return (
    <div
      className={`p-3 px-4 rounded-xl text-[11px] leading-relaxed flex items-start gap-2 mb-4 ${currentConfig.className}`}
      style={{
        fontFamily: FONT,
        ...style,
      }}
    >
      {Icon && <Icon size={14} className="mt-0.5 shrink-0" />}
      <div className="flex-1">{children}</div>
    </div>
  );
}

InfoBanner.propTypes = {
  type: PropTypes.oneOf(['info', 'success', 'warning', 'danger', 'neutral']),
  children: PropTypes.node.isRequired,
  icon: PropTypes.elementType,
  style: PropTypes.object,
};
