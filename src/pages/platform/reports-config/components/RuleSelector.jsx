import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import DimensionSelector from "./DimensionSelector";
import TimeTransformationComponent from "./TimeTransformationComponent";
import { useAuth } from "../../../../context/AuthContext";
import toast from "react-hot-toast";
import SearchableSelect from "../components/SearchableSelect";

function MetricSelector({ metric, index, ruleIndex, rule, updateRule, currentSelectedRuleId, metricData, metricParameterName }) {
  const metricOperators = [
    {label: "add", value: "add"},
    {label: "sub", value: "sub"},
    {label: "mul", value: "mul"},
    {label: "div", value: "div"},
  ]

  const handleMetricChange = (field, value) => {
    const updatedMetrics = [...rule.metrics] || [];
   
    if(field === "name"){
      updatedMetrics[index] = {
        name: value, 
        parameterName: "", 
        parameterOperator: ""
      }
    } else if(field === "parameterName"){
      updatedMetrics[index] = {...updatedMetrics[index], parameterName: value}
    } else if(field === "parameterOperator"){
      updatedMetrics[index] = {...updatedMetrics[index], parameterOperator: value}
    }

    updateRule(ruleIndex, "metrics", updatedMetrics);
  };

  return (
    <div className="flex items-center gap-4 mb-2">
      {/* Metric Select */}
      <select
        value={metric?.name || ""}
        onChange={(e) => handleMetricChange("name", e.target.value)}
        className="flex-1 h-[38px] border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        <option value="">Select Metric</option>
        {metricData.length > 0 ? (
          metricData.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))
        ) : (
          <option disabled>No metrics available</option>
        )}
      </select>

      {/* Operator Select */}
      <select
        value={metric?.parameterOperator || ""}
        onChange={(e) => handleMetricChange("parameterOperator", e.target.value)}
        className="flex-1 h-[38px] border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        <option value="">Select Operator</option>
        {metricOperators.map((o) => (
          <option key={o.label} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Parameter Select */}
      <select
        value={metric?.parameterName || ""}
        onChange={(e) => handleMetricChange("parameterName", e.target.value)}
        className="flex-1 h-[38px] border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        <option value="">Select Parameter</option>
        {metricParameterName.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      {/* Remove Button */}
      <button
        type="button"
        className="h-7 w-7 p-0 inline-flex items-center justify-center border border-gray-300 rounded-md shadow-sm text-sm font-medium text-black bg-gray-50 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        onClick={() => {
          const updatedMetrics = [...rule.metrics] || [];
          updatedMetrics.splice(index,1);
          updateRule(ruleIndex, "metrics", updatedMetrics);
        }}
      >
        ×
      </button>
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

  const [metricParameterName, setMetricParameterName] = useState([]);

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
        dimensions: [],
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
        dimensions: [],
        filters: [],
      });
      setTimeout(() => setCurrentSelectedRuleId(selectedRuleId), 0);
    }

  };

  useEffect(() => {
    (async () => {
      try{
        const response = await fetch(`${window._env_?.VITE_REPORTING_BACKEND_API}/lineItems/selectMetricParameterName`);
        
        if(!response.ok){
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || "Error occured while trying to display rule.");
        }

        const data = await response.json();
        setMetricParameterName(data);

      }catch(error){
        console.error(error);
        setMetricParameterName([]);
        toast.error(error.message);
      }
    })();
  }, [])

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
        </div>
        
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <h3 className="block text-sm font-medium text-gray-700">Metric Selector</h3>
            <button
              type="button"
              className="inline-flex items-center justify-center mb-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => {
                const updatedMetrics = rule.metrics || [];
                updatedMetrics.push({
                  name: "", parameterName: "", parameterOperator: ""
                })
                
                updateRule(index, "metrics", updatedMetrics);
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Metric
            </button>
          </div>

          {rule.metrics.map((metric, metricIndex) => (
            <MetricSelector
              key={`${index}-dim-${metricIndex}`}
              metric={metric}
              index={metricIndex}
              ruleIndex={index}
              rule={rule}
              updateRule={updateRule}
              currentSelectedRuleId={currentSelectedRuleId}
              metricData={metricData}
              metricParameterName={metricParameterName}
            />
          ))}
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