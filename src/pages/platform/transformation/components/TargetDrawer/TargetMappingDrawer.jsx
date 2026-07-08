import { Check, CheckCircle } from "lucide-react";
import React, { useState, useMemo, useEffect, useCallback } from "react";

const TargetMappingDrawer = ({
    nodeId,
    onClose,
    getAllTargetColumns = () => [],
    targetMapping = {},
    setTargetMapping = () => { },
    sourceColumnOptions = [],
    // NEW props
    loadType,
    scdConfig = { primaryKeys: [], surrogateKey: "", checksumColumns: [], changeType: "" },
    setScdConfig = () => { }
}) => {
    const [dropdownOpen, setDropdownOpen] = useState({});
    const [searchTerms, setSearchTerms] = useState({});
    const [globalSearch, setGlobalSearch] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [initialMappingReceived, setInitialMappingReceived] = useState(false);
    const [availableSourceColumns, setAvailableSourceColumns] = useState([]);

    // Track the live text input value for custom expression (before confirm)
    const [customExpressionDraft, setCustomExpressionDraft] = useState({});

    const [localMapping, setLocalMapping] = useState({});

    // Local SCD selections
    const isSCD = useMemo(() => ["SCD1", "SCD2"].includes(loadType), [loadType]);
    const [localScd, setLocalScd] = useState({
        primaryKeys: [],
        surrogateKey: "",
        checksumColumns: [],
        changeType: ""
    });

    useEffect(() => {
        setLocalScd({
            primaryKeys: scdConfig?.primaryKeys || [],
            surrogateKey: scdConfig?.surrogateKey || "",
            checksumColumns: scdConfig?.checksumColumns || [],
            changeType: scdConfig?.checksumColumns?.length ? (scdConfig?.changeType || "checksum") : ""
        });
    }, [scdConfig]);

    const persistScdConfig = useCallback((nextScd) => {
        const toPersist = {
            primaryKeys: nextScd.primaryKeys || [],
            surrogateKey: nextScd.surrogateKey || "",
            checksumColumns: nextScd.checksumColumns || [],
            changeType: (nextScd.checksumColumns?.length ? (nextScd.changeType || "checksum") : "")
        };

        try {
            window.localStorage.setItem(`scd_config_${nodeId}`, JSON.stringify(toPersist));
        } catch { }

        setScdConfig(toPersist);

        try {
            const allNodes = window.allNodes || [];
            const targetNode = allNodes.find(n => n.id === nodeId);
            if (targetNode?.data?.onDataChange) {
                targetNode.data.onDataChange({ scdConfig: toPersist });
            }
            if (window.transformationContext) {
                const { dispatch, ACTION_TYPES } = window.transformationContext;
                if (dispatch && ACTION_TYPES) {
                    dispatch({
                        type: ACTION_TYPES.UPDATE_TARGET,
                        payload: {
                            id: nodeId,
                            data: { scdConfig: toPersist }
                        }
                    });
                }
            }
        } catch (error) {
            console.error("Error updating SCD config:", error);
        }
    }, [nodeId, setScdConfig]);

    const togglePk = useCallback((col) => {
        setLocalScd(prev => {
            const set = new Set(prev.primaryKeys || []);
            set.has(col) ? set.delete(col) : set.add(col);
            const next = { ...prev, primaryKeys: [...set] };
            persistScdConfig(next);
            return next;
        });
    }, [persistScdConfig]);

    const toggleSk = useCallback((col) => {
        setLocalScd(prev => {
            const next = {
                ...prev,
                surrogateKey: prev.surrogateKey === col ? "" : col
            };
            persistScdConfig(next);
            return next;
        });
    }, [persistScdConfig]);

    const toggleChk = useCallback((col) => {
        setLocalScd(prev => {
            const set = new Set(prev.checksumColumns || []);
            set.has(col) ? set.delete(col) : set.add(col);
            const arr = [...set];
            const next = { ...prev, checksumColumns: arr, changeType: arr.length ? (prev.changeType || "checksum") : "" };
            persistScdConfig(next);
            return next;
        });
    }, [persistScdConfig]);

    const refreshSourceColumns = useCallback(() => {
        if (!window.allNodes || !window.allEdges) return;

        const sourceColsRaw = [];

        const incomingEdges = window.allEdges.filter(e => e.target === nodeId);
        const transformationNodeIds = incomingEdges.map(e => e.source)
            .filter(srcId => {
                const node = window.allNodes.find(n => n.id === srcId);
                return node && node.type === 'transformation';
            });

        if (window.replayedDataframeColumns && Object.keys(window.replayedDataframeColumns).length > 0) {
            transformationNodeIds.forEach(transId => {
                const transIncoming = window.allEdges.filter(e => e.target === transId);
                transIncoming.forEach(e => {
                    const sourceNode = window.allNodes.find(n => n.id === e.source && n.type === 'source');
                    if (sourceNode) {
                        const alias = sourceNode.data?.alias || `unnamed_source_${sourceNode.id}`;
                        const replayedDf = window.replayedDataframeColumns[alias] || window.replayedDataframeColumns[sourceNode.id];
                        if (replayedDf && Array.isArray(replayedDf.columns)) {
                            replayedDf.columns.forEach(col => {
                                if (typeof col === 'object') sourceColsRaw.push({ ...col });
                                else sourceColsRaw.push({ name: col, datatype: null });
                            });
                        }
                    }
                });
            });
        }

        transformationNodeIds.forEach(transId => {
            const transIncoming = window.allEdges.filter(e => e.target === transId);
            transIncoming.forEach(e => {
                const sourceNode = window.allNodes.find(n => n.id === e.source && n.type === 'source');
                if (sourceNode && sourceNode.data && Array.isArray(sourceNode.data.columns)) {
                    sourceNode.data.columns.forEach(col => {
                        if (typeof col === 'object') sourceColsRaw.push({ ...col });
                        else sourceColsRaw.push({ name: col, datatype: null });
                    });
                }
            });

            const transNode = window.allNodes.find(n => n.id === transId);
            if (transNode && transNode.data && Array.isArray(transNode.data.transformations)) {
                transNode.data.transformations.forEach(tr => {
                    if (Array.isArray(tr.target_column)) {
                        tr.target_column.forEach(col => {
                            if (typeof col === 'object') sourceColsRaw.push({ ...col });
                            else if (col) sourceColsRaw.push({ name: col, datatype: null });
                        });
                    }
                });
            }
        });

        const uniqueColsMap = new Map();
        sourceColsRaw.filter(col => col && col.name).forEach(col => {
            const existing = uniqueColsMap.get(col.name);
            if (!existing || (col.datatype && !existing.datatype)) {
                uniqueColsMap.set(col.name, col);
            }
        });

        setAvailableSourceColumns(Array.from(uniqueColsMap.values()));
    }, [nodeId]);

    useEffect(() => {
        if (sourceColumnOptions && sourceColumnOptions.length > 0) {
            setAvailableSourceColumns(prevCols => {
                const allColsRaw = [...prevCols];
                sourceColumnOptions.forEach(opt => {
                    if (typeof opt.value === 'object') allColsRaw.push({ ...opt.value });
                    else if (opt.value) allColsRaw.push({ name: opt.value, datatype: null });
                });

                const uniqueColsMap = new Map();
                allColsRaw.filter(col => col && col.name).forEach(col => {
                    const existing = uniqueColsMap.get(col.name);
                    if (!existing || (col.datatype && !existing.datatype)) {
                        uniqueColsMap.set(col.name, col);
                    }
                });

                return Array.from(uniqueColsMap.values());
            });
        }

        refreshSourceColumns();
    }, [sourceColumnOptions, refreshSourceColumns]);

    useEffect(() => {
        const handleColumnUpdate = () => {
            refreshSourceColumns();
        };

        window.addEventListener("tantor-columns-updated", handleColumnUpdate);
        window.addEventListener("tantor-refresh-all-columns", handleColumnUpdate);

        refreshSourceColumns();

        return () => {
            window.removeEventListener("tantor-columns-updated", handleColumnUpdate);
            window.removeEventListener("tantor-refresh-all-columns", handleColumnUpdate);
        };
    }, [refreshSourceColumns]);

    useEffect(() => {
        setInitialMappingReceived(false);
    }, [nodeId]);

    useEffect(() => {
        if (initialMappingReceived) return;

        let effectiveMapping = {};

        const hasNonEmptyMapping =
            targetMapping &&
            typeof targetMapping === 'object' &&
            Object.values(targetMapping).some(val => {
                const valToCheck = typeof val === 'object' ? val.name : val;
                return valToCheck && valToCheck.trim() !== "";
            });

        if (hasNonEmptyMapping) {
            effectiveMapping = { ...targetMapping };
        } else {
            let allSourceCols = [];
            if (sourceColumnOptions && sourceColumnOptions.length > 0) {
                allSourceCols = sourceColumnOptions.map(opt => opt.value);
            }
            if (allSourceCols.length === 0 && availableSourceColumns && availableSourceColumns.length > 0) {
                allSourceCols = availableSourceColumns;
            }
            const sourceColMap = {};
            allSourceCols.forEach(col => {
                if (col) {
                    const colName = typeof col === 'object' ? col.name : col;
                    if (colName) sourceColMap[colName.toLowerCase()] = col;
                }
            });
            const targetCols = getAllTargetColumns();
            effectiveMapping = {};
            targetCols.forEach(targetCol => {
                const targetColName = typeof targetCol === 'object' ? targetCol.name : targetCol;
                if (targetColName && sourceColMap[targetColName.toLowerCase()]) {
                    effectiveMapping[targetColName] = sourceColMap[targetColName.toLowerCase()];
                } else {
                    effectiveMapping[targetColName || targetCol] = "";
                }
            });
        }

        const allTargetColumns = getAllTargetColumns();
        const completedMapping = { ...effectiveMapping };
        allTargetColumns.forEach(col => {
            if (!completedMapping[col]) {
                completedMapping[col] = "";
            }
        });

        // Detect which columns have a custom expression (value not in sourceColumnOptions)
        const knownColNames = new Set(
            sourceColumnOptions.map(opt => typeof opt.value === 'object' ? opt.value.name : opt.value)
        );
        const initialCustomDraft = {};
        const customExpressionsToInject = [];

        Object.entries(completedMapping).forEach(([targetCol, srcVal]) => {
            const srcName = typeof srcVal === 'object' ? srcVal.name : srcVal;
            if (srcName && srcName.trim() !== "" && !knownColNames.has(srcName)) {
                // Pre-fill the draft so it is available when opening dropdown tabs
                initialCustomDraft[targetCol] = srcName;
                customExpressionsToInject.push({ name: srcName, datatype: null, isCustomExpression: true });
            }
        });

        // Inject saved custom expressions into availableSourceColumns
        // so they appear as selected options in the dropdown in edit mode
        if (customExpressionsToInject.length > 0) {
            setAvailableSourceColumns(prevCols => {
                const merged = [...prevCols];
                customExpressionsToInject.forEach(customCol => {
                    const alreadyExists = merged.some(c => c.name === customCol.name);
                    if (!alreadyExists) merged.push(customCol);
                });
                return merged;
            });
        }

        setCustomExpressionDraft(initialCustomDraft);

        setLocalMapping(completedMapping);
        setInitialMappingReceived(true);

        window.localStorage.setItem(`targetMapping_${nodeId}`, JSON.stringify(completedMapping));
    }, [targetMapping, nodeId, getAllTargetColumns, sourceColumnOptions, availableSourceColumns, initialMappingReceived]);

    const filteredTargetColumns = useMemo(
        () => getAllTargetColumns().filter(col => {
            const colName = typeof col === 'object' ? col.name : col;
            return colName && colName.toLowerCase().includes(globalSearch.toLowerCase());
        }),
        [getAllTargetColumns, globalSearch]
    );

    const handleClearMapping = useCallback(() => {
        const confirmed = window.confirm("Are you sure you want to clear all mappings?");
        if (!confirmed) return;

        const cleared = {};
        getAllTargetColumns().forEach(col => {
            cleared[col] = "";
        });
        setLocalMapping(cleared);
        setCustomExpressionDraft({});

        window.localStorage.removeItem(`targetMappingConfirmed_${nodeId}`);

        const previousMapping = JSON.stringify(localMapping);
        window.localStorage.setItem(`targetMapping_${nodeId}_backup`, previousMapping);

    }, [getAllTargetColumns, nodeId, localMapping]);

    const forcePersistScdConfig = useCallback(() => {
        const finalScdConfig = {
            primaryKeys: localScd.primaryKeys || [],
            surrogateKey: localScd.surrogateKey || "",
            checksumColumns: localScd.checksumColumns || [],
            changeType: (localScd.checksumColumns?.length ? (localScd.changeType || "checksum") : "")
        };

        try {
            window.localStorage.setItem(`scd_config_${nodeId}`, JSON.stringify(finalScdConfig));
        } catch { }

        setScdConfig(finalScdConfig);

        try {
            const allNodes = window.allNodes || [];
            const targetNode = allNodes.find(n => n.id === nodeId);
            if (targetNode?.data?.onDataChange) {
                targetNode.data.onDataChange({ scdConfig: finalScdConfig });
            }

            if (window.transformationContext) {
                const { dispatch, ACTION_TYPES } = window.transformationContext;
                if (dispatch && ACTION_TYPES) {
                    dispatch({
                        type: ACTION_TYPES.UPDATE_TARGET,
                        payload: {
                            id: nodeId,
                            data: { scdConfig: finalScdConfig }
                        }
                    });
                }
            }
        } catch (error) {
            console.error("Error updating SCD config:", error);
        }

        return finalScdConfig;
    }, [nodeId, localScd, setScdConfig]);

    const finalizeMappingAndClose = useCallback(() => {
        const cleanedMapping = {};
        Object.entries(localMapping).forEach(([targetCol, sourceCol]) => {
            cleanedMapping[targetCol] = typeof sourceCol === 'object' ? sourceCol.name : sourceCol;
        });

        window.localStorage.setItem(`targetMappingConfirmed_${nodeId}`, "true");
        window.localStorage.setItem(`targetMapping_${nodeId}`, JSON.stringify(cleanedMapping));

        setTargetMapping(cleanedMapping);

        let finalScdConfig;
        if (isSCD) {
            finalScdConfig = forcePersistScdConfig();
        } else {
            finalScdConfig = {
                primaryKeys: [],
                surrogateKey: "",
                checksumColumns: [],
                changeType: ""
            };
        }

        const allNodes = window.allNodes || [];
        const targetNode = allNodes.find(node => node.id === nodeId);
        if (targetNode && targetNode.data && targetNode.data.onDataChange) {
            targetNode.data.onDataChange({
                targetMapping: cleanedMapping,
                scdConfig: finalScdConfig
            });

            if (window.transformationContext) {
                const { dispatch, ACTION_TYPES } = window.transformationContext;
                if (dispatch && ACTION_TYPES) {
                    dispatch({
                        type: ACTION_TYPES.UPDATE_TARGET,
                        payload: {
                            id: nodeId,
                            data: {
                                targetMapping: cleanedMapping,
                                scdConfig: finalScdConfig
                            }
                        }
                    });

                    dispatch({
                        type: ACTION_TYPES.PRESERVE_TARGET_MAPPING,
                        payload: { targetId: nodeId, mapping: cleanedMapping }
                    });
                }
            }
        }

        onClose();
    }, [localMapping, nodeId, setTargetMapping, onClose, isSCD, forcePersistScdConfig]);

    const handleConfirmMapping = useCallback(() => {
        if (isSCD) {
            forcePersistScdConfig();
        }

        const hasAnyMapping = Object.values(localMapping).some(val => {
            const valToCheck = typeof val === 'object' ? val.name : val;
            return valToCheck && valToCheck.trim() !== "";
        });
        if (!hasAnyMapping) {
            setShowConfirmModal(true);
            return;
        }
        finalizeMappingAndClose();
    }, [localMapping, isSCD, forcePersistScdConfig, finalizeMappingAndClose]);

    const handleModalConfirm = () => {
        if (isSCD) {
            forcePersistScdConfig();
        }
        finalizeMappingAndClose();
        setShowConfirmModal(false);
    };

    const handleModalCancel = () => {
        setShowConfirmModal(false);
    };

    const handleUpdateMapping = useCallback((targetCol, sourceCol) => {
        setLocalMapping(prev => {
            const updated = {
                ...prev,
                [targetCol]: sourceCol
            };

            window.localStorage.setItem(`targetMapping_${nodeId}_draft`, JSON.stringify(updated));

            return updated;
        });
    }, [nodeId]);

    // ─── Custom Expression Handlers ────────────────────────────────────────────

    /** Confirm the typed custom expression, auto-map it, inject into all dropdowns */
    const handleConfirmCustomExpression = useCallback((targetCol) => {
        const expr = (customExpressionDraft[targetCol] || "").trim();
        if (!expr) return;
        // Auto-map: directly set the expression as the mapping for this target column
        handleUpdateMapping(targetCol, expr);
        // Inject into availableSourceColumns so every other row's dropdown shows it too
        setAvailableSourceColumns(prev => {
            const alreadyExists = prev.some(c => c.name === expr);
            if (alreadyExists) return prev;
            return [...prev, { name: expr, datatype: null, isCustomExpression: true }];
        });
        // Close dropdown — mapping is done
        setDropdownOpen(prev => ({ ...prev, [targetCol]: false }));
    }, [customExpressionDraft, handleUpdateMapping]);

    // ───────────────────────────────────────────────────────────────────────────

    const allSourceColumnsForMapping = useMemo(() => {
        const allOptions = [...sourceColumnOptions];

        if (availableSourceColumns.length > 0) {
            availableSourceColumns.forEach(col => {
                allOptions.push({ value: col, label: typeof col === 'object' ? col.name : col });
            });
        }

        const uniqueOptionsMap = new Map();
        allOptions.forEach(opt => {
            const colName = typeof opt.value === 'object' ? opt.value.name : opt.value;
            if (!colName) return;

            const existing = uniqueOptionsMap.get(colName);
            const hasDataType = typeof opt.value === 'object' && opt.value.datatype;

            if (!existing || (hasDataType && (!existing.value || typeof existing.value !== 'object' || !existing.value.datatype))) {
                uniqueOptionsMap.set(colName, opt);
            }
        });

        return Array.from(uniqueOptionsMap.values());
    }, [sourceColumnOptions, availableSourceColumns]);

    const drawerWidthClass = useMemo(
        () => (isSCD ? "max-w-3xl md:max-w-4xl" : "max-w-md md:max-w-lg"),
        [isSCD]
    );

    // ─── Reusable Source Column Selector ───────────────────────────────────────
    const renderSourceSelector = (targetCol) => {
        const open = dropdownOpen[targetCol] || false;
        const search = searchTerms[targetCol] || "";
        const currentValue = localMapping[targetCol] || "";
        const draft = customExpressionDraft[targetCol] || "";

        const filteredOptions = allSourceColumnsForMapping.filter(opt => {
            const label = typeof opt.label === 'object' ? opt.label.name : opt.label;
            return label && label.toLowerCase().includes(search.toLowerCase());
        });

        const selectedOption = allSourceColumnsForMapping.find(opt => {
            const optValue = typeof opt.value === 'object' ? opt.value.name : opt.value;
            const searchVal = typeof currentValue === 'object' ? currentValue.name : currentValue;
            return optValue === searchVal;
        });
        const selectedLabelObj = selectedOption ? selectedOption.label : "";
        const selectedLabel = typeof selectedLabelObj === 'object' ? selectedLabelObj.name : selectedLabelObj;
        const currentName = typeof currentValue === 'object' ? currentValue.name : currentValue;
        const isCurrentCustom =
            currentName &&
            currentName.trim() !== "" &&
            !allSourceColumnsForMapping.some(opt => {
                const optValue = typeof opt.value === 'object' ? opt.value.name : opt.value;
                return optValue === currentName && !(typeof opt.value === 'object' && opt.value.isCustomExpression);
            });

        return (
            <div className="relative min-w-0 w-full">
                <button
                    type="button"
                    className={`w-full p-2 text-[13px] bg-white rounded border border-gray-300 text-gray-800 text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-[#8E77BB] transition-all shadow-sm ${open ? "ring-2 ring-[#8E77BB] border-[#8E77BB]" : ""}`}
                    onClick={() => {
                        const nextOpen = !open;
                        setDropdownOpen(prev => ({ ...prev, [targetCol]: nextOpen }));
                        if (nextOpen) {
                            if (isCurrentCustom) {
                                setCustomExpressionDraft(prev => ({ ...prev, [targetCol]: currentName }));
                            } else {
                                setCustomExpressionDraft(prev => ({ ...prev, [targetCol]: "" }));
                            }
                        }
                    }}
                >
                    <span className={`truncate ${currentValue ? "" : "text-gray-400"}`}>
                        {isCurrentCustom
                            ? currentName
                            : (selectedLabel || currentName || "Select source column")
                        }
                    </span>
                    <span className="ml-auto pl-2 text-xs flex-shrink-0">&#9662;</span>
                </button>

                {open && (
                    <div
                        className="absolute z-20 left-0 right-0 bg-white border border-gray-300 rounded shadow-lg mt-1 overflow-hidden flex flex-col"
                        style={{ maxHeight: "350px" }}
                    >
                        {/* Search Input */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 z-10 flex-shrink-0">
                            <input
                                type="search"
                                placeholder="Search source columns..."
                                className="w-full p-2 text-xs text-gray-700 focus:outline-none"
                                value={search}
                                onChange={e => setSearchTerms(prev => ({ ...prev, [targetCol]: e.target.value }))}
                                autoFocus
                            />
                        </div>

                        {/* Options List */}
                        <div className="overflow-y-auto flex-grow" style={{ maxHeight: "180px" }}>
                            {/* No Mapping */}
                            <div
                                className={`p-2 text-xs text-gray-700 cursor-pointer hover:bg-[#f3eaff] ${!currentValue ? "bg-gray-100 font-semibold" : ""}`}
                                onClick={() => {
                                    handleUpdateMapping(targetCol, "");
                                    setDropdownOpen(prev => ({ ...prev, [targetCol]: false }));
                                }}
                            >
                                <span className="text-gray-400">No Mapping</span>
                            </div>

                            {filteredOptions.length === 0 && (
                                <div className="p-2 text-xs text-gray-400">No columns found</div>
                            )}
                            {filteredOptions.map(opt => {
                                const optLabel = typeof opt.label === "object" ? opt.label.name : opt.label;
                                const optValue = typeof opt.value === "object" ? opt.value.name : opt.value;
                                const isSelected = typeof currentValue === "object"
                                    ? currentValue.name === optValue
                                    : currentValue === optValue;

                                return (
                                    <div
                                        key={optValue}
                                        className={`p-2 text-xs text-gray-700 cursor-pointer hover:bg-[#e9e3f7] ${isSelected ? "bg-[#e9e3f7] font-semibold text-[#8E77BB]" : ""}`}
                                        onClick={() => {
                                            handleUpdateMapping(targetCol, opt.value);
                                            setDropdownOpen(prev => ({ ...prev, [targetCol]: false }));
                                        }}
                                    >
                                        {optLabel}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Custom Expression at the bottom */}
                        <div className="border-t border-gray-200 p-2.5 bg-gray-50 flex-shrink-0">
                            <div className="text-[11px] font-semibold text-gray-500 mb-1">Custom Expression</div>
                            <div className="flex gap-1.5">
                                <input
                                    type="text"
                                    className="flex-grow px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB] placeholder-gray-400"
                                    placeholder="e.g. key1.key2"
                                    value={draft}
                                    onChange={e =>
                                        setCustomExpressionDraft(prev => ({ ...prev, [targetCol]: e.target.value }))
                                    }
                                    onKeyDown={e => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleConfirmCustomExpression(targetCol);
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    className="px-2 text-xs rounded bg-[#8E77BB] text-white font-medium hover:bg-[#7a6bb0] transition-colors focus:outline-none"
                                    onClick={() => handleConfirmCustomExpression(targetCol)}
                                >
                                    <Check size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };
    // ───────────────────────────────────────────────────────────────────────────

    return (
        <div className={`fixed right-0 top-0 h-full w-full ${drawerWidthClass} bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 transition-transform duration-300`}>
            <div className="flex items-center justify-between m-3">
                <button
                    onClick={onClose}
                    className="text-3xl text-gray-500 hover:text-red-500 transition-colors focus:outline-none"
                    aria-label="Close"
                >
                    ×
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={handleClearMapping}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded border border-gray-300 hover:bg-gray-200"
                    >
                        Clear Mapping
                    </button>
                    <button
                        onClick={handleConfirmMapping}
                        className="px-3 py-1 text-xs bg-[#8E77BB] text-white rounded border border-[#8E77BB] hover:bg-[#7a6bb0]"
                    >
                        Confirm Mapping
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col px-6 pb-6">
                <div className="flex items-center justify-between gap-4 mb-4 mt-2">
                    <div className="text-base font-semibold text-[#8E77BB] tracking-wide">
                        Target Mapping
                    </div>
                    <input
                        type="search"
                        placeholder="Search target columns..."
                        className="w-45 p-2 text-sm text-black border border-gray-300 rounded focus:outline-none focus:border-[#8E77BB] focus:ring-2 focus:ring-[#8E77BB] transition-all"
                        value={globalSearch}
                        onChange={e => setGlobalSearch(e.target.value)}
                    />
                </div>

                {!initialMappingReceived ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8E77BB]"></div>
                    </div>
                ) : (
                    <div
                        className="border border-gray-200 rounded-lg px-3 flex-1 overflow-y-auto min-h-[80px] bg-gray-50 shadow-lg"
                        style={{ maxHeight: "80vh", overflowY: "auto" }}
                    >
                        {/* Header */}
                        {isSCD ? (
                            <div className="grid grid-cols-5 gap-2 font-bold text-base mb-3 sticky top-0 h-8 w-full bg-white z-10 border-b border-gray-100 pb-2 text-[#8E77BB]">
                                <div className="text-center">PK</div>
                                <div className="text-center">SK</div>
                                <div className="text-center">CHK</div>
                                <div>Target Columns</div>
                                <div>Source Columns</div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 font-bold text-base mb-3 sticky top-0 h-8 w-full bg-white z-10 border-b border-gray-100 pb-2 text-[#8E77BB]">
                                <div>Target Columns</div>
                                <div>Source Columns</div>
                            </div>
                        )}

                        {/* Rows */}
                        <div>
                            {filteredTargetColumns.length === 0 && (
                                <div className="text-center text-xs text-gray-400 py-8">No target columns found.</div>
                            )}

                            {filteredTargetColumns.map((targetCol) => {
                                if (isSCD) {
                                    const pkChecked = (localScd.primaryKeys || []).includes(targetCol);
                                    const skChecked = localScd.surrogateKey === targetCol;
                                    const chkChecked = (localScd.checksumColumns || []).includes(targetCol);

                                    return (
                                        <div key={targetCol} className="grid grid-cols-5 gap-2 items-center mb-3">
                                            <div className="flex items-center justify-center">
                                                <input type="checkbox" className="h-3.5 w-3.5" checked={pkChecked} onChange={() => togglePk(targetCol)} />
                                            </div>
                                            <div className="flex items-center justify-center">
                                                <input type="checkbox" className="h-3.5 w-3.5" checked={skChecked} onChange={() => toggleSk(targetCol)} />
                                            </div>
                                            <div className="flex items-center justify-center">
                                                <input type="checkbox" className="h-3.5 w-3.5" checked={chkChecked} onChange={() => toggleChk(targetCol)} />
                                            </div>
                                            <div className="text-xs text-gray-800 break-words font-medium px-1 py-1 h-8 bg-gray-50 rounded border border-gray-100 shadow-sm min-w-0">
                                                {targetCol}
                                            </div>
                                            {renderSourceSelector(targetCol)}
                                        </div>
                                    );
                                }

                                // Non-SCD row
                                return (
                                    <div key={targetCol} className="flex flex-row items-center mb-4 gap-2">
                                        <div className="text-xs text-gray-800 break-words font-medium px-1 py-1 h-8 bg-gray-50 rounded border border-gray-100 shadow-sm min-w-0 flex-1">
                                            {targetCol}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {renderSourceSelector(targetCol)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="bg-white rounded shadow-lg p-6 max-w-xs w-full">
                        <div className="text-base font-semibold mb-2 text-[#8E77BB]">Confirm Empty Mapping</div>
                        <div className="text-sm text-gray-700 mb-4">
                            {
                                Object.values(localMapping).some(val => val && val.trim() !== "")
                                    ? "You have selected some mappings."
                                    : "No mappings are selected. Are you sure you want to confirm with empty mappings?"
                            }
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded border border-gray-300 hover:bg-gray-200"
                                onClick={handleModalCancel}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-3 py-1 text-xs bg-[#8E77BB] text-white rounded border border-[#8E77BB] hover:bg-[#7a6bb0]"
                                onClick={handleModalConfirm}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TargetMappingDrawer;
