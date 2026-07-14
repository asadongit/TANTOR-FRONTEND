/*eslint-disable*/
import { useEffect, useState, useRef, useCallback } from "react";
import { useStateContext } from "../context/contextViewProvider";
import CircularProgress from "@mui/material/CircularProgress";
import SaveViewModal from "../components/SaveViewModal";
import { useLocation, useNavigate } from "react-router-dom";
import FilterComponent from "../components/FilterComponent";
import { useAuth } from "../../../../context/AuthContext";
import { Icon } from "@iconify/react";
import { X, ArrowUpDown, GripVertical } from "lucide-react";
import { useFederationPolicyIds } from "../../../../hooks/platform/federation";

export function BusinessFooter() {
  const navigate = useNavigate();
  const { finalPayload, handleFinalPayload, connectionPayload, viewPayload, columnSettings, consolidationPayload, nodeCount, nodes, edges, isEditMode, editViewName, clearEditMode } = useStateContext("");
    const { data: policyIds } = useFederationPolicyIds();
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token, project, decodedToken, setSelectedProject, hostnameV1, hostnameV2 } = useAuth();
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const modalState = useLocation().state || {
    queryType: "Regular",
    viewType: "Business",
  };

  const [colOrder, setColOrder] = useState([]);
  const [dragOverCol, setDragOverCol] = useState(null);
  const dragSrcCol = useRef(null);
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const scrollContainerRef = useRef(null);
  const autoScrollRAF = useRef(null);
  const dragClientX = useRef(0);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRAF.current) {
      cancelAnimationFrame(autoScrollRAF.current);
      autoScrollRAF.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    stopAutoScroll();
    const step = () => {
      const el = scrollContainerRef.current;
      if (!el) return;
      const { left, right, width } = el.getBoundingClientRect();
      const ZONE = width * 0.12;
      const MAX_SPEED = 18;
      let speed = 0;
      if (dragClientX.current < left + ZONE)
        speed = -MAX_SPEED * (1 - (dragClientX.current - left) / ZONE);
      else if (dragClientX.current > right - ZONE)
        speed = MAX_SPEED * (1 - (right - dragClientX.current) / ZONE);
      if (speed !== 0) el.scrollLeft += speed;
      autoScrollRAF.current = requestAnimationFrame(step);
    };
    autoScrollRAF.current = requestAnimationFrame(step);
  }, [stopAutoScroll]);

  useEffect(() => () => stopAutoScroll(), [stopAutoScroll]);

  const getFinalNodeId = () => {
    if (!nodes || !edges) return "Union";
    const sourceEdges = new Set(edges.map(e => e.source));
    const finalNodes = nodes.filter(n => 
      (n.type === "consolidation" || n.type === "Join" || n.type === "Union") && 
      !sourceEdges.has(n.id)
    );
    return finalNodes.length > 0 ? finalNodes[0].id : "Union";
  };

  const getSelectFields = (columnSettings, hasOperation) => {
    const finalNodeId = getFinalNodeId();
    const targetColId = columnSettings[finalNodeId] ? finalNodeId : "Union";

    const selectedViews = hasOperation
      ? { [targetColId]: columnSettings[targetColId] }
      : Object.fromEntries(Object.entries(columnSettings).filter(([key]) => key !== targetColId && key !== "Union"));

    return Object.entries(selectedViews || {}).flatMap(([view, columns]) =>
      Object.entries(columns).flatMap(([colName, colPropsArray]) => {
        const configs = Array.isArray(colPropsArray) ? colPropsArray : [colPropsArray];
        let fields = [];

        if (configs[0]?.originalOutput === "Yes") {
          fields.push({ 
            field: hasOperation ? colName : `${view}.${colName}`, 
            is_distinct: configs[0]?.originalDistinct === "Yes",
            alias: configs[0]?.originalAlias || "" 
          });
        }
        
        configs.forEach(colProps => {
          const fieldRef = hasOperation ? colName : `${view}.${colName}`;

          if (colProps.aggregate) {
            fields.push({
              field: fieldRef,
              aggregation: colProps.aggregate.toLowerCase(),
              is_distinct: colProps.aggregateDistinct === "Yes",
              alias: colProps.alias || ""
            });
          } else if (colProps.alias) {
            fields.push({ field: fieldRef, alias: colProps.alias });
          }
        });

        return fields;
      })
    );
  };

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [rowData, setRowData] = useState([]);
  const [colDefs, setColumnDefs] = useState([]);

  useEffect(() => {
    setColOrder(colDefs.map((_, i) => i));
    setSortConfig({ key: "", direction: "asc" });
  }, [colDefs]);

  const orderedCols = colOrder.map(i => colDefs[i]).filter(Boolean);

  const handleColDragStart = (e, vi) => {
    dragSrcCol.current = vi;
    e.dataTransfer.effectAllowed = "move";
    startAutoScroll();
  };
  const handleColDragOver = (e, vi) => {
    e.preventDefault();
    dragClientX.current = e.clientX;
    setDragOverCol(vi);
  };
  const handleTableDragOver = (e) => {
    e.preventDefault();
    dragClientX.current = e.clientX;
  };
  const handleColDrop = (e, vi) => {
    e.preventDefault();
    const src = dragSrcCol.current;
    if (src === null || src === vi) { setDragOverCol(null); return; }
    const next = [...colOrder];
    const [m] = next.splice(src, 1);
    next.splice(vi, 0, m);
    setColOrder(next);
    setDragOverCol(null);
    dragSrcCol.current = null;
  };
  const handleColDragEnd = () => {
    setDragOverCol(null);
    dragSrcCol.current = null;
    stopAutoScroll();
  };
  const handleSort = (key) =>
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));

  const sortedData = [...rowData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const av = a[sortConfig.key], bv = b[sortConfig.key];
    if (typeof av === "number" && typeof bv === "number")
      return sortConfig.direction === "asc" ? av - bv : bv - av;
    return sortConfig.direction === "asc"
      ? String(av ?? "").localeCompare(String(bv ?? ""))
      : String(bv ?? "").localeCompare(String(av ?? ""));
  });

  const toTitleCase = s =>
    s.replace(/_/g, " ").toLowerCase().replace(/\w/g, c => c.toUpperCase());

  const helperPreviewData = async (cleanApiPayload) => {
    try {
      const response = await fetch(`${hostnameV2}/save-view?execute_query=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(cleanApiPayload),
      });

      const responseText = await response.text();

      if (response.ok) {
        const data = responseText.trim().split("\n").reduce((validData, jsonString) => {
          try { validData.push(JSON.parse(jsonString)); }
          catch (error) { console.error("Error parsing JSON object:", error, jsonString); }
          return validData;
        }, []);

        if (data.length === 0) {
          setError("Table is empty");
          setRowData([]);
        } else {
          setLoading(false);
          const columns = Object.keys(data[0]);
          setColumnDefs(columns);
          setRowData(data);
          setError(null);
          setToast({ show: true, message: "View Query Executed!", type: "success" });
          setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
        }
        return data;
      } else {
        try {
          const errorData = JSON.parse(responseText);
          let errorMessage = errorData.detail || "Unknown error occurred";
          
          if (Array.isArray(errorMessage)) {
            errorMessage = errorMessage.map(err => err.msg || JSON.stringify(err)).join(', ');
          } else if (typeof errorMessage === 'object') {
            errorMessage = JSON.stringify(errorMessage);
          }
          
          setError(errorMessage);
          setToast({ show: true, message: errorMessage, type: "error" });
          setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
          setColumnDefs([]);
          setRowData([]);
          setPreview(false);
        } catch (parseError) {
          setError("An unexpected error occurred");
          setToast({ show: true, message: "An unexpected error occurred", type: "error" });
          setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
        }
        return null;
      }
    } catch (error) {
      console.error("Error executing query:", error);
      setError("Something went wrong!");
      setToast({ show: true, message: "Failed to execute query", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
      setColumnDefs([]);
      setRowData([]);
      setPreview(false);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviewData = async (payload = null, filterData = null) => {
    setIsFilterModalOpen(false);

    let apiPayload = payload || finalPayload;
    if (filterData) apiPayload = { ...apiPayload, filter_data: filterData };

    const isSkipCondition = !payload && !filterData;
    apiPayload = { ...apiPayload, skip_filter: isSkipCondition };

    let apiPayloadForApi = { ...apiPayload };
    if (isSkipCondition) delete apiPayloadForApi.filter_data;

    const connections = connectionPayload.map(item => item.selectedConnection);
    const views = viewPayload.map(item => item.view);
    const metadata = { connections, views };

    let selectColumns = new Set();
    let groupByColumns = new Set();
    let aggregateColumns = new Set();
    let sortColumns = new Set();

    const hasOperation = apiPayloadForApi?.operation !== undefined;
    const finalNodeId = getFinalNodeId();
    const targetColId = columnSettings[finalNodeId] ? finalNodeId : "Union";
    const source = hasOperation
      ? Object.fromEntries(Object.entries(columnSettings).filter(([key]) => key === targetColId))
      : Object.fromEntries(Object.entries(columnSettings).filter(([key]) => key !== targetColId && key !== "Union"));

    if (!source || Object.keys(source).length === 0) {
      setToast({ show: true, message: "Please select columns first before proceeding.", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
      return;
    }

    const selectFields = getSelectFields(columnSettings, hasOperation);
    if (!selectFields || selectFields.length === 0) {
      setToast({ show: true, message: "Please select at least one column before proceeding.", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
      return;
    }

    Object.entries(source).forEach(([tableOrColumn, columnsOrProperties]) => {
      Object.entries(columnsOrProperties).forEach(([column, propertiesArray]) => {
        const configs = Array.isArray(propertiesArray) ? propertiesArray : [propertiesArray];
        
        if (configs[0]?.originalOutput === "Yes") {
          selectColumns.add(column);
        }

        configs.forEach(properties => {
          if (properties.aggregate || properties.alias) selectColumns.add(column);
          if (properties.groupBy === "Yes") groupByColumns.add(column);
          if (properties.aggregate) aggregateColumns.add(column);
          if (parseInt(properties.order, 10) > 0 && properties.sort.trim() !== "") sortColumns.add(column);
        });
      });
    });

    selectColumns = [...selectColumns];
    groupByColumns = [...groupByColumns];
    aggregateColumns = [...aggregateColumns];
    sortColumns = [...sortColumns];

    // if (modalState.queryType === "Regular") {
    //   const invalidSelectColumns = selectColumns.filter(
    //     col => !groupByColumns.includes(col) && !aggregateColumns.includes(col)
    //   );
    //   if (groupByColumns.length > 0 && selectColumns.length > 0 && invalidSelectColumns.length > 0) {
    //     setToast({ show: true, message: `${invalidSelectColumns.join(', ')} must be an aggregate expression or appear in GROUP BY`, type: "error" });
    //     setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    //     return;
    //   }

    //   const nonAggregatedSelectColumns = selectColumns.filter(col => !aggregateColumns.includes(col));
    //   if (groupByColumns.length === 0 && aggregateColumns.length > 0 && selectColumns.length > 0 && nonAggregatedSelectColumns.length > 0) {
    //     setToast({ show: true, message: `${nonAggregatedSelectColumns.join(', ')} must be an aggregate expression or appear in GROUP BY`, type: "error" });
    //     setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    //     return;
    //   }

    //   const invalidSortColumns = sortColumns.filter(col => !groupByColumns.includes(col) && !aggregateColumns.includes(col));
    //   if ((groupByColumns.length > 0 || aggregateColumns.length > 0) && invalidSortColumns.length > 0) {
    //     setToast({ show: true, message: `${invalidSortColumns.join(', ')} must be an aggregate expression or appear in GROUP BY`, type: "error" });
    //     setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    //     return;
    //   }
    // }

    if (Object.keys(apiPayloadForApi).length > 0) {
      setPreview(true);
      setLoading(true);
      setRowData([]);

      const groupByArray = Object.entries(source).flatMap(([view, columns]) =>
        Object.entries(columns)
          .filter(([col, settingsArray]) => {
            const configs = Array.isArray(settingsArray) ? settingsArray : [settingsArray];
            return configs.some(s => s.groupBy === "Yes");
          })
          .map(([col]) => (hasOperation ? `${col}` : `${view}.${col}`))
      );

      let orderBy = [];
      Object.keys(source).forEach(table => {
        Object.entries(source[table]).forEach(([key, columnArray]) => {
          const configs = Array.isArray(columnArray) ? columnArray : [columnArray];
          let hasProcessedOriginal = false;
          configs.forEach(column => {
            if (column.originalSort && !hasProcessedOriginal) {
              const inner = hasOperation ? key : `${table}.${key}`;
              orderBy.push({ key: inner, order: parseInt(column.originalOrder || 1, 10), sort: column.originalSort.toLowerCase() });
              hasProcessedOriginal = true;
            }
            if (column.order && parseInt(column.order, 10) > 0 && column.sort.trim() !== "") {
              let field = key;
              if (column.alias) {
                field = column.alias;
              } else if (column.aggregate) {
                const inner = hasOperation ? key : `${table}.${key}`;
                field = `${column.aggregate.toLowerCase()}(${inner})`;
              } else {
                field = hasOperation ? key : `${table}.${key}`;
              }
              orderBy.push({ key: field, order: parseInt(column.order, 10), sort: column.sort.toLowerCase() });
            }
          });
        });
      });
      orderBy.sort((a, b) => a.order - b.order);
      const finalOrderBy = orderBy.map(col => {
        const sortOrder = col.sort.toLowerCase() === "ascending" ? "ASC" : "DESC";
        return `${col.key} ${sortOrder}`;
      });

      const selectFields = getSelectFields(columnSettings, hasOperation);
      const updatedPayload = { ...apiPayloadForApi, group_by: groupByArray, order_by: finalOrderBy, select_fields: selectFields, metadata, policy_id: policyIds || []  };

      handleFinalPayload({ ...apiPayload, group_by: groupByArray, order_by: finalOrderBy, select_fields: selectFields, metadata, policy_id: policyIds || [], });
      helperPreviewData(updatedPayload);
    }
  };

  const validateNodes = () => {
    const totalNodeCounts = nodeCount.connection + nodeCount.sourceView;
    const joinsKeyExists = 'joins' in (finalPayload || {});
    const joins = finalPayload?.joins || [];
    const operation = finalPayload?.operation;
    const numberOfConnectionNodes = Array.isArray(connectionPayload) ? connectionPayload.length : 0;
    const numberOfViewNodes = Array.isArray(viewPayload) ? viewPayload.length : 0;
    const numberOfConsolidationNodes = Array.isArray(consolidationPayload) ? consolidationPayload.length : 0;
    console.log("finalpayload is @@@ ", finalPayload)

    try {
      const expectedViewNodes = nodeCount?.sourceView || 0;
      const expectedConnectionNodes = nodeCount?.connection || 0;
      const expectedConsolidationNodes = nodeCount?.consolidation || 0;

      console.log("numberOfConsolidationNodes is @@ ",numberOfConsolidationNodes)
      console.log("expectedConsolidationNodes is @@ ",expectedConsolidationNodes)

      if (numberOfViewNodes !== expectedViewNodes)
        throw new Error(`Please configure all selected Source View nodes! Expected: ${expectedViewNodes}, Configured: ${numberOfViewNodes}`);
      if (numberOfConnectionNodes !== expectedConnectionNodes)
        throw new Error(`Please configure all selected Connection nodes! Expected: ${expectedConnectionNodes}, Configured: ${numberOfConnectionNodes}`);
      if (expectedConsolidationNodes != (totalNodeCounts - 1))
        throw new Error(`To combine ${totalNodeCounts} sources, you need exactly ${totalNodeCounts - 1} consolidation node(s). Currently configured: ${expectedConsolidationNodes}`);
      if (numberOfConsolidationNodes !== expectedConsolidationNodes * 2)
        throw new Error(`Please connect all consolidation nodes properly!`);
      if (!finalPayload?.union && joinsKeyExists && (joins.length === 0 || expectedConsolidationNodes !== joins.length))
        throw new Error(`Please configure all Consolidation nodes!`);
      if (expectedConsolidationNodes > 0 && (!finalPayload?.joins || finalPayload.joins.length === 0) && !finalPayload?.union)
        throw new Error(`Please configure Consolidation nodes! No joins or unions found in the configuration.`);
    } catch (err) {
      setToast({ show: true, message: err?.message, type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
      return false;
    }
    return true;
  };

  const handleClick = async () => {
    if (!validateNodes()) return;

    if (finalPayload && Object.keys(finalPayload).length > 0) {
      if (modalState.queryType == "Regular") {
        setIsFilterModalOpen(true);
      } else {
        const connections = connectionPayload.map(item => item.selectedConnection);
        const views = viewPayload.map(item => item.view);
        const metadata = { connections, views };
        let selectColumns = new Set();
        let groupByColumns = new Set();
        let aggregateColumns = new Set();
        let sortColumns = new Set();

        const hasOperation = finalPayload?.operation !== undefined;
        const finalNodeId = getFinalNodeId();
        const targetColId = columnSettings[finalNodeId] ? finalNodeId : "Union";
        const source = hasOperation
          ? Object.fromEntries(Object.entries(columnSettings).filter(([key]) => key === targetColId))
          : Object.fromEntries(Object.entries(columnSettings).filter(([key]) => key !== targetColId && key !== "Union"));

        if (!source || Object.keys(source).length === 0) {
          setToast({ show: true, message: "Please select columns first before proceeding.", type: "error" });
          setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
          return;
        }

        const selectFields = getSelectFields(columnSettings, hasOperation);
        if (!selectFields || selectFields.length === 0) {
          setToast({ show: true, message: "Please select at least one column before proceeding.", type: "error" });
          setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
          return;
        }

        Object.entries(source).forEach(([tableOrColumn, columnsOrProperties]) => {
          const columns = hasOperation ? columnsOrProperties : columnsOrProperties;

          Object.entries(columns).forEach(([column, propertiesArray]) => {
            const configs = Array.isArray(propertiesArray) ? propertiesArray : [propertiesArray];
            
            if (configs[0]?.originalOutput === "Yes") {
              selectColumns.add(column);
            }

            configs.forEach(properties => {
              if (properties.aggregate || properties.alias) {
                selectColumns.add(column);
              }
              if (properties.groupBy === "Yes") {
                groupByColumns.add(column);
              }
              if (properties.aggregate) {
                aggregateColumns.add(column);
              }
              if (parseInt(properties.order, 10) > 0 && properties.sort.trim() !== "") {
                sortColumns.add(column);
              }
            });
          });
        });

        selectColumns = [...selectColumns];
        groupByColumns = [...groupByColumns];
        aggregateColumns = [...aggregateColumns];
        sortColumns = [...sortColumns];

        if (Object.keys(finalPayload).length > 0) {
          setPreview(true);
          setLoading(true);
          setRowData([]);

          const groupByArray = Object.entries(source).flatMap(([view, columns]) =>
            Object.entries(columns)
              .filter(([col, settingsArray]) => {
                const configs = Array.isArray(settingsArray) ? settingsArray : [settingsArray];
                return configs.some(s => s.groupBy === "Yes");
              })
              .map(([col]) => (hasOperation ? `${col}` : `${view}.${col}`))
          );

          let orderBy = [];
          Object.keys(source).forEach(table => {
            Object.entries(source[table]).forEach(([key, columnArray]) => {
              const configs = Array.isArray(columnArray) ? columnArray : [columnArray];
              let hasProcessedOriginal = false;
              configs.forEach(column => {
                if (column.originalSort && !hasProcessedOriginal) {
                  const inner = hasOperation ? key : `${table}.${key}`;
                  const field = column.originalAlias ? `"${column.originalAlias}"` : inner;
                  orderBy.push({ key: field, order: parseInt(column.originalOrder || 1, 10), sort: column.originalSort.toLowerCase() });
                  hasProcessedOriginal = true;
                }
                if (column.order && parseInt(column.order, 10) > 0 && column.sort.trim() !== "") {
                  let field = key;
                  if (column.alias) {
                    field = `"${column.alias}"`;
                  } else if (column.aggregate) {
                    const distinctStr = column.aggregateDistinct === "Yes" ? "distinct " : "";
                    const inner = hasOperation ? key : `${table}.${key}`;
                    field = `${column.aggregate.toLowerCase()}(${distinctStr}${inner})`;
                  } else {
                    field = hasOperation ? key : `${table}.${key}`;
                  }
                  orderBy.push({ key: field, order: parseInt(column.order, 10), sort: column.sort.toLowerCase() });
                }
              });
            });
          });
          orderBy.sort((a, b) => a.order - b.order);
          const finalOrderBy = orderBy.map(col => {
            const sortOrder = col.sort.toLowerCase() === "ascending" ? "ASC" : "DESC";
            return `${col.key} ${sortOrder}`;
          });

          const selectFields = getSelectFields(columnSettings, hasOperation);
          const updatedPayload = { ...finalPayload, group_by: groupByArray, order_by: finalOrderBy, select_fields: selectFields, metadata,  policy_id: policyIds || [],  };

          handleFinalPayload(updatedPayload);
          helperPreviewData(updatedPayload);
        }
      }
    } else {
      setToast({ show: true, message: "Select inputs first", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => setIsModalOpen(prev => !prev);

  const handleSaveView = async (params) => {
    const { newViewName } = params;
    finalPayload["view_name"] = newViewName.toLowerCase();

    if (finalPayload.skip_filter === true) {
      delete finalPayload.filter_data;
      delete finalPayload.skip_filter;
    } else {
      delete finalPayload.skip_filter;
    }


    if (!isEditMode || (isEditMode && newViewName !== editViewName)) {
      const viewExistsResponse = await fetch(`${hostnameV2}/view-exists/${newViewName}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (viewExistsResponse.status !== 200) {
        setToast({ show: true, message: "Error checking if view exists", type: "error" });
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
        return null;
      }
      const viewExists = await viewExistsResponse.json();
      if (viewExists["result"]) {
        setToast({ show: true, message: "View already exists", type: "error" });
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
        return null;
      }
    }

    const cleanNodes = (nodes || []).map(n => {
      const { _isRestoring, setUserSelection, setColumnSetting, updateNodeData, handleOk, deleteNode, handleColumnSetting, setShowQueryEditor, setToast, queryType, ...cleanData } = n.data || {};
      return { ...n, data: cleanData };
    });

    const newPayload = {
      ...finalPayload,
      project: (project === "default" || project === "none") ? "default" : project,
      created_by: decodedToken?.preferred_username,
      policy_id: policyIds || [],

      extra_info: {
        queryType: modalState.queryType,
        view_name: finalPayload.view_name,
        isMateralizedView: finalPayload.isMateralizedView ?? false,
        isCaching: finalPayload.isCaching ?? false,
        ...(finalPayload.complex_query !== undefined && { complex_query: finalPayload.complex_query }),
        ...(finalPayload.grace_period !== undefined && { grace_period: finalPayload.grace_period }),
        ...(finalPayload.cache_ttl !== undefined && { cache_ttl: finalPayload.cache_ttl }),
        edit_flow: {
          nodes: cleanNodes,
          edges: edges || [],
          columnSettings: columnSettings || {},
          filter_data: finalPayload.filter_data || [],
          columnsDataType: finalPayload.columnsDataType || [],
          ...(finalPayload.joins && { joins: finalPayload.joins }),
          ...(finalPayload.base_join && { base_join: finalPayload.base_join }),
          ...(finalPayload.base_join_def && { base_join_def: finalPayload.base_join_def }),
          ...(finalPayload.operation && { operation: finalPayload.operation }),
          ...(finalPayload.union && { union: finalPayload.union }),
          ...(finalPayload.union_fields && { union_fields: finalPayload.union_fields }),
          ...(finalPayload.defs && { defs: finalPayload.defs }),
        }
      }
    };

    const endpoint = isEditMode ? `${hostnameV2}/edit-view` : `${hostnameV2}/save-view`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(newPayload),
    });

    const data = await response.json();

    if (response.ok) {
      setToast({ show: true, message: isEditMode ? "View Edited Successfully." : "View Saved Successfully.", type: "success" });
      if (isEditMode) {
        clearEditMode();
      }
      setTimeout(() => { setToast({ show: false, message: "", type: "" }); navigate("/federation"); }, 3000);
    } else {
      setToast({ show: true, message: isEditMode ? "Error while editing view.." : "Error while saving view..", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    }
  };

  return (
    <>
      {preview && (
        <>
          <div className="text-black mt-2 mb-2 ml-2 font-semibold">Output Preview</div>
          <div className="bg-white shadow overflow-hidden h-[32%] z-50 flex flex-col">
            {loading && (
              <div className="flex justify-center w-full h-full items-center">
                <CircularProgress />
              </div>
            )}
            {!loading && rowData.length > 0 && error == null && (
              <div ref={scrollContainerRef} className="overflow-auto h-full" onDragOver={handleTableDragOver}>
                <table className="w-full bg-white" style={{ borderCollapse: "collapse" }}>
                  <thead className="border-b border-gray-200">
                    <tr>
                      {orderedCols.map((col, vi) => (
                        <th
                          key={col}
                          draggable
                          onDragStart={e => handleColDragStart(e, vi)}
                          onDragOver={e => handleColDragOver(e, vi)}
                          onDrop={e => handleColDrop(e, vi)}
                          onDragEnd={handleColDragEnd}
                          title={toTitleCase(col)}
                          onClick={() => handleSort(col)}
                          style={{
                            background: "#F9F9F9",
                            color: "#332849",
                            padding: "12px 16px",
                            fontSize: "13px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            maxWidth: "160px",
                            overflow: "hidden",
                            cursor: "grab",
                            userSelect: "none",
                            borderLeft: dragOverCol === vi ? "2px solid #8e78b7" : "2px solid transparent",
                            transition: "border-color 0.15s ease, background 0.15s ease",
                            position: "sticky",
                            top: 0,
                            zIndex: 10,
                            textAlign: "left",
                            verticalAlign: "middle",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                            <GripVertical size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                              {toTitleCase(col)}
                            </span>
                            <ArrowUpDown
                              size={13}
                              style={{ flexShrink: 0, opacity: sortConfig.key === col ? 1 : 0.5 }}
                            />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((row, ri) => (
                      <tr key={ri} style={{ borderBottom: "1px solid #e5e5e5" }} className="hover:bg-gray-50">
                        {orderedCols.map((col, ci) => {
                          const val = row[col];
                          const isLink = typeof val === "string" && val.startsWith("http");
                          return (
                            <td
                              key={ci}
                              title={String(val ?? "")}
                              style={{
                                padding: "11px 16px",
                                fontSize: "14px",
                                color: "#23252D",
                                whiteSpace: "nowrap",
                                maxWidth: "260px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                verticalAlign: "middle",
                              }}
                            >
                              {isLink
                                ? <a href={val} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">{val}</a>
                                : (val === 0 ? 0 : val ?? "-")}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <div className='bg-white w-full py-2.5 flex justify-end border-solid border-t-2'>
        <div className="mr-3">
          {preview && (
            <button
              type="button"
              onClick={() => setPreview(false)}
              className="text-black bg-white hover:bg-gray-50 focus:ring-1 rounded-lg text-sm px-8 py-1 mr-2 focus:outline-none border-solid border-2"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={preview === true ? toggleModal : handleClick}
            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-8 py-1 mr-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            {preview ? (isEditMode ? "Edit view" : "Create view") : "Next"}
          </button>
        </div>
      </div>

      {isModalOpen && <SaveViewModal toggleModal={toggleModal} handleSaveView={handleSaveView} />}
      {isFilterModalOpen && (
        <FilterComponent
          setIsOpen={setIsFilterModalOpen}
          columns={(() => {
            if (finalPayload?.columnsDataType && finalPayload.columnsDataType.length > 0) {
              return finalPayload.columnsDataType;
            }

            const cols = [];
            const seen = new Set();

            [...(viewPayload || []), ...(connectionPayload || [])].forEach(item => {
              if (Array.isArray(item.Columns) && item.view) {
                item.Columns.forEach(col => {
                  const colName = col.column_name || col.column;
                  const colType = col.data_type || col.datatype || 'varchar';
                  const fullName = `${item.view}.${colName}`;
                  if (!seen.has(fullName)) {
                    seen.add(fullName);
                    cols.push({ name: fullName, type: colType });
                  }
                });
              }
            });

            if (cols.length === 0) {
              Object.entries(columnSettings || {}).forEach(([viewKey, viewCols]) => {
                if (typeof viewCols !== 'object') return;
                Object.keys(viewCols).forEach(colName => {
                  const fullName = (viewKey === 'Union' || viewKey.startsWith('node_'))
                    ? colName
                    : `${viewKey}.${colName}`;
                  if (!cols.some(c => c.name === fullName)) {
                    cols.push({ name: fullName, type: 'varchar' });
                  }
                });
              });
            }
            return cols;
          })()}
          onApply={fetchPreviewData}
        />
      )}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn ${toast.type === "success" ? "bg-green-100 text-green-800 border-l-4 border-green-500" : "bg-red-100 text-red-800 border-l-4 border-red-500"}`}>
          <Icon icon={toast.type === "success" ? "mdi:check-circle" : "mdi:alert-circle"} className="h-5 w-5" />
          <p>{toast.message}</p>
          <button onClick={() => setToast({ show: false, message: "", type: "" })} className="ml-2 text-gray-500 hover:text-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}