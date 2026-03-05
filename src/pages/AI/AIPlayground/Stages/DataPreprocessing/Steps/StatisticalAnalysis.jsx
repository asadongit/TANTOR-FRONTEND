import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, ChevronUp, CircleCheckBig, CircleX, TriangleAlert, Image as ImageIcon } from 'lucide-react';
import { useAIPlayground } from '../../../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';
import InfoButton from '../../../components/InfoButton';

function StatisticalAnalysis({ onValidationChange, onApiCall }) {
    const hostnameAI = window._env_?.VITE_AI_API;
    const { workflowState, datasetState, updatePreprocessingStep, mode } = useAIPlayground();
    const readonly = mode === 'view';

    const step4Response = workflowState?.dataPreprocessing?.step4?.apiResponse;
    const correlationPlot = step4Response?.correlation_plot;
    const vifReport = step4Response?.vif_report || [];

    const vifDropperRef = useRef(null);

    const [toggles, setToggles] = useState({
        correlation: false,
        vif: false,
    });

    const [expandedSections, setExpandedSections] = useState({
        correlation: false,
        vif: false,
    });

    const [vifDropperEnabled, setVifDropperEnabled] = useState(false);
    const [selectedFeatures, setSelectedFeatures] = useState([]);

    // Only show errors after Next is clicked
    const [showFieldErrors, setShowFieldErrors] = useState(false);

    const sectionDescriptions = {
        correlation: "Correlation graphs visually represent the strength and direction of relationships between numerical variables. They help identify strong positive or negative correlations, which can indicate redundant or highly related features.",
        vif: "VIF Analysis measures how much a feature is linearly dependent on other features in the dataset. High VIF indicate multicollinearity, which can reduce model stability and interpretability"
    };

    useEffect(() => {
        if ((mode === 'view' || mode === 'edit') && workflowState?.dataPreprocessing?.step5?.config) {
            const config = workflowState.dataPreprocessing.step5.config;
            setVifDropperEnabled(config.vif_column_dropper || false);
            setSelectedFeatures(config.vif_columns_to_drop || []);
            setToggles({
                correlation: true,
                vif: config.vif_column_dropper
            });
        }
    }, [mode, workflowState]);

    const riskCounts = vifReport.reduce((acc, curr) => {
        const risk = curr.Multicollinearity_Risk?.toLowerCase();
        if (risk?.includes('high')) acc.high++;
        else if (risk?.includes('moderate')) acc.moderate++;
        else acc.low++;
        return acc;
    }, { low: 0, moderate: 0, high: 0 });

    // Derived error flag — only active after Next is clicked
    const featuresError = showFieldErrors && vifDropperEnabled && selectedFeatures.length === 0;

    // Always report valid to parent — Next is never disabled
    useEffect(() => {
        if (onValidationChange) onValidationChange(true);
    }, []);

    // Auto-clear errors when fixed
    useEffect(() => {
        if (!showFieldErrors) return;
        if (!(vifDropperEnabled && selectedFeatures.length === 0)) {
            setShowFieldErrors(false);
        }
    }, [selectedFeatures, vifDropperEnabled, showFieldErrors]);

    const toggleSwitch = (key) => {
        if (readonly) return;
        const newToggleState = !toggles[key];
        setToggles(prev => ({ ...prev, [key]: newToggleState }));
        if (newToggleState) {
            setExpandedSections({ correlation: false, vif: false, [key]: true });
        } else {
            setExpandedSections(prev => ({ ...prev, [key]: false }));
        }
    };

    const toggleSection = (section) => {
        setExpandedSections({
            correlation: false,
            vif: false,
            [section]: !expandedSections[section]
        });
    };

    const toggleFeatureSelection = (featureName) => {
        if (readonly) return;
        setSelectedFeatures(prev =>
            prev.includes(featureName) ? prev.filter(f => f !== featureName) : [...prev, featureName]
        );
    };

    const toggleAllFeatures = () => {
        if (readonly) return;
        setSelectedFeatures(selectedFeatures.length === vifReport.length ? [] : vifReport.map(row => row.Feature));
    };

    const handleStatisticalAnalysis = useCallback(async () => {
        if (readonly) return true;

        if (vifDropperEnabled && selectedFeatures.length === 0) {
            setShowFieldErrors(true);

            setExpandedSections(prev => ({ ...prev, vif: true }));

            setTimeout(() => {
                if (vifDropperRef.current) {
                    vifDropperRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 50);

            return false;
        }

        try {
            const requestBody = {
                session_id: datasetState.sessionId,
                vif_column_dropper: vifDropperEnabled,
                vif_columns_to_drop: vifDropperEnabled ? selectedFeatures : []
            };

            const response = await fetch(`${hostnameAI}/data/preprocess/statistical_analysis`, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            updatePreprocessingStep('step5', {
                config: {
                    vif_column_dropper: vifDropperEnabled,
                    vif_columns_to_drop: vifDropperEnabled ? selectedFeatures : [],
                    toggles: toggles,
                    expandedSections: expandedSections
                },
                apiResponse: data
            });

            toast.success('Statistical analysis completed successfully!', {
                duration: 3000,
                position: 'top-right',
            });

            return true;
        } catch (error) {
            console.error('Statistical analysis error:', error);
            toast.error(error.message || 'Statistical analysis failed. Please try again.', {
                duration: 4000,
                position: 'top-right',
            });
            return false;
        }
    }, [vifDropperEnabled, selectedFeatures, toggles, expandedSections, datasetState.sessionId, hostnameAI, updatePreprocessingStep]);

    useEffect(() => {
        if (onApiCall) {
            onApiCall(handleStatisticalAnalysis);
        }
    }, [handleStatisticalAnalysis, onApiCall]);

    return (
        <div className="space-y-4">
            {/* What's Included */}
            <div className="bg-gray-50 p-4 rounded-lg">
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

            {/* ── Correlation Graphs Section ── */}
            <div className="bg-gray-50 rounded-lg">
                <div className="p-4 flex items-center justify-between">
                    <div className="flex-1 flex items-center gap-2">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900">Correlation Graphs</h4>
                        </div>
                        <InfoButton sectionDescriptions={sectionDescriptions} section="correlation" />
                    </div>
                    <div className="flex items-center gap-3">
                        <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                            <input
                                type="checkbox"
                                checked={toggles.correlation}
                                onChange={() => toggleSwitch('correlation')}
                                disabled={readonly}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#CCCCCC] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
                        </label>
                        {toggles.correlation && (
                            <button onClick={() => toggleSection('correlation')} className="text-gray-400 hover:text-gray-600">
                                {expandedSections.correlation ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                        )}
                    </div>
                </div>
                {toggles.correlation && expandedSections.correlation && (
                    <div className="p-6">
                        <div className="bg-white p-4 rounded flex flex-col items-center justify-center min-h-[300px]">
                            {correlationPlot ? (
                                <div className="w-full text-center">
                                    <img
                                        src={correlationPlot.startsWith('data:') ? correlationPlot : `data:image/png;base64,${correlationPlot}`}
                                        alt="Correlation Plot"
                                        className="max-w-full h-auto rounded shadow-sm inline-block"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-gray-400 py-10">
                                    <ImageIcon size={48} strokeWidth={1} className="mb-2" />
                                    <p className="text-sm">No correlation plot data available.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-gray-50 rounded-lg">
                <div className="p-4 flex items-center justify-between">
                    <div className="flex-1 flex items-center gap-2">
                        <div>
                            <div className='flex flex-row'>
                                <h4 className="text-sm font-medium text-gray-700 mr-2">VIF Analysis</h4>
                                <InfoButton sectionDescriptions={sectionDescriptions} section="vif" isLastSection={true} />
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{`${vifReport.length} features analyzed | ${selectedFeatures.length} selected to drop`}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                            <input
                                type="checkbox"
                                checked={toggles.vif}
                                onChange={() => toggleSwitch('vif')}
                                disabled={readonly}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#CCCCCC] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
                        </label>
                        {toggles.vif && (
                            <button onClick={() => toggleSection('vif')} className="text-gray-400 hover:text-gray-600">
                                {expandedSections.vif ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                        )}
                    </div>
                </div>

                {toggles.vif && expandedSections.vif && (
                    <div className="px-6 pb-6">
                        {/* Risk summary cards */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-[#F7FFFC] border border-[#36AD8F] rounded-lg px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-md bg-[#D4FFF4] flex items-center justify-center">
                                        <CircleCheckBig className="w-5 h-5 text-[#36AD8F]" />
                                    </div>
                                    <span className="text-sm font-medium text-[#332849]">Low Risk</span>
                                </div>
                                <div className="text-3xl font-bold text-[#36AD8F]">{riskCounts.low}</div>
                            </div>

                            <div className="bg-[#FFF8F2] border border-[#E08E40] rounded-lg px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-md bg-[#FFE8D3] flex items-center justify-center">
                                        <TriangleAlert className="w-5 h-5 text-[#E08E40]" />
                                    </div>
                                    <span className="text-sm font-medium text-[#332849]">Moderate Risk</span>
                                </div>
                                <div className="text-3xl font-bold text-[#E08E40]">{riskCounts.moderate}</div>
                            </div>

                            <div className="bg-[#FFF7F8] border border-[#EF4D5F] rounded-lg px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-md bg-[#FFDCE0] flex items-center justify-center">
                                        <CircleX className="w-5 h-5 text-[#EF4D5F]" />
                                    </div>
                                    <span className="text-sm font-medium text-[#332849]">High Risk</span>
                                </div>
                                <div className="text-3xl font-bold text-[#EF4D5F]">{riskCounts.high}</div>
                            </div>
                        </div>

                        <div ref={vifDropperRef} className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-gray-700">VIF Column Dropper</span>
                                <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                    <input
                                        type="checkbox"
                                        checked={vifDropperEnabled}
                                        onChange={() => !readonly && setVifDropperEnabled(!vifDropperEnabled)}
                                        disabled={readonly}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#CCCCCC] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
                                </label>
                            </div>
                            {vifDropperEnabled && (
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={vifReport.length > 0 && selectedFeatures.length === vifReport.length}
                                            onChange={toggleAllFeatures}
                                            disabled={readonly}
                                            style={{ accentColor: '#8E77BB' }}
                                            className="w-4 h-4 border-[#CCCCCC] rounded focus:ring-[#8E77BB]"
                                        />
                                        <span className="text-[#8e78b7] font-medium">Select All</span>
                                    </label>
                                    <span>Total Rows: {vifReport.length} | Selected: {selectedFeatures.length}</span>
                                </div>
                            )}
                        </div>

                        {featuresError && (
                            <p className="text-xs text-[#EF4D5F] mb-3 pl-0.5">Please select at least one feature to drop</p>
                        )}

                        <div className={`border rounded-lg overflow-hidden max-h-96 overflow-y-auto transition-colors ${
                            featuresError ? 'border-[#EF4D5F] bg-[#FFF7F8]' : 'border-[#CCCCCC]'
                        }`}>
                            <table className="w-full">
                                <thead className={`sticky top-0 z-10 border-b ${featuresError ? 'bg-[#FFF7F8] border-[#EF4D5F]' : 'bg-gray-50 border-[#CCCCCC]'}`}>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Feature</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">VIF Score</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Risk Level</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">{vifDropperEnabled ? 'Drop?' : 'Enable Dropper'}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {vifReport.length > 0 ? (
                                        [...vifReport]
                                            .sort((a, b) => (b.VIF ?? 0) - (a.VIF ?? 0))
                                            .map((row, i) => (
                                                <tr key={i} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm text-gray-700 font-medium">{row.Feature}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">
                                                        {row.VIF != null && typeof row.VIF === 'number'
                                                            ? row.VIF.toFixed(4)
                                                            : row.VIF != null ? row.VIF : '-'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-block px-4 py-1 rounded-md text-xs font-medium ${
                                                            row.Multicollinearity_Risk?.toLowerCase().includes('high')
                                                                ? 'bg-[#F276A74D] text-[#EF4D5F]'
                                                                : row.Multicollinearity_Risk?.toLowerCase().includes('moderate')
                                                                    ? 'bg-orange-100 text-orange-700'
                                                                    : 'bg-[#2AC79240] text-[#069B68]'
                                                        }`}>
                                                            {row.Multicollinearity_Risk}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {vifDropperEnabled ? (
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedFeatures.includes(row.Feature)}
                                                                onChange={() => toggleFeatureSelection(row.Feature)}
                                                                disabled={readonly}
                                                                style={{ accentColor: featuresError ? '#EF4D5F' : '#8E77BB' }}
                                                                className={`w-4 h-4 rounded border transition-colors ${
                                                                    featuresError
                                                                        ? 'border-[#EF4D5F] focus:ring-red-300'
                                                                        : 'border-[#CCCCCC] focus:ring-[#8E77BB]'
                                                                }`}
                                                            />
                                                        ) : (
                                                            <span className="text-sm text-gray-400 italic">Enable switch to drop</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-10 text-center text-gray-400 text-sm">
                                                No VIF data found in workflow state.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StatisticalAnalysis;