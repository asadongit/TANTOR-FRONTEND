import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import RuleSelector from "./RuleSelector";
import RuleOperatorSelector from "./RuleOperatorSelector";

const LineItemConfigModal = ({
  lineItemId,
  setShowModal,
  updateLineItemRules,
  rules,
  showRuleOperatorSelector, 
  setShowRuleOperatorSelector
}) => {
  

  const updateRule = (ruleIndex, field, value) => {
    console.log(
      `Rule Index = ${ruleIndex} | field = ${field} | value = ${value}`
    );
    const updatedRules = [...rules];
    rules[ruleIndex][field] = value;

    updateLineItemRules(lineItemId, updatedRules);
  };

  const addRule = () => {
    const newRules = [
      ...rules,
      {
        ruleId: "",
        ruleName: "",
        metrics: [],
        dimensions: [{ id: "", name: "", operator: "", value: [] }],
        filters: []
      },
    ];

    updateLineItemRules(lineItemId, newRules);
  };

  const addDimension = (ruleIndex) => {
   
    const newRules = [...rules];
    console.log("Rule with index ==>> ", newRules[ruleIndex].dimensions);
    newRules[ruleIndex].dimensions.push({
      id: "",
      name: "",
      operator: "",
      value: [],
    });

    updateLineItemRules(lineItemId, newRules);
  };

  const updateDimension = (ruleIndex, dimIndex, field, value) => {
    const newRules = [...rules];
    newRules[ruleIndex].dimensions[dimIndex][field] = value;

    updateLineItemRules(lineItemId, newRules);
  };

  const removeDimension = (ruleIndex, dimIndex) => {
    
    const newRules = [...rules];
    if(newRules[ruleIndex].dimensions.length > 1)
      newRules[ruleIndex].dimensions.splice(dimIndex, 1);

    updateLineItemRules(lineItemId, newRules);

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

      <div className="flex justify-end gap-4 mt-56">
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
          onClick={(e) => {e.preventDefault(); setShowRuleOperatorSelector(true);}}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default LineItemConfigModal;
