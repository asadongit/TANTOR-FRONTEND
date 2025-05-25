import { useState } from "react";
import {
  PlusCircle,
  ChevronDown,
  X,
  MinusCircle,
  MinusCircleIcon,
} from "lucide-react";
import toast from "react-hot-toast";

export default function RuleSelector({
  isOpen,
  setIsOpen,
  rules,
  lineItemId,
  updateRules,
  setShowLineItemModal,
  setShowSummaryModal,
}) {
  const [ruleOperators, setRuleOperators] = useState([
    {
      ruleId: "",
      operator: "",
    },
  ]);
  const [disableSubmit, setDisableSubmit] = useState(true);

  const addSelectOperator = () => {
    setDisableSubmit(true);
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
    setDisableSubmit(true);
    if (!removeRuleId) {
      return setRuleOperators((prev) => {
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
    }

    const newRules = [...rules];
    const ruleIndex = newRules.findIndex((rule) => rule.ruleId == removeRuleId);
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

    ruleOperators.forEach((ruleOp) => {
      if (ruleOp.ruleId) {
        const ruleIndex = newRules.findIndex(
          (rule) => rule.ruleId === ruleOp.ruleId
        );
        if (ruleIndex !== -1) {
          newRules[ruleIndex].operator = ruleOp.operator;
          newRules[ruleIndex].sequence = ruleSequence;
          ruleSequence++;
        }
      }
    });

    updateRules(lineItemId, newRules);
    // setShowLineItemModal(false);
    // setIsOpen(false);
    setShowSummaryModal(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleValidate = () => {
    // Check if there are any rules
    if (rules.length === 0) {
      return toast.error("A Line_Item must be linked to at least one rule.");
    }

    // Clean up empty dimensions and update state
    const newRules = rules.map(rule => ({
      ...rule,
      dimensions: rule.dimensions.filter(dim => 
        dim.name || dim.operator || (dim.value && dim.value.length > 0)
      )
    }));
    
    // Update the rules state with cleaned dimensions
    updateRules(lineItemId, newRules);

    // Check if any rule has an empty ruleId
    const emptyRules = newRules.some(rule => !rule.ruleId);
    if (emptyRules) {
      return toast.error("Remove Empty Rules.");
    }

    // Check if each rule has at least one metric
    const rulesWithoutMetrics = rules.filter(rule => !rule.metrics || rule.metrics.length === 0);
    if (rulesWithoutMetrics.length > 0) {
      const ruleNames = rulesWithoutMetrics.map(rule => rule.ruleName).join(", ");
      return toast.error(`Rule(s) "${ruleNames}" must have at least one metric selected.`);
    }

    // Check dimensions validation
    const invalidDimensions = rules.flatMap(rule => 
      rule.dimensions.filter(dim => 
        (dim.name && (!dim.operator || !dim.value || dim.value.length === 0)) ||
        (dim.operator && (!dim.name || !dim.value || dim.value.length === 0)) ||
        (dim.value && dim.value.length > 0 && (!dim.name || !dim.operator))
      )
    );

    if (invalidDimensions.length > 0) {
      return toast.error("All dimensions must have name, operator and values selected.");
    }

    const ruleIds = rules.map((rule) => rule.ruleId);

    //  duplicates check.
    const seen = new Set();
    const duplicates = new Set();

    for (const { ruleId } of ruleOperators) {
      if (seen.has(ruleId)) duplicates.add(ruleId);
      else seen.add(ruleId);
    }

    if (duplicates.size > 0) {
      const duplicateNames = [...duplicates]
        .map((id) => rules.find((rule) => rule.ruleId === id))
        .filter(Boolean)
        .map((rule) => rule.ruleName);

      return toast.error(
        `Duplicate Selections found for Rule(s): ${duplicateNames.join(", ")}`
      );
    }

    //  empty selections (neither rule nor operator selected)
    const hasEmptySelection = ruleOperators.some(
      (ro) => !ro.ruleId && !ro.operator
    );

    if (hasEmptySelection) {
      return toast.error(
        "One or more rules are incomplete — please select both a Rule and an Operator."
      );
    }

    // rules are missing from ruleOperators
    const unlinkedRuleNames = ruleIds
      .filter((id) => !ruleOperators.some((ro) => ro.ruleId === id))
      .map((id) => rules.find((rule) => rule.ruleId === id))
      .filter(Boolean)
      .map((rule) => rule.ruleName);

    if (unlinkedRuleNames.length > 0) {
      return toast.error(
        `Rule(s) "${unlinkedRuleNames.join(", ")}" not selected.`
      );
    }

    //  missing operators
    const operatorMissingNames = ruleOperators
      .filter((ro) => !ro.operator)
      .map((ro) => rules.find((rule) => rule.ruleId === ro.ruleId))
      .filter(Boolean)
      .map((rule) => rule.ruleName);

    if (operatorMissingNames.length > 0) {
      return toast.error(
        `Operators for Rule(s) "${operatorMissingNames.join(
          ", "
        )}" not selected.`
      );
    }

    toast.success("Validation Successful.");
    setDisableSubmit(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>

      <div className="relative w-full max-w-3xl mx-4 bg-white rounded-lg shadow-2xl p-6 z-10 animate-fadeIn">
        {/* <div className="absolute top-4 right-4">
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div> */}

        <div className="mb-6 border-b pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Configure Rule Sequence</h2>
            <span className="text-sm text-gray-600">{lineItemId.toUpperCase()}</span>
          </div>
        </div>
        <div className="space-y-4">
          {ruleOperators.map((rule, index) => (
            <div key={index} className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#8E77BB] text-white font-medium">
                {index + 1}
              </div>
              <div className="relative w-48 sm:w-1/3 lg:w-48">
                <select
                  className="w-full appearance-none bg-gray-50 border border-gray-300 rounded-md px-4 py-2 pr-8 text-gray-70 focus:outline-none"
                  value={rule.ruleId}
                  onChange={(e) => {
                    setDisableSubmit(true);
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
                      {rule?.ruleName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
              </div>

              <div className="relative w-36 sm:w-1/4 lg:w-36">
                <select
                  className="w-full appearance-none bg-gray-50 border border-gray-300 rounded-md px-4 py-2 pr-8 text-gray-700 focus:outline-none"
                  value={rule.operator}
                  onChange={(e) => {
                    setDisableSubmit(true);
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
                className="text-[#8E77BB] hover:text-purple-800"
                title="Add new rule"
              >
                <PlusCircle className="w-6 h-6 " />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  removeSelectOperator(index);
                }}
                className="text-[#8E77BB] hover:text-purple-800"
                title="Remove"
              >
                <MinusCircle className="w-6 h-6" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-3 justify-end flex-wrap">
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md transition-colors duration-200"
          >
            Back
          </button>
          <button
            className={`px-4 py-2 font-medium rounded-md transition-colors duration-200
              ${
                !disableSubmit
                  ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  : "bg-[#8E77BB] hover:bg-[#7a63ac] text-white"
              }`}
            onClick={handleValidate}
          >
            Validate
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium text-white transition-colors duration-200
    ${
      disableSubmit
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-[#8E77BB] hover:bg-[#7a63ac]"
    }`}
            onClick={handleNext}
            disabled={disableSubmit}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
