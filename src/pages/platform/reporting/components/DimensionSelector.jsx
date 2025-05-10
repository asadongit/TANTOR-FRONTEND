import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";

const DimensionSelector = ({
  dimension,
  index,
  ruleIndex,
  updateDimension,
  removeDimension,
  dimensionNamesData,
  currentSelectedRuleId,
}) => {
  const [selectedDimensionName, setCurrentSelectedDimensionName] = useState();
  const [dimensionValuesData, setDimensionValuesData] = useState([]);

  useEffect(() => {
    if (!selectedDimensionName) return;

    const fetchDimensionValues = async () => {
      try {
        const headers = {
          authorization:
            "Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJhUlJoQV8yeDJSc09ac1VFLVROdk1ucUJ4cEE0X0NLeW84bnVPcUdyTjdNIn0.eyJleHAiOjE3NDY1MjYxNDcsImlhdCI6MTc0NjUyNDUyNywianRpIjoiZjVhMjdjYjYtYmQ2Mi00YjU4LTliYTQtNDkzNWQ3ODM2YjRlIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay50YW50b3IuaW8vcmVhbG1zL0dhdGVrZWVwZXIiLCJhdWQiOlsiR2VuQUkiLCJyZWFsbS1tYW5hZ2VtZW50Iiwibm92aGkiLCJhY2NvdW50Il0sInN1YiI6IjE0YTZiODk3LTIzMzUtNGNiYS04ZTA5LWE0MjkxMTNkNjViOSIsInR5cCI6IkJlYXJlciIsImF6cCI6ImRhcmNoIiwic2Vzc2lvbl9zdGF0ZSI6IjQyZDhlYWE2LWVjN2UtNDg1ZS05NGMxLWVhOTg4MGVmMGVhOSIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiRGF0YSBBY2Nlc3MgVmlld2VyIiwiRGF0YV9RdWVyeV9FeGVjdXRvciIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iLCJkZWZhdWx0LXJvbGVzLWdhdGVrZWVwZXIiLCJCSV9SZXBvcnRfVmlld2VyIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiR2VuQUkiOnsicm9sZXMiOlsiR2xvYmFsIl19LCJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbIm1hbmFnZS1yZWFsbSIsIm1hbmFnZS11c2VycyIsInF1ZXJ5LXVzZXJzIl19LCJub3ZoaSI6eyJyb2xlcyI6WyJkZWZhdWx0Il19LCJkYXJjaCI6eyJyb2xlcyI6WyJnbG9iYWwtYWRtaW4iXX0sImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIGVtYWlsIHByb2ZpbGUiLCJzaWQiOiI0MmQ4ZWFhNi1lYzdlLTQ4NWUtOTRjMS1lYTk4ODBlZjBlYTkiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm5hbWUiOiJub3Zpam90aCBzaW5naCIsImdyb3VwcyI6WyIvVlZfR1JPVVAoUGVyc29uYSkvVlZfR1JPVVAiLCIvVlZfR1JPVVAoUGVyc29uYSkiXSwicHJlZmVycmVkX3VzZXJuYW1lIjoibm92aWpvdGgiLCJnaXZlbl9uYW1lIjoibm92aWpvdGgiLCJmYW1pbHlfbmFtZSI6InNpbmdoIiwiZW1haWwiOiJub3Zpam90aEB0cmFuc2xhYi5pbyJ9.KzYazqNm2r-_Q-V_ybqJNsQXA93wupZGl9FBMQjBmFWFYfgj0NC00pZkl6QcdM5RA8-Ybl-cFB6FOvMu3TfdVO5u5IaOk8PJv4PVtlAfi73_-8yqq0ZVPIj5RaKW2Diebx93F5AeNlVU6Nzce64QQA5mkwlx078XhrFX6OgRHa3YNWRHMPLOqHsnbEvKXRi7B1OSe_JQDfoIPYaNI_bO6f6TZzSY5MmVbpny7FlVRCRJ87Aex7Te5XrgcvGIl0Q4BSu-CoqiQQ6cQwKQNuetnmyorrFTzAJ079d4lNM4p2dOMkPe8eHZTJx0elNNzL-r595cQpnEiNMEpkUKN2PuRg",
        };
        const response = await fetch(
          `http://localhost:8000/api/v1/lineItems/selectDimensionName?rule_id=${currentSelectedRuleId}&fct_column_name=${selectedDimensionName}`,
          { headers }
        );

        if (!response.ok) {
          alert("ERROR WHILE FETCHING Dimension Values");
          return;
        }

        const data = await response.json();
        console.log(data);
        setDimensionValuesData(data);
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
        alert("ERROR WHILE FETCHING Dimension Values");
      }
    };

    fetchDimensionValues();
  }, [selectedDimensionName]);
  return (
    <div className="flex gap-4 mb-2">
      <select
        value={dimension.id || ""}
        onChange={(e) => {
          const selectedOption = e.target.options[e.target.selectedIndex];
          const selectedDimensionName =
            selectedOption.getAttribute("data-name");
          const selectedDimensionId = e.target.value;

          updateDimension(ruleIndex, index, "name", selectedDimensionName);
          updateDimension(ruleIndex, index, "id", selectedDimensionId);
          setCurrentSelectedDimensionName(selectedDimensionName);
        }}
        className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        <option value="">Select Dimension</option>
        {dimensionNamesData &&
          dimensionNamesData.map((item) => (
            <option
              data-name={item.fct_column_name}
              value={item.fact_dimension_link_id}
            >
              {item.fct_column_name}
            </option>
          ))}
      </select>

      <select
        value={dimension.operator || ""}
        onChange={(e) =>
          updateDimension(ruleIndex, index, "operator", e.target.value)
        }
        className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        <option value="">Select Operator</option>
        <option value="in">IN</option>
        <option value="not_in">NOT IN</option>
      </select>
      <div>
        <label
          htmlFor={`dimension-value-selector-${index}`}
          className="block text-sm font-medium text-gray-700"
        >
          Value
        </label>
        <div className="space-y-2">
          {dimensionValuesData.map((dimValue) => (
            <label
              key={dimValue.product_category_id}
              className="flex items-center space-x-2 border-2 border-solid border-black p-1"
            >
              <input
                type="checkbox"
                className="form-checkbox text-blue-600"
                value={dimValue.product_category_id}
                checked={dimension.value.some(
                  (v) => v.id === dimValue.product_category_id
                )}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  const newDimValue = isChecked
                    ? [
                        ...dimension.value,
                        {
                          id: dimValue.product_category_id,
                          name: dimValue.fct_col_value,
                        },
                      ]
                    : dimension.value.filter(
                        (v) => v.id !== dimValue.product_category_id
                      );

                  updateDimension(ruleIndex, index, "value", newDimValue);
                }}
              />
              <span>{dimValue.fct_col_value}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        onClick={() => removeDimension(ruleIndex, index)}
      >
        -
      </button>
    </div>
  );
};

export default DimensionSelector;
