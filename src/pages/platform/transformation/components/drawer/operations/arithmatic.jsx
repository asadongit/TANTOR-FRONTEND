import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import Select, { components } from 'react-select';
import { isNumericType } from "../../../components/nodes/DataTypeMapping";

const ARITHMETIC_OPERATORS = [
  { id: "addition", name: "Add", symbol: "+" },
  { id: "subtraction", name: "Subtract", symbol: "-" },
  { id: "multiplication", name: "Multiply", symbol: "×" },
  { id: "division", name: "Divide", symbol: "÷" },
];

export const ArithmeticOperationFields = forwardRef(({
    transformation,
    sourceCols,
    handleSelectAllColumns,
    updateTransformation = () => {},
    onAddNewTargetColumn,
    setIsValid
}, ref) => {
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
            label: datatype ? `${colName} (${datatype})` : colName,
            type: "column"
        };
    });

    const getValueOption = (type, value) => {
        if (!value) return null;
        if (type === "column") {
            const found = columnOptions.find(opt => opt.value === value);
            return found || { value, label: value, type: "column" };
        }
        return { value, label: value, type: "custom" };
    };

    const operatorOptions = ARITHMETIC_OPERATORS.map(op => ({
        value: op.id,
        label: op.symbol
    }));

    const [customValueError, setCustomValueError] = useState(false);


    const parseArithOperation = (arithStr) => {
        if (!arithStr) return null;

        const tokens = [];
        const regex = /(\[[^\]]+\]|[^\+\-\*\/\s]+|[\+\-\*\/])/g;
        let match;
        while ((match = regex.exec(arithStr)) !== null) {
            tokens.push(match[0].trim());
        }
        const opMap = { "+": "addition", "-": "subtraction", "*": "multiplication", "/": "division" };
        const extract = (expr) => {
            const colMatch = /\['(.+)'\]/.exec(expr);
            if (colMatch) {
                return { type: "column", value: colMatch[1] };
            }
            if (!isNaN(Number(expr))) {
                return { type: "custom", value: expr };
            }

            const dfColMatch = /([a-zA-Z0-9_]+)\['(.+)'\]/.exec(expr);
            if (dfColMatch) {
                return { type: "column", value: dfColMatch[2] };
            }
            return { type: "custom", value: expr };
        };
        const parts = [];
        let i = 0;
        let left = extract(tokens[i++]);
        while (i < tokens.length) {
            const operatorToken = tokens[i++];
            const rightToken = tokens[i++];
            if (!operatorToken || !rightToken) break;
            const operator = opMap[operatorToken] || "";
            const right = extract(rightToken);
            parts.push({
                left_type: left.type,
                left_value: left.value,
                operator,
                right_type: right.type,
                right_value: right.value
            });
            left = right;
        }
        return parts.length > 0 ? parts : null;
    };

    const [conditions, setConditions] = useState(() => {

        if (Array.isArray(transformation.params?.conditions) && transformation.params.conditions.length > 1) {
            return transformation.params.conditions;
        }

        const arithStr = transformation.params?.arith_operation;
        const parsed = parseArithOperation(arithStr);
        if (parsed) return parsed;

        if (Array.isArray(transformation.params?.conditions)) {
            return transformation.params.conditions;
        }

        const { left_type, left_value, operator, right_type, right_value } = transformation.params || {};
        if (left_type && operator && right_type) {
            return [{ left_type, left_value, operator, right_type, right_value }];
        }
        return [{
            left_type: undefined, left_value: undefined,
            operator: undefined, right_type: undefined, right_value: undefined
        }];
    });


    useEffect(() => {
        const arith_operation = buildArithOperation();
        updateTransformation(
            transformation.id,
            "params",
            { ...transformation.params, arith_operation, conditions }
        );

    }, [conditions]);

    useEffect(() => {
        const isValid = conditions.length > 0 &&
            !!conditions[0].left_type && !!conditions[0].left_value &&
            !!conditions[0].operator && !!conditions[0].right_type && !!conditions[0].right_value &&
            conditions.slice(1).every(
                c => !!c.operator && !!c.right_type && !!c.right_value
            );
        setCustomValueError(!isValid);
        if (typeof setIsValid === "function") setIsValid(isValid);
    }, [conditions, setIsValid]);

    useImperativeHandle(ref, () => ({
        isValid: () =>
            conditions.length > 0 &&
            !!conditions[0].left_type && !!conditions[0].left_value &&
            !!conditions[0].operator && !!conditions[0].right_type && !!conditions[0].right_value &&
            conditions.slice(1).every(
                c => !!c.operator && !!c.right_type && !!c.right_value
            )
    }));

    useEffect(() => {
        if (!transformation.target_column[0]) {
            setShowAddModal(false);
        }
    }, [transformation.target_column]);

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
        if (action === "clear" || !selected) {
            handleSelectAllColumns(transformation.id, 'target', [], true);
            return;
        }
        handleSelectAllColumns(transformation.id, 'target', [selected.value], true);
    };

    const getColExpr = (val) => {
        if (!val) return "";
        return `${transformation.source_dataframe}['${val}']`;
    };

    const getExprPart = (type, value) => {
        if (!type || !value) return "";
        if (type === "column") return getColExpr(value);
        return value;
    };

    const buildArithOperation = () => {
        if (!conditions.length) return "";
        let expr = getExprPart(conditions[0].left_type, conditions[0].left_value);
        for (let i = 0; i < conditions.length; ++i) {
            const cond = conditions[i];
            const op = ARITHMETIC_OPERATORS.find(o => o.id === cond.operator)?.symbol || "";
            const opMap = { "+": "+", "-": "-", "×": "*", "÷": "/" };
            const jsOp = opMap[op] || op;
            expr += ` ${jsOp} ${getExprPart(cond.right_type, cond.right_value)}`;
        }
        return expr;
    };

    useEffect(() => {
        const arith_operation = buildArithOperation();
        updateTransformation(
            transformation.id,
            "params",
            { ...transformation.params, arith_operation, conditions }
        );

    }, [conditions]);

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
        const isCurrentTargetNew =
            transformation.target_column &&
            transformation.target_column[0] &&
            !columnOptions.some(opt => opt.value === transformation.target_column[0]);
        return (
            <components.MenuList {...props}>
                {!isCurrentTargetNew && (
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


    const makeSelectOptions = () => [
        { value: "__custom__", label: "Custom Value", type: "custom" },
        ...columnOptions
    ];

    const [customValueModal, setCustomValueModal] = useState({ open: false, side: null, value: "" });

    const targetColumnOptions = [
        ...columnOptions
    ];

    const selectedTargetOption =
        transformation.target_column && transformation.target_column[0]
            ? { value: transformation.target_column[0], label: transformation.target_column[0] }
            : null;

    const handleCondChange = (idx, field, value, type) => {
        setConditions(conds => {
            const updated = [...conds];
            if (field === "left" || field === "right") {
                updated[idx][`${field}_type`] = type;
                updated[idx][`${field}_value`] = value;
            } else if (field === "operator") {
                updated[idx].operator = value;
            }
            return updated;
        });
    };

    const handleAddCondition = (idx) => {
        setConditions(conds => {
            const newCond = {
                left_type: undefined, left_value: undefined,
                operator: undefined, right_type: undefined, right_value: undefined
            };
            return [
                ...conds.slice(0, idx + 1),
                newCond,
                ...conds.slice(idx + 1)
            ];
        });
    };

    const handleRemoveCondition = (idx) => {
        setConditions(conds => conds.length <= 1 || idx === 0 ? conds : conds.filter((_, i) => i !== idx));
    };

    return (
        <div>
            <div className="mb-2">
                <label className="text-xs text-gray-600 block mb-1">Arithmatic Condition</label>
            </div>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "180px 180px 180px 48px 48px",
                    rowGap: 12,
                    columnGap: 32,
                    alignItems: "center",
                    marginBottom: 8
                }}
            >
                {conditions.map((cond, idx) => (
                    <React.Fragment key={idx}>
                        {idx === 0 && (
                            <>
                                <div>
                <label className="text-xs text-gray-600 block mb-1">Select Column Or Enter Value</label>

                                    <Select
                                        options={makeSelectOptions()}
                                        value={getValueOption(cond.left_type, cond.left_value)}
                                        onChange={selected => {
                                            if (!selected) {
                                                handleCondChange(idx, "left", undefined, undefined);
                                                return;
                                            }
                                            if (selected.value === "__custom__") {
                                                setCustomValueModal({ open: true, side: `left-${idx}`, value: "" });
                                                return;
                                            }
                                            handleCondChange(idx, "left", selected.value, selected.type);
                                        }}
                                        className="text-sm"
                                        styles={customStyles}
                                        isClearable
                                        menuPlacement="auto"
                                        noOptionsMessage={() => "No numeric columns available"}
                                    />
                                </div>
                                <div>
                <label className="text-xs text-gray-600 block mb-1">Operator</label>

                                    <Select
                                        options={operatorOptions}
                                        value={operatorOptions.find(op => op.value === cond.operator) || null}
                                        onChange={selected => handleCondChange(idx, "operator", selected ? selected.value : undefined)}
                                        // placeholder="Operator"
                                        className="text-sm"
                                        styles={customStyles}
                                        menuPlacement="auto"
                                    />
                                </div>
                                <div>
                <label className="text-xs text-gray-600 block mb-1">Select Column Or Enter Value</label>

                                    <Select
                                        options={makeSelectOptions()}
                                        value={getValueOption(cond.right_type, cond.right_value)}
                                        onChange={selected => {
                                            if (!selected) {
                                                handleCondChange(idx, "right", undefined, undefined);
                                                return;
                                            }
                                            if (selected.value === "__custom__") {
                                                setCustomValueModal({ open: true, side: `right-${idx}`, value: "" });
                                                return;
                                            }
                                            handleCondChange(idx, "right", selected.value, selected.type);
                                        }}
                                        // placeholder="Select column or custom value"
                                        className="text-sm"
                                        styles={customStyles}
                                        isClearable
                                        menuPlacement="auto"
                                        noOptionsMessage={() => "No numeric columns available"}
                                    />
                                </div>
                                <div>
                                    {conditions.length === 1 && (
                                        <button
                                            type="button"
                                        className="w-8 h-8 mt-5 rounded bg-[#8E77BB] text-white flex items-center justify-center"
                                            title="Add another condition"
                                            onClick={() => handleAddCondition(idx)}
                                        >
                                            +
                                        </button>
                                    )}
                                </div>
                                <div />
                            </>
                        )}
                        {idx > 0 && (
                            <>
                                <div>
                <label className="text-xs text-gray-600 block mb-1">Operator</label>

                                    <Select
                                        options={operatorOptions}
                                        value={operatorOptions.find(op => op.value === cond.operator) || null}
                                        onChange={selected => handleCondChange(idx, "operator", selected ? selected.value : undefined)}
                                        // placeholder="Operator"
                                        className="text-sm"
                                        styles={customStyles}
                                        menuPlacement="auto"
                                    />
                                </div>
                                <div>
                <label className="text-xs text-gray-600 block mb-1">Select Column Or Enter Value</label>

                                    <Select
                                        options={makeSelectOptions()}
                                        value={getValueOption(cond.right_type, cond.right_value)}
                                        onChange={selected => {
                                            if (!selected) {
                                                handleCondChange(idx, "right", undefined, undefined);
                                                return;
                                            }
                                            if (selected.value === "__custom__") {
                                                setCustomValueModal({ open: true, side: `right-${idx}`, value: "" });
                                                return;
                                            }
                                            handleCondChange(idx, "right", selected.value, selected.type);
                                        }}
                                        // placeholder="Select column or custom value"
                                        className="text-sm"
                                        styles={customStyles}
                                        isClearable
                                        menuPlacement="auto"
                                        noOptionsMessage={() => "No numeric columns available"}
                                    />
                                </div>
                                <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                                    <button
                                        type="button"
                                        className="w-8 h-8 rounded bg-[#8E77BB] text-white flex items-center justify-center"
                                        title="Add another condition"
                                        onClick={() => handleAddCondition(idx)}
                                    >
                                        +
                                    </button>
                                    <button
                                        type="button"
                                        className="w-8 h-8 rounded bg-gray-200 text-gray-700 flex items-center justify-center"
                                        title="Remove this condition"
                                        onClick={() => handleRemoveCondition(idx)}
                                    >
                                        ×
                                    </button>
                                </div>
                                <div />
                                <div />
                            </>
                        )}
                    </React.Fragment>
                ))}
            </div>
            <div className="mt-6" style={{ maxWidth: 400 }}>
                <label className="text-xs text-gray-600 block mb-1">Target Column</label>
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
            {showAddModal && AddColumnModal}
            {customValueModal.open && (() => {
                const match = /^(\w+)-(\d+)$/.exec(customValueModal.side || "");
                if (!match) return null;
                const [, side, idxStr] = match;
                const idx = parseInt(idxStr, 10);
                return (
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
                        onClick={() => setCustomValueModal({ open: false, side: null, value: "" })}
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
                            <div className="mb-3 text-base font-medium text-gray-700">
                                Enter Custom Value
                            </div>
                            <input
                                type="number"
                                className="w-full p-2 mb-4 border border-gray-300 rounded text-gray-800"
                                placeholder="Enter custom value"
                                value={customValueModal.value}
                                onChange={e => setCustomValueModal(modal => ({ ...modal, value: e.target.value }))}
                                onKeyDown={e => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        setConditions(conds => {
                                            const updated = [...conds];
                                            updated[idx][`${side}_type`] = "custom";
                                            updated[idx][`${side}_value`] = customValueModal.value;
                                            return updated;
                                        });
                                        setCustomValueModal({ open: false, side: null, value: "" });
                                    }
                                }}
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    className="px-3 py-1 rounded bg-gray-200 text-gray-700"
                                    onClick={() => setCustomValueModal({ open: false, side: null, value: "" })}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-3 py-1 rounded bg-[#8E77BB] text-white"
                                    onClick={() => {
                                        setConditions(conds => {
                                            const updated = [...conds];
                                            updated[idx][`${side}_type`] = "custom";
                                            updated[idx][`${side}_value`] = customValueModal.value;
                                            return updated;
                                        });
                                        setCustomValueModal({ open: false, side: null, value: "" });
                                    }}
                                    disabled={!customValueModal.value.trim()}
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
            {showAddModal && AddColumnModal}
        </div>
    );
});

export default ArithmeticOperationFields;

