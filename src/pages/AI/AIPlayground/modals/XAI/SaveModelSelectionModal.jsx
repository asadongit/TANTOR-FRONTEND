import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export function SaveModelSelectionModal({ isOpen, onClose, onSave, readonly }) {
  const [models] = useState([
    { id: 1, name: 'Model 1', type: 'Random Forest' },
    { id: 2, name: 'Model 2', type: 'XGBoost' },
    { id: 3, name: 'Model 3', type: 'Neural Network' },
  ]);
  
  const [selectedModels, setSelectedModels] = useState({});
  const [descriptions, setDescriptions] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) return null;

  const handleCheckboxChange = (modelId) => {
    if (readonly) return;
    setSelectedModels(prev => ({
      ...prev,
      [modelId]: !prev[modelId]
    }));
  };

  const handleDescriptionChange = (modelId, value) => {
    if (readonly) return;
    setDescriptions(prev => ({
      ...prev,
      [modelId]: value
    }));
  };

  const handleSaveClick = () => {
    const selectedCount = Object.values(selectedModels).filter(Boolean).length;
    if (selectedCount === 0) {
      alert('Please select at least one model to save');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmSave = () => {
    const modelsToSave = models
      .filter(model => selectedModels[model.id])
      .map(model => ({
        ...model,
        description: descriptions[model.id] || ''
      }));
    
    onSave(modelsToSave);
    setShowConfirmation(false);
    setSelectedModels({});
    setDescriptions({});
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  const handleClose = () => {
    setSelectedModels({});
    setDescriptions({});
    setShowConfirmation(false);
    onClose();
  };

  const selectedCount = Object.values(selectedModels).filter(Boolean).length;
  const discardedCount = models.length - selectedCount;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Save Models</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-sm text-gray-600 mb-6">
              Select the models you want to save and provide descriptions for each selected model.
            </p>

            <div className="space-y-4">
              {models.map((model) => (
                <div
                  key={model.id}
                  className={`border rounded-lg p-4 transition-all ${
                    selectedModels[model.id]
                      ? 'border-[#8e78b7] bg-purple-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id={`model-${model.id}`}
                      checked={selectedModels[model.id] || false}
                      onChange={() => handleCheckboxChange(model.id)}
                      disabled={readonly}
                      className="mt-1 w-4 h-4 text-[#8e78b7] border-gray-300 rounded focus:ring-[#8e78b7] cursor-pointer"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`model-${model.id}`}
                        className="block text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        {model.name}
                      </label>
                      <p className="text-xs text-gray-500 mt-1">{model.type}</p>

                      {selectedModels[model.id] && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            value={descriptions[model.id] || ''}
                            onChange={(e) => handleDescriptionChange(model.id, e.target.value)}
                            disabled={readonly}
                            placeholder="Enter model description..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent resize-none"
                            rows={3}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedCount > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>{selectedCount}</strong> model{selectedCount > 1 ? 's' : ''} selected
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveClick}
              disabled={readonly}
              className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg text-sm font-medium hover:bg-[#7d67a6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Model
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertTriangle size={24} className="text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Save</h3>
              </div>

              <p className="text-sm text-gray-700 mb-2">
                {discardedCount > 0 ? (
                  <>
                    <strong>{discardedCount}</strong> model{discardedCount > 1 ? 's' : ''} that {discardedCount > 1 ? 'are' : 'is'} not selected will be discarded.
                  </>
                ) : (
                  'All models are selected.'
                )}
              </p>
              <p className="text-sm text-gray-700">Are you sure you want to continue?</p>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg text-sm font-medium hover:bg-[#7d67a6] transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}