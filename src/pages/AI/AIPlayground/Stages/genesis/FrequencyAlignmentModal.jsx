import React, { useState } from 'react';
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

  const [numericalAggregation, setNumericalAggregation] =
    useState('mean');

  const [categoricalAggregation, setCategoricalAggregation] =
    useState('first');

  const [datetimeAggregation, setDatetimeAggregation] =
    useState('first');

  if (!isOpen || !validationData) return null;

  const duplicateIssue =
    validationData?.frequency_issues?.find(
      issue => issue.issue_type === 'duplicate'
    );

  const missingIssue =
    validationData?.frequency_issues?.find(
      issue => issue.issue_type === 'missing'
    );

  const irregularIssue =
    validationData?.frequency_issues?.find(
      issue => issue.issue_type === 'irregular'
    );


  const hasIrregularIssue =
  validationData?.frequency_issues?.some(
    issue => issue.issue_type === 'irregular'
  );

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
            numerical_aggregation: numericalAggregation,
            categorical_aggregation: categoricalAggregation,
            datetime_aggregation: datetimeAggregation
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

      <div className="relative bg-white rounded-lg shadow-xl w-[850px] max-h-[85vh] overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">
            Frequency Alignment Required
          </h2>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[65vh] space-y-4">

          {/* Duplicate */}
          {!hasIrregularIssue && duplicateIssue && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Duplicate Timestamps
              </h3>

              <p className="text-sm text-gray-600 mb-3">
                {duplicateIssue.description}
              </p>

              <div className="border rounded-md p-3 max-h-40 overflow-y-auto bg-gray-50 mb-4">
                {duplicateIssue.timestamps?.map((timestamp, index) => (
                  <div
                    key={index}
                    className="text-sm text-gray-700 py-1"
                  >
                    {timestamp}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">

                <div>
  <label className="block text-xs font-medium text-gray-700 mb-2">
    Numerical Aggregation
  </label>

  <select
    value={numericalAggregation}
    onChange={(e) =>
      setNumericalAggregation(e.target.value)
    }
    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
  >
    <option value="mean">Mean</option>
    <option value="sum">Sum</option>
    <option value="min">Min</option>
    <option value="max">Max</option>
    <option value="first">First</option>
    <option value="last">Last</option>
  </select>
</div>

                <div>
  <label className="block text-xs font-medium text-gray-700 mb-2">
    Categorical Aggregation
  </label>

  <select
    value={categoricalAggregation}
    onChange={(e) =>
      setCategoricalAggregation(e.target.value)
    }
    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
  >
    <option value="first">First</option>
    <option value="last">Last</option>
    <option value="mode">Mode</option>
  </select>
</div>

                <div>
  <label className="block text-xs font-medium text-gray-700 mb-2">
    Datetime Aggregation
  </label>

  <select
    value={datetimeAggregation}
    onChange={(e) =>
      setDatetimeAggregation(e.target.value)
    }
    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
  >
    <option value="first">First</option>
    <option value="last">Last</option>
    <option value="min">Min</option>
    <option value="max">Max</option>
  </select>
</div>

              </div>
            </div>
          )}

          {/* Missing */}
          {!hasIrregularIssue && missingIssue && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Missing Timestamps
              </h3>

              <p className="text-sm text-gray-600 mb-3">
                {missingIssue.description}
              </p>

              <div className="border border-gray-200 rounded-md p-3 max-h-40 overflow-y-auto bg-[#FAFAFA]">
                {missingIssue.timestamps?.map((timestamp, index) => (
                  <div
                    key={index}
                    className="text-sm text-gray-700 py-1"
                  >
                    {timestamp}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Irregular */}
          {irregularIssue && (
            <div className="border border-red-300 bg-red-50 rounded-lg p-4">
              <h3 className="font-semibold text-red-700 mb-2">
                Irregular Frequency Detected
              </h3>

              <p className="text-sm text-red-600">
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
      className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
    >
      Close
    </button>
  ) : (
    <button
      onClick={handleAlign}
      disabled={isAligning}
      className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
  isAligning
    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
    : 'bg-[#8e78b7] text-white hover:bg-[#7d67a6]'
}`}
    >
      {isAligning ? 'Aligning...' : 'Align'}
    </button>
  )}

</div>
      </div>
    </div>
  );
};

export default FrequencyAlignmentModal;