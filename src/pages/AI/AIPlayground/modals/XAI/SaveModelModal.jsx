import { X } from "lucide-react";
import { useState } from "react";

function SaveModelModal({ isOpen, onClose, onSave, readonly = false }) {
  const [modelDescription, setModelDescription] = useState('');
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Save Model</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Confirm that you want to save this model. Adding a description will help identify and manage the model later.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Description
            </label>
            <textarea
              value={modelDescription}
              onChange={(e) => !readonly && setModelDescription(e.target.value)}
              disabled={readonly}
              placeholder="Model Description"
              rows={4}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none ${
                readonly ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
            />
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!readonly) {
                onSave(modelDescription);
                setModelDescription('');
              }
            }}
            disabled={readonly}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              readonly
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#8e78b7] text-white hover:bg-[#7d67a6]'
            }`}
          >
            Save Model
          </button>
        </div>
      </div>
    </div>
  );
}

export default SaveModelModal;