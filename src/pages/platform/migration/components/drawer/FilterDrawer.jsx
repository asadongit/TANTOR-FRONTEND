import { useState, useRef, useEffect } from 'react';
import { ListFilter, Code, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { useMigrationContext } from '../MigrationContext';
import axios from 'axios';
import { useAuth } from '../../../../../context/AuthContext';

export default function FilterDrawer({ table, onClose }) {
  const { migrationData, updateNodeData } = useMigrationContext();
  const { token, hostnameV1 } = useAuth();

  const [filterMode, setFilterMode] = useState('regular');
  const [currentFilter, setCurrentFilter] = useState({
    columnName: '',
    filterOperator: '=',
    value: '',
    logic: 'AND',
  });
  const [currentComplexQuery, setCurrentComplexQuery] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [filters, setFilters] = useState([]);
  const [validationError, setValidationError] = useState('');
  const drawerRef = useRef(null);

  const [columns, setColumns] = useState([]);

  const [targetTables, setTargetTables] = useState([]);
  const [activeTargetTable, setActiveTargetTable] = useState('');

  // Helper function to check if filters contain a complex query
  const hasComplexQuery = () => {
    return filters.some(filter => filter.type === 'complex');
  };

  // Helper function to check if filters contain regular filters
  const hasRegularFilters = () => {
    return filters.some(filter => filter.type !== 'complex');
  };

  const toggleFilterMode = (mode) => {
    setValidationError('');

    // Validation: Can't switch to complex mode if regular filters exist
    if (mode === 'complex' && hasRegularFilters()) {
      setValidationError('Cannot add complex query when regular filters exist. Please remove regular filters first.');
      return;
    }

    // Validation: Can't switch to regular mode if complex query exists
    if (mode === 'regular' && hasComplexQuery()) {
      setValidationError('Cannot add regular filters when a complex query exists. Please remove the complex query first.');
      return;
    }

    setEditingIndex(null);
    setCurrentFilter({ columnName: '', filterOperator: '=', value: '', logic: 'AND' });
    setCurrentComplexQuery('');
    setFilterMode(mode);
  };

  const fetchTableColumnJson = async (connectionName, tableName) => {
    if (!connectionName || !tableName)
      return;

    try {
      const response = await axios.get(
        `${hostnameV1}/connection-master-metadata/${connectionName}/${tableName}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const columnJson = response?.data && response.data?.length > 0 ? response.data[0]?.column_json : null;
      if (!columnJson) {
        throw new Error("Error occured fetching column json");
      }

      const formattedColumnJson = columnJson.map(cj => ({
        column_name: cj.column_name,
        data_type: cj.DATA_TYPE,
      }));

      setColumns(formattedColumnJson);
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  };

  useEffect(() => {
    const source = migrationData?.source;
    const target = migrationData?.target;
    const scope = source?.scope;

    if (!scope || !table) return;

    if (scope === "bulk") {
      const mappings = target?.targetToSourceMapping || [];

      const availableTargetTables = mappings
        .filter(m => m.sourceTable === table.source_table)
        .map(m => m.targetTable);

      setTargetTables(availableTargetTables);

      if (availableTargetTables.length && !activeTargetTable) {
        setActiveTargetTable(availableTargetTables[0]);
      }

      if (source?.connection && table.source_table) {
        fetchTableColumnJson(source.connection, table.source_table);
      }

      return;
    }

    if (scope === "subset") {
      const targetTable = target?.targetTable || "";

      setTargetTables(targetTable ? [targetTable] : []);
      setActiveTargetTable(targetTable);

      const columnJson = table?.column_json;

      if (!Array.isArray(columnJson) || columnJson.length === 0) {
        console.warn("No column_json found for subset table:", table);
        return;
      }

      const formattedColumns = columnJson.map(col => ({
        column_name: col.column_name,
        data_type: col.DATA_TYPE,
      }));

      setColumns(formattedColumns);
    }
  }, [table, migrationData, activeTargetTable]);

  useEffect(() => {
    if (!activeTargetTable || !migrationData) return;

    const source = migrationData?.source;
    const scope = source?.scope;

    const existingFilters = source?.filters?.find(
        t => t.sourceTable === table.source_table && t.targetTable === activeTargetTable
      )?.whereCondition || [];

    setFilters(existingFilters);

    if (existingFilters.some(filter => filter.type === 'complex')) {
      setFilterMode('complex');
      setCurrentComplexQuery(existingFilters.find(filter => filter.type === 'complex')?.query || '');
    } else {
      setFilterMode('regular');
    }

    setValidationError('');
  }, [activeTargetTable, table, migrationData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleAddFilter = () => {
    if (currentFilter.columnName && currentFilter.value) {
      // Validation: Can't add regular filter if complex query exists (unless editing)
      if (editingIndex === null && hasComplexQuery()) {
        setValidationError('Cannot add regular filters when a complex query exists. Please remove the complex query first.');
        return;
      }

      setValidationError('');

      if (editingIndex !== null) {
        const updatedFilters = [...filters];
        updatedFilters[editingIndex] = currentFilter;
        setFilters(updatedFilters);
        setEditingIndex(null);
      } else {
        setFilters([...filters, currentFilter]);
      }
      setCurrentFilter({ columnName: '', filterOperator: '=', value: '', logic: 'AND' });
    }
  };

  const handleAddComplexQuery = () => {
    if (currentComplexQuery.trim()) {
      // Validation: Can't add complex query if regular filters exist (unless editing)
      if (editingIndex === null && hasRegularFilters()) {
        setValidationError('Cannot add complex query when regular filters exist. Please remove regular filters first.');
        return;
      }

      // Validation: Can't add complex query if one already exists (unless editing)
      if (editingIndex === null && hasComplexQuery()) {
        setValidationError('Only one complex query is allowed. Please edit the existing query or remove it first.');
        return;
      }

      setValidationError('');

      if (editingIndex !== null) {
        const updatedFilters = [...filters];
        updatedFilters[editingIndex] = { type: 'complex', query: currentComplexQuery };
        setFilters(updatedFilters);
        setEditingIndex(null);
      } else {
        setFilters([...filters, { type: 'complex', query: currentComplexQuery }]);
      }
      setCurrentComplexQuery('');
    }
  };

  const handleEditFilter = (index) => {
    const filter = filters[index];
    setEditingIndex(index);
    setValidationError('');

    if (filter.type === 'complex') {
      setFilterMode('complex');
      setCurrentComplexQuery(filter.query);
    } else {
      setFilterMode('regular');
      setCurrentFilter(filter);
    }
  };

  const handleDeleteFilter = (index) => {
    const updatedFilters = filters.filter((_, i) => i !== index);
    setFilters(updatedFilters);
    setValidationError('');

    if (editingIndex === index) {
      setEditingIndex(null);
      setCurrentFilter({ columnName: '', filterOperator: '=', value: '', logic: 'AND' });
      setCurrentComplexQuery('');
    }
  };

  const handleSave = () => {
    const sourceTable = table.source_table;

    const scope = migrationData["source"]?.scope;
    const updatedFilters = migrationData["source"]?.filters ? [...migrationData["source"].filters] : [];

    if (!scope) return;
    const existingFilterIndex = updatedFilters.findIndex(f => f.sourceTable === table.source_table && f.targetTable === activeTargetTable);

    if (existingFilterIndex !== -1)
      updatedFilters.splice(existingFilterIndex, 1);

    updatedFilters.push({
      sourceTable,
      targetTable: activeTargetTable,
      whereCondition: filters,
    });

    updateNodeData("source", { filters: updatedFilters });
    onClose();
  }

  const handleCancel = () => {
    onClose();
  };

  return (
    <div ref={drawerRef} className="fixed right-0 top-0 h-full w-[650px] bg-white shadow-lg z-50 transform translate-x-0 transition-transform duration-300 border-l-2 border-gray-200 shadow-l-lg">
      <div className="p-4 border-b">
        <button onClick={onClose} className="float-right text-purple-600 hover:text-purple-800 ">×</button>
        <h2 className="text-lg font-semibold text-purple-600">Add Filter</h2>
      </div>

      <div className="p-4">
        <div className="mb-6">
          <label className="block mb-2 text-xs font-medium text-gray-600">
            Target Table
          </label>

          <select
            className="w-full p-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
            value={activeTargetTable}
            onChange={(e) => setActiveTargetTable(e.target.value)}
          >
            <option value="">Select target table</option>
            {targetTables.map((tbl) => (
              <option key={tbl} value={tbl}>
                {tbl}
              </option>
            ))}
          </select>
        </div>

        {validationError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{validationError}</p>
          </div>
        )}

        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-3 bg-white rounded-md border border-purple-100 p-1">
            <button
              className={`flex items-center px-3 py-1.5 rounded text-sm font-medium transition-colors ${filterMode === "regular"
                ? "bg-purple-100 text-[#8e78b7]"
                : "text-gray-500 hover:bg-gray-50"
                }`}
              onClick={() => toggleFilterMode("regular")}
              disabled={editingIndex !== null}
            >
              <ListFilter className="h-4 w-4 mr-1.5" />
              Regular Condition
            </button>
            <button
              className={`flex items-center px-3 py-1.5 rounded text-sm font-medium transition-colors ${filterMode === "complex"
                ? "bg-purple-100 text-[#8e78b7]"
                : "text-gray-500 hover:bg-gray-50"
                }`}
              onClick={() => toggleFilterMode("complex")}
              disabled={editingIndex !== null}
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

              <div>
                <button
                  className="bg-[#8e78b7] text-white border-none rounded-md py-2 px-4 text-sm font-medium cursor-pointer transition-colors hover:bg-[#7c68a3]"
                  onClick={handleAddFilter}
                >
                  {editingIndex !== null ? "Update Condition" : "Add Condition"}
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
                  {editingIndex !== null ? "Update Complex Query" : "Add Complex Query"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3 text-gray-700">
            Current Filters for {activeTargetTable}
          </h3>
          <div className="bg-white border border-gray-200 rounded-md p-4">
            {filters.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-4">
                No filters added yet.
              </p>
            ) : (
              filters.map((filter, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex items-center space-x-2 flex-1">
                    {filter.type === 'complex' ? (
                      <span className="text-sm font-mono text-gray-700">
                        {filter.query}
                      </span>
                    ) : (
                      <>
                        <span className="text-sm text-gray-700">
                          {filter.columnName}
                        </span>
                        <span className="text-xs text-gray-400">
                          {filter.filterOperator} {filter.value}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditFilter(index)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit filter"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFilter(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete filter"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="absolute bottom-4 right-4 flex space-x-4">
          <button
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="bg-[#8e78b7] text-white px-4 py-2 rounded hover:bg-[#7c68a3]"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>

  );
}