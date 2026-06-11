import React, { useState } from 'react';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { tw } from '../../../../../components/themeContext';

function SidePanel({ normalizeData,
    setNormalizeData,
    metrics,
    setMetrics,
    readonly,
    disabled,
    hasEnabledMetrics,
    showValidation,
    metricFullFormMap,
    forecastHorizon,
    setForecastHorizon,
    isTimeSeries }) {
    const [metricsExpanded, setMetricsExpanded] = useState(true);
    const [draggedItem, setDraggedItem] = useState(null);

    const toggleMetric = (index) => {
        if (readonly || disabled) return;
        const newMetrics = metrics.map((metric, i) =>
            i === index ? { ...metric, enabled: !metric.enabled } : metric
        );
        // Keep enabled metrics at the top, disabled at the bottom
        const enabledMetrics = newMetrics.filter(m => m.enabled);
        const disabledMetrics = newMetrics.filter(m => !m.enabled);
        setMetrics([...enabledMetrics, ...disabledMetrics]);
    };

    const handleDragStart = (e, index) => {
        if (readonly || disabled) return;
        setDraggedItem(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        if (readonly || disabled) return;
        e.preventDefault();
        if (draggedItem === null || draggedItem === index) return;

        // Reorder in place as the user drags, updating draggedItem to track the new position
        const newMetrics = [...metrics];
        const draggedMetric = newMetrics[draggedItem];
        newMetrics.splice(draggedItem, 1);
        newMetrics.splice(index, 0, draggedMetric);
        setMetrics(newMetrics);
        setDraggedItem(index);
    };

    const handleDragEnd = () => {
        if (readonly || disabled) return;
        setDraggedItem(null);
    };

    // Show error state only when validation is triggered and no metric is selected
    const metricsHasError = showValidation && !hasEnabledMetrics;
    const forecastValue = Number(forecastHorizon);

    const forecastHorizonError =
    showValidation &&
    isTimeSeries &&
    (
        !forecastHorizon ||
        forecastValue < 1 ||
        forecastValue > 15
    );
    return (
        <div className="space-y-6">
            {/* Normalise Data toggle */}
            <div className="bg-[#FAFAFA] rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                    <h3 className={tw.sectionHeading}>Normalise Data</h3>
                    <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        <input
                            type="checkbox"
                            checked={normalizeData}
                            onChange={(e) => !(readonly || disabled) && setNormalizeData(e.target.checked)}
                            disabled={readonly || disabled}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
                    </label>
                </div>
                <p className="text-sm text-gray-600">Scale Features to standard range before training</p>
                <div className="mt-4 p-2 bg-white border border-[#8E77BB] rounded-lg">
                    <p className="text-xs text-gray-700">
                        <span className="font-medium text-[#8e78b7]">Note:</span> If a feature scaler has already been applied during data pre-processing, you do not need to normalise the data again.
                    </p>
                </div>
            </div>

            {isTimeSeries && (
                <div
                    className={`bg-[#FAFAFA] rounded-xl p-4 ${
                    forecastHorizonError
                        ? 'border border-red-400 ring-1 ring-red-400'
                        : ''
                }`}
                >
                    <div className="mb-2">
                        <h3
                            className={`${tw.sectionHeading} ${
                                forecastHorizonError ? 'text-red-700' : ''
                            }`}
                        >
                            Forecast Horizon
                        </h3>

                        <p className="text-sm text-gray-600">
                            Number of future periods to forecast.
                        </p>

                        {forecastHorizonError && (
                            <p className="text-xs text-red-600 mt-1">
                                Please select a forecast horizon
                            </p>
                        )}
                    </div>

                    <input
                        type="number"
                        min={1}
                        max={15}
                        value={forecastHorizon}
                        onChange={(e) =>
                            setForecastHorizon(e.target.value)
                        }
                        disabled={readonly || disabled}
                        placeholder="1 - 15"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />

                    
                </div>
            )}

            {/* Metrics section — red border applied when validation fails */}
            <div className={`bg-[#FAFAFA] rounded-xl p-4 ${metricsHasError ? ' border border-red-400 ring-1 ring-red-400' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                        <h3 className={`${tw.sectionHeading} ${metricsHasError ? 'text-red-700' : ''}`}>
                            Metrics
                        </h3>
                        <p className="text-sm text-gray-600">Measure how your model performs.</p>
                        {metricsHasError && (
                            <p className="text-xs text-red-600 mt-1">Please select at least one metric</p>
                        )}
                    </div>
                    <button
                        onClick={() => !(readonly || disabled) && setMetricsExpanded(!metricsExpanded)}
                        disabled={readonly || disabled}
                        className="text-gray-400 hover:text-gray-600 ml-4"
                    >
                        {metricsExpanded ? <ChevronUp className='w-5 h-5' /> : <ChevronDown className='w-5 h-5' />}
                    </button>
                </div>

                {metricsExpanded && (
                    <>
                        <p className="text-sm text-gray-700 mb-4">
                            Enable the toggle to set metric priorities. Drag metrics to reorder (P1, P2, P3...).
                        </p>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                            {metrics.map((metric, index) => (
                                <div
                                    key={index}
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    draggable={!(readonly || disabled)}
                                    // Dim the card being dragged to indicate it's in motion
                                    className={`flex items-center gap-3 p-3 rounded-lg ${(readonly || disabled) ? 'cursor-not-allowed' : 'cursor-move'
                                        } bg-white transition-colors ${draggedItem === index ? 'opacity-50' : ''}`}
                                >
                                    {/* Priority label — reflects current drag order */}
                                    <span className="text-md font-medium text-[#8e78b7] w-8">P{index + 1}</span>
                                    <GripVertical className="w-5 h-5 text-gray-400" />

                                    {/* Metric name with tooltip showing full form on hover */}
                                    <div className="relative group flex-1">
                                        <span className={`${tw.sectionHeading} cursor-pointer`}>
                                            {metric.name}
                                        </span>
                                        {metricFullFormMap?.[metric.name] && (
                                            <div className="
                                                absolute right-0 top-full mt-1
                                                bg-gray-800 text-white text-xs px-2 py-1 rounded
                                                opacity-0 group-hover:opacity-100
                                                transition duration-200
                                                whitespace-nowrap
                                                z-[9999]
                                                pointer-events-none
                                            ">
                                                {metricFullFormMap[metric.name]}
                                            </div>
                                        )}
                                    </div>

                                    <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                        <input
                                            type="checkbox"
                                            checked={metric.enabled}
                                            onChange={() => toggleMetric(index)}
                                            disabled={readonly || disabled}
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
    );
}

export default SidePanel;