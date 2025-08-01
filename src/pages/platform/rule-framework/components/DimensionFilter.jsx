import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import toast from "react-hot-toast";
import { X, Trash, Plus } from "lucide-react";

const DimensionFilter = ({ setIsOpen, onApply, factId, updateNodeData, nodeData }) => {
  const { token, hostnameV1 } = useAuth();
  const dropdownRef = useRef(null);

  // Component state
  const [availableDimensions, setAvailableDimensions] = useState([]);
  const [dimensionValues, setDimensionValues] = useState({});
  const [sortedDimensionValues, setSortedDimensionValues] = useState({});
  const [isLoadingDimensions, setIsLoadingDimensions] = useState(false);
  const [isLoadingValues, setIsLoadingValues] = useState(false);
  const [openValueDropdown, setOpenValueDropdown] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Filters state
  const [filters, setFilters] = useState([
    {
      dimension: { id: "", name: "" },
      operator: "",
      value: [],
    },
  ]);

  useEffect(() => {
    if (nodeData?.dimensionFilters && nodeData.dimensionFilters.length > 0) {
      const cachedFilters = nodeData.dimensionFilters;
      setFilters(cachedFilters);

      // Fetch values for each dimension in saved filters
      cachedFilters.forEach((filter) => {
        if (filter.dimension.id && filter.dimension.name) {
          fetchValues(filter.dimension.id, filter.dimension.name);
        }
      });
    }
  }, []);

  useEffect(() => {
    setIsLoadingDimensions(true);
    (async () => {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(
        `${window._env_?.VITE_REPORTING_BACKEND_API}/selectDimension?fact_id=${factId}`,
        { headers }
      );
      const data = await response.json();

      const formattedData = data.map((item) => ({
        id: item.fact_dimension_link_id,
        name: item.fct_column_name,
      }));

      setAvailableDimensions(formattedData || []);
      setIsLoadingDimensions(false);
    })();
  }, []);

  // Sort dimension values to show selected items first
  useEffect(() => {
    Object.keys(dimensionValues).forEach(dimensionId => {
      const values = dimensionValues[dimensionId] || [];
      if (values.length === 0) return;

      // Get the filter for this dimension
      const filter = filters.find(f => f.dimension.id === dimensionId);
      const selectedIds = new Set(
        (filter?.value || []).map(v => v.id)
      );

      const selectedItems = [];
      const unselectedItems = [];

      values.forEach(item => {
        if (selectedIds.has(item.id)) {
          selectedItems.push(item);
        } else {
          unselectedItems.push(item);
        }
      });

      const sorted = [...selectedItems, ...unselectedItems];
      setSortedDimensionValues(prev => ({
        ...prev,
        [dimensionId]: sorted
      }));
    });
  }, [openValueDropdown, dimensionValues]);

  const fetchValues = async (dimensionId, dimensionName) => {
    if (!dimensionId || !dimensionName) return;
    setIsLoadingValues(true);

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    const response = await fetch(
      `${window._env_?.VITE_REPORTING_BACKEND_API}/selectDimensionValue?fact_id=${factId}&fct_column_name=${dimensionName}`,
      { headers }
    );
    const data = await response.json();
    setDimensionValues((prev) => ({
      ...prev,
      [dimensionId]: data || [],
    }));

    setIsLoadingValues(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenValueDropdown(null);
        setSearchTerm("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDimensionChange = (index, e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    const name = selectedOption.getAttribute("data-name");
    const id = e.target.value;

    setFilters((prev) =>
      prev.map((filter, i) =>
        i === index
          ? {
              ...filter,
              dimension: { id, name },
              operator: "",
              value: [],
            }
          : filter
      )
    );

    if (id && name) {
      fetchValues(id, name);
    }
  };

  const handleOperatorChange = (index, e) => {
    setFilters((prev) =>
      prev.map((filter, i) =>
        i === index ? { ...filter, operator: e.target.value } : filter
      )
    );
  };

  const handleValueChange = (index, dimValue, isChecked) => {
    setFilters((prev) =>
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
          newValues = currentValues.filter((v) => v.id !== dimValue.id);
        }

        return { ...filter, value: newValues };
      })
    );
  };

  const addFilter = () => {
    setFilters((prev) => [
      ...prev,
      {
        dimension: { id: "", name: "" },
        operator: "",
        value: [],
      },
    ]);
  };

  const removeFilter = (index) => {
    if (filters.length <= 1) return;
    setFilters((prev) => prev.filter((_, i) => i !== index));

    // Close dropdown if it was for the removed filter
    if (openValueDropdown === index) {
      setOpenValueDropdown(null);
      setSearchTerm("");
    }
  };

  const getFilterQuery = (validFilters) => {
    if (!validFilters || validFilters.length === 0) return "";

    return validFilters
      .map((filter) => {
        const values = filter.value.map((v) => v.name).join(", ");
        return `${filter.dimension.name} ${filter.operator.toUpperCase()} [${values}]`;
      })
      .join(" AND ");
  };

  const validateFilters = () => {
    if (filters.length === 0) return false;
    
    return filters.some(
      (filter) =>
        filter.dimension.id && filter.operator && filter.value.length > 0
    );
  };

  const handleApply = () => {
    if (!validateFilters()) {
      toast.error("No filters selected.");
      return;
    }
    const validFilters = filters.filter(
      (filter) =>
        filter.dimension.id && filter.operator && filter.value.length > 0
    );

    updateNodeData({
      dimensionQuery: getFilterQuery(validFilters),
      dimensionFilters: validFilters
    });
    onApply();
  };

  const handleSkip = () => {
    clearAll();
    updateNodeData({
      dimensionQuery: "",
      dimensionFilters: []
    });
    onApply();
  };

  const clearAll = () => {
    const updatedFilters = [
      {
        dimension: { id: "", name: "" },
        operator: "",
        value: [],
      },
    ];

    setFilters([...updatedFilters]);
    updateNodeData({dimensionQuery: "", dimensionFilters: updatedFilters});
    setOpenValueDropdown(null);
    setSearchTerm("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-black">
      <div className="bg-white rounded-lg w-[70vw] max-w-[1200px] h-[55vh] flex flex-col">
        {/* Header */}
        <div className="p-3 border-b flex justify-between items-center bg-[#282F49] text-white rounded-t-lg">
          <h2 className="text-lg font-semibold">Dimension Filters</h2>
          <button
            onClick={() => {
              setIsOpen(false);
            }}
            className="p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-auto">
          <div className="space-y-3">
            {filters.map((filter, index) => {
              const currentValues = sortedDimensionValues[filter.dimension.id] || [];
              const displayText = filter.value?.length
                ? `${filter.value.length} selected`
                : "Select values";

              const filteredValues = currentValues.filter(item => 
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
              );

              return (
                <div
                  key={index}
                  className="flex items-center gap-3 mb-2 w-full"
                >
                  {/* Dimension Selector */}
                  <div className="flex-[3] min-w-[180px] relative">
                    <select
                      value={filter.dimension.id}
                      onChange={(e) => handleDimensionChange(index, e)}
                      className="w-full h-10 border border-gray-300 rounded shadow-sm py-1 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <span className="text-gray-500 text-xs">
                          Loading...
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Operator Selector */}
                  <div className="w-[120px]">
                    <select
                      value={filter.operator}
                      onChange={(e) => handleOperatorChange(index, e)}
                      disabled={!filter.dimension.id}
                      className="w-full h-10 border border-gray-300 rounded shadow-sm py-1 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">Operator</option>
                      <option value="in">IN</option>
                      <option value="not in">NOT IN</option>
                    </select>
                  </div>

                  {/* Value Selector */}
                  <div
                    className="flex-[4] min-w-[200px] relative"
                    ref={dropdownRef}
                  >
                    <button
                      type="button"
                      className={`h-10 flex justify-between items-center w-full px-3 text-sm border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        !filter.operator
                          ? "bg-gray-100 text-gray-400"
                          : "bg-white"
                      }`}
                      onClick={() => {
                        setSearchTerm("");
                        setOpenValueDropdown(
                          openValueDropdown === index ? null : index
                        );
                      }}
                      disabled={!filter.operator}
                    >
                      <span className="truncate">{displayText}</span>
                      <span className="ml-2 flex-shrink-0">
                        {openValueDropdown === index ? "▲" : "▼"}
                      </span>
                    </button>

                    {openValueDropdown === index && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 flex flex-col">
                        {/* Search Input */}
                        <div className="p-2 border-b">
                          <input
                            type="text"
                            placeholder="Search values..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                          />
                        </div>
                        
                        {/* Values List */}
                        <div className="flex-1 overflow-y-auto max-h-40">
                          {isLoadingValues ? (
                            <div className="p-2 text-gray-500 text-center">
                              Loading values...
                            </div>
                          ) : filteredValues.length > 0 ? (
                            <div className="space-y-0.5">
                              {filteredValues.map((dimValue) => {
                                const isChecked = filter.value?.some(
                                  (v) => v.id === dimValue.id
                                );
                                return (
                                  <label
                                    key={dimValue.id}
                                    className={`flex items-center space-x-2 p-2 hover:bg-gray-100 cursor-pointer text-sm ${
                                      isChecked ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      className="form-checkbox text-blue-600 h-3 w-3"
                                      checked={isChecked}
                                      onChange={(e) =>
                                        handleValueChange(
                                          index,
                                          dimValue,
                                          e.target.checked
                                        )
                                      }
                                    />
                                    <span className="truncate">
                                      {dimValue.name}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-2 text-gray-500 text-center">
                              {searchTerm ? "No matching values" : "No values available"}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFilter(index)}
                    className="h-10 w-10 p-1 flex items-center justify-center border border-gray-300 rounded shadow-sm text-black bg-gray-50 hover:bg-gray-200"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              );
            })}

            <div className="mt-4">
              <button
                onClick={addFilter}
                className="flex items-center gap-2 px-4 py-2 bg-[#8E77BB] text-white rounded hover:bg-opacity-90 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Add Filter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t flex justify-end gap-3">
          <button
            onClick={handleSkip}
            className="px-4 py-2 bg-[#8E77BB] text-white rounded hover:bg-opacity-90 text-sm font-medium"
          >
            Skip
          </button>
          <button
            onClick={clearAll}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm text-black font-medium"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            disabled={!validateFilters()}
            className={`px-4 py-2 text-white rounded text-sm font-medium ${
              !validateFilters()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#8E77BB] hover:bg-opacity-90"
            }`}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default DimensionFilter;