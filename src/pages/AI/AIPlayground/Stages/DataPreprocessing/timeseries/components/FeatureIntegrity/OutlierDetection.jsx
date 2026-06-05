import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

import InfoButton from '../../../../../components/InfoButton';
import ToggleSwitch from './ToggleSwitch';
import ColumnSearchableDropdown from './ColumnSearchableDropdown';
import MethodParameterField from './MethodParameterField';

import { featureSelectionDescriptions } from '../../../../../../../../hooks/AI/datapreprocessing/descriptions';

const ROLLING_WINDOW_METHODS = [
  'rolling_median_iqr',
  'rolling_mean_sigma',
];

const SEASONAL_PERIOD_METHODS = [
  'stl_mad',
  'seasonal_decomp_residuals',
];

const OutlierDetection = ({
  isToggled,
  isExpanded,
  onToggle,
  onExpand,
  readonly,

  outlierConfig,
  setOutlierConfig,

  availableOutlierOptions = [],

  methodError,
  rollingWindowError,
  seasonalPeriodError,

  hasError,
}) => {
  const [searchValues, setSearchValues] = useState({
    outlierMethod: '',
  });

  const [showDropdowns, setShowDropdowns] = useState({
    outlierMethod: false,
  });

  const selectedMethod = outlierConfig?.method || '';

  const showRollingWindow =
    ROLLING_WINDOW_METHODS.includes(selectedMethod);

  const showSeasonalPeriod =
    SEASONAL_PERIOD_METHODS.includes(selectedMethod);

  return (
    <div
      className={`rounded-lg transition-all ${
        hasError
          ? 'bg-red-50 border border-red-400'
          : 'bg-gray-50'
      }`}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1">
            <div className="flex flex-row items-center">
              <h4
                className={`text-sm font-medium mr-2 ${
                  hasError
                    ? 'text-red-700'
                    : 'text-gray-700'
                }`}
              >
                Detect Outliers
              </h4>

              <InfoButton
                sectionDescriptions={featureSelectionDescriptions}
                section="detectOutliers"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ToggleSwitch
            checked={isToggled}
            onChange={onToggle}
            disabled={readonly}
          />

          {isToggled && (
            <button
              onClick={onExpand}
              className="text-gray-400 hover:text-gray-600"
              type="button"
            >
              {isExpanded ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </button>
          )}
        </div>
      </div>

      {isToggled && isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="max-w-md">
            <label className="block text-sm text-gray-600 mb-2">
              Outlier Method
            </label>

            <ColumnSearchableDropdown
              value={selectedMethod}
              onChange={(value) =>
                setOutlierConfig((prev) => ({
                  ...prev,
                  method: value,
                  rollingWindow: '',
                  seasonalPeriod: '',
                }))
              }
              options={availableOutlierOptions}
              placeholder="Select Method"
              disabled={readonly}
              searchValue={searchValues}
              setSearchValue={setSearchValues}
              showDropdown={showDropdowns}
              setShowDropdown={setShowDropdowns}
              id="outlierMethod"
              hasError={!!methodError}
			  showDescription={true}
            />

            {methodError && (
              <p className="mt-1 text-xs text-red-500">
                {methodError}
              </p>
            )}

            {showRollingWindow && (
              <div className="mt-4">
                <MethodParameterField
                  label="Rolling Window"
                  value={outlierConfig?.rollingWindow ?? ''}
                  min={3}
                  max={365}
                  hasError={!!rollingWindowError}
                  errorMessage={rollingWindowError}
                  disabled={readonly}
                  onChange={(value) =>
                    setOutlierConfig((prev) => ({
                      ...prev,
                      rollingWindow: value,
                    }))
                  }
                />
              </div>
            )}

            {showSeasonalPeriod && (
              <div className="mt-4">
                <MethodParameterField
                  label="Seasonal Period"
                  value={outlierConfig?.seasonalPeriod ?? ''}
                  min={2}
                  max={365}
                  hasError={!!seasonalPeriodError}
                  errorMessage={seasonalPeriodError}
                  disabled={readonly}
                  onChange={(value) =>
                    setOutlierConfig((prev) => ({
                      ...prev,
                      seasonalPeriod: value,
                    }))
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OutlierDetection;