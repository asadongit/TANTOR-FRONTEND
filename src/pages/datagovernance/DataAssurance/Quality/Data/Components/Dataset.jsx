import React, { useState, useEffect } from 'react'
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
  X
} from 'lucide-react'
import { useAuth } from '../../../../../../context/AuthContext.jsx';
import { secureQuery } from '../../../../DataCatalogue/Components/function.js';
import { toast } from 'react-toastify'

function Dataset() {
  const { token, hostnameV1 } = useAuth()
  const [selectedTable, setSelectedTable] = useState('')
  const [editorContent, setEditorContent] = useState('')
  const [expandedItems, setExpandedItems] = useState({})
  const [activeTab, setActiveTab] = useState('explorer')
  const [isEditorMaximized, setIsEditorMaximized] = useState(false)
  const [isOutputMaximized, setIsOutputMaximized] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [connections, setConnections] = useState([])
  const [schemas, setSchemas] = useState({})
  const [tables, setTables] = useState({})
  const [columns, setColumns] = useState({})
  const [connectionsLoading, setConnectionsLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyItems, setHistoryItems] = useState([])

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        setConnectionsLoading(true)
        const secureQueryResponse = await secureQuery({ user_query: '' }, token)
        const policyIds = secureQueryResponse.matched_policy_ids || []
        
        if (policyIds.length === 0) {
          setConnections([])
          setConnectionsLoading(false)
          return
        }
        
        const response = await fetch(`${hostnameV1}/connections/list`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ matched_policy_ids: policyIds })
        })
        
        if (!response.ok) throw new Error('Failed to fetch connections')
        const connectionsData = await response.json()
        setConnections(connectionsData)
      } catch (error) {
        console.error('Error fetching connections:', error)
        toast.error('Failed to load connections')
      } finally {
        setConnectionsLoading(false)
      }
    }
    
    fetchConnections()
  }, [token, hostnameV1])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      return
    }
    
    const filteredConnections = connections.filter(connection =>
      connection.connection_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm, connections])

  const toggleExpand = async (itemName, connection, schema, table) => {
    if (connection && !schema && !table) {
      if (!expandedItems[itemName] && !schemas[connection]) {
        await fetchSchemas(connection)
      }
    }

    else if (connection && schema && !table) {
      if (!expandedItems[itemName] && !tables[`${connection}-${schema}`]) {
        await fetchTables(connection, schema)
      }
    }
    else if (connection && schema && table) {
      if (!expandedItems[itemName] && !columns[`${connection}-${schema}-${table}`]) {
        await fetchColumns(connection, schema, table)
      }
    }
    
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }))
  }

  const fetchSchemas = async (connection) => {
    try {
      setSchemas(prev => ({ ...prev, [connection]: 'loading' }))
      const secureQueryResponse = await secureQuery({ user_query: '' }, token)
      const policyIds = secureQueryResponse.matched_policy_ids || []
      
      if (policyIds.length === 0) {
        setSchemas(prev => ({ ...prev, [connection]: [] }))
        return
      }
      
      const response = await fetch(`${hostnameV1}/schemas/list`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matched_policy_ids: policyIds,
          connection_name: connection
        })
      })
      
      if (!response.ok) throw new Error('Failed to fetch schemas')
      const data = await response.json()
      const connectionData = data.find(item => item[connection])
      const schemaNames = connectionData ? connectionData[connection] : []
      
      setSchemas(prev => ({
        ...prev,
        [connection]: schemaNames.length > 0 ? schemaNames : [],
      }))
    } catch (error) {
      console.error('Error fetching schema data:', error)
      setSchemas(prev => ({ ...prev, [connection]: 'error' }))
      toast.error('Failed to load schemas')
    }
  }

  const fetchTables = async (connection, schema) => {
    try {
      setTables(prev => ({ ...prev, [`${connection}-${schema}`]: 'loading' }))
      const secureQueryResponse = await secureQuery({ user_query: '' }, token)
      const policyIds = secureQueryResponse.matched_policy_ids || []
      
      if (policyIds.length === 0) {
        setTables(prev => ({ ...prev, [`${connection}-${schema}`]: [] }))
        return
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
          schema_name: schema
        })
      })
      
      if (!response.ok) throw new Error('Failed to fetch tables')
      const data = await response.json()
      const tableNames = data.tables || []
      
      setTables(prev => ({
        ...prev,
        [`${connection}-${schema}`]: tableNames.length > 0 ? tableNames : [],
      }))
    } catch (error) {
      console.error('Error fetching table data:', error)
      setTables(prev => ({ ...prev, [`${connection}-${schema}`]: 'error' }))
      toast.error('Failed to load tables')
    }
  }

  const fetchColumns = async (connection, schema, table) => {
    try {
      setColumns(prev => ({ ...prev, [`${connection}-${schema}-${table}`]: 'loading' }))
      const secureQueryResponse = await secureQuery({ user_query: '' }, token)
      const policyIds = secureQueryResponse.matched_policy_ids || []
      
      if (policyIds.length === 0) {
        setColumns(prev => ({ ...prev, [`${connection}-${schema}-${table}`]: [] }))
        return
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
          schema_name: schema,
          table_name: table
        })
      })
      
      if (!response.ok) throw new Error('Failed to fetch columns')
      const data = await response.json()
      const columnData = data.columns || []
      const formattedColumns = columnData.map(item => ({
        column: item.column_name,
        datatype: item.metadata?.DATA_TYPE || 'unknown',
        metadata: item.metadata
      }))
      
      setColumns(prev => ({
        ...prev,
        [`${connection}-${schema}-${table}`]: formattedColumns.length > 0 ? formattedColumns : [],
      }))
    } catch (error) {
      console.error('Error fetching column data:', error)
      setColumns(prev => ({ ...prev, [`${connection}-${schema}-${table}`]: 'error' }))
      toast.error('Failed to load columns')
    }
  }

  const handleSelectTable = (connection, schema, table) => {
    const fullTableName = `${connection}.${schema}.${table}`
    setSelectedTable(fullTableName)
    setEditorContent(`SELECT * FROM ${fullTableName}\nLIMIT 100;`)
  }

  const handleRefresh = () => {
    setEditorContent('')
    setSelectedTable('')
  }

  const handleRunQuery = () => {
    console.log('Running query:', editorContent)
    // Here you would implement the actual query execution similar to the executeQuery function
    // from the provided code, but we'll keep it simple for this example
  }

  const toggleEditorMaximize = () => {
    setIsEditorMaximized(!isEditorMaximized)
    setIsOutputMaximized(false)
  }

  const toggleOutputMaximize = () => {
    setIsOutputMaximized(!isOutputMaximized)
    setIsEditorMaximized(false)
  }

  const renderDatabaseLabel = (connection) => {
    const connectionId = `conn-${connection.connection_name}`
    const isExpanded = expandedItems[connectionId]
    return (
      <div className="flex items-center px-4 py-1 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
        onClick={() => toggleExpand(connectionId, connection.connection_name)}>
        {isExpanded ? (
          <ChevronDown size={14} className="mr-2 text-gray-400" />
        ) : (
          <ChevronRight size={14} className="mr-2 text-gray-400" />
        )}
        <Database size={14} className="mr-2 text-gray-400" />
        <span className="truncate">{connection.connection_name}</span>
      </div>
    )
  }

  const renderSchemaLabel = (connection, schema) => {
    const schemaId = `schema-${connection}-${schema}`
    const isExpanded = expandedItems[schemaId]
    return (
      <div className="flex items-center px-4 py-1 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
        onClick={() => toggleExpand(schemaId, connection, schema)}>
        {isExpanded ? (
          <ChevronDown size={14} className="mr-2 text-gray-400" />
        ) : (
          <ChevronRight size={14} className="mr-2 text-gray-400" />
        )}
        <Database size={14} className="mr-2 text-gray-400" />
        <span className="truncate">{schema}</span>
      </div>
    )
  }

  const renderTableLabel = (connection, schema, table) => {
    const tableId = `table-${connection}-${schema}-${table}`
    const isExpanded = expandedItems[tableId]
    return (
      <div className="flex items-center px-4 py-1 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
        onClick={() => toggleExpand(tableId, connection, schema, table)}>
        {isExpanded ? (
          <ChevronDown size={14} className="mr-2 text-gray-400" />
        ) : (
          <ChevronRight size={14} className="mr-2 text-gray-400" />
        )}
        <TableIcon size={14} className="mr-2 text-gray-400" />
        <span 
          className="truncate"
          onDoubleClick={() => handleSelectTable(connection, schema, table)}
        >
          {table}
        </span>
      </div>
    )
  }

  const renderColumnLabel = (column) => {
    const isNumber = column.datatype.split('(')[0] === 'int' ||
      column.datatype.split('(')[0] === 'integer' ||
      column.datatype.split('(')[0] === 'decimal' ||
      column.datatype.split('(')[0] === 'double'
    
    return (
      <div className="flex items-center px-4 py-1 text-sm text-gray-700 pl-8">
        {isNumber ? (
          <Hash size={14} className="mr-2 text-gray-400" />
        ) : (
          <Type size={14} className="mr-2 text-gray-400" />
        )}
        <span className="truncate">{column.column}</span>
      </div>
    )
  }

  const outputData = [
    { id: '#01', connection: 'Oracle', database: 'Oracle', schema: 'Oracle_1', overall: '97%', accuracy: '99%', validity: '99%', lastRun: '24/10/2024' },
    { id: '#01', connection: 'Oracle', database: 'Oracle', schema: 'Oracle_1', overall: '97%', accuracy: '99%', validity: '99%', lastRun: '24/10/2024' },
    { id: '#01', connection: 'Oracle', database: 'Oracle', schema: 'Oracle_1', overall: '97%', accuracy: '99%', validity: '99%', lastRun: '24/10/2024' },
    { id: '#01', connection: 'Oracle', database: 'Oracle', schema: 'Oracle_1', overall: '97%', accuracy: '99%', validity: '99%', lastRun: '24/10/2024' },
    { id: '#01', connection: 'Oracle', database: 'Oracle', schema: 'Oracle_1', overall: '97%', accuracy: '99%', validity: '99%', lastRun: '24/10/2024' }
  ]

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
                placeholder={activeTab === 'explorer' ? "Search databases..." : "Search history..."} 
                className="w-full border-none bg-transparent px-2 text-xs outline-none" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <X 
                  size={14} 
                  className="text-gray-500 cursor-pointer" 
                  onClick={() => setSearchTerm('')}
                />
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
                    connections.map((connection) => {
                      const connectionId = `conn-${connection.connection_name}`
                      const connectionSchemas = schemas[connection.connection_name]
                      const isExpanded = expandedItems[connectionId]
                      
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
                              {Array.isArray(connectionSchemas) && connectionSchemas.length > 0 && (
                                connectionSchemas.map((schema, schemaIndex) => {
                                  const schemaId = `schema-${connection.connection_name}-${schema}`
                                  const tableData = tables[`${connection.connection_name}-${schema}`]
                                  const isSchemaExpanded = expandedItems[schemaId]
                                  
                                  return (
                                    <div key={`${schema}-${schemaIndex}`}>
                                      {renderSchemaLabel(connection.connection_name, schema)}
                                      
                                      {isSchemaExpanded && (
                                        <div className="pl-6">
                                          {tableData === 'loading' && (
                                            <div className="px-4 py-1 text-sm text-gray-500">Loading tables...</div>
                                          )}
                                          {tableData === 'error' && (
                                            <div className="px-4 py-1 text-sm text-red-500">Error loading tables</div>
                                          )}
                                          {Array.isArray(tableData) && tableData.length === 0 && (
                                            <div className="px-4 py-1 text-sm text-gray-500">No tables available</div>
                                          )}
                                          {Array.isArray(tableData) && tableData.length > 0 && (
                                            tableData.map((table, tableIndex) => {
                                              const tableId = `table-${connection.connection_name}-${schema}-${table}`
                                              const columnData = columns[`${connection.connection_name}-${schema}-${table}`]
                                              const isTableExpanded = expandedItems[tableId]
                                              
                                              return (
                                                <div key={`${table}-${tableIndex}`}>
                                                  {renderTableLabel(connection.connection_name, schema, table)}
                                                  
                                                  {isTableExpanded && (
                                                    <div className="pl-6">
                                                      {columnData === 'loading' && (
                                                        <div className="px-4 py-1 text-sm text-gray-500">Loading columns...</div>
                                                      )}
                                                      {columnData === 'error' && (
                                                        <div className="px-4 py-1 text-sm text-red-500">Error loading columns</div>
                                                      )}
                                                      {Array.isArray(columnData) && columnData.length === 0 && (
                                                        <div className="px-4 py-1 text-sm text-gray-500">No columns available</div>
                                                      )}
                                                      {Array.isArray(columnData) && columnData.length > 0 && (
                                                        columnData.map((column, columnIndex) => (
                                                          <div key={`${column.column}-${columnIndex}`}>
                                                            {renderColumnLabel(column)}
                                                          </div>
                                                        ))
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              )
                                            })
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })
                              )}
                            </div>
                          )}
                        </div>
                      )
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
                    historyItems.map((item, index) => (
                      <div
                        key={index}
                        className={`px-4 py-2 text-sm cursor-pointer rounded
                        ${selectedTable.includes(item) ? 'text-[#8d77ba] bg-[#8d77ba10]' : 'text-gray-700 hover:bg-gray-50'}`}
                        onClick={() => {
                          // For simplicity, we'll just select the first connection/schema that has this table
                          let found = false
                          for (const connection of connections) {
                            const schemasList = schemas[connection.connection_name] || []
                            for (const schema of schemasList) {
                              const tablesList = tables[`${connection.connection_name}-${schema}`] || []
                              if (tablesList.includes(item)) {
                                handleSelectTable(connection.connection_name, schema, item)
                                found = true
                                break
                              }
                            }
                            if (found) break
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

        <div className={`${isEditorMaximized || isOutputMaximized ? 'flex-1' : 'flex-1 flex flex-col gap-5'} h-full`}>
          {!isOutputMaximized && (
            <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${isEditorMaximized ? 'h-full' : 'flex-1'} flex flex-col`}>
              <div className="flex justify-between items-center p-3 border-b border-gray-100">
                <div className="font-medium text-gray-800">Editor</div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 bg-[#8d77ba] text-white rounded px-3 py-1 text-sm font-medium hover:bg-[#7d69a8] transition" onClick={handleRunQuery}>
                    Run query
                    <Play size={14} />
                  </button>
                  <button 
                    className="text-gray-500 p-1 hover:bg-gray-50 rounded"
                    onClick={toggleEditorMaximize}
                  >
                    {isEditorMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                  <button className="text-gray-500 p-1 hover:bg-gray-50 rounded" onClick={handleRefresh}>
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-1 bg-white overflow-hidden">
                <div className="hidden md:block w-[40px] py-2 px-3 bg-gray-50 border-r border-gray-200 text-gray-500 text-xs text-right">
                  {Array.from({length: 20}, (_, i) => (
                    <div key={i} className="h-5 leading-5">{i + 1}</div>
                  ))}
                </div>
                <textarea
                  className="flex-1 border-none p-3 text-sm font-mono leading-5 resize-none outline-none overflow-y-auto"
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  placeholder=""
                />
              </div>
            </div>
          )}

          {!isEditorMaximized && (
            <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${isOutputMaximized ? 'h-full' : 'flex-1'} flex flex-col`}>
              <div className="flex justify-between items-center p-3 border-b border-gray-100">
                <div className="font-medium text-gray-800">Output</div>
                <button 
                  className="text-gray-500 p-1 hover:bg-gray-50 rounded"
                  onClick={toggleOutputMaximize}
                >
                  {isOutputMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </div>

              <div className="flex-1 overflow-auto p-3">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Connection</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Database</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schema</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overall</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validity</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last run</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {outputData.map((row, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-700">{row.id}</td>
                        <td className="px-4 py-2 text-sm text-gray-700"><a href="#" className="text-blue-600 hover:underline">{row.connection}</a></td>
                        <td className="px-4 py-2 text-sm text-gray-700"><a href="#" className="text-blue-600 hover:underline">{row.database}</a></td>
                        <td className="px-4 py-2 text-sm text-gray-700">{row.schema}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{row.overall}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{row.accuracy}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{row.validity}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{row.lastRun}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dataset