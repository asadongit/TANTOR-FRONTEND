import React, { useState, useEffect, useCallback } from 'react';
import { Table, ChevronLeft, Code, Map, AlertCircle, Download, Camera, FileText, ChevronRight } from 'lucide-react';
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
    useReactFlow,
    ReactFlowProvider,
    getNodesBounds,
    getViewportForBounds,
} from 'reactflow';
import 'reactflow/dist/style.css';

const SourceTableNode = ({ data }) => {
    const { selectedColumn, onColumnClick } = data;
    return (
        <div className="bg-white border-2 border-blue-300 rounded-lg shadow-lg min-w-[200px]">
            <div className="bg-blue-100 px-3 py-2 rounded-t-lg border-b">
                <div className="flex items-center gap-2">
                    <Table className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-sm text-blue-800">{data.tableName}</span>
                </div>
            </div>
            <div className="p-2">
                {data.columns?.map((column, index) => {
                    const columnKey = `${data.id}-${column}`;
                    const isSelected = selectedColumn === columnKey;

                    return (
                        <div
                            key={index}
                            className={`flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded text-xs cursor-pointer transition-colors ${isSelected ? 'bg-blue-100 border border-blue-300' : ''
                                }`}
                            onClick={() => onColumnClick && onColumnClick(columnKey, data.id, column, 'source')}
                        >
                            <span className={`text-gray-700 ${isSelected ? 'font-semibold text-blue-800' : ''}`}>
                                {column}
                            </span>
                            <Handle
                                type="source"
                                position={Position.Right}
                                id={`${data.id}-${column}`}
                                className="!w-2 !h-2 !bg-blue-500 !border-blue-600"
                                style={{ top: 'auto', transform: 'none', position: 'relative' }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const TransformationNode = ({ data }) => {
    const { selectedColumn, onColumnClick } = data;
    const getTransformationColor = (type) => {
        const colors = {
            arithmetic: 'bg-transparent border-red-300 text-red-800',
            string: 'bg-transparent border-green-300 text-green-800',
            constantcopy: 'bg-transparent border-orange-300 text-orange-800',
            rename: 'bg-transparent border-purple-300 text-purple-800',
            filter: 'bg-transparent border-blue-300 text-blue-800',
            date: 'bg-transparent border-yellow-300 text-yellow-800',
            restrictcolumns: 'bg-transparent border-pink-300 text-pink-800',
            typecast: 'bg-transparent border-indigo-300 text-indigo-800',
            sorting: 'bg-transparent border-gray-300 text-gray-800',
            join: 'bg-transparent border-teal-300 text-teal-800',
            ranking: 'bg-transparent border-cyan-300 text-cyan-800'
        };
        return colors[type] || 'bg-transparent border-gray-300 text-gray-800';
    };

    return (
        <div className={`border-2 rounded-lg shadow-lg min-w-[220px] ${getTransformationColor(data.type)}`}>
            <div className="px-3 py-2 border-b">
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm capitalize">{data.type}</span>
                </div>
                {data.operator && <span className="text-xs ml-2">({data.operator})</span>}
            </div>
            <div className="p-2">
                {data.columns?.map((column, index) => {
                    const columnName = column.split('.').pop();
                    const columnKey = `${data.id}-${column}`;
                    const isSelected = selectedColumn === columnKey;
                    const isAffected = data.affectedColumns?.some(affected =>
                        affected.includes(columnName) || affected === column
                    );

                    return (
                        <div
                            key={index}
                            className={`flex items-center justify-between py-1 px-2 hover:bg-white/50 rounded text-xs cursor-pointer transition-colors ${isSelected ? 'bg-white border border-gray-400' : ''
                                }`}
                            onClick={() => onColumnClick && onColumnClick(columnKey, data.id, column, 'transformation')}
                        >
                            <Handle
                                type="target"
                                position={Position.Left}
                                id={`${data.id}-${column}-input`}
                                className="!w-2 !h-2 !bg-gray-500 !border-gray-600"
                                style={{ top: 'auto', transform: 'none', position: 'relative' }}
                            />
                            <span className={`text-center flex-1 mx-2 ${isAffected ? 'font-bold bg-yellow-200 px-1 rounded border border-yellow-400' : ''
                                } ${isSelected ? 'font-bold text-gray-800' : ''}`}>
                                {columnName}
                            </span>
                            <Handle
                                type="source"
                                position={Position.Right}
                                id={`${data.id}-${column}-output`}
                                className="!w-2 !h-2 !bg-gray-500 !border-gray-600"
                                style={{ top: 'auto', transform: 'none', position: 'relative' }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const TargetTableNode = ({ data }) => {
    const { selectedColumn, onColumnClick } = data;
    return (
        <div className="bg-white border-2 border-green-300 rounded-lg shadow-lg min-w-[200px]">
            <div className="bg-green-100 px-3 py-2 rounded-t-lg border-b">
                <div className="flex items-center gap-2">
                    <Table className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-sm text-green-800">{data.tableName}</span>
                </div>
            </div>
            <div className="p-2">
                {data.columns?.map((column, index) => {
                    const columnKey = `${data.id}-${column}`;
                    const isSelected = selectedColumn === columnKey;

                    return (
                        <div
                            key={index}
                            className={`flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded text-xs cursor-pointer transition-colors ${isSelected ? 'bg-green-100 border border-green-300' : ''
                                }`}
                            onClick={() => onColumnClick && onColumnClick(columnKey, data.id, column, 'target')}
                        >
                            <Handle
                                type="target"
                                position={Position.Left}
                                id={`${data.id}-${column}`}
                                className="!w-2 !h-2 !bg-green-500 !border-green-600"
                                style={{ top: 'auto', transform: 'none', position: 'relative' }}
                            />
                            <span className={`text-gray-700 ml-2 ${isSelected ? 'font-semibold text-green-800' : ''}`}>
                                {column}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const NavigationButtons = ({ selectedColumn, columnInfo, onBack, onForward, onClose }) => {
    if (!selectedColumn) return null;

    const parseColumnInfo = (columnName) => {
        if (!columnName) return {};

        const parts = columnName.split('.');
        if (parts.length === 4) {
            return {
                connection: parts[0],
                schema: parts[1],
                table: parts[2],
                column: parts[3]
            };
        }
        return { column: columnName };
    };

    const parsedInfo = parseColumnInfo(columnInfo?.columnName);

    return (
        <div
            className="bg-white shadow-lg border-l border-gray-200 z-50 flex flex-col"
            style={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: '320px',
                height: '100vh',
                margin: 0,
                padding: 0
            }}
        >

            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50"
                onClick={onClose}
                title="Close Details">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                        <ChevronRight className="h-5 w-5 text-[#8d77ba]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Column Details</h3>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                    {parsedInfo.column && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">Column</div>
                            <div className="font-semibold text-gray-800">{parsedInfo.column}</div>
                        </div>
                    )}

                    {parsedInfo.table && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">Table</div>
                            <div className="font-semibold text-gray-800">{parsedInfo.table}</div>
                        </div>
                    )}

                    {parsedInfo.schema && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">Schema</div>
                            <div className="font-semibold text-gray-800">{parsedInfo.schema}</div>
                        </div>
                    )}

                    {parsedInfo.connection && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">Connection</div>
                            <div className="font-semibold text-gray-800">{parsedInfo.connection}</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-3">
                    <button
                        onClick={onBack}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 group"
                        title="Show backward lineage"
                    >
                        <ChevronLeft className="h-4 w-4 text-gray-600 group-hover:text-gray-800" />
                        <span className="text-sm font-medium text-gray-600 group-hover:text-gray-800">Back</span>
                    </button>
                    <button
                        onClick={onForward}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#8d77ba] border border-[#8d77ba] rounded-lg transition-colors duration-150 group"
                        title="Show Forward lineage"
                    >
                        <span className="text-sm font-medium text-white">Forward</span>
                        <ChevronRight className="h-4 w-4 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const nodeTypes = {
    sourceTable: SourceTableNode,
    transformation: TransformationNode,
    targetTable: TargetTableNode,
};

const TableMappingPage = ({ TableName, apiBaseUrl, onBackToLineage, type, policyIds }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [allEdges, setAllEdges] = useState([]);
    const [selectedColumn, setSelectedColumn] = useState(null);
    const [selectedColumnInfo, setSelectedColumnInfo] = useState(null);
    const [activeTab, setActiveTab] = useState('map');
    const [loading, setLoading] = useState(false);
    const [textLoading, setTextLoading] = useState(false);
    const [TableDefinition, setTableDefinition] = useState('');
    const [textError, setTextError] = useState(null);

    const lineageData = {
        "etl": "yes",
        "source": [
            {
                "connection": "orcl_lineage_etl",
                "schema": "orcl_lineage_etl.test_user1",
                "table": "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS",
                "columns": {
                    "DEPARTMENT_ID": [
                        "DEPARTMENT_ID"
                    ],
                    "DEPARTMENT_NAME": [
                        "DEPARTMENT_NAME"
                    ],
                    "LOCATION": [
                        "LOCATION"
                    ]
                }
            },
            {
                "connection": "orcl_lineage_etl",
                "schema": "orcl_lineage_etl.test_user1",
                "table": "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES",
                "columns": {
                    "EMPLOYEE_ID": [
                        "EMPLOYEE_ID"
                    ],
                    "FIRST_NAME": [
                        "FIRST_NAME"
                    ],
                    "LAST_NAME": [
                        "LAST_NAME"
                    ],
                    "SALARY": [
                        "SALARY"
                    ],
                    "DEPARTMENT_ID": [
                        "DEPARTMENT_ID"
                    ]
                }
            }
        ],
        "transformation": [
            {
                "string": {
                    "transformation_order": 2,
                    "column_affected": ["orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.fullname"],
                    "columns": {
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.fullname": [
                            "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.FIRST_NAME",
                            "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.LAST_NAME"
                        ]
                    },
                    "transformation_operator": "concat"
                }
            },
            {
                "join": {
                    "transformation_order": 3,
                    "join_operator": "== ",
                    "join_type": "inner",

                    "columns_used": ["orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.DEPARTMENT_ID", "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_ID"],
                    "column_affected": ["orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.DEPARTMENT_ID", "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_ID"],
                    "columns": {
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.fullname": [
                            "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.fullname"
                        ]
                    }
                }
            },
            {
                "rename": {
                    "transformation_order": 4,
                    "column_affected": ["orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.Standardname"],
                    "columns": {
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.Standardname": [
                            "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.fullname"
                        ]
                    }
                }
            }
        ],
        "target": [
            {
                "connection": "post_lineage_etl",
                "schema": "post_lineage_etl.public",
                "table": "post_lineage_etl.public.employee_report",
                "columns": {
                    "employee_name": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standardname"
                    ]
                }
            }
        ]
    }


    const isSameColumnIgnoreCase = (col1, col2) => {
        if (!col1 || !col2) return false;
        return col1.toLowerCase() === col2.toLowerCase();
    };

    const getColumnName = (fullPath) => fullPath?.split('.').pop() || '';

    const handleColumnClick = useCallback((columnKey, nodeId, columnName, nodeType) => {
        setSelectedColumnInfo({
            columnKey,
            nodeId,
            columnName,
            nodeType
        });

        if (selectedColumn === columnKey) {
            setSelectedColumn(null);
            setSelectedColumnInfo(null);
            setEdges(allEdges);
            return;
        }

        setSelectedColumn(columnKey);


        const relatedEdges = new Set();
        const visited = new Set();

        const traceForward = (currentNodeId, currentColumn) => {
            if (visited.has(`${currentNodeId}-${currentColumn}`)) return;
            visited.add(`${currentNodeId}-${currentColumn}`);

            allEdges.forEach(edge => {
                const sourceHandle = edge.sourceHandle;
                if (sourceHandle && sourceHandle.includes(currentNodeId) &&
                    (sourceHandle.includes(currentColumn) ||
                        sourceHandle.includes(getColumnName(currentColumn)))) {
                    relatedEdges.add(edge.id);

                    const targetHandle = edge.targetHandle;
                    if (targetHandle) {
                        const targetNodeId = edge.target;
                        const targetColumnMatch = targetHandle.match(/-([^-]+)-(?:input|output)$/);
                        if (targetColumnMatch) {
                            const targetColumn = targetColumnMatch[1];
                            traceForward(targetNodeId, targetColumn);
                        }
                    }
                }
            });
        };

        const traceBackward = (currentNodeId, currentColumn) => {
            if (visited.has(`backward-${currentNodeId}-${currentColumn}`)) return;
            visited.add(`backward-${currentNodeId}-${currentColumn}`);

            allEdges.forEach(edge => {
                const targetHandle = edge.targetHandle;
                const sourceHandle = edge.sourceHandle;

                if (targetHandle && targetHandle.includes(currentNodeId)) {
                    const targetColumnMatch = targetHandle.match(/-([^-]+)-(?:input|output)$/);
                    const targetColumn = targetColumnMatch ? targetColumnMatch[1] : targetHandle.split('-').pop();

                    if (targetColumn && (
                        isSameColumnIgnoreCase(currentColumn, targetColumn) ||
                        isSameColumnIgnoreCase(getColumnName(currentColumn), targetColumn) ||
                        targetHandle.includes(currentColumn) ||
                        targetHandle.includes(getColumnName(currentColumn))
                    )) {
                        relatedEdges.add(edge.id);

                        if (sourceHandle) {
                            const sourceNodeId = edge.source;
                            let sourceColumn;

                            if (sourceHandle.includes('-output')) {
                                const sourceColumnMatch = sourceHandle.match(/-([^-]+)-output$/);
                                sourceColumn = sourceColumnMatch ? sourceColumnMatch[1] : null;
                            } else {
                                const sourceColumnMatch = sourceHandle.match(/-([^-]+)$/);
                                sourceColumn = sourceColumnMatch ? sourceColumnMatch[1] : null;
                            }

                            if (sourceColumn) {
                                traceBackward(sourceNodeId, sourceColumn);
                            }
                        }
                    }
                }
            });
        };

        traceForward(nodeId, columnName);
        traceBackward(nodeId, columnName);

        const filteredEdges = allEdges.filter(edge => relatedEdges.has(edge.id));
        setEdges(filteredEdges);
    }, [selectedColumn, allEdges, setEdges]);

    const handleBack = () => {
        if (!selectedColumnInfo || !allEdges || allEdges.length === 0) return;

        console.log('Back button clicked');
        console.log('Current selected column:', selectedColumnInfo);

        const { nodeId, columnName } = selectedColumnInfo;
        const relatedEdges = new Set();
        const visited = new Set();

        const traceBackward = (currentNodeId, currentColumn) => {
            if (visited.has(`backward-${currentNodeId}-${currentColumn}`)) return;
            visited.add(`backward-${currentNodeId}-${currentColumn}`);

            allEdges.forEach(edge => {
                const targetHandle = edge.targetHandle;
                const sourceHandle = edge.sourceHandle;

                if (targetHandle && targetHandle.includes(currentNodeId)) {
                    const targetColumnMatch = targetHandle.match(/-([^-]+)-(?:input|output)$/);
                    const targetColumn = targetColumnMatch ? targetColumnMatch[1] : targetHandle.split('-').pop();

                    if (targetColumn && (
                        isSameColumnIgnoreCase(currentColumn, targetColumn) ||
                        isSameColumnIgnoreCase(getColumnName(currentColumn), targetColumn) ||
                        targetHandle.includes(currentColumn) ||
                        targetHandle.includes(getColumnName(currentColumn))
                    )) {
                        relatedEdges.add(edge.id);

                        if (sourceHandle) {
                            const sourceNodeId = edge.source;
                            let sourceColumn;

                            if (sourceHandle.includes('-output')) {
                                const sourceColumnMatch = sourceHandle.match(/-([^-]+)-output$/);
                                sourceColumn = sourceColumnMatch ? sourceColumnMatch[1] : null;
                            } else {
                                const sourceColumnMatch = sourceHandle.match(/-([^-]+)$/);
                                sourceColumn = sourceColumnMatch ? sourceColumnMatch[1] : null;
                            }

                            if (sourceColumn) {
                                traceBackward(sourceNodeId, sourceColumn);
                            }
                        }
                    }
                }
            });
        };

        traceBackward(nodeId, columnName);
        const filteredEdges = allEdges.filter(edge => relatedEdges.has(edge.id));
        setEdges(filteredEdges);
    };

    const handleForward = () => {
        if (!selectedColumnInfo || !allEdges || allEdges.length === 0) return;

        console.log('Forward button clicked');
        console.log('Current selected column:', selectedColumnInfo);

        const { nodeId, columnName } = selectedColumnInfo;
        const relatedEdges = new Set();
        const visited = new Set();

        const traceForward = (currentNodeId, currentColumn) => {
            if (visited.has(`${currentNodeId}-${currentColumn}`)) return;
            visited.add(`${currentNodeId}-${currentColumn}`);

            allEdges.forEach(edge => {
                const sourceHandle = edge.sourceHandle;
                if (sourceHandle && sourceHandle.includes(currentNodeId) &&
                    (sourceHandle.includes(currentColumn) ||
                        sourceHandle.includes(getColumnName(currentColumn)))) {
                    relatedEdges.add(edge.id);

                    const targetHandle = edge.targetHandle;
                    if (targetHandle) {
                        const targetNodeId = edge.target;
                        const targetColumnMatch = targetHandle.match(/-([^-]+)-(?:input|output)$/);
                        if (targetColumnMatch) {
                            const targetColumn = targetColumnMatch[1];
                            traceForward(targetNodeId, targetColumn);
                        }
                    }
                }
            });
        };

        traceForward(nodeId, columnName);
        const filteredEdges = allEdges.filter(edge => relatedEdges.has(edge.id));
        setEdges(filteredEdges);
    };

    const generateNodesAndEdges = useCallback(() => {
        const generatedNodes = [];
        const generatedEdges = [];
        let nodeId = 0;

        // Create source nodes
        lineageData.source.forEach((source, sourceIndex) => {
            const tableName = source.table.split('.').pop();
            const columns = Object.keys(source.columns);
            generatedNodes.push({
                id: `source-${sourceIndex}`,
                type: 'sourceTable',
                position: { x: 50, y: sourceIndex * 300 + 50 },
                data: {
                    id: `source-${sourceIndex}`,
                    tableName,
                    columns
                }
            });
        });

        // Sort transformations by order
        const sortedTransformations = [...lineageData.transformation].sort((a, b) => {
            const aType = Object.keys(a)[0];
            const bType = Object.keys(b)[0];
            return a[aType].transformation_order - b[bType].transformation_order;
        });

        // Create transformation nodes
        sortedTransformations.forEach((transformation, transformIndex) => {
            const transformType = Object.keys(transformation)[0];
            const transformData = transformation[transformType];
            const columns = Object.keys(transformData.columns);
            const affectedColumns = transformData.column_affected || [];
            generatedNodes.push({
                id: `transform-${transformIndex}`,
                type: 'transformation',
                position: { x: 350 + transformIndex * 280, y: 200 },
                data: {
                    id: `transform-${transformIndex}`,
                    type: transformType,
                    operator: transformData.transformation_operator,
                    columns,
                    affectedColumns,
                    order: transformData.transformation_order
                }
            });
        });

        lineageData.target.forEach((target, targetIndex) => {
            const tableName = target.table.split('.').pop();
            const columns = Object.keys(target.columns);

            const transformationCount = lineageData.transformation.length;
            const targetXPosition = transformationCount > 0
                ? 350 + transformationCount * 280 + 200
                : 700;

            generatedNodes.push({
                id: `target-${targetIndex}`,
                type: 'targetTable',
                position: { x: targetXPosition, y: targetIndex * 300 + 150 },
                data: {
                    id: `target-${targetIndex}`,
                    tableName,
                    columns
                }
            });
        });

        const edgeId = { current: 0 };

        const isDirectSourceColumn = (columnPath) => lineageData.source.some(source =>
            Object.keys(source.columns).some(sourceCol =>
                isSameColumnIgnoreCase(columnPath, `${source.table}.${sourceCol}`)
            )
        );

        const isAvailableFromPreviousTransform = (columnPath, currentTransformIndex) => {
            if (currentTransformIndex === 0) return false;
            const prevTransform = sortedTransformations[currentTransformIndex - 1];
            const prevType = Object.keys(prevTransform)[0];
            const prevData = prevTransform[prevType];
            return Object.keys(prevData.columns).some(prevOutputCol =>
                isSameColumnIgnoreCase(columnPath, prevOutputCol)
            );
        };

        sortedTransformations.forEach((transform, transformIndex) => {
            const transformType = Object.keys(transform)[0];
            const transformData = transform[transformType];

            if (transformType === 'join' && transformData.columns_used) {
                transformData.columns_used.forEach(joinColumn => {
                    lineageData.source.forEach((source, sourceIndex) => {
                        Object.keys(source.columns).forEach(sourceColumnName => {
                            const sourceFullPath = `${source.table}.${sourceColumnName}`;
                            if (isSameColumnIgnoreCase(joinColumn, sourceFullPath)) {
                                generatedEdges.push({
                                    id: `edge-${edgeId.current++}`,
                                    source: `source-${sourceIndex}`,
                                    target: `transform-${transformIndex}`,
                                    sourceHandle: `source-${sourceIndex}-${sourceColumnName}`,
                                    targetHandle: `transform-${transformIndex}-${Object.keys(transformData.columns)[0]}-input`,
                                    type: 'straight',
                                    style: {
                                        stroke: '#ef4444',
                                        strokeWidth: 2,
                                        strokeDasharray: '5,5'
                                    },
                                    markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' }
                                });
                            }
                        });
                    });
                });
            }

            // Handle regular transformation edges
            Object.entries(transformData.columns).forEach(([transformOutputCol, inputCols]) => {
                inputCols.forEach(inputCol => {
                    if (!inputCol) return;

                    if (transformIndex > 0 && isAvailableFromPreviousTransform(inputCol, transformIndex)) {
                        const prevTransform = sortedTransformations[transformIndex - 1];
                        const prevType = Object.keys(prevTransform)[0];
                        const prevData = prevTransform[prevType];
                        Object.keys(prevData.columns).forEach(prevOutputCol => {
                            if (isSameColumnIgnoreCase(inputCol, prevOutputCol)) {
                                generatedEdges.push({
                                    id: `edge-${edgeId.current++}`,
                                    source: `transform-${transformIndex - 1}`,
                                    target: `transform-${transformIndex}`,
                                    sourceHandle: `transform-${transformIndex - 1}-${prevOutputCol}-output`,
                                    targetHandle: `transform-${transformIndex}-${transformOutputCol}-input`,
                                    type: 'straight',
                                    style: { stroke: '#8b5cf6', strokeWidth: 2 },
                                    markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' }
                                });
                            }
                        });
                    }
                    else if (isDirectSourceColumn(inputCol)) {
                        lineageData.source.forEach((source, sourceIndex) => {
                            Object.keys(source.columns).forEach(sourceColumnName => {
                                if (isSameColumnIgnoreCase(inputCol, `${source.table}.${sourceColumnName}`)) {
                                    generatedEdges.push({
                                        id: `edge-${edgeId.current++}`,
                                        source: `source-${sourceIndex}`,
                                        target: `transform-${transformIndex}`,
                                        sourceHandle: `source-${sourceIndex}-${sourceColumnName}`,
                                        targetHandle: `transform-${transformIndex}-${transformOutputCol}-input`,
                                        type: 'straight',
                                        style: { stroke: '#3b82f6', strokeWidth: 2 },
                                        markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
                                    });
                                }
                            });
                        });
                    }
                });
            });
        });

        if (sortedTransformations.length > 0) {
            const lastTransformIndex = sortedTransformations.length - 1;
            const lastTransform = sortedTransformations[lastTransformIndex];
            const transformType = Object.keys(lastTransform)[0];
            const lastTransformData = lastTransform[transformType];

            lineageData.target.forEach((target, targetIndex) => {
                Object.entries(target.columns).forEach(([targetCol, targetSourceCols]) => {
                    targetSourceCols.forEach(sourceCol => {
                        Object.keys(lastTransformData.columns).forEach(transformOutputCol => {
                            const transformColName = getColumnName(transformOutputCol);
                            const sourceColName = getColumnName(sourceCol);

                            if (isSameColumnIgnoreCase(sourceCol, transformOutputCol) ||
                                isSameColumnIgnoreCase(sourceColName, transformColName) ||
                                sourceCol.toLowerCase().endsWith(`.${transformColName.toLowerCase()}`)) {
                                generatedEdges.push({
                                    id: `edge-${edgeId.current++}`,
                                    source: `transform-${lastTransformIndex}`,
                                    target: `target-${targetIndex}`,
                                    sourceHandle: `transform-${lastTransformIndex}-${transformOutputCol}-output`,
                                    targetHandle: `target-${targetIndex}-${targetCol}`,
                                    type: 'straight',
                                    style: { stroke: '#10b981', strokeWidth: 2 },
                                    markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' }
                                });
                            }
                        });
                    });
                });
            });
        }

        setNodes(generatedNodes);
        setAllEdges(generatedEdges);
        setEdges(generatedEdges);
    }, []);

    useEffect(() => {
        generateNodesAndEdges();
    }, [generateNodesAndEdges]);

    useEffect(() => {
        setNodes(currentNodes =>
            currentNodes.map(node => ({
                ...node,
                data: {
                    ...node.data,
                    selectedColumn,
                    onColumnClick: handleColumnClick
                }
            }))
        );
    }, [selectedColumn, handleColumnClick, setNodes]);

    const fetchTableDefinition = useCallback(async () => {
        if (!TableName || !apiBaseUrl) return;

        setTextLoading(true);
        setTextError(null);
        setTableDefinition('');

        try {
            const nameParts = TableName.split('.');
            if (nameParts.length < 3) {
                throw new Error("Invalid TableName format. Expected 'connection.schema.table'.");
            }
            const [connection, schema, table] = nameParts;

            const response = await fetch(`${apiBaseUrl}/text_view`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                },
                body: JSON.stringify({
                    "matched_policy_ids": policyIds,
                    "connection": connection,
                    "schema": schema,
                    "table": table,
                    "type": "table"
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred.' }));
                throw new Error(`HTTP ${response.status}: ${errorData.detail || 'Failed to fetch data.'}`);
            }

            const data = await response.json();
            setTableDefinition(data);

        } catch (err) {
            console.error('Error fetching table definition:', err);
            setTextError(err.message);
        } finally {
            setTextLoading(false);
        }
    }, [TableName, apiBaseUrl]);

    useEffect(() => {
        if (activeTab === 'text') {
            fetchTableDefinition();
        }
    }, [activeTab, fetchTableDefinition]);

    const handleCloseDetails = () => {
        setSelectedColumn(null);
        setSelectedColumnInfo(null);
        setEdges(allEdges);
    };

    return (
        <ReactFlowProvider>
            <div className="bg-gray-50 h-screen flex flex-col overflow-hidden">
                {type === "table" && (
                    <>
                        <div className="mb-1 px-4 py-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={onBackToLineage}
                                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 py-2 rounded-md transition-colors"
                                    >
                                        <ChevronLeft className="h-5 w-5 text-gray-700" />
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <Table className="h-6 w-6 text-[#8d77ba]" />
                                        <span className="text-lg font-semibold text-gray-800">
                                            {TableName?.split('.').pop()}
                                        </span>
                                    </div>
                                </div>
                                {/* {activeTab === 'map' && (
                                <DownloadButton nodes={nodes} TableName={TableName} />
                            )} */}
                            </div>
                        </div>
                    </>
                )}

                <div className="px-4">
                    <div className="flex space-x-4">
                        <button
                            className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'map'
                                ? 'text-[#8d77ba] border-b-2 border-[#8d77ba]'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setActiveTab('map')}
                        >
                            <Map className="h-4 w-4" />
                            Map
                        </button>
                        <button
                            className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'text'
                                ? 'text-[#8d77ba] border-b-2 border-[#8d77ba]'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setActiveTab('text')}
                        >
                            <Code className="h-4 w-4" />
                            Text
                        </button>
                    </div>
                </div>

                <div className={`flex-1 overflow-hidden transition-all duration-300 ${selectedColumn ? 'mr-80' : 'mr-0'}`}>
                    {activeTab === 'map' ? (
                        <div className="h-full relative">
                            <NavigationButtons
                                selectedColumn={selectedColumn}
                                columnInfo={selectedColumnInfo}
                                onBack={handleBack}
                                onForward={handleForward}
                                onClose={handleCloseDetails}
                            />
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                nodeTypes={nodeTypes}
                                fitView
                                fitViewOptions={{ padding: 100, minZoom: 0.5, maxZoom: 1.5 }}
                                className="bg-gray-50"
                                nodesDraggable={true}
                                nodesConnectable={false}
                                elementsSelectable={true}
                                minZoom={0.1}
                                maxZoom={2}
                            >
                                <Controls position="top-right" />
                                <Background variant="dots" gap={20} size={1} color="#e5e7eb" />
                            </ReactFlow>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col p-6 bg-white">
                            <div className="mb-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <Code className="h-5 w-5 text-[#8d77ba]" />
                                    <h2 className="text-xl font-semibold text-gray-800">Table Definition</h2>
                                </div>
                            </div>

                            {textLoading ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#8d77ba] mx-auto mb-3"></div>
                                        <p className="text-gray-500">Loading table definition...</p>
                                    </div>
                                </div>
                            ) : textError ? (
                                <div className="flex-1 flex items-center justify-center text-center">
                                    <div>
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 inline-block">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="h-5 w-5 text-red-600" />
                                                <p className="text-red-700 font-medium">Error loading definition</p>
                                            </div>
                                            <p className="text-red-600 text-sm mt-1">{textError}</p>
                                        </div>
                                        <div>
                                            <button
                                                onClick={fetchTableDefinition}
                                                className="px-4 py-2 bg-[#8d77ba] text-white rounded-lg hover:bg-[#7f6aa9] transition-colors"
                                            >
                                                Retry
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 rounded-lg overflow-hidden">
                                    <div className="h-full overflow-auto">
                                        {TableDefinition ? (
                                            <div className="text-sm text-gray-800">
                                                <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md border border-gray-200 font-mono">
                                                    {TableDefinition}
                                                </pre>
                                            </div>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                                <Code className="h-12 w-12 mb-3 opacity-50" />
                                                <p>No table definition available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </ReactFlowProvider>
    );
};

export default TableMappingPage;