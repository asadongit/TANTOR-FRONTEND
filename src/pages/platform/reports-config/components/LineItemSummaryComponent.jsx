import { Download } from "lucide-react";
import React from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";

const LineItemSummary = ({
  lineItemId,
  rules,
  setShowSummaryModal,
  closeAllModals,
  reportName,
  reportId,
  reportType,
  reportDesc,
}) => {
  const { token, hostnameV1 } = useAuth();

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

    const periodFilter = filters.find((f) => f.name === "period_id");
    if (!periodFilter) return "";

    switch (periodFilter.type.toLowerCase()) {
      case "asondate":
        return "As On Date";
      case "historicdate":
        return `${periodFilter.lowerOffsetUnitValue} ${periodFilter.lowerOffsetUnit}`;
      case "daterange":
        return `${periodFilter.lowerOffsetUnitValue} ${periodFilter.lowerOffsetUnit} to ${periodFilter.upperOffsetUnitValue} ${periodFilter.upperOffsetUnit}`;
      default:
        return "";
    }
  };

  const handleCreateLink = () => {
    const payload = {
      regReportId: reportId,
      lineItemConfig: [
        {
          line_item: lineItemId,
          rules: rules,
        },
      ],
    };

    const uploadData = async () => {
      const headers = {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      };

      try {
        const response = await fetch(`${hostnameV1}/lineItems`, {
          headers: headers,
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          toast.error("Error Saving Line Item.");
          return;
        }

        const data = await response.json();
        toast.success(data.message);

        await addReportToDatabase();
        
        closeAllModals();
      } catch (error) {
        console.error("Error Saving Line Item:", error);
        toast.error("Error Saving Line Item");
      }
    };
    uploadData();
    console.log(payload);
  };

  const addReportToDatabase = async () => {
    let payload = {
      report: {
        report_id: reportId,
        report_name: reportName,
        report_desc: reportDesc,
        report_type: reportType,
        report_status: "DRAFT",
      },
    };
    const headers = {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    };

    try {
      const response = await fetch(`${hostnameV1}/lineItems/reports`, {
        headers: headers,
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        toast.error("Error Saving Report Data.");
        return;
      }

      const data = await response.json();
      toast.success(data.message);
    } catch (error) {
      console.error("Error Saving Report Data:", error);
      toast.error("Error Saving Report Data");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
      <div className="absolute inset-0 bg-black bg-opacity-5 backdrop-blur-sm"></div>

      <div
        className="relative z-10 w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-2xl p-8 animate-fadeIn border border-gray-200 
                  max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Line Item - {lineItemId.split("_").pop()}
          </h2>
          {/* <button
            onClick={() => console.log("DOWNLOAD CLICKED.")}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="Download"
          >
            <Download className="w-6 h-6" />
          </button> */}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-6 mb-6">
          <div>
            <div className="text-sm text-gray-500 font-medium">Report</div>
            <div className="text-base text-gray-900">
              {reportName.toUpperCase()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 font-medium">
              Line Item ID
            </div>
            <div className="text-base text-gray-900">
              {lineItemId.split("_").pop()}
            </div>
          </div>
        </div>

        {/* Rules */}
        {rules.map((rule) => (
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

            {/* Dimensions */}
            {rule.dimensions?.length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-500 mb-1">
                  Dimensions
                </div>
                <div className="text-sm text-gray-800 space-y-1">
                  {rule.dimensions.map(
                    (dimension, dimIndex) =>
                      dimension.name && (
                        <div key={`dim-${dimIndex}`}>
                          {dimension.name}{" "}
                          <span className="font-semibold">
                            {dimension.operator.toUpperCase()}
                          </span>{" "}
                          (
                          <span>
                            {dimension.value.map((val) => val.name).join(", ")}
                          </span>
                          )
                        </div>
                      )
                  )}
                </div>
              </div>
            )}

            {/* Time Transform */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-500">
                Time Transform
              </div>
              <div className="text-sm text-gray-800">
                {getTimeTransformText(rule.filters)}
              </div>
            </div>

            {/* Rule Operator */}
            <div className="text-sm text-gray-600">
              <span className="font-medium">Rule Operator:</span>{" "}
              {rule.operator || "+"}
            </div>
          </div>
        ))}

        {/* Combined Rule Operation */}
        <div className="text-sm text-gray-700 mb-8">
          <span className="font-semibold">Combined Rule Operation:</span>{" "}
          {getRuleOperationString(rules)}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-medium transition"
            onClick={() => setShowSummaryModal(false)}
          >
            Back
          </button>
          <button
            className="px-4 py-2 rounded-md bg-[#8E77BB] hover:bg-[#7a63ac] text-white font-medium transition"
            onClick={handleCreateLink}
          >
            Create Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default LineItemSummary;
