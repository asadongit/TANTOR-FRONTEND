/**
 * @file ZoomableImage.jsx
 * @description Renders standard and base64-encoded images with interactive zoom functionality.
 * Displays a lightweight modal with zoom-in, zoom-out, rotation, and reset capabilities.
 */

import React from 'react';
import { createPortal } from 'react-dom';

import { ZoomIn, ZoomOut, RotateCcw, X, Maximize2 } from 'lucide-react';
import { isBase64Image } from './utils';

export const ImageModal = ({ src, alt, onClose }) => {
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

export const ZoomableImage = ({ src, alt, style = {} }) => {
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

export const renderBase64Image = (str, style = {}) => {
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
