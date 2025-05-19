import { useEffect, useState } from "react";
import { Checkbox } from "@mui/material";
import { useWorkflow } from "../../context/WorkflowContext";
import { useDrawerContext } from "../../context/DrawerContext";

const AddScope = ({ drawerState, handleSave }) => {
  const { updatePipelineData, pipelines } = useWorkflow();
  const { closeDrawer } = useDrawerContext();
  const activePipelineID = drawerState?.pipelineId;

  const sourceData = pipelines[activePipelineID]?.data?.source || {};
  const selectedTables = sourceData?.bulk_list || [];

  const [selectedTable, setSelectedTable] = useState("");
  const [tableOpTypes, setTableOpTypes] = useState({});

  const optionMapping = {
    "Insert": "create",
    "Upsert": "update",
    "Delete": "delete",
    "Schema changes": "schemaChanges",
    "Data federation view": "datafederation"
  };

  const defaultOpTypes = {
    create: true,
    update: false,
    delete: false,
    schemaChanges: false,
    datafederation: false
  };

  useEffect(() => {
    // Initialize table operations from source data if available
    const initialTableOpTypes = {};

    if (selectedTables.length > 0) {
      // Set the first table as default selected
      setSelectedTable(selectedTables[0]);

      // Initialize operation types for each table
      selectedTables.forEach(tableName => {
        initialTableOpTypes[tableName] =
          (sourceData.table_op_types && sourceData.table_op_types[tableName])
            ? sourceData.table_op_types[tableName]
            : {...defaultOpTypes};
      });

      setTableOpTypes(initialTableOpTypes);
    }
  }, [sourceData, selectedTables]);

  const handleTableChange = (e) => {
    setSelectedTable(e.target.value);
  };

  const handleCheckboxChange = (option) => {
    if (!selectedTable) return;

    const operationKey = optionMapping[option];
    const currentTableOpTypes = tableOpTypes[selectedTable] || {...defaultOpTypes};
    let updatedOpTypes = { ...currentTableOpTypes };

    updatedOpTypes[operationKey] = !updatedOpTypes[operationKey];

    if (operationKey === "create" && updatedOpTypes.create) {
      updatedOpTypes.delete = false;
      updatedOpTypes.update = false;
    }
    if (operationKey === "update" && updatedOpTypes.update) {
      updatedOpTypes.delete = false;
      updatedOpTypes.create = false;
    }
    if (operationKey === "delete" && updatedOpTypes.delete) {
      updatedOpTypes.update = true;
      updatedOpTypes.create = false;
    }

    // Update the state for the specific table
    setTableOpTypes({
      ...tableOpTypes,
      [selectedTable]: updatedOpTypes
    });
  };

  const isDisabled = (option) => {
    if (!selectedTable) return true;

    const currentTableOpTypes = tableOpTypes[selectedTable] || defaultOpTypes;
    const op = optionMapping[option];

    if (currentTableOpTypes.create) {
      return op === "delete" || op === "update";
    }
    if (currentTableOpTypes.delete) {
      return op === "create";
    }
    return false;
  };

  const handleSaveClick = () => {
    // Save per-table operation types
    updatePipelineData(activePipelineID, "source", {
      table_op_types: tableOpTypes,
      op_types: tableOpTypes[selectedTable] || defaultOpTypes // Keep legacy op_types for backward compatibility
    });

    handleSave();
    closeDrawer("cdc");
  };

  return (
    <div className="space-y-4">
      {selectedTables.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Table
          </label>
          <select
            value={selectedTable}
            onChange={handleTableChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8d77ba]"
          >
            {selectedTables.map((table, index) => (
              <option key={index} value={table}>
                {table}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col space-y-4">
        {Object.keys(optionMapping).map((option, index) => (
          <div key={index} className="flex items-center">
            <Checkbox
              checked={selectedTable && tableOpTypes[selectedTable]
                ? tableOpTypes[selectedTable][optionMapping[option]] || false
                : false}
              onChange={() => handleCheckboxChange(option)}
              color="primary"
              disabled={isDisabled(option)}
              sx={{
                color: "#6753a8",
                '&.Mui-checked': {
                  color: "#6753a8",
                },
              }}
            />
            <span className="text-gray-800 ml-2">{option}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          className="bg-[#8d77ba] text-white px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
          onClick={handleSaveClick}
          disabled={!selectedTable}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default AddScope;
