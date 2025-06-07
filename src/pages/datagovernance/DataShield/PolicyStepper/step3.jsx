import { useAuth } from '../../../../context/AuthContext';
import { useEffect, useState, useRef } from 'react';

const Step3 = ({ policyData, name, onDataChange, initialData, setIsStep3Modified }) => {
  const { token } = useAuth();
  const fetchedRef = useRef(false);
  const dropdownRef = useRef(null); // Create a ref for the dropdown container

  const [data, setData] = useState([]);
  const [selectedConnections, setSelectedConnections] = useState(initialData.selectedConnections || []);
  const [selectedSchemas, setSelectedSchemas] = useState(initialData.selectedSchemas || []);
  const [selectedTables, setSelectedTables] = useState(initialData.selectedTables || []);
  const [selectedColumns, setSelectedColumns] = useState(initialData.selectedColumns || []);
  const [connectionSearch, setConnectionSearch] = useState('');
  const [schemaSearch, setSchemaSearch] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [columnSearch, setColumnSearch] = useState('');
  const [loading, setLoading] = useState(true);
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
  }, [selectedConnections, selectedSchemas, selectedTables, selectedColumns, onDataChange]);

  useEffect(() => {
    setSelectedConnections(initialData.selectedConnections || []);
    setSelectedSchemas(initialData.selectedSchemas || []);
    setSelectedTables(initialData.selectedTables || []);
    setSelectedColumns(initialData.selectedColumns || []);
  }, [initialData.selectedConnections, initialData.selectedSchemas, initialData.selectedTables, initialData.selectedColumns]);

  useEffect(() => {
    if (token && !fetchedRef.current) {
      fetchData();
      fetchedRef.current = true;
    }
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


  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/connectionscreen`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const responseData = await response.json();
      setData(responseData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUnique = (arr) => [...new Set(arr)];

  const connectionOptions = getUnique(data.map(item => item.connection_name));
  const filteredConnections = connectionOptions.filter(c =>
    c.toLowerCase().includes(connectionSearch.toLowerCase())
  );

  const schemaOptions = getUnique(
    data
      .filter(d => selectedConnections.includes(d.connection_name))
      .map(d => `${d.connection_name}.${d.table_schema}`)
  );
  const filteredSchemas = schemaOptions.filter(s =>
    s.toLowerCase().includes(schemaSearch.toLowerCase())
  );

  const tableOptions = getUnique(
    data
      .filter(d =>
        selectedConnections.includes(d.connection_name) &&
        selectedSchemas.includes(`${d.connection_name}.${d.table_schema}`)
      )
      .map(d => `${d.connection_name}.${d.table_schema}.${d.table_name}`)
  );
  const filteredTables = tableOptions.filter(t =>
    t.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const columnOptions = getUnique(
    data
      .filter(d =>
        selectedConnections.includes(d.connection_name) &&
        selectedSchemas.includes(`${d.connection_name}.${d.table_schema}`) &&
        selectedTables.includes(`${d.connection_name}.${d.table_schema}.${d.table_name}`)
      )
      .flatMap(d =>
        d.column_json.map(col =>
          `${d.connection_name}.${d.table_schema}.${d.table_name}.${col.column_name}`
        )
      )
  );
  const filteredColumns = columnOptions.filter(col =>
    col.toLowerCase().includes(columnSearch.toLowerCase())
  );

  const handleSelection = (setter, resetList = []) => (value) => {
    setter(prev => {
      if (prev.includes(value)) {
        return prev.filter(item => item !== value);
      }
      return [...prev, value];
    });
    resetList.forEach(reset => reset([]));
    setIsStep3Modified(true);
  };

  const handleSelectAll = (options, setter, resetList = []) => {
    setter(prev => {
      if (options.every(option => prev.includes(option))) {
        return [];
      }
      return [...new Set([...prev, ...options])];
    });
    resetList.forEach(reset => reset([]));
    setIsStep3Modified(true);
  };

  const toggleDropdown = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const renderSearchableSelect = (label, options, selectedValues, setSelectedValues, searchValue, setSearchValue, resetList = []) => {
    const allFilteredSelected = options.every(option => selectedValues.includes(option));
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
              <input
                type="text"
                placeholder="Search..."
                className="w-full p-2 border-b border-gray-200 outline-none"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              <div className="flex items-center p-2 border-b border-gray-200 hover:bg-gray-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  ref={el => el && (el.indeterminate = someFilteredSelected)}
                  onChange={() => handleSelectAll(options, setSelectedValues, resetList)}
                  className="mr-2"
                />
                <span className="font-medium">Select All</span>
              </div>
            </div>
            {options.map((option) => (
              <div
                key={option}
                className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelection(setSelectedValues, resetList)(option)}
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  readOnly
                  className="mr-2"
                />
                <span>{option}</span>
              </div>
            ))}
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-700 mb-2">{name}</h3>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {renderSearchableSelect(
          'Connection',
          filteredConnections,
          selectedConnections,
          setSelectedConnections,
          connectionSearch,
          setConnectionSearch,
          [setSelectedSchemas, setSelectedTables, setSelectedColumns]
        )}
        {renderSearchableSelect(
          'Schema',
          filteredSchemas,
          selectedSchemas,
          setSelectedSchemas,
          schemaSearch,
          setSchemaSearch,
          [setSelectedTables, setSelectedColumns]
        )}
        {renderSearchableSelect(
          'Table',
          filteredTables,
          selectedTables,
          setSelectedTables,
          tableSearch,
          setTableSearch,
          [setSelectedColumns]
        )}
        {renderSearchableSelect(
          'Column',
          filteredColumns,
          selectedColumns,
          setSelectedColumns,
          columnSearch,
          setColumnSearch
        )}
      </div>
    </div>
  );
};

export default Step3;