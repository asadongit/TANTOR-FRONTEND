import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import ToggleSwitch from '../TimeSeriesDataCleaning/ToggleSwitch';
import InfoButton from '../../../../../components/InfoButton';
import DataTable from '../../../../../../../../components/DataTable';
import { Info } from 'lucide-react';

/**
 * =========================================================
 * StationarityTable
 * =========================================================
 *
 * Child Component for Stationarity Treatment
 *
 * Responsibilities:
 * ---------------------------------------------------------
 * - Display stationarity treatment toggle switch
 * - Manage expand/collapse for report display
 * - Display stationarity analysis report table
 *
 * Props:
 * ---------------------------------------------------------
 * - isToggled: boolean - whether stationarity treatment is active
 * - isExpanded: boolean - whether section is expanded
 * - onToggle: function - callback for toggle change
 * - onExpand: function - callback for expand/collapse
 * - readonly: boolean - whether in readonly mode
 * - isLoading: boolean - API loading state
 * - stationarityReport: array - report data from API response
 * - sectionDescriptions: object - descriptions for info tooltip
 *
 * =========================================================
 */

function StationarityTable({
  isToggled,
  isExpanded,
  onToggle,
  onExpand,
  readonly,
  isLoading,
  stationarityReport,
  sectionDescriptions,
  stationarityAnalysisEnabled
}) {


  const columns = [
    {
      key: 'column',
      label: 'Column',
      sortable: true,
      width: '150px'
    },
    {
      key: 'adf_stationary',
      label: 'ADF Stationary',
      sortable: true,
      width: '140px',
      render: (row) => {
        const value = row.adf_stationary;
        return typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
      },
      renderTitle: (row) => {
        const value = row.adf_stationary;
        return typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
      }
    },
    {
      key: 'kpss_stationary',
      label: 'KPSS Stationary',
      sortable: true,
      width: '140px',
      render: (row) => {
        const value = row.kpss_stationary;
        return typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
      },
      renderTitle: (row) => {
        const value = row.kpss_stationary;
        return typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
      }
    },
    {
      key: 'diagnosis',
      label: 'Diagnosis',
      sortable: true,
      width: '150px',
      renderTitle: (row) => String(row.diagnosis || '')
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

  const tableData = Array.isArray(stationarityReport)
    ? stationarityReport
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
              Stationarity Treatment
            </h4>

            {/* Info Tooltip */}
            <InfoButton
              sectionDescriptions={sectionDescriptions}
              section="stationarityTreatment"
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
          {isToggled && stationarityReport.length > 0 && (
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
      {!stationarityAnalysisEnabled && (
  <div className="mx-4 mb-3 flex items-center gap-2 rounded-md border border-[#B69AD9] bg-[#F8F5FC] px-3 py-2 text-xs text-[#8C6BB1]">
    <Info size={14} className="flex-shrink-0" />

    <span>
      Stationarity Treatment is disabled because Stationarity Analysis was not selected in the previous step.
    </span>
  </div>
)}
      {/* =====================================================
          Expanded Section Content
      ===================================================== */}
      
      {isToggled && isExpanded && stationarityReport.length > 0 && (

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

      {isToggled && stationarityReport.length === 0 && (
        <div className="px-4 pb-4 border-t border-gray-100">

          <p className="text-sm text-gray-500 mt-3">
            No stationarity analysis report available
          </p>

        </div>
      )}
    </div>
  );
}

export default StationarityTable;
