/**
 * @file DataTable.jsx
 * @description Renders markdown-style tables parsed from text blocks.
 * Supports alternating rows, hover highlights, cell-content formatting, and exporting to CSV.
 */

import React from 'react';
import { Copy, Check } from 'lucide-react';


export const DataTable = ({ tableRows, formatText }) => {
    const [copied, setCopied] = React.useState(false);

    const headers = tableRows[0]?.trim().slice(1, -1).split('|').map(c => c.trim()) || [];
    const rows = tableRows.slice(1).filter(r => !r.includes('---'));

    const handleCopyCsv = () => {
        const csv = [headers, ...rows.map(r => r.trim().slice(1, -1).split('|').map(c => c.trim()))].map(r => r.join(',')).join('\n');
        navigator.clipboard.writeText(csv);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const renderCellContent = (cell) => {
        if (formatText) {
            return formatText(cell);
        }
        return cell;
    };

    return (
        <div style={{ margin: '20px 0' }}>
            {/* Table container */}
            <div style={{
                borderRadius: 12,
                border: '1px solid #E5E7EB',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
                {/* Table header bar */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 20px', background: '#F9FAFB',
                    borderBottom: '1px solid #E5E7EB',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9CA3AF' }}>
                            {headers.length} columns · {rows.length} rows
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

                {/* The actual table */}
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
                                        {renderCellContent(h)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, ri) => {
                                const cells = row.trim().slice(1, -1).split('|').map(c => c.trim());
                                return (
                                    <tr key={ri} style={{
                                        background: ri % 2 === 0 ? 'white' : '#FAFAFA',
                                        borderBottom: ri < rows.length - 1 ? '1px solid #F3F4F6' : 'none',
                                        transition: 'background 0.1s',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                                        onMouseLeave={e => e.currentTarget.style.background = ri % 2 === 0 ? 'white' : '#FAFAFA'}
                                    >
                                        {cells.map((cell, ci) => (
                                            <td key={ci} style={{
                                                padding: '13px 20px',
                                                fontSize: 14,
                                                color: ci === 0 ? '#111827' : '#4B5563',
                                                fontWeight: ci === 0 ? 600 : 400,
                                                lineHeight: 1.55,
                                                verticalAlign: 'top',
                                            }}>
                                                {renderCellContent(cell)}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
