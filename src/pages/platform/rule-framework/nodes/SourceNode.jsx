// STATE - 2
import React, { useState, useCallback, useEffect } from "react";
import PropTypes, { node } from "prop-types";
import { Handle, Position } from "reactflow";
import { Upload, X, Search, Pencil, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";
import { useTableContext } from "../../react-flow/context/TableContext";
import DimensionFilter from "../components/DimensionFilter";
import TimeTransformationFilter from "../components/TimeTransformationFilter";
import { useLocation } from "react-router-dom";
import SearchableSelect from "../components/SearchableSelect";

const SkeletonLoader = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    <div className="h-4 bg-gray-300 rounded w-2/3"></div>
  </div>
);

export function SourceNode({ id, data }) {
  const { token, hostnameV1 } = useAuth();
  const [connections, setConnections] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [dimensionColumns, setDimensionColumns] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFact, setSelectedFact] = useState({
    fact_id: "",
    fct_name: "",
  });
  const { openDrawer } = useTableContext();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isTimeTansformationOpen,setIsTimeTansformationOpen] = useState(false);
  const [filterModalColumns, setFilterModalColumns] = useState([]);
  const [generatedQuery, setGeneratedQuery] = useState("");
  const [ruleFilterSelections, setRuleFilterSelections] = useState([]);

  const [ruleName, setRuleName] = useState(data.ruleName || "");
  const [ruleDescription, setRuleDescription] = useState(data.ruleDescription || "");

  const {pathname} = useLocation();

  useEffect(() => {
    if(data?.mode && (data.mode.toUpperCase() !== "EDIT")) return;
    const existingSelectedItems = data?.filterConditions?.columns.map((col) => col.name);
    if(existingSelectedItems)
      setSelectedItems(existingSelectedItems);
    else
      setSelectedItems([]);

    const existingSelectedFact = data?.selectedFact;
    if(existingSelectedFact)
      setSelectedFact(data.selectedFact);
    else
      setSelectedFact({
        fact_id: "",
        fct_name: "",
    });
  }, []);

  const updateNodeData = (partialData) => {
  if (data.onDataChange) {
    data.onDataChange({
      ...partialData,
      nodeType: "source",
      selectedFact,
      ruleName,
      ruleDescription,
      dimensionFilters: partialData.dimensionFilters || data.dimensionFilters,
      timeTransformationFilters: partialData.timeTransformationFilters || data.timeTransformationFilters,
      timeTransformationQuery: partialData.timeTransformationQuery || data.timeTransformationQuery
    });
  }
};

  const fetchOptions = useCallback(async () => {
    try {
      const response = await fetch(`${window._env_?.VITE_REPORTING_BACKEND_API}/selectSubject`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const connectionsData = await response.json();
      setConnections(connectionsData);
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  }, [hostnameV1, token]);

  const fetchTables = useCallback(
    async (fact_id) => {
      if (!fact_id) return;
      setLoading(true);
      try {
        const cacheKey = `tablelist-${fact_id}`;
        const cachedTables = sessionStorage.getItem(cacheKey);

        if (cachedTables) {
          setTables(JSON.parse(cachedTables));
        } else {
          const response = await fetch(
            `${window._env_?.VITE_REPORTING_BACKEND_API}/selectMatric?fact_id=${fact_id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (!response.ok) throw new Error("Failed to fetch tables");
          
          const tableDetails = await response.json();
          const formattedTableDetails = tableDetails.map((detail) => ({
            id: detail.fct_metric_linkid,
            name: detail.matric_name,
            dimType: "metric",
          }));

          sessionStorage.setItem(
            cacheKey,
            JSON.stringify(formattedTableDetails)
          );
          setTables(formattedTableDetails);
        }
      } catch (error) {
        console.error("Error fetching tables:", error);
        setTables([]);
      } finally {
        setLoading(false);
      }
    },
    [hostnameV1, token]
  );

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    if (selectedFact.fact_id) {
      fetchTables(selectedFact.fact_id);
    }
  }, [selectedFact.fact_id, fetchTables]);

   useEffect(() => {
  if (!selectedFact.fact_id) return;

  const fetchDimensions = async () => {
    try {
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };

      const response = await fetch(
        `${window._env_?.VITE_REPORTING_BACKEND_API}/selectDimension?fact_id=${selectedFact.fact_id}`, 
        { headers }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const formattedData = data.map(item => ({
        id: item.fact_dimension_link_id, 
        name: item.fct_column_name,
        dimType: "dimension"
      }));
      
      setDimensionColumns(formattedData || []);
    } catch (error) {
      console.error("Error fetching dimensions:", error);
      toast.error("Failed to load dimensions");
      setDimensionColumns([]);
    }
  };

  fetchDimensions();
}, [selectedFact.fact_id, token, hostnameV1]);

  const filteredMetricColumns = tables.filter((table) =>
    table.name.toLowerCase().includes(searchTerm?.toLowerCase() || "")
  );

  const filteredDimensionColumns = dimensionColumns.filter((table) =>
    table.name.toLowerCase().includes(searchTerm?.toLowerCase() || "")
  );

  const filteredTables = filteredMetricColumns.concat(filteredDimensionColumns);

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      setSelectedItems(filteredTables.map((table) => table.name));
    } else {
      setSelectedItems([]);
    }
  };

  const handleTableSelection = (matric_name) => {
    setSelectedItems((prev) =>
      prev.includes(matric_name)
        ? prev.filter((item) => item !== matric_name)
        : [...prev, matric_name]
    );
  };

  const handleCancel = () => {
    setSelectedItems([]);
  };

  const validateNodeData = (columns) => {

    if(!ruleName){
      toast.error(`Rule Name is required`);
      return false;
    }
    if(!ruleDescription ){
      toast.error(`Rule Description is required`);
      return false;
    }

    if(!selectedFact.fact_id || !selectedFact.fct_name){
      toast.error(`Please select a Table before proceeding.`);
      return false;
    }

    if(selectedItems.length === 0){
      toast.error(`Please select at least one column before proceeding.`);
      return false;
    }

    const selectedAggregateColumns = [];
    const selectedColumnsWithNoAggregates = [];

    columns.forEach(col => {
      if(col.dimType.toLowerCase() === "metric" && (!col.aggregate || col.aggregate.length === 0)){
        selectedColumnsWithNoAggregates.push(col.name);
      }
      
      if(col.dimType.toLowerCase() === "metric" && col.aggregate.length > 0)
        selectedAggregateColumns.push(col.name);
    });

    if(selectedAggregateColumns.length === 0){
      toast.error("No aggregates were selected for metric columns!");
      return false;
    }

    if(selectedColumnsWithNoAggregates.length > 0){
      toast.error(`No aggregates were selected for column(s): ${selectedColumnsWithNoAggregates.join(", ")}`);
      return false;
    }
    return true;
  }
  
  const handleOk = () => {
    
    // Get the selected tables from filteredTables
    const selectedTablesData = filteredTables.filter((table) =>
      selectedItems.includes(table.name)
  );
  
  const initialColumns = selectedTablesData.map((table) => ({
    id: table.id,
    name: table.name,
    type: table.type || "varchar",
    dimType: table.dimType,
    alias: "",
    output: true,
    order: "",
    sort: "",
    aggregate: [],
    groupBy: table?.dimType?.toLowerCase() === "dimension",
    isVisible: true,
  }));
  
  // Merge with existing columns if available
  const existingColumns = data.filterConditions?.columns || [];
  const mergedColumns = initialColumns.map((col) => {
    const existing = existingColumns.find((e) => e.name === col.name);
    if (existing) {
      return {
        ...col,
        dimType: existing.dimType || col.dimType,
        alias: existing.alias || col.alias,
        output: existing.output ?? col.output,
        order: existing.order || col.order,
        sort: existing.sort || col.sort,
        aggregate: existing.aggregate || col.aggregate,
        groupBy: existing.groupBy ?? col.groupBy,
        isVisible: existing.isVisible ?? col.isVisible,
        type: existing.type || col.type,
      };
      }
      return col;
    });
    
    if(!validateNodeData(mergedColumns)) return; 

    // Always update the node data with the merged columns
    // Update the node's data with the selected items
    updateNodeData({
      tables: selectedItems,
      fact_id: selectedFact.fact_id,
      fct_name: selectedFact.fct_name,
      selectedFact,
      ruleName: ruleName,
      ruleDescription: ruleDescription,
      filterConditions: {
        ...(data.filterConditions || {}),
        columns: mergedColumns
      }
  });


    setFilterModalColumns(mergedColumns);
    setRuleFilterSelections(mergedColumns);

    // Open the FilterComponent modal
    setIsFilterModalOpen(true);
  };

  const generateSQL = (filterData) => {
    if (!filterData) return "";

    if (filterData.complex_query) {
      return filterData.complex_query;
    }

    if (!filterData.conditions || !Array.isArray(filterData.conditions)) {
      return "";
    }

    const buildGroupSQL = (group) => {
      if (!group.conditions || !Array.isArray(group.conditions)) return "()";

      const conditionsSQL = group.conditions
        .map((condition, index) => {
          const joinType =
            index === 0 ? "" : ` ${condition.joinType || "AND"} `;

          if (condition.type === "condition") {
            if (
              !condition.column ||
              (!condition.value && condition.operator !== "between") ||
              (condition.operator === "between" &&
                (!condition.value || !condition.value2))
            ) {
              return null;
            }

            const columnType =
              condition.conditionType?.toLowerCase() || "varchar";
            const shouldQuote = !["decimal", "double", "integer"].includes(
              columnType
            );

            if (condition.operator === "between") {
              return `${joinType}${condition.column} BETWEEN ${
                shouldQuote ? `'${condition.value}'` : condition.value
              } AND ${
                shouldQuote ? `'${condition.value2}'` : condition.value2
              }`;
            }
            return `${joinType}${condition.column} ${condition.operator} ${
              shouldQuote ? `'${condition.value}'` : condition.value
            }`;
          } else {
            const nestedSQL = buildGroupSQL(condition);
            return nestedSQL ? `${joinType}${nestedSQL}` : null;
          }
        })
        .filter(Boolean);

      return conditionsSQL.length > 0 ? `(${conditionsSQL.join("")})` : null;
    };

    const groupsSQL = filterData.conditions
      .map((group, index) => {
        const groupSQL = buildGroupSQL(group);
        return index === 0
          ? groupSQL
          : groupSQL
          ? `${group.joinType} ${groupSQL}`
          : null;
      })
      .filter(Boolean);

    return groupsSQL.join(" ") || "";
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] w-fit min-w-min max-w-[90vw] relative group grid grid-cols-[repeat(auto-fit,minmax(min-content,1fr))]">
      <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute top-1.5 right-2 p-1"
      >
        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
      </button>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center space-x-3 mb-3">
        <FileSpreadsheet className="w-5 h-5 text-[#8E77BB]" />
        <h3 className="text-black font-medium">Create Rule</h3>
      </div>
      
      {/* Added Rule Name and Description Inputs */}
      <div className="space-y-1.5">
        <div>
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Rule Name
          </label>
          <input
            type="text"
            value={ruleName}
            onChange={(e) => {
              setRuleName(e.target.value);
              updateNodeData({ ruleName: e.target.value });
            }}
            placeholder="Rule Name"
            className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Rule Description
          </label>
          <input
            type="text"
            value={ruleDescription}
            onChange={(e) => {
              setRuleDescription(e.target.value);
              updateNodeData({ ruleDescription: e.target.value });
            }}
            placeholder="Add Description"
            className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
          />
        </div>
      </div>
      
      <div className="space-y-1.5">
        <div>
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Table
          </label>
          {/* <select
            className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            value={selectedFact.fct_name}
            onChange={(e) => {
              const connection = connections.find(
                (c) => c.fct_name === e.target.value
              );
              if (!connection) return;
              const newFact = {
                fact_id: connection.fact_id,
                fct_name: connection.fct_name,
              };
              setSelectedFact(newFact);
              // Persist in node data immediately
              updateNodeData({ selectedFact: newFact });
              setSelectedItems([]);
              setTables([]);
            }}
          >
            <option value="">Select</option>
            {connections.map((connection, idx) => (
              <option key={idx} value={connection.fct_name}>
                {connection.fct_name}
              </option>
            ))}
          </select> */}
          <SearchableSelect 
            options={(() => {
              return connections?.map(connection => ({
                label: connection.fct_name,
                id: connection.fact_id
              }))
            })()}
            placeholder="Select Table"
            onChange={(option) => {
              const connection = connections.find(
                (c) => c.fct_name === option.label
              );
              if (!connection) return;
              const newFact = {
                fact_id: connection.fact_id,
                fct_name: connection.fct_name,
              };
              setSelectedFact(newFact);
              // Persist in node data immediately
              updateNodeData({ selectedFact: newFact });
              setSelectedItems([]);
              setTables([]);
            }}

            value={(() => ({
              label: selectedFact?.fct_name,
              id: selectedFact?.fact_id,
            }))()}
            />

        </div>
      </div>

      {selectedFact.fact_id && (
        <div>
          <div className="flex items-center gap-2 mb-0.5 mt-4">
            <Search size={14} className="text-gray-500" />
            <label className="text-xs font-semibold text-black">Data Set</label>
          </div>
          <input
            type="search"
            placeholder="Search datasets..."
            className="w-full p-2 mb-2 text-xs text-black border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {loading ? (
              <>
                <SkeletonLoader />
                <SkeletonLoader />
                <SkeletonLoader />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="checkbox"
                      id="select-all"
                      className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      checked={selectedItems.length === filteredTables.length}
                      onChange={handleSelectAll}
                    />
                    <label
                      htmlFor="select-all"
                      className="text-xs font-semibold text-black"
                    >
                      Select all
                    </label>
                  </div>
                </div>
                {filteredTables.map((table, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`table-${idx}`}
                        checked={selectedItems.includes(table.name)}
                        onChange={() => handleTableSelection(table.name)}
                        className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <label
                        htmlFor={`table-${idx}`}
                        className="text-xs font-semibold text-black"
                      >
                        {`${table.name} (${table.dimType})`}
                      </label>
                    </div>
                    {table.dimType.toLowerCase() === "metric" && (<button
                      onClick={() => {
                        updateNodeData({ currentSelectedTable: table?.name });

                        let newSelectedItems = selectedItems;

                        if (!selectedItems.includes(table.name)) {
                          newSelectedItems = [...selectedItems, table.name];
                          setSelectedItems(newSelectedItems);
                        }

                        const selectedTables = filteredTables.filter((t) =>
                          newSelectedItems.includes(t.name)
                        );

                        openDrawer(id, selectedTables);

                      }}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>)}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
      <div className="flex space-x-2 mt-4">
        <button
          onClick={handleCancel}
          className="bg-transparent hover:bg-[#8e78b7] text-xs text-gray-700 font-semibold hover:text-white py-2 px-10 border border-gray-700 hover:border-transparent rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleOk}
          className="bg-transparent hover:bg-[#8e78b7] text-xs text-gray-700 font-semibold hover:text-white py-2 px-10 border border-gray-700 hover:border-transparent rounded"
        >
          OK
        </button>
      </div>

      {/* Render FilterComponent Modal */}
      {isFilterModalOpen && (
        <DimensionFilter 
        setIsOpen={setIsFilterModalOpen}
        onApply={() => {
          setIsFilterModalOpen(false);
          setIsTimeTansformationOpen(true);
        }}
        factId={selectedFact.fact_id}
        updateNodeData={updateNodeData}
        nodeData={data}
        />
      )}

      {isTimeTansformationOpen && (
        <TimeTransformationFilter 
        setIsOpen={setIsTimeTansformationOpen}
        onApply={() => {
        }}
        factId={selectedFact.fact_id}
        updateNodeData={updateNodeData}
        nodeData={data}
        />
      )}
    </div>
  );
}

SourceNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.shape({
    onDataChange: PropTypes.func,
    tables: PropTypes.array,
    getNodes: PropTypes.func,
    filterConditions: PropTypes.object,
    ruleName: PropTypes.string,
    ruleDescription: PropTypes.string,
  }),
};

export default SourceNode;