import { useState, useEffect } from 'react';
import { Info, X, Plus, ChevronDown, Loader2 } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';

export const SelectDataViewModal = ({ isOpen, onClose, onProceed }) => {
  const [selectedView, setSelectedView] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [availableViews, setAvailableViews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { decodedToken, hostnameV2, token } = useAuth();

  useEffect(() => {
    if (isOpen && decodedToken?.preferred_username) {
      fetchViews();
    }
  }, [isOpen, decodedToken]);

  const fetchViews = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
       const response = await fetch(`${hostnameV2}/get-all-views_v2?created_by=${decodedToken.preferred_username}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch views');
      }

      const data = await response.json();
      
      const transformedViews = data.result.map(viewName => ({
        value: viewName,
        label: viewName.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      }));
      
      setAvailableViews(transformedViews);
    } catch (err) {
      console.error('Error fetching views:', err);
      setError('Failed to load views. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
    setError(null);
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
            
            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={fetchViews}
                  className="text-sm text-red-700 underline mt-1"
                >
                  Retry
                </button>
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isLoading || availableViews.length === 0}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading views...
                  </span>
                ) : availableViews.length === 0 ? (
                  <span className="text-slate-400">No views available</span>
                ) : (
                  <span className={selectedView ? 'text-slate-900' : 'text-slate-400'}>
                    {selectedView
                      ? availableViews.find(v => v.value === selectedView)?.label
                      : 'Select a view'}
                  </span>
                )}
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isDropdownOpen && availableViews.length > 0 && (
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
            disabled={!selectedView || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-[#8e78b7] rounded-md hover:bg-[#7d6ba0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
};