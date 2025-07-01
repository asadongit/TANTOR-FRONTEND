import React, { useState, useEffect, useRef } from "react";
import Select, { components } from 'react-select';
import { isNumericType } from "../../../components/nodes/DataTypeMapping";

const ARITHMETIC_OPERATORS = [
  { id: "addition", name: "Add", symbol: "+" },
  { id: "subtraction", name: "Subtract", symbol: "-" },
  { id: "multiplication", name: "Multiply", symbol: "×" },
  { id: "division", name: "Divide", symbol: "÷" },
];

export const ArithmeticOperationFields = ({
    transformation,
    sourceCols,
    handleSelectAllColumns,
    updateTransformation = () => {},
    onAddNewTargetColumn,
}) => {
    const [isAddingNewColumn, setIsAddingNewColumn] = useState(false);
    const [newColumnName, setNewColumnName] = useState("");
    const inputRef = useRef(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalInput, setModalInput] = useState("");
    const modalInputRef = useRef(null);

    const numericCols = Array.isArray(sourceCols)
        ? sourceCols.filter(col => {
            if (typeof col === "object" && col.datatype) {
                return isNumericType(col.datatype);
            }
            return true;
        })
        : [];

    const columnOptions = numericCols.map(col => {
        const colName = typeof col === "string" ? col : col.name;
        const datatype = typeof col === "object" && col.datatype ? col.datatype : "";
        return {
            value: colName,
            label: datatype ? `${colName} (${datatype})` : colName
        };
    });

    const targetColumnOptions = [
        ...columnOptions
    ];

    const selectedTargetOption = isAddingNewColumn && newColumnName
        ? { value: newColumnName, label: newColumnName }
        : transformation.target_column[0]
            ? { value: transformation.target_column[0], label: transformation.target_column[0] }
            : null;

    const selectedSourceOptions = Array.isArray(transformation.source_column)
        ? transformation.source_column.map(colName => ({
            value: colName,
            label: colName
        }))
        : [];

    useEffect(() => {
        if (!isAddingNewColumn && transformation.target_column[0]) {
            setNewColumnName("");
        }
    }, [transformation.target_column, isAddingNewColumn]);

    useEffect(() => {
        if (isAddingNewColumn && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isAddingNewColumn]);

    useEffect(() => {
        if (showAddModal && modalInputRef.current) {
            modalInputRef.current.focus();
        }
    }, [showAddModal]);

    const handleSourceChange = (selected) => {
        const selectedColumns = selected ? selected.map(option => option.value) : [];
        handleSelectAllColumns(transformation.id, 'source', selectedColumns, true);
    };

    const handleTargetChange = (selected, { action }) => {
        if (action === "clear") {
            setIsAddingNewColumn(false);
            setNewColumnName("");
            handleSelectAllColumns(transformation.id, 'target', [], true);
            return;
        }
        if (selected) {
            setIsAddingNewColumn(false);
            setNewColumnName("");
            handleSelectAllColumns(transformation.id, 'target', [selected.value], true);
        }
    };

    const handleNewColumnNameChange = (e) => {
        const name = e.target.value;
        setNewColumnName(name);
        if (name.trim()) {
            handleSelectAllColumns(transformation.id, 'target', [name], true);
        } else {
            handleSelectAllColumns(transformation.id, 'target', [], true);
        }
    };

    // Operator selection handler
    const handleOperatorChange = (operatorId) => {
        updateTransformation(transformation.id, "transformation_operator", operatorId);
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

    const CustomMenuList = (props) => {
        return (
            <components.MenuList {...props}>
                {!isAddingNewColumn && (
                    <div
                        style={{
                            padding: '8px 12px',
                            borderBottom: '1px solid #e5e7eb',
                            background: 'white',
                            cursor: 'pointer'
                        }}
                        onMouseDown={e => {
                            e.preventDefault();
                            setShowAddModal(true);
                            setModalInput("");
                        }}
                    >
                        <span style={{ color: '#8E77BB', fontWeight: 500 }}>Add New +</span>
                    </div>
                )}
                {props.children}
            </components.MenuList>
        );
    };

    const handleModalOk = () => {
        const name = modalInput.trim();
        if (name) {
            setShowAddModal(false);
            setIsAddingNewColumn(false);
            setNewColumnName("");
            handleSelectAllColumns(transformation.id, 'target', [name], true);
            if (onAddNewTargetColumn && typeof onAddNewTargetColumn === "function") {
                onAddNewTargetColumn(name);
            }
        }
    };

    const handleModalInputKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleModalOk();
        }
    };

    const AddColumnModal = (
        <div
            style={{
                position: "fixed",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,0.2)",
                zIndex: 10000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}
            onClick={() => setShowAddModal(false)}
        >
            <div
                style={{
                    background: "white",
                    padding: 24,
                    borderRadius: 8,
                    minWidth: 320,
                    boxShadow: "0 2px 16px rgba(0,0,0,0.15)"
                }}
                onClick={e => e.stopPropagation()}
            >
                <div className="mb-3 text-base font-medium text-gray-700">Add New Target Column</div>
                <input
                    ref={modalInputRef}
                    type="text"
                    className="w-full p-2 mb-4 border border-gray-300 rounded text-gray-800"
                    placeholder="Enter new column name"
                    value={modalInput}
                    onChange={e => setModalInput(e.target.value)}
                    onKeyDown={handleModalInputKeyDown}
                />
                <div className="flex justify-end gap-2">
                    <button
                        className="px-3 py-1 rounded bg-gray-200 text-gray-700"
                        onClick={() => setShowAddModal(false)}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-3 py-1 rounded bg-[#8E77BB] text-white"
                        onClick={handleModalOk}
                        disabled={!modalInput.trim()}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div>

            <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-1">
                    Operator
                </label>
                <div className="flex flex-wrap gap-2">
                    {ARITHMETIC_OPERATORS.map(op => (
                        <button
                            key={op.id}
                            className={`py-2 px-3 text-sm rounded-md ${
                                transformation.transformation_operator === op.id
                                    ? 'bg-[#8E77BB] text-white'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => handleOperatorChange(op.id)}
                            type="button"
                        >
                            {op.symbol}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex gap-4 items-end">
                <div className="flex-1">
                    <label className="text-xs text-gray-600 block mb-1">Source Columns</label>
                    <Select
                        isMulti
                        options={columnOptions}
                        value={selectedSourceOptions}
                        onChange={handleSourceChange}
                        placeholder="Select columns"
                        className="text-sm"
                        styles={customStyles}
                        noOptionsMessage={() => "No numeric columns available"}
                        closeMenuOnSelect={false}
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
                <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">
                        Custom Value
                    </label>
                    <input
                        type="number"
                        step="1"
                        pattern="[0-9]*"
                        className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                        placeholder="Enter custom value"
                        value={transformation.params?.custom_value || ""}
                        onChange={e => {
                            const val = e.target.value;
                            if (val === "" || /^-?\d+$/.test(val)) {
                                updateTransformation(transformation.id, "params.custom_value", val);
                            }
                        }}
                        inputMode="numeric"
                    />
                </div>
            </div>
            <div className="flex justify-center mt-4">
                <div className="w-1/2">
                    <label className="text-xs text-gray-600 block mb-1 text-center">Target Column</label>
                    <Select
                        options={targetColumnOptions}
                        value={selectedTargetOption}
                        onChange={handleTargetChange}
                        placeholder="Select target column"
                        className="text-sm"
                        styles={customStyles}
                        noOptionsMessage={() => "No numeric columns available"}
                        isClearable
                        components={{ MenuList: CustomMenuList }}
                        menuIsOpen={undefined}
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
            {showAddModal && AddColumnModal}
        </div>
    );
};

export default ArithmeticOperationFields;

