import React, { useEffect, useRef, useState } from 'react';
import { AIPlaygroundLayout } from '../AIPlaygroundLayout';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAIPlayground } from '../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';
import { Check, X, Search, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';
import { tw, backgrounds } from '../../../../components/themeContext';

const RadioButton = ({ label, checked, onChange, name, readonly }) => (
  <label
    className={`flex items-center gap-2 group ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
  >
    <div className="relative">
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={readonly}
        onChange={readonly ? undefined : onChange}
        className="sr-only peer"
      />
      <div className="w-4 h-4 border-2 border-gray-300 rounded-full peer-checked:border-[#8e78b7] transition-colors">
        {checked && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#8e78b7] rounded-full" />
        )}
      </div>
    </div>
    <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
  </label>
);

const Section = ({ title, children, className = '' }) => (
  <div className={`bg-white ${className}`}>
    <h3 className="text-lg font-medium text-[#332849] mb-4">
      {title} {title !== "Fairness Attribute" && title !== "Drop Columns"}
    </h3>
    {children}
  </div>
);

const NotebookModeModal = ({ isOpen, onCancel, onContinue, readonly }) => {
  if (!isOpen || readonly) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop - full cover */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative z-10 bg-white rounded-lg shadow-xl w-[440px] mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="text-base font-medium text-gray-900 m-0 p-0">
            Switch to Notebook Mode?
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-5" />

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            In Notebook mode, all pipeline setup and execution must be done through code instead of the visual workflow.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">
            Do you want to continue?
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 pb-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-white border border-[#8e78b7] rounded-lg hover:bg-gray-50 transition-colors text-[#8e78b7] text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            className="px-4 py-2 text-sm font-medium text-white bg-[#8e78b7] rounded-lg hover:bg-[#7d67a6] transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

const SearchableSelect = ({ value, onChange, options, placeholder, disabled, readonly }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    if (!readonly && !disabled) {
      onChange(option);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled || readonly}
        onClick={() => !disabled && !readonly && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent bg-white flex items-center justify-between ${disabled || readonly ? 'cursor-not-allowed opacity-50 bg-[#FAFAFA]' : 'hover:border-gray-400'
          }`}
      >
        <span className={value ? 'text-gray-700' : 'text-gray-500'}>
          {value || placeholder}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && !readonly && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-100 transition-colors ${value === option ? 'bg-purple-50 text-[#8e78b7] font-medium' : 'text-gray-700'
                    }`}
                >
                  {option}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SearchableMultiSelect = ({ selectedOptions, onChange, options, maxSelections, disabled, readonly, excludeOption }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState('bottom');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const buttonRef = useRef(null);

  const availableOptions = options.filter(option =>
    !selectedOptions.includes(option) && option !== excludeOption
  );

  const filteredOptions = availableOptions.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 300; // Approximate max height of dropdown
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    if (!readonly && !disabled && selectedOptions.length < maxSelections) {
      onChange([...selectedOptions, option]);
      setSearchTerm('');
    }
  };

  const handleRemove = (option) => {
    if (!readonly && !disabled) {
      onChange(selectedOptions.filter(o => o !== option));
    }
  };

  const isMaxReached = selectedOptions.length >= maxSelections;
  const isDisabled = disabled || readonly || isMaxReached || options.length === 0;

  return (
    <div className="space-y-3">
      <div className="relative" ref={dropdownRef}>
        <button
          ref={buttonRef}
          type="button"
          disabled={isDisabled}
          onClick={() => !isDisabled && setIsOpen(!isOpen)}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent bg-white flex items-center justify-between ${isDisabled ? 'cursor-not-allowed opacity-50 bg-[#FAFAFA]' : 'hover:border-gray-400'
            }`}
        >
          <span className="text-gray-600">
            {options.length === 0
              ? "No columns available"
              : isMaxReached
                ? "Maximum selection reached"
                : `${selectedOptions.length}/${maxSelections} Options Selected`}
          </span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && !isDisabled && (
          <div className={`absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden ${dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
            }`}>
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-48">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 transition-colors text-gray-700"
                  >
                    {option}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  {availableOptions.length === 0 ? 'No more options available' : 'No results found'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map(option => (
            <span
              key={option}
              className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 text-gray-700 text-sm rounded-md"
            >
              {option}
              <button
                type="button"
                disabled={readonly || disabled}
                onClick={() => handleRemove(option)}
                className={`ml-1 ${readonly || disabled ? 'cursor-not-allowed' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};


const ModeSelection = ({ config, setConfig, readonly }) => {
  const [showModal, setShowModal] = useState(false);
  const [pendingNotebookState, setPendingNotebookState] = useState(false);

  const handleNotebookToggle = (checked) => {
    if (readonly) return;

    if (checked) {
      setPendingNotebookState(true);
      setShowModal(true);
    } else {
      setConfig({ ...config, notebookMode: false });
    }
  };

  const handleModalContinue = () => {
    if (readonly) return;
    setConfig({ ...config, notebookMode: pendingNotebookState });
    setShowModal(false);
  };

  const handleModalCancel = () => {
    setPendingNotebookState(false);
    setShowModal(false);
  };

  return (
    <>
      <Section title="Mode Selection">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_auto_1fr] gap-4">
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div className="grid grid-cols-[1fr_1fr_1fr] bg-[#FAFAFA] border-b border-gray-200">
              <div className="px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">
                Feature Type
              </div>
              <div className="px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">
                Auto
              </div>
              <div className="px-4 py-3 text-sm font-medium text-gray-700">Manual</div>
            </div>

            <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-gray-200">
              <div className="px-4 bg-[#FAFAFA] py-4 text-sm text-gray-700 border-r border-gray-200 flex items-center">
                Data Pre-processing
              </div>

              <div className="px-4 py-4 flex flex-col gap-2 border-r border-gray-200 bg-white">
                <RadioButton
                  label="Swift"
                  checked={config.dataPreprocessing === 'Swift'}
                  onChange={() => setConfig({ ...config, dataPreprocessing: 'Swift' })}
                  name="dataPreprocessing-auto"
                  readonly={readonly}
                />
                <RadioButton
                  label="Standard"
                  checked={config.dataPreprocessing === 'Standard'}
                  onChange={() => setConfig({ ...config, dataPreprocessing: 'Standard' })}
                  name="dataPreprocessing-auto"
                  readonly={readonly}
                />
                <RadioButton
                  label="Comprehensive"
                  checked={config.dataPreprocessing === 'Comprehensive'}
                  onChange={() => setConfig({ ...config, dataPreprocessing: 'Comprehensive' })}
                  name="dataPreprocessing-auto"
                  readonly={readonly}
                />
              </div>

              <div className="px-4 py-4 flex items-center bg-white">
                <RadioButton
                  label="Manual"
                  checked={config.dataPreprocessing === 'Manual'}
                  onChange={() => setConfig({ ...config, dataPreprocessing: 'Manual' })}
                  name="dataPreprocessing-manual"
                  readonly={readonly}
                />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_1fr_1fr]">
              <div className="px-4 bg-[#FAFAFA] py-4 text-sm text-gray-700 border-r border-gray-200 flex items-center">
                Model Selection
              </div>

              <div className="px-4 py-4 flex flex-col gap-2 border-r border-gray-200 bg-white">
                <RadioButton
                  label="Swift"
                  checked={config.modelSelection === 'Swift'}
                  onChange={() => setConfig({ ...config, modelSelection: 'Swift' })}
                  name="modelSelection-auto"
                  readonly={readonly}
                />
                <RadioButton
                  label="Standard"
                  checked={config.modelSelection === 'Standard'}
                  onChange={() => setConfig({ ...config, modelSelection: 'Standard' })}
                  name="modelSelection-auto"
                  readonly={readonly}
                />
                <RadioButton
                  label="Comprehensive"
                  checked={config.modelSelection === 'Comprehensive'}
                  onChange={() => setConfig({ ...config, modelSelection: 'Comprehensive' })}
                  name="modelSelection-auto"
                  readonly={readonly}
                />
              </div>

              <div className="px-4 py-4 flex items-center bg-white">
                <RadioButton
                  label="Manual"
                  checked={config.modelSelection === 'Manual'}
                  onChange={() => setConfig({ ...config, modelSelection: 'Manual' })}
                  name="modelSelection-manual"
                  readonly={readonly}
                />
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-center justify-center px-4">
            <div className="flex-1 w-px bg-gray-300"></div>
            <div className="text-gray-400 text-sm font-medium py-3">OR</div>
            <div className="flex-1 w-px bg-gray-300"></div>
          </div>

          <div className="flex items-stretch">
            <div className="border border-gray-200 rounded-lg w-full bg-white overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-200 bg-[#FAFAFA]">
                <div className="text-sm font-medium text-gray-800">Notebook Mode</div>
              </div>

              {/* Body */}
              <div className="p-3 bg-white">
                {/* Inner card */}
                <div className="rounded-lg bg-[#FAFAFA] p-4">
                  {/* Toggle row */}
                  <div className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 mb-4">
                    <span className="text-sm text-gray-700">Notebook</span>
                    <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        checked={config.notebookMode}
                        disabled={readonly}
                        onChange={readonly ? undefined : (e) => handleNotebookToggle(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#ADADAD] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
                    </label>
                  </div>

                  {/* Bullet points */}
                  <div className="space-y-1.5 text-sm text-gray-500">
                    <p className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span>Work in a dedicated notebook environment for full code-based control.</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span>Your pipeline must be defined and executed entirely through code.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <NotebookModeModal
        isOpen={showModal}
        onCancel={handleModalCancel}
        onContinue={handleModalContinue}
        readonly={readonly}
      />
    </>
  );
};

const PredictionType = ({ config, setConfig, isValidated, onValidate, readonly, columnNames, hasError, errorMessage, sectionRef, activeWorkflowId, isValidating, setIsValidating }) => {
  const hostnameAI = window._env_?.VITE_AI_API;
  const { datasetState } = useAIPlayground();
  const tabs = ['Supervised', 'Unsupervised', 'Time Series', 'Anomaly Detection'];

  const getAvailableTargetColumns = () => {
    const dropColumns = config.drop_columns || [];
    return columnNames.filter(name => !dropColumns.includes(name));
  };

  const handleValidate = async () => {
    if (!config.classification || !config.targetFeature) return;

    setIsValidating(true);

    try {
      const modellingTypeMap = {
        'Binary': 'binary',
        'Multiclass': 'multiclass',
        'Regression': 'regression'
      };

      const modellingType = modellingTypeMap[config.classification];
      const ensembleId = datasetState.ensembleId;
      const targetColumn = config.targetFeature;

      const response = await fetch(`${hostnameAI}/data/validate-target-column`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ensemble_id: ensembleId,
          workflow_id: activeWorkflowId,
          target_column: targetColumn,
          modelling_type: modellingType
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          toast.success('Validation successful!', { duration: 3000, position: 'top-right' });
          onValidate();
        } else {
          toast.error('Target column is not compatible with the selected modeling type.', { duration: 4000, position: 'top-right' });
        }
      } else {
        toast.error('Target column is not compatible with the selected modeling type.', { duration: 4000, position: 'top-right' });
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Target column is not compatible with the selected modeling type.', { duration: 4000, position: 'top-right' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
    if (isValidated) {
      onValidate();
    }
  };

  const isValidateDisabled = !config.classification || !config.targetFeature || isValidating;

  return (
    <div ref={sectionRef} className="bg-[#FAFAFA] rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 pt-5 pb-0">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Prediction Type</h3>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => !readonly && setConfig({ ...config, predictionType: tab })}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${config.predictionType === tab
                ? 'text-[#8e78b7]'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab}
              {config.predictionType === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8e78b7]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Supervised Content */}
      {config.predictionType === 'Supervised' && (
        <div className="px-6 py-5 bg-[#FAFAFA] overflow-visible">
          <p className="text-sm font-medium text-gray-800 mb-4">Supervised Learning Configuration</p>

          <div className="flex items-stretch gap-4">
            <div className="flex items-stretch gap-4 flex-1">
              <div className="bg-white rounded-lg p-4 min-w-[400px] h-full">
                <label className="block text-sm font-medium text-gray-700 mb-3">Classification</label>
                <div className="space-y-2.5">
                  <RadioButton
                    label="Binary"
                    checked={config.classification === 'Binary'}
                    onChange={() => handleConfigChange({ ...config, classification: 'Binary' })}
                    name="learning-type"
                    readonly={readonly}
                  />
                  <RadioButton
                    label="Multiclass"
                    checked={config.classification === 'Multiclass'}
                    onChange={() => handleConfigChange({ ...config, classification: 'Multiclass' })}
                    name="learning-type"
                    readonly={readonly}
                  />
                  <RadioButton
                    label="Regression"
                    checked={config.classification === 'Regression'}
                    onChange={() => handleConfigChange({ ...config, classification: 'Regression' })}
                    name="learning-type"
                    readonly={readonly}
                  />
                </div>
              </div>

              {/* Target Feature box */}
              <div className="bg-white rounded-lg p-4 h-full" style={{ width: '340px' }}>
                <label className="block text-sm font-medium text-gray-700 mb-3">Target Feature</label>
                {getAvailableTargetColumns().length > 0 ? (
                  <>
                    <div className={`rounded-md ${hasError && !config.targetFeature ? 'border border-[#EF4D5F] bg-[#FFF7F8]' : ''}`}>
                      <SearchableSelect
                        value={config.targetFeature}
                        onChange={(newTargetFeature) => {
                          const updatedConfig = {
                            ...config,
                            targetFeature: newTargetFeature,
                            fairness_columns: config.fairness_columns.filter(
                              attr => attr !== newTargetFeature
                            )
                          };
                          handleConfigChange(updatedConfig);
                        }}
                        options={getAvailableTargetColumns()}
                        placeholder="Select..."
                        disabled={readonly}
                        readonly={readonly}
                      />
                    </div>
                    {hasError && !config.targetFeature && (
                      <p className="mt-1 text-sm text-[#EF4D5F]">Please select the target Feature to validate</p>
                    )}
                  </>
                ) : (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500 bg-[#FAFAFA]">
                    No columns available
                  </div>
                )}
              </div>
            </div>

            {/* Validate button — right aligned, vertically centered */}
            <div className="flex flex-col items-end justify-end self-stretch pb-0 pt-6">
              <button
                onClick={handleValidate}
                disabled={readonly || isValidateDisabled || isValidated}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${isValidated
                  ? 'bg-green-100 text-green-700 cursor-default border border-green-400'
                  : readonly || isValidateDisabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-[#8e78b7] text-white hover:bg-[#7d67a6]'
                  }`}
              >
                {isValidating ? (
                  <>
                    Validating...
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </>
                ) : isValidated ? (
                  <>
                    Validated <CheckCircle className="w-5 h-5" />
                  </>
                ) : (
                  'Validate'
                )}
              </button>
              {hasError && config.targetFeature && (
                <p className="text-sm text-[#EF4D5F] mb-2">{errorMessage}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SplitSetting = ({ config, setConfig, readonly }) => {
  const handleSliderChange = (type, value) => {
    if (readonly) return;

    const newConfig = { ...config };
    const total = 100;

    if (type === 'train') {
      newConfig.trainSplit = value;
      newConfig.testSplit = total - value;
    } else if (type === 'test') {
      newConfig.testSplit = value;
      newConfig.trainSplit = total - value;
    }

    setConfig(newConfig);
  };

  return (
    <Section title="Split Setting" className="!bg-[#FAFAFA] p-6 rounded-lg">
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Split</span>
            <span className="text-sm text-gray-600">Total: 100%</span>
          </div>

          {/* Split bar — 12px height */}
          <div className="relative rounded-full overflow-hidden flex" style={{ height: '12px', backgroundColor: '#E5E5E5' }}>
            <div style={{ width: `${config.trainSplit}%` }} className="bg-[#8e78b7] h-full" />
            <div style={{ width: `${config.testSplit}%` }} className="bg-orange-400 h-full" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Train Card */}
          <div className="bg-white rounded-lg p-3">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-700">Train</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={config.trainSplit}
                disabled={readonly}
                onChange={
                  readonly
                    ? undefined
                    : (e) => handleSliderChange('train', parseInt(e.target.value))
                }
                className={`slider-train flex-1 rounded-lg appearance-none ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                style={{
                  height: '10px',
                  background: `linear-gradient(to right, #8e78b7 0%, #8e78b7 ${config.trainSplit}%, #E5E5E5 ${config.trainSplit}%, #E5E5E5 100%)`
                }}
              />
              <span className="text-sm text-gray-600 w-10 text-right">{config.trainSplit}%</span>
            </div>
          </div>

          {/* Test Card */}
          <div className="bg-white rounded-lg p-3">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-700">Test</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={config.testSplit}
                disabled={readonly}
                onChange={
                  readonly
                    ? undefined
                    : (e) => handleSliderChange('test', parseInt(e.target.value))
                }
                className={`slider-test flex-1 rounded-lg appearance-none ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                style={{
                  height: '10px',
                  background: `linear-gradient(to right, #fc842eff 0%, #fc842eff ${config.testSplit}%, #E5E5E5 ${config.testSplit}%, #E5E5E5 100%)`
                }}
              />
              <span className="text-sm text-gray-600 w-10 text-right">{config.testSplit}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#8e78b7] rounded-md p-2">
          <p className="text-sm">
            <span className="font-medium text-[#8e78b7]">Note:</span> To proceed, make sure the Train and Test
            percentages together equal 100%. You can adjust the sliders to balance the data as needed.
          </p>
        </div>
      </div>
    </Section>
  );
};

const FairnessAttribute = ({ config, setConfig, readonly, columnNames = [] }) => {
  const getAvailableFairnessColumns = () => {
    const dropColumns = config.drop_columns || [];
    const targetFeature = config.targetFeature || '';

    return columnNames.filter(name =>
      !dropColumns.includes(name) &&
      name !== targetFeature
    );
  };

  const handleFairnessChange = (newSelected) => {
    if (!readonly) {
      setConfig({ ...config, fairness_columns: newSelected });
    }
  };

  return (
    <Section title="Fairness Attribute" className="!bg-[#FAFAFA] p-6 rounded-lg">
      <div style={{ width: '479px' }}>
        <SearchableMultiSelect
          selectedOptions={config.fairness_columns}
          onChange={handleFairnessChange}
          options={getAvailableFairnessColumns()}
          maxSelections={3}
          disabled={false}
          readonly={readonly}
          excludeOption=""
        />
      </div>
    </Section>
  );
};

const DropColumns = ({ config, setConfig, readonly, columnNames = [], hasError, errorMessage, sectionRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const getAvailableColumns = () => {
    const selectedDropColumns = config.drop_columns || [];
    const fairnessColumns = config.fairness_columns || [];
    const targetFeature = config.targetFeature || '';

    return columnNames.filter(name =>
      !fairnessColumns.includes(name) &&
      name !== targetFeature
    );
  };

  const filteredOptions = getAvailableColumns().filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedDropColumns = config.drop_columns || [];
  const allFilteredSelected = filteredOptions.length > 0 && filteredOptions.every(opt => selectedDropColumns.includes(opt));
  const someFilteredSelected = filteredOptions.some(opt => selectedDropColumns.includes(opt));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (readonly) return;
    const newToggleState = !config.drop_columns_active;
    setConfig({
      ...config,
      drop_columns_active: newToggleState,
      drop_columns: newToggleState ? (config.drop_columns || []) : []
    });
    setIsExpanded(newToggleState);
  };

  const handleCheckboxChange = (columnName, checked) => {
    if (readonly) return;

    let newDropColumns;
    if (checked) {
      newDropColumns = [...selectedDropColumns, columnName];
    } else {
      newDropColumns = selectedDropColumns.filter(col => col !== columnName);
    }

    const newTargetFeature = checked && config.targetFeature === columnName ? '' : config.targetFeature;
    const newFairnessColumns = checked
      ? config.fairness_columns.filter(col => col !== columnName)
      : config.fairness_columns;

    setConfig({
      ...config,
      drop_columns: newDropColumns,
      targetFeature: newTargetFeature,
      fairness_columns: newFairnessColumns
    });
  };

  const handleSelectAll = () => {
    if (readonly) return;

    let newDropColumns;
    if (allFilteredSelected) {
      newDropColumns = selectedDropColumns.filter(col => !filteredOptions.includes(col));
    } else {
      const toAdd = filteredOptions.filter(opt => !selectedDropColumns.includes(opt));
      newDropColumns = [...selectedDropColumns, ...toAdd];
    }

    const newFairnessColumns = config.fairness_columns.filter(col => !newDropColumns.includes(col));
    const newTargetFeature = newDropColumns.includes(config.targetFeature) ? '' : config.targetFeature;

    setConfig({
      ...config,
      drop_columns: newDropColumns,
      fairness_columns: newFairnessColumns,
      targetFeature: newTargetFeature
    });
  };

  const handleRemove = (columnName) => {
    if (!readonly) {
      const newDropColumns = selectedDropColumns.filter(col => col !== columnName);
      setConfig({ ...config, drop_columns: newDropColumns });
    }
  };

  const displayError = hasError;
  const displayMessage = errorMessage;

  return (
    <div ref={sectionRef} className="rounded-lg bg-[#FAFAFA]">
      <div className="p-4 flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-medium text-gray-900}`}>
            Drop Columns
          </h3>
          <p className="text-sm text-gray-600 mt-2">
            Drop Column is the process of removing a feature that is irrelevant, redundant, or low in informational value. This helps reduce noise and improves model efficiency.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <input
              type="checkbox"
              checked={config.drop_columns_active || false}
              onChange={handleToggle}
              disabled={readonly}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#ADADAD] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
          </label>
          {config.drop_columns_active && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          )}
        </div>
      </div>

      {config.drop_columns_active && isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block">Select Columns to Drop</label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  disabled={readonly}
                  onClick={() => !readonly && setIsOpen(!isOpen)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent bg-white flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed ${hasError && selectedDropColumns.length === 0 ? 'border-[#EF4D5F] bg-[#FFF7F8] text-[#EF4D5F]' : 'border-gray-300 bg-[#FAFAFA]'}`}
                >
                  <span className={`${hasError && selectedDropColumns.length === 0 ? 'text-[#EF4D5F]' : 'text-gray-500'}`}>
                    {selectedDropColumns.length > 0
                      ? `${selectedDropColumns.length} column(s) selected`
                      : 'Search and select columns...'}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {displayError && (
                  <p className="mt-1 text-sm text-[#EF4D5F]">{displayMessage}</p>
                )}

                {isOpen && !readonly && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search..."
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {filteredOptions.length > 0 && (
                      <div className="px-3 py-2 border-b border-gray-100">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={allFilteredSelected}
                            ref={el => {
                              if (el) el.indeterminate = !allFilteredSelected && someFilteredSelected;
                            }}
                            onChange={handleSelectAll}
                            className="w-4 h-4 rounded border-gray-300 accent-[#8e78b7] cursor-pointer"
                          />
                          <span className="text-sm font-medium text-gray-700">Select All</span>
                          <span className="text-xs text-gray-400 ml-auto">
                            {filteredOptions.filter(o => selectedDropColumns.includes(o)).length}/{filteredOptions.length}
                          </span>
                        </label>
                      </div>
                    )}

                    <div className="overflow-y-auto" style={{ maxHeight: '220px' }}>
                      {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                          <label
                            key={option}
                            className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 cursor-pointer select-none border-b border-gray-50 last:border-b-0"
                          >
                            <input
                              type="checkbox"
                              checked={selectedDropColumns.includes(option)}
                              onChange={(e) => handleCheckboxChange(option, e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 accent-[#8e78b7] cursor-pointer flex-shrink-0"
                            />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-sm text-gray-500 text-center">
                          {getAvailableColumns().length === 0 ? 'No more columns available' : 'No results found'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedDropColumns.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Selected Columns</label>
                <div className="flex flex-wrap gap-2">
                  {selectedDropColumns.map(column => (
                    <span
                      key={column}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 text-gray-700 text-sm rounded-md"
                    >
                      {column}
                      {!readonly && (
                        <button
                          type="button"
                          onClick={() => handleRemove(column)}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function ModelGenesis() {
  const hostnameAI = window._env_?.VITE_AI_API;
  const location = useLocation();
  const navigate = useNavigate();

  const { datasetState, updateWorkflowStage, workflowsState, mode, activeWorkflowId } = useAIPlayground();
  const workflowState = activeWorkflowId ? workflowsState?.[activeWorkflowId] : null;
  const [validationErrors, setValidationErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const predictionTypeRef = useRef(null);
  const dropColumnsRef = useRef(null);

  useEffect(() => {
    if (datasetState.ensembleId == '') {
      navigate('/ai/playground')
    }
  }, []);

  const readonly = mode === 'view';
  // if in view or edit mode and with workflow state config , then prefill the form with saved config
  const getInitialConfig = () => {
    const savedConfig = workflowState?.modelGenesis?.config;

    if ((mode === 'view' || mode === 'edit') && savedConfig) {
      return {
        dataPreprocessing: savedConfig.data_preprocessing_mode || 'Manual',
        modelSelection: savedConfig.model_mode || 'Manual',
        notebookMode: false,

        predictionType: 'Supervised',
        classification: savedConfig.modelling_type === 'binary' ? 'Binary' :
          savedConfig.modelling_type === 'multiclass' ? 'Multiclass' : 'Regression',
        targetFeature: savedConfig.target_column || '',

        trainSplit: Math.round((savedConfig.train_size || 0.7) * 100),
        testSplit: Math.round((savedConfig.test_size || 0.3) * 100),

        fairness_columns: savedConfig.fairness_columns || [],
        drop_columns_active: savedConfig.drop_columns_active || false,
        drop_columns: savedConfig.drop_columns || []
      };
    }

    return {
      dataPreprocessing: 'Manual',
      modelSelection: 'Manual',
      notebookMode: false,

      predictionType: 'Supervised',
      classification: 'Multiclass',
      targetFeature: '',

      trainSplit: 90,
      testSplit: 10,

      fairness_columns: [],
      drop_columns_active: false,
      drop_columns: []
    };
  };



  const [config, setConfig] = useState(getInitialConfig);
  const [isValidated, setIsValidated] = useState(mode === 'view' && !!workflowState?.modelGenesis?.config);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if ((mode === 'view' || mode === 'edit') && workflowState?.modelGenesis?.config) {
      setConfig(getInitialConfig());
      setIsValidated(mode === 'view');
    }
  }, [mode, workflowState?.modelGenesis?.config]);

  useEffect(() => {
    if (mode === 'edit') {
      setIsValidated(false)
    }
  }, [mode]);

  const modellingTypeMap = {
    'Binary': 'binary',
    'Multiclass': 'multiclass',
    'Regression': 'regression'
  };

  const isDropColumnsValid = () => {
    if (config.drop_columns_active) {
      return config.drop_columns && config.drop_columns.length > 0;
    }
    return true;
  };

  const isInteractionLocked = readonly || isSubmitting || isValidating;

  const handleValidate = () => {
    if (readonly) return;
    setIsValidated(!isValidated);
  };

  const runValidation = async () => {
    if (!config.classification || !config.targetFeature) {
      toast.error('Please select classification type and target feature.', {
        duration: 4000,
        position: 'top-right',
      });
      return false;
    }

    try {

      const modellingType = modellingTypeMap[config.classification];
      const ensembleId = datasetState.ensembleId;
      const targetColumn = config.targetFeature;

      const response = await fetch(`${hostnameAI}/data/validate-target-column`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ensemble_id: ensembleId,
          workflow_id: activeWorkflowId,
          target_column: targetColumn,
          modelling_type: modellingType
        })
      });

      if (response.ok) {
        const data = await response.json();

        if (data.status === 'success') {
          return true;
        } else {
          toast.error('Target column is not compatible with the selected modeling type.', {
            duration: 4000,
            position: 'top-right',
          });
          return false;
        }
      } else {
        toast.error('Target column is not compatible with the selected modeling type.', {
          duration: 4000,
          position: 'top-right',
        });
        return false;
      }
    } catch (error) {
      toast.error('Target column is not compatible with the selected modeling type.', {
        duration: 4000,
        position: 'top-right',
      });
      return false;
    }
  };

  const handleNextClick = async () => {
    // Run client-side validation first
    const errors = {};

    if (!isValidated) {
      errors.predictionType = 'Please validate your configuration before proceeding.';
    }

    if (config.drop_columns_active && (!config.drop_columns || config.drop_columns.length === 0)) {
      errors.dropColumns = 'Please select at least one column to drop, or disable Drop Columns.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Scroll to first error
      setTimeout(() => {
        if (errors.dropColumns && dropColumnsRef.current) {
          dropColumnsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (errors.predictionType && predictionTypeRef.current) {
          predictionTypeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return false;
    }

    setValidationErrors({});
    setIsSubmitting(true);

    try {
      if (mode === 'view') {
        const validationSuccess = await runValidation();
        if (!validationSuccess) {
          setIsSubmitting(false);
          return false;
        }
        setIsValidated(true);
        setIsSubmitting(false);
        return true;
      }

      const trainSize = config.trainSplit / 100;
      const testSize = config.testSplit / 100;

      const sum = trainSize + testSize;
      if (Math.abs(sum - 1.0) > 0.01) {
        toast.error('Train and Test splits must equal 100%', {
          duration: 4000,
          position: 'top-right',
        });
        setIsSubmitting(false);
        return false;
      }

      const payload = {
        ensemble_id: datasetState.ensembleId,
        workflow_id: activeWorkflowId,
        test_size: testSize,
        train_size: trainSize,
        random_state: 42,
        target_column: config.targetFeature,
        modelling_type: modellingTypeMap[config.classification],
        fairness_columns: config.fairness_columns,
        data_preprocessing_mode: config.dataPreprocessing,
        model_mode: config.modelSelection,
        drop_columns_active: config.drop_columns_active || false,
        drop_columns: config.drop_columns || []
      };

      const response = await fetch(`${hostnameAI}/data/genesis`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        updateWorkflowStage('modelGenesis', {
          config: {
            ...config,
            modelling_type: modellingTypeMap[config.classification],
            trainSize,
            testSize
          },
          apiResponse: data
        });
        
        // Store job_id in completedJobs if it exists in the response
        if (data.job_id) {
          updateWorkflowStage('completedJobs', {
            config: {
              job_id: data.job_id
            }
          });
        }
        
        toast.success('Model genesis completed successfully!', {
          duration: 3000,
          position: 'top-right',
        });
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to complete model genesis. Please try again.', {
          duration: 4000,
          position: 'top-right',
        });
        return false;
      }
    } catch (error) {
      console.error('Model genesis error:', error);
      toast.error('Network error occurred. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AIPlaygroundLayout
      isNextDisabled={isSubmitting || isValidating}
      onNextClick={handleNextClick}
    >
      <div className="space-y-6">
        <ModeSelection
          config={config}
          setConfig={(newConfig) => {
            setConfig(newConfig);
            updateWorkflowStage('modelGenesis', {
              config: {
                dataPreprocessing: newConfig.dataPreprocessing,
                modelSelection: newConfig.modelSelection,
                data_preprocessing_mode: newConfig.dataPreprocessing,
                model_mode: newConfig.modelSelection,
              }
            });
          }}
          readonly={isInteractionLocked}
        />

        <DropColumns
          config={config}
          setConfig={(newConfig) => {
            setConfig(newConfig);

            if (validationErrors.dropColumns && newConfig.drop_columns?.length > 0) {
              setValidationErrors(prev => ({ ...prev, dropColumns: undefined }));
            }

            if (!newConfig.drop_columns_active) {
              setValidationErrors(prev => ({ ...prev, dropColumns: undefined }));
            }
          }}
          readonly={isInteractionLocked}
          columnNames={datasetState.columnNames}
          hasError={!!validationErrors.dropColumns}
          errorMessage={validationErrors.dropColumns}
        />

        <PredictionType
          config={config}
          setConfig={setConfig}
          isValidated={isValidated}
          onValidate={() => {
            handleValidate();
            setValidationErrors(prev => ({ ...prev, predictionType: undefined }));
          }}
          readonly={isInteractionLocked}
          columnNames={datasetState.columnNames}
          hasError={!!validationErrors.predictionType}
          errorMessage={validationErrors.predictionType}
          activeWorkflowId={activeWorkflowId}
          isValidating={isValidating}
          setIsValidating={setIsValidating}
        />

        <SplitSetting config={config} setConfig={setConfig} readonly={isInteractionLocked} />

        <FairnessAttribute
          config={config}
          setConfig={setConfig}
          readonly={isInteractionLocked}
          columnNames={datasetState.columnNames}
        />
      </div>

      <style>{`
  input[type="range"].slider-train::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background-color: white;
    border: 2px solid #8e78b7; 
    cursor: pointer;
  }
  input[type="range"].slider-train::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: #8e78b7;
    cursor: pointer;
    border: none;
  }

  input[type="range"].slider-test::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background-color: white;
    border: 2px solid #f97316; 
    cursor: pointer;
  }
  input[type="range"].slider-test::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: #f97316;
    cursor: pointer;
    border: none;
  }
`}</style>
    </AIPlaygroundLayout>
  );
}

export default ModelGenesis;