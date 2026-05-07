import { useState, useEffect } from "react";

const FieldTooltip = ({ lines, position = 'right' }) => {
  const [visible, setVisible] = useState(false);

  const bubbleStyle = position === 'left'
    ? { right: 0, top: '1.5rem' }
    : { left: 0, top: '1.5rem' };

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
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
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
        </div>
      )}
    </div>
  );
};

function F1XAIConfigModal({ isOpen, onClose, onGenerate, launchData, isGenerating = false ,isRegression}) {
  const hostnameAI = window._env_?.VITE_AI_API;
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [configData, setConfigData] = useState({
  pdpTargetClass: '',
  cfDesiredClass: '',
  pdpTargetValue: '',
  cfDesiredValue: '',
    cfInstanceIndex: 0,
    limeInstanceIndex: 0,
    pdpFeatures: [],
  });

  const targetClasses = launchData?.target_classes ?? [];
  const rowCount = launchData?.test_data_shape?.[0] ?? 0;
  const featuresList = launchData?.processed_feature_columns ?? [];
  const pdpTargetTooltip = [
    { bold: 'Partial Dependence Plot (PDP): ', rest: "Shows the average effect of a feature on a model's prediction by marginalizing over other features. Helps understand global feature influence across the dataset." },
  ];

  const pdpFeaturesTooltip = [
    { bold: 'PDP Features: ', rest: 'A graphical visualization of the partial dependence function. Displays how predicted outcomes change as one feature varies.' }
  ];

  const cfDesiredTooltip = [
    { bold: 'Counterfactual Explanation: ', rest: 'An explanation that shows the minimal changes needed in input features to alter a model\'s prediction. Answers the question: “What needs to change to get a different outcome?”' },
    { bold: 'Desired Class: ', rest: 'The target outcome you want the model to predict instead.' }
  ];

  const cfInstanceTooltip = [
    { bold: 'Counterfactual Explanation: ', rest: 'An explanation that shows the minimal changes needed in input features to alter a model\'s prediction. Answers the question: “What needs to change to get a different outcome?”' },
    { bold: 'Instance index: ', rest: 'The specific data point (row) for which the counterfactual explanation is generated.' }
  ];

  const limeInstanceTooltip = [
    { bold: 'LIME (Local Interpretable Model-agnostic Explanations): ', rest: 'A technique that explains individual predictions by approximating the model locally with a simple interpretable model. It highlights which features contributed most to a specific prediction.' }
  ];

  useEffect(() => {
    if (isOpen) {
      setConfigData(prev => ({
        ...prev,
        pdpTargetClass: '',
        cfDesiredClass: '',
        pdpTargetValue: '',
        cfDesiredValue: '',
        // Only reset the relevant fields for the selected mode
        ...(isRegression
          ? { pdpTargetClass: '', cfDesiredClass: '' }
          : { pdpTargetValue: '', cfDesiredValue: '' }),
        cfInstanceIndex: 0,
        limeInstanceIndex: 0,
        pdpFeatures: [],
      }));
    }
  }, [isOpen, isRegression]);

  const toggleFeature = (feature) => {
    if (isGenerating) return;
    setConfigData(prev => ({
      ...prev,
      pdpFeatures: prev.pdpFeatures.includes(feature)
        ? prev.pdpFeatures.filter(f => f !== feature)
        : [...prev.pdpFeatures, feature],
    }));
  };

  const toggleSelectAll = () => {
    if (isGenerating) return;
    const allSelected = featuresList.every(f => configData.pdpFeatures.includes(f));
    setConfigData(prev => ({
      ...prev,
      pdpFeatures: allSelected ? [] : [...featuresList],
    }));
  };

  const allSelected = featuresList.length > 0 && featuresList.every(f => configData.pdpFeatures.includes(f));

  const cfIndexValid =
    configData.cfInstanceIndex !== '' &&
    Number.isInteger(Number(configData.cfInstanceIndex)) &&
    Number(configData.cfInstanceIndex) >= 0 &&
    Number(configData.cfInstanceIndex) <= rowCount;

  const limeIndexValid =
    configData.limeInstanceIndex !== '' &&
    Number.isInteger(Number(configData.limeInstanceIndex)) &&
    Number(configData.limeInstanceIndex) >= 0 &&
    Number(configData.limeInstanceIndex) <= rowCount;

  const isSubmitDisabled =
    isGenerating ||
    (isRegression
      ? configData.pdpTargetValue === '' || isNaN(Number(configData.pdpTargetValue)) || configData.cfDesiredValue === '' || isNaN(Number(configData.cfDesiredValue))
      : !configData.pdpTargetClass || !configData.cfDesiredClass
    ) ||
    !cfIndexValid ||
    !limeIndexValid;
   
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4">
      <style>{`@keyframes f1spin { to { transform: rotate(360deg); } }`}</style>
      <div className="bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] max-w-[720px] w-full max-h-[90vh] overflow-y-auto">

        {/* ── Header ── */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <h3 className="font-bold text-lg text-gray-900" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            XAI Configurations
          </h3>
          <div className="flex items-center gap-2.5">
            {/* Info tooltip */}
            <div className="relative">
              <button
                className="flex items-center justify-center rounded-lg p-1.5 transition-colors"
                style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}
                onMouseEnter={() => setShowInfoTooltip(true)}
                onMouseLeave={() => setShowInfoTooltip(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#9CA3AF" strokeWidth="2" />
                  <path d="M12 8v4M12 16h.01" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              {showInfoTooltip && (
                <div
                  className="absolute right-0 top-9 w-80 text-white text-xs p-3 rounded-lg shadow-xl z-[60] space-y-1.5 leading-relaxed"
                  style={{ background: '#1f0a0a', border: '1px solid rgba(141,23,24,0.4)' }}
                >
                  <p><strong style={{ color: '#f87171' }}>SHAP:</strong> Shows feature importance and contribution to predictions.</p>
                  <p><strong style={{ color: '#f87171' }}>PDP:</strong> Reveals how features influence model output across ranges.</p>
                  <p><strong style={{ color: '#f87171' }}>LIME:</strong> Provides local explanations for individual predictions.</p>
                  <p><strong style={{ color: '#f87171' }}>Counterfactuals:</strong> Suggest minimal changes needed to achieve different outcomes.</p>
                  <p><strong style={{ color: '#f87171' }}>Feature Flip:</strong> Summarises the effect of flipping key features on model decisions.</p>
                </div>
              )}
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              disabled={isGenerating}
              className={`flex items-center justify-center ${isGenerating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:opacity-70'}`}
              style={{ background: 'none', border: 'none', padding: 0 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="#818181" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-6 flex flex-col gap-5">

          {/* PDP/CF fields: regression = value, else class */}
          <div className="grid grid-cols-2 gap-4">
            {isRegression ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    PDP Target Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={configData.pdpTargetValue}
                    onChange={e =>
                      !isGenerating &&
                      setConfigData({ ...configData, pdpTargetValue: e.target.value, pdpTargetClass: '' })
                    }
                    disabled={isGenerating}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    CF Desired Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={configData.cfDesiredValue}
                    onChange={e =>
                      !isGenerating &&
                      setConfigData({ ...configData, cfDesiredValue: e.target.value, cfDesiredClass: '' })
                    }
                    disabled={isGenerating}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    PDP Target Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={configData.pdpTargetClass}
                    onChange={e =>
                      !isGenerating &&
                      setConfigData({ ...configData, pdpTargetClass: e.target.value, pdpTargetValue: '' })
                    }
                    disabled={isGenerating}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  >
                    <option value="">Select class</option>
                    {targetClasses.map(cls => (
                      <option key={cls} value={cls.toString()}>
                        Class {cls}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    CF Desired Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={configData.cfDesiredClass}
                    onChange={e =>
                      !isGenerating &&
                      setConfigData({ ...configData, cfDesiredClass: e.target.value, cfDesiredValue: '' })
                    }
                    disabled={isGenerating}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  >
                    <option value="">Select class</option>
                    {targetClasses.map(cls => (
                      <option key={cls} value={cls.toString()}>
                        Class {cls}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* CF Instance Index + LIME Instance Index */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-900 mb-1.5">
                CF Instance Index (0–{rowCount}) <span className="text-red-500 ml-0.5">*</span>
                <FieldTooltip lines={cfInstanceTooltip} position="right" />
              </label>
              <input
                type="number"
                min={0}
                max={rowCount}
                step={1}
                value={configData.cfInstanceIndex}
                onChange={e => {
                  if (!isGenerating) {
                    const raw = e.target.value;
                    const val = raw === '' ? '' : parseInt(raw);
                    setConfigData({ ...configData, cfInstanceIndex: isNaN(val) ? '' : val });
                  }
                }}
                disabled={isGenerating}
                className="w-full px-3 py-2 rounded-lg border text-sm text-gray-900 transition-colors"
                style={{
                  borderColor: !cfIndexValid ? '#EF4D5F' : '#d1d5db',
                  background: !cfIndexValid ? '#FFF7F8' : isGenerating ? '#f9fafb' : '#fff',
                  outline: 'none',
                  cursor: isGenerating ? 'not-allowed' : 'auto',
                }}
                onFocus={e => { if (cfIndexValid) e.target.style.borderColor = '#8D1718'; e.target.style.boxShadow = '0 0 0 2px rgba(141,23,24,0.15)'; }}
                onBlur={e => { e.target.style.borderColor = !cfIndexValid ? '#EF4D5F' : '#d1d5db'; e.target.style.boxShadow = 'none'; }}
              />
              {!cfIndexValid && (
                <p className="text-red-500 text-xs mt-1">Must be between 0 and {rowCount}</p>
              )}
            </div>
            <div>
              <label className="flex items-center text-sm font-medium text-gray-900 mb-1.5">
                LIME Instance Index (0–{rowCount}) <span className="text-red-500 ml-0.5">*</span>
                <FieldTooltip lines={limeInstanceTooltip} position="left" />
              </label>
              <input
                type="number"
                min={0}
                max={rowCount}
                step={1}
                value={configData.limeInstanceIndex}
                onChange={e => {
                  if (!isGenerating) {
                    const raw = e.target.value;
                    const val = raw === '' ? '' : parseInt(raw);
                    setConfigData({ ...configData, limeInstanceIndex: isNaN(val) ? '' : val });
                  }
                }}
                disabled={isGenerating}
                className="w-full px-3 py-2 rounded-lg border text-sm text-gray-900 transition-colors"
                style={{
                  borderColor: !limeIndexValid ? '#EF4D5F' : '#d1d5db',
                  background: !limeIndexValid ? '#FFF7F8' : isGenerating ? '#f9fafb' : '#fff',
                  outline: 'none',
                  cursor: isGenerating ? 'not-allowed' : 'auto',
                }}
                onFocus={e => { if (limeIndexValid) e.target.style.borderColor = '#8D1718'; e.target.style.boxShadow = '0 0 0 2px rgba(141,23,24,0.15)'; }}
                onBlur={e => { e.target.style.borderColor = !limeIndexValid ? '#EF4D5F' : '#d1d5db'; e.target.style.boxShadow = 'none'; }}
              />
              {!limeIndexValid && (
                <p className="text-red-500 text-xs mt-1">Must be between 0 and {rowCount}</p>
              )}
            </div>
          </div>

          {/* PDP Features */}
          <div className="rounded-[10px] p-4" style={{ background: '#FAFAFA', border: '1px solid #F3F4F6' }}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center text-sm font-medium text-gray-900">
                PDP Features
                <FieldTooltip lines={pdpFeaturesTooltip} position="right" />
              </label>
              <label className={`flex items-center gap-1.5 ${isGenerating ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  disabled={isGenerating}
                  className="w-[15px] h-[15px]"
                  style={{ accentColor: '#8D1718' }}
                />
                <span className="text-[13px] font-medium text-gray-700">Select All</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Select features to include in PDP analysis. If none selected, all features will be used.
            </p>
            <div className="grid grid-cols-3 gap-x-6 gap-y-2.5 max-h-[200px] overflow-y-auto">
              {featuresList.map(feature => (
                <label
                  key={feature}
                  className={`flex items-center gap-2 ${isGenerating ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <input
                    type="checkbox"
                    checked={configData.pdpFeatures.includes(feature)}
                    onChange={() => toggleFeature(feature)}
                    disabled={isGenerating}
                    className="w-[15px] h-[15px] shrink-0"
                    style={{ accentColor: '#8D1718' }}
                  />
                  <span className="text-[13px] text-gray-700 break-words">{feature}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3.5 flex justify-end gap-2.5 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-5 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium transition-colors"
            style={{
              fontFamily: 'Satoshi, sans-serif',
              opacity: isGenerating ? 0.5 : 1,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => !isSubmitDisabled && onGenerate(configData)}
            disabled={isSubmitDisabled}
            className="px-6 py-2 rounded-lg border-none text-white text-sm font-semibold flex items-center gap-2 transition-all duration-150"
            style={{
              fontFamily: 'Satoshi, sans-serif',
              background: isSubmitDisabled
                ? 'rgba(141,23,24,0.30)'
                : 'linear-gradient(270deg, #D30101 0%, #6D0101 117.78%)',
              cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            {isGenerating && (
              <svg style={{ animation: 'f1spin 0.8s linear infinite', flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
                <path fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default F1XAIConfigModal;