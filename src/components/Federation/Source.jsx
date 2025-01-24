/*eslint-disable*/
import { useLocation } from 'react-router-dom';
import { addEdge, Controls, Background, MiniMap, ReactFlow, useNodesState, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useState, useEffect } from 'react';
import { SourceNode, SourceViewNode } from './NodeTypes';
import { Icon } from '@iconify/react';

const nodeTypes = {
  source: SourceNode,
  sourceView: SourceViewNode,
};

let id = 0;
const getId = () => `node_${id++}`;

const ColumnSettings = ({ columnSetting, setColumnSetting ,finalPayload, setFinalPayload }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  const [settings, setSettings] = useState({
    name: columnSetting && columnSetting.column ? columnSetting.column.name : "",
    output: 'Yes',
    order: '01',
    sort: 'None',
    aggregate: 'None',
    groupBy: 'No',
    wildcard: '',
    filterBy: '',
  });

  const toggleDialog = () => setIsOpen(!isOpen);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prevSettings) => ({
      ...prevSettings,
      [name]: value,
    }));
  };

  const handleExecute = (event) => {
    event.preventDefault();

    // Update the finalPayload state variable
    setFinalPayload((prevPayload) => {
      const updatedPayload = { ...prevPayload };
      if (!updatedPayload[columnSetting.viewName]) {
        updatedPayload[columnSetting.viewName] = [];
      }
      updatedPayload[columnSetting.viewName].push(settings);
      return updatedPayload;
    });

    
    // setColumnSetting(null)
    // Close the dialog
    // toggleDialog();
  };

  return (
    <div className="min-h-screen w-full flex justify-end items-start">
      {isOpen && (
        <div
          className="w-80 bg-white p-4 rounded-lg shadow-lg absolute top-4 right-4"
          style={{
            maxHeight: 'calc(100vh - 2rem)',
            overflowY: 'auto',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <span className="text-lg font-medium">Column Settings</span>
            <button
              onClick={toggleDialog}
              className="text-gray-500 hover:text-gray-700"
            >
              <Icon icon="mdi:close" width={20} height={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={columnSetting && columnSetting.column ? columnSetting.column.name : ""}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Type</label>
              <input
                type="text"
                value={columnSetting && columnSetting.column ? columnSetting.column.dataType : ""}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                readOnly
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Alias</label>
                <input
                  type="text"
                  placeholder="Alias"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Output</label>
                <select
                  name="output"
                  value={settings.output}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Order</label>
                <input
                  type="number"
                  name="order"
                  value={settings.order}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Sort</label>
                <select
                  name="sort"
                  value={settings.sort}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="Ascending">Ascending</option>
                  <option value="Descending">Descending</option>
                  <option value="None">None</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Aggregate</label>
                <select
                  name="aggregate"
                  value={settings.aggregate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="Sum">Sum</option>
                  <option value="Min">Min</option>
                  <option value="Max">Max</option>
                  <option value="Count">Count</option>
                  <option value="None">None</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Group by</label>
                <select
                  name="groupBy"
                  value={settings.groupBy}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Wildcard</label>
              <input
                type="text"
                name="wildcard"
                value={settings.wildcard}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Filter by</label>
              <div className="flex gap-2">
                <select
                  name="filterBy"
                  value={settings.filterBy}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Select a filter</option>
                  <option value="filter1">Filter 1</option>
                  <option value="filter2">Filter 2</option>
                  <option value="filter3">Filter 3</option>
                </select>
                <button className="px-2 py-2 border rounded-md hover:bg-gray-50">
                  <Icon icon="mdi:plus" width={16} height={16} className="text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={toggleDialog}
              className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600" onClick={handleExecute}>
              Execute
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function Source() {
  const modalState = useLocation().state;
  const [userSelection, setUserSelection] = useState({});
  const [columnSetting, setColumnSetting] = useState(null);
  const [finalPayload, setFinalPayload] = useState(null);

  const initialNodes = [
    {
      id: 'node-0',
      type: 'source',
      position: { x: 0, y: 0 },
      data: { userSelection, setUserSelection }
    },
    {
      id: 'node-1',
      type: 'sourceView',
      position: { x: 275, y: 0 },
      data: { userSelection, setUserSelection, setColumnSetting, setFinalPayload }
    }
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useNodesState([]);

  useEffect(() => {
    setNodes(initialNodes);
    console.log("Nodes Re render.");
  }, [userSelection]);

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col">
        <p>Source Page</p>
        <div className="flex-1" style={{ width: '80vw', height: '80vh' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            style={{
              backgroundColor: '#FFFFF',
            }}
          >
            <Controls />
            <Background variant="solid" className="bg-white" />
          </ReactFlow>
        </div>
      </div>
      {columnSetting ? <ColumnSettings columnSetting={columnSetting} setColumnSetting={setColumnSetting} finalPayload= {finalPayload} setFinalPayload={setFinalPayload}/> : null}
    </div>
  );
}