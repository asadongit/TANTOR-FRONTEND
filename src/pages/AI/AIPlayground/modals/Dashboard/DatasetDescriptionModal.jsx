import { useState } from 'react';
import { X } from 'lucide-react';
import { useAIPlayground } from '../../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';
import { tw } from '../../../../../components/themeContext';

export const DatasetDescriptionModal = ({ isOpen, onClose, onSave, onSkip }) => {
  const hostnameAI = window._env_?.VITE_AI_API;
  const { datasetState } = useAIPlayground();
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const MAX_LENGTH = 400;

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH) {
      setDescription(value);
    }
  };

  const handleSave = async () => {
    if (!description.trim()) {
      toast.error('Please enter a description', {
        duration: 4000,
        position: 'top-right',
      });
      return;
    }

    if (!datasetState.ensembleId) {
      toast.error('Ensemble ID not found', {
        duration: 4000,
        position: 'top-right',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${hostnameAI}/ingestion/description`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ensemble_id: datasetState.ensembleId,
            message: description
          })
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

  const isSaveDisabled = isLoading || !description.trim();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000099] flex items-center justify-center z-50">
      <div
        className="bg-white rounded-xl w-full max-w-xl p-6 relative"
        style={{ boxShadow: '0 -4px 9px 0 rgba(0, 0, 0, 0.10)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className={tw.sectionHeading}>Add Dataset Description</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            disabled={isLoading}
          >
            <X className={`${tw.icon} w-5 h-5`} />
          </button>
        </div>

        {/* Note */}
        <div className="mb-4">
          <p className={tw.label}>
            <span className="font-semibold" style={{ color: '#8e78b7' }}>Note:</span>{' '}
            Provide a brief description to help identify and understand this dataset later.
          </p>
        </div>

        {/* Textarea */}
        <div className="mb-6">
          <label className={`${tw.label} mb-2 block`}>Description</label>
          <textarea
            placeholder="Describe the uploaded data"
            value={description}
            onChange={handleDescriptionChange}
            rows={4}
            className={`w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none ${tw.body}`}
            disabled={isLoading}
          />
          <div className="flex justify-end mt-1">
            <span className={`${tw.caption} ${description.length >= MAX_LENGTH ? '!text-red-500' : ''}`}>
              {description.length}/{MAX_LENGTH}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div
          className="-mx-6 -mb-6 px-6 py-4 flex justify-end gap-3 rounded-b-xl"
          style={{ background: '#FFFFFF', boxShadow: '0px -4px 9px 0px #0000001A' }}
        >
          <button
            onClick={handleSkip}
            className={`px-4 py-2 bg-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${tw.label}`}
            style={{
              color: '#8e78b7',
              border: '1px solid #8e78b7',
              boxShadow: '0 1px 4px 0 rgba(142,120,183,0.15)'
            }}
            disabled={isLoading}
          >
            Skip for Now
          </button>
          <button
            onClick={handleSave}
            className={`px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${tw.label}`}
            style={{
              color: '#ffffff',
              backgroundColor: isSaveDisabled ? '#b8a9d4' : '#8e78b7',
              boxShadow: '0 1px 4px 0 rgba(142,120,183,0.18)'
            }}
            onMouseEnter={e => { if (!isSaveDisabled) e.currentTarget.style.backgroundColor = '#7d6ba0'; }}
            onMouseLeave={e => { if (!isSaveDisabled) e.currentTarget.style.backgroundColor = '#8e78b7'; }}
            disabled={isSaveDisabled}
          >
            {isLoading ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};