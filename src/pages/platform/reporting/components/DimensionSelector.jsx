import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";

const DimensionSelector = ({
  dimension,
  index,
  ruleIndex,
  updateDimension,
  removeDimension,
  dimensionNamesData
}) => {
  return (
    <div className="flex gap-4 mb-2">
      <select
        value={dimension.id || ""}
        onChange={(e) =>{
          const selectedOption = e.target.options[e.target.selectedIndex];
          const selectedDimensionName = selectedOption.getAttribute("data-name");
          const selectedDimensionId = e.target.value;

          updateDimension(ruleIndex, index, "name", selectedDimensionName);
          updateDimension(ruleIndex, index, "id", selectedDimensionId);
        }
        }
        className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        <option value="">Select Dimension</option>
        {dimensionNamesData && dimensionNamesData.map(item => (<option data-name={item.fct_column_name} value={item.fact_dimension_link_id}>{item.fct_column_name}</option>))}
      </select>
      
      <select
        value={dimension.operator || ""}
        onChange={(e) =>
          updateDimension(ruleIndex, index, "operator", e.target.value)
        }
        className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        <option value="">Select Operator</option>
        <option value="in">IN</option>
        <option value="in">NOT IN</option>
    </select>
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
