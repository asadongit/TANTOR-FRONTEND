import React, { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import DimensionSelector from "./DimensionSelector";


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
  
  const displayText = rule.metrics && rule.metrics.length > 0 
    ? `${rule.metrics.length} metrics selected` 
    : 'Select metrics';
  
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
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="max-h-60 overflow-y-auto p-2">
            {metricData.length > 0 ? (
              metricData.map((metric) => {
                const isChecked = rule.metrics && rule.metrics.includes(metric);
                
                return (
                  <label
                    key={metric}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="form-checkbox text-blue-600"
                      value={metric}
                      checked={isChecked}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        const newMetrics = isChecked 
                          ? [...(rule.metrics || []), metric] 
                          : (rule.metrics || []).filter((m) => m !== metric);
                        
                        updateRule(index, "metrics", newMetrics);
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

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const headers = {
          authorization:
            "Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJhUlJoQV8yeDJSc09ac1VFLVROdk1ucUJ4cEE0X0NLeW84bnVPcUdyTjdNIn0.eyJleHAiOjE3NDY1MjYxNDcsImlhdCI6MTc0NjUyNDUyNywianRpIjoiZjVhMjdjYjYtYmQ2Mi00YjU4LTliYTQtNDkzNWQ3ODM2YjRlIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay50YW50b3IuaW8vcmVhbG1zL0dhdGVrZWVwZXIiLCJhdWQiOlsiR2VuQUkiLCJyZWFsbS1tYW5hZ2VtZW50Iiwibm92aGkiLCJhY2NvdW50Il0sInN1YiI6IjE0YTZiODk3LTIzMzUtNGNiYS04ZTA5LWE0MjkxMTNkNjViOSIsInR5cCI6IkJlYXJlciIsImF6cCI6ImRhcmNoIiwic2Vzc2lvbl9zdGF0ZSI6IjQyZDhlYWE2LWVjN2UtNDg1ZS05NGMxLWVhOTg4MGVmMGVhOSIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiRGF0YSBBY2Nlc3MgVmlld2VyIiwiRGF0YV9RdWVyeV9FeGVjdXRvciIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iLCJkZWZhdWx0LXJvbGVzLWdhdGVrZWVwZXIiLCJCSV9SZXBvcnRfVmlld2VyIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiR2VuQUkiOnsicm9sZXMiOlsiR2xvYmFsIl19LCJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbIm1hbmFnZS1yZWFsbSIsIm1hbmFnZS11c2VycyIsInF1ZXJ5LXVzZXJzIl19LCJub3ZoaSI6eyJyb2xlcyI6WyJkZWZhdWx0Il19LCJkYXJjaCI6eyJyb2xlcyI6WyJnbG9iYWwtYWRtaW4iXX0sImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIGVtYWlsIHByb2ZpbGUiLCJzaWQiOiI0MmQ4ZWFhNi1lYzdlLTQ4NWUtOTRjMS1lYTk4ODBlZjBlYTkiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm5hbWUiOiJub3Zpam90aCBzaW5naCIsImdyb3VwcyI6WyIvVlZfR1JPVVAoUGVyc29uYSkvVlZfR1JPVVAiLCIvVlZfR1JPVVAoUGVyc29uYSkiXSwicHJlZmVycmVkX3VzZXJuYW1lIjoibm92aWpvdGgiLCJnaXZlbl9uYW1lIjoibm92aWpvdGgiLCJmYW1pbHlfbmFtZSI6InNpbmdoIiwiZW1haWwiOiJub3Zpam90aEB0cmFuc2xhYi5pbyJ9.KzYazqNm2r-_Q-V_ybqJNsQXA93wupZGl9FBMQjBmFWFYfgj0NC00pZkl6QcdM5RA8-Ybl-cFB6FOvMu3TfdVO5u5IaOk8PJv4PVtlAfi73_-8yqq0ZVPIj5RaKW2Diebx93F5AeNlVU6Nzce64QQA5mkwlx078XhrFX6OgRHa3YNWRHMPLOqHsnbEvKXRi7B1OSe_JQDfoIPYaNI_bO6f6TZzSY5MmVbpny7FlVRCRJ87Aex7Te5XrgcvGIl0Q4BSu-CoqiQQ6cQwKQNuetnmyorrFTzAJ079d4lNM4p2dOMkPe8eHZTJx0elNNzL-r595cQpnEiNMEpkUKN2PuRg",
        };
        const response = await fetch(
          "http://localhost:8000/api/v1/lineItems/selectRule",
          { headers: headers }
        );
        if (!response.ok) {
          alert("ERROR WHILE FETCHING RULES");
          return;
        }

        const data = await response.json();
        setRuleData(data);
      } catch (error) {
        console.error("Failed to fetch rules:", error);
        alert("ERROR WHILE FETCHING RULES");
      }
    };

    fetchRules();
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!currentSelectedRuleId) return;

      try {
        const headers = {
          authorization:
            "Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJhUlJoQV8yeDJSc09ac1VFLVROdk1ucUJ4cEE0X0NLeW84bnVPcUdyTjdNIn0.eyJleHAiOjE3NDY1MjYxNDcsImlhdCI6MTc0NjUyNDUyNywianRpIjoiZjVhMjdjYjYtYmQ2Mi00YjU4LTliYTQtNDkzNWQ3ODM2YjRlIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay50YW50b3IuaW8vcmVhbG1zL0dhdGVrZWVwZXIiLCJhdWQiOlsiR2VuQUkiLCJyZWFsbS1tYW5hZ2VtZW50Iiwibm92aGkiLCJhY2NvdW50Il0sInN1YiI6IjE0YTZiODk3LTIzMzUtNGNiYS04ZTA5LWE0MjkxMTNkNjViOSIsInR5cCI6IkJlYXJlciIsImF6cCI6ImRhcmNoIiwic2Vzc2lvbl9zdGF0ZSI6IjQyZDhlYWE2LWVjN2UtNDg1ZS05NGMxLWVhOTg4MGVmMGVhOSIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiRGF0YSBBY2Nlc3MgVmlld2VyIiwiRGF0YV9RdWVyeV9FeGVjdXRvciIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iLCJkZWZhdWx0LXJvbGVzLWdhdGVrZWVwZXIiLCJCSV9SZXBvcnRfVmlld2VyIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiR2VuQUkiOnsicm9sZXMiOlsiR2xvYmFsIl19LCJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbIm1hbmFnZS1yZWFsbSIsIm1hbmFnZS11c2VycyIsInF1ZXJ5LXVzZXJzIl19LCJub3ZoaSI6eyJyb2xlcyI6WyJkZWZhdWx0Il19LCJkYXJjaCI6eyJyb2xlcyI6WyJnbG9iYWwtYWRtaW4iXX0sImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIGVtYWlsIHByb2ZpbGUiLCJzaWQiOiI0MmQ4ZWFhNi1lYzdlLTQ4NWUtOTRjMS1lYTk4ODBlZjBlYTkiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm5hbWUiOiJub3Zpam90aCBzaW5naCIsImdyb3VwcyI6WyIvVlZfR1JPVVAoUGVyc29uYSkvVlZfR1JPVVAiLCIvVlZfR1JPVVAoUGVyc29uYSkiXSwicHJlZmVycmVkX3VzZXJuYW1lIjoibm92aWpvdGgiLCJnaXZlbl9uYW1lIjoibm92aWpvdGgiLCJmYW1pbHlfbmFtZSI6InNpbmdoIiwiZW1haWwiOiJub3Zpam90aEB0cmFuc2xhYi5pbyJ9.KzYazqNm2r-_Q-V_ybqJNsQXA93wupZGl9FBMQjBmFWFYfgj0NC00pZkl6QcdM5RA8-Ybl-cFB6FOvMu3TfdVO5u5IaOk8PJv4PVtlAfi73_-8yqq0ZVPIj5RaKW2Diebx93F5AeNlVU6Nzce64QQA5mkwlx078XhrFX6OgRHa3YNWRHMPLOqHsnbEvKXRi7B1OSe_JQDfoIPYaNI_bO6f6TZzSY5MmVbpny7FlVRCRJ87Aex7Te5XrgcvGIl0Q4BSu-CoqiQQ6cQwKQNuetnmyorrFTzAJ079d4lNM4p2dOMkPe8eHZTJx0elNNzL-r595cQpnEiNMEpkUKN2PuRg",
        };
        const response = await fetch(
          `http://localhost:8000/api/v1/lineItems/selectMatric?rule_id=${currentSelectedRuleId}`,
          { headers }
        );

        if (!response.ok) {
          alert("ERROR WHILE FETCHING METRICS");
          return;
        }

        const data = await response.json();
        setMetricData(data.metric_config);
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
        alert("ERROR WHILE FETCHING METRICS");
      }
    };

    fetchMetrics();
  }, [currentSelectedRuleId]);

  useEffect(() => {
    const fetchDimensionNames = async () => {
      if (!currentSelectedRuleId) return;

      try {
        const headers = {
          authorization:
            "Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJhUlJoQV8yeDJSc09ac1VFLVROdk1ucUJ4cEE0X0NLeW84bnVPcUdyTjdNIn0.eyJleHAiOjE3NDY1MjYxNDcsImlhdCI6MTc0NjUyNDUyNywianRpIjoiZjVhMjdjYjYtYmQ2Mi00YjU4LTliYTQtNDkzNWQ3ODM2YjRlIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay50YW50b3IuaW8vcmVhbG1zL0dhdGVrZWVwZXIiLCJhdWQiOlsiR2VuQUkiLCJyZWFsbS1tYW5hZ2VtZW50Iiwibm92aGkiLCJhY2NvdW50Il0sInN1YiI6IjE0YTZiODk3LTIzMzUtNGNiYS04ZTA5LWE0MjkxMTNkNjViOSIsInR5cCI6IkJlYXJlciIsImF6cCI6ImRhcmNoIiwic2Vzc2lvbl9zdGF0ZSI6IjQyZDhlYWE2LWVjN2UtNDg1ZS05NGMxLWVhOTg4MGVmMGVhOSIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiRGF0YSBBY2Nlc3MgVmlld2VyIiwiRGF0YV9RdWVyeV9FeGVjdXRvciIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iLCJkZWZhdWx0LXJvbGVzLWdhdGVrZWVwZXIiLCJCSV9SZXBvcnRfVmlld2VyIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiR2VuQUkiOnsicm9sZXMiOlsiR2xvYmFsIl19LCJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbIm1hbmFnZS1yZWFsbSIsIm1hbmFnZS11c2VycyIsInF1ZXJ5LXVzZXJzIl19LCJub3ZoaSI6eyJyb2xlcyI6WyJkZWZhdWx0Il19LCJkYXJjaCI6eyJyb2xlcyI6WyJnbG9iYWwtYWRtaW4iXX0sImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIGVtYWlsIHByb2ZpbGUiLCJzaWQiOiI0MmQ4ZWFhNi1lYzdlLTQ4NWUtOTRjMS1lYTk4ODBlZjBlYTkiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm5hbWUiOiJub3Zpam90aCBzaW5naCIsImdyb3VwcyI6WyIvVlZfR1JPVVAoUGVyc29uYSkvVlZfR1JPVVAiLCIvVlZfR1JPVVAoUGVyc29uYSkiXSwicHJlZmVycmVkX3VzZXJuYW1lIjoibm92aWpvdGgiLCJnaXZlbl9uYW1lIjoibm92aWpvdGgiLCJmYW1pbHlfbmFtZSI6InNpbmdoIiwiZW1haWwiOiJub3Zpam90aEB0cmFuc2xhYi5pbyJ9.KzYazqNm2r-_Q-V_ybqJNsQXA93wupZGl9FBMQjBmFWFYfgj0NC00pZkl6QcdM5RA8-Ybl-cFB6FOvMu3TfdVO5u5IaOk8PJv4PVtlAfi73_-8yqq0ZVPIj5RaKW2Diebx93F5AeNlVU6Nzce64QQA5mkwlx078XhrFX6OgRHa3YNWRHMPLOqHsnbEvKXRi7B1OSe_JQDfoIPYaNI_bO6f6TZzSY5MmVbpny7FlVRCRJ87Aex7Te5XrgcvGIl0Q4BSu-CoqiQQ6cQwKQNuetnmyorrFTzAJ079d4lNM4p2dOMkPe8eHZTJx0elNNzL-r595cQpnEiNMEpkUKN2PuRg",
        };
        const response = await fetch(
          `http://localhost:8000/api/v1/lineItems/selectDimension?rule_id=${currentSelectedRuleId}`,
          { headers }
        );

        if (!response.ok) {
          alert("ERROR WHILE FETCHING METRICS");
          return;
        }

        const data = await response.json();
        console.log(data);
        setDimensionNamesData(data);
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
        alert("ERROR WHILE FETCHING METRICS");
      }
    };

    fetchDimensionNames();
  }, [currentSelectedRuleId]);

  const handleRuleChange = (e) => {
    const selectedRuleId = e.target.value;
    const selectedRule = ruleData.find(
      (rule) => rule.rule_id.toString() === selectedRuleId
    );

    if (selectedRule) {
      updateRule(index, "ruleId", selectedRuleId);
      updateRule(index, "ruleName", selectedRule.rule_name);
    } else {
      updateRule(index, "ruleId", selectedRuleId);
      updateRule(index, "ruleName", "");
    }

    setCurrentSelectedRuleId(selectedRuleId);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mb-6">
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

        <MetricSelector index={index} rule={rule} metricData={metricData} updateRule={updateRule} />
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
    </div>
  );
};

export default RuleSelector;
