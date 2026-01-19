import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, CircleCheckBig, CircleX, TriangleAlert, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useAIPlayground } from '../../../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';

function StatisticalAnalysis({ onValidationChange, onApiCall }) {
    const hostnameAI = window._env_?.VITE_AI_API;
    const { workflowState, datasetState, updatePreprocessingStep, mode } = useAIPlayground();
    const readonly = mode === 'view';

    const step4Response = workflowState?.dataPreprocessing?.step4?.apiResponse;
    const correlationPlot = step4Response?.correlation_plot;
    const vifReport = step4Response?.vif_report || [];

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
    const [validationError, setValidationError] = useState('');
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

    // Validation effect
    useEffect(() => {
        if (vifDropperEnabled && selectedFeatures.length === 0) {
            setValidationError('Please select at least one feature to drop when VIF Column Dropper is enabled.');
            if (onValidationChange) {
                onValidationChange(false);
            }
        } else {
            setValidationError('');
            if (onValidationChange) {
                onValidationChange(true);
            }
        }
    }, [vifDropperEnabled, selectedFeatures, onValidationChange]);

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
            toast.error('Please select at least one feature to drop when VIF Column Dropper is enabled.', {
                duration: 4000,
                position: 'top-right',
            });
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

            {/* Correlation Graphs Section */}
            <div className="bg-gray-50 rounded-lg border border-gray-200">
                <div className="p-4 flex items-center justify-between border-b border-gray-100">
                    <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-700">Correlation Graphs</h4>
                        <p className="text-xs text-gray-400 mt-0.5">Feature relationship visualization</p>
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
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
                        </label>
                        {toggles.correlation && (
                            <button
                                onClick={() => toggleSection('correlation')}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                {expandedSections.correlation ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                        )}
                    </div>
                </div>
                {toggles.correlation && expandedSections.correlation && (
                    <div className="p-6">
                        <div className="bg-white p-4 rounded border border-gray-200 flex flex-col items-center justify-center min-h-[300px]">
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

            {/* VIF Analysis Section */}
            <div className="bg-gray-50 rounded-lg border border-gray-200">
                <div className="p-4 flex items-center justify-between border-b border-gray-100">
                    <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-700">VIF Analysis</h4>
                        <p className="text-xs text-gray-400 mt-0.5">{`${vifReport.length} features analyzed | ${selectedFeatures.length} selected to drop`}</p>
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
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
                        </label>
                        {toggles.vif && (
                            <button
                                onClick={() => toggleSection('vif')}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                {expandedSections.vif ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                        )}
                    </div>
                </div>
                {toggles.vif && expandedSections.vif && (
                    <div className="p-6">
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {/* Low Risk Card */}
                            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-md bg-green-100 flex items-center justify-center">
                                        <CircleCheckBig className="w-5 h-5 text-green-600" />
                                    </div>
                                    <span className="text-sm font-medium text-green-600">Low Risk</span>
                                </div>
                                <div className="text-3xl font-bold text-green-600">{riskCounts.low}</div>
                            </div>

                            {/* Moderate Risk Card */}
                            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-md bg-orange-100 flex items-center justify-center">
                                        <TriangleAlert className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <span className="text-sm font-medium text-orange-600">Moderate Risk</span>
                                </div>
                                <div className="text-3xl font-bold text-orange-600">{riskCounts.moderate}</div>
                            </div>

                            {/* High Risk Card */}
                            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-md bg-red-100 flex items-center justify-center">
                                        <CircleX className="w-5 h-5 text-red-600" />
                                    </div>
                                    <span className="text-sm font-medium text-red-600">High Risk</span>
                                </div>
                                <div className="text-3xl font-bold text-red-600">{riskCounts.high}</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-2 pb-4">
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
                                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
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
                                            className="w-4 h-4 text-[#8e78b7] border-gray-300 rounded focus:ring-[#8e78b7]"
                                        />
                                        <span className="text-[#8e78b7] font-medium">Select All</span>
                                    </label>
                                    <span>Total Rows: {vifReport.length} | Selected: {selectedFeatures.length}</span>
                                </div>
                            )}
                        </div>

                        {/* Validation Error Message */}
                        {vifDropperEnabled && validationError && (
                            <div className="mb-4">
                                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-amber-800">{validationError}</p>
                                </div>
                            </div>
                        )}

                        <div className="border border-gray-300 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Feature</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">VIF Score</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Risk Level</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">{vifDropperEnabled ? 'Drop?' : 'Enable Dropper'}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {vifReport.length > 0 ? vifReport.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-700 font-medium">{row.Feature}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{row.VIF != null && typeof row.VIF === 'number' ? row.VIF.toFixed(4) : row.VIF != null ? row.VIF : '-'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-4 py-1 rounded-md text-xs font-medium ${row.Multicollinearity_Risk?.toLowerCase().includes('high')
                                                    ? 'bg-red-100 text-red-700'
                                                    : row.Multicollinearity_Risk?.toLowerCase().includes('moderate')
                                                        ? 'bg-orange-100 text-orange-700'
                                                        : 'bg-green-100 text-green-700'
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
                                                        className="w-4 h-4 text-[#8e78b7] border-gray-300 rounded focus:ring-[#8e78b7]"
                                                    />
                                                ) : (
                                                    <span className="text-sm text-gray-400 italic">Enable switch to drop</span>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-10 text-center text-gray-400 text-sm">No VIF data found in workflow state.</td>
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