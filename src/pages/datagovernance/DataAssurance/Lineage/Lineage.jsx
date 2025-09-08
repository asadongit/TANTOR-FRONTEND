import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChevronDown, Search, PlusCircle, XCircle, ChevronLeft, ChevronRight, Table, Minimize2, Maximize2 } from 'lucide-react';
import Breadcrumb from '../../../../components/Breadcrumb';
import { useAuth } from '../../../../context/AuthContext';
import { secureQuery } from '../../DataCatalogue/Components/function';
import DataLineageFlow from './DataLineageFlow';

const API_BASE_URL = `${window._env_?.VITE_FAST_API}/data_lineage`;

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
  const dropdownRef = useRef(null);
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
                {options.length === 0 && !hasSelectAll && <li className="px-4 py-2 text-sm text-gray-500">No options available</li>}
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
  connectionOptions, selectedConnections, handleConnectionsToggle, handleConnectionsOpen, isConnectionsLoading,
  databaseOptions, selectedDatabases, handleDatabasesToggle, handleDatabaseOpen, isDatabaseLoading,
  schemaOptions, selectedSchemas, handleSchemasToggle, handleSchemaOpen, isSchemaLoading,
  typeOptions, selectedTypes, handleTypesToggle,
  fetchTableData, isShowDataDisabled
}) => {
  return (
    <div className="flex flex-wrap gap-4 items-end">
      <MultiSelectDropdown title="Connections" options={connectionOptions} selected={selectedConnections} toggleOption={handleConnectionsToggle} onOpen={handleConnectionsOpen} isLoading={isConnectionsLoading} />
      <MultiSelectDropdown title="Database" options={databaseOptions} selected={selectedDatabases} toggleOption={handleDatabasesToggle} disabled={selectedConnections.length === 0} disabledText="Select a Connection" onOpen={handleDatabaseOpen} isLoading={isDatabaseLoading} />
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
  totalPages, handlePageChange, onVisualize, hasLineageItems
}) => {
  if (isTableLoading) {
    return <p className="text-center">Loading data...</p>;
  }
  if (tableData.length === 0) {
    return null;
  }
  return (
    <>
      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#29304a] text-white">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Id</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Connection</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Database</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Schema</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Lineage</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((item, index) => (
              <tr key={`${item.name}-${index}`} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.connection}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.database}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.schema}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
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
            ))}
          </tbody>
        </table>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} totalItems={tableData.length} itemsPerPage={itemsPerPage} />
      </div>
      <div className="mt-8 flex justify-end">
        <button
          onClick={onVisualize}
          disabled={!hasLineageItems}
          className="px-6 py-2 bg-[#8d77ba] text-white font-semibold rounded-md shadow-sm hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Visualize ({hasLineageItems ? Array.from(hasLineageItems).length : 0})
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
  const [isConnectionsLoading, setIsConnectionsLoading] = useState(false);
  const [isDatabaseLoading, setIsDatabaseLoading] = useState(false);
  const [isSchemaLoading, setIsSchemaLoading] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (token) {
      (async () => {
        try {
          const response = await secureQuery({ user_query: "" }, token);
          setPolicyIds(response.matched_policy_ids || []);
        } catch (error) {
          console.error("Failed to fetch policy IDs:", error);
          setPolicyIds([]);
        }
      })();
    }
  }, [token]);

  useEffect(() => { setSelectedDatabases([]); setDatabaseOptions([]); }, [selectedConnections]);
  useEffect(() => { setSelectedSchemas([]); setSchemaOptions([]); }, [selectedDatabases]);
  useEffect(() => { setSelectedTypes([]); setTableData([]); }, [selectedSchemas]);
  useEffect(() => { setTableData([]); }, [selectedTypes]);

  const handleConnectionsOpen = async () => {
    if (policyIds.length > 0 && connectionOptions.length === 0) {
      setIsConnectionsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/get_connection_type`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify({ matched_policy_ids: policyIds }),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setConnectionOptions(data);
      } catch (error) {
        console.error("Error fetching connection types:", error);
      } finally {
        setIsConnectionsLoading(false);
      }
    }
  };

  const handleDatabaseOpen = async () => {
    if (selectedConnections.length > 0 && databaseOptions.length === 0) {
      setIsDatabaseLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/get_connection_name`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
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
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const tables = (data.tables || []).map(item => ({
        connection: item.connection_type,
        database: item.connection_name,
        schema: item.table_schema.split('.')[1] || item.table_schema,
        name: item.table_name,
        type: 'Table'
      }));

      const columns = (data.columns || []).map(item => ({
        connection: item.connection_type,
        database: item.connection_name,
        schema: item.table_schema.split('.')[1] || item.table_schema,
        name: `${item.table_name}.${item.column_name}`,
        type: 'Column'
      }));
      setTableData([...tables, ...columns]);
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
  const totalPages = Math.ceil(tableData.length / itemsPerPage);
  const handlePageChange = (page) => { if (page > 0 && page <= totalPages) setCurrentPage(page); };
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return tableData.slice(startIndex, startIndex + itemsPerPage);
  }, [tableData, currentPage]);

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

  const handleBackToSelection = () => {
    setCurrentView('selection');
  };

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
              handleConnectionsOpen={handleConnectionsOpen}
              isConnectionsLoading={isConnectionsLoading}
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
                hasLineageItems={lineageItems}
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
    />
  );
}

export default EnhancedLineage;