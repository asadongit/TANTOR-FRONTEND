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
import 'reactflow/dist/style.css';
import Breadcrumb from '../../../../components/Breadcrumb';

// Circular Remote Control Component
const CircularNodeRemote = ({ nodeId, position, onNavigate, onToggleVisibility, onReset, onClose, expandedNodes, isLoading, nodeData }) => {
  const isForwardExpanded = expandedNodes.has(`${nodeId}-forward`);
  const isBackwardExpanded = expandedNodes.has(`${nodeId}-backward`);

  const getDisplayName = () => {
    if (!nodeData) return nodeId;

    switch (nodeData.type) {
      case 'schema':
        return nodeData.fullName || nodeData.description?.replace('Schema: ', '') || nodeId;
      case 'table':
        return nodeData.fullName || nodeData.description?.replace('Table: ', '') || nodeId;
      case 'view':
        return nodeData.viewName || nodeData.description?.replace('View: ', '') || nodeId;
      default:
        return nodeId;
    }
  };

  return (
    <div
      className="absolute z-20"
      // style={{
      //   left: position.x + 80,
      //   top: position.y - 40,
      //   transform: 'translate(-50%, -50%)'
      // }}
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
            disabled={isLoading}
            className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center transition-all ${isForwardExpanded ? 'bg-yellow-500 text-black' :
              isLoading ? 'bg-gray-500 text-white cursor-wait' :
                'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            title={isLoading ? "Loading..." : "Toggle Forward Connections"}
          >
            {isLoading ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <ChevronRight size={14} />
            )}
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
        {getDisplayName()}
      </div>
    </div>
  );
};

const DataLineageFlow = ({ selectedItems, currentTableIndex, onNavigate, onBack }) => {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [forwardSteps, setForwardSteps] = useState(2);
  const [forwardData, setForwardData] = useState(null);
  const [isLoadingForward, setIsLoadingForward] = useState(false);

  const fetchForwardLineage = async (nodeId, nodeType, steps = 2) => {
    setIsLoadingForward(true);
    try {
      const currentItem = displayableItems[currentTableIndex];
      if (!currentItem) return null;

      const clickedNode = nodes.find(n => n.id === nodeId);

      let connectionName = null;
      if (currentItem.type === 'Table') {
        connectionName = currentItem.database;
      }
      // else if (currentItem.type === 'View' && currentItem.viewMetadata) {
      //   // For views, extract from viewMetadata - use the first connection or handle multi-connection views
      //   const { connection_name } = currentItem.viewMetadata;
      //   if (Array.isArray(connection_name) && connection_name.length > 0) {
      //     connectionName = connection_name[0]; // Use first connection for now
      //   } else if (typeof connection_name === 'string') {
      //     connectionName = connection_name;
      //   }
      // }

      if (!connectionName && currentItem.database) {
        connectionName = currentItem.database.split(' + ')[0];
      }

      let requestData = {
        matched_policy_ids: [3],
        connection_name: connectionName,
        steps: steps,
        type: nodeType
      };

      if (nodeType === 'schema') {
        const fullTableName = clickedNode.data.fullName;
        requestData.table_schema = fullTableName;
      } else if (nodeType === 'table') {
        if (clickedNode && clickedNode.data && clickedNode.data.fullName) {
          const fullTableName = clickedNode.data.fullName;
          const tableParts = fullTableName.split('.');

          if (tableParts.length >= 2) {
            requestData.table_schema = tableParts.slice(0, -1).join('.');
            requestData.table_name = fullTableName;
          } else {
            requestData.table_schema = currentItem.schema;
            requestData.table_name = fullTableName;
          }
        } else {
          requestData.table_schema = currentItem.schema;
          requestData.table_name = `${connectionName}.${currentItem.schema}.${nodeId}`;
        }
      }

      console.log('Forward lineage request data:', requestData);

      const response = await fetch('http://localhost:8000/api/v1/data_lineage/vizualization/forward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'sessionId=abc123'
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        console.error('Failed to fetch forward lineage:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error fetching forward lineage:', error);
      return null;
    } finally {
      setIsLoadingForward(false);
    }
  };

  const displayableItems = useMemo(() => {
    return selectedItems.filter(item => item.type === 'Table' || item.type === 'View');
  }, [selectedItems]);

  const NODE_SIZE = 60;

  const generateNodesAndEdges = (item) => {
    if (item.type === 'Table') {
      return generateTableNodesAndEdges(item);
    } else if (item.type === 'View') {
      return generateViewNodesAndEdges(item);
    }
    return { nodes: [], edges: [] };
  };

  const generateTableNodesAndEdges = (tableItem) => {
    const schemaNode = {
      id: `${tableItem.schema}-schema`,
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

    const tableNode = {
      id: `${tableItem.table}-table`,
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

  const generateViewNodesAndEdges = (viewItem) => {
    if (!viewItem.viewMetadata) {
      return generateTableNodesAndEdges(viewItem);
    }

    const { table_name, table_schema } = viewItem.viewMetadata;
    const nodes = [];
    const edges = [];

    const schemaGroups = {};
    table_name.forEach((tableName, index) => {
      const schemaKey = table_schema[index] || table_schema[0];
      const schemaName = schemaKey;

      if (!schemaGroups[schemaName]) {
        schemaGroups[schemaName] = [];
      }
      schemaGroups[schemaName].push({
        name: tableName,
        fullSchema: schemaKey
      });
    });

    let schemaIndex = 0;
    const schemaPositions = {};

    Object.entries(schemaGroups).forEach(([schemaName, tables]) => {
      const schemaY = 100 + (schemaIndex * 200);
      const schemaX = 100;

      const schemaNodeId = `${schemaName}-schema-${schemaIndex}`;
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

        const tableNodeId = `${table.name}-table-${schemaIndex}-${tableIndex}`;
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

    const viewNodeId = `${viewItem.name}`;
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
      setForwardData(null);
    }
  }, [currentItem, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const getForwardLineageNodes = (sourceNodeId, apiData) => {
    const newNodes = [];
    const newEdges = [];

    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode) return { nodes: [], edges: [] };

    const baseX = sourceNode.position.x + 300;
    const baseY = sourceNode.position.y;

    if (apiData.tables && sourceNode.data.type === 'schema') {
      apiData.tables.forEach((fullTableName, index) => {
        const tableParts = fullTableName.split('.');
        const tableName = tableParts[tableParts.length - 1];

        const tableNodeId = `${sourceNodeId}-forward-table-${index}`;
        const tableNode = {
          id: tableNodeId,
          type: 'default',
          position: {
            x: baseX,
            y: baseY + ((index - Math.floor(apiData.tables.length / 2)) * 80)
          },
          data: {
            label: 'T',
            type: 'table',
            description: `Table: ${tableName}`,
            fullName: fullTableName
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

        const edge = {
          id: `${sourceNodeId}-${tableNodeId}`,
          source: sourceNodeId,
          target: tableNodeId,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: {
            stroke: '#10B981',
            strokeWidth: 2,
            strokeDasharray: '5,5'
          }
        };
        newEdges.push(edge);
      });
    }

    if (Array.isArray(apiData) && sourceNode.data.type === 'table') {
      apiData.forEach((viewName, index) => {
        const viewNodeId = `${sourceNodeId}-forward-view-${index}`;
        const viewNode = {
          id: viewNodeId,
          type: 'default',
          position: {
            x: baseX,
            y: baseY + ((index - Math.floor(apiData.length / 2)) * 100)
          },
          data: {
            label: 'V',
            type: 'view',
            description: `View: ${viewName}`,
            viewName: viewName
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

        const edge = {
          id: `${sourceNodeId}-${viewNodeId}`,
          source: sourceNodeId,
          target: viewNodeId,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: {
            stroke: '#10B981',
            strokeWidth: 2,
            strokeDasharray: '5,5'
          }
        };
        newEdges.push(edge);
      });
    }

    if (apiData.views && apiData.views.length > 0) {
      const viewsBaseX = baseX + 300;

      apiData.views.forEach((view, viewIndex) => {
        const viewNodeId = `${sourceNodeId}-forward-view-${viewIndex}`;
        const viewNode = {
          id: viewNodeId,
          type: 'default',
          position: {
            x: viewsBaseX,
            y: baseY + ((viewIndex - Math.floor(apiData.views.length / 2)) * 100)
          },
          data: {
            label: 'V',
            type: 'view',
            description: `View: ${view.view_name}`,
            viewName: view.view_name
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

        view.tables.forEach((viewTable, tableIndex) => {
          const matchingTableNode = newNodes.find(n =>
            n.data.type === 'table' &&
            n.data.fullName &&
            n.data.fullName.toLowerCase().includes(viewTable.toLowerCase().split('.').pop())
          ) || nodes.find(n =>
            n.data.type === 'table' &&
            n.data.description.toLowerCase().includes(viewTable.toLowerCase().split('.').pop())
          );

          if (matchingTableNode) {
            const viewEdge = {
              id: `${matchingTableNode.id}-${viewNodeId}`,
              source: matchingTableNode.id,
              target: viewNodeId,
              markerEnd: { type: MarkerType.ArrowClosed },
              style: {
                stroke: '#10B981',
                strokeWidth: 2,
                strokeDasharray: '5,5'
              }
            };
            newEdges.push(viewEdge);
          }
        });
      });
    }

    return { nodes: newNodes, edges: newEdges };
  };

  const getDummyAdditionalNodes = (nodeId, direction) => {
    if (direction === 'forward' && forwardData) {
      return getForwardLineageNodes(nodeId, forwardData);
    }

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

    const mockData = {
      [`${nodeId}-backward`]: {
        nodes: [{
          id: `${nodeId}-upstream-1`,
          position: { x: 50, y: 150 },
          data: {
            label: 'S',
            type: 'source',
            description: 'Raw Data Source',
            fullName: 'Raw Data Source'
          },
          style: { ...nodeStyles.source, width: NODE_SIZE, height: NODE_SIZE, fontSize: '24px' }
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

  const handleNavigate = async (nodeId, direction) => {
    const key = `${nodeId}-${direction}`;
    const isCurrentlyExpanded = expandedNodes.has(key);

    const clickedNode = nodes.find(n => n.id === nodeId);

    if (direction === 'forward' && clickedNode?.data?.type === 'view') {
      console.log('Forward lineage not available for view nodes');
      return;
    }

    if (isCurrentlyExpanded) {
      setNodes(currentNodes =>
        currentNodes.filter(node => !node.id.includes(`${nodeId}-${direction === 'forward' ? 'forward' : 'upstream'}`))
      );
      setEdges(currentEdges =>
        currentEdges.filter(edge => !edge.id.includes(`${nodeId}-${direction === 'forward' ? 'forward' : 'upstream'}`))
      );
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });

      if (direction === 'forward') {
        setForwardData(null);
      }
    } else {
      if (direction === 'forward') {
        if (!clickedNode) return;
        const nodeType = clickedNode.data?.type || 'schema';

        if (nodeType === 'schema' || nodeType === 'table') {
          const apiData = await fetchForwardLineage(nodeId, nodeType, forwardSteps);
          if (apiData) {
            setForwardData(apiData);
            const additionalData = getForwardLineageNodes(nodeId, apiData);

            if (additionalData.nodes.length > 0) {
              setNodes(currentNodes => [...currentNodes, ...additionalData.nodes]);
              setEdges(currentEdges => [...currentEdges, ...additionalData.edges]);
              setExpandedNodes(prev => new Set(prev).add(key));
            }
          }
        }
      } else {
        const additionalData = getDummyAdditionalNodes(nodeId, direction);
        if (additionalData.nodes.length > 0) {
          setNodes(currentNodes => [...currentNodes, ...additionalData.nodes]);
          setEdges(currentEdges => [...currentEdges, ...additionalData.edges]);
          setExpandedNodes(prev => new Set(prev).add(key));
        }
      }
    }
  };

  const handleToggleVisibility = (nodeId) => {
  };

  const handleReset = () => {
    if (currentItem) {
      const { nodes: resetNodes, edges: resetEdges } = generateNodesAndEdges(currentItem);
      setNodes(resetNodes);
      setEdges(resetEdges);
      setExpandedNodes(new Set());
      setForwardData(null);
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
        <Breadcrumb />
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
              {/* ({currentItem?.type}) */}
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