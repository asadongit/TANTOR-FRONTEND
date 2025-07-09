import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import DimensionSelector from "./DimensionSelector";
import TimeTransformationComponent from "./TimeTransformationComponent";
import { useAuth } from "../../../../context/AuthContext";
import toast from "react-hot-toast";
import SearchableSelect from "../components/SearchableSelect";

function MetricSelector({ index, rule, metricData = [], updateRule }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const displayText =
    rule.metrics && rule.metrics.length > 0 ? ` ${rule.metrics.length} Selected` : "Select metric";

  const handleMetricChange = (metric) => {
    const currentMetrics = rule.metrics || [];
    const updatedMetrics = currentMetrics.includes(metric)
      ? currentMetrics.filter((m) => m !== metric)
      : [...currentMetrics, metric];

    updateRule(index, "metrics", updatedMetrics);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label
        htmlFor={`metric-selector-${index}`}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Metric Selector
      </label>

      {/* Button */}
      <button
        type="button"
        id={`metric-selector-${index}`}
        className="flex justify-between items-center w-full px-3 py-2 text-left border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{displayText}</span>
        <span>{isOpen ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="max-h-60 overflow-y-auto p-2">
            {metricData.length > 0 ? (
              metricData.map((metric) => {
                const isSelected =
                  rule.metrics && rule.metrics.includes(metric);

                return (
                  <label
                    key={metric}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="form-checkbox text-blue-600"
                      value={metric}
                      checked={isSelected}
                      onChange={() => handleMetricChange(metric)}
                    />
                    <span>{metric}</span>
                  </label>
                );
              })
            ) : (
              <div className="p-2 text-gray-500">No metrics available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const RuleSelector = ({
  rule,
  index,
  updateRule,
  addDimension,
  updateDimension,
  removeDimension,
  removeRule
}) => {
  const [ruleData, setRuleData] = useState([]);
  const [currentSelectedRuleId, setCurrentSelectedRuleId] = useState("");
  const [metricData, setMetricData] = useState([]);
  const [dimensionNamesData, setDimensionNamesData] = useState([]);
  const [isTimeTransformationOpen, setIsTimeTransformationOpen] = useState(false);

  const { token, hostnameV1 } = useAuth();

  // Load rule data on mount
  useEffect(() => {
    const fetchRules = async () => {
      try {
        const response = await fetch(`${window._env_?.VITE_REPORTING_BACKEND_API}/lineItems/selectRule`, {
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          toast.error("Error occurred while fetching rules.");
          return;
        }

        const data = await response.json();
        setRuleData(data);
      } catch (error) {
        console.error("Failed to fetch rules:", error);
        toast.error("Error occurred while fetching rules.");
      }
    };

    fetchRules();
  }, [hostnameV1, token]);

  // Handle existing ruleId on edit or reopen)
  useEffect(() => {
    if (rule?.ruleId) {
      setCurrentSelectedRuleId(rule.ruleId);
    }
  }, [rule?.ruleId]);

  // Fetch metrics when ruleId changes
  useEffect(() => {
    const fetchMetrics = async () => {
      if (!currentSelectedRuleId) return;

      try {
        const response = await fetch(
          `${window._env_?.VITE_REPORTING_BACKEND_API}/lineItems/selectMatric?rule_id=${currentSelectedRuleId}`,
          {
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          toast.error("Error occurred while fetching metrics.");
          return;
        }

        const data = await response.json();
        setMetricData(data.metric_config || []);
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
        toast.error("Error occurred while fetching metrics.");
      }
    };

    fetchMetrics();
  }, [currentSelectedRuleId, hostnameV1, token]);

  // Fetch dimension names when ruleId changes
  useEffect(() => {
    const fetchDimensionNames = async () => {
      if (!currentSelectedRuleId) return;

      try {
        const response = await fetch(
          `${window._env_?.VITE_REPORTING_BACKEND_API}/lineItems/selectDimension?rule_id=${currentSelectedRuleId}`,
          {
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          toast.error("Error occurred while fetching dimensions.");
          return;
        }

        const data = await response.json();
        setDimensionNamesData(data || []);
      } catch (error) {
        console.error("Failed to fetch dimensions:", error);
        toast.error("Error occurred while fetching dimensions.");
      }
    };

    fetchDimensionNames();
  }, [currentSelectedRuleId, hostnameV1, token]);

  const handleRuleChange = (option) => {
    const selectedRuleId = option.id;

    if (!selectedRuleId) {
      updateRule(index, null, {
        ruleId: "",
        ruleName: "",
        metrics: [],
        dimensions: [{ id: "", name: "", operator: "", value: [] }],
        filters: [],
      });
      setCurrentSelectedRuleId("");
      setMetricData([]);
      setDimensionNamesData([]);
      return;
    }

    // Prevent clearing if same rule is reselected
    if (selectedRuleId.toString() === rule.ruleId.toString()) return;

    const selectedRule = ruleData.find(
      (r) => r.rule_id.toString() === selectedRuleId.toString()
    );

    if (selectedRule) {
      updateRule(index, null, {
        ruleId: selectedRuleId.toString(),
        ruleName: selectedRule.rule_name,
        metrics: [],
        dimensions: [{ id: "", name: "", operator: "", value: [] }],
        filters: [],
      });
      setTimeout(() => setCurrentSelectedRuleId(selectedRuleId), 0);
    }

  };

  return (
    <>
      <TimeTransformationComponent
        isOpen={isTimeTransformationOpen}
        setIsOpen={setIsTimeTransformationOpen}
        ruleId={currentSelectedRuleId}
        updateRule={updateRule}
        ruleIndex={index}
        rule={rule}
      />

      <div className="p-6 bg-gray-100 rounded-lg shadow-md mb-6 relative">
        {/* Delete button at top-right */}
        <button
          className="absolute top-3 right-3 mb-11 text-gray-500 hover:text-red-500 transition-colors"
          onClick={() => removeRule(index)}
          aria-label="Delete rule"
        >
          <Trash2 className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label
              htmlFor={`rule-selector-${index}`}
              className="block text-sm font-medium text-gray-700"
            >
              Rule Selector
            </label>
            {/* <select
              id={`rule-selector-${index}`}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              name="ruleId"
              value={rule.ruleId}
              onChange={handleRuleChange}
            >
              <option value="">Select a rule</option>
              {ruleData.map((ruleItem) => (
                <option key={ruleItem.rule_id} value={ruleItem.rule_id}>
                  {ruleItem.rule_name}
                </option>
              ))}
            </select> */}
            <SearchableSelect
              options={
                (() => ruleData?.map(item => (
                  {label: item.rule_name,
                    id: item.rule_id.toString()
                  }
                )))()
              }
              placeholder="Select Rule"
              onChange={handleRuleChange}
              value={(() => {
                const selectedRule = ruleData?.find(item => item.rule_id.toString() === currentSelectedRuleId.toString()) || [];
                if(selectedRule.length === 0)
                  return null;
                return {id: selectedRule.rule_id, label: selectedRule.rule_name}
              })()}
            />
          </div>

          <MetricSelector
            index={index}
            rule={rule}
            metricData={metricData}
            updateRule={updateRule}
          />
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center">
            <h3 className="block text-sm font-medium text-gray-700">Dimension Filter</h3>
            <button
              type="button"
              className="inline-flex items-center justify-center mb-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => addDimension(index)}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Dimension
            </button>
          </div>

          {rule.dimensions.map((dimension, dimIndex) => (
            <DimensionSelector
              key={`${index}-dim-${dimIndex}`}
              dimension={dimension}
              index={dimIndex}
              ruleIndex={index}
              updateDimension={updateDimension}
              removeDimension={removeDimension}
              dimensionNamesData={dimensionNamesData}
              currentSelectedRuleId={currentSelectedRuleId}
            />
          ))}
        </div>

        <div className="text-right">
          <button
            className="flex-1 px-4 py-2 bg-[#8E77BB] text-white rounded-lg hover:bg-[rgb(142,119,187,0.8)]"
            onClick={(e) => {
              e.preventDefault();
              setIsTimeTransformationOpen(true);
            }}
          >
            Time Transformation
          </button>
        </div>
      </div>
    </>
  );
};

export default RuleSelector;