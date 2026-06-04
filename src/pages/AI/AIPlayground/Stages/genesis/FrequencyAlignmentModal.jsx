import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import ColumnSearchableDropdown from '../DataPreprocessing/timeseries/components/HandleMissingValues/ColumnSearchableDropdown';

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
    useState('mode');

  const [datetimeAggregation, setDatetimeAggregation] =
    useState('min');

  const [searchValues, setSearchValues] = useState({});
  const [showDropdowns, setShowDropdowns] = useState({});

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
        data.message ||
          'Frequency alignment completed successfully'
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
                {duplicateIssue.timestamps?.map(
                  (timestamp, index) => (
                    <div
                      key={index}
                      className="text-sm text-gray-700 py-1"
                    >
                      {timestamp}
                    </div>
                  )
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Numerical Aggregation
                  </label>

                  <ColumnSearchableDropdown
                    value={numericalAggregation}
                    onChange={setNumericalAggregation}
                    options={[
                      'mean',
                      'sum',
                      'min',
                      'max'
                    ]}
                    placeholder="Select"
                    searchValue={searchValues}
                    setSearchValue={setSearchValues}
                    showDropdown={showDropdowns}
                    setShowDropdown={setShowDropdowns}
                    id="numericalAggregation"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Categorical Aggregation
                  </label>

                  <ColumnSearchableDropdown
                    value={categoricalAggregation}
                    onChange={setCategoricalAggregation}
                    options={[
                      'mode'
                    ]}
                    placeholder="Select"
                    searchValue={searchValues}
                    setSearchValue={setSearchValues}
                    showDropdown={showDropdowns}
                    setShowDropdown={setShowDropdowns}
                    id="categoricalAggregation"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Datetime Aggregation
                  </label>

                  <ColumnSearchableDropdown
                    value={datetimeAggregation}
                    onChange={setDatetimeAggregation}
                    options={[
                      'min',
                      'max'
                    ]}
                    placeholder="Select"
                    searchValue={searchValues}
                    setSearchValue={setSearchValues}
                    showDropdown={showDropdowns}
                    setShowDropdown={setShowDropdowns}
                    id="datetimeAggregation"
                  />
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
                {missingIssue.timestamps?.map(
                  (timestamp, index) => (
                    <div
                      key={index}
                      className="text-sm text-gray-700 py-1"
                    >
                      {timestamp}
                    </div>
                  )
                )}
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