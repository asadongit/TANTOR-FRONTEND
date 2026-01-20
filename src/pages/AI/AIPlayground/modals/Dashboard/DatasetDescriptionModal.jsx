import { useState } from 'react';
import { X } from 'lucide-react';
import { useAIPlayground } from '../../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';

export const DatasetDescriptionModal = ({ isOpen, onClose, onSave, onSkip }) => {
  const hostnameAI = window._env_?.VITE_AI_API;
  const { datasetState } = useAIPlayground();
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!description.trim()) {
      toast.error('Please enter a description', {
        duration: 4000,
        position: 'top-right',
      });
      return;
    }

    if (!datasetState.sessionId) {
      toast.error('Session ID not found', {
        duration: 4000,
        position: 'top-right',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${hostnameAI}/data/description?session_id=${datasetState.sessionId}&data_description=${encodeURIComponent(description)}`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to save description: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        toast.success('Dataset description saved successfully!', {
          duration: 3000,
          position: 'top-right',
        });
        onSave(description);
        setDescription('');
        onClose();
      } else {
        throw new Error(data.message || 'Failed to save description');
      }
    } catch (error) {
      console.error('Error saving description:', error);
      toast.error(error.message || 'Failed to save description. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onSkip();
    setDescription('');
    onClose();
  };

  const handleClose = () => {
    if (!isLoading) {
      setDescription('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Add Dataset Description</h2>
          <button 
            onClick={handleClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors"
            disabled={isLoading}
          >
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
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            Skip for Now
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-[#8e78b7] rounded-md hover:bg-[#7d6ba0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};