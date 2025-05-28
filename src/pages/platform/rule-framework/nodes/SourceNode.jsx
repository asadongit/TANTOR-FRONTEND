import React, { useState, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import { Handle, Position } from "reactflow";
import { Upload, X, Search, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";
import { useTableContext } from "../../react-flow/context/TableContext";
import FilterComponent from "../../Federation/components/FilterComponent";
import { ContextViewProvider } from "../../Federation/context/contextViewProvider";
import { generateSQLQuery } from "../../../../services/sqlQueryService";
import RuleSummary from "../../rule-framework/RuleSummary";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFact, setSelectedFact] = useState({
    fact_id: "",
    fct_name: "",
  });
  const { openDrawer } = useTableContext();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isRuleSummaryOpen, setIsRuleSummaryOpen] = useState(false);
  const [filterModalColumns, setFilterModalColumns] = useState([]);
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [ruleFilterSelections, setRuleFilterSelections] = useState([]);


  const updateNodeData = (partialData) => {
    if (data.onDataChange) {
      data.onDataChange({
        fact_id: selectedFact.fact_id,
        fct_name: selectedFact.fct_name,
        tables: selectedItems,
        ...partialData,
      });
    }
  };

  const fetchOptions = useCallback(async () => {
    try {
      const response = await fetch(`${hostnameV1}/selectSubject`, {
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
            `${hostnameV1}/selectMatric?fact_id=${fact_id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (!response.ok) throw new Error("Failed to fetch tables");
          const tableDetails = await response.json();
          sessionStorage.setItem(cacheKey, JSON.stringify(tableDetails));
          setTables(tableDetails);
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

  const filteredTables = tables.filter((table) =>
    table.matric_name.toLowerCase().includes(searchTerm?.toLowerCase() || "")
  );

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      setSelectedItems(filteredTables.map((table) => table.matric_name));
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

  const handleOk = () => {
    // Update the node's data with the selected items
    updateNodeData({
      tables: selectedItems,
      fact_id: selectedFact.fact_id,
      fct_name: selectedFact.fct_name,
    });

    // Get the selected tables from filteredTables
    const selectedTablesData = filteredTables.filter(table => 
      selectedItems.includes(table.matric_name)
    );

    // Transform tables into columns format expected by FilterComponent
    const initialColumns = selectedTablesData.map((table) => ({
      name: table.matric_name,
      type: table.type || "varchar",
      alias: "",
      output: true,
      order: "",
      sort: "",
      aggregate: "",
      groupBy: false,
      isVisible: true
    }));

    // If we have existing column settings, merge them with the initial columns
    const existingColumns = data.filterConditions?.columns || [];
    const mergedColumns = initialColumns.map(col => {
      const existing = existingColumns.find(e => e.name === col.name);
      if (existing) {
        return {
          ...col,
          alias: existing.alias || col.alias,
          output: existing.output ?? col.output,
          order: existing.order || col.order,
          sort: existing.sort || col.sort,
          aggregate: existing.aggregate || col.aggregate,
          groupBy: existing.groupBy ?? col.groupBy,
          isVisible: existing.isVisible ?? col.isVisible,
          type: existing.type || col.type
        };
      }
      return col;
    });

    console.log('Initial columns with merged properties:', mergedColumns);

    // Update both filter modal columns and rule filter selections
    setFilterModalColumns(mergedColumns);
    setRuleFilterSelections(mergedColumns);

    // Open the FilterComponent modal
    setIsFilterModalOpen(true);
  };

  const updateSQLQuery = useCallback(() => {
    // Format columns with their properties
    const formattedColumns = ruleFilterSelections.map(col => {
      let columnExpression = col.name;
      
      // Apply aggregate function if specified
      if (col.aggregate && col.aggregate !== 'NONE') {
        columnExpression = `${col.aggregate}(${columnExpression})`;
      }
      
      // Apply alias if specified
      if (col.alias && col.alias.trim()) {
        columnExpression = `${columnExpression} AS "${col.alias.trim()}"`;
      }
      
      return {
        name: columnExpression,
        type: col.type || 'varchar',
        output: typeof col.output === 'boolean' ? col.output : true,
        order: col.order || '',
        sort: col.sort || '',
        groupBy: typeof col.groupBy === 'boolean' ? col.groupBy : false,
        isVisible: typeof col.isVisible === 'boolean' ? col.isVisible : true
      };
    });

    // Get filter conditions from node data
    const filterData = data.filterConditions || {};

    const query = generateSQLQuery({
      tableName: selectedFact.fct_name,
      selectedColumns: formattedColumns.filter(col => col.output),
      filterConditions: filterData,
      ruleData: data.getNodes?.()?.find(node => node.type === 'define')?.data
    });

    setGeneratedQuery(query);
  }, [selectedFact.fct_name, ruleFilterSelections, data.filterConditions, data.getNodes]);

  useEffect(() => {
    if (selectedFact.fct_name && ruleFilterSelections.length > 0) {
      updateSQLQuery();
    }
  }, [updateSQLQuery, selectedFact.fct_name, ruleFilterSelections]);

  const generateSQL = (filterData) => {
    if (!filterData) return '';
    
    if (filterData.complex_query) {
      return filterData.complex_query;
    }

    if (!filterData.conditions || !Array.isArray(filterData.conditions)) {
      return '';
    }

    const buildGroupSQL = (group) => {
      if (!group.conditions || !Array.isArray(group.conditions)) return '()';

      const conditionsSQL = group.conditions
        .map((condition, index) => {
          const joinType = index === 0 ? '' : ` ${condition.joinType || 'AND'} `;

          if (condition.type === 'condition') {
            if (!condition.column || (!condition.value && condition.operator !== 'between') ||
              (condition.operator === 'between' && (!condition.value || !condition.value2))) {
              return null;
            }

            const columnType = condition.conditionType?.toLowerCase() || 'varchar';
            const shouldQuote = !['decimal', 'double', 'integer'].includes(columnType);

            if (condition.operator === 'between') {
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

      return conditionsSQL.length > 0 ? `(${conditionsSQL.join('')})` : null;
    };

    const groupsSQL = filterData.conditions
      .map((group, index) => {
        const groupSQL = buildGroupSQL(group);
        return index === 0 ? groupSQL : groupSQL ? `${group.joinType} ${groupSQL}` : null;
      })
      .filter(Boolean);

    return groupsSQL.join(' ') || '';
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
        <Upload className="w-5 h-5 text-[#96CF7B]" />
        <h3 className="text-black font-medium">Source</h3>
      </div>
      <div className="space-y-1.5">
        <div>
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Table
          </label>
          <select
            className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            value={selectedFact.fct_name}
            onChange={(e) => {
              const connection = connections.find(
                (c) => c.fct_name === e.target.value
              );
              if (!connection) return;
              setSelectedFact({
                fact_id: connection.fact_id,
                fct_name: connection.fct_name,
              });
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
          </select>
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
                        checked={selectedItems.includes(table.matric_name)}
                        onChange={() => handleTableSelection(table.matric_name)}
                        className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <label
                        htmlFor={`table-${idx}`}
                        className="text-xs font-semibold text-black"
                      >
                        {table.matric_name}
                      </label>
                    </div>
                    <button
                      onClick={() => {
                        const selectedTables = filteredTables.filter((t) =>
                          selectedItems.includes(t.matric_name)
                        );
                        openDrawer(id, selectedTables);
                      }}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
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
        <ContextViewProvider>
          <FilterComponent
            setIsOpen={setIsFilterModalOpen}
            columns={filterModalColumns}
            onApply={(error, filterData) => {
              setIsFilterModalOpen(false);
              
              // Handle skip case (when both error and filterData are null)
              if (error === null && filterData === null) {
                // Update node data with empty filter conditions
                updateNodeData({
                  filterConditions: { conditions: [] },
                  selectedColumns: filterModalColumns
                });
                
                // Show rule summary without filters
                setIsRuleSummaryOpen(true);
                return;
              }

              if (!error && filterData) {
                console.log('Filter data received:', filterData);
                
                // Handle filter conditions
                let conditions;
                if (Array.isArray(filterData)) {
                  conditions = { conditions: filterData };
                } else if (filterData.complex_query) {
                  conditions = { complex_query: filterData.complex_query };
                } else {
                  conditions = { conditions: [] };
                }

                // Generate SQL preview
                const sqlPreview = generateSQL(conditions);

                // Update column properties from the filter component
                const updatedColumns = filterModalColumns.map(column => {
                  const filterColumn = filterData.columns?.find(fc => fc.name === column.name);
                  
                  return {
                    ...column,
                    alias: filterColumn?.alias || column.alias || '',
                    output: filterColumn?.output ?? column.output ?? true,
                    order: filterColumn?.order || column.order || '',
                    sort: filterColumn?.sort || column.sort || '',
                    aggregate: filterColumn?.aggregate || column.aggregate || '',
                    groupBy: filterColumn?.groupBy ?? column.groupBy ?? false,
                    isVisible: filterColumn?.isVisible ?? column.isVisible ?? true,
                    type: filterColumn?.type || column.type || 'varchar'
                  };
                });

                console.log('Updated columns with properties:', updatedColumns);
                
                setRuleFilterSelections(updatedColumns);
                setFilterModalColumns(updatedColumns);

                // Store filter conditions and column properties in node data
                const updatedFilterData = {
                  ...conditions,
                  sqlPreview,
                  columns: updatedColumns
                };

                // Update node data with filter conditions
                updateNodeData({
                  filterConditions: updatedFilterData,
                  selectedColumns: updatedColumns
                });

                // Update the SQL query
                updateSQLQuery();
                
                // Show rule summary after filters are applied
                setIsRuleSummaryOpen(true);
              }
            }}
          />
        </ContextViewProvider>
      )}

      {/* Render Rule Summary Modal */}
      {isRuleSummaryOpen && (
        <ContextViewProvider>
          <RuleSummary
            setIsOpen={setIsRuleSummaryOpen}
            selectedFact={selectedFact}
            tables={filterModalColumns}
            filterData={data.filterConditions}
            previewData={generatedQuery}
          />
        </ContextViewProvider>
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
    filterConditions: PropTypes.object
  })
};

export default SourceNode;