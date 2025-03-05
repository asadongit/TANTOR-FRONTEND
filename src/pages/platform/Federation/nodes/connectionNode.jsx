/*eslint-disable*/
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types"; // Add this import
import { Handle, Position } from "reactflow";
import { Cable, X, ChevronDown, ChevronUp, Pencil, FileCode,Search } from "lucide-react";
import { useStateContext } from "../context/contextProvider";
import { Columns } from "../BusinessView/Columns";
import { Modal } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import ComplexQueryEditor from "../components/ComplexQueryEditor";

export function ConnectionNode({ id, onSave }) {
  const encodedToken = import.meta.env.VITE_FEDERATION_ACCESS_TOKEN;
  const { handleConnectionPayload, connectionPayload, setColumnSettings, columnSettings, complexCheck, handleFinalPayload } = useStateContext("")
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState("")
  const [schemas, setSchemas] = useState([]);
  const [selectedSchema, setSelectedSchema] = useState("");
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [columns, setColumns] = useState([])
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [columnData, setColumnData] = useState([])

  // const dummyColumns = ["connection 1", "id ", "name", "address", "phonenumber"];

  const [selectedColumnsOrder, setSelectedColumnsOrder] = useState([]);

  const handleColumnChange = (column) => {
    setSelectedColumns((prev) => {
      if (prev.includes(column)) {
        setColumnSettings((prevSettings) => {
          const updatedSettings = { ...prevSettings };
          if (updatedSettings[id]) {
            delete updatedSettings[id][column];
            if (Object.keys(updatedSettings[id]).length === 0) {
              delete updatedSettings[id];
            }
          }
          return updatedSettings;
        });
        setSelectedColumnsOrder((prevOrder) => prevOrder.filter((col) => col !== column));
        return prev.filter((col) => col !== column);
      } else {
        setColumnSettings((prevSettings) => ({
          ...prevSettings,
          [id]: {
            ...(prevSettings[id] || {}),
            [column]: {
              ...(prevSettings[id]?.[column] || {}),
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
    if (isChecked) {
      setSelectedColumns(columns);
      setSelectedColumnsOrder(columns);
      setColumnSettings((prevSettings) => {
        const updatedSettings = { ...prevSettings };
        columns.forEach((column) => {
          updatedSettings[id] = {
            ...updatedSettings[id],
            [column]: {
              ...(updatedSettings[id]?.[column] || {}),
              output: "Yes",
            },
          };
        });
        return updatedSettings;
      });
    } else {
      setSelectedColumns([]);
      setSelectedColumnsOrder([]);
      setColumnSettings((prevSettings) => {
        const updatedSettings = { ...prevSettings };
        columns.forEach((column) => {
          updatedSettings[id] = {
            ...updatedSettings[id],
            [column]: {
              ...(updatedSettings[id]?.[column] || {}),
              output: "No",
            },
          };
        });
        return updatedSettings;
      });
    }
  };

  const isAllSelected = selectedColumns.length === columns.length;

  
  useEffect(() => {
    if (id && columnSettings[id]) {
      const columnsWithOutputYes = selectedColumnsOrder.filter(
        (column) => columnSettings[id][column]?.output === "Yes"
      );

      setSelectedColumns((prev) => [...new Set(columnsWithOutputYes)]);
    }
  }, [columnSettings, id]);



  useEffect(() => {
    var preferred_username = "sabhyata";

    fetch(`${import.meta.env.VITE_FAST_API}/connection-saves`, {
      headers: {
        'Authorization': `Bearer ${encodedToken}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const connectionNames = data
          .filter(
            (item) =>
              // item.project === project &&
              preferred_username === item.created_by &&
              item.is_deleted === false
          )
          .map((item) => item.connection_name);
        setConnections(connectionNames);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  const handleConnectionChange = async (event, value) => {
    var conn = event.target.value;
    setSelectedTable("");
    setSelectedConnection(conn);
    setSelectedSchema("");
    setColumns([])
    setSelectedColumns([]);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_FAST_API}/${conn}/schemas`,
        {
          headers: {
            Authorization: `Bearer ${encodedToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setSchemas(data);
      } else {
        setSchemas([]);
        // setError("Unexpected response format.");
      }
    } catch (err) {
      setSchemas([]);
      // setError(err.message || "Failed to fetch schemas.");
    } finally {

    }
  };

  const handleSchemaChange = async (event, value) => {
    var temp = event.target.value;
    setSelectedSchema(temp);
    setSelectedTable("");
    setColumns([])
    setSelectedColumns([]);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_FAST_API}/${selectedConnection}/schemas/${temp}/tables`,
        {
          headers: {
            Authorization: `Bearer ${encodedToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setTables(data);
      } else {
        setTables([]);
        // setError("Unexpected response format.");
      }
    } catch (err) {
      setTables([]);
      // setError(err.message || "Failed to fetch tables.");
    } finally {

    }
  };



  const handleTableChange = async (event, value) => {
    var temp = event.target.value;
    setColumns([])
    setSelectedColumns([]);
    if (selectedConnection && selectedSchema) {
      var temp = event.target.value;
      setSelectedTable(temp);
      const response = await fetch(
        `${import.meta.env.VITE_FAST_API}/${selectedConnection}/schemas/${selectedSchema}/tables/${temp}/columns`, {
        headers: {
          'Authorization': `Bearer ${encodedToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("columns aree====>", data)
        setColumnData(data)
        const transformedColumns = data.map((column) => (
          column.column
        ));
        console.log("trans col are ===>", transformedColumns)
        setColumns(transformedColumns);

      }
    } else if (!(selectedConnection || selectedSchema)) {
      toast.error("Select above field first");
    }
  };



  const handleSave = () => {
    if (selectedColumns.length === 0) {
          toast.error("Select atleast one column");
          return;
    }
    const view = id;
    handleFinalPayload({});

    const updatedSettings = { ...columnSettings };
    delete updatedSettings.Union;
    setColumnSettings(updatedSettings);

    if (view && selectedConnection && selectedSchema && selectedTable) {

      const newPayload = {
        id,
        type: "Connection",
        view,
        selectedConnection,
        selectedSchema,
        selectedTable,
        selectedColumns,
        def: `Select * from ${selectedConnection}.${selectedSchema}.${selectedTable}`,
        // select_fields: selectFields,
        // Columns: columns
        Columns: columnData   /////////////same here 
      };

      const currentPayloads = connectionPayload || [];
      const updatedPayloads = [...currentPayloads];
      const existingIndex = updatedPayloads.findIndex((payload) => payload.id === id);

      if (existingIndex !== -1) {
        updatedPayloads[existingIndex] = newPayload;
      } else {
        updatedPayloads.push(newPayload);
      }

      console.log("view payload is ===>", updatedPayloads)
      handleConnectionPayload(updatedPayloads)
      onSave?.(newPayload);
    }

    toast.success("Data Saved Successfully");

  };


  const handleDelete = (id) => {
    const updatedPayload = connectionPayload.filter((node) => node.id !== id);
    handleConnectionPayload(updatedPayload);
    window.deleteNode?.(id)

    setColumnSettings(prevSettings => {
      const updatedSettings = { ...prevSettings };
      delete updatedSettings[id];
      return updatedSettings;
    });

  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = (value) => {
    console.log("toggle model ")
    setIsModalOpen(value);
  };

    const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  
    const toggleEditorModal = (value) => {
      console.log("toggle model ")
      setIsEditorModalOpen(value);
    };

    const SearchableSelect = ({ options, value, onChange, placeholder }) => {
      const [isOpen, setIsOpen] = useState(false);
      const [searchTerm, setSearchTerm] = useState("");
    
      const filteredOptions = options
        .map((option) =>
          typeof option === "object" ? option.connection_name : option
        )
        .filter((option) =>
          option.toLowerCase().includes(searchTerm.toLowerCase())
        );
    
      const handleSelectClick = () => {
        setIsOpen(!isOpen);
      };
    
      const handleOptionClick = (option) => {
        onChange({ target: { value: option } });
        setIsOpen(false);
        setSearchTerm("");
      };
    
      return (
        <div className="relative w-full text-black">
          <div
            className="w-full px-3 py-2 border-2 rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
            onClick={handleSelectClick}
          >
            <span>{value || placeholder}</span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
    
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
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
                {filteredOptions.map((option) => (
                  <div
                    key={option}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleOptionClick(option)}
                  >
                    {option}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    };

  return (
    <>
      <div className="bg-white rounded-lg p-4 shadow-lg min-w-[300px] relative group">

        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Cable className="w-5 h-5 text-[#8E77BB]" />
            <h3 className="text-black font-medium">Connection</h3>
          </div>
          <div>
          {complexCheck && (
          <button
              onClick={() => toggleEditorModal(true)}
              className="p-1 rounded-md hover:bg-gray-200"
            >
              <FileCode className="h-5 text-gray-500" />
            </button>
          )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
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
                <label className="block text-sm font-medium text-black mb-1">Connection</label>
                 <SearchableSelect
                options={connections}
                value={selectedConnection}
                onChange={handleConnectionChange}
                placeholder="Select a connection"
              />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Schema</label>
                <SearchableSelect
                options={schemas}
                value={selectedSchema}
                onChange={handleSchemaChange}
                placeholder="Select a schema"
              />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Table</label>
                <SearchableSelect
                options={tables}
                value={selectedTable}
                onChange={handleTableChange}
                placeholder="Select a table"
              />
              </div>
              {columns?.length && (
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Select Columns</label>
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
                      {columns.map((column) => (
                        <div className="flex justify-between">
                          <div key={column} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              onClick={(e) => {
                                if (e.target.checked) {
                                  // toggleModal(true);
                                  setSelectedColumn(column);

                                } else {
                                  setSelectedColumn("");
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
          <Columns id={id}
            columnName={selectedColumn}
            dataType={columnData.find(col => col.column === selectedColumn)?.datatype}
            toggleModal={toggleModal} />
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

ConnectionNode.propTypes = {
  id: PropTypes.string.isRequired,
  onSave: PropTypes.func, // Optional prop for saving payload
};





