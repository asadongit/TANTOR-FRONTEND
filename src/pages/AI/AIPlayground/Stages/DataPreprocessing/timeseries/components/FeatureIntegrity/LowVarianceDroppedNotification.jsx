import React from 'react';
import { Info } from 'lucide-react';

/**
 * =========================================================
 * LowVarianceDroppedNotification
 * =========================================================
 *
 * Purpose:
 * Displays a notification banner when columns are dropped
 * due to low variance during feature integrity checks.
 *
 * Features:
 * - Shows info icon
 * - Lists all dropped columns
 * - Clean, professional styling
 * - Only displays if columns are dropped
 *
 * Parent Component:
 * FeatureIntegrity/index.jsx
 *
 * NOTE:
 * This component ONLY handles UI rendering.
 * =========================================================
 */

function LowVarianceDroppedNotification({
  /**
   * Array of column names that were dropped
   */
  droppedColumns = []
}) {

  /**
   * Don't render if no columns were dropped
   */
  if (
    !droppedColumns ||
    !Array.isArray(droppedColumns) ||
    droppedColumns.length === 0
  ) {
    return null;
  }

  /**
   * Format columns list for display
   * e.g., "column1, column2, column3"
   */
  const columnsText = droppedColumns.join(', ');

  /**
   * Determine singular or plural
   */
  const columnWord = droppedColumns.length === 1
    ? 'column'
    : 'columns';

  return (
    <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">

      {/* Content Container */}
      <div className="flex items-start gap-3">

        {/* Info Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <Info
            size={20}
            className="text-blue-600"
          />
        </div>

        {/* Message Text */}
        <div className="flex-1 min-w-0">

          <p className="text-sm text-blue-800">

            {droppedColumns.length === 1 ? (
              <>
                <span className="font-medium">{columnsText}</span>
                {' '}column is dropped due to low variance.
              </>
            ) : (
              <>
                <span className="font-medium">{columnsText}</span>
                {' '}
                {columnWord} are dropped due to low variance.
              </>
            )}

          </p>

        </div>
      </div>

    </div>
  );
}

export default LowVarianceDroppedNotification;
