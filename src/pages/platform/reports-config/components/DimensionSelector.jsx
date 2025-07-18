import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import toast from "react-hot-toast";
import { X } from "lucide-react";

function DimensionValueSelector({ 
  index, 
  dimension, 
  dimensionValuesData = [],
  updateDimension, 
  ruleIndex 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [sortedDimensionValuesData, setSortedDimensionValuesData] = useState([]);
  
  // Close dropdown when clicking outside
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

  // Sort Values
  useEffect(() => {
    if (dimensionValuesData.length === 0) {
      return;
    }
    
    const selectedIds = new Set(
      (dimension.value || []).map(v => v.id)
    );
    
    const selectedItems = [];
    const unselectedItems = [];
    
    dimensionValuesData.forEach(item => {
      if (selectedIds.has(item.id)) {
        selectedItems.push(item);
      } else {
        unselectedItems.push(item);
      }
    });
    
    // // Sort each group alphabetically
    // selectedItems.sort((a, b) => a.fct_col_value.localeCompare(b.fct_col_value));
    // unselectedItems.sort((a, b) => a.fct_col_value.localeCompare(b.fct_col_value));
    
    const sorted = [...selectedItems, ...unselectedItems];
    setSortedDimensionValuesData(sorted);
  }, [isOpen, setIsOpen, dimensionValuesData]);
  
  // Simple display text
  const displayText = dimension.value && dimension.value.length > 0 
    ? `${dimension.value.length} selected` 
    : 'Select values';
  
  return (
    <div className="w-1/3 min-w-[200px] relative" ref={dropdownRef}>
      <button
        type="button"
        id={`dimension-value-selector-${index}`}
        className="h-[38px] flex justify-between items-center w-full px-3 text-left border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{displayText}</span>
        <span className="ml-2 flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="max-h-60 overflow-y-auto p-2 text-sm">
            {sortedDimensionValuesData.length > 0 ? (
              sortedDimensionValuesData.map((dimValue) => {
                const isChecked = dimension.value && dimension.value.some(
                  (v) => v.id === dimValue.id
                );
                
                return (
                  <label
                    key={dimValue.id}
                    className={`flex items-center space-x-2 p-2 hover:bg-gray-100 cursor-pointer
                    ${isChecked ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className="form-checkbox text-blue-600"
                      value={dimValue.id}
                      checked={isChecked}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        const newDimValue = isChecked
                          ? [
                              ...(dimension.value || []),
                              {
                                id: dimValue.id,
                                name: dimValue.fct_col_value,
                              },
                            ]
                          : (dimension.value || []).filter(
                              (v) => v.id !== dimValue.id
                            );

                        updateDimension(ruleIndex, index, "value", newDimValue);
                      }}
                    />
                    <span>{dimValue.fct_col_value}</span>
                  </label>
                );
              })
            ) : (
              <div className="p-2 text-gray-500">No values available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const DimensionSelector = ({
  dimension,
  index,
  ruleIndex,
  updateDimension,
  removeDimension,
  dimensionNamesData,
  currentSelectedRuleId,
}) => {
  const [selectedDimensionName, setSelectedDimensionName] = useState(dimension?.name || "");
  const [dimensionValuesData, setDimensionValuesData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const {token, hostnameV1 } = useAuth();
  
  // Initialize selectedDimensionName from props
  useEffect(() => {
    setSelectedDimensionName(dimension?.name || "");
    setDimensionValuesData([]);
  }, [dimension?.name, currentSelectedRuleId]);

  useEffect(() => {
    if (!selectedDimensionName || !currentSelectedRuleId) return;

    const fetchDimensionValues = async () => {
      setIsLoading(true);
      try {
        const headers = {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        };
        
        const response = await fetch(
          `${window._env_?.VITE_REPORTING_BACKEND_API}/lineItems/selectDimensionName?rule_id=${currentSelectedRuleId}&fct_column_name=${selectedDimensionName}`,
          { headers }
        );

        if (!response.ok) {
          console.error("Failed to fetch dimension values:", response.statusText);
          toast.error("Failed to fetch dimension values");
          return;
        }

        const data = await response.json();
        setDimensionValuesData(data || []);
      } catch (error) {
        console.error("Failed to fetch dimension values:", error);
        toast.error("Failed to fetch dimension values")
      } finally {
        setIsLoading(false);
      }
    };

    fetchDimensionValues();
  }, [selectedDimensionName, currentSelectedRuleId]);
  
  return (
    <div className="flex items-center gap-4 mb-2">
      <select
        value={dimension?.id || ""}
        onChange={(e) => {
          const selectedOption = e.target.options[e.target.selectedIndex];
          const newDimensionName = selectedOption.getAttribute("data-name");
          const newDimensionId = e.target.value;

          updateDimension(ruleIndex, index, "name", newDimensionName);
          updateDimension(ruleIndex, index, "id", newDimensionId);
          updateDimension(ruleIndex, index, "value", []);
          updateDimension(ruleIndex, index, "operator", "");

          setSelectedDimensionName(newDimensionName);
        }}
        className="w-1/3 h-[38px] border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        <option value="">Select Dimension</option>
        {dimensionNamesData && dimensionNamesData.map((item) => (
          <option
            key={item.fact_dimension_link_id}
            data-name={item.fct_column_name}
            value={item.fact_dimension_link_id}
          >
            {item.fct_column_name}
          </option>
        ))}
      </select>

      <select
        value={dimension?.operator || ""}
        onChange={(e) =>
          updateDimension(ruleIndex, index, "operator", e.target.value)
        }
        className="w-1/3 h-[38px] border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        <option value="">Select Operator</option>
        <option value="in">IN</option>
        <option value="not in">NOT IN</option>
      </select>
      
      {isLoading ? (
        <div className="w-1/3 flex items-center">
          <span className="text-gray-500">Loading values...</span>
        </div>
      ) : (
        <DimensionValueSelector 
          dimension={dimension || { value: [] }} 
          dimensionValuesData={dimensionValuesData}
          index={index} 
          updateDimension={updateDimension} 
          ruleIndex={ruleIndex}
        />
      )}
      
      <button
        type="button"
        className="h-7 w-7 p-0 inline-flex items-center justify-center border border-gray-300 rounded-md shadow-sm text-sm font-medium text-black bg-gray-50 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        onClick={() => removeDimension(ruleIndex, index)}
      >
        <X className="h-6 w-6 m-2"/>
      </button>
    </div>
  );
};

export default DimensionSelector;