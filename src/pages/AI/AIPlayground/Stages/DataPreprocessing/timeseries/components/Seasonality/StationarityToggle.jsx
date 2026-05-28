import React from 'react';

import ToggleSwitch from '../TimeSeriesDataCleaning/ToggleSwitch';
import InfoButton from '../../../../../components/InfoButton';

/**
 * =========================================================
 * StationarityToggle
 * =========================================================
 *
 * Child Component for Stationarity Analysis
 *
 * Responsibilities:
 * ---------------------------------------------------------
 * - Display stationarity toggle switch
 * - Show info text when enabled
 *
 * Props:
 * ---------------------------------------------------------
 * - isToggled: boolean - whether stationarity analysis is active
 * - onToggle: function - callback for toggle change
 * - readonly: boolean - whether in readonly mode
 * - isLoading: boolean - API loading state
 * - sectionDescriptions: object - descriptions for info tooltip
 *
 * =========================================================
 */

function StationarityToggle({
  /**
   * Toggle state for stationarity analysis
   */
  isToggled,

  /**
   * Function to toggle stationarity analysis switch
   */
  onToggle,

  /**
   * Readonly mode
   */
  readonly,

  /**
   * Loading state during API call
   */
  isLoading,

  /**
   * Section descriptions for info tooltip
   */
  sectionDescriptions
}) {

  return (

    <div className="rounded-lg transition-all bg-[#FAFAFA]">

      {/* =====================================================
          Section Header
      ===================================================== */}

      <div className="p-4 flex items-center justify-between">

        {/* Left Side */}
        <div className="flex-1">
          <div className="flex items-center gap-2">

            <h4 className="text-sm font-medium text-gray-900">
              Stationarity Analysis
            </h4>

            {/* Info Tooltip */}
            <InfoButton
              sectionDescriptions={sectionDescriptions}
              section="stationarityAnalysis"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">

          {/* Toggle Switch */}
          <ToggleSwitch
            checked={isToggled}
            onChange={onToggle}
            disabled={readonly || isLoading}
          />
        </div>
      </div>

      {/* =====================================================
          Info Text when toggled ON
      ===================================================== */}

      
    </div>
  );
}

export default StationarityToggle;
