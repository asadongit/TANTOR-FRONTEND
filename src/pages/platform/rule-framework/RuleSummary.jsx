import React, { useEffect, useState } from "react";
import { X, ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { Modal } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getSegregatedColumns } from "../../../services/ruleJsonGeneratorService";
import { useAuth } from "../../../context/AuthContext";
import { generateSQLQuery } from "../../../services/sqlQueryService";
import toast from "react-hot-toast";

const RuleSummary = ({ 
  setIsOpen, 
  nodes,
  mode,
  nodeId,
  selectedFact, 
  filterConditions,
  ruleName,
  ruleDescription,
  ruleId,
  dimensionFilters,
  timeTransformationFilters
 }) => {
  const navigate = useNavigate();
  const [currentColumnIndex, setCurrentColumnIndex] = useState(0);
  
  const { hostnameV1, token } = useAuth();
  
  const columns = filterConditions?.columns || [];

   // Compute filterQuery
  const sourceNode = nodes.find(n => n.id === nodeId);
  
  let filterQuery = "";
  if (sourceNode?.data.dimensionQuery) {
    filterQuery += `(${sourceNode.data.dimensionQuery})`;
  }
  if (sourceNode?.data.timeTransformationQuery) {
    filterQuery += filterQuery.length > 0 ? " AND " : "";
    filterQuery += `(${sourceNode.data.timeTransformationQuery})`;
  }
  
  // Get current column or a default if no columns
  const currentColumn =
    columns.length > 0
      ? columns[currentColumnIndex]
      : {
          id: "",
          name: "",
          type: "",
          dimType: "",
          alias: "",
          output: true,
          order: "",
          sort: "",
          aggregate: "",
          groupBy: false,
          isVisible: true,
        };

  const handleNextColumn = () => {
    if (currentColumnIndex < columns.length - 1) {
      setCurrentColumnIndex(currentColumnIndex + 1);
    }
  };

  const handlePrevColumn = () => {
    if (currentColumnIndex > 0) {
      setCurrentColumnIndex(currentColumnIndex - 1);
    }
  };

  const handleRuleSubmit = async (ruleType) => {
    const { metricColumns, groupByColumns } = getSegregatedColumns(
      filterConditions.columns
    );

    if (metricColumns.length === 0) {
      toast.error("No Aggregates were selected.");
      return;
    }

    const payload = {
      ruleName,
      ruleDescription,
      fact_id: selectedFact.fact_id,
      dimensionFilters,
      timeTransformationFilters,
      metricColumns,
      groupByColumns,
      status: ruleType === "draft" ? "draft" : "active",
    };

    if (mode.toUpperCase() === "EDIT") {
      payload.ruleId = ruleId;
    }

    const url =
      mode.toUpperCase() === "EDIT"
        ? `${hostnameV1}/updateRule`
        : `${hostnameV1}/saveRule`;
    const method = mode.toUpperCase() === "EDIT" ? "PUT" : "POST";

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({ rule_data: payload, rule_json: nodes }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to save rule.");
      }

      const data = await response.json();
      toast.success(data?.message || "Rule saved successfully.");
      navigate("/config/rule");
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  return (
    <Modal
      open={true}
      onClose={() => setIsOpen(false)}
      aria-labelledby="rule-summary-modal"
      BackdropProps={{
        style: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
      }}
    >
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-[90%] max-w-6xl h-[90vh] overflow-hidden">
        <div className="flex h-full">
          {/* Left Section - Main Content */}
          <div className="flex-1 flex flex-col h-full border-r border-gray-200">
            <div className="flex-1 overflow-y-auto p-6">
              {/* Header with navigation path */}
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Platform</span>
                  <span>→</span>
                  <span>Rule</span>
                  <span>→</span>
                  {mode === "CREATE" && (<span>Create Rule</span>)}
                  {mode === "EDIT" && (<span>Edit Rule</span>)}
                  {mode === "DISPLAY" && (<span>Display Rule</span>)}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-xl font-semibold mb-6 text-gray-700">Summary</h2>

              {/* Main Content Grid */}
              <div className="space-y-6">
                {/* Name and Description */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#8e78b7] mb-2">
                      Name
                    </label>
                    <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                      <span className="text-gray-800">
                        {ruleName || "Not defined"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8e78b7] mb-2">
                      Description
                    </label>
                    <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                      <span className="text-gray-800">
                        {ruleDescription || "No description"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Table and Column */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#8e78b7] mb-2">
                      Table
                    </label>
                    <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                      <span className="text-gray-800">
                        {selectedFact?.fct_name || "fct_loans"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8e78b7] mb-2">
                      Column
                    </label>
                    <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                      <span className="text-gray-800">
                        {columns.map((t) => t.name).join(", ") ||
                          currentColumn.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Query Preview */}
                <div>
                  <label className="block text-sm font-medium text-[#8e78b7] mb-2">
                    Query Preview
                  </label>
                  <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
                      {generateSQLQuery({
                            tableName:selectedFact.fct_name, 
                            selectedColumns: filterConditions.columns, 
                            complexQuery: filterQuery
                          }) || "No Query generated"}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Fixed at bottom */}
            { mode !== "DISPLAY" && (<div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  {mode !== "EDIT" && (<button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    onClick={() => {handleRuleSubmit("draft")}}
                  >
                    Save Draft
                  </button>)}
                  <button
                    onClick={() => {handleRuleSubmit("active")}}
                    className="px-4 py-2 bg-[#8e78b7] text-white rounded-md hover:bg-[#7b65a3] transition-colors"
                  >
                    {mode.toUpperCase() === "EDIT" ? "Edit Rule" : "Create Rule"}
                  </button>
                </div>
              </div>)
            }
          </div>

          {/* Right Section - Column Settings (Compact Layout) */}
          <div className="w-[400px] overflow-y-auto p-6 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Column Settings</h3>
            </div>

            <div className="space-y-6">
              {/* Navigation Arrows - Improved */}
              <div className="flex justify-between items-center bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                <button
                  onClick={handlePrevColumn}
                  disabled={currentColumnIndex === 0}
                  className={`p-1 rounded-full ${
                    currentColumnIndex === 0
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-[#6d5993] hover:bg-[#f0edf5]"
                  }`}
                >
                  <ArrowBigLeft size={20} />
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500 font-medium">
                    Column {currentColumnIndex + 1} of {columns.length}
                  </span>
                  <span className="text-sm font-medium text-[#6d5993] truncate max-w-[200px]">
                    {currentColumn.name}
                  </span>
                </div>
                <button
                  onClick={handleNextColumn}
                  disabled={currentColumnIndex === columns.length - 1}
                  className={`p-1 rounded-full ${
                    currentColumnIndex === columns.length - 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-[#6d5993] hover:bg-[#f0edf5]"
                  }`}
                >
                  <ArrowBigRight size={20} />
                </button>
              </div>

              {/* Column Properties */}
              <div className="space-y-4">
                {/* Name - Full Width */}
                <div>
                  <label className="block text-sm font-medium text-[#8e78b7] mb-1">
                    Name
                  </label>
                  <div className="border border-gray-200 rounded-md p-2.5 bg-white text-base h-10 flex items-center w-full">
                    {currentColumn.name}
                  </div>
                </div>
                
                {/* Other Properties in Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-[#8e78b7] mb-1">
                      Type
                    </label>
                    <div className="border border-gray-200 rounded-md p-2.5 bg-white text-base h-10 flex items-center">
                      {currentColumn.type}
                    </div>
                  </div>
                  
                  {/* Dimension Type */}
                  <div>
                    <label className="block text-sm font-medium text-[#8e78b7] mb-1">
                      Dim Type
                    </label>
                    <div className="border border-gray-200 rounded-md p-2.5 bg-white text-base h-10 flex items-center">
                      {currentColumn.dimType}
                    </div>
                  </div>
                  
                  {/* Alias */}
                  <div>
                    <label className="block text-sm font-medium text-[#8e78b7] mb-1">
                      Alias
                    </label>
                    <div className="border border-gray-200 rounded-md p-2.5 bg-white text-base h-10 flex items-center">
                      {currentColumn.alias || "-"}
                    </div>
                  </div>
                  
                  {/* Output */}
                  <div>
                    <label className="block text-sm font-medium text-[#8e78b7] mb-1">
                      Output
                    </label>
                    <div className="border border-gray-200 rounded-md p-2.5 bg-white text-base h-10 flex items-center">
                      {currentColumn.output ? "Yes" : "No"}
                    </div>
                  </div>
                  
                  {/* Order */}
                  <div>
                    <label className="block text-sm font-medium text-[#8e78b7] mb-1">
                      Order
                    </label>
                    <div className="border border-gray-200 rounded-md p-2.5 bg-white text-base h-10 flex items-center">
                      {currentColumn.order || "-"}
                    </div>
                  </div>
                  
                  {/* Sort */}
                  <div>
                    <label className="block text-sm font-medium text-[#8e78b7] mb-1">
                      Sort
                    </label>
                    <div className="border border-gray-200 rounded-md p-2.5 bg-white text-base h-10 flex items-center">
                      {currentColumn.sort || "-"}
                    </div>
                  </div>
                  
                  {/* Aggregate */}
                  <div>
                    <label className="block text-sm font-medium text-[#8e78b7] mb-1">
                      Aggregate
                    </label>
                    <div className="border border-gray-200 rounded-md p-2.5 bg-white text-base  h-10 flex items-center">
                      {Array.isArray(currentColumn.aggregate) && currentColumn.aggregate.length > 0 
                        ? currentColumn.aggregate.join(", ") 
                        : "-"}
                    </div>
                  </div>
                  
                  {/* Group By */}
                  <div>
                    <label className="block text-sm font-medium text-[#8e78b7] mb-1">
                      Group By
                    </label>
                    <div className="border border-gray-200 rounded-md p-2.5 bg-white text-base h-10 flex items-center">
                      {currentColumn.groupBy ? "Yes" : "No"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RuleSummary;