import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import ToggleSwitch from '../TimeSeriesDataCleaning/ToggleSwitch';
import InfoButton from '../../../../../components/InfoButton';
import DataTable from '../../../../../../../../components/DataTable';

/**
 * =========================================================
 * SeasonalityAnalysisTable
 * =========================================================
 *
 * Child Component for Seasonality Analysis
 *
 * Responsibilities:
 * ---------------------------------------------------------
 * - Display seasonality toggle switch
 * - Manage expand/collapse for report display
 * - Display seasonality analysis report table
 *
 * Props:
 * ---------------------------------------------------------
 * - isToggled: boolean - whether seasonality analysis is active
 * - isExpanded: boolean - whether section is expanded
 * - onToggle: function - callback for toggle change
 * - onExpand: function - callback for expand/collapse
 * - readonly: boolean - whether in readonly mode
 * - isLoading: boolean - API loading state
 * - seasonalityReport: array - report data from API response
 * - sectionDescriptions: object - descriptions for info tooltip
 *
 * =========================================================
 */

function SeasonalityAnalysisTable({
  /**
   * Toggle state for seasonality analysis
   */
  isToggled,

  /**
   * Expanded/collapsed section state
   */
  isExpanded,

  /**
   * Function to toggle seasonality analysis switch
   */
  onToggle,

  /**
   * Function to expand/collapse section
   */
  onExpand,

  /**
   * Readonly mode
   */
  readonly,

  /**
   * Loading state during API call
   */
  isLoading,

  /**
   * Seasonality analysis report data from backend
   */
  seasonalityReport,

  /**
   * Section descriptions for info tooltip
   */
  sectionDescriptions
}) {

  /**
   * =========================================================
   * Define Table Columns
   * =========================================================
   *
   * Display only the specific required columns
   */

  const columns = [
    {
      key: 'column',
      label: 'Column',
      sortable: true,
      width: '150px'
    },
    {
      key: 'seasonality_detected',
      label: 'Seasonality Detected',
      sortable: true,
      width: '150px',
      render: (row) => {
        const value = row.seasonality_detected;
        return typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
      },
      renderTitle: (row) => {
        const value = row.seasonality_detected;
        return typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
      }
    },
    {
      key: 'decomposition_method',
      label: 'Decomposition Method',
      sortable: true,
      width: '150px',
      renderTitle: (row) => String(row.decomposition_method || '')
    },
    {
      key: 'recommended_treatment',
      label: 'Recommended Treatment',
      sortable: true,
      width: '200px',
      renderTitle: (row) => String(row.recommended_treatment || '')
    }
  ];

  /**
   * =========================================================
   * Prepare Table Data
   * =========================================================
   */

  const tableData = Array.isArray(seasonalityReport)
    ? seasonalityReport
    : [];

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
              Seasonality Analysis
            </h4>

            {/* Info Tooltip */}
            <InfoButton
              sectionDescriptions={sectionDescriptions}
              section="seasonalityAnalysis"
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

          {/* Expand / Collapse Button */}
          {isToggled && seasonalityReport.length > 0 && (
            <button
              onClick={onExpand}
              className="hover:opacity-70 transition-opacity"
            >
              {isExpanded ? (
                <ChevronUp size={20} color="#818181" />
              ) : (
                <ChevronDown size={20} color="#818181" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          Expanded Section Content
      ===================================================== */}

      {isToggled && isExpanded && seasonalityReport.length > 0 && (

        <div className="px-4 pb-4 border-t border-gray-100">

          <div className="mt-4">

         
            <DataTable
              columns={columns}
              data={tableData}
              isLoading={isLoading}
              isError={false}
            />

          </div>
        </div>
      )}

      {/* =====================================================
          Empty State
      ===================================================== */}

      {isToggled && seasonalityReport.length === 0 && (
        <div className="px-4 pb-4 border-t border-gray-100">

          <p className="text-sm text-gray-500 mt-3">
            No seasonality analysis report available
          </p>

        </div>
      )}
    </div>
  );
}

export default SeasonalityAnalysisTable;
