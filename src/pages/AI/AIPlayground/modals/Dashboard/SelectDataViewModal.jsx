import { useState } from 'react';
import { Info, X, Plus, ChevronDown } from 'lucide-react';

export const SelectDataViewModal = ({ isOpen, onClose, onProceed }) => {
  const [selectedView, setSelectedView] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const availableViews = [
    { value: 'view1', label: 'Sales Data View' },
    { value: 'view2', label: 'Customer Analytics View' },
    { value: 'view3', label: 'Product Performance View' },
    { value: 'view4', label: 'Transaction History View' },
  ];

  const handleProceed = () => {
    if (selectedView) {
      const selectedViewData = availableViews.find(v => v.value === selectedView);
      onProceed(selectedViewData);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedView('');
    setIsDropdownOpen(false);
    onClose();
  };

  const handleSelectView = (value) => {
    setSelectedView(value);
    setIsDropdownOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Select Data View</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-slate-600 mb-4">
            Choose a pre-configured database view to fetch data without uploading a file.
          </p>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Available Views
            </label>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-white text-left flex items-center justify-between"
              >
                <span className={selectedView ? 'text-slate-900' : 'text-slate-400'}>
                  {selectedView
                    ? availableViews.find(v => v.value === selectedView)?.label
                    : 'Select'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg z-10">
                  <div className="max-h-48 overflow-y-auto">
                    {availableViews.map((view) => (
                      <button
                        key={view.value}
                        onClick={() => handleSelectView(view.value)}
                        className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        {view.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleProceed}
            disabled={!selectedView}
            className="px-4 py-2 text-sm font-medium text-white bg-[#8e78b7] rounded-md hover:bg-[#7d6ba0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
};