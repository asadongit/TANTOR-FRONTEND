import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChevronDown, Search, PlusCircle, XCircle, ChevronLeft, ChevronRight, Table, Minimize2, Maximize2 } from 'lucide-react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import Breadcrumb from '../../../../components/Breadcrumb';

// Circular Remote Control Component
const CircularNodeRemote = ({ nodeId, position, onNavigate, onToggleVisibility, onReset, onClose, expandedNodes }) => {
  const isForwardExpanded = expandedNodes.has(`${nodeId}-forward`);
  const isBackwardExpanded = expandedNodes.has(`${nodeId}-backward`);

  return (
    <div
      className="absolute z-20"
      style={{
        left: position.x + 80,
        top: position.y - 40,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="relative">
        <div className="w-24 h-24 bg-gray-800 rounded-full border-4 border-gray-600 shadow-2xl relative">
          <div className="w-12 h-12 bg-red-500 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <span className="text-white text-xs font-bold">CTRL</span>
          </div>
          <button
            onClick={() => onNavigate(nodeId, 'forward')}
            className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center transition-all ${isForwardExpanded ? 'bg-yellow-500 text-black' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
            title="Toggle Forward Connections"
          >
            <ChevronRight size={14} />
          </button>
          <button
            onClick={() => onNavigate(nodeId, 'backward')}
            className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center transition-all ${isBackwardExpanded ? 'bg-yellow-500 text-black' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
            title="Toggle Backward Connections"
          >
            <ChevronLeft size={14} />
          </button>
        </div>
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full text-white flex items-center justify-center text-xs"
        >
          <XCircle size={12} />
        </button>
      </div>
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
        Node: {nodeId}
      </div>
    </div>
  );
};

const DataLineageFlow = ({ selectedItems, currentTableIndex, onNavigate, onBack }) => {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  const displayableTableItems = useMemo(() => {
    return selectedItems.filter(item => item.type === 'Table');
  }, [selectedItems]);

  const NODE_SIZE = 120;

  const generateNodesAndEdges = (tableItem) => {
    const schemaNode = {
      id: `${tableItem.schema}-schema`,
      type: 'default',
      position: { x: 200, y: 200 },
      data: {
        label: `S\n${tableItem.schema}`,
        type: 'schema',
        description: `Schema: ${tableItem.schema}`
      },
      style: {
        background: '#3B82F6',
        color: 'white',
        border: '3px solid #1D4ED8',
        borderRadius: '50%',
        width: NODE_SIZE,
        height: NODE_SIZE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        textAlign: 'center'
      }
    };

    const tableNode = {
      id: `${tableItem.name}-table`,
      type: 'default',
      position: { x: 500, y: 200 },
      data: {
        label: `T\n${tableItem.name}`,
        type: 'table',
        description: `Table: ${tableItem.name}`
      },
      style: {
        background: '#EF4444',
        color: 'white',
        border: '3px solid #DC2626',
        borderRadius: '50%',
        width: NODE_SIZE,
        height: NODE_SIZE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        textAlign: 'center'
      }
    };

    const connectionEdge = {
      id: `${schemaNode.id}-${tableNode.id}`,
      source: schemaNode.id,
      target: tableNode.id,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#6B7280', strokeWidth: 3 }
    };

    return {
      nodes: [schemaNode, tableNode],
      edges: [connectionEdge]
    };
  };

  const currentTable = displayableTableItems[currentTableIndex];
  const { nodes: initialNodes, edges: initialEdges } = currentTable ?
    generateNodesAndEdges(currentTable) :
    { nodes: [], edges: [] };

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when table changes
  useEffect(() => {
    if (currentTable) {
      const { nodes: newNodes, edges: newEdges } = generateNodesAndEdges(currentTable);
      setNodes(newNodes);
      setEdges(newEdges);
      setExpandedNodes(new Set());
      setSelectedNodeId(null);
    }
  }, [currentTable, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const getDummyAdditionalNodes = (nodeId, direction) => {
    const nodeStyles = {
      source: {
        background: '#8B5CF6',
        border: '2px solid #7C3AED',
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold'
      },
      transform: {
        background: '#F59E0B',
        border: '2px solid #D97706',
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold'
      }
    };

    // Mock data for additional nodes
    const mockData = {
      [`${nodeId}-forward`]: {
        nodes: [{
          id: `${nodeId}-downstream-1`,
          position: { x: 700, y: 150 },
          data: { label: 'VIEW\nREPORT_V', type: 'view', description: 'Report View' },
          style: { ...nodeStyles.transform, width: NODE_SIZE, height: NODE_SIZE, fontSize: '12px' }
        }],
        edges: [{
          id: `${nodeId}-downstream-edge-1`,
          source: nodeId,
          target: `${nodeId}-downstream-1`,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#F59E0B', strokeWidth: 2 }
        }]
      },
      [`${nodeId}-backward`]: {
        nodes: [{
          id: `${nodeId}-upstream-1`,
          position: { x: 50, y: 150 },
          data: { label: 'SRC\nRAW_DATA', type: 'source', description: 'Raw Data Source' },
          style: { ...nodeStyles.source, width: NODE_SIZE, height: NODE_SIZE, fontSize: '12px' }
        }],
        edges: [{
          id: `${nodeId}-upstream-edge-1`,
          source: `${nodeId}-upstream-1`,
          target: nodeId,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#8B5CF6', strokeWidth: 2 }
        }]
      }
    };

    return mockData[`${nodeId}-${direction}`] || { nodes: [], edges: [] };
  };

  const handleNavigate = (nodeId, direction) => {
    const key = `${nodeId}-${direction}`;
    const isCurrentlyExpanded = expandedNodes.has(key);

    if (isCurrentlyExpanded) {
      setNodes(currentNodes =>
        currentNodes.filter(node => !node.id.includes(`${nodeId}-${direction === 'forward' ? 'downstream' : 'upstream'}`))
      );
      setEdges(currentEdges =>
        currentEdges.filter(edge => !edge.id.includes(`${nodeId}-${direction === 'forward' ? 'downstream' : 'upstream'}`))
      );
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    } else {
      const additionalData = getDummyAdditionalNodes(nodeId, direction);
      if (additionalData.nodes.length > 0) {
        setNodes(currentNodes => [...currentNodes, ...additionalData.nodes]);
        setEdges(currentEdges => [...currentEdges, ...additionalData.edges]);
        setExpandedNodes(prev => new Set(prev).add(key));
      }
    }
  };

  const handleToggleVisibility = (nodeId) => {
  };

  const handleReset = () => {
    if (currentTable) {
      const { nodes: resetNodes, edges: resetEdges } = generateNodesAndEdges(currentTable);
      setNodes(resetNodes);
      setEdges(resetEdges);
      setExpandedNodes(new Set());
    }
  };

  const onNodeClick = (event, node) => {
    setSelectedNodeId(prevId => (prevId === node.id ? null : node.id));
  };

  const closeRemote = () => {
    setSelectedNodeId(null);
  };

  const selectedNode = nodes.find(node => node.id === selectedNodeId);

  if (!currentTable) {
    return (
      <div className="w-full h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-600">No Table Selected</h2>
          <p className="text-gray-500">Please select tables from the lineage page first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 h-screen flex flex-col overflow-hidden">
      <div className="p-2">
        <Breadcrumb />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <Table className="h-6 w-6 text-gray-700" />
            <span className="text-lg font-semibold text-gray-800">
              {currentTable?.name || 'Loading...'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {displayableTableItems.length > 1 && (
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => onNavigate('prev')}
                  disabled={currentTableIndex === 0}
                  className="p-2 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous Table"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium text-gray-700 px-3">
                  Table {currentTableIndex + 1} of {displayableTableItems.length}
                </span>
                <button
                  onClick={() => onNavigate('next')}
                  disabled={currentTableIndex === displayableTableItems.length - 1}
                  className="p-2 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next Table"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-grow relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          className="bg-gray-50"
        >
          <Controls />
          <MiniMap
            nodeColor={(node) => node.style?.background || '#ddd'}
            className="bg-white border border-gray-300 rounded"
          />
          <Background variant="dots" gap={20} size={1} color="#E5E7EB" />
        </ReactFlow>

        {selectedNodeId && selectedNode && (
          <CircularNodeRemote
            nodeId={selectedNodeId}
            position={selectedNode.position}
            onNavigate={handleNavigate}
            onToggleVisibility={handleToggleVisibility}
            onReset={handleReset}
            onClose={closeRemote}
            expandedNodes={expandedNodes}
          />
        )}

      </div>
    </div>
  );
};
export default DataLineageFlow;