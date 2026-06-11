import React from 'react';
import InfoButton from '../../../../../components/InfoButton';
import { dataPreprocessingDescriptions } from '../../../../../../../../hooks/AI/datapreprocessing/descriptions';
import ColumnSearchableDropdown from './ColumnSearchableDropdown';
import ToggleSwitch from './ToggleSwitch';
import MethodParameterField from './MethodParameterField';
import { Info } from 'lucide-react';
/* Reusable chevron icon used for expand/collapse actions. */
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

function HandleOriginalMissingValues({
  readonly,
  expanded,
  toggleSection,
  checked,

  hasNumericMissing,
  hasCategoricalMissing,
  hasDatetimeMissing,

  missingOriginalNumericColumns,
  missingOriginalCategoricalColumns,
  missingOriginalDatetimeColumns,

  originalMissingConfig,
  setOriginalMissingConfig,

  searchValues,
  setSearchValues,

  showDropdowns,
  setShowDropdowns,

  showFieldErrors,
  originalMissingError,
}) {

  /* Tooltip/help text configuration for preprocessing sections. */
  const sectionDescriptions = dataPreprocessingDescriptions;

  /* Available imputation methods grouped by column datatype. */
  const methodOptions = {
    originalNumeric: [
      'linear',
      'polynomial',
      'spline',
      'time',
      'cubic',
      'quadratic',
      'PCHIP',
      'backfill',
      'nearest',
    ],

    originalCategorical: [
      'mode',
      'mode_by_season',
      'ffill',
      'bfill',
    ],

    originalDatetime: [
      'linear',
      'ffill',
      'bfill',
    ],
  };

  /* Count numeric columns containing original missing values. */
  const numericMissingCount = Object.values(
    missingOriginalNumericColumns || {}
  ).filter(val => val === 1).length;

  /* Count categorical columns containing original missing values. */
  const categoricalMissingCount = Object.values(
    missingOriginalCategoricalColumns || {}
  ).filter(val => val === 1).length;

  /* Count datetime columns containing original missing values. */
  const datetimeMissingCount = Object.values(
    missingOriginalDatetimeColumns || {}
  ).filter(val => val === 1).length;

  /* Validation error shown when numeric method is not selected. */
  const numericError =
    showFieldErrors && hasNumericMissing && !originalMissingConfig.numeric
      ? 'Select numeric imputation method'
      : '';
  const missingTypeCount =(hasNumericMissing ? 1 : 0) +(hasCategoricalMissing ? 1 : 0) +(hasDatetimeMissing ? 1 : 0);
  const singleTypeOnly = missingTypeCount === 1;
  /* Validation error shown when categorical method is not selected. */
  const categoricalError =
    showFieldErrors && hasCategoricalMissing && !originalMissingConfig.categorical
      ? 'Select categorical imputation method'
      : '';

  /* Validation error shown when datetime method is not selected. */
  const datetimeError =
    showFieldErrors && hasDatetimeMissing && !originalMissingConfig.datetime
      ? 'Select datetime imputation method'
      : '';

  /* -------------------------------------------------------------
   * Validate polynomial degree parameter when polynomial method is selected for numeric imputation.
   * ------------------------------------------------------------- */    
  const polynomialdegreevalue = Number(originalMissingConfig.polynomialDegree);

  const polynomialDegreeInvalid =
    originalMissingConfig.numeric === 'polynomial' &&
    (!Number.isFinite(polynomialdegreevalue) || polynomialdegreevalue < 2 || polynomialdegreevalue > 365);

  const polynomialDegreeError = 
    showFieldErrors &&
    checked &&
    hasNumericMissing &&
    polynomialDegreeInvalid
      ? 'Value must be between 2 and 365'
      : '';

  /* -------------------------------------------------------------
   * Validate spline order parameter when spline method is selected for numeric imputation.
   * ------------------------------------------------------------- */    
  
  const splineordervalue = Number(originalMissingConfig.splineOrder);

  const splineOrderInvalid =
    originalMissingConfig.numeric === 'spline' &&
    (!Number.isFinite(splineordervalue) || splineordervalue < 3 || splineordervalue > 365);

  const splineOrderError = 
    showFieldErrors &&
    checked &&
    hasNumericMissing &&
    splineOrderInvalid
      ? 'Value must be between 3 and 365'
      : '';

   /* -------------------------------------------------------------
   * Validate seasonal period parameter when mode_by_season method is selected for categorical imputation.
   * ------------------------------------------------------------- */    

    const seasonalPeriodValue = Number(originalMissingConfig.categoricalSeasonalOriginalPeriod);
    const seasonalPeriodInvalid =
    originalMissingConfig.categorical === 'mode_by_season' &&
    (!Number.isFinite(seasonalPeriodValue) || seasonalPeriodValue < 7 || seasonalPeriodValue > 365);
    const seasonalPeriodError =
    showFieldErrors &&
    checked &&
    hasCategoricalMissing &&
    originalMissingConfig.categorical === 'mode_by_season' &&
    seasonalPeriodInvalid
      ? 'Value must be between 7 and 365'
      : '';

  return (
    <div className="rounded-lg bg-[#FAFAFA]">

      {/* ==================== CARD HEADER ==================== */}
      {/* Contains title, info tooltip, toggle switch, and expand/collapse button. */}
      <div className="w-full px-4 py-3 flex items-center justify-between ">
        <div className="flex items-center gap-3 flex-1">

          {/* Section title and helper info button. */}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900">
                Handle Original Missing Values
              </h3>

              <InfoButton
                sectionDescriptions={sectionDescriptions}
                section="handleOriginalMissing"
              />
            </div>
          </div>
        </div>

        {/* Section controls: enabled state and collapse/expand toggle. */}
        <div className="flex items-center gap-3 flex-shrink-0">

          {/* Read-only toggle showing whether this preprocessing step is active. */}
          <ToggleSwitch
            checked={checked}
            disabled={true}
          />

          {/* Expand/collapse button for showing section content. */}
          <button
            type="button"
            onClick={toggleSection}
            aria-label="Toggle original missing section"
            className={`transform transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          >
            <ChevronSVG />
          </button>
        </div>
      </div>
<div className="mx-4 mb-3 flex items-center gap-2 rounded-md border border-[#B69AD9] bg-[#F8F5FC] px-3 py-2 text-xs text-[#8C6BB1]">
  <Info size={14} className="flex-shrink-0" />

  <span>
    {checked
      ? 'Handle Original Missing Values is required because missing values were detected in the dataset.'
      : 'Handle Original Missing Values is not required because no missing values were detected in the dataset.'}
  </span>
</div>
      {/* ==================== CARD BODY ==================== */}
      {/* Render only when the section is expanded and enabled. */}
      {expanded && checked && (
        <div className="px-4 py-4 border-t border-gray-100">

          {/* Dynamic grid layout based on available missing-value categories. */}
          <div
            className={`grid gap-4 ${
              (hasNumericMissing ? 1 : 0) +
              (hasCategoricalMissing ? 1 : 0) +
              (hasDatetimeMissing ? 1 : 0) === 3
                ? 'grid-cols-3'
                : (hasNumericMissing ? 1 : 0) +
                  (hasCategoricalMissing ? 1 : 0) +
                  (hasDatetimeMissing ? 1 : 0) === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-1'
            }`}
          >

            {/* ==================== NUMERIC COLUMN SECTION ==================== */}
            {/* Dropdown for selecting numeric missing-value handling method. */}
            {hasNumericMissing && (
              <div className={singleTypeOnly ? 'max-w-sm' : 'w-full'}>
                <label className="block text-sm text-gray-600 mb-2">
                  Numeric Columns 
                </label>

                <ColumnSearchableDropdown
                  value={originalMissingConfig.numeric}
                  /* Update selected numeric imputation method. */
                  onChange={(value) =>
                    setOriginalMissingConfig(prev => ({
                      ...prev,
                      numeric: value,
                    }))
                  }

                  options={methodOptions.originalNumeric}
                  placeholder="Select"
                  disabled={readonly}

                  /* Shared searchable dropdown state handlers. */
                  searchValue={searchValues}
                  setSearchValue={setSearchValues}
                  showDropdown={showDropdowns}
                  setShowDropdown={setShowDropdowns}

                  id="originalNumeric"

                  /* Highlight dropdown when validation fails. */
                  hasError={
                    showFieldErrors &&
                    !originalMissingConfig.numeric
                  }
                />

                {/* Additional parameter field for polynomial method. */}
                {originalMissingConfig.numeric === 'polynomial' && (
                  <MethodParameterField
                    label="Polynomial Degree"
                    value={originalMissingConfig.polynomialDegree || ''}
                    min={2}
                    max={365}
                    hasError={!!polynomialDegreeError}
                    errorMessage={polynomialDegreeError}
                    disabled={readonly}
                    onChange={(value) =>
                      setOriginalMissingConfig(prev => ({
                        ...prev,
                        polynomialDegree: value === '' ? '' : Number(value),
                      }))
                    }
                  />
                )}
                 {/* Additional parameter field for spline method. */}

                {originalMissingConfig.numeric === 'spline' && (
                  <MethodParameterField
                    label="Spline Order"
                    value={originalMissingConfig.splineOrder || ''}
                    min={3}
                    max={365}
                    hasError={!!splineOrderError}
                    errorMessage={splineOrderError}
                    disabled={readonly}
                    onChange={(value) =>
                      setOriginalMissingConfig(prev => ({
                        ...prev,
                        splineOrder: value === '' ? '' : Number(value),
                      }))
                    }
                  />
                )}

                {/* Numeric validation message. */}
                {numericError && (
                  <p className="mt-1 text-xs text-[#EF4D5F]">
                    {numericError}
                  </p>
                )}
              </div>
            )}

            {/* ==================== CATEGORICAL COLUMN SECTION ==================== */}
            {/* Dropdown for selecting categorical missing-value handling method. */}
            {hasCategoricalMissing && (
              <div className={singleTypeOnly ? 'max-w-sm' : 'w-full'}>
                <label className="block text-sm text-gray-600 mb-2">
                  Categorical Columns
                </label>

                <ColumnSearchableDropdown
                  value={originalMissingConfig.categorical}

                  /* Update selected categorical imputation method. */
                  onChange={(value) =>
                    setOriginalMissingConfig(prev => ({
                      ...prev,
                      categorical: value,
                    }))
                  }

                  options={methodOptions.originalCategorical}
                  placeholder="Select "
                  disabled={readonly}

                  /* Shared searchable dropdown state handlers. */
                  searchValue={searchValues}
                  setSearchValue={setSearchValues}
                  showDropdown={showDropdowns}
                  setShowDropdown={setShowDropdowns}

                  id="originalCategorical"

                  /* Highlight dropdown when validation fails. */
                  hasError={
                    showFieldErrors &&
                    !originalMissingConfig.categorical
                  }
                />
                {originalMissingConfig.categorical === 'mode_by_season' && (
  <MethodParameterField
    label="Seasonal Period"
    value={
      originalMissingConfig.categoricalSeasonalOriginalPeriod || ''
    }
    min={7}
    max={365}
    hasError={!!seasonalPeriodError}
    errorMessage={seasonalPeriodError}
    disabled={readonly}
    onChange={(value) =>
      setOriginalMissingConfig((prev) => ({
        ...prev,
        categoricalSeasonalOriginalPeriod:
          value === '' ? '' : Number(value),
      }))
    }
  />
)}
                {/* Categorical validation message. */}
                {categoricalError && (
                  <p className="mt-1 text-xs text-[#EF4D5F]">
                    {categoricalError}
                  </p>
                )}
              </div>
            )}

            {/* ==================== DATETIME COLUMN SECTION ==================== */}
            {/* Dropdown for selecting datetime missing-value handling method. */}
            {hasDatetimeMissing && (
              <div className={singleTypeOnly ? 'max-w-sm' : 'w-full'}>
                <label className="block text-sm text-gray-600 mb-2">
                  Datetime Columns 
                </label>

                <ColumnSearchableDropdown
                  value={originalMissingConfig.datetime}

                  /* Update selected datetime imputation method. */
                  onChange={(value) =>
                    setOriginalMissingConfig(prev => ({
                      ...prev,
                      datetime: value,
                    }))
                  }

                  options={methodOptions.originalDatetime}
                  placeholder="Select"
                  disabled={readonly}

                  /* Shared searchable dropdown state handlers. */
                  searchValue={searchValues}
                  setSearchValue={setSearchValues}
                  showDropdown={showDropdowns}
                  setShowDropdown={setShowDropdowns}

                  id="originalDatetime"

                  /* Highlight dropdown when validation fails. */
                  hasError={
                    showFieldErrors &&
                    !originalMissingConfig.datetime
                  }
                />

                {/* Datetime validation message. */}
                {datetimeError && (
                  <p className="mt-1 text-xs text-[#EF4D5F]">
                    {datetimeError}
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

export default HandleOriginalMissingValues;