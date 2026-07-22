import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

import InfoButton from '../../../../../components/InfoButton';
import ToggleSwitch from './ToggleSwitch';

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
  const [hoveredOption, setHoveredOption] = useState(null);

  const selectedMethod = outlierConfig?.method || '';


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
            <div className="flex flex-row items-center gap-1">
            <h4 className="text-sm font-medium text-gray-900">
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

<div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3">
  {availableOutlierOptions.map((option) => {
    const isSelected =
      selectedMethod === option.value;

    return (
      <div
        key={option.value}
        className="relative"
        onMouseEnter={() =>
          setHoveredOption(option.value)
        }
        onMouseLeave={() =>
          setHoveredOption(null)
        }
      >
        <label
          className={`flex flex-col p-3 rounded-lg transition-all ${
            isSelected
              ? 'bg-[#FAF8FF] border border-[#8e78b7]'
              : 'bg-white border border-transparent'
          } ${
            readonly
              ? 'cursor-not-allowed opacity-60'
              : 'cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="outlierMethod"
              value={option.value}
              checked={isSelected}
              onChange={(e) =>
                setOutlierConfig((prev) => ({
                  ...prev,
                  method: e.target.value,
                  rollingWindow: '',
                  seasonalPeriod: '',
                }))
              }
              disabled={readonly}
              className="w-4 h-4 accent-[#8e78b7]"
            />

            <span
              className={`text-sm font-medium ${
                isSelected
                  ? 'text-[#8e78b7]'
                  : 'text-gray-700'
              }`}
            >
              {option.label}
            </span>
          </div>

          {isSelected &&
            option.subMethod ===
              'rolling_window' && (
              <div className="mt-4">
                <MethodParameterField
                  label="Rolling Window"
                  value={
                    outlierConfig?.rollingWindow ??
                    ''
                  }
                  min={3}
                  max={365}
                  hasError={!!rollingWindowError}
                  errorMessage={
                    rollingWindowError
                  }
                  disabled={readonly}
                  onChange={(value) =>
                    setOutlierConfig(
                      (prev) => ({
                        ...prev,
                        rollingWindow: value,
                      })
                    )
                  }
                />
              </div>
            )}

          {isSelected &&
            option.subMethod ===
              'seasonal_period' && (
              <div className="mt-4">
                <MethodParameterField
                  label="Seasonal Period"
                  value={
                    outlierConfig?.seasonalPeriod ??
                    ''
                  }
                  min={2}
                  max={365}
                  hasError={!!seasonalPeriodError}
                  errorMessage={
                    seasonalPeriodError
                  }
                  disabled={readonly}
                  onChange={(value) =>
                    setOutlierConfig(
                      (prev) => ({
                        ...prev,
                        seasonalPeriod: value,
                      })
                    )
                  }
                />
              </div>
            )}
        </label>

        {hoveredOption === option.value && (
          <div className="absolute left-0 top-full mt-2 z-50 w-80 p-3 bg-[#332849] text-white text-xs rounded-lg shadow-lg">
            <div className="absolute -top-1 left-4 w-2 h-2 bg-[#332849] rotate-45"></div>
            <p className="leading-relaxed">
              {option.description}
            </p>
          </div>
        )}
      </div>
    );
  })}
</div>

{methodError && (
  <p className="text-xs text-red-500 mt-2">
    {methodError}
  </p>
)}
        </div>
      )}
    </div>
  );
};

export default OutlierDetection;