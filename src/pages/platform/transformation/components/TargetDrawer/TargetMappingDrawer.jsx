import React, { useState, useMemo, useEffect, useCallback } from "react";

const TargetMappingDrawer = ({
    nodeId,
    onClose,
    getAllTargetColumns = () => [],
    targetMapping = {},
    setTargetMapping = () => { },
    sourceColumnOptions = [],
}) => {
    const [dropdownOpen, setDropdownOpen] = useState({});
    const [searchTerms, setSearchTerms] = useState({});
    const [globalSearch, setGlobalSearch] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [initialMappingReceived, setInitialMappingReceived] = useState(false);

    const [localMapping, setLocalMapping] = useState({});

    useEffect(() => {
        const hasValidMappings = targetMapping &&
            typeof targetMapping === 'object' &&
            Object.keys(targetMapping).some(key => targetMapping[key]);



        let effectiveMapping = {};

        if (hasValidMappings) {
            effectiveMapping = { ...targetMapping };
        }
        else if (window.localStorage.getItem(`targetMapping_${nodeId}`)) {
            try {
                const storedMapping = JSON.parse(window.localStorage.getItem(`targetMapping_${nodeId}`));

                const targetColumns = getAllTargetColumns();
                const hasValidColumns = Object.keys(storedMapping).some(key =>
                    targetColumns.includes(key)
                );

                if (storedMapping && typeof storedMapping === 'object' && hasValidColumns) {
                    effectiveMapping = storedMapping;
                } else {
                    console.log("herreeeee");
                    window.localStorage.removeItem(`targetMapping_${nodeId}`);
                }
            } catch (e) {
                console.error("Error parsing stored mapping:", e);
            }
        }
        else if (window.transformationContext?.state?.targets?.[nodeId]?.targetMapping) {
            effectiveMapping = { ...window.transformationContext.state.targets[nodeId].targetMapping };
        }
        else if (window.transformationContext?.state?.preservedTargetMappings?.[nodeId]) {
            effectiveMapping = { ...window.transformationContext.state.preservedTargetMappings[nodeId] };
        }

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

    }, [targetMapping, nodeId, getAllTargetColumns]);

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

    const handleConfirmMapping = useCallback(() => {
        const hasAnyMapping = Object.values(localMapping).some(val => val && val.trim() !== "");
        if (!hasAnyMapping) {
            setShowConfirmModal(true);
            return;
        }
        finalizeMappingAndClose();
    }, [localMapping]);

    const finalizeMappingAndClose = useCallback(() => {
        window.localStorage.setItem(`targetMappingConfirmed_${nodeId}`, "true");

        window.localStorage.setItem(`targetMapping_${nodeId}`, JSON.stringify(localMapping));

        setTargetMapping(localMapping);

        const allNodes = window.allNodes || [];
        const targetNode = allNodes.find(node => node.id === nodeId);
        if (targetNode && targetNode.data && targetNode.data.onDataChange) {
            targetNode.data.onDataChange({ targetMapping: localMapping });

            if (window.transformationContext) {
                const { dispatch, ACTION_TYPES } = window.transformationContext;
                if (dispatch && ACTION_TYPES) {
                    dispatch({
                        type: ACTION_TYPES.UPDATE_TARGET,
                        payload: {
                            id: nodeId,
                            data: { targetMapping: localMapping }
                        }
                    });

                    dispatch({
                        type: ACTION_TYPES.PRESERVE_TARGET_MAPPING,
                        payload: {
                            targetId: nodeId,
                            mapping: localMapping
                        }
                    });
                }
            }
        }

        onClose();
    }, [localMapping, nodeId, setTargetMapping, onClose]);

    const handleModalConfirm = () => {
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

    useEffect(() => {
        if (initialMappingReceived) {
            console.log(`Target mapping updated for node ${nodeId}:`, localMapping);
        }
    }, [localMapping, nodeId, initialMappingReceived]);

    return (
        <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 transition-transform duration-300">
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
                        <div className="grid grid-cols-2 gap-2 text-[#8E77BB] font-bold text-base mb-3 sticky top-0 h-8 align-middle w-full bg-white z-10  border-b border-gray-100 pb-2">
                            <div>Target Columns</div>
                            <div>Source Columns</div>
                        </div>
                        <div>
                            {filteredTargetColumns.length === 0 && (
                                <div className="text-center text-xs text-gray-400 py-8">No target columns found.</div>
                            )}
                            {filteredTargetColumns.map((targetCol) => {
                                const open = dropdownOpen[targetCol] || false;
                                const search = searchTerms[targetCol] || "";
                                const filteredOptions = sourceColumnOptions.filter(opt =>
                                    opt.label.toLowerCase().includes(search.toLowerCase())
                                );

                                // Always compute selectedLabel from latest local mapping
                                const currentValue = localMapping[targetCol] || "";
                                const selectedOption = sourceColumnOptions.find(opt => opt.value === currentValue);
                                const selectedLabel = selectedOption ? selectedOption.label : "";

                                return (
                                    <div key={targetCol} className="flex flex-row items-center mb-4 gap-2">
                                        <div className="text-xs text-gray-800 break-words font-medium px-1 py-1 h-8 bg-gray-50 rounded border border-gray-100 shadow-sm min-w-0 flex-1">
                                            {targetCol}
                                        </div>
                                        <div className="relative flex-1 min-w-0">
                                            <button
                                                type="button"
                                                className={`w-full p-2 text-[13px] bg-white rounded border border-gray-300 text-gray-800 text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-[#8E77BB] transition-all shadow-sm ${open ? 'ring-2 ring-[#8E77BB] border-[#8E77BB]' : ''}`}
                                                onClick={() =>
                                                    setDropdownOpen(prev => ({
                                                        ...prev,
                                                        [targetCol]: !prev[targetCol]
                                                    }))
                                                }
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
                                                        onChange={e =>
                                                            setSearchTerms(prev => ({
                                                                ...prev,
                                                                [targetCol]: e.target.value
                                                            }))
                                                        }
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
                                                                setDropdownOpen(prev => ({
                                                                    ...prev,
                                                                    [targetCol]: false
                                                                }));
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
                                                                    setDropdownOpen(prev => ({
                                                                        ...prev,
                                                                        [targetCol]: false
                                                                    }));
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

// In the parent (TargetNode), make sure getAllTargetColumns always returns the latest columns from the source node
// (No change needed here if the prop is already passed as a function that fetches from window.allNodes)
// But if you want to ensure, you can add a note for the parent to always pass a function that fetches the latest columns