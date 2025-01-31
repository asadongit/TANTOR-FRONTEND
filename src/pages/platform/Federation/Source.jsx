/*eslint-disable*/
import { useLocation } from "react-router-dom";
import {
  Controls,
  Background,
  ReactFlow,
  useNodesState,
  useEdgesState,
  Panel,
} from "@xyflow/react";
import { Pencil, Trash2 } from "lucide-react";
import "@xyflow/react/dist/style.css";
import { useState, useEffect, useCallback } from "react";
import { ConnectionNode, BaseNode } from "./nodes/baseNodes";
import { Icon } from "@iconify/react";
import SourceSidebar from "./nodes/ViewFromSourceSidebar";

const nodeTypes = {
  baseNode: BaseNode,
  connection: ConnectionNode,
};

let id = 0;
const getId = () => `node_${id++}`;

const ColumnSettings = ({
  columnSetting,
  settingsPayload, 
  setSettingsPayload,
  setColumnSetting,
  finalPayload,
  setFinalPayload,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const [settings, setSettings] = useState({
    name: "",
    type: "",
    output: "Yes",
    alias: "",
    order: "",
    sort: "",
    aggregate: "",
    groupBy: "",
    wildcard: "",
    filterBy: "",
  });
  const toggleDialog = () => setIsOpen((prev) => !prev);

  useEffect(() => {
    if(columnSetting?.type == "Source"){
      if (columnSetting?.column?.column_name) {
        if(settingsPayload.get("viewName") == columnSetting.viewName && settingsPayload.has(columnSetting.column.column_name)) {
          setSettings(settingsPayload.get(columnSetting.column.column_name));
        }else {
          setSettings({
            name: columnSetting?.column.column_name,
            type: columnSetting?.column.data_type,
            output: "Yes",
            alias: "",
            order: "",
            sort: "",
            aggregate: "",
            groupBy: "",
            wildcard: "",
            filterBy: "",
          });
        }
      }
    }

    if(columnSetting?.type == "Connection"){
      if(columnSetting?.column?.column){
        if(settingsPayload.get("connection") == columnSetting.connection && settingsPayload.has(columnSetting.column.column)) {
          setSettings(settingsPayload.get(columnSetting.column.column));
        }else {
          setSettings({
            name: columnSetting?.column.column,
            type: columnSetting?.column.datatype,
            output: "Yes",
            alias: "",
            order: "",
            sort: "",
            aggregate: "",
            groupBy: "",
            wildcard: "",
            filterBy: "",
          });
        }
      }
    }
    if(!isOpen)
      toggleDialog();
  }, [columnSetting]);

  if (!isOpen) {
    return null;
  }
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prevSettings) => ({
      ...prevSettings,
      [name]: value,
    }));
  };

  const handleExecute = (event) => {
    event.preventDefault();

    // setFinalPayload((prevPayload) => {
    //   const updatedPayload = { ...prevPayload };

    //   if (!updatedPayload[columnSetting.viewName]) {
    //     updatedPayload[columnSetting.viewName] = [];
    //   }

    //   updatedPayload[columnSetting.viewName] = updatedPayload[columnSetting.viewName]
    //     .filter((setting) => setting.name !== settings.name);

    //   updatedPayload[columnSetting.viewName].push({
    //     ...settings,
    //     name: columnSetting.column.column_name,
    //     type:columnSetting.column.data_type,
    //   });
    //   console.log("Settings ==> ", settings);
    //   return updatedPayload;
    // });

    if (columnSetting.type == "Source") {      
      
      setSettingsPayload(prev => {
        const updatedSettingsPayload = new Map(prev);
        if(settingsPayload.get("viewName") != columnSetting.viewName){
          updatedSettingsPayload.clear();
          updatedSettingsPayload.set("viewName", columnSetting.viewName);
        }   
        updatedSettingsPayload.set(settings.name, settings);

        return updatedSettingsPayload;
      });
      
      setSettings({
        name: "",
        type: "",
        output: "Yes",
        alias: "",
        order: "",
        sort: "",
        aggregate: "",
        groupBy: "",
        wildcard: "",
        filterBy: "",
      });
    }
    if (columnSetting.type == "Connection") {
      setSettingsPayload(prev => {
        const updatedSettingsPayload = new Map(prev);
        if(settingsPayload.get("connection") != columnSetting.connection){
          updatedSettingsPayload.clear();
          updatedSettingsPayload.set("connection", columnSetting.connection);
        }   
        updatedSettingsPayload.set(settings.name, settings);

        console.log("Updated Settings Payload ==> ", updatedSettingsPayload);
        return updatedSettingsPayload;
      });
    }
    toggleDialog();
    // setColumnSetting(null);
  };

  return (
    <div className="w-full flex justify-end items-start">
      <div className="w-80 bg-white p-4 rounded-lg shadow-lg absolute top-4 right-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
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
              value={settings.name || ""}
              className="w-full px-3 py-2 border rounded-lg text-[rgba(0,0,0,0.5)] focus:outline-none focus:ring-1 focus:ring-purple-500"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Type</label>
            <input
              type="text"
              value={settings.type || ""}
              className="w-full px-3 py-2 border rounded-lg text-[rgba(0,0,0,0.5)] focus:outline-none focus:ring-1 focus:ring-purple-500"
              readOnly
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Alias</label>
              <input
                type="text"
                name="alias"
                placeholder="Alias"
                value={settings.alias || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Output</label>
              <select
                name="output"
                value={settings.output || "Yes"}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                value={settings.order || 1}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Sort</label>
              <select
                name="sort"
                value={settings.sort || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">None</option>
                <option value="Ascending">Ascending</option>
                <option value="Descending">Descending</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Aggregate
              </label>
              <select
                name="aggregate"
                value={settings.aggregate || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">None</option>
                <option value="Sum">Sum</option>
                <option value="Min">Min</option>
                <option value="Max">Max</option>
                <option value="Count">Count</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Group by
              </label>
              <select
                name="groupBy"
                value={settings.groupBy || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Wildcard</label>
            <input
              type="text"
              name="wildcard"
              value={settings.wildcard || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Filter by
            </label>
            <div className="flex gap-2">
              <select
                name="filterBy"
                value={settings.filterBy}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">Select a filter</option>
                <option value="filter1">Filter 1</option>
                <option value="filter2">Filter 2</option>
                <option value="filter3">Filter 3</option>
              </select>
              <button className="px-2 py-2 border rounded-lg hover:bg-gray-50">
                <Icon
                  icon="mdi:plus"
                  width={16}
                  height={16}
                  className="text-gray-500"
                />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={toggleDialog}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            className="flex-1 px-4 py-2 bg-[#8E77BB] text-white rounded-lg hover:bg-[rgb(142,119,187,0.8)]"
            onClick={handleExecute}
          >
            Execute
          </button>
        </div>
      </div>
    </div>
  );
};

const SaveViewModal = ({
  toggleModal,
  handleSaveView,
}) => {
  const [newViewName, setNewViewName] = useState("");

  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[#8E77BB] text-2xl font-bold">View Name</h2>
          <button onClick={toggleModal} className="text-gray-500 text-2xl">
            &times;
          </button>
        </div>

        <div>
          <div className="mb-6">
            <label className="block text-[#282F49] text-lg font-semibold">
              Enter View Name
            </label>
            <input
              type="text"
              value={newViewName || ""}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="Enter View Name"
              className="w-full mt-2 p-2.5 border rounded-lg text-gray-700 border-gray-300 focus:ring-2 focus:ring-[#8E77BB] focus:outline-none"
            />
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              toggleModal();
              handleSaveView({newViewName});
            }}
            className="w-full bg-[#8E77BB] text-white py-2 rounded-lg"
          >
            Save View
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Source() {
  const modalState = useLocation().state;
  const [userSelection, setUserSelection] = useState({});
  const [columnSetting, setColumnSetting] = useState(null);
  const [finalPayload, setFinalPayload] = useState({});

  const [settingsPayload, setSettingsPayload] = useState(new Map());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => {
    setIsModalOpen((prev) => !prev);
    console.log("TOGGLING MODEL = ", isModalOpen);
  };

  useEffect(() => {
    console.log("settings payload ==>>> ",settingsPayload);
  },[])
  const [showPreview, setShowPreview] = useState(false);
  const sampleData = [
    {
      id: "01",
      connections: "MySQL",
      description: "A connection with MySQL",
      schema: 53,
      tables: 135,
      views: 8,
      created: "14/05/2023",
    },
    {
      id: "02",
      connections: "Postgres",
      description: "A connection with Postgres",
      schema: 92,
      tables: 127,
      views: 9,
      created: "02/11/2021",
    },
    {
      id: "03",
      connections: "Oracle",
      description: "A connection with Oracle",
      schema: 81,
      tables: 104,
      views: 5,
      created: "29/08/2022",
    },
    {
      id: "04",
      connections: "MySQL",
      description: "A connection with MySQL",
      schema: 68,
      tables: 95,
      views: 6,
      created: "17/07/2024",
    },
    {
      id: "05",
      connections: "Postgres",
      description: "A connection with Postgres",
      schema: 74,
      tables: 110,
      views: 7,
      created: "22/01/2023",
    },
    {
      id: "06",
      connections: "Oracle",
      description: "A connection with Oracle",
      schema: 59,
      tables: 140,
      views: 10,
      created: "10/04/2020",
    },
    {
      id: "07",
      connections: "MySQL",
      description: "A connection with MySQL",
      schema: 45,
      tables: 87,
      views: 3,
      created: "05/09/2021",
    },
    {
      id: "08",
      connections: "Postgres",
      description: "A connection with Postgres",
      schema: 67,
      tables: 119,
      views: 4,
      created: "19/12/2022",
    },
    {
      id: "09",
      connections: "Oracle",
      description: "A connection with Oracle",
      schema: 94,
      tables: 134,
      views: 8,
      created: "12/08/2023",
    },
    {
      id: "10",
      connections: "MySQL",
      description: "A connection with MySQL",
      schema: 83,
      tables: 120,
      views: 6,
      created: "29/06/2022",
    },
    {
      id: "11",
      connections: "Postgres",
      description: "A connection with Postgres",
      schema: 65,
      tables: 112,
      views: 5,
      created: "18/03/2021",
    },
    {
      id: "12",
      connections: "Oracle",
      description: "A connection with Oracle",
      schema: 76,
      tables: 130,
      views: 9,
      created: "30/10/2024",
    },
  ];

  const handleColumnSetting = (params) => {
    if (params.type == "Source") {
      console.log("SOURCE PAYLOAD");
      setColumnSetting(params);
    } else if (params.type == "Connection") {
      setColumnSetting(params);
    }
  };
  const handleOk = (payload) => {
    if (payload?.type == "Source") {
      setSettingsPayload(prev => {
        const updatedSettingsPayload = new Map(prev);
        updatedSettingsPayload.keys().forEach(key => {
          if(!payload.userCheckedColumns.includes(key) && key !== "viewName")
            updatedSettingsPayload.delete(key);
        })
        console.log("updatedSettingsPayload ==> ", updatedSettingsPayload);
        return updatedSettingsPayload;
      });
      
    } else if (payload?.type == "Connection") {
      setSettingsPayload(prev => {
        const updatedSettingsPayload = new Map(prev);
        updatedSettingsPayload.keys().forEach(key => {
          if(!payload.userCheckedColumns.includes(key) && key !== "connection")
            updatedSettingsPayload.delete(key);
        })
        console.log("updatedSettingsPayload ==> ", updatedSettingsPayload);
        return updatedSettingsPayload;
      });
    }
    setShowPreview((prev) => !prev);
  };

  // TODO: MAKE THE API CALL HERE.
  const handleSaveView = (params) => {
    setShowPreview((prev) => !prev);
    console.log("settings final payload -> ", settingsPayload);
    console.log("new view name -> ",params.newViewName);
  };

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");

      if (typeof type === "undefined" || !type) {
        return;
      }

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      setUserSelection({ selectedMode: type });

      const newNode = {
        id: getId(),
        type,
        position,
        data: {
          userSelection: { selectedMode: type },
          setUserSelection,
          setColumnSetting,
          setFinalPayload,
          finalPayload,
          handleOk,
          deleteNode: (id) =>
            setNodes((nds) => nds.filter((node) => node.id !== id)),
          handleColumnSetting,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [
      setNodes,
      setUserSelection,
      setColumnSetting,
      setFinalPayload,
      finalPayload,
      handleOk,
    ]
  );

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          userSelection,
          finalPayload,
        },
      }))
    );
  }, [userSelection, finalPayload]);

  return (
    <div className="w-full h-screen overflow-hidden">
      <div
        className={`${
          showPreview ? "h-[40%]" : "h-[95%]"
        } transition-all duration-300`}
      >
        <p className="p-2">Source Page</p>
        <div className="w-full h-[calc(100%-2rem)]">
          <div className="w-full h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              onDragOver={onDragOver}
              onDrop={onDrop}
              style={{
                backgroundColor: "#FFFFFF",
              }}
              defaultViewport={{
                x: 0,
                y: 0,
                zoom: 1,
              }}
            >
              <Controls />
              <Background variant="solid" className="bg-white" />
              <Panel position="top-left">
                <SourceSidebar setUserSelection={setUserSelection} />
              </Panel>
            </ReactFlow>
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="h-[60%] overflow-auto">
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg p-4">
            <table className="w-full text-sm text-left rtl:text-right text-black">
              <thead className="text-xs text-white-700 uppercase dark:bg-[#282F49] dark:text-white ">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Connection
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Schema
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Tables
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Views
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3"></th>
                  <th scope="col" className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {sampleData.map((data, index) => (
                  <tr key={index} className="border-b dark:border-white-700">
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-black-900 whitespace-nowrap dark:text-black"
                    >
                      {data.id}
                    </th>
                    <td className="px-6 py-4">{data.connections}</td>
                    <td className="px-6 py-4">{data.description}</td>
                    <td className="px-6 py-4">{data.schema}</td>
                    <td className="px-6 py-4">{data.tables}</td>
                    <td className="px-6 py-4">{data.views}</td>
                    <td className="px-6 py-4">{data.created}</td>
                    <td className="px-6 py-4">
                      <Pencil className="h-5 w-5" />
                    </td>
                    <td className="px-6 py-4">
                      <Trash2 className="h-5 w-5" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-4 border-t p-4">
            <button
              onClick={() => setShowPreview(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={toggleModal}
              className="px-4 py-2 bg-[#8E77BB] text-white rounded-lg hover:bg-[rgb(142,119,187,0.8)]"
            >
              Create a View
            </button>
          </div>
        </div>
      )}

      <ColumnSettings
        columnSetting={columnSetting}
        setColumnSetting={setColumnSetting}
        finalPayload={finalPayload}
        setFinalPayload={setFinalPayload}
        settingsPayload = {settingsPayload}
        setSettingsPayload = {setSettingsPayload}
      />

      {isModalOpen && (
        <SaveViewModal
          toggleModal={toggleModal}
          setFinalPayload={setFinalPayload}
          handleSaveView={handleSaveView}
        />
      )}
    </div>
  );
}
