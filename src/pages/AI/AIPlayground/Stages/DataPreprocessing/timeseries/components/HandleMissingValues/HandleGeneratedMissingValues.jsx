import React, { useState } from 'react';
import InfoButton from '../../../../../components/InfoButton';
import ColumnSearchableDropdown from './ColumnSearchableDropdown';
import ToggleSwitch from './ToggleSwitch';
import MethodParameterField from './MethodParameterField';
import { Info } from 'lucide-react';
/* Simple chevron icon used for expand/collapse actions */
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

function HandleGeneratedMissingValues({
  readonly,
  toggles,
  setToggles,
  generatedMissingConfig,
  setGeneratedMissingConfig,
  hasGeneratedMissingNumerical,
  hasGeneratedMissingCategorical,
  hasGeneratedMissingDatetime,
  showFieldErrors,
}) {

 
  const [expandedSections, setExpandedSections] = useState({ handleGeneratedMissing: false,});
  const missingTypeCount = [hasGeneratedMissingNumerical, hasGeneratedMissingCategorical, hasGeneratedMissingDatetime].filter(Boolean).length;
  const singleTypeOnly = missingTypeCount === 1;
  const [searchValues, setSearchValues] = useState({generatedNumeric: '',generatedCategorical: '',generatedDatetime: '',});

  
  const [showDropdowns, setShowDropdowns] = useState({generatedNumeric: false,generatedCategorical: false, generatedDatetime: false,});
  const hasAnyGeneratedMissing =hasGeneratedMissingNumerical ||hasGeneratedMissingCategorical ||hasGeneratedMissingDatetime;
  const isGeneratedMissingMandatory = hasAnyGeneratedMissing;

// Disable toggle if readonly, unavailable, or mandatory.
  const toggleDisabled = readonly || !hasAnyGeneratedMissing || isGeneratedMissingMandatory;
   
//method options
  const methodOptions = {
    generatedNumeric: [
      'rolling_mean',
      'seasonal_mean',
      'ffill',
      'bfill',
      'exponential_smoothing',
      'mean',
      'median',
      'mode_by_season',
    ],

    generatedCategorical: [
      'ffill',
      'bfill',
      'mode',
      'mode_by_season',
    ],

    generatedDatetime: [
      'ffill',
      'bfill',
    ],
  };
// descriptions
  const sectionDescriptions = {
    handleGeneratedMissing:
      'Handle missing values that were created during preprocessing or feature generation.',
  };

// expand/collapse section
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

// Enable/disable handling of generated missing values. When enabling, also auto-expand the section 
  const toggleSwitch = (key) => {
    if (toggleDisabled) return;

    setToggles(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // validation for generated missing values
  const getGeneratedMissingError = () => {
    if (!toggles.handleGeneratedMissing) return '';
    if ( hasGeneratedMissingNumerical &&!generatedMissingConfig.numeric) {
        return 'Select numeric imputation method'; }
    if (hasGeneratedMissingCategorical &&!generatedMissingConfig.categorical) {
      return 'Select categorical imputation method';}
    if (hasGeneratedMissingDatetime &&!generatedMissingConfig.datetime) {
      return 'Select datetime imputation method';}
    return '';
  };
// show validation error if user has attempted to process the step without filling required fields.
  const generatedMissingError = showFieldErrors
    ? getGeneratedMissingError()
    : '';
// feild specific errors
  const numericError =
    showFieldErrors &&
    hasGeneratedMissingNumerical &&
    !generatedMissingConfig.numeric
      ? 'Select numeric imputation method'
      : '';
  const categoricalError =
    showFieldErrors &&
    hasGeneratedMissingCategorical &&
    !generatedMissingConfig.categorical
      ? 'Select categorical imputation method'
      : '';
  const datetimeError =
    showFieldErrors &&
    hasGeneratedMissingDatetime &&
    !generatedMissingConfig.datetime
      ? 'Select datetime imputation method'
      : '';

// Validate rolling window size for rolling mean method.
  const rollingWindowValue = Number(generatedMissingConfig.rollingWindow);

  const rollingWindowInvalid =
    generatedMissingConfig.numeric === 'rolling_mean' &&
    (!Number.isFinite(rollingWindowValue) ||
      rollingWindowValue < 3 ||
      rollingWindowValue > 365);    

  const rollingWindowError =
    showFieldErrors &&
    toggles.handleGeneratedMissing &&
    hasGeneratedMissingNumerical &&
    rollingWindowInvalid
      ? 'Value must be between 3 and 365'
      : '';

// Validate seasonal period for numeric seasonal methods.
const numericSeasonalPeriodValue = Number(
  generatedMissingConfig.numericSeasonalgeneratedPeriod
);

const numericSeasonalPeriodInvalid =
  (generatedMissingConfig.numeric === 'mode_by_season' ||
   generatedMissingConfig.numeric === 'seasonal_mean') &&
  (
    !Number.isFinite(numericSeasonalPeriodValue) ||
    numericSeasonalPeriodValue < 7 ||
    numericSeasonalPeriodValue > 365
  );

// Validate seasonal period for categorical seasonal method.
const categoricalSeasonalPeriodValue = Number(
  generatedMissingConfig.categoricalSeasonalgeneratedPeriod
);

const categoricalSeasonalPeriodInvalid =
  generatedMissingConfig.categorical === 'mode_by_season' &&
  (
    !Number.isFinite(categoricalSeasonalPeriodValue) ||
    categoricalSeasonalPeriodValue < 7 ||
    categoricalSeasonalPeriodValue > 365
  );

const numericSeasonalPeriodError =
  showFieldErrors &&
  toggles.handleGeneratedMissing &&
  hasGeneratedMissingNumerical &&
  numericSeasonalPeriodInvalid
    ? 'Value must be between 7 and 365'
    : '';

const categoricalSeasonalPeriodError =
  showFieldErrors &&
  toggles.handleGeneratedMissing &&
  hasGeneratedMissingCategorical &&
  categoricalSeasonalPeriodInvalid
    ? 'Value must be between 7 and 365'
    : '';
  
// Auto-expand section if there are validation errors to show.
  React.useEffect(() => {
    if (
      showFieldErrors &&
      (
        numericError ||
        categoricalError ||
        datetimeError ||
        rollingWindowError ||
        numericSeasonalPeriodError ||
        categoricalSeasonalPeriodError
      ) &&
      !expandedSections.handleGeneratedMissing
    ) {
      toggleSection('handleGeneratedMissing');
    }
  }, [
    showFieldErrors,
    numericError,
    categoricalError,
    datetimeError,
    rollingWindowError,
    numericSeasonalPeriodError,
    categoricalSeasonalPeriodError,
    expandedSections.handleGeneratedMissing,
  ]);

  return (
    <div className="rounded-lg bg-[#FAFAFA] ">

     {/* header- title, info button, toggle switch, expand/collapse button */}
      <div className="w-full px-4 py-3 flex items-center justify-between ">
        <div className="flex items-center gap-3 flex-1">

          {/* Left section: title and info button */}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900">
                Handle Generated Missing Values
              </h3>

              <InfoButton
                sectionDescriptions={sectionDescriptions}
                section="handleGeneratedMissing"
              />
            </div>
          </div>
        </div>

        {/* Right section: toggle switch + expand/collapse button */}
        <div className="flex items-center gap-3 flex-shrink-0">

          <ToggleSwitch
            checked={toggles.handleGeneratedMissing}
            onChange={() => toggleSwitch('handleGeneratedMissing')}
            disabled={toggleDisabled}
          />

          <button
            type="button"
            onClick={() => toggleSection('handleGeneratedMissing')}
            aria-label="Toggle generated missing section"
            className={`transform transition-transform ${
              expandedSections.handleGeneratedMissing
                ? 'rotate-180'
                : ''
            }`}
          >
            <ChevronSVG />
          </button>
        </div>
      </div>
<div className="mx-4 mb-3 flex items-center gap-2 rounded-md border border-[#B69AD9] bg-[#F8F5FC] px-3 py-2 text-xs text-[#8C6BB1]">
  <Info size={14} className="flex-shrink-0" />

  <span>
    {isGeneratedMissingMandatory
      ? 'Handle Generated Missing Values is required because generated missing values were detected.'
      : 'Handle Generated Missing Values is not required because no generated missing values were detected.'}
  </span>
</div>
     {/* Expandable content section - only rendered if toggle is on and section is expanded */}
      {expandedSections.handleGeneratedMissing &&
        toggles.handleGeneratedMissing && (
          <div className="px-4 py-4 border-t border-gray-100">
{/* Use a responsive grid layout that adapts based on how many types of generated missing values are present. */}
            <div
              className={`grid gap-4 ${
                (hasGeneratedMissingNumerical ? 1 : 0) +
                (hasGeneratedMissingCategorical ? 1 : 0) +
                (hasGeneratedMissingDatetime ? 1 : 0) === 3
                  ? 'grid-cols-3'
                  : (hasGeneratedMissingNumerical ? 1 : 0) +
                    (hasGeneratedMissingCategorical ? 1 : 0) +
                    (hasGeneratedMissingDatetime ? 1 : 0) === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-1'
              }`}
            >
              {/* Numeric Missing Values Section */}
              {hasGeneratedMissingNumerical && (
                <div className={singleTypeOnly ? 'max-w-sm' : 'w-full'}>

                  {/* Section label */}
                  <label className="block text-sm text-gray-600 mb-2">
                    Generated Numeric Columns
                  </label>

                  {/* Numeric method dropdown */}
                  <ColumnSearchableDropdown
                    value={generatedMissingConfig.numeric}
                    onChange={(value) =>
                      setGeneratedMissingConfig(prev => ({
                        ...prev,
                        numeric: value,
                     // Clear previous submethod values
                        rollingWindow: '',
                        numericSeasonalgeneratedPeriod: '',
                      }))
                    }
                    options={methodOptions.generatedNumeric}
                    placeholder="Select"
                    disabled={readonly}
                    searchValue={searchValues}
                    setSearchValue={setSearchValues}
                    showDropdown={showDropdowns}
                    setShowDropdown={setShowDropdowns}
                    id="generatedNumeric"
                    hasError={!!numericError}
                  />

                  {/* Additional parameter field for rolling mean */}
                  {generatedMissingConfig.numeric === 'rolling_mean' && (
                    <MethodParameterField
                      label="Rolling Window Size"
                      value={generatedMissingConfig.rollingWindow ?? ''}
                      min={3}
                      max={365}
                      hasError={!!rollingWindowError}
                      errorMessage={rollingWindowError}
                      disabled={readonly}
                      onChange={(value) =>
                        setGeneratedMissingConfig(prev => ({
                          ...prev,
                          rollingWindow:
                            value === '' ? '' : Number(value),
                        }))
                      }
                    />
                  )}

                  {/* Additional parameter field for mode_by_season  or seasonal_mean */}
                  {(generatedMissingConfig.numeric === 'mode_by_season' ||
                    generatedMissingConfig.numeric === 'seasonal_mean') && (
                    <MethodParameterField
                      label="Seasonal Period"
                      value={generatedMissingConfig.numericSeasonalgeneratedPeriod ?? ''}
                      min={7}
                      max={365}
                      hasError={!!numericSeasonalPeriodError}
                      errorMessage={numericSeasonalPeriodError}
                      disabled={readonly}
                      onChange={(value) =>
                        setGeneratedMissingConfig(prev => ({
                          ...prev,
                          numericSeasonalgeneratedPeriod: value,
                        }))
                      }
                    />
                  )}

                  {/* Numeric validation error */}
                  {numericError && (
                    <p className="mt-1 text-xs text-red-500">
                      Please select a value
                    </p>
                  )}
                </div>
              )}

               {/* Categorical Missing Values Section */}
             
              {hasGeneratedMissingCategorical && (
                <div className={singleTypeOnly ? 'max-w-sm' : 'w-full'}>

                  {/* Section label */}
                  <label className="block text-sm text-gray-600 mb-2">
                    Generated Categorical Columns
                  </label>

                  {/* Categorical method dropdown */}
                  <ColumnSearchableDropdown
                    value={generatedMissingConfig.categorical}
                    onChange={(value) =>
                      setGeneratedMissingConfig(prev => ({
                        ...prev,
                        categorical: value,
                      }))
                    }
                    options={methodOptions.generatedCategorical}
                    placeholder="Select "
                    disabled={readonly}
                    searchValue={searchValues}
                    setSearchValue={setSearchValues}
                    showDropdown={showDropdowns}
                    setShowDropdown={setShowDropdowns}
                    id="generatedCategorical"
                    hasError={!!categoricalError}
                  />
                   {/* Additional parameter field for mode_by_season*/}

                    {generatedMissingConfig.categorical === 'mode_by_season' && (
                      <MethodParameterField
                        label="Seasonal Period"
                        value={generatedMissingConfig.categoricalSeasonalgeneratedPeriod ?? ''}
                        min={7}
                        max={365}
                        hasError={!!categoricalSeasonalPeriodError}
                        errorMessage={categoricalSeasonalPeriodError}
                        disabled={readonly}
                        onChange={(value) =>
                          setGeneratedMissingConfig(prev => ({
                            ...prev,
                            categoricalSeasonalgeneratedPeriod: value,
                          }))
                        }
                      />
                    )}

                  {/* Validation error */}
                  {categoricalError && (
                    <p className="mt-1 text-xs text-red-500">
                      Please select a value
                    </p>
                  )}
                </div>
              )}

                {/* Datetime Missing Values Section */}
              {hasGeneratedMissingDatetime && (
                <div className={singleTypeOnly ? 'max-w-sm' : 'w-full'}>

                  {/* Section label */}
                  <label className="block text-sm text-gray-600 mb-2">
                    Generated Datetime Columns
                  </label>

                  {/* Datetime method dropdown */}
                  <ColumnSearchableDropdown
                    value={generatedMissingConfig.datetime}
                    onChange={(value) =>
                      setGeneratedMissingConfig(prev => ({
                        ...prev,
                        datetime: value,
                      }))
                    }
                    options={methodOptions.generatedDatetime}
                    placeholder="Select"
                    disabled={readonly}
                    searchValue={searchValues}
                    setSearchValue={setSearchValues}
                    showDropdown={showDropdowns}
                    setShowDropdown={setShowDropdowns}
                    id="generatedDatetime"
                    hasError={!!datetimeError}
                  />

                  {/* Validation error */}
                  {datetimeError && (
                    <p className="mt-1 text-xs text-red-500">
                      Please select a value
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

export default HandleGeneratedMissingValues;
