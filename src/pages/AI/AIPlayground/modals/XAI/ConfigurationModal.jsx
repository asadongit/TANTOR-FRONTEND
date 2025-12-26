import { useState } from "react";

function ConfigurationModal({ isOpen, onClose, onGenerate, initialConfig }) {
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [configData, setConfigData] = useState(initialConfig);

  const pdpFeatureOptions = ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5'];

  const toggleFeature = (feature) => {
    setConfigData(prev => ({
      ...prev,
      pdpFeatures: prev.pdpFeatures.includes(feature)
        ? prev.pdpFeatures.filter(f => f !== feature)
        : [...prev.pdpFeatures, feature]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Configurations</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                className="text-gray-400 hover:text-gray-600"
                onMouseEnter={() => setShowInfoTooltip(true)}
                onMouseLeave={() => setShowInfoTooltip(false)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01"/>
                </svg>
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
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Model Alias</label>
              <select
                value={configData.modelAlias}
                onChange={(e) => setConfigData({ ...configData, modelAlias: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select</option>
                <option value="alias1">Alias 1</option>
                <option value="alias2">Alias 2</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">PDP Target Class</label>
              <select
                value={configData.pdpTargetClass}
                onChange={(e) => setConfigData({ ...configData, pdpTargetClass: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select</option>
                <option value="class1">Class 1</option>
                <option value="class2">Class 2</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">CS Desired Class</label>
              <select
                value={configData.cbDesiredClass}
                onChange={(e) => setConfigData({ ...configData, cbDesiredClass: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select</option>
                <option value="class1">Class 1</option>
                <option value="class2">Class 2</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">CF Instance Index</label>
              <select
                value={configData.cfInstanceIndex}
                onChange={(e) => setConfigData({ ...configData, cfInstanceIndex: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select</option>
                <option value="index1">Index 1</option>
                <option value="index2">Index 2</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <label className="block text-sm font-medium text-gray-900 mb-2">PDP Features</label>
            <p className="text-xs text-gray-500 mb-3">
              Select features to include in the PDP analysis. If none are selected, all features will be used.
            </p>

            <div className="grid grid-cols-3 gap-x-8 gap-y-3">
              {pdpFeatureOptions.map((option, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configData.pdpFeatures.includes(option)}
                    onChange={() => toggleFeature(option)}
                    className="w-4 h-4 text-[#8e78b7] border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 mb-1">Feature Flip Summary</h4>
                <p className="text-xs text-gray-500">
                  Enable to generate a summary of how flipping key features affects the model predictions
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={configData.featureFlipSummary}
                  onChange={(e) => setConfigData({ ...configData, featureFlipSummary: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
              </label>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Configuration Summary</h4>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Model Type</span>
                <span className="text-gray-900 font-medium">Multi class</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CF Instance</span>
                <span className="text-gray-900 font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Target Column</span>
                <span className="text-gray-900 font-medium">Next_product</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">PDP Features</span>
                <span className="text-gray-900 font-medium">49 selected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">LIME Instance</span>
                <span className="text-gray-900 font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">XAI Methods</span>
                <span className="text-gray-900 font-medium">Enabled</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onGenerate(configData)}
            className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg text-sm font-medium transition-colors"
          >
            Generate Model
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfigurationModal;