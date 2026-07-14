import React, { useState, useEffect } from "react";
import { useStateContext } from "../context/contextViewProvider";
import { Trash, X } from "lucide-react";
import { Icon } from "@iconify/react"; // Added for toast icons

const getColumnGroupType = (columnType) => {
  if (!columnType) return null;
  const formattedColumnType = columnType.toLowerCase().replace(/\(.*\)/, "");
  let result = null;

  result = ["date", "timestamp"].includes(formattedColumnType)
    ? "DATE"
    : result;
  result = ["decimal", "double", "integer"].includes(formattedColumnType) ? "NUMBER" : result;
  result = ["varchar"].includes(formattedColumnType) ? "STRING" : result;

  return result;
};

const DynamicSelectOptions = ({ condition, updateCondition }) => {
  if (!condition.conditionType) return null;
  let columnGroupType = getColumnGroupType(condition.conditionType);

  if (columnGroupType === "DATE" || columnGroupType === "NUMBER") {
    return (
      <select
        value={condition.operator}
        onChange={(e) => updateCondition("operator", e.target.value)}
        className="border p-2 rounded-md text-sm w-24 bg-white text-black"
      >
        <option value="=">=</option>
        <option value="!=">!=</option>
        <option value=">">{">"}</option>
        <option value="<">{"<"}</option>
        <option value=">=">{"≥"}</option>
        <option value="<=">{"≤"}</option>
        <option value="between">Between</option>
      </select>
    );
  } else if (columnGroupType === "STRING") {
    return (
      <select
        value={condition.operator}
        onChange={(e) => updateCondition("operator", e.target.value)}
        className="border p-2 rounded-md text-sm w-24 bg-white text-black"
      >
        <option value="=">=</option>
        <option value="!=">!=</option>
        <option value="LIKE">LIKE</option>
      </select>
    );
  } else {
    return (
      <select
        value={condition.operator}
        onChange={(e) => updateCondition("operator", e.target.value)}
        className="border p-2 rounded-md text-sm w-24 bg-white text-black"
      >
        <option value="=">=</option>
        <option value="!=">!=</option>
        <option value=">">{">"}</option>
        <option value="<">{"<"}</option>
        <option value=">=">{"≥"}</option>
        <option value="<=">{"≤"}</option>
      </select>
    );
  }
};

const DynamicOptionValues = ({ condition, updateCondition }) => {
  if (!condition.operator) return null;

  let columnType = getColumnGroupType(condition.conditionType);

  if (condition.operator === "between" && columnType === "DATE") {
    return (
      <div className="flex gap-2">
        <input
          type="date"
          name="date"
          value={condition.value || ''}
          onChange={(e) => updateCondition("value", e.target.value)}
          className="border p-2 rounded-md text-sm w-40 bg-white text-black"
          required
        />
        <span className="flex items-center text-gray-500">and</span>
        <input
          type="date"
          name="date"
          value={condition.value2 || ''}
          onChange={(e) => updateCondition("value2", e.target.value)}
          className="border p-2 rounded-md text-sm w-40 bg-white text-black"
          required
        />
      </div>
    );
  }
  if (columnType === "DATE") {
    return (
      <div className="flex gap-2">
        <input
          type="date"
          name="date"
          value={condition.value || ''}
          onChange={(e) => updateCondition("value", e.target.value)}
          className="border p-2 rounded-md text-sm w-40 bg-white text-black"
          required
        />
      </div>
    );
  }
  if (condition.operator === "between" && columnType === "NUMBER") {
    return (
      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Value"
          value={condition.value || ''}
          onChange={(e) => updateCondition("value", e.target.value)}
          className="border p-2 rounded-md text-sm w-32 bg-white text-black"
          required
        />
        <span className="text-gray-500">and</span>
        <input
          type="text"
          placeholder="Value"
          value={condition.value2 || ''}
          onChange={(e) => updateCondition("value2", e.target.value)}
          className="border p-2 rounded-md text-sm w-32 bg-white text-black"
          required
        />
      </div>
    );
  }

  return (
    <input
      type="text"
      placeholder={condition.operator === "like" ? "Wildcard (%value%)" : "Value"}
      value={condition.value || ''}
      onChange={(e) => updateCondition("value", e.target.value)}
      className="border p-2 rounded-md text-sm w-40 bg-white text-black"
      required
    />
  );
};

const FilterComponent = ({ setIsOpen, columns, onApply }) => {
  const { userSelections, finalPayload } = useStateContext();
  const getInitialFilterData = () => {
    if (finalPayload?.view_type === "Integrated View") {
      return finalPayload?.filter_data;
    } else {
      return userSelections?.get("apiPayload")?.filter_data;
    }
  };

  const [useComplexFilter, setUseComplexFilter] = useState(() => {
    const filterData = getInitialFilterData();
    return filterData && !Array.isArray(filterData) && filterData.complex_query ? true : false;
  });
  
  const [complexFilterQuery, setComplexFilterQuery] = useState(() => {
    const filterData = getInitialFilterData();
    return filterData && !Array.isArray(filterData) && filterData.complex_query ? filterData.complex_query : '';
  });

  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const [filterGroups, setFilterGroups] = useState(() => {
    const filterData = getInitialFilterData();
    return Array.isArray(filterData) ? filterData : [{
      id: Date.now(),
      joinType: 'AND',
      conditions: [{
        id: Date.now() + 1,
        type: 'condition',
        column: '',
        operator: '=',
        value: '',
        value2: null,
        joinType: 'AND'
      }],
      depth: 0
    }];
  });

  const [newGroupType, setNewGroupType] = useState('OR');

  useEffect(() => {
    const filterData = getInitialFilterData();
    if (filterData && !Array.isArray(filterData) && filterData.complex_query) {
      setUseComplexFilter(true);
      setComplexFilterQuery(filterData.complex_query);
      setFilterGroups([{
        id: Date.now(),
        joinType: 'AND',
        conditions: [{
          id: Date.now() + 1,
          type: 'condition',
          column: '',
          operator: '=',
          value: '',
          value2: null,
          joinType: 'AND'
        }],
        depth: 0
      }]);
    } else {
      setUseComplexFilter(false);
      setComplexFilterQuery('');
      setFilterGroups(Array.isArray(filterData) ? filterData : [{
        id: Date.now(),
        joinType: 'AND',
        conditions: [{
          id: Date.now() + 1,
          type: 'condition',
          column: '',
          operator: '=',
          value: '',
          value2: null,
          joinType: 'AND'
        }],
        depth: 0
      }]);
    }
  }, [userSelections, finalPayload]);

  const validateFilters = () => {
    const errors = [];

    const validateGroup = (group, path = '') => {
      if (!group.conditions || group.conditions.length === 0) {
        errors.push(`Group ${path} has no conditions`);
        return;
      }

      group.conditions.forEach((condition, index) => {
        const currentPath = path ? `${path}.${index + 1}` : `Group ${index + 1}`;

        if (condition.type === 'condition') {
          if (!condition.column) {
            errors.push(`Column is required in ${currentPath}`);
          }
          if (!condition.value && condition.operator !== 'between') {
            errors.push(`Value is required in ${currentPath}`);
          }
          if (condition.operator === 'between' && (!condition.value || !condition.value2)) {
            errors.push(`Both values are required for BETWEEN in ${currentPath}`);
          }
        } else {
          validateGroup(condition, currentPath);
        }
      });
    };

    filterGroups.forEach((group, index) => {
      validateGroup(group, `Group ${index + 1}`);
    });

    if (errors.length > 0) {
      errors.forEach(error => {
        setToast({
          show: true,
          message: error,
          type: "error",
        });
        setTimeout(() => {
          setToast({ show: false, message: "", type: "" });
        }, 5000);
      });
      return false;
    }
    return true;
  };

  const addNewGroup = (parentGroupId = null, joinType = newGroupType) => {
    const newGroup = {
      id: Date.now(),
      joinType: 'AND',
      conditions: [
        {
          id: Date.now() + 1,
          type: 'condition',
          column: '',
          operator: '=',
          value: '',
          value2: null
        }
      ],
      depth: parentGroupId ? 1 : 0
    };

    if (parentGroupId) {
      setFilterGroups(prevGroups => {
        const updateGroups = (groups, currentDepth = 0) => {
          return groups.map(group => {
            if (group.id === parentGroupId) {
              const newDepth = (group.depth || 0) + 1;
              return {
                ...group,
                conditions: [
                  ...(group.conditions || []),
                  {
                    id: Date.now() + 2,
                    type: 'group',
                    ...newGroup,
                    depth: newDepth
                  }
                ]
              };
            }

            if (group.conditions && Array.isArray(group.conditions)) {
              return {
                ...group,
                conditions: updateGroups(group.conditions, group.depth || 0)
              };
            }
            return group;
          });
        };

        return updateGroups(prevGroups);
      });
    } else {
      setFilterGroups(prevGroups => [
        ...prevGroups,
        {
          ...newGroup,
          joinType: joinType,
          depth: 0
        }
      ]);
    }
  };

  const addNewCondition = (groupId) => {
    setFilterGroups(prevGroups => {
      const updateGroups = (groups) => {
        return groups.map(group => {
          if (group.id === groupId) {
            return {
              ...group,
              conditions: [
                ...(group.conditions || []),
                {
                  id: Date.now(),
                  type: 'condition',
                  column: '',
                  operator: '=',
                  value: '',
                  value2: null,
                  joinType: 'AND'
                }
              ]
            };
          }

          if (group.conditions && Array.isArray(group.conditions)) {
            return {
              ...group,
              conditions: updateGroups(group.conditions)
            };
          }
          return group;
        });
      };

      return updateGroups(prevGroups);
    });
  };

  const removeItem = (groupId, conditionId) => {
    setFilterGroups(prevGroups => {
      if (!groupId) {
        return prevGroups.filter(group => group.id !== conditionId);
      }

      const updateGroups = (groups) => {
        return groups.map(group => {
          if (group.id === groupId) {
            const newConditions = (group.conditions || []).filter(
              condition => condition.id !== conditionId
            );

            if (newConditions.length === 0 && group.conditions.length > 0) {
              newConditions.push({
                id: Date.now(),
                type: 'condition',
                column: '',
                operator: '=',
                value: '',
                value2: null
              });
            }

            return {
              ...group,
              conditions: newConditions
            };
          }

          if (group.conditions && Array.isArray(group.conditions)) {
            return {
              ...group,
              conditions: updateGroups(group.conditions)
            };
          }
          return group;
        });
      };

      return updateGroups(prevGroups);
    });
  };

  const updateCondition = (groupId, conditionId, field, value) => {
    setFilterGroups(prevGroups => {
      const updateGroups = (groups) => {
        return groups.map(group => {
          if (group.id === groupId) {
            return {
              ...group,
              conditions: (group.conditions || []).map(condition => {
                if (condition.id === conditionId) {
                  if (field === 'column') {
                    const column = columns.find(col => col.name === value);
                    return {
                      ...condition,
                      [field]: value,
                      operator: '=',
                      value: '',
                      value2: null,
                      conditionType: column ? column.type : null
                    };
                  }
                  return { ...condition, [field]: value };
                }
                return condition;
              })
            };
          }

          if (group.conditions && Array.isArray(group.conditions)) {
            return {
              ...group,
              conditions: updateGroups(group.conditions)
            };
          }
          return group;
        });
      };

      return updateGroups(prevGroups);
    });
  };

  const updateConditionJoinType = (groupId, conditionId, joinType) => {
    setFilterGroups(prevGroups => {
      const updateGroups = (groups) => {
        return groups.map(group => {
          if (group.id === groupId) {
            return {
              ...group,
              conditions: (group.conditions || []).map(condition => {
                if (condition.id === conditionId) {
                  return {
                    ...condition,
                    joinType: joinType || 'AND'
                  };
                }
                return condition;
              })
            };
          }

          if (group.conditions && Array.isArray(group.conditions)) {
            return {
              ...group,
              conditions: updateGroups(group.conditions)
            };
          }
          return group;
        });
      };

      return updateGroups(prevGroups);
    });
  };

  const updateGroupJoinType = (groupId, joinType) => {
    setFilterGroups(prevGroups => {
      const updateGroups = (groups) => {
        return groups.map(group => {
          if (group.id === groupId) {
            return { ...group, joinType };
          }

          if (group.conditions && Array.isArray(group.conditions)) {
            return {
              ...group,
              conditions: updateGroups(group.conditions)
            };
          }
          return group;
        });
      };

      return updateGroups(prevGroups);
    });
  };

  const updateBetweenGroupsJoinType = (index, joinType) => {
    if (index > 0) {
      setFilterGroups(prevGroups => {
        const newGroups = [...prevGroups];
        newGroups[index].joinType = joinType;
        return newGroups;
      });
    }
  };

  const generateSQL = () => {
    if (useComplexFilter) {
      return complexFilterQuery || "Enter your custom WHERE condition above";
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

            const columnType = getColumnGroupType(condition.conditionType);
            const shouldQuote = columnType !== 'NUMBER';

            if (condition.operator === 'between') {
              return `${joinType}${condition.column} BETWEEN ${shouldQuote ? `'${condition.value}'` : condition.value
                } AND ${shouldQuote ? `'${condition.value2}'` : condition.value2
                }`;
            }
            return `${joinType}${condition.column} ${condition.operator} ${shouldQuote ? `'${condition.value}'` : condition.value
              }`;
          } else {
            const nestedSQL = buildGroupSQL(condition);
            return nestedSQL ? `${joinType}${nestedSQL}` : null;
          }
        })
        .filter(Boolean);

      return conditionsSQL.length > 0 ? `(${conditionsSQL.join('')})` : null;
    };

    const groupsSQL = filterGroups
      .map((group, index) => {
        const groupSQL = buildGroupSQL(group);
        return index === 0 ? groupSQL : groupSQL ? `${group.joinType} ${groupSQL}` : null;
      })
      .filter(Boolean);

    return groupsSQL.join(' ') || 'No valid conditions to generate SQL';
  };

  const convertToFlatConditions = () => {
    return Array.isArray(filterGroups) ? filterGroups : [];
  };

  const cloneGroup = (groupToClone) => {
    const newId = Date.now();

    const cloneConditions = (conditions) => {
      return conditions.map(condition => {
        if (condition.type === 'condition') {
          return {
            ...condition,
            id: Date.now() + Math.floor(Math.random() * 1000),
          };
        } else {
          return {
            ...condition,
            id: Date.now() + Math.floor(Math.random() * 1000),
            conditions: cloneConditions(condition.conditions || []),
          };
        }
      });
    };

    return {
      ...groupToClone,
      id: newId,
      conditions: cloneConditions(groupToClone.conditions || []),
    };
  };

  const addClonedGroup = (parentGroupId, groupToClone) => {
    const clonedGroup = cloneGroup(groupToClone);

    setFilterGroups(prevGroups => {
      const updateGroups = (groups) => {
        return groups.map(group => {
          if (group.id === parentGroupId) {
            return {
              ...group,
              conditions: [
                ...(group.conditions || []),
                clonedGroup
              ]
            };
          }

          if (group.conditions && Array.isArray(group.conditions)) {
            return {
              ...group,
              conditions: updateGroups(group.conditions)
            };
          }
          return group;
        });
      };

      if (!parentGroupId) {
        return [...prevGroups, clonedGroup];
      }

      return updateGroups(prevGroups);
    });
  };

  const handleApplyFilters = () => {
    if (useComplexFilter) {
      if (!complexFilterQuery.trim()) {
        setToast({
          show: true,
          message: "Please enter a valid SQL WHERE condition",
          type: "error",
        });
        setTimeout(() => {
          setToast({ show: false, message: "", type: "" });
        }, 5000);
        return;
      }
      onApply(null, { complex_query: complexFilterQuery });
    } else {
      if (validateFilters()) {
        onApply(null, convertToFlatConditions());
      }
    }
  };

  const renderConditions = (conditions, parentGroupId, parentDepth = 0) => {
    if (!conditions || !Array.isArray(conditions)) return null;

    return (
      <div className={`pl-4 ${parentDepth > 0 ? 'border-l-2 border-gray-200' : ''} space-y-3`}>
        {conditions.map((condition, index) => (
          <div key={condition.id} className="flex items-start gap-2">
            {index !== 0 && (
              <div className="flex items-center h-10">
                <select
                  value={condition.joinType || 'AND'}
                  onChange={e => updateConditionJoinType(parentGroupId, condition.id, e.target.value)}
                  className="border rounded px-2 py-1 text-xs bg-white text-black"
                >
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                </select>
              </div>
            )}

            {condition.type === 'condition' ? (
              <div className="flex items-center gap-2 flex-1 bg-gray-50 p-2 rounded-lg">
                <select
                  value={condition.column}
                  onChange={e => updateCondition(parentGroupId, condition.id, 'column', e.target.value)}
                  className="border rounded px-2 py-1 text-sm flex-1 max-w-[180px] bg-white text-black"
                  required
                >
                  <option value="">Select Column</option>
                  {columns.map((column, colIndex) => (
                    <option key={colIndex} value={column.name}>
                      {column.name}
                    </option>
                  ))}
                </select>

                <DynamicSelectOptions
                  condition={condition}
                  updateCondition={(field, value) => updateCondition(parentGroupId, condition.id, field, value)}
                />

                <DynamicOptionValues
                  condition={condition}
                  updateCondition={(field, value) => updateCondition(parentGroupId, condition.id, field, value)}
                />

                <button
                  onClick={() => removeItem(parentGroupId, condition.id)}
                  className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex-1 border rounded-lg p-3 space-y-3 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-600">
                      Group
                    </span>
                    {index > 0 && (
                      <select
                        value={condition.joinType || 'AND'}
                        onChange={e => updateGroupJoinType(condition.id, e.target.value)}
                        className="border rounded px-2 py-0.5 text-xs bg-white text-black"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addNewCondition(condition.id)}
                      className="text-xs px-2 py-1 bg-[#8E77BB] text-white rounded hover:bg-opacity-90"
                    >
                      + Condition
                    </button>
                    {(condition.depth || 0) < 3 && (
                      <button
                        onClick={() => addNewGroup(condition.id)}
                        className="text-xs px-2 py-1 bg-[#8E77BB] text-white rounded hover:bg-opacity-90"
                      >
                        + Nested Group
                      </button>
                    )}
                    <button
                      onClick={() => addClonedGroup(parentGroupId, condition)}
                      className="text-xs px-2 py-1 bg-[#8E77BB] text-white rounded hover:bg-opacity-90"
                    >
                      Clone Group
                    </button>
                    <button
                      onClick={() => removeItem(parentGroupId, condition.id)}
                      className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {renderConditions(
                  condition.conditions,
                  condition.id,
                  condition.depth || 0
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[95vw] max-w-[1400px] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-3 pl-6 border-b flex justify-between items-center bg-[#282F49] text-white rounded-t-lg">
          <h2 className="text-xl font-semibold">Filter</h2>
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsOpen(false);
            }}
            className="p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-black">Advanced SQL Mode</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={useComplexFilter}
                  onChange={() => setUseComplexFilter(!useComplexFilter)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8E77BB]"></div>
              </label>
            </div>
          </div>

          {useComplexFilter ? (
            <div className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter SQL WHERE Condition
                </label>
                <textarea
                  value={complexFilterQuery}
                  onChange={(e) => setComplexFilterQuery(e.target.value)}
                  placeholder="e.g. status = 'active' AND (created_at > '2023-01-01' OR customer_type = 'premium')"
                  className="w-full border rounded-md p-2 h-32 text-sm font-mono text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a valid SQL WHERE condition (without the WHERE keyword)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(filterGroups) && filterGroups.map((group, index) => (
                <div key={group.id} className="space-y-4">
                  {index > 0 && (
                    <div className="flex items-center justify-center">
                      <select
                        value={group.joinType}
                        onChange={(e) => updateBetweenGroupsJoinType(index, e.target.value)}
                        className="border rounded px-2 py-1 text-sm text-black"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    </div>
                  )}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-700 text-sm">
                        {index === 0 ? 'Main Group' : `Group ${index + 1}`}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => addClonedGroup(null, group)}
                          className="bg-[#8E77BB] text-white rounded hover:bg-opacity-9 text-sm px-2.5 py-1"
                        >
                          Clone Group
                        </button>
                        <button
                          onClick={() => addNewCondition(group.id)}
                          className="bg-[#8E77BB] text-white rounded hover:bg-opacity-9 text-sm px-2.5 py-1"
                        >
                          + Condition
                        </button>
                        {(group.depth || 0) < 3 && (
                          <button
                            onClick={() => addNewGroup(group.id)}
                            className="bg-[#8E77BB] text-white rounded hover:bg-opacity-9 text-sm px-2.5 py-1"
                          >
                            + Nested
                          </button>
                        )}
                        {filterGroups.length > 1 && (
                          <button
                            onClick={() => removeItem(null, group.id)}
                            className="text-sm px-2 py-0.5 bg-red-50 text-red-600 rounded hover:bg-red-100"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {renderConditions(group.conditions, group.id, group.depth || 0)}
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2">
                <select
                  value={newGroupType}
                  onChange={(e) => setNewGroupType(e.target.value)}
                  className="border rounded px-2 py-1 text-sm text-black"
                >
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                </select>
                <button
                  onClick={() => addNewGroup()}
                  className="bg-[#8E77BB] text-white rounded hover:bg-opacity-90 text-sm flex items-center gap-1 px-2 py-1"
                >
                  <span>+</span>
                  <span>Add New Group</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="font-medium text-gray-700 mb-2 text-sm">Generated SQL Preview:</h3>
            <div className="bg-gray-100 p-3 rounded text-sm overflow-x-auto font-mono text-black">
              {generateSQL() || <span className="text-gray-500">Your SQL query will appear here</span>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-3">
          <button
            onClick={() => onApply(null, null)}
            className="px-4 py-2 bg-[#8E77BB] text-white rounded hover:bg-opacity-90 text-sm"
          >
            Skip
          </button>
          <button
            onClick={() => {
              setFilterGroups([{
                id: Date.now(),
                joinType: 'AND',
                conditions: [{
                  id: Date.now() + 1,
                  type: 'condition',
                  column: '',
                  operator: '=',
                  value: '',
                  value2: null
                }],
                depth: 0
              }]);
              setComplexFilterQuery('');
            }}
            className="px-4 py-2 border rounded hover:bg-gray-50 text-sm text-black"
          >
            Clear All
          </button>
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-[#8E77BB] text-white rounded hover:bg-opacity-90 text-sm"
          >
            Apply Filters
          </button>
        </div>

        {/* Custom Toast */}
        {toast.show && (
          <div
            className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn ${toast.type === "success"
                ? "bg-green-100 text-green-800 border-l-4 border-green-500"
                : "bg-red-100 text-red-800 border-l-4 border-red-500"
              }`}
          >
            <Icon
              icon={toast.type === "success" ? "mdi:check-circle" : "mdi:alert-circle"}
              className="h-5 w-5"
            />
            <p>{toast.message}</p>
            <button
              onClick={() => setToast({ show: false, message: "", type: "" })}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterComponent;