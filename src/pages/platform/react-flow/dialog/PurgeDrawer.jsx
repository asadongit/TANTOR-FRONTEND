import { useEffect, useState } from "react";
import { useTableContext } from "../context/TableContext";
import { Drawer } from "@mui/material";
import { Info, Edit2, Trash2, CloudCog } from "lucide-react";
import { useStateContext } from "../context/ContextProvider";
import { usePurgeContext } from "../context/PurgeContext";
import toast from "react-hot-toast";

const PurgeDrawer = ({ nodes, setNodes }) => {
  const { drawerState, closeDrawer } = useTableContext();
  const [localTable, setLocalTable] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [selectedRows, setSelectedRows] = useState([0]);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [value, setValue] = useState("");
  const [isQueryPreview, setIsQueryPreview] = useState(false);
  const [complexQuery, setComplexQuery] = useState("");
  const [isComplexQueryPreview, setIsComplexQueryPreview] = useState(false);
  const {
    purgeNode,
    firstSourcePartitionName,
    sourceSelectedTable,
    sourceBulkSelectedObjects,
    selectedScope,
    sourceConnectionName,
    targetConnectionName
  } = useStateContext("");
  const { saveDropPartitions, saveBulkFiltersAndPartitions, saveFilter, bulkFiltersAndPartitions, filters, dropPartitions } =
    usePurgeContext("");

  const checkSourceBulkFiltersAndPartitions = () => {
    const filteredTargetTableMatches = sourceBulkSelectedObjects.filter((table) => table?.target_table === localTable?.table_name)

    const filteredTableMatchesCurrSelectedTable = Array.isArray(bulkFiltersAndPartitions?.source) 
      ? bulkFiltersAndPartitions?.source.find((ele) => ele.source_table === filteredTargetTableMatches[0]?.source_table)
      : {};    

    const ifFoundFilteredTableMatchesCurrSelectedTable = (filteredTableMatchesCurrSelectedTable?.source_partition 
      && Object.keys(filteredTableMatchesCurrSelectedTable?.source_partition).length > 0) 
      || (filteredTableMatchesCurrSelectedTable?.whereCondition 
      && Object.keys(filteredTableMatchesCurrSelectedTable?.whereCondition).length > 0)
    

    return ifFoundFilteredTableMatchesCurrSelectedTable;
  }

  const hasSourceBulkFiltersAndPartitions = checkSourceBulkFiltersAndPartitions();
  
  const selectedSourceTable = sourceBulkSelectedObjects.find(obj =>
    obj.target_table === drawerState?.selectedTable?.table_name);

  const hasWhereCondition = bulkFiltersAndPartitions?.source?.some(item =>
    item.source_table === selectedSourceTable?.source_table &&
    item.whereCondition != null
  );
  
  const hasSubsetWhereCondition = filters?.source?.isComplex === true ||
  (filters?.source?.details && Object.keys(filters.source.details).length > 0);
  
  const selectedNode = purgeNode;
  const [filterEntries, setFilterEntries] = useState([]);
  const [currentFilter, setCurrentFilter] = useState({
    columnName: "",
    filterOperator: "=",
    value: "",
  });
  const [activeTab, setActiveTab] = useState("filter-tab");
  const [queryMode, setQueryMode] = useState("simple");
  const [tableSort, setTableSort] = useState([]);
  const [partitionMismatch, setPartitionMismatch] = useState(false);

  useEffect(() => {
    if (!drawerState.isOpen) {
      setEditingIndex(null);
      setCurrentFilter({
        columnName: "",
        filterOperator: "=",
        value: "",
      });
    }
  }, [drawerState.isOpen]);

  useEffect(() => {
    if (drawerState.isOpen && drawerState.selectedTable) {
      setLocalTable(drawerState.selectedTable);

      const currentNode = nodes.find((node) => node.id === drawerState.nodeId);
      const currentTable = currentNode?.data.tables?.find(
        (t) => t.table_name === drawerState.selectedTable.table_name
      );

      const existingFilters = currentTable?.filters || [];
      setFilterEntries(
        existingFilters.map((filter) => ({
          ...filter,
          id: filter.id || Date.now() + Math.random(), // Ensure unique ID
        }))
      );
    }
  }, [
    drawerState.isOpen,
    drawerState.selectedTable,
    drawerState.nodeId,
    nodes,
  ]);

  const handleAddFilter = () => {
    if (!currentFilter.columnName || !currentFilter.value) {
      return;
    }

    if (editingIndex !== null) {
      const updatedFilters = [...filterEntries];
      updatedFilters[editingIndex] = {
        ...currentFilter,
        id: filterEntries[editingIndex].id,
      };
      setFilterEntries(updatedFilters);
      setEditingIndex(null);
    } else {
      // Add new filter with unique ID
      setFilterEntries([
        ...filterEntries,
        {
          ...currentFilter,
          id: Date.now() + Math.random(),
        },
      ]);
    }

    // Reset current filter
    setCurrentFilter({
      columnName: "",
      filterOperator: "=",
      value: "",
    });
  };

  const handleEditFilter = (index) => {
    setCurrentFilter({
      columnName: filterEntries[index].columnName,
      filterOperator: filterEntries[index].filterOperator,
      value: filterEntries[index].value,
    });
    setEditingIndex(index);
  };

  const handleRemoveFilter = (index) => {
    setFilterEntries(filterEntries.filter((_, i) => i !== index));
  };

  const handleSubsetSave = () => {
    const nodeKey = purgeNode === "Source Node" ? "source" : "target";
    if (activeTab === "filter-tab") {
      if (queryMode === "simple") {
        const filterDetails = {
          columnName: selectedColumn,
          filter: filterBy[selectedFilter],
          value: value,
        };

        saveFilter(nodeKey, false, filterDetails)
      } else {
        const filterDetails = complexQuery
        saveFilter(nodeKey, true, filterDetails);
      }
      saveDropPartitions(nodeKey) //clear drop data when filter is saved
      toast.success("Filter added successfully!")

    } else if (activeTab === "partition-tab") {
      if (purgeNode === "Source Node" && hasPartitions) {
        const partition = sortedCurrentPartitions[0];

        saveDropPartitions(
          nodeKey,
          partition
        )
      } else if (purgeNode === "Target node" && hasPartitions && dropPartitions.source.partition_name) {
        const partition = sortedCurrentPartitions[0];

        saveDropPartitions(
          nodeKey,
          partition
        )
      }
      saveFilter(nodeKey);
      toast.success("Drop Partition added successfully!")
    }

    setSelectedColumn("");
    setSelectedFilter("");
    setValue("");
    setIsQueryPreview(false);
    setComplexQuery("");
    setIsComplexQueryPreview(false);
    closeDrawer();
  };

  const handleBulkSave = () => {
    const nodeKey = purgeNode === "Source Node" ? "source" : "target";
    if (nodeKey === "source" && activeTab === "filter-tab") {
      //TODO: Handle bulk source table filter where clause
      let filterDetails;
      if (queryMode === "simple") {
        filterDetails = {
          columnName: selectedColumn,
          filter: filterBy[selectedFilter],
          value: value,
        };
      } else {
        filterDetails = complexQuery
      }
      saveBulkFiltersAndPartitions(nodeKey, localTable?.source_table, null, null, filterDetails)
      toast.success("Filter added successfully!")

    } else if (activeTab === "partition-tab") {
      if (purgeNode === "Source Node" && hasPartitions) {
        const partition = sortedCurrentPartitions[0];
        console.log("PARTITION ==>> ", partition);

        // const partitionData = {
        //   partition_name: partition?.partition_name,
        //   column_name: partition?.column_name,
        //   high_value: partition?.high_value,
        //   partition_type: partition?.partition_type,
        //   table_name: partition?.table_name
        // }
        saveBulkFiltersAndPartitions(nodeKey, localTable?.source_table, null, partition, null)

      } else if (purgeNode === "Target node" && hasPartitions) {
        const targetTable = localTable?.table_name || localTable?.source_table;

        const matchTargetTable = sourceBulkSelectedObjects.find((table_obj) => table_obj.target_table === targetTable);
        const sourceTable = matchTargetTable ? matchTargetTable?.source_table : null;
        
        const partition = sortedCurrentPartitions[0];
        const partitionData = {
          partition_name: partition?.partition_name,
          column_name: partition?.column_name,
          high_value: partition?.high_value,
          partition_type: partition?.partition_type,
          table_name: partition?.table_name
        }
        saveBulkFiltersAndPartitions(nodeKey, sourceTable, targetTable, partitionData, null);
      }
      toast.success("Drop Partition added successfully!");
    }

    setSelectedColumn("");
    setSelectedFilter("");
    setValue("");
    setIsQueryPreview(false);
    setComplexQuery("");
    setIsComplexQueryPreview(false);
    closeDrawer();
  }

  const handleSave = () => {
    if(selectedScope === "bulk") {
      handleBulkSave();
    } else if(selectedScope === "subset") {
      handleSubsetSave();
    }
  };

  const metadataExist = typeof drawerState?.selectedTable != "string" && selectedNode === "Target node" && selectedScope === "bulk"

  const partitionData =
    drawerState.selectedTable?.metadatas?.partition_json ||
    drawerState.selectedTable?.partition_json ||
    [];
  
  const currentPartitions = Array.isArray(partitionData) ? partitionData : [];
  const hasPartitions = currentPartitions.length > 0;

  const sortedCurrentPartitions = [...currentPartitions].sort(
    (a, b) => a.partition_id - b.partition_id
  );

  const isMSSQLConnection = purgeNode === "Source Node"
    ? sourceConnectionName.toLowerCase().includes("mssql")
    : targetConnectionName.toLowerCase().includes("mssql")

  const sourceHasPartitions =
  Array.isArray(sourceSelectedTable?.partition_json) && sourceSelectedTable.partition_json.length > 0 ||
  (sourceSelectedTable?.metadatas?.partition_json && Object.keys(sourceSelectedTable.metadatas.partition_json).length > 0);
  
  const currMatchSourceTable = sourceBulkSelectedObjects.find((table) => table.target_table === localTable?.table_name);
  const sourceBulkHasPartitions = (currMatchSourceTable?.metadatas?.partition_json && Object.keys(currMatchSourceTable.metadatas.partition_json).length > 0)
  
  useEffect(() => {
    const sorted = selectedNode === "Target node" ? currentPartitions : sortedCurrentPartitions;
    setTableSort(sorted);

    if (
      selectedNode === "Target node" &&
      hasPartitions &&
      firstSourcePartitionName
    ) {
      const matchingIndex = currentPartitions.findIndex((partition) => {
        return (
          partition.partition_name?.trim().toLowerCase() ===
          firstSourcePartitionName?.trim().toLowerCase()
        );
      });
      setSelectedRows(matchingIndex !== -1 ? [matchingIndex] : []);
      setPartitionMismatch(matchingIndex === -1);
    }
  }, [drawerState?.selectedTable, selectedNode]);

  if (!drawerState.isOpen) return null;

  // -------------------------------Update Drawer for Purge[includes both Add_condition/Drop_Partitoin]-------------------------------------------

  const switchTab = (tabId) => {
    setActiveTab(tabId);
  };

  const switchQueryMode = (mode) => {
    setQueryMode(mode);
  };

  const headers = [
    "Partition Name",
    "Column Name",
    "High Value",
    "Partition Type",
    "Table Name",
    "Select",
  ];

  const filterBy = {
    eq: "=",
    neq: "!=",
    gt: ">",
    lt: "<",
    gte: "≥",
    lte: "≤",
    like: "LIKE",
    in: "IN",
  };

  const handleQueryPreview = () => {
    setIsQueryPreview(true);
  };

  const handleComplexQueryPreview = () => {
    setIsComplexQueryPreview(true);
  };

  const handleCancel = () => {
    setSelectedColumn("");
    setSelectedFilter("");
    setValue("");
    setIsQueryPreview(false);
    setComplexQuery("");
    setIsComplexQueryPreview(false);
    closeDrawer();
  };

  return (
    // <Drawer anchor="right" open={drawerState.isOpen} onClose={closeDrawer}>
    //   <div className="w-[400px] p-4">
    //     <h3 className="text-lg font-semibold mb-4">
    //       Bulk Edit - {localTable?.table_name || ""}
    //     </h3>

    //     {localTable ? (
    //       <div className="space-y-4">
    //         {/* Filter Input Form */}
    //         <div className="p-4 border rounded-lg space-y-4 bg-gray-50">
    //           <div className="space-y-2">
    //             <label className="block text-sm font-medium text-gray-700">
    //               Column Name
    //             </label>
    //             <select
    //               value={currentFilter.columnName}
    //               onChange={(e) => setCurrentFilter({...currentFilter, columnName: e.target.value})}
    //               className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    //             >
    //               <option value="">Select</option>
    //               {localTable?.column_json?.map((column, index) => (
    //                 <option key={index} value={column.column_name}>
    //                   {column.column_name}
    //                 </option>
    //               ))}
    //             </select>
    //           </div>

    //           <div className="space-y-2">
    //             <label className="block text-sm font-medium text-gray-700">
    //               Filter by
    //             </label>
    //             <select
    //               value={currentFilter.filterOperator}
    //               onChange={(e) => setCurrentFilter({...currentFilter, filterOperator: e.target.value})}
    //               className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    //             >
    //               <option value="=">= Equal to</option>
    //               <option value=">">Value Greater Than</option>
    //               <option value="<">Value Less Than</option>
    //               <option value="!=">≠ Not Equal to</option>
    //             </select>
    //           </div>

    //           <div className="space-y-2">
    //             <label className="block text-sm font-medium text-gray-700">
    //               Value
    //             </label>
    //             <input
    //               type="text"
    //               value={currentFilter.value}
    //               onChange={(e) => setCurrentFilter({...currentFilter, value: e.target.value})}
    //               className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    //             />
    //           </div>

    //           <button
    //             onClick={handleAddFilter}
    //             className="w-full bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
    //           >
    //             {editingIndex !== null ? 'Update Filter' : 'Add Filter'}
    //           </button>
    //         </div>

    //         {/* Filter Entries List */}
    //         {filterEntries.length > 0 && (
    //           <div className="space-y-2">
    //             <h4 className="text-sm font-medium text-gray-700">Applied Filters</h4>
    //             <div className="space-y-2">
    //               {filterEntries.map((filter, index) => (
    //                 <div key={filter.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
    //                   <span className="text-sm">
    //                     {filter.columnName} {filter.filterOperator} {filter.value}
    //                   </span>
    //                   <div className="flex gap-2">
    //                     <button
    //                       onClick={() => handleEditFilter(index)}
    //                       className="text-gray-400 hover:text-gray-600"
    //                     >
    //                       <Edit2 className="w-4 h-4" />
    //                     </button>
    //                     <button
    //                       onClick={() => handleRemoveFilter(index)}
    //                       className="text-gray-400 hover:text-gray-600"
    //                     >
    //                       <Trash2 className="w-4 h-4" />
    //                     </button>
    //                   </div>
    //                 </div>
    //               ))}
    //             </div>
    //           </div>
    //         )}

    //         <button
    //           onClick={handleSave}
    //           className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-[#8e78b7] transition-colors"
    //         >
    //           Save Changes
    //         </button>
    //       </div>
    //     ) : (
    //       <div className="text-gray-500">Loading table details...</div>
    //     )}
    //   </div>
    // </Drawer>
    <Drawer anchor="right" open={drawerState.isOpen} onClose={closeDrawer}>
      <header className="p-5 border-b border-gray-200">
        <h1 className="m-0 text-xl font-semibold">Edit Table</h1>
        <div className="text-gray-500 text-sm mt-1">
          {localTable?.table_name || localTable?.source_table || localTable || ""}
        </div>
      </header>

      <div className="flex border-b border-gray-200">
        {(selectedScope === "bulk" || selectedScope === "subset") && purgeNode == "Target node" ? (
          <>
           {activeTab !== "partition-tab" && switchTab("partition-tab")}
            <div
              className={`py-4 px-6 text-sm font-medium cursor-pointer relative ${
                activeTab === "partition-tab" ? "text-[#8e78b7]" : ""
              }`}
              onClick={() => switchTab("partition-tab")}
            >
              Drop Partition
              {activeTab === "partition-tab" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8e78b7]"></div>
              )}
            </div>
          </>
        ) : (
          <>
            <div
              className={`py-4 px-6 text-sm font-medium cursor-pointer relative ${
                activeTab === "filter-tab" ? "text-[#8e78b7]" : ""
              }`}
              onClick={() => switchTab("filter-tab")}
            >
              Add Filter
              {activeTab === "filter-tab" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8e78b7]"></div>
              )}
            </div>
            <div
              className={`py-4 px-6 text-sm font-medium cursor-pointer relative ${
                activeTab === "partition-tab" ? "text-[#8e78b7]" : ""
              }`}
              onClick={() => switchTab("partition-tab")}
            >
              Drop Partition
              {activeTab === "partition-tab" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8e78b7]"></div>
              )}
            </div>
          </>
        )}
      </div>

      {!(purgeNode === "Target node" && (selectedScope === "bulk" || selectedScope === "subset")) && (
      <div className={`p-6 ${activeTab !== "filter-tab" ? "hidden" : ""}`}>
        <div className="flex bg-gray-100 rounded-md overflow-hidden mb-5">
          <div
            className={`flex-1 text-center py-3 px-3 cursor-pointer text-sm font-medium transition-colors ${
              queryMode === "simple" ? "bg-[#8e78b7] text-white" : ""
            }`}
            onClick={() => switchQueryMode("simple")}
          >
            Regular Filter
          </div>
          <div
            className={`flex-1 text-center py-3 px-3 cursor-pointer text-sm font-medium transition-colors ${
              queryMode === "advanced" ? "bg-[#8e78b7] text-white" : ""
            }`}
            onClick={() => switchQueryMode("advanced")}
          >
            Complex Query
          </div>
        </div>

        <div className={queryMode !== "simple" ? "hidden" : ""}>
          <div className="mb-4">
            <label htmlFor="column" className="block mb-2 text-sm font-medium">
              Column Name
            </label>
            <select
              id="column"
              value={selectedColumn}
              onChange={(e) => {
                const columnName = e.target.value;
                setSelectedColumn(columnName);
              }}
              className="w-full p-3 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Select a column</option>
              {(
                drawerState.selectedTable?.column_json ||
                drawerState.selectedTable?.metadatas?.column_json ||
                []
              ).map((column, idx) => (
                <option key={idx} value={column.column_name}>
                  {column.column_name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label
              htmlFor="operator"
              className="block mb-2 text-sm font-medium"
            >
              Filter by
            </label>
            <select
              id="operator"
              value={selectedFilter}
              onChange={(e) => {
                const filter = e.target.value;
                setSelectedFilter(filter);
              }}
              className="w-full p-3 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Select filter</option>
              <option value="eq">= Equal to</option>
              <option value="neq">!= Not equal to</option>
              <option value="gt">&gt; Greater than</option>
              <option value="lt">&lt; Less than</option>
              <option value="gte">≥ Greater than or equal to</option>
              <option value="lte">≤ Less than or equal to</option>
              <option value="like">LIKE</option>
              <option value="in">IN</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="value" className="block mb-2 text-sm font-medium">
              Value
            </label>
            <input
              type="text"
              id="value"
              value={value}
              onChange={(e) => {
                const val = e.target.value;
                setValue(val);
              }}
              placeholder="Enter value"
              className="w-full p-3 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* <div className="mt-4">
            <label className="inline-block mr-3">
              <input
                type="radio"
                name="logic"
                value="and"
                defaultChecked
                className="mr-1"
              />{" "}
              AND
            </label>
            <label className="inline-block">
              <input type="radio" name="logic" value="or" className="mr-1" /> OR
            </label>
          </div> */}

          <button
            className="bg-[#8e78b7] text-white border-none rounded-md py-3 px-6 text-sm font-medium cursor-pointer transition-colors hover:bg-[#8e78b7] mt-4"
            onClick={handleQueryPreview}
          >
            Add Condition
          </button>

          {isQueryPreview && (
            <div className="mt-5 p-4 bg-gray-50 rounded-md border border-gray-200">
              <h3 className="mt-0 mb-3 text-base font-medium">Query Preview</h3>
              <div className="flex flex-wrap">
                <div className="inline-flex items-center bg-purple-50 rounded px-2.5 py-1.5 mr-2 mb-2 text-sm">
                  Column Name = {selectedColumn}
                  <span className="ml-2 cursor-pointer text-[#8e78b7] font-bold">
                    ×
                  </span>
                </div>
                <div className="inline-flex items-center bg-purple-50 rounded px-2.5 py-1.5 mr-2 mb-2 text-sm">
                  {selectedColumn} {filterBy[selectedFilter]} {value}
                  <span className="ml-2 cursor-pointer text-[#8e78b7] font-bold">
                    ×
                  </span>
                </div>
              </div>
              <pre className="m-0 px-2.5 whitespace-pre-wrap font-mono text-sm">
                WHERE {selectedColumn} {filterBy[selectedFilter]} {value}
              </pre>
            </div>
          )}
        </div>

        <div className={queryMode !== "advanced" ? "hidden" : ""}>
          <div className="mb-4">
            <label
              htmlFor="complex-query"
              className="block mb-2 text-sm font-medium"
            >
              WHERE Clause
            </label>
            <textarea
              id="complex-query"
              rows="6"
              placeholder="Enter a complex WHERE clause starting with the 'WHERE' keyword"
              value={complexQuery}
              onChange={(e) => {
                const query = e.target.value;
                setComplexQuery(query);
              }}
              className="w-full p-3 border border-gray-300 rounded-md text-sm"
            ></textarea>
          </div>

          <button
            className="bg-[#8e78b7] text-white border-none rounded-md py-3 px-6 text-sm font-medium cursor-pointer transition-colors hover:bg-[#8e78b7] mt-4"
            onClick={handleComplexQueryPreview}
          >
            Add Condition
          </button>

          {isComplexQueryPreview && (
            <div className="mt-5 p-4 bg-gray-50 rounded-md border border-gray-200">
              <h3 className="mt-0 mb-3 text-base font-medium">Query Preview</h3>
              <pre className="m-0 whitespace-pre-wrap font-mono text-sm">
                {complexQuery}
              </pre>
            </div>
          )}
        </div>

        {(isComplexQueryPreview || isQueryPreview) && (
          <div className="flex justify-end mt-6 gap-3">
            <button
              onClick={handleCancel}
              className="bg-gray-100 text-gray-800 border border-gray-300 rounded-md py-3 px-6 text-sm font-medium cursor-pointer transition-colors hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-[#8e78b7] text-white border-none rounded-md py-3 px-6 text-sm font-medium cursor-pointer transition-colors hover:bg-[#8e78b7]"
            >
              Save
            </button>
          </div>
        )}
      </div> )}

      {isMSSQLConnection && (
        <div className={`p-6 ${activeTab !== "partition-tab" ? "hidden" : ""}`}>
          <div className="flex items-start mt-1 bg-blue-50 border-l-3 border-blue-500 p-3 rounded mb-5 text-sm">
            <Info className="mr-3 text-blue-500 text-xl h-6 w-6 font-extrabold stroke-2" />
            <div>
              <strong>MSSQL doesn't support drop partitions!</strong>
            </div>
          </div>
        </div>
      )}

      {!metadataExist && selectedNode === "Target node" && selectedScope === "bulk" && (
        <div className={`p-6 ${activeTab !== "partition-tab" ? "hidden" : ""}`}>
          <div className="flex items-start mt-1 bg-blue-50 border-l-3 border-blue-500 p-3 rounded mb-5 text-sm">
            <Info className="mr-3 text-blue-500 text-xl h-6 w-6 font-extrabold stroke-2" />
            <div>
              <strong>Metadata doesn't exist for this database!</strong>
            </div>
          </div>
        </div> )
      }

      {!hasSourceBulkFiltersAndPartitions && metadataExist && selectedNode === "Target node" && selectedScope === "bulk" && (
        <div className={`p-6 ${activeTab !== "partition-tab" ? "hidden" : ""}`}>
          <div className="flex items-start mt-1 bg-blue-50 border-l-3 border-blue-500 p-3 rounded mb-5 text-sm">
            <Info className="mr-3 text-blue-500 text-xl h-6 w-6 font-extrabold stroke-2" />
            <div>
              <strong>No filters or drop partitions has been added for source table!</strong>
            </div>
          </div>
        </div>
      )}

      {(hasWhereCondition === true || hasSubsetWhereCondition === true) && selectedNode === "Target node" && (
        <div className={`p-6 ${activeTab !== "partition-tab" ? "hidden" : ""}`}>
        <div className="flex items-start mt-1 bg-blue-50 border-l-3 border-blue-500 p-3 rounded mb-5 text-sm">
          <Info className="mr-3 text-blue-500 text-xl h-6 w-6 font-extrabold stroke-2" />
          <div>
            <strong>In Source Table, where condition has been selected.</strong>
          </div>
        </div>
      </div>
      )}

      {selectedNode === "Source Node" && !isMSSQLConnection && (
          <>
            {!hasPartitions && (
              <div
                className={`p-6 ${
                  activeTab !== "partition-tab" ? "hidden" : ""
                }`}
              >
                <div className="flex items-start mt-1 bg-blue-50 border-l-3 border-blue-500 p-3 rounded mb-5 text-sm">
                  <Info className="mr-3 text-blue-500 text-xl h-6 w-6 font-extrabold stroke-2" />
                  <div>
                    <strong>
                      Partition for source database doesn't exist.
                    </strong>
                  </div>
                </div>
              </div>
            )}
            {hasPartitions && (
              <div
                className={`p-6 ${
                  activeTab !== "partition-tab" ? "hidden" : ""
                }`}
              >
                <div className="flex items-start bg-blue-50 border-l-3 border-blue-500 p-3 rounded mb-5 text-sm">
                  <Info className="mr-3 text-blue-500 text-xl h-6 w-6 font-extrabold stroke-2" />

                  <div>
                    <strong>
                      Sequential Partition Drop is enforced for this database.
                    </strong>{" "}
                    The first available partition is auto-selected.
                  </div>
                </div>

                <div className="w-full overflow-x-auto shadow rounded-lg">
                  <table className="w-full bg-white">
                    <thead>
                      <tr className="bg-gray-800 text-white">
                        {headers.map((header) => (
                          <th key={header} className="py-3 px-4 text-center">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableSort.map((item, index) => (
                        <tr
                          key={index}
                          className={
                            index === 0 || selectedRows.includes(index)
                              ? "bg-[#daf5ce]"
                              : "bg-gray-100 opacity-50"
                          }
                        >
                          <td className="border border-gray-200 p-3 text-center">
                            {item.partition_name}
                          </td>
                          <td className="border border-gray-200 p-3 text-center">
                            {item.column_name}
                          </td>
                          <td className="border border-gray-200 p-3 text-center">
                            {item.high_value}
                          </td>
                          <td className="border border-gray-200 p-3 text-center">
                            {item.partition_type}
                          </td>
                          <td className="border border-gray-200 p-3 text-center">
                            {item.table_name}
                          </td>
                          <td className="border border-gray-200 p-3 text-center">
                            <input
                              type="checkbox"
                              checked={
                                index === 0 || selectedRows.includes(index)
                              }
                              readOnly
                              //onChange={() => handleCheckboxChange(index)}
                              //disabled={index !== 0}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end mt-6 gap-3">
                  <button
                    onClick={() => {
                      handleCancel();
                    }}
                    className="bg-gray-100 text-gray-800 border border-gray-300 rounded-md py-3 px-6 text-sm font-medium cursor-pointer transition-colors hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-[#8e78b7] text-white border-none rounded-md py-3 px-6 text-sm font-medium cursor-pointer transition-colors hover:bg-[#8e78b7]"
                  >
                    SAVE
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      {selectedNode === "Target node" && !isMSSQLConnection 
        && (selectedScope === "bulk" 
          ? (hasWhereCondition === false && metadataExist && hasSourceBulkFiltersAndPartitions) 
          : !hasSubsetWhereCondition )
        && (
        //&& (selectedScope === "subset" || selectedScope === "bulk") && (
          <>
            <div
              className={`p-6 ${activeTab !== "partition-tab" ? "hidden" : ""}`}
            >
              {(selectedScope === "subset" ? !sourceHasPartitions : !sourceBulkHasPartitions) && hasPartitions && (
                <div className="flex items-start mt-1 bg-blue-50 border-l-3 border-blue-500 p-3 rounded mb-5 text-sm">
                  <Info className="mr-3 text-blue-500 text-xl h-6 w-6 font-extrabold stroke-2" />
                  <div>
                    <strong>
                      Partition for this database doesn't exist in source table!
                    </strong>
                  </div>
                </div>
              )}

              {(selectedScope === "subset" ? sourceHasPartitions : sourceBulkHasPartitions) && !hasPartitions && (
                <div className="flex items-start mt-1 bg-blue-50 border-l-3 border-blue-500 p-3 rounded mb-5 text-sm">
                  <Info className="mr-3 text-blue-500 text-xl h-6 w-6 font-extrabold stroke-2" />
                  <div>
                    <strong>
                      Partition for target database doesn't exist!
                    </strong>
                  </div>
                </div>
              )}

              {(selectedScope === "subset" ? !sourceHasPartitions : !sourceBulkHasPartitions) && !hasPartitions && (
                <div className="flex items-start mt-1 bg-blue-50 border-l-3 border-blue-500 p-3 rounded mb-5 text-sm">
                  <Info className="mr-3 text-blue-500 text-xl h-6 w-6 font-extrabold stroke-2" />
                  <div>
                    <strong>
                      Partition doesn't exist for both source and target
                      database!
                    </strong>
                  </div>
                </div>
              )}

              {(selectedScope === "subset" ? sourceHasPartitions : sourceBulkHasPartitions) && hasPartitions && !partitionMismatch && (
                <div
                  className={`p-6 ${
                    activeTab !== "partition-tab" ? "hidden" : ""
                  }`}
                >
                  <div className="flex items-start bg-blue-50 border-l-3 border-blue-500 p-3 rounded mb-5 text-sm">
                    <Info className="mr-3 text-blue-500 text-xl h-6 w-6 font-extrabold stroke-2" />

                    <div>
                      <strong>
                        Sequential Partition Drop is enforced for this database.
                      </strong>{" "}
                      The first available partition is auto-selected.
                    </div>
                  </div>

                  <div className="w-full overflow-x-auto shadow rounded-lg">
                    <table className="w-full bg-white">
                      <thead>
                        <tr className="bg-gray-800 text-white">
                          {headers.map((header) => (
                            <th key={header} className="py-3 px-4 text-center">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableSort.map((item, index) => (
                          <tr
                            key={index}
                            className={
                              //index === 0 ||
                              selectedRows.includes(index)
                                ? "bg-[#daf5ce]"
                                : "bg-gray-100 opacity-50"
                            }
                          >
                            <td className="border border-gray-200 p-3 text-center">
                              {item.partition_name}
                            </td>
                            <td className="border border-gray-200 p-3 text-center">
                              {item.column_name}
                            </td>
                            <td className="border border-gray-200 p-3 text-center">
                              {item.high_value}
                            </td>
                            <td className="border border-gray-200 p-3 text-center">
                              {item.partition_type}
                            </td>
                            <td className="border border-gray-200 p-3 text-center">
                              {item.table_name}
                            </td>
                            <td className="border border-gray-200 p-3 text-center">
                              <input
                                type="checkbox"
                                checked={selectedRows.includes(index)}
                                readOnly
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end mt-6 gap-3">
                    <button
                      onClick={() => {
                        handleCancel();
                      }}
                      className="bg-gray-100 text-gray-800 border border-gray-300 rounded-md py-3 px-6 text-sm font-medium cursor-pointer transition-colors hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="bg-[#8e78b7] text-white border-none rounded-md py-3 px-6 text-sm font-medium cursor-pointer transition-colors hover:bg-[#8e78b7]"
                    >
                      SAVE
                    </button>
                  </div>
                </div>
              )}

              {(selectedScope === "subset" ? sourceHasPartitions : sourceBulkHasPartitions)  && hasPartitions && partitionMismatch && (
                <div className="flex items-start mt-1 bg-blue-50 border-l-3 border-blue-500 p-3 rounded mb-5 text-sm">
                  <Info className="mr-3 text-blue-500 text-xl h-6 w-6 font-extrabold stroke-2" />
                  <div>
                    <strong>
                      Partitions for both source and target do not match!
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
    </Drawer>
  );
};

export default PurgeDrawer;
