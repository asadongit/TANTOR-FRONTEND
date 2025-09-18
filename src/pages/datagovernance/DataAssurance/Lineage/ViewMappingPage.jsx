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
          const isHighlighted = highlightedColumns && highlightedColumns.some(
            highlightedCol => highlightedCol.toLowerCase() === fullColumnName.toLowerCase()
          );
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

const JoinNode = ({ data }) => {
  const { operation, joinConditions } = data;
  const joinType = operation || 'INNER JOIN';
  
  return (
    <div className="bg-white border-2 border-purple-500 rounded-lg p-3 min-w-32 relative">
      <Handle type="target" position={Position.Left} />
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Right} />
      
      <div className="text-center">
        <div className="font-bold text-purple-700 text-xs mb-1">
          {joinType.toUpperCase()}
        </div>
        {joinConditions && Object.keys(joinConditions).length > 0 && (
          <div className="text-xs text-gray-600 leading-tight">
            {Object.entries(joinConditions).map(([left, right], index) => {
              const leftCol = left.split('.').pop();
              const rightCol = right.split('.').pop();
              return (
                <div key={index} className="mb-1">
                  {leftCol} = {rightCol}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  tableNode: TableNode,
  unionNode: UnionNode,
  joinNode: JoinNode,
};

const ViewMappingPage = ({ viewName, apiBaseUrl, onBackToLineage }) => {
  const [viewData, setViewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTargetColumn, setSelectedTargetColumn] = useState(null);
  const [columnLineageEdges, setColumnLineageEdges] = useState([]);

  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  const handleColumnClick = useCallback((columnName) => {
    if (selectedTargetColumn === columnName) {
      setSelectedTargetColumn(null);
      setColumnLineageEdges([]);
    } else {
      setSelectedTargetColumn(columnName);
      showColumnLineage(columnName);
    }
  }, [selectedTargetColumn, viewData]);

  const showColumnLineage = (targetColumn) => {
    if (!viewData || !viewData.target_cols_mapping) return;

    const sourceColumns = viewData.target_cols_mapping[targetColumn];
    
    if (!sourceColumns) return;

    const newLineageEdges = [];

    // Create dotted edges from source columns to target column
    sourceColumns.forEach((sourceColumnPath, index) => {
      const pathParts = sourceColumnPath.split('.');
      const tableName = pathParts.slice(0, -1).join('.');
      const columnName = pathParts[pathParts.length - 1];

      // Find the source table node
      const sourceTableId = `table-${tableName}`;
      const targetViewId = `view-${viewData.view_name}`;

      const edgeId = `column-lineage-${sourceTableId}-${targetViewId}-${index}`;
      
      const lineageEdge = {
        id: edgeId,
        source: sourceTableId,
        target: targetViewId,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { 
          stroke: '#EF4444',
          strokeWidth: 2,
          strokeDasharray: '5,5' 
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

  const getHighlightedColumns = useCallback(() => {
    if (!selectedTargetColumn || !viewData || !viewData.target_cols_mapping) {
      return [];
    }

    const sourceColumns = viewData.target_cols_mapping[selectedTargetColumn];
    return sourceColumns || [];
  }, [selectedTargetColumn, viewData]);

  const updateNodeData = useCallback(() => {
    const highlightedColumns = getHighlightedColumns();
    
    setNodes((prevNodes) => 
      prevNodes.map((node) => {
        if (node.type === 'tableNode') {
          return {
            ...node,
            data: {
              ...node.data,
              highlightedColumns: node.data.isTarget ? [] : highlightedColumns,
              selectedColumn: node.data.isTarget ? selectedTargetColumn : undefined,
              onColumnClick: node.data.isTarget ? handleColumnClick : undefined
            }
          };
        }
        return node;
      })
    );
  }, [selectedTargetColumn, getHighlightedColumns, handleColumnClick]);

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
        body: JSON.stringify({ view: viewName, "matched_policy_ids": [19] })
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

  // Helper function to get join conditions for specific tables
  const getJoinConditionsForTables = (allJoinConditions, tables) => {
    const relevantConditions = {};
    Object.entries(allJoinConditions).forEach(([left, right]) => {
      const leftTable = left.substring(0, left.lastIndexOf('.'));
      const rightTable = right.substring(0, right.lastIndexOf('.'));
      
      // Case-insensitive comparison for table names
      if (tables.some(table => table.toLowerCase() === leftTable.toLowerCase()) && 
          tables.some(table => table.toLowerCase() === rightTable.toLowerCase())) {
        relevantConditions[left] = right;
      }
    });
    return relevantConditions;
  };

  const generateBaseLayout = (data, newNodes, newEdges, highlightedColumns) => {
    data.tables.forEach((tableName, tableIndex) => {
      const tableColumns = data.source_cols[tableName] || [];
      
      const tableNode = {
        id: `table-${tableName}`,
        type: 'tableNode',
        position: { x: 100, y: 150 + (tableIndex * 300) },
        data: { 
          tableName: tableName,
          columns: tableColumns,
          isTarget: false,
          highlightedColumns: highlightedColumns,
          onColumnClick: handleColumnClick
        },
        draggable: true
      };
      newNodes.push(tableNode);
    });

    const targetColumns = Object.keys(data.target_cols_mapping || {});
    const viewNode = {
      id: `view-${data.view_name}`,
      type: 'tableNode',
      position: { x: 600, y: 200 },
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

    data.tables.forEach((tableName, index) => {
      const edge = {
        id: `edge-${tableName}-view`,
        source: `table-${tableName}`,
        target: `view-${data.view_name}`,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { 
          stroke: '#10B981',
          strokeWidth: 2
        },
        type: 'default',
        animated: false
      };
      newEdges.push(edge);
    });
  };

  // Generate JOIN layout
  const generateJoinLayout = (data, newNodes, newEdges, highlightedColumns) => {
    data.tables.forEach((tableName, tableIndex) => {
      const tableColumns = data.source_cols[tableName] || [];
      
      let xPosition, yPosition;
      if (data.tables.length === 2) {
        xPosition = 50;
        yPosition = tableIndex === 0 ? 50 : 400;
      } else if (data.tables.length === 3) {
        xPosition = 50;
        if (tableIndex === 0) yPosition = 50;      
        else if (tableIndex === 1) yPosition = 250; 
        else yPosition = 450;                        
      } else {
        xPosition = 50;
        yPosition = 50 + (tableIndex * 200);
      }
      
      const tableNode = {
        id: `table-${tableName}`,
        type: 'tableNode',
        position: { x: xPosition, y: yPosition },
        data: { 
          tableName: tableName,
          columns: tableColumns,
          isTarget: false,
          highlightedColumns: highlightedColumns,
          onColumnClick: handleColumnClick
        },
        draggable: true
      };
      newNodes.push(tableNode);
    });

    if (data.tables.length === 2) {
      const joinNode = {
        id: 'join-1',
        type: 'joinNode',
        position: { x: 450, y: 225 },
        data: {
          operation: data.operation,
          joinConditions: data.join_conditions
        },
        draggable: true
      };
      newNodes.push(joinNode);
    } else if (data.tables.length === 3) {
      const join1Node = {
        id: 'join-1',
        type: 'joinNode',
        position: { x: 450, y: 150 },
        data: {
          operation: data.operation,
          joinConditions: getJoinConditionsForTables(data.join_conditions, data.tables.slice(0, 2))
        },
        draggable: true
      };
      newNodes.push(join1Node);

      const join2Node = {
        id: 'join-2',
        type: 'joinNode',
        position: { x: 650, y: 350 },
        data: {
          operation: data.operation,
          joinConditions: getJoinConditionsForTables(data.join_conditions, [data.tables[1], data.tables[2]])
        },
        draggable: true
      };
      newNodes.push(join2Node);
    }

    const targetColumns = Object.keys(data.target_cols_mapping || {});
    const viewNode = {
      id: `view-${data.view_name}`,
      type: 'tableNode',
      position: { x: 900, y: 250 },
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

    if (data.tables.length === 2) {
      data.tables.forEach((tableName, index) => {
        const edge = {
          id: `edge-${tableName}-join1`,
          source: `table-${tableName}`,
          target: 'join-1',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { 
            stroke: '#8B5CF6', 
            strokeWidth: 2
          },
          type: 'default',
          animated: false
        };
        newEdges.push(edge);
      });

      const viewEdge = {
        id: 'edge-join1-view',
        source: 'join-1',
        target: `view-${data.view_name}`,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { 
          stroke: '#8B5CF6', 
          strokeWidth: 2
        },
        type: 'default',
        animated: false
      };
      newEdges.push(viewEdge);
    } else if (data.tables.length === 3) {
      data.tables.slice(0, 2).forEach((tableName, index) => {
        const edge = {
          id: `edge-${tableName}-join1`,
          source: `table-${tableName}`,
          target: 'join-1',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { 
            stroke: '#8B5CF6', 
            strokeWidth: 2
          },
          type: 'default',
          animated: false
        };
        newEdges.push(edge);
      });

      const joinToJoinEdge = {
        id: 'edge-join1-join2',
        source: 'join-1',
        target: 'join-2',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { 
          stroke: '#8B5CF6', 
          strokeWidth: 2
        },
        type: 'default',
        animated: false
      };
      newEdges.push(joinToJoinEdge);

      const thirdTableEdge = {
        id: `edge-${data.tables[2]}-join2`,
        source: `table-${data.tables[2]}`,
        target: 'join-2',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { 
          stroke: '#8B5CF6', 
          strokeWidth: 2
        },
        type: 'default',
        animated: false
      };
      newEdges.push(thirdTableEdge);

      const finalEdge = {
        id: 'edge-join2-view',
        source: 'join-2',
        target: `view-${data.view_name}`,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { 
          stroke: '#8B5CF6', 
          strokeWidth: 2
        },
        type: 'default',
        animated: false
      };
      newEdges.push(finalEdge);
    }
  };

  const generateUnionLayout = (data, newNodes, newEdges, highlightedColumns) => {
    data.tables.forEach((tableName, tableIndex) => {
      const tableColumns = data.source_cols[tableName] || [];
      
      let yPosition;
      if (tableIndex === 0) {
        yPosition = 50;
      } else if (tableIndex === 1) {
        yPosition = 250;
      } else if (tableIndex === 2) {
        yPosition = 450;
      } else {
        yPosition = 50 + (tableIndex * 200);
      }
      
      const tableNode = {
        id: `table-${tableName}`,
        type: 'tableNode',
        position: { x: 50, y: yPosition },
        data: { 
          tableName: tableName,
          columns: tableColumns,
          isTarget: false,
          highlightedColumns: highlightedColumns,
          onColumnClick: handleColumnClick
        },
        draggable: true
      };
      newNodes.push(tableNode);
    });

    if (data.tables.length <= 2) {
      const unionNode = {
        id: 'union-1',
        type: 'unionNode',
        position: { x: 450, y: 150 },
        data: {
          operation: data.operation
        },
        draggable: true
      };
      newNodes.push(unionNode);
    } else {
      const union1Node = {
        id: 'union-1',
        type: 'unionNode',
        position: { x: 450, y: 150 },
        data: {
          operation: data.operation
        },
        draggable: true
      };
      newNodes.push(union1Node);

      const union2Node = {
        id: 'union-2',
        type: 'unionNode',
        position: { x: 650, y: 350 },
        data: {
          operation: data.operation
        },
        draggable: true
      };
      newNodes.push(union2Node);
    }

    // Create target view node (right side) with more spacing
    const targetColumns = Object.keys(data.target_cols_mapping || {});
    
    const viewNode = {
      id: `view-${data.view_name}`,
      type: 'tableNode',
      position: { x: 900, y: 250 },
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
  };

  const generateFlowElements = (data) => {
    const newNodes = [];
    const newEdges = [];
    const highlightedColumns = getHighlightedColumns();
    
    if (data.operation === 'base') {
      generateBaseLayout(data, newNodes, newEdges, highlightedColumns);
    } else {
      const isJoinOperation = data.join_conditions && Object.keys(data.join_conditions).length > 0;
      
      if (isJoinOperation) {
        generateJoinLayout(data, newNodes, newEdges, highlightedColumns);
      } else {
        generateUnionLayout(data, newNodes, newEdges, highlightedColumns);
      }
    }

    console.log('Generated nodes:', newNodes);
    console.log('Generated edges:', newEdges);

    setNodes(newNodes);
    setEdges(newEdges);
  };

  useEffect(() => {
    if (viewData && nodes.length > 0) {
      updateNodeData();
    }
  }, [selectedTargetColumn, updateNodeData]);

  const allEdges = useMemo(() => {
    if (selectedTargetColumn && viewData && viewData.operation === 'base' && columnLineageEdges.length > 0) {
      return columnLineageEdges;
    }
    return [...edges, ...columnLineageEdges];
  }, [edges, columnLineageEdges, selectedTargetColumn, viewData]);

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
              <ChevronLeft className="h-5 w-5 text-gray-700"/>
            </button>
            <div className="flex items-center gap-2">
              <Layers className="h-6 w-6" />
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
              if (node.type === 'joinNode') return '#8B5CF6';
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