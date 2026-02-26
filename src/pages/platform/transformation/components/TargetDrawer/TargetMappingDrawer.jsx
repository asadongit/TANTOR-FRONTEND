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

    // --- PATCH: Always sync SCD config to parent/context on PK/SK/CHK change ---
    // Helper to persist SCD config to parent/context/localStorage
    const persistScdConfig = useCallback((nextScd) => {
        const toPersist = {
            primaryKeys: nextScd.primaryKeys || [],
            surrogateKey: nextScd.surrogateKey || "",
            checksumColumns: nextScd.checksumColumns || [],
            changeType: (nextScd.checksumColumns?.length ? (nextScd.changeType || "checksum") : "")
        };

        // Save to localStorage
        try {
            window.localStorage.setItem(`scd_config_${nodeId}`, JSON.stringify(toPersist));
        } catch { }

        // Update parent SCD config
        setScdConfig(toPersist);

        // Update target node data and context
        try {
            const allNodes = window.allNodes || [];
            const targetNode = allNodes.find(n => n.id === nodeId);
            if (targetNode?.data?.onDataChange) {
                targetNode.data.onDataChange({ scdConfig: toPersist });
            }
            // Force transformation context update
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
            // eslint-disable-next-line no-console
            console.error("Error updating SCD config:", error);
        }
    }, [nodeId, setScdConfig]);
    // --- END PATCH ---

    const togglePk = useCallback((col) => {
        setLocalScd(prev => {
            const set = new Set(prev.primaryKeys || []);
            set.has(col) ? set.delete(col) : set.add(col);
            const next = { ...prev, primaryKeys: [...set] };
            persistScdConfig(next); // PATCH: always persist SCD config
            return next;
        });
    }, [persistScdConfig]);

    const toggleSk = useCallback((col) => {
        setLocalScd(prev => {
            const next = {
                ...prev,
                surrogateKey: prev.surrogateKey === col ? "" : col
            };
            persistScdConfig(next); // PATCH: always persist SCD config
            return next;
        });
    }, [persistScdConfig]);

    const toggleChk = useCallback((col) => {
        setLocalScd(prev => {
            const set = new Set(prev.checksumColumns || []);
            set.has(col) ? set.delete(col) : set.add(col);
            const arr = [...set];
            const next = { ...prev, checksumColumns: arr, changeType: arr.length ? (prev.changeType || "checksum") : "" };
            persistScdConfig(next); // PATCH: always persist SCD config
            return next;
        });
    }, [persistScdConfig]);

    // Function to collect all available source columns — uses post-transformation state
    const refreshSourceColumns = useCallback(() => {
        if (!window.allNodes || !window.allEdges) return;

        const sourceColumns = new Set();

        // Find all transformation nodes connected to this target
        const incomingEdges = window.allEdges.filter(e => e.target === nodeId);
        const transformationNodeIds = incomingEdges.map(e => e.source)
            .filter(srcId => {
                const node = window.allNodes.find(n => n.id === srcId);
                return node && node.type === 'transformation';
            });

        // ETL-correct approach: use post-transformation replayed columns
        // These already reflect restrict, rename, drop, join, and new-column effects
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
                                const colName = typeof col === 'object' ? col.name : col;
                                if (colName) sourceColumns.add(colName);
                            });
                        }
                    }
                });
            });

            if (sourceColumns.size > 0) {
                setAvailableSourceColumns(Array.from(sourceColumns));
                return;
            }
        }

        // Fallback: gather from source nodes and transformation outputs directly
        transformationNodeIds.forEach(transId => {
            const transIncoming = window.allEdges.filter(e => e.target === transId);
            transIncoming.forEach(e => {
                const sourceNode = window.allNodes.find(n => n.id === e.source && n.type === 'source');
                if (sourceNode && sourceNode.data && Array.isArray(sourceNode.data.columns)) {
                    sourceNode.data.columns.forEach(col => {
                        const colName = typeof col === 'object' ? col.name : col;
                        if (colName) sourceColumns.add(colName);
                    });
                }
            });

            // Also get columns from transformation outputs
            const transNode = window.allNodes.find(n => n.id === transId);
            if (transNode && transNode.data && Array.isArray(transNode.data.transformations)) {
                transNode.data.transformations.forEach(tr => {
                    if (Array.isArray(tr.target_column)) {
                        tr.target_column.forEach(col => {
                            if (col) sourceColumns.add(col);
                        });
                    }
                });
            }
        });

        const columnsArray = Array.from(sourceColumns);
        if (columnsArray.length > 0) {
            setAvailableSourceColumns(columnsArray);
        }
    }, [nodeId]);

    useEffect(() => {
        if (sourceColumnOptions && sourceColumnOptions.length > 0) {
            const sourceColValues = sourceColumnOptions.map(opt => opt.value);
            setAvailableSourceColumns(prevCols => {
                const allCols = [...prevCols, ...sourceColValues];
                return Array.from(new Set(allCols));
            });
        }

        // Always try to refresh columns from all nodes
        refreshSourceColumns();
    }, [sourceColumnOptions, refreshSourceColumns]);

    useEffect(() => {
        const handleColumnUpdate = () => {
            refreshSourceColumns();
        };

        window.addEventListener("tantor-columns-updated", handleColumnUpdate);
        window.addEventListener("tantor-refresh-all-columns", handleColumnUpdate);

        // Refresh immediately on mount
        refreshSourceColumns();

        return () => {
            window.removeEventListener("tantor-columns-updated", handleColumnUpdate);
            window.removeEventListener("tantor-refresh-all-columns", handleColumnUpdate);
        };
    }, [refreshSourceColumns]);

    useEffect(() => {
        let effectiveMapping = {};

        const hasNonEmptyMapping =
            targetMapping &&
            typeof targetMapping === 'object' &&
            Object.values(targetMapping).some(val => val && val.trim() !== "");

        if (hasNonEmptyMapping) {
            effectiveMapping = { ...targetMapping };
        } else {
            // CREATE MODE: auto-map by name
            let allSourceCols = [];
            if (sourceColumnOptions && sourceColumnOptions.length > 0) {
                allSourceCols = sourceColumnOptions.map(opt => opt.value);
            }
            if (allSourceCols.length === 0 && availableSourceColumns && availableSourceColumns.length > 0) {
                allSourceCols = availableSourceColumns;
            }
            const sourceColMap = {};
            allSourceCols.forEach(col => {
                if (col) sourceColMap[col.toLowerCase()] = col;
            });
            const targetCols = getAllTargetColumns();
            effectiveMapping = {};
            targetCols.forEach(targetCol => {
                if (sourceColMap[targetCol.toLowerCase()]) {
                    effectiveMapping[targetCol] = sourceColMap[targetCol.toLowerCase()];
                } else {
                    effectiveMapping[targetCol] = "";
                }
            });
        }

        // Always ensure all target columns are present in the mapping
        const allTargetColumns = getAllTargetColumns();
        const completedMapping = { ...effectiveMapping };
        allTargetColumns.forEach(col => {
            if (!completedMapping[col]) {
                completedMapping[col] = "";
            }
        });

        setLocalMapping(completedMapping);
        setInitialMappingReceived(true);

        window.localStorage.setItem(`targetMapping_${nodeId}`, JSON.stringify(completedMapping));
        // --- END PATCH ---
    }, [targetMapping, nodeId, getAllTargetColumns, sourceColumnOptions, availableSourceColumns]);

    const filteredTargetColumns = useMemo(
        () => getAllTargetColumns().filter(col =>
            col.toLowerCase().includes(globalSearch.toLowerCase())
        ),
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

        window.localStorage.removeItem(`targetMappingConfirmed_${nodeId}`);

        const previousMapping = JSON.stringify(localMapping);
        window.localStorage.setItem(`targetMapping_${nodeId}_backup`, previousMapping);

    }, [getAllTargetColumns, nodeId, localMapping]);

    // Add this new function to explicitly persist SCD config
    const forcePersistScdConfig = useCallback(() => {
        const finalScdConfig = {
            primaryKeys: localScd.primaryKeys || [],
            surrogateKey: localScd.surrogateKey || "",
            checksumColumns: localScd.checksumColumns || [],
            changeType: (localScd.checksumColumns?.length ? (localScd.changeType || "checksum") : "")
        };

        // Save to localStorage
        try {
            window.localStorage.setItem(`scd_config_${nodeId}`, JSON.stringify(finalScdConfig));
        } catch { }

        // Update parent SCD config
        setScdConfig(finalScdConfig);

        // Update target node data and context immediately
        try {
            const allNodes = window.allNodes || [];
            const targetNode = allNodes.find(n => n.id === nodeId);
            if (targetNode?.data?.onDataChange) {
                targetNode.data.onDataChange({ scdConfig: finalScdConfig });
            }

            // Force transformation context update
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

    // FIXED: Move finalizeMappingAndClose before handleConfirmMapping to avoid reference error
    const finalizeMappingAndClose = useCallback(() => {
        window.localStorage.setItem(`targetMappingConfirmed_${nodeId}`, "true");
        window.localStorage.setItem(`targetMapping_${nodeId}`, JSON.stringify(localMapping));

        setTargetMapping(localMapping);

        // Force persist SCD config regardless of mapping changes
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

        // FIXED: Final update to target node and context with both mapping and SCD config
        const allNodes = window.allNodes || [];
        const targetNode = allNodes.find(node => node.id === nodeId);
        if (targetNode && targetNode.data && targetNode.data.onDataChange) {
            targetNode.data.onDataChange({
                targetMapping: localMapping,
                scdConfig: finalScdConfig
            });

            // FIXED: Force final context update with both mapping and SCD data
            if (window.transformationContext) {
                const { dispatch, ACTION_TYPES } = window.transformationContext;
                if (dispatch && ACTION_TYPES) {
                    // Update target with both mapping and SCD config
                    dispatch({
                        type: ACTION_TYPES.UPDATE_TARGET,
                        payload: {
                            id: nodeId,
                            data: {
                                targetMapping: localMapping,
                                scdConfig: finalScdConfig
                            }
                        }
                    });

                    // Preserve target mapping
                    dispatch({
                        type: ACTION_TYPES.PRESERVE_TARGET_MAPPING,
                        payload: { targetId: nodeId, mapping: localMapping }
                    });
                }
            }
        }

        onClose();
    }, [localMapping, nodeId, setTargetMapping, onClose, isSCD, forcePersistScdConfig]);

    const handleConfirmMapping = useCallback(() => {
        // Force persist SCD config even if no mapping changes
        if (isSCD) {
            forcePersistScdConfig();
        }

        const hasAnyMapping = Object.values(localMapping).some(val => val && val.trim() !== "");
        if (!hasAnyMapping) {
            setShowConfirmModal(true);
            return;
        }
        finalizeMappingAndClose();
    }, [localMapping, isSCD, forcePersistScdConfig, finalizeMappingAndClose]);

    const handleModalConfirm = () => {
        // Also ensure SCD config is persisted in modal confirm
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


    // Use both sourceColumnOptions prop and our internal state for mapping
    const allSourceColumnsForMapping = useMemo(() => {
        // Start with the provided source column options
        let combined = [...sourceColumnOptions];

        // Add any columns we've found ourselves
        if (availableSourceColumns.length > 0) {
            combined = [...combined, ...availableSourceColumns.map(col => ({ value: col, label: col }))];
        }

        // Deduplicate based on value
        const valueSet = new Set();
        const uniqueOptions = combined.filter(opt => {
            if (!valueSet.has(opt.value)) {
                valueSet.add(opt.value);
                return true;
            }
            return false;
        });

        return uniqueOptions;
    }, [sourceColumnOptions, availableSourceColumns]);

    // Make drawer wider for SCD to avoid clutter
    const drawerWidthClass = useMemo(
        () => (isSCD ? "max-w-3xl md:max-w-4xl" : "max-w-md md:max-w-lg"),
        [isSCD]
    );

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
                    // ...existing loader...
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8E77BB]"></div>
                    </div>
                ) : (
                    <div className="border border-gray-200 rounded-lg px-3 flex-1 overflow-y-auto min-h-[80px] bg-gray-50 shadow-lg" style={{ maxHeight: "80vh", overflowY: "auto" }}>
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
                                const open = dropdownOpen[targetCol] || false;
                                const search = searchTerms[targetCol] || "";
                                const filteredOptions = allSourceColumnsForMapping.filter(opt =>
                                    opt.label.toLowerCase().includes(search.toLowerCase())
                                );

                                const currentValue = localMapping[targetCol] || "";
                                const selectedOption = allSourceColumnsForMapping.find(opt => opt.value === currentValue);
                                const selectedLabel = selectedOption ? selectedOption.label : "";

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
                                            <div className="relative min-w-0">
                                                <button
                                                    type="button"
                                                    className={`w-full p-2 text-[13px] bg-white rounded border border-gray-300 text-gray-800 text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-[#8E77BB] transition-all shadow-sm ${open ? 'ring-2 ring-[#8E77BB] border-[#8E77BB]' : ''}`}
                                                    onClick={() => setDropdownOpen(prev => ({ ...prev, [targetCol]: !prev[targetCol] }))}
                                                >
                                                    <span className={currentValue ? "" : "text-gray-400"}>
                                                        {selectedLabel || currentValue || "Select source column"}
                                                    </span>
                                                    <span className="ml-auto pl-2 text-xs">&#9662;</span>
                                                </button>
                                                {open && (
                                                    <div className="absolute z-20 left-0 right-0 bg-white border border-gray-300 rounded shadow-lg mt-1 max-h-56 overflow-auto">
                                                        <input
                                                            type="search"
                                                            placeholder="Search source columns..."
                                                            className="w-full p-2 text-xs border-b text-gray-700 border-gray-200 focus:outline-none"
                                                            value={search}
                                                            onChange={e => setSearchTerms(prev => ({ ...prev, [targetCol]: e.target.value }))}
                                                            autoFocus
                                                        />
                                                        {filteredOptions.length === 0 && (
                                                            <div className="p-2 text-xs text-gray-400">No columns found</div>
                                                        )}
                                                        <div>
                                                            <div
                                                                className={`p-2 text-xs text-gray-700 cursor-pointer hover:bg-[#f3eaff] rounded ${!currentValue ? "bg-gray-100" : ""}`}
                                                                onClick={() => {
                                                                    handleUpdateMapping(targetCol, "");
                                                                    setDropdownOpen(prev => ({ ...prev, [targetCol]: false }));
                                                                }}
                                                            >
                                                                <span className="text-gray-400">No Mapping</span>
                                                            </div>
                                                            {filteredOptions.map(opt => (
                                                                <div
                                                                    key={opt.value}
                                                                    className={`p-2 text-xs text-gray-700 cursor-pointer hover:bg-[#e9e3f7] rounded ${currentValue === opt.value ? "bg-[#e9e3f7] font-semibold" : ""}`}
                                                                    onClick={() => {
                                                                        handleUpdateMapping(targetCol, opt.value);
                                                                        setDropdownOpen(prev => ({ ...prev, [targetCol]: false }));
                                                                    }}
                                                                >
                                                                    {opt.label}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }

                                // non-SCD row (original)
                                return (
                                    <div key={targetCol} className="flex flex-row items-center mb-4 gap-2">
                                        <div className="text-xs text-gray-800 break-words font-medium px-1 py-1 h-8 bg-gray-50 rounded border border-gray-100 shadow-sm min-w-0 flex-1">
                                            {targetCol}
                                        </div>
                                        <div className="relative flex-1 min-w-0">
                                            {/* ...existing source dropdown button... */}
                                            {/* unchanged code copied from original for non-SCD */}
                                            <button
                                                type="button"
                                                className={`w-full p-2 text-[13px] bg-white rounded border border-gray-300 text-gray-800 text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-[#8E77BB] transition-all shadow-sm ${open ? 'ring-2 ring-[#8E77BB] border-[#8E77BB]' : ''}`}
                                                onClick={() => setDropdownOpen(prev => ({ ...prev, [targetCol]: !prev[targetCol] }))}
                                            >
                                                <span className={currentValue ? "" : "text-gray-400"}>
                                                    {selectedLabel || currentValue || "Select source column"}
                                                </span>
                                                <span className="ml-auto pl-2 text-xs">&#9662;</span>
                                            </button>
                                            {open && (
                                                <div className="absolute z-20 left-0 right-0 bg-white border border-gray-300 rounded shadow-lg mt-1 max-h-56 overflow-auto animate-fade-in">
                                                    <input
                                                        type="search"
                                                        placeholder="Search source columns..."
                                                        className="w-full p-2 text-xs border-b text-gray-700 border-gray-200 focus:outline-none"
                                                        value={search}
                                                        onChange={e => setSearchTerms(prev => ({ ...prev, [targetCol]: e.target.value }))}
                                                        autoFocus
                                                    />
                                                    {filteredOptions.length === 0 && (
                                                        <div className="p-2 text-xs text-gray-400">No columns found</div>
                                                    )}
                                                    <div>
                                                        <div
                                                            className={`p-2 text-xs text-gray-700 cursor-pointer hover:bg-[#f3eaff] rounded ${!currentValue ? "bg-gray-100" : ""}`}
                                                            onClick={() => {
                                                                handleUpdateMapping(targetCol, "");
                                                                setDropdownOpen(prev => ({ ...prev, [targetCol]: false }));
                                                            }}
                                                        >
                                                            <span className="text-gray-400">No Mapping</span>
                                                        </div>
                                                        {filteredOptions.map(opt => (
                                                            <div
                                                                key={opt.value}
                                                                className={`p-2 text-xs text-gray-700 cursor-pointer hover:bg-[#e9e3f7] rounded ${currentValue === opt.value ? "bg-[#e9e3f7] font-semibold" : ""}`}
                                                                onClick={() => {
                                                                    handleUpdateMapping(targetCol, opt.value);
                                                                    setDropdownOpen(prev => ({ ...prev, [targetCol]: false }));
                                                                }}
                                                            >
                                                                {opt.label}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
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