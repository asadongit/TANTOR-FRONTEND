
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, Search, PlusCircle, XCircle, ChevronLeft, ChevronRight, Table, Minimize2, Maximize2, Layers, Share2, Network, Info, X } from 'lucide-react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  ReactFlowProvider,
} from 'reactflow';
import AssetInformationModal from "./AssetInformationModal"
import ViewMappingPage from "./ViewMappingPage";
import Breadcrumb from '../../../../components/Breadcrumb';
import TableMappingPage from './TableMappingPage';
import DownloadHelper from './DownloadHelper';

const CircularNodeRemote = ({
  nodeId,
  position,
  onNavigate,
  onToggleVisibility,
  onReset,
  onClose,
  expandedNodes,
  backwardExpandedNodes,
  allConnectionsExpandedNodes,
  isLoading,
  isLoadingBackward,
  isLoadingAllConnections,
  nodeData,
  onColumnDetails
}) => {
  const [showAssetInfo, setShowAssetInfo] = useState(false);

  const isForwardExpanded = expandedNodes.has(nodeId);
  const isBackwardExpanded = backwardExpandedNodes.has(nodeId);
  const isAllConnectionsExpanded = allConnectionsExpandedNodes.has(nodeId);

  const isAssetInfoDisabled = nodeData.type === 'view';
  const isColumnLevelDisabled = nodeData.type === 'schema';

  const getInitial = () => {
    switch (nodeData.type) {
      case 'schema':
        return 'S';
      case 'table':
        return 'T';
      case 'view':
        return 'V';
      default:
        return '?';
    }
  };

  const getCenterColor = () => {
    switch (nodeData.type) {
      case 'schema':
        return 'bg-blue-500';
      case 'table':
        return 'bg-red-500';
      case 'view':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleAssetInfo = () => {
    setShowAssetInfo(true);
  };

  const handleCloseAssetInfo = () => {
    setShowAssetInfo(false);
  };

  const handleColumnDetails = () => {
    onColumnDetails(nodeId, nodeData.type);
  };

  const handleAllConnections = () => {
    onNavigate(nodeId, 'allConnections');
  };


  return (
    <>
      <div
        className="absolute z-20"
        style={{
          left: '70px',
          bottom: '120px',
        }}
      >
        <div className="relative">
          <div className="w-28 h-28 bg-gray-800 rounded-full border-4 border-gray-600 shadow-2xl relative">
            <div className={`w-12 h-12 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center ${getCenterColor()}`}>
              <span className="text-white text-xl font-bold">{getInitial()}</span>
            </div>

            <button
              onClick={handleAssetInfo}
              disabled={isAssetInfoDisabled}
              className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center transition-all ${isAssetInfoDisabled
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              title={
                isAssetInfoDisabled
                  ? "Asset information not available"
                  : "Asset Information"
              }
            >
              <Info size={16} />
            </button>

            <button
              onClick={() => onNavigate(nodeId, 'forward')}
              disabled={isLoading || (nodeData.type !== 'schema' && nodeData.type !== 'table')}
              className={`absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center transition-all ${nodeData.type !== 'schema' && nodeData.type !== 'table' ? 'bg-gray-400 cursor-not-allowed' :
                isForwardExpanded ? 'bg-yellow-500 text-black' :
                  isLoading ? 'bg-gray-500 text-white cursor-wait' :
                    'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              title={
                nodeData.type !== 'schema' && nodeData.type !== 'table' ? "Forward not available" :
                  isLoading ? "Loading..." :
                    isForwardExpanded ? "Close Forward Connections" : "Show Forward Connections"
              }
            >
              {isLoading ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <ChevronRight size={16} />
              )}
            </button>

            <button
              onClick={handleAllConnections}
              disabled={isLoadingAllConnections || (nodeData.type !== 'schema' && nodeData.type !== 'table')}
              className={`absolute bottom-0 right-2 transform translate-x-1/4 translate-y-1/4 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center transition-all ${nodeData.type !== 'schema' && nodeData.type !== 'table' ? 'bg-gray-400 cursor-not-allowed' :
                isAllConnectionsExpanded ? 'bg-yellow-500 text-black' :
                  isLoadingAllConnections ? 'bg-gray-500 text-white cursor-wait' :
                    'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              title={
                nodeData.type !== 'schema' && nodeData.type !== 'table' ? "All connections not available" :
                  isLoadingAllConnections ? "Loading..." :
                    isAllConnectionsExpanded ? "Close All Connections" : "Show All Asset Connections"
              }
            >
              {isLoadingAllConnections ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Share2 size={16} />
              )}
            </button>

            <button
              onClick={handleColumnDetails}
              disabled={isColumnLevelDisabled}
              className={`absolute bottom-0 left-2 transform -translate-x-1/4 translate-y-1/4 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center transition-all ${isColumnLevelDisabled
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              title={
                isColumnLevelDisabled
                  ? "Column Level Details not available"
                  : "Column Level Details"
              }
            >
              <Network size={16} />
            </button>

            <button
              onClick={() => onNavigate(nodeId, 'backward')}
              disabled={isLoadingBackward || (nodeData.type !== 'view' && nodeData.type !== 'table')}
              className={`absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center transition-all ${(nodeData.type !== 'view' && nodeData.type !== 'table') ? 'bg-gray-400 cursor-not-allowed' :
                isBackwardExpanded ? 'bg-yellow-500 text-black' :
                  isLoadingBackward ? 'bg-gray-500 text-white cursor-wait' :
                    'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              title={
                (nodeData.type !== 'view' && nodeData.type !== 'table') ? "Backward not available" :
                  isLoadingBackward ? "Loading..." :
                    isBackwardExpanded ? "Close Backward Connections" : "Show Backward Connections"
              }
            >
              {isLoadingBackward ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <ChevronLeft size={16} />
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full text-white flex items-center justify-center text-xs shadow-lg"
          >
            <XCircle size={14} />
          </button>
        </div>

        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {nodeId}
        </div>
      </div>

      <AssetInformationModal
        nodeData={{ ...nodeData, fullName: nodeId }}
        isOpen={showAssetInfo}
        onClose={handleCloseAssetInfo}
      />
    </>
  );
};

const API_BASE_URL = `${window._env_?.VITE_FAST_API}/data_lineage`;

const DataLineageFlow = ({ selectedItems, currentTableIndex, onNavigate, onBack, policyIds }) => {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [backwardExpandedNodes, setBackwardExpandedNodes] = useState(new Set());
  const [allConnectionsExpandedNodes, setAllConnectionsExpandedNodes] = useState(new Set());
  const [steps, setSteps] = useState(2);
  const [forwardData, setForwardData] = useState(new Map());
  const [backwardData, setBackwardData] = useState(new Map());
  const [allConnectionsData, setAllConnectionsData] = useState(new Map());
  const [isLoadingForward, setIsLoadingForward] = useState(false);
  const [isLoadingBackward, setIsLoadingBackward] = useState(false);
  const [isLoadingAllConnections, setIsLoadingAllConnections] = useState(false);
  const [nodeConnectionMap, setNodeConnectionMap] = useState(new Map());
  const [initialNodeIds, setInitialNodeIds] = useState(new Set());
  const [showViewMapping, setShowViewMapping] = useState(false);
  const [selectedViewForMapping, setSelectedViewForMapping] = useState(null);
  const [showTableMapping, setShowTableMapping] = useState(false);
  const [selectedTableForMapping, setSelectedTableForMapping] = useState(null);

  // 3. Add this function to handle column details
  const handleColumnDetails = (nodeId, nodeType) => {
    if (nodeType === 'view') {
      setSelectedViewForMapping(nodeId);
      setShowViewMapping(true);
    }
    else if (nodeType === 'table') {
      setSelectedTableForMapping(nodeId);
      setShowTableMapping(true);
    }
    else {
      console.log('Column details clicked for:', nodeId, nodeType);
    }
  };

  // 4. Add this function to go back to main lineage
  const handleBackToLineage = () => {
    setShowViewMapping(false);
    setSelectedViewForMapping(null);
  };

  const handleTableBackToLineage = () => {
    setShowTableMapping(false);
    setSelectedTableForMapping(null);
  };

  const NODE_SIZE = 50;

  const stepOptions = Array.from({ length: 5 }, (_, i) => i + 1);

  const findExistingNode = (nodes, nodeId) => {
    return nodes.find(n => n.id.toLowerCase() === nodeId.toLowerCase());
  };

  const edgeExists = (edges, sourceId, targetId) => {
    const proposedEdgeId = `${sourceId}-${targetId}`.toLowerCase();
    return edges.some(edge => edge.id && edge.id.toLowerCase() === proposedEdgeId);
  };

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

  const cleanUpIdleNodes = (currentNodes, currentEdges, sourceNodeId, initialNodes = new Set()) => {
    const nodesToCheck = new Set();

    currentNodes.forEach(node => {
      const connectedEdges = currentEdges.filter(edge =>
        edge.source === node.id || edge.target === node.id
      );

      if (connectedEdges.length === 0 && !initialNodes.has(node.id)) {
        nodesToCheck.add(node.id);
      }
    });
    const sourceNodeConnections = currentEdges.filter(edge =>
      edge.source === sourceNodeId || edge.target === sourceNodeId
    );
    if (sourceNodeConnections.length === 0 && !initialNodes.has(sourceNodeId)) {
      nodesToCheck.add(sourceNodeId);
    }

    const cleanedNodes = currentNodes.filter(node => !nodesToCheck.has(node.id));
    return {
      cleanedNodes,
      removedNodes: Array.from(nodesToCheck)
    };
  };

  const removeForwardNodesWithCleaning = (sourceNodeId, currentNodes, currentEdges) => {
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
    let filteredNodes = currentNodes.filter(node =>
      !nodesToRemove.includes(node.id)
    );

    // Apply cleaning to remove idle nodes, including the source node if it becomes idle
    const { cleanedNodes } = cleanUpIdleNodes(filteredNodes, filteredEdges, sourceNodeId, initialNodeIds);

    return { filteredNodes: cleanedNodes, filteredEdges };
  };

  const removeBackwardNodesWithCleaning = (sourceNodeId, currentNodes, currentEdges) => {
    const sourceEdges = currentEdges.filter(edge =>
      edge.data?.sourceNode === sourceNodeId && edge.data?.isBackwardEdge
    );

    const sourceNodeIds = sourceEdges.map(edge => edge.source);
    const filteredEdges = currentEdges.filter(edge =>
      !(edge.data?.sourceNode === sourceNodeId && edge.data?.isBackwardEdge)
    );

    const nodesToRemove = [];
    sourceNodeIds.forEach(nodeId => {
      const remainingConnections = filteredEdges.filter(edge =>
        edge.target === nodeId || edge.source === nodeId
      );

      if (remainingConnections.length === 0) {
        nodesToRemove.push(nodeId);
      }
    });

    let filteredNodes = currentNodes.filter(node =>
      !nodesToRemove.includes(node.id)
    );

    const { cleanedNodes } = cleanUpIdleNodes(filteredNodes, filteredEdges, sourceNodeId, initialNodeIds);

    return { filteredNodes: cleanedNodes, filteredEdges };
  };

  const removeAllConnectionsNodesWithCleaning = (sourceNodeId, currentNodes, currentEdges) => {
    const sourceEdges = currentEdges.filter(edge =>
      edge.data?.sourceNode === sourceNodeId && edge.data?.isAllConnectionsEdge
    );

    const targetNodeIds = sourceEdges.map(edge => edge.target);
    const filteredEdges = currentEdges.filter(edge =>
      !(edge.data?.sourceNode === sourceNodeId && edge.data?.isAllConnectionsEdge)
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

    let filteredNodes = currentNodes.filter(node =>
      !nodesToRemove.includes(node.id)
    );

    const { cleanedNodes } = cleanUpIdleNodes(filteredNodes, filteredEdges, sourceNodeId, initialNodeIds);

    return { filteredNodes: cleanedNodes, filteredEdges };
  };

  const fetchForwardLineage = async (nodeId, nodeType, stepCount) => {
    const connectionInfo = getConnectionInfo(nodeId, nodeType);
    if (!connectionInfo) return null;

    const payload = {
      matched_policy_ids: policyIds,
      connection_name: connectionInfo.database,
      table_schema: connectionInfo.schema,
      steps: stepCount,
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

  const fetchBackwardLineage = async (nodeId, nodeType, stepCount) => {
    const payload = {
      matched_policy_ids: policyIds,
      steps: stepCount,
      type: nodeType
    };

    if (nodeType === 'view') {
      payload.view_name = nodeId;
    } else if (nodeType === 'table') {
      payload.table_name = nodeId;
    } else {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/vizualization/backward`, {
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
      console.error('Error fetching backward lineage:', error);
      return null;
    }
  };

  const calculateNodePositions = (existingNodes, newNodeType, count, direction = 'forward') => {
    const positions = [];
    let baseX, startY, spacing;

    if (direction === 'backward') {
      if (newNodeType === 'schema') {
        baseX = 150;
        startY = 100;
        spacing = 100;
      } else if (newNodeType === 'table') {
        baseX = 450;
        startY = 100;
        spacing = 100;
      } else {
        baseX = 0;
        startY = 100;
        spacing = 120;
      }
    } else {
      baseX = newNodeType === 'table' ? 800 : 1100;
      startY = 100;
      spacing = 120;
    }

    for (let i = 0; i < count; i++) {
      positions.push({
        x: baseX,
        y: startY + (i * spacing)
      });
    }

    return positions;
  };

  // Helper function to ensure schema-table connections exist
  const ensureSchemaTableConnections = (nodes, edges, sourceNodeId, sourceNodeType) => {
    const newEdges = [...edges];

    nodes.forEach(node => {
      if (node.data?.type === 'table') {
        const tableFullName = node.id;
        const tableSchema = tableFullName.split('.').slice(0, -1).join('.');

        // Find the matching schema node
        const matchingSchemaNode = nodes.find(schemaNode =>
          schemaNode.data?.type === 'schema' &&
          schemaNode.id.toLowerCase() === tableSchema.toLowerCase()
        );

        if (matchingSchemaNode) {
          const schemaToTableEdgeId = `${matchingSchemaNode.id}-${tableFullName}`;

          // Check if the edge already exists
          const edgeAlreadyExists = newEdges.some(edge =>
            edge.id && edge.id.toLowerCase() === schemaToTableEdgeId.toLowerCase()
          );

          if (!edgeAlreadyExists) {
            const schemaToTableEdge = {
              id: schemaToTableEdgeId,
              source: matchingSchemaNode.id,
              target: tableFullName,
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { stroke: '#6B7280', strokeWidth: 2 },
              data: {
                isBackwardEdge: sourceNodeType === 'backward',
                isForwardEdge: sourceNodeType === 'forward',
                isAllConnectionsEdge: sourceNodeType === 'allConnections',
                sourceNode: sourceNodeId
              }
            };
            newEdges.push(schemaToTableEdge);
          }
        }
      }
    });

    return newEdges;
  };

  const getDisplayName = (fullName, type) => {
    if (!fullName) return '';
    if (type === 'schema') {
      return fullName.split('.').pop();
    } else if (type === 'table') {
      return fullName.split('.').pop();
    } else if (type === 'view') {
      return fullName.includes('.') ? fullName.split('.').pop() : fullName;
    }
    return fullName;
  };

  const createForwardNodes = (nodeId, nodeType, forwardResponse, existingNodes) => {
    const newNodes = [];
    const newEdges = [];

    if (nodeType === 'schema' && forwardResponse.tables) {
      const tablePositions = calculateNodePositions(existingNodes, 'table', forwardResponse.tables.length);

      forwardResponse.tables.forEach((tableFullName, index) => {
        // Skip if table already exists (case-insensitive check)
        const existingTableNode = findExistingNode(existingNodes, tableFullName);
        if (existingTableNode) {
          // Table exists, just create edge if it doesn't exist
          const edgeId = `${nodeId}-${existingTableNode.id}`;
          if (!edgeExists(existingNodes.filter(item => item.source && item.target), nodeId, existingTableNode.id)) {
            const edge = {
              id: edgeId,
              source: nodeId,
              target: existingTableNode.id,
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { stroke: '#6B7280', strokeWidth: 2 },
              data: { isForwardEdge: true, sourceNode: nodeId }
            };
            newEdges.push(edge);
          }
          return;
        }

        const tableName = tableFullName.split('.').pop();
        const displayName = getDisplayName(tableFullName, 'table');

        const tableNode = {
          id: tableFullName,
          type: 'default',
          position: tablePositions[index],
          targetPosition: 'left',
          sourcePosition: 'right',
          data: {
            label: (
              <div style={{ position: 'relative' }}>
                <div>T</div>
                <div style={{
                  position: 'absolute',
                  top: '60px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '11px',
                  color: '#6B7280',
                  textAlign: 'center',
                  maxWidth: '120px',
                  whiteSpace: 'break-word',
                  lineHeight: '1.2',
                  pointerEvents: 'none',
                }} title={tableFullName}>
                  {displayName}
                </div>
              </div>
            ),
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

      if (forwardResponse.views && steps >= 2) {
        const viewPositions = calculateNodePositions(existingNodes, 'view', forwardResponse.views.length);

        forwardResponse.views.forEach((viewData, index) => {
          const viewName = viewData.view_name;
          const displayName = getDisplayName(viewName, 'view');

          const existingViewNode = findExistingNode([...existingNodes, ...newNodes], viewName);

          if (existingViewNode) {
            viewData.tables.forEach(tableName => {
              let matchingTableNode = [...existingNodes, ...newNodes].find(node =>
                node.data?.type === 'table' &&
                node.id.toLowerCase() === tableName.toLowerCase()
              );

              if (matchingTableNode) {
                const edgeId = `${matchingTableNode.id}-${viewName}`;

                const existingEdges = [...existingNodes.filter(item => item.source && item.target), ...newEdges];
                if (!edgeExists(existingEdges, matchingTableNode.id, viewName)) {
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
              }
            });
            return;
          }

          const viewNode = {
            id: viewName,
            type: 'default',
            position: viewPositions[index],
            sourcePosition: 'right',
            targetPosition: 'left',
            data: {
              label: (
                <div style={{ position: 'relative' }}>
                  <div>V</div>
                  <div style={{
                    position: 'absolute',
                    top: '60px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '11px',
                    color: '#6B7280',
                    textAlign: 'center',
                    maxWidth: '120px',
                    whiteSpace: 'break-word',
                    lineHeight: '1.2',
                    pointerEvents: 'none'
                  }} title={viewName}>
                    {displayName}
                  </div>
                </div>
              ),
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

          viewData.tables.forEach(tableName => {
            let matchingTableNode = [...existingNodes, ...newNodes].find(node =>
              node.data?.type === 'table' &&
              node.id.toLowerCase() === tableName.toLowerCase()
            );

            if (matchingTableNode) {
              const edgeId = `${matchingTableNode.id}-${viewName}`;

              if (!edgeExists([...newEdges], matchingTableNode.id, viewName)) {
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
        const existingViewNode = findExistingNode(existingNodes, viewName);
        const displayName = getDisplayName(viewName, 'view');

        if (existingViewNode) {
          // View exists, just create edge if it doesn't exist
          if (!edgeExists(existingNodes.filter(item => item.source && item.target), nodeId, existingViewNode.id)) {
            const edge = {
              id: `${nodeId}-${existingViewNode.id}`,
              source: nodeId,
              target: existingViewNode.id,
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
          sourcePosition: 'right',
          targetPosition: 'left',
          data: {
            label: (
              <div style={{ position: 'relative' }}>
                <div>V</div>
                <div style={{
                  position: 'absolute',
                  top: '60px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '11px',
                  color: '#6B7280',
                  textAlign: 'center',
                  maxWidth: '120px',
                  whiteSpace: 'break-word',
                  lineHeight: '1.2',
                  pointerEvents: 'none'
                }} title={viewName}>
                  {displayName}
                </div>
              </div>
            ),
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
  const createBackwardNodes = (nodeId, nodeType, backwardResponse, existingNodes) => {
    const newNodes = [];
    const newEdges = [];

    if (nodeType === 'view' && backwardResponse.tables) {
      if (backwardResponse.schema && steps >= 2) {
        const schemaPositions = calculateNodePositions(existingNodes, 'schema', backwardResponse.schema.length, 'backward');

        backwardResponse.schema.forEach((schemaFullName, index) => {
          const existingSchemaNode = findExistingNode(existingNodes, schemaFullName);
          if (existingSchemaNode) {
            return;
          }

          const schemaName = schemaFullName.split('.').pop();
          const schemaNode = {
            id: schemaFullName,
            type: 'default',
            position: schemaPositions[index],
            sourcePosition: 'right',
            targetPosition: 'left',
            data: {
              label: (
                <div style={{ position: 'relative' }}>
                  <div>S</div>
                  <div style={{
                    position: 'absolute',
                    top: '60px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '11px',
                    color: '#6B7280',
                    textAlign: 'center',
                    maxWidth: '120px',
                    wordWrap: 'break-word',
                    lineHeight: '1.2',
                    pointerEvents: 'none'
                  }} title={schemaFullName}>
                    {schemaName}
                  </div>
                </div>
              ),
              type: 'schema',
              description: `Schema: ${schemaName}`,
              fullName: schemaFullName,
              isBackwardNode: true,
              sourceNode: nodeId
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

          newNodes.push(schemaNode);
        });
      }

      const tablePositions = calculateNodePositions(existingNodes, 'table', backwardResponse.tables.length, 'backward');

      backwardResponse.tables.forEach((tableFullName, index) => {
        const existingTableNode = findExistingNode(existingNodes, tableFullName);

        if (existingTableNode) {
          const edgeId = `${existingTableNode.id}-${nodeId}`;
          if (!edgeExists([...existingNodes.filter(item => item.source && item.target), ...newEdges], existingTableNode.id, nodeId)) {
            const edge = {
              id: edgeId,
              source: existingTableNode.id,
              target: nodeId,
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { stroke: '#10B981', strokeWidth: 2 },
              data: { isBackwardEdge: true, sourceNode: nodeId }
            };
            newEdges.push(edge);
          }

          // Ensure schema-table connection exists for existing table
          if (backwardResponse.schema && steps >= 2) {
            const tableSchema = tableFullName.split('.').slice(0, -1).join('.');
            const matchingSchemaNode = [...existingNodes, ...newNodes].find(node =>
              node.data?.type === 'schema' &&
              node.id.toLowerCase() === tableSchema.toLowerCase()
            );

            if (matchingSchemaNode) {
              const schemaToTableEdgeId = `${matchingSchemaNode.id}-${tableFullName}`;

              if (!edgeExists([...existingNodes.filter(item => item.source && item.target), ...newEdges], matchingSchemaNode.id, tableFullName)) {
                const schemaToTableEdge = {
                  id: schemaToTableEdgeId,
                  source: matchingSchemaNode.id,
                  target: tableFullName,
                  markerEnd: { type: MarkerType.ArrowClosed },
                  style: { stroke: '#6B7280', strokeWidth: 2 },
                  data: { isBackwardEdge: true, sourceNode: nodeId }
                };
                newEdges.push(schemaToTableEdge);
              }
            }
          }
          return;
        }

        const tableName = tableFullName.split('.').pop();
        const tableNode = {
          id: tableFullName,
          type: 'default',
          position: tablePositions[index],
          sourcePosition: 'right',
          targetPosition: 'left',
          data: {
            label: (
              <div style={{ position: 'relative' }}>
                <div>T</div>
                <div style={{
                  position: 'absolute',
                  top: '60px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '11px',
                  color: '#6B7280',
                  textAlign: 'center',
                  maxWidth: '120px',
                  wordWrap: 'break-word',
                  lineHeight: '1.2',
                  pointerEvents: 'none'
                }} title={tableFullName}>
                  {tableName}
                </div>
              </div>
            ),
            type: 'table',
            description: `Table: ${tableName}`,
            fullName: tableFullName,
            isBackwardNode: true,
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

        // Create edge from table to view
        const edge = {
          id: `${tableFullName}-${nodeId}`,
          source: tableFullName,
          target: nodeId,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#10B981', strokeWidth: 2 },
          data: { isBackwardEdge: true, sourceNode: nodeId }
        };
        newEdges.push(edge);

        if (backwardResponse.schema && steps >= 2) {
          const tableSchema = tableFullName.split('.').slice(0, -1).join('.');
          const matchingSchemaNode = [...existingNodes, ...newNodes].find(node =>
            node.data?.type === 'schema' &&
            node.id.toLowerCase() === tableSchema.toLowerCase()
          );

          if (matchingSchemaNode) {
            const schemaToTableEdgeId = `${matchingSchemaNode.id}-${tableFullName}`;

            if (!edgeExists(newEdges, matchingSchemaNode.id, tableFullName)) {
              const schemaToTableEdge = {
                id: schemaToTableEdgeId,
                source: matchingSchemaNode.id,
                target: tableFullName,
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { stroke: '#6B7280', strokeWidth: 2 },
                data: { isBackwardEdge: true, sourceNode: nodeId }
              };
              newEdges.push(schemaToTableEdge);
            }
          }
        }
      });
    } else if (nodeType === 'table' && Array.isArray(backwardResponse)) {
      const schemaPositions = calculateNodePositions(existingNodes, 'schema', backwardResponse.length, 'backward');

      backwardResponse.forEach((schemaFullName, index) => {
        const existingSchemaNode = findExistingNode(existingNodes, schemaFullName);

        if (existingSchemaNode) {
          // Schema exists, just create edge if it doesn't exist
          const edgeId = `${existingSchemaNode.id}-${nodeId}`;
          if (!edgeExists([...existingNodes.filter(item => item.source && item.target), ...newEdges], existingSchemaNode.id, nodeId)) {
            const edge = {
              id: edgeId,
              source: existingSchemaNode.id,
              target: nodeId,
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { stroke: '#6B7280', strokeWidth: 2 },
              data: { isBackwardEdge: true, sourceNode: nodeId }
            };
            newEdges.push(edge);
          }
          return;
        }

        const schemaName = schemaFullName.split('.').pop();
        const schemaNode = {
          id: schemaFullName,
          type: 'default',
          position: schemaPositions[index],
          sourcePosition: 'right',
          targetPosition: 'left',
          data: {
            label: (
              <div style={{ position: 'relative' }}>
                <div>S</div>
                <div style={{
                  position: 'absolute',
                  top: '60px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '11px',
                  color: '#6B7280',
                  textAlign: 'center',
                  maxWidth: '120px',
                  wordWrap: 'break-word',
                  lineHeight: '1.2',
                  pointerEvents: 'none'
                }} title={schemaFullName}>
                  {schemaName}
                </div>
              </div>
            ),
            type: 'schema',
            description: `Schema: ${schemaName}`,
            fullName: schemaFullName,
            isBackwardNode: true,
            sourceNode: nodeId
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

        newNodes.push(schemaNode);

        // Create edge from schema to table
        const edge = {
          id: `${schemaFullName}-${nodeId}`,
          source: schemaFullName,
          target: nodeId,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#6B7280', strokeWidth: 2 },
          data: { isBackwardEdge: true, sourceNode: nodeId }
        };
        newEdges.push(edge);
      });
    }

    return { newNodes, newEdges };
  };

  const createAllConnectionsNodes = (nodeId, nodeType, response, existingNodes) => {
    const newNodes = [];
    const newEdges = [];

    if (nodeType === 'schema' && response.tables) {
      const tablePositions = calculateNodePositions(existingNodes, 'table', response.tables.length);

      response.tables.forEach((tableFullName, index) => {
        // Skip if table already exists
        const existingTableNode = findExistingNode(existingNodes, tableFullName);
        if (existingTableNode) {
          // Table exists, just create edge if it doesn't exist
          const edgeId = `${nodeId}-${existingTableNode.id}`;
          if (!edgeExists(existingNodes.filter(item => item.source && item.target), nodeId, existingTableNode.id)) {
            const edge = {
              id: edgeId,
              source: nodeId,
              target: existingTableNode.id,
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { stroke: '#6B7280', strokeWidth: 2 },
              data: { isAllConnectionsEdge: true, sourceNode: nodeId }
            };
            newEdges.push(edge);
          }
          return;
        }

        const tableName = tableFullName.split('.').pop();
        const tableNode = {
          id: tableFullName,
          type: 'default',
          position: tablePositions[index],
          sourcePosition: 'right',
          targetPosition: 'left',
          data: {
            label: (
              <div style={{ position: 'relative' }}>
                <div>T</div>
                <div style={{
                  position: 'absolute',
                  top: '60px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '11px',
                  color: '#6B7280',
                  textAlign: 'center',
                  maxWidth: '120px',
                  wordWrap: 'break-word',
                  lineHeight: '1.2',
                  pointerEvents: 'none'
                }} title={tableFullName}>
                  {tableName}
                </div>
              </div>
            ),
            type: 'table',
            description: `Table: ${tableName}`,
            fullName: tableFullName,
            isAllConnectionsNode: true,
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

        const edge = {
          id: `${nodeId}-${tableFullName}`,
          source: nodeId,
          target: tableFullName,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#6B7280', strokeWidth: 2 },
          data: { isAllConnectionsEdge: true, sourceNode: nodeId }
        };
        newEdges.push(edge);
      });
    } else if (nodeType === 'table' && Array.isArray(response)) {
      const viewPositions = calculateNodePositions(existingNodes, 'view', response.length);

      response.forEach((viewName, index) => {
        const existingViewNode = findExistingNode(existingNodes, viewName);

        if (existingViewNode) {
          // View exists, just create edge if it doesn't exist
          if (!edgeExists(existingNodes.filter(item => item.source && item.target), nodeId, existingViewNode.id)) {
            const edge = {
              id: `${nodeId}-${existingViewNode.id}`,
              source: nodeId,
              target: existingViewNode.id,
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { stroke: '#10B981', strokeWidth: 2 },
              data: { isAllConnectionsEdge: true, sourceNode: nodeId }
            };
            newEdges.push(edge);
          }
          return;
        }

        const viewNode = {
          id: viewName,
          type: 'default',
          position: viewPositions[index],
          sourcePosition: 'right',
          targetPosition: 'left',
          data: {
            label: (
              <div style={{ position: 'relative' }}>
                <div>V</div>
                <div style={{
                  position: 'absolute',
                  top: '60px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '11px',
                  color: '#6B7280',
                  textAlign: 'center',
                  maxWidth: '120px',
                  wordWrap: 'break-word',
                  lineHeight: '1.2',
                  pointerEvents: 'none'
                }} title={viewName}>
                  {viewName}
                </div>
              </div>
            ),
            type: 'view',
            description: `View: ${viewName}`,
            fullName: viewName,
            isAllConnectionsNode: true,
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
          data: { isAllConnectionsEdge: true, sourceNode: nodeId }
        };
        newEdges.push(edge);
      });
    }

    return { newNodes, newEdges };
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
    const schemaDisplayName = getDisplayName(tableItem.schema, 'schema');

    const schemaNode = {
      id: schemaNodeId,
      type: 'default',
      position: { x: 200, y: 200 },
      sourcePosition: 'right',
      targetPosition: 'left',
      data: {
        label: (
          <div style={{ position: 'relative' }}>
            <div>S</div>
            <div style={{
              position: 'absolute',
              top: '60px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '11px',
              color: '#6B7280',
              textAlign: 'center',
              maxWidth: '120px',
              whiteSpace: 'break-word',
              lineHeight: '1.2',
              pointerEvents: 'none'
            }} title={tableItem.schema}>
              {schemaDisplayName}
            </div>
          </div>
        ),
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
    const tableDisplayName = getDisplayName(tableItem.table, 'table');

    const tableNode = {
      id: tableNodeId,
      type: 'default',
      position: { x: 500, y: 200 },
      sourcePosition: 'right',
      targetPosition: 'left',
      data: {
        label: (
          <div style={{ position: 'relative' }}>
            <div>T</div>
            <div style={{
              position: 'absolute',
              top: '60px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '11px',
              color: '#6B7280',
              textAlign: 'center',
              maxWidth: '120px',
              whiteSpace: 'break-word',
              lineHeight: '1.2',
              pointerEvents: 'none'
            }} title={tableItem.table}>
              {tableDisplayName}
            </div>
          </div>
        ),
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
      const schemaDisplayName = getDisplayName(schemaName, 'schema');
      schemaPositions[schemaName] = { x: schemaX, y: schemaY };

      const schemaNode = {
        id: schemaNodeId,
        type: 'default',
        position: { x: schemaX, y: schemaY },
        sourcePosition: 'right',
        targetPosition: 'left',
        data: {
          label: (
            <div style={{ position: 'relative' }}>
              <div>S</div>
              <div style={{
                position: 'absolute',
                top: '60px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '11px',
                color: '#6B7280',
                textAlign: 'center',
                maxWidth: '120px',
                whiteSpace: 'break-word',
                lineHeight: '1.2',
                pointerEvents: 'none'
              }} title={schemaName}>
                {schemaDisplayName}
              </div>
            </div>
          ),
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
        const tableDisplayName = getDisplayName(table.name, 'table');

        const tableNodeId = table.name;
        const tableNode = {
          id: tableNodeId,
          type: 'default',
          position: { x: tableX, y: tableY },
          sourcePosition: 'right',
          targetPosition: 'left',
          data: {
            label: (
              <div style={{ position: 'relative' }}>
                <div>T</div>
                <div style={{
                  position: 'absolute',
                  top: '60px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '11px',
                  color: '#6B7280',
                  textAlign: 'center',
                  maxWidth: '120px',
                  whiteSpace: 'break-word',
                  lineHeight: '1.2',
                  pointerEvents: 'none'
                }} title={table.name}>
                  {tableDisplayName}
                </div>
              </div>
            ),
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
    const viewDisplayName = getDisplayName(viewItem.name, 'view');

    const viewNode = {
      id: viewNodeId,
      type: 'default',
      position: { x: viewX, y: viewY },
      sourcePosition: 'right',
      targetPosition: 'left',
      data: {
        label: (
          <div style={{ position: 'relative' }}>
            <div>V</div>
            <div style={{
              position: 'absolute',
              top: '60px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '11px',
              color: '#6B7280',
              textAlign: 'center',
              maxWidth: '120px',
              whiteSpace: 'break-word',
              lineHeight: '1.2',
              pointerEvents: 'none'
            }} title={viewItem.name}>
              {viewDisplayName}
            </div>
          </div>
        ),
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

  const currentItem = selectedItems[currentTableIndex];
  const isColumnType = currentItem?.type === 'Column';

  const currentDisplayItem = selectedItems[currentTableIndex] || selectedItems[0];
  const { nodes: initialNodes, edges: initialEdges } = currentDisplayItem ?
    generateNodesAndEdges(currentItem) :
    { nodes: [], edges: [] };

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    if (currentDisplayItem) {
      const { nodes: newNodes, edges: newEdges } = generateNodesAndEdges(currentDisplayItem);
      setNodes(newNodes);
      setEdges(newEdges);
      setExpandedNodes(new Set());
      setBackwardExpandedNodes(new Set());
      setAllConnectionsExpandedNodes(new Set());
      setSelectedNodeId(null);
      setForwardData(new Map());
      setBackwardData(new Map());
      setAllConnectionsData(new Map());
      setNodeConnectionMap(new Map());

      // Track initial node IDs for cleaning purposes
      const initialIds = new Set(newNodes.map(node => node.id));
      setInitialNodeIds(initialIds);
    }
  }, [currentDisplayItem, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const handleNavigate = async (nodeId, direction) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (direction === 'allConnections') {
      if (node.data.type !== 'schema' && node.data.type !== 'table') {
        return;
      }

      const isCurrentlyExpanded = allConnectionsExpandedNodes.has(nodeId);

      if (isCurrentlyExpanded) {
        // Remove all connections nodes with cleaning
        setAllConnectionsExpandedNodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(nodeId);
          return newSet;
        });

        const { filteredNodes, filteredEdges } = removeAllConnectionsNodesWithCleaning(nodeId, nodes, edges);
        setNodes(filteredNodes);
        setEdges(filteredEdges);

        setAllConnectionsData(prev => {
          const newMap = new Map(prev);
          newMap.delete(nodeId);
          return newMap;
        });
      } else {
        setIsLoadingAllConnections(true);

        try {
          const response = await fetchForwardLineage(nodeId, node.data.type, 1);

          if (response) {
            const { newNodes, newEdges } = createAllConnectionsNodes(nodeId, node.data.type, response, nodes);

            const existingEdgeIds = new Set(edges.map(e => e.id.toLowerCase()));
            const uniqueNewEdges = newEdges.filter(e => !existingEdgeIds.has(e.id.toLowerCase()));

            const existingNodeIds = new Set(nodes.map(n => n.id.toLowerCase()));
            const uniqueNewNodes = newNodes.filter(n => !existingNodeIds.has(n.id.toLowerCase()));

            setNodes(prev => [...prev, ...uniqueNewNodes]);
            setEdges(prev => [...prev, ...uniqueNewEdges]);

            setAllConnectionsExpandedNodes(prev => {
              const newSet = new Set(prev);
              newSet.add(nodeId);
              return newSet;
            });

            setAllConnectionsData(prev => {
              const newMap = new Map(prev);
              newMap.set(nodeId, response);
              return newMap;
            });
          }
        } catch (error) {
          console.error('Error handling all connections:', error);
        } finally {
          setIsLoadingAllConnections(false);
        }
      }
      return;
    }

    if (direction === 'forward') {
      if (node.data.type !== 'schema' && node.data.type !== 'table') {
        return;
      }

      const isCurrentlyExpanded = expandedNodes.has(nodeId);

      if (isCurrentlyExpanded) {
        setExpandedNodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(nodeId);
          return newSet;
        });

        const { filteredNodes, filteredEdges } = removeForwardNodesWithCleaning(nodeId, nodes, edges);
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
          const response = await fetchForwardLineage(nodeId, node.data.type, steps);

          if (response) {
            const { newNodes, newEdges } = createForwardNodes(nodeId, node.data.type, response, nodes);

            // Use case-insensitive checks for existing edges and nodes
            const existingEdgeIds = new Set(edges.map(e => e.id.toLowerCase()));
            let uniqueNewEdges = newEdges.filter(e => !existingEdgeIds.has(e.id.toLowerCase()));

            const existingNodeIds = new Set(nodes.map(n => n.id.toLowerCase()));
            const uniqueNewNodes = newNodes.filter(n => !existingNodeIds.has(n.id.toLowerCase()));

            // Ensure schema-table connections for existing nodes
            const allNodes = [...nodes, ...uniqueNewNodes];
            const finalEdges = ensureSchemaTableConnections(allNodes, [...edges, ...uniqueNewEdges], nodeId, 'forward');

            // Filter out edges that already exist
            const existingFinalEdgeIds = new Set(edges.map(e => e.id.toLowerCase()));
            uniqueNewEdges = finalEdges.filter(e => !existingFinalEdgeIds.has(e.id.toLowerCase()));

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
    } else if (direction === 'backward') {
      if (node.data.type !== 'view' && node.data.type !== 'table') {
        return;
      }

      const isCurrentlyExpanded = backwardExpandedNodes.has(nodeId);

      if (isCurrentlyExpanded) {
        setBackwardExpandedNodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(nodeId);
          return newSet;
        });

        const { filteredNodes, filteredEdges } = removeBackwardNodesWithCleaning(nodeId, nodes, edges);
        setNodes(filteredNodes);
        setEdges(filteredEdges);

        setBackwardData(prev => {
          const newMap = new Map(prev);
          newMap.delete(nodeId);
          return newMap;
        });
      } else {
        setIsLoadingBackward(true);

        try {
          const response = await fetchBackwardLineage(nodeId, node.data.type, steps);

          if (response) {
            const { newNodes, newEdges } = createBackwardNodes(nodeId, node.data.type, response, nodes);

            // Use case-insensitive checks for existing edges and nodes
            const existingEdgeIds = new Set(edges.map(e => e.id.toLowerCase()));
            let uniqueNewEdges = newEdges.filter(e => !existingEdgeIds.has(e.id.toLowerCase()));

            const existingNodeIds = new Set(nodes.map(n => n.id.toLowerCase()));
            const uniqueNewNodes = newNodes.filter(n => !existingNodeIds.has(n.id.toLowerCase()));

            // Ensure schema-table connections for existing nodes
            const allNodes = [...nodes, ...uniqueNewNodes];
            const finalEdges = ensureSchemaTableConnections(allNodes, [...edges, ...uniqueNewEdges], nodeId, 'backward');

            // Filter out edges that already exist
            const existingFinalEdgeIds = new Set(edges.map(e => e.id.toLowerCase()));
            uniqueNewEdges = finalEdges.filter(e => !existingFinalEdgeIds.has(e.id.toLowerCase()));

            setNodes(prev => [...prev, ...uniqueNewNodes]);
            setEdges(prev => [...prev, ...uniqueNewEdges]);

            setBackwardExpandedNodes(prev => {
              const newSet = new Set(prev);
              newSet.add(nodeId);
              return newSet;
            });

            setBackwardData(prev => {
              const newMap = new Map(prev);
              newMap.set(nodeId, response);
              return newMap;
            });
          }
        } catch (error) {
          console.error('Error handling backward navigation:', error);
        } finally {
          setIsLoadingBackward(false);
        }
      }
    }
  };

  const handleToggleVisibility = (nodeId) => {
    // Implementation for toggle visibility if needed
  };

  const handleReset = () => {
    if (currentDisplayItem) {
      const { nodes: resetNodes, edges: resetEdges } = generateNodesAndEdges(currentDisplayItem);
      setNodes(resetNodes);
      setEdges(resetEdges);
      setExpandedNodes(new Set());
      setBackwardExpandedNodes(new Set());
      setAllConnectionsExpandedNodes(new Set());
      setForwardData(new Map());
      setBackwardData(new Map());
      setAllConnectionsData(new Map());
      setNodeConnectionMap(new Map());

      // Reset initial node IDs
      const initialIds = new Set(resetNodes.map(node => node.id));
      setInitialNodeIds(initialIds);
    }
  };

  const onNodeClick = (event, node) => {
    setSelectedNodeId(prevId => (prevId === node.id ? null : node.id));
  };

  const closeRemote = () => {
    setSelectedNodeId(null);
  };

  const selectedNode = nodes.find(node => node.id === selectedNodeId);

  if (!currentDisplayItem) {
    return (
      <div className="w-full h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-600">No Items Selected</h2>
          <p className="text-gray-500">Please select tables or views from the lineage page first.</p>
        </div>
      </div>
    );
  }
  if (isColumnType) {
    const columnName = currentItem.column;
    return (
      <div className="bg-gray-50 h-screen flex flex-col overflow-hidden p-2">
        <Breadcrumb />

        <div className="mb-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <Layers className="h-6 w-6 text-gray-700" />
              <span className="text-lg font-semibold text-gray-800">
                {currentItem?.name || 'Loading...'}
              </span>
            </div>

            {selectedItems.length > 1 && (
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
                  Item {currentTableIndex + 1} of {selectedItems.length}
                </span>
                <button
                  onClick={() => onNavigate('next')}
                  disabled={currentTableIndex === selectedItems.length - 1}
                  className="p-2 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next Item"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <TableMappingPage
          TableName={columnName}
          apiBaseUrl={API_BASE_URL}
          onBackToLineage={() => { }}
          type="column"
          policyIds={policyIds}
          columnName={columnName}
        />
      </div>
    );
  }

  if (showViewMapping && selectedViewForMapping) {
    return (
      <ViewMappingPage
        viewName={selectedViewForMapping}
        apiBaseUrl={API_BASE_URL}
        onBackToLineage={handleBackToLineage}
        policyIds={policyIds}
      />
    );
  }

  if (showTableMapping && selectedTableForMapping) {
    return (
      <TableMappingPage
        TableName={selectedTableForMapping}
        apiBaseUrl={API_BASE_URL}
        onBackToLineage={handleTableBackToLineage}
        type="table"
        policyIds={policyIds}
      />
    );
  }

  return (
    <ReactFlowProvider>
      <div className="bg-gray-50 h-screen flex flex-col overflow-hidden p-2">
        <Breadcrumb />
        <div className="">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {currentDisplayItem?.type === 'View' ? (
                <Layers className="h-6 w-6 text-gray-700" />
              ) : (
                <Table className="h-6 w-6 text-gray-700" />
              )}
              <span className="text-lg font-semibold text-gray-800">
                {currentDisplayItem?.name || 'Loading...'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <DownloadHelper nodes={nodes} fileName={currentDisplayItem?.name || 'data-lineage'} />
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2">
                <span className="text-sm font-medium text-gray-700">Steps:</span>
                <select
                  value={steps}
                  onChange={(e) => setSteps(parseInt(e.target.value))}
                  className="text-sm bg-white border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  title="Lineage Steps (applies to both forward and backward)"
                >
                  {stepOptions.map(step => (
                    <option key={step} value={step}>{step}</option>
                  ))}
                </select>
              </div>
              {selectedItems.length > 1 && (
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
                    Item {currentTableIndex + 1} of {selectedItems.length}
                  </span>
                  <button
                    onClick={() => onNavigate('next')}
                    disabled={currentTableIndex === selectedItems.length - 1}
                    className="p-2 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next Item"
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
            nodesConnectable={false}
          >
            <Controls position="top-right" />
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
              backwardExpandedNodes={backwardExpandedNodes}
              allConnectionsExpandedNodes={allConnectionsExpandedNodes}
              isLoading={isLoadingForward}
              isLoadingBackward={isLoadingBackward}
              isLoadingAllConnections={isLoadingAllConnections}
              nodeData={selectedNode.data}
              onColumnDetails={handleColumnDetails}
            />
          )}
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default DataLineageFlow;