import { useEffect, useState } from "react";
import { Drawer, Divider, Checkbox, FormControlLabel } from "@mui/material";
import { useWorkflow } from "../../context/WorkflowContext";
import { useDrawerContext } from "../../context/DrawerContext";

const EditTable = ({ data }) => {
  const filteredColumns = data.metadatas.column_json.map(
    (item) => item.column_name
  );
  const { updatePipelineData, pipelines } = useWorkflow();
  const { closeDrawer } = useDrawerContext();

  const [selectedColumns, setSelectedColumns] = useState(
    filteredColumns.reduce((acc, column) => {
      acc[column] = false;
      return acc;
    }, {})
  );

  const toggleColumnSelection = (columnName) => {
    setSelectedColumns((prev) => ({
      ...prev,
      [columnName]: !prev[columnName],
    }));
  };

  const toggleAllColumns = () => {
    const allSelected = Object.values(selectedColumns).every((val) => val);
    setSelectedColumns(
      filteredColumns.reduce((acc, column) => {
        acc[column] = !allSelected;
        return acc;
      }, {})
    );
  };

  const handleSave = () => {
    const selectedColumnNames = Object.keys(selectedColumns).filter(
      (col) => selectedColumns[col]
    );
    console.log("Selected Columns:", selectedColumnNames);
  };
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-gray-500 text-sm">Table name</label>
          <div className="font-medium">{data?.source_table}</div>
        </div>

        <div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={Object.values(selectedColumns).every((val) => val)}
              onChange={toggleAllColumns}
              className="mr-2 h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <label className="text-sm font-medium">Select all columns</label>
          </div>

          <div className="space-y-1 max-h-[65vh]  overflow-y-auto border border-gray-200 rounded-md p-2">
            {filteredColumns.map((columnName, index) => (
              <div
                key={index}
                className="flex items-center hover:bg-gray-50 py-1 px-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedColumns[columnName] || false}
                  onChange={() => toggleColumnSelection(columnName)}
                  className="mr-2 h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">{columnName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
      <button
            className="bg-[#8d77ba] text-white px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
            onClick={() => {
              handleSave()
              closeDrawer("cdc");
            }}
          >
            Save
          </button>
      </div>
    </div>
  );
};

export default EditTable;
