import React, { useState } from 'react'
import {
  Search,
  RefreshCw,
  ChevronDown,
  Play,
  Maximize2,
  Activity
} from 'lucide-react'

function Dataset() {
  const [selectedTable, setSelectedTable] = useState('dim_customer')
  const [editorContent, setEditorContent] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [expandedItems, setExpandedItems] = useState({ Oracle: true })

  const explorerItems = [
    {
      name: 'Snowflake',
      type: 'database',
      tables: ['dim_customer', 'fact_sales', 'dim_product']
    },
    {
      name: 'Hive',
      type: 'database',
      tables: ['transactions', 'users', 'products']
    },
    {
      name: 'Postgres',
      type: 'database',
      tables: ['customers', 'orders', 'inventory']
    },
    {
      name: 'Oracle',
      type: 'database',
      tables: ['dim_customer', 'dim_product', 'fact_sales', 'dim_location']
    }
  ]

  const historyItems = [
    'dim_customer',
    'dim_customer',
    'dim_customer',
    'dim_customer',
    'dim_customer',
    'dim_customer',
    'dim_customer'
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

  const handleExpandOutput = () => {
    setShowModal(true)
  }

  return (
    <div className="w-full">
      <div className="flex gap-5">
        <div className="w-[280px] flex flex-col gap-5">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <Search size={16} className="text-gray-600" />
                <span>Explorer</span>
              </div>
              <button className="text-gray-500 p-1 hover:bg-gray-50 rounded" onClick={handleRefresh}>
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="flex items-center mx-4 my-3 px-2.5 py-1.5 border border-gray-200 rounded bg-gray-50">
              <Search size={14} className="text-gray-500" />
              <input type="text" placeholder="Search" className="w-full border-none bg-transparent px-2 text-xs outline-none" />
            </div>

            <div className="pb-4">
              <div className="mt-3">
                <div className="text-xs text-gray-500 px-4 mb-2">Recent search</div>

                {explorerItems.map((item, index) => (
                  <div key={index} className="mb-0.5">
                    <div
                      className="flex items-center px-4 py-1 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleExpand(item.name)}
                    >
                      <ChevronDown
                        size={14}
                        className={`mr-2 text-gray-400 transition-transform duration-200 ${expandedItems[item.name] ? "transform rotate-180" : ""}`}
                      />
                      <span>{item.name}</span>
                    </div>

                    {expandedItems[item.name] && (
                      <div className="pl-6">
                        {item.tables.map((table, tableIndex) => (
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
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <Activity size={16} />
                <span>History</span>
              </div>
            </div>

            <div className="p-3">
              {historyItems.map((item, index) => (
                <div
                  key={index}
                  className={`px-4 py-1 text-sm cursor-pointer
                  ${selectedTable === item ? 'text-[#8d77ba] bg-[#8d77ba10]' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => handleSelectTable(item)}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-5">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b border-gray-100">
              <div className="text-sm font-medium text-gray-800">Editor</div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 bg-[#8d77ba] text-white rounded px-3 py-1 text-sm font-medium hover:bg-[#7d69a8] transition" onClick={handleRunQuery}>
                  Run query
                  <Play size={14} />
                </button>
                <button className="text-gray-500 p-1 hover:bg-gray-50 rounded">
                  <Maximize2 size={16} />
                </button>
                <button className="text-gray-500 p-1 hover:bg-gray-50 rounded">
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            <div className="flex min-h-[240px] bg-white">
              <div className="hidden md:block w-[40px] py-2 px-3 bg-gray-50 border-r border-gray-200 text-gray-500 text-xs text-right">
                {Array.from({length: 10}, (_, i) => (
                  <div key={i} className="h-5 leading-5">{i + 1}</div>
                ))}
              </div>
              <textarea
                className="flex-1 border-none p-3 text-sm font-mono leading-5 resize-none outline-none"
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                placeholder=""
                rows={10}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b border-gray-100">
              <div className="text-sm font-medium text-gray-800">Output</div>
              <button className="text-gray-500 p-1 hover:bg-gray-50 rounded" onClick={handleExpandOutput}>
                <Maximize2 size={16} />
              </button>
            </div>

            <div className="overflow-x-auto p-3">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
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
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-auto shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <div className="text-lg font-medium text-gray-800">Output Details</div>
              <button className="text-gray-500 p-1 hover:bg-gray-50 rounded" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="p-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
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
        </div>
      )}
    </div>
  )
}

export default Dataset