// components/TableDrawer.jsx
import { useEffect, useState } from "react";
import { useTableContext } from "../context/TableContext";
import { Drawer } from "@mui/material";
import { Info, Edit2, Trash2 } from "lucide-react";

const TableDrawer = ({ nodes, setNodes }) => {
  const { drawerState, closeDrawer } = useTableContext();
  const [localTable, setLocalTable] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  // Initialize filters state
  const [filterEntries, setFilterEntries] = useState([]);

  const [currentFilter, setCurrentFilter] = useState({
    columnName: "",
    filterOperator: "=",
    value: "",
  });
  const [activeTab, setActiveTab] = useState("filter-tab");
  const [queryMode, setQueryMode] = useState("simple");

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

      // Find the current table's filters in the nodes data
      const currentNode = nodes.find((node) => node.id === drawerState.nodeId);
      const currentTable = currentNode?.data.tables?.find(
        (t) => t.table_name === drawerState.selectedTable.table_name
      );

      // Set filters from the table's existing filters or initialize empty
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
    // Validate that all fields are filled
    if (!currentFilter.columnName || !currentFilter.value) {
      return;
    }

    if (editingIndex !== null) {
      // Update existing filter
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

  const handleSave = () => {
    if (!localTable || !drawerState.nodeId) return;

    const whereConditions = filterEntries.map(
      (entry) => `${entry.columnName} ${entry.filterOperator} ${entry.value}`
    );

    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id === drawerState.nodeId) {
          // Correctly handle undefined tables
          const existingTables = node.data.tables || [];
          const updatedTables = existingTables.map((t) =>
            t.table_name === localTable.table_name
              ? {
                  ...t,
                  filters: filterEntries,
                  whereCondition: whereConditions.join(" AND "),
                }
              : t
          );

          // If the table wasn't found, add it (in case tables were empty)
          if (
            !existingTables.some((t) => t.table_name === localTable.table_name)
          ) {
            updatedTables.push({
              ...localTable,
              filters: filterEntries,
              whereCondition: whereConditions.join(" AND "),
            });
          }

          return {
            ...node,
            data: {
              ...node.data,
              tables: updatedTables,
            },
          };
        }
        return node;
      })
    );

    closeDrawer();
  };

  if (!drawerState.isOpen) return null;

  // -------------------------------Update Drawer for Purge[includes both Add_condition/Drop_Partitoin]-------------------------------------------

  const switchTab = (tabId) => {
    setActiveTab(tabId);
  };

  const switchQueryMode = (mode) => {
    setQueryMode(mode);
  };

  const addCondition = () => {
    console.log("Add condition");
  };

  const headers = [
    "Partition Name",
    "Column Name",
    "High Value",
    "Partition Type",
    "Table Name",
    "Select",
  ];

  const sampleData = [
    {
      partition_name: "P1",
      column_name: "DateChefDate",
      high_value: "2024-01-01",
      partition_type: "RANGE",
      table_name: "RECIPETABLE_001",
    },
    {
      partition_name: "P2",
      column_name: "DateChefDate",
      high_value: "2024-04-01",
      partition_type: "RANGE",
      table_name: "RECIPETABLE_001",
    },
    {
      partition_name: "P3",
      column_name: "DateChefDate",
      high_value: "2024-07-01",
      partition_type: "RANGE",
      table_name: "RECIPETABLE_001",
    },
    {
      partition_name: "P4",
      column_name: "DateChefDate",
      high_value: "2024-10-01",
      partition_type: "RANGE",
      table_name: "RECIPETABLE_001",
    },
    {
      partition_name: "P5",
      column_name: "DateChefDate",
      high_value: "2025-01-01",
      partition_type: "RANGE",
      table_name: "RECIPETABLE_001",
    },
  ];

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
          {localTable?.table_name || ""}
        </div>
      </header>

      <div className="flex border-b border-gray-200">
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
      </div>

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
              className="w-full p-3 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Select a column</option>
              <option value="id">ID</option>
              <option value="name">Name</option>
              <option value="date">Date</option>
              <option value="status">Status</option>
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
              className="w-full p-3 border border-gray-300 rounded-md text-sm"
            >
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
              placeholder="Enter value"
              className="w-full p-3 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div className="mt-4">
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
          </div>

          <button
            className="bg-[#8e78b7] text-white border-none rounded-md py-3 px-6 text-sm font-medium cursor-pointer transition-colors hover:bg-[#8e78b7] mt-4"
            onClick={addCondition}
          >
            Add Condition
          </button>

          <div className="mt-5 p-4 bg-gray-50 rounded-md border border-gray-200">
            <h3 className="mt-0 mb-3 text-base font-medium">Query Preview</h3>
            <div className="flex flex-wrap">
              <div className="inline-flex items-center bg-purple-50 rounded px-2.5 py-1.5 mr-2 mb-2 text-sm">
                status = 'active'{" "}
                <span className="ml-2 cursor-pointer text-[#8e78b7] font-bold">
                  ×
                </span>
              </div>
              <div className="inline-flex items-center bg-purple-50 rounded px-2.5 py-1.5 mr-2 mb-2 text-sm">
                date &gt; '2023-01-01'{" "}
                <span className="ml-2 cursor-pointer text-[#8e78b7] font-bold">
                  ×
                </span>
              </div>
            </div>
            <pre className="m-0 whitespace-pre-wrap font-mono text-sm">
              WHERE status = 'active' AND date &gt; '2023-01-01'
            </pre>
          </div>
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
              className="w-full p-3 border border-gray-300 rounded-md text-sm"
            ></textarea>
          </div>

          <div className="mt-5 p-4 bg-gray-50 rounded-md border border-gray-200">
            <h3 className="mt-0 mb-3 text-base font-medium">Query Preview</h3>
            <pre className="m-0 whitespace-pre-wrap font-mono text-sm">
              WHERE status = 'active' AND (date &gt; '2023-01-01' OR priority =
              'high')
            </pre>
          </div>
        </div>

        <div className="flex justify-end mt-6 gap-3">
          <button className="bg-gray-100 text-gray-800 border border-gray-300 rounded-md py-3 px-6 text-sm font-medium cursor-pointer transition-colors hover:bg-gray-200">
            Cancel
          </button>
          <button className="bg-[#8e78b7] text-white border-none rounded-md py-3 px-6 text-sm font-medium cursor-pointer transition-colors hover:bg-[#8e78b7]">
            Save
          </button>
        </div>
      </div>

      <div className={`p-6 ${activeTab !== "partition-tab" ? "hidden" : ""}`}>
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
              {sampleData.map((item, index) => (
                <tr
                  key={index}
                  className={
                    index === 0 ? "bg-[#daf5ce]" : "bg-gray-100 opacity-50"
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
                      disabled={index !== 0}
                      checked={index === 0}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-6 gap-3">
          <button className="bg-gray-100 text-gray-800 border border-gray-300 rounded-md py-3 px-6 text-sm font-medium cursor-pointer transition-colors hover:bg-gray-200">
            Cancel
          </button>
          <button className="bg-[#8e78b7] text-white border-none rounded-md py-3 px-6 text-sm font-medium cursor-pointer transition-colors hover:bg-[#8e78b7]">
            SAVE
          </button>
        </div>
      </div>
    </Drawer>
  );
};

export default TableDrawer;
