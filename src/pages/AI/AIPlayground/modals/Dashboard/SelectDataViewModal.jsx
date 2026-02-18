import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Search } from 'lucide-react';
import { useAIPlayground } from '../../../../../context/AIPlaygroundContext';
import { useAuth } from '../../../../../context/AuthContext';

export const SelectDataViewModal = ({ isOpen, onClose, onProceed }) => {
  const hostnameAI = window._env_?.VITE_AI_API;
  const { token, decodedToken } = useAuth();
  const { setDatasetState, projectState } = useAIPlayground();
  const [selectedTable, setSelectedTable] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [schemaInfo, setSchemaInfo] = useState(null); // store schema/connection from tables API response

  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchTables();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  const fetchTables = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const secureQueryResponse = await fetch(
        `${window._env_?.VITE_FAST_API}/secure-query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_query: "" }),
        }
      );

      if (!secureQueryResponse.ok) {
        throw new Error("Failed to fetch policy IDs");
      }

      const secureQueryData = await secureQueryResponse.json();
      const policyIds = secureQueryData.matched_policy_ids;

      const response = await fetch(`${hostnameAI}/schemas/source-schema/tables`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          policy_id: policyIds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tables");
      }

      const data = await response.json();

      setSchemaInfo({
        schema: data.schema,
        connection: data.connection,
      });

      const tables = data.tables.map((table) => ({
        value: table,
        label: table,
      }));
      setAvailableTables(tables);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching tables:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBusinessTags = async (tableName) => {
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/data_catalogue/business_tab`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          connection_set: [{
            connection_name: schemaInfo?.connection,
            table_schema: schemaInfo?.schema,
            table_name: tableName,
          }],
        }),
      });

      if (!response.ok) {
        console.error('Failed to fetch business tags, proceeding without them');
        return null;
      }

      const data = await response.json();

      const key = `${schemaInfo?.connection}:${schemaInfo?.schema}:${tableName}`;
      const tableData = data[key];

      if (!tableData?.table_tags) return null;

      const { domain, category, sub_category, tag, sub_tag } = tableData.table_tags;

      const extractNames = (arr) =>
        arr?.length ? arr.map((item) => item.name).join(',') : '';

      return {
        domain: extractNames(domain),
        category: extractNames(category),
        sub_category: extractNames(sub_category),
        tag: extractNames(tag),
        sub_tag: extractNames(sub_tag),
      };
    } catch (err) {
      console.error('Error fetching business tags, proceeding without them:', err);
      return null;
    }
  };

  const handleProceed = async () => {
    if (!selectedTable) return;

    setIsIngesting(true);
    setError(null);

    try {
      const projectName = projectState.selectedProject;

      const secureQueryResponse = await fetch(
        `${window._env_?.VITE_FAST_API}/secure-query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_query: "" }),
        }
      );

      if (!secureQueryResponse.ok) {
        throw new Error("Failed to fetch policy IDs");
      }

      const secureQueryData = await secureQueryResponse.json();
      const policyIds = secureQueryData.matched_policy_ids;

      const businessTags = await fetchBusinessTags(selectedTable);

      const payload = {
        table_name: selectedTable,
        project_name: projectName,
        profiling_required: true,
        user_name: decodedToken.preferred_username,
        domain: businessTags?.domain ? businessTags.domain.split(',') : [],
        category: businessTags?.category ? businessTags.category.split(',') : [],
        sub_category: businessTags?.sub_category ? businessTags.sub_category.split(',') : [],
        tag: businessTags?.tag ? businessTags.tag.split(',') : [],
        sub_tag: businessTags?.sub_tag ? businessTags.sub_tag.split(',') : [],
        policy_id: policyIds,
      };

      const response = await fetch(`${hostnameAI}/data/ingestion`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Data ingestion failed: ${response.status}`);
      }

      const data = await response.json();

      setDatasetState({
        tableName: selectedTable,
        sessionId: data.session_id,
        columnNames: data.column_names || [],
        profileReportHtml: data.profile_report_html || '',
      });

      const selectedTableData = availableTables.find(v => v.value === selectedTable);
      onProceed(selectedTableData);
      handleClose();
    } catch (err) {
      setError(err.message);
      console.error('Error during data ingestion:', err);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleClose = () => {
    setSelectedTable('');
    setIsDropdownOpen(false);
    setSearchQuery('');
    setError(null);
    onClose();
  };

  const handleSelectTable = (value) => {
    setSelectedTable(value);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const filteredTables = availableTables.filter(table =>
    table.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Select Data Table</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            disabled={isIngesting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-slate-600 mb-4">
            Choose a pre-configured database table to fetch data without uploading a file.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">Error: {error}</p>
            </div>
          )}

          {isIngesting && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-600">Ingesting data and generating profile report...</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Available Tables <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isLoading || availableTables.length === 0 || isIngesting}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={selectedTable ? 'text-slate-900' : 'text-slate-400'}>
                  {isLoading
                    ? 'Loading tables...'
                    : selectedTable
                      ? availableTables.find(v => v.value === selectedTable)?.label
                      : availableTables.length === 0
                        ? 'No tables available'
                        : 'Select'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isDropdownOpen && !isLoading && availableTables.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg z-10">
                  <div className="p-2 border-b border-slate-200">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tables..."
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredTables.length > 0 ? (
                      filteredTables.map((table) => (
                        <button
                          key={table.value}
                          onClick={() => handleSelectTable(table.value)}
                          className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          {table.label}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-slate-400 text-center">
                        No tables found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isIngesting}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleProceed}
            disabled={!selectedTable || isIngesting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#8e78b7] rounded-md hover:bg-[#7d6ba0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isIngesting ? 'Processing...' : 'Proceed'}
          </button>
        </div>
      </div>
    </div>
  );
};