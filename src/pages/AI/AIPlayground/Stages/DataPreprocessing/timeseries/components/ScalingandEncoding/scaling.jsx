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
    const optionDescriptions = {};
    scalingMethods.forEach(option => {
        optionDescriptions[option.value] = option.description;
    });

    const radioCardClass = (isSelected) =>
        `px-4 py-3 rounded-lg transition-colors group relative ${
            isSelected
                ? 'bg-purple-100 border border-[#8e78b7]'
                : 'bg-white'
        } ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`;

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
                    <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Scaler Method</h5>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {scalingMethods.map((option) => (
                            <label
                                key={option.value}
                                className={radioCardClass(selectedScaling === option.value)}
                            >
                                <div className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="scalingMethod"
                                        value={option.value}
                                        checked={selectedScaling === option.value}
                                        onChange={(e) => !readonly && onScalingChange(e.target.value)}
                                        disabled={readonly}
                                        className="w-4 h-4 accent-[#8e78b7]"
                                    />
                                    <span className={`text-sm font-medium ${selectedScaling === option.value ? 'text-[#8e78b7]' : 'text-gray-700'}`}>
                                        {option.label}
                                    </span>
                                </div>
                                {/* Tooltip */}
                                <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-[#332849] text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                                    <p className="leading-relaxed">{optionDescriptions[option.value]}</p>
                                    <div className="absolute -top-1 left-4 w-2 h-2 bg-[#332849] transform rotate-45"></div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default FeatureScaling;
