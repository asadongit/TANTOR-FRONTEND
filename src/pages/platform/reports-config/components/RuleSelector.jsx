import React, { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import DimensionSelector from "./DimensionSelector";
import TimeTransformationComponent from "./TimeTransformationComponent";
import { useAuth } from "../../../../context/AuthContext";
import toast from "react-hot-toast";

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
    rule.metrics && rule.metrics.length > 0
      ? rule.metrics[0]
      : "Select metric";

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
        <span>{displayText}</span>
        <span>{isOpen ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="max-h-60 overflow-y-auto p-2">
            {metricData.length > 0 ? (
              metricData.map((metric) => {
                const isSelected = rule.metrics && rule.metrics[0] === metric;

                return (
                  <label
                    key={metric}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="radio"
                      className="form-radio text-blue-600"
                      value={metric}
                      checked={isSelected}
                      name={`metric-radio-${index}`}
                      onChange={(e) => {
                        updateRule(index, "metrics", [metric]);
                      }}
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
}) => {
  const [ruleData, setRuleData] = useState([]);

  const [currentSelectedRuleId, setCurrentSelectedRuleId] = useState("");
  const [metricData, setMetricData] = useState([]);
  const [dimensionNamesData, setDimensionNamesData] = useState([]);

  const { token, hostnameV1 } = useAuth();
  const [isTimeTransformationOpen, setIsTimeTransformationOpen] =
    useState(false);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        };

        const response = await fetch(
          `${hostnameV1}/lineItems/selectRule`,
          { headers: headers }
        );
        if (!response.ok) {
          toast.error("ERROR OCCURED WHILE FETCHING RULES");
          return;
        }

        const data = await response.json();
        setRuleData(data);
      } catch (error) {
        console.error("Failed to fetch rules:", error);
        toast.error("ERROR OCCURED WHILE FETCHING RULES");
      }
    };

    fetchRules();
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!currentSelectedRuleId) return;

      try {
        const headers = {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        };
        const response = await fetch(
          `${hostnameV1}/lineItems/selectMatric?rule_id=${currentSelectedRuleId}`,
          { headers }
        );

        if (!response.ok) {
          toast.error("ERROR OCCURED WHILE FETCHING METRICS.");
          return;
        }

        const data = await response.json();
        setMetricData(data.metric_config);
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
        toast.error("ERROR OCCURED WHILE FETCHING METRICS.");
      }
    };

    fetchMetrics();
  }, [currentSelectedRuleId]);

  useEffect(() => {
    const fetchDimensionNames = async () => {
      if (!currentSelectedRuleId) return;

      try {
        const headers = {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        };

        const response = await fetch(
          `${hostnameV1}/lineItems/selectDimension?rule_id=${currentSelectedRuleId}`,
          { headers }
        );

        if (!response.ok) {
          toast.error("ERROR OCCURED WHILE FETCHING DIMENSIONS.");
          return;
        }

        const data = await response.json();
        console.log(data);
        setDimensionNamesData(data);
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
        toast.error("ERROR OCCURED WHILE FETCHING DIMENSIONS.");
      }
    };

    fetchDimensionNames();
  }, [currentSelectedRuleId]);

  const handleRuleChange = async (e) => {
    const selectedRuleId = e.target.value;
    if(!selectedRuleId){
      updateRule(index, null, {
        ruleId: "",
        ruleName: "",
        metrics: [],
        dimensions: [{ id: "", name: "", operator: "", value: [] }],
        filters: []
      });
      setCurrentSelectedRuleId("");
      setMetricData([]);
      setDimensionNamesData([]);
      return;
    }
    const selectedRule = ruleData.find(
      (rule) => rule.rule_id.toString() === selectedRuleId
    );

    if (selectedRule) {
      updateRule(index, null, {
        ruleId: selectedRuleId,
        ruleName: selectedRule.rule_name,
        metrics: [],
        dimensions: [{ id: "", name: "", operator: "", value: [] }],
        filters: [],
      });
      setTimeout(() => {
        setCurrentSelectedRuleId(selectedRuleId);
      }, 0);
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
      <div className="p-6 bg-gray-100 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label
              htmlFor={`rule-selector-${index}`}
              className="block text-sm font-medium text-gray-700"
            >
              Rule Selector
            </label>
            <select
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
            </select>
          </div>

          <MetricSelector
            index={index}
            rule={rule}
            metricData={metricData}
            updateRule={updateRule}
          />
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Dimension Selector</h3>
            <button
              type="button"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
