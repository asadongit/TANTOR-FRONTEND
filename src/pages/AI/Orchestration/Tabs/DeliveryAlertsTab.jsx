import { Webhook, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useAIPlayground } from '../../../../context/AIPlaygroundContext';

const DeliveryAlertsTab = () => {
  const { schedulerState, setSchedulerState } = useAIPlayground();
  const [isDataDriftExpanded, setIsDataDriftExpanded] = useState(true);
  const [isModelDriftExpanded, setIsModelDriftExpanded] = useState(true);

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

  const handleModelDriftChange = (field, value) => {
    setSchedulerState(prev => ({
      ...prev,
      model_drift_threshold: {
        ...prev.model_drift_threshold,
        [field]: value
      }
    }));
  };

  const handleAlertChannelChange = (field, value) => {
    setSchedulerState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderSlider = (label, value, onChange, min = 0, max = 1, step = 0.01) => {
    const range = max - min;
    const percentage = ((value - min) / range) * 100;

    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>
          <span className="text-base font-semibold text-gray-900">
            {value.toFixed(2)}
          </span>
        </div>
        <div className="relative">
          <input 
            type="range" 
            min={min} 
            max={max} 
            step={step} 
            value={value} 
            onChange={onChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
            style={{
              background: `linear-gradient(to right, #8e78b7 0%, #8e78b7 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
            }}
          />
          <div className="absolute" style={{ left: `calc(${percentage}% - 20px)`, top: '20px' }}>
            <div className="bg-[#8e78b7] text-white text-xs px-2 py-0.5 rounded font-medium">
              {value.toFixed(2)}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm text-gray-600">Strict</span>
          <span className="text-sm text-gray-600">Loose</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Guardrail Settings */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1.5">Guardrail Setting</h2>
        <p className="text-sm text-gray-500 mb-6">
          Define thresholds to detect, warn, or halt model runs when data or performance drifts.
        </p>

        {/* Data Drift Thresholds */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isDataDriftEnabled}
                  onChange={(e) => handleDataDriftToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#8e78b7] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
              </label>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Global Data Drift Thresholds
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Set default limits to flag or block model runs based on the Population.
                </p>
              </div>
            </div>
            {isDataDriftEnabled && (
              <button 
                onClick={() => setIsDataDriftExpanded(!isDataDriftExpanded)}
                className="text-gray-500 hover:text-gray-700 transition-colors ml-2"
              >
                {isDataDriftExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            )}
          </div>

          {isDataDriftEnabled && isDataDriftExpanded && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSlider(
                  'Distribution Drift Threshold',
                  schedulerState.data_drift_threshold.distribution_drift_threshold,
                  (e) => handleDataDriftChange('distribution_drift_threshold', parseFloat(e.target.value))
                )}
                {renderSlider(
                  'Statistical Significance Level',
                  schedulerState.data_drift_threshold.statistical_significance_level,
                  (e) => handleDataDriftChange('statistical_significance_level', parseFloat(e.target.value))
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSlider(
                  'Information Stability Threshold',
                  schedulerState.data_drift_threshold.information_stability_threshold,
                  (e) => handleDataDriftChange('information_stability_threshold', parseFloat(e.target.value))
                )}
                {renderSlider(
                  'Target Stability Threshold',
                  schedulerState.data_drift_threshold.target_stability_threshold,
                  (e) => handleDataDriftChange('target_stability_threshold', parseFloat(e.target.value))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Model Drift Thresholds */}
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isModelDriftEnabled}
                  onChange={(e) => handleModelDriftToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#8e78b7] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
              </label>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Model Drift Monitor
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Receive alerts when model performance drops below the baseline.
                </p>
              </div>
            </div>
            {isModelDriftEnabled && (
              <button 
                onClick={() => setIsModelDriftExpanded(!isModelDriftExpanded)}
                className="text-gray-500 hover:text-gray-700 transition-colors ml-2"
              >
                {isModelDriftExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            )}
          </div>

          {isModelDriftEnabled && isModelDriftExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderSlider(
                'Prediction Drift Threshold',
                schedulerState.model_drift_threshold.prediction_drift_threshold,
                (e) => handleModelDriftChange('prediction_drift_threshold', parseFloat(e.target.value))
              )}
              {renderSlider(
                'Performance Drift Threshold',
                schedulerState.model_drift_threshold.performance_drift_threshold,
                (e) => handleModelDriftChange('performance_drift_threshold', parseFloat(e.target.value)),
                -1,
                0,
                0.01
              )}
            </div>
          )}
        </div>
      </div>

      {/* Alert Channels */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1.5">Alert Channels</h2>
        <p className="text-sm text-gray-500 mb-4">Select how alerts should be delivered.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
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
            // {
            //   key: 'slackEnabled',
            //   label: 'Slack',
            //   icon: (
            //     <svg className="w-6 h-6" viewBox="0 0 24 24">
            //       <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A" />
            //     </svg>
            //   )
            // },
            // {
            //   key: 'webhookEnabled',
            //   label: 'Webhook',
            //   icon: <Webhook className="w-6 h-6 text-purple-600" />
            // }
          ].map(({ key, label, icon }) => (
            <label key={key} className={`flex items-center gap-3 ${key === 'emailEnabled' ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={key === 'emailEnabled' ? true : schedulerState[key]}
                onChange={(e) => handleAlertChannelChange(key, e.target.checked)}
                // disabled={key === 'emailEnabled'}
                className={`w-5 h-4 border-gray-300 rounded ${key === 'emailEnabled' ? 'cursor-not-allowed accent-[#8e78b7]' : 'text-[#8e78b7]'}`}
              />
              {icon}
              <span className={`text-base font-medium text-gray-900 ${key === 'emailEnabled' ? 'opacity-60' : ''}`}>{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeliveryAlertsTab;