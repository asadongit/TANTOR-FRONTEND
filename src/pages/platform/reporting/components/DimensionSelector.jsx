import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";

const DimensionSelector = ({
  dimension,
  index,
  ruleIndex,
  updateDimension,
  removeDimension,
}) => {
  return (
    <div className="flex gap-4 mb-2">
      <input
        placeholder="Name"
        value={dimension.name || ""}
        onChange={(e) =>
          updateDimension(ruleIndex, index, "name", e.target.value)
        }
        className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
      <input
        placeholder="Operator"
        value={dimension.operator || ""}
        onChange={(e) =>
          updateDimension(ruleIndex, index, "operator", e.target.value)
        }
        className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
      <input
        placeholder="Value"
        value={dimension.value || ""}
        onChange={(e) =>
          updateDimension(ruleIndex, index, "value", e.target.value)
        }
        className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
      <button
        type="button"
        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        onClick={() => removeDimension(ruleIndex, index)}
      >
        -
      </button>
    </div>
  );
};

export default DimensionSelector;
