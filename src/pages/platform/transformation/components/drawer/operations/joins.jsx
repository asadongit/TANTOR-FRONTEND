import React, { useState, useEffect } from "react";
import { ChevronDown, X, Plus } from "lucide-react";
import Select from "react-select";

const JOIN_TYPES = [
    { id: "left", name: "Left Join" },
    { id: "right", name: "Right Join" },
    { id: "inner", name: "Inner Join" },
    // { id: "full", name: "Full Join" },
];

const JOIN_CONDITIONS = [
    { id: "==", name: "Equal (==)" },
    { id: "!=", name: "Not Equal (!=)" },
    { id: "<", name: "Less Than (<)" },
    { id: "<=", name: "Less Than or Equal (<=)" },
    { id: ">", name: "Greater Than (>)" },
    { id: ">=", name: "Greater Than or Equal (>=)" },
];

const LOGICAL_OPERATORS = [
    { id: "&", name: "AND" },
    { id: "|", name: "OR" }
];

export const JoinsOperationFields = ({
    transformation,
    allDataframes,
    dataframeColumns,
    dropdownRefs,
    openDropdowns,
    toggleDropdown,
    updateJoinsParam,
    appendColumnsFromRightToLeft
}) => {
    const [joinConditions, setJoinConditions] = useState([
        {
            leftDataframe: "",
            leftColumn: "",
            condition: "==",
            rightDataframe: "",
            rightColumn: "",
            logicalOperator: "&" // For conditions after the first one
        }
    ]);
    // Add state to track original source columns - captured once when source is selected
    const [originalSourceColumnsForDropdown, setOriginalSourceColumnsForDropdown] = useState({});
    const [originalRightColumnsForDropdown, setOriginalRightColumnsForDropdown] = useState({});
    // Add state to track dropped columns
    const [droppedLeftColumns, setDroppedLeftColumns] = useState([]);
    const [droppedRightColumns, setDroppedRightColumns] = useState([]);

    // Add new state variables for tracking original columns for joins transformation
    const [originalLeftColumns, setOriginalLeftColumns] = useState([]);
    const [originalRightColumns, setOriginalRightColumns] = useState([]);
    const [filteredLeftColumns, setFilteredLeftColumns] = useState([]);
    const [filteredRightColumns, setFilteredRightColumns] = useState([]);

    useEffect(() => {
        if (!transformation.params.join_type) {
            updateJoinsParam(transformation.id, "join_type", "left");
        }

        if (!transformation.params.join_condition) {
            updateJoinsParam(transformation.id, "join_condition", "");
        }

        if (!transformation.params.drop_left_dataframe_collist) {
            updateJoinsParam(transformation.id, "drop_left_dataframe_collist", []);
        }

        if (!transformation.params.drop_right_dataframe_collist) {
            updateJoinsParam(transformation.id, "drop_right_dataframe_collist", []);
        }
    }, []);

    useEffect(() => {
        if (transformation.params.join_condition && transformation.source_dataframe && transformation.params.right_dataframe) {
            try {
                const conditionStr = transformation.params.join_condition;

                const cleanCondition = conditionStr.replace(/^\(|\)$/g, '');

                const parts = cleanCondition.split(/(\s*[&|]\s*)/);
                const conditions = [];

                for (let i = 0; i < parts.length; i += 2) {
                    const conditionPart = parts[i].trim();
                    const logicalOp = parts[i + 1] ? parts[i + 1].trim() : "&";

                    const condParts = conditionPart.replace(/[()]/g, '').split(/\s*(<=|>=|==|!=|<|>)\s*/);
                    // const condParts = conditionPart.replace(/[()]/g, '').split(/\s*(==|!=|<|<=|>|>=)\s*/);

                    if (condParts.length >= 3) {
                        const leftPart = condParts[0].trim();
                        const operator = condParts[1].trim();
                        const rightPart = condParts[2].trim();

                        const [leftDataframe, leftColumn] = leftPart.split('.');
                        const [rightDataframe, rightColumn] = rightPart.split('.');

                        if (leftDataframe && leftColumn && rightDataframe && rightColumn) {
                            conditions.push({
                                leftDataframe,
                                leftColumn,
                                condition: operator,
                                rightDataframe,
                                rightColumn,
                                logicalOperator: logicalOp
                            });
                        }
                    }
                }

                if (conditions.length > 0) {
                    setJoinConditions(conditions);
                } else {
                    setJoinConditions([{
                        leftDataframe: transformation.source_dataframe,
                        leftColumn: "",
                        condition: "==",
                        rightDataframe: transformation.params.right_dataframe,
                        rightColumn: "",
                        logicalOperator: "&"
                    }]);
                }
            } catch (error) {
                console.error("Error parsing join condition:", error);
                setJoinConditions([{
                    leftDataframe: transformation.source_dataframe,
                    leftColumn: "",
                    condition: "==",
                    rightDataframe: transformation.params.right_dataframe,
                    rightColumn: "",
                    logicalOperator: "&"
                }]);
            }
        } else {
            setJoinConditions([{
                leftDataframe: transformation.source_dataframe || "",
                leftColumn: "",
                condition: "==",
                rightDataframe: transformation.params.right_dataframe || "",
                rightColumn: "",
                logicalOperator: "&"
            }]);
        }
    }, [transformation.params.join_condition, transformation.source_dataframe, transformation.params.right_dataframe]);

    const handleSourceDataframeChange = (e) => {
        const newSourceDf = e.target.value;
        updateJoinsParam(transformation.id, "source_dataframe", newSourceDf);

        setJoinConditions([{
            ...joinConditions[0],
            leftDataframe: newSourceDf,
            leftColumn: "",
        }]);
        updateJoinsParam(transformation.id, "join_condition", "");
    };

    // Capture original left columns when source dataframe is selected
    useEffect(() => {
        if (transformation.source_dataframe && dataframeColumns[transformation.source_dataframe]) {
            const sourceColumns = dataframeColumns[transformation.source_dataframe].map(col =>
                typeof col === "object" && col !== null ? col : { name: col, datatype: "string" }
            );

            setOriginalLeftColumns(sourceColumns);
            setFilteredLeftColumns(sourceColumns);

            // Only set if not already captured for this dataframe
            setOriginalSourceColumnsForDropdown(prev => {
                if (!prev[transformation.source_dataframe]) {
                    return {
                        ...prev,
                        [transformation.source_dataframe]: sourceColumns.map(col => col.name)
                    };
                }
                return prev;
            });
        }
    }, [transformation.source_dataframe, dataframeColumns]);

    // Capture original right columns when right dataframe is selected
    useEffect(() => {
        if (transformation.params.right_dataframe && dataframeColumns[transformation.params.right_dataframe]) {
            const rightColumns = dataframeColumns[transformation.params.right_dataframe].map(col =>
                typeof col === "object" && col !== null ? col : { name: col, datatype: "string" }
            );

            setOriginalRightColumns(rightColumns);
            setFilteredRightColumns(rightColumns);

            // Only set if not already captured for this dataframe
            setOriginalRightColumnsForDropdown(prev => {
                if (!prev[transformation.params.right_dataframe]) {
                    return {
                        ...prev,
                        [transformation.params.right_dataframe]: rightColumns.map(col => col.name)
                    };
                }
                return prev;
            });
        }
    }, [transformation.params.right_dataframe, dataframeColumns]);

    const handleRightDataframeChange = (e) => {
        const newRightDf = e.target.value;
        updateJoinsParam(transformation.id, "right_dataframe", newRightDf);

        setJoinConditions([{
            ...joinConditions[0],
            rightDataframe: newRightDf,
            rightColumn: "",
        }]);
        updateJoinsParam(transformation.id, "join_condition", "");

        setDroppedRightColumns([]);
        updateJoinsParam(transformation.id, "drop_right_dataframe_collist", []);

        // Reset filtered right columns when right dataframe changes
        if (newRightDf && dataframeColumns[newRightDf]) {
            const rightColumns = dataframeColumns[newRightDf].map(col =>
                typeof col === "object" && col !== null ? col : { name: col, datatype: "string" }
            );
            setOriginalRightColumns(rightColumns);
            setFilteredRightColumns(rightColumns);
        } else {
            setOriginalRightColumns([]);
            setFilteredRightColumns([]);
        }
    };

    const customStyles = {
        control: (provided) => ({
            ...provided,
            minHeight: '38px',
            border: '1px solid #e2e8f0',
            fontSize: '0.875rem',
            backgroundColor: 'white',
            boxShadow: 'none'
        }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: '#f3f4f6',
            color: '#111827'
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            color: '#111827',
            fontSize: '0.75rem',
        }),
        multiValueRemove: (provided) => ({
            ...provided,
            color: '#4b5563',
            ':hover': {
                backgroundColor: '#ef4444',
                color: 'white',
            },
            opacity: 1,
        }),
        valueContainer: (provided) => ({
            ...provided,
            padding: '0 6px'
        }),
        input: (provided) => ({
            ...provided,
            margin: '0px',
            color: '#111827'
        }),
        indicatorSeparator: () => ({
            display: 'none'
        }),
        indicatorsContainer: (provided) => ({
            ...provided,
            height: '38px'
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#9ca3af',
            fontSize: '0.875rem'
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 9999,
            backgroundColor: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected
                ? '#8E77BB'
                : state.isFocused
                    ? '#f3f4f6'
                    : 'white',
            color: state.isSelected ? 'white' : '#111827',
            fontSize: '0.875rem',
            cursor: 'pointer',
            ':active': {
                backgroundColor: state.isSelected ? '#8E77BB' : '#f3f4f6',
            }
        }),
        noOptionsMessage: (provided) => ({
            ...provided,
            color: '#4b5563',
            fontSize: '0.875rem'
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#111827'
        }),
    };

    const getColumnOptions = (dfId) => {
        if (!dfId || !dataframeColumns[dfId]) return [];
        return dataframeColumns[dfId].map(col => {
            if (typeof col === "object" && col !== null) {
                return {
                    value: col.name,
                    label: col.name,
                    key: col.name
                };
            }
            return {
                value: col,
                label: col,
                key: col
            };
        });
    };

    // New function to get original column options for dropdowns
    const getOriginalColumnOptions = (dfId, isRight = false) => {
        const originalColumns = isRight ? originalRightColumns[dfId] : originalSourceColumns[dfId];
        if (!originalColumns) return [];

        return originalColumns.map(colName => ({
            value: colName,
            label: colName,
            key: colName
        }));
    };

    // Function to get static original column options for drop dropdowns
    const getStaticOriginalColumnOptions = (dfId, isRight = false) => {
        const originalColumns = isRight
            ? originalRightColumnsForDropdown[dfId]
            : originalSourceColumnsForDropdown[dfId];

        if (!originalColumns) return [];

        return originalColumns.map(colName => ({
            value: colName,
            label: colName,
            key: colName
        }));
    };

    const getLeftColumnOptions = (leftDfId) => {
        const originalColumns = originalSourceColumnsForDropdown[leftDfId] || [];

        if (!originalColumns || originalColumns.length === 0) {
            return [];
        }

        return originalColumns.map(colName => ({
            value: colName,
            label: colName,
            key: colName
        }));
    };

    const getRightColumnOptions = (rightDfId) => {
        const originalColumns = originalRightColumnsForDropdown[rightDfId] || [];

        if (!originalColumns || originalColumns.length === 0) {
            return [];
        }

        return originalColumns.map(colName => ({
            value: colName,
            label: colName,
            key: colName
        }));
    };

    useEffect(() => {
        if (
            transformation.source_dataframe &&
            transformation.params.right_dataframe &&
            joinConditions.length > 0 &&
            (
                joinConditions[0].leftDataframe !== transformation.source_dataframe ||
                joinConditions[0].rightDataframe !== transformation.params.right_dataframe
            )
        ) {

            if (!transformation.params.join_condition) {
                setJoinConditions(prev => prev.map((condition, index) => ({
                    ...condition,
                    leftDataframe: transformation.source_dataframe,
                    rightDataframe: transformation.params.right_dataframe,

                    ...(index === 0 && !transformation.params.join_condition ? {
                        leftColumn: "",
                        rightColumn: ""
                    } : {})
                })));
            }
        }
    }, [transformation.source_dataframe, transformation.params.right_dataframe, transformation.params.join_condition]);

    const updateJoinCondition = (index, field, value) => {
        const updatedConditions = [...joinConditions];
        updatedConditions[index] = {
            ...updatedConditions[index],
            [field]: value
        };

        if (field === "leftDataframe") {
            updatedConditions[index].leftColumn = "";
        }
        if (field === "rightDataframe") {
            updatedConditions[index].rightColumn = "";
        }

        setJoinConditions(updatedConditions);


        buildJoinConditionString(updatedConditions);
    };

    const buildJoinConditionString = (conditions) => {
        if (conditions.length === 0) return;

        const validConditions = conditions.filter(condition =>
            condition.leftDataframe && condition.leftColumn &&
            condition.rightDataframe && condition.rightColumn
        );

        if (validConditions.length === 0) return;

        let joinConditionStr = "";

        if (validConditions.length === 1) {
            const condition = validConditions[0];
            joinConditionStr = `(${condition.leftDataframe}.${condition.leftColumn} ${condition.condition} ${condition.rightDataframe}.${condition.rightColumn})`;
        } else {
            const conditionParts = validConditions.map((condition, index) => {
                const condStr = `(${condition.leftDataframe}.${condition.leftColumn} ${condition.condition} ${condition.rightDataframe}.${condition.rightColumn})`;
                if (index === validConditions.length - 1) {
                    return condStr;
                } else {
                    return `${condStr} ${condition.logicalOperator}`;
                }
            });
            joinConditionStr = conditionParts.join(' ');
        }

        updateJoinsParam(transformation.id, "join_condition", joinConditionStr);
    };

    const addJoinCondition = () => {
        const newCondition = {
            leftDataframe: transformation.source_dataframe || "",
            leftColumn: "",
            condition: "==",
            rightDataframe: transformation.params.right_dataframe || "",
            rightColumn: "",
            logicalOperator: "&"
        };

        setJoinConditions(prev => [...prev, newCondition]);
    };

    const removeJoinCondition = (index) => {
        if (joinConditions.length <= 1) return;

        const updatedConditions = joinConditions.filter((_, i) => i !== index);
        setJoinConditions(updatedConditions);
        buildJoinConditionString(updatedConditions);
    };

    const handleRemoveDropColumn = (type, column) => {
        const paramName = `drop_${type}_dataframe_collist`;
        const currentList = transformation.params[paramName] || [];
        const updatedList = currentList.filter(col => col !== column);
        updateJoinsParam(transformation.id, paramName, updatedList);
    };

    const handleAddDropColumns = (type, columnsToAdd) => {
        if (!columnsToAdd || columnsToAdd.length === 0) return;

        const paramName = `drop_${type}_dataframe_collist`;
        const currentList = transformation.params[paramName] || [];

        const filteredNewColumns = columnsToAdd.filter(col =>
            col.trim() !== "" && !currentList.includes(col.trim())
        );

        if (filteredNewColumns.length === 0) return;

        const updatedList = [...currentList, ...filteredNewColumns];
        updateJoinsParam(transformation.id, paramName, updatedList);
    };

    const handleDropLeftColumnsChange = (selected) => {
        const columns = selected ? selected.map(opt => opt.value) : [];
        updateJoinsParam(transformation.id, "drop_left_dataframe_collist", columns);
        setDroppedLeftColumns(columns);

        // Update filtered left columns
        const filtered = originalLeftColumns.filter(col => !columns.includes(col.name));
        setFilteredLeftColumns(filtered);

        // Update the combined columns in source dataframe
        updateCombinedSourceColumns(filtered, filteredRightColumns);
    };

    const handleDropRightColumnsChange = (selected) => {
        const columns = selected ? selected.map(opt => opt.value) : [];
        updateJoinsParam(transformation.id, "drop_right_dataframe_collist", columns);
        setDroppedRightColumns(columns);

        // Update filtered right columns
        const filtered = originalRightColumns.filter(col => !columns.includes(col.name));
        setFilteredRightColumns(filtered);

        // Update the combined columns in source dataframe
        updateCombinedSourceColumns(filteredLeftColumns, filtered);
    };

    // New function to update the combined source columns
    const updateCombinedSourceColumns = (leftCols, rightCols) => {
        if (!transformation.source_dataframe || !transformation.params.right_dataframe) return;

        // Combine left and right columns, handling duplicates
        const leftColNames = new Set(leftCols.map(col => col.name));
        const combinedColumns = [...leftCols];

        // Add right columns that don't exist in left columns
        rightCols.forEach(rightCol => {
            if (!leftColNames.has(rightCol.name)) {
                combinedColumns.push(rightCol);
            }
        });

        // Update the source dataframe columns
        if (window.allNodes && Array.isArray(window.allNodes)) {
            const sourceNode = window.allNodes.find(n =>
                (n.data?.alias === transformation.source_dataframe) || (n.id === transformation.source_dataframe)
            );

            if (sourceNode && typeof sourceNode.data.onDataChange === "function") {
                sourceNode.data.onDataChange({ columns: combinedColumns });

                // Dispatch event for other components
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('tantor-columns-updated', {
                        detail: {
                            sourceId: transformation.source_dataframe,
                            rightId: transformation.params.right_dataframe,
                            combinedColumns: combinedColumns
                        }
                    }));
                }, 100);
            }
        }
    };

    useEffect(() => {
        if (transformation.params.drop_left_dataframe_collist) {
            setDroppedLeftColumns(transformation.params.drop_left_dataframe_collist);
            const filtered = originalLeftColumns.filter(col =>
                !transformation.params.drop_left_dataframe_collist.includes(col.name)
            );
            setFilteredLeftColumns(filtered);
        }
        if (transformation.params.drop_right_dataframe_collist) {
            setDroppedRightColumns(transformation.params.drop_right_dataframe_collist);
            const filtered = originalRightColumns.filter(col =>
                !transformation.params.drop_right_dataframe_collist.includes(col.name)
            );
            setFilteredRightColumns(filtered);
        }
    }, [transformation.params.drop_left_dataframe_collist, transformation.params.drop_right_dataframe_collist, originalLeftColumns, originalRightColumns]);

    const getSourceDataframes = () => {
        if (!window.allNodes) return allDataframes;
        const sourceNodeIds = window.allNodes
            .filter(n => n.type === "source")
            .map(n => n.id);
        return allDataframes.filter(df =>
            sourceNodeIds.includes(df.nodeId)
        );
    };

    return (
        <div>
            <div className="space-y-4">

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-700 mb-1">Right Table</label>
                        <select
                            className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                            value={transformation.params.right_dataframe || ""}
                            onChange={handleRightDataframeChange}
                        >
                            <option value="">Select right dataframe</option>
                            {getSourceDataframes()
                                .map(df => (
                                    <option key={df.id} value={df.id}>{df.label}</option>
                                ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-700 mb-1">Join Type</label>
                        <select
                            className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                            value={transformation.params.join_type || "left"}
                            onChange={(e) => updateJoinsParam(transformation.id, "join_type", e.target.value)}
                        >
                            {JOIN_TYPES.map(type => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs text-gray-700">Join Conditions</label>
                    </div>

                    {joinConditions.map((condition, index) => (
                        <div key={index} className="space-y-2 mb-4">
                            {index > 0 && (
                                <div className="flex items-center justify-center my-3">
                                    <select
                                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                                        value={joinConditions[index - 1].logicalOperator}
                                        onChange={(e) => updateJoinCondition(index - 1, "logicalOperator", e.target.value)}
                                    >
                                        {LOGICAL_OPERATORS.map(op => (
                                            <option key={op.id} value={op.id}>{op.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-10 gap-2 items-end">
                                <div className="col-span-3">
                                    <div className="text-[10px] text-gray-500 mb-1">
                                        {allDataframes.find(df => df.id === condition.leftDataframe)?.label || "Source"}
                                    </div>
                                    <select
                                        className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                                        value={condition.leftColumn}
                                        onChange={(e) => updateJoinCondition(index, "leftColumn", e.target.value)}
                                        disabled={!condition.leftDataframe}
                                    >
                                        <option value="">Select column</option>
                                        {getLeftColumnOptions(condition.leftDataframe).map(opt => (
                                            <option key={opt.key} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-3">
                                    <div className="text-[10px] text-gray-500 mb-1">
                                        {"Operator"}
                                    </div>
                                    <select
                                        className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                                        value={condition.condition}
                                        onChange={(e) => updateJoinCondition(index, "condition", e.target.value)}
                                    >
                                        {JOIN_CONDITIONS.map(cond => (
                                            <option key={cond.id} value={cond.id}>{cond.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-3">
                                    <div className="text-[10px] text-gray-500 mb-1">
                                        {allDataframes.find(df => df.id === condition.rightDataframe)?.label || "Target"}
                                    </div>
                                    <select
                                        className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                                        value={condition.rightColumn}
                                        onChange={(e) => updateJoinCondition(index, "rightColumn", e.target.value)}
                                        disabled={!condition.rightDataframe}
                                    >
                                        <option value="">Select column</option>
                                        {getRightColumnOptions(condition.rightDataframe).map(opt => (
                                            <option key={opt.key} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-1 flex gap-1 justify-center">
                                    <button
                                        type="button"
                                        onClick={addJoinCondition}
                                        className="p-2 text-[#8E77BB] mb-0.5 hover:text-[#7d68a5] rounded border border-gray-300 hover:border-[#8E77BB] flex-shrink-0"
                                        title="Add Join Condition"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                    {joinConditions.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeJoinCondition(index)}
                                            className="p-2 text-red-500 hover:text-red-700 rounded border border-gray-300 hover:border-red-500 flex-shrink-0"
                                            title="Remove Join Condition"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-700 mb-1">Drop Left Table Columns</label>
                        <Select
                            isMulti
                            options={getStaticOriginalColumnOptions(transformation.source_dataframe, false)}
                            value={
                                (transformation.params.drop_left_dataframe_collist || []).map(col => ({
                                    value: col,
                                    label: col
                                }))
                            }
                            onChange={handleDropLeftColumnsChange}
                            placeholder="Select columns to drop"
                            className="text-sm"
                            styles={customStyles}
                            closeMenuOnSelect={false}
                            noOptionsMessage={() => "No columns available"}
                            theme={theme => ({
                                ...theme,
                                colors: {
                                    ...theme.colors,
                                    primary: '#8E77BB',
                                    primary25: '#f3f4f6',
                                    neutral0: 'white',
                                    neutral80: '#111827',
                                },
                            })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-700 mb-1">Drop Right Table Columns</label>
                        <Select
                            isMulti
                            options={getStaticOriginalColumnOptions(transformation.params.right_dataframe, true)}
                            value={
                                (transformation.params.drop_right_dataframe_collist || []).map(col => ({
                                    value: col,
                                    label: col
                                }))
                            }
                            onChange={handleDropRightColumnsChange}
                            placeholder="Select columns to drop"
                            className="text-sm"
                            styles={customStyles}
                            closeMenuOnSelect={false}
                            noOptionsMessage={() => "No columns available"}
                            theme={theme => ({
                                ...theme,
                                colors: {
                                    ...theme.colors,
                                    primary: '#8E77BB',
                                    primary25: '#f3f4f6',
                                    neutral0: 'white',
                                    neutral80: '#111827',
                                },
                            })}
                        />
                    </div>
                </div>


            </div>
        </div>
    );
};

export const getJoinsParams = (transformation) => {
    const drop_left_dataframe_collist = Array.isArray(transformation.params.drop_left_dataframe_collist)
        ? transformation.params.drop_left_dataframe_collist
        : [];

    const drop_right_dataframe_collist = Array.isArray(transformation.params.drop_right_dataframe_collist)
        ? transformation.params.drop_right_dataframe_collist
        : [];

    return {
        right_dataframe: transformation.params.right_dataframe || "",
        join_type: transformation.params.join_type || "",
        join_condition: transformation.params.join_condition || "",
        drop_left_dataframe_collist,
        drop_right_dataframe_collist
    };
};

export default JoinsOperationFields;