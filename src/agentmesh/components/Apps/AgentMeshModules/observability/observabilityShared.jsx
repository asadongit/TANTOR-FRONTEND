import { useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { FiInfo, FiX, FiMaximize2, FiTag, FiGitBranch, FiZap, FiLayers, FiCircle, FiCpu, FiCopy, FiCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export function InfoTooltip({ text, align = 'right' }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <button
        type="button"
        aria-label="More information"
        style={{
          background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'help',
          display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none',
          color: '#94A3B8', transition: 'color 0.15s'
        }}
      >
        <motion.div
          animate={{ scale: isHovered ? 1.2 : 1, color: isHovered ? '#8E77BB' : '#94A3B8' }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <FiInfo size={14} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              ...(align === 'right' ? { right: 0 } : { left: 0 }),
              width: 300,
              background: 'rgba(15, 23, 42, 0.96)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 12,
              padding: '12px 14px',
              boxShadow: '0 14px 35px -5px rgba(15, 23, 42, 0.4)',
              zIndex: 999,
              pointerEvents: 'none'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-5px',
                ...(align === 'right' ? { right: '14px' } : { left: '14px' }),
                width: 0, height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderBottom: '5px solid rgba(15, 23, 42, 0.96)'
              }}
            />
            <p style={{ margin: 0, fontSize: 12, fontWeight: 500, lineHeight: 1.55, color: '#F1F5F9', textAlign: 'left' }}>
              {text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

InfoTooltip.propTypes = {
  text: PropTypes.string.isRequired,
  align: PropTypes.oneOf(['left', 'right']),
};

// ─── Formatters ──────────────────────────────────────────────────────────────
export const fmtNumber = (n) => {
  if (n == null || isNaN(n)) return '0';
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'K';
  return Math.round(n).toString();
};

export const fmtInt = (n) => (n == null || isNaN(n) ? '—' : Math.round(n).toLocaleString());

export const fmtSec = (s) => (s == null ? '—' : (s >= 1 ? s.toFixed(2) + 's' : Math.round(s * 1000) + 'ms'));

export const fmtUsd = (v) => {
  if (v == null || isNaN(v)) return '—';
  const s = Number(v).toFixed(4).replace(/0+$/, '');
  return '$' + (s.endsWith('.') ? s + '0' : s);
};

export const fmtCost = (v) => (v == null ? '$0.00' : '$' + Number(v).toFixed(2));

export const fmtTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const fmtTimeShort = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const usageTooltip = (o) => {
  const ud = o.usageDetails || {};
  const parts = [];
  if (ud.input != null) parts.push(`in ${fmtInt(ud.input)}`);
  if (ud.output != null) parts.push(`out ${fmtInt(ud.output)}`);
  if (ud.input_cached_tokens != null) parts.push(`cached ${fmtInt(ud.input_cached_tokens)}`);
  return parts.length ? parts.join(' / ') : undefined;
};

// ─── Column grid helpers ─────────────────────────────────────────────────────
export const gridTemplate = (cols) =>
  cols.map((c) => (typeof c.w === 'number' ? `${c.w}px` : c.w)).join(' ');

export const gridMinWidth = (cols) => cols.reduce((s, c) => {
  if (typeof c.w === 'number') return s + c.w;
  if (typeof c.w === 'string' && c.w.includes('minmax')) {
    const match = c.w.match(/\d+/);
    return s + (match ? parseInt(match[0], 10) : 220);
  }
  return s + 220;
}, 0) + 40;

export function HeaderRow({ columns }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: gridTemplate(columns), minWidth: gridMinWidth(columns),
      alignItems: 'center', gap: 10, padding: '10px 16px', background: '#F8FAFC',
      borderBottom: '1px solid #E2E8F0', fontSize: 11, fontWeight: 700,
      color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em'
    }}>
      {columns.map((c, i) => (
        <span key={c.key || i} style={{ display: 'flex', alignItems: 'center', justifyContent: c.align === 'center' ? 'center' : 'flex-start', gap: 5, minWidth: 0 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</span>
          {c.hint && <InfoTooltip text={c.hint} />}
        </span>
      ))}
    </div>
  );
}

HeaderRow.propTypes = {
  columns: PropTypes.array.isRequired,
};

const PAGE_OPTIONS = [25, 50, 100, 200];

export function PaginationBar({
  page,
  totalPages,
  hasNext,
  onPrev,
  onNext,
  limit,
  onLimitChange,
  rangeText,
  showLimit = true,
  pageOptions = PAGE_OPTIONS,
}) {
  const pageLabel = totalPages != null ? `${page} of ${Math.max(totalPages, 1)}` : `Page ${page}`;
  const prevDisabled = page <= 1;
  const nextDisabled = hasNext != null ? !hasNext : totalPages != null && page >= Math.max(totalPages, 1);

  const btnStyle = (disabled) => ({
    display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
    border: '1px solid #E2E8F0', borderRadius: 8, background: disabled ? '#F8FAFC' : '#FFFFFF',
    color: disabled ? '#94A3B8' : '#0F172A', fontSize: 12, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s ease',
    boxShadow: disabled ? 'none' : '0 1px 2px rgba(0,0,0,0.03)'
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', flexWrap: 'wrap', background: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
      {rangeText ? <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{rangeText}</span> : <span />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {showLimit && (
          <select
            value={limit}
            onChange={(e) => onLimitChange && onLimitChange(Number(e.target.value))}
            style={{
              padding: '6px 10px', background: '#FFFFFF', border: '1px solid #E2E8F0',
              borderRadius: 8, fontSize: 12, color: '#0F172A', outline: 'none', fontFamily: 'inherit'
            }}
            aria-label="Rows per page"
          >
            {pageOptions.map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
        )}
        <button onClick={onPrev} disabled={prevDisabled} style={btnStyle(prevDisabled)} aria-label="Previous page">
          <FiChevronLeft size={14} />
          Prev
        </button>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', minWidth: 72, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
          {pageLabel}
        </span>
        <button onClick={onNext} disabled={nextDisabled} style={btnStyle(nextDisabled)} aria-label="Next page">
          Next
          <FiChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

PaginationBar.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number,
  hasNext: PropTypes.bool,
  onPrev: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  limit: PropTypes.number,
  onLimitChange: PropTypes.func,
  rangeText: PropTypes.string,
  showLimit: PropTypes.bool,
  pageOptions: PropTypes.arrayOf(PropTypes.number),
};

export const monoCell = { fontFamily: 'monospace', fontSize: 11, color: '#475569' };

// ─── Badges ──────────────────────────────────────────────────────────────────
const LEVEL_STYLE = {
  DEFAULT: { bg: '#F1F5F9', fg: '#64748B' },
  DEBUG: { bg: '#F8FAFC', fg: '#94A3B8' },
  INFO: { bg: '#EFF6FF', fg: '#2563EB' },
  WARNING: { bg: '#FEF3C7', fg: '#D97706' },
  ERROR: { bg: '#FFF1F2', fg: '#E11D48' },
};

const TYPE_STYLE = {
  SPAN: { bg: '#F4F0FA', fg: '#8E77BB' },
  GENERATION: { bg: '#EFF6FF', fg: '#2563EB' },
  CHAIN: { bg: '#ECFDF5', fg: '#059669' },
  EVENT: { bg: '#F8FAFC', fg: '#64748B' },
  AGENT: { bg: '#FEF3C7', fg: '#D97706' },
};

const TYPE_ICON = {
  SPAN: FiLayers,
  GENERATION: FiZap,
  CHAIN: FiGitBranch,
  EVENT: FiCircle,
  AGENT: FiCpu,
};

export function Badge({ label, style, children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
      borderRadius: 6, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', ...style
    }}>
      {children}
      {label}
    </span>
  );
}

Badge.propTypes = {
  label: PropTypes.string.isRequired,
  style: PropTypes.object,
  children: PropTypes.node,
};

export function LevelBadge({ level }) {
  const s = LEVEL_STYLE[level] || LEVEL_STYLE.DEFAULT;
  return <Badge label={level || 'DEFAULT'} style={{ background: s.bg, color: s.fg }} />;
}

LevelBadge.propTypes = { level: PropTypes.string };

export function TypeBadge({ type }) {
  const s = TYPE_STYLE[type] || TYPE_STYLE.EVENT;
  const Icon = TYPE_ICON[type] || FiCircle;
  return (
    <Badge label={type || 'SPAN'} style={{ background: s.bg, color: s.fg }}>
      <Icon size={10} />
    </Badge>
  );
}

TypeBadge.propTypes = { type: PropTypes.string };

export function TagChips({ tags, limit = 3 }) {
  const list = Array.isArray(tags) ? tags.filter(Boolean) : [];
  if (list.length === 0) return <span style={{ color: '#94A3B8' }}>—</span>;
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', minWidth: 0 }}>
      {list.slice(0, limit).map((t) => (
        <span key={t} title={t} style={{
          display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 7px', borderRadius: 6,
          background: '#EFF6FF', color: '#2563EB', fontSize: 10.5,
          fontWeight: 600, whiteSpace: 'nowrap'
        }}>
          <FiTag size={9} />
          {t}
        </span>
      ))}
      {list.length > limit && (
        <span title={list.slice(limit).join(', ')} style={{ fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>
          +{list.length - limit}
        </span>
      )}
    </span>
  );
}

TagChips.propTypes = { tags: PropTypes.array, limit: PropTypes.number };

// ─── Preview + full-content modal ────────────────────────────────────────────
export function toText(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function previewText(value, maxLen = 90) {
  let text = toText(value).replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length > maxLen) text = text.slice(0, maxLen) + '…';
  return text;
}

export function ContentModal({ payload, onClose }) {
  const sections = payload ? payload.sections || [] : [];
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!payload || !payload.copyText) return;
    try {
      await navigator.clipboard.writeText(payload.copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <AnimatePresence>
      {payload && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 16, border: '1px solid var(--border)',
              maxWidth: 860, width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{payload.title}</div>
                {payload.subtitle && <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{payload.subtitle}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {payload.copyText && (
                  <button
                    onClick={handleCopy}
                    title={copied ? 'Copied!' : 'Copy to clipboard'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: '50%', color: copied ? '#059669' : '#64748B', display: 'flex' }}
                    aria-label="Copy to clipboard"
                  >
                    {copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
                  </button>
                )}
                <button
                  onClick={onClose}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: '50%', color: '#64748B', display: 'flex' }}
                  aria-label="Close"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            <div style={{ padding: 24, overflowY: 'auto', flex: 1, background: '#FAFAF9', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {sections.map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {s.label}
                    <span style={{ fontSize: 10, fontWeight: 600, background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)', borderRadius: 10, padding: '1px 7px' }}>
                      {s.size}
                    </span>
                  </div>
                  <pre style={{
                    background: s.dark ? '#0F172A' : '#F1F5F9', color: s.dark ? '#38BDF8' : '#334155',
                    padding: '16px', borderRadius: 12, fontSize: 12, margin: 0, overflowX: 'auto',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 360, lineHeight: 1.6,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
                  }}>
                    {s.text}
                  </pre>
                </div>
              ))}
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid #E2E8F0', background: 'white', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 18px', borderRadius: 8, border: '1px solid #CBD5E1',
                  background: '#0F172A', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                }}
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

ContentModal.propTypes = {
  payload: PropTypes.shape({
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    copyText: PropTypes.string,
    sections: PropTypes.arrayOf(PropTypes.shape({
      label: PropTypes.string,
      size: PropTypes.string,
      text: PropTypes.string,
      dark: PropTypes.bool,
    })),
  }),
  onClose: PropTypes.func.isRequired,
};

export function PreviewCell({ value, onOpen, empty = '—', dark }) {
  const text = previewText(value);
  if (!text) return <span style={{ color: 'var(--text-muted)' }}>{empty}</span>;
  return (
    <span
      onClick={(e) => { e.stopPropagation(); if (onOpen) onOpen(); }}
      title="Click to view full content"
      style={{
        display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, cursor: 'pointer',
        color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        fontFamily: dark ? 'monospace' : 'inherit', fontSize: dark ? 11 : 12.5
      }}
    >
      <FiMaximize2 size={11} style={{ flexShrink: 0, color: 'var(--text-muted)', opacity: 0.7 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
    </span>
  );
}

PreviewCell.propTypes = {
  value: PropTypes.any,
  onOpen: PropTypes.func,
  empty: PropTypes.string,
  dark: PropTypes.bool,
};

export function useContentModal() {
  const [modal, setModal] = useState(null);
  const open = (payload) => setModal(payload);
  const close = () => setModal(null);
  return { modal, open, close };
}

export const InfoIcon = FiInfo;
