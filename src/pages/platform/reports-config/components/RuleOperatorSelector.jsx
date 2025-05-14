import { useState } from "react";
import {
  PlusCircle,
  ChevronDown,
  X,
  MinusCircle,
  MinusCircleIcon,
} from "lucide-react";

export default function RuleSelector({
  isOpen,
  setIsOpen,
  rules,
  lineItemId,
  updateRules,
  setShowLineItemModal
}) {
  const [ruleOperators, setRuleOperators] = useState([
    {
      ruleId: "",
      operator: "",
    },
  ]);

  const addSelectOperator = () => {
    setRuleOperators((prev) => {
      const newRuleOperators = [...prev];
      newRuleOperators.push({
        ruleId: "",
        operator: "",
      });

      return newRuleOperators;
    });
  };

  const removeSelectOperator = (index) => {
    let removeRuleId = ruleOperators[index].ruleId;
    const newRules = [...rules];
    const ruleIndex = newRules.findIndex(rule => rule.ruleId == removeRuleId);
    newRules[ruleIndex].operator = "";
    newRules[ruleIndex].sequence = "";
    updateRules(lineItemId, newRules);

    setRuleOperators((prev) => {
      if (prev.length === 1) {
        return [
          {
            ruleId: "",
            operator: "",
          },
        ];
      }

      const newRuleOperators = [...prev];
      newRuleOperators.splice(index, 1);
      return newRuleOperators;
    });
  };

  const handleNext = () => {
    const newRules = [...rules];
    let ruleSequence = 1;

    if(newRules.length !== 1){
      for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex++) {
        const rule = newRules[ruleIndex];
    
        for (let ruleOperatorIndex = 0; ruleOperatorIndex < ruleOperators.length; ruleOperatorIndex++) {
          if (ruleOperators[ruleOperatorIndex].ruleId === rule.ruleId) {
            newRules[ruleIndex]["operator"] = ruleOperators[ruleOperatorIndex].operator;
            newRules[ruleIndex]["sequence"] = ruleSequence;
            ruleSequence++;
            break;
          }
        }
      };
    }
  

    updateRules(lineItemId, newRules);
    setShowLineItemModal(false);
    setIsOpen(false);
  };
  
  const closeModal = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>

      <div className="relative w-full max-w-3xl mx-4 bg-white rounded-lg shadow-2xl p-6 z-10 animate-fadeIn">
        <div className="absolute top-4 right-4">
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6 border-b pb-3">
          <h2 className="text-xl font-semibold text-gray-800">
            {lineItemId}
          </h2>
        </div>

        <div className="space-y-4">
          {ruleOperators.map((rule, index) => (
            <div key={index} className="flex items-center gap-4 flex-wrap">
              <div className="relative w-48 sm:w-1/3 lg:w-48">
                <select
                  className="w-full appearance-none bg-gray-50 border border-gray-300 rounded-md px-4 py-2 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={rule.ruleId}
                  onChange={(e) => {
                    const newRuleOperators = [...ruleOperators];
                    newRuleOperators[index].ruleId = e.target.value;
                    setRuleOperators(newRuleOperators);
                  }}
                >
                  <option value="" disabled>
                    Rule Selector
                  </option>
                  {rules.map((rule, index) => (
                    <option value={rule?.ruleId}>
                      {rule?.ruleName || "DEFAULT VALUE"}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
              </div>

              <div className="relative w-36 sm:w-1/4 lg:w-36">
                <select
                  className="w-full appearance-none bg-gray-50 border border-gray-300 rounded-md px-4 py-2 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={rule.operator}
                  onChange={(e) => {
                    const newRuleOperators = [...ruleOperators];
                    newRuleOperators[index].operator = e.target.value;
                    setRuleOperators(newRuleOperators);
                  }}
                >
                  <option value="" disabled>
                    Operator
                  </option>
                  <option value="add">ADD</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
              </div>

              <button
                onClick={addSelectOperator}
                className="text-blue-500 hover:text-blue-600 transition-colors duration-200"
                title="Add new rule"
              >
                <PlusCircle className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  removeSelectOperator(index);
                }}
                className="text-blue-500 hover:text-blue-600 transition-colors duration-200"
                title="Remove"
              >
                <MinusCircle className="w-6 h-6" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-3 justify-end flex-wrap">
          <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md transition-colors duration-200">
            Back
          </button>
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md transition-colors duration-200"
          >
            Cancel
          </button>
          <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md transition-colors duration-200">
            Validate
          </button>
          <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition-colors duration-200"
            onClick={handleNext}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
