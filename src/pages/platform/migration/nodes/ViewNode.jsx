import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position, useEdges, useNodes } from 'reactflow';
import { Table, X, Maximize2 } from 'lucide-react';
import { useCSV } from '../context/CSVcontext';

export function ViewNode({ id }) {
  const [showModal, setShowModal] = useState(false);
  const edges = useEdges();
  const nodes = useNodes();
  const { getData } = useCSV();

  const incomingEdge = edges.find(edge => edge.target === id);
  const DefineNode = incomingEdge
    ? nodes.find(node => node.id === incomingEdge.source)
    : null;

  const csvData = DefineNode ? getData(DefineNode.id) || [] : [];

  return (
    <>
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg border-2 border-gray-700 w-[400px] relative group">
        <button
          onClick={() => window.deleteNode?.(id)}
          className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Table className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-medium">View CSV</h3>
          </div>
          {csvData.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="p-1.5 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
            >
              <Maximize2 className="w-4 h-4 text-gray-300" />
              <span className="text-xs text-gray-300">View All</span>
            </button>
          )}
        </div>

        <div className="overflow-hidden">
          {csvData.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      {Object.keys(csvData[0]).map((header) => (
                        <th
                          key={header}
                          className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {csvData.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((cell, j) => (
                          <td key={j} className="px-3 py-2 text-sm text-gray-300 truncate max-w-[200px]">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvData.length > 5 && (
                <div className="text-center text-sm text-gray-500 mt-2">
                  Showing 5 of {csvData.length} rows
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-400 text-center py-4">
              {!DefineNode
                ? "Connect to an Upload CSV node to view data"
                : "No data available"}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl shadow-2xl w-[95vw] h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <Table className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-medium text-white">CSV Data</h3>
                <span className="text-sm text-gray-400">({csvData.length} rows)</span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="rounded-lg border border-gray-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800 sticky top-0">
                    <tr>
                      {Object.keys(csvData[0]).map((header) => (
                        <th
                          key={header}
                          className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider bg-gray-800"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900 divide-y divide-gray-800">
                    {csvData.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-800 transition-colors">
                        {Object.values(row).map((cell, j) => (
                          <td key={j} className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

ViewNode.propTypes = {
  id: PropTypes.string.isRequired
};