import React, { useState, useEffect } from "react";
import { ChevronLeft, XCircle, CheckCircle, SaveIcon } from "lucide-react";
import DateExpressionCalculator from "./TimeTransformationValidate";
import { useAuth } from "../../../../context/AuthContext";
import toast from "react-hot-toast";

const TimeTransformationComponent = ({
  isOpen,
  setIsOpen,
  ruleId,
  updateRule,
  ruleIndex,
  rule,
}) => {
  const [filterColId, setFilterColId] = useState("");
  const [filterColName, setFilterColName] = useState("");
  const [dateType, setDateType] = useState("");
  const [lowerOffset, setLowerOffset] = useState("");
  const [upperOffset, setUpperOffset] = useState("");
  const [lowerUnit, setLowerUnit] = useState("");
  const [upperUnit, setUpperUnit] = useState("");

  const [showValidationModal, setShowValidationModal] = useState(false);

  // API data.
  const [dateColumnsData, setDateColumnsData] = useState([]);
  const { token, hostnameV1 } = useAuth();

  useEffect(() => {
    if (!ruleId || !isOpen) return;

    const fetchFilterDateColumns = async () => {
      const headers = {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      };

      try {
        const response = await fetch(
          `${hostnameV1}/lineItems/selectDimensionDateName?rule_id=${ruleId}`,
          { headers }
        );
        if (!response.ok)
          return toast.error(
            "Error fetching Date Columns for time transformation."
          );
        const data = await response.json();
        setDateColumnsData(data);
      } catch (error) {
        toast.error("Error fetching Date Columns for time transformation.");
      }
    };
    fetchFilterDateColumns();
  }, [ruleId, isOpen]);

  const handleValidate = () => {
    if (!filterColId || !filterColName)
      return toast.error("Select atleast one column before validating.");
    if (!dateType)
      return toast.error("Select Time Transformation Type Before validating.");
    setShowValidationModal(true);
    setIsOpen(false);
  };

  // Modal close handler
  const handleClose = () => {
    setIsOpen(false);
    setFilterColId("");
    setFilterColName("");
    setDateType("");
    setLowerOffset("");
    setLowerUnit("");
    setUpperOffset("");
    setUpperUnit("");
  };

  const handleSave = () => {
    const newRule = JSON.parse(JSON.stringify(rule));

    if (!filterColId || !filterColName)
      return toast.error(
        "Apply Time Transformation on atleast on column before saving."
      );
    if (!dateType) return toast.error("Select Transformation Type Before Saving.");

    let foundFilterIndex = newRule.filters?.findIndex(
      (filter) => filter.id == filterColId
    );
    if (foundFilterIndex >= 0) {
      newRule.filters[foundFilterIndex] = {
        id: filterColId,
        name: filterColName,
        type: dateType,
        lowerOffsetUnit: lowerUnit,
        lowerOffsetUnitValue: lowerOffset.toString(),
        upperOffsetUnit: upperUnit,
        upperOffsetUnitValue: upperOffset ? upperOffset.toString() : "",
      };
    } else {
      newRule.filters.push({
        id: filterColId,
        name: filterColName,
        type: dateType,
        lowerOffsetUnit: lowerUnit,
        lowerOffsetUnitValue: lowerOffset.toString(),
        upperOffsetUnit: upperUnit,
        upperOffsetUnitValue: upperOffset ? upperOffset.toString() : "",
      });
    }
    updateRule(ruleIndex, "filters", newRule.filters);
    setIsOpen(false);

    setFilterColId("");
    setFilterColName("");
    setDateType("");
    setLowerOffset("");
    setLowerUnit("");
    setUpperOffset("");
    setUpperUnit("");
  };

  // UseEffect to prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {showValidationModal && (
        <DateExpressionCalculator
          onClose={() => {
            setShowValidationModal(false);
            setIsOpen(true);
          }}
          dateType={dateType}
          lowerOffset={lowerOffset}
          upperOffset={upperOffset}
          lowerUnit={lowerUnit}
          upperUnit={upperUnit}
        />
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white backdrop-blur-md p-6 rounded-xl shadow-2xl border border-gray-200 w-full max-w-xl relative z-50">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Time Transformation
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-4">
              <label
                htmlFor="date-column-select"
                className="block text-sm font-medium text-[#6c757d] mb-1"
              >
                Select a column
              </label>
              <select
                value={filterColId}
                id="date-column-select"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-transparent"
                onChange={(e) => {
                  e.preventDefault();
                  setFilterColId(e.target.value);

                  if (!e.target.value) {
                    setFilterColName("");
                    setDateType("");
                    setLowerOffset("");
                    setLowerUnit("");
                    setUpperOffset("");
                    setUpperUnit("");
                    return;
                  }

                  setFilterColName(
                    (prev) =>
                      dateColumnsData.find(
                        (item) => item.fact_dimension_link_id == e.target.value
                      ).fct_column_name
                  );
                }}
              >
                <option value="">Select a column</option>
                {dateColumnsData.map((col) => (
                  <option
                    key={col.fact_dimension_link_id}
                    value={col.fact_dimension_link_id}
                  >
                    {col.fct_column_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4 space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="asOnDate"
                  value="asOnDate"
                  checked={dateType === "asOnDate"}
                  onChange={() => setDateType("asOnDate")}
                  disabled={!filterColId}
                  className="mr-2"
                />
                <label
                  htmlFor="asOnDate"
                  className="text-[#6c757d] font-medium"
                >
                  As on Date
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="historicDate"
                  value="historicDate"
                  checked={dateType === "historicDate"}
                  onChange={() => setDateType("historicDate")}
                  disabled={!filterColId}
                  className="mr-2"
                />
                <label
                  htmlFor="historicDate"
                  className="text-[#6c757d] font-medium"
                >
                  Historic Date
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="dateRange"
                  value="dateRange"
                  checked={dateType === "dateRange"}
                  onChange={() => setDateType("dateRange")}
                  disabled={!filterColId}
                  className="mr-2"
                />
                <label
                  htmlFor="dateRange"
                  className="text-[#6c757d] font-medium"
                >
                  Date Range
                </label>
              </div>
            </div>

            {(dateType === "historicDate" || dateType === "dateRange") && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="lowerOffset"
                    className="block text-sm font-medium text-[#6c757d]"
                  >
                    {dateType === "historicDate"? "Offset" : "Lower Offset"}
                  </label>
                  <input
                    id="lowerOffset"
                    type="number"
                    max={dateType === "historicDate" ? "0" : undefined}
                    value={lowerOffset}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (dateType === "historicDate" && value > 0) {
                        setLowerOffset(-value);
                      } else {
                        setLowerOffset(e.target.value);
                      }
                    }}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-transparent"
                    disabled={dateType === "asOnDate"}
                    placeholder={dateType === "historicDate" ? "Enter negative value" : "Enter positive or negative value"}
                  />
                </div>
                <div>
                  <label
                    htmlFor="lowerUnit"
                    className="block text-sm font-medium text-[#6c757d]"
                  >
                    Unit
                  </label>
                  <select
                    value={lowerUnit}
                    onChange={(e) => setLowerUnit(e.target.value)}
                    disabled={dateType === "asOnDate"}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-transparent"
                  >
                    <option value="">Select unit</option>
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>
            )}

            {dateType === "dateRange" && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="upperOffset"
                    className="block text-sm font-medium text-[#6c757d]"
                  >
                    Upper Offset
                  </label>
                  <input
                    id="upperOffset"
                    type="number"
                    value={upperOffset}
                    onChange={(e) => setUpperOffset(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-transparent"
                    placeholder="Enter positive or negative value"
                  />
                </div>
                <div>
                  <label
                    htmlFor="upperUnit"
                    className="block text-sm font-medium text-[#6c757d]"
                  >
                    Unit
                  </label>
                  <select
                    value={upperUnit}
                    onChange={(e) => setUpperUnit(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-transparent"
                  >
                    <option value="">Select unit</option>
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4 mt-6">
              {/* <button
                type="button"
                className="text-[#6c757d] hover:text-black flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-transparent transition-colors duration-200"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button> */}
              {/* <button
                type="button"
                className="text-[#6c757d] hover:text-black flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-transparent transition-colors duration-200"
              >
                <XCircle className="w-4 h-4" /> Cancel
              </button> */}
              {(dateType === "historicDate" || dateType === "dateRange") && (
                <button
                  type="button"
                  className="bg-[#8E77BB] text-white hover:bg-[#7864a3] flex items-center gap-2 px-4 py-2 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:ring-opacity-50 transition-colors duration-200"
                  onClick={handleValidate}
                >
                  <CheckCircle className="w-4 h-4" /> Validate
                </button>
              )}
              <button
                type="button"
                className="bg-[#8E77BB] text-white hover:bg-[#7864a3] flex items-center gap-2 px-4 py-2 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:ring-opacity-50 transition-colors duration-200"
                onClick={handleSave}
              >
                <SaveIcon className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TimeTransformationComponent;
