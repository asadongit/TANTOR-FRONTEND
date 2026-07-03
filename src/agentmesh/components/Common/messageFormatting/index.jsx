/**
 * @file index.jsx
 * @description Core message formatting parser and orchestrator. Parses raw text messages,
 * identifies and separates text blocks, tables, code blocks, math equations, and html,
 * and delegates them to their respective specialized renderer components.
 */

import React from 'react';
import { motion } from 'framer-motion';

import { Copy, Check } from 'lucide-react';

import { isBase64Image, isProfilingHtml, cleanProfilingData } from './utils';
import { renderBase64Image } from './ZoomableImage';
import { StructuredTable } from './StructuredTable';
import { DataTable } from './DataTable';
import { MathBlock } from './MathBlock';
import { ChartBlock } from './ChartBlock';
import { MermaidBlock } from './MermaidBlock';
import { ReactFlowWrapper } from './ReactFlowWrapper';

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

// ─── Code Block ───────────────────────────────────────────────────────────────
const LANG_COLORS = {
    python: '#3572A5', javascript: '#F7DF1E', typescript: '#3178C6',
    jsx: '#61DAFB', tsx: '#61DAFB', bash: '#4EAA25', sh: '#4EAA25',
    sql: '#E48E00', json: '#292929', html: '#E44D26', css: '#264DE4',
    rust: '#DEA584', go: '#00ACD7', java: '#B07219', cpp: '#f34b7d',
    yaml: '#cb171e', markdown: '#083fa1', text: '#6B7280',
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
                return <StructuredTable data={parsedTableData} formatMessage={formatMessage} formatInlineStyles={formatInlineStyles} />;
            }
            if (!Array.isArray(parsedTableData) && typeof parsedTableData === 'object' && parsedTableData !== null) {
                const isChartOrGraph = parsedTableData.nodes || parsedTableData.elements || parsedTableData.type === 'pie' || parsedTableData.type === 'bar' || parsedTableData.type === 'line' || parsedTableData.type === 'area';
                if (!isChartOrGraph) {
                    return <StructuredTable data={[parsedTableData]} formatMessage={formatMessage} formatInlineStyles={formatInlineStyles} />;
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

// ─── Inline Formatter ──────────────────────────────────────────────────────────
export const formatInlineStyles = (text, isLast = false) => {
    if (typeof text !== 'string') return text;

    if (text.includes('__WAIT_FOR_HUMAN__')) {
        const parts = text.split('__WAIT_FOR_HUMAN__');
        return parts.map((part, idx) => (
            <React.Fragment key={idx}>
                {idx > 0 && isLast && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', margin: '0 4px', verticalAlign: 'middle' }}>
                        <motion.span
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                background: 'rgba(142, 119, 187, 0.05)', 
                                border: '1px solid #8E77BB', 
                                padding: '4px', 
                                borderRadius: '50%', 
                                color: '#8E77BB' 
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </motion.span>
                    </span>
                )}
                {formatInlineStyles(part, isLast)}
            </React.Fragment>
        ));
    }

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
                {formatInlineStyles(segment, isLast)}
            </React.Fragment>
        ));
    }

    // Step 2: Bold, italic, inline code, and Links/Images
    const parts = text.split(/(\*\*[\s\S]*?\*\*|\*[^*]+\*|`[^`]+`|!?\[[\s\S]+?\]\([\s\S]+?\)|https?:\/\/[^\s]+)/g);
    
    return parts.map((part, i) => {
        if (!part) return null;

        // 1. Bold
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} style={{ fontWeight: 700, color: '#111827' }}>{formatInlineStyles(part.slice(2, -2), isLast)}</strong>;
        }
        
        // 2. Italic
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
            return <em key={i} style={{ fontStyle: 'italic', color: '#374151' }}>{formatInlineStyles(part.slice(1, -1), isLast)}</em>;
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
const renderBlockLine = (line, i, isLast = false) => {
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
                {formatInlineStyles(content, isLast)}
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
                    {formatInlineStyles(line.trim().replace(/^[-*•]\s/, ''), isLast)}
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
                    {formatInlineStyles(numMatch[2], isLast)}
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
                {formatInlineStyles(line.slice(2), isLast)}
            </div>
        );
    }

    // Regular paragraph
    if (line.trim()) {
        return (
            <p key={i} style={{ fontSize: 15, lineHeight: 1.8, color: '#374151', margin: '8px 0' }}>
                {formatInlineStyles(line, isLast)}
            </p>
        );
    }

    return null;
};

// ─── Block Parsing Logic ──────────────────────────────────────────────────────
const parseTextBlocks = (content, bi, isLast = false) => {
    const lines = content.split('\n');
    const sections = [];
    let i = 0;
    let textBuffer = [];

    const flushText = () => {
        if (textBuffer.length === 0) return;
        const items = textBuffer.filter(Boolean).map((l, li) => renderBlockLine(l, `${bi}-${li}`, isLast)).filter(Boolean);
        if (items.length > 0) sections.push(<div key={`txt-${bi}-${sections.length}`}>{items}</div>);
        textBuffer = [];
    };

    while (i < lines.length) {
        const line = lines[i];

        // 0. HTML Block Detection
        if (line.trim().startsWith('<')) {
            const tagMatch = line.trim().match(/^<([a-zA-Z1-6]+)\b/);
            if (tagMatch) {
                flushText();
                const tagName = tagMatch[1].toLowerCase();
                const selfClosingTags = ['hr', 'br', 'img', 'input', 'meta', 'link'];
                const isSelfClosing = selfClosingTags.includes(tagName) || line.trim().endsWith('/>');
                const closeTag = `</${tagName}>`;
                let htmlBuffer = line;
                let j = i + 1;
                let foundClose = isSelfClosing || line.includes(closeTag);
                
                while (!foundClose && j < lines.length) {
                    htmlBuffer += '\n' + lines[j];
                    if (lines[j].includes(closeTag)) {
                        foundClose = true;
                    }
                    j++;
                }
                
                sections.push(
                    <div 
                        key={`html-blk-${bi}-${i}`} 
                        dangerouslySetInnerHTML={{ __html: htmlBuffer }} 
                        style={{ wordBreak: 'break-word' }}
                    />
                );
                i = j;
                continue;
            }
        }

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

        // 2. Display Math Detection
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
                    sections.push(<StructuredTable key={`json-tbl-${bi}-${i}`} data={parsed} formatMessage={formatMessage} formatInlineStyles={formatInlineStyles} />);
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

// ─── Main formatMessage ────────────────────────────────────────────────────────
export const formatMessage = (msg, isCell = false, isLast = false) => {
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
            return <StructuredTable data={cleanedData} formatMessage={formatMessage} formatInlineStyles={formatInlineStyles} />;
        }
        if (!Array.isArray(cleanedData) && typeof cleanedData === 'object' && cleanedData !== null) {
            const isChartOrGraph = cleanedData.nodes || cleanedData.elements || cleanedData.type === 'pie' || cleanedData.type === 'bar' || cleanedData.type === 'line' || cleanedData.type === 'area';
            if (!isChartOrGraph) {
                return <StructuredTable data={[cleanedData]} formatMessage={formatMessage} formatInlineStyles={formatInlineStyles} />;
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

    // Detect if content is HTML to render it directly
    const trimmedContent = typeof content === 'string' ? content.trim() : '';
    const isHtml = trimmedContent.startsWith('<') && 
        /<\/?(div|span|p|a|img|table|tr|td|th|tbody|thead|ul|ol|li|h[1-6]|br|hr|section|style|iframe|button|svg|path|em|strong|b|i|u|font|center|form|input|label|select|option|textarea)\b[^>]*>/i.test(trimmedContent);

    if (isHtml) {
        return (
            <div 
                style={{ wordBreak: 'break-word' }} 
                dangerouslySetInnerHTML={{ __html: content }} 
            />
        );
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
            return parseTextBlocks(block.content, bi, isLast);
        });

        return <div style={{ wordBreak: 'break-word' }}>{rendered}</div>;
    } catch (err) {
        console.error('formatMessage error:', err);
        return <span style={{ color: '#DC2626', fontSize: 14 }}>Error rendering message.</span>;
    }
};
