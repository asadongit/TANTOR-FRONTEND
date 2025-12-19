import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CircleCheckBig, CircleX, Info, TriangleAlert } from 'lucide-react';

const ToggleSwitch = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
    </label>
);

const BarChart = ({ data, title }) => {
    const maxValue = Math.max(...data);

    return (
        <div className="bg-white p-4 rounded border border-gray-200">
            <p className="text-xs text-gray-500 mb-1 text-center">next_product</p>
            <p className="text-sm font-medium text-gray-700 mb-4 text-center">{title}</p>

            <div className="relative h-64 border-l border-b border-gray-300 ml-8 mr-4 mb-8">
                {/* Y-axis labels */}
                <div className="absolute -left-8 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-600">
                    <span>1.0</span>
                    <span>0.8</span>
                    <span>0.6</span>
                    <span>0.4</span>
                    <span>0.2</span>
                    <span>0.0</span>
                </div>

                {/* Bars */}
                <div className="h-full flex items-end justify-around px-2">
                    {data.map((value, i) => {
                        const heightPercent = (value / 1.0) * 100;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full px-1">
                                <div
                                    className="w-full bg-blue-600 rounded-t"
                                    style={{ height: `${heightPercent}%` }}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* X-axis labels */}
                <div className="absolute -bottom-6 left-0 right-0 flex justify-around text-xs text-gray-600">
                    {data.map((_, i) => (
                        <span key={i}>{i}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

const RiskCard = ({ icon, label, count, bgColor, textColor, iconBg }) => (
    <div className={`${bgColor} border rounded-lg px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-md ${iconBg} flex items-center justify-center`}>
                {icon}
            </div>
            <span className={`text-sm font-medium ${textColor}`}>{label}</span>
        </div>
        <div className={`text-3xl font-bold ${textColor}`}>{count}</div>
    </div>
);

function StatisticalAnalysis() {
    const [isCorrelationExpanded, setIsCorrelationExpanded] = useState(false);
    const [isVIFExpanded, setIsVIFExpanded] = useState(false);
    const [correlationToggled, setCorrelationToggled] = useState(false);
    const [vifToggled, setVifToggled] = useState(false);
    const [vifDropperEnabled, setVifDropperEnabled] = useState(false);
    const [selectedFeatures, setSelectedFeatures] = useState([]);

    const vifData = [
        { feature: 'Const', vifScore: '0.000', riskLevel: 'Low' },
        { feature: 'Const', vifScore: '0.000', riskLevel: 'High' },
        { feature: 'Const', vifScore: 'N/A', riskLevel: 'Low' },
        { feature: 'Const', vifScore: 'N/A', riskLevel: 'High' },
    ];

    const chartData = [
        [0.7, 0.68, 0.65, 0.72, 0.69, 0.7, 0.71, 0.67],
        [0.68, 0.66, 0.64, 0.7, 0.67, 0.69, 0.71, 0.65]
    ];

    const riskIcons = {
        low: <CircleCheckBig className="w-5 h-5 text-green-600" />,
        moderate: <TriangleAlert className="w-5 h-5 text-orange-600" />,
        high: <CircleX className="w-5 h-5 text-red-600" />
    };

    const toggleCorrelation = () => {
        setCorrelationToggled(!correlationToggled);
        setIsCorrelationExpanded(!correlationToggled);
    };

    const toggleVIF = () => {
        setVifToggled(!vifToggled);
        setIsVIFExpanded(!vifToggled);
    };

    const toggleFeatureSelection = (index) => {
        setSelectedFeatures(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const toggleAllFeatures = () => {
        setSelectedFeatures(selectedFeatures.length === vifData.length ? [] : vifData.map((_, i) => i));
    };

    const Section = ({ title, description, isExpanded, isToggled, onToggle, onExpand, children }) => (
        <div className="bg-gray-50 rounded-lg border border-gray-200">
            <div className="p-4 flex items-center justify-between border-b border-gray-100">
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
            {isExpanded && <div className="p-6">{children}</div>}
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h5 className="text-sm font-medium text-[#8e78b7] mb-3">What's Included?</h5>
                <div className="grid grid-cols-2 gap-x-8">
                    {[
                        ['Correlation heatmap to show feature relationships', 'VIF analysis to detect multicollinearity'],
                        ['VIF column dropper to remove problematic features', 'Risk assessment for each feature']
                    ].map((col, colIdx) => (
                        <ul key={colIdx} className="text-xs text-gray-700 space-y-1.5">
                            {col.map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-gray-700 mt-0.5">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    ))}
                </div>
            </div>

            <Section
                title="Correlation Graphs"
                description="Feature relationship visualization"
                isExpanded={isCorrelationExpanded}
                isToggled={correlationToggled}
                onToggle={toggleCorrelation}
                onExpand={() => setIsCorrelationExpanded(!isCorrelationExpanded)}
            >
                <div className="grid grid-cols-2 gap-4">
                    {chartData.map((data, i) => (
                        <BarChart key={i} data={data} title="years_as_customer Distribution by next_product" />
                    ))}
                </div>
            </Section>

            <Section
                title="VIF Analysis"
                description="97 features analyzed | 0 selected to drop"
                isExpanded={isVIFExpanded}
                isToggled={vifToggled}
                onToggle={toggleVIF}
                onExpand={() => setIsVIFExpanded(!isVIFExpanded)}
            >
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <RiskCard icon={riskIcons.low} label="Low Risk" count="10" bgColor="bg-green-50 border-green-200" textColor="text-green-600" iconBg="bg-green-100" />
                    <RiskCard icon={riskIcons.moderate} label="Moderate Risk" count="10" bgColor="bg-orange-50 border-orange-200" textColor="text-orange-600" iconBg="bg-orange-100" />
                    <RiskCard icon={riskIcons.high} label="High Risk" count="10" bgColor="bg-red-50 border-red-200" textColor="text-red-600" iconBg="bg-red-100" />
                </div>

                <div className="flex items-center justify-between mb-2 pb-4">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700">VIF Column Dropper</span>
                        <ToggleSwitch checked={vifDropperEnabled} onChange={() => setVifDropperEnabled(!vifDropperEnabled)} />
                    </div>
                    {vifDropperEnabled && (
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedFeatures.length === vifData.length}
                                    onChange={toggleAllFeatures}
                                    className="w-4 h-4 text-[#8e78b7] border-gray-300 rounded focus:ring-[#8e78b7]"
                                />
                                <span className="text-[#8e78b7] font-medium">Select All</span>
                            </label>
                            <span>Total Rows: 4 | Selected: {selectedFeatures.length}</span>
                        </div>
                    )}
                </div>

                <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Feature', 'VIF Score', 'Risk Level', vifDropperEnabled ? 'Drop?' : 'Enabled Dropper'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-600">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {vifData.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-700">{row.feature}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{row.vifScore}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-block px-4 py-1 rounded-md text-xs font-medium ${row.riskLevel === 'Low' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {row.riskLevel}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {vifDropperEnabled ? (
                                            <input
                                                type="checkbox"
                                                checked={selectedFeatures.includes(i)}
                                                onChange={() => toggleFeatureSelection(i)}
                                                className="w-4 h-4 text-[#8e78b7] border-gray-300 rounded focus:ring-[#8e78b7]"
                                            />
                                        ) : (
                                            <span className="text-sm text-gray-500">Enabled Dropper</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>
        </div>
    );
}

export default StatisticalAnalysis;