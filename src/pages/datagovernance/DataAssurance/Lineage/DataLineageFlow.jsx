import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, Search, PlusCircle, XCircle, ChevronLeft, ChevronRight, Table, Minimize2, Maximize2, Layers } from 'lucide-react';
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

const CircularNodeRemote = ({ nodeId, position, onNavigate, onToggleVisibility, onReset, onClose, expandedNodes, isLoading, nodeData }) => {
  const isForwardExpanded = expandedNodes.has(nodeId);

  return (
    <div
      className="absolute z-20"
      style={{
        right: '70px',
        top: '120px',
      }}
    >
      <div className="relative">
        <div className="w-24 h-24 bg-gray-800 rounded-full border-4 border-gray-600 shadow-2xl relative">
          <div className="w-12 h-12 bg-red-500 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <span className="text-white text-xs font-bold">CTRL</span>
          </div>
          <button
            onClick={() => onNavigate(nodeId, 'forward')}
            disabled={isLoading || (nodeData.type !== 'schema' && nodeData.type !== 'table')}
            className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center transition-all ${nodeData.type !== 'schema' && nodeData.type !== 'table' ? 'bg-gray-400 cursor-not-allowed' :
                isForwardExpanded ? 'bg-yellow-500 text-black' :
                  isLoading ? 'bg-gray-500 text-white cursor-wait' :
                    'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            title={
              nodeData.type !== 'schema' && nodeData.type !== 'table' ? "Forward not available for this node type" :
                isLoading ? "Loading..." :
                  isForwardExpanded ? "Close Forward Connections" : "Show Forward Connections"
            }
          >
            {isLoading ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
          <button
            onClick={() => onNavigate(nodeId, 'backward')}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center transition-all bg-gray-400 cursor-not-allowed text-white"
            disabled={true}
            title="Backward functionality not implemented yet"
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
        {nodeId}
      </div>
    </div>
  );
};

const API_BASE_URL = `${window._env_?.VITE_FAST_API}/data_lineage`;

const DataLineageFlow = ({ selectedItems, currentTableIndex, onNavigate, onBack }) => {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [forwardSteps, setForwardSteps] = useState(2);
  const [forwardData, setForwardData] = useState(new Map());
  const [isLoadingForward, setIsLoadingForward] = useState(false);
  const [nodeConnectionMap, setNodeConnectionMap] = useState(new Map());


  const displayableItems = useMemo(() => {
    return selectedItems.filter(item => item.type === 'Table' || item.type === 'View');
  }, [selectedItems]);

  const NODE_SIZE = 60;

  const getConnectionInfo = (nodeId, nodeType) => {
    if (nodeType === 'schema') {
      const parts = nodeId.split('.');
      return {
        database: parts[0],
        schema: nodeId
      };
    } else if (nodeType === 'table') {
      const parts = nodeId.split('.');
      return {
        database: parts[0],
        schema: parts.slice(0, -1).join('.'),
        table: nodeId
      };
    }
    return null;
  };

  const fetchForwardLineage = async (nodeId, nodeType, steps) => {
    const connectionInfo = getConnectionInfo(nodeId, nodeType);
    if (!connectionInfo) return null;

    // const policyResponse = await secureQuery({ user_query: "" }, token);
    // const fetchedPolicyIds = policyResponse.matched_policy_ids || [];

    const payload = {
      matched_policy_ids: [19],
      connection_name: connectionInfo.database,
      table_schema: connectionInfo.schema,
      steps: steps,
      type: nodeType
    };

    if (nodeType === 'table') {
      payload.table_name = connectionInfo.table;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/vizualization/forward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching forward lineage:', error);
      return null;
    }
  };

  // Calculate positions for new nodes
  const calculateNodePositions = (existingNodes, newNodeType, count) => {
    const positions = [];
    const baseX = newNodeType === 'table' ? 800 : 1100;
    const startY = 100;
    const spacing = 120;

    for (let i = 0; i < count; i++) {
      positions.push({
        x: baseX,
        y: startY + (i * spacing)
      });
    }

    return positions;
  };

  const createForwardNodes = (nodeId, nodeType, forwardResponse, existingNodes) => {
    const newNodes = [];
    const newEdges = [];

    if (nodeType === 'schema' && forwardResponse.tables) {
      const tablePositions = calculateNodePositions(existingNodes, 'table', forwardResponse.tables.length);

      forwardResponse.tables.forEach((tableFullName, index) => {
        // Skip if table already exists
        if (existingNodes.find(n => n.id === tableFullName)) {
          return;
        }

        const tableName = tableFullName.split('.').pop();
        const tableNode = {
          id: tableFullName,
          type: 'default',
          position: tablePositions[index],
          data: {
            label: 'T',
            type: 'table',
            description: `Table: ${tableName}`,
            fullName: tableFullName,
            isForwardNode: true,
            sourceNode: nodeId
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
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center'
          }
        };

        newNodes.push(tableNode);

        // Create edge from schema to table
        const edge = {
          id: `${nodeId}-${tableFullName}`,
          source: nodeId,
          target: tableFullName,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#6B7280', strokeWidth: 2 },
          data: { isForwardEdge: true, sourceNode: nodeId }
        };
        newEdges.push(edge);
      });

      // Handle views if steps >= 2
      if (forwardResponse.views && forwardSteps >= 2) {
        const viewPositions = calculateNodePositions(existingNodes, 'view', forwardResponse.views.length);

        forwardResponse.views.forEach((viewData, index) => {
          const viewName = viewData.view_name;

          // Skip if view already exists
          if (existingNodes.find(n => n.id === viewName)) {
            return;
          }

          const viewNode = {
            id: viewName,
            type: 'default',
            position: viewPositions[index],
            data: {
              label: 'V',
              type: 'view',
              description: `View: ${viewName}`,
              fullName: viewName,
              isForwardNode: true,
              sourceNode: nodeId
            },
            style: {
              background: '#10B981',
              color: 'white',
              border: '3px solid #059669',
              borderRadius: '50%',
              width: NODE_SIZE,
              height: NODE_SIZE,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          };

          newNodes.push(viewNode);

          // Create edges from tables to view
          viewData.tables.forEach(tableName => {
            const matchingTableNode = [...existingNodes, ...newNodes].find(node =>
              node.data?.type === 'table' &&
              node.id.toLowerCase() === tableName.toLowerCase()
            );

            if (matchingTableNode) {
              const edgeId = `${matchingTableNode.id}-${viewName}`;

              // Check if edge already exists
              const edgeExists = [...existingNodes, ...newEdges].some(edge =>
                edge.id && edge.id.toLowerCase() === edgeId.toLowerCase()
              );

              if (!edgeExists) {
                const edge = {
                  id: edgeId,
                  source: matchingTableNode.id,
                  target: viewName,
                  markerEnd: { type: MarkerType.ArrowClosed },
                  style: { stroke: '#10B981', strokeWidth: 2 },
                  data: { isForwardEdge: true, sourceNode: nodeId }
                };
                newEdges.push(edge);
              }
            } else {
              console.warn(`Could not find matching table node for: ${tableName}`);
            }
          });
        });
      }
    } else if (nodeType === 'table' && Array.isArray(forwardResponse)) {
      const viewPositions = calculateNodePositions(existingNodes, 'view', forwardResponse.length);

      forwardResponse.forEach((viewName, index) => {
        // Skip if view already exists
        if (existingNodes.find(n => n.id === viewName)) {
          // Still create edge if view exists but edge doesn't exist (case-insensitive check)
          const existingEdges = [...existingNodes].filter(item => item.id && item.source && item.target);
          const proposedEdgeId = `${nodeId}-${viewName}`.toLowerCase();

          const edgeExists = existingEdges.some(edge =>
            edge.id && edge.id.toLowerCase() === proposedEdgeId
          );

          if (!edgeExists) {
            const edge = {
              id: `${nodeId}-${viewName}`,
              source: nodeId,
              target: viewName,
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { stroke: '#10B981', strokeWidth: 2 },
              data: { isForwardEdge: true, sourceNode: nodeId }
            };
            newEdges.push(edge);
          }
          return;
        }

        const viewNode = {
          id: viewName,
          type: 'default',
          position: viewPositions[index],
          data: {
            label: 'V',
            type: 'view',
            description: `View: ${viewName}`,
            fullName: viewName,
            isForwardNode: true,
            sourceNode: nodeId
          },
          style: {
            background: '#10B981',
            color: 'white',
            border: '3px solid #059669',
            borderRadius: '50%',
            width: NODE_SIZE,
            height: NODE_SIZE,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center'
          }
        };

        newNodes.push(viewNode);

        // Create edge from table to view
        const edge = {
          id: `${nodeId}-${viewName}`,
          source: nodeId,
          target: viewName,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#10B981', strokeWidth: 2 },
          data: { isForwardEdge: true, sourceNode: nodeId }
        };
        newEdges.push(edge);
      });
    }

    return { newNodes, newEdges };
  };

  // Remove forward nodes and edges for a specific source node
  const removeForwardNodes = (sourceNodeId, currentNodes, currentEdges) => {
    const sourceEdges = currentEdges.filter(edge =>
      edge.data?.sourceNode === sourceNodeId && edge.data?.isForwardEdge
    );

    const targetNodeIds = sourceEdges.map(edge => edge.target);
    const filteredEdges = currentEdges.filter(edge =>
      !(edge.data?.sourceNode === sourceNodeId && edge.data?.isForwardEdge)
    );

    const nodesToRemove = [];
    targetNodeIds.forEach(nodeId => {
      const remainingConnections = filteredEdges.filter(edge =>
        edge.target === nodeId || edge.source === nodeId
      );

      if (remainingConnections.length === 0) {
        nodesToRemove.push(nodeId);
      }
    });

    // Remove nodes that have no connections left
    const filteredNodes = currentNodes.filter(node =>
      !nodesToRemove.includes(node.id)
    );

    return { filteredNodes, filteredEdges };
  };

  const generateNodesAndEdges = (item) => {
    if (item.type === 'Table') {
      return generateTableNodesAndEdges(item);
    } else if (item.type === 'View') {
      return generateViewNodesAndEdges(item);
    }
    return { nodes: [], edges: [] };
  };

  const generateTableNodesAndEdges = (tableItem) => {
    const schemaNodeId = tableItem.schema;
    const schemaNode = {
      id: schemaNodeId,
      type: 'default',
      position: { x: 200, y: 200 },
      data: {
        label: 'S',
        type: 'schema',
        description: `Schema: ${tableItem.schemaToShow}`,
        fullName: tableItem.schema
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
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'center'
      }
    };

    const tableNodeId = tableItem.table;
    const tableNode = {
      id: tableNodeId,
      type: 'default',
      position: { x: 500, y: 200 },
      data: {
        label: 'T',
        type: 'table',
        description: `Table: ${tableItem.name}`,
        fullName: tableItem.table
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
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'center'
      }
    };

    const connectionEdge = {
      id: `${schemaNodeId}-${tableNodeId}`,
      source: schemaNodeId,
      target: tableNodeId,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#6B7280', strokeWidth: 3 }
    };

    return {
      nodes: [schemaNode, tableNode],
      edges: [connectionEdge]
    };
  };

  const generateViewNodesAndEdges = (viewItem) => {
    if (!viewItem.viewMetadata) {
      return generateTableNodesAndEdges(viewItem);
    }

    const { table_name } = viewItem.viewMetadata;
    const nodes = [];
    const edges = [];
    const schemaGroups = {};

    table_name.forEach((fullTableName) => {
      const parts = fullTableName.split('.');
      const schemaName = parts.slice(0, -1).join('.');

      if (!schemaName) {
        console.error(`Could not determine schema for table: ${fullTableName}`);
        return;
      }

      if (!schemaGroups[schemaName]) {
        schemaGroups[schemaName] = [];
      }

      schemaGroups[schemaName].push({
        name: fullTableName,
        fullSchema: schemaName
      });
    });

    let schemaIndex = 0;
    const schemaPositions = {};

    Object.entries(schemaGroups).forEach(([schemaName, tables]) => {
      const schemaY = 100 + (schemaIndex * 200);
      const schemaX = 100;

      const schemaNodeId = schemaName;
      schemaPositions[schemaName] = { x: schemaX, y: schemaY };

      const schemaNode = {
        id: schemaNodeId,
        type: 'default',
        position: { x: schemaX, y: schemaY },
        data: {
          label: 'S',
          type: 'schema',
          description: `Schema: ${schemaName.split('.').pop()}`,
          fullName: schemaName
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
          fontSize: '24px',
          fontWeight: 'bold',
          textAlign: 'center'
        }
      };
      nodes.push(schemaNode);

      tables.forEach((table, tableIndex) => {
        const tableY = schemaY + ((tableIndex - Math.floor(tables.length / 2)) * 80);
        const tableX = schemaX + 250;

        const tableNodeId = table.name;
        const tableNode = {
          id: tableNodeId,
          type: 'default',
          position: { x: tableX, y: tableY },
          data: {
            label: 'T',
            type: 'table',
            description: `Table: ${table.name.split('.').pop()}`,
            fullName: table.name
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
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center'
          }
        };
        nodes.push(tableNode);

        const schemaToTableEdge = {
          id: `${schemaNodeId}-${tableNodeId}`,
          source: schemaNodeId,
          target: tableNodeId,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#6B7280', strokeWidth: 2 }
        };
        edges.push(schemaToTableEdge);
      });

      schemaIndex++;
    });

    const viewX = 600;
    const viewY = 100 + (Object.keys(schemaGroups).length - 1) * 100;

    const viewNodeId = viewItem.name;
    const viewNode = {
      id: viewNodeId,
      type: 'default',
      position: { x: viewX, y: viewY },
      data: {
        label: 'V',
        type: 'view',
        description: `View: ${viewItem.name}`,
        viewName: viewItem.name
      },
      style: {
        background: '#10B981',
        color: 'white',
        border: '3px solid #059669',
        borderRadius: '50%',
        width: NODE_SIZE,
        height: NODE_SIZE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'center'
      }
    };
    nodes.push(viewNode);

    nodes.forEach(node => {
      if (node.data.type === 'table') {
        const tableToViewEdge = {
          id: `${node.id}-${viewNodeId}`,
          source: node.id,
          target: viewNodeId,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#10B981', strokeWidth: 2 }
        };
        edges.push(tableToViewEdge);
      }
    });

    return { nodes, edges };
  };

  const currentItem = displayableItems[currentTableIndex];
  const { nodes: initialNodes, edges: initialEdges } = currentItem ?
    generateNodesAndEdges(currentItem) :
    { nodes: [], edges: [] };

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    if (currentItem) {
      const { nodes: newNodes, edges: newEdges } = generateNodesAndEdges(currentItem);
      setNodes(newNodes);
      setEdges(newEdges);
      setExpandedNodes(new Set());
      setSelectedNodeId(null);
      setForwardData(new Map());
      setNodeConnectionMap(new Map());
    }
  }, [currentItem, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const handleNavigate = async (nodeId, direction) => {

    if (direction !== 'forward') return;

    const node = nodes.find(n => n.id === nodeId);
    if (!node || (node.data.type !== 'schema' && node.data.type !== 'table')) {
      return;
    }

    const isCurrentlyExpanded = expandedNodes.has(nodeId);

    if (isCurrentlyExpanded) {
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });

      const { filteredNodes, filteredEdges } = removeForwardNodes(nodeId, nodes, edges);
      setNodes(filteredNodes);
      setEdges(filteredEdges);

      setForwardData(prev => {
        const newMap = new Map(prev);
        newMap.delete(nodeId);
        return newMap;
      });
    } else {
      setIsLoadingForward(true);

      try {
        const response = await fetchForwardLineage(nodeId, node.data.type, forwardSteps);

        if (response) {
          const { newNodes, newEdges } = createForwardNodes(nodeId, node.data.type, response, nodes);

          // Merge existing edges with new edges, avoiding duplicates
          const existingEdgeIds = new Set(edges.map(e => e.id));
          const uniqueNewEdges = newEdges.filter(e => !existingEdgeIds.has(e.id));

          // Merge existing nodes with new nodes, avoiding duplicates
          const existingNodeIds = new Set(nodes.map(n => n.id));
          const uniqueNewNodes = newNodes.filter(n => !existingNodeIds.has(n.id));

          setNodes(prev => [...prev, ...uniqueNewNodes]);
          setEdges(prev => [...prev, ...uniqueNewEdges]);

          setExpandedNodes(prev => {
            const newSet = new Set(prev);
            newSet.add(nodeId);
            return newSet;
          });

          setForwardData(prev => {
            const newMap = new Map(prev);
            newMap.set(nodeId, response);
            return newMap;
          });
        } 
      } catch (error) {
        console.error('Error handling forward navigation:', error);
      } finally {
        setIsLoadingForward(false);
      }
    }
  };

  const handleToggleVisibility = (nodeId) => {
    // Implementation for toggle visibility if needed
  };

  const handleReset = () => {
    if (currentItem) {
      const { nodes: resetNodes, edges: resetEdges } = generateNodesAndEdges(currentItem);
      setNodes(resetNodes);
      setEdges(resetEdges);
      setExpandedNodes(new Set());
      setForwardData(new Map());
      setNodeConnectionMap(new Map());
    }
  };

  const onNodeClick = (event, node) => {
    setSelectedNodeId(prevId => (prevId === node.id ? null : node.id));
  };

  const closeRemote = () => {
    setSelectedNodeId(null);
  };

  const selectedNode = nodes.find(node => node.id === selectedNodeId);

  if (!currentItem) {
    return (
      <div className="w-full h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-600">No Items Selected</h2>
          <p className="text-gray-500">Please select tables or views from the lineage page first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 h-screen flex flex-col overflow-hidden">
      <div className="p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            {currentItem?.type === 'View' ? (
              <Layers className="h-6 w-6 text-gray-700" />
            ) : (
              <Table className="h-6 w-6 text-gray-700" />
            )}
            <span className="text-lg font-semibold text-gray-800">
              {currentItem?.name || 'Loading...'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {displayableItems.length > 1 && (
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => onNavigate('prev')}
                  disabled={currentTableIndex === 0}
                  className="p-2 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous Item"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium text-gray-700 px-3">
                  Item {currentTableIndex + 1} of {displayableItems.length}
                </span>
                <button
                  onClick={() => onNavigate('next')}
                  disabled={currentTableIndex === displayableItems.length - 1}
                  className="p-2 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next Item"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2">
              <span className="text-sm font-medium text-gray-700">Steps:</span>
              <select
                value={forwardSteps}
                onChange={(e) => setForwardSteps(parseInt(e.target.value))}
                className="text-sm bg-white border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                title="Forward Lineage Steps"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>
            </div>
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
            isLoading={isLoadingForward}
            nodeData={selectedNode.data}
          />
        )}

      </div>
    </div>
  );
};

export default DataLineageFlow;