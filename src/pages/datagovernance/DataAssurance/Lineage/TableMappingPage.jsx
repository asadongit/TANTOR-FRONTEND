import React, { useState, useEffect, useCallback } from 'react';
import { Table, ChevronLeft, Code, Map, AlertCircle } from 'lucide-react';
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

const SourceTableNode = ({ data }) => {
    return (
        <div className="bg-white border-2 border-blue-300 rounded-lg shadow-lg min-w-[200px]">
            <div className="bg-blue-100 px-3 py-2 rounded-t-lg border-b">
                <div className="flex items-center gap-2">
                    <Table className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-sm text-blue-800">{data.tableName}</span>
                </div>
            </div>
            <div className="p-2">
                {data.columns?.map((column, index) => (
                    <div key={index} className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded text-xs">
                        <span className="text-gray-700">{column}</span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={`${data.id}-${column}`}
                            className="!w-2 !h-2 !bg-blue-500 !border-blue-600"
                            style={{ top: 'auto', transform: 'none', position: 'relative' }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

const TransformationNode = ({ data }) => {
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
                    const isAffected = data.affectedColumns?.some(affected =>
                        affected.includes(columnName) || affected === column
                    );

                    return (
                        <div key={index} className="flex items-center justify-between py-1 px-2 hover:bg-white/50 rounded text-xs">
                            <Handle
                                type="target"
                                position={Position.Left}
                                id={`${data.id}-${column}-input`}
                                className="!w-2 !h-2 !bg-gray-500 !border-gray-600"
                                style={{ top: 'auto', transform: 'none', position: 'relative' }}
                            />
                            <span className={`text-center flex-1 mx-2 ${isAffected ? 'font-bold bg-yellow-200 px-1 rounded border border-yellow-400' : ''}`}>
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
    return (
        <div className="bg-white border-2 border-green-300 rounded-lg shadow-lg min-w-[200px]">
            <div className="bg-green-100 px-3 py-2 rounded-t-lg border-b">
                <div className="flex items-center gap-2">
                    <Table className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-sm text-green-800">{data.tableName}</span>
                </div>
            </div>
            <div className="p-2">
                {data.columns?.map((column, index) => (
                    <div key={index} className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded text-xs">
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={`${data.id}-${column}`}
                            className="!w-2 !h-2 !bg-green-500 !border-green-600"
                            style={{ top: 'auto', transform: 'none', position: 'relative' }}
                        />
                        <span className="text-gray-700 ml-2">{column}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const nodeTypes = {
    sourceTable: SourceTableNode,
    transformation: TransformationNode,
    targetTable: TargetTableNode,
};

const TableMappingPage = ({ TableName, apiBaseUrl, onBackToLineage }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
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
            "arithmetic": {
                "transformation_order": 1,
                "column_affected":["orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY"],
                "columns": {
		           "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.FIRST_NAME": [
                     "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.FIRST_NAME"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.LAST_NAME": [
                     "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.LAST_NAME"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID",
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY"
                    ],
					"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.DEPARTMENT_ID": [
              "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.DEPARTMENT_ID"
            ]
                }
            }
        },
        {
            "string": {
                "transformation_order": 2,
				"column_affected":["orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.fullname"],
                "columns": {
				 "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.FIRST_NAME": [
                     "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.FIRST_NAME"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.LAST_NAME": [
                     "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.LAST_NAME"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY"
                    ],
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.fullname": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.FIRST_NAME",
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.LAST_NAME"
                    ],
					"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.DEPARTMENT_ID": [
              "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.DEPARTMENT_ID"
            ]
                },
                "transformation_operator": "concat"
            }
        },
        {
            "constantcopy": {
                "transformation_order": 3,
				"column_affected":["orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.newdatecol"],
                "columns": {
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.newdatecol": [
                        ""
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.FIRST_NAME": [
                     "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.FIRST_NAME"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.LAST_NAME": [
                     "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.LAST_NAME"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY"
                    ],
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.fullname": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.fullname"
                    ],
					"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.DEPARTMENT_ID": [
              "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.DEPARTMENT_ID"
            ]
                }
            }
        },
        {
            "join": {
                "transformation_order": 3,
				"join_operator": "== ",
				 "join_type": "inner",
                "columns_used":["orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.DEPARTMENT_ID","orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_ID"],
				"column_affected":["orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.DEPARTMENT_ID","orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_ID"],
        "columns": {
        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.newdatecol":[
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.newdatecol"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.LAST_NAME": [
                     "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.LAST_NAME"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.FIRST_NAME": [
                     "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.FIRST_NAME"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY"
                    ],
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.fullname": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.fullname"
                    ],
					"orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_ID": [
              "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_ID"
            ],
                    "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_NAME": [
                        "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_NAME"
                    ],
                  "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.LOCATION": [
                        "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.LOCATION"
                    ] 
                }
            }
        },
        {
            "rename": {
                "transformation_order": 4,
				"column_affected":["orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.Standardname"],
                "columns": {
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.newdatecol": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.newdatecol"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.FIRST_NAME": [
                     "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.FIRST_NAME"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.LAST_NAME": [
                     "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.LAST_NAME"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.Standardname": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.fullname"
                    ],
					"orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_ID": [
              "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_ID"
            ],
                    "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_NAME": [
                        "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_NAME"
                    ],
                  "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.LOCATION": [
                        "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.LOCATION"
                    ] 
                }
            }
        },
        {
            "filter": {
                "transformation_order": 5,
				"column_affected":["orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID"],
                "columns": {
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.newdatecol": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.newdatecol"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.FIRST_NAME": [
                     "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.FIRST_NAME"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.LAST_NAME": [
                     "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.LAST_NAME"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standardname": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standardname"
                    ],
					"orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_ID": [
              "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_ID"
            ],
                    "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_NAME": [
                        "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_NAME"
                    ],
                  "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.LOCATION": [
                        "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.LOCATION"
                    ] 
                }
            }
        },
        {
            "date": {
                "transformation_order": 6,
				"column_affected":["orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standarddatecol"],
                "columns": {
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.newdatecol": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.newdatecol"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.FIRST_NAME": [
                     "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.FIRST_NAME"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.LAST_NAME": [
                     "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.LAST_NAME"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standardname": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standardname"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standarddate": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.newdatecol"
                    ],
					"orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_ID": [
              "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_ID"
            ],
                    "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_NAME": [
                        "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_NAME"
                    ],
                  "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.LOCATION": [
                        "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.LOCATION"
                    ] 
                }
            }
        },
        {
            "restrictcolumns": {
                "transformation_order": 7,
				"column_affected":[
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.FIRST_NAME"
                ],
                "columns": {
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.newdatecol": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.newdatecol"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standardname": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standardname"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standarddate": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standarddate"
                    ],
					"orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_ID": [
              "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_ID"
            ],
                    "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_NAME": [
                        "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_NAME"
                    ],
                  "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.LOCATION": [
                        "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.LOCATION"
                    ] 
                },
                "transformation_operator": "drop"
            }
        },
        {
            "typecast": {
                "transformation_order": 8,
				"column_affected":[
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID"
                ],
                "columns": {
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.newdatecol": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.newdatecol"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standardname": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standardname"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standarddate": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standarddate"
                    ],
					"orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_ID": [
              "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_ID"
            ],
                    "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_NAME": [
                        "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_NAME"
                    ],
                  "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.LOCATION": [
                        "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.LOCATION"
                    ] 
                }
            }
        },
        {
            "sorting": {
                "transformation_order": 9,
				"column_affected":[
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID",
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.Standardname"
                ],
        "order":{
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID": "desc",
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.Standardname": "asc"
                },
                "columns": {
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.newdatecol": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.newdatecol"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standardname": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standardname"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standarddate": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standarddate"
                    ],
					"orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_ID": [
              "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_ID"
            ],
                    "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_NAME": [
                        "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_NAME"
                    ],
                  "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.LOCATION": [
                        "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.LOCATION"
                    ] 
                }
            }
        },
        {
            "ranking": {
                "transformation_order": 10,
				"column_affected":[
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.rankcolumn"
                ],
                "columns": {
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.newdatecol": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.newdatecol"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standardname": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standardname"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standarddate": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standarddate"
                    ],
					"orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_ID": [
              "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_ID"
            ],
                    "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_NAME": [
                        "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_NAME"
                    ],
                  "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.LOCATION": [
                        "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.LOCATION"
                    ],
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.rankcolumn": [
                    ""
                    ]
                }
            }
        },
		{
            "expression": {
                "transformation_order": 11,
				"column_affected":[
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.expression"
                ],
                "columns": {
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.newdatecol": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.newdatecol"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY"
                    ],
                "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standardname": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standardname"
                    ],
				"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standarddate": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standarddate"
                    ],
					"orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_ID": [
              "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_ID"
            ],
                    "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_NAME": [
                        "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_NAME"
                    ],
                  "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.LOCATION": [
                        "orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.LOCATION"
                    ],
                  "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.rankcolumn": [
                        "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.rankcolumn"
                    ],
					"orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.expression": [
                    ""
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
                "department_name":["orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.DEPARTMENT_NAME"],
                "employee_id": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID"
                ],
                "employee_name": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standardname"
                ],
                "location":["orcl_lineage_etl.test_user1.LINEAGE_DEPARTMENTS.LOCATION"],
                "original_salary": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.SALARY"
                ],
                "report_generated_at": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.standarddatecol"
                ],
                "report_id": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.EMPLOYEE_ID"
                ],
                "total_compensation": [
                    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.rankcolumn"
                ],
				"Expression":[
				    "orcl_lineage_etl.test_user1.LINEAGE_EMPLOYEES.expression"
				]
            }
        }
    ]
}


    const generateNodesAndEdges = useCallback(() => {
        const generatedNodes = [];
        const generatedEdges = [];
        let nodeId = 0;

        lineageData.source.forEach((source, sourceIndex) => {
            const tableName = source.table.split('.').pop();
            const columns = Object.keys(source.columns);
            generatedNodes.push({
                id: `source-${sourceIndex}`,
                type: 'sourceTable',
                position: { x: 50, y: sourceIndex * 300 + 50 },
                data: { id: `source-${sourceIndex}`, tableName, columns }
            });
        });

        const sortedTransformations = [...lineageData.transformation].sort((a, b) => {
            const aType = Object.keys(a)[0];
            const bType = Object.keys(b)[0];
            return a[aType].transformation_order - b[bType].transformation_order;
        });

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
                    order: transformData.transformation_order,
                }
            });
        });

        lineageData.target.forEach((target, targetIndex) => {
            const tableName = target.table.split('.').pop();
            const columns = Object.keys(target.columns);
            generatedNodes.push({
                id: `target-${targetIndex}`,
                type: 'targetTable',
                position: { x: 1200, y: targetIndex * 300 + 150 },
                data: { id: `target-${targetIndex}`, tableName, columns }
            });
        });

        const edgeId = { current: 0 };
        const getColumnName = (fullPath) => fullPath.split('.').pop();
        const isDirectSourceColumn = (columnPath) => lineageData.source.some(source =>
            Object.keys(source.columns).some(sourceCol =>
                columnPath.toLowerCase() === `${source.table}.${sourceCol}`.toLowerCase()
            )
        );
        const isAvailableFromPreviousTransform = (columnPath, currentTransformIndex) => {
            if (currentTransformIndex === 0) return false;
            const prevTransform = sortedTransformations[currentTransformIndex - 1];
            const prevType = Object.keys(prevTransform)[0];
            const prevData = prevTransform[prevType];
            return Object.keys(prevData.columns).some(prevOutputCol =>
                columnPath.toLowerCase() === prevOutputCol.toLowerCase()
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
                            if (joinColumn.toLowerCase() === sourceFullPath.toLowerCase()) {
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

            Object.entries(transformData.columns).forEach(([transformOutputCol, inputCols]) => {
                inputCols.forEach(inputCol => {
                    if (!inputCol) return;
                    if (transformIndex > 0 && isAvailableFromPreviousTransform(inputCol, transformIndex)) {
                        const prevTransform = sortedTransformations[transformIndex - 1];
                        const prevType = Object.keys(prevTransform)[0];
                        const prevData = prevTransform[prevType];
                        Object.keys(prevData.columns).forEach(prevOutputCol => {
                            if (inputCol.toLowerCase() === prevOutputCol.toLowerCase()) {
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
                    } else if (isDirectSourceColumn(inputCol)) {
                        lineageData.source.forEach((source, sourceIndex) => {
                            Object.keys(source.columns).forEach(sourceColumnName => {
                                if (inputCol.toLowerCase() === `${source.table}.${sourceColumnName}`?.toLowerCase()) {
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
                            if (sourceCol === transformOutputCol || sourceColName === transformColName || sourceCol.endsWith(`.${transformColName}`)) {
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
        setEdges(generatedEdges);
    }, [setNodes, setEdges]);

    useEffect(() => {
        generateNodesAndEdges();
    }, [generateNodesAndEdges]);

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
                    "matched_policy_ids": [362],
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

    return (
        <div className="bg-gray-50 h-screen flex flex-col overflow-hidden p-2">
            <Breadcrumb />
            {/* Header */}
            <div className="mb-1">
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
                                {TableName}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

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

            <div className="flex-1 overflow-hidden">
                {activeTab === 'map' ? (
                    <div className="h-full">
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
                            <Controls showInteractive={false} />
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
    );
};

export default TableMappingPage;