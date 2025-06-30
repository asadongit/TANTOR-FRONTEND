import React, { useState } from 'react'
import {
  Search,
  RefreshCw,
  ChevronDown,
  Play,
  Maximize2,
  Minimize2,
  Database,
  Clock
} from 'lucide-react'

function Dataset() {
  const [selectedTable, setSelectedTable] = useState('dim_customer')
  const [editorContent, setEditorContent] = useState('')
  const [expandedItems, setExpandedItems] = useState({ Oracle: true, 'Oracle.SCHEMA_1': true })
  const [activeTab, setActiveTab] = useState('explorer') 
  const [isEditorMaximized, setIsEditorMaximized] = useState(false)
  const [isOutputMaximized, setIsOutputMaximized] = useState(false)

  const explorerItems = [
    {
      name: 'Snowflake',
      type: 'database',
      schemas: [
        {
          name: 'PUBLIC',
          tables: ['dim_customer', 'fact_sales', 'dim_product']
        },
        {
          name: 'ANALYTICS',
          tables: ['user_profiles', 'clickstream', 'campaigns']
        }
      ]
    },
    {
      name: 'Hive',
      type: 'database',
      schemas: [
        {
          name: 'DEFAULT',
          tables: ['transactions', 'users', 'products']
        },
        {
          name: 'MARKETING',
          tables: ['campaigns', 'leads', 'conversions']
        }
      ]
    },
    {
      name: 'Postgres',
      type: 'database',
      schemas: [
        {
          name: 'public',
          tables: ['customers', 'orders', 'inventory']
        }
      ]
    },
    {
      name: 'Oracle',
      type: 'database',
      schemas: [
        {
          name: 'SCHEMA_1',
          tables: ['dim_customer', 'dim_product', 'fact_sales', 'dim_location']
        },
        {
          name: 'SCHEMA_2',
          tables: ['employees', 'departments', 'salaries']
        }
      ]
    }
  ]

  const historyItems = [
    'dim_customer',
    'dim_product',
    'fact_sales',
    'dim_location',
    'customers',
    'orders',
    'inventory'
  ]

  const outputData = [
    { id: '#01', connection: 'Oracle', database: 'Oracle', schema: 'Oracle_1', overall: '97%', accuracy: '99%', validity: '99%', lastRun: '24/10/2024' },
    { id: '#01', connection: 'Oracle', database: 'Oracle', schema: 'Oracle_1', overall: '97%', accuracy: '99%', validity: '99%', lastRun: '24/10/2024' },
    { id: '#01', connection: 'Oracle', database: 'Oracle', schema: 'Oracle_1', overall: '97%', accuracy: '99%', validity: '99%', lastRun: '24/10/2024' },
    { id: '#01', connection: 'Oracle', database: 'Oracle', schema: 'Oracle_1', overall: '97%', accuracy: '99%', validity: '99%', lastRun: '24/10/2024' },
    { id: '#01', connection: 'Oracle', database: 'Oracle', schema: 'Oracle_1', overall: '97%', accuracy: '99%', validity: '99%', lastRun: '24/10/2024' }
  ]

  const toggleExpand = (itemName) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }))
  }

  const handleSelectTable = (table) => {
    setSelectedTable(table)
    setEditorContent(`SELECT * FROM ${table}\nLIMIT 100;`)
  }

  const handleRefresh = () => {
    setEditorContent('')
    setSelectedTable('')
  }

  const handleRunQuery = () => {
    console.log('Running query:', editorContent)
  }

  const toggleEditorMaximize = () => {
    setIsEditorMaximized(!isEditorMaximized)
    setIsOutputMaximized(false) 
  }

  const toggleOutputMaximize = () => {
    setIsOutputMaximized(!isOutputMaximized)
    setIsEditorMaximized(false) 
  }

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
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {activeTab === 'explorer' ? (
                <div>
                  {explorerItems.map((database, dbIndex) => (
                    <div key={dbIndex} className="mb-0.5">
                      <div
                        className="flex items-center px-4 py-1 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleExpand(database.name)}
                      >
                        <ChevronDown
                          size={14}
                          className={`mr-2 text-gray-400 transition-transform duration-200 ${expandedItems[database.name] ? "transform rotate-180" : ""}`}
                        />
                        <span>{database.name}</span>
                      </div>

                      {expandedItems[database.name] && (
                        <div className="pl-6">
                          {database.schemas.map((schema, schemaIndex) => {
                            const schemaKey = `${database.name}.${schema.name}`
                            return (
                              <div key={schemaIndex}>
                                <div
                                  className="flex items-center px-4 py-1 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                  onClick={() => toggleExpand(schemaKey)}
                                >
                                  <ChevronDown
                                    size={14}
                                    className={`mr-2 text-gray-400 transition-transform duration-200 ${expandedItems[schemaKey] ? "transform rotate-180" : ""}`}
                                  />
                                  <span>{schema.name}</span>
                                </div>

                                {expandedItems[schemaKey] && (
                                  <div className="pl-6">
                                    {schema.tables.map((table, tableIndex) => (
                                      <div
                                        key={tableIndex}
                                        className={`flex items-center px-4 py-1 text-sm gap-2 cursor-pointer
                                        ${selectedTable === table
                                          ? 'text-[#8d77ba] bg-[#8d77ba10]'
                                          : 'text-gray-700 hover:bg-gray-50'}`}
                                        onClick={() => handleSelectTable(table)}
                                      >
                                        <Play size={12} />
                                        <span>{table}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {historyItems.map((item, index) => (
                    <div
                      key={index}
                      className={`px-4 py-2 text-sm cursor-pointer rounded
                      ${selectedTable === item ? 'text-[#8d77ba] bg-[#8d77ba10]' : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => handleSelectTable(item)}
                    >
                      {item}
                    </div>
                  ))}
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