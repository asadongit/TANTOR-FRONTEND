import { useEffect, useState } from "react";
import { Checkbox } from "@mui/material";
import { useWorkflow } from "../../context/WorkflowContext";
import { useDrawerContext } from "../../context/DrawerContext";

const AddScope = ({ drawerState, handleSave }) => {
  const { updatePipelineData, pipelines } = useWorkflow();
  const { closeDrawer } = useDrawerContext();
  const activePipelineID = drawerState?.pipelineId;


  // Try different ways to access the table name
  const selectedTableFromDrawer =
    typeof drawerState?.args?.[4] === 'string'
      ? drawerState.args[4]
      : (drawerState?.args?.[4]?.source_table || "");


  const sourceData = pipelines[activePipelineID]?.data?.source || {};

  // Always ensure the selected table is in the list
  let selectedTables =
    (sourceData.bulk_list?.length > 0
      ? sourceData.bulk_list
      : sourceData.subset_list) || [];

  if (
    selectedTableFromDrawer &&
    !selectedTables.includes(selectedTableFromDrawer)
  ) {
    selectedTables = [...selectedTables, selectedTableFromDrawer];
  }

  const [selectedTable, setSelectedTable] = useState("");
  const [tableOpTypes, setTableOpTypes] = useState({});

  const optionMapping = {
    "Insert": "create",
    "Upsert": "update",
    "Delete": "delete",
    // "Schema changes": "schemaChanges",
    // "Data federation view": "datafederation"
  };

  const defaultOpTypes = {
    create: true,
    update: false,
    delete: false,
    schemaChanges: false,
    datafederation: false
  };

  useEffect(() => {

    // Select the table immediately
    if (selectedTableFromDrawer) {
      setSelectedTable(selectedTableFromDrawer);
    } else if (selectedTables.length > 0) {
      setSelectedTable(selectedTables[0]);
    }

    // Initialize table operations from source data if available
    const initialTableOpTypes = {};

    selectedTables.forEach(tableName => {
      initialTableOpTypes[tableName] =
        (sourceData.table_op_types && sourceData.table_op_types[tableName])
          ? sourceData.table_op_types[tableName]
          : { ...defaultOpTypes };
    });

    // Make sure we have op types for the selected table
    if (selectedTableFromDrawer && !initialTableOpTypes[selectedTableFromDrawer]) {
      initialTableOpTypes[selectedTableFromDrawer] = { ...defaultOpTypes };
    }

    setTableOpTypes(initialTableOpTypes);
  }, [selectedTableFromDrawer, sourceData.table_op_types]);

  const handleTableChange = (e) => {
    setSelectedTable(e.target.value);
  };

  const handleCheckboxChange = (option) => {
    if (!selectedTable) return;

    const operationKey = optionMapping[option];
    const currentTableOpTypes = tableOpTypes[selectedTable] || { ...defaultOpTypes };
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

    setTableOpTypes({
      ...tableOpTypes,
      [selectedTable]: updatedOpTypes
    });
  };

  const isDisabled = (option) => {
    if (!selectedTable) return true;

    // Make sure we have op types for the current table
    if (!tableOpTypes[selectedTable]) {
      return false; // Don't disable any option if we don't have settings yet
    }

    // Get the current op types for the selected table
    const currentTableOpTypes = tableOpTypes[selectedTable];
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
    // Make sure we're saving the correct table op types
    if (selectedTable) {
      const updatedTableOpTypes = {
        ...(sourceData.table_op_types || {}),
        ...tableOpTypes,
      };

      updatePipelineData(activePipelineID, "source", {
        table_op_types: updatedTableOpTypes,
        op_types: tableOpTypes[selectedTable] || defaultOpTypes
      });
    }

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
            disabled={!!selectedTableFromDrawer}
          >
            {selectedTables
              .filter(table => !selectedTableFromDrawer || table === selectedTableFromDrawer)
              .map((table, index) => (
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
