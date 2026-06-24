import React, { useCallback, useState } from 'react';
import { useWorkflowStore, useUIStore } from '../../store';
import { FiSettings, FiCopy, FiTrash2, FiLink, FiXCircle, FiLayers } from 'react-icons/fi';
import ConfirmationModal from '../Common/ConfirmationModal';

export default function ContextMenu({ ids = [], top, left, right, bottom, onMouseLeave, ...props }) {
    const { removeNode, duplicateNode, duplicateNodes, clearNodeData, unlinkNode, nodes, groupNodes, ungroupNode } = useWorkflowStore();
    const { setSelectedNode } = useUIStore();
    const [confirmModal, setConfirmModal] = useState({ type: null, isOpen: false });

    const isBatch = ids.length > 1;
    const isAnySystem = ids.some(id => id === '__start__' || id === '__end__');
    const isGroupNode = !isBatch && ids.length === 1 && nodes.find(n => n.id === ids[0])?.data?.type === 'group';

    const onGroup = useCallback(() => {
        groupNodes(ids);
        onMouseLeave();
    }, [ids, groupNodes, onMouseLeave]);

    const onUngroup = useCallback(() => {
        ungroupNode(ids[0]);
        onMouseLeave();
    }, [ids, ungroupNode, onMouseLeave]);

    // Get node labels for the modal message
    const targetNodes = nodes.filter(n => ids.includes(n.id));
    const nodeLabels = targetNodes.map(n => n.data?.label || n.id).join('", "');

    const onOpen = useCallback(() => {
        setSelectedNode(ids[0]);
        onMouseLeave();
    }, [ids, setSelectedNode, onMouseLeave]);

    const onCopyProperties = useCallback(() => {
        let fullText = '';
        targetNodes.forEach((node) => {
            const data = node?.data;
            if (!data) return;

            const { id: node_id, type, label, ...configs } = data;
            let text = `--- ${label || node_id} ---\n`;
            text += `ID: ${node_id}\n`;
            text += `Type: ${type || 'unknown'}\n`;
            text += `Label: ${label || node_id}\n\n`;

            Object.entries(configs).forEach(([key, value]) => {
                if (value === null || value === undefined || value === '') return;
                if (typeof value === 'object') {
                    try {
                        if (Array.isArray(value) && value.length === 0) return;
                        if (!Array.isArray(value) && Object.keys(value).length === 0) return;
                        text += `${key}:\n${JSON.stringify(value, null, 2)}\n\n`;
                    } catch {
                        text += `${key}: ${value}\n\n`;
                    }
                } else {
                    text += `${key}: ${value}\n`;
                }
            });
            fullText += text + '\n';
        });

        navigator.clipboard.writeText(fullText.trim())
            .then(() => {
                const count = targetNodes.length;
                alert(`Properties for ${count} node${count > 1 ? 's' : ''} copied to clipboard!`);
            })
            .catch(err => {
                console.error("Clipboard copy failed: ", err);
            });
        onMouseLeave();
    }, [targetNodes, onMouseLeave]);

    const onDuplicate = useCallback(() => {
        if (isBatch) {
            duplicateNodes(ids);
        } else {
            duplicateNode(ids[0]);
        }
        onMouseLeave();
    }, [ids, isBatch, duplicateNode, duplicateNodes, onMouseLeave]);

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
            ids.forEach(id => clearNodeData(id));
        } else if (confirmModal.type === 'delete') {
            ids.forEach(id => removeNode(id));
        }
        setConfirmModal({ type: null, isOpen: false });
        onMouseLeave();
    }, [ids, confirmModal.type, clearNodeData, removeNode, onMouseLeave]);

    const handleCloseModal = () => {
        setConfirmModal({ type: null, isOpen: false });
        onMouseLeave();
    };

    const onUnlink = useCallback(() => {
        ids.forEach(id => unlinkNode(id));
        onMouseLeave();
    }, [ids, unlinkNode, onMouseLeave]);

    const duplicateableNodesCount = targetNodes.filter(n => n.id !== '__start__' && n.id !== '__end__' && n.data?.type !== 'group').length;

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
                {isBatch ? `Batch Actions (${ids.length})` : 'Node Actions'}
            </div>
            
            {!isBatch && (
                <>
                    {isGroupNode && (
                        <ContextItem icon={<FiLayers />} label="Ungroup" shortcut="Ctrl+Shift+G" onClick={onUngroup} />
                    )}
                    <ContextItem icon={<FiSettings />} label="Open Settings" onClick={onOpen} />
                    <ContextItem icon={<FiCopy />} label="Copy Properties" onClick={onCopyProperties} />
                </>
            )}
            
            {isBatch && (
                <>
                    <ContextItem icon={<FiLayers />} label="Group Selected" shortcut="Ctrl+G" onClick={onGroup} />
                    <ContextItem icon={<FiCopy />} label="Copy All Properties" onClick={onCopyProperties} />
                </>
            )}
            
            {!isAnySystem && (
                <>
                    <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                    {(!isGroupNode && (isBatch ? duplicateableNodesCount > 0 : true)) && (
                        <ContextItem icon={<FiCopy />} label={isBatch ? `Duplicate (${duplicateableNodesCount})` : 'Duplicate'} onClick={onDuplicate} />
                    )}
                    <ContextItem icon={<FiLink />} label={isBatch ? `Unlink All (${ids.length})` : 'Unlink Connections'} onClick={onUnlink} />
                    <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                    <ContextItem icon={<FiXCircle />} label={isBatch ? `Clear All Data (${ids.length})` : 'Clear Data'} onClick={onClearClick} />
                    <ContextItem icon={<FiTrash2 />} label={isBatch ? `Delete All (${ids.length})` : 'Delete Node'} onClick={onDeleteClick} color="#EF4444" />
                </>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirm}
                title={
                    isBatch
                        ? confirmModal.type === 'clear' ? `Clear Data for ${ids.length} Nodes?` : `Delete ${ids.length} Nodes?`
                        : confirmModal.type === 'clear' ? 'Clear Node Data?' : 'Delete Node?'
                }
                message={
                    isBatch
                        ? confirmModal.type === 'clear'
                            ? `Are you sure you want to reset all data for **"${nodeLabels}"**? This action cannot be undone.`
                            : `Are you sure you want to delete **${ids.length} nodes**? All their connections will be removed.`
                        : confirmModal.type === 'clear'
                            ? `Are you sure you want to reset all data for **${nodeLabels}**? This action cannot be undone.`
                            : `Are you sure you want to delete **${nodeLabels}**? All its connections will be removed.`
                }
                confirmText={
                    isBatch
                        ? confirmModal.type === 'clear' ? `Reset ${ids.length} Nodes` : `Delete ${ids.length} Nodes`
                        : confirmModal.type === 'clear' ? 'Reset Data' : 'Delete Node'
                }
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

function ContextItem({ icon, label, shortcut, onClick, color = 'var(--text-primary)' }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>{icon}</span>
                <span style={{ fontWeight: 500 }}>{label}</span>
            </div>
            {shortcut && (
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', opacity: 0.6, fontWeight: 500, paddingLeft: '8px' }}>
                    {shortcut}
                </span>
            )}
        </button>
    );
}
