import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

const FrequencyAlignmentModal = ({
  isOpen,
  validationData,
  config,
  datasetState,
  activeWorkflowId,
  hostnameAI,
  onSuccess,
  onClose
}) => {
  const [isAligning, setIsAligning] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);

  const entityLabels = validationData?.entity_labels || [];
  const isMultiEntity = Array.isArray(entityLabels) && entityLabels.length > 0;

  useEffect(() => {
    if (!isMultiEntity) {
      setSelectedEntity(null);
      return;
    }

    setSelectedEntity(entityLabels[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validationData]);

  if (!isOpen || !validationData) return null;

  const duplicateIssue = validationData?.frequency_issues?.find(issue => issue.issue_type === 'duplicate');
  const missingIssue = validationData?.frequency_issues?.find(issue => issue.issue_type === 'missing');
  const irregularIssue = validationData?.frequency_issues?.find(issue => issue.issue_type === 'irregular');
  const hasIrregularIssue = validationData?.frequency_issues?.some(issue => issue.issue_type === 'irregular');
  const duplicateGroups = duplicateIssue?.duplicate_groups || [];

  const entityDuplicate = validationData?.frequency_issues_by_entity?.duplicate?.find(
    issue => issue.entity === selectedEntity
  );
  const entityMissing = validationData?.frequency_issues_by_entity?.missing?.find(
    issue => issue.entity === selectedEntity
  );
  const entityDuplicateGroups = entityDuplicate?.duplicate_groups || [];

  const displayDuplicateIssue = isMultiEntity ? entityDuplicate : duplicateIssue;
  const displayMissingIssue = isMultiEntity ? entityMissing : missingIssue;
  const displayDuplicateGroups = isMultiEntity ? entityDuplicateGroups : duplicateGroups;

  const handleAlign = async () => {
    try {
      setIsAligning(true);
      const response = await fetch(
        `${hostnameAI}/genesis/frequency-alignment`,
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ensemble_id: datasetState.ensembleId,
            workflow_id: activeWorkflowId,
            time_column: config.timeColumn,
            frequency: config.frequency,
            ...(isMultiEntity && { entity_cols: config.entity_cols || [] })
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(
          errorData.message || 'Frequency alignment failed'
        );
        return;
      }

      const data = await response.json();
      toast.success(
        data.message || 'Frequency alignment completed successfully'
      );
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error('Frequency alignment failed');
    } finally {
      setIsAligning(false);
    }
  };


  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative bg-white rounded-lg shadow-xl w-[95%] max-w-[1300px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-base font-semibold text-gray-900 font-satoshi">
            Frequency Alignment Required
          </h2>
          <button
            onClick={() => onClose?.()}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Entity Selector */}
          {isMultiEntity && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Entity</label>
              <select
                value={selectedEntity || ''}
                onChange={(e) => setSelectedEntity(e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
              >
                {entityLabels.map(label => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Duplicate Section */}
          {displayDuplicateIssue && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Duplicate Timestamps
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Found {displayDuplicateGroups.length} duplicate timestamp{displayDuplicateGroups.length !== 1 ? 's' : ''}. Cleanliness score will be calculated for these rows and the row with the highest will be retained.
              </p>

              <div className="border border-gray-200 rounded-md p-3 max-h-32 overflow-y-auto bg-[#FAFAFA]">
                {displayDuplicateGroups.map((group, index) => (
                  <div
                    key={index}
                    className="text-sm text-gray-700 py-1 font-mono"
                  >
                    {group.timestamp}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Timestamps Section */}
          {displayMissingIssue && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Missing Timestamps
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {displayMissingIssue.description}
              </p>

              <div className="border border-gray-200 rounded-md p-3 max-h-32 overflow-y-auto bg-[#FAFAFA]">
                {displayMissingIssue.timestamps?.map((timestamp, index) => (
                  <div
                    key={index}
                    className="text-sm text-gray-700 py-1 font-mono"
                  >
                    {timestamp}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Irregular Frequency Section */}
          {irregularIssue && (
            <div className="border border-red-300 bg-red-50 rounded-lg p-4">
              <h3 className="font-semibold text-red-700 mb-2">
                Irregular Frequency Detected
              </h3>
              <p className="text-sm text-red-600 font-medium">
                {irregularIssue.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          {hasIrregularIssue ? (
            <button
              onClick={() => onClose?.()}
              className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              Close
            </button>
          ) : (
            <button
              onClick={handleAlign}
              disabled={isAligning}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${isAligning
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#8e78b7] text-white hover:bg-[#7d67a6]'
                }`}
            >
              {isAligning ? 'Aligning...' : 'Next'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FrequencyAlignmentModal;
