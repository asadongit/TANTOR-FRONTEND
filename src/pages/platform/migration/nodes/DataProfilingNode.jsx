import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position, useEdges, useNodes } from 'reactflow';
import { BarChart2, X } from 'lucide-react';
import { useCSV } from '../context/CSVcontext';

const findDefineNode = (nodes, edges, startNodeId) => {
  const visited = new Set();
  const queue = [startNodeId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const node = nodes.find(n => n.id === currentId);
    if (node?.type === 'uploadCsv') {
      return node;
    }

    const incomingEdges = edges.filter(e => e.target === currentId);
    queue.push(...incomingEdges.map(e => e.source));
  }

  return null;
};

export function DataProfilingNode({ id }) {
  const [profilingData, setProfilingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const edges = useEdges();
  const nodes = useNodes();
  const { getData } = useCSV();

  const incomingEdge = edges.find(edge => edge.target === id);
  const DefineNode = incomingEdge ? findDefineNode(nodes, edges, id) : null;
  const csvData = DefineNode ? getData(DefineNode.id) || [] : [];

  const handleProfile = async () => {
    if (csvData.length === 0) return;

    setLoading(true);
    try {
      const profileResponse = await fetch('http://localhost:8000/v1/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: csvData }),
      });

      const profileResult = await profileResponse.json();
      setProfilingData(profileResult);
    } catch (error) {
      console.error('Error profiling data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg border-2 border-gray-700 min-w-[300px] relative group">
      <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4 text-white" />
      </button>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div className="flex items-center space-x-3 mb-4">
        <BarChart2 className="w-5 h-5 text-blue-400" />
        <h3 className="text-white font-medium">Data Profiling</h3>
      </div>

      <button
        onClick={handleProfile}
        disabled={loading || !DefineNode || csvData.length === 0}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600
                   disabled:cursor-not-allowed rounded-md text-white font-medium text-sm mb-4"
      >
        {loading ? 'Processing...' : 'Profile Data'}
      </button>

      {profilingData && (
        <div className="space-y-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Dataset Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Records</span>
                <span className="text-gray-200">{profilingData.total_records}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Missing Values</span>
                <span className="text-gray-200">{profilingData.missing_values}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Numeric Columns</span>
                <span className="text-gray-200">{profilingData.numeric_columns}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Categorical Columns</span>
                <span className="text-gray-200">{profilingData.categorical_columns}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

DataProfilingNode.propTypes = {
  id: PropTypes.string.isRequired
};