/*eslint-disable*/
import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import { Handle, Position, useUpdateNodeInternals } from "reactflow";
import { SquareKanban, X, ChevronDown, ChevronUp, Pencil, Search, FileCode } from "lucide-react";
import { useStateContext } from "../context/contextViewProvider";
import { Modal } from "@mui/material";
import { Columns } from "../BusinessView/Columns";
import ComplexQueryEditor from "../components/ComplexQueryEditor";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { useToast } from '../context/ToastContext';


const SearchableSelect = ({ options, value, onChange, placeholder, disabled = false, isLoading = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = options.map(option =>
    typeof option === 'object' ? option.connection_name : option
  ).filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectClick = () => {
    if (!disabled && !isLoading) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (option) => {
    onChange({ target: { value: option } });
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative w-full h-full">
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
        <div className="absolute z-10 w-full mt-1 bg-white text-black border rounded-lg shadow-lg">
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

export function SourceViewNode({ id, onSave }) {
  const encodedToken = window._env_?.VITE_FEDERATION_ACCESS_TOKEN;
  const { viewPayload, handleViewPayload, setColumnSettings, columnSettings, finalPayload, handleFinalPayload, incrementNodeCount, decrementNodeCount } = useStateContext("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedView, setSelectedView] = useState("");
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [views, setViews] = useState([])
  const [columnsForViews, setColumnsForViews] = useState({});
  const [selectedColumn, setSelectedColumn] = useState("");
  const [columnData, setColumnData] = useState([])
  const [showQueryEditor, setShowQueryEditor] = useState(false);
  const [previousView, setPreviousView] = useState("");
  const [isLoadingViews, setIsLoadingViews] = useState(false);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);
  const hasIncrementedRef = useRef(false);

  const [columnSearchTerm, setColumnSearchTerm] = useState("");

  const { token, project, decodedToken, setSelectedProject, hostnameV1, hostnameV2 } = useAuth();
  const { showToast } = useToast();

  const modalState = useLocation().state || {
    queryType: "Regular",
    viewType: "Business",
  };

  useEffect(() => {
    handleFinalPayload((prevData) => ({
      ...prevData,
      view_type: "Integrated View"
    }));
  }, [])

  useEffect(() => {
    const fetchViews = async () => {
      setIsLoadingViews(true);
      try {
        const params = new URLSearchParams({
          view_type: "Base",
          project: (project === "default" || project === "none") ? "default" : project,
          created_by: decodedToken?.preferred_username,
        });

        const response = await fetch(`${hostnameV2}/get-all-views_v2?${params}`);
        const data = await response.json();

        if (data && data.result) {
          setViews(data.result);
        } else {
          console.error("Invalid response from the API");
          showToast('Failed to fetch views', 'error');
        }
      } catch (error) {
        console.error("Error fetching views:", error);
        showToast('Failed to fetch views', 'error');
      } finally {
        setIsLoadingViews(false);
      }
    };

    fetchViews();
  }, []);


  useEffect(() => {
    if (!hasIncrementedRef.current) {
      incrementNodeCount('sourceView');
      hasIncrementedRef.current = true;
    }
  }, []);


  const handleViewChange = (e) => {
    setSelectedColumns([])
    setColumnSearchTerm("");
    setColumnSettings(prevSettings => {
      const updatedSettings = { ...prevSettings };
      delete updatedSettings[selectedView];

      return updatedSettings;
    });
    setSelectedView(e.target.value.toLowerCase())
    fetchColumnsForView(e.target.value.toLowerCase());
  }

  const fetchColumnsForView = async (viewName) => {
    if (columnsForViews[viewName]) return;

    setIsLoadingColumns(true);
    const temp = {
      "view_names": [viewName]
    }
    try {
      const response = await fetch(`${hostnameV1}/fetch_view_columns`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(temp)
      });
      const data = await response.json();
      if (data && data.result) {
        setColumnData(data.result[viewName])
        const columnNames = data.result[viewName].map(col => col.column_name);
        setColumnsForViews(prevState => ({
          ...prevState,
          [viewName]: columnNames,
        }));
        updateNodeInternals(id);
      } else {
        console.error(`Invalid response for columns of view `);
        showToast('Failed to fetch columns', 'error');
      }
    }
    catch (error) {
      console.error("Error fetching columns for view:", error);
      showToast('Failed to fetch columns', 'error');
    } finally {
      setIsLoadingColumns(false);
    }
  };

  const [selectedColumnsOrder, setSelectedColumnsOrder] = useState([]);

  const handleColumnChange = (column) => {
    setSelectedColumns((prev) => {
      if (prev.includes(column)) {
        setColumnSettings((prevSettings) => {
          const updatedSettings = { ...prevSettings };
          if (updatedSettings[selectedView]) {
            delete updatedSettings[selectedView][column];
            if (Object.keys(updatedSettings[selectedView]).length === 0) {
              delete updatedSettings[selectedView];
            }
          }
          return updatedSettings;
        });
        setSelectedColumnsOrder((prevOrder) => prevOrder.filter((col) => col !== column));
        return prev.filter((col) => col !== column);
      } else {
        setColumnSettings((prevSettings) => ({
          ...prevSettings,
          [selectedView]: {
            ...(prevSettings[selectedView] || {}),
            [column]: {
              ...(prevSettings[selectedView]?.[column] || {}),
              output: "Yes",
            },
          },
        }));

        setSelectedColumnsOrder((prevOrder) => [...prevOrder, column]);
        return [...prev, column];
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
          updatedSettings[selectedView] = {
            ...updatedSettings[selectedView],
            [column]: {
              ...(updatedSettings[selectedView]?.[column] || {}),
              output: "Yes",
            },
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
          const columnData = columnSettings[selectedView][column] || {};
          return columnData.output === "Yes" || (columnData.aggregate && columnData.aggregate.trim() !== "");
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
      Columns: columnData
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
  };

  const updateNodeInternals = useUpdateNodeInternals();

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
                <label className="block text-sm font-medium text-black mb-1">View</label>
                <SearchableSelect
                  options={views}
                  value={selectedView}
                  onChange={handleViewChange}
                  placeholder="Select View"
                  isLoading={isLoadingViews}
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
        onClose={() => toggleModal(false)}
        BackdropProps={{
          style: {
            backgroundColor: 'transparent',
          },
        }}
      >
        <div className="absolute top-0 right-0 h-full w-full sm:w-1/2 md:w-1/3 lg:w-[22%]">
          <Columns
            id={selectedView}
            columnName={selectedColumn}
            dataType={columnData.find(col => col.column_name === selectedColumn)?.data_type}
            toggleModal={toggleModal}
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
          <ComplexQueryEditor setShowQueryEditor={toggleEditorModal} />
        </div>
      </Modal>
    </>
  );
}

SourceViewNode.propTypes = {
  id: PropTypes.string.isRequired,
  onSave: PropTypes.func,
};