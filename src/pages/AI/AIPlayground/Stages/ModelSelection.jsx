import React, { useState } from 'react';
import { AIPlaygroundLayout } from '../AIPlaygroundLayout';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { useLocation } from 'react-router-dom';

function ModelSelection() {
    const location = useLocation();
    const readonly = location.state?.mode === 'view';
    const [algorithms, setAlgorithms] = useState([
        { id: 1, name: 'Algorithm 1', enabled: true, expanded: true },
        { id: 2, name: 'Algorithm 2', enabled: false, expanded: false },
        { id: 3, name: 'Algorithm 3', enabled: false, expanded: false }
    ]);

    const [configMode, setConfigMode] = useState('Base');
    const [normalizeData, setNormalizeData] = useState(true);

    const [metrics, setMetrics] = useState([
        { name: 'Accuracy', enabled: false },
        { name: 'Precision', enabled: false },
        { name: 'Recall', enabled: false },
        { name: 'F1 Score', enabled: false },
        { name: 'Log Loss', enabled: false }
    ]);

    const [metricsExpanded, setMetricsExpanded] = useState(true);

    const [draggedItem, setDraggedItem] = useState(null);

    const toggleAlgorithm = (id) => {
        if (readonly) return;
        setAlgorithms(algorithms.map(algo =>
            algo.id === id ? { ...algo, enabled: !algo.enabled } : algo
        ));
    };

    const toggleExpanded = (id) => {
        if (readonly) return;
        setAlgorithms(algorithms.map(algo =>
            algo.id === id ? { ...algo, expanded: !algo.expanded } : algo
        ));
    };

    const toggleMetric = (index) => {
        if (readonly) return;
        setMetrics(metrics.map((metric, i) =>
            i === index ? { ...metric, enabled: !metric.enabled } : metric
        ));
    };

    const handleDragStart = (e, index) => {
        if (readonly) return;
        setDraggedItem(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        if (readonly) return;
        e.preventDefault();
        if (draggedItem === null || draggedItem === index) return;

        const newMetrics = [...metrics];
        const draggedMetric = newMetrics[draggedItem];
        newMetrics.splice(draggedItem, 1);
        newMetrics.splice(index, 0, draggedMetric);

        setMetrics(newMetrics);
        setDraggedItem(index);
    };

    const handleDragEnd = () => {
        if (readonly) return;
        setDraggedItem(null);
    };

    return (
        <AIPlaygroundLayout readonly={readonly}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Algorithms</h3>
                        <div className="flex gap-4 border-b border-gray-200">
                            <button 
                                disabled={readonly}
                                className="px-4 py-2 text-[#8e78b7] border-b-4 border-[#8e78b7] font-medium"
                            >
                                Linear
                            </button>
                            <button 
                                disabled={readonly}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900"
                            >
                                Tree Based
                            </button>
                            <button 
                                disabled={readonly}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900"
                            >
                                Ensemble
                            </button>
                        </div>
                    </div>

                    {/* Algorithm List */}
                    <div className="space-y-4">
                        {algorithms.map((algo) => (
                            <div key={algo.id} className="bg-gray-50 border border-gray-200 rounded-lg">
                                <div className="flex items-center justify-between p-4">
                                    <span className="font-medium text-gray-900">{algo.name}</span>
                                    <div className="flex items-center gap-3">
                                        <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                            <input
                                                type="checkbox"
                                                checked={algo.enabled}
                                                onChange={() => toggleAlgorithm(algo.id)}
                                                disabled={readonly}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
                                        </label>
                                        <button
                                            onClick={() => toggleExpanded(algo.id)}
                                            disabled={readonly}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            {algo.expanded ? (
                                                <ChevronUp className='w-5 h-5' />
                                            ) : (
                                                <ChevronDown className='w-5 h-5' />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {algo.expanded && algo.id === 1 && (
                                    <div className="bg-white p-4 border-t border-gray-200">
                                        <div className={configMode !== 'Base' ? 'mb-4' : ''}>
                                            <label className="block text-sm font-medium text-gray-900 mb-4">Configuration Mode</label>
                                            <div className="flex gap-4">
                                                {['Base', 'Hyper Parameter', 'Grid Search'].map((mode) => (
                                                    <button
                                                        key={mode}
                                                        onClick={() => !readonly && setConfigMode(mode)}
                                                        disabled={readonly}
                                                        className={`px-6 py-1 text-sm font-medium rounded-lg border transition-colors ${configMode === mode
                                                            ? 'bg-[#8e78b7] text-white border-[#8e78b7]'
                                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                            }
                                                            ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                    >
                                                        {mode}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {configMode !== 'Base' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Penalty</label>
                                                    <select 
                                                        disabled={readonly}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    >
                                                        <option>Select</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">C</label>
                                                    <select 
                                                        disabled={readonly}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    >
                                                        <option>Select</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Solver</label>
                                                    <select 
                                                        disabled={readonly}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    >
                                                        <option>Select</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Field 4</label>
                                                    <select 
                                                        disabled={readonly}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    >
                                                        <option>Select</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">Normalise Data</h3>
                            <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                <input
                                    type="checkbox"
                                    checked={normalizeData}
                                    onChange={(e) => !readonly && setNormalizeData(e.target.checked)}
                                    disabled={readonly}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
                            </label>
                        </div>
                        <p className="text-sm text-gray-600">Scale Features to standard range before training</p>
                        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <p className="text-xs text-gray-700">
                                <span className="font-medium">Note:</span> If a feature scaler has already been applied during data pre-processing, you do not need to normalise the data again.
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">Metrics</h3>
                                <p className="text-sm text-gray-600">Measure how your model performs.</p>
                            </div>
                            <button
                                onClick={() => !readonly && setMetricsExpanded(!metricsExpanded)}
                                disabled={readonly}
                                className="text-gray-400 hover:text-gray-600 ml-4"
                            >
                                {metricsExpanded ? (
                                    <ChevronUp className='w-5 h-5' />
                                ) : (
                                    <ChevronDown className='w-5 h-5' />
                                )}
                            </button>
                        </div>

                        {metricsExpanded && (
                            <>
                                <p className="text-sm text-gray-700 mb-4">
                                    Enable the toggle to set metric priorities. Drag metrics to reorder (P1, P2, P3...).
                                </p>

                                <div className="space-y-3">
                                    {metrics.map((metric, index) => (
                                        <div
                                            key={index}
                                            draggable={!readonly}
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragOver={(e) => handleDragOver(e, index)}
                                            onDragEnd={handleDragEnd}
                                            className={`flex items-center gap-3 p-3 rounded-lg border border-gray-200 ${readonly ? 'cursor-not-allowed' : 'cursor-move'} bg-white transition-colors ${draggedItem === index ? 'opacity-50' : ''
                                                }`}
                                        >
                                            <span className="text-md font-medium text-[#8e78b7] w-8">P{index + 1}</span>
                                            <GripVertical className="w-5 h-5 text-gray-400" />
                                            <span className="flex-1 text-sm font-medium text-gray-900">{metric.name}</span>
                                            <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={metric.enabled}
                                                    onChange={() => toggleMetric(index)}
                                                    disabled={readonly}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AIPlaygroundLayout>
    );
}

export default ModelSelection;