
import { useState, useEffect } from "react";
import {
  Info,
  Pencil,
  Trash2,
  AlertCircle,
  Database,
  Filter,
  Table,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Code,
  ListFilter,
} from "lucide-react";
import toast from "react-hot-toast";
import { useWorkflow } from "../../../context/WorkflowContext";
import { useDrawerContext } from "../../../context/DrawerContext";
const AddFilter = ({ drawerData }) => {
  const { bulkMappings, updateBulkMappings } = useWorkflow();
  const metadata = drawerData?.data?.metadatas;
  const pipelineId = drawerData?.pipelineId;
  const sourceId = drawerData?.sourceId;
const {closeDrawer}= useDrawerContext()
  
  const [sourceTable, setSourceTable] = useState("");
  const [availableTargets, setAvailableTargets] = useState([]);
  const [targetFilters, setTargetFilters] = useState({});
  const [targetComplexQueries, setTargetComplexQueries] = useState({});

  const [activeTab, setActiveTab] = useState("filter-tab");
  const [activeTargetTable, setActiveTargetTable] = useState(null);
  const [currentFilter, setCurrentFilter] = useState({
    columnName: "",
    filterOperator: "=",
    value: "",
    logic: "AND",
  });
  const [currentComplexQuery, setCurrentComplexQuery] = useState("");
  const [editingDetails, setEditingDetails] = useState(null); // { table, index }
  const [columns, setColumns] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filterMode, setFilterMode] = useState("regular"); 
  useEffect(() => {
    setIsEditMode(
      !!drawerData?.targetFilters && Object.keys(drawerData.targetFilters).length > 0
    );

    const mappings = bulkMappings?.[pipelineId] || [];
    
    const srcTable = drawerData?.data?.source_table;
    setSourceTable(srcTable);

    const targetsForSource = mappings.filter(
      (mapping) => mapping.source_table === srcTable
    );

    const targetTables = targetsForSource.map((t) => t.target_table);
    setAvailableTargets(targetTables);

    if (targetTables.length > 0) {
      setActiveTargetTable(targetTables[0]);
    }

    if (drawerData?.targetFilters) {
      setTargetFilters(drawerData.targetFilters);
    } else {
      const initialFilters = {};
      targetTables.forEach((target) => {
        initialFilters[target] = [];
      });
      setTargetFilters(initialFilters);
    }

    if (drawerData?.targetComplexQueries) {
      setTargetComplexQueries(drawerData.targetComplexQueries);
    } else {
      const initialComplexQueries = {};
      targetTables.forEach((target) => {
        initialComplexQueries[target] = "";
      });
      setTargetComplexQueries(initialComplexQueries);
    }

    targetsForSource.forEach((mapping) => {
      const targetTable = mapping.target_table;
      
      if (mapping.whereCondition) {
        setTargetComplexQueries(prev => ({
          ...prev,
          [targetTable]: mapping.whereCondition
        }));
      }
    });

    const columns = metadata?.column_json?.map((item) => ({
      column_name: item.column_name,
      data_type: item.DATA_TYPE,
    }));
    setColumns(columns);
  }, [drawerData, bulkMappings, pipelineId]);

  const handleAddFilter = () => {
    if (!currentFilter.columnName || !currentFilter.value) {
      toast.error("Please fill all filter fields");
      return;
    }

    if (!activeTargetTable) {
      toast.error("Please select a target table first");
      return;
    }

    if (editingDetails) {
      const updatedTargetFilters = { ...targetFilters };
      const filtersForTarget = [...updatedTargetFilters[editingDetails.table]];

      filtersForTarget[editingDetails.index] = {
        ...currentFilter,
        id: targetFilters[editingDetails.table][editingDetails.index].id,
      };

      updatedTargetFilters[editingDetails.table] = filtersForTarget;
      setTargetFilters(updatedTargetFilters);
      setEditingDetails(null);
    } else {
      const updatedTargetFilters = { ...targetFilters };
      const filtersForTarget = updatedTargetFilters[activeTargetTable] || [];

      updatedTargetFilters[activeTargetTable] = [
        ...filtersForTarget,
        {
          ...currentFilter,
          id: Date.now() + Math.random(),
        },
      ];

      setTargetFilters(updatedTargetFilters);
    }

    setCurrentFilter({
      columnName: "",
      filterOperator: "=",
      value: "",
      logic: "AND",
    });
  };

  const handleAddComplexQuery = () => {
    if (!currentComplexQuery.trim()) {
      toast.error("Please enter a query");
      return;
    }

    if (!activeTargetTable) {
      toast.error("Please select a target table first");
      return;
    }

    const updatedTargetComplexQueries = { ...targetComplexQueries };
    updatedTargetComplexQueries[activeTargetTable] = currentComplexQuery;
    setTargetComplexQueries(updatedTargetComplexQueries);

    setCurrentComplexQuery("");
    
    toast.success(`Complex query added for ${activeTargetTable}`);
  };

  const handleEditFilter = (targetTable, index) => {
    const filter = targetFilters[targetTable][index];

    setCurrentFilter({
      columnName: filter.columnName,
      filterOperator: filter.filterOperator,
      value: filter.value,
      logic: filter.logic || "AND",
    });

    setEditingDetails({ table: targetTable, index });
    setActiveTargetTable(targetTable);
    setFilterMode("regular");
  };

  const handleEditComplexQuery = (targetTable) => {
    const query = targetComplexQueries[targetTable];
    setCurrentComplexQuery(query);
    setActiveTargetTable(targetTable);
    setFilterMode("complex");
  };

  const handleRemoveFilter = (targetTable, index) => {
    const updatedTargetFilters = { ...targetFilters };
    const filtersForTarget = [...updatedTargetFilters[targetTable]];

    filtersForTarget.splice(index, 1);
    updatedTargetFilters[targetTable] = filtersForTarget;

    setTargetFilters(updatedTargetFilters);

    if (
      editingDetails &&
      editingDetails.table === targetTable &&
      editingDetails.index === index
    ) {
      setEditingDetails(null);
      setCurrentFilter({
        columnName: "",
        filterOperator: "=",
        value: "",
        logic: "AND",
      });
    }
  };

  const handleRemoveComplexQuery = (targetTable) => {
    const updatedTargetComplexQueries = { ...targetComplexQueries };
    updatedTargetComplexQueries[targetTable] = "";
    setTargetComplexQueries(updatedTargetComplexQueries);

    if (activeTargetTable === targetTable && filterMode === "complex") {
      setCurrentComplexQuery("");
    }
    
    toast.success(`Complex query removed for ${targetTable}`);
  };

  const handleSave = () => {
    const hasAnyFilters = Object.values(targetFilters).some(
      (filters) => filters.length > 0
    );
    
    const hasAnyComplexQueries = Object.values(targetComplexQueries).some(
      (query) => query.trim() !== ""
    );

    if (!hasAnyFilters && !hasAnyComplexQueries) {
      toast.error("Please add at least one filter or complex query for any target table");
      return;
    }

    const whereConditions = {};

    // Object.entries(targetFilters).forEach(([targetTable, filters]) => {
    //   if (filters.length > 0) {
    //     const conditionString = filters
    //       .map((entry, index) => {
    //         const logicPrefix =
    //           index > 0 ? `${filters[index - 1].logic || "AND"} ` : "";
    //         return `${logicPrefix}${entry.columnName} ${entry.filterOperator} ${entry.value}`;
    //       })
    //       .join(" ");

    //     whereConditions[targetTable] = `Where ${conditionString}`;
    //   }
    // });
    Object.entries(targetFilters).forEach(([targetTable, filters]) => {
      if (filters.length > 0) {
        const wherecolumn = filters.map(f => f.columnName).join(", ");
        const whereoperator = filters.map(f => f.filterOperator).join(", ");
        const wherevalues = filters.map(f => f.value).join(", ");
    
        whereConditions[targetTable] = {
          wherecolumn,
          whereoperator,
          wherevalues
        };
      }
    });
console.log("whereConditions",whereConditions)
    Object.entries(targetComplexQueries).forEach(([targetTable, query]) => {
      if (query.trim() !== "") {
        whereConditions[targetTable] =  `Where ${query}`;
      }
    });

    Object.entries(whereConditions).forEach(([targetTable, whereCondition]) => {
      updateBulkMappings(
        sourceId,
        pipelineId,
        targetTable,
        { whereCondition },
        sourceTable,
        true
      );
    });

    toast.success("Filter conditions saved successfully!");
    closeDrawer('migration')
  };

  const generateQueryPreview = (targetTable) => {
    if (targetComplexQueries[targetTable] && targetComplexQueries[targetTable].trim() !== "") {
      return targetComplexQueries[targetTable];
    }
    
    const filters = targetFilters[targetTable] || [];

    if (filters.length === 0) return "No filters";

    return filters
      .map((entry, index) => {
        const logicPrefix =
          index > 0 ? `${filters[index - 1].logic || "AND"} ` : "";
        return `${logicPrefix}${entry.columnName} ${entry.filterOperator} ${entry.value}`;
      })
      .join(" ");
  };

  const hasFilters = (targetTable) => {
    const hasRegularFilters = (targetFilters[targetTable] || []).length > 0;
    const hasComplexQuery = targetComplexQueries[targetTable] && targetComplexQueries[targetTable].trim() !== "";
    return hasRegularFilters || hasComplexQuery;
  };

  const getTablesWithFiltersCount = () => {
    return Object.keys(targetFilters).filter(
      (target) => hasFilters(target)
    ).length;
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const selectTargetTable = (target) => {
    setActiveTargetTable(target);
    setIsDropdownOpen(false);
  };

  const toggleFilterMode = (mode) => {
    setFilterMode(mode);
    setEditingDetails(null);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-100">
        <div className="flex items-center text-sm text-gray-700">
          <div className="font-medium bg-white px-2 py-1 rounded border border-blue-200">
            {sourceTable}
          </div>
          <ArrowRight className="mx-2 h-4 w-4 text-purple-500" />
          <div className="flex-1 flex items-center">
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center bg-white px-3 py-1.5 rounded border border-purple-200 text-sm font-medium text-gray-700"
              >
                {activeTargetTable || "Select target"} 
                <ChevronDown className="ml-2 h-4 w-4 text-purple-500" />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute z-10 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg">
                  <ul className="py-1 max-h-60 overflow-auto">
                    {availableTargets.map((target) => (
                      <li 
                        key={target}
                        className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-purple-50 ${
                          activeTargetTable === target ? "bg-purple-50" : ""
                        }`}
                        onClick={() => selectTargetTable(target)}
                      >
                        <span>{target}</span>
                        {hasFilters(target) && (
                          <span className="p-1 rounded-full bg-green-100">
                            <Check className="h-3 w-3 text-green-600" />
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="ml-3 text-gray-700 font-medium">
              {getTablesWithFiltersCount()} of {availableTargets.length} tables with filters
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTargetTable ? (
          <>
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-3 bg-white rounded-md border border-purple-100 p-1">
                <button
                  className={`flex items-center px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    filterMode === "regular"
                      ? "bg-purple-100 text-[#8e78b7]"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                  onClick={() => toggleFilterMode("regular")}
                >
                  <ListFilter className="h-4 w-4 mr-1.5" />
                  Regular Condition
                </button>
                <button
                  className={`flex items-center px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    filterMode === "complex"
                      ? "bg-purple-100 text-[#8e78b7]"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                  onClick={() => toggleFilterMode("complex")}
                >
                  <Code className="h-4 w-4 mr-1.5" />
                  Complex Query
                </button>
              </div>
            </div>

            {filterMode === "regular" ? (
              <div className="my-6">
                <div className="bg-white border border-gray-200 rounded-md p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label
                        htmlFor="column"
                        className="block mb-2 text-xs font-medium text-gray-600"
                      >
                        Column Name
                      </label>
                      <select
                        id="column"
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        value={currentFilter.columnName}
                        onChange={(e) =>
                          setCurrentFilter({
                            ...currentFilter,
                            columnName: e.target.value,
                          })
                        }
                      >
                        <option value="">Select a column</option>
                        {columns?.map((item) => (
                          <option key={item.column_name} value={item.column_name}>
                            {item.column_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="operator"
                        className="block mb-2 text-xs font-medium text-gray-600"
                      >
                        Operator
                      </label>
                      <select
                        id="operator"
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        value={currentFilter.filterOperator}
                        onChange={(e) =>
                          setCurrentFilter({
                            ...currentFilter,
                            filterOperator: e.target.value,
                          })
                        }
                      >
                        <option value="=">= Equal to</option>
                        <option value="!=">!= Not equal to</option>
                        <option value=">">&gt; Greater than</option>
                        <option value="<">&lt; Less than</option>
                        <option value=">=">≥ Greater than or equal</option>
                        <option value="<=">≤ Less than or equal</option>
                        <option value="LIKE">LIKE</option>
                        <option value="IN">IN</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="value"
                        className="block mb-2 text-xs font-medium text-gray-600"
                      >
                        Value
                      </label>

                      <input
                        type={(() => {
                          const column = columns?.find(
                            (item) =>
                              item.column_name === currentFilter.columnName
                          );
                          const type = column?.data_type?.toUpperCase();
                          if (type === "DATE") return "date";
                          if (
                            type === "DATETIME" ||
                            (type && type.startsWith("TIMESTAMP"))
                          )
                            return "datetime-local";
                          return "text";
                        })()}
                        id="value"
                        placeholder="Enter value"
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        value={currentFilter.value}
                        onChange={(e) =>
                          setCurrentFilter({
                            ...currentFilter,
                            value: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* <div className="flex items-center mb-4">
                    <label className="text-xs font-medium text-gray-600 mr-3">
                      Logic for next condition:
                    </label>
                    <div className="flex items-center">
                      <label className="inline-flex items-center mr-4">
                        <input
                          type="radio"
                          name="logic"
                          value="AND"
                          checked={currentFilter.logic === "AND"}
                          onChange={() =>
                            setCurrentFilter({
                              ...currentFilter,
                              logic: "AND",
                            })
                          }
                          className="mr-1.5"
                        />
                        <span className="text-sm">AND</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="logic"
                          value="OR"
                          checked={currentFilter.logic === "OR"}
                          onChange={() =>
                            setCurrentFilter({
                              ...currentFilter,
                              logic: "OR",
                            })
                          }
                          className="mr-1.5"
                        />
                        <span className="text-sm">OR</span>
                      </label>
                    </div>
                  </div> */}

                  <div>
                    <button
                      className="bg-[#8e78b7] text-white border-none rounded-md py-2 px-4 text-sm font-medium cursor-pointer transition-colors hover:bg-[#7c68a3]"
                      onClick={handleAddFilter}
                    >
                      {editingDetails ? "Update Condition" : "Add Condition"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="my-6">
                <div className="bg-white border border-gray-200 rounded-md p-4">
                  <div className="mb-4">
                    <label
                      htmlFor="complexQuery"
                      className="block mb-2 text-xs font-medium text-gray-600"
                    >
                      WHERE Clause
                    </label>
                    <textarea
                      id="complexQuery"
                      placeholder="Enter your SQL WHERE clause (without the WHERE keyword)"
                      className="w-full p-3 border border-gray-300 rounded-md text-sm font-mono h-32"
                      value={currentComplexQuery}
                      onChange={(e) => setCurrentComplexQuery(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {/* Example: (order_date > '2023-01-01' AND status = 'completed') OR total_amount > 1000 */}
                    </p>
                  </div>

                  <div>
                    <button
                      className="bg-[#8e78b7] text-white border-none rounded-md py-2 px-4 text-sm font-medium cursor-pointer transition-colors hover:bg-[#7c68a3]"
                      onClick={handleAddComplexQuery}
                    >
                      Add Complex Query
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3 text-gray-700">
                Current Filters for {activeTargetTable}
              </h3>

              {targetComplexQueries[activeTargetTable] && targetComplexQueries[activeTargetTable].trim() !== "" && (
                <div className="mb-4 bg-white border border-gray-200 rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Code className="h-4 w-4 mr-2 text-purple-600" />
                      <span className="text-sm font-medium">Complex Query</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditComplexQuery(activeTargetTable)}
                        className="p-1 text-purple-600 hover:text-purple-700 rounded-md"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveComplexQuery(activeTargetTable)}
                        className="p-1 text-red-600 hover:text-red-800 rounded-md"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md font-mono text-xs text-gray-700">
                    WHERE {targetComplexQueries[activeTargetTable]}
                  </div>
                </div>
              )}

              {(targetFilters[activeTargetTable] || []).length > 0 && (
                <div className="bg-white border border-gray-200 rounded-md p-4">
                  <div className="space-y-2 mb-4">
                    {(targetFilters[activeTargetTable] || []).map(
                      (filter, index) => (
                        <div
                          key={filter.id}
                          className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-3 py-2"
                        >
                          <div className="flex items-center">
                            {index > 0 && (
                              <span className="mr-2 px-2 py-0.5 bg-purple-100 text-[#8e78b7] rounded text-xs font-medium">
                                {targetFilters[activeTargetTable][
                                  index - 1
                                ].logic || "AND"}
                              </span>
                            )}
                            <span className="text-sm">
                              <span className="font-medium">
                                {filter.columnName}
                              </span>{" "}
                              {filter.filterOperator} {filter.value}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                handleEditFilter(activeTargetTable, index)
                              }
                              className="p-1 text-purple-600 hover:text-purple-700 rounded-md"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleRemoveFilter(activeTargetTable, index)
                              }
                              className="p-1 text-red-600 hover:text-red-800 rounded-md"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-medium mb-2 text-gray-600">
                      Query Preview
                    </h4>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md font-mono text-xs text-gray-700">
                      WHERE {generateQueryPreview(activeTargetTable)}
                    </div>
                  </div>
                </div>
              )}

              {!hasFilters(activeTargetTable) && (
                <div className="flex items-center justify-center p-6 bg-gray-50 border border-dashed border-gray-300 rounded-md">
                  <AlertCircle className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-500">
                    No filter conditions added for this target table
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64">
            <Database className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg text-gray-500 font-medium mb-2">
              Select a Target Table
            </h3>
            <p className="text-gray-400 text-center max-w-sm">
              Choose a target table from the dropdown above to configure
              filters for that specific table.
            </p>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex gap-3 justify-end">
          <button
            className="bg-white text-gray-700 border border-gray-300 rounded-md py-2 px-4 text-sm font-medium cursor-pointer transition-colors hover:bg-gray-50"
            onClick={()=>closeDrawer('migration')}
          >
            Cancel
          </button>
          <button
            className="bg-[#8e78b7] text-white border-none rounded-md py-2 px-4 text-sm font-medium cursor-pointer transition-colors hover:bg-[#8e78b7]"
            onClick={handleSave}
          >
            {isEditMode ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddFilter;