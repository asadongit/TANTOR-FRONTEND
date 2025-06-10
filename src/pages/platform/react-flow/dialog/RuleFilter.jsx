import { useEffect, useState } from "react";
import { useTableContext } from "../context/TableContext";
import { Drawer } from "@mui/material";
import { X, Info, RefreshCcw } from "lucide-react";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
 

const RuleFilter = ({ nodes, setNodes, filterData, setFilterData }) => {
  const { drawerState, closeDrawer } = useTableContext();
  const [currentColumnIndex, setCurrentColumnIndex] = useState(0);
  const [column, setColumn] = useState([]);
  const [columnSettings, setColumnSettings] = useState({
    id: "",
    name: "",
    type: "",
    dimType: "",
    alias: "",
    output: true,
    order: "",
    sort: "",
    aggregate: "",
    groupBy: false,
  });
    
  useEffect(() => {
    if (drawerState.isOpen && drawerState.selectedTable) {
      console.log("Drawer state ==>> ", drawerState);
      const node = nodes.find(n => n.id === drawerState.nodeId);
      const existingColumns = node?.data?.filterConditions?.columns || [];
      const selectedTable = drawerState.selectedTable;
      const columnList = Array.isArray(selectedTable) ? selectedTable : [selectedTable];
      const mappedColumns = columnList.map(table => {
        const existing = existingColumns.find(col => col.name === table.name);
        return {
          id: existing?.id || table.id,
          name: existing?.name || table.name,
          type: existing?.type || table.type || "varchar",
          dimType: existing?.dimType || table.dimType,
          alias: existing?.alias || "",
          output: existing?.output ?? true,
          order: existing?.order || "",
          sort: existing?.sort || "",
          aggregate: existing?.aggregate || "",
          groupBy: existing?.groupBy ?? false,
        };
      });
      setColumn(mappedColumns);
      if (mappedColumns.length > 0) {
        setColumnSettings(mappedColumns[0]);
        setCurrentColumnIndex(0);
      }
    }
  }, [drawerState.isOpen, drawerState.selectedTable]);

  const handleNextTable = () => {
    if (currentColumnIndex < column.length - 1) {
      // Save current settings before moving
      const updatedColumns = [...column];
      updatedColumns[currentColumnIndex] = { ...columnSettings };
      setColumn(updatedColumns);
      
      // Move to next and load its settings
      setCurrentColumnIndex(currentColumnIndex + 1);
      setColumnSettings(updatedColumns[currentColumnIndex + 1]);
    }
  };

  const handlePrevTable = () => {
    if (currentColumnIndex > 0) {
      // Save current settings before moving
      const updatedColumns = [...column];
      updatedColumns[currentColumnIndex] = { ...columnSettings };
      setColumn(updatedColumns);
      
      // Move to previous and load its settings
      setCurrentColumnIndex(currentColumnIndex - 1);
      setColumnSettings(updatedColumns[currentColumnIndex - 1]);
    }
  };

  const handleSave = () => {
    if (!drawerState.nodeId) return;

    // Save current column settings
    const updatedColumns = [...column];
    updatedColumns[currentColumnIndex] = { ...columnSettings };

    // Update node data with new column settings
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id === drawerState.nodeId) {
          // Get existing filter conditions
          const existingFilterConditions = node.data.filterConditions || {};
          
          const updatedData = {
            ...node.data,
            filterConditions: {
              ...existingFilterConditions,
              columns: updatedColumns
            }
          };

          // If node is connected to Define node, preserve that connection
          if (node.data.isConnectedToDefine) {
            updatedData.isConnectedToDefine = true;
            updatedData.ruleName = node.data.ruleName;
            updatedData.ruleDescription = node.data.ruleDescription;
          }

          return {
            ...node,
            data: updatedData
          };
        }
        return node;
      })
    );

    // Update filterData state
    if (setFilterData) {
      setFilterData(prev => ({
        ...prev,
        columns: updatedColumns
      }));
    }

    closeDrawer();
  };

  const handleReset = () => {
    const currentTable = column[currentColumnIndex];
    if (currentTable) {
      setColumnSettings({
        id: currentTable.id,
        name: currentTable.name,
        type: currentTable.type,
        dimType: currentTable.dimType,
        alias: "",
        output: true,
        order: "",
        sort: "",
        aggregate: "",
        groupBy: false,
      });
    }
  };

  const handleCancel = () => {
    closeDrawer();
  };

  if (!drawerState.isOpen) return null;

  return (
    <Drawer anchor="right" open={drawerState.isOpen} onClose={closeDrawer}>
      <div className="w-[400px] p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Column Settings</h3>
          <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {column.length > 0 ? (
          <div className="space-y-4">
            {/* Navigation Arrows */}
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevTable}
                disabled={currentColumnIndex === 0}
                className={`text-lg ${currentColumnIndex === 0 ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:text-blue-800"}`}
              >
                <ArrowBigLeft />
              </button>
              <span className="text-sm font-medium">
                Column {currentColumnIndex + 1} of {column.length}: {columnSettings.name}
              </span>
              <button
                onClick={handleNextTable}
                disabled={currentColumnIndex === column.length - 1}
                className={`text-lg ${currentColumnIndex === column.length - 1 ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:text-blue-800"}`}
              >
                <ArrowBigRight />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={columnSettings.name}
                readOnly
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <input
                type="text"
                value={`${columnSettings.type} (${columnSettings.dimType})`}
                readOnly
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Alias and Output */}
            <div className="flex space-x-4">
              <div className="flex-1 space-y-2">
                <label className="block text-sm font-medium text-gray-700">Alias</label>
                <input
                  type="text"
                  value={columnSettings.alias}
                  onChange={(e) => setColumnSettings({ ...columnSettings, alias: e.target.value })}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter alias"
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="block text-sm font-medium text-gray-700">Output</label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={!!columnSettings.output}
                    onChange={(e) => setColumnSettings({ ...columnSettings, output: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include in output</span>
                </div>
              </div>
            </div>

            {/* Order and Sort */}
            <div className="flex space-x-4">
              <div className="flex-1 space-y-2">
              <label className="block text-sm font-medium text-gray-700">Order</label>
              <input
                type="text"
                value={columnSettings.order}
                onChange={(e) => setColumnSettings({ ...columnSettings, order: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter order (e.g., 1)"
              />
              </div>
              <div className="flex-1 space-y-2">
              <label className="block text-sm font-medium text-gray-700">Sort</label>
              <select
                value={columnSettings.sort}
                onChange={(e) => setColumnSettings({ ...columnSettings, sort: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">None</option>
                <option value="ASC">Ascending</option>
                <option value="DESC">Descending</option>
              </select>
              </div>
            </div>
            {/* Aggregate and Group By */}
            <div className="flex space-x-4">
              <div className={`flex-1 space-y-2 ${columnSettings.dimType === "metric" ? "" : "invisible"}`}>
              <label className="block text-sm font-medium text-gray-700 invisib">Aggregate</label>
              <select
                value={columnSettings.aggregate}
                onChange={(e) => setColumnSettings({ ...columnSettings, aggregate: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">None</option>
                <option value="SUM">SUM</option>
                <option value="AVG">AVG</option>
                <option value="COUNT">COUNT</option>
                <option value="MIN">MIN</option>
                <option value="MAX">MAX</option>
              </select>
              </div>
              <div className={`flex-1 space-y-2 ${columnSettings.dimType === "dimension" ? "" : "invisible"}`}>
              <label className="block text-sm font-medium text-gray-700">Group By</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={!!columnSettings.groupBy}
                  onChange={(e) => setColumnSettings({ ...columnSettings, groupBy: e.target.checked })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Group by</span>
              </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleReset}
                className="bg-gray-100 text-gray-800 border border-gray-300 rounded-md py-2 px-4 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                className="bg-[#8e78b7] text-white border-none rounded-md py-2 px-4 text-sm font-medium hover:bg-[#7b65a3] transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">No Column Selected</div>
        )}
      </div>
    </Drawer>
  );
};

export default RuleFilter;