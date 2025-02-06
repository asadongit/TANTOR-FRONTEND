import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  Controls,
  Background,
  ReactFlow,
  useNodesState,
  useEdgesState,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ConnectionNode, BaseNode } from "./nodes/baseNodes";
import SourceSidebar from "./nodes/ViewFromSourceSidebar";
import ColumnSettings from "./viewsource/ColumnSettings";
import SaveViewModal from "./viewsource/SaveViewModal";
import SourcePreview from "./viewsource/SourcePreview";
import {useStateContext} from "../../../context/contextProvider";

const nodeTypes = {
  baseNode: BaseNode,
  connection: ConnectionNode,
};

let id = 0;
const getId = () => `node_${id++}`;

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
    description: "A description fot MYSQL",
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

export default function Source() {
  const modalState = useLocation().state;

  const [userSelection, setUserSelection] = useState({});
  const [columnSetting, setColumnSetting] = useState(null);
  
  let {settingsPayload,setSettingsPayload} = useStateContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => {
    setIsModalOpen((prev) => !prev);
  };

  const [showPreview, setShowPreview] = useState(false);

  const handleColumnSetting = (params) => {
    console.log("params ==> ", params);
    if (params.viewType === "Source") {
      setColumnSetting(params);
    }
    if (params.viewType === "Connection") {
      setColumnSetting(params);
    }
  };

  const handleOk = async (payload) => {
    const { viewType, userCheckedColumns } = payload;
    // The payload has the following structure
    // {
    //  userCheckedColumns,
    //  viewType: "Source" or "Connection",
    //  settings: settingsPayload,
    // }
console.log("OUTSIDE SETTINGS ", settingsPayload);
    if (!payload) return;

    // Validate GROUPBY
    const currentSettingsPayload = new Map(payload.settings);
      const groupByColumns = [];
      currentSettingsPayload.forEach((value, key) => {
        if(!["viewName", "connection", "schema", "table"].includes(key)){
          if(value['groupBy'] == "Yes")
            groupByColumns.push(key);
        }
      });

      console.log("GROUP BY COLUMNS ==> ", groupByColumns);

      if(groupByColumns.length > 0){
        let invalidColumns = userCheckedColumns.filter((column) => !groupByColumns.includes(column));
        console.log("invalidColumns ==> ", invalidColumns);
        if(invalidColumns.length > 0)
          alert("INVALID COLUMNS SELECTED (GROUP BY)");
          return;
      }

    setSettingsPayload((prev) => {
      const updatedSettingsPayload = new Map(prev);
      
      updatedSettingsPayload.forEach((_, key) => {
        // Conditional exclusion based on payload viewType
        const shouldDelete = 
          !userCheckedColumns.includes(key) && 
          ((viewType === "Source" && key !== "viewName") || 
          (viewType === "Connection" && !["connection", "schema", "table"].includes(key)));
  
        if (shouldDelete) {
          updatedSettingsPayload.delete(key);
        }
      });
      
      updatedSettingsPayload.set("viewType", viewType)
      return updatedSettingsPayload;
    });

    setShowPreview((prev) => !prev);
  };
  

  const handleSaveView = async (params) => {
    console.log("settings final payload -> ", settingsPayload);
    console.log("new view name -> ", params.newViewName);
    
    let apiPayload;

    if(settingsPayload.get("viewType") === "Source"){
       apiPayload = {
        "view_type": "Source",
        "view": settingsPayload.get("viewName"),
        "view_name": params.newViewName,
        "select_fields": [],
      };
    }else if(settingsPayload.get("viewType") === "Connection"){
      apiPayload = {
        "view_type": "Base",
        "connection_name" : settingsPayload.get("connection"),
        "schema_name": settingsPayload.get("schema"),
        "table_name": settingsPayload.get("table"),
        "view_name": params.newViewName,
        "select_fields": [],
      };
    }
    
    // Settings Alias
    settingsPayload.forEach((value, key) => {
      if(!["connection", "schema", "table", "viewName", "viewType"].includes(key)) {
        apiPayload["select_fields"].push({"field": key, "alias": value["alias"]});
      }
    })

    console.log("API PAYLOAD ===> ",apiPayload)
      const response = await fetch(`${import.meta.env.VITE_FAST_API_V2}/generate-base-view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_ACCESS_TOKEN}`
        },
        body: JSON.stringify(apiPayload),
      });

      const data = await response.json();
      
      if(response.status == 200){
        console.log("Save View Result ==> ", data);
        setShowPreview((prev) => !prev);
      }else {
        alert("ERROR WHEN SAVING VIEW.")
      }
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
          handleOk,
          deleteNode: (id) => setNodes((nds) => nds.filter((node) => node.id !== id)),
          handleColumnSetting,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [
      setNodes,
      setUserSelection,
      setColumnSetting,
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
        },
      }))
    );
  }, [userSelection]);

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
        <SourcePreview
          sampleData={sampleData}
          setShowPreview={setShowPreview}
          toggleModal={toggleModal}
        />
      )}

      <ColumnSettings
        columnSetting={columnSetting}
        setColumnSetting={setColumnSetting}
        // settingsPayload={settingsPayload}
        // setSettingsPayload={setSettingsPayload}
      />

      {isModalOpen && (
        <SaveViewModal
          toggleModal={toggleModal}
          handleSaveView={handleSaveView}
        />
      )}
      
    </div>
  );
}