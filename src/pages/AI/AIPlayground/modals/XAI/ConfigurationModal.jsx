import { useState, useEffect } from "react";
import InfoIcons from '../../../../../assets/ai/infoIcon.svg'
import { tw, aithemestyle } from '../../../../../components/themeContext';

function ConfigurationModal({ isOpen, onClose, onGenerate, xaiConfig, readonly = false, isGenerating = false }) {
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [configData, setConfigData] = useState({
    pdpTargetClass: '',
    cfDesiredClass: '',
    cfInstanceIndex: 0,
    limeInstanceIndex: 0,
    pdpFeatures: []
  });

  useEffect(() => {
    if (xaiConfig) {
      setConfigData({
        pdpTargetClass: '',
        cfDesiredClass: '',
        cfInstanceIndex: 0,
        limeInstanceIndex: 0,
        pdpFeatures: []
      });
    }
  }, [xaiConfig]);

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
  const pdpTargetClasses = xaiConfig.pdp_target_classes || [];
  const cfDesiredClasses = xaiConfig.cf_desired_classes || [];
  const allSelected = featuresList.length > 0 && featuresList.every(f => configData.pdpFeatures.includes(f));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Configurations</h3>
          <div className="flex items-center gap-2">
            <div className="relative mt-1">
              <button
                className="text-gray-400 hover:text-gray-600"
                onMouseEnter={() => setShowInfoTooltip(true)}
                onMouseLeave={() => setShowInfoTooltip(false)}
              >
                {/* Info SVG icon, color #818181 */}
                <img src={InfoIcons} alt="info" style={{ width: 20, height: 20, filter: 'brightness(0) saturate(100%) invert(54%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(88%)' }} />
              </button>

              {showInfoTooltip && (
                <div className="absolute right-0 top-8 w-96 bg-gray-800 text-white text-xs p-3 rounded-lg shadow-xl z-50 space-y-1">
                  <p><strong>SHAP:</strong> Shows feature importance and contribution to predictions.</p>
                  <p><strong>PDP:</strong> Reveals how features influence model output across ranges.</p>
                  <p><strong>LIME:</strong> Provides local explanations for individual predictions.</p>
                  <p><strong>Counterfactuals:</strong> Suggest minimal changes needed to achieve different outcomes.</p>
                  <p><strong>Feature Flip:</strong> Summarizes the effect of flipping key features on model decisions.</p>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isGenerating}
            >
              {/* Close SVG icon, color #818181 */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="#818181" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Model Name</label>
            <input
              type="text"
              value={xaiConfig.model_name || ''}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                PDP Target Class <span className="text-red-500">*</span>
              </label>
              <select
                value={configData.pdpTargetClass}
                onChange={(e) => !readonly && !isGenerating && setConfigData({ ...configData, pdpTargetClass: e.target.value })}
                disabled={readonly || isGenerating}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${readonly || isGenerating ? 'bg-gray-50 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
              >
                <option value="">Select</option>
                {pdpTargetClasses.map((cls) => (
                  <option key={cls} value={cls.toString()}>
                    Class {cls}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                CF Desired Class <span className="text-red-500">*</span>
              </label>
              <select
                value={configData.cfDesiredClass}
                onChange={(e) => !readonly && !isGenerating && setConfigData({ ...configData, cfDesiredClass: e.target.value })}
                disabled={readonly || isGenerating}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${readonly || isGenerating ? 'bg-gray-50 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
              >
                <option value="">Select</option>
                {cfDesiredClasses.map((cls) => (
                  <option key={cls} value={cls.toString()}>
                    Class {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                CF Instance Index (0-{maxIndex}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max={maxIndex}
                step="1"
                value={configData.cfInstanceIndex}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!readonly && !isGenerating) {
                    setConfigData({ ...configData, cfInstanceIndex: value });
                  }
                }}
                disabled={readonly || isGenerating}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm ${readonly || isGenerating ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              />
              {!(configData.cfInstanceIndex >= 0 && configData.cfInstanceIndex <= maxIndex) && (
                <p className="text-xs text-red-500 mt-1">CF Instance Index should be between 0 and {maxIndex}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                LIME Instance Index (0-{maxIndex}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max={maxIndex}
                value={configData.limeInstanceIndex}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!readonly && !isGenerating) {
                    setConfigData({ ...configData, limeInstanceIndex: value });
                  }
                }}
                disabled={readonly || isGenerating}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm ${readonly || isGenerating ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              />
              {!(configData.limeInstanceIndex >= 0 && configData.limeInstanceIndex <= maxIndex) && (
                <p className="text-xs text-red-500 mt-1">LIME Instance Index should be between 0 and {maxIndex}</p>
              )}
            </div>
          </div>

          {/* PDP Features */}
          <div className="rounded-lg p-4" style={{ backgroundColor: '#FAFAFA' }}>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-900">PDP Features</label>
              {/* Select All */}
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
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className={`px-6 py-2 rounded-lg ${tw.secondaryButton} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Cancel
          </button>
          <button
            onClick={() => onGenerate(configData)}
            disabled={isGenerating || !configData.pdpTargetClass || !configData.cfDesiredClass || !(configData.cfInstanceIndex >= 0 && configData.cfInstanceIndex <= maxIndex) || !(configData.limeInstanceIndex >= 0 && configData.limeInstanceIndex <= maxIndex)}
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