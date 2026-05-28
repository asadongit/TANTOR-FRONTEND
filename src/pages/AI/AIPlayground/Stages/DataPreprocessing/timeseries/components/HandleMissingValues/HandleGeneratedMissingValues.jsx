import React, { useState } from 'react';
import InfoButton from '../../../../../components/InfoButton';
import ColumnSearchableDropdown from './ColumnSearchableDropdown';
import ToggleSwitch from './ToggleSwitch';
import MethodParameterField from './MethodParameterField';

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

  /* -------------------------------------------------------------
   * Local state: controls whether the card section is expanded.
   * ------------------------------------------------------------- */
  const [expandedSections, setExpandedSections] = useState({
    handleGeneratedMissing: false,
  });

  /* -------------------------------------------------------------
   * Local state: stores search input text for each dropdown.
   * ------------------------------------------------------------- */
  const [searchValues, setSearchValues] = useState({
    generatedNumeric: '',
    generatedCategorical: '',
    generatedDatetime: '',
  });

  /* -------------------------------------------------------------
   * Local state: controls open/close state of dropdown menus.
   * ------------------------------------------------------------- */
  const [showDropdowns, setShowDropdowns] = useState({
    generatedNumeric: false,
    generatedCategorical: false,
    generatedDatetime: false,
  });

  /* -------------------------------------------------------------
   * Check if any generated missing-value columns exist.
   * ------------------------------------------------------------- */
  const hasAnyGeneratedMissing =
    hasGeneratedMissingNumerical ||
    hasGeneratedMissingCategorical ||
    hasGeneratedMissingDatetime;

  /* -------------------------------------------------------------
   * Disable toggle if readonly OR no generated missing values.
   * ------------------------------------------------------------- */
  const toggleDisabled = readonly || hasAnyGeneratedMissing;

  /* -------------------------------------------------------------
   * Available imputation methods for each column type.
   * ------------------------------------------------------------- */
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

  /* -------------------------------------------------------------
   * Info tooltip descriptions.
   * ------------------------------------------------------------- */
  const sectionDescriptions = {
    handleGeneratedMissing:
      'Handle missing values that were created during preprocessing or feature generation.',
  };

  /* -------------------------------------------------------------
   * Expands/collapses the section card.
   * ------------------------------------------------------------- */
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  /* -------------------------------------------------------------
   * Enables/disables generated missing-value handling.
   * ------------------------------------------------------------- */
  const toggleSwitch = (key) => {
    if (toggleDisabled) return;

    setToggles(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /* -------------------------------------------------------------
   * Main validation for generated missing configuration.
   * Returns the first validation error encountered.
   * ------------------------------------------------------------- */
  const getGeneratedMissingError = () => {
    if (!toggles.handleGeneratedMissing) return '';

    if (
      hasGeneratedMissingNumerical &&
      !generatedMissingConfig.numeric
    ) {
      return 'Select numeric imputation method';
    }

    if (
      hasGeneratedMissingCategorical &&
      !generatedMissingConfig.categorical
    ) {
      return 'Select categorical imputation method';
    }

    if (
      hasGeneratedMissingDatetime &&
      !generatedMissingConfig.datetime
    ) {
      return 'Select datetime imputation method';
    }

    return '';
  };

  /* -------------------------------------------------------------
   * Show validation errors only when validation is triggered.
   * ------------------------------------------------------------- */
  const generatedMissingError = showFieldErrors
    ? getGeneratedMissingError()
    : '';

  /* -------------------------------------------------------------
   * Individual field-level validation messages.
   * ------------------------------------------------------------- */
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

  /* -------------------------------------------------------------
   * Validate rolling window size for rolling_mean method.
   * ------------------------------------------------------------- */
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


    /* -------------------------------------------------------------
   * Validate seasonal period for seasonal methods.
   * ------------------------------------------------------------- */
  const seasonalPeriodValue = Number(generatedMissingConfig.seasonalPeriod);

  const seasonalPeriodInvalid =
    (generatedMissingConfig.numeric === 'mode_by_season' || generatedMissingConfig.numeric === 'seasonal_mean' || generatedMissingConfig.categorical === 'mode_by_season') &&
    (!Number.isFinite(seasonalPeriodValue) ||
      seasonalPeriodValue < 7 ||
      seasonalPeriodValue > 365);

  const seasonalPeriodError =
    showFieldErrors &&
    toggles.handleGeneratedMissing &&
    (hasGeneratedMissingNumerical || hasGeneratedMissingCategorical) &&
    seasonalPeriodInvalid
      ? 'Value must be between 7 and 365'
      : '';

  /* -------------------------------------------------------------
   * Auto-expand section when validation errors appear.
   * ------------------------------------------------------------- */
  React.useEffect(() => {
    if (
      showFieldErrors &&
      (
        numericError ||
        categoricalError ||
        datetimeError ||
        rollingWindowError ||
        seasonalPeriodError
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
    seasonalPeriodError,
    expandedSections.handleGeneratedMissing,
  ]);

  return (
    <div className="rounded-lg bg-[#FAFAFA] ">

      {/* =========================================================
       * Card Header
       * Title + info tooltip + toggle + expand button
       * ========================================================= */}
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

      {/* =========================================================
       * Card Body
       * Render only when section is expanded AND enabled.
       * ========================================================= */}
      {expandedSections.handleGeneratedMissing &&
        toggles.handleGeneratedMissing && (

          <div className="px-4 py-4 border-t border-gray-100">

            {/* ---------------------------------------------------
             * Dynamic grid layout depending on visible sections.
             * --------------------------------------------------- */}
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

              {/* =================================================
               * Numeric Missing Values Section
               * ================================================= */}
              {hasGeneratedMissingNumerical && (
                <div>

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
                        seasonalPeriod: '',
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
                      value={generatedMissingConfig.seasonalPeriod ?? ''}
                      min={7}
                      max={365}
                      hasError={!!seasonalPeriodError}
                      errorMessage={seasonalPeriodError}
                      disabled={readonly}
                      onChange={(value) =>
                        setGeneratedMissingConfig(prev => ({
                          ...prev,
                          seasonalPeriod: value,
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

              {/* =================================================
               * Categorical Missing Values Section
               * ================================================= */}
              {hasGeneratedMissingCategorical && (
                <div>

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
                        value={generatedMissingConfig.seasonalPeriod ?? ''}
                        min={7}
                        max={365}
                        hasError={!!seasonalPeriodError}
                        errorMessage={seasonalPeriodError}
                        disabled={readonly}
                        onChange={(value) =>
                          setGeneratedMissingConfig(prev => ({
                            ...prev,
                            seasonalPeriod: value,
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

              {/* =================================================
               * Datetime Missing Values Section
               * ================================================= */}
              {hasGeneratedMissingDatetime && (
                <div>

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