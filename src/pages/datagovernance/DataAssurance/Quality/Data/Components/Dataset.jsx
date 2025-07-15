import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  ChevronDown,
  Play,
  Maximize2,
  Minimize2,
  Database,
  Clock,
  ChevronRight,
  Table as TableIcon,
  Type,
  Hash,
  X,
  ChevronLeft,
  ChevronRight as RightIcon,
} from 'lucide-react';
import { useAuth } from '../../../../../../context/AuthContext.jsx';
import { secureQuery } from '../../../../DataCatalogue/Components/function.js';
import { ToastContainer, toast } from 'react-toastify';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-mysql';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/ext-language_tools';

function Dataset({ query, setQuery, setQuerySuccess }) {
  const { token, hostnameV1, decodedToken } = useAuth();
  const [selectedTable, setSelectedTable] = useState('');
  const [isEditorMaximized, setIsEditorMaximized] = useState(false);
  const [isOutputMaximized, setIsOutputMaximized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('explorer');
  const [expandedItems, setExpandedItems] = useState({});
  const [connections, setConnections] = useState([]);
  const [schemas, setSchemas] = useState({});
  const [tables, setTables] = useState({});
  const [columns, setColumns] = useState({});
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);
  const [pageNo, setPageNo] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(query);

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const handleQueryChange = useCallback(
    debounce((newValue) => {
      if (newValue !== query) {
        setQuerySuccess(false);
      }
    }, 500),
    [setQuerySuccess, query]
  );

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        setConnectionsLoading(true);
        const secureQueryResponse = await secureQuery({ user_query: '' }, token);
        const policyIds = secureQueryResponse.matched_policy_ids || [];

        if (policyIds.length === 0) {
          setConnections([]);
          setConnectionsLoading(false);
          return;
        }

        const response = await fetch(`${hostnameV1}/connections/list`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ matched_policy_ids: policyIds }),
        });

        if (!response.ok) throw new Error('Failed to fetch connections');
        const connectionsData = await response.json();
        setConnections(connectionsData);
      } catch (error) {
        console.error('Error fetching connections:', error);
        toast.error('Failed to load connections');
      } finally {
        setConnectionsLoading(false);
      }
    };

    fetchConnections();
  }, [token, hostnameV1]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setHistoryLoading(true);
        const response = await fetch(`${hostnameV1}/scores/data/history`, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ owner: decodedToken?.preferred_username }),
        });

        if (!response.ok) throw new Error('Failed to fetch history');
        const historyData = await response.json();
        const historyConnections = historyData.connections || [];

        const connectionNames = connections.map((conn) => conn.connection_name);
        const filteredHistory = historyConnections.filter((conn) => connectionNames.includes(conn));

        setHistoryItems(filteredHistory);
      } catch (error) {
        console.error('Error fetching history:', error);
        toast.error('Failed to load history');
      } finally {
        setHistoryLoading(false);
      }
    };

    if (connections.length > 0) {
      fetchHistory();
    }
  }, [connections, token, hostnameV1, decodedToken]);

  const toggleExpand = async (itemName, connection, schema, table) => {
    if (connection && !schema && !table) {
      if (!expandedItems[itemName] && !schemas[connection]) {
        await fetchSchemas(connection);
      }
    } else if (connection && schema && !table) {
      if (!expandedItems[itemName] && !tables[`${connection}-${schema}`]) {
        await fetchTables(connection, schema);
      }
    } else if (connection && schema && table) {
      if (!expandedItems[itemName] && !columns[`${connection}-${schema}-${table}`]) {
        await fetchColumns(connection, schema, table);
      }
    }

    setExpandedItems((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  const fetchSchemas = async (connection) => {
    try {
      setSchemas((prev) => ({ ...prev, [connection]: 'loading' }));
      const secureQueryResponse = await secureQuery({ user_query: '' }, token);
      const policyIds = secureQueryResponse.matched_policy_ids || [];

      if (policyIds.length === 0) {
        setSchemas((prev) => ({ ...prev, [connection]: [] }));
        return;
      }

      const response = await fetch(`${hostnameV1}/schemas/list`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matched_policy_ids: policyIds,
          connection_name: connection,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch schemas');
      const data = await response.json();
      const connectionData = data.find((item) => item[connection]);
      const schemaNames = connectionData ? connectionData[connection] : [];

      setSchemas((prev) => ({
        ...prev,
        [connection]: schemaNames.length > 0 ? schemaNames : [],
      }));
    } catch (error) {
      console.error('Error fetching schema data:', error);
      setSchemas((prev) => ({ ...prev, [connection]: 'error' }));
      toast.error('Failed to load schemas');
    }
  };

  const fetchTables = async (connection, schema) => {
    try {
      setTables((prev) => ({ ...prev, [`${connection}-${schema}`]: 'loading' }));
      const secureQueryResponse = await secureQuery({ user_query: '' }, token);
      const policyIds = secureQueryResponse.matched_policy_ids || [];

      if (policyIds.length === 0) {
        setTables((prev) => ({ ...prev, [`${connection}-${schema}`]: [] }));
        return;
      }

      const response = await fetch(`${hostnameV1}/tables/list`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matched_policy_ids: policyIds,
          connection_name: connection,
          schema_name: [schema],
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch tables');
      const data = await response.json();
      const schemaData = data.schemas?.find(
        (item) => item.connection_name === connection && item.schema === schema
      );
      const tableNames = schemaData?.tables || [];

      setTables((prev) => ({
        ...prev,
        [`${connection}-${schema}`]: tableNames.length > 0 ? tableNames : [],
      }));
    } catch (error) {
      console.error('Error fetching table data:', error);
      setTables((prev) => ({ ...prev, [`${connection}-${schema}`]: 'error' }));
      toast.error('Failed to load tables');
    }
  };

  const fetchColumns = async (connection, schema, table) => {
    try {
      setColumns((prev) => ({ ...prev, [`${connection}-${schema}-${table}`]: 'loading' }));
      const secureQueryResponse = await secureQuery({ user_query: '' }, token);
      const policyIds = secureQueryResponse.matched_policy_ids || [];

      if (policyIds.length === 0) {
        setColumns((prev) => ({ ...prev, [`${connection}-${schema}-${table}`]: [] }));
        return;
      }

      const response = await fetch(`${hostnameV1}/columns/list`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matched_policy_ids: policyIds,
          connection_name: connection,
          schema_name: [schema],
          table_name: [table],
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch columns');
      const data = await response.json();
      const tableData = data.columns?.find(
        (item) => item.connection_name === connection && item.schema === schema && item.table_name === table
      );
      const columnData = tableData?.columns || [];
      const formattedColumns = columnData.map((item) => ({
        column: item.column_name,
        datatype: item.metadata?.DATA_TYPE || 'unknown',
        metadata: item.metadata,
      }));

      setColumns((prev) => ({
        ...prev,
        [`${connection}-${schema}-${table}`]: formattedColumns.length > 0 ? formattedColumns : [],
      }));
    } catch (error) {
      console.error('Error fetching column data:', error);
      setColumns((prev) => ({ ...prev, [`${connection}-${schema}-${table}`]: 'error' }));
      toast.error('Failed to load columns');
    }
  };

  const handleSelectTable = (connection, schema, table) => {
    const fullTableName = `${connection}.${schema}.${table}`;
    setSelectedTable(fullTableName);
    const newQuery = `SELECT * FROM ${fullTableName}`;
    setSelectedQuery(newQuery);
    setQuery(newQuery);
    setData([]);
    setColumnDefs([]);
    setQuerySuccess(false);
  };

  const executeQuery = async (query, page = 1) => {
    if (!query.trim()) {
      toast.error('Please enter a query');
      return;
    }

    setLoading(true);
    setData([]);
    setColumnDefs([]);
    setPageNo(page);

    try {
      const secureQueryResponse = await fetch(`${hostnameV1}/secure-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_query: query }),
      });

      if (!secureQueryResponse.ok) {
        const errData = await secureQueryResponse.json();
        toast.error(errData.detail || 'Error in query validation');
        throw new Error(errData.detail || 'Query validation failed');
      }

      const secureData = await secureQueryResponse.json();
      const secureQuery = secureData.secure_query;

      const executeResponse = await fetch(`${hostnameV1}/rules/executequery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: secureQuery,
          page: page,
        }),
      });

      if (!executeResponse.ok) {
        const errorData = await executeResponse.json();
        throw new Error(errorData.detail || 'Query execution failed');
      }

      const responseText = await executeResponse.text();
      const rows = responseText.trim().split('\n').map((row) => JSON.parse(row));

      if (rows.length > 0) {
        setColumnDefs(Object.keys(rows[0]));
        setData(rows);
        setHasMore(rows.length === 100);
        setQuerySuccess(true);
      } else {
        setData([]);
        setHasMore(false);
        setQuerySuccess(false);
      }
    } catch (error) {
      console.error('Error executing query:', error);
      toast.error(error.message || 'Failed to execute query');
      setQuerySuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRunQuery = () => {
    executeQuery(selectedQuery, 1);
    setQuery(selectedQuery);
  };

  const handleNextPage = () => {
    executeQuery(selectedQuery, pageNo + 1);
  };

  const handlePreviousPage = () => {
    if (pageNo > 1) {
      executeQuery(selectedQuery, pageNo - 1);
    }
  };

  const renderDatabaseLabel = (connection) => {
    const connectionId = `conn-${connection.connection_name}`;
    const isExpanded = expandedItems[connectionId];
    return (
      <div
        className="flex items-center px-4 py-1 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
        onClick={() => toggleExpand(connectionId, connection.connection_name)}
      >
        {isExpanded ? (
          <ChevronDown size={14} className="mr-2 text-gray-400" />
        ) : (
          <ChevronRight size={14} className="mr-2 text-gray-400" />
        )}
        <Database size={14} className="mr-2 text-gray-400" />
        <span className="truncate">{connection.connection_name}</span>
      </div>
    );
  };

  const renderSchemaLabel = (connection, schema) => {
    const schemaId = `schema-${connection}-${schema}`;
    const isExpanded = expandedItems[schemaId];
    return (
      <div
        className="flex items-center px-4 py-1 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
        onClick={() => toggleExpand(schemaId, connection, schema)}
      >
        {isExpanded ? (
          <ChevronDown size={14} className="mr-2 text-gray-400" />
        ) : (
          <ChevronRight size={14} className="mr-2 text-gray-400" />
        )}
        <Database size={14} className="mr-2 text-gray-400" />
        <span className="truncate">{schema}</span>
      </div>
    );
  };

  const renderTableLabel = (connection, schema, table) => {
    const tableId = `table-${connection}-${schema}-${table}`;
    const isExpanded = expandedItems[tableId];
    return (
      <div
        className="flex items-center px-4 py-1 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
        onClick={() => toggleExpand(tableId, connection, schema, table)}
      >
        {isExpanded ? (
          <ChevronDown size={14} className="mr-2 text-gray-400" />
        ) : (
          <ChevronRight size={14} className="mr-2 text-gray-400" />
        )}
        <TableIcon size={14} className="mr-2 text-gray-400" />
        <span className="truncate" onDoubleClick={() => handleSelectTable(connection, schema, table)}>
          {table}
        </span>
      </div>
    );
  };

  const renderColumnLabel = (column) => {
    const isNumber =
      column.datatype.split('(')[0] === 'int' ||
      column.datatype.split('(')[0] === 'integer' ||
      column.datatype.split('(')[0] === 'decimal' ||
      column.datatype.split('(')[0] === 'double';

    return (
      <div className="flex items-center px-4 py-1 text-sm text-gray-700 pl-8">
        {isNumber ? (
          <Hash size={14} className="mr-2 text-gray-400" />
        ) : (
          <Type size={14} className="mr-2 text-gray-400" />
        )}
        <span className="truncate">{column.column}</span>
      </div>
    );
  };

  const toggleEditorMaximize = () => {
    setIsEditorMaximized(!isEditorMaximized);
    setIsOutputMaximized(false);
  };

  const toggleOutputMaximize = () => {
    setIsOutputMaximized(!isOutputMaximized);
    setIsEditorMaximized(false);
  };

  return (
    <div className="w-full h-[calc(100vh-190px)]">
      <div className="flex gap-5 h-full">
        {!(isEditorMaximized || isOutputMaximized) && (
          <div className="w-[280px] bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="flex border-b border-gray-200">
              <button
                className={`flex-1 py-3 font-medium flex items-center justify-center gap-2
                  ${activeTab === 'explorer' ? 'text-[#8d77ba] border-b-2 border-[#8d77ba]' : 'text-gray-600'}`}
                onClick={() => setActiveTab('explorer')}
              >
                <Database size={16} />
                Explorer
              </button>
              <button
                className={`flex-1 py-3 font-medium flex items-center justify-center gap-2
                  ${activeTab === 'history' ? 'text-[#8d77ba] border-b-2 border-[#8d77ba]' : 'text-gray-600'}`}
                onClick={() => setActiveTab('history')}
              >
                <Clock size={16} />
                History
              </button>
            </div>

            <div className="flex items-center mx-4 my-3 px-2.5 py-1.5 border border-gray-200 rounded bg-gray-50">
              <Search size={14} className="text-gray-500" />
              <input
                type="text"
                placeholder={activeTab === 'explorer' ? 'Search databases...' : 'Search history...'}
                className="w-full border-none bg-transparent px-2 text-xs outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <X size={14} className="text-gray-500 cursor-pointer" onClick={() => setSearchTerm('')} />
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeTab === 'explorer' ? (
                <div>
                  {connectionsLoading ? (
                    <div className="flex justify-center items-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#8d77ba]"></div>
                    </div>
                  ) : connections.length === 0 ? (
                    <div className="text-gray-500 text-sm p-4">No connections available</div>
                  ) : (
                    connections
                      .filter((connection) =>
                        connection.connection_name.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((connection) => {
                        const connectionId = `conn-${connection.connection_name}`;
                        const connectionSchemas = schemas[connection.connection_name];
                        const isExpanded = expandedItems[connectionId];

                        return (
                          <div key={connection.connection_name} className="mb-0.5">
                            {renderDatabaseLabel(connection)}

                            {isExpanded && (
                              <div className="pl-6">
                                {connectionSchemas === 'loading' && (
                                  <div className="px-4 py-1 text-sm text-gray-500">Loading schemas...</div>
                                )}
                                {connectionSchemas === 'error' && (
                                  <div className="px-4 py-1 text-sm text-red-500">Error loading schemas</div>
                                )}
                                {Array.isArray(connectionSchemas) && connectionSchemas.length === 0 && (
                                  <div className="px-4 py-1 text-sm text-gray-500">No schemas available</div>
                                )}
                                {Array.isArray(connectionSchemas) &&
                                  connectionSchemas.length > 0 &&
                                  connectionSchemas
                                    .filter((schema) => schema.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((schema, schemaIndex) => {
                                      const schemaId = `schema-${connection.connection_name}-${schema}`;
                                      const tableData = tables[`${connection.connection_name}-${schema}`];
                                      const isSchemaExpanded = expandedItems[schemaId];

                                      return (
                                        <div key={`${schema}-${schemaIndex}`}>
                                          {renderSchemaLabel(connection.connection_name, schema)}

                                          {isSchemaExpanded && (
                                            <div className="pl-6">
                                              {tableData === 'loading' && (
                                                <div className="px-4 py-1 text-sm text-gray-500">
                                                  Loading tables...
                                                </div>
                                              )}
                                              {tableData === 'error' && (
                                                <div className="px-4 py-1 text-sm text-red-500">
                                                  Error loading tables
                                                </div>
                                              )}
                                              {Array.isArray(tableData) && tableData.length === 0 && (
                                                <div className="px-4 py-1 text-sm text-gray-500">
                                                  No tables available
                                                </div>
                                              )}
                                              {Array.isArray(tableData) &&
                                                tableData.length > 0 &&
                                                tableData
                                                  .filter((table) =>
                                                    table.toLowerCase().includes(searchTerm.toLowerCase())
                                                  )
                                                  .map((table, tableIndex) => {
                                                    const tableId = `table-${connection.connection_name}-${schema}-${table}`;
                                                    const columnData =
                                                      columns[`${connection.connection_name}-${schema}-${table}`];
                                                    const isTableExpanded = expandedItems[tableId];

                                                    return (
                                                      <div key={`${table}-${tableIndex}`}>
                                                        {renderTableLabel(connection.connection_name, schema, table)}

                                                        {isTableExpanded && (
                                                          <div className="pl-6">
                                                            {columnData === 'loading' && (
                                                              <div className="px-4 py-1 text-sm text-gray-500">
                                                                Loading columns...
                                                              </div>
                                                            )}
                                                            {columnData === 'error' && (
                                                              <div className="px-4 py-1 text-sm text-red-500">
                                                                Error loading columns
                                                              </div>
                                                            )}
                                                            {Array.isArray(columnData) && columnData.length === 0 && (
                                                              <div className="px-4 py-1 text-sm text-gray-500">
                                                                No columns available
                                                              </div>
                                                            )}
                                                            {Array.isArray(columnData) &&
                                                              columnData.length > 0 &&
                                                              columnData
                                                                .filter((column) =>
                                                                  column.column
                                                                    .toLowerCase()
                                                                    .includes(searchTerm.toLowerCase())
                                                                )
                                                                .map((column, columnIndex) => (
                                                                  <div key={`${column.column}-${columnIndex}`}>
                                                                    {renderColumnLabel(column)}
                                                                  </div>
                                                                ))}
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                              </div>
                            )}
                          </div>
                        );
                      })
                  )}
                </div>
              ) : (
                <div>
                  {historyLoading ? (
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#8d77ba]"></div>
                    </div>
                  ) : historyItems.length === 0 ? (
                    <div className="text-gray-500 text-sm pl-4">No history available</div>
                  ) : (
                    historyItems
                      .filter((item) => item.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((item, index) => (
                        <div
                          key={index}
                          className={`px-4 py-2 text-sm cursor-pointer rounded
                          ${selectedTable.includes(item) ? 'text-[#8d77ba] bg-[#8d77ba10]' : 'text-gray-700 hover:bg-gray-50'}`}
                          onClick={() => {
                            let found = false;
                            for (const connection of connections) {
                              const schemasList = schemas[connection.connection_name] || [];
                              for (const schema of schemasList) {
                                const tablesList = tables[`${connection.connection_name}-${schema}`] || [];
                                if (tablesList.includes(item)) {
                                  handleSelectTable(connection.connection_name, schema, item);
                                  found = true;
                                  break;
                                }
                              }
                              if (found) break;
                            }
                          }}
                        >
                          {item}
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div
          className={`${isEditorMaximized || isOutputMaximized
              ? 'flex-1' 
              : 'flex-1 flex flex-col gap-5' 
            } min-w-0 h-full`} 
        >
          {!isOutputMaximized && (
            <div
              className={`bg-white rounded-lg shadow-sm overflow-hidden ${isEditorMaximized ? 'h-full' : 'flex-1'} flex flex-col`}
            >
              <div className="flex justify-between items-center p-3 border-b border-gray-100">
                <div className="font-medium text-gray-800">Editor</div>
                <div className="flex gap-2">
                  <button
                    className="flex items-center gap-2 bg-[#8d77ba] text-white rounded px-3 py-1 text-sm font-medium hover:bg-[#7d69a8] transition"
                    onClick={handleRunQuery}
                    disabled={loading}
                  >
                    {loading ? 'Running...' : 'Run query'}
                    <Play size={14} />
                  </button>
                  <button className="text-gray-500 p-1 hover:bg-gray-50 rounded" onClick={toggleEditorMaximize}>
                    {isEditorMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                  <button
                    className="text-gray-500 p-1 hover:bg-gray-50 rounded"
                    onClick={() => {
                      setSelectedQuery('');
                      setSelectedTable('');
                      setData([]);
                      setColumnDefs([]);
                      setQuerySuccess(false);
                      setQuery('');
                    }}
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-white overflow-hidden">
                <AceEditor
                  mode="mysql"
                  theme="github"
                  name="query-editor"
                  fontSize={14}
                  width="100%"
                  height="100%"
                  value={selectedQuery}
                  onChange={(newValue) => {
                    setSelectedQuery(newValue);
                    setQuery(newValue);
                    handleQueryChange(newValue);
                  }}
                  setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                    showLineNumbers: true,
                    tabSize: 2,
                  }}
                  placeholder="Write your SQL query here..."
                  editorProps={{ $blockScrolling: true }}
                />
              </div>
            </div>
          )}

          {(loading || data.length > 0 || columnDefs.length > 0) &&
            !isEditorMaximized && (
              <div
                className={`bg-white rounded-lg shadow-sm overflow-hidden ${isOutputMaximized ? 'h-full' : 'flex-1'
                  } flex flex-col`}
              >
                <div className="flex justify-between items-center px-3 py-2 border-b border-gray-100">
                  <div className="font-medium text-gray-800">Output</div>
                  <button
                    className="text-gray-500 p-1 hover:bg-gray-50 rounded"
                    onClick={toggleOutputMaximize}
                  >
                    {isOutputMaximized ? (
                      <Minimize2 size={16} />
                    ) : (
                      <Maximize2 size={16} />
                    )}
                  </button>
                </div>

                <div className="flex-1 overflow-auto">
                  {loading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8d77ba]"></div>
                    </div>
                  ) : data.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-gray-500">
                      No data returned
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 table-fixed">
                        <thead className="sticky top-0 bg-[#29304a] text-white">
                          <tr>
                            {columnDefs.map((column, index) => (
                              <th
                                key={index}
                                scope="col"
                                className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider truncate"
                                style={{ maxWidth: '200px' }} 
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {data.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {columnDefs.map((column, colIndex) => (
                                <td
                                  key={colIndex}
                                  className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 truncate"
                                  style={{ maxWidth: '200px' }} 
                                  title={row[column]}
                                >
                                  {row[column]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {data.length > 0 && (
                  <div className="flex justify-between items-center px-3 py-2 border-t border-gray-100">
                    <div className="text-sm text-gray-500">Page {pageNo}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={handlePreviousPage}
                        disabled={pageNo === 1}
                        className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${pageNo === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        <ChevronLeft size={16} />
                        Previous
                      </button>
                      <button
                        onClick={handleNextPage}
                        disabled={!hasMore}
                        className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${!hasMore
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        Next
                        <RightIcon size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default Dataset;