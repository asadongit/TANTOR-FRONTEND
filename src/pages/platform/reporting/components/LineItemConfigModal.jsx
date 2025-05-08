import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import RuleSelector from "./RuleSelector";

// Main LineItemConfigModal component
const LineItemConfigModal = ({ lineItemId, setShowModal }) => {
  const [rules, setRules] = useState([
    {
      ruleId: "",
      ruleName: "",
      metricId: "",
      dimensions: [{ name: "", operator: "", value: "" }],
    },
  ]);

  // Update a specific rule property
  const updateRule = (ruleIndex, field, value) => {
    setRules((prevRules) => {
      const updatedRules = [...prevRules];
      updatedRules[ruleIndex][field] = value;
      return updatedRules;
    });
  };

  // Add a new rule
  const addRule = () => {
    setRules((prevRules) => [
      ...prevRules,
      {
        ruleId: "",
        ruleName: "",
        metricId: "",
        dimensions: [{ name: "", operator: "", value: "" }],
      },
    ]);
  };

  // Add a new dimension to a specific rule
  const addDimension = (ruleIndex) => {
    setRules((prevRules) => {
      // Create a deep copy to prevent potential state mutation issues
      const updatedRules = JSON.parse(JSON.stringify(prevRules));
      updatedRules[ruleIndex].dimensions.push({
        name: "",
        operator: "",
        value: "",
      });
      return updatedRules;
    });
  };

  // Update a specific dimension property
  const updateDimension = (ruleIndex, dimIndex, field, value) => {
    setRules((prevRules) => {
      // Create a deep copy to prevent potential state mutation issues
      const updatedRules = JSON.parse(JSON.stringify(prevRules));
      updatedRules[ruleIndex].dimensions[dimIndex][field] = value;
      return updatedRules;
    });
  };

  // Remove a dimension
  const removeDimension = (ruleIndex, dimIndex) => {
    setRules((prevRules) => {
      // Create a deep copy to prevent potential state mutation issues
      const updatedRules = JSON.parse(JSON.stringify(prevRules));
      // Only remove if there's more than one dimension
      if (updatedRules[ruleIndex].dimensions.length > 1) {
        updatedRules[ruleIndex].dimensions.splice(dimIndex, 1);
      }
      return updatedRules;
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 p-4">{lineItemId}</h2>

      {rules.map((rule, index) => (
        <RuleSelector
          key={`rule-${index}`}
          rule={rule}
          index={index}
          updateRule={updateRule}
          addDimension={addDimension}
          updateDimension={updateDimension}
          removeDimension={removeDimension}
        />
      ))}

      <div className="flex justify-end gap-4 mt-4">
        <button
          type="button"
          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={() => setShowModal(false)}
        >
          Back
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={addRule}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Rule
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default LineItemConfigModal;
