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
import ComplexQueryEditor from "./complexsource/ComplexQueryEditor";
import FilterComponent from "./viewsource/FilterComponent";

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
  const [showQueryEditor, setShowQueryEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterModalColumns, setFilterModalColumns] = useState([]);

  const handleColumnSetting = (params) => {
    setColumnSetting(params);
  };
  // Utility functions
  const validateColumns = (userCheckedColumns, settings) => {
    if (userCheckedColumns.length === 0) {
      toast.error("Please select at least one column");
      return false;
    }
    return true;
  };

  const processColumnSettings = (settings, userCheckedColumns) => {
    const groupByColumns = [];
    const aggregateColumns = [];
    const orderByColumns = [];

    settings.forEach((item) => {
      if (userCheckedColumns.includes(item.name)) {
        if (item.groupBy === "Yes") groupByColumns.push(item.name);
        if (item.aggregate) aggregateColumns.push(item.name);
        if (item.sort) {
          orderByColumns.push({
            field: item.name,
            sortType: item.sort,
            order: item.order,
          });
        }
      }
    });

    return {
      groupByColumns,
      aggregateColumns,
      orderByColumns: orderByColumns.sort((a, b) => a.order - b.order),
    };
  };

  const validateAggregateAndGroupBy = (
    userCheckedColumns,
    { groupByColumns, aggregateColumns }
  ) => {
    if (groupByColumns.length > 0 && aggregateColumns.length > 0) {
      const invalidColumns = userCheckedColumns.filter(
        (column) =>
          !aggregateColumns.includes(column) && !groupByColumns.includes(column)
      );
      if (invalidColumns.length > 0) {
        toast.error(
          `Aggregate Error. Columns should either be Aggregate or Group By Columns. Invalid Columns= ${invalidColumns}`
        );
        return false;
      }
    }

    if (aggregateColumns.length > 0 && groupByColumns.length === 0) {
      const invalidColumns = userCheckedColumns.filter(
        (column) => !aggregateColumns.includes(column)
      );
      if (invalidColumns.length > 0) {
        toast.error(
          `Aggregate Error. Columns should either be Aggregate or Group By Columns. Invalid Columns= ${invalidColumns}`
        );
        return false;
      }
    }

    if (aggregateColumns.length === 0 && groupByColumns.length > 0) {
      const invalidColumns = userCheckedColumns.filter(
        (column) => !groupByColumns.includes(column)
      );
      if (invalidColumns.length > 0) {
        toast.error(
          `Group By Error. Invalid Columns = ${invalidColumns.join(", ")}`
        );
        return false;
      }
    }

    return true;
  };

  const createApiPayload = (userSelections, settings, orderByColumns) => {
    const basePayload =
      userSelections.get("viewType") === "Source"
        ? {
            view_type: "Source",
            view: userSelections.get("viewName"),
            select_fields: [],
            group_by: [],
          }
        : {
            view_type: "Connection",
            connection_name: userSelections.get("connection"),
            schema_name: userSelections.get("schema"),
            table_name: userSelections.get("table"),
            select_fields: [],
            group_by: [],
          };

    // Add complex query if exists
    if (
      modalState.queryType === "Complex" &&
      userSelections.has("complex_query")
    ) {
      basePayload.complex_query = userSelections.get("complex_query");
    }

    // Configure fields and group by
    settings.forEach((item) => {
      if (item.output === "Yes") {
        basePayload.select_fields.push({
          field: item.aggregate
            ? `${item.aggregate.toLowerCase()}(${item.name})`
            : item.name,
          alias: item.alias,
          type: item.type,
        });
      }

      if (item.groupBy === "Yes") {
        basePayload.group_by.push(item.name);
      }
    });

    // Add order by
    basePayload.order_by = orderByColumns.map(
      (item) => `${item.field} ${item.sortType}`
    );

    return basePayload;
  };

  const handleOk = async (params) => {
    const { settings, viewType, userCheckedColumns, userSelections } = params;

    if (!validateColumns(userCheckedColumns, settings)) return null;

    const columnSettings = processColumnSettings(settings, userCheckedColumns);

    if (modalState.queryType === "Regular") {
      if (!validateAggregateAndGroupBy(userCheckedColumns, columnSettings))
        return null;
    }

    const updatedSettingsList = settings.filter((item) =>
      userCheckedColumns.includes(item.name)
    );

    const updatedUserSelections = new Map(userSelections);
    updatedUserSelections.set("viewType", viewType);

    const apiPayload = createApiPayload(
      updatedUserSelections,
      updatedSettingsList,
      columnSettings.orderByColumns
    );

    const filterModalColumns = updatedSettingsList.map((item) => {
      return { name: item.name, type: item.type };
    });

    await Promise.all([
      setSettingsList(updatedSettingsList),
      setUserSelections((prev) => {
        const newSelections = new Map(prev);

        const filterData = newSelections?.get("apiPayload")?.filter_data;
        if (filterData) apiPayload["filter_data"] = filterData;

        newSelections.set("viewType", viewType);
        newSelections.set("apiPayload", apiPayload);
        return newSelections;
      }),
      setFilterModalColumns(filterModalColumns),
    ]);
    console.log(modalState.queryType);
    if (modalState.queryType === "Regular") return setIsFilterModalOpen(true);

    fetchPreviewData(apiPayload, null);
  };

  const fetchPreviewData = async (payload = null, filterData = null) => {
    setIsFilterModalOpen(false);
  
    // Get or create API payload
    let apiPayload = payload || userSelections.get("apiPayload");
    
    if (!apiPayload) {
      toast.error("No API payload available");
      return;
    }
  
    // Handle filter data
    if (filterData) {
      apiPayload = {
        ...apiPayload,
        filter_data: filterData
      };
      setUserSelections(prev => prev.set("apiPayload", apiPayload));
    }
  
    // Handle skip condition
    const isSkipCondition = payload === null && filterData === null;
    
    if (isSkipCondition) {
      // First update with skip_filter flag
      setUserSelections(prev => prev.set("apiPayload", {
        ...apiPayload,
        skip_filter: true
      }));
      
      // Then remove filter data for API call
      apiPayload = {
        ...apiPayload
      };
      delete apiPayload.filter_data;
    } else {
      setUserSelections(prev => prev.set("apiPayload", {
        ...apiPayload,
        skip_filter: false
      }));
    }
  
    // Clean up before sending
    const cleanApiPayload = { ...apiPayload };
    delete cleanApiPayload.skip_filter;
    
    console.log("FILTER API PAYLOAD ==> ", cleanApiPayload);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_FAST_API_V2}/generate-base-view?execute_query=true`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_FEDERATION_ACCESS_TOKEN}`,
          },
          body: JSON.stringify(cleanApiPayload),
        }
      );
  
      const responseText = await response.text();
      
      const data = responseText
        .trim()
        .split("\n")
        .reduce((validData, jsonString) => {
          try {
            validData.push(JSON.parse(jsonString));
            return validData;
          } catch (error) {
            console.error("Error parsing JSON object:", error);
            return validData;
          }
        }, []);
  
      if (response.ok) {
        if (data.length === 0) {
          toast.error(`${viewType === "Source" ? "View" : "Table"} is empty!`);
          return null;
        }
  
        setPreviewData(data);
        setShowPreview(true);
        toast.success("View Query Executed!");
        return data; // Return data for potential further use
      } else {
        toast.error("Error while generating output preview.");
        return null;
      }
    } catch (error) {
      console.error("Error executing query:", error);
      toast.error("Failed to execute query");
      return null;
    }
  };
  const handleSaveView = async (params) => {
    const { newViewName } = params;
    
    let apiPayload = { ...userSelections.get("apiPayload") };
    
    if (!apiPayload) {
      toast.error("No API payload available");
      return null;
    }
    
    apiPayload.view_name = newViewName;
    
    if (apiPayload.skip_filter === true) {
      delete apiPayload.filter_data;
      delete apiPayload.skip_filter;
    }else{
      delete apiPayload.skip_filter;
    }

    console.log("SAVE VIEW API PAYLOAD ==> ", apiPayload);
    return null;
    try {
      // Check if view already exists
      const viewExistsResponse = await fetch(
        `${import.meta.env.VITE_FAST_API_V2}/view-exists/${encodeURIComponent(newViewName)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_FEDERATION_ACCESS_TOKEN}`,
          },
        }
      );
      
      if (!viewExistsResponse.ok) {
        toast.error("Error checking if view exists");
        return null;
      }
      
      const viewExists = await viewExistsResponse.json();
      console.log("viewExists ===> ", viewExists);
      
      if (viewExists.result) {
        toast.error("View already exists");
        return null;
      }
      
      // Save the view
      console.log("Final apiPayload ===> ", apiPayload);
      const response = await fetch(
        `${import.meta.env.VITE_FAST_API_V2}/generate-base-view`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_FEDERATION_ACCESS_TOKEN}`,
          },
          body: JSON.stringify(apiPayload),
        }
      );
      
      if (!response.ok) {
        toast.error("Error while saving view..");
        return null;
      }
      
      const data = await response.json();
      console.log("Save View Result ==> ", data);
      
      setShowPreview(false);
      toast.success("VIEW SAVED SUCCESSFULLY.", { autoClose: 2900 });
      
      setTimeout(() => navigate("/federation"), 3000);
      
      return data;
    } catch (error) {
      console.error("Error saving view:", error);
      toast.error("Failed to save view");
      return null;
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
          setShowQueryEditor,
          queryType: modalState.queryType,
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
        className={`${
          showPreview ? "h-[60vh]" : "h-[calc(100vh-4rem)]"
        } transition-all duration-300`}
      >
        <div className="w-full h-[calc(100%-2.5rem)]">
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
              height: "100%",
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
      {showPreview && (
        <SourcePreview
          previewData={previewData}
          setPreviewData={setPreviewData}
          setShowPreview={setShowPreview}
          toggleModal={toggleModal}
        />
      )}
      <ColumnSettings
        columnSetting={columnSetting}
        setColumnSetting={setColumnSetting}
        queryType={modalState.queryType}
      />
      {isModalOpen && (
        <SaveViewModal
          toggleModal={toggleModal}
          handleSaveView={handleSaveView}
        />
      )}
      {showQueryEditor && (
        <ComplexQueryEditor setShowQueryEditor={setShowQueryEditor} />
      )}
      {isFilterModalOpen && (
        <FilterComponent
          setIsOpen={setIsFilterModalOpen}
          columns={filterModalColumns}
          onApply={fetchPreviewData}
        />
      )}

      <ToastContainer position="top-right" />
    </div>
  );
}
