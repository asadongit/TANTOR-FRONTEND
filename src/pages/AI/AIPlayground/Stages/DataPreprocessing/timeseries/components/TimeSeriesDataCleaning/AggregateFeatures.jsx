import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import ToggleSwitch from './ToggleSwitch';
import { SearchableDropdown } from '../Dropdowns';

import InfoButton from '../../../../../components/InfoButton';
import DataTable from '../../../../../../../../components/DataTable';

/**
 * =========================================================
 * AggregateFeatures Component
 * =========================================================
 *
 * Purpose:
 * Handles duplicate timestamp aggregation UI for
 * time series preprocessing.
 *
 * Features:
 * - Enable/Disable aggregation
 * - Select aggregation method
 * - Show duplicate rows table
 * =========================================================
 */

function AggregateFeatures({
  aggregation,
  expanded,
  toggleSwitch,
  toggleSection,
  readonly,
  isLoading,
  hasDuplicateRows,
  aggregationMethod,
  setAggregationMethod,
  duplicateRows,
  sectionDescriptions
}) {

  /*
   * Create Dynamic Table Columns
   */

  const getDynamicColumns = () => {

    if (!Array.isArray(duplicateRows) || duplicateRows.length === 0) {
      return [];
    }
    /**
     * Extract all unique keys from duplicate rows
     */
    const allKeys = new Set();
    duplicateRows.forEach((row) => {
      Object.keys(row).forEach((key) => {
        allKeys.add(key);
      });
    });
    /**
     * Build DataTable column configuration
     */
    return [
      {
        key: 'sno',
        label: '#',
        sortable: false,
        width: '50px'
      },
      ...Array.from(allKeys).map((key) => ({
        key,

        /**
         * Convert:
         * "order_date" -> "Order Date"
         */
        label:
          key.charAt(0).toUpperCase() +
          key.slice(1).replace(/_/g, ' '),

        sortable: true,

        width: '150px'
      }))
    ];
  };
  /**
   * =========================================================
   * Add Serial Number to Table Rows
   * =========================================================
   */

  const tableData = Array.isArray(duplicateRows)
    ? duplicateRows.map((row, index) => ({
        sno: index + 1,
        ...row
      }))
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
              Aggregate Features
            </h4>

            {/* Info Tooltip */}
            <InfoButton
              sectionDescriptions={sectionDescriptions}
              section="aggregation"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">

          {/* Toggle Switch */}
          <ToggleSwitch
  checked={aggregation}
  onChange={() => {}}
  disabled={true}
/>

          {/* Expand / Collapse Button */}
          {aggregation && (
            <button
              onClick={() => toggleSection('aggregation')}
              className="hover:opacity-70 transition-opacity"
            >
              {expanded ? (
                <ChevronUp size={20} color="#818181" />
              ) : (
                <ChevronDown size={20} color="#818181" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          No Duplicate Rows Message
      ===================================================== */}

      {!hasDuplicateRows && (
        <div className="px-4 pb-4 border-t border-gray-100">

          <p className="text-sm text-gray-500 mt-3">
            Aggregation feature is not available
            since there are no duplicate rows.
          </p>

        </div>
      )}

      {/* =====================================================
          Expanded Section Content
      ===================================================== */}

      {hasDuplicateRows && aggregation && expanded && (

        <div className="px-4 pb-4 border-t border-gray-100">

          <div className="mt-4 space-y-4">

            {/* =================================================
                Aggregation Method Dropdown
            ================================================= */}
            <div>
              <span className="text-xs font-medium text-gray-600 mb-1 block">
                Aggregation Method
              </span>
              <SearchableDropdown
                selectedColumn={aggregationMethod}
                onSelect={(val) =>
                  setAggregationMethod(val)
                }
                availableOptions={[
                  'mean',
                  'sum',
                  'first',
                  'last',
                  'median'
                ]}
                placeholder="Select"

                readonly={readonly || isLoading}

                dropDirection="down"
              />
            </div>
            {/* =================================================
                Duplicate Rows Table
            ================================================= */}

            <div className="mt-6">
              <p className="text-xs font-medium text-gray-600 mb-3">
                Duplicate Rows Report
              </p>
              <DataTable
                columns={getDynamicColumns()}
                data={tableData}
                isLoading={false}
                isError={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default AggregateFeatures;