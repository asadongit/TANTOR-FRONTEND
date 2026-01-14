import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

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

const RadioOption = ({ name, value, checked, onChange, label, readonly }) => (
    <label className={`flex items-center gap-2 group ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <input
            type="radio"
            name={name}
            value={value}
            checked={checked}
            onChange={onChange}
            disabled={readonly}
            className="w-4 h-4 text-[#8e78b7] border-gray-300 focus:ring-[#8e78b7]"
        />
        <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
    </label>
);

const FeatureSection = ({
    title,
    description,
    isToggled,
    isExpanded,
    onToggle,
    onExpand,
    children,
    readonly
}) => (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
        <div className="p-4 flex items-center justify-between">
            <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-700">{title}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            </div>
            <div className="flex items-center gap-3">
                <ToggleSwitch checked={isToggled} onChange={onToggle} readonly={readonly} />
                {isToggled && (
                    <button 
                        onClick={onExpand}
                        disabled={readonly}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                )}
            </div>
        </div>

        {isToggled && isExpanded && (
            <div className="px-4 pb-4 border-t border-gray-100">
                <div className="mt-4">{children}</div>
            </div>
        )}
    </div>
);

function FeatureImportance({ readonly = false, maxFeatures = 100 }) {
    const [toggles, setToggles] = useState({
        featureImportance: false,
        dimensionalityReduction: false,
    });

    const [expandedSections, setExpandedSections] = useState({
        featureImportance: false,
        dimensionalityReduction: false,
    });

    const [methodCategory, setMethodCategory] = useState('random-forest');
    const [subMethod, setSubMethod] = useState('random-forest');
    const [numFeatures, setNumFeatures] = useState(Math.min(60, maxFeatures));
    const [reductionMethod, setReductionMethod] = useState('pca');

    const methodCategories = [
        { value: 'filter', label: 'Filter' },
        { value: 'wrapper', label: 'Wrapper' },
        { value: 'embedded', label: 'Embedded' },
        { value: 'unsupervised', label: 'Unsupervised' },
        { value: 'random-forest', label: 'Random Forest' },
    ];

    const reductionMethods = [
        { value: 'pca', label: 'PCA (Principal Component Analysis)' },
        { value: 'lda', label: 'LDA (Linear Discriminant Analysis)' },
        { value: 'tsne', label: 't-SNE' },
        { value: 'umap', label: 'UMAP' },
    ];

    const toggleSwitch = (key) => {
        if (readonly) return;
        const newToggleState = !toggles[key];
        
        setToggles(prev => ({ ...prev, [key]: newToggleState }));

        if (newToggleState) {
            setExpandedSections({
                featureImportance: false,
                dimensionalityReduction: false,
                [key]: true
            });
        } else {
            setExpandedSections(prev => ({ ...prev, [key]: false }));
        }
    };

    const toggleSection = (section) => {
        if (readonly) return;
        setExpandedSections({
            featureImportance: false,
            dimensionalityReduction: false,
            [section]: !expandedSections[section]
        });
    };

    return (
        <div className="space-y-4">
            <FeatureSection
                title="Feature Importance"
                description="Identify and rank the most important features using various statistical methods, including Random Forest."
                isToggled={toggles.featureImportance}
                isExpanded={expandedSections.featureImportance}
                onToggle={() => toggleSwitch('featureImportance')}
                onExpand={() => toggleSection('featureImportance')}
                readonly={readonly}
            >
                <div className="space-y-4">
                    <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Method Category</h5>
                        <div className="space-y-2">
                            {methodCategories.map(option => (
                                <div
                                    key={option.value}
                                    className={`px-3 py-2 rounded border transition-colors ${methodCategory === option.value
                                        ? 'bg-purple-50 border-[#8e78b7]'
                                        : 'bg-white border-gray-200'
                                        }`}
                                >
                                    <RadioOption
                                        name="methodCategory"
                                        value={option.value}
                                        checked={methodCategory === option.value}
                                        onChange={(e) => !readonly && setMethodCategory(e.target.value)}
                                        label={option.label}
                                        readonly={readonly}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Sub-Method</h5>
                        <div className="px-3 py-2 rounded border bg-purple-50 border-[#8e78b7]">
                            <RadioOption
                                name="subMethod"
                                value="random-forest"
                                checked={subMethod === 'random-forest'}
                                onChange={(e) => !readonly && setSubMethod(e.target.value)}
                                label="Random Forest"
                                readonly={readonly}
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Number of Features to Select</h5>
                        <div className="space-y-2">
                            <input
                                type="range"
                                min="1"
                                max={maxFeatures}
                                value={numFeatures}
                                onChange={(e) => !readonly && setNumFeatures(parseInt(e.target.value))}
                                disabled={readonly}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#8e78b7] disabled:cursor-not-allowed"
                                style={{
                                    background: `linear-gradient(to right, #8e78b7 0%, #8e78b7 ${((numFeatures - 1) / (maxFeatures - 1)) * 100}%, #e5e7eb ${((numFeatures - 1) / (maxFeatures - 1)) * 100}%, #e5e7eb 100%)`
                                }}
                            />
                            <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>1</span>
                                <span className="text-sm font-medium text-gray-700">{numFeatures}</span>
                                <span>{maxFeatures}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </FeatureSection>

            <FeatureSection
                title="Dimensionality Reduction"
                description="Reduce feature space while preserving important information."
                isToggled={toggles.dimensionalityReduction}
                isExpanded={expandedSections.dimensionalityReduction}
                onToggle={() => toggleSwitch('dimensionalityReduction')}
                onExpand={() => toggleSection('dimensionalityReduction')}
                readonly={readonly}
            >
                <div className="space-y-4">
                    <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Reduction Method</h5>
                        <select
                            value={reductionMethod}
                            onChange={(e) => !readonly && setReductionMethod(e.target.value)}
                            disabled={readonly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent bg-white"
                        >
                            {reductionMethods.map(method => (
                                <option key={method.value} value={method.value}>
                                    {method.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </FeatureSection>
        </div>
    );
}

export default FeatureImportance;