import { useState } from 'react';
import { Info, X, Plus, ChevronDown } from 'lucide-react';

export const DatasetDescriptionModal = ({ isOpen, onClose, onSave, onSkip }) => {
  const [description, setDescription] = useState('');

  const handleSave = () => {
    onSave(description);
    setDescription('');
    onClose();
  };

  const handleSkip = () => {
    onSkip();
    setDescription('');
    onClose();
  };

  const handleClose = () => {
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Add Dataset Description</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-slate-600 mb-4">
            <span className="font-medium">Note:</span> Provide a brief description to help identify and understand this dataset later.
          </p>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Description</label>
            <textarea
              placeholder="Describe the uploaded data"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            Skip for Now
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-[#8e78b7] rounded-md hover:bg-[#7d6ba0] transition-colors"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
};