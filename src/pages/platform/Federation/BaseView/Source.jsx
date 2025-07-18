import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Controls,
  Background,
  ReactFlow,
  useNodesState,
  useEdgesState,
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

const nodeTypes = {
  baseNode: BaseNode,
  connection: ConnectionNode,
};

let id = 0;
const getId = () => `node_${id++}`;

export default function Source() {
  const { token, project, decodedToken, setSelectedProject, hostnameV1, hostnameV2 } = useAuth();
  const modalState = useLocation().state || {
    queryType: "Regular",
    viewType: "Source",
  };
  const { userSelections, setUserSelections } = useStateContext();
  const navigate = useNavigate();
  const [userSelection, setUserSelection] = useState({});
  const [columnSetting, setColumnSetting] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showQueryEditor, setShowQueryEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterModalColumns, setFilterModalColumns] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: '' }); // Added toast state

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

    settings.forEach((item) => {
      if (item.groupBy === "Yes") groupByColumns.push(item.name);
      if (item.aggregate) aggregateColumns.push(item.name);
      if (item.sort) {
        orderByColumns.push({
          field: item.name,
          sortType: item.sort,
          order: item.order ? item.order : 1,
        });
      }
    });

    console.log("Order By Columns ==>> ", orderByColumns);
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

    settings.forEach((item) => {
      if (item.aggregate) {
        basePayload.select_fields.push({
          field: `${item.aggregate.toLowerCase()}(${item.name})`,
          alias: item.alias,
          type: item.type,
        });
      }
      if (item.output === "Yes") {
        basePayload.select_fields.push({
          field: item.name,
          alias: item.aggregate ? "" : item.alias,
          type: item.type,
        });
      }

      if (item.groupBy === "Yes") {
        basePayload.group_by.push(item.name);
      }
    });

    basePayload.order_by = orderByColumns.map(
      (item) => `${item.field} ${item.sortType}`
    );

    return basePayload;
  };

  const handleOk = async (params) => {
    const { settings, viewType, userCheckedColumns, userSelections } = params;

    console.log("SETTINGS ==>> ", settings);
    if (!validateColumns(userCheckedColumns, settings)) return null;

    const columnSettings = processColumnSettings(settings, userCheckedColumns);
    console.log(
      "Sorted Order By Columns ===>>> ",
      columnSettings.orderByColumns
    );
    if (modalState.queryType === "Regular") {
      if (!validateAggregateAndGroupBy(userCheckedColumns, columnSettings))
        return null;
    }

    const updatedUserSelections = new Map(userSelections);
    updatedUserSelections.set("viewType", viewType);

    const apiPayload = createApiPayload(
      updatedUserSelections,
      settings,
      columnSettings.orderByColumns
    );

    const filterModalColumns = [...params.apiColumns];

    console.log("filterModalColumns ==>> ", filterModalColumns);

    await Promise.all([
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

    console.log("FILTER API PAYLOAD ==> ", cleanApiPayload);

    try {
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

        console.log("DATA ==> ", data);
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
      console.log("Error executing query:", error);
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

    console.log("SAVE VIEW API PAYLOAD ==> ", apiPayload);

    try {
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
      console.log("viewExists ===> ", viewExists);

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

      const newPayload = {
        ...apiPayload,
        project: project,
        created_by: decodedToken?.preferred_username,
      };

      const response = await fetch(`${hostnameV2}/generate-base-view`, {
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
          message: "Error while saving view..",
          type: "error",
        });
        setTimeout(() => {
          setToast({ show: false, message: "", type: "" });
        }, 3000);
        return null;
      }

      const data = await response.json();
      console.log("Save View Result ==> ", data);

      setShowPreview(false);
      setToast({
        show: true,
        message: "View saved successfully",
        type: "success",
      });
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