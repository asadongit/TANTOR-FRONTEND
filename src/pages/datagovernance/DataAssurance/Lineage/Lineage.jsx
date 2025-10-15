import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Search, PlusCircle, XCircle, ChevronLeft, ChevronRight, X, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import Breadcrumb from '../../../../components/Breadcrumb';
import { useAuth } from '../../../../context/AuthContext';
import { secureQuery } from '../../DataCatalogue/Components/function';
import DataLineageFlow from './DataLineageFlow';

const API_BASE_URL = `${window._env_?.VITE_FAST_API}/data_lineage`;

// Helper function to truncate text and show tooltip
const TruncatedText = ({ text, maxLength = 20, className = "" }) => {
  const truncated = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  const needsTooltip = text.length > maxLength;

  return (
    <span
      className={className}
      title={needsTooltip ? text : ''}
    >
      {truncated}
    </span>
  );
};

const TableSearch = ({ searchTerm, onSearchChange, onClearSearch, totalResults, filteredResults }) => {
  return (
    <div className="mb-4 flex items-center justify-end">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search in table..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#8d77ba] focus:border-[#8d77ba] outline-none"
        />
        {searchTerm && (
          <button
            onClick={onClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
            title="Clear search"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>
      {searchTerm && (
        <div className="text-sm text-gray-600 ml-4">
          Showing {filteredResults} of {totalResults} items
        </div>
      )}
    </div>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  if (!totalItems || totalPages <= 1) return null;
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center p-2 text-sm text-gray-700 border-t gap-2">
      <span>
        Showing <span className="font-semibold">{startItem}</span>-
        <span className="font-semibold">{endItem}</span> of <span className="font-semibold">{totalItems}</span>
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50" title="Back">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="px-3 py-1 font-medium">Page {currentPage} of {totalPages}</span>
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50" title="Next">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

const MultiSelectDropdown = ({ title, options, selected, toggleOption, hasSelectAll = false, disabled = false, disabledText = "Select previous filters first", onOpen, isLoading = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = React.useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const filteredOptions = options.filter(option => option.toLowerCase().includes(searchTerm.toLowerCase()));
  const handleButtonClick = () => { if (!isOpen && onOpen) onOpen(); setIsOpen(!isOpen); };
  const buttonText = selected.length > 0 ? selected.join(', ') : `Select ${title}`;
  const tooltipText = selected.length > 0 ? selected.join(', ') : '';
  if (disabled) {
    return (
      <div className="w-full sm:w-64">
        <label className="text-sm font-medium text-gray-700">{title}</label>
        <button disabled className="mt-1 flex justify-between items-center w-full px-4 py-2 bg-gray-100 border rounded-md text-left cursor-not-allowed">
          <span className="truncate text-gray-400">{disabledText}</span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    );
  }
  return (
    <div className="relative w-full sm:w-64" ref={dropdownRef}>
      <label className="text-sm font-medium text-gray-700">{title}</label>
      <button onClick={handleButtonClick} title={tooltipText} className="mt-1 flex justify-between items-center w-full px-4 py-2 bg-white border rounded-md shadow-sm text-left">
        <span className="truncate text-gray-600">{buttonText}</span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
          {isLoading ? (<div className="p-4 text-sm text-center text-gray-500">Loading...</div>) : (
            <>
              <div className="p-2"><div className="relative"><Search className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 h-4 w-4" /><input type="text" placeholder="Search..." className="w-full pl-9 pr-3 py-2 border rounded-md" onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
              <ul className="py-1 max-h-60 overflow-y-auto">
                {hasSelectAll && options.length > 0 && (<li className="px-4 py-2 hover:bg-gray-100"><label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" onChange={() => toggleOption(options, true)} checked={selected.length === options.length} /><span>Select All</span></label></li>)}
                {options.length === 0 && <li className="px-4 py-2 text-sm text-gray-500">No options available</li>}
                {filteredOptions.map((option) => (<li key={option} className="px-4 py-2 hover:bg-gray-100"><label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={selected.includes(option)} onChange={() => toggleOption([option])} /><span>{option}</span></label></li>))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const LineageFilters = ({
  connectionOptions, selectedConnections, handleConnectionsToggle, isConnectionsLoading,
  databaseOptions, selectedDatabases, handleDatabasesToggle, handleDatabaseOpen, isDatabaseLoading,
  schemaOptions, selectedSchemas, handleSchemasToggle, handleSchemaOpen, isSchemaLoading,
  typeOptions, selectedTypes, handleTypesToggle,
  fetchTableData, isShowDataDisabled
}) => {
  return (
    <div className="flex flex-wrap gap-4 items-end">
      <MultiSelectDropdown title="Database" options={connectionOptions} selected={selectedConnections} toggleOption={handleConnectionsToggle} isLoading={isConnectionsLoading} />
      <MultiSelectDropdown title="Connection" options={databaseOptions} selected={selectedDatabases} toggleOption={handleDatabasesToggle} disabled={selectedConnections.length === 0} disabledText="Select a Connection" onOpen={handleDatabaseOpen} isLoading={isDatabaseLoading} />
      <MultiSelectDropdown title="Schema" options={schemaOptions} selected={selectedSchemas} toggleOption={handleSchemasToggle} disabled={selectedDatabases.length === 0} disabledText="Select a Database" onOpen={handleSchemaOpen} isLoading={isSchemaLoading} />
      <MultiSelectDropdown title="Type" options={typeOptions} selected={selectedTypes} toggleOption={handleTypesToggle} hasSelectAll={true} disabled={selectedSchemas.length === 0} disabledText="Select a Schema" />
      <button onClick={fetchTableData} disabled={isShowDataDisabled} className="px-4 py-2 bg-[#8d77ba] text-white font-semibold rounded-md shadow-sm hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed">
        Show Data
      </button>
    </div>
  );
};

const LineageTable = ({
  isTableLoading, tableData, paginatedData, currentPage, itemsPerPage, toggleLineageItem, isItemInLineage,
  totalPages, handlePageChange, onVisualize, hasLineageItems, searchTerm, onSearchChange, onClearSearch, filteredData,
  sortConfig, onSort
}) => {
  
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4 inline-block ml-1 opacity-40" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 inline-block ml-1" /> : <ArrowDown className="h-4 w-4 inline-block ml-1" />;
  };

  if (isTableLoading) {
    return <p className="text-center">Loading data...</p>;
  }
  
  if (tableData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-lg">No data available</p>
      </div>
    );
  }
  
  return (
    <>
      <TableSearch 
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        onClearSearch={onClearSearch}
        totalResults={tableData.length}
        filteredResults={filteredData.length}
      />
      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#29304a] text-white">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Id</th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                onClick={() => onSort('connection')}
              >
                <span className="inline-flex items-center">
                  Database
                  {getSortIcon('connection')}
                </span>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                onClick={() => onSort('database')}
              >
                <span className="inline-flex items-center">
                  Connection
                  {getSortIcon('database')}
                </span>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                onClick={() => onSort('schemaToShow')}
              >
                <span className="inline-flex items-center">
                  Schema
                  {getSortIcon('schemaToShow')}
                </span>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                onClick={() => onSort('name')}
              >
                <span className="inline-flex items-center">
                  Name
                  {getSortIcon('name')}
                </span>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                onClick={() => onSort('type')}
              >
                <span className="inline-flex items-center">
                  Type
                  {getSortIcon('type')}
                </span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Lineage</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  {searchTerm ? 'No items match your search criteria' : 'No data to display'}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr key={`${item.name}-${index}`} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <TruncatedText text={item.connection} maxLength={17} />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <TruncatedText text={item.database} maxLength={30} />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <TruncatedText text={item.schemaToShow} maxLength={35} />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-1/4 min-w-[200px]">
                    <TruncatedText text={item.name} maxLength={35} />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.type}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => toggleLineageItem(item)}
                      title={isItemInLineage(item) ? 'Remove from Lineage' : 'Add to Lineage'}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      {isItemInLineage(item) ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <PlusCircle className="h-5 w-5 text-gray-400 hover:text-[#8d77ba]" />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} totalItems={filteredData.length} itemsPerPage={itemsPerPage} />
      </div>
      <div className="mt-8 flex justify-end">
        <button
          onClick={onVisualize}
          disabled={!hasLineageItems}
          className="px-6 py-2 bg-[#8d77ba] text-white font-semibold rounded-md shadow-sm hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Visualize
        </button>
      </div>
    </>
  );
};

function EnhancedLineage() {
  const { token } = useAuth();
  const [currentView, setCurrentView] = useState('selection');
  const [currentTableIndex, setCurrentTableIndex] = useState(0);

  const [connectionOptions, setConnectionOptions] = useState([]);
  const [databaseOptions, setDatabaseOptions] = useState([]);
  const [schemaOptions, setSchemaOptions] = useState([]);
  const typeOptions = ['Tables', 'Views', 'Columns'];
  const [selectedConnections, setSelectedConnections] = useState([]);
  const [selectedDatabases, setSelectedDatabases] = useState([]);
  const [selectedSchemas, setSelectedSchemas] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [lineageItems, setLineageItems] = useState(new Set());
  const [policyIds, setPolicyIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({});

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDatabaseLoading, setIsDatabaseLoading] = useState(false);
  const [isSchemaLoading, setIsSchemaLoading] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return tableData;
    
    const searchLower = searchTerm.toLowerCase().trim();
    return tableData.filter(item => 
      item.connection.toLowerCase().includes(searchLower) ||
      item.database.toLowerCase().includes(searchLower) ||
      item.schemaToShow.toLowerCase().includes(searchLower) ||
      item.name.toLowerCase().includes(searchLower) ||
      item.type.toLowerCase().includes(searchLower)
    );
  }, [tableData, searchTerm]);

  const filteredAndSortedData = useMemo(() => {
    let sorted = [...filteredData];

    if (sortConfig.key) {
      sorted.sort((a, b) => {
        let aValue = a[sortConfig.key] ?? '';
        let bValue = b[sortConfig.key] ?? '';

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [filteredData, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortConfig]);
  
  useEffect(() => {
    if (!token) {
      setIsInitialLoading(false);
      return;
    }

    const initializeLineageFilters = async () => {
      try {
        const policyResponse = await secureQuery({ user_query: "" }, token);
        const fetchedPolicyIds = policyResponse.matched_policy_ids || [];
        setPolicyIds(fetchedPolicyIds);

        if (fetchedPolicyIds.length > 0) {
          const connectionsResponse = await fetch(`${API_BASE_URL}/get_connection_type`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
            body: JSON.stringify({ matched_policy_ids: fetchedPolicyIds }),
          });

          if (!connectionsResponse.ok) {
            throw new Error(`Connection API error! status: ${connectionsResponse.status}`);
          }
          
          const connectionsData = await connectionsResponse.json();
          setConnectionOptions(connectionsData);
        }
        
      } catch (error) {
        console.error("Failed to initialize lineage filters:", error);
        setPolicyIds([]);
        setConnectionOptions([]);
      } finally {
        setIsInitialLoading(false);
      }
    };

    initializeLineageFilters();
  }, [token]);

  useEffect(() => { setSelectedDatabases([]); setDatabaseOptions([]); }, [selectedConnections]);
  useEffect(() => { setSelectedSchemas([]); setSchemaOptions([]); }, [selectedDatabases]);
  useEffect(() => { setSelectedTypes([]); setTableData([]); setSearchTerm(''); setSortConfig({}); }, [selectedSchemas]);
  useEffect(() => { setTableData([]); setSearchTerm(''); setSortConfig({}); }, [selectedTypes]);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleDatabaseOpen = async () => {
    if (selectedConnections.length > 0 && databaseOptions.length === 0) {
      setIsDatabaseLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/get_connection_name`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
          body: JSON.stringify({
            matched_policy_ids: policyIds,
            connection_type: selectedConnections,
          }),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setDatabaseOptions(data);
      } catch (error) {
        console.error("Error fetching databases:", error);
      } finally {
        setIsDatabaseLoading(false);
      }
    }
  };

  const handleSchemaOpen = async () => {
    if (selectedDatabases.length > 0 && schemaOptions.length === 0) {
      setIsSchemaLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/get_schema_name`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
          body: JSON.stringify({
            matched_policy_ids: policyIds,
            connection_name: selectedDatabases,
          }),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const allSchemas = data.flatMap(dbSchemaObject =>
          Object.entries(dbSchemaObject).flatMap(([dbName, schemaArray]) =>
            schemaArray.map(schemaName => `${dbName}.${schemaName}`)
          )
        );
        setSchemaOptions([...new Set(allSchemas)]);
      } catch (error) {
        console.error("Error fetching schemas:", error);
      } finally {
        setIsSchemaLoading(false);
      }
    }
  };

  const fetchTableData = async () => {
    if (policyIds.length === 0 || selectedTypes.length === 0 || selectedSchemas.length === 0) return;
    setLineageItems(new Set());
    setIsTableLoading(true);
    setTableData([]);
    setSearchTerm('');
    setSortConfig({});
    setCurrentPage(1);
    try {
      const payload = {
        matched_policy_ids: policyIds,
        connection: selectedConnections,
        database: selectedDatabases,
        database_schema: selectedSchemas,
        type: selectedTypes.map(t => t.toLowerCase().slice(0, -1))
      };
      const response = await fetch(`${API_BASE_URL}/table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      const tables = (data.tables || []).map(item => ({
        connection: item.connection_type,
        database: item.connection_name,
        schema: item.table_schema,
        table: item.table_name,
        schemaToShow: item.table_schema.split('.')[1] || item.table_schema,
        name: item.table_name.split('.')[2] || item.table_name,
        type: 'Table'
      }));

      const columns = (data.columns || []).map(item => ({
        connection: item.connection_type,
        database: item.connection_name,
        schema: item.table_schema,
        table: item.table_name,
        column: item.column_name,
        schemaToShow: item.table_schema.split('.')[1] || item.table_schema,
        name: item.column_name.split('.').slice(2).join('.') || item.column_name,
        type: 'Column'
      }));

      const views = (data.views || []).map(item => {
        const connection = item.connection_type.length === 1 ? item.connection_type[0] : item.connection_type.join(' + ');
        const database = item.connection_name.length === 1 ? item.connection_name[0] : item.connection_name.join(' + ');
        const schemaToShow = item.table_schema.length === 1 ? (item.table_schema[0].split('.')[1] || item.table_schema[0]) : item.table_schema.join(' + ');
        return {
          connection,
          database,
          schemaToShow,
          name: item.view_name,
          type: 'View',
          viewMetadata: {
            connection_type: item.connection_type,
            connection_name: item.connection_name,
            table_schema: item.table_schema,
            table_name: item.table_name
          }
        };
      });

      const allItems = [...tables, ...columns, ...views];
      const uniqueItems = [];
      const seen = new Set();
      
      for (const item of allItems) {
        const identifier = `${item.connection}-${item.database}-${item.schemaToShow}-${item.name}-${item.type}`;
        if (!seen.has(identifier)) {
          seen.add(identifier);
          uniqueItems.push(item);
        }
      }

      setTableData(uniqueItems);
    } catch (error) {
      console.error("Error fetching table data:", error);
      setTableData([]);
    } finally {
      setIsTableLoading(false);
    }
  };

  const createToggleHandler = (setter) => (optionsToToggle, isSelectAll = false) => {
    if (isSelectAll) {
      const allOptionsSet = new Set(optionsToToggle);
      setter(prev => prev.length === allOptionsSet.size ? [] : Array.from(allOptionsSet));
      return;
    }
    const option = optionsToToggle[0];
    setter(currentSelected => {
      const newSelected = new Set(currentSelected);
      if (newSelected.has(option)) {
        newSelected.delete(option);
      } else {
        newSelected.add(option);
      }
      return Array.from(newSelected);
    });
  };

  const toggleLineageItem = (item) => {
    setLineageItems(prev => {
      const newSet = new Set(prev);
      const itemIdentifier = JSON.stringify(item);
      let found = false;
      for (let val of newSet) {
        if (val === itemIdentifier) {
          newSet.delete(val);
          found = true;
          break;
        }
      }
      if (!found) newSet.add(itemIdentifier);
      return newSet;
    });
  };

  const isItemInLineage = (item) => lineageItems.has(JSON.stringify(item));
  const isShowDataDisabled = selectedConnections.length === 0 || selectedDatabases.length === 0 || selectedSchemas.length === 0 || selectedTypes.length === 0;
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const handlePageChange = (page) => { if (page > 0 && page <= totalPages) setCurrentPage(page); };
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedData, currentPage]);

  const handleConnectionsToggle = createToggleHandler(setSelectedConnections);
  const handleDatabasesToggle = createToggleHandler(setSelectedDatabases);
  const handleSchemasToggle = createToggleHandler(setSelectedSchemas);
  const handleTypesToggle = createToggleHandler(setSelectedTypes);

  const selectedItemsForVisualization = useMemo(() => {
    return Array.from(lineageItems).map(item => JSON.parse(item));
  }, [lineageItems]);

  const handleVisualize = () => {
    if (lineageItems.size > 0) {
      setCurrentView('visualization');
      setCurrentTableIndex(0);
      window.scrollTo(0, 0);
    }
  };

  const handleBackToSelection = () => setCurrentView('selection');

  const handleTableNavigation = (direction) => {
    if (direction === 'next' && currentTableIndex < selectedItemsForVisualization.length - 1) {
      setCurrentTableIndex(prev => prev + 1);
    } else if (direction === 'prev' && currentTableIndex > 0) {
      setCurrentTableIndex(prev => prev - 1);
    }
  };

  if (currentView === 'selection') {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <Breadcrumb />
        <main className="mt-6">
          <div className="p-6 pb-8 bg-white rounded-lg shadow mb-5">
            <LineageFilters
              connectionOptions={connectionOptions}
              selectedConnections={selectedConnections}
              handleConnectionsToggle={handleConnectionsToggle}
              isConnectionsLoading={isInitialLoading}
              databaseOptions={databaseOptions}
              selectedDatabases={selectedDatabases}
              handleDatabasesToggle={handleDatabasesToggle}
              handleDatabaseOpen={handleDatabaseOpen}
              isDatabaseLoading={isDatabaseLoading}
              schemaOptions={schemaOptions}
              selectedSchemas={selectedSchemas}
              handleSchemasToggle={handleSchemasToggle}
              handleSchemaOpen={handleSchemaOpen}
              isSchemaLoading={isSchemaLoading}
              typeOptions={typeOptions}
              selectedTypes={selectedTypes}
              handleTypesToggle={handleTypesToggle}
              fetchTableData={fetchTableData}
              isShowDataDisabled={isShowDataDisabled}
            />
          </div>
          {(isTableLoading || tableData.length > 0) && (
            <div className="p-6 bg-white rounded-lg shadow">
              <LineageTable
                isTableLoading={isTableLoading}
                tableData={tableData}
                paginatedData={paginatedData}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                toggleLineageItem={toggleLineageItem}
                isItemInLineage={isItemInLineage}
                totalPages={totalPages}
                handlePageChange={handlePageChange}
                onVisualize={handleVisualize}
                hasLineageItems={lineageItems.size > 0}
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                onClearSearch={handleClearSearch}
                filteredData={filteredAndSortedData}
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <DataLineageFlow
      selectedItems={selectedItemsForVisualization}
      currentTableIndex={currentTableIndex}
      onNavigate={handleTableNavigation}
      onBack={handleBackToSelection}
      policyIds={policyIds}
    />
  );
}

export default EnhancedLineage;