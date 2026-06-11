import React from 'react';
import PropTypes from 'prop-types';
import { THEME_SECONDARY, THEME_BORDER } from './constants';

export function MinimalButton({ label, variant = 'primary', onClick, disabled }) {
  const variants = {
    primary: { bg: THEME_SECONDARY, text: 'white', border: 'none', hover: '#4F46E5' },
    secondary: { bg: '#F3F4F6', text: '#374151', border: `1px solid ${THEME_BORDER}`, hover: '#E5E7EB' },
    success: { bg: 'rgba(16, 185, 129, 0.08)', text: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)', hover: 'rgba(16, 185, 129, 0.15)' },
    danger: { bg: 'rgba(244, 63, 94, 0.08)', text: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.25)', hover: 'rgba(244, 63, 94, 0.15)' }
  };

  const style = variants[variant] || variants.primary;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 16px',
        borderRadius: 8,
        background: style.bg,
        border: style.border,
        color: style.text,
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.6 : 1
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = style.hover;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = style.bg;
      }}
    >
      {label}
    </button>
  );
}

MinimalButton.propTypes = {
  label: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger']),
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export function ActionButton({ label, color, onClick, disabled, tooltip }) {
  const colors = {
    green: { bg: '#10B981', hover: '#059669', text: '#FFFFFF' },
    blue: { bg: THEME_SECONDARY, hover: '#4F46E5', text: 'white' },
    red: { bg: '#EF4444', hover: '#DC2626', text: 'white' }
  };

  const style = colors[color] || colors.green;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onClick}
        disabled={disabled}
        title={tooltip}
        style={{
          width: '100%',
          padding: '14px 16px',
          borderRadius: 12,
          background: style.bg,
          border: 'none',
          color: style.text,
          fontSize: 13,
          fontWeight: 700,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: disabled ? 0.6 : 1,
          transform: 'scale(1)'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = style.hover;
            e.currentTarget.style.transform = 'scale(1.02)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = style.bg;
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {label}
      </button>
      {tooltip && (
        <div style={{
          position: 'absolute',
          bottom: '-32px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#111827',
          color: 'white',
          padding: '6px 12px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.15s',
          zIndex: 100
        }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}

ActionButton.propTypes = {
  label: PropTypes.string.isRequired,
  color: PropTypes.oneOf(['green', 'blue', 'red']),
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  tooltip: PropTypes.string
};

export function ActionButtonGroup({ actions = [], onApprove, onRework, onReject, isLoading }) {
  const hasApprove = actions.includes('approve');
  const hasRework = actions.includes('rework');
  const hasReject = actions.includes('reject');

  const cols = (hasApprove ? 1 : 0) + (hasRework ? 1 : 0) + (hasReject ? 1 : 0);
  
  let gridTemplate = '1fr';
  if (cols === 2) {
    gridTemplate = '1fr 1fr';
  } else if (cols === 3) {
    gridTemplate = '1fr 1fr 1fr';
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: gridTemplate,
      gap: 10
    }}>
      {hasApprove && (
        <MinimalButton
          label="Approve"
          variant="success"
          onClick={onApprove}
          disabled={isLoading}
        />
      )}
      {hasRework && (
        <MinimalButton
          label="Edit"
          variant="secondary"
          onClick={onRework}
          disabled={isLoading}
        />
      )}
      {hasReject && (
        <MinimalButton
          label="Discard"
          variant="danger"
          onClick={onReject}
          disabled={isLoading}
        />
      )}
    </div>
  );
}

ActionButtonGroup.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string).isRequired,
  onApprove: PropTypes.func.isRequired,
  onRework: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

export function ReworkFormPanel({ 
  feedback, 
  onChange, 
  includeOriginal, 
  setIncludeOriginal, 
  injectFeedback, 
  setInjectFeedback, 
  onSubmit, 
  onCancel, 
  isLoading 
}) {
  const textareaId = React.useId();
  const isSubmitDisabled = isLoading || !feedback.trim();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label htmlFor={textareaId} style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 700,
          color: '#6B7280',
          marginBottom: 10,
          textTransform: 'uppercase'
        }}>
          {"Your Feedback"}{" "}<span style={{ color: '#EF4444', marginLeft: 4 }}>*</span>
        </label>
        <textarea
          id={textareaId}
          value={feedback}
          onChange={(e) => onChange(e.target.value)}
          placeholder="What would you like the agent to adjust? (e.g., 'Focus more on recent developments' or 'Include cost analysis')"
          style={{
            width: '100%',
            minHeight: 120,
            padding: 14,
            borderRadius: 8,
            border: '1px solid #E5E7EB',
            background: '#F9FAFB',
            fontSize: 13,
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            lineHeight: 1.5
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#8E77BB';
            e.currentTarget.style.background = '#FFFFFF';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = THEME_BORDER;
            e.currentTarget.style.background = '#F9FAFB';
          }}
        />
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
          {feedback.length} / 500 characters
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={includeOriginal}
            onChange={(e) => setIncludeOriginal(e.target.checked)}
            style={{
              width: 16,
              height: 16,
              cursor: 'pointer',
              accentColor: '#8E77BB'
            }}
          />
          <span style={{ fontSize: 12, color: '#6B7280' }}>Include original output for reference</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={injectFeedback}
            onChange={(e) => setInjectFeedback(e.target.checked)}
            style={{
              width: 16,
              height: 16,
              cursor: 'pointer',
              accentColor: '#8E77BB'
            }}
          />
          <span style={{ fontSize: 12, color: '#6B7280' }}>Inject feedback into next prompt</span>
        </label>
      </div>

      <div style={{ display: 'flex', gap: 12, paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>
        <button
          onClick={onCancel}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #E5E7EB',
            background: 'white',
            color: '#6B7280',
            fontSize: 13,
            fontWeight: 700,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F9FAFB';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
          }}
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            background: isSubmitDisabled ? '#E5E7EB' : '#8E77BB',
            border: 'none',
            color: isSubmitDisabled ? '#9CA3AF' : 'white',
            fontSize: 13,
            fontWeight: 700,
            cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            if (!isSubmitDisabled) {
              e.currentTarget.style.background = '#7A64A9';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitDisabled) {
              e.currentTarget.style.background = '#8E77BB';
            }
          }}
        >
          {isLoading ? 'Submitting...' : 'Submit Rework'}
        </button>
      </div>
    </div>
  );
}

ReworkFormPanel.propTypes = {
  feedback: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  includeOriginal: PropTypes.bool.isRequired,
  setIncludeOriginal: PropTypes.func.isRequired,
  injectFeedback: PropTypes.bool.isRequired,
  setInjectFeedback: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};
