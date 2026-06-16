/**
 * @file StructuredTable.jsx
 * @description Renders JSON objects or arrays of objects into structured HTML tables.
 * Dynamically extracts headers, handles nested objects/arrays, parses markdown/styling within cells, and allows exporting to CSV.
 */

import React from 'react';
import { Copy, Check } from 'lucide-react';


export const StructuredTable = ({ data, formatMessage, formatInlineStyles }) => {
    const [copied, setCopied] = React.useState(false);

    // Get all unique keys from all objects to use as headers (memoized to avoid recalculating on every render)
    const headers = React.useMemo(() => {
        if (!Array.isArray(data) || data.length === 0) return [];
        return Array.from(new Set(data.flatMap(obj => Object.keys(obj || {}))));
    }, [data]);

    if (!Array.isArray(data) || data.length === 0) return null;

    const handleCopyCsv = () => {
        const csvHeaders = headers.join(',');
        const csvRows = data.map(row => 
            headers.map(h => {
                const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
                // Escape quotes
                return `"${val.replace(/"/g, '""')}"`;
            }).join(',')
        );
        const csv = [csvHeaders, ...csvRows].join('\n');
        navigator.clipboard.writeText(csv);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ margin: '20px 0' }}>
            <div style={{
                borderRadius: 12,
                border: '1px solid #E5E7EB',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 20px', background: '#F9FAFB',
                    borderBottom: '1px solid #E5E7EB',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9CA3AF' }}>
                            {headers.length} columns · {data.length} rows
                        </span>
                    </div>
                    <button onClick={handleCopyCsv} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '5px 10px', borderRadius: 7, border: '1px solid #E5E7EB',
                        background: copied ? '#ECFDF5' : 'white',
                        color: copied ? '#059669' : '#6B7280',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                        fontFamily: 'inherit', transition: 'all 0.15s',
                    }}>
                        {copied ? <Check size={11} /> : <Copy size={11} />}
                        {copied ? 'Copied' : 'CSV'}
                    </button>
                </div>

                <div style={{ overflowX: 'auto' }} className="msg-scrollbar">
                    <table className="msg-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                                {headers.map((h, i) => (
                                    <th key={i} style={{
                                        padding: '12px 20px',
                                        textAlign: 'left',
                                        fontSize: 12, fontWeight: 700,
                                        color: '#374151',
                                        letterSpacing: '0.04em',
                                        textTransform: 'uppercase',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, ri) => (
                                <tr key={ri} style={{
                                    background: ri % 2 === 0 ? 'white' : '#FAFAFA',
                                    borderBottom: ri < data.length - 1 ? '1px solid #F3F4F6' : 'none',
                                    transition: 'background 0.1s',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                                    onMouseLeave={e => e.currentTarget.style.background = ri % 2 === 0 ? 'white' : '#FAFAFA'}
                                >
                                    {headers.map((header, ci) => {
                                        const cellValue = row[header];
                                        let renderedValue = '';
                                        if (cellValue === null || cellValue === undefined) {
                                            renderedValue = <em style={{ color: '#9CA3AF' }}>null</em>;
                                        } else if (typeof cellValue === 'object' && cellValue !== null) {
                                            renderedValue = Array.isArray(cellValue) ? (
                                                <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#4B5563' }}>
                                                    {JSON.stringify(cellValue)}
                                                </div>
                                            ) : (
                                                <div style={{ 
                                                    fontSize: 11, 
                                                    fontFamily: 'monospace', 
                                                    display: 'flex', 
                                                    flexDirection: 'column', 
                                                    gap: '3px',
                                                    minWidth: '220px',
                                                    maxWidth: '350px',
                                                    maxHeight: '180px',
                                                    overflowY: 'auto',
                                                    padding: '8px 10px',
                                                    background: '#FAFAFA',
                                                    borderRadius: '8px',
                                                    border: '1px solid #E5E7EB',
                                                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                                                }} className="msg-scrollbar">
                                                    {Object.entries(cellValue).map(([k, v]) => {
                                                        let formattedVal = '';
                                                        if (typeof v === 'number') {
                                                            formattedVal = Number.isInteger(v) ? String(v) : v.toFixed(4);
                                                        } else if (typeof v === 'object' && v !== null) {
                                                            formattedVal = JSON.stringify(v);
                                                        } else {
                                                            formattedVal = String(v);
                                                        }
                                                        return (
                                                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderBottom: '1px dashed #E5E7EB', paddingBottom: '3px', paddingTop: '1px' }}>
                                                                <span style={{ color: '#4B5563', fontWeight: 600 }}>{k}</span>
                                                                <span style={{ color: '#111827', fontWeight: 700 }}>{formattedVal}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        } else {
                                            const valStr = String(cellValue);
                                            const hasBlockMarkdown = valStr.includes('\n') || 
                                                valStr.trim().startsWith('#') || 
                                                valStr.trim().startsWith('|') || 
                                                /^[-\*•\d]/.test(valStr.trim());
                                            
                                            renderedValue = hasBlockMarkdown 
                                                ? (formatMessage ? formatMessage(valStr, true) : valStr) 
                                                : (formatInlineStyles ? formatInlineStyles(valStr) : valStr);
                                        }

                                        return (
                                            <td key={ci} style={{
                                                padding: '13px 20px',
                                                fontSize: 14,
                                                color: ci === 0 ? '#111827' : '#4B5563',
                                                fontWeight: ci === 0 ? 600 : 400,
                                                lineHeight: 1.55,
                                                verticalAlign: 'top',
                                                whiteSpace: (typeof cellValue === 'string' && cellValue.includes('\n')) ? 'pre-wrap' : 'normal'
                                            }}>
                                                {renderedValue}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
