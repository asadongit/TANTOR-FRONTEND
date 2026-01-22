import { useState, useRef, useEffect } from 'react';
import { ListFilter, Code, Edit2, Trash2, AlertCircle, Info } from 'lucide-react';
import { usePurgeContext } from '../PurgeContext';
import axios from 'axios';
import { useAuth } from '../../../../context/AuthContext';
import toast from 'react-hot-toast';


export default function PurgeFilterDrawer({ table, onClose }) {
  const { purgeData, updateNodeData } = usePurgeContext();
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
  const [activeTab, setActiveTab] = useState('addFilter');

  // Drop Partition
  const [sourcepartitions, setSourcePartitions] = useState([]);

  // REMOVE LATER
  console.log("table ==> ", table);

  const hasComplexQuery = () => {
    return filters.some(filter => filter.type === 'complex');
  };

  const hasRegularFilters = () => {
    return filters.some(filter => filter.type !== 'complex');
  };

  const toggleFilterMode = (mode) => {
    setValidationError('');

    if (mode === 'complex' && hasRegularFilters()) {
      setValidationError('Cannot add complex query when regular filters exist. Please remove regular filters first.');
      return;
    }

    if (mode === 'regular' && hasComplexQuery()) {
      setValidationError('Cannot add regular filters when a complex query exists. Please remove the complex query first.');
      return;
    }

    setEditingIndex(null);
    setCurrentFilter({ columnName: '', filterOperator: '=', value: '', logic: 'AND' });
    setCurrentComplexQuery('');
    setFilterMode(mode);
  };

  const getSortedPartitions = (partitionJson) => {
    if (!Array.isArray(partitionJson) || partitionJson?.length === 0)
      return [];

    return partitionJson.sort(
      (a, b) => a.partition_id - b.partition_id
    );
  }

  const fetchTableColumnAndPartitionJson = async (connectionName, tableName) => {
    if (!connectionName || !tableName) return;

    try {
      const response = await axios.get(
        `${hostnameV1}/connection-master-metadata/${connectionName}/${tableName}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const columnJson = response?.data && response.data?.length > 0 ? response.data[0]?.column_json : null;
      const partitionJson = response?.data && response.data?.length > 0 ? response.data[0]?.partition_json : [];

      if (!columnJson) {
        throw new Error("Error occurred fetching column json");
      }

      const formattedColumnJson = columnJson.map(cj => ({
        column_name: cj.column_name,
        data_type: cj.DATA_TYPE,
      }));

      setColumns(formattedColumnJson);

      const sortedPartitions = getSortedPartitions(partitionJson);
      setSourcePartitions(sortedPartitions);

    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  };

  useEffect(() => {
    const source = purgeData?.source;
    const target = purgeData?.target;
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
        fetchTableColumnAndPartitionJson(source.connection, table.source_table);
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
      setSourcePartitions(table?.partition_json || []);
    }
  }, [table, purgeData, activeTargetTable]);

  useEffect(() => {
    if (!activeTargetTable || !purgeData) return;

    const source = purgeData?.source;

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
  }, [activeTargetTable, table, purgeData]);

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
      if (editingIndex === null && hasRegularFilters()) {
        setValidationError('Cannot add complex query when regular filters exist. Please remove regular filters first.');
        return;
      }

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

  const handleSave = async () => {
    if (activeTab === "dropPartition") {
      if(!sourcepartitions?.length > 1)
        return;
      const targetConn = purgeData["target"]?.connection;

      if (!targetConn || !activeTargetTable) {
        toast.error("Missing target connection or target table");
        return;
      }

      try {
        const response = await axios.get(
          `${hostnameV1}/connection-master-metadata/${targetConn}/${activeTargetTable}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const partitionJson = response?.data && response.data?.length > 0
          ? response.data[0]?.partition_json
          : [];

        const sortedTargetPartitions = getSortedPartitions(partitionJson);
        console.log("Source partitions:", sourcepartitions);
        console.log("Target partitions:", sortedTargetPartitions);

        const sourcePartitionToBeDropped = sourcepartitions[0];

        const targetPartition = sortedTargetPartitions.find(p => p?.partition_name === sourcePartitionToBeDropped?.partition_name);

        if (!targetPartition) {
          toast.error(`Partition ${sourcePartitionToBeDropped.partition_name} doesn't exist on target table ${activeTargetTable}`);
          return;
        }

        const sourceTable = table.source_table;
        const updatedPartitions = purgeData["source"]?.dropPartitions ? purgeData["source"].dropPartitions : [];

        const existingPartitionIndex = updatedPartitions.findIndex(
          p => p.sourceTable === table.source_table && p.targetTable === activeTargetTable
        );
        if (existingPartitionIndex !== -1)
          updatedPartitions.splice(existingPartitionIndex, 1);

        updatedPartitions.push({
          sourceTable,
          targetTable: activeTargetTable,
          sourcePartition: sourcePartitionToBeDropped,
          targetPartition: targetPartition,
        });

        updateNodeData("source", { dropPartitions: updatedPartitions });

      } catch (error) {
        console.error("Error fetching target partition json:", error);
        return;
      }

    } else {
      const sourceTable = table.source_table;
      const scope = purgeData["source"]?.scope;
      const updatedFilters = purgeData["source"]?.filters ? [...purgeData["source"].filters] : [];

      if (!scope) return;

      const existingFilterIndex = updatedFilters.findIndex(
        f => f.sourceTable === table.source_table && f.targetTable === activeTargetTable
      );

      if (existingFilterIndex !== -1)
        updatedFilters.splice(existingFilterIndex, 1);

      updatedFilters.push({
        sourceTable,
        targetTable: activeTargetTable,
        whereCondition: filters,
      });

      updateNodeData("source", { filters: updatedFilters });
    }

    onClose();
  };
  const handleCancel = () => {
    onClose();
  };

  return (
    <div ref={drawerRef} className="fixed text-black right-0 top-0 h-full w-[750px] bg-white shadow-lg z-50 transform translate-x-0 transition-transform duration-300 border-l-2 border-gray-200 shadow-l-lg">
      <div className="p-4 border-b">
        <button onClick={onClose} className="float-right text-purple-600 hover:text-purple-800">×</button>
        <h2 className="text-lg font-semibold text-[#8e78b7]">Purge Options</h2>
      </div>

      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors focus:outline-none ${activeTab === 'addFilter'
            ? 'border-b-2 border-[#8e78b7] text-[#8e78b7] bg-white'
            : 'text-gray-500 hover:bg-gray-100'
            }`}
          onClick={() => setActiveTab('addFilter')}
        >
          Add Filter
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors focus:outline-none ${activeTab === 'dropPartition'
            ? 'border-b-2 border-[#8e78b7] text-[#8e78b7] bg-white'
            : 'text-gray-500 hover:bg-gray-100'
            }`}
          onClick={() => setActiveTab('dropPartition')}
        >
          Drop Partition
        </button>
      </div>

      <div className='p-4'>
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

      </div>
      <div className="p-4">
        {activeTab === 'addFilter' ? (
          <>

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
                      <label htmlFor="column" className="block mb-2 text-xs font-medium text-gray-600">
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
                      <label htmlFor="operator" className="block mb-2 text-xs font-medium text-gray-600">
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
                      <label htmlFor="value" className="block mb-2 text-xs font-medium text-gray-600">
                        Value
                      </label>
                      <input
                        type={(() => {
                          const column = columns?.find(
                            (item) => item.column_name === currentFilter.columnName
                          );
                          const type = column?.data_type?.toUpperCase();
                          if (type === "DATE") return "date";
                          if (type === "DATETIME" || (type && type.startsWith("TIMESTAMP")))
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
                    <label htmlFor="complexQuery" className="block mb-2 text-xs font-medium text-gray-600">
                      WHERE Clause
                    </label>
                    <textarea
                      id="complexQuery"
                      placeholder="Enter your SQL WHERE clause (without the WHERE keyword)"
                      className="w-full p-3 border border-gray-300 rounded-md text-sm font-mono h-32"
                      value={currentComplexQuery}
                      onChange={(e) => setCurrentComplexQuery(e.target.value)}
                    />
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
          </>
        ) : (
          //partition code
          <>
            {/* Info Banner for Sequential Partition Drop */}
            {sourcepartitions?.length > 1 && (
              <div className="flex items-start bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
                <Info className="mr-3 text-blue-500 h-6 w-6 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong>Sequential Partition Drop is enforced for this database.</strong>{' '}
                  The first available partition is auto-selected.
                </div>
              </div>
            )}

            {/* No Partitions Warning */}
            {sourcepartitions?.length === 0 && (
              <div className="flex items-start bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
                <Info className="mr-3 text-blue-500 h-6 w-6 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong>Partition for this database doesn't exist.</strong>
                </div>
              </div>
            )}

            {/* Default Partitions Warning */}
            {sourcepartitions?.length === 1 && (
              <div className="flex items-start bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
                <Info className="mr-3 text-blue-500 h-6 w-6 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong>Can't drop default partition.</strong>
                </div>
              </div>
            )}

            {sourcepartitions?.source_conn_type?.toLowerCase() === "mssql" && (
              <div className="flex items-start bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
                <Info className="mr-3 text-blue-500 h-6 w-6 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong>MSSQL doesn't support drop partitions!</strong>
                </div>
              </div>
            )}

            {/* Partition Table */}
            {sourcepartitions?.length > 1 && (
              <div className="w-full overflow-x-auto shadow rounded-lg mb-6">
                <table className="w-full bg-white border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="py-2 px-2 text-center font-medium border border-gray-700">Partition Name</th>
                      <th className="py-2 px-2 text-center font-medium border border-gray-700">Column</th>
                      <th className="py-2 px-2 text-center font-medium border border-gray-700">High Value</th>
                      <th className="py-2 px-2 text-center font-medium border border-gray-700">Type</th>
                      <th className="py-2 px-2 text-center font-medium border border-gray-700">Table</th>
                      <th className="py-2 px-2 text-center font-medium border border-gray-700 w-16">Select</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sourcepartitions.map((partition, index) => (
                      <tr
                        key={index}
                        className={
                          index === 0
                            ? 'bg-[#daf5ce]'
                            : 'bg-gray-100 opacity-50'
                        }
                      >
                        <td className="border border-gray-300 py-2 px-2 text-center">
                          {partition.partition_name}
                        </td>
                        <td className="border border-gray-300 py-2 px-2 text-center">
                          {partition.column_name}
                        </td>
                        <td className="border border-gray-300 py-2 px-2 text-center break-words">
                          {partition.high_value}
                        </td>
                        <td className="border border-gray-300 py-2 px-2 text-center">
                          {partition.partition_type}
                        </td>
                        <td className="border border-gray-300 py-2 px-2 text-center">
                          {partition.table_name}
                        </td>
                        <td className="border border-gray-300 py-2 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={index === 0}
                            readOnly
                            className="w-3 h-3"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Fixed Bottom Action Buttons */}
      <div className="fixed bottom-0 right-0 w-[650px] bg-white border-t border-gray-200 p-4 flex justify-end gap-3">
        <button
          className="bg-gray-100 text-gray-800 border border-gray-300 rounded-md py-2 px-6 text-sm font-medium cursor-pointer transition-colors hover:bg-gray-200"
          onClick={handleCancel}
        >
          Cancel
        </button>
        <button
          className="bg-[#8e78b7] text-white border-none rounded-md py-2 px-6 text-sm font-medium cursor-pointer transition-colors hover:bg-[#7c68a3]"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  );
}