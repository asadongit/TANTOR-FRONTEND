import React, { useState, useEffect } from "react";
import { ChevronDown, X, Plus } from "lucide-react";

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
    // eslint-disable-next-line
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

    return (
        <div>
            <div className="space-y-4">
                {/* New: Source Dataframe Dropdown */}
                <div>
                    <label className="block text-xs text-gray-700 mb-1">Source Dataframe</label>
                    <select
                        className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                        value={transformation.source_dataframe || ""}
                        onChange={handleSourceDataframeChange}
                    >
                        <option value="">Select source dataframe</option>
                        {allDataframes.map(df => (
                            <option key={df.id} value={df.id}>{df.label}</option>
                        ))}
                    </select>
                </div>

                {/* Right Dataframe Dropdown */}
                <div>
                    <label className="block text-xs text-gray-700 mb-1">Right Dataframe</label>
                    <select
                        className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                        value={transformation.params.right_dataframe || ""}
                        onChange={handleRightDataframeChange}
                    >
                        <option value="">Select right dataframe</option>
                        {allDataframes
                            .filter(df => df.id !== transformation.source_dataframe)
                            .map(df => (
                                <option key={df.id} value={df.id}>{df.label}</option>
                            ))}
                    </select>
                </div>

                {/* Join Type Dropdown */}
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

                {/* Join Condition */}
                <div>
                    <label className="block text-xs text-gray-700 mb-2">Join Condition</label>
                    {joinConditions.map((condition, index) => (
                        <div key={index} className="grid grid-cols-4 gap-2 items-center mb-2">
                            {/* Left Column */}
                            <div>
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

                            {/* Condition Operator */}
                            <div>
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

                            {/* Right Column */}
                            <div>
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

                            {/* Right Dataframe label (for clarity, optional) */}
                            <div>
                                <span className="text-xs text-gray-600">
                                    {allDataframes.find(df => df.id === condition.rightDataframe)?.label || ""}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-700 mb-1">Drop Left Dataframe Columns</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {(transformation.params.drop_left_dataframe_collist || []).map((column, idx) => (
                                <div key={idx} className="bg-gray-100 border border-gray-300 rounded-full px-2 py-1 text-xs text-gray-800 flex items-center">
                                    {column}
                                    <button
                                        className="ml-1 text-gray-500 hover:text-red-500"
                                        onClick={() => handleRemoveDropColumn("left", column)}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center">
                            <input
                                type="text"
                                className="flex-1 p-2 text-sm bg-white border border-gray-300 rounded-l text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                                placeholder="Enter comma-separated column names"
                                id={`left-drop-columns-${transformation.id}`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value) {
                                        const columns = e.target.value.split(',').map(col => col.trim()).filter(Boolean);
                                        handleAddDropColumns("left", columns);
                                        e.target.value = '';
                                    }
                                }}
                            />
                            <button
                                className="p-2 bg-[#8E77BB] text-white rounded-r border border-[#8E77BB] hover:bg-[#7d68a5]"
                                onClick={() => {
                                    const input = document.getElementById(`left-drop-columns-${transformation.id}`);
                                    if (input && input.value) {
                                        const columns = input.value.split(',').map(col => col.trim()).filter(Boolean);
                                        handleAddDropColumns("left", columns);
                                        input.value = '';
                                    }
                                }}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-700 mb-1">Drop Right Dataframe Columns</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {(transformation.params.drop_right_dataframe_collist || []).map((column, idx) => (
                                <div key={idx} className="bg-gray-100 border border-gray-300 rounded-full px-2 py-1 text-xs text-gray-800 flex items-center">
                                    {column}
                                    <button
                                        className="ml-1 text-gray-500 hover:text-red-500"
                                        onClick={() => handleRemoveDropColumn("right", column)}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center">
                            <input
                                type="text"
                                className="flex-1 p-2 text-sm bg-white border border-gray-300 rounded-l text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                                placeholder="Enter comma-separated column names"
                                id={`right-drop-columns-${transformation.id}`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value) {
                                        const columns = e.target.value.split(',').map(col => col.trim()).filter(Boolean);
                                        handleAddDropColumns("right", columns);
                                        e.target.value = '';
                                    }
                                }}
                            />
                            <button
                                className="p-2 bg-[#8E77BB] text-white rounded-r border border-[#8E77BB] hover:bg-[#7d68a5]"
                                onClick={() => {
                                    const input = document.getElementById(`right-drop-columns-${transformation.id}`);
                                    if (input && input.value) {
                                        const columns = input.value.split(',').map(col => col.trim()).filter(Boolean);
                                        handleAddDropColumns("right", columns);
                                        input.value = '';
                                    }
                                }}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                    <p className="text-xs text-blue-800">
                        This operation will join the selected dataframes based on the specified join condition.
                        The join type will determine which rows are kept in the result.
                    </p>
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
        join_type: transformation.params.join_type || "left",
        join_condition: transformation.params.join_condition || "",
        drop_left_dataframe_collist,
        drop_right_dataframe_collist
    };
};

export default JoinsOperationFields;
