import React from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';

import ToggleSwitch from './ToggleSwitch';
import { SearchableDropdown } from '../Dropdowns';

import InfoButton from '../../../../../components/InfoButton';

/**
 * ==========
 * ChangeDataType Component
 * ==========
 *
 * Purpose:
 * Handles manual datatype conversion UI for
 * time series preprocessing.
 *
 * Features:
 * - Enable/Disable datatype conversion
 * - Select column
 * - Show existing datatype
 * - Select new datatype
 * - Add/remove datatype rows
 * - Validation error display

 * ==========
 */

function ChangeDataType({

  /**

   * Toggle & Expand States

   */
  modifyDataTypes,
  expanded,
  toggleSwitch,
  toggleSection,
  disabled,

  /**
   * General States
   */
  readonly,
  isLoading,

  /**
   * Datatype Rows State
   */
  dataTypeColumns,

  /**
   * Original column datatypes from backend
   */
  columnsDataTypes,

  /**
   * Available datatype options
   */
  dataTypeOptions,
  showFieldErrors,
  getAvailableColumns,
  canAddNewRow,
  handleColumnChange,
  handleNewDataTypeChange,
  addColumn,
  removeDataTypeColumn,
   // Info Tooltip Descriptions
  sectionDescriptions

}) {

  return (

    <div className="rounded-lg transition-all bg-[#FAFAFA]">

      {/* ====
          Section Header
      ====*/}

      <div className="p-4 flex items-center justify-between">

        {/* Left Side */}
        <div className="flex-1">

          <div className="flex items-center gap-2">

            <h4 className="text-sm font-medium text-gray-900">
              Change Data Type
            </h4>

            {/* Info Tooltip */}
            <InfoButton
              sectionDescriptions={sectionDescriptions}
              section="changeDataType"
            />

          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">

          {/* Toggle Switch */}
          <ToggleSwitch
            checked={modifyDataTypes}
            onChange={() => toggleSwitch('changeDataType')}
            disabled={readonly || isLoading || disabled}
          />

          {/* Expand / Collapse Button */}
          {modifyDataTypes && (

           <button
  onClick={() => toggleSection('changeDataType')}
  disabled={disabled}
  className={`transition-opacity ${
    disabled
      ? 'opacity-50 cursor-not-allowed'
      : 'hover:opacity-70 cursor-pointer'
  }`}
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

      {/* ====
          Expanded Content
      ====*/}

      {modifyDataTypes && expanded && (

        <div className="px-4 pb-4 border-t border-gray-100">

          <div className="mt-4 space-y-2">

            {/* 
                Table Header
            */}

            <div className="grid grid-cols-[1fr_1fr_1fr_32px] gap-3">

              <label className="text-xs font-medium text-gray-600">
                Column Name
              </label>

              <label className="text-xs font-medium text-gray-600">
                Old Data Type
              </label>

              <label className="text-xs font-medium text-gray-600">
                New Data Type
              </label>

              <div />

            </div>

            {/* 
                Dynamic Datatype Rows
            */}
            {dataTypeColumns.map((column, index) => {

              /**
               * Field Validation Errors
               */
              const colMissingName =
                showFieldErrors &&
                !column.columnName;

              const colMissingType =
                showFieldErrors &&
                column.columnName &&
                !column.newDataType;

              return (

                <div
                  key={index}
                  className="grid grid-cols-[1fr_1fr_1fr_32px] gap-3 items-start"
                >
                  {/* 
                      Column Selection Dropdown */}
                  <div className="flex flex-col">
                    <SearchableDropdown
                      selectedColumn={column.columnName}
                      onSelect={(val) =>
                        handleColumnChange(index, val)
                      }
                      availableOptions={
                        getAvailableColumns(index)
                      }
                      placeholder="Select"
                      readonly={readonly || isLoading}
                      dropDirection="down"
                      hasError={colMissingName}
                    />
                    {/* Validation Error */}
                    {colMissingName && (

                      <p className="text-xs text-[#EF4D5F] mt-1 pl-0.5">
                        Please select a column
                      </p>
                    )}
                  </div>
                  {/* =========================================
                      Old Datatype Display
                  ========================================= */}

                  <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white">
                    {column.oldDataType || '-'}
                  </div>
                  {/* =========================================
                     Datatype Dropdown
                  ========================================= */}
                  <div className="flex flex-col">
                    <SearchableDropdown
                      selectedColumn={column.newDataType}
                      onSelect={(val) =>
                        handleNewDataTypeChange(index, val)
                      }
                      availableOptions={dataTypeOptions}
                      placeholder="Select"
                      readonly={readonly || isLoading}
                      dropDirection="down"
                      hasError={!!colMissingType}
                    />
                    {/* Validation Error */}
                    {colMissingType && (
                      <p className="text-xs text-[#EF4D5F] mt-1 pl-0.5">
                        Please select a new data type
                      </p>
                    )}
                  </div>

                  {/* 
                      Remove Row Button*/}

                  <div className="flex items-start justify-center pt-2">

                    {dataTypeColumns.length > 1 && (

                      <button
                        onClick={() =>
                          removeDataTypeColumn(index)
                        }

                        disabled={readonly || isLoading}

                        className="text-gray-400 hover:text-red-500 transition-colors p-1"

                        title="Remove"
                      >

                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >

                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />

                        </svg>

                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 
                Add New Datatype Row Button
            */}

            <div>

              <button

                onClick={addColumn}

                disabled={
                  readonly ||
                  isLoading ||
                  !canAddNewRow()
                }

                style={{ width: '330px' }}

                className={`
                  py-2
                  border-2
                  border-dashed
                  rounded-lg
                  text-sm
                  flex
                  items-center
                  justify-center
                  gap-2
                  transition-colors
                  mt-3

                  ${
                    readonly ||
                    isLoading ||
                    !canAddNewRow()

                      ? 'border-gray-200 text-gray-300 cursor-not-allowed'

                      : 'border-[#8e78b7] text-[#8e78b7] hover:bg-purple-50'
                  }
                `}
              >

                <Plus size={16} />

                Add Column

              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChangeDataType;