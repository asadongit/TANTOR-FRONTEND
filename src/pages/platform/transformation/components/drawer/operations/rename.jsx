import React, { useState, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

export const RenameOperationFields = ({
    transformation,
    sourceCols,
    openDropdowns,
    toggleDropdown,
    handleSelectAllColumns,
    handleColumnSelection,
    dropdownRefs,
    updateTargetColumn
}) => {
    const sourceDropdownKey = `${transformation.id}-source`;
    const isSourceDropdownOpen = openDropdowns[sourceDropdownKey] || false;
    const [newColumnNames, setNewColumnNames] = useState({});

    useEffect(() => {
        const namesMap = {};
        transformation.source_column.forEach((col, index) => {
            const targetName = transformation.target_column[index] || "";
            namesMap[col] = targetName;
        });
        setNewColumnNames(namesMap);
    }, [transformation.source_column, transformation.target_column]);

    const handleNameChange = (sourceCol, newName) => {
        setNewColumnNames(prev => {
            const updated = { ...prev, [sourceCol]: newName };

            const targetCols = transformation.source_column.map(col =>
                updated[col] && updated[col].trim() !== "" ? updated[col].trim() : col
            );

            updateTargetColumn(transformation.id, targetCols);

            return updated;
        });
    };

    const handleRemoveColumn = (sourceCol) => {
        const updatedSource = transformation.source_column.filter(col => col !== sourceCol);

        const updatedTarget = updatedSource.map(col =>
            newColumnNames[col] && newColumnNames[col].trim() !== "" ?
            newColumnNames[col].trim() : col
        );

        updateTargetColumn(transformation.id, updatedTarget, updatedSource);

        setNewColumnNames(prev => {
            const updated = { ...prev };
            delete updated[sourceCol];
            return updated;
        });
    };

    useEffect(() => {
        if (transformation.source_column.length > 0) {
            const targetCols = transformation.source_column.map(col =>
                newColumnNames[col] && newColumnNames[col].trim() !== "" ?
                newColumnNames[col].trim() : col
            );

            const needsUpdate = targetCols.length !== transformation.target_column.length ||
                targetCols.some((col, idx) => col !== transformation.target_column[idx]);

            if (needsUpdate) {
                updateTargetColumn(transformation.id, targetCols);
            }
        }
    }, [transformation.source_column]);

    return (
        <div>
            <div className="mb-4">
                <div className="relative" ref={el => dropdownRefs.current[sourceDropdownKey] = el}>
                    <label className="text-xs text-gray-600 block mb-1">Source Columns</label>
                    <button
                        className="w-full p-2 text-black text-sm border border-gray-300 rounded bg-white flex justify-between items-center"
                        onClick={() => toggleDropdown(transformation.id, 'source')}
                    >
                        {transformation.source_column.length === 0 ? (
                            <span className="text-gray-400">Select columns to rename</span>
                        ) : (
                            <span className="truncate">
                                {transformation.source_column.length} column(s) selected
                            </span>
                        )}
                        <ChevronDown className={`w-4 h-4 transition-transform ${isSourceDropdownOpen ? 'transform rotate-180' : ''}`} />
                    </button>

                    {isSourceDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full text-black bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            <div className="p-2 border-b border-gray-200">
                                <label className="flex items-center text-sm">
                                    <input
                                        type="checkbox"
                                        className="mr-2"
                                        checked={transformation.source_column.length === sourceCols.length && sourceCols.length > 0}
                                        onChange={(e) => handleSelectAllColumns(transformation.id, 'source', sourceCols, e.target.checked)}
                                    />
                                    Select All
                                </label>
                            </div>
                            <div className="py-1">
                                {sourceCols.map((column, idx) => (
                                    <label key={idx} className="flex items-center px-3 py-2 hover:bg-gray-100">
                                        <input
                                            type="checkbox"
                                            className="mr-2"
                                            checked={transformation.source_column.includes(column)}
                                            onChange={(e) => handleColumnSelection(transformation.id, 'source', column, e.target.checked)}
                                        />
                                        <span className="text-sm">{column}</span>
                                    </label>
                                ))}
                                {sourceCols.length === 0 && (
                                    <div className="px-3 py-2 text-gray-500 text-sm">No columns available</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {transformation.source_column.length > 0 && (
                <div className="mt-4">
                    <label className="block text-xs text-gray-600 mb-2">Column Mappings</label>
                    <div className="space-y-2">
                        {transformation.source_column.map((col, idx) => (
                            <div key={col} className="flex items-center gap-2">
                                <div className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded text-sm">
                                    {col}
                                </div>
                                <div className="flex-none">→</div>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                                        value={newColumnNames[col] || ""}
                                        placeholder={col}
                                        onChange={(e) => handleNameChange(col, e.target.value)}
                                        onBlur={() => {
                                            if (!newColumnNames[col]) {
                                                handleNameChange(col, col);
                                            }
                                        }}
                                    />
                                    <button
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
                                        onClick={() => handleRemoveColumn(col)}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                        <p className="text-xs text-blue-800">
                            Enter new names for columns or leave fields empty to keep original names.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RenameOperationFields;
