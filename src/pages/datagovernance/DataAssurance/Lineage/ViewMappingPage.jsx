import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronRight, Database, Eye, ArrowLeft, Layers, ChevronLeft } from 'lucide-react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';

import 'reactflow/dist/style.css';
import Breadcrumb from '../../../../components/Breadcrumb';

// Custom Table Node Component with clickable columns
const TableNode = ({ data }) => {
  const { tableName, columns, isTarget, onColumnClick, selectedColumn, highlightedColumns } = data;
  
  return (
    <div className={`border-2 rounded-lg overflow-hidden min-w-48 ${
      isTarget 
        ? 'border-green-500 bg-green-50' 
        : 'border-blue-500 bg-blue-50'
    }`}>
      {/* Connection handles */}
      {!isTarget && <Handle type="source" position={Position.Right} />}
      {isTarget && <Handle type="target" position={Position.Left} />}
      
      {/* Table Header */}
      <div className={`px-4 py-3 font-semibold text-sm ${
        isTarget 
          ? 'bg-green-100 text-green-800 border-b border-green-200' 
          : 'bg-blue-100 text-blue-800 border-b border-blue-200'
      }`}>
        {tableName}
      </div>
      
      {/* Columns */}
      <div className="bg-white">
        {columns && columns.map((column, index) => {
          const fullColumnName = `${tableName}.${column}`;
          const isHighlighted = highlightedColumns && highlightedColumns.includes(fullColumnName);
          const isSelected = selectedColumn === column && isTarget;
          
          return (
            <div 
              key={`${tableName}-${column}-${index}`}
              className={`px-4 py-2 text-sm ${
                index < columns.length - 1 ? 'border-b border-gray-200' : ''
              } ${
                isTarget ? 'cursor-pointer hover:bg-green-50' : ''
              } ${
                isHighlighted ? 'bg-yellow-100 text-yellow-800 font-medium' : 'text-gray-700'
              } ${
                isSelected ? 'bg-green-200 text-green-900 font-semibold' : ''
              }`}
              onClick={isTarget ? () => onColumnClick && onColumnClick(column) : undefined}
              title={isTarget ? 'Click to view column lineage' : ''}
            >
              {column}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Custom Union Node Component
const UnionNode = ({ data }) => {
  const { operation } = data;
  return (
    <div className="bg-white border-2 border-gray-500 rounded-full w-20 h-20 flex items-center justify-center relative">
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <span className="font-bold text-gray-700 text-xs text-center leading-tight">
        {operation || 'UNION'}
      </span>
    </div>
  );
};

// Node types - moved outside component to prevent re-creation
const nodeTypes = {
  tableNode: TableNode,
  unionNode: UnionNode,
};

const ViewMappingPage = ({ viewName, apiBaseUrl, onBackToLineage }) => {
  const [viewData, setViewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTargetColumn, setSelectedTargetColumn] = useState(null);
  const [columnLineageEdges, setColumnLineageEdges] = useState([]);

  // Memoize nodeTypes to prevent unnecessary re-renders
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  // Handle column click
  const handleColumnClick = useCallback((columnName) => {
    if (selectedTargetColumn === columnName) {
      // If clicking the same column, clear the selection
      setSelectedTargetColumn(null);
      setColumnLineageEdges([]);
    } else {
      // Select new column and show its lineage
      setSelectedTargetColumn(columnName);
      showColumnLineage(columnName);
    }
  }, [selectedTargetColumn, viewData]);

  // Show column lineage
  const showColumnLineage = (targetColumn) => {
    if (!viewData || !viewData.target_cols_mapping) return;

    const sourceColumns = viewData.target_cols_mapping[targetColumn];
    if (!sourceColumns) return;

    const newLineageEdges = [];

    // Create dotted edges from source columns to target column
    sourceColumns.forEach((sourceColumnPath, index) => {
      // Parse the source column path (e.g., "oracledb123.test_user1.ABC_TEST.product_id")
      const pathParts = sourceColumnPath.split('.');
      const tableName = pathParts.slice(0, -1).join('.');
      const columnName = pathParts[pathParts.length - 1];

      // Find the source table node
      const sourceTableId = `table-${tableName}`;
      const targetViewId = `view-${viewData.view_name}`;

      // Create a unique edge for this column mapping
      const edgeId = `column-lineage-${sourceTableId}-${targetViewId}-${index}`;
      
      const lineageEdge = {
        id: edgeId,
        source: sourceTableId,
        target: targetViewId,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { 
          stroke: '#EF4444', // Red color for column lineage
          strokeWidth: 2,
          strokeDasharray: '5,5' // Dotted line
        },
        type: 'default',
        animated: true,
        data: {
          sourceColumn: columnName,
          targetColumn: targetColumn,
          isColumnLineage: true
        }
      };

      newLineageEdges.push(lineageEdge);
    });

    setColumnLineageEdges(newLineageEdges);
  };

  // Get highlighted columns for current selection
  const getHighlightedColumns = useCallback(() => {
    if (!selectedTargetColumn || !viewData || !viewData.target_cols_mapping) {
      return [];
    }

    const sourceColumns = viewData.target_cols_mapping[selectedTargetColumn];
    return sourceColumns || [];
  }, [selectedTargetColumn, viewData]);

  // Fetch view mapping data
  const fetchViewMapping = async () => {
    if (!viewName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiBaseUrl}/views/map_view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({ view: viewName })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setViewData(data);
      generateFlowElements(data);
    } catch (err) {
      console.error('Error fetching view mapping:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate ReactFlow nodes and edges
  const generateFlowElements = (data) => {
    const newNodes = [];
    const newEdges = [];
    const highlightedColumns = getHighlightedColumns();
    
    // Create source table nodes (left side) - positioned exactly as in screenshot
    data.tables.forEach((tableName, tableIndex) => {
      const tableColumns = data.source_cols[tableName] || [];
      
      let yPosition;
      if (tableIndex === 0) {
        yPosition = 50; // Top table
      } else if (tableIndex === 1) {
        yPosition = 180; // Middle table  
      } else if (tableIndex === 2) {
        yPosition = 330; // Bottom table
      } else {
        yPosition = 50 + (tableIndex * 140); // Additional tables
      }
      
      const tableNode = {
        id: `table-${tableName}`,
        type: 'tableNode',
        position: { x: 50, y: yPosition },
        data: { 
          tableName: tableName,
          columns: tableColumns,
          isTarget: false,
          highlightedColumns: highlightedColumns
        },
        draggable: true
      };
      newNodes.push(tableNode);
    });

    // Create UNION operation nodes (center) - positioned as in screenshot
    if (data.tables.length <= 2) {
      // Single union centered between the two tables
      const unionNode = {
        id: 'union-1',
        type: 'unionNode',
        position: { x: 380, y: 115 }, // Between top and middle table
        data: {
          operation: data.operation
        },
        draggable: true
      };
      newNodes.push(unionNode);
    } else {
      // First union - between first two tables
      const union1Node = {
        id: 'union-1',
        type: 'unionNode',
        position: { x: 380, y: 115 }, // Between top and middle table
        data: {
          operation: data.operation
        },
        draggable: true
      };
      newNodes.push(union1Node);

      // Second union - lower position
      const union2Node = {
        id: 'union-2',
        type: 'unionNode',
        position: { x: 520, y: 250 }, // Between unions and target
        data: {
          operation: data.operation
        },
        draggable: true
      };
      newNodes.push(union2Node);
    }

    // Create target view node (right side) - positioned as in screenshot
    const targetColumns = Object.keys(data.target_cols_mapping || {});
    
    const viewNode = {
      id: `view-${data.view_name}`,
      type: 'tableNode',
      position: { x: 700, y: 180 }, // Right side, middle height
      data: { 
        tableName: data.view_name,
        columns: targetColumns,
        isTarget: true,
        onColumnClick: handleColumnClick,
        selectedColumn: selectedTargetColumn,
        highlightedColumns: []
      },
      draggable: true
    };
    newNodes.push(viewNode);

    // Create edges based on the number of tables
    if (data.tables.length <= 2) {
      // Connect tables to single union
      data.tables.forEach((tableName, index) => {
        const edge = {
          id: `edge-${tableName}-union1`,
          source: `table-${tableName}`,
          target: 'union-1',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { 
            stroke: '#6B7280', 
            strokeWidth: 2
          },
          type: 'default',
          animated: false
        };
        newEdges.push(edge);
      });

      // Connect union to view
      const viewEdge = {
        id: 'edge-union1-view',
        source: 'union-1',
        target: `view-${data.view_name}`,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { 
          stroke: '#6B7280', 
          strokeWidth: 2
        },
        type: 'default',
        animated: false
      };
      newEdges.push(viewEdge);
    } else {
      // Connect first two tables to first union
      data.tables.slice(0, 2).forEach((tableName, index) => {
        const edge = {
          id: `edge-${tableName}-union1`,
          source: `table-${tableName}`,
          target: 'union-1',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { 
            stroke: '#6B7280', 
            strokeWidth: 2
          },
          type: 'default',
          animated: false
        };
        newEdges.push(edge);
      });

      // Connect first union to second union
      const unionToUnionEdge = {
        id: 'edge-union1-union2',
        source: 'union-1',
        target: 'union-2',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { 
          stroke: '#6B7280', 
          strokeWidth: 2
        },
        type: 'default',
        animated: false
      };
      newEdges.push(unionToUnionEdge);

      // Connect remaining tables to second union
      data.tables.slice(2).forEach((tableName, index) => {
        const edge = {
          id: `edge-${tableName}-union2`,
          source: `table-${tableName}`,
          target: 'union-2',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { 
            stroke: '#6B7280', 
            strokeWidth: 2
          },
          type: 'default',
          animated: false
        };
        newEdges.push(edge);
      });

      // Connect second union to view
      const finalEdge = {
        id: 'edge-union2-view',
        source: 'union-2',
        target: `view-${data.view_name}`,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { 
          stroke: '#6B7280', 
          strokeWidth: 2
        },
        type: 'default',
        animated: false
      };
      newEdges.push(finalEdge);
    }

    console.log('Generated nodes:', newNodes);
    console.log('Generated edges:', newEdges);

    setNodes(newNodes);
    setEdges(newEdges);
  };

  // Update edges when column lineage changes
  useEffect(() => {
    if (!viewData) return;
    
    // Regenerate base flow elements
    generateFlowElements(viewData);
  }, [selectedTargetColumn, viewData, handleColumnClick]);

  // Combine base edges with column lineage edges
  const allEdges = useMemo(() => {
    return [...edges, ...columnLineageEdges];
  }, [edges, columnLineageEdges]);

  // Fetch data on component mount
  useEffect(() => {
    if (viewName) {
      fetchViewMapping();
    }
  }, [viewName]);

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading view mapping...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700 font-medium">Error loading view mapping</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={fetchViewMapping}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 h-screen flex flex-col overflow-hidden">
      <Breadcrumb />
      {/* Header */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToLineage}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 py-2 rounded-md transition-colors"
            >
              <ChevronLeft className="h-5 w-5"/>
            </button>
            <div className="flex items-center gap-2">
              <Layers className="h-6 w-6 text-green-600" />
              <span className="text-lg font-semibold text-gray-800">
                {viewName}
              </span>
            </div>
          </div>
          
        </div>
      </div>

      {/* ReactFlow Content */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={allEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={memoizedNodeTypes}
          fitView
          fitViewOptions={{
            padding: 50,
            includeHiddenNodes: false,
            minZoom: 0.5,
            maxZoom: 1.5
          }}
          className="bg-gray-50"
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          minZoom={0.3}
          maxZoom={2}
        >
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'tableNode') {
                return node.data.isTarget ? '#22C55E' : '#3B82F6';
              }
              if (node.type === 'unionNode') return '#6B7280';
              return '#E5E7EB';
            }}
            className="bg-white border border-gray-300 rounded"
          />
          <Background variant="dots" gap={20} size={1} color="#E5E7EB" />
        </ReactFlow>
      </div>
    </div>
  );
};

export default ViewMappingPage;