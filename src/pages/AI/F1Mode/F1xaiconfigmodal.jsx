import { useState, useEffect } from "react";

function F1XAIConfigModal({ isOpen, onClose, onGenerate, launchData, isGenerating = false }) {
  const hostnameAI = window._env_?.VITE_AI_API;
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [configData, setConfigData] = useState({
    pdpTargetClass: '',
    cfDesiredClass: '',
    cfInstanceIndex: 0,
    limeInstanceIndex: 0,
    pdpFeatures: [],
  });

  const targetClasses = launchData?.target_classes ?? [];
  const rowCount = launchData?.raw_data_shape?.[0] ?? 0;
  const featuresList = launchData?.processed_feature_columns ?? [];

  useEffect(() => {
    if (isOpen) {
      setConfigData({
        pdpTargetClass: '',
        cfDesiredClass: '',
        cfInstanceIndex: 0,
        limeInstanceIndex: 0,
        pdpFeatures: [],
      });
    }
  }, [isOpen]);

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
    !configData.pdpTargetClass ||
    !configData.cfDesiredClass ||
    !cfIndexValid ||
    !limeIndexValid;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] max-w-[720px] w-full max-h-[90vh] overflow-y-auto">

        {/* ── Header ── */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <h3 className="font-[Satoshi,sans-serif] font-bold text-lg text-gray-900">
            XAI Configurations
          </h3>
          <div className="flex items-center gap-2.5">
            {/* Info tooltip */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowInfoTooltip(true)}
                onMouseLeave={() => setShowInfoTooltip(false)}
                className="bg-transparent border-none cursor-pointer p-0 flex"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#9CA3AF" strokeWidth="2" />
                  <path d="M12 8v4M12 16h.01" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              {showInfoTooltip && (
                <div className="absolute right-0 top-7 w-[300px] bg-gray-800 text-white text-xs p-3 rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.2)] z-[60] leading-relaxed">
                  <p className="mb-1"><strong>SHAP:</strong> Shows feature importance and contribution to predictions.</p>
                  <p className="mb-1"><strong>PDP:</strong> Reveals how features influence model output across ranges.</p>
                  <p className="mb-1"><strong>LIME:</strong> Provides local explanations for individual predictions.</p>
                  <p className="mb-1"><strong>Counterfactuals:</strong> Suggest minimal changes needed to achieve different outcomes.</p>
                  <p><strong>Feature Flip:</strong> Summarizes the effect of flipping key features on model decisions.</p>
                </div>
              )}
            </div>
            {/* Close */}
            <button
              onClick={onClose}
              disabled={isGenerating}
              className={`bg-transparent border-none p-0 flex ${isGenerating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="#818181" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-6 flex flex-col gap-5">

          {/* PDP Target Class + CF Desired Class */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                PDP Target Class <span className="text-red-500">*</span>
              </label>
              <select
                value={configData.pdpTargetClass}
                onChange={e => !isGenerating && setConfigData({ ...configData, pdpTargetClass: e.target.value })}
                disabled={isGenerating}
                className={`w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 outline-none ${isGenerating ? 'bg-gray-50 cursor-not-allowed' : 'bg-white cursor-pointer'}`}
              >
                <option value="">Select class</option>
                {targetClasses.map(cls => (
                  <option key={cls} value={cls.toString()}>Class {cls}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                CF Desired Class <span className="text-red-500">*</span>
              </label>
              <select
                value={configData.cfDesiredClass}
                onChange={e => !isGenerating && setConfigData({ ...configData, cfDesiredClass: e.target.value })}
                disabled={isGenerating}
                className={`w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 outline-none ${isGenerating ? 'bg-gray-50 cursor-not-allowed' : 'bg-white cursor-pointer'}`}
              >
                <option value="">Select class</option>
                {targetClasses.map(cls => (
                  <option key={cls} value={cls.toString()}>Class {cls}</option>
                ))}
              </select>
            </div>
          </div>

          {/* CF Instance Index + LIME Instance Index */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                CF Instance Index (0–{rowCount}) <span className="text-red-500">*</span>
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
                className={`w-full px-3 py-2 rounded-lg border text-sm text-gray-900 outline-none box-border ${!cfIndexValid ? 'border-red-500' : 'border-gray-300'} ${isGenerating ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
              />
              {!cfIndexValid && (
                <p className="text-red-500 text-xs mt-1">
                  Must be between 0 and {rowCount}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                LIME Instance Index (0–{rowCount}) <span className="text-red-500">*</span>
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
                className={`w-full px-3 py-2 rounded-lg border text-sm text-gray-900 outline-none box-border ${!limeIndexValid ? 'border-red-500' : 'border-gray-300'} ${isGenerating ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
              />
              {!limeIndexValid && (
                <p className="text-red-500 text-xs mt-1">
                  Must be between 0 and {rowCount}
                </p>
              )}
            </div>
          </div>

          {/* PDP Features */}
          <div className="bg-[#FAFAFA] rounded-[10px] p-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-900">PDP Features</label>
              <label className={`flex items-center gap-1.5 ${isGenerating ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  disabled={isGenerating}
                  className="w-[15px] h-[15px] accent-[#8D1718]"
                />
                <span className="text-[13px] font-medium text-gray-700">Select All</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Select features to include in PDP analysis. If none selected, all features will be used.
            </p>
            <div className="grid grid-cols-3 gap-x-6 gap-y-2.5 max-h-[200px] overflow-y-auto">
              {featuresList.map(feature => (
                <label key={feature} className={`flex items-center gap-2 ${isGenerating ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={configData.pdpFeatures.includes(feature)}
                    onChange={() => toggleFeature(feature)}
                    disabled={isGenerating}
                    className="w-[15px] h-[15px] accent-[#8D1718] shrink-0"
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
            className={`px-5 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium font-[Satoshi,sans-serif] ${isGenerating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            Cancel
          </button>
          <button
            onClick={() => onGenerate(configData)}
            disabled={isSubmitDisabled}
            style={{
              background: isSubmitDisabled
                ? 'rgba(141,23,24,0.35)'
                : 'linear-gradient(270deg, #D30101 0%, #6D0101 117.78%)',
            }}
            className={`px-6 py-2 rounded-lg border-none text-white text-sm font-semibold font-[Satoshi,sans-serif] flex items-center gap-2 transition-all duration-150 ${isSubmitDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {isGenerating && (
              <svg style={{ animation: 'f1spin 0.8s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none">
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