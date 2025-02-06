/*eslint-disable*/
import React, { useState, useEffect} from "react";
import PropTypes from "prop-types"; // Add this import
import { Handle, Position } from "reactflow";
import { Cable, X, ChevronDown, ChevronUp } from "lucide-react";
import { useStateContext } from "../../../../context/contextProvider";
import { Columns } from "../Columns";
import { Modal, Box} from "@mui/material";

export function ConnectionNode({ id, onSave }) {
  const encodedToken = import.meta.env.VITE_ACCESS_TOKEN;
  const {handleConnectionPayload, connectionPayload} = useStateContext("")
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [connections, setConnections] = useState([]);
  const [selectedConnection,setSelectedConnection] = useState("")
  const [schemas, setSchemas] = useState([]);
  const [selectedSchema, setSelectedSchema] = useState("");
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [columns, setColumns] = useState([])
  const [selectedColumns, setSelectedColumns] = useState([]);

  // const dummyColumns = ["connection 1", "id ", "name", "address", "phonenumber"];

  const handleColumnChange = (column) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((col) => col !== column)
        : [...prev, column]
    );
  };

  const handleSelectAllChange = (isChecked) => {
    if (isChecked) {
      setSelectedColumns(columns);
    } else {
      setSelectedColumns([]);
    }
  };

  const isAllSelected = selectedColumns.length === columns.length;



  useEffect(() => {
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
                        // token.preferred_username === item.created_by &&
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
 var conn =event.target.value;
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
  var temp =event.target.value;
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
          console.log("columns aree====>",data)
          const transformedColumns = data.map((column) => (
            column.column
          ));
          console.log("trans col are ===>",transformedColumns)
        setColumns(transformedColumns);
      }
  } else if (!(selectedConnection || selectedSchema)) {
      toast.error("Select above field first");
  }
};



  const handleSave = () => {
    const selectedView = id;

    if(selectedView && selectedConnection && selectedSchema && selectedTable){

    const selectFields = selectedColumns.map((column) => ({
      field: `${selectedView}.${column}`,
      alias: "",
    }));
  
    const newPayload = {
      id,
      type: "Connection",
      selectedView,
      selectedConnection,
      selectedSchema,
      selectedTable,
      selectedColumns,
      def: `Select * from ${selectedConnection}.${selectedSchema}.${selectedTable}`,
      select_fields: selectFields,
      Columns: columns
    };

    const currentPayloads = connectionPayload || [];
    const updatedPayloads = [...currentPayloads];
    const existingIndex = updatedPayloads.findIndex((payload) => payload.id === id);
  
    if (existingIndex !== -1) {
      updatedPayloads[existingIndex] = newPayload;
    } else {
      updatedPayloads.push(newPayload);
    }
  
    console.log("view payload is ===>",updatedPayloads)
    handleConnectionPayload(updatedPayloads)
    onSave?.(newPayload);
  }
  };

  const handleDelete = (id) => {
    const updatedPayload = connectionPayload.filter((node) => node.id !== id);
    handleConnectionPayload(updatedPayload);
    window.deleteNode?.(id)
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
          <Cable className="w-5 h-5 text-[#8E77BB]" />
          <h3 className="text-black font-medium">Connection</h3>
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
              <label className="block text-sm font-medium text-black mb-1">Connection</label>
              <select
                value={selectedConnection}
                onChange={handleConnectionChange}
                className="w-full bg-white rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg group border-solid border-2"
              >
                <option value="" disabled>
                  Select a connection
                </option>
                {connections?.map((conn,index)=>(
                  <option key={index} value={conn}>
                    {conn}
                    </option>
                ))         }
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Schema</label>
              <select
                value={selectedSchema}
                onChange={handleSchemaChange}
                className="w-full bg-white rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg group border-solid border-2"
              >
                <option value="" disabled>
                  Select a Schema
                </option>
                {schemas?.map((schema,index)=>(
                  <option key={index} value={schema}>
                    {schema}
                    </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Table</label>
              <select
                value={selectedTable}
                onChange={handleTableChange}
                className="w-full bg-white rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg group border-solid border-2"
              >
                <option value="" disabled>
                  Select a table
                </option>
                {tables?.map((schema,index)=>(
                  <option key={index} value={schema}>
                    {schema}
                    </option>
                ))}
              </select>
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
                      <div key={column} className="flex items-center space-x-2">
                        <input
                   type="checkbox"
                   onClick={(e) => {
                     if (e.target.checked) {
                       toggleModal(true);
                     } else {
                       toggleModal(false);
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
    <Box
      sx={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "22%", 
        height: "100%", 
      }}
    >
      <Columns toggleModal={toggleModal}/>
    </Box>
  </Modal>
            </>
  );
}

ConnectionNode.propTypes = {
  id: PropTypes.string.isRequired,
  onSave: PropTypes.func, // Optional prop for saving payload
};
