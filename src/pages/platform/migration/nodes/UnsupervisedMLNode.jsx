import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position, useEdges, useNodes } from 'reactflow';
import { Network, X } from 'lucide-react';

export function UnsupervisedMLNode({ id }) {
  const [selectedModel, setSelectedModel] = useState('kmeans');
  const [numClusters, setNumClusters] = useState('3');
  const edges = useEdges();
  const nodes = useNodes();

  const incomingEdge = edges.find(edge => edge.target === id);
  const sourceNode = incomingEdge 
    ? nodes.find(node => node.id === incomingEdge.source)
    : null;
  const DefineNode = nodes.find(node => 
    node.type === 'uploadCsv' && 
    edges.some(edge => edge.source === node.id && edge.target === sourceNode?.id)
  );
  
  const csvData = DefineNode 
    ? JSON.parse(localStorage.getItem(`csv-data-${DefineNode.id}`) || '[]')
    : [];

  const handleTrain = () => {
    console.log('Training model:', selectedModel, 'Clusters:', numClusters);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg border-2 border-gray-700 min-w-[250px] relative group">
      <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4 text-white" />
      </button>
      
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      
      <div className="flex items-center space-x-3 mb-4">
        <Network className="w-5 h-5 text-blue-400" />
        <h3 className="text-white font-medium">Unsupervised ML</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Algorithm
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm"
          >
            <option value="kmeans">K-Means Clustering</option>
            <option value="hierarchical">Hierarchical Clustering</option>
            <option value="dbscan">DBSCAN</option>
            <option value="pca">PCA</option>
          </select>
        </div>

        {selectedModel === 'kmeans' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Number of Clusters
            </label>
            <input
              type="number"
              value={numClusters}
              onChange={(e) => setNumClusters(e.target.value)}
              min="2"
              max="20"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm"
            />
          </div>
        )}

        <button
          onClick={handleTrain}
          disabled={csvData.length === 0}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 
                     disabled:cursor-not-allowed rounded-md text-white font-medium text-sm"
        >
          Train Model
        </button>
      </div>
    </div>
  );
}

UnsupervisedMLNode.propTypes = {
  id: PropTypes.string.isRequired
};