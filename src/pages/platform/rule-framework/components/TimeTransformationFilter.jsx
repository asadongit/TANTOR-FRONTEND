import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Plus, Trash2, Calendar } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";
import toast from "react-hot-toast";
// import { useStateContext } from "../../Federation/context/contextViewProvider";
import DateExpressionCalculator from "../../reports-config/components/TimeTransformationValidate"; // Adjust import path as needed

const TimeTransformationFilter = ({ setIsOpen, onApply, factId, updateNodeData, nodeData }) => {

  // State for API data and transformations
  const [dateColumns, setDateColumns] = useState([]);
  const [transformations, setTransformations] = useState([
    {
      selectedColumn: { id: "", name: "" },
      dateType: "",
      lowerOffset: "",
      upperOffset: "",
      lowerUnit: "",
      upperUnit: "",
    },
  ]);

  // State for validation modal
  const [validationModal, setValidationModal] = useState({
    isOpen: false,
    transformationIndex: null,
    dateType: "",
    lowerOffset: "",
    upperOffset: "",
    lowerUnit: "",
    upperUnit: "",
  });

  const { token, hostnameV1 } = useAuth();

  // Load cached data when component mounts
  useEffect(() => {
    const timeDataCache = nodeData?.timeTransformationFilters;

    if (
      timeDataCache &&
      Array.isArray(timeDataCache) &&
      timeDataCache.length > 0
    ) {
      // Transform cached data to match component structure
      const transformedCache = timeDataCache.map((item) => ({
        selectedColumn: {
          id: item.selectedColumn?.id
            ? String(item.selectedColumn.id)
            : item.column?.id
            ? String(item.column.id)
            : "",
          name: item.selectedColumn?.name || item.column?.name || "",
        },
        dateType: item.dateType || item.transformationType || "",
        lowerOffset: item.lowerOffset || item.parameters?.lowerOffset || "",
        upperOffset: item.upperOffset || item.parameters?.upperOffset || "",
        lowerUnit: item.lowerUnit || item.parameters?.lowerUnit || "",
        upperUnit: item.upperUnit || item.parameters?.upperUnit || "",
      }));

      setTransformations(transformedCache);
    }
  }, []);

  // Fetch date columns on component mount
  // useEffect(() => {
  //   console.log("nodeData.timeTransformationFilters ==> ", nodeData.timeTransformationFilters);
  //   if(nodeData?.timeTransformationFilters && nodeData.timeTransformationFilters.length > 0)
  //     setTransformations(nodeData.timeTransformationFilters);
  // }, []);

  useEffect(() => {
    if (!factId) return;

    (async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };
        const response = await fetch(
          `${hostnameV1}/selectTransformationColumn?fact_id=${factId}`,
          { headers }
        );

        if (!response.ok)
          throw new Error("Error occurred fetching Date Columns!");

        const data = await response.json();

        // Convert integer ID to string to match HTML form behavior
        const formattedData = data.map((item) => ({
          id: String(item.fact_dimension_link_id),
          name: item.fct_column_name,
        }));

        setDateColumns(formattedData);
      } catch (error) {
        setDateColumns([]);
        console.log(error);
        toast.error(error.message);
      }
    })();
  }, [factId, token, hostnameV1]);

  // Add a new transformation
  const addTransformation = () => {
    setTransformations([
      ...transformations,
      {
        selectedColumn: { id: "", name: "" },
        dateType: "",
        lowerOffset: "",
        upperOffset: "",
        lowerUnit: "",
        upperUnit: "",
      },
    ]);
  };

  const removeTransformation = (index) => {
    if (transformations.length <= 1) return;
    setTransformations(transformations.filter((_, i) => i !== index));
  };

  // Modified to accept multiple updates
  const updateTransformation = (index, updates) => {
    setTransformations((prev) => {
      const newTransformations = [...prev];
      newTransformations[index] = {
        ...newTransformations[index],
        ...updates,
      };
      return newTransformations;
    });
  };

  // Handle validation modal
  const handleValidate = (index) => {
    const trans = transformations[index];
    setValidationModal({
      isOpen: true,
      transformationIndex: index,
      dateType: trans.dateType,
      lowerOffset: trans.lowerOffset,
      upperOffset: trans.upperOffset,
      lowerUnit: trans.lowerUnit,
      upperUnit: trans.upperUnit,
    });
  };

  const closeValidationModal = () => {
    setValidationModal({
      isOpen: false,
      transformationIndex: null,
      dateType: "",
      lowerOffset: "",
      upperOffset: "",
      lowerUnit: "",
      upperUnit: "",
    });
  };

  const getFilterQuery = (transformationData) => {
    if (!transformationData || transformationData.length === 0) return "";

    return transformationData
      .map((t) => {
        const columnName = t.column.name;

        switch (t.transformationType.toLowerCase()) {
          case "asondate":
            return `${columnName} = AsOnDate`;

          case "historicdate":
            return `${columnName} = ${t.parameters.lowerOffset} ${t.parameters.lowerUnit}`;

          case "daterange":
            return `${columnName} BETWEEN ${t.parameters.lowerOffset} ${
              t.parameters.lowerUnit
            } AND ${t.parameters.upperOffset > 0 ? "+" : ""}${
              t.parameters.upperOffset
            } ${t.parameters.upperUnit}`;

          default:
            return "";
        }
      })
      .filter(Boolean)
      .join(" AND ");
  };

  const handleApply = () => {
    const transformationData = transformations.map((trans) => {
      const config = {
        column: {
          id: trans.selectedColumn?.id || "",
          name: trans.selectedColumn?.name || "",
        },
        transformationType: trans.dateType,
        parameters: {},
      };

      // Add relevant parameters based on transformation type
      if (trans.dateType === "historicDate" || trans.dateType === "dateRange") {
        config.parameters.lowerOffset = trans.lowerOffset;
        config.parameters.lowerUnit = trans.lowerUnit;
      }

      if (trans.dateType === "dateRange") {
        config.parameters.upperOffset = trans.upperOffset;
        config.parameters.upperUnit = trans.upperUnit;
      }

      return config;
    });

    updateNodeData({
      timeTransformationQuery: getFilterQuery(transformationData),
      timeTransformationFilters: transformationData,
      showRuleSummary: true
    });
    
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleClearAll = () => {
    const updatedTransformations = [
      {
        selectedColumn: { id: "", name: "" },
        dateType: "",
        lowerOffset: "",
        upperOffset: "",
        lowerUnit: "",
        upperUnit: "",
      }
    ];
    setTransformations(updatedTransformations);
    updateNodeData({ timeTransformationQuery: "" , timeTransformationFilters: updatedTransformations});
  };

  const handleSkip = () => {
    handleClearAll();
    
    setIsOpen(false);
    
    updateNodeData({
      timeTransformationQuery: "",
      timeTransformationFilters: [],
      showRuleSummary: true,
      mode: "FALSE"
    });
  };

  // Check if all transformations are complete
  const isFormComplete = transformations.every((trans) => {
    const columnId = trans?.selectedColumn?.id || "";
    const dateType = trans?.dateType || "";

    if (!columnId || !dateType) return false;

    if (dateType === "asOnDate") return true;

    if (dateType === "historicDate") {
      const lowerOffset = trans?.lowerOffset;
      const lowerUnit = trans?.lowerUnit;
      return (
        lowerOffset !== "" &&
        lowerOffset !== undefined &&
        lowerUnit !== "" &&
        lowerUnit !== undefined
      );
    }

    if (dateType === "dateRange") {
      const lowerOffset = trans?.lowerOffset;
      const lowerUnit = trans?.lowerUnit;
      const upperOffset = trans?.upperOffset;
      const upperUnit = trans?.upperUnit;
      return (
        lowerOffset !== "" &&
        lowerOffset !== undefined &&
        lowerUnit !== "" &&
        lowerUnit !== undefined &&
        upperOffset !== "" &&
        upperOffset !== undefined &&
        upperUnit !== "" &&
        upperUnit !== undefined
      );
    }

    return false;
  });

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm text-black p-4">
        <div className="bg-white p-8 rounded-xl shadow-2xl border border-gray-200 w-full max-w-[95vw] min-w-[1000px]">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Time Transformation
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Transformations List */}
          <div className="max-h-[65vh] overflow-y-auto pr-2 mb-6">
            {transformations.map((trans, index) => (
              <div
                key={index}
                className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    {/* Transformation #{index + 1} */}
                  </h3>
                  <div className="flex items-center gap-2">
                    {/* Validate Button - only show for historicDate and dateRange */}
                    {(trans.dateType === "historicDate" || trans.dateType === "dateRange") && (
                      <button
                        onClick={() => handleValidate(index)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md border border-blue-300 hover:border-blue-400 transition-colors"
                        disabled={
                          !trans.selectedColumn?.id ||
                          !trans.dateType ||
                          (trans.dateType === "historicDate" && (!trans.lowerOffset || !trans.lowerUnit)) ||
                          (trans.dateType === "dateRange" && (!trans.lowerOffset || !trans.lowerUnit || !trans.upperOffset || !trans.upperUnit))
                        }
                      >
                        <Calendar size={14} />
                        Validate
                      </button>
                    )}

                    {transformations.length > 1 && (
                      <button
                        onClick={() => removeTransformation(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                  {/* Column Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Date Column
                    </label>
                    <select
                      value={trans?.selectedColumn?.id || ""}
                      onChange={(e) => {
                        const columnId = e.target.value;
                        const column = dateColumns.find(
                          (col) => col.id === columnId
                        ) || { id: "", name: "" };

                        // Reset transformation settings when column changes
                        updateTransformation(index, {
                          selectedColumn: column,
                          dateType: "",
                          lowerOffset: "",
                          upperOffset: "",
                          lowerUnit: "",
                          upperUnit: "",
                        });
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select a column</option>
                      {dateColumns.map((column) => (
                        <option key={column.id} value={column.id}>
                          {column.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Transformation Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transformation Type
                    </label>
                    <div className="space-y-3">
                      {["asOnDate", "historicDate", "dateRange"].map((type) => (
                        <div key={type} className="flex items-center">
                          <input
                            type="radio"
                            id={`${index}-${type}`}
                            name={`dateType-${index}`}
                            value={type}
                            checked={trans?.dateType === type}
                            onChange={() =>
                              updateTransformation(index, { dateType: type })
                            }
                            disabled={!trans?.selectedColumn?.id}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label
                            htmlFor={`${index}-${type}`}
                            className="ml-3 block text-sm font-medium text-gray-700 capitalize"
                          >
                            {type.replace(/([A-Z])/g, " $1").trim()}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Offset Configuration */}
                  <div className="xl:col-span-2">
                    {(trans?.dateType === "historicDate" ||
                      trans?.dateType === "dateRange") && (
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {trans?.dateType === "historicDate"
                              ? "Offset"
                              : "Lower Offset"}
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="number"
                              value={trans?.lowerOffset || ""}
                              onChange={(e) =>
                                updateTransformation(index, {
                                  lowerOffset: e.target.value,
                                })
                              }
                              placeholder={
                                trans?.dateType === "historicDate"
                                  ? "Negative value"
                                  : "Value"
                              }
                              className="px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 
                              [-moz-appearance:textfield] 
                               [&::-webkit-outer-spin-button]:m-0 
                               [&::-webkit-inner-spin-button]:m-0 
                               [&::-webkit-outer-spin-button]:appearance-none 
                               [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <select
                              value={trans?.lowerUnit || ""}
                              onChange={(e) =>
                                updateTransformation(index, {
                                  lowerUnit: e.target.value,
                                })
                              }
                              className="px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="">Unit</option>
                              <option value="days">Days</option>
                              <option value="months">Months</option>
                              <option value="years">Years</option>
                              {trans?.dateType === "historicDate" && (<option value = "pfy">Previous Financial Year</option>) }
                            </select>
                          </div>
                        </div>

                        {trans?.dateType === "dateRange" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Upper Offset
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="number"
                                value={trans?.upperOffset || ""}
                                onChange={(e) =>
                                  updateTransformation(index, {
                                    upperOffset: e.target.value,
                                  })
                                }
                                placeholder="Value"
                                className="px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
                                [-moz-appearance:textfield] 
                               [&::-webkit-outer-spin-button]:m-0 
                               [&::-webkit-inner-spin-button]:m-0 
                               [&::-webkit-outer-spin-button]:appearance-none 
                               [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <select
                                value={trans?.upperUnit || ""}
                                onChange={(e) =>
                                  updateTransformation(index, {
                                    upperUnit: e.target.value,
                                  })
                                }
                                className="px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                <option value="">Unit</option>
                                <option value="days">Days</option>
                                <option value="months">Months</option>
                                <option value="years">Years</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Transformation Button */}
          {/* <div className="mb-8">
            <button
              onClick={addTransformation}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium"
            >
              <Plus size={20} />
              <span>Add Transformation</span>
            </button>
          </div> */}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            {/* <button
              onClick={handleSkip}
              className="px-6 py-3 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md"
            >
              Skip
            </button> */}
            <button
              onClick={handleClearAll}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Clear All
            </button>
            <button
              onClick={handleApply}
              disabled={!isFormComplete}
              className={`px-6 py-3 text-sm font-medium text-white rounded-md flex items-center gap-2 ${
                !isFormComplete
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#8e78b7] hover:bg-[#766497]"
              }`}
            >
              <CheckCircle className="w-4 h-4" /> Apply
            </button>
          </div>
        </div>
      </div>

      {/* Validation Modal */}
      {validationModal.isOpen && (
        <DateExpressionCalculator
          onClose={closeValidationModal}
          dateType={validationModal.dateType}
          lowerOffset={validationModal.lowerOffset}
          upperOffset={validationModal.upperOffset}
          lowerUnit={validationModal.lowerUnit}
          upperUnit={validationModal.upperUnit}
        />
      )}
    </>
  );
};

export default TimeTransformationFilter;