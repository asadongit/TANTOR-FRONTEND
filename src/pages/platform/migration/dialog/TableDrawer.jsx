// components/TableDrawer.jsx
import { useEffect, useState } from "react";
import { useTableContext } from "../context/TableContext";
import { Drawer } from "@mui/material";
import { Edit2, Trash2 } from "lucide-react";

const TableDrawer = ({ nodes, setNodes }) => {
  const { drawerState, closeDrawer } = useTableContext();
  const [localTable, setLocalTable] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  
  // Initialize filters state
  const [filterEntries, setFilterEntries] = useState([]);
  
  const [currentFilter, setCurrentFilter] = useState({
    columnName: '',
    filterOperator: '=',
    value: ''
  });


  useEffect(() => {
    if (!drawerState.isOpen) {
      setEditingIndex(null);
      setCurrentFilter({
        columnName: '',
        filterOperator: '=',
        value: ''
      });
    }
  }, [drawerState.isOpen]);


  useEffect(() => {
    if (drawerState.isOpen && drawerState.selectedTable) {
      setLocalTable(drawerState.selectedTable);
      
      // Find the current table's filters in the nodes data
      const currentNode = nodes.find(node => node.id === drawerState.nodeId);
      const currentTable = currentNode?.data.tables?.find(
        t => t.table_name === drawerState.selectedTable.table_name
      );
      
      // Set filters from the table's existing filters or initialize empty
      const existingFilters = currentTable?.filters || [];
      setFilterEntries(existingFilters.map(filter => ({
        ...filter,
        id: filter.id || Date.now() + Math.random() // Ensure unique ID
      })));
    }
  }, [drawerState.isOpen, drawerState.selectedTable, drawerState.nodeId, nodes]);

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
        id: filterEntries[editingIndex].id
      };
      setFilterEntries(updatedFilters);
      setEditingIndex(null);
    } else {
      // Add new filter with unique ID
      setFilterEntries([...filterEntries, {
        ...currentFilter,
        id: Date.now() + Math.random()
      }]);
    }

    // Reset current filter
    setCurrentFilter({
      columnName: '',
      filterOperator: '=',
      value: ''
    });
  };

  const handleEditFilter = (index) => {
    setCurrentFilter({
      columnName: filterEntries[index].columnName,
      filterOperator: filterEntries[index].filterOperator,
      value: filterEntries[index].value
    });
    setEditingIndex(index);
  };

  const handleRemoveFilter = (index) => {
    setFilterEntries(filterEntries.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!localTable || !drawerState.nodeId) return;

    const whereConditions = filterEntries.map(entry => 
      `${entry.columnName} ${entry.filterOperator} ${entry.value}`
    );

    setNodes(prevNodes => 
      prevNodes.map((node) => {
        if (node.id === drawerState.nodeId) {
          const updatedTables = node.data.tables?.map((t) =>
            t.table_name === localTable.table_name
              ? {
                  ...t,
                  filters: filterEntries,
                  whereCondition: whereConditions.join(' AND ')
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
      <div className="w-[400px] p-4">
        <h3 className="text-lg font-semibold mb-4">
          Bulk Edit - {localTable?.table_name || ""}
        </h3>

        {localTable ? (
          <div className="space-y-4">
            {/* Filter Input Form */}
            <div className="p-4 border rounded-lg space-y-4 bg-gray-50">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Column Name
                </label>
                <select
                  value={currentFilter.columnName}
                  onChange={(e) => setCurrentFilter({...currentFilter, columnName: e.target.value})}
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

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Filter by
                </label>
                <select
                  value={currentFilter.filterOperator}
                  onChange={(e) => setCurrentFilter({...currentFilter, filterOperator: e.target.value})}
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="=">= Equal to</option>
                  <option value=">">Value Greater Than</option>
                  <option value="<">Value Less Than</option>
                  <option value="!=">≠ Not Equal to</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Value
                </label>
                <input
                  type="text"
                  value={currentFilter.value}
                  onChange={(e) => setCurrentFilter({...currentFilter, value: e.target.value})}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleAddFilter}
                className="w-full bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                {editingIndex !== null ? 'Update Filter' : 'Add Filter'}
              </button>
            </div>

            {/* Filter Entries List */}
            {filterEntries.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Applied Filters</h4>
                <div className="space-y-2">
                  {filterEntries.map((filter, index) => (
                    <div key={filter.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <span className="text-sm">
                        {filter.columnName} {filter.filterOperator} {filter.value}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditFilter(index)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveFilter(index)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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