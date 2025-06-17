import React, { useEffect, useState } from "react";
import { X, ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { useStateContext } from "../Federation/context/contextViewProvider";
import { Modal } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getSegregatedColumns } from "../../../services/ruleJsonGeneratorService";
import { useAuth } from "../../../context/AuthContext";

import toast from "react-hot-toast";
const RuleSummary = ({ setIsOpen, selectedFact, filterData, previewData }) => {
  const { finalPayload } = useStateContext();
  const navigate = useNavigate();
  const [currentColumnIndex, setCurrentColumnIndex] = useState(0);

  const { hostnameV1, token } = useAuth();
  // Get columns from filterData
  const columns = filterData?.columns || [];

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

  const handleCreateRule = () => {

    const { metricColumns, groupByColumns } = getSegregatedColumns(
      filterData.columns
    );

    console.log("filterData.columns ==> ", filterData.columns);
    console.log("METRIC COLUMNS ==> ", metricColumns)

    if(metricColumns.length === 0){
      toast.error("No Aggregates were selected.");
      return;
    }

    const payload = {
      ruleName: finalPayload.name,
      fact_id: selectedFact.fact_id,
      dimensionFilters: finalPayload.dimensionFilters,
      timeTransformationFilters: finalPayload.timeTransformationFilters,
      metricColumns,
      groupByColumns,
    };
    console.log("FINAL PAYLOAD ==> ", payload);

    (async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const response = await fetch(`${hostnameV1}/saveRule`,{
          method: 'POST',
          headers: headers,
          body: JSON.stringify({rule_data: payload}),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || "Failed to save rule.");
        }

        const data = await response.json();
        toast.success(data?.message || "Rule saved successfully.");
        navigate("/config/rule");
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
    })();
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
                  <span>Create Rule</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-xl font-semibold mb-6">Summary</h2>

              {/* Main Content Grid */}
              <div className="space-y-6">
                {/* Name and Description */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                      <span className="text-blue-600">
                        {finalPayload?.name || "Not defined"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                      <span className="text-gray-600">
                        {finalPayload?.description || "No description"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Table and Column */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Table
                    </label>
                    <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                      <span className="text-blue-600">
                        {selectedFact?.fct_name || "fct_loans"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Column
                    </label>
                    <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                      <span className="text-blue-600">
                        {columns.map((t) => t.name).join(", ") ||
                          currentColumn.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Filter */}
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter</label>
                  <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                    <span className="text-gray-600">
                      {filterData?.sqlPreview || "No Filter Query"}
                    </span>
                  </div>
                </div> */}

                {/* Query Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Query Preview
                  </label>
                  <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <pre className="text-sm font-mono text-blue-600 whitespace-pre-wrap">
                      {previewData || "No query generated"}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                  Save Draft
                </button>
                <button
                  onClick={handleCreateRule}
                  className="px-4 py-2 bg-[#8e78b7] text-white rounded-md hover:bg-[#7b65a3] transition-colors"
                >
                  Create Rule
                </button>
              </div>
            </div>
          </div>

          {/* Right Section - Column Settings (Read-only) */}
          <div className="w-[400px] overflow-y-auto p-6 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Column Settings</h3>
            </div>

            <div className="space-y-6">
              {/* Navigation Arrows */}
              <div className="flex justify-between items-center bg-white p-3 rounded-md border border-gray-200">
                <button
                  onClick={handlePrevColumn}
                  disabled={currentColumnIndex === 0}
                  className={`text-lg ${
                    currentColumnIndex === 0
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <ArrowBigLeft />
                </button>
                <span className="text-sm font-medium">
                  Column {currentColumnIndex + 1} of {columns.length}:{" "}
                  {currentColumn.name}
                </span>
                <button
                  onClick={handleNextColumn}
                  disabled={currentColumnIndex === columns.length - 1}
                  className={`text-lg ${
                    currentColumnIndex === columns.length - 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <ArrowBigRight />
                </button>
              </div>

              {/* Column Properties (Read-only) */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <div className="border border-gray-200 rounded-md p-3 bg-white">
                    <span className="text-gray-900">{currentColumn.name}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <div className="border border-gray-200 rounded-md p-3 bg-white">
                    <span className="text-gray-900">{currentColumn.type}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dimension Type
                  </label>
                  <div className="border border-gray-200 rounded-md p-3 bg-white">
                    <span className="text-gray-900">{currentColumn.dimType}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alias
                  </label>
                  <div className="border border-gray-200 rounded-md p-3 bg-white">
                    <span className="text-gray-900">
                      {currentColumn.alias || "-"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Output
                  </label>
                  <div className="border border-gray-200 rounded-md p-3 bg-white">
                    <span className="text-gray-900">
                      {currentColumn.output ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order
                  </label>
                  <div className="border border-gray-200 rounded-md p-3 bg-white">
                    <span className="text-gray-900">
                      {currentColumn.order || "-"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort
                  </label>
                  <div className="border border-gray-200 rounded-md p-3 bg-white">
                    <span className="text-gray-900">
                      {currentColumn.sort || "-"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aggregate
                  </label>
                  <div className="border border-gray-200 rounded-md p-3 bg-white">
                    <span className="text-gray-900">
                      {Array.isArray(currentColumn.aggregate) && currentColumn.aggregate.length > 0 
                        ? currentColumn.aggregate.join(", ") 
                        : "-"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group By
                  </label>
                  <div className="border border-gray-200 rounded-md p-3 bg-white">
                    <span className="text-gray-900">
                      {currentColumn.groupBy ? "Yes" : "No"}
                    </span>
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
