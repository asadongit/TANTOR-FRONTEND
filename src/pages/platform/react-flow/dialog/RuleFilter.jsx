import { useEffect, useState } from "react";
import { useTableContext } from "../context/TableContext";
import { Drawer } from "@mui/material";
import { X, Info, RefreshCcw, ChevronDown } from "lucide-react";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
 

const RuleFilter = ({ nodes, setNodes, filterData, setFilterData }) => {
  const { drawerState, closeDrawer } = useTableContext();
  const [currentColumnIndex, setCurrentColumnIndex] = useState(0);
  const [column, setColumn] = useState([]);
  const [aggregateDropdownOpen, setAggregateDropdownOpen] = useState(false);
  const [columnSettings, setColumnSettings] = useState({
    id: "",
    name: "",
    type: "",
    dimType: "",
    alias: "",
    output: true,
    order: "",
    sort: "",
    aggregate: [],
    groupBy: false,
  });

  const aggregateOptions = [
    { value: "SUM", label: "SUM" },
    { value: "AVG", label: "AVG" },
    { value: "COUNT", label: "COUNT" },
    { value: "MIN", label: "MIN" },
    { value: "MAX", label: "MAX" },
  ];
    
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
          aggregate: existing?.aggregate ? Array.isArray(existing.aggregate) ? existing.aggregate : [existing.aggregate] : [],
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

  const handleAggregateChange = (value) => {
    setColumnSettings(prev => {
      const newAggregate = prev.aggregate.includes(value) 
        ? prev.aggregate.filter(agg => agg !== value)
        : [...prev.aggregate, value];

      return { ...prev, aggregate: newAggregate };
    });
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
        aggregate: [],
        groupBy: false,
      });
    }
  };

  const handleCancel = () => {
    closeDrawer();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.aggregate-dropdown')) {
        setAggregateDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
            {/* <div className="flex space-x-4">
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
            </div> */}

            {/* Order and Sort */}
            {/* <div className="flex space-x-4">
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
            </div> */}

            {/* Aggregate and Group By */}
            <div className="flex space-x-4">
              <div className={`flex-1 space-y-2 ${columnSettings.dimType === "metric" ? "" : "invisible"}`}>
                <label className="block text-sm font-medium text-gray-700">Aggregate</label>
                <div className="relative aggregate-dropdown">
                  <button
                    type="button"
                    onClick={() => setAggregateDropdownOpen(!aggregateDropdownOpen)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 flex items-center justify-between"
                  >
                    <span className="text-gray-700">
                      {columnSettings.aggregate.length === 0 
                        ? "Select aggregates..." 
                        : `${columnSettings.aggregate.length} selected`}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${aggregateDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {aggregateDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
                      {aggregateOptions.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={columnSettings.aggregate.includes(option.value)}
                            onChange={() => handleAggregateChange(option.value)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  
                  {/* {columnSettings.aggregate.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {columnSettings.aggregate.map((agg) => (
                        <span
                          key={agg}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {agg}
                          <button
                            type="button"
                            onClick={() => handleAggregateChange(agg)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )} */}
                </div>
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