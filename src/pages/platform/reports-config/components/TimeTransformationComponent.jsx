import React, { useState, useEffect } from "react";
import { ChevronLeft, XCircle, CheckCircle, SaveIcon } from "lucide-react";

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

  // API data.
  const [dateColumnsData, setDateColumnsData] = useState([]);

  useEffect(() => {
    if (!ruleId || !isOpen) return;

    const fetchFilterDateColumns = async () => {
      const authToken =
        "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJhUlJoQV8yeDJSc09ac1VFLVROdk1ucUJ4cEE0X0NLeW84bnVPcUdyTjdNIn0.eyJleHAiOjE3NDY1MjYxNDcsImlhdCI6MTc0NjUyNDUyNywianRpIjoiZjVhMjdjYjYtYmQ2Mi00YjU4LTliYTQtNDkzNWQ3ODM2YjRlIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay50YW50b3IuaW8vcmVhbG1zL0dhdGVrZWVwZXIiLCJhdWQiOlsiR2VuQUkiLCJyZWFsbS1tYW5hZ2VtZW50Iiwibm92aGkiLCJhY2NvdW50Il0sInN1YiI6IjE0YTZiODk3LTIzMzUtNGNiYS04ZTA5LWE0MjkxMTNkNjViOSIsInR5cCI6IkJlYXJlciIsImF6cCI6ImRhcmNoIiwic2Vzc2lvbl9zdGF0ZSI6IjQyZDhlYWE2LWVjN2UtNDg1ZS05NGMxLWVhOTg4MGVmMGVhOSIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiRGF0YSBBY2Nlc3MgVmlld2VyIiwiRGF0YV9RdWVyeV9FeGVjdXRvciIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iLCJkZWZhdWx0LXJvbGVzLWdhdGVrZWVwZXIiLCJCSV9SZXBvcnRfVmlld2VyIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiR2VuQUkiOnsicm9sZXMiOlsiR2xvYmFsIl19LCJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbIm1hbmFnZS1yZWFsbSIsIm1hbmFnZS11c2VycyIsInF1ZXJ5LXVzZXJzIl19LCJub3ZoaSI6eyJyb2xlcyI6WyJkZWZhdWx0Il19LCJkYXJjaCI6eyJyb2xlcyI6WyJnbG9iYWwtYWRtaW4iXX0sImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIGVtYWlsIHByb2ZpbGUiLCJzaWQiOiI0MmQ4ZWFhNi1lYzdlLTQ4NWUtOTRjMS1lYTk4ODBlZjBlYTkiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm5hbWUiOiJub3Zpam90aCBzaW5naCIsImdyb3VwcyI6WyIvVlZfR1JPVVAoUGVyc29uYSkvVlZfR1JPVVAiLCIvVlZfR1JPVVAoUGVyc29uYSkpIl0sInByZWZlcnJlZF91c2VybmFtZSI6Im5vdmlqb3RoIiwiZ2l2ZW5fbmFtZSI6Im5vdmlqb3RoIiwiZmFtaWx5X25hbWUiOiJzaW5naCIsImVtYWlsIjoibm92aWpvdGhAdHJhbnNsYWIuaW8ifQ.KzYazqNm2r-_Q-V_ybqJNsQXA93wupZGl9FBMQjBmFWFYfgj0NC00pZkl6QcdM5RA8-Ybl-cFB6FOvMu3TfdVO5u5IaOk8PJv4PVtlAfi73_-8yqq0ZVPIj5RaKW2Diebx93F5AeNlVU6Nzce64QQA5mkwlx078XhrFX6OgRHa3YNWRHMPLOqHsnbEvKXRi7B1OSe_JQDfoIPYaNI_bO6f6TZzSY5MmVbpny7FlVRCRJ87Aex7Te5XrgcvGIl0Q4BSu-CoqiQQ6cQwKQNuetnmyorrFTzAJ079d4lNM4p2dOMkPe8eHZTJx0elNNzL-r595cQpnEiNMEpkUKN2PuRg";

      const headers = {
        authorization: `Bearer ${authToken}`,
      };
      const response = await fetch(
        `http://localhost:8000/api/v1/lineItems/selectDimensionDateName?rule_id=${ruleId}`,
        { headers }
      );
      if (!response.ok)
        return alert("Error fetching Date Columns for time transformation.");
      const data = await response.json();
      setDateColumnsData(data);
    };
    fetchFilterDateColumns();
  }, [ruleId, isOpen]);

  const handleValidate = () => {
    console.log("Validating:", {
      dateType,
      lowerOffset,
      lowerUnit,
      upperOffset,
      upperUnit,
    });
    alert("Validation logic not implemented. Check console for values.");
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
    
    if(!filterColId || !filterColName) return alert("Apply Time Transformation on atleast on column before saving.")
    if(!dateType) return alert("Select Transformation Type Before Saving.");
    
    let foundFilterIndex = newRule.filters?.findIndex(
      (filter) => filter.id == filterColId
    );
    if (foundFilterIndex >= 0) {
      newRule.filters[foundFilterIndex] = {
        id: filterColId,
        name: filterColName,
        type: dateType,
        lowerOffsetUnit: lowerOffset,
        lowerOffsetUnitValue: lowerUnit,
        upperOffsetUnit: upperOffset,
        upperOffsetUnitValue: upperUnit,
      };
    } else {
      newRule.filters.push({
        id: filterColId,
        name: filterColName,
        type: dateType,
        lowerOffsetUnit: lowerOffset,
        lowerOffsetUnitValue: lowerUnit,
        upperOffsetUnit: upperOffset,
        upperOffsetUnitValue: upperUnit,
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
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-gray-200 w-full max-w-xl relative z-50">
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
                  
                  if(!e.target.value){
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
                    Lower Offset
                  </label>
                  <input
                    id="lowerOffset"
                    type="number"
                    value={lowerOffset}
                    onChange={(e) => setLowerOffset(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-transparent"
                    disabled={dateType === "asOnDate"}
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
                    <option value="weeks">Weeks</option>
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
                    <option value="weeks">Weeks</option>
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
              <button
                type="button"
                className="bg-[#8E77BB] text-white hover:bg-[#7864a3] flex items-center gap-2 px-4 py-2 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:ring-opacity-50 transition-colors duration-200"
                onClick={handleValidate}
              >
                <CheckCircle className="w-4 h-4" /> Validate
              </button>
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
