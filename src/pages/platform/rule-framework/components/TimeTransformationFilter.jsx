import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";
import toast from "react-hot-toast";
import { useStateContext } from "../../Federation/context/contextViewProvider";

const TimeTransformationFilter = ({ setIsOpen, onApply }) => {
  const {finalPayload} = useStateContext();

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
    }
  ]);

  const { token, hostnameV1 } = useAuth();

  useEffect(() => {
    const timeDataCache = finalPayload?.timeTransformationFilters;

    if(timeDataCache)
      setTransformations(timeDataCache);
  }, [])
  // Fetch date columns on component mount
  useEffect(() => {
    setDateColumns(
      [
        {id: "1", name: "date1"},
        {id: "2", name: "date2"},
        {id: "3", name: "date3"},
        {id: "4", name: "date4"},
      ]
    );
    
    // Actual API call would go here (commented out for now)
  }, [token, hostnameV1]);

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
      }
    ]);
  };

  // Remove a transformation by index
  const removeTransformation = (index) => {
    if (transformations.length <= 1) return;
    setTransformations(transformations.filter((_, i) => i !== index));
  };

  // Update a specific transformation by index
  const updateTransformation = (index, field, value) => {
    const newTransformations = [...transformations];
    newTransformations[index] = {
      ...newTransformations[index],
      [field]: value
    };
    setTransformations(newTransformations);
  };

  const handleApply = () => {
    // Prepare all transformation data
    const transformationData = transformations.map(trans => {
      const config = {
        column: {
          id: trans.selectedColumn.id,
          name: trans.selectedColumn.name
        },
        transformationType: trans.dateType,
        parameters: {}
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

    console.log("Time Transformation Configurations:", transformationData);
    setIsOpen(false);
    onApply(transformationData);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Check if all transformations are complete
  const isFormComplete = transformations.every(trans => {
    if (!trans.selectedColumn.id || !trans.dateType) return false;
    
    if (trans.dateType === "asOnDate") return true;
    
    if (trans.dateType === "historicDate") 
      return trans.lowerOffset !== "" && trans.lowerUnit !== "";
    
    if (trans.dateType === "dateRange")
      return trans.lowerOffset !== "" && trans.lowerUnit !== "" && 
             trans.upperOffset !== "" && trans.upperUnit !== "";
    
    return false;
  });

  return (
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
            <div key={index} className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Transformation #{index + 1}</h3>
                {transformations.length > 1 && (
                  <button
                    onClick={() => removeTransformation(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>

              {/* Grid Layout for Better Space Utilization - Wider for React Flow */}
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Column Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date Column
                  </label>
                  <select
                    value={trans.selectedColumn.id}
                    onChange={(e) => {
                      const columnId = e.target.value;
                      const column = dateColumns.find(col => col.id === columnId) || { id: "", name: "" };
                      updateTransformation(index, "selectedColumn", column);
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
                          checked={trans.dateType === type}
                          onChange={() => updateTransformation(index, "dateType", type)}
                          disabled={!trans.selectedColumn.id}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label
                          htmlFor={`${index}-${type}`}
                          className="ml-3 block text-sm font-medium text-gray-700 capitalize"
                        >
                          {type.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Offset Configuration */}
                <div className="xl:col-span-2">
                  {(trans.dateType === "historicDate" || trans.dateType === "dateRange") && (
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {trans.dateType === "historicDate" ? "Offset" : "Lower Offset"}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            value={trans.lowerOffset}
                            onChange={(e) => updateTransformation(index, "lowerOffset", e.target.value)}
                            placeholder={trans.dateType === "historicDate" ? "Negative value" : "Value"}
                            className="px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <select
                            value={trans.lowerUnit}
                            onChange={(e) => updateTransformation(index, "lowerUnit", e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Unit</option>
                            <option value="days">Days</option>
                            <option value="months">Months</option>
                            <option value="years">Years</option>
                          </select>
                        </div>
                      </div>

                      {trans.dateType === "dateRange" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upper Offset
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="number"
                              value={trans.upperOffset}
                              onChange={(e) => updateTransformation(index, "upperOffset", e.target.value)}
                              placeholder="Value"
                              className="px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <select
                              value={trans.upperUnit}
                              onChange={(e) => updateTransformation(index, "upperUnit", e.target.value)}
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
        <div className="mb-8">
          <button
            onClick={addTransformation}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <Plus size={20} />
            <span>Add Transformation</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={handleClose}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!isFormComplete}
            className={`px-6 py-3 text-sm font-medium text-white rounded-md flex items-center gap-2 ${
              !isFormComplete
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            <CheckCircle className="w-4 h-4" /> Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeTransformationFilter;
