import React, { useCallback } from 'react';
import { useWorkflowStore, useUIStore } from '../../store';
import { FiSettings, FiCopy, FiTrash2, FiLink, FiXCircle } from 'react-icons/fi';
import ConfirmationModal from '../Common/ConfirmationModal';
import { useState } from 'react';

export default function ContextMenu({ id, top, left, right, bottom, onMouseLeave, ...props }) {
    const { removeNode, duplicateNode, clearNodeData, unlinkNode, nodes } = useWorkflowStore();
    const { setSelectedNode } = useUIStore();
    const [confirmModal, setConfirmModal] = useState({ type: null, isOpen: false });

    // Get node label for the modal message
    const node = nodes.find(n => n.id === id);
    const nodeLabel = node?.data?.label || id;

    const onOpen = useCallback(() => {
        setSelectedNode(id);
        onMouseLeave();
    }, [id, setSelectedNode, onMouseLeave]);

    const onDuplicate = useCallback(() => {
        duplicateNode(id);
        onMouseLeave();
    }, [id, duplicateNode, onMouseLeave]);

    const onClearClick = (e) => {
        e.stopPropagation();
        setConfirmModal({ type: 'clear', isOpen: true });
    };

    const onDeleteClick = (e) => {
        e.stopPropagation();
        setConfirmModal({ type: 'delete', isOpen: true });
    };

    const handleConfirm = useCallback(() => {
        if (confirmModal.type === 'clear') {
            clearNodeData(id);
        } else if (confirmModal.type === 'delete') {
            removeNode(id);
        }
        setConfirmModal({ type: null, isOpen: false });
        onMouseLeave();
    }, [id, confirmModal.type, clearNodeData, removeNode, onMouseLeave]);

    const handleCloseModal = () => {
        setConfirmModal({ type: null, isOpen: false });
        onMouseLeave();
    };

    const onUnlink = useCallback(() => {
        unlinkNode(id);
        onMouseLeave();
    }, [id, unlinkNode, onMouseLeave]);

    // Don't show context menu for system start/end nodes (except maybe open)
    const isSystemNode = id === '__start__' || id === '__end__';

    return (
        <div
            style={{
                position: 'fixed',
                top,
                left,
                right,
                bottom,
                zIndex: 1000,
                background: 'white',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                padding: '6px',
                minWidth: '180px',
                animation: 'menuIn 0.15s ease-out',
            }}
            onMouseLeave={onMouseLeave}
            {...props}
        >
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Node Actions
            </div>
            
            <ContextItem icon={<FiSettings />} label="Open Settings" onClick={onOpen} />
            
            {!isSystemNode && (
                <>
                    <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                    <ContextItem icon={<FiCopy />} label="Duplicate" onClick={onDuplicate} />
                    <ContextItem icon={<FiLink />} label="Unlink Connections" onClick={onUnlink} />
                    <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                    <ContextItem icon={<FiXCircle />} label="Clear Data" onClick={onClearClick} />
                    <ContextItem icon={<FiTrash2 />} label="Delete Node" onClick={onDeleteClick} color="#EF4444" />
                </>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirm}
                title={confirmModal.type === 'clear' ? "Clear Node Data?" : "Delete Node?"}
                message={
                    confirmModal.type === 'clear'
                        ? `Are you sure you want to reset all data for **${nodeLabel}**? This action cannot be undone.`
                        : `Are you sure you want to delete **${nodeLabel}**? All its connections will be removed.`
                }
                confirmText={confirmModal.type === 'clear' ? "Reset Data" : "Delete Node"}
                variant="danger"
            />

            <style>{`
                @keyframes menuIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}

function ContextItem({ icon, label, onClick, color = 'var(--text-primary)' }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '8px 10px',
                border: 'none',
                background: 'transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '13px',
                color: color,
                transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
            <span style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>{icon}</span>
            <span style={{ fontWeight: 500 }}>{label}</span>
        </button>
    );
}
