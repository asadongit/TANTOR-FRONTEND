import { Webhook, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useAIPlayground } from '../../../../context/AIPlaygroundContext';
import { tw } from '../../../../components/themeContext';

const DATA_DRIFT_DEFAULTS = {
  distribution_drift_threshold: 0,
  statistical_significance_level: 0,
  information_stability_threshold: 0,
  target_stability_threshold: 0,
};

const MODEL_DRIFT_DEFAULTS = {
  prediction_drift_threshold: 0,
  performance_drift_threshold: -1,
};

const getThresholdValues = (thresholdState, modelKey, defaults) => {
  const baseValues = Object.keys(defaults).reduce((acc, key) => {
    acc[key] = typeof thresholdState?.[key] === 'number' ? thresholdState[key] : defaults[key];
    return acc;
  }, {});

  if (!modelKey) {
    return baseValues;
  }

  const modelValues = thresholdState?.[modelKey];
  if (modelValues && typeof modelValues === 'object' && !Array.isArray(modelValues)) {
    return Object.keys(defaults).reduce((acc, key) => {
      acc[key] = typeof modelValues[key] === 'number' ? modelValues[key] : baseValues[key];
      return acc;
    }, { ...baseValues });
  }

  return baseValues;
};

const updateThresholdValue = (thresholdState, modelKey, field, value, defaults) => {
  if (!modelKey) {
    return {
      ...thresholdState,
      [field]: value,
    };
  }

  const currentModelValues = getThresholdValues(thresholdState, modelKey, defaults);
  return {
    ...thresholdState,
    [modelKey]: {
      ...currentModelValues,
      [field]: value,
    },
  };
};

const DeliveryAlertsTab = () => {
  const { schedulerState, setSchedulerState } = useAIPlayground();
  const [isDataDriftExpanded, setIsDataDriftExpanded] = useState(true);
  const [isModelDriftExpanded, setIsModelDriftExpanded] = useState(true);

  const isEnsembleMode = Boolean(schedulerState.is_ensemble && Array.isArray(schedulerState.model) && schedulerState.model.length > 0);
  const ensembleModels = isEnsembleMode
    ? schedulerState.model.map((modelName, index) => ({
      modelName,
      modelId: Array.isArray(schedulerState.model_id) ? schedulerState.model_id[index] || modelName : modelName,
    }))
    : [];

  const isDataDriftEnabled = schedulerState.data_drift_check === 1;
  const isModelDriftEnabled = schedulerState.model_drift_check === 1;

  const handleDataDriftToggle = (enabled) => {
    setSchedulerState(prev => ({
      ...prev,
      data_drift_check: enabled ? 1 : 0
    }));
    if (enabled) {
      setIsDataDriftExpanded(true);
    } else {
      setIsDataDriftExpanded(false);
    }
  };

  const handleModelDriftToggle = (enabled) => {
    setSchedulerState(prev => ({
      ...prev,
      model_drift_check: enabled ? 1 : 0
    }));
    if (enabled) {
      setIsModelDriftExpanded(true);
    } else {
      setIsModelDriftExpanded(false);
    }
  };

  const handleDataDriftChange = (field, value) => {
    setSchedulerState(prev => ({
      ...prev,
      data_drift_threshold: {
        ...prev.data_drift_threshold,
        [field]: value
      }
    }));
  };

  const handleDataDriftChangeForModel = (modelKey, field, value) => {
    setSchedulerState(prev => ({
      ...prev,
      data_drift_threshold: updateThresholdValue(prev.data_drift_threshold, modelKey, field, value, DATA_DRIFT_DEFAULTS)
    }));
  };

  const handleModelDriftChange = (field, value) => {
    setSchedulerState(prev => ({
      ...prev,
      model_drift_threshold: {
        ...prev.model_drift_threshold,
        [field]: value
      }
    }));
  };

  const handleModelDriftChangeForModel = (modelKey, field, value) => {
    setSchedulerState(prev => ({
      ...prev,
      model_drift_threshold: updateThresholdValue(prev.model_drift_threshold, modelKey, field, value, MODEL_DRIFT_DEFAULTS)
    }));
  };

  const handleAlertChannelChange = (field, value) => {
    setSchedulerState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderSlider = (label, value, onChange, min = 0, max = 1, step = 0.01, reversedLabels = false) => {
    const range = max - min;
    const safeValue = Number.isFinite(value) ? value : min;
    const percentage = ((safeValue - min) / range) * 100;

    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <style>{`
          .custom-slider {
            -webkit-appearance: none;
            appearance: none;
            outline: none;
          }
          .custom-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #ffffff;
            border: 2.5px solid #8E77BB;
            cursor: pointer;
            box-shadow: 0 1px 4px rgba(142, 119, 187, 0.25);
          }
          .custom-slider::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #ffffff;
            border: 2.5px solid #8E77BB;
            cursor: pointer;
            box-shadow: 0 1px 4px rgba(142, 119, 187, 0.25);
          }
        `}</style>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>
          <span className="text-base font-semibold text-gray-900">
            {safeValue.toFixed(2)}
          </span>
        </div>
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={safeValue}
            onChange={onChange}
            className="custom-slider w-full h-2 rounded-lg cursor-pointer"
            style={{
              background: `linear-gradient(to right, #8e78b7 0%, #8e78b7 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
            }}
          />
          <div className="absolute" style={{ left: `calc(${percentage}% - 20px)`, top: '20px' }}>
            <div className="bg-[#8e78b7] text-white text-xs px-2 py-0.5 rounded font-medium">
              {safeValue.toFixed(2)}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm text-gray-600">{reversedLabels ? 'Lenient' : 'Strict'}</span>
          <span className="text-sm text-gray-600">{reversedLabels ? 'Strict' : 'Lenient'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">

      {/* Guardrail Settings + Alert Channels combined */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className={tw.sectionHeading}>Guardrail Setting</h2>
        <p className="text-sm text-gray-500 mb-6">
          Define thresholds to detect, warn, or halt model runs when data or performance drifts.
        </p>

        {/* Data Drift Thresholds */}
        <div className="bg-white rounded-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            {/* Left: title + description */}
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Global Data Drift Thresholds
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Set default limits to flag or block model runs based on the Population.
              </p>
            </div>

            {/* Right: toggle + chevron */}
            <div className="flex items-center gap-3 ml-4 flex-shrink-0">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDataDriftEnabled}
                  onChange={(e) => handleDataDriftToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#8e78b7] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
              </label>
              {isDataDriftEnabled && (
                <button
                  onClick={() => setIsDataDriftExpanded(!isDataDriftExpanded)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {isDataDriftExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {isDataDriftEnabled && isDataDriftExpanded && (
            isEnsembleMode ? (
              <div className="space-y-4">
                {ensembleModels.map(({ modelName, modelId }) => {
                  const dataThreshold = getThresholdValues(schedulerState.data_drift_threshold, modelId, DATA_DRIFT_DEFAULTS);
                  return (
                    <div key={modelId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-900">{modelName}</h4>
                        <p className="text-xs text-gray-500 break-all">Model ID: {modelId}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderSlider(
                          'Distribution Drift Threshold',
                          dataThreshold.distribution_drift_threshold,
                          (e) => handleDataDriftChangeForModel(modelId, 'distribution_drift_threshold', parseFloat(e.target.value))
                        )}
                        {renderSlider(
                          'Statistical Significance Level',
                          dataThreshold.statistical_significance_level,
                          (e) => handleDataDriftChangeForModel(modelId, 'statistical_significance_level', parseFloat(e.target.value)),
                          0, 1, 0.01, true
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        {renderSlider(
                          'Information Stability Threshold',
                          dataThreshold.information_stability_threshold,
                          (e) => handleDataDriftChangeForModel(modelId, 'information_stability_threshold', parseFloat(e.target.value))
                        )}
                        {renderSlider(
                          'Target Stability Threshold',
                          dataThreshold.target_stability_threshold,
                          (e) => handleDataDriftChangeForModel(modelId, 'target_stability_threshold', parseFloat(e.target.value))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderSlider(
                    'Distribution Drift Threshold',
                    getThresholdValues(schedulerState.data_drift_threshold, null, DATA_DRIFT_DEFAULTS).distribution_drift_threshold,
                    (e) => handleDataDriftChange('distribution_drift_threshold', parseFloat(e.target.value))
                  )}
                  {renderSlider(
                    'Statistical Significance Level',
                    getThresholdValues(schedulerState.data_drift_threshold, null, DATA_DRIFT_DEFAULTS).statistical_significance_level,
                    (e) => handleDataDriftChange('statistical_significance_level', parseFloat(e.target.value)),
                    0, 1, 0.01, true
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderSlider(
                    'Information Stability Threshold',
                    getThresholdValues(schedulerState.data_drift_threshold, null, DATA_DRIFT_DEFAULTS).information_stability_threshold,
                    (e) => handleDataDriftChange('information_stability_threshold', parseFloat(e.target.value))
                  )}
                  {renderSlider(
                    'Target Stability Threshold',
                    getThresholdValues(schedulerState.data_drift_threshold, null, DATA_DRIFT_DEFAULTS).target_stability_threshold,
                    (e) => handleDataDriftChange('target_stability_threshold', parseFloat(e.target.value))
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* Model Drift Thresholds */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            {/* Left: title + description */}
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Model Drift Monitor
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Receive alerts when model performance drops below the baseline.
              </p>
            </div>

            {/* Right: toggle + chevron */}
            <div className="flex items-center gap-3 ml-4 flex-shrink-0">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isModelDriftEnabled}
                  onChange={(e) => handleModelDriftToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#8e78b7] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
              </label>
              {isModelDriftEnabled && (
                <button
                  onClick={() => setIsModelDriftExpanded(!isModelDriftExpanded)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {isModelDriftExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {isModelDriftEnabled && isModelDriftExpanded && (
            isEnsembleMode ? (
              <div className="space-y-4">
                {ensembleModels.map(({ modelName, modelId }) => {
                  const modelThreshold = getThresholdValues(schedulerState.model_drift_threshold, modelId, MODEL_DRIFT_DEFAULTS);
                  return (
                    <div key={modelId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-900">{modelName}</h4>
                        <p className="text-xs text-gray-500 break-all">Model ID: {modelId}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderSlider(
                          'Prediction Drift Threshold',
                          modelThreshold.prediction_drift_threshold,
                          (e) => handleModelDriftChangeForModel(modelId, 'prediction_drift_threshold', parseFloat(e.target.value))
                        )}
                        {renderSlider(
                          'Performance Drift Threshold',
                          modelThreshold.performance_drift_threshold,
                          (e) => handleModelDriftChangeForModel(modelId, 'performance_drift_threshold', parseFloat(e.target.value)),
                          -1, 0, 0.01, true
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSlider(
                  'Prediction Drift Threshold',
                  getThresholdValues(schedulerState.model_drift_threshold, null, MODEL_DRIFT_DEFAULTS).prediction_drift_threshold,
                  (e) => handleModelDriftChange('prediction_drift_threshold', parseFloat(e.target.value))
                )}
                {renderSlider(
                  'Performance Drift Threshold',
                  getThresholdValues(schedulerState.model_drift_threshold, null, MODEL_DRIFT_DEFAULTS).performance_drift_threshold,
                  (e) => handleModelDriftChange('performance_drift_threshold', parseFloat(e.target.value)),
                  -1, 0, 0.01, true
                )}
              </div>
            )
          )}
        </div>

        {/* Alert Channels — merged inside the same gray card */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className={tw.sectionHeading}>Alert Channels</h2>
          <p className="text-sm text-gray-500 mb-4">Select how alerts should be delivered.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                key: 'emailEnabled',
                label: 'Email',
                icon: (
                  <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                )
              }
            ].map(({ key, label, icon }) => (
              <label key={key} className={`flex items-center gap-3 ${key === 'emailEnabled' ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={key === 'emailEnabled' ? true : schedulerState[key]}
                  onChange={(e) => handleAlertChannelChange(key, e.target.checked)}
                  className={`w-5 h-4 border-gray-300 rounded ${key === 'emailEnabled' ? 'cursor-not-allowed accent-[#8e78b7]' : 'text-[#8e78b7]'}`}
                />
                {icon}
                <span className={`text-base font-medium text-gray-900 ${key === 'emailEnabled' ? 'opacity-60' : ''}`}>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default DeliveryAlertsTab;