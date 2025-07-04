import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
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

    const newColumnNamesRef = useRef({});
    const [newColumnNames, setNewColumnNames] = useState({});
    const [selectedSourceCol, setSelectedSourceCol] = useState("");

    const sourceColOptions = Array.isArray(sourceCols)
        ? sourceCols.map(col => {
            const colName = typeof col === "object" && col !== null ? col.name : col;
            return { value: colName, label: colName };
        })
        : [];

    useEffect(() => {
        const namesMap = {};
        transformation.source_column.forEach((col, index) => {
            const targetName = transformation.target_column[index] || "";
            namesMap[col] = targetName;
        });
        setNewColumnNames(namesMap);
    }, [transformation.source_column, transformation.target_column]);

    useEffect(() => {
        if (
            transformation.source_column.length === 0
        ) {
            setSelectedSourceCol("");
        } else if (!transformation.source_column.includes(selectedSourceCol)) {
            setSelectedSourceCol(transformation.source_column[0]);
        }
    }, [transformation.source_column]);

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
        if (selectedSourceCol === sourceCol) setSelectedSourceCol("");
    };

    // When dropdown changes, update selectedSourceCol and source_column
    const handleDropdownSelect = (selected) => {
        if (selected && selected.value) {
            if (!transformation.source_column.includes(selected.value)) {
                handleSelectAllColumns(transformation.id, 'source', [selected.value], true);
            }
            setSelectedSourceCol(selected.value);
        } else {
            setSelectedSourceCol("");
            handleSelectAllColumns(transformation.id, 'source', [], true);
        }
    };

    // Remove selected source column
    const handleRemoveSelected = () => {
        handleRemoveColumn(selectedSourceCol);
    };

    // For react-select value
    const selectedOption = selectedSourceCol
        ? { value: selectedSourceCol, label: selectedSourceCol }
        : null;

    // Custom styles (from arithmatic)
    const customStyles = {
        control: (provided) => ({
            ...provided,
            minHeight: '38px',
            border: '1px solid #e2e8f0',
            fontSize: '0.875rem',
            backgroundColor: 'white',
            boxShadow: 'none'
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

    return (
        <div>
            <div className="mb-4 flex gap-4">
                <div className="w-1/2">
                    <label className="text-xs text-gray-600 block mb-1">Source Column</label>
                    <Select
                        options={sourceColOptions}
                        value={selectedOption}
                        onChange={handleDropdownSelect}
                        placeholder="Select column to rename"
                        className="text-sm"
                        styles={customStyles}
                        isClearable
                        isMulti={false}
                        noOptionsMessage={() => "No columns available"}
                    />
                </div>
                <div className="w-1/2 flex items-end">
                    {selectedSourceCol && (
                        <div className="w-full relative">
                            <label className="text-xs text-gray-600 block mb-1">Target Column</label>
                            <input
                                type="text"
                                className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                                value={newColumnNames[selectedSourceCol] || ""}
                                placeholder={selectedSourceCol}
                                onChange={(e) => handleNameChange(selectedSourceCol, e.target.value)}
                                onBlur={() => {
                                    if (!newColumnNames[selectedSourceCol]) {
                                        handleNameChange(selectedSourceCol, selectedSourceCol);
                                    }
                                }}
                            />
                            <button
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
                                type="button"
                                onClick={handleRemoveSelected}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default RenameOperationFields;
