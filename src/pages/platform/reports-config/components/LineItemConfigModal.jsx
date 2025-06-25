import React from "react";
import { Plus } from "lucide-react";
import RuleSelector from "./RuleSelector";
import { useLineItems } from "../context/LineItemsContext";

function LineItemConfigModal() {
  const {
    currentLineItemId: lineItemId,
    setShowLineItemConfigModal: setShowModal,
    updateLineItemConfigRules: updateLineItemRules,
    getRulesForCurrentLineItem,
    showRuleOperatorSelector,
    setShowRuleOperatorSelector
  } = useLineItems();

  const rules = getRulesForCurrentLineItem();

  const updateRule = (ruleIndex, field, value) => {
    const newRules = [...rules];

    if (field === null && typeof value === "object") {
      newRules[ruleIndex] = value;
    } else {
      newRules[ruleIndex] = {
        ...newRules[ruleIndex],
        [field]: value,
      };
    }

    updateLineItemRules(lineItemId, newRules);
  };

  const addRule = () => {
    const newRules = [
      ...rules,
      {
        ruleId: "",
        ruleName: "",
        metrics: [],
        dimensions: [{ id: "", name: "", operator: "", value: [] }],
        filters: [],
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
    if (newRules[ruleIndex].dimensions.length > 1)
      newRules[ruleIndex].dimensions.splice(dimIndex, 1);
    
    else if (newRules[ruleIndex].dimensions.length == 1) {
      newRules[ruleIndex].dimensions[0] = {
        id: "",
        name: "",
        operator: "",
        value: [],
      };
    }
    updateLineItemRules(lineItemId, newRules);
  };

  const removeRule = (ruleIndex) => {
    const newRules = [...rules];
    if (newRules.length === 0) return;
    newRules.splice(ruleIndex, 1);
    updateLineItemRules(lineItemId, newRules);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm"></div>
      <div className="relative min-h-screen flex items-center justify-center p-6">
        <div className="relative bg-white rounded-lg w-full max-w-3xl p-6">
          <h2 className="text-lg font-semibold mb-3">{lineItemId.toLocaleUpperCase()}</h2>

          <div className="max-h-[70vh] overflow-y-auto">
            {rules.map((rule, index) => (
              <RuleSelector
                key={`rule-${index}`}
                rule={rule}
                index={index}
                updateRule={updateRule}
                addDimension={addDimension}
                updateDimension={updateDimension}
                removeDimension={removeDimension}
                removeRule={removeRule}
              />
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-4">
            {/* <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium bg-[#8E77BB] hover:opacity-80 text-white rounded-lg hover:bg-[rgb(142,119,187,0.8)"
              // onClick={removeLastRule}
            >
              Remove Rule
            </button> */}
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium bg-[#8E77BB] hover:opacity-80 text-white rounded-lg hover:bg-[rgb(142,119,187,0.8)"
              onClick={addRule}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Rule
            </button>
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium bg-[#8E77BB] hover:opacity-80 text-white rounded-lg hover:bg-[rgb(142,119,187,0.8)"
              onClick={(e) => {
                e.preventDefault();
                setShowRuleOperatorSelector(true);
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LineItemConfigModal;