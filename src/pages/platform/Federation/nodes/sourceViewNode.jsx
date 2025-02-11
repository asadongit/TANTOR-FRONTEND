/*eslint-disable*/
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Handle, Position } from "reactflow";
import { SquareKanban, X, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { useStateContext } from "../../../../context/contextProvider";
import { Modal} from "@mui/material";
import { Columns } from "../Columns";
import { ToastContainer, toast } from "react-toastify";

export function SourceViewNode({ id, onSave }) {
  const encodedToken = import.meta.env.VITE_FEDERATION_ACCESS_TOKEN;
  const { viewPayload, handleViewPayload, handleFinalPayload, setColumnSettings, columnSettings } = useStateContext("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedView, setSelectedView] = useState("");
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [views, setViews] = useState([])
  const [columnsForViews, setColumnsForViews] = useState({});
  const [selectedColumn, setSelectedColumn] = useState("");

  useEffect(() => {
    const fetchViews = async () => {
      try {
        var viewType = 'Base';
        const response = await fetch(`${import.meta.env.VITE_FAST_API}/get-all-views?view_type=${viewType}`);
        const data = await response.json();
        if (data && data.result) {
          setViews(data.result);
        } else {
          console.error("Invalid response from the API");
        }
      } catch (error) {
        console.error("Error fetching views:", error);
      }
    };
    fetchViews();
  }, []);

  const handleViewChange = (e) => {
    setSelectedColumns([])
    setSelectedView(e.target.value)
    fetchColumnsForView(e.target.value);
    // handleFinalPayload({});

  }

  const fetchColumnsForView = async (viewName) => {
    console.log("inside fetch column ", viewName)
    if (columnsForViews[viewName]) return;
    const temp = {
      "view_names": [viewName]
    }
    console.log("viewnames aree ===>", temp)
    try {
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/fetch_view_columns`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${encodedToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(temp)
      });
      const data = await response.json();
      if (data && data.result) {
        const columnNames = data.result[viewName].map(col => col.column_name);
        setColumnsForViews(prevState => ({
          ...prevState,
          [viewName]: columnNames,
        }));
        console.log("columns are ===>", data.result)
      } else {
        console.error(`Invalid response for columns of view `);
      }
    }
    catch (error) {
      console.error("Error fetching columns for view:", error);
    }
  };

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
        return [...prev, column];
      }
    });
  };
  

  const handleChange = (column) =>{
    toggleModal(true);
    setSelectedColumn(column);
  }
  
  

  const handleSelectAllChange = (isChecked) => {
    if (isChecked && columnsForViews[selectedView]) {
      setSelectedColumns(columnsForViews[selectedView]);
      setColumnSettings((prevSettings) => {
        const updatedSettings = { ...prevSettings };
        columnsForViews[selectedView].forEach((column) => {
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
      setSelectedColumns([]);
      setColumnSettings((prevSettings) => {
        const updatedSettings = { ...prevSettings };
        if (columnsForViews[selectedView]) {
          columnsForViews[selectedView].forEach((column) => {
            updatedSettings[selectedView] = {
              ...updatedSettings[selectedView],
              [column]: {
                ...(updatedSettings[selectedView]?.[column] || {}),
                output: "No", 
              },
            };
          });
        }
        return updatedSettings;
      });
    }
  };


  const isAllSelected = selectedColumns.length === (columnsForViews[selectedView]?.length || 0);

  const handleSave = () => {

    // const selectFields = selectedColumns.map((column) => ({
    //   field: `${selectedView}.${column}`,
    //   alias: "",
    // }));

    console.log("column settings are ===>",columnSettings)

    const groupByColumns = Object.keys(columnSettings[selectedView]).filter(
      (column) => columnSettings[selectedView][column].groupBy === "Yes"
    );

    const selectColumns = Object.keys(columnSettings[selectedView]).filter(
      (column) => columnSettings[selectedView][column].output === "Yes"
    );

    const aggregateColumns = Object.keys(columnSettings[selectedView]).filter(
      (column) => columnSettings[selectedView][column].aggregate
    );

    
    console.log("group by columns are ====>",groupByColumns)
    console.log("select columns are ====>",selectColumns)
    console.log("aggregate Columns ====>",aggregateColumns)

    if (groupByColumns.length > 0 || aggregateColumns.length > 0) {
      const allowedColumns = new Set([...groupByColumns, ...aggregateColumns]);
    
      const invalidColumns = selectColumns.filter(
        (column) => !allowedColumns.has(column)
      );
    
      if (invalidColumns.length > 0) {
        toast.error("Select Field must be aggregate or in Group by");
      }
    } 
    else{
    if (selectedView) {
      const view = selectedView;
      const newPayload = {
        id,
        type: "Source",
        view,
        selectedColumns,
        // select_fields: selectFields,
        Columns: columnsForViews[selectedView] || [],
      };

      const currentPayloads = viewPayload || [];
      const updatedPayloads = [...currentPayloads];
      const existingIndex = updatedPayloads.findIndex((payload) => payload.id === id);

      if (existingIndex !== -1) {
        updatedPayloads[existingIndex] = newPayload;
      } else {
        updatedPayloads.push(newPayload);
      }

      console.log("view payload is ===>", updatedPayloads)
      handleViewPayload(updatedPayloads);
      onSave?.(newPayload);
    }

  }
  };

  useEffect(() => {
    if (selectedView && columnSettings[selectedView]) {
      const columnsWithOutputYes = Object.keys(columnSettings[selectedView]).filter(
        column => columnSettings[selectedView][column].output === "Yes"
      );
      setSelectedColumns(columnsWithOutputYes);
    }
  }, [columnSettings, selectedView]);

  const handleDelete = (id) => {
    const updatedPayload = viewPayload.filter((node) => node.id !== id);
    handleViewPayload(updatedPayload);
    window.deleteNode?.(id)

    setColumnSettings(prevSettings => {
      const updatedSettings = { ...prevSettings };
      delete updatedSettings[selectedView]; 
      return updatedSettings;
  });
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = (value) => {
    console.log("toggle model ")
    setIsModalOpen(value);
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
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-md hover:bg-gray-200"
            >
              {isCollapsed ? (
                <ChevronDown className=" h-5 text-black" />
              ) : (
                <ChevronUp className=" h-5 text-black" />
              )}
            </button>
            <button
              onClick={() => handleDelete(id)}
              className="p-1 rounded-md hover:bg-gray-200"
            >
              <X className="h-5 text-black" />
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">View</label>
                <select
                  value={selectedView}
                  onChange={handleViewChange}
                  className="w-full bg-white rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg group border-solid border-2"
                >
                  <option value="" disabled>
                    Select a view
                  </option>
                  {views?.map((view, index) => (
                    <option key={index} value={view}>
                      {view}
                    </option>
                  ))}
                </select>
              </div>

              {columnsForViews[selectedView]?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Select Columns
                  </label>
                  <div className="p-3 space-y-2">
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

                    <div className="max-h-32 overflow-y-auto space-y-2 custom-scrollbar">
                      
                      {columnsForViews[selectedView]?.length > 0 &&
                        columnsForViews[selectedView].map((column) => (
                          <div className="flex justify-between">
                          <div key={column} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              onClick={(e) => {
                                if (e.target.checked) {
                                  // toggleModal(true);
                                  setSelectedColumn(column);

                                } else {
                                  // toggleModal(false);
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
                          <Pencil name="edit" onClick={() => handleChange(column)} className="mr-3 h-4 w-4 text-[#8E77BB]" />
                          </div>
                        ))}

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
        <Columns id={selectedView} columnName={selectedColumn} toggleModal={toggleModal} />
        </div>

      </Modal>
    </>
  );
}

SourceViewNode.propTypes = {
  id: PropTypes.string.isRequired,
  onSave: PropTypes.func, // Callback function for saving the payload
};
