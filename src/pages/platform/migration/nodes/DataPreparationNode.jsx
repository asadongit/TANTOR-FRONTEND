import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position, useEdges, useNodes } from 'reactflow';
import { Workflow, X, ChevronRight } from 'lucide-react';
import { useCSV } from '../context/CSVcontext';
import { useDrawer } from '../context/DrawerContext';

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

export function DataPreparationNode({ id }) {
  const [loading, setLoading] = useState(false);
  const [prepared, setPrepared] = useState(false);

  const [manualLoading, setManualLoading] = useState(false);
  const [manualPrepared, setManualPrepared] = useState(false);

  const [settings, setSettings] = useState({
    targetColumn: '',
    flag: false,
    dateTimeColumn: '',
  });

  const edges = useEdges();
  const nodes = useNodes();
  const { getData, setData } = useCSV();
  const { openDrawer } = useDrawer();

  const incomingEdge = edges.find(edge => edge.target === id);
  const DefineNode = incomingEdge ? findDefineNode(nodes, edges, id) : null;
  const csvData = DefineNode ? getData(DefineNode.id) || [] : [];
  const columns = csvData.length > 0 ? Object.keys(csvData[0]) : [];

  const convertToCSV = (data) => {
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(col => JSON.stringify(row[col], (key, value) => value === null ? '' : value)).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  };

  const handleAutoPrepare = async () => {
    try {
      setLoading(true);

      const formData = new FormData();
      const csvString = convertToCSV(csvData);
      const csvFile = new Blob([csvString], { type: 'text/csv' });

      formData.append('file', csvFile, 'data.csv');
      formData.append('flag', settings.flag ? 'true' : 'false');
      formData.append('target_column', settings.targetColumn);
      if (settings.flag && settings.dateTimeColumn) {
        formData.append('datetime_col', settings.dateTimeColumn);
      }

      const response = await fetch('http://localhost:8000/v1/prepare/auto', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process data');
      }

      const result = await response.json();

      setData(id, {
        "cleaned_df": result.cleaned_df,
        "fairness_df": result.fairness_df,
        "targetColumn": settings.targetColumn,
        "timeseries": settings.flag,
        "dateTimeColumn": settings.dateTimeColumn
      });

      setPrepared(true);
    } catch (error) {
      console.error('Error preparing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualPrepare = async (manualSettings) => {
    try {
      setManualLoading(true);

      const formData = new FormData();
      const csvString = convertToCSV(csvData);
      const csvFile = new Blob([csvString], { type: 'text/csv' });

      formData.append('file', csvFile, 'data.csv');
      formData.append('flag', settings.flag ? 'true' : 'false');
      formData.append('target_column', settings.targetColumn);
      if (settings.flag && settings.dateTimeColumn) {
        formData.append('datetime_col', settings.dateTimeColumn);
        manualSettings.datetime_col = settings.dateTimeColumn;
      }

      formData.append('config', JSON.stringify(manualSettings))

      const response = await fetch('http://localhost:8000/v1/prepare/manual', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process data');
      }

      const result = await response.json();

      setData(id, {
        "cleaned_df": result.cleaned_df,
        "fairness_df": result.fairness_df,
        "targetColumn": settings.targetColumn,
        "timeseries": settings.flag,
        "dateTimeColumn": settings.dateTimeColumn
      });

      setManualPrepared(true);
    } catch (error) {
      console.error('Error preparing data:', error);
    } finally {
      setManualLoading(false);
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
        <Workflow className="w-5 h-5 text-blue-400" />
        <h3 className="text-white font-medium">Data Preparation</h3>
      </div>

      <div className="space-y-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Target Column
          </label>
          <select
            value={settings.targetColumn}
            onChange={(e) => setSettings({...settings, targetColumn: e.target.value})}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Select column...</option>
            {columns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Time Series
          </label>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.flag}
              onChange={(e) => setSettings({ ...settings, flag: e.target.checked })}
              className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-300">
              {settings.flag ? "True" : "False"}
            </span>
          </div>
        </div>

        {settings.flag && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Datetime Column
            </label>
            <select
              value={settings.dateTimeColumn}
              onChange={(e) => setSettings({ ...settings, dateTimeColumn: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Select column...</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <button
          onClick={handleAutoPrepare}
          disabled={loading || csvData.length === 0 || !settings.targetColumn}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600
                   disabled:cursor-not-allowed rounded-md text-white font-medium text-sm"
        >
          {loading ? 'Preparing...' : prepared ? 'Prepared ✓' : 'Auto Preparation'}
        </button>

        <button
          onClick={() => {
            openDrawer('manual-prep', {
              columns,
              onPrepare: handleManualPrepare
            });
          }}
          disabled={manualLoading || csvData.length === 0 || !settings.targetColumn}
          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600
                   disabled:cursor-not-allowed rounded-md text-white font-medium text-sm flex items-center justify-center space-x-2"
        >
          <span>
            {manualLoading ? 'Preparing...' : manualPrepared ? 'Prepared ✓' : 'Manual Preparation'}
          </span>
          {!manualLoading && !manualPrepared && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

DataPreparationNode.propTypes = {
  id: PropTypes.string.isRequired
};