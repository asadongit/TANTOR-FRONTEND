import React, { useState, useEffect } from "react";
import { XCircle, CheckCircle, SaveIcon } from "lucide-react";
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
  const [lowerUnit, setLowerUnit] = useState("");
  const [upperOffset, setUpperOffset] = useState("");
  const [upperUnit, setUpperUnit] = useState("");
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [dateColumnsData, setDateColumnsData] = useState([]);

  const { token, hostnameV1 } = useAuth();

  const isSaveDisabled =
    !filterColId ||
    !dateType ||
    (dateType === "historicDate" &&
      (isNaN(parseFloat(lowerOffset)) || !lowerUnit)) ||
    (dateType === "dateRange" &&
      (isNaN(parseFloat(lowerOffset)) ||
        !lowerUnit ||
        isNaN(parseFloat(upperOffset)) ||
        !upperUnit));

  // Fetch date columns for the selected rule
  useEffect(() => {
    if (!ruleId || !isOpen) return;

    const fetchFilterDateColumns = async () => {
      const headers = {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      };

      try {
        const response = await fetch(
          `${window._env_?.VITE_REPORTING_BACKEND_API}/lineItems/selectDimensionDateName?rule_id=${ruleId}`,
          { headers }
        );
        if (!response.ok) {
          toast.error("Error fetching Date Columns for time transformation.");
          return;
        }
        const data = await response.json();
        setDateColumnsData(data);
      } catch (error) {
        toast.error("Error fetching Date Columns for time transformation.");
      }
    };

    fetchFilterDateColumns();
  }, [ruleId, isOpen]);

  // Pre-fill form if existing transformation is configured
  useEffect(() => {
    if (!isOpen || dateColumnsData.length === 0 || !rule?.filters) return;

    const existingFilter = rule.filters.find((filter) =>
      dateColumnsData.some((col) => col.fact_dimension_link_id.toString() === filter.id)
    );

    if (existingFilter) {
      setFilterColId(existingFilter.id || "");
      setFilterColName(existingFilter.name || "");
      setDateType(existingFilter.type || "");
      setLowerOffset(existingFilter.lowerOffsetUnitValue || "");
      setLowerUnit(existingFilter.lowerOffsetUnit || "");
      setUpperOffset(existingFilter.upperOffsetUnitValue || "");
      setUpperUnit(existingFilter.upperOffsetUnit || "");
    }
  }, [isOpen, dateColumnsData, rule?.filters]);

  const handleValidate = () => {
    if (!filterColId || !filterColName) {
      toast.error("Select at least one column before validating.");
      return;
    }
    if (!dateType) {
      toast.error("Select Time Transformation Type Before validating.");
      return;
    }
    setShowValidationModal(true);
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFilterColId("");
    setFilterColName("");
    setDateType("");
    setLowerOffset("");
    setLowerUnit("");
    setUpperOffset("");
    setUpperUnit("");
  };

  const handleSave = () => {
    if (isSaveDisabled) return;

    const newRule = {
      ...rule,
      filters: rule.filters ? [...rule.filters] : [],
    };
    console.log(filterColName);
    const newFilter = {
      id: filterColId,
      name: filterColName,
      type: dateType,
      lowerOffsetUnit: lowerUnit,
      lowerOffsetUnitValue: lowerOffset.toString(),
      upperOffsetUnit: upperUnit,
      upperOffsetUnitValue: upperOffset ? upperOffset.toString() : "",
    };

    const foundFilterIndex = newRule.filters.findIndex(
      (filter) => filter.id === filterColId
    );

    const updatedFilters =
      foundFilterIndex >= 0
        ? newRule.filters.map((filter, index) =>
            index === foundFilterIndex ? newFilter : filter
          )
        : [...newRule.filters, newFilter];

    updateRule(ruleIndex, "filters", updatedFilters);
    setIsOpen(false);
    resetForm();
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
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
          <div className="bg-white p-6 rounded-xl shadow-2xl border w-full max-w-xl">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Time Transformation
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#8E77BB]"
                onChange={(e) => {
                  const selected = dateColumnsData.find(
                    (item) => item.fact_dimension_link_id.toString() === e.target.value
                  );
                  setFilterColId(e.target.value);
                  setFilterColName(selected?.fct_column_name || "");
                  setDateType("");
                  setLowerOffset("");
                  setLowerUnit("");
                  setUpperOffset("");
                  setUpperUnit("");
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

            {/* Date Type Options */}
            <div className="mb-4 space-y-2">
              {["asOnDate", "historicDate", "dateRange"].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={type}
                    value={type}
                    checked={dateType === type}
                    onChange={() => setDateType(type)}
                    disabled={!filterColId}
                  />
                  <label htmlFor={type} className="text-[#6c757d] font-medium">
                    {type === "asOnDate"
                      ? "As on Date"
                      : type === "historicDate"
                      ? "Historic Date"
                      : "Date Range"}
                  </label>
                </div>
              ))}
            </div>

            {/* Offset Inputs */}
            {(dateType === "historicDate" || dateType === "dateRange") && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-[#6c757d]">
                    {dateType === "historicDate" ? "Offset" : "Lower Offset"}
                  </label>
                  <input
                    type="number"
                    value={lowerOffset}
                    onChange={(e) =>
                      dateType === "historicDate" && e.target.value > 0
                        ? setLowerOffset(-e.target.value)
                        : setLowerOffset(e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder={
                      dateType === "historicDate"
                        ? "Enter negative value"
                        : "Enter value"
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6c757d]">
                    Unit
                  </label>
                  <select
                    value={lowerUnit}
                    onChange={(e) => setLowerUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select unit</option>
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                    {dateType === "historicDate" && (<option value="pfy">Previous Financial Year</option>)}
                  </select>
                </div>
              </div>
            )}

            {dateType === "dateRange" && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-[#6c757d]">
                    Upper Offset
                  </label>
                  <input
                    type="number"
                    value={upperOffset}
                    onChange={(e) => setUpperOffset(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter value"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6c757d]">
                    Unit
                  </label>
                  <select
                    value={upperUnit}
                    onChange={(e) => setUpperUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              {((dateType === "historicDate" && lowerUnit.toLowerCase() !== "pfy")|| dateType === "dateRange") && (
                <button
                  className="bg-[#8E77BB] text-white px-4 py-2 rounded-md hover:bg-[#7864a3] flex items-center gap-2"
                  onClick={handleValidate}
                >
                  <CheckCircle className="w-4 h-4" /> Validate
                </button>
              )}
              <button
                className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                  isSaveDisabled
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#8E77BB] text-white hover:bg-[#7864a3]"
                }`}
                onClick={handleSave}
                disabled={isSaveDisabled}
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
