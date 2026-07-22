/*eslint-disable*/
import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import { Handle, Position, useUpdateNodeInternals } from "reactflow";
import { SquareKanban, X, ChevronDown, ChevronUp, Pencil, Search, FileCode, RefreshCw } from "lucide-react";
import { SquareKanban, X, ChevronDown, ChevronUp, Pencil, Search, FileCode, RefreshCw } from "lucide-react";
import { useStateContext } from "../context/contextViewProvider";
import { Modal } from "@mui/material";
import { Columns } from "../BusinessView/Columns";
import ComplexQueryEditor from "../components/ComplexQueryEditor";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { secureQuery } from "../../../datagovernance/DataCatalogue/Components/function";
import { useFederationBaseViewsV2, useFederationViewColumns, useFederationPolicyIds } from "../../../../hooks/platform/federation";


const SearchableSelect = ({ id, openDropdownId, setOpenDropdownId, options, value, onChange, placeholder, disabled = false, isLoading = false }) => {
  const isOpen = openDropdownId === id;
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenDropdownId(null);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredOptions = options.map(option =>
    typeof option === 'object' ? option.connection_name : option
  ).filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectClick = () => {
    if (!disabled && !isLoading) {
      setOpenDropdownId((prev) => (prev === id ? null : id));
      if (openDropdownId !== id) setSearchTerm("");
    }
  };

  const handleOptionClick = (option) => {
    onChange({ target: { value: option } });
    setOpenDropdownId(null);
    setSearchTerm("");
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <div
        className={`w-full px-3 py-2 border-2 rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer flex justify-between items-center ${disabled || isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        onClick={handleSelectClick}
      >
        <span>{value || placeholder}</span>
        {isLoading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </div>

      {isOpen && !isLoading && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white text-black border rounded-lg shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-black" />
              <input
                type="text"
                className="w-full p-2 pl-8 border rounded-md"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-gray-500">No options available</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleOptionClick(option)}
                >
                  {option}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export function SourceViewNode({ id, data, onSave }) {
export function SourceViewNode({ id, data, onSave }) {
  const encodedToken = window._env_?.VITE_FEDERATION_ACCESS_TOKEN;
  const { viewPayload, handleViewPayload, setColumnSettings, columnSettings, finalPayload, handleFinalPayload, incrementNodeCount, decrementNodeCount, setNodes, notifyComplexQuerySaved, setHideBusinessPreview } = useStateContext("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [selectedView, setSelectedView] = useState(data?.selectedView || "");
  const [selectedColumns, setSelectedColumns] = useState(data?.selectedColumns || []);
  const [apiViews, setApiViews] = useState([])
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [selectedView, setSelectedView] = useState(data?.selectedView || "");
  const [selectedColumns, setSelectedColumns] = useState(data?.selectedColumns || []);
  const [apiViews, setApiViews] = useState([])
  const [columnsForViews, setColumnsForViews] = useState({});
  const [selectedColumn, setSelectedColumn] = useState("");
  const [apiColumns, setApiColumns] = useState([])
  const [allowedColumns, setAllowedColumns] = useState([])
  const [apiColumns, setApiColumns] = useState([])
  const [allowedColumns, setAllowedColumns] = useState([])
  const [showQueryEditor, setShowQueryEditor] = useState(false);
  const [previousView, setPreviousView] = useState("");
  const hasIncrementedRef = useRef(false);

  const [columnSearchTerm, setColumnSearchTerm] = useState("");

  const { token, project, decodedToken, setSelectedProject, hostnameV1, hostnameV2 } = useAuth();
  const { showToast } = useToast();

  const locationState = useLocation().state;
  const resolvedQueryType = (() => {
    if (locationState?.queryType) return locationState.queryType;
    const editPayloadStr = sessionStorage.getItem("editOriginalPayload");
    if (editPayloadStr) {
      try {
        const p = JSON.parse(editPayloadStr);
        const cq = p?.extra_info?.complex_query ?? p?.complex_query;
        if (cq) return "Complex";
      } catch (_) {}
    }
    const createQueryType = sessionStorage.getItem("createQueryType");
    if (createQueryType) return createQueryType;
    return "Regular";
  })();
  const modalState = { ...(locationState || {}), queryType: resolvedQueryType };

  useEffect(() => {
    handleFinalPayload((prevData) => ({
      ...prevData,
      view_type: "Integrated View"
    }));
  }, [])

  const paramsStr = new URLSearchParams({
    view_type: "Base",
    project: (project === "default" || project === "none") ? "default" : project,
    created_by: decodedToken?.preferred_username,
  }).toString();

  const { isFetching: isFetchingPolicies, refetch: refetchPolicyIds } = useFederationPolicyIds();
  const { data: apiViewsRaw, isFetching: isLoadingViews, refetch: refetchViews } = useFederationBaseViewsV2(paramsStr);
  const { data: apiColumnsRaw, isFetching: isLoadingColumns, refetch: refetchColumns } = useFederationViewColumns(selectedView);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async (e) => {
    e.stopPropagation();
    setIsRefreshing(true);
    try {
      await refetchPolicyIds();
      const promises = [refetchViews()];
      if (selectedView) promises.push(refetchColumns());
      await Promise.all(promises);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (apiViewsRaw && apiViewsRaw.result) {
      setApiViews(apiViewsRaw.result.map(v => typeof v === 'string' ? v : (v.view_name || v)).sort((a, b) => a.localeCompare(b)));
    }
  }, [apiViewsRaw]);

  useEffect(() => {
    if (apiColumnsRaw) {
      setApiColumns(apiColumnsRaw);
      setAllowedColumns(apiColumnsRaw);
      setColumnsForViews(prev => ({
        ...prev,
        [selectedView]: apiColumnsRaw.map(c => c.column_name)
      }));
    }
  }, [apiColumnsRaw, selectedView]);

  const getFilterModalColumns = () => {
    if (apiColumns.length > 0) {
      return apiColumns.map((column) => ({ name: column.column_name, type: column.data_type }));
    }
    return [];
  };

  useEffect(() => {
    if (!hasIncrementedRef.current) {
      incrementNodeCount('sourceView');
      hasIncrementedRef.current = true;
    }
  }, []);

  const hasRestoredPayloadRef = useRef(false);
  useEffect(() => {
    if (data?._isRestoring && !hasRestoredPayloadRef.current && apiColumns.length > 0 && selectedView) {
      const newPayload = {
        id,
        type: "Source",
        view: selectedView,
        selectedColumns,
        Columns: apiColumns
      };
      
      handleViewPayload(prev => {
        if (prev && prev.some(p => p.id === id)) return prev;
        return [...(prev || []), newPayload];
      });
      hasRestoredPayloadRef.current = true;
    }
  }, [data?._isRestoring, apiColumns, selectedView, selectedColumns]);


  const handleViewChange = (e) => {
    setSelectedColumns([])
    setColumnSearchTerm("");
    setColumnSettings(prevSettings => {
      const updatedSettings = { ...prevSettings };
      delete updatedSettings[selectedView];

      return updatedSettings;
    });
    setSelectedView(e.target.value.toLowerCase());
    
    handleFinalPayload((prevData) => {
      const newData = { ...prevData };
      if (newData.filter_data) {
        delete newData.filter_data;
      }
      return newData;
    });
  }
  const [selectedColumnsOrder, setSelectedColumnsOrder] = useState([]);

  const handleColumnChange = (column) => {
    const isColumnChecked = selectedColumns.includes(column);
    const updatedCheckedColumns = isColumnChecked
      ? selectedColumns.filter((col) => col !== column)
      : [...selectedColumns, column];

    setSelectedColumns(updatedCheckedColumns);
    setSelectedColumnsOrder(updatedCheckedColumns);

    setColumnSettings((prevSettings) => {
      if (isColumnChecked) {
        const updatedSettings = { ...prevSettings };
        if (updatedSettings[selectedView]) {
          updatedSettings[selectedView] = { ...updatedSettings[selectedView] };
          delete updatedSettings[selectedView][column];
          if (Object.keys(updatedSettings[selectedView]).length === 0) {
            delete updatedSettings[selectedView];
          }
        }
        return updatedSettings;
      } else {
        const currentConfig = prevSettings[selectedView]?.[column];
        const newConfig = Array.isArray(currentConfig) 
          ? [ { ...currentConfig[0], originalOutput: "Yes" }, ...currentConfig.slice(1) ]
          : [{ ...currentConfig, originalOutput: "Yes" }];

        return {
          ...prevSettings,
          [selectedView]: {
            ...(prevSettings[selectedView] || {}),
            [column]: newConfig,
          },
        };
      }
    });
  };


  const handleChange = (column) => {
    toggleModal(true);
    setSelectedColumn(column);
  }



  const handleSelectAllChange = (isChecked) => {
    const visibleColumns = filteredColumns;

    if (isChecked) {
      const newColumns = visibleColumns.filter(col => !selectedColumns.includes(col));
      setSelectedColumns(prev => [...prev, ...newColumns]);
      setSelectedColumnsOrder(prev => [...prev, ...newColumns]);
      setColumnSettings((prevSettings) => {
        const updatedSettings = { ...prevSettings };
        visibleColumns.forEach((column) => {
          const currentConfig = updatedSettings[selectedView]?.[column];
          const newConfig = Array.isArray(currentConfig)
            ? [ { ...currentConfig[0], originalOutput: "Yes" }, ...currentConfig.slice(1) ]
            : [{ ...currentConfig, originalOutput: "Yes" }];

          updatedSettings[selectedView] = {
            ...updatedSettings[selectedView],
            [column]: newConfig,
          };
        });
        return updatedSettings;
      });
    } else {
      setSelectedColumns(prev => prev.filter(col => !visibleColumns.includes(col)));
      setSelectedColumnsOrder(prev => prev.filter(col => !visibleColumns.includes(col)));
      setColumnSettings((prevSettings) => {
        const updatedSettings = { ...prevSettings };
        visibleColumns.forEach((column) => {
          if (updatedSettings[selectedView]) {
            delete updatedSettings[selectedView][column];
          }
        });
        return updatedSettings;
      });
    }
  };

  const filteredColumns = (columnsForViews[selectedView] || []).filter(col =>
    col.toLowerCase().includes(columnSearchTerm.toLowerCase())
  );

  const isAllSelected =
    filteredColumns.length > 0 &&
    filteredColumns.every(col => selectedColumns.includes(col));

  useEffect(() => {
    if (selectedView && columnSettings[selectedView]) {
      const columnsWithOutputOrAggregate = Object.keys(columnSettings[selectedView]).filter(
        column => {
          const columnData = columnSettings[selectedView][column];
          if (Array.isArray(columnData)) {
            return columnData[0]?.originalOutput === "Yes" || columnData[0]?.output === "Yes" || columnData.some(c => c.aggregate || c.alias);
          } else if (columnData) {
            return columnData.originalOutput === "Yes" || columnData.output === "Yes" || (columnData.aggregate && columnData.aggregate.trim() !== "");
          }
          return false;
        }
      );
      setSelectedColumns(columnsWithOutputOrAggregate);
    }
  }, [columnSettings, selectedView]);




  const handleSave = () => {
    if (!selectedView) {
      showToast('Please select a view', 'error');
      return;
    }

    if (!finalPayload.operation && previousView != selectedView) {
      handleFinalPayload((prevData) => ({
        ...prevData,
        joins: prevData?.joins?.filter(
          (join) => join.view1 !== previousView && join.view2 !== previousView
        ),
      }));
      if (previousView) {
        setColumnSettings((prevSettings) => {
          const updatedSettings = { ...prevSettings };
          delete updatedSettings[previousView];
          return updatedSettings;
        });
      }
    }
    else if (finalPayload.operation) {
      handleFinalPayload({});
      const updatedSettings = { ...columnSettings };
      delete updatedSettings.Union;
      setColumnSettings(updatedSettings);
    }

    const view = selectedView;
    const newPayload = {
      id,
      type: "Source",
      view,
      selectedColumns,
      Columns: apiColumns
    };

    const currentPayloads = viewPayload || [];
    const updatedPayloads = [...currentPayloads];
    const existingIndex = updatedPayloads.findIndex((payload) => payload.id === id);

    if (existingIndex !== -1) {
      updatedPayloads[existingIndex] = newPayload;
    } else {
      updatedPayloads.push(newPayload);
    }

    handleViewPayload(updatedPayloads);

    setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? {
              ...n,
              data: {
                ...n.data,
                selectedView,
                selectedColumns,
              },
            }
          : n
      )
    );

    onSave?.(newPayload);
    showToast('Data Saved Successfully', 'success');
    setPreviousView(selectedView);
  };

  const cleanFinalPayload = (finalPayload, viewName) => {
    let updatedPayload = { ...finalPayload };

    if (updatedPayload.defs && updatedPayload.defs[viewName]) {
      delete updatedPayload.defs[viewName];
      if (Object.keys(updatedPayload.defs).length === 0) delete updatedPayload.defs;
    }

    if (updatedPayload.union_fields && updatedPayload.union_fields[viewName]) {
      delete updatedPayload.union_fields[viewName];
      if (Object.keys(updatedPayload.union_fields).length === 0) delete updatedPayload.union_fields;
    }

    if (updatedPayload.union) {
      updatedPayload.union = updatedPayload.union.filter(item => item !== viewName);
      if (updatedPayload.union.length === 0) delete updatedPayload.union;
    }

    if (updatedPayload.metadata) {
      if (updatedPayload.metadata.views) {
        updatedPayload.metadata.views = updatedPayload.metadata.views.filter(view => view !== viewName);
        if (updatedPayload.metadata.views.length === 0) delete updatedPayload.metadata.views;
      }
      if (Object.keys(updatedPayload.metadata).length === 0) delete updatedPayload.metadata;
    }

    return updatedPayload;
  };

  const handleDelete = (id) => {
    const updatedPayload = viewPayload.filter((node) => node.id !== id);
    handleViewPayload(updatedPayload);

    if (!finalPayload.operation) {
      handleFinalPayload((prevData) => ({
        ...prevData,
        joins: prevData?.joins?.filter(
          (join) => join.view1 !== selectedView && join.view2 !== selectedView
        ),
      }));
    }
    else if (finalPayload.operation) {
      const cleanedPayload = cleanFinalPayload(finalPayload, selectedView);
      handleFinalPayload(cleanedPayload)
    }

    setColumnSettings(prevSettings => {
      const updatedSettings = { ...prevSettings };
      delete updatedSettings[selectedView];
      delete updatedSettings["Union"]

      return updatedSettings;
    });

    decrementNodeCount('sourceView');

    window.deleteNode?.(id)
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = (value) => {
    setIsModalOpen(value);
  };

  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);

  const toggleEditorModal = (value) => {
    setIsEditorModalOpen(value);
    setHideBusinessPreview(value);
  };

  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals, selectedView, apiColumns, isCollapsed, columnSearchTerm]);

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    updateNodeInternals(id);
  };


  return (
    <>
      <div className="bg-white rounded-lg p-4 shadow-lg min-w-[300px] relative group">

        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <SquareKanban className="w-5 h-5 text-[#8E77BB]" />
            <h3 className="text-black font-medium">Source View</h3>
          </div>
          <div>
            {modalState.queryType == "Complex" && (
              <button
                onClick={() => toggleEditorModal(true)}
                className="p-1 rounded-md hover:bg-gray-200"
              >
                <FileCode className="h-5 text-gray-500" />
              </button>
            )}
            <button
              onClick={handleCollapse}
              className="p-1 rounded-md hover:bg-gray-200"
            >
              {isCollapsed ? (
                <ChevronDown className=" h-5 text-gray-500" />
              ) : (
                <ChevronUp className=" h-5 text-gray-500" />
              )}
            </button>
            <button
              onClick={() => handleDelete(id)}
              className="p-1 rounded-md hover:bg-gray-200"
            >
              <X className="h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <>
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <label className="block text-sm font-medium text-black">View</label>
                  <button onClick={handleRefresh} className="p-1 rounded-md hover:bg-gray-200" title="Refresh Views">
                    <RefreshCw className={`h-3.5 w-3.5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <SearchableSelect
                  id="view"
                  openDropdownId={openDropdownId}
                  setOpenDropdownId={setOpenDropdownId}
                  options={apiViews}
                  value={selectedView}
                  onChange={handleViewChange}
                  placeholder="Select View"
                  isLoading={isLoadingViews || isFetchingPolicies}
                />
              </div>

              {isLoadingColumns && (
                <div className="flex items-center justify-center py-4">
                  <svg className="animate-spin h-5 w-5 text-[#8E77BB]" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="ml-2 text-sm text-gray-600">Loading columns...</span>
                </div>
              )}

              {!isLoadingColumns && columnsForViews[selectedView]?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Select Columns
                  </label>
                  <div className="pt-1 space-y-2">

                    <div
                      className="relative mb-2"
                      onWheelCapture={(e) => e.stopPropagation()}
                    >
                      <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-gray-700" />
                      <input
                        type="text"
                        className="w-full pl-7 pr-3 py-1.5 text-gray-700 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#8E77BB]"
                        placeholder="Search columns..."
                        value={columnSearchTerm}
                        onChange={(e) => setColumnSearchTerm(e.target.value)}
                      />
                      {columnSearchTerm && (
                        <button
                          className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                          onClick={() => setColumnSearchTerm("")}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="selectAll"
                        checked={isAllSelected}
                        onChange={(e) => handleSelectAllChange(e.target.checked)}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <label htmlFor="selectAll" className="text-sm text-gray-700 font-medium">
                        Select All
                      </label>
                    </div>

                    <div
                      className="max-h-32 overflow-y-auto space-y-2 custom-scrollbar"
                      onWheelCapture={(e) => e.stopPropagation()}
                    >
                      {filteredColumns.length === 0 ? (
                        <div className="text-sm text-gray-400 py-1 text-center">No columns match</div>
                      ) : (
                        filteredColumns.map((column) => (
                          <div className="flex justify-between" key={column}>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                onClick={(e) => {
                                  if (e.target.checked) {
                                    setSelectedColumn(column);
                                  }
                                }}
                                id={column}
                                value={column}
                                checked={selectedColumns.includes(column)}
                                onChange={() => handleColumnChange(column)}
                                className="text-purple-600 focus:ring-purple-500"
                              />
                              <label htmlFor={column} className="text-sm text-gray-700">
                                {column}
                              </label>
                            </div>
                            <Pencil
                              name="edit"
                              onClick={() => handleChange(column)}
                              className="mr-3 h-4 w-4 text-[#8E77BB] cursor-pointer hover:text-[#7a64a0]"
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleSave}
              className="w-full text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-1.5 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7] mt-3"
            >
              OK
            </button>
          </>
        )}

        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #a0aec0;
            border-radius: 3px;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
        `}</style>
      </div>
      <Modal
        open={isModalOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') {
            toggleModal(false);
          }
        }}
        BackdropProps={{
          style: {
            backgroundColor: 'transparent',
          },
        }}
      >
        <div className="absolute top-0 right-0 h-full w-[450px]">
          <Columns
            id={selectedView}
            columnName={selectedColumn}
            dataType={apiColumns.find(col => col.column_name === selectedColumn)?.data_type}
            toggleModal={toggleModal}
            selectedColumns={selectedColumns}
            setSelectedColumns={setSelectedColumns}
          />
        </div>
      </Modal>
      <Modal
        open={isEditorModalOpen}
        onClose={() => toggleEditorModal(false)}
        BackdropProps={{
          style: {
            backgroundColor: 'transparent',
          },
        }}
      >
        <div className="absolute top-0 right-0 h-full">
        <ComplexQueryEditor
          setShowQueryEditor={toggleEditorModal}
          onQuerySave={(savedQuery) => {
            notifyComplexQuerySaved();
          }}
        />
        </div>
      </Modal>
    </>
  );
}

SourceViewNode.propTypes = {
  id: PropTypes.string.isRequired,
  onSave: PropTypes.func,
};