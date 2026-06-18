import React, { memo } from 'react';
import { FiTrash2, FiChevronDown } from 'react-icons/fi';
import { MiniatureToggle } from './primitives';

import PropTypes from 'prop-types';

export const ListAccordionItem = memo(function ListAccordionItem({
  headerContent,     // React node/element to display inside the left section of the header
  index,             // Current item index (for move/disabled checks)
  totalItems,        // Total count of items
  isCollapsed,       // boolean state
  onToggleCollapse,  // callback when header is clicked to expand/collapse
  isEnabled = true,  // boolean if item has active/disabled state
  onToggleEnabled,   // optional callback
  onMoveUp,          // optional callback to move item up
  onMoveDown,        // optional callback to move item down
  onDelete,          // optional callback to delete item
  children,          // expanded body content
}) {
  return (
    <div className={`p-3 rounded-xl border border-[var(--border)] relative transition-all duration-200 ${isEnabled ? 'bg-slate-50 opacity-100' : 'bg-slate-100 opacity-70'} mb-3`}>
      <div className={`flex items-center gap-1.5 ${isCollapsed ? 'mb-0' : 'mb-3'}`}>
        {/* Collapse toggle button */}
        <button 
          type="button"
          className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer select-none bg-transparent border-none text-left p-0" 
          onClick={onToggleCollapse}
        >
          <FiChevronDown 
            size={14} 
            className="text-[var(--text-muted)] transition-transform duration-200 shrink-0"
            style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }} 
          />
          {headerContent}
        </button>

        {/* Up/Down controls */}
        {(onMoveUp || onMoveDown) && (
          <div data-prevent-toggle="true" className="flex items-center gap-0.5 border-r border-[var(--border)] pr-1.5">
            {onMoveUp && (
              <button 
                onClick={(e) => { e.stopPropagation(); onMoveUp(); }} 
                disabled={index === 0} 
                className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer disabled:opacity-30 p-0.5" 
                title="Move Up"
              >
                <FiChevronDown className="rotate-180" size={13} />
              </button>
            )}
            {onMoveDown && (
              <button 
                onClick={(e) => { e.stopPropagation(); onMoveDown(); }} 
                disabled={index === totalItems - 1} 
                className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer disabled:opacity-30 p-0.5" 
                title="Move Down"
              >
                <FiChevronDown size={13} />
              </button>
            )}
          </div>
        )}

        {/* Toggle Switch */}
        {onToggleEnabled && (
          <div data-prevent-toggle="true">
            <MiniatureToggle
              checked={isEnabled}
              onChange={onToggleEnabled}
            />
          </div>
        )}

        {/* Delete button */}
        {onDelete && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }} 
            className="bg-transparent border-none text-red-500 cursor-pointer p-0.5" 
            title="Delete Item"
          >
            <FiTrash2 size={13} />
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="flex flex-col gap-3">
          {children}
        </div>
      )}
    </div>
  );
});

ListAccordionItem.propTypes = {
  headerContent: PropTypes.node.isRequired,
  index: PropTypes.number.isRequired,
  totalItems: PropTypes.number.isRequired,
  isCollapsed: PropTypes.bool.isRequired,
  onToggleCollapse: PropTypes.func.isRequired,
  isEnabled: PropTypes.bool,
  onToggleEnabled: PropTypes.func,
  onMoveUp: PropTypes.func,
  onMoveDown: PropTypes.func,
  onDelete: PropTypes.func,
  children: PropTypes.node.isRequired,
};
