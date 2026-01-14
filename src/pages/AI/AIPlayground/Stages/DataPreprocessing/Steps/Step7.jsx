import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Scale, Download, Table, CircleCheckBig } from 'lucide-react';
import { useLocation } from 'react-router-dom';

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

const RadioOption = ({ name, value, checked, onChange, label, description, readonly }) => (
    <label className={`flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'} group`}>
        <input
            type="radio"
            name={name}
            value={value}
            checked={checked}
            onChange={onChange}
            disabled={readonly}
            className="w-4 h-4 mt-0.5 text-[#8e78b7] border-gray-300 focus:ring-[#8e78b7]"
        />
        <div className="flex-1">
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 block">
                {label}
            </span>
            {description && (
                <span className="text-xs text-gray-400 mt-0.5 block">{description}</span>
            )}
        </div>
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
    icon: Icon,
    readonly
}) => (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
        <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
                <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-700">{title}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <ToggleSwitch checked={isToggled} onChange={onToggle} readonly={readonly} />
                <button 
                    onClick={onExpand}
                    disabled={readonly}
                    className="text-gray-400 hover:text-gray-600"
                >
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

const sampleData = [
    { id: 1, purchase_likelihood: 0.0024, annual_income: 0.4703, age: 0, vehicle_count: 0.5000, life_event_recent_Home_Purchase: 0, total_premium_amount: 0.6188, avg_premium_per_product: 0.4611, has_health_insurance: 1, life_event_recent_Job_Change: 0, credit_score: 0.7413, years_at_current_job: 0.5800 },
    { id: 2, purchase_likelihood: 0.0226, annual_income: 0.0412, age: 0.7213, vehicle_count: 0.1250, life_event_recent_Home_Purchase: 0, total_premium_amount: 0.5271, avg_premium_per_product: 0.3927, has_health_insurance: 1, life_event_recent_Job_Change: 0, credit_score: 0.3710, years_at_current_job: 0.0700 },
    { id: 3, purchase_likelihood: 0.8774, annual_income: 0.7473, age: 0.8033, vehicle_count: 0.6280, life_event_recent_Home_Purchase: 0, total_premium_amount: 0.7041, avg_premium_per_product: 0.2623, has_health_insurance: 1, life_event_recent_Job_Change: 0, credit_score: 0.0958, years_at_current_job: 0.1900 },
    { id: 4, purchase_likelihood: 0.0036, annual_income: 0.9637, age: 0.7787, vehicle_count: 0.7560, life_event_recent_Home_Purchase: 1, total_premium_amount: 0.6208, avg_premium_per_product: 0.3595, has_health_insurance: 1, life_event_recent_Job_Change: 0, credit_score: 0.8016, years_at_current_job: 0.9060 },
    { id: 5, purchase_likelihood: 0.5092, annual_income: 0.0987, age: 0.9190, vehicle_count: 0.3250, life_event_recent_Home_Purchase: 0, total_premium_amount: 0.6346, avg_premium_per_product: 0.4729, has_health_insurance: 1, life_event_recent_Job_Change: 1, credit_score: 0.3370, years_at_current_job: 0.2100 },
    { id: 6, purchase_likelihood: 0.9633, annual_income: 0.8887, age: 0.7869, vehicle_count: 0.8250, life_event_recent_Home_Purchase: 0, total_premium_amount: 0.2738, avg_premium_per_product: 0.2937, has_health_insurance: 1, life_event_recent_Job_Change: 1, credit_score: 0.4317, years_at_current_job: 0.3080 },
    { id: 7, purchase_likelihood: 0.6952, annual_income: 0.2607, age: 0.9361, vehicle_count: 0.2560, life_event_recent_Home_Purchase: 0, total_premium_amount: 0.4791, avg_premium_per_product: 0.4569, has_health_insurance: 1, life_event_recent_Job_Change: 0, credit_score: 0.0839, years_at_current_job: 0.0450 },
    { id: 8, purchase_likelihood: 0.9098, annual_income: 0.8283, age: 0.2834, vehicle_count: 0.6250, life_event_recent_Home_Purchase: 0, total_premium_amount: 0.3077, avg_premium_per_product: 0.2781, has_health_insurance: 1, life_event_recent_Job_Change: 0, credit_score: 0.6007, years_at_current_job: 0.4060 },
    { id: 9, purchase_likelihood: 0.6310, annual_income: 0.4003, age: 0.8230, vehicle_count: 0.3760, life_event_recent_Home_Purchase: 0, total_premium_amount: 0.4819, avg_premium_per_product: 0.3599, has_health_insurance: 1, life_event_recent_Job_Change: 0, credit_score: 0.1331, years_at_current_job: 0.0360 },
    { id: 10, purchase_likelihood: 1, annual_income: 0.8705, age: 0.0920, vehicle_count: 0.6250, life_event_recent_Home_Purchase: 0, total_premium_amount: 0.4049, avg_premium_per_product: 0.2388, has_health_insurance: 0, life_event_recent_Job_Change: 0, credit_score: 0.2809, years_at_current_job: 0.4950 },
];

function Step7({ onShowPreview, showPreview }) {
    const location = useLocation();
    const readonly = location.state?.mode === 'view';
    
    const [toggles, setToggles] = useState({
        imbalancedData: true,
    });

    const [expandedSections, setExpandedSections] = useState({
        imbalancedData: true,
    });

    const [samplingMethod, setSamplingMethod] = useState('smote');

    const samplingMethods = [
        {
            value: 'smote',
            label: 'SMOTE',
            description: 'Synthetic Minority Over-sampling Technique'
        },
        {
            value: 'adasyn',
            label: 'ADASYN',
            description: 'Adaptive Synthetic Sampling'
        },
        {
            value: 'borderline-smote',
            label: 'Borderline SMOTE',
            description: 'SMOTE for borderline samples'
        },
        {
            value: 'random-under',
            label: 'Random Under-sampling',
            description: 'Random under-sampling of majority class'
        },
        {
            value: 'tomek-links',
            label: 'Tomek Links',
            description: 'Remove Tomek links'
        },
        {
            value: 'enn',
            label: 'ENN',
            description: 'Edited Nearest Neighbors'
        },
        {
            value: 'smote-tomek',
            label: 'SMOTE + Tomek',
            description: 'Combination of SMOTE and Tomek links'
        },
        {
            value: 'smote-enn',
            label: 'SMOTE + ENN',
            description: 'Combination of SMOTE and ENN'
        },
    ];

    const toggleSwitch = (key) => {
        if (readonly) return;
        setToggles(prev => {
            const newValue = !prev[key];
            setExpandedSections(prevExpanded => ({ ...prevExpanded, [key]: newValue }));
            return { ...prev, [key]: newValue };
        });
    };

    const toggleSection = (section) => {
        if (readonly) return;
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    if (showPreview) {
        return (
            <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                    <div className="rounded-full flex items-center justify-center">
                        <CircleCheckBig className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-green-800">Processing Complete!</h3>
                        <p className="text-xs text-green-600 mt-1">
                            Imbalance handling processed (no resampling). Class weights calculated. Cleaned data and pipeline saved (version 1).
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-4 flex items-center justify-between border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">Cleaned Data Preview</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Showing 1-10 of 10 rows • 61 columns</p>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <Download size={16} />
                            Download All Data
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-purple-100">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700 sticky left-0 bg-purple-100">#</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">purchase_likelihood</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">annual_income</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">age</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">vehicle_count</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">life_event_recent_Home Purchase</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">total_premium_amount</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">avg_premium_per_product</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">has_health_insurance</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">life_event_recent_Job Change</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">credit_score</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">years_at_current_job</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {sampleData.map((row, index) => (
                                    <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-3 py-2 text-gray-700 sticky left-0 bg-inherit">{row.id}</td>
                                        <td className="px-3 py-2 text-gray-600">{row.purchase_likelihood.toFixed(4)}</td>
                                        <td className="px-3 py-2 text-gray-600">{row.annual_income.toFixed(4)}</td>
                                        <td className="px-3 py-2 text-gray-600">{row.age}</td>
                                        <td className="px-3 py-2 text-gray-600">{row.vehicle_count.toFixed(4)}</td>
                                        <td className="px-3 py-2 text-gray-600">{row.life_event_recent_Home_Purchase}</td>
                                        <td className="px-3 py-2 text-gray-600">{row.total_premium_amount.toFixed(4)}</td>
                                        <td className="px-3 py-2 text-gray-600">{row.avg_premium_per_product.toFixed(4)}</td>
                                        <td className="px-3 py-2 text-gray-600">{row.has_health_insurance}</td>
                                        <td className="px-3 py-2 text-gray-600">{row.life_event_recent_Job_Change}</td>
                                        <td className="px-3 py-2 text-gray-600">{row.credit_score.toFixed(4)}</td>
                                        <td className="px-3 py-2 text-gray-600">{row.years_at_current_job.toFixed(4)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <FeatureSection
                title="Imbalanced Data Handling"
                description="Apply sampling techniques to balance class distribution in your dataset"
                isToggled={toggles.imbalancedData}
                isExpanded={expandedSections.imbalancedData}
                onToggle={() => toggleSwitch('imbalancedData')}
                onExpand={() => toggleSection('imbalancedData')}
                icon={Scale}
                readonly={readonly}
            >
                <div className="space-y-2">
                    <div className="flex items-center justify-between mb-4">
                        <h5 className="text-sm font-medium text-gray-700">Sampling Method</h5>
                        <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-md border border-gray-200">
                            {samplingMethods.find(m => m.value === samplingMethod)?.label || 'SMOTE'}
                        </span>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 max-h-96 overflow-y-auto">
                        {samplingMethods.map(method => (
                            <RadioOption
                                key={method.value}
                                name="samplingMethod"
                                value={method.value}
                                checked={samplingMethod === method.value}
                                onChange={(e) => !readonly && setSamplingMethod(e.target.value)}
                                label={method.label}
                                description={method.description}
                                readonly={readonly}
                            />
                        ))}
                    </div>
                </div>
            </FeatureSection>
        </div>
    );
}

export default Step7;