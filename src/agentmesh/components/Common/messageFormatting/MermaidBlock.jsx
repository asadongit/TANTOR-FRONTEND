/**
 * @file MermaidBlock.jsx
 * @description Renders Mermaid syntax diagrams dynamically.
 * Features an expandable modal with pan/zoom capability to inspect complex diagrams.
 */

import React from 'react';
import { createPortal } from 'react-dom';

import { Maximize2, ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react';
import mermaid from 'mermaid';

// Initialize Mermaid within the component module scope
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

export const DiagramModal = ({ svg, onClose }) => {
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

export const MermaidBlock = ({ chart }) => {
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
export default MermaidBlock;
