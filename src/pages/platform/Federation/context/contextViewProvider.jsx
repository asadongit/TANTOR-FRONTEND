import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNodesState, useEdgesState } from "reactflow";

const StateContext = createContext();

export const ContextViewProvider = ({ children }) => {
  const [viewPayload, setViewPayload] = useState([]);
  const handleViewPayload = (val) => {
    setViewPayload(val);
  }

  const [connectionPayload, setConnectionPayload] = useState([]);
  const handleConnectionPayload = (val) => {
    setConnectionPayload(val);
  }

  const [consolidationPayload, setConsolidationPayload] = useState([]);
  const handleConsolidationPayload = (val) => {
    setConsolidationPayload((prevPayload) => {
      return [
        ...prevPayload,
        val,
      ];
    });
  };

  const removeConsolidationPayloadByNode = (nodeId) => {
    setConsolidationPayload((prevPayload) =>
      prevPayload.filter(
        (entry) => entry.source !== nodeId && entry.target !== nodeId
      )
    );
  };

  const [nodeCount, setNodeCount] = useState({
    sourceView: 0,
    connection: 0,
    consolidation: 0
  });

  const [complexQueryVersion, setComplexQueryVersion] = useState(0);
  const notifyComplexQuerySaved = useCallback(() => {
    setComplexQueryVersion(v => v + 1);
  }, []);

  const [hideBusinessPreview, setHideBusinessPreview] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const [isEditMode, setIsEditMode] = useState(
    () => sessionStorage.getItem("editMode") === "true"
  );
  const [editViewName, setEditViewName] = useState(
    () => sessionStorage.getItem("editViewName") || ""
  );

  const clearEditMode = () => {
    setIsEditMode(false);
    setEditViewName("");
    sessionStorage.removeItem("editMode");
    sessionStorage.removeItem("editViewName");
    sessionStorage.removeItem("editFlowData");
    sessionStorage.removeItem("editOriginalPayload");
    sessionStorage.removeItem("createQueryType");
  };

  const [finalPayload, setFinalPayload] = useState(() => {
    const editMode = sessionStorage.getItem("editMode");
    const editOriginalPayload = sessionStorage.getItem("editOriginalPayload");
    if (editMode === "true" && editOriginalPayload) {
      try {
        const payload = JSON.parse(editOriginalPayload);
        const editFlow = payload?.extra_info?.edit_flow || {};
        const extraInfo = payload?.extra_info || {};
        if (editFlow.filter_data) {
          payload.filter_data = editFlow.filter_data;
        }
        if (editFlow.joins) payload.joins = editFlow.joins;
        if (editFlow.base_join) payload.base_join = editFlow.base_join;
        if (editFlow.base_join_def) payload.base_join_def = editFlow.base_join_def;
        if (editFlow.operation) payload.operation = editFlow.operation;
        if (editFlow.union) payload.union = editFlow.union;
        if (editFlow.union_fields) payload.union_fields = editFlow.union_fields;
        if (editFlow.defs) payload.defs = editFlow.defs;
        const viewName = sessionStorage.getItem("editViewName") || extraInfo.view_name || editFlow.view_name;
        if (viewName) payload.view_name = viewName;
        if (extraInfo.isMaterializedView !== undefined) payload.isMaterializedView = extraInfo.isMaterializedView;
        if (extraInfo.isCaching !== undefined) payload.isCaching = extraInfo.isCaching;
        if (extraInfo.grace_period !== undefined) payload.grace_period = extraInfo.grace_period;
        if (extraInfo.cache_ttl !== undefined) payload.cache_ttl = extraInfo.cache_ttl;
        if (extraInfo.complex_query !== undefined) payload.complex_query = extraInfo.complex_query;
        return payload;
      } catch (e) {
        return {};
      }
    }
    return {};
  });
  const handleFinalPayload = (val) => {
    setFinalPayload(val);
  };


  const [columnSettings, setColumnSettings] = useState(() => {
    const editMode = sessionStorage.getItem("editMode");
    const editOriginalPayloadStr = sessionStorage.getItem("editOriginalPayload");
    if (editMode === "true" && editOriginalPayloadStr) {
      try {
        const payload = JSON.parse(editOriginalPayloadStr);
        if (payload?.extra_info?.edit_flow?.columnSettings) {
          return payload.extra_info.edit_flow.columnSettings;
        }
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  // Source View States
  const [userSelections, setUserSelections] = useState(() => {
    const map = new Map();
    const editMode = sessionStorage.getItem("editMode");
    const editOriginalPayloadStr = sessionStorage.getItem("editOriginalPayload");
    if (editMode === "true" && editOriginalPayloadStr) {
      try {
        const payload = JSON.parse(editOriginalPayloadStr);
        if (payload?.extra_info?.edit_flow?.filter_data) {
          payload.filter_data = payload.extra_info.edit_flow.filter_data;
        }
        
        const viewType = payload?.extra_info?.viewType || payload.view_type;
        
        if (viewType === "Connection") {
          map.set("viewType", "Connection");
          map.set("connection", payload?.extra_info?.connection || payload.connection_name);
          map.set("schema", payload?.extra_info?.schema || payload.schema_name);
          map.set("table", payload?.extra_info?.table || payload.table_name);
        } else if (viewType === "Source") {
          map.set("viewType", "Source");
          map.set("viewName", payload?.extra_info?.view || payload?.extra_info?.view_name || payload.view || payload.view_name);
        }
        
        const complexQuery = payload?.extra_info?.complex_query || payload.complex_query;
        if (complexQuery) {
          map.set("complex_query", complexQuery);
        }
        map.set("apiPayload", payload);
      } catch (e) {
        console.error(e);
      }
    }
    return map;
  });
  const [settingsList, setSettingsList] = useState([]);
  const [userCheckedColumns, setUserCheckedColumns] = useState([]);
  const [consolidationTypeChange, setConsolidationTypeChange] = useState(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
  }, [userSelections])

  const incrementNodeCount = (nodeType) => {
    setNodeCount(prev => ({
      ...prev,
      [nodeType]: prev[nodeType] + 1
    }));
  };

  const decrementNodeCount = (nodeType) => {
    setNodeCount(prev => ({
      ...prev,
      [nodeType]: Math.max(0, prev[nodeType] - 1)
    }));
  };

  const resetNodeCount = (nodeType) => {
    if (nodeType) {
      setNodeCount(prev => ({
        ...prev,
        [nodeType]: 0
      }));
    } else {
      setNodeCount({
        sourceView: 0,
        connection: 0,
        consolidation: 0
      });
    }
  };

  return (
    <StateContext.Provider
      value={{
        viewPayload,
        handleViewPayload,
        consolidationPayload,
        handleConsolidationPayload,
        removeConsolidationPayloadByNode,
        connectionPayload,
        handleConnectionPayload,
        finalPayload,
        handleFinalPayload,
        columnSettings,
        setColumnSettings,
        settingsList, setSettingsList,
        userSelections, setUserSelections,
        userCheckedColumns, setUserCheckedColumns,
        nodeCount,
        incrementNodeCount,
        decrementNodeCount,
        resetNodeCount,
        consolidationTypeChange,
        setConsolidationTypeChange,
        nodes, setNodes, onNodesChange,
        edges, setEdges, onEdgesChange,
        isEditMode,
        editViewName,
        clearEditMode,
        complexQueryVersion,
        notifyComplexQuerySaved,
        hideBusinessPreview,
        setHideBusinessPreview,
        reactFlowInstance,
        setReactFlowInstance,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);