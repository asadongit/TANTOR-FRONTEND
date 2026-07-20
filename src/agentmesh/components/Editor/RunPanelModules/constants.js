import { PAUSE_NODE_TYPES } from './pauseRegistry';

export const THEME_BG = '#FFFFFF';
export const THEME_GRAY = '#F9FAFB';
export const THEME_BORDER = 'rgba(0, 0, 0, 0.08)';
export const THEME_TEXT = '#111827';
export const THEME_ACCENT = 'var(--theme-primary)';
export const THEME_SECONDARY = '#6366F1'; // Vibrant indigo for light accents
export const THEME_USER_BUBBLE = '#F3F4FB'; // Soft light indigo/gray for user messages
export const FONT = "'Inter', 'Outfit', 'Google Sans', 'Roboto', sans-serif";

export const getButtonCategoryStyles = (category) => {
  const styles = {
    action: {
      bg: 'rgba(99, 102, 241, 0.08)',
      color: 'var(--theme-primary, #6366F1)',
      border: 'rgba(99, 102, 241, 0.25)',
      bgHover: 'rgba(99, 102, 241, 0.15)',
      borderHover: 'rgba(99, 102, 241, 0.45)',
      dotColor: 'var(--theme-primary, #6366F1)'
    },
    info: {
      bg: 'rgba(14, 165, 233, 0.08)',
      color: '#0ea5e9',
      border: 'rgba(14, 165, 233, 0.25)',
      bgHover: 'rgba(14, 165, 233, 0.15)',
      borderHover: 'rgba(14, 165, 233, 0.45)',
      dotColor: '#0ea5e9'
    },
    help: {
      bg: 'rgba(168, 85, 247, 0.08)',
      color: '#a855f7',
      border: 'rgba(168, 85, 247, 0.25)',
      bgHover: 'rgba(168, 85, 247, 0.15)',
      borderHover: 'rgba(168, 85, 247, 0.45)',
      dotColor: '#a855f7'
    },
    reject: {
      bg: 'rgba(245, 158, 11, 0.08)',
      color: '#f59e0b',
      border: 'rgba(245, 158, 11, 0.25)',
      bgHover: 'rgba(245, 158, 11, 0.15)',
      borderHover: 'rgba(245, 158, 11, 0.45)',
      dotColor: '#f59e0b'
    },
    delete: {
      bg: 'rgba(244, 63, 94, 0.08)',
      color: '#f43f5e',
      border: 'rgba(244, 63, 94, 0.25)',
      bgHover: 'rgba(244, 63, 94, 0.15)',
      borderHover: 'rgba(244, 63, 94, 0.45)',
      dotColor: '#f43f5e'
    },
    success: {
      bg: 'rgba(16, 185, 129, 0.08)',
      color: '#10b981',
      border: 'rgba(16, 185, 129, 0.25)',
      bgHover: 'rgba(16, 185, 129, 0.15)',
      borderHover: 'rgba(16, 185, 129, 0.45)',
      dotColor: '#10b981'
    }
  };
  return styles[category] || styles.action;
};

export function genThreadId() {
  return 'thread_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
}

export const isProfilingHtml = (val) => {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  return (
    trimmed.startsWith('<!doctype html>') &&
    (trimmed.includes('ydata-profiling') || trimmed.includes('pandas-profiling') || trimmed.includes('Dataset Profile') || trimmed.includes('generator" content="YData'))
  );
};

export const findProfileReportHtml = (ctx) => {
  if (!ctx) return null;

  // 1. Direct top-level check
  if (ctx.profile_report_html && isProfilingHtml(ctx.profile_report_html)) {
    return ctx.profile_report_html;
  }

  // 2. Check in latest_api_result
  if (ctx.latest_api_result && ctx.latest_api_result.profile_report_html && isProfilingHtml(ctx.latest_api_result.profile_report_html)) {
    return ctx.latest_api_result.profile_report_html;
  }

  // 3. Check in nodes keys (e.g., nodes.node_id.profile_report_html or nodes.node_id.latest_api_result.profile_report_html)
  if (ctx.nodes && typeof ctx.nodes === 'object') {
    for (const nodeKey of Object.keys(ctx.nodes)) {
      const nodeObj = ctx.nodes[nodeKey];
      if (nodeObj && typeof nodeObj === 'object') {
        if (nodeObj.profile_report_html && isProfilingHtml(nodeObj.profile_report_html)) {
          return nodeObj.profile_report_html;
        }
        if (nodeObj.latest_api_result && nodeObj.latest_api_result.profile_report_html && isProfilingHtml(nodeObj.latest_api_result.profile_report_html)) {
          return nodeObj.latest_api_result.profile_report_html;
        }
        if (nodeObj[`api_result_${nodeKey}`] && nodeObj[`api_result_${nodeKey}`].profile_report_html && isProfilingHtml(nodeObj[`api_result_${nodeKey}`].profile_report_html)) {
          return nodeObj[`api_result_${nodeKey}`].profile_report_html;
        }
      }
    }
  }

  return null;
};

/**
 * PAUSE_UI derived from pauseRegistry — single source of truth.
 * hidesInput: true  → hides the normal bottom input bar entirely
 * showsHitl:  false → skips the standard HITL approve/rework/reject controls
 */
export const PAUSE_UI = Object.fromEntries(
  Object.entries(PAUSE_NODE_TYPES).map(([type, cfg]) => [
    type,
    { hidesInput: cfg.hidesInput, showsHitl: cfg.showsHitl }
  ])
);
