/*eslint-disable*/
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Settings, X, ChevronDown, Trash2, Check } from 'lucide-react';

const MultiSelect = ({ options, selected, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 text-left flex justify-between items-center"
      >
        <span className="truncate">
          {selected.length === 0
            ? placeholder
            : `${selected.length} column${selected.length !== 1 ? 's' : ''} selected`}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map(option => (
            <div
              key={option}
              className="flex items-center px-3 py-2 hover:bg-gray-700 cursor-pointer"
              onClick={() => {
                onChange(
                  selected.includes(option)
                    ? selected.filter(item => item !== option)
                    : [...selected, option]
                );
              }}
            >
              <div className="flex items-center flex-1">
                <div className="w-4 h-4 border border-gray-600 rounded mr-2 flex items-center justify-center">
                  {selected.includes(option) && (
                    <Check className="w-3 h-3 text-blue-500" />
                  )}
                </div>
                <span className="text-sm text-gray-300">{option}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

MultiSelect.propTypes = {
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  selected: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired
};

export function ManualPrepDrawer({ isOpen, onClose, columns, onPrepare }) {
  const [settings, setSettings] = useState({
    operations: [],
    numerical_cols: [],
    missing_values_strategy: null,
    missing_categorical_strategy: null,
    normalization_strategy: null,
    encoding_type: null,
    n_components: null,
    bin_config: {},
    datatype_conversion: {},
    skewness_strategy: null,
    feature_strategy: null,
    // datetime_col: null
  });

  const [expandedOperations, setExpandedOperations] = useState([]);
  const [binSettings, setBinSettings] = useState({
    column: '',
    bins: 5
  });
  const [datatypeSettings, setDatatypeSettings] = useState({
    column: '',
    type: 'int'
  });

  const handleOperationToggle = (operation) => {
    setSettings(prev => ({
      ...prev,
      operations: prev.operations.includes(operation)
        ? prev.operations.filter(op => op !== operation)
        : [...prev.operations, operation]
    }));
    
    if (!expandedOperations.includes(operation)) {
      setExpandedOperations(prev => [...prev, operation]);
    }
  };

  const toggleOperationExpand = (operation) => {
    setExpandedOperations(prev =>
      prev.includes(operation)
        ? prev.filter(op => op !== operation)
        : [...prev, operation]
    );
  };

  const handleBinConfigUpdate = () => {
    if (binSettings.column && binSettings.bins > 0) {
      setSettings(prev => ({
        ...prev,
        bin_config: {
          ...prev.bin_config,
          [binSettings.column]: binSettings.bins
        }
      }));
      setBinSettings({ column: '', bins: 5 });
    }
  };

  const handleDatatypeUpdate = () => {
    if (datatypeSettings.column && datatypeSettings.type) {
      setSettings(prev => ({
        ...prev,
        datatype_conversion: {
          ...prev.datatype_conversion,
          [datatypeSettings.column]: datatypeSettings.type
        }
      }));
      setDatatypeSettings({ column: '', type: 'int' });
    }
  };

  const removeBinConfig = (column) => {
    setSettings(prev => {
      const newBinConfig = { ...prev.bin_config };
      delete newBinConfig[column];
      return { ...prev, bin_config: newBinConfig };
    });
  };

  const removeDatatypeConfig = (column) => {
    setSettings(prev => {
      const newDatatypeConfig = { ...prev.datatype_conversion };
      delete newDatatypeConfig[column];
      return { ...prev, datatype_conversion: newDatatypeConfig };
    });
  };

  const renderConfigList = (configs, type) => {
    return (
      <div className="mt-2 space-y-1">
        {Object.entries(configs).map(([column, value]) => (
          <div key={column} className="flex items-center justify-between bg-gray-700 rounded px-2 py-1">
            <span className="text-sm text-gray-300">
              {column} → {type === 'bin' ? `${value} bins` : value}
            </span>
            <button
              onClick={() => type === 'bin' ? removeBinConfig(column) : removeDatatypeConfig(column)}
              className="p-1 hover:bg-gray-600 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  const renderOperationContent = (operation) => {
    switch (operation) {
      case 'missing_value':
        return (
          <select
            value={settings.missing_values_strategy || ''}
            onChange={(e) => setSettings({ ...settings, missing_values_strategy: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 mt-2"
          >
            <option value="">Select strategy</option>
            <option value="mean">Mean</option>
            <option value="median">Median</option>
            <option value="mode">Mode</option>
            <option value="linear_regression">Linear Regression</option>
            <option value="knn">KNN</option>
            <option value="delete">Delete</option>
          </select>
        );

      case 'missing_categorical':
        return (
          <select
            value={settings.missing_categorical_strategy || ''}
            onChange={(e) => setSettings({ ...settings, missing_categorical_strategy: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 mt-2"
          >
            <option value="">Select strategy</option>
            <option value="mode">Mode</option>
            <option value="delete">Delete</option>
          </select>
        );

      case 'normalization':
        return (
          <div className="space-y-2 mt-2">
            <select
              value={settings.normalization_strategy || ''}
              onChange={(e) => setSettings({ ...settings, normalization_strategy: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300"
            >
              <option value="">Select strategy</option>
              <option value="minmax">Min-Max Scaling</option>
              <option value="z-score">Z-Score</option>
            </select>
            <MultiSelect
              options={columns}
              selected={settings.numerical_cols}
              onChange={(selected) => setSettings(prev => ({ ...prev, numerical_cols: selected }))}
              placeholder="Select columns to normalize"
            />
          </div>
        );

      case 'encoding':
        return (
          <select
            value={settings.encoding_type || ''}
            onChange={(e) => setSettings({ ...settings, encoding_type: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 mt-2"
          >
            <option value="">Select encoding</option>
            <option value="binary">Binary</option>
            <option value="onehot">One-Hot Encoding</option>
          </select>
        );

      case 'feature_selection':
        return (
          <div className="space-y-2 mt-2">
            <select
              value={settings.feature_strategy || ''}
              onChange={(e) => setSettings({ ...settings, feature_strategy: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300"
            >
              <option value="">Select strategy</option>
              <option value="pca">PCA</option>
              <option value="SelectKBest">Select KBest</option>
            </select>
            <input
              type="number"
              value={settings.n_components || ''}
              onChange={(e) => setSettings({ ...settings, n_components: parseInt(e.target.value) })}
              placeholder="Number of components"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300"
              min="1"
            />
          </div>
        );

      case 'skewness':
        return (
          <select
            value={settings.skewness_strategy || ''}
            onChange={(e) => setSettings({ ...settings, skewness_strategy: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 mt-2"
          >
            <option value="">Select strategy</option>
            <option value="log">Log Transform</option>
            <option value="sqrt">Square Root Transform</option>
            <option value="boxcox">Box-Cox Transform</option>
            <option value="yeojohnson">Yeo Johnson</option>
            <option value="exp">Exponential Transformation</option>
            <option value="rank">Rank</option>
            <option value="power">Power</option>
          </select>
        );

      case 'binning':
        return (
          <div className="space-y-2 mt-2">
            {Object.keys(settings.bin_config).length > 0 && renderConfigList(settings.bin_config, 'bin')}
            <div className="mt-4 space-y-2">
              <select
                value={binSettings.column}
                onChange={(e) => setBinSettings({ ...binSettings, column: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300"
              >
                <option value="">Select column</option>
                {columns
                  .filter(col => !settings.bin_config[col])
                  .map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))
                }
              </select>
              <input
                type="number"
                value={binSettings.bins}
                onChange={(e) => setBinSettings({ ...binSettings, bins: parseInt(e.target.value) })}
                placeholder="Number of bins"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300"
                min="2"
              />
              <button
                onClick={handleBinConfigUpdate}
                disabled={!binSettings.column || !binSettings.bins}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white text-sm"
              >
                Add Bin Configuration
              </button>
            </div>
          </div>
        );

      case 'change_datatypes':
        return (
          <div className="space-y-2 mt-2">
            {Object.keys(settings.datatype_conversion).length > 0 && renderConfigList(settings.datatype_conversion, 'datatype')}
            <div className="mt-4 space-y-2">
              <select
                value={datatypeSettings.column}
                onChange={(e) => setDatatypeSettings({ ...datatypeSettings, column: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300"
              >
                <option value="">Select column</option>
                {columns
                  .filter(col => !settings.datatype_conversion[col])
                  .map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))
                }
              </select>
              <select
                value={datatypeSettings.type}
                onChange={(e) => setDatatypeSettings({ ...datatypeSettings, type: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300"
              >
                <option value="int">Integer</option>
                <option value="float">Float</option>
                <option value="str">String</option>
                <option value="bool">Boolean</option>
                <option value="datetime">Datetime</option>
              </select>
              <button
                onClick={handleDatatypeUpdate}
                disabled={!datatypeSettings.column || !datatypeSettings.type}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white text-sm"
              >
                Add Datatype Conversion
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className={`fixed inset-y-0 right-0 w-96 bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">Manual Preparation</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {[
            'remove_duplicates',
            'drop_constant',
            'remove_outliers',
            'missing_value',
            'extract_datetime',
            'missing_categorical',
            'binning',
            'change_datatypes',
            'correlation',
            'skewness',
            'normalization',
            'encoding',
            'feature_selection'
          ].map(operation => (
            <div key={operation} className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.operations.includes(operation)}
                    onChange={() => handleOperationToggle(operation)}
                    className="rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-700"
                  />
                  <span className="text-sm text-gray-300">
                    {operation.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>
                </label>
                {renderOperationContent(operation) && (
                  <button
                    onClick={() => toggleOperationExpand(operation)}
                    className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transform transition-transform ${
                        expandedOperations.includes(operation) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                )}
              </div>
              {expandedOperations.includes(operation) && renderOperationContent(operation)}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => {
              onPrepare(settings);
              onClose()
            }}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium text-sm"
          >
            Apply Preparation
          </button>
        </div>
      </div>
    </div>
  );
}

ManualPrepDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  columns: PropTypes.arrayOf(PropTypes.string).isRequired,
  onPrepare: PropTypes.func.isRequired
};

export default ManualPrepDrawer;