import React, { useCallback, useRef, useState } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap, addEdge,
  applyNodeChanges, applyEdgeChanges, ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore, useUIStore } from '../../store';
import AgentNode from './Nodes/AgentNode';
import CardboardNode from './Nodes/CardboardNode';
import NodePalette from './NodePalette';
import PropertiesPanel from './PropertiesPanel';
import { FiPlus, FiPlay, FiGitBranch, FiArrowLeftCircle, FiDatabase } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import ContextMenu from './ContextMenu';
import VariableExplorer from './VariableExplorer';
import NodeSearch from './NodeSearch';

const NON_DIRTY_CHANGE_TYPES = new Set(['select', 'dimensions', 'reset']);

export default function WorkflowCanvas() {
  const nodeTypes = React.useMemo(() => ({ 
    agentNode: AgentNode,
    cardboardNode: CardboardNode
  }), []);
  const { nodes, edges, setNodes, setEdges, setNodesDirty, setEdgesDirty, addNode, setNodeData, workflowName } = useWorkflowStore();
  const { selectedNodeId, selectedEdgeId, setSelectedNode, setSelectedEdge, canvasWireStyle, canvasBackgroundStyle, isDarkCanvas } = useUIStore();

  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const { setRunOpen } = useUIStore();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menu, setMenu] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // Poll for active background runs (e.g. Cron/Webhook) to show live status
  React.useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/v1/agentmesh/active-runs');
        const data = await res.json();
        if (data.status === 'success') {
          const currentWfId = useWorkflowStore.getState().workflowId;
          const activeNodeIds = new Set();

          Object.values(data.active_runs).forEach(run => {
            if (run.workflow_id === currentWfId) {
              run.active_nodes.forEach(id => activeNodeIds.add(id));
            }
          });

          // Check if anything actually changed to avoid unnecessary re-renders
          const anyChange = nodes.some(n => !!n.data.isRunning !== activeNodeIds.has(n.id));
          if (anyChange) {
            setNodes(nodes.map(n => ({
              ...n,
              data: { ...n.data, isRunning: activeNodeIds.has(n.id) }
            })));
          }
        }
      } catch {
        // Silently fail polling
      }
    };
    const interval = setInterval(poll, 2500);
    return () => clearInterval(interval);
  }, [nodes, setNodes]);
  // Variable/Data Explorer resizing state and mouse drag handlers
  const [explorerWidth, setExplorerWidth] = useState(320);
  const [isResizingExplorer, setIsResizingExplorer] = useState(false);

  const startResizingExplorer = useCallback((mouseDownEvent) => {
    setIsResizingExplorer(true);
    const startX = mouseDownEvent.clientX;
    const startWidth = explorerWidth;

    const doDrag = (mouseMoveEvent) => {
      const deltaX = startX - mouseMoveEvent.clientX;
      const newWidth = Math.max(280, Math.min(600, startWidth + deltaX));
      setExplorerWidth(newWidth);
    };

    const stopDrag = () => {
      setIsResizingExplorer(false);
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  }, [explorerWidth]);


  const hasNodes = nodes.some(n => n.id !== '__start__' && n.id !== '__end__');


  const onConnect = useCallback(
    (params) => {
      const { source, target } = params;
      const sourceNode = nodes.find(n => n.id === source);
      const targetNode = nodes.find(n => n.id === target);

      // 🔄 SMART SYNC & IMPLICIT LOOP SUPPORT
      if (sourceNode && targetNode) {
        const isAgent = ['llm_agent', 'deep_agent', 'supervisor', 'swarm'].includes(sourceNode.data?.type);
        const isToolNode = targetNode.data?.type === 'tool_node';

        if (isAgent && isToolNode) {
          const agentTools = sourceNode.data.tools || [];
          const toolNodeTools = targetNode.data.tools || [];
          const mergedTools = Array.from(new Set([...agentTools, ...toolNodeTools]));
          const mergedConfigs = { ...(sourceNode.data.tool_configs || {}), ...(targetNode.data.tool_configs || {}) };
          
          if (mergedTools.length > agentTools.length || mergedTools.length > toolNodeTools.length) {
            setNodeData(source, { tools: mergedTools, tool_configs: mergedConfigs });
            setNodeData(target, { tools: mergedTools, tool_configs: mergedConfigs });
          }
          // Note: We no longer draw a manual return edge here because 
          // GraphCompiler.py handles tool-return routing implicitly in the runtime.
        }
      }

      const edgeType = canvasWireStyle === 'curve' ? 'default' : 'smoothstep';
      setEdgesDirty(addEdge({
        ...params,
        animated: false,
        type: edgeType,
        style: { stroke: '#CBD5E1', strokeWidth: 1.5 }
      }, edges));
    },
    [nodes, edges, setEdgesDirty, setNodeData, canvasWireStyle]
  );

  const edgeType = canvasWireStyle === 'curve' ? 'default' : 'smoothstep';
  const renderedEdges = React.useMemo(() => {
    return edges.map(edge => ({
      ...edge,
      type: edgeType
    }));
  }, [edges, edgeType]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/agentmesh-node');
    if (!type || !reactFlowInstance) return;
    const position = reactFlowInstance.screenToFlowPosition({
      x: e.clientX,
      y: e.clientY,
    });
    
    const id = addNode(type, position);
    
    // Support dropping pre-configured templates
    const configStr = e.dataTransfer.getData('application/agentmesh-config');
    if (configStr && id) {
      try {
        const config = JSON.parse(configStr);
        setNodeData(id, config);
      } catch (err) {
        console.error("Failed to parse dropped template config:", err);
      }
    }
  }, [reactFlowInstance, addNode, setNodeData]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node.id);
    setPaletteOpen(false);
  }, [setSelectedNode]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, [setSelectedNode, setSelectedEdge]);

  const onEdgeClick = useCallback((_, edge) => {
    setSelectedEdge(edge.id);
  }, [setSelectedEdge]);

  const isValidConnection = useCallback((connection) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    if (!sourceNode || !targetNode) return false;

    // Additional generic connection validation logic can be added here if needed
    // e.g. preventing self-connections
    if (connection.source === connection.target) return false;
    
    // 🛡️ Strict Tool Node Validation
    const isSourceTool = sourceNode.data?.type === 'tool_node';
    const isTargetTool = targetNode.data?.type === 'tool_node';
    const agentTypes = ['llm_agent', 'deep_agent', 'supervisor', 'swarm'];

    if (isSourceTool) {
      if (!agentTypes.includes(targetNode.data?.type)) return false;
    }
    if (isTargetTool) {
      if (!agentTypes.includes(sourceNode.data?.type)) return false;
    }

    return true;
  }, [nodes]);

  const onNodesDelete = useCallback((deleted) => {
    // Clear selection if deleted node was selected
    if (deleted.some(n => n.id === selectedNodeId)) {
      setSelectedNode(null);
    }
  }, [selectedNodeId, setSelectedNode]);

  const onNodeContextMenu = useCallback(
    (event, node) => {
      // Prevent native context menu from showing
      event.preventDefault();

      // Calculate position of the context menu relative to the viewport.
      // We use window.innerWidth/innerHeight to ensure correctly flipping 
      // when near edges, regardless of whether panels are open.
      const menuWidth = 200;
      const menuHeight = 240;
      const { clientX, clientY } = event;

      setMenu({
        id: node.id,
        top: clientY < window.innerHeight - menuHeight ? clientY : undefined,
        left: clientX < window.innerWidth - menuWidth ? clientX : undefined,
        right: clientX >= window.innerWidth - menuWidth ? window.innerWidth - clientX : undefined,
        bottom: clientY >= window.innerHeight - menuHeight ? window.innerHeight - clientY : undefined,
      });
    },
    [setMenu],
  );

  const onPaneContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      // For now, we only show node-specific context menu as per request
      // But we could add a "Paste" or "Add Node" menu here.
      setMenu(null);
    },
    [setMenu],
  );

  const onPaneClickCloseMenu = useCallback(() => setMenu(null), [setMenu]);

  // 🔍 KEYBOARD SHORTCUTS: "S" to open search, "N" to insert a sticky note (cardboard) when no node is selected
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
         activeEl.tagName === 'TEXTAREA' ||
         activeEl.isContentEditable)
      ) {
        return;
      }

      if ((e.key === 's' || e.key === 'S') && !selectedNodeId && !searchOpen) {
        e.preventDefault();
        setSearchOpen(true);
      }

      if ((e.key === 'n' || e.key === 'N') && !selectedNodeId) {
        e.preventDefault();
        // Calculate center of canvas viewport
        let position;
        if (reactFlowInstance && reactFlowWrapper.current) {
          const bounds = reactFlowWrapper.current.getBoundingClientRect();
          position = reactFlowInstance.screenToFlowPosition({
            x: bounds.left + bounds.width / 2,
            y: bounds.top + bounds.height / 2,
          });
        } else {
          position = { x: 200 + Math.random() * 300, y: 100 + Math.random() * 200 };
        }
        addNode('cardboard', position);
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, searchOpen, reactFlowInstance, addNode]);

  const handleSearchSelectNode = useCallback((type) => {
    setSearchOpen(false);
    
    // Calculate center of canvas viewport
    let position;
    if (reactFlowInstance && reactFlowWrapper.current) {
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      position = reactFlowInstance.screenToFlowPosition({
        x: bounds.left + bounds.width / 2,
        y: bounds.top + bounds.height / 2,
      });
    } else {
      position = { x: 200 + Math.random() * 300, y: 100 + Math.random() * 200 };
    }
    
    addNode(type, position);
  }, [reactFlowInstance, addNode]);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-canvas)', fontFamily: "'Inter', sans-serif", position: 'relative' }}>

      {/* ── Left Palette Panel (Now on the left) ── */}
      {paletteOpen && !selectedNodeId && (
        <div style={{
          width: 260,
          borderRight: '1px solid var(--border)',
          background: 'white',
          flexShrink: 0,
          overflow: 'hidden',
          animation: 'paletteIn 0.2s ease-out'
        }}>
          <NodePalette onClose={() => setPaletteOpen(false)} />
        </div>
      )}

      {/* ── Canvas ── */}
      <div ref={reactFlowWrapper} style={{ flex: 1, position: 'relative' }}>

        {/* Top-left: Add node toggle */}
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
          <button
            onClick={() => { setPaletteOpen((v) => !v); setSelectedNode(null); }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px',
              background: paletteOpen ? 'var(--theme-primary-glow)' : 'var(--bg-secondary, white)',
              border: paletteOpen ? '1px solid var(--theme-primary)' : '1px solid var(--border)', 
              borderRadius: 12,
              color: paletteOpen ? 'var(--theme-primary)' : 'var(--text-primary)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              width: 44, height: 44,
            }}
            title={paletteOpen ? "Close Library" : "Add node"}
          >
            {paletteOpen ? <FiArrowLeftCircle size={22} /> : <FiPlus size={22} />}
          </button>
        </div>

        {/* Top-right: Run toggle */}
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, display: 'flex', gap: 10 }}>
          <button
            onClick={() => useUIStore.getState().setShowVariableExplorer(!useUIStore.getState().showVariableExplorer)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px',
              background: useUIStore((s) => s.showVariableExplorer) ? 'var(--theme-primary-glow)' : 'var(--bg-secondary, white)',
              border: useUIStore((s) => s.showVariableExplorer) ? '1px solid var(--theme-primary)' : '1px solid var(--border)', 
              borderRadius: 12,
              color: useUIStore((s) => s.showVariableExplorer) ? 'var(--theme-primary)' : 'var(--text-primary)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)', transition: 'all 0.15s',
              width: 44, height: 44,
            }}
            title="Data Explorer"
          >
            <FiDatabase size={20} />
          </button>

          <button
            onClick={() => hasNodes && setRunOpen(true)}
            disabled={!hasNodes}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px',
              background: hasNodes ? 'var(--theme-primary-glow)' : 'var(--border-light, #E5E7EB)',
              border: hasNodes ? '1px solid var(--theme-primary-glow)' : '1px solid var(--border-light, #E5E7EB)', 
              borderRadius: 12,
              color: hasNodes ? 'var(--theme-primary)' : 'var(--text-muted, #9CA3AF)',
              cursor: hasNodes ? 'pointer' : 'not-allowed',
              boxShadow: hasNodes ? '0 2px 8px rgba(142, 119, 187, 0.1)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              width: 44, height: 44,
              opacity: hasNodes ? 1 : 0.7
            }}
            title="Run Workflow"
            onMouseEnter={(e) => { 
                if (hasNodes) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.background = 'var(--theme-primary)';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(142, 119, 187, 0.25)';
                }
            }}
            onMouseLeave={(e) => { 
                if (hasNodes) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.background = 'var(--theme-primary-glow)';
                    e.currentTarget.style.color = 'var(--theme-primary)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(142, 119, 187, 0.1)';
                }
            }}
          >
            <FiPlay size={20} fill="currentColor" />
          </button>
        </div>

        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={renderedEdges}
            onNodesChange={(changes) => {
              let hasDirtyChange = false;
              
              // Check changes to see if a cardboard node is being manually resized
              changes.forEach(change => {
                if (change.type === 'dimensions' && change.dimensions) {
                  const node = nodes.find(n => n.id === change.id);
                  if (node && (node.type === 'cardboardNode' || node.data?.type === 'cardboard')) {
                    const currentWidth = node.style?.width;
                    const currentHeight = node.style?.height;
                    const newWidth = change.dimensions.width;
                    const newHeight = change.dimensions.height;
                    
                    if (newWidth !== undefined && newHeight !== undefined && 
                        (newWidth !== currentWidth || newHeight !== currentHeight)) {
                      hasDirtyChange = true;
                    }
                  }
                } else if (!NON_DIRTY_CHANGE_TYPES.has(change.type)) {
                  hasDirtyChange = true;
                }
              });

              let updated = applyNodeChanges(changes, nodes);

              // Sync cardboard node dimensions to style width/height so it's persisted correctly
              updated = updated.map(node => {
                if (node.type === 'cardboardNode' || node.data?.type === 'cardboard') {
                  const width = node.width ?? node.measured?.width;
                  const height = node.height ?? node.measured?.height;
                  if (width !== undefined && height !== undefined) {
                    return {
                      ...node,
                      style: {
                        ...node.style,
                        width,
                        height
                      }
                    };
                  }
                }
                return node;
              });

            if (hasDirtyChange) {
              setNodesDirty(updated);
            } else {
              setNodes(updated);
            }
          }}
          onEdgesChange={(changes) => {
            const updated = applyEdgeChanges(changes, edges);
            const hasDirtyChange = changes.some(c => c.type !== 'select');
            if (hasDirtyChange) {
              setEdgesDirty(updated);
            } else {
              setEdges(updated);
            }
          }}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          isValidConnection={isValidConnection}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeClick={onEdgeClick}
          onPaneClick={() => { onPaneClick(); onPaneClickCloseMenu(); }}
          onPaneContextMenu={onPaneContextMenu}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{
            type: canvasWireStyle === 'curve' ? 'default' : 'smoothstep',
            animated: false,
            style: { stroke: '#CBD5E1', strokeWidth: 1.5 },
          }}
          fitView
          fitViewOptions={{ padding: 0.4 }}
          snapToGrid={true}
          snapGrid={[20, 20]}
          deleteKeyCode={['Backspace', 'Delete']}
          className={isDarkCanvas ? 'is-dark-theme' : ''}
          style={{ background: isDarkCanvas ? '#1D1D1F' : '#F8F9FB' }}
        >
          {canvasBackgroundStyle !== 'clean' && (
            <Background 
              key={canvasBackgroundStyle}
              variant={canvasBackgroundStyle} 
              gap={20} 
              size={canvasBackgroundStyle === 'cross' ? 6 : canvasBackgroundStyle === 'dots' ? 1.5 : undefined} 
              lineWidth={canvasBackgroundStyle === 'lines' ? 1 : undefined}
              color={isDarkCanvas ? '#4C4B53' : '#CBD5E1'} 
            />
          )}
          <Controls />
          <MiniMap
            nodeColor={(n) => {
              const colors = { 
                llm_agent: '#C9DEFF', tool_node: '#FFE4B8', router: '#E5D9FF', 
                supervisor: '#C9F5E0', swarm: '#FFD9EE', rag_node: '#FFF3B8', 
                subgraph: '#C9F5F5', textToAudio: '#FFE4E1', api_node: '#E0F2FE',
                cardboard: '#CBD5E1'
              };
              return colors[n.data?.type] || '#E8E8E5';
            }}
            maskColor={isDarkCanvas ? 'rgba(15, 23, 42, 0.7)' : 'rgba(248, 249, 251, 0.7)'}
            style={{ 
              borderRadius: 10, 
              border: isDarkCanvas ? '1px solid #334155' : '1px solid var(--border)', 
              boxShadow: 'var(--shadow-sm)',
              background: isDarkCanvas ? '#1E293B' : 'white'
            }}
          />
        </ReactFlow>

        {menu && <ContextMenu onClick={onPaneClickCloseMenu} onMouseLeave={onPaneClickCloseMenu} {...menu} />}

        {searchOpen && (
          <NodeSearch
            onClose={() => setSearchOpen(false)}
            onSelect={handleSearchSelectNode}
          />
        )}

        {/* Empty state */}
        {nodes.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', gap: 14,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'white', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)', color: '#9898A6'
            }}>
              <FiGitBranch size={24} strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)' }}>{workflowName}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320, textAlign: 'center', lineHeight: 1.6 }}>
              Click the <strong style={{ color: 'var(--text-primary)' }}>+ icon</strong> on the top left to start building your AI system.
            </div>
          </div>
        )}
        </ReactFlowProvider>
      </div>

      {/* ── Right side panels ── */}
      <AnimatePresence>
        {(selectedNodeId || selectedEdgeId) && (
          <motion.div 
            key="properties-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              borderLeft: '1px solid var(--border)',
              background: 'white',
              flexShrink: 0,
              overflow: 'hidden',
              height: '100%'
            }}
          >
            <PropertiesPanel />
          </motion.div>
        )}

        {useUIStore((s) => s.showVariableExplorer) && (
          <motion.div 
            key="variable-explorer"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: explorerWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={isResizingExplorer ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
            style={{
              borderLeft: '1px solid var(--border)',
              background: 'white',
              flexShrink: 0,
              overflow: 'hidden',
              height: '100%',
              position: 'relative'
            }}
          >
            {/* Resizable drag handle on the left edge */}
            <div
              onMouseDown={startResizingExplorer}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '6px',
                cursor: 'col-resize',
                zIndex: 100,
                background: isResizingExplorer ? 'var(--theme-primary, #4285F4)' : 'transparent',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { if (!isResizingExplorer) e.currentTarget.style.background = 'rgba(66, 133, 244, 0.3)'; }}
              onMouseLeave={(e) => { if (!isResizingExplorer) e.currentTarget.style.background = 'transparent'; }}
            />
            <VariableExplorer onClose={() => useUIStore.getState().setShowVariableExplorer(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes paletteIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(30px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
