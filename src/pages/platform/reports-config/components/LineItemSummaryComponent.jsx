import { Download } from "lucide-react";
import React from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";
import { useLineItems } from "../context/LineItemsContext";
import { X } from "lucide-react";

const LineItemSummary = () => {
  const { token, hostnameV1 } = useAuth();
  const {
    currentLineItemId,
    getRulesForCurrentLineItem,
    setShowSummaryModal,
    closeAllModals,
    reportId,
    reportName,
    lineItemConfig,
    getMode,
    setCurrentLineItemId,
    setExistingLineItems,
  } = useLineItems();

  const rules = getRulesForCurrentLineItem();

  const mode = getMode();

  const operatorStringToSymbol = (operatorValue) => {
    switch (operatorValue.toLowerCase()) {
      case "add":
        return "+";
      default:
        return "+";
    }
  };

  const getRuleOperationString = (rules) => {
    const sortedRules = [...rules].sort((a, b) => a.sequence - b.sequence);
    if(sortedRules.length < 2 ) return null;
    
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
      switch (filter.type.toLowerCase()) {
        case "asondate":
          return `AsOnDate (${filter.name})`;
        case "historicdate":
          return `${filter.lowerOffsetUnitValue} ${filter.lowerOffsetUnit} (${filter.name})`;
        case "daterange":
          return `${filter.lowerOffsetUnitValue} ${filter.lowerOffsetUnit} to ${filter.upperOffsetUnitValue} ${filter.upperOffsetUnit} (${filter.name})`;
        default:
          return "";
      }
    };

    const texts = filters.map(getTextForFilter).filter((text) => text !== "");
    return texts.join(", ");
  };

 const handleLineItemLink = async () => {
  if (!currentLineItemId) {
    toast.error("Line Item ID is missing");
    return;
  }

  const lineItemUiJson = lineItemConfig.find(
    (item) => item.line_item === currentLineItemId
  );

  const payload = {
    report_config: {
      regReportId: reportId,
      line_item: parseInt(currentLineItemId.split("_").pop(), 10),
      rules: rules,
      uiJson: lineItemUiJson,
    },
  };

  const method = mode === "EDIT" ? "PUT" : "POST";

  const headers = {
    "Content-Type": "application/json",
    authorization: `Bearer ${token}`,
  };

  try {
    const response = await fetch(`${window._env_?.VITE_REPORTING_BACKEND_API}/lineItems`, {
      method,
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || "Failed to save line item");
    }

    const data = await response.json();
    toast.success(data?.message || "Line item saved successfully");

    setExistingLineItems((prev) => {
      const newExistingLineItems = [...prev];
      if(newExistingLineItems.includes(currentLineItemId)) return newExistingLineItems;
      newExistingLineItems.push(currentLineItemId);
      return newExistingLineItems;
    });

    closeAllModals();
  } catch (error) {
    console.error("Error Saving Line Item:", error);
    toast.error(error.message);
  }
};


   return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
      <div className="absolute inset-0 bg-gray-900 bg-opacity-5 backdrop-blur-sm transition-opacity duration-300"></div>

      <div className="relative z-10 w-full max-w-4xl mx-4 bg-white rounded-xl shadow-xl p-6 animate-fadeIn border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Line Item Configuration Summary
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Review your configuration before saving
            </p>
          </div>
          <button
            onClick={() => setShowSummaryModal(false)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">
              Report
            </div>
            <div className="text-base font-medium text-gray-900 truncate">
              {reportName?.toUpperCase() || "N/A"}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">
              Line Item ID
            </div>
            <div className="text-base font-medium text-gray-900">
              {currentLineItemId ? currentLineItemId.split("_").pop() : "N/A"}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
            Rules Configuration
          </h3>
          
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.ruleId}
                className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap items-center justify-between mb-4">
                  <div>
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mb-1">
                      Rule {rule.sequence}
                    </div>
                    <div className="font-semibold text-gray-800 text-lg">
                      {rule.ruleName}
                    </div>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <span className="text-xs font-medium text-gray-500">
                      Operator:
                    </span>
                    <span className="ml-1 px-2 py-1 bg-gray-100 rounded text-gray-800 font-medium text-sm">
                      {operatorStringToSymbol(rule.operator)}
                    </span>
                  </div>
                </div>

                {rule.dimensions?.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Dimensions
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {rule.dimensions.map((dimension, dimIndex) =>
                        dimension.name ? (
                          <div 
                            key={`dim-${dimIndex}`}
                            className="bg-gray-50 px-3 py-1.5 rounded border border-gray-200 text-sm"
                          >
                            <span className="font-medium text-gray-700">{dimension.name}</span>
                            <span className="mx-1 text-purple-600 font-bold">{dimension.operator.toUpperCase()}</span>
                            <span className="text-gray-600">
                              ({dimension.value.map((val) => val.name).join(", ")})
                            </span>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Time Transform
                  </div>
                  <div className="text-sm text-gray-800 font-medium bg-blue-50 px-3 py-1.5 rounded inline-block">
                    {getTimeTransformText(rule.filters) || "None"}
                  </div>
                </div>

                {rule.metrics?.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Metrics
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {rule.metrics.map((metric, idx) => (
                        <span 
                          key={idx} 
                          className="bg-green-50 text-green-800 px-2 py-1 rounded text-xs font-medium"
                        >
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {
          getRuleOperationString(rules) && (<div className="mb-8 p-4 bg-purple-50 rounded-lg border border-purple-100">
            <div className="text-sm font-medium text-purple-800 mb-2">
              Combined Rule Operation
            </div>
            <div className="text-lg font-semibold text-gray-800 bg-white p-3 rounded border border-gray-200">
              {getRuleOperationString(rules)}
            </div>
          </div>)
        }

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-all duration-200"
            onClick={() => setShowSummaryModal(false)}
          >
            Back to Configuration
          </button>
          <button
            className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            onClick={handleLineItemLink}
          >
            {mode === "EDIT" ? "Update Line Item" : "Save Line Item"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LineItemSummary;
