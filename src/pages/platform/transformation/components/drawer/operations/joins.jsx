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
    // { id: "!=", name: "Not Equal (!=)" },
    // { id: "<", name: "Less Than (<)" },
    // { id: "<=", name: "Less Than or Equal (<=)" },
    // { id: ">", name: "Greater Than (>)" },
    // { id: ">=", name: "Greater Than or Equal (>=)" },
];

export const JoinsOperationFields = ({
    transformation,
    allDataframes,
    dataframeColumns,
    dropdownRefs,
    openDropdowns,
    toggleDropdown,
    updateJoinsParam
}) => {
    const [joinConditions, setJoinConditions] = useState([
        { leftDataframe: "", leftColumn: "", condition: "==", rightDataframe: "", rightColumn: "" }
    ]);

    useEffect(() => {
        if (!transformation.params.join_type) {
            updateJoinsParam(transformation.id, "join_type", "left");
        }

        if (!transformation.params.right_dataframe && allDataframes.length > 0) {
            const availableDf = allDataframes.find(df => df.id !== transformation.source_dataframe);
            if (availableDf) {
                updateJoinsParam(transformation.id, "right_dataframe", availableDf.id);
            }
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
        if (transformation.params.join_condition) {
            try {
                const parts = transformation.params.join_condition.split(/\s*(==|!=|<|<=|>|>=)\s*/);
                if (parts.length >= 3) {
                    const leftPart = parts[0].trim();
                    const condition = parts[1].trim();
                    const rightPart = parts[2].trim();

                    const [leftDataframe, leftColumn] = leftPart.split('.');
                    const [rightDataframe, rightColumn] = rightPart.split('.');

                    if (leftDataframe && leftColumn && rightDataframe && rightColumn) {
                        setJoinConditions([{
                            leftDataframe,
                            leftColumn,
                            condition,
                            rightDataframe,
                            rightColumn
                        }]);
                    }
                }
            } catch (error) {
                console.error("Error parsing join condition:", error);
            }
        }
    }, [transformation.params.join_condition]);

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

    const handleRightDataframeChange = (e) => {
        const newRightDf = e.target.value;
        updateJoinsParam(transformation.id, "right_dataframe", newRightDf);

        setJoinConditions([{
            ...joinConditions[0],
            rightDataframe: newRightDf,
            rightColumn: "",
        }]);
        updateJoinsParam(transformation.id, "join_condition", "");
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

    useEffect(() => {
        if (
            transformation.source_dataframe &&
            transformation.params.right_dataframe &&
            (
                joinConditions[0].leftDataframe !== transformation.source_dataframe ||
                joinConditions[0].rightDataframe !== transformation.params.right_dataframe
            )
        ) {
            setJoinConditions([{
                ...joinConditions[0],
                leftDataframe: transformation.source_dataframe,
                rightDataframe: transformation.params.right_dataframe
            }]);
        }
    }, [transformation.source_dataframe, transformation.params.right_dataframe]);

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

        const condition = updatedConditions[index];
        if (condition.leftDataframe && condition.leftColumn &&
            condition.rightDataframe && condition.rightColumn) {
            const joinConditionStr =
                `${condition.leftDataframe}.${condition.leftColumn} ${condition.condition} ${condition.rightDataframe}.${condition.rightColumn}`;
            updateJoinsParam(transformation.id, "join_condition", joinConditionStr);
        }
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
    };
    const handleDropRightColumnsChange = (selected) => {
        const columns = selected ? selected.map(opt => opt.value) : [];
        updateJoinsParam(transformation.id, "drop_right_dataframe_collist", columns);
    };

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
                    <label className="block text-xs text-gray-700 mb-2">Join Condition</label>
                    {joinConditions.map((condition, index) => (
                        <div key={index} className="grid grid-cols-3 gap-2 mb-2">
                            <div>
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
                                    {getColumnOptions(condition.leftDataframe).map(opt => (
                                        <option key={opt.key} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-end">
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

                            <div>
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
                                    {getColumnOptions(condition.rightDataframe).map(opt => (
                                        <option key={opt.key} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>


                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-700 mb-1">Drop Left Table Columns</label>
                        <Select
                            isMulti
                            options={getColumnOptions(transformation.source_dataframe)}
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
                            options={getColumnOptions(transformation.params.right_dataframe)}
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
