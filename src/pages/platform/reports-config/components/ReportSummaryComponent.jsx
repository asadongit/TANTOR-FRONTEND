import React from "react";
import { X } from "lucide-react";

const operatorStringToSymbol = (operatorValue) => {
  switch (operatorValue?.toLowerCase()) {
    case "add":
      return "+";
    default:
      return "+";
  }
};

const getRuleOperationString = (rules) => {
  const sortedRules = [...rules].sort((a, b) => a.sequence - b.sequence);
  return sortedRules
    .map((rule, index) => {
      const symbol =
        index < sortedRules.length - 1
          ? ` ${operatorStringToSymbol(rule.operator)} `
          : "";
      return rule.ruleName + symbol;
    })
    .join("");
};

const getTimeTransformText = (filters) => {
  if (!filters || filters.length === 0) return "";

  const getTextForFilter = (filter) => {
    switch (filter.type?.toLowerCase()) {
      case "asondate":
        return "As On Date";
      case "historicdate":
        return `${filter.lowerOffsetUnitValue} ${filter.lowerOffsetUnit}`;
      case "daterange":
        return `${filter.lowerOffsetUnitValue} ${filter.lowerOffsetUnit} to ${filter.upperOffsetUnitValue} ${filter.upperOffsetUnit}`;
      default:
        return "";
    }
  };

  const texts = filters.map(getTextForFilter).filter(Boolean);
  return texts.join(", ");
};

const ReportSummaryComponent = ({ isOpen, onClose, reportName, lineItemsData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
      <div className="absolute inset-0 bg-black bg-opacity-10 backdrop-blur-sm"></div>

      <div className="relative z-10 w-full max-w-5xl mx-4 bg-white rounded-2xl shadow-2xl p-8 border border-gray-200 max-h-[90vh] overflow-y-auto animate-fadeIn">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Report Summary: {reportName?.toUpperCase()}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Line Items Summary */}
        {lineItemsData.map((lineItem) => (
          <div key={lineItem.line_item} className="mb-10">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              Line Item: {lineItem.line_item.split("_").pop()}
            </h3>

            {lineItem.rules.map((rule) => (
              <div
                key={rule.ruleId}
                className="mb-6 p-5 bg-gray-50 border border-gray-200 rounded-xl shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between mb-4">
                  <div className="text-purple-700 font-semibold text-lg">
                    Rule &lt;{rule.sequence}&gt;: {rule.ruleName}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Metric:
                    </span>
                    <span className="ml-2 text-gray-800 text-sm">
                      {rule.metrics.join(", ")}
                    </span>
                  </div>
                </div>

                {rule.dimensions?.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      Dimensions
                    </div>
                    <div className="text-sm text-gray-800 space-y-1">
                      {rule.dimensions.map((dimension, dimIndex) =>
                        dimension.name ? (
                          <div key={`dim-${dimIndex}`}>
                            {dimension.name}{" "}
                            <span className="font-semibold">
                              {dimension.operator.toUpperCase()}
                            </span>{" "}
                            (
                            <span>
                              {dimension.value
                                .map((val) => val.name)
                                .join(", ")}
                            </span>
                            )
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-500">
                    Time Transform
                  </div>
                  <div className="text-sm text-gray-800">
                    {getTimeTransformText(rule.filters)}
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <span className="font-medium">Rule Operator:</span>{" "}
                  {rule.operator || "+"}
                </div>
              </div>
            ))}

            <div className="text-sm text-gray-700 mb-8">
              <span className="font-semibold">Combined Rule Operation:</span>{" "}
              {getRuleOperationString(lineItem.rules)}
            </div>
          </div>
        ))}

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportSummaryComponent;
