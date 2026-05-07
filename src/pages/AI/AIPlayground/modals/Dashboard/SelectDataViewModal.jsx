import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown } from 'lucide-react';
import SearchIcon from '../../../../../assets/ai/search.svg';
import { useAIPlayground } from '../../../../../context/AIPlaygroundContext';
import { useAuth } from '../../../../../context/AuthContext';
import { tw, aithemestyle } from '../../../../../components/themeContext';

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
  const [schemaInfo, setSchemaInfo] = useState(null);

  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) fetchTables();
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    };
    if (isDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isDropdownOpen]);

  const fetchTables = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const secureQueryResponse = await fetch(`${window._env_?.VITE_FAST_API}/secure-query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_query: '' }),
      });
      if (!secureQueryResponse.ok) throw new Error('Failed to fetch policy IDs');
      const secureQueryData = await secureQueryResponse.json();
      const policyIds = secureQueryData.matched_policy_ids;

      const response = await fetch(`${hostnameAI}/schemas/source-schema/tables`, {
        method: 'POST',
        headers: { accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy_id: policyIds }),
      });
      if (!response.ok) throw new Error('Failed to fetch tables');
      const data = await response.json();
      setSchemaInfo({ schema: data.schema, connection: data.connection });
      setAvailableTables(data.tables.map((table) => ({ value: table, label: table })));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBusinessTags = async (tableName) => {
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/data_catalogue/business_tab`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', accept: 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          connection_set: [{ connection_name: schemaInfo?.connection, table_schema: schemaInfo?.schema, table_name: tableName }],
        }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      const key = `${schemaInfo?.connection}:${schemaInfo?.schema}:${tableName}`;
      const tableData = data[key];
      if (!tableData?.table_tags) return null;
      const { domain, category, sub_category, tag, sub_tag } = tableData.table_tags;
      const extractNames = (arr) => arr?.length ? arr.map((item) => item.name).join(',') : '';
      return {
        domain: extractNames(domain), category: extractNames(category),
        sub_category: extractNames(sub_category), tag: extractNames(tag), sub_tag: extractNames(sub_tag),
      };
    } catch {
      return null;
    }
  };

  const handleProceed = async () => {
    if (!selectedTable) return;
    setIsIngesting(true);
    setError(null);
    try {
      const projectName = projectState.selectedProject;
      const secureQueryResponse = await fetch(`${window._env_?.VITE_FAST_API}/secure-query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_query: '' }),
      });
      if (!secureQueryResponse.ok) throw new Error('Failed to fetch policy IDs');
      const secureQueryData = await secureQueryResponse.json();
      const policyIds = secureQueryData.matched_policy_ids;
      const businessTags = await fetchBusinessTags(selectedTable);

      const payload = {
        table_name: selectedTable, project_name: projectName, profiling_required: true,
        user_name: decodedToken.preferred_username,
        domain: businessTags?.domain ? businessTags.domain.split(',') : [],
        category: businessTags?.category ? businessTags.category.split(',') : [],
        sub_category: businessTags?.sub_category ? businessTags.sub_category.split(',') : [],
        tag: businessTags?.tag ? businessTags.tag.split(',') : [],
        sub_tag: businessTags?.sub_tag ? businessTags.sub_tag.split(',') : [],
        policy_id: policyIds,
      };

      const response = await fetch(`${hostnameAI}/ingestion/ingestion`, {
        method: 'POST',
        headers: { accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Data ingestion failed: ${response.status}`);
      const data = await response.json();

      setDatasetState({
        tableName: selectedTable, ensembleId: data.ensemble_id,
        columnNames: data.column_names || [], profileReportHtml: data.profile_report_html || '',
      });

      onProceed(availableTables.find((v) => v.value === selectedTable));
      handleClose();
    } catch (err) {
      setError(err.message);
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

  const filteredTables = availableTables.filter((t) =>
    t.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isHighlighted = isDropdownOpen;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000099] flex items-center justify-center z-50">

      <div className="bg-white rounded-lg shadow-xl w-full max-w-[390px]">

        <div className="flex items-center justify-between px-6 py-5">
          <h2 className={tw.sectionHeading}>Select Data Table</h2>
          <button
            onClick={handleClose}
            disabled={isIngesting}
            className="text-[#818181] hover:text-[#332849] transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 mb-10">
          <p className={`${tw.label} mb-5`}>
            Choose a pre-configured database table to fetch data without uploading a file.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className={`${tw.caption} text-red-600`}>Error: {error}</p>
            </div>
          )}

          {/* Label */}
          <label className={`${tw.label} mb-2 block`}>Available Tables</label>

          {/* Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isLoading || availableTables.length === 0 || isIngesting}
              className={`w-full px-3 py-2 rounded-md flex items-center justify-between focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all ${tw.label}`}
              style={{
                border: isHighlighted ? '1.5px solid #c4b8e0' : '1.5px solid #e5e7eb',
                backgroundColor: isHighlighted ? '#f0ecfa' : '#ffffff',
              }}
            >
              <span className={selectedTable ? 'text-[#332849]' : 'text-[#818181]'}>
                {isLoading
                  ? 'Loading...'
                  : selectedTable
                  ? availableTables.find((v) => v.value === selectedTable)?.label
                  : availableTables.length === 0
                  ? 'No tables available'
                  : 'Select'}
              </span>
              <ChevronDown className="w-4 h-4 text-[#818181]" />
            </button>

            {isDropdownOpen && !isLoading && availableTables.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <img src={SearchIcon} alt="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className={`w-full pl-9 pr-3 py-1.5 rounded-md
              border border-slate-200
              font-satoshi text-sm font-normal text-[#332849] leading-none tracking-normal
              placeholder:text-[#818181]
              focus:outline-none focus:border-[#8e78b7]
              transition-colors`}
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredTables.length > 0 ? (
                    filteredTables.map((table) => (
                      <button
                        key={table.value}
                        onClick={() => handleSelectTable(table.value)}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors ${tw.label}`}
                      >
                        {table.label}
                      </button>
                    ))
                  ) : (
                    <div className={`px-3 py-2 text-center ${tw.caption}`}>No tables found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-2.5 rounded-b-lg"
          style={{ background: '#FFFFFF', boxShadow: '0px -4px 9px 0px #0000001A' }}
        >
          <button
            onClick={handleClose}
            disabled={isIngesting}
            className={`${tw.secondaryButton} px-4 py-2.5 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Cancel
          </button>
          <button
            onClick={handleProceed}
            disabled={!selectedTable || isIngesting}
            className="px-4 py-2.5 rounded-md text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-satoshi text-sm font-medium leading-none tracking-normal"
            style={{ backgroundColor: '#8E77BB' }}
          >
            {isIngesting ? 'Processing...' : 'Proceed'}
          </button>
        </div>
      </div>
    </div>
  );
};