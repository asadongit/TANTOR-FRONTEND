import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import InfoIcons from '../../../../../assets/ai/infoIcon.svg'
import { tw, aithemestyle } from '../../../../../components/themeContext';

// ── Searchable Dropdown (same as DataCleaning.jsx) ──────────────────────────
const SearchableDropdown = ({
  selectedColumn,
  onSelect,
  availableOptions,
  placeholder = "Select",
  readonly,
  dropDirection = "down",
  hasError = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const [pdpTargetValue, setPdpTargetValue] = useState('');
const [cfDesiredValue, setCfDesiredValue] = useState('');

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

  const handleSelect = (option) => {
    if (!readonly && !disabled) {
      onSelect(option);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const isDisabled = readonly || disabled;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:border-transparent bg-white flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${hasError
            ? 'border-[#EF4D5F] bg-[#FFF7F8] focus:ring-red-300'
            : 'border-gray-300 focus:ring-[#8e78b7]'
          }`}
      >
        <span className={selectedColumn ? "text-gray-700" : hasError ? "text-[#EF4D5F]" : "text-gray-400"}>
          {selectedColumn || placeholder}
        </span>
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !isDisabled && (
        <div className={`absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden ${dropDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
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
              <div className="px-3 py-2 text-sm text-gray-500 text-center">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const FieldTooltip = ({ lines, position = "right" }) => {
  const [visible, setVisible] = useState(false);

  const bubbleStyle = position === "left"
    ? { right: 0, top: '1.5rem' }
    : { left: 0, top: '1.5rem' };

  const arrowStyle = position === "left"
    ? { right: '0.375rem', top: '-0.375rem' }
    : { left: '0.75rem', top: '-0.375rem' };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        className="ml-1.5 text-gray-400 hover:text-gray-500 focus:outline-none flex-shrink-0"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        tabIndex={-1}
        aria-label="Field information"
      >
        <img
          src={InfoIcons}
          alt="info"
          style={{
            width: 12,
            height: 12,
            filter: 'brightness(0) saturate(100%) invert(54%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(88%)'
          }}
        />
      </button>

      {visible && (
        <div
          className="absolute w-72 bg-[#332849] text-white text-xs p-3 rounded-lg shadow-xl z-[9999] space-y-1.5"
          style={{ ...bubbleStyle, pointerEvents: 'none' }}
        >
          {lines.map((line, i) =>
            line.bold
              ? <p key={i}><strong>{line.bold}</strong>{line.rest}</p>
              : <p key={i}>{line}</p>
          )}
          <div
            className="absolute w-3 h-3 bg-[#332849] rotate-45 rounded-sm"
            style={arrowStyle}
          />
        </div>
      )}
    </div>
  );
};

// ── Configuration Modal ──────────────────────────────────────────────────────
function ConfigurationModal({ isOpen, onClose, onGenerate, xaiConfig, isRegression, isTimeseries = false, readonly = false, isGenerating = false }) {
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [showModelNameTooltip, setShowModelNameTooltip] = useState(false);
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const [configData, setConfigData] = useState({
    pdpTargetClass: '',
    cfDesiredClass: '',
    pdpTargetValue: '',
    cfDesiredValue: '',
    cfInstanceIndex: 0,
    limeInstanceIndex: 0,
    pdpFeatures: [],
    cfTargetValue: '',
  });

  useEffect(() => {
    if (xaiConfig) {
      setConfigData({
        pdpTargetClass: '',
        cfDesiredClass: '',
        pdpTargetValue: '',
        cfDesiredValue: '',
        cfInstanceIndex: 0,
        limeInstanceIndex: 0,
        pdpFeatures: [],
        cfTargetValue: '',
      });
      setShowFieldErrors(false);
    }
  }, [xaiConfig]);

  // Extract ranges for regression and timeseries models
  const pdpValueRange = xaiConfig?.pdp_target_value_range;
  const cfValueRange = xaiConfig?.cf_target_value_range;
  const cfTargetRange = xaiConfig?.cf_target_value_range;

  // Clear errors once all required fields become valid
  useEffect(() => {
    if (!showFieldErrors) return;

    const max = xaiConfig?.indices?.max_index || 0;

    let allValid;
    if (isTimeseries) {
      allValid =
        configData.cfTargetValue !== '' &&
        !isNaN(configData.cfTargetValue) &&
        (!cfTargetRange || (Number(configData.cfTargetValue) >= cfTargetRange.min && Number(configData.cfTargetValue) <= cfTargetRange.max)) &&
        configData.cfInstanceIndex >= 0 &&
        configData.cfInstanceIndex <= max &&
        configData.limeInstanceIndex >= 0 &&
        configData.limeInstanceIndex <= max;
    } else if (isRegression) {
      allValid =
        configData.pdpTargetValue !== '' &&
        !isNaN(configData.pdpTargetValue) &&
        (!pdpValueRange || (Number(configData.pdpTargetValue) >= pdpValueRange.min && Number(configData.pdpTargetValue) <= pdpValueRange.max)) &&
        configData.cfDesiredValue !== '' &&
        !isNaN(configData.cfDesiredValue) &&
        (!cfValueRange || (Number(configData.cfDesiredValue) >= cfValueRange.min && Number(configData.cfDesiredValue) <= cfValueRange.max)) &&
        configData.cfInstanceIndex >= 0 &&
        configData.cfInstanceIndex <= max &&
        configData.limeInstanceIndex >= 0 &&
        configData.limeInstanceIndex <= max;
    } else {
      allValid =
        configData.pdpTargetClass &&
        configData.cfDesiredClass &&
        configData.cfInstanceIndex >= 0 &&
        configData.cfInstanceIndex <= max &&
        configData.limeInstanceIndex >= 0 &&
        configData.limeInstanceIndex <= max;
    }

    if (allValid) setShowFieldErrors(false);
  }, [configData, showFieldErrors, isTimeseries, isRegression, pdpValueRange, cfValueRange, cfTargetRange]);

  const toggleFeature = (feature) => {
    if (readonly || isGenerating) return;
    setConfigData(prev => ({
      ...prev,
      pdpFeatures: prev.pdpFeatures.includes(feature)
        ? prev.pdpFeatures.filter(f => f !== feature)
        : [...prev.pdpFeatures, feature]
    }));
  };

  const toggleSelectAll = () => {
    if (readonly || isGenerating) return;
    const featuresList = Object.keys(xaiConfig.feature_metadata || {});
    const allSelected = featuresList.every(f => configData.pdpFeatures.includes(f));
    setConfigData(prev => ({
      ...prev,
      pdpFeatures: allSelected ? [] : featuresList
    }));
  };

  if (!isOpen || !xaiConfig) return null;

  const featuresList = Object.keys(xaiConfig.feature_metadata || {});
  const maxIndex = xaiConfig.indices?.max_index || 0;
  const pdpTargetClasses = (xaiConfig.pdp_target_classes || []).map(cls => String(cls));
  const cfDesiredClasses  = (xaiConfig.cf_desired_classes  || []).map(cls => String(cls));
  const allSelected = featuresList.length > 0 && featuresList.every(f => configData.pdpFeatures.includes(f));
  const modelName = xaiConfig.model_name || '';

  // Per-field error flags — only shown after the first failed submit attempt
  const pdpTargetError = showFieldErrors && (
    isRegression
      ? (configData.pdpTargetValue === '' || 
         isNaN(configData.pdpTargetValue) ||
         (pdpValueRange && (Number(configData.pdpTargetValue) < pdpValueRange.min || Number(configData.pdpTargetValue) > pdpValueRange.max)))
      : !configData.pdpTargetClass
  );

  const cfDesiredError = showFieldErrors && (
    isRegression
      ? (configData.cfDesiredValue === '' ||
         isNaN(configData.cfDesiredValue) ||
         (cfValueRange && (Number(configData.cfDesiredValue) < cfValueRange.min || Number(configData.cfDesiredValue) > cfValueRange.max)))
      : !configData.cfDesiredClass
  );
  const cfTargetValueError = showFieldErrors && isTimeseries && (
    configData.cfTargetValue === '' ||
    isNaN(configData.cfTargetValue) ||
    (cfTargetRange && (Number(configData.cfTargetValue) < cfTargetRange.min || Number(configData.cfTargetValue) > cfTargetRange.max))
  );
  const cfIndexError = showFieldErrors && !(configData.cfInstanceIndex >= 0 && configData.cfInstanceIndex <= maxIndex);
  const limeIndexError = showFieldErrors && !(configData.limeInstanceIndex >= 0 && configData.limeInstanceIndex <= maxIndex);

  const handleGenerate = () => {
    let isValid;
    if (isTimeseries) {
      isValid =
        configData.cfTargetValue !== '' &&
        !isNaN(configData.cfTargetValue) &&
        (!cfTargetRange || (Number(configData.cfTargetValue) >= cfTargetRange.min && Number(configData.cfTargetValue) <= cfTargetRange.max)) &&
        configData.cfInstanceIndex >= 0 &&
        configData.cfInstanceIndex <= maxIndex &&
        configData.limeInstanceIndex >= 0 &&
        configData.limeInstanceIndex <= maxIndex;
    } else {
      const pdpValueValid = configData.pdpTargetValue !== '' &&
        !isNaN(configData.pdpTargetValue) &&
        (!pdpValueRange || (Number(configData.pdpTargetValue) >= pdpValueRange.min && Number(configData.pdpTargetValue) <= pdpValueRange.max));

      const cfValueValid = configData.cfDesiredValue !== '' &&
        !isNaN(configData.cfDesiredValue) &&
        (!cfValueRange || (Number(configData.cfDesiredValue) >= cfValueRange.min && Number(configData.cfDesiredValue) <= cfValueRange.max));

      isValid = isRegression
        ? (
            pdpValueValid &&
            cfValueValid &&
            configData.cfInstanceIndex >= 0 &&
            configData.cfInstanceIndex <= maxIndex &&
            configData.limeInstanceIndex >= 0 &&
            configData.limeInstanceIndex <= maxIndex
          )
        : (
            configData.pdpTargetClass &&
            configData.cfDesiredClass &&
            configData.cfInstanceIndex >= 0 &&
            configData.cfInstanceIndex <= maxIndex &&
            configData.limeInstanceIndex >= 0 &&
            configData.limeInstanceIndex <= maxIndex
          );
    }

    if (!isValid) {
      setShowFieldErrors(true);
      return;
    }
    onGenerate(configData);
  };

  // ── Tooltip content definitions ─────────────────────────────────────────
  const pdpTargetTooltip = [
    { bold: "Partial Dependence Plot (PDP): ", rest: "Shows the average effect of a feature on a model's prediction by marginalizing over other features. Helps understand global feature influence across the dataset." },
  ];

  const pdpFeaturesTooltip = [
    { bold: "PDP Features: ", rest: "A graphical visualization of the partial dependence function. Displays how predicted outcomes change as one feature varies." }
  ];

  const cfDesiredTooltip = [
    { bold: "Counterfactual Explanation: ", rest: "An explanation that shows the minimal changes needed in input features to alter a model's prediction. Answers the question: “What needs to change to get a different outcome?”" },
    { bold: "Desired Class: ", rest: "The target outcome you want the model to predict instead." }
  ];

  const cfInstanceTooltip = [
    { bold: "Counterfactual Explanation: ", rest: "An explanation that shows the minimal changes needed in input features to alter a model's prediction. Answers the question: “What needs to change to get a different outcome?”" },
    { bold: "Instance index: ", rest: "The specific data point (row) for which the counterfactual explanation is generated." }
  ];

  const limeInstanceTooltip = [
    { bold: "LIME (Local Interpretable Model-agnostic Explanations): ", rest: "A technique that explains individual predictions by approximating the model locally with a simple interpretable model. It highlights which features contributed most to a specific prediction." }
  ];

  return (
    <div className="fixed inset-0 bg-[#00000099] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">

        {/* ── Header ── */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Configurations</h3>
          <div className="flex items-center gap-2">
            <div className="relative bg-[#FAFAFA]">
              <button
                className="text-[#818181] hover:text-gray-600 bg-[#FAFAFA] border border-[#CCCCCC] rounded-lg p-2"
                onMouseEnter={() => setShowInfoTooltip(true)}
                onMouseLeave={() => setShowInfoTooltip(false)}
              >
                <img src={InfoIcons} alt="info" style={{ width: 16, height: 16, filter: 'brightness(0) saturate(100%) invert(54%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(88%)' }} />
              </button>

              {showInfoTooltip && (
                <div className="absolute right-0 top-8 w-96 bg-[#332849] text-white text-xs p-3 rounded-lg shadow-xl z-50 space-y-1">
                  <p><strong>SHAP:</strong> Shows feature importance and contribution to predictions.</p>
                  <p><strong>PDP:</strong> Reveals how features influence model output across ranges.</p>
                  <p><strong>LIME:</strong> Provides local explanations for individual predictions.</p>
                  <p><strong>Counterfactuals:</strong> Suggest minimal changes needed to achieve different outcomes.</p>
                  <p><strong>Feature Flip:</strong> Summarizes the effect of flipping key features on model decisions.</p>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setConfigData({
                  pdpTargetClass: '',
                  cfDesiredClass: '',
                  pdpTargetValue: '',
                  cfDesiredValue: '',
                  cfInstanceIndex: 0,
                  limeInstanceIndex: 0,
                  pdpFeatures: [],
                  cfTargetValue: '',
                });
                setShowFieldErrors(false);
                onClose();
              }}
              className="text-gray-400 hover:text-gray-600"
              disabled={isGenerating}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="#818181" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* ── Model Name — 400 px, truncated, tooltip on hover ── */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Model Name</label>
            <div className="relative inline-block" style={{ width: '400px', maxWidth: '100%' }}>
              <input
                type="text"
                value={modelName}
                readOnly
                onMouseEnter={() => setShowModelNameTooltip(true)}
                onMouseLeave={() => setShowModelNameTooltip(false)}
                title=""
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 cursor-not-allowed"
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              />
              {showModelNameTooltip && modelName && (
                <div
                  className="absolute left-0 top-full mt-1 bg-[#332849] text-white text-xs px-3 py-2 rounded-lg shadow-xl z-50"
                  style={{ maxWidth: '480px', wordBreak: 'break-word' }}
                >
                  {modelName}
                </div>
              )}
            </div>
          </div>

          {/* ── Timeseries-specific fields ── */}
          {isTimeseries ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center text-sm font-medium mb-2 text-gray-900">
                    CF Target Value *
                    <FieldTooltip lines={cfDesiredTooltip} position="right" />
                  </label>
                  <input
                    type="number"
                    value={configData.cfTargetValue}
                    onChange={(e) => setConfigData({ ...configData, cfTargetValue: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                      cfTargetValueError
                        ? 'border-[#EF4D5F] bg-[#FFF7F8]'
                        : 'border-gray-300'
                    } ${readonly || isGenerating ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    disabled={readonly || isGenerating}
                    placeholder={cfTargetRange ? `${cfTargetRange.min.toFixed(2)} – ${cfTargetRange.max.toFixed(2)}` : 'Enter target value'}
                  />
                  {cfTargetValueError && (
                    <p className="text-xs text-[#EF4D5F] mt-1 pl-0.5">
                      {cfTargetRange
                        ? `Enter a value between ${cfTargetRange.min.toFixed(2)} and ${cfTargetRange.max.toFixed(2)}`
                        : 'Please enter a valid number'}
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* ── PDP Target Class & CF Desired Class (non-timeseries) ── */
            <div className="grid grid-cols-2 gap-4">

              {/* PDP FIELD */}
              <div>
                <label className="flex items-center text-sm font-medium mb-2 text-gray-900">
                  {isRegression ? "PDP Target Value" : "PDP Target Class"} *
                  <FieldTooltip lines={pdpTargetTooltip} position="right" />
                </label>

                {isRegression ? (
                  <div>
                    <input
                      type="number"
                      value={configData.pdpTargetValue}
                      onChange={(e) =>
                        setConfigData({ ...configData, pdpTargetValue: e.target.value })
                      }
                      className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                        pdpTargetError
                          ? 'border-[#EF4D5F] bg-[#FFF7F8]'
                          : 'border-gray-300'
                      } ${readonly || isGenerating ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      disabled={readonly || isGenerating}
                      placeholder={pdpValueRange ? ` ${pdpValueRange.min.toFixed(2)} - ${pdpValueRange.max.toFixed(2)}` : 'Enter value'}
                    />
                    {pdpTargetError && (
                      <p className="text-xs text-[#EF4D5F] mt-1 pl-0.5">
                        {pdpValueRange
                          ? `Enter a value between ${pdpValueRange.min.toFixed(2)} and ${pdpValueRange.max.toFixed(2)}`
                          : 'Please enter a valid number'}
                      </p>
                    )}
                  </div>
                ) : (
                  <SearchableDropdown
                    selectedColumn={configData.pdpTargetClass}
                    onSelect={(val) =>
                      setConfigData({ ...configData, pdpTargetClass: val })
                    }
                    availableOptions={pdpTargetClasses}
                    placeholder="Select"
                    readonly={readonly}
                    disabled={isGenerating}
                    hasError={showFieldErrors && !configData.pdpTargetClass}
                  />
                )}
              </div>

              {/* CF FIELD */}
              <div>
                <label className="flex items-center text-sm font-medium mb-2 text-gray-900">
                  {isRegression ? "CF Desired Value" : "CF Desired Class"} *
                  <FieldTooltip lines={cfDesiredTooltip} position="left" />
                </label>

                {isRegression ? (
                  <div>
                    <input
                      type="number"
                      value={configData.cfDesiredValue}
                      onChange={(e) =>
                        setConfigData({ ...configData, cfDesiredValue: e.target.value })
                      }
                      className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                        cfDesiredError
                          ? 'border-[#EF4D5F] bg-[#FFF7F8]'
                          : 'border-gray-300'
                      } ${readonly || isGenerating ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      disabled={readonly || isGenerating}
                      placeholder={cfValueRange ? ` ${cfValueRange.min.toFixed(2)} - ${cfValueRange.max.toFixed(2)}` : 'Enter value'}
                    />
                    {cfDesiredError && (
                      <p className="text-xs text-[#EF4D5F] mt-1 pl-0.5">
                        {cfValueRange
                          ? `Enter a value between ${cfValueRange.min.toFixed(2)} and ${cfValueRange.max.toFixed(2)}`
                          : 'Please enter a valid number'}
                      </p>
                    )}
                  </div>
                ) : (
                  <SearchableDropdown
                    selectedColumn={configData.cfDesiredClass}
                    onSelect={(val) =>
                      setConfigData({ ...configData, cfDesiredClass: val })
                    }
                    availableOptions={cfDesiredClasses}
                    placeholder="Select"
                    readonly={readonly}
                    disabled={isGenerating}
                    hasError={showFieldErrors && !configData.cfDesiredClass}
                  />
                )}
              </div>

            </div>
          )}

          {/* ── CF Instance Index & LIME Instance Index ── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`flex items-center text-sm font-medium mb-2 ${cfIndexError ? 'text-[#EF4D5F]' : 'text-gray-900'}`}>
                CF Instance Index (0-{maxIndex}) <span className="text-red-500 ml-0.5">*</span>
                <FieldTooltip lines={cfInstanceTooltip} position="right" />
              </label>
              <input
                type="number"
                min="0"
                max={maxIndex}
                step="1"
                value={isNaN(configData.cfInstanceIndex) ? '' : configData.cfInstanceIndex}
                onChange={(e) => {
                  if (!readonly && !isGenerating) {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                    setConfigData({ ...configData, cfInstanceIndex: val });
                  }
                }}
                disabled={readonly || isGenerating}
                className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${cfIndexError
                    ? 'border-[#EF4D5F] bg-[#FFF7F8] text-[#EF4D5F]'
                    : 'border-gray-300'
                  } ${readonly || isGenerating ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              />
              {cfIndexError && (
                <p className="text-xs text-[#EF4D5F] mt-1 pl-0.5">CF Instance Index must be between 0 and {maxIndex}</p>
              )}
            </div>

            <div>
              <label className={`flex items-center text-sm font-medium mb-2 ${limeIndexError ? 'text-[#EF4D5F]' : 'text-gray-900'}`}>
                LIME Instance Index (0-{maxIndex}) <span className="text-red-500 ml-0.5">*</span>
                <FieldTooltip lines={limeInstanceTooltip} position="left" />
              </label>
              <input
                type="number"
                min="0"
                max={maxIndex}
                value={isNaN(configData.limeInstanceIndex) ? '' : configData.limeInstanceIndex}
                onChange={(e) => {
                  if (!readonly && !isGenerating) {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                    setConfigData({ ...configData, limeInstanceIndex: val });
                  }
                }}
                disabled={readonly || isGenerating}
                className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${limeIndexError
                    ? 'border-[#EF4D5F] bg-[#FFF7F8] text-[#EF4D5F]'
                    : 'border-gray-300'
                  } ${readonly || isGenerating ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              />
              {limeIndexError && (
                <p className="text-xs text-[#EF4D5F] mt-1 pl-0.5">LIME Instance Index must be between 0 and {maxIndex}</p>
              )}
            </div>
          </div>

          {/* ── PDP Features (hidden for timeseries) ── */}
          {!isTimeseries && (
            <div className="rounded-lg p-4" style={{ backgroundColor: '#FAFAFA' }}>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center text-sm font-medium text-gray-900">
                  PDP Features
                  <FieldTooltip lines={pdpFeaturesTooltip} position="right" />
                </label>
                <label className={`flex items-center gap-2 ${readonly || isGenerating ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    disabled={readonly || isGenerating}
                    className="w-4 h-4 border-gray-300 rounded"
                    style={{ accentColor: '#8e78b7' }}
                  />
                  <span className="text-sm font-medium text-gray-700">Select All</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Select features to include in the PDP analysis. If none are selected, all features will be used.
              </p>

              <div className="grid grid-cols-3 gap-x-8 gap-y-3 max-h-80 overflow-y-auto">
                {featuresList.map((feature) => (
                  <label key={feature} className={`flex items-center gap-2 ${readonly || isGenerating ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={configData.pdpFeatures.includes(feature)}
                      onChange={() => toggleFeature(feature)}
                      disabled={readonly || isGenerating}
                      className="w-4 h-4 border-gray-300 rounded"
                      style={{ accentColor: '#8e78b7' }}
                    />
                    <span className="text-sm text-gray-700 break-words">{feature}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-end gap-3 font-satoshi shadow-[0_-2px_10px_0px_rgba(0,0,0,0.07)]">
          <button
            onClick={() => {
              setConfigData({
                pdpTargetClass: '',
                cfDesiredClass: '',
                pdpTargetValue: '',
                cfDesiredValue: '',
                cfInstanceIndex: 0,
                limeInstanceIndex: 0,
                pdpFeatures: []
              });
              setShowFieldErrors(false);
              onClose();
            }}
            disabled={isGenerating}
            className={`px-6 py-2 rounded-lg ${tw.secondaryButton} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg text-sm font-medium transition-colors hover:bg-[#7d67a6] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isGenerating ? 'Processing...' : 'Generate Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfigurationModal;