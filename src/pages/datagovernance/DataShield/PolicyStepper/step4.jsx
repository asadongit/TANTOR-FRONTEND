import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const Step4 = ({ policyData, onDataChange, isStep3Modified }) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [openTableDropdown, setOpenTableDropdown] = useState(false);

  const initialFilters = policyData.row_access_control || {};
  const [tableFilters, setTableFilters] = useState(initialFilters);

  useEffect(() => {
    setTableFilters(policyData.row_access_control || {});
  }, [policyData.row_access_control]);

  useEffect(() => {
    if (isStep3Modified && Object.keys(tableFilters).length > 0) {
      setSelectedTable('');
      setTableSearch('');
      setTableFilters({});
      onDataChange({
        row_access_control: {},
        column_access_control: {}
      });
    }
  }, [isStep3Modified]);

  const allTables = policyData.data_connection.flatMap((conn) =>
    conn.tables.map((table) => ({
      fullPath: table,
      connection: conn.connection,
      schema: conn.schema,
      tableName: table.split('.').pop(),
    }))
  );

  const filteredTables = allTables.filter((table) =>
    table.fullPath.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const getColumnsForSelectedTable = (currentFilterIndex = -1) => {
    if (!selectedTable) return [];

    const tableConn = policyData.data_connection.find((conn) =>
      conn.tables.includes(selectedTable)
    );

    const usedColumns = (tableFilters[selectedTable] || [])
      .map((filter, index) => (index !== currentFilterIndex ? filter.column : null))
      .filter((column) => column);

    return (
      tableConn?.columns
        .filter((col) => col.startsWith(`${selectedTable}.`))
        .map((col) => col.split('.').pop())
        .filter((column) => !usedColumns.includes(column)) || []
    );
  };

  const handleTableChange = (value) => {
    setSelectedTable(value);
    setOpenTableDropdown(false);
  };

  const handleAddFilter = () => {
    if (!selectedTable) return;
    const newFilter = {
      column: '',
      operator: '=',
      value: '',
      logicWithNext: 'OR',
    };
    setTableFilters((prev) => ({
      ...prev,
      [selectedTable]: [...(prev[selectedTable] || []), newFilter],
    }));
  };

  const handleFilterChange = (table, index, field, value) => {
    const updatedFilters = {
      ...tableFilters,
      [table]: tableFilters[table].map((filter, i) =>
        i === index
          ? {
              ...filter,
              [field]: value,
              ...(field === 'column' && { value: '' }),
            }
          : filter
      ),
    };
    setTableFilters(updatedFilters);
    onDataChange({ row_access_control: updatedFilters });
  };

  const handleLogicChange = (table, index, value) => {
    const updatedFilters = { ...tableFilters };
    if (updatedFilters[table] && index < updatedFilters[table].length - 1) {
      updatedFilters[table][index].logicWithNext = value;
      setTableFilters(updatedFilters);
      onDataChange({ row_access_control: updatedFilters });
    }
  };

  const handleRemoveFilter = (table, index) => {
    const updatedFilters = {
      ...tableFilters,
      [table]: tableFilters[table].filter((_, i) => i !== index),
    };
    if (updatedFilters[table].length === 0) {
      delete updatedFilters[table];
    }
    setTableFilters(updatedFilters);
    onDataChange({ row_access_control: updatedFilters });
  };

  const isFilterComplete = (filter) => {
    return filter.column && filter.value;
  };

  const renderTableSelect = () => (
    <div className="relative mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select Table
      </label>
      <div
        className="w-full p-2 border border-gray-300 rounded-md bg-white cursor-pointer h-10 flex items-center"
        onClick={() => setOpenTableDropdown((prev) => !prev)}
      >
        <span className="whitespace-nowrap">
          {selectedTable
            ? allTables.find((t) => t.fullPath === selectedTable)?.tableName ||
              'Select Table'
            : 'Select Table'}
        </span>
      </div>
      {openTableDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <input
            type="text"
            placeholder="Search tables..."
            className="w-full p-2 border-b border-gray-200 outline-none"
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
          />
          {filteredTables.map((table) => (
            <div
              key={table.fullPath}
              className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleTableChange(table.fullPath)}
            >
              <span className="font-medium">{table.tableName}</span>
              <span className="text-sm text-gray-500 ml-2">
                {table.connection} &gt; {table.schema}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTableChips = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      {Object.keys(tableFilters).map((table) => (
        <span
          key={table}
          className={`px-3 py-1 rounded-sm text-sm font-medium cursor-pointer ${selectedTable === table
            ? 'text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          style={{
            backgroundColor: selectedTable === table ? '#8e78b7' : undefined,
            ...(selectedTable === table && {
              ':hover': { backgroundColor: '#7b689e' },
            }),
          }}
          onClick={() => setSelectedTable(table)}
        >
          {table.split('.').pop()}
        </span>
      ))}
    </div>
  );

  const renderFilterControls = () => {
    if (!selectedTable) return null;
    const filters = tableFilters[selectedTable] || [];

    return (
      <div className="border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-base font-medium text-gray-700">
            Filters for: {selectedTable.split('.').pop()}
          </h4>
          <button
            className={`flex items-center px-3 py-1 border rounded-md text-sm font-medium ${filters.length > 0 && !isFilterComplete(filters[filters.length - 1])
              ? 'border-gray-300 text-gray-400 cursor-not-allowed'
              : 'text-[#8e78b7] hover:bg-[#8e78b7]/10'
            }`}
            style={{
              borderColor:
                filters.length > 0 &&
                !isFilterComplete(filters[filters.length - 1])
                  ? undefined
                  : '#8e78b7',
            }}
            onClick={handleAddFilter}
            disabled={
              filters.length > 0 &&
              !isFilterComplete(filters[filters.length - 1])
            }
          >
            <Plus size={16} className="mr-1" />
            Add Condition
          </button>
        </div>

        {filters.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-4">
            No conditions added yet
          </p>
        ) : (
          <div className="max-h-60 overflow-y-auto">
            {filters.map((filter, index) => (
              <div key={index} className="mb-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="min-w-[180px]">
                    <label className="block text-sm text-gray-700 mb-1">
                      Column
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      value={filter.column || ''}
                      onChange={(e) =>
                        handleFilterChange(
                          selectedTable,
                          index,
                          'column',
                          e.target.value
                        )
                      }
                    >
                      <option value="">Select Column</option>
                      {(filter.column
                        ? [filter.column, ...getColumnsForSelectedTable(index)]
                        : getColumnsForSelectedTable(index)
                      ).map((column) => (
                        <option key={column} value={column}>
                          {column}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="min-w-[100px]">
                    <label className="block text-sm text-gray-700 mb-1">
                      Operator
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      value={filter.operator}
                      onChange={(e) =>
                        handleFilterChange(
                          selectedTable,
                          index,
                          'operator',
                          e.target.value
                        )
                      }
                    >
                      {['=', '!=', '>', '<', '>=', '<='].map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm text-gray-700 mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      value={filter.value || ''}
                      onChange={(e) =>
                        handleFilterChange(
                          selectedTable,
                          index,
                          'value',
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <button
                    className="p-2 text-red-600 hover:text-red-700"
                    onClick={() => handleRemoveFilter(selectedTable, index)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {index < filters.length - 1 && (
                  <div className="flex justify-end my-2">
                    <select
                      className="w-32 p-2 border border-gray-300 rounded-md text-sm"
                      value={filter.logicWithNext}
                      onChange={(e) =>
                        handleLogicChange(selectedTable, index, e.target.value)
                      }
                    >
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-6" style={{ color: '#8e78b7' }}>
        Access Control - Row
      </h3>
      {renderTableSelect()}
      {Object.keys(tableFilters).length > 0 && renderTableChips()}
      {renderFilterControls()}
    </div>
  );
};

export default Step4;