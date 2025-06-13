import React from "react";
import { ChevronDown } from "lucide-react";

export const StringOperationParameters = ({ operator, params, onChange }) => {
    switch (operator) {
        case 'lpad':
        case 'rpad':
            return (
                <div className="space-y-3 mt-3">
                    <div>
                        <label className="block text-xs text-gray-700 mb-1">Max Length</label>
                        <input
                            type="number"
                            className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                            value={params.max_length || ""}
                            onChange={(e) => onChange("max_length", e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-700 mb-1">Padding Character</label>
                        <input
                            type="text"
                            maxLength={1}
                            className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                            value={params.padding_character || ""}
                            onChange={(e) => onChange("padding_character", e.target.value)}
                        />
                    </div>
                </div>
            );
        case 'substr':
            return (
                <div className="space-y-3 mt-3">
                    <div>
                        <label className="block text-xs text-gray-700 mb-1">Start Position</label>
                        <input
                            type="number"
                            className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                            value={params.start_position || ""}
                            onChange={(e) => onChange("start_position", e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-700 mb-1">Number of Characters</label>
                        <input
                            type="number"
                            className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                            value={params.no_of_character || ""}
                            onChange={(e) => onChange("no_of_character", e.target.value)}
                        />
                    </div>
                </div>
            );
        default:
            return null;
    }
};

export const StringOperationFields = ({
    transformation,
    sourceCols,
    targetCols,
    openDropdowns,
    toggleDropdown,
    handleSelectAllColumns,
    handleColumnSelection,
    dropdownRefs
}) => {
    const sourceDropdownKey = `${transformation.id}-source`;
    const targetDropdownKey = `${transformation.id}-target`;
    const isSourceDropdownOpen = openDropdowns[sourceDropdownKey] || false;
    const isTargetDropdownOpen = openDropdowns[targetDropdownKey] || false;

    return (
        <div>
            <div className="grid grid-cols-3 gap-2 items-center">
                <div className="relative" ref={el => dropdownRefs.current[sourceDropdownKey] = el}>
                    <label className="text-xs text-gray-600 block mb-1">Source Columns</label>
                    <button
                        className="w-full p-2 text-black text-sm border border-gray-300 rounded bg-white flex justify-between items-center"
                        onClick={() => toggleDropdown(transformation.id, 'source')}
                    >
                        {transformation.source_column.length === 0 ? (
                            <span className="text-gray-400">Select columns</span>
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

                <div className="flex justify-center">
                    <div className="w-auto h-10 px-3 flex items-center justify-center rounded-full bg-purple-100 border border-purple-200 text-sm font-medium text-[#8E77BB]">
                        {transformation.transformation_operator}
                    </div>
                </div>

                <div className="relative" ref={el => dropdownRefs.current[targetDropdownKey] = el}>
                    <label className="text-xs text-gray-600 block mb-1">Target Columns</label>
                    <button
                        className="w-full p-2 text-black text-sm border border-gray-300 rounded bg-white flex justify-between items-center"
                        onClick={() => toggleDropdown(transformation.id, 'target')}
                    >
                        {transformation.target_column.length === 0 ? (
                            <span className="text-gray-400">Select columns</span>
                        ) : (
                            <span className="truncate">
                                {transformation.target_column.length} column(s) selected
                            </span>
                        )}
                        <ChevronDown className={`w-4 h-4 transition-transform ${isTargetDropdownOpen ? 'transform rotate-180' : ''}`} />
                    </button>

                    {isTargetDropdownOpen && (
                        <div className="absolute text-black z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            <div className="p-2 border-b border-gray-200">
                                <label className="flex items-center text-sm">
                                    <input
                                        type="checkbox"
                                        className="mr-2"
                                        checked={transformation.target_column.length === targetCols.length && targetCols.length > 0}
                                        onChange={(e) => handleSelectAllColumns(transformation.id, 'target', targetCols, e.target.checked)}
                                    />
                                    Select All
                                </label>
                            </div>
                            <div className="py-1">
                                {targetCols.map((column, idx) => (
                                    <label key={idx} className="flex items-center px-3 py-2 hover:bg-gray-100">
                                        <input
                                            type="checkbox"
                                            className="mr-2"
                                            checked={transformation.target_column.includes(column)}
                                            onChange={(e) => handleColumnSelection(transformation.id, 'target', column, e.target.checked)}
                                        />
                                        <span className="text-sm">{column}</span>
                                    </label>
                                ))}
                                {targetCols.length === 0 && (
                                    <div className="px-3 py-2 text-gray-500 text-sm">No columns available</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <StringOperationParameters
                operator={transformation.transformation_operator}
                params={transformation.params}
                onChange={(paramName, value) => {
                    if (typeof transformation.updateStringParam === 'function') {
                        transformation.updateStringParam(transformation.id, paramName, value);
                    }
                }}
            />
        </div>
    );
};

export const getStringParams = (transformation) => {
    switch (transformation.transformation_operator) {
        case 'lpad':
        case 'rpad':
            return {
                max_length: transformation.params.max_length,
                padding_character: transformation.params.padding_character
            };
        case 'substr':
            return {
                start_position: transformation.params.start_position,
                no_of_character: transformation.params.no_of_character
            };
        default:
            return {};
    }
};

export default StringOperationFields;
