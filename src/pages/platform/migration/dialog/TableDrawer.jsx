// components/TableDrawer.jsx
import { useEffect, useState } from "react";
import { useTableContext } from "../context/TableContext";
import { Drawer } from "@mui/material";

const TableDrawer = ({ nodes, setNodes }) => {
  const { drawerState, closeDrawer } = useTableContext();
  const [localTable, setLocalTable] = useState(null);
  const [selectedName, setSelectedName] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [value, setValue] = useState("");

  const [parameterEnabled, setParameterEnabled] = useState(false);

  // Sync local state with context state
  useEffect(() => {
    if (drawerState.isOpen) {
      setLocalTable(drawerState.selectedTable);
    }
  }, [drawerState.isOpen, drawerState.selectedTable]);

  console.log("Drawer State:", drawerState);
  console.log("Local Table:", localTable);

  const handleSave = () => {
    if (!localTable || !drawerState.nodeId) return;
    const whereCondition =
      selectedName && selectedFilter && value
        ? `${selectedName} ${selectedFilter} ${value}`
        : "";

    // console.log("whereCondition:", whereCondition);

    setNodes(
      nodes.map((node) => {
        if (node.id === drawerState.nodeId) {
          const updatedTables =
            node.data.tables?.map((t) =>
              t.table_name === localTable.table_name
                ? {
                    ...t,
                    whereCondition,
                  }
                : t
            ) || [];

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

  return (
    <Drawer anchor="right" open={drawerState.isOpen} onClose={closeDrawer}>
      {/* {localTable ? ( */}
      <div className="w-[400px] p-4">
        <h3 className="text-lg font-semibold mb-4">
          Bulk Edit - {localTable?.table_name || ""}
        </h3>

        {localTable ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Column Name
              </label>
              <div className="relative">
                <select
                  value={selectedName}
                  onChange={(e) => setSelectedName(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  {localTable?.column_json?.map((column, index) => (
                    <option key={index} value={column.column_name}>
                      {column.column_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Type
                </label>
                <input
                  type="text"
                  placeholder="Type"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Wildcard
                </label>
                <input
                  type="text"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div> */}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Filter by
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="=">= Equal to</option>
                  <option value=">">Value Greater Than</option>
                  <option value="<">Value Less Than</option>
                  <option value="!=">≠ Not Equal to</option>
                </select>
                <button className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Value
              </label>
              <input
                type="text"
                onChange={(e) => setValue(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Parameter
              </label>
              <button
                role="switch"
                aria-checked={parameterEnabled}
                onClick={() => setParameterEnabled(!parameterEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  parameterEnabled ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    parameterEnabled ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        ) : (
          <div className="text-gray-500">Loading table details...</div>
        )}
      </div>
    </Drawer>
  );
};
export default TableDrawer;
