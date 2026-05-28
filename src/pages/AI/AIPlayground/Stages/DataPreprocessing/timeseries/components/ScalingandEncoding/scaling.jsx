import React from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { scalingMethods } from '../../../../../../../../hooks/AI/datapreprocessing/descriptions.js';

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
                        {sectionDescriptions?.featureScaler || 'Feature Scaling is the process of standardizing the range of numerical features so they are on a similar scale.'}
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

function FeatureScaling({
    isToggled,
    isExpanded,
    onToggle,
    onExpand,
    selectedScaling,
    onScalingChange,
    readonly,
    sectionDescriptions
}) {
    const [hoveredOption, setHoveredOption] = React.useState(null);

    return (
        <div className="rounded-lg transition-all bg-gray-50">
            <div className="p-4 flex items-center justify-between">
                <div className="flex-1">
                    <div className='flex flex-row'>
                        <h4 className="text-sm font-medium mr-2 text-gray-700">Feature Scaling</h4>
                        <InfoButton sectionDescriptions={sectionDescriptions} section="featureScaler" />
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

            {isToggled && isExpanded && (
                <div className="px-4 pb-4">
                    <div className="mt-4 space-y-3">
                        {scalingMethods.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => !readonly && onScalingChange(option.value)}
                                onMouseEnter={() => setHoveredOption(option.value)}
                                onMouseLeave={() => setHoveredOption(null)}
                                className={`px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                                    selectedScaling === option.value
                                        ? 'bg-purple-100 border border-[#8e78b7]'
                                        : 'bg-white border border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h5 className="text-sm font-medium text-gray-900">{option.label}</h5>
                                        {hoveredOption === option.value && (
                                            <p className="text-xs text-gray-600 mt-1">{option.description}</p>
                                        )}
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border-2 ml-3 mt-0.5 flex-shrink-0 ${
                                        selectedScaling === option.value
                                            ? 'bg-[#8e78b7] border-[#8e78b7]'
                                            : 'border-gray-300'
                                    }`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default FeatureScaling;
