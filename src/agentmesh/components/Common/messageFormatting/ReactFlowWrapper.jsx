/**
 * @file ReactFlowWrapper.jsx
 * @description Renders node-edge interactive graphs using @xyflow/react and dagre for layout.
 * Features an expandable full-screen viewer and draggable nodes for enhanced visualization.
 */

import React from 'react';
import { createPortal } from 'react-dom';

import { Layers, Maximize2, X } from 'lucide-react';
import {
    ReactFlow, Background, Controls,
    useNodesState, useEdgesState,
    ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getLayoutedElements } from './utils';

export const FullscreenGraphModal = ({ children, onClose }) => {
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

export const ReactFlowWrapper = ({ initialData }) => {
    const [modalOpen, setModalOpen] = React.useState(false);

    // Normalize various formats: {nodes, edges}, {elements}, or just [nodes, edges]
    let rawNodes = initialData.nodes || initialData.elements || (Array.isArray(initialData) ? initialData.filter(e => !e.source) : []);
    let rawEdges = initialData.edges || initialData.links || (Array.isArray(initialData) ? initialData.filter(e => e.source) : []);

    // Defensive check: ensure they are arrays
    if (!Array.isArray(rawNodes)) rawNodes = [];
    if (!Array.isArray(rawEdges)) rawEdges = [];

    const { nodes: ln, edges: le } = React.useMemo(() => {
        return getLayoutedElements(
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
    }, [initialData]); // Depend on initialData to prevent recalculating layout on every render


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
