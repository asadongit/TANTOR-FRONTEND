import React, { useEffect, useRef, useState } from 'react';
import { AIPlaygroundLayout } from '../AIPlaygroundLayout';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAIPlayground } from '../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';
import { Check, X, Search, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

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
    <h3 className="text-lg font-semibold text-gray-900 mb-4">
      {title} {title !== "Fairness Attribute" && title !== "Drop Columns" && <span className="text-red-500">*</span>}
    </h3>
    {children}
  </div>
);

const NotebookModeModal = ({ isOpen, onCancel, onContinue, readonly }) => {
  if (!isOpen || readonly) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onCancel}></div>

      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Switch to Notebook Mode?</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            In Notebook mode, all pipeline setup and execution must be done through code instead of the visual workflow.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">Do you want to continue?</p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
        className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent bg-white flex items-center justify-between ${disabled || readonly ? 'cursor-not-allowed opacity-50 bg-gray-50' : 'hover:border-gray-400'
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
          className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent bg-white flex items-center justify-between ${isDisabled ? 'cursor-not-allowed opacity-50 bg-gray-50' : 'hover:border-gray-400'
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
            <div className="grid grid-cols-[1fr_1fr_1fr] bg-gray-50 border-b border-gray-200">
              <div className="px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">
                Feature Type
              </div>
              <div className="px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">
                Auto
              </div>
              <div className="px-4 py-3 text-sm font-medium text-gray-700">Manual</div>
            </div>

            <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-gray-200">
              <div className="px-4 bg-gray-50 py-4 text-sm text-gray-700 border-r border-gray-200 flex items-center">
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
              <div className="px-4 bg-gray-50 py-4 text-sm text-gray-700 border-r border-gray-200 flex items-center">
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
            <div className="border border-gray-200 rounded-lg p-5 w-full bg-white">
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-4">Notebook Mode</div>
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <span className="text-sm text-gray-700">Notebook</span>

                  <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={config.notebookMode}
                      disabled={readonly}
                      onChange={readonly ? undefined : (e) => handleNotebookToggle(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
                  </label>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>Work in a dedicated notebook environment for full code-based control.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>Your pipeline must be defined and executed entirely through code.</span>
                </p>
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

const PredictionType = ({ config, setConfig, isValidated, onValidate, readonly, columnNames }) => {
  const hostnameAI = window._env_?.VITE_AI_API;
  const { datasetState } = useAIPlayground();
  const [isValidating, setIsValidating] = useState(false);
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
      const sessionId = datasetState.sessionId;
      const targetColumn = config.targetFeature;

      const apiUrl = `${hostnameAI}/data/validate-targetcolumn-modellingtype?session_id=${sessionId}&target_column=${encodeURIComponent(targetColumn)}&modelling_type=${modellingType}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();

        if (data.status === 'success') {
          toast.success('Validation successful!', {
            duration: 3000,
            position: 'top-right',
          });
          onValidate();
        } else {
          toast.error('Target column is not compatible with the selected modeling type.', {
            duration: 4000,
            position: 'top-right',
          });
        }
      } else {
        toast.error('Target column is not compatible with the selected modeling type.', {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Target column is not compatible with the selected modeling type.', {
        duration: 4000,
        position: 'top-right',
      });
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
    <Section title="Prediction Type" className="!bg-gray-50 p-6 rounded-lg border border-gray-200">
      <div className="flex gap-1 border-b border-gray-300 -mx-6 px-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setConfig({ ...config, predictionType: tab })}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative rounded-md ${config.predictionType === tab ? 'text-[#8e78b7] bg-purple-50' : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            {tab}
            {config.predictionType === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8e78b7]" />
            )}
          </button>
        ))}
      </div>

      {config.predictionType === 'Supervised' && (
        <div className="bg-gray-50 rounded-lg p-6 -mx-6 -mb-6 mt-0 pt-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-5">Supervised Learning Configuration</h4>

          <div className="grid grid-cols-1 md:grid-cols-[60%_40%] gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
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
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Regression</label>
                  <div className="space-y-2.5">
                    <RadioButton
                      label="Regression"
                      checked={config.classification === 'Regression'}
                      onChange={() => handleConfigChange({ ...config, classification: 'Regression' })}
                      name="learning-type"
                      readonly={readonly}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <label className="block text-sm font-medium text-gray-700 mb-3">Target Feature</label>
              {getAvailableTargetColumns().length > 0 ? (
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
              ) : (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500 bg-gray-50">
                  No columns available
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleValidate}
              disabled={readonly || isValidateDisabled || isValidated}
              className={`px-8 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${isValidated
                ? 'bg-green-100 text-green-700 cursor-default border border-green-400'
                : readonly || isValidateDisabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#8e78b7] text-white hover:bg-[#7d67a6]'
                }`}
            >
              {isValidating ? (
                <>
                  Validating...
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </>
              ) : isValidated ? (
                <>
                  Validated <Check className="w-5 h-5" />
                </>
              ) : (
                'Validate'
              )}
            </button>
          </div>
        </div>
      )}
    </Section>
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
    <Section title="Split Setting" className="!bg-gray-50 p-6 rounded-lg border border-gray-200">
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Split</span>
            <span className="text-sm text-gray-600">Total: 100%</span>
          </div>

          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden flex">
            <div style={{ width: `${config.trainSplit}%` }} className="bg-[#8e78b7] h-full" />
            <div style={{ width: `${config.testSplit}%` }} className="bg-orange-400 h-full" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
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
                className={`flex-1 h-2 bg-gray-200 rounded-lg appearance-none ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                style={{
                  background: `linear-gradient(to right, #8e78b7 0%, #8e78b7 ${config.trainSplit}%, #e5e7eb ${config.trainSplit}%, #e5e7eb 100%)`
                }}
              />
              <span className="text-sm text-gray-600 w-10 text-right">{config.trainSplit}%</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
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
                className={`flex-1 h-2 bg-gray-200 rounded-lg appearance-none ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                style={{
                  background: `linear-gradient(to right, #fc842eff 0%, #fc842eff ${config.testSplit}%, #e5e7eb ${config.testSplit}%, #e5e7eb 100%)`
                }}
              />
              <span className="text-sm text-gray-600 w-10 text-right">{config.testSplit}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#8e78b7] rounded-md p-2">
          <p className="text-sm ">
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
    <Section title="Fairness Attribute" className="!bg-gray-50 p-6 rounded-lg border border-gray-200">
      <SearchableMultiSelect
        selectedOptions={config.fairness_columns}
        onChange={handleFairnessChange}
        options={getAvailableFairnessColumns()}
        maxSelections={3}
        disabled={false}
        readonly={readonly}
        excludeOption=""
      />
    </Section>
  );
};

const DropColumns = ({ config, setConfig, readonly, columnNames = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const { workflowState } = useAIPlayground();

  const getAvailableColumns = () => {
    const selectedDropColumns = config.drop_columns || [];
    const fairnessColumns = config.fairness_columns || [];
    const targetFeature = config.targetFeature || '';

    return columnNames.filter(name =>
      !selectedDropColumns.includes(name) &&
      !fairnessColumns.includes(name) &&
      name !== targetFeature
    );
  };

  const filteredOptions = getAvailableColumns().filter(option =>
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

  const handleToggle = () => {
    if (readonly) return;

    const newToggleState = !config.drop_columns_active;
    setConfig({
      ...config,
      drop_columns_active: newToggleState,
      drop_columns: newToggleState ? (config.drop_columns || []) : []
    });

    if (newToggleState) {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  };

  const handleSelect = (columnName) => {
    if (!readonly) {
      const newDropColumns = [...(config.drop_columns || []), columnName];

      // Remove from target feature if it matches
      const newTargetFeature = config.targetFeature === columnName ? '' : config.targetFeature;

      // Remove from fairness columns if included
      const newFairnessColumns = config.fairness_columns.filter(col => col !== columnName);

      setConfig({
        ...config,
        drop_columns: newDropColumns,
        targetFeature: newTargetFeature,
        fairness_columns: newFairnessColumns
      });

      setSearchTerm('');
      setIsOpen(false);
    }
  };

  const handleRemove = (columnName) => {
    if (!readonly) {
      const newDropColumns = (config.drop_columns || []).filter(col => col !== columnName);
      setConfig({ ...config, drop_columns: newDropColumns });
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
      <div className="p-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Drop Columns</h3>
            <p className='text-sm text-gray-600 mt-2 mryyy-2'>Drop Column is the process of removing a feature that is irrelevant, redundant, or low in informational value. This helps reduce noise and improves model efficiency.</p>
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
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
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
              <label className="text-xs font-medium text-gray-600 mb-2 block">Select Column to Drop</label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  disabled={readonly}
                  onClick={() => !readonly && setIsOpen(!isOpen)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent bg-white flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-gray-500">Search and select column...</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOpen && !readonly && (
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
                            className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 transition-colors text-gray-700"
                          >
                            {option}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500 text-center">
                          {getAvailableColumns().length === 0 ? 'No more columns available' : 'No results found'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {config.drop_columns && config.drop_columns.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Selected Columns</label>
                <div className="flex flex-wrap gap-2">
                  {config.drop_columns.map(column => (
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

  const { datasetState, updateWorkflowStage, workflowState, mode } = useAIPlayground();

  useEffect(() => {
    if (datasetState.sessionId == '') {
      navigate('/ai/playground')
    }
  }, []);

  const readonly = mode === 'view';

  const getInitialConfig = () => {
    if ((mode === 'view' || mode === 'edit') && workflowState.modelGenesis?.config) {
      const savedConfig = workflowState.modelGenesis.config;
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
  const [isValidated, setIsValidated] = useState(mode === 'view' && workflowState.modelGenesis?.config);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const sessionId = datasetState.sessionId;
      const targetColumn = config.targetFeature;

      const apiUrl = `${hostnameAI}/data/validate-targetcolumn-modellingtype?session_id=${sessionId}&target_column=${encodeURIComponent(targetColumn)}&modelling_type=${modellingType}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
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
    setIsSubmitting(true);

    try {
      // In view mode, only run validation and skip model genesis API
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

      if (!isValidated) {
        toast.error('Please validate your configuration before proceeding.', {
          duration: 4000,
          position: 'top-right',
        });
        setIsSubmitting(false);
        return false;
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
        session_id: datasetState.sessionId,
        test_size: testSize,
        train_size: trainSize,
        random_state: 42,
        fairness_columns: config.fairness_columns,
        drop_columns_active: config.drop_columns_active || false,
        drop_columns: config.drop_columns || [],
        data_preprocessing_mode: config.dataPreprocessing,
        model_mode: config.modelSelection,
        target_column: config.targetFeature,
        modelling_type: modellingTypeMap[config.classification]
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
      isNextDisabled={!isValidated || isSubmitting || !isDropColumnsValid()}
      onNextClick={handleNextClick}
    >
      <div className="space-y-6">
        <ModeSelection config={config} setConfig={setConfig} readonly={readonly} />

        <DropColumns
          config={config}
          setConfig={setConfig}
          readonly={readonly}
          columnNames={datasetState.columnNames}
        />

        <PredictionType
          config={config}
          setConfig={setConfig}
          isValidated={isValidated}
          onValidate={handleValidate}
          readonly={readonly}
          columnNames={datasetState.columnNames}
        />

        <SplitSetting config={config} setConfig={setConfig} readonly={readonly} />

        <FairnessAttribute
          config={config}
          setConfig={setConfig}
          readonly={readonly}
          columnNames={datasetState.columnNames}
        />
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 2px solid currentColor;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 2px solid currentColor;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>
    </AIPlaygroundLayout>
  );
}

export default ModelGenesis;