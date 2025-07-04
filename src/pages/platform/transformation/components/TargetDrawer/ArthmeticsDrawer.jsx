import React, { useState, useEffect } from "react";



const ArthmeticsDrawer = ({
    nodeId,
    onClose,
    getAllTargetColumns = () => [],
    targetMapping = {},
    setTargetMapping = () => { },
    sourceColumnOptions = [],
}) => {
    return (
        <div className="fixed right-0 top-0 h-full w-full max-w-xs sm:max-w-sm md:max-w-md bg-white shadow-xl z-50 flex flex-col">
            <button
                onClick={onClose}
                className="self-end m-2 text-2xl text-black hover:text-red-500 transition-colors"
                aria-label="Close"
            >
                ×
            </button>
            <div className="flex-1 flex flex-col px-4 pb-4">
                <div className="text-xs font-semibold text-black mb-2 mt-1">Target Mapping</div>
                <div
                    className="border border-gray-300 rounded px-2 flex-1 overflow-y-auto min-h-[80px] bg-white"
                    style={{ maxHeight: "85vh", overflowY: "auto" }}
                >
                    <div className="grid grid-cols-2 gap-2 text-black font-semibold text-xs mb-2 sticky top-0 bg-white z-10">
                        <div>Target Columns</div>
                        <div>Source Columns</div>
                    </div>
                    <div>
                        {getAllTargetColumns().map((targetCol) => (
                            <div key={targetCol} className="grid grid-cols-2 gap-2 items-center mb-2">
                                <div className="text-xs text-gray-800 break-words">{targetCol}</div>
                                <select
                                    className="w-full p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-gray-800"
                                    value={targetMapping[targetCol] || ""}
                                    onChange={e => {
                                        const value = e.target.value;
                                        setTargetMapping(prev => ({
                                            ...prev,
                                            [targetCol]: value
                                        }));
                                    }}
                                >
                                    <option value="">-- Select source column --</option>
                                    {sourceColumnOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
  };

export default ArthmeticsDrawer;