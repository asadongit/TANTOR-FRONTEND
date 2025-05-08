import React, { useState } from 'react';
import { Plus } from 'lucide-react';

const LineItemConfigModal = ({ lineItemId, setShowModal }) => {
  const [name, setName] = useState('');
  const [operator, setOperator] = useState('');
  const [value, setValue] = useState('');
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">{lineItemId}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="rule-selector" className="block text-sm font-medium text-gray-700">
            Rule Selector
          </label>
          <select
            id="rule-selector"
            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Select a rule</option>
            <option value="rule1">Rule 1</option>
            <option value="rule2">Rule 2</option>
            <option value="rule3">Rule 3</option>
          </select>
        </div>

        <div>
          <label htmlFor="metric-selector" className="block text-sm font-medium text-gray-700">
            Metric Selector
          </label>
          <select
            id="metric-selector"
            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Select a metric</option>
            <option value="metric1">Metric 1</option>
            <option value="metric2">Metric 2</option>
            <option value="metric3">Metric 3</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Dimension Selector</h3>
        <div className="flex gap-4">
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <input
            placeholder="Operator"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <input
            placeholder="Value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <button
            type="button"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={(e) => {e.preventDefault; setShowModal(false)}}
        >
          Back
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add Rule
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default LineItemConfigModal;
