import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import { useStateContext } from "../../../context/contextProvider";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const nodeTypes = {
  baseNode: BaseNode,
  connection: ConnectionNode,
};

let id = 0;
const getId = () => `node_${id++}`;

export default function Source() {
  const modalState = useLocation().state;

  const { settingsList, setSettingsList, userSelections, setUserSelections } =
    useStateContext();

  const navigate = useNavigate();

  const [userSelection, setUserSelection] = useState({});
  const [columnSetting, setColumnSetting] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => {
    setIsModalOpen((prev) => !prev);
  };

  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);

  const handleColumnSetting = (params) => {
      setColumnSetting(params);
  };

  const handleOk = async (params) => {
    const { settings, viewType, userCheckedColumns } = params;
    if(userCheckedColumns.length === 0)
      return toast.error("Please select at least one column");

    if (!params) return null;

    // Validate Columns
    const groupByColumns = [];
    const aggregateColumns = [];
    let orderByColumns = [];
    
    settings.forEach((item) => {
      if (userCheckedColumns.includes(item.name)) {
        if (item.groupBy === "Yes") groupByColumns.push(item.name);
        if (item.aggregate) aggregateColumns.push(item.name);
        
        if(item.sort) orderByColumns.push({
          field: item.name,
          sortType: item.sort,
          order: item.order,
        });
      }
    });
     // Sorting Order By Columns.
    orderByColumns = orderByColumns.sort((a,b) => a.order - b.order);
    
    console.log("GROUP BY COLUMNS ==> ", groupByColumns);
    console.log("AGGREGATE COLUMNS ==> ", aggregateColumns);
    console.log("User Checked Columns ==> ", userCheckedColumns);
    console.log("Order By Columns ==> ", orderByColumns);

    // Validation for Aggregate and Group By columns
    if (groupByColumns.length > 0 && aggregateColumns.length > 0) {
      let invalidColumns = userCheckedColumns.filter(
        (column) =>
          !aggregateColumns.includes(column) && !groupByColumns.includes(column)
      );
      if (invalidColumns.length > 0) {
        toast.error(
          `Aggregate Error. Columns should either be Aggregate or Group By Columns. Invalid Columns= ${invalidColumns}`
        );
        return null;
      }
    }

    if (aggregateColumns.length > 0 && groupByColumns.length === 0) {
      let invalidColumns = userCheckedColumns.filter(
        (column) => !aggregateColumns.includes(column)
      );
      if (invalidColumns.length > 0) {
        toast.error(
          `Aggregate Error. Columns should either be Aggregate or Group By Columns. Invalid Columns= ${invalidColumns}`
        );
        return null;
      }
    }

    if (aggregateColumns.length === 0 && groupByColumns.length > 0) {
      let invalidColumns = userCheckedColumns.filter(
        (column) => !groupByColumns.includes(column)
      );
      if (invalidColumns.length > 0) {
        toast.error(
          `Group By Error. Invalid Columns = ${invalidColumns.join(", ")}`
        );
        return null;
      }
    }

    // Remove Unchecked Columns from Settings List
    const updatedSettingsList = settings.filter((item) =>
      userCheckedColumns.includes(item.name)
    );
    
    const updatedUserSelections = new Map(params.userSelections);
    updatedUserSelections.set("viewType", viewType);

    console.log("updatedUserSelections ===> ", updatedUserSelections);

    // Generate API Payload
    let apiPayload;
    if (updatedUserSelections.get("viewType") === "Source") {
      apiPayload = {
        view_type: "Source",
        view: updatedUserSelections.get("viewName"),
        select_fields: [],
        group_by: [],
      };
    }

    if (updatedUserSelections.get("viewType") === "Connection") {
      apiPayload = {
        view_type: "Base",
        connection_name: updatedUserSelections.get("connection"),
        schema_name: updatedUserSelections.get("schema"),
        table_name: updatedUserSelections.get("table"),
        select_fields: [],
        group_by: [],
      };
    }

    // Configuring Aliases
    updatedSettingsList.forEach((item) => {
      if (item.output === "Yes") {
        if (item.aggregate)
          apiPayload["select_fields"].push({
            field: `${item.aggregate.toLowerCase()}(${item.name})`,
            alias: item.alias,
          });
        else
          apiPayload["select_fields"].push({
            field: item.name,
            alias: item.alias,
          });
      }

      if (item.groupBy === "Yes") apiPayload["group_by"].push(item.name);
    });

    // Set orderby fields
    apiPayload["order_by"] = orderByColumns.map(item => `${item.field} ${item.sortType}`);

    console.log("Final API Payload ===> ", apiPayload);

    // Saving API payload to use in handleSaveView().
    updatedUserSelections.set("apiPayload", apiPayload);

    const response = await fetch(
      `${
        import.meta.env.VITE_FAST_API_V2
      }/generate-base-view?execute_query=true`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            import.meta.env.VITE_FEDERATION_ACCESS_TOKEN
          }`,
        },
        body: JSON.stringify(apiPayload),
      }
    );
    const responseText = await response.text();
    const jsonObjects = responseText.trim().split("\n");
    const data = jsonObjects
      .map((jsonObject) => {
        try {
          return JSON.parse(jsonObject);
        } catch (error) {
          console.log("Error parsing JSON object: ", e);
          toast.error("Error Parsing JSON Object ");
          return null;
        }
      })
      .filter((item) => item !== null);

    if (response.status === 200) {
      if(!data.length > 0){
        toast.error(`${viewType === "Source" ? "View" : "Table"} is empty!`);
        return null;
      }
      
      setPreviewData(data);
      setShowPreview((prev) => prev === false? !prev : prev);
      toast.success("View Query Executed!");
    } else {
      toast.error("Error while generating output preview.");
    }

    setSettingsList((prev) => {
      return updatedSettingsList;
    });
    setUserSelections((prev) => {
      return updatedUserSelections;
    });
  };

  const handleSaveView = async (params) => {
    const { newViewName } = params;
    let apiPayload = userSelections.get("apiPayload");
    apiPayload["view_name"] = newViewName;

    const viewExistsResponse = await fetch(
      `${import.meta.env.VITE_FAST_API_V2}/view-exists/${newViewName}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            import.meta.env.VITE_FEDERATION_ACCESS_TOKEN
          }`,
        },
      }
    );

    if (viewExistsResponse.status !== 200) {
      toast.error("Error checking if view exists");
      return null;
    }
    const viewExists = await viewExistsResponse.json();
    console.log("viewExists ===> ", viewExists);
    if (viewExists["result"]) {
      toast.error("View already exists");
      return null;
    }

    console.log("Final apiPayload ===> ", apiPayload);
    const response = await fetch(
      `${import.meta.env.VITE_FAST_API_V2}/generate-base-view`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            import.meta.env.VITE_FEDERATION_ACCESS_TOKEN
          }`,
        },
        body: JSON.stringify(apiPayload),
      }
    );

    const data = await response.json();

    if (response.status == 200) {
      console.log("Save View Result ==> ", data);
      setShowPreview((prev) => !prev);
      toast.success("VIEW SAVED SUCCESSFULLY.",{autoClose: 2900});
      setTimeout(() => navigate("/federation"), 3000);
    } else {
      toast.error("Error while saving view..");
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
        return null;
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
          deleteNode: (id) =>
            setNodes((nds) => nds.filter((node) => node.id !== id)),
          handleColumnSetting,
          toast,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, setUserSelection, setColumnSetting, handleOk]
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
        className={`${showPreview ? "h-[40%]" : "h-[95%]"} transition-all
        duration-300`}
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
              // fitView
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
          previewData = {previewData}
          setPreviewData = {setPreviewData}
          setShowPreview={setShowPreview}
          toggleModal={toggleModal}
        />
      )}

      <ColumnSettings
        columnSetting={columnSetting}
        setColumnSetting={setColumnSetting}
      />

      {isModalOpen && (
        <SaveViewModal
          toggleModal={toggleModal}
          handleSaveView={handleSaveView}
        />
      )}

      <ToastContainer position="top-right" />
    </div>
  );
}
