import React from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { encodingMethods } from '../../../../../../../../hooks/AI/datapreprocessing/descriptions.js';

const InfoButton = ({ sectionDescriptions, section }) => {
    const [showInfo, setShowInfo] = React.useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setShowInfo(!showInfo)}
                className="text-gray-400 hover:text-gray-600"
            >
                <Info size={16} />
            </button>
            {showInfo && (
                <div className="absolute left-0 top-6 z-10 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                    <p className="text-xs text-gray-700">
                        {sectionDescriptions?.categoricalEncoding || 'Encode categorical variables for machine learning.'}
                    </p>
                </div>
            )}
        </div>
    );
};

const ToggleSwitch = ({ checked, onChange, readonly }) => (
    <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={readonly}
            className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
    </label>
);

function CategoricalEncoding({
    isToggled,
    isExpanded,
    onToggle,
    onExpand,
    selectedEncoding,
    onEncodingChange,
    readonly,
    hasError,
    sectionDescriptions,
    hasCategoricalColumns
}) {
    const [hoveredOption, setHoveredOption] = React.useState(null);

    const optionDescriptions = {};
    encodingMethods.forEach(option => {
        optionDescriptions[option.value] = option.description;
    });

    return (
        <div className={`rounded-lg transition-all ${hasError ? 'bg-red-50 border border-red-400' : 'bg-gray-50'}`}>
            <div className="p-4 flex items-center justify-between">
                <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1">
                        <div className='flex flex-row'>
                            <h4 className={`text-sm font-medium mr-2 ${hasError ? 'text-red-700' : 'text-gray-700'}`}>
                                Categorical Encoding
                            </h4>
                            <InfoButton sectionDescriptions={sectionDescriptions} section="categoricalEncoding" />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ToggleSwitch checked={isToggled} onChange={onToggle} readonly={readonly} />
                    {isToggled && (
                        <button onClick={onExpand} className="text-gray-400 hover:text-gray-600">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                    )}
                </div>
            </div>
            <div className="px-4 pb-4">
  <div className="flex items-center gap-2 px-3 py-2 border border-[#8E77BB] bg-[#FAF8FF] rounded-lg">
    <Info size={14} className="text-[#8E77BB]" />

    <p className="text-sm text-[#8E77BB]">
      {!hasCategoricalColumns
        ? 'Categorical encoding is not available because your dataset does not contain categorical columns'
        : isToggled
        ? 'Categorical encoding is required because your dataset contains categorical columns'
        : 'Categorical encoding is available because your dataset contains categorical columns'}
    </p>
  </div>
</div>
            {isToggled && isExpanded && (
                <div className="px-4 pb-4">
                    <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Encoding Method</h5>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                        {encodingMethods.map((option) => (
                            <div
                                key={option.value}
                                className="relative"
                                onMouseEnter={() => setHoveredOption(option.value)}
                                onMouseLeave={() => setHoveredOption(null)}
                            >
                                <label
                                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                                        selectedEncoding === option.value
                                            ? 'bg-[#FAF8FF] border border-[#8e78b7]'
                                            : 'bg-white'
                                    } ${readonly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                >
                                    <input
                                        type="radio"
                                        name="encodingStrategy"
                                        value={option.value}
                                        checked={selectedEncoding === option.value}
                                        onChange={(e) => !readonly && onEncodingChange(e.target.value)}
                                        disabled={readonly}
                                        className="w-4 h-4 accent-[#8e78b7]"
                                    />
                                    <span className={`text-sm font-medium ${selectedEncoding === option.value ? 'text-[#8e78b7]' : 'text-gray-700'}`}>
                                        {option.label}
                                    </span>
                                </label>

                                {hoveredOption === option.value && (
                                    <div className="absolute left-0 top-full mt-2 z-50 w-80 p-3 bg-[#332849] text-white text-xs rounded-lg shadow-lg">
                                        <div className="absolute -top-1 left-4 w-2 h-2 bg-[#332849] transform rotate-45"></div>
                                        <p className="leading-relaxed">{optionDescriptions[option.value]}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default CategoricalEncoding;
