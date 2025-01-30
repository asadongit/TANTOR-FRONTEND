/*eslint-disable*/
import React, { useState } from "react";
import PropTypes from "prop-types"; // Add this import
import { Handle, Position } from "reactflow";
import { Cable, X, ChevronDown, ChevronUp } from "lucide-react";
import { useStateContext } from "../../../../context/contextProvider";

export function ConnectionNode({ id, onSave }) {

  const {handleConnectionPayload, connectionPayload} = useStateContext("")
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectedConnection,setSelectedConnection] = useState("")

  const dummyColumns = ["connection 1", "id ", "name", "address", "phonenumber"];

  const handleColumnChange = (column) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((col) => col !== column)
        : [...prev, column]
    );
  };

  const handleSelectAllChange = (isChecked) => {
    if (isChecked) {
      setSelectedColumns(dummyColumns);
    } else {
      setSelectedColumns([]);
    }
  };

  const isAllSelected = selectedColumns.length === dummyColumns.length;

  const handleSave = () => {
    const selectedView = id;

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
      Columns: dummyColumns
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
  };


  return (
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
              onClick={() => window.deleteNode?.(id)}
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
                onChange={(e) => setSelectedConnection(e.target.value)}
                className="w-full bg-white rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg group border-solid border-2"
              >
                <option value="" disabled>
                  Select a connection
                </option>
                <option value="view1">View 1</option>
                <option value="view2">View 2</option>
                <option value="view3">View 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Schema</label>
              <select
                value={selectedSchema}
                onChange={(e) => setSelectedSchema(e.target.value)}
                className="w-full bg-white rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg group border-solid border-2"
              >
                <option value="" disabled>
                  Select a Schema
                </option>
                <option value="schema1">Schema 1</option>
                <option value="schema2">Schema 2</option>
                <option value="schema3">Schema 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Table</label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full bg-white rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg group border-solid border-2"
              >
                <option value="" disabled>
                  Select a table
                </option>
                <option value="table1">Table 1</option>
                <option value="table2">Table 2</option>
                <option value="table3">Table 3</option>
              </select>
            </div>
            {selectedTable && (
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
                    {dummyColumns.map((column) => (
                      <div key={column} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
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
  );
}

ConnectionNode.propTypes = {
  id: PropTypes.string.isRequired,
  onSave: PropTypes.func, // Optional prop for saving payload
};
