import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import toast from "react-hot-toast";
import { X, Trash, Plus } from "lucide-react";
import { useStateContext } from "../../Federation/context/contextViewProvider";

const DimensionFilter = ({ onClose, onApply }) => {
  const { token, hostnameV1 } = useAuth();
  const dropdownRef = useRef(null);
  
  const {finalPayload} = useStateContext();

  // Component state
  const [availableDimensions, setAvailableDimensions] = useState([]);
  const [dimensionValues, setDimensionValues] = useState({});
  const [isLoadingDimensions, setIsLoadingDimensions] = useState(false);
  const [isLoadingValues, setIsLoadingValues] = useState(false);
  const [openValueDropdown, setOpenValueDropdown] = useState(null);
  
  // Filters state
  const [filters, setFilters] = useState([{
    dimension: { id: "", name: "" }, 
    operator: "", 
    value: [] 
  }]);

  useEffect(() => {
    const cachedFilters = finalPayload?.dimensionFilters;
    if(cachedFilters)
      setFilters(cachedFilters);
    
    console.log("CACHED FILTERS ", cachedFilters);
  }, [])
  // Set dummy dimensions on mount with string IDs
  useEffect(() => {
    const dummyDimensions = [
      {name: "dim1", id: "1"},
      {name: "dim2", id: "2"},
      {name: "dim3", id: "3"},
      {name: "dim4", id: "4"}
    ];
    
    setAvailableDimensions(dummyDimensions);
    setIsLoadingDimensions(false);
  }, []);

  // Fetch dimension values when dimension name changes
  const fetchValues = async (dimensionId) => {
    if (!dimensionId) return;
    
    setIsLoadingValues(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return dummy values with string IDs
    const dummyValues = {
      "1": [  // Category
        {id: "101", name: "Electronics"},
        {id: "102", name: "Clothing"},
        {id: "103", name: "Home & Kitchen"},
        {id: "104", name: "Books"},
        {id: "105", name: "Sports"},
        {id: "106", name: "Beauty"},
        {id: "107", name: "Toys"},
        {id: "108", name: "Furniture"}
      ],
      "2": [  // Region
        {id: "201", name: "North America"},
        {id: "202", name: "Europe"},
        {id: "203", name: "Asia"},
        {id: "204", name: "South America"},
        {id: "205", name: "Africa"},
        {id: "206", name: "Oceania"},
        {id: "207", name: "Middle East"}
      ],
      "3": [  // Product
        {id: "301", name: "Laptop"},
        {id: "302", name: "Smartphone"},
        {id: "303", name: "Tablet"},
        {id: "304", name: "Headphones"},
        {id: "305", name: "Camera"},
        {id: "306", name: "Smartwatch"},
        {id: "307", name: "Printer"}
      ],
      "4": [  // Department
        {id: "401", name: "Sales"},
        {id: "402", name: "Marketing"},
        {id: "403", name: "Finance"},
        {id: "404", name: "HR"},
        {id: "405", name: "IT"},
        {id: "406", name: "Operations"}
      ],
      "5": [  // Customer Type
        {id: "501", name: "New Customer"},
        {id: "502", name: "Returning Customer"},
        {id: "503", name: "VIP Customer"},
        {id: "504", name: "Corporate Account"}
      ],
      "6": [  // Sales Channel
        {id: "601", name: "Online"},
        {id: "602", name: "Retail Store"},
        {id: "603", name: "Wholesale"},
        {id: "604", name: "Mobile App"}
      ]
    };
    
    setDimensionValues(prev => ({ 
      ...prev, 
      [dimensionId]: dummyValues[dimensionId] || [] 
    }));
    
    setIsLoadingValues(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenValueDropdown(null);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle dimension selection
  const handleDimensionChange = (index, e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    const name = selectedOption.getAttribute("data-name");
    const id = e.target.value;

    setFilters(prev => 
      prev.map((filter, i) => 
        i === index
          ? { 
              ...filter, 
              dimension: { id, name }, 
              operator: "", 
              value: [] 
            }
          : filter
      )
    );
    
    // Fetch dummy values
    if (id) {
      fetchValues(id);
    }
  };

  // Handle operator selection
  const handleOperatorChange = (index, e) => {
    setFilters(prev => 
      prev.map((filter, i) => 
        i === index
          ? { ...filter, operator: e.target.value }
          : filter
      )
    );
  };

  // Handle value selection
  const handleValueChange = (index, dimValue, isChecked) => {
    setFilters(prev => 
      prev.map((filter, i) => {
        if (i !== index) return filter;
        
        const currentValues = filter.value || [];
        let newValues;
        
        if (isChecked) {
          newValues = [
            ...currentValues,
            {
              id: dimValue.id,
              name: dimValue.name,
            },
          ];
        } else {
          newValues = currentValues.filter(v => v.id !== dimValue.id);
        }
        
        return { ...filter, value: newValues };
      })
    );
  };

  // Add a new filter row
  const addFilter = () => {
    setFilters(prev => [
      ...prev,
      { 
        dimension: { id: "", name: "" }, 
        operator: "", 
        value: [] 
      }
    ]);
  };

  // Remove a filter row
  const removeFilter = (index) => {
    if (filters.length <= 1) return;
    setFilters(prev => prev.filter((_, i) => i !== index));
    
    // Close dropdown if it was for the removed filter
    if (openValueDropdown === index) {
      setOpenValueDropdown(null);
    }
  };

  // Apply filters
  const handleApply = () => {
    const validFilters = filters.filter(
      filter => filter.dimension.id && filter.operator && filter.value.length > 0
    );
    
    onApply(validFilters);
    // onClose();
  };

  // Clear all filters
  const clearAll = () => {
    setFilters([{ 
      dimension: { id: "", name: "" }, 
      operator: "", 
      value: [] 
    }]);
    setOpenValueDropdown(null);
    onApply(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-black">
      <div className="bg-white rounded-lg w-[98vw] max-w-[1800px] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 pl-6 border-b flex justify-between items-center bg-[#282F49] text-white rounded-t-lg">
          <h2 className="text-xl font-semibold">Dimension Filters</h2>
          <button
            onClick={onClose}
            className="p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-auto">
          <div className="space-y-6">
            {filters.map((filter, index) => {
              const currentValues = dimensionValues[filter.dimension.id] || [];
              const displayText = filter.value?.length
                ? `${filter.value.length} selected`
                : "Select values";
              
              return (
                <div key={index} className="flex items-center gap-5 mb-3 w-full">
                  {/* Dimension Selector - Wider (30%) */}
                  <div className="flex-[3] min-w-[200px] relative">
                    <select
                      value={filter.dimension.id}
                      onChange={(e) => handleDimensionChange(index, e)}
                      className="w-full h-14 border border-gray-300 rounded-md shadow-sm py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      disabled={isLoadingDimensions}
                    >
                      <option value="">Select Dimension</option>
                      {availableDimensions.map((dim) => (
                        <option
                          key={dim.id}
                          data-name={dim.name}
                          value={dim.id}
                        >
                          {dim.name}
                        </option>
                      ))}
                    </select>
                    {isLoadingDimensions && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 text-sm">Loading...</span>
                      </div>
                    )}
                  </div>

                  {/* Operator Selector - Fixed width */}
                  <div className="w-[180px]">
                    <select
                      value={filter.operator}
                      onChange={(e) => handleOperatorChange(index, e)}
                      disabled={!filter.dimension.id}
                      className="w-full h-14 border border-gray-300 rounded-md shadow-sm py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    >
                      <option value="">Select Operator</option>
                      <option value="in">IN</option>
                      <option value="not in">NOT IN</option>
                    </select>
                  </div>

                  {/* Value Selector - Wider (50%) */}
                  <div className="flex-[5] min-w-[300px] relative" ref={dropdownRef}>
                    <button
                      type="button"
                      className={`h-14 flex justify-between items-center w-full px-4 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        !filter.operator ? "bg-gray-100 text-gray-400" : "bg-white"
                      }`}
                      onClick={() => filter.operator && setOpenValueDropdown(
                        openValueDropdown === index ? null : index
                      )}
                      disabled={!filter.operator}
                    >
                      <span className="truncate">{displayText}</span>
                      <span className="ml-2 flex-shrink-0">
                        {openValueDropdown === index ? "▲" : "▼"}
                      </span>
                    </button>

                    {openValueDropdown === index && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80">
                        <div className="p-3 text-base max-h-[320px] overflow-y-auto">
                          {isLoadingValues ? (
                            <div className="p-2 text-gray-500 text-center">Loading values...</div>
                          ) : currentValues.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {currentValues.map((dimValue) => {
                                const isChecked = filter.value?.some(
                                  v => v.id === dimValue.id
                                );
                                return (
                                  <label
                                    key={dimValue.id}
                                    className="flex items-center space-x-3 p-3 hover:bg-gray-100 cursor-pointer text-base"
                                  >
                                    <input
                                      type="checkbox"
                                      className="form-checkbox text-blue-600 h-4 w-4"
                                      checked={isChecked}
                                      onChange={(e) => handleValueChange(
                                        index, 
                                        dimValue, 
                                        e.target.checked
                                      )}
                                    />
                                    <span className="truncate">{dimValue.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-2 text-gray-500 text-center">No values available</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFilter(index)}
                    className="h-14 w-14 p-1 flex items-center justify-center border border-gray-300 rounded-md shadow-sm text-black bg-gray-50 hover:bg-gray-200"
                  >
                    <Trash className="h-5 w-5" />
                  </button>
                </div>
              );
            })}
            
            <div className="mt-6">
              <button
                onClick={addFilter}
                className="flex items-center gap-2 px-5 py-3 bg-[#8E77BB] text-white rounded hover:bg-opacity-90 text-base font-medium"
              >
                <Plus className="h-5 w-5" />
                <span>Add Filter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex justify-end gap-4">
          {/* <button
            onClick={() => { onApply(null)}}
            className="px-5 py-2.5 bg-[#8E77BB] text-white rounded hover:bg-opacity-90 text-base font-medium"
          >
            Skip
          </button> */}
          <button
            onClick={clearAll}
            className="px-5 py-2.5 border border-gray-300 rounded hover:bg-gray-50 text-base text-black font-medium"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2.5 bg-[#8E77BB] text-white rounded hover:bg-opacity-90 text-base font-medium"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default DimensionFilter;