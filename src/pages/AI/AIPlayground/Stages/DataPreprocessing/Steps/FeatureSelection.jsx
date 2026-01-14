import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';

function FeatureSelection({ readonly = false }) {
  const [toggles, setToggles] = useState({
    dropLowValue: false,
    handleMissing: false,
    createBasic: false,
    detectOutliers: false,
  });

  const [expandedSections, setExpandedSections] = useState({
    dropLowValue: false,
    handleMissing: false,
    createBasic: false,
    detectOutliers: false,
  });

  const [selectAll, setSelectAll] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState({});
  const [missingValuesTab, setMissingValuesTab] = useState('dropColumns');
  const [threshold, setThreshold] = useState(70);
  const [numericalImputation, setNumericalImputation] = useState('');
  const [categoricalImputation, setCategoricalImputation] = useState('');
  const [timeSeriesImputation, setTimeSeriesImputation] = useState('');
  const [columnOverrides, setColumnOverrides] = useState([]);
  const [basicFeatures, setBasicFeatures] = useState([]);
  const [outlierMethod, setOutlierMethod] = useState('z-score');

  const columns = [
    { name: 'Customer', uniqueness: '100.00%' },
    { name: 'Customer', uniqueness: '100.00%' },
    { name: 'Customer', uniqueness: '100.00%' },
    { name: 'Annual_Income', uniqueness: '100.00%' },
    { name: 'Annual_Income', uniqueness: '100.00%' },
    { name: 'Annual_Income', uniqueness: '100.00%' },
    { name: 'Customer_Satisfaction', uniqueness: '96.50%' },
    { name: 'Customer_Satisfaction', uniqueness: '96.50%' },
    { name: 'Customer_Satisfaction', uniqueness: '96.50%' },
    { name: 'Monthly_Spending', uniqueness: '75.20%' },
    { name: 'Monthly_Spending', uniqueness: '75.20%' },
    { name: 'Monthly_Spending', uniqueness: '75.20%' },
    { name: 'Customer_Retention', uniqueness: '85.30%' },
    { name: 'Customer_Retention', uniqueness: '85.30%' },
    { name: 'Customer_Retention', uniqueness: '85.30%' },
    { name: 'Market_Share', uniqueness: '60.00%' },
    { name: 'Market_Share', uniqueness: '60.00%' },
    { name: 'Market_Share', uniqueness: '60.00%' },
  ];

  const columnNames = ['age', 'income', 'score', 'category', 'timestamp', 'value'];
  const imputationMethods = ['MEAN', 'MEDIAN', 'MODE', 'FORWARD_FILL', 'BACKWARD_FILL', 'INTERPOLATE'];
  const operators = ['+', '-', '*', '/', '%'];
  
  const outlierMethods = [
    { value: 'z-score', label: 'Z-Score' },
    { value: 'modified-z-score', label: 'Modified Z-Score' },
    { value: 'iqr', label: 'IQR' },
    { value: 'isolation-forest', label: 'Isolation Forest' },
    { value: 'lof', label: 'LOF' },
    { value: 'one-class-svm', label: 'One Class SVM' }
  ];

  const toggleSwitch = (key) => {
    if (readonly) return;
    const newToggleState = !toggles[key];
    
    setToggles(prev => ({ ...prev, [key]: newToggleState }));
    
    if (newToggleState) {
      setExpandedSections({
        dropLowValue: false,
        handleMissing: false,
        createBasic: false,
        detectOutliers: false,
        [key]: true
      });
    } else {
      setExpandedSections(prev => ({ ...prev, [key]: false }));
    }
  };

  const toggleSection = (section) => {
    if (readonly) return;
    setExpandedSections({
      dropLowValue: false,
      handleMissing: false,
      createBasic: false,
      detectOutliers: false,
      [section]: !expandedSections[section]
    });
  };

  const handleSelectAll = () => {
    if (readonly) return;
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    const newSelectedColumns = {};
    columns.forEach((col, idx) => {
      newSelectedColumns[`${col.name}-${idx}`] = newSelectAll;
    });
    setSelectedColumns(newSelectedColumns);
  };

  const handleColumnToggle = (columnKey) => {
    if (readonly) return;
    setSelectedColumns(prev => ({ ...prev, [columnKey]: !prev[columnKey] }));
  };

  const addColumnOverride = () => {
    if (readonly) return;
    setColumnOverrides(prev => [...prev, { id: Date.now(), column: '', method: '' }]);
  };

  const removeColumnOverride = (id) => {
    if (readonly) return;
    setColumnOverrides(prev => prev.filter(override => override.id !== id));
  };

  const updateColumnOverride = (id, field, value) => {
    if (readonly) return;
    setColumnOverrides(prev => prev.map(override =>
      override.id === id ? { ...override, [field]: value } : override
    ));
  };

  const addBasicFeature = () => {
    if (readonly) return;
    setBasicFeatures(prev => [...prev, {
      id: Date.now(),
      column1: '',
      operator: '',
      column2: '',
      newColumnName: ''
    }]);
  };

  const removeBasicFeature = (id) => {
    if (readonly) return;
    setBasicFeatures(prev => prev.filter(feature => feature.id !== id));
  };

  const updateBasicFeature = (id, field, value) => {
    if (readonly) return;
    setBasicFeatures(prev => prev.map(feature =>
      feature.id === id ? { ...feature, [field]: value } : feature
    ));
  };

  // Reusable Components
  const ToggleSwitch = ({ checked, onChange }) => (
    <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={onChange}
        disabled={readonly}
        className="sr-only peer" 
      />
      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
    </label>
  );

  const ExpandButton = ({ expanded, onClick }) => (
    <button 
      onClick={onClick}
      disabled={readonly}
      className="text-gray-400 hover:text-gray-600"
    >
      {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
    </button>
  );

  const SelectInput = ({ value, onChange, options, placeholder, className = "" }) => (
    <select
      value={value}
      onChange={onChange}
      disabled={readonly}
      className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent text-sm ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
          {typeof opt === 'string' ? opt : opt.label}
        </option>
      ))}
    </select>
  );

  const SectionCard = ({ title, description, sectionKey, children }) => (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
      <div className="p-4 flex items-center justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-700">{title}</h4>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <ToggleSwitch checked={toggles[sectionKey]} onChange={() => toggleSwitch(sectionKey)} />
          {toggles[sectionKey] && (
            <ExpandButton expanded={expandedSections[sectionKey]} onClick={() => toggleSection(sectionKey)} />
          )}
        </div>
      </div>
      {toggles[sectionKey] && expandedSections[sectionKey] && (
        <div className="px-4 pb-4 border-t border-gray-100">{children}</div>
      )}
    </div>
  );

  const selectedCount = Object.values(selectedColumns).filter(Boolean).length;
  const totalFields = 80;

  return (
    <div className="space-y-4">
      <SectionCard
        title="Drop Low-Value Columns"
        description="Remove columns with zero or excessively high uniqueness."
        sectionKey="dropLowValue"
      >
        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                disabled={readonly}
                className="w-4 h-4 text-[#8e78b7] border-gray-300 rounded"
              />
              Select All
            </label>
            <span className="text-xs text-gray-400">
              Total Fields: {totalFields} | Selected: {selectedCount}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-x-8 gap-y-4">
            {columns.map((column, idx) => {
              const columnKey = `${column.name}-${idx}`;
              return (
                <div key={columnKey} className="flex items-center gap-2 bg-white p-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedColumns[columnKey] || false}
                    onChange={() => handleColumnToggle(columnKey)}
                    disabled={readonly}
                    className="w-4 h-4 text-[#8e78b7] border-gray-300 rounded mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-gray-700">{column.name}</div>
                    <div className="text-xs text-gray-400">{column.uniqueness}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Handle Missing Values"
        description="Fix missing entries using dropping or imputation techniques."
        sectionKey="handleMissing"
      >
        <div className="mt-1">
          <div className="flex gap-2 mb-4">
            {['dropColumns', 'imputation'].map(tab => (
              <button
                key={tab}
                onClick={() => !readonly && setMissingValuesTab(tab)}
                disabled={readonly}
                className={`px-4 py-1 text-sm rounded-lg transition-colors ${
                  missingValuesTab === tab
                    ? 'bg-[#8e78b7] text-white font-medium shadow-sm'
                    : 'text-gray-500 bg-gray-300 hover:text-gray-700'
                }`}
              >
                {tab === 'dropColumns' ? 'Drop Columns' : 'Imputation'}
              </button>
            ))}
          </div>

          {missingValuesTab === 'dropColumns' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Threshold (%)</label>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => !readonly && setThreshold(e.target.value)}
                  disabled={readonly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                  placeholder="70"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Drop columns with more than {threshold}% missing values
                </p>
              </div>
            </div>
          )}

          {missingValuesTab === 'imputation' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Numerical Imputation</label>
                  <SelectInput
                    value={numericalImputation}
                    onChange={(e) => !readonly && setNumericalImputation(e.target.value)}
                    options={['MEAN', 'MEDIAN', 'MODE', 'FORWARD_FILL']}
                    placeholder="Select"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Categorical Imputation</label>
                  <SelectInput
                    value={categoricalImputation}
                    onChange={(e) => !readonly && setCategoricalImputation(e.target.value)}
                    options={['MODE', 'FORWARD_FILL', 'BACKWARD_FILL']}
                    placeholder="Select"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Time Series</label>
                  <SelectInput
                    value={timeSeriesImputation}
                    onChange={(e) => !readonly && setTimeSeriesImputation(e.target.value)}
                    options={['FORWARD_FILL', 'BACKWARD_FILL', 'INTERPOLATE']}
                    placeholder="Select"
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-3">Column Overrides</label>
                <div className="space-y-3">
                  {columnOverrides.map((override, index) => (
                    <div key={override.id} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">Override {index + 1}</label>
                          <SelectInput
                            value={override.column}
                            onChange={(e) => updateColumnOverride(override.id, 'column', e.target.value)}
                            options={columnNames}
                            placeholder="Column"
                            className="w-full"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">&nbsp;</label>
                          <SelectInput
                            value={override.method}
                            onChange={(e) => updateColumnOverride(override.id, 'method', e.target.value)}
                            options={imputationMethods}
                            placeholder="Strategy"
                            className="w-full"
                          />
                        </div>
                        <button
                          onClick={() => removeColumnOverride(override.id)}
                          disabled={readonly}
                          className="mt-5 p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addColumnOverride}
                    disabled={readonly}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#8e78b7] hover:text-[#8e78b7] transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Add Override
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Create Basic Features"
        description="Add new domain features for enhanced model performance."
        sectionKey="createBasic"
      >
        <div className="mt-4 space-y-3">
          {basicFeatures.map((feature, index) => (
            <div key={feature.id}>
              <label className="block text-xs text-gray-500 mb-2">Operation {index + 1}</label>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-3">
                  <SelectInput
                    value={feature.column1}
                    onChange={(e) => updateBasicFeature(feature.id, 'column1', e.target.value)}
                    options={columnNames}
                    placeholder="Column 1"
                    className="flex-1"
                  />

                  <SelectInput
                    value={feature.operator}
                    onChange={(e) => updateBasicFeature(feature.id, 'operator', e.target.value)}
                    options={operators}
                    placeholder="+"
                    className="w-20 text-center"
                  />

                  <SelectInput
                    value={feature.column2}
                    onChange={(e) => updateBasicFeature(feature.id, 'column2', e.target.value)}
                    options={columnNames}
                    placeholder="Column 2"
                    className="flex-1"
                  />

                  <input
                    type="text"
                    value={feature.newColumnName}
                    onChange={(e) => updateBasicFeature(feature.id, 'newColumnName', e.target.value)}
                    disabled={readonly}
                    placeholder="New Column Name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent text-sm"
                  />

                  <button
                    onClick={() => removeBasicFeature(feature.id)}
                    disabled={readonly}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addBasicFeature}
            disabled={readonly}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#8e78b7] hover:text-[#8e78b7] transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Add Operation
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Detect Outliers"
        description="Find and handle outliers in numerical fields."
        sectionKey="detectOutliers"
      >
        <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
          {outlierMethods.map(method => (
            <label key={method.value} className={`flex items-center gap-2 group ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="radio"
                name="outlierMethod"
                value={method.value}
                checked={outlierMethod === method.value}
                onChange={(e) => !readonly && setOutlierMethod(e.target.value)}
                disabled={readonly}
                className="w-4 h-4 text-[#8e78b7] border-gray-300 focus:ring-[#8e78b7]"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{method.label}</span>
            </label>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export default FeatureSelection;