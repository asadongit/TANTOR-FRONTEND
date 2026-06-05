import React, { useState, useEffect } from 'react';
import InfoButton from '../../../../../components/InfoButton';
import ToggleSwitch from './ToggleSwitch';
import MethodParameterField from './MethodParameterField';
import { dataPreprocessingDescriptions } from '../../../../../../../../hooks/AI/datapreprocessing/descriptions';

 //Chevron icon used for expand / collapse
const ChevronSVG = () => (
  <svg
    className="w-4 h-4 text-gray-400 flex-shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

function HandleHighMissingValues({
  readonly,
  toggles,
  setToggles,
  highMissingConfig,
  setHighMissingConfig,
  numericColumns = [],
  showFieldErrors,
}) {

   //Expand / collapse state

  const [expandedSections, setExpandedSections] = useState({
    handleHighMissing: false,
  });

  /* 
   * Toggle behavior
   * - Numeric columns exist -> ON and locked
   * - No numeric columns -> OFF and locked
   */
  const hasNumericalColumns = numericColumns.length > 0;

  const toggleDisabled = true || readonly;
   // Expand / collapse handler
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
//validation 
  const thresholdValue = Number(
    highMissingConfig.threshold
  );

  const thresholdInvalid =
    toggles.handleHighMissing &&
    (
      !Number.isFinite(thresholdValue) ||
      thresholdValue < 0 ||
      thresholdValue > 100
    );

  const thresholdError =
    showFieldErrors &&
    thresholdInvalid
      ? 'Value must be between 0 and 100'
      : '';
// Auto-expand section if there are validation errors
  useEffect(() => {
    if (
      showFieldErrors &&
      thresholdError &&
      !expandedSections.handleHighMissing
    ) {
      setExpandedSections((prev) => ({
        ...prev,
        handleHighMissing: true,
      }));
    }
  }, [
    showFieldErrors,
    thresholdError,
    expandedSections.handleHighMissing,
  ]);

  return (
    <div className="rounded-lg bg-[#FAFAFA]">

     {/* header */}
      <div className="w-full px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900">
                Handle High Missing Values
              </h3>
              <InfoButton
                sectionDescriptions={dataPreprocessingDescriptions}
                section="handleHighMissing"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <ToggleSwitch
            checked={toggles.handleHighMissing}
            onChange={() => {}}
            disabled={toggleDisabled}
          />

          <button
            type="button"
            onClick={() =>
              toggleSection('handleHighMissing')
            }
            aria-label="Toggle high missing values section"
            className={`transform transition-transform ${
              expandedSections.handleHighMissing
                ? 'rotate-180'
                : ''
            }`}
          >
            <ChevronSVG />
          </button>
        </div>
      </div>

      {/* body */}
      {expandedSections.handleHighMissing &&
        toggles.handleHighMissing && (
          <div className="px-4 py-4 border-t border-gray-100">
            <div className="grid grid-cols-1 gap-4">
            <div className="w-80">
              <MethodParameterField
                label="Missing Value Threshold (%)"
                value={
                  highMissingConfig.threshold ?? ''
                }
                min={0}
                max={100}
                hasError={!!thresholdError}
                errorMessage={thresholdError}
                disabled={readonly}
                onChange={(value) =>
                  setHighMissingConfig((prev) => ({
                    ...prev,
                    threshold: value,
                  }))
                }
              />
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default HandleHighMissingValues;