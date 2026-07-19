import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Controls,
  Background,
  ReactFlow,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { LayoutDashboard, X } from "lucide-react";
import { Icon } from "@iconify/react";
import { ConnectionNode, BaseNode } from "../nodes/baseNodes";
import SourceSidebar from "../nodes/ViewFromSourceSidebar";
import ColumnSettings from "./ColumnSettings";
import SaveViewModal from "../components/SaveViewModal";
import SourcePreview from "./SourcePreview";
import { useStateContext } from "../context/contextViewProvider";
import ComplexQueryEditor from "../components/ComplexQueryEditor";
import FilterComponent from "../components/FilterComponent";
import { useAuth } from "../../../../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import { useFederationPolicyIds } from "../../../../hooks/platform/federation";

const nodeTypes = {
  baseNode: BaseNode,
  connection: ConnectionNode,
};

let id = 0;
const getId = () => `node_${id++}`;

export default function Source() {
  const { token, project, decodedToken, setSelectedProject, hostnameV1, hostnameV2 } = useAuth();
  const { data: policyIds } = useFederationPolicyIds();
  const modalState = useLocation().state || {
    queryType: "Regular",
    viewType: "Source",
  };
  const { userSelections, setUserSelections, nodes, setNodes, onNodesChange, edges, setEdges, onEdgesChange, isEditMode, editViewName, clearEditMode } = useStateContext();
  const navigate = useNavigate();
  const [userSelection, setUserSelection] = useState({});
  const [columnSetting, setColumnSetting] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showQueryEditor, setShowQueryEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterModalColumns, setFilterModalColumns] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const toggleModal = () => {
    setIsModalOpen((prev) => !prev);
  };

  const handleColumnSetting = (params) => {
    setColumnSetting(params);
  };

  const validateColumns = (userCheckedColumns, settings) => {
    if (userCheckedColumns.length === 0) {
      setToast({
        show: true,
        message: "Please select at least one column",
        type: "error",
      });
      setTimeout(() => {
        setToast({ show: false, message: "", type: "" });
      }, 3000);
      return false;
    }
    return true;
  };

  const processColumnSettings = (settings, userCheckedColumns) => {
    const groupByColumns = [];
    const aggregateColumns = [];
    const orderByColumns = [];
    const processedOriginalSorts = new Set();

    settings.forEach((item) => {
      if (item.groupBy === "Yes" && !groupByColumns.includes(item.name)) groupByColumns.push(item.name);
      if (item.aggregate && !aggregateColumns.includes(item.name)) aggregateColumns.push(item.name);
      
      if (item.originalSort && !processedOriginalSorts.has(item.name)) {
        processedOriginalSorts.add(item.name);
        orderByColumns.push({
          field: item.originalAlias ? `"${item.originalAlias}"` : item.name,
          sortType: item.originalSort,
          order: item.originalOrder ? item.originalOrder : 1,
        });
      }

      if (item.sort) {
        const distinctStr = item.aggregateDistinct === "Yes" ? "distinct " : "";
        orderByColumns.push({
          field: item.alias ? `"${item.alias}"` : (item.aggregate ? `${item.aggregate.toLowerCase()}(${distinctStr}${item.name})` : item.name),
          sortType: item.sort,
          order: item.order ? item.order : 1,
        });
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
        setToast({
          show: true,
          message: `Aggregate Error. Columns should either be Aggregate or Group By Columns. Invalid Columns= ${invalidColumns}`,
          type: "error",
        });
        setTimeout(() => {
          setToast({ show: false, message: "", type: "" });
        }, 3000);
        return false;
      }
    }

    if (aggregateColumns.length > 0 && groupByColumns.length === 0) {
      const invalidColumns = userCheckedColumns.filter(
        (column) => !aggregateColumns.includes(column)
      );
      if (invalidColumns.length > 0) {
        setToast({
          show: true,
          message: `Aggregate Error. Columns should either be Aggregate or Group By Columns. Invalid Columns= ${invalidColumns}`,
          type: "error",
        });
        setTimeout(() => {
          setToast({ show: false, message: "", type: "" });
        }, 3000);
        return false;
      }
    }

    if (aggregateColumns.length === 0 && groupByColumns.length > 0) {
      const invalidColumns = userCheckedColumns.filter(
        (column) => !groupByColumns.includes(column)
      );
      if (invalidColumns.length > 0) {
        setToast({
          show: true,
          message: `Group By Error. Invalid Columns = ${invalidColumns.join(", ")}`,
          type: "error",
        });
        setTimeout(() => {
          setToast({ show: false, message: "", type: "" });
        }, 3000);
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

    if (
      modalState.queryType === "Complex" &&
      userSelections.has("complex_query")
    ) {
      basePayload.complex_query = userSelections.get("complex_query");
    }

    const processedOriginals = new Set();

    settings.forEach((item) => {
      if (item.originalOutput === "Yes" && !processedOriginals.has(item.name)) {
        processedOriginals.add(item.name);
        basePayload.select_fields.push({
          field: item.name,
          is_distinct: item.originalDistinct === "Yes",
          alias: item.originalAlias || "",
          type: item.type,
        });
      }

      if (item.aggregate) {
        basePayload.select_fields.push({
          field: item.name,
          aggregation: item.aggregate.toLowerCase(),
          is_distinct: item.aggregateDistinct === "Yes",
          alias: item.alias || "",
          type: item.type,
        });
      } else if (item.alias) {
        basePayload.select_fields.push({
          field: item.name,
          alias: item.alias,
          type: item.type,
        });
      }

      if (item.groupBy === "Yes" && !basePayload.group_by.includes(item.name)) {
        basePayload.group_by.push(item.name);
      }
    });

    basePayload.order_by = orderByColumns.map(
      (item) => `${item.field} ${item.sortType}`
    );

    return basePayload;
  };

  const handleOk = async (params) => {
    const { settings, viewType, userCheckedColumns, userSelections, selectedView, selectedConnection, selectedSchema, selectedTable } = params;

    if (!validateColumns(userCheckedColumns, settings)) return null;

    const columnSettings = processColumnSettings(settings, userCheckedColumns);
    // if (modalState.queryType === "Regular") {
    //   if (!validateAggregateAndGroupBy(userCheckedColumns, columnSettings))
    //     return null;
    // }

    const updatedUserSelections = new Map(userSelections);
    updatedUserSelections.set("viewType", viewType);
    if (selectedView) updatedUserSelections.set("viewName", selectedView);
    if (selectedConnection) updatedUserSelections.set("connection", selectedConnection);
    if (selectedSchema) updatedUserSelections.set("schema", selectedSchema);
    if (selectedTable) updatedUserSelections.set("table", selectedTable);

    const apiPayload = createApiPayload(
      updatedUserSelections,
      settings,
      columnSettings.orderByColumns
    );

    const filterModalColumns = [...params.apiColumns];

    await Promise.all([
      setUserSelections((prev) => {
        const newSelections = new Map(prev);
        const oldApiPayload = newSelections?.get("apiPayload");
        if (oldApiPayload) {
          if (oldApiPayload.filter_data) apiPayload["filter_data"] = oldApiPayload.filter_data;
          if (oldApiPayload.view_name) apiPayload["view_name"] = oldApiPayload.view_name;
          if (oldApiPayload.project) apiPayload["project"] = oldApiPayload.project;
          if (oldApiPayload.created_by) apiPayload["created_by"] = oldApiPayload.created_by;
          if (oldApiPayload.extra_info) apiPayload["extra_info"] = oldApiPayload.extra_info;
        }
        newSelections.set("viewType", viewType);
        newSelections.set("apiPayload", apiPayload);
        return newSelections;
      }),
      setFilterModalColumns(filterModalColumns),
    ]);
    if (modalState.queryType === "Regular") return setIsFilterModalOpen(true);

    fetchPreviewData(apiPayload, null);
  };

  const fetchPreviewData = async (payload = null, filterData = null) => {
    setIsFilterModalOpen(false);

    let apiPayload = payload || userSelections.get("apiPayload");

    if (!apiPayload) {
      setToast({
        show: true,
        message: "No API payload available",
        type: "error",
      });
      setTimeout(() => {
        setToast({ show: false, message: "", type: "" });
      }, 3000);
      return;
    }

    if (filterData) {
      apiPayload = {
        ...apiPayload,
        filter_data: filterData,
      };
      setUserSelections((prev) => prev.set("apiPayload", apiPayload));
    }

    const isSkipCondition = payload === null && filterData === null;

    if (isSkipCondition) {
      setUserSelections((prev) =>
        prev.set("apiPayload", {
          ...apiPayload,
          skip_filter: true,
        })
      );

      apiPayload = {
        ...apiPayload,
      };
      delete apiPayload.filter_data;
    } else {
      setUserSelections((prev) =>
        prev.set("apiPayload", {
          ...apiPayload,
          skip_filter: false,
        })
      );
    }

    const cleanApiPayload = { ...apiPayload };
    delete cleanApiPayload.skip_filter;

    try {
      cleanApiPayload.policy_id = policyIds || [];
      const response = await fetch(
        `${hostnameV2}/generate-base-view?execute_query=true`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cleanApiPayload),
        }
      );

      if (response.status === 200) {
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

        setPreviewData(data);
        setShowPreview(true);
        setToast({
          show: true,
          message: "View Query Executed!",
          type: "success",
        });
        setTimeout(() => {
          setToast({ show: false, message: "", type: "" });
        }, 3000);
        return data;
      } else {
        const errorData = await response.json();
        let errorMessage = errorData.detail;
        setToast({
          show: true,
          message: errorMessage,
          type: "error",
        });
        setTimeout(() => {
          setToast({ show: false, message: "", type: "" });
        }, 3000);
        return null;
      }
    } catch (error) {
      setToast({
        show: true,
        message: "Failed to execute query",
        type: "error",
      });
      setTimeout(() => {
        setToast({ show: false, message: "", type: "" });
      }, 3000);
      return null;
    }
  };

  const handleSaveView = async (params) => {
    const { newViewName } = params;

    let apiPayload = { ...userSelections.get("apiPayload") };

    if (!apiPayload) {
      setToast({
        show: true,
        message: "No API payload available",
        type: "error",
      });
      setTimeout(() => {
        setToast({ show: false, message: "", type: "" });
      }, 3000);
      return null;
    }

    apiPayload.view_name = newViewName.toLowerCase();

    if (apiPayload.skip_filter === true) {
      delete apiPayload.filter_data;
      delete apiPayload.skip_filter;
    } else {
      delete apiPayload.skip_filter;
    }

    try {
      apiPayload.policy_id = policyIds || [];

      if (!isEditMode || (isEditMode && newViewName !== editViewName)) {
        const viewExistsResponse = await fetch(
          `${hostnameV2}/view-exists/${encodeURIComponent(newViewName)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!viewExistsResponse.ok) {
          setToast({
            show: true,
            message: "Error checking if view exists",
            type: "error",
          });
          setTimeout(() => {
            setToast({ show: false, message: "", type: "" });
          }, 3000);
          return null;
        }

        const viewExists = await viewExistsResponse.json();

        if (viewExists.result) {
          setToast({
            show: true,
            message: "View already exists",
            type: "error",
          });
          setTimeout(() => {
            setToast({ show: false, message: "", type: "" });
          }, 3000);
          return null;
        }
      }

      const cleanNodes = (nodes || []).map(n => {
        const { _isRestoring, setUserSelection, setColumnSetting, handleOk, deleteNode, handleColumnSetting, setShowQueryEditor, queryType, setToast, ...cleanData } = n.data || {};
        return { ...n, data: cleanData };
      });

      const newPayload = {
        ...apiPayload,
        project: project,
        created_by: decodedToken?.preferred_username,
        extra_info: {
          queryType: modalState.queryType,
          viewType: apiPayload.view_type,
          view_name: apiPayload.view_name,
          isMateralizedView: apiPayload.isMateralizedView ?? false,
          isCaching: apiPayload.isCaching ?? false,
          ...(apiPayload.complex_query !== undefined && { complex_query: apiPayload.complex_query }),
          ...(apiPayload.grace_period !== undefined && { grace_period: apiPayload.grace_period }),
          ...(apiPayload.cache_ttl !== undefined && { cache_ttl: apiPayload.cache_ttl }),
          ...(apiPayload.view_type === "Connection" ? {
            connection: apiPayload.connection_name,
            schema: apiPayload.schema_name,
            table: apiPayload.table_name,
          } : {
            view: apiPayload.view
          }),
          edit_flow: {
            nodes: cleanNodes,
            edges: edges || [],
            filter_data: apiPayload.filter_data || []
          }
        }
      };

      const endpoint = isEditMode ? `${hostnameV2}/edit-base-view` : `${hostnameV2}/generate-base-view`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPayload),
      });

      if (!response.ok) {
        setToast({
          show: true,
          message: isEditMode ? "Error while editing view.." : "Error while saving view..",
          type: "error",
        });
        setTimeout(() => {
          setToast({ show: false, message: "", type: "" });
        }, 3000);
        return null;
      }

      const data = await response.json();

      setShowPreview(false);
      setToast({
        show: true,
        message: isEditMode ? "View edited successfully" : "View saved successfully",
        type: "success",
      });
      if (isEditMode) {
        clearEditMode();
      }
      setTimeout(() => {
        setToast({ show: false, message: "", type: "" });
        navigate("/federation");
      }, 3000);

      return data;
    } catch (error) {
      console.error("Error saving view:", error);
      setToast({
        show: true,
        message: "Failed to save view",
        type: "error",
      });
      setTimeout(() => {
        setToast({ show: false, message: "", type: "" });
      }, 3000);
      return null;
    }
  };



  const hasRestoredRef = useRef(false);

  useEffect(() => {
    if (hasRestoredRef.current) return;
    
    const editMode = sessionStorage.getItem("editMode");
    const editFlowDataStr = sessionStorage.getItem("editFlowData");
    
    if (editMode === "true" && editFlowDataStr) {
      try {
        const editFlowData = JSON.parse(editFlowDataStr);
        if (editFlowData.nodes) {
          setNodes(editFlowData.nodes.map(n => ({
            ...n,
            data: {
              ...n.data,
              _isRestoring: true,
              setUserSelection,
              setColumnSetting,
              handleOk,
              deleteNode: (id) => setNodes((nds) => nds.filter((node) => node.id !== id)),
              handleColumnSetting,
              setShowQueryEditor,
              queryType: modalState.queryType,
              setToast
            }
          })));
        }
        if (editFlowData.edges) {
          setEdges(editFlowData.edges);
        }
        hasRestoredRef.current = true;
      } catch (err) {
        console.error("Failed to parse edit flow data", err);
      }
    }
  }, [setNodes, setEdges, setUserSelection, setColumnSetting, handleOk, handleColumnSetting, setShowQueryEditor, modalState.queryType, setToast]);

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
          setToast, // Updated to pass setToast instead of toast
        },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, setUserSelection, setColumnSetting, handleOk, setToast] // Updated dependencies
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

  const handleViewLinkClick = useCallback(() => {
    setNodes([]);
  }, [setNodes]);

  return (
    <div className="w-full h-screen overflow-hidden bg-[rgba(243,245,247,1)]">
      <div className="flex items-center gap-6 px-4 pt-2">
        <Link
          to="/dashboard"
          className="flex items-center border-solid border gap-2 px-4 py-2 bg-white text-[#8E77BB] font-semibold rounded-lg hover:bg-[#E8E4F1] transition-colors"
        >
          <LayoutDashboard size={20} />
          Dashboard
        </Link>

        <div className="flex items-center">
          <Link to="/" className="text-gray-600 hover:text-gray-900">
            Platform
          </Link>
          <span className="mx-2 text-gray-500">&gt;</span>
          <Link to="/federation" className="text-gray-600 hover:text-gray-900">
            Federation
          </Link>
          <span className="mx-2 text-gray-500">&gt;</span>
          <Link
            to="/federation/view/source"
            className="text-gray-600 hover:text-gray-900"
            onClick={handleViewLinkClick}
          >
            View
          </Link>
          <span className="mx-2 text-gray-500">&gt;</span>
          <span className="text-[#8E77BB] font-medium">Source</span>
        </div>
      </div>

      <div
        className={`${showPreview ? "h-[60vh]" : "h-[calc(100vh-6rem)]"} transition-all duration-300`}
      >
        <div className="w-full h-[calc(100%-2.5rem)]">
          <ToastProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onDragOver={onDragOver}
            onDrop={onDrop}
            style={{
              backgroundColor: "#FFFFF",
              height: "100%",
            }}
            defaultViewport={{
              x: 0,
              y: 0,
              zoom: 1,
            }}
          >
            <Controls />
            <Background variant="solid" className="bg-[#F3F5F7]" />
            <Panel position="top-left">
              <SourceSidebar setUserSelection={setUserSelection} />
            </Panel>
          </ReactFlow>
          </ToastProvider>
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

      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn ${toast.type === "success"
              ? "bg-green-100 text-green-800 border-l-4 border-green-500"
              : "bg-red-100 text-red-800 border-l-4 border-red-500"
            }`}
        >
          <Icon
            icon={toast.type === "success" ? "mdi:check-circle" : "mdi:alert-circle"}
            className="h-5 w-5"
          />
          <p>{toast.message}</p>
          <button
            onClick={() => setToast({ show: false, message: "", type: "" })}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}