import { useState, useEffect } from 'react';
import { Info, X, Plus, ChevronDown } from 'lucide-react';
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

  useEffect(() => {
    if (isOpen) {
      fetchTables();
    }
  }, [isOpen]);

  const fetchTables = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${hostnameAI}/schemas/source-schema/tables`, {
        headers: {
          'accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tables');
      }
      
      const data = await response.json();
      const tables = data.tables.map(table => ({
        value: table,
        label: table
      }));
      setAvailableTables(tables);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tables:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceed = async () => {
    if (!selectedTable) return;

    setIsIngesting(true);
    setError(null);

    try {
      // Get the selected project name
      const projectName = projectState.selectedProject
      
      // Prepare form data
      const formData = new URLSearchParams();
      formData.append('domain', '');
      formData.append('project_name', projectName);
      formData.append('profiling_required', 'true');
      formData.append('tag', '');
      formData.append('source', '');
      formData.append('sub_tag', '');
      formData.append('table_name', selectedTable);
      formData.append('category', '');
      formData.append('user_name', decodedToken.preferred_username);

      const response = await fetch(`${hostnameAI}/data/ingestion`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      if (!response.ok) {
        throw new Error(`Data ingestion failed: ${response.status}`);
      }

      const data = await response.json();

      // Update context with session data
      setDatasetState({
        tableName: selectedTable,
        sessionId: data.session_id,
        columnNames: data.column_names || [],
        profileReportHtml: data.profile_report_html || ''
      });

      // Find the selected table data
      const selectedTableData = availableTables.find(v => v.value === selectedTable);
      
      // Call the parent's onProceed callback
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
    setError(null);
    onClose();
  };

  const handleSelectTable = (value) => {
    setSelectedTable(value);
    setIsDropdownOpen(false);
  };

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
              Available Tables
            </label>
            <div className="relative">
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
                  <div className="max-h-48 overflow-y-auto">
                    {availableTables.map((table) => (
                      <button
                        key={table.value}
                        onClick={() => handleSelectTable(table.value)}
                        className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        {table.label}
                      </button>
                    ))}
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