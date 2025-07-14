import { useAuth } from '../../../../context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { Loader } from 'lucide-react';

const Step3 = ({ policyData, name, onDataChange, initialData, setIsStep3Modified }) => {
  const { token } = useAuth();
  const dropdownRef = useRef(null);

  const [connectionData, setConnectionData] = useState([]);
  const [schemaData, setSchemaData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [columnData, setColumnData] = useState([]);

  const [selectedConnections, setSelectedConnections] = useState(initialData.selectedConnections || []);
  const [selectedSchemas, setSelectedSchemas] = useState(initialData.selectedSchemas || []);
  const [selectedTables, setSelectedTables] = useState(initialData.selectedTables || []);
  const [selectedColumns, setSelectedColumns] = useState(initialData.selectedColumns || []);

  const [connectionSearch, setConnectionSearch] = useState('');
  const [schemaSearch, setSchemaSearch] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [columnSearch, setColumnSearch] = useState('');

  const [loadingConnections, setLoadingConnections] = useState(false);
  const [loadingSchemas, setLoadingSchemas] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingColumns, setLoadingColumns] = useState(false);

  const [openDropdown, setOpenDropdown] = useState(null);


  useEffect(() => {
    const stepData = {
      selectedConnections,
      selectedSchemas,
      selectedTables,
      selectedColumns
    };

    onDataChange(stepData);

    if (policyData && typeof setIsStep3Modified === 'function') {
      const connections = processConnectionData(
        selectedConnections,
        selectedSchemas,
        selectedTables,
        selectedColumns
      );

      if (policyData.onPolicyDataChange) {
        policyData.onPolicyDataChange({
          data_connection: connections
        });
      }
    }
  }, [selectedConnections, selectedSchemas, selectedTables, selectedColumns]);

  useEffect(() => {
    setSelectedConnections(initialData.selectedConnections || []);
    setSelectedSchemas(initialData.selectedSchemas || []);
    setSelectedTables(initialData.selectedTables || []);
    setSelectedColumns(initialData.selectedColumns || []);
  }, [initialData.selectedConnections, initialData.selectedSchemas, initialData.selectedTables, initialData.selectedColumns]);

  useEffect(() => {
    const fetchConnections = async () => {
      if (!token) return;
      setLoadingConnections(true);
      try {
        const response = await fetch(`${window._env_?.VITE_FAST_API}/datapolicy/connection`, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setConnectionData(data);
      } catch (error) {
        console.error('Error fetching connections:', error);
      } finally {
        setLoadingConnections(false);
      }
    };
    fetchConnections();
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const fetchSchemas = async () => {
    if (selectedConnections.length === 0 || !token || (schemaData.length > 0 && selectedConnections.every(conn => schemaData.some(s => s.connection_name === conn)))) {
      return;
    }
    setLoadingSchemas(true);
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/datapolicy/schemas`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(selectedConnections)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSchemaData(data);
    } catch (error) {
      console.error('Error fetching schemas:', error);
    } finally {
      setLoadingSchemas(false);
    }
  };

  const fetchTables = async () => {
    if (selectedSchemas.length === 0 || !token || (tableData.length > 0 && selectedSchemas.every(schema => tableData.some(t => t.connection_schema === schema)))) {
      return;
    }
    setLoadingTables(true);
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/datapolicy/tables`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(selectedSchemas)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTableData(data);
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoadingTables(false);
    }
  };

  const fetchColumns = async () => {
    if (selectedTables.length === 0 || !token || (columnData.length > 0 && selectedTables.every(table => columnData.some(c => c.connection_schema_table === table)))) {
      return;
    }
    setLoadingColumns(true);
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/datapolicy/columns`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(selectedTables)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setColumnData(data);
    } catch (error) {
      console.error('Error fetching columns:', error);
    } finally {
      setLoadingColumns(false);
    }
  };

  const getUnique = (arr) => [...new Set(arr)];

  const connectionOptions = getUnique(connectionData);
  const filteredConnections = connectionOptions.filter(c =>
    c.toLowerCase().includes(connectionSearch.toLowerCase())
  );

  const schemaOptions = getUnique(
    schemaData.flatMap(item => item.schemas.map(s => `${item.connection_name}.${s}`))
  );
  const filteredSchemas = schemaOptions.filter(s =>
    s.toLowerCase().includes(schemaSearch.toLowerCase())
  );

  const tableOptions = getUnique(
    tableData.flatMap(item => item.tables.map(t => `${item.connection_schema}.${t}`))
  );
  const filteredTables = tableOptions.filter(t =>
    t.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const columnOptions = getUnique(
    columnData.flatMap(item => item.columns.map(c => `${item.connection_schema_table}.${c.column_name}`))
  );
  const filteredColumns = columnOptions.filter(col =>
    col.toLowerCase().includes(columnSearch.toLowerCase())
  );

  const handleSelection = (setter, resetList = [], dataSetter = null) => (value) => {
    setter(prev => {
      const newSelection = prev.includes(value)
        ? prev.filter(item => item !== value)
        : [...prev, value];

      if (dataSetter) {
        dataSetter([]);
      }
      return newSelection;
    });
    resetList.forEach(reset => reset([]));
    setIsStep3Modified(true);
  };

  const handleSelectAll = (options, setter, resetList = [], dataSetter = null) => {
    setter(prev => {
      const newSelection = options.every(option => prev.includes(option))
        ? []
        : [...new Set([...prev, ...options])];

      if (dataSetter) {
        dataSetter([]);
      }
      return newSelection;
    });
    resetList.forEach(reset => reset([]));
    setIsStep3Modified(true);
  };

  const toggleDropdown = (dropdown) => {
    setOpenDropdown(prevDropdown => {
      const newDropdown = prevDropdown === dropdown ? null : dropdown;

      if (newDropdown === 'Schema' && selectedConnections.length > 0 && schemaData.length === 0) {
        fetchSchemas();
      } else if (newDropdown === 'Table' && selectedSchemas.length > 0 && tableData.length === 0) {
        fetchTables();
      } else if (newDropdown === 'Column' && selectedTables.length > 0 && columnData.length === 0) {
        fetchColumns();
      }
      return newDropdown;
    });
  };

  const renderSearchableSelect = (label, options, selectedValues, searchValue, setSearchValue, loading, resetList = [], dataSetter = null) => {
    const allFilteredSelected = options.length > 0 && options.every(option => selectedValues.includes(option));
    const someFilteredSelected = options.some(option => selectedValues.includes(option)) && !allFilteredSelected;

    return (
      <div className="relative" ref={openDropdown === label ? dropdownRef : null}>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div
          className="w-full p-2 border border-gray-300 rounded-md bg-white cursor-pointer h-10 flex items-center overflow-x-auto no-scrollbar"
          onClick={() => toggleDropdown(label)}
          title={selectedValues.length > 0 ? selectedValues.join(', ') : ''}
        >
          <span className="whitespace-nowrap">
            {selectedValues.length > 0
              ? selectedValues.slice(0, 3).join(', ') + (selectedValues.length > 3 ? ', ...' : '')
              : `Select ${label}`}
          </span>
        </div>
        <style jsx>{`
                    .no-scrollbar {
                        -ms-overflow-style: none; /* IE and Edge */
                        scrollbar-width: none; /* Firefox */
                    }
                    .no-scrollbar::-webkit-scrollbar {
                        display: none; /* Chrome, Safari, and Opera */
                    }
                `}</style>
        {openDropdown === label && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            <div className="sticky top-0 bg-white z-10">
              <>
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full p-2 border-b border-gray-200 outline-none"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
                {options.length > 0 && (
                  <div className="flex items-center p-2 border-b border-gray-200 hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      ref={el => el && (el.indeterminate = someFilteredSelected)}
                      onChange={() => handleSelectAll(options, (val) => {
                        if (label === 'Connection') setSelectedConnections(val);
                        else if (label === 'Schema') setSelectedSchemas(val);
                        else if (label === 'Table') setSelectedTables(val);
                        else if (label === 'Column') setSelectedColumns(val);
                      }, resetList, dataSetter)}
                      className="mr-2"
                    />
                    <span className="font-medium">Select All</span>
                  </div>
                )}
              </>
            </div>
            {loading ? (
              <div className="flex items-center justify-center p-2 text-gray-500">
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Loading...
              </div>
            ) : options.length === 0 ? (
              <div className="p-2 text-center text-gray-500">No options available</div>
            ) : (
              options.map((option) => (
                <div
                  key={option}
                  className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    if (label === 'Connection') handleSelection(setSelectedConnections, resetList, dataSetter)(option);
                    else if (label === 'Schema') handleSelection(setSelectedSchemas, resetList, dataSetter)(option);
                    else if (label === 'Table') handleSelection(setSelectedTables, resetList, dataSetter)(option);
                    else if (label === 'Column') handleSelection(setSelectedColumns, resetList, dataSetter)(option);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option)}
                    readOnly
                    className="mr-2"
                  />
                  <span>{option}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  const processConnectionData = (connections, schemas, tables, columns) => {
    const result = [];
    if (!Array.isArray(connections) || !Array.isArray(schemas) || !Array.isArray(tables) || !Array.isArray(columns)) {
      console.warn('Invalid input arrays in processConnectionData');
      return result;
    }

    const connectionGroups = {};
    schemas.forEach((schema) => {
      if (typeof schema !== 'string') return;
      const [conn, schemaName] = schema.split('.');
      if (!conn || !schemaName || !connections.includes(conn)) return;
      if (!connectionGroups[conn]) {
        connectionGroups[conn] = {
          connection: conn,
          schemas: {},
        };
      }
      connectionGroups[conn].schemas[schema] = {
        schema: schema,
        tables: new Set(),
        columns: new Set(),
      };
    });

    tables.forEach((table) => {
      if (typeof table !== 'string') return;
      const parts = table.split('.');
      if (parts.length < 3) return;
      const conn = parts[0];
      const schema = parts.slice(0, 2).join('.');
      if (connectionGroups[conn]?.schemas[schema]) {
        connectionGroups[conn].schemas[schema].tables.add(table);
      }
    });

    columns.forEach((column) => {
      if (typeof column !== 'string') return;
      const parts = column.split('.');
      if (parts.length < 4) return;
      const conn = parts[0];
      const schema = parts.slice(0, 2).join('.');
      if (connectionGroups[conn]?.schemas[schema]) {
        connectionGroups[conn].schemas[schema].columns.add(column);
      }
    });

    Object.values(connectionGroups).forEach((connGroup) => {
      Object.values(connGroup.schemas).forEach((schema) => {
        result.push({
          connection: connGroup.connection,
          schema: schema.schema,
          tables: Array.from(schema.tables),
          columns: Array.from(schema.columns),
        });
      });
    });

    return result;
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-700 mb-2">{name}</h3>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {renderSearchableSelect(
          'Connection',
          filteredConnections,
          selectedConnections,
          connectionSearch,
          setConnectionSearch,
          loadingConnections,
          [setSelectedSchemas, setSelectedTables, setSelectedColumns],
          setSchemaData
        )}
        {renderSearchableSelect(
          'Schema',
          filteredSchemas,
          selectedSchemas,
          schemaSearch,
          setSchemaSearch,
          loadingSchemas,
          [setSelectedTables, setSelectedColumns],
          setTableData
        )}
        {renderSearchableSelect(
          'Table',
          filteredTables,
          selectedTables,
          tableSearch,
          setTableSearch,
          loadingTables,
          [setSelectedColumns],
          setColumnData
        )}
        {renderSearchableSelect(
          'Column',
          filteredColumns,
          selectedColumns,
          columnSearch,
          setColumnSearch,
          loadingColumns
        )}
      </div>
    </div>
  );
};

export default Step3;