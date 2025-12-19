import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ToggleSwitch = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
    </label>
);

const RadioOption = ({ name, value, checked, onChange, label }) => (
    <label className="flex items-center gap-2 cursor-pointer group">
        <input
            type="radio"
            name={name}
            value={value}
            checked={checked}
            onChange={onChange}
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
    children
}) => (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
        <div className="p-4 flex items-center justify-between">
            <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-700">{title}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            </div>
            <div className="flex items-center gap-3">
                <ToggleSwitch checked={isToggled} onChange={onToggle} />
                <button onClick={onExpand} className="text-gray-400 hover:text-gray-600">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>
        </div>

        {isExpanded && (
            <div className="px-4 pb-4 border-t border-gray-100">
                <div className="mt-4">{children}</div>
            </div>
        )}
    </div>
);

function FeatureEngineering() {
    const [toggles, setToggles] = useState({
        outlierTreatment: false,
        categoricalEncoding: false,
    });

    const [expandedSections, setExpandedSections] = useState({
        outlierTreatment: false,
        categoricalEncoding: false,
    });

    const [outlierStrategy, setOutlierStrategy] = useState('');

    const categoricalColumns = [
        'Gender', 'Marital_status', 'Education_level', 'Occupation', 'Home_ownership',
        'Preferred_contact_channel', 'Life_event_report', 'Risk_tolerance',
        'Premium_payment_method', 'Region', 'Urban_rural', 'Employment_status',
        'Investment_experience'
    ];

    const options = [
        { value: 'remove', label: 'Remove' },
        { value: 'cap-95', label: 'Cap 95%' },
        { value: 'log-transform', label: 'Log Transform' },
        { value: 'square-root', label: 'Square Root Transform' },
        { value: 'normalize', label: 'Normalize' },
    ];

    const Encodingoptions = [
        { value: 'one-hot', label: 'One Hot' },
        { value: 'label', label: 'Label' },
        { value: 'target', label: 'Target' },
        { value: 'woe', label: 'WOE' },
        { value: 'frequency', label: 'Frequency' },
    ];


    const toggleSwitch = (key) => {
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
        setExpandedSections(prev => ({ ...prev, [key]: !toggles[key] }));
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <div className="space-y-4">
            <FeatureSection
                title="Outlier Treatment"
                description="Handle outliers detected in your dataset."
                isToggled={toggles.outlierTreatment}
                isExpanded={expandedSections.outlierTreatment}
                onToggle={() => toggleSwitch('outlierTreatment')}
                onExpand={() => toggleSection('outlierTreatment')}
            >
                <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Treatment Strategy</h5>
                    <div className="inline-flex w-full items-center gap-2 px-3 py-1.5 bg-orange-50 rounded text-sm">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-orange-400 text-orange-600 text-xs font-medium">
                            !
                        </span>
                        <span className="text-orange-700">363 outliers Detected</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {options.map(option => (
                        <div key={option.value} className="bg-white px-3 py-2 rounded border border-gray-200">
                            <RadioOption
                                name="outlierStrategy"
                                value={option.value}
                                checked={outlierStrategy === option.value}
                                onChange={(e) => setOutlierStrategy(e.target.value)}
                                label={option.label}
                            />
                        </div>
                    ))}
                </div>
            </FeatureSection>

            <FeatureSection
                title="Categorical Encoding"
                description="Encode categorical variables for machine learning."
                isToggled={toggles.categoricalEncoding}
                isExpanded={expandedSections.categoricalEncoding}
                onToggle={() => toggleSwitch('categoricalEncoding')}
                onExpand={() => toggleSection('categoricalEncoding')}
            >
                <div className="space-y-4">
                    <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Categorical Columns</h5>
                        <div className="flex flex-wrap gap-2">
                            {categoricalColumns.map((column) => (
                                <span
                                    key={column}
                                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-500 hover:border-[#8e78b7] hover:bg-purple-50 transition-colors cursor-default"
                                >
                                    {column}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Encoding Method</h5>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                        {Encodingoptions.map(option => (
                            <div key={option.value} className="bg-white px-3 py-2 rounded border border-gray-200">
                                <RadioOption
                                    name="outlierStrategy"
                                    value={option.value}
                                    checked={outlierStrategy === option.value}
                                    onChange={(e) => setOutlierStrategy(e.target.value)}
                                    label={option.label}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </FeatureSection>
        </div>
    );
}

export default FeatureEngineering;