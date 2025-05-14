import { useAuth } from '../../../../context/AuthContext';
import { useEffect, useState } from 'react';

const Step3 = ({ name, onDataChange, initialData }) => {
  const { token } = useAuth();

  const [data, setData] = useState([]);
  const [selectedConnections, setSelectedConnections] = useState([]);
  const [selectedSchemas, setSelectedSchemas] = useState([]);
  const [selectedTables, setSelectedTables] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [connectionSearch, setConnectionSearch] = useState('');
  const [schemaSearch, setSchemaSearch] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [columnSearch, setColumnSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    onDataChange({
      selectedConnections,
      selectedSchemas,
      selectedTables,
      selectedColumns
    });
  }, [selectedConnections, selectedSchemas, selectedTables, selectedColumns]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/connectionscreen`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const responseData = await response.json();
      setData(responseData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
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
  };

  const toggleDropdown = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const renderSearchableSelect = (label, options, selectedValues, setSelectedValues, searchValue, setSearchValue, resetList = []) => (
    <div className="relative">
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
          <input
            type="text"
            placeholder="Search..."
            className="w-full p-2 border-b border-gray-200 outline-none"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
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