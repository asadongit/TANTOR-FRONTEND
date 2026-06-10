import React from 'react';
import { createPortal } from 'react-dom';
import { Copy, Check, Maximize2, X, ZoomIn, ZoomOut, RotateCcw, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import mermaid from 'mermaid';
import {
    ReactFlow, Background, Controls,
    useNodesState, useEdgesState,
    ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
    ResponsiveContainer, BarChart, Bar, LineChart, Line,
    PieChart, Pie, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';

// ─── Mermaid Init ──────────────────────────────────────────────────────────────
mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    fontFamily: "'Google Sans', Inter, system-ui, sans-serif",
    loglevel: 'error',
    themeVariables: {
        darkMode: false,
        primaryColor: '#EEF2FF',
        primaryTextColor: '#1e1e2e',
        primaryBorderColor: '#c7d2fe',
        lineColor: '#94a3b8',
        secondaryColor: '#f8fafc',
        tertiaryColor: '#ffffff',
        background: '#ffffff',
        mainBkg: '#EEF2FF',
        nodeBorder: '#c7d2fe',
        clusterBkg: '#f8fafc',
        titleColor: '#1e1e2e',
        edgeLabelBackground: '#f8fafc',
        fontFamily: "'Google Sans', Inter, system-ui, sans-serif",
    }
});

// ─── Global Styles ─────────────────────────────────────────────────────────────
if (typeof document !== 'undefined') {
    const id = 'agentmesh-msg-styles';
    if (!document.getElementById(id)) {
        const style = document.createElement('style');
        style.id = id;
        style.innerHTML = `
            .msg-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
            .msg-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .msg-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 99px; }
            .msg-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
            .mermaid-error-ui, .mermaid-error-svg, #mermaid-error-svg, [id^="dmermaid-"] { display: none !important; }
            .mermaid-graph svg { max-width: 100% !important; height: auto !important; background: transparent !important; }
            .react-flow__attribution { display: none !important; }
            .msg-table { border-collapse: separate; border-spacing: 0; width: 100%; }
            .react-flow__node-default { background: #ffffff !important; border: 1px solid #e2e8f0 !important; border-radius: 10px !important; padding: 10px 18px !important; font-size: 13px !important; font-weight: 600 !important; color: #1e293b !important; box-shadow: 0 4px 6px -1px var(--shadow-sm) !important; text-align: center; min-width: 140px; }
            .react-flow__edge-path { stroke: #94a3b8 !important; stroke-width: 2 !important; }
            .react-flow__controls { box-shadow: 0 4px 6px -1px var(--shadow-sm) !important; border: 1px solid #e2e8f0 !important; border-radius: 8px !important; overflow: hidden; }
        `;
        document.head.appendChild(style);
    }
}

// ─── Math Block ────────────────────────────────────────────────────────────────
const MathBlock = ({ math, displayMode = true }) => {
    const ref = React.useRef(null);
    React.useEffect(() => {
        if (ref.current) {
            katex.render(math, ref.current, { displayMode, throwOnError: false, output: 'html' });
        }
    }, [math, displayMode]);
    return (
        <div
            ref={ref}
            style={{
                margin: displayMode ? '16px 0' : '0',
                padding: displayMode ? '16px 24px' : '0',
                background: displayMode ? '#FAFAFA' : 'transparent',
                borderRadius: displayMode ? '10px' : '0',
                border: displayMode ? '1px solid #F0F0EF' : 'none',
                overflowX: 'auto',
                display: displayMode ? 'flex' : 'inline-block',
                justifyContent: 'center',
                color: '#1C1C1E',
            }}
        />
    );
};

// ─── Code Block ───────────────────────────────────────────────────────────────
const LANG_COLORS = {
    python: '#3572A5', javascript: '#F7DF1E', typescript: '#3178C6',
    jsx: '#61DAFB', tsx: '#61DAFB', bash: '#4EAA25', sh: '#4EAA25',
    sql: '#E48E00', json: '#292929', html: '#E44D26', css: '#264DE4',
    rust: '#DEA584', go: '#00ACD7', java: '#B07219', cpp: '#f34b7d',
    yaml: '#cb171e', markdown: '#083fa1', text: '#6B7280',
};

// ─── Structured Table ──────────────────────────────────────────────────────────
const StructuredTable = ({ data }) => {
    if (!Array.isArray(data) || data.length === 0) return null;
    
    // Get all unique keys from all objects to use as headers
    const headers = Array.from(new Set(data.flatMap(obj => Object.keys(obj || {}))));
    
    const [copied, setCopied] = React.useState(false);

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
                                                ? formatMessage(valStr, true) 
                                                : formatInlineStyles(valStr);
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

const CodeBlock = ({ part }) => {
    const [copied, setCopied] = React.useState(false);
    const lines = part.split('\n');
    const firstLine = lines[0].trim();
    const hasLang = firstLine && !firstLine.includes(' ') && firstLine.length < 30 && !firstLine.match(/^[\[\{\'\"]/);
    const lang = hasLang ? firstLine.toLowerCase() : '';
    const code = (hasLang ? lines.slice(1).join('\n') : part).trim();

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Try parsing code as standard JSON or Python list of dicts first to render as structured table
    const trimmedCode = code.trim();
    if ((trimmedCode.startsWith('[') && trimmedCode.endsWith(']')) || (trimmedCode.startsWith('{') && trimmedCode.endsWith('}'))) {
        let parsedTableData = null;
        try {
            parsedTableData = JSON.parse(trimmedCode);
        } catch {
            try {
                const fn = new Function('True', 'False', 'None', `return (${trimmedCode})`);
                parsedTableData = fn(true, false, null);
            } catch {}
        }
        
        if (parsedTableData) {
            if (Array.isArray(parsedTableData) && parsedTableData.length > 0 && typeof parsedTableData[0] === 'object' && parsedTableData[0] !== null && !Array.isArray(parsedTableData[0])) {
                return <StructuredTable data={parsedTableData} />;
            }
            if (!Array.isArray(parsedTableData) && typeof parsedTableData === 'object' && parsedTableData !== null) {
                const isChartOrGraph = parsedTableData.nodes || parsedTableData.elements || parsedTableData.type === 'pie' || parsedTableData.type === 'bar' || parsedTableData.type === 'line' || parsedTableData.type === 'area';
                if (!isChartOrGraph) {
                    return <StructuredTable data={[parsedTableData]} />;
                }
            }
        }
    }

    // Special block types
    if (hasLang) {
        if (lang === 'mermaid') return <MermaidBlock chart={code} />;
        if (lang === 'chart') return <ChartBlock config={code} />;
        if (lang === 'json' || lang === 'graph') {
            if (trimmedCode.startsWith('{') || trimmedCode.startsWith('[')) {
                try {
                    const parsed = JSON.parse(trimmedCode);
                    // Improved detection: nodes/elements MUST be arrays to be considered a graph
                    const hasGraph = (Array.isArray(parsed.nodes) && parsed.nodes.length > 0) || 
                                     (Array.isArray(parsed.elements) && parsed.elements.length > 0) || 
                                     (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id);
                    
                    if (hasGraph) return <ReactFlowWrapper initialData={parsed} />;
                } catch { /* normal json */ }
            }
        }
    }

    const langColor = LANG_COLORS[lang] || '#6B7280';

    return (
        <div style={{
            margin: '16px 0',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #EAEAEA',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            background: '#FAFAFA',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                background: '#F5F5F4',
                borderBottom: '1px solid #EAEAEA',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
                    </div>
                    {hasLang && (
                        <span style={{
                            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                            textTransform: 'uppercase', color: langColor,
                            background: `${langColor}15`,
                            padding: '2px 8px', borderRadius: 99,
                            border: `1px solid ${langColor}30`,
                        }}>{lang}</span>
                    )}
                </div>
                <button
                    onClick={handleCopy}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '5px 10px', borderRadius: 8, border: '1px solid #E5E5E5',
                        background: copied ? '#ECFDF5' : 'white',
                        color: copied ? '#059669' : '#6B7280',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.15s', fontFamily: 'inherit',
                    }}
                >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            {/* Code */}
            <pre style={{
                margin: 0, padding: '18px 20px',
                overflowX: 'auto', background: '#FAFAFA',
            }} className="msg-scrollbar">
                <code style={{
                    display: 'block', fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
                    fontSize: 13.5, lineHeight: 1.7, color: '#1C1C1E',
                }}>
                    {code.trim()}
                </code>
            </pre>
        </div>
    );
};

// ─── Chart Block ──────────────────────────────────────────────────────────────
const CHART_COLORS = ['#4285F4', '#34C759', '#FF9F0A', '#AF52DE', '#FF3B30', '#5856D6', '#007AFF'];

const ChartBlock = ({ config }) => {
    const [data, setData] = React.useState(null);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        try {
            const parsed = JSON.parse(config);
            setData(parsed);
        } catch (e) {
            setError('Invalid chart configuration');
        }
    }, [config]);

    if (error) return <div style={{ padding: 12, color: '#DC2626', fontSize: 13 }}>{error}</div>;
    if (!data) return null;

    const { type, title, data: chartData = [], xKey = '', yKeys = [] } = data || {};

    const renderChart = () => {
        if (!Array.isArray(chartData) || chartData.length === 0) {
            return <div style={{ padding: 20, textAlign: 'center', color: '#8E8E93', fontSize: 13 }}>No chart data available</div>;
        }

        if (type !== 'pie' && (!yKeys || !Array.isArray(yKeys) || yKeys.length === 0)) {
            return <div style={{ padding: 20, textAlign: 'center', color: '#8E8E93', fontSize: 13 }}>Incomplete chart configuration (missing y-keys)</div>;
        }

        const commonProps = {
            data: chartData,
            margin: { top: 20, right: 30, left: 20, bottom: 20 }
        };

        switch (type) {
            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F0" />
                        <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8E8E93' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8E8E93' }} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                        <Legend verticalAlign="top" height={36} />
                        {yKeys.map((key, i) => (
                            <Bar key={key} dataKey={key} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
                        ))}
                    </BarChart>
                );
            case 'line':
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F0" />
                        <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8E8E93' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8E8E93' }} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                        <Legend verticalAlign="top" height={36} />
                        {yKeys.map((key, i) => (
                            <Line key={key} type="monotone" dataKey={key} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        ))}
                    </LineChart>
                );
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F0" />
                        <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8E8E93' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8E8E93' }} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                        <Legend verticalAlign="top" height={36} />
                        {yKeys.map((key, i) => (
                            <Area key={key} type="monotone" dataKey={key} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.1} />
                        ))}
                    </AreaChart>
                );
            case 'pie':
                return (
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey={yKeys[0]}
                            nameKey={xKey}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={{ fontSize: 12, fill: '#1C1C1E' }}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`pie-${entry[xKey] || index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                        <Legend />
                    </PieChart>
                );
            default:
                return <div>Unsupported chart type: {type}</div>;
        }
    };

    return (
        <div style={{
            margin: '20px 0',
            padding: '24px',
            background: 'white',
            borderRadius: 16,
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
        }}>
            {title && <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20, textAlign: 'center' }}>{title}</div>}
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// ─── Mermaid Block ─────────────────────────────────────────────────────────────
const MermaidBlock = ({ chart }) => {
    const ref = React.useRef(null);
    const [svg, setSvg] = React.useState(null);
    const [error, setError] = React.useState(null);
    const [modalOpen, setModalOpen] = React.useState(false);

    React.useEffect(() => {
        const id = `m-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        mermaid.render(id, chart)
            .then(({ svg }) => setSvg(svg))
            .catch(() => setError(true));
    }, [chart]);

    if (error) return (
        <div style={{ padding: '14px 18px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13 }}>
            Failed to render diagram. Please check the Mermaid syntax.
        </div>
    );

    if (!svg) return (
        <div style={{ padding: '20px', borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
            Rendering diagram...
        </div>
    );

    return (
        <>
            <div style={{
                margin: '16px 0', borderRadius: 12, overflow: 'hidden',
                border: '1px solid #E8E8E5', background: 'white',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 16px', background: '#F8FAFC', borderBottom: '1px solid #E8E8E5',
                }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8' }}>Diagram</span>
                    <button onClick={() => setModalOpen(true)} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '5px 10px', borderRadius: 8, border: '1px solid #E5E5E5',
                        background: 'white', color: '#6B7280', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                        <Maximize2 size={12} /> Expand
                    </button>
                </div>
                <div
                    ref={ref}
                    style={{ padding: '24px', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}
                    className="msg-scrollbar"
                    dangerouslySetInnerHTML={{ __html: svg }}
                />
            </div>
            {modalOpen && createPortal(
                <DiagramModal svg={svg} onClose={() => setModalOpen(false)} />,
                document.body
            )}
        </>
    );
};

const DiagramModal = ({ svg, onClose }) => {
    const [scale, setScale] = React.useState(1);
    React.useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
            <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 8 }}>
                <button onClick={() => setScale(s => Math.min(s + 0.2, 4))} style={{ padding: '10px', borderRadius: 10, border: '1px solid #E5E5E5', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ZoomIn size={18} style={{ color: '#333' }} /></button>
                <button onClick={() => setScale(s => Math.max(s - 0.2, 0.3))} style={{ padding: '10px', borderRadius: 10, border: '1px solid #E5E5E5', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ZoomOut size={18} style={{ color: '#333' }} /></button>
                <button onClick={() => setScale(1)} style={{ padding: '10px', borderRadius: 10, border: '1px solid #E5E5E5', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RotateCcw size={18} style={{ color: '#333' }} /></button>
                <button onClick={onClose} style={{ padding: '10px', borderRadius: 10, border: '1px solid #FECACA', background: '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} style={{ color: '#DC2626' }} /></button>
            </div>
            <div style={{ overflow: 'auto', maxWidth: '90vw', maxHeight: '80vh' }} className="msg-scrollbar">
                <div style={{ transform: `scale(${scale})`, transformOrigin: 'center top', transition: 'transform 0.2s' }}
                    dangerouslySetInnerHTML={{ __html: svg }} />
            </div>
        </div>
    );
};

// ─── React Flow Wrapper ────────────────────────────────────────────────────────
const getLayoutedElements = (nodes, edges) => {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 100 });
    nodes.forEach(n => g.setNode(n.id, { width: 160, height: 50 }));
    edges.forEach(e => g.setEdge(e.source, e.target));
    dagre.layout(g);
    return {
        nodes: nodes.map(n => {
            const { x, y } = g.node(n.id);
            return { ...n, position: { x: x - 80, y: y - 25 } };
        }),
        edges,
    };
};

const ReactFlowWrapper = ({ initialData }) => {
    const [modalOpen, setModalOpen] = React.useState(false);

    // Normalize various formats: {nodes, edges}, {elements}, or just [nodes, edges]
    let rawNodes = initialData.nodes || initialData.elements || (Array.isArray(initialData) ? initialData.filter(e => !e.source) : []);
    let rawEdges = initialData.edges || initialData.links || (Array.isArray(initialData) ? initialData.filter(e => e.source) : []);

    // Defensive check: ensure they are arrays
    if (!Array.isArray(rawNodes)) rawNodes = [];
    if (!Array.isArray(rawEdges)) rawEdges = [];

    const { nodes: ln, edges: le } = getLayoutedElements(
        rawNodes.map((n, i) => ({
            id: n.id || n.name || String(i),
            data: { label: n.label || n.name || n.text || n.id || `Node ${i}` },
            position: { x: 0, y: 0 }
        })),
        rawEdges.map((e, i) => ({
            id: e.id || `e${i}`,
            source: e.source,
            target: e.target,
            label: e.label || ''
        }))
    );

    const [nodes] = useNodesState(ln);
    const [edges] = useEdgesState(le);

    const GraphContent = ({ isFullscreen = false }) => (
        <div style={{ height: isFullscreen ? '75vh' : 320, width: '100%', position: 'relative' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                fitView
                nodesDraggable={isFullscreen}
                zoomOnScroll={false}
                style={{ background: '#FAFAFA' }}
            >
                <Background color="#E8E8E5" gap={20} />
                <Controls showInteractive={false} position="bottom-right" />
            </ReactFlow>
        </div>
    );

    return (
        <ReactFlowProvider>
            <div style={{
                margin: '16px 0', borderRadius: 12, overflow: 'hidden',
                border: '1px solid #E8E8E5', background: 'white',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 16px', background: '#F8FAFC', borderBottom: '1px solid #E8E8E5',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Layers size={14} style={{ color: '#94A3B8' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8' }}>Interactive Graph</span>
                    </div>
                    <button onClick={() => setModalOpen(true)} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '5px 10px', borderRadius: 8, border: '1px solid #E5E5E5',
                        background: 'white', color: '#6B7280', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                        <Maximize2 size={12} /> Expand
                    </button>
                </div>
                <GraphContent />
            </div>
            {modalOpen && createPortal(
                <FullscreenGraphModal onClose={() => setModalOpen(false)}><GraphContent isFullscreen /></FullscreenGraphModal>,
                document.body
            )}
        </ReactFlowProvider>
    );
};

const FullscreenGraphModal = ({ children, onClose }) => {
    React.useEffect(() => {
        const h = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(12px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px'
        }}>
            <button onClick={onClose} style={{
                position: 'absolute', top: 24, right: 24, padding: '10px',
                borderRadius: 10, border: '1px solid #E5E5E5', background: 'white', cursor: 'pointer'
            }}><X size={20} /></button>
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {children}
            </div>
        </div>
    );
};

// ─── Table ─────────────────────────────────────────────────────────────────────
const DataTable = ({ tableRows, formatText }) => {
    const [copied, setCopied] = React.useState(false);

    const headers = tableRows[0]?.trim().slice(1, -1).split('|').map(c => c.trim()) || [];
    const rows = tableRows.slice(1).filter(r => !r.includes('---'));

    const handleCopyCsv = () => {
        const csv = [headers, ...rows.map(r => r.trim().slice(1, -1).split('|').map(c => c.trim()))].map(r => r.join(',')).join('\n');
        navigator.clipboard.writeText(csv);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                                        {formatText(h)}
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
                                                {formatText(cell)}
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

const isBase64Image = (str) => {
    if (typeof str !== 'string') return false;
    const trimmed = str.trim();
    if (/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,/i.test(trimmed)) {
        return true;
    }
    // Check if it looks like raw base64 for png, jpg, gif, webp
    if (trimmed.length > 100 && /^(iVBORw0KGgo|R0lGOD|[a-zA-Z0-9+/]{50,}\/9j\/|UklGR)/.test(trimmed)) {
        return true;
    }
    return false;
};

const ImageModal = ({ src, alt, onClose }) => {
    const [scale, setScale] = React.useState(1);
    React.useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 8, zIndex: 10000 }}>
                <button onClick={() => setScale(s => Math.min(s + 0.2, 4))} style={{ padding: '10px', borderRadius: 10, border: '1px solid #E5E5E5', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ZoomIn size={18} style={{ color: '#333' }} /></button>
                <button onClick={() => setScale(s => Math.max(s - 0.2, 0.3))} style={{ padding: '10px', borderRadius: 10, border: '1px solid #E5E5E5', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ZoomOut size={18} style={{ color: '#333' }} /></button>
                <button onClick={() => setScale(1)} style={{ padding: '10px', borderRadius: 10, border: '1px solid #E5E5E5', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RotateCcw size={18} style={{ color: '#333' }} /></button>
                <button onClick={onClose} style={{ padding: '10px', borderRadius: 10, border: '1px solid #FECACA', background: '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} style={{ color: '#DC2626' }} /></button>
            </div>
            <div style={{ overflow: 'auto', maxWidth: '90vw', maxHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }} className="msg-scrollbar">
                <img 
                    src={src} 
                    alt={alt || "Zoomed image"} 
                    style={{ 
                        transform: `scale(${scale})`, 
                        transformOrigin: 'center center', 
                        transition: 'transform 0.2s',
                        maxWidth: '100%',
                        maxHeight: '100%'
                    }} 
                />
            </div>
        </div>
    );
};

const ZoomableImage = ({ src, alt, style = {} }) => {
    const [modalOpen, setModalOpen] = React.useState(false);
    return (
        <>
            <div 
                style={{ position: 'relative', display: 'inline-block', cursor: 'zoom-in', marginTop: '8px' }} 
                onClick={(e) => { e.stopPropagation(); setModalOpen(true); }}
            >
                <img 
                    src={src} 
                    alt={alt || "Base64 Content"} 
                    style={{ 
                        maxWidth: '100%', 
                        maxHeight: '300px', 
                        borderRadius: '8px', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        border: '1px solid #E5E7EB',
                        display: 'block',
                        ...style 
                    }} 
                />
                <div style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'rgba(255,255,255,0.85)',
                    borderRadius: '6px',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    opacity: 0.8,
                }} title="Zoom Image">
                    <Maximize2 size={12} color="#111827" />
                </div>
            </div>
            {modalOpen && createPortal(
                <ImageModal src={src} alt={alt} onClose={() => setModalOpen(false)} />,
                document.body
            )}
        </>
    );
};

const renderBase64Image = (str, style = {}) => {
    const trimmed = str.trim();
    let src = trimmed;
    if (!/^data:image\//i.test(trimmed)) {
        if (trimmed.startsWith('iVBORw0KGgo')) {
            src = `data:image/png;base64,${trimmed}`;
        } else if (trimmed.startsWith('/9j/')) {
            src = `data:image/jpeg;base64,${trimmed}`;
        } else if (trimmed.startsWith('R0lGOD')) {
            src = `data:image/gif;base64,${trimmed}`;
        } else if (trimmed.startsWith('UklGR')) {
            src = `data:image/webp;base64,${trimmed}`;
        } else {
            src = `data:image/png;base64,${trimmed}`;
        }
    }
    return <ZoomableImage src={src} alt={style.alt} style={style} />;
};

// ─── Inline Formatter ──────────────────────────────────────────────────────────
export const formatInlineStyles = (text) => {
    if (typeof text !== 'string') return text;

    if (isBase64Image(text)) {
        return renderBase64Image(text);
    }

    // Step 1: Split on <br> / <br/> / <br /> to handle explicit line breaks
    const brParts = text.split(/<br\s*\/?>/gi);
    if (brParts.length > 1) {
        // Process each segment and interleave with <br /> elements
        return brParts.map((segment, si) => (
            <React.Fragment key={si}>
                {si > 0 && <br />}
                {formatInlineStyles(segment)}
            </React.Fragment>
        ));
    }

        // Step 2: Bold, italic, inline code, and Links/Images
        // We use a more robust split regex that accounts for spaces and potential newlines inside links/images
        const parts = text.split(/(\*\*[\s\S]*?\*\*|\*[^*]+\*|`[^`]+`|!?\[[\s\S]+?\]\([\s\S]+?\)|https?:\/\/[^\s]+)/g);
        
        return parts.map((part, i) => {
            if (!part) return null;

            // 1. Bold
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} style={{ fontWeight: 700, color: '#111827' }}>{formatInlineStyles(part.slice(2, -2))}</strong>;
            }
            
            // 2. Italic
            if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                return <em key={i} style={{ fontStyle: 'italic', color: '#374151' }}>{formatInlineStyles(part.slice(1, -1))}</em>;
            }
            
            // 3. Inline Code
            if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
                return (
                    <code key={i} style={{
                        background: '#F3F4F6', color: '#4F46E5', fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.875em', padding: '1px 6px', borderRadius: 5,
                        border: '1px solid #E5E7EB', fontWeight: 500,
                    }}>
                        {part.slice(1, -1)}
                    </code>
                );
            }

            // 3.5. Markdown Image: ![alt](url)
            const imgMatch = part.match(/^!\[([\s\S]*?)\]\(([\s\S]+?)\)$/);
            if (imgMatch) {
                const alt = imgMatch[1];
                const url = imgMatch[2].trim();
                if (isBase64Image(url)) {
                    return renderBase64Image(url, { alt });
                }
                const finalUrl = url.startsWith('http') || url.startsWith('data:') ? url : `http://localhost:8000${url}`;
                return (
                    <img 
                        key={i}
                        src={finalUrl} 
                        alt={alt || "Rendered Image"} 
                        style={{ 
                            maxWidth: '100%', 
                            maxHeight: '300px', 
                            borderRadius: '8px', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            marginTop: '8px',
                            border: '1px solid #E5E7EB',
                            display: 'block'
                        }} 
                    />
                );
            }

            // 4. Markdown Link: [text](url)
            // We use a broader match and trim any invisible fluff (common on Windows)
            const linkMatch = part.match(/^\[([\s\S]+?)\]\(([\s\S]+?)\)$/);
            if (part.includes('](') && linkMatch) {
                const label = linkMatch[1];
                const rawUrl = linkMatch[2].trim();
                const finalUrl = rawUrl.startsWith('http') || rawUrl.startsWith('data:') ? rawUrl : `http://localhost:8000${rawUrl}`;
                
                const isDownload = rawUrl.includes('/exports/') || rawUrl.includes('/api/vfs/download');
                const isPdf = rawUrl.toLowerCase().endsWith('.pdf');
                const isMarkdown = rawUrl.toLowerCase().endsWith('.md');
                
                if (isDownload) {
                    return (
                        <motion.a 
                            key={i} 
                            href={finalUrl} 
                            download 
                            target="_blank" 
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.01, translateY: -2 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                                margin: '14px 0',
                                padding: '16px 22px',
                                background: '#FFFFFF',
                                borderRadius: '16px',
                                border: '1px solid #E5E7EB',
                                textDecoration: 'none',
                                color: 'inherit',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)',
                                maxWidth: '420px',
                                textAlign: 'left'
                            }}
                        >
                            {/* Icon Block */}
                            <div style={{
                                width: 48, height: 48, borderRadius: 12,
                                background: isPdf 
                                    ? 'linear-gradient(135deg, #FEF2F2, #FEE2E2)' 
                                    : isMarkdown 
                                        ? 'linear-gradient(135deg, #ECFDF5, #D1FAE5)' 
                                        : 'linear-gradient(135deg, #F3F4FB, #E0E7FF)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                            }}>
                                {isPdf ? (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/>
                                    </svg>
                                ) : isMarkdown ? (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6"/><path d="M9 17h3"/>
                                    </svg>
                                ) : (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                                    </svg>
                                )}
                            </div>

                            {/* Metadata Block */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ 
                                    fontSize: 14, fontWeight: 750, color: '#111827', 
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    lineHeight: 1.2, marginBottom: 4
                                }}>
                                    {label}
                                </div>
                                <div style={{ 
                                    fontSize: 11, fontWeight: 650, color: '#6B7280', 
                                    display: 'flex', alignItems: 'center', gap: 6, opacity: 0.8
                                }}>
                                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        {isPdf ? 'PDF Report' : isMarkdown ? 'Markdown Note' : 'File Download'}
                                    </span>
                                    <span style={{ opacity: 0.3 }}>•</span>
                                    <span style={{ color: isPdf ? '#EF4444' : isMarkdown ? '#10B981' : '#6366F1' }}>Exported</span>
                                </div>
                            </div>

                            {/* Download Arrow */}
                            <div style={{ color: '#9CA3AF', paddingLeft: 8 }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                            </div>
                        </motion.a>
                    );
                }
                
                return (
                    <a 
                        key={i} 
                        href={finalUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#6366F1', fontWeight: 600, textDecoration: 'underline' }}
                    >
                        {label}
                    </a>
                );
            }

        // Raw URL
        if (part.startsWith('http://') || part.startsWith('https://')) {
            return (
                <a 
                    key={i} 
                    href={part} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#6366F1', textDecoration: 'underline' }}
                >
                    {part}
                </a>
            );
        }

        return part;
    });
};

// ─── Block Formatter ───────────────────────────────────────────────────────────
const renderBlockLine = (line, i) => {
    // Headings
    if (line.startsWith('#')) {
        let level = 0;
        while (line[level] === '#') level++;
        const content = line.slice(level).trim();
        const sizes = { 1: 22, 2: 20, 3: 18, 4: 16, 5: 15 };
        const size = sizes[Math.min(level, 5)];
        return (
            <div key={i} style={{
                fontSize: size, fontWeight: 700, color: '#111827',
                marginTop: level === 1 ? 28 : level === 2 ? 24 : 18,
                marginBottom: 8, lineHeight: 1.4,
                paddingBottom: level <= 2 ? 8 : 0,
                borderBottom: level <= 2 ? '1px solid #F3F4F6' : 'none',
            }}>
                {formatInlineStyles(content)}
            </div>
        );
    }

    // Horizontal rule
    if (line.trim() === '---') {
        return <hr key={i} style={{ border: 'none', borderTop: '1px solid #F3F4F6', margin: '20px 0' }} />;
    }

    // Unordered list
    if (line.trim().match(/^[-*•]\s/)) {
        return (
            <div key={i} style={{ display: 'flex', gap: 12, margin: '6px 0', paddingLeft: 8, alignItems: 'flex-start' }}>
                <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: '#6366F1', flexShrink: 0, marginTop: 9,
                }} />
                <span style={{ fontSize: 15, lineHeight: 1.7, color: '#374151' }}>
                    {formatInlineStyles(line.trim().replace(/^[-*•]\s/, ''))}
                </span>
            </div>
        );
    }

    // Numbered list
    const numMatch = line.trim().match(/^(\d+)\.\s(.+)/);
    if (numMatch) {
        return (
            <div key={i} style={{ display: 'flex', gap: 12, margin: '6px 0', paddingLeft: 8, alignItems: 'flex-start' }}>
                <span style={{
                    minWidth: 22, height: 22, borderRadius: 6,
                    background: '#EEF2FF', color: '#4F46E5',
                    fontSize: 12, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 2,
                }}>
                    {numMatch[1]}
                </span>
                <span style={{ fontSize: 15, lineHeight: 1.7, color: '#374151' }}>
                    {formatInlineStyles(numMatch[2])}
                </span>
            </div>
        );
    }

    // Blockquote
    if (line.startsWith('> ')) {
        return (
            <div key={i} style={{
                borderLeft: '3px solid #6366F1', paddingLeft: 16,
                margin: '8px 0', color: '#6B7280', fontStyle: 'italic', fontSize: 15, lineHeight: 1.7,
            }}>
                {formatInlineStyles(line.slice(2))}
            </div>
        );
    }

    // Regular paragraph
    if (line.trim()) {
        return (
            <p key={i} style={{ fontSize: 15, lineHeight: 1.8, color: '#374151', margin: '8px 0' }}>
                {formatInlineStyles(line)}
            </p>
        );
    }

    return null;
};

// ─── Block Parsing Logic ──────────────────────────────────────────────────────
const parseTextBlocks = (content, bi) => {
    const lines = content.split('\n');
    const sections = [];
    let i = 0;
    let textBuffer = [];

    const flushText = () => {
        if (textBuffer.length === 0) return;
        const items = textBuffer.filter(Boolean).map((l, li) => renderBlockLine(l, `${bi}-${li}`)).filter(Boolean);
        if (items.length > 0) sections.push(<div key={`txt-${bi}-${sections.length}`}>{items}</div>);
        textBuffer = [];
    };

    while (i < lines.length) {
        const line = lines[i];

        // 1. Table Detection
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
            flushText();
            const tableRows = [line];
            i++;
            if (i < lines.length && (lines[i].includes('---') || lines[i].includes('-|-'))) i++;
            while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
                tableRows.push(lines[i]);
                i++;
            }
            sections.push(<DataTable key={`tbl-${bi}-${i}`} tableRows={tableRows} formatText={formatInlineStyles} />);
            continue;
        }

        // 2. Display Math Detection: must start with \[ or $$
        const mathStart = line.trim().match(/^(\\\[|\$\$)(.*)$/);
        if (mathStart) {
            flushText();
            const marker = mathStart[1];
            let mathContent = mathStart[2];
            const endMarker = marker === '$$' ? '$$' : '\\]';

            i++;
            while (i < lines.length && !lines[i].trim().includes(endMarker)) {
                mathContent += '\n' + lines[i];
                i++;
            }
            if (i < lines.length) i++; // skip closing marker

            sections.push(<MathBlock key={`math-${bi}-${i}`} math={mathContent} />);
            continue;
        }

        // 3. JSON Array Table Detection
        if (line.trim().startsWith('[')) {
            let jsonBuffer = line;
            let j = i + 1;
            let foundEnd = line.trim().endsWith(']');
            
            while (!foundEnd && j < lines.length) {
                jsonBuffer += '\n' + lines[j];
                if (lines[j].trim().endsWith(']')) {
                    foundEnd = true;
                }
                j++;
            }
            
            if (foundEnd) {
                let parsed = null;
                const trimmedJson = jsonBuffer.trim();
                try {
                    parsed = JSON.parse(trimmedJson);
                } catch {
                    try {
                        const fn = new Function('True', 'False', 'None', `return (${trimmedJson})`);
                        parsed = fn(true, false, null);
                    } catch {}
                }
                
                if (parsed && Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null && !Array.isArray(parsed[0])) {
                    flushText();
                    sections.push(<StructuredTable key={`json-tbl-${bi}-${i}`} data={parsed} />);
                    i = j;
                    continue;
                }
            }
        }

        textBuffer.push(line);
        i++;
    }
    flushText();
    return sections;
};

const isProfilingHtml = (val) => {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  return (
    trimmed.startsWith('<!doctype html>') &&
    (trimmed.includes('ydata-profiling') || trimmed.includes('pandas-profiling') || trimmed.includes('Dataset Profile') || trimmed.includes('generator" content="YData'))
  );
};

const cleanProfilingData = (data) => {
  if (!data) return data;
  if (typeof data === 'string') {
    if (isBase64Image(data)) return data;
    if (isProfilingHtml(data)) {
      return "[Profiling Report HTML]";
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(item => cleanProfilingData(item));
  }
  if (typeof data === 'object') {
    const cleaned = {};
    for (const key of Object.keys(data)) {
      cleaned[key] = cleanProfilingData(data[key]);
    }
    return cleaned;
  }
  return data;
};

// ─── Main formatMessage ────────────────────────────────────────────────────────
export const formatMessage = (msg, isCell = false) => {
    if (!msg) return null;

    // Direct check to suppress raw profiling HTML content
    if (typeof msg === 'string' && isProfilingHtml(msg)) {
        return (
            <div style={{ fontSize: 13, color: '#6B7280', fontStyle: 'italic', padding: '6px 0' }}>
                [Data Profiling Report generated. Click the button at the top to view.]
            </div>
        );
    }

    // Direct structured table rendering check
    let parsedData = null;
    if (!isCell) {
        if (Array.isArray(msg) && msg.length > 0 && typeof msg[0] === 'object' && msg[0] !== null && !Array.isArray(msg[0])) {
            // Exclude message lists
            const isMsgList = msg.every(m => (m.type || m.role) && (m.content || m.text));
            if (!isMsgList) {
                parsedData = msg;
            }
        } else if (typeof msg === 'string') {
            const trimmed = msg.trim();
            if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
                try {
                    parsedData = JSON.parse(trimmed);
                } catch {
                    try {
                        const fn = new Function('True', 'False', 'None', `return (${trimmed})`);
                        parsedData = fn(true, false, null);
                    } catch {}
                }
            }
        }
    }

    if (parsedData) {
        const cleanedData = cleanProfilingData(parsedData);
        if (Array.isArray(cleanedData) && cleanedData.length > 0 && typeof cleanedData[0] === 'object' && cleanedData[0] !== null && !Array.isArray(cleanedData[0])) {
            return <StructuredTable data={cleanedData} />;
        }
        if (!Array.isArray(cleanedData) && typeof cleanedData === 'object' && cleanedData !== null) {
            const isChartOrGraph = cleanedData.nodes || cleanedData.elements || cleanedData.type === 'pie' || cleanedData.type === 'bar' || cleanedData.type === 'line' || cleanedData.type === 'area';
            if (!isChartOrGraph) {
                return <StructuredTable data={[cleanedData]} />;
            }
        }
    }

    let cleanedMsg = msg;
    if (typeof msg === 'object' && msg !== null) {
        cleanedMsg = cleanProfilingData(msg);
    }

    let content = '';
    if (typeof cleanedMsg === 'string') {
        content = cleanedMsg;
    } else if (cleanedMsg.content || cleanedMsg.text) {
        content = cleanedMsg.content || cleanedMsg.text;
    } else if (Array.isArray(cleanedMsg)) {
        content = cleanedMsg.map(m => (typeof m === 'string' ? m : (m.content || m.text || JSON.stringify(m)))).join('\n\n');
    } else {
        content = JSON.stringify(cleanedMsg, null, 2);
    }

    try {
        const blocks = [];
        const codeBlockRegex = /```([\s\S]*?)```/g;
        let lastIndex = 0;
        let match;

        while ((match = codeBlockRegex.exec(content)) !== null) {
            if (match.index > lastIndex) {
                blocks.push({ type: 'text', content: content.slice(lastIndex, match.index) });
            }
            blocks.push({ type: 'code', content: match[1] });
            lastIndex = codeBlockRegex.lastIndex;
        }
        if (lastIndex < content.length) {
            blocks.push({ type: 'text', content: content.slice(lastIndex) });
        }

        const rendered = blocks.map((block, bi) => {
            if (block.type === 'code') {
                return <CodeBlock key={`code-${bi}`} part={block.content} />;
            }
            return parseTextBlocks(block.content, bi);
        });

        return <div style={{ wordBreak: 'break-word' }}>{rendered}</div>;
    } catch (err) {
        console.error('formatMessage error:', err);
        return <span style={{ color: '#DC2626', fontSize: 14 }}>Error rendering message.</span>;
    }
};


