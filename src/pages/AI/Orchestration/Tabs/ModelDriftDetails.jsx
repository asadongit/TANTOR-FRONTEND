import { useState } from 'react';

const ModelDriftDetails = ({ selectedIntervention }) => {
    const [activeHeatmap, setActiveHeatmap] = useState('shift');

    // Error Profile Table Component
    const ErrorProfileTable = ({ errorProfile }) => {
        if (!errorProfile || errorProfile.length === 0) {
            return (
                <div className="text-center py-8 text-gray-500">
                    No error profile data available
                </div>
            );
        }

        return (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                Class
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                Error Rate Shift
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {errorProfile.map((item, idx) => {
                            return (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        Class {item.class}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {typeof item.error_rate_shift === 'number' 
                                            ? item.error_rate_shift.toFixed(4) 
                                            : 'N/A'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    // Confusion Matrix Heatmap Component
    const ConfusionMatrixHeatmap = ({ matrixData, title, type }) => {
        if (!matrixData) {
            return (
                <div className="text-center py-8 text-gray-500">
                    No {title.toLowerCase()} data available
                </div>
            );
        }

        // Extract prediction and true labels
        const predLabels = Object.keys(matrixData).sort();
        const trueLabels = predLabels.length > 0 
            ? Object.keys(matrixData[predLabels[0]]).sort() 
            : [];

        // Find max value for color scaling
        let maxValue = 0;
        predLabels.forEach(pred => {
            trueLabels.forEach(true_label => {
                const value = matrixData[pred]?.[true_label] || 0;
                if (Math.abs(value) > maxValue) maxValue = Math.abs(value);
            });
        });

        // Color scale function
        const getColor = (value) => {
            if (maxValue === 0) return 'rgb(243, 244, 246)';
            
            const normalized = Math.abs(value) / maxValue;
            
            if (type === 'shift') {
                // Red scale for shifts
                if (value === 0) return 'rgb(243, 244, 246)';
                const intensity = Math.floor(255 - (normalized * 155));
                return `rgb(255, ${intensity}, ${intensity})`;
            } else {
                // Purple scale for current/reference
                const intensity = Math.floor(255 - (normalized * 155));
                return `rgb(${intensity}, ${intensity}, 255)`;
            }
        };

        return (
            <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-800">{title}</h4>
                <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg p-6">
                    <div className="inline-block min-w-full">
                        <div className="flex">
                            {/* Y-axis label */}
                            <div className="flex items-center justify-center mr-2">
                                <span className="text-xs font-semibold text-gray-600 transform -rotate-90 whitespace-nowrap">
                                    Predicted
                                </span>
                            </div>
                            
                            <div className="flex-1">
                                {/* X-axis labels */}
                                <div className="flex mb-2 ml-16">
                                    <div className="flex-1 flex justify-around">
                                        {trueLabels.map((label, idx) => (
                                            <span key={idx} className="text-xs font-semibold text-gray-600 w-12 text-center">
                                                {label.replace('true_', '')}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Matrix */}
                                {predLabels.map((pred, rowIdx) => (
                                    <div key={rowIdx} className="flex items-center mb-1">
                                        <span className="text-xs font-semibold text-gray-600 w-16 text-right mr-2">
                                            {pred.replace('pred_', '')}
                                        </span>
                                        <div className="flex-1 flex">
                                            {trueLabels.map((true_label, colIdx) => {
                                                const value = matrixData[pred]?.[true_label] || 0;
                                                return (
                                                    <div
                                                        key={colIdx}
                                                        className="relative group flex-1 aspect-square mx-0.5 rounded transition-all hover:scale-105 hover:shadow-md"
                                                        style={{ 
                                                            backgroundColor: getColor(value),
                                                            minWidth: '48px',
                                                            maxWidth: '60px'
                                                        }}
                                                    >
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <span className="text-xs font-medium text-gray-700">
                                                                {typeof value === 'number' ? value : 0}
                                                            </span>
                                                        </div>
                                                        {/* Tooltip */}
                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                            Pred: {pred.replace('pred_', '')}, True: {true_label.replace('true_', '')}
                                                            <br />
                                                            Value: {typeof value === 'number' ? value.toFixed(4) : 'N/A'}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {/* X-axis title */}
                                <div className="text-center mt-4">
                                    <span className="text-xs font-semibold text-gray-600">
                                        Actual
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-center gap-4">
                            <span className="text-xs text-gray-600">Low</span>
                            <div className="flex gap-1">
                                {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => (
                                    <div
                                        key={idx}
                                        className="w-8 h-4 rounded"
                                        style={{ 
                                            backgroundColor: type === 'shift' 
                                                ? `rgb(255, ${Math.floor(255 - val * 155)}, ${Math.floor(255 - val * 155)})`
                                                : `rgb(${Math.floor(255 - val * 155)}, ${Math.floor(255 - val * 155)}, 255)`
                                        }}
                                    />
                                ))}
                            </div>
                            <span className="text-xs text-gray-600">High</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const modelDriftData = selectedIntervention?.monitoring_data?.model_drift_score;
    const errorProfile = modelDriftData?.class_wise?.error_profile;
    const confusionMatrix = modelDriftData?.class_wise?.confusion_matrix;

    return (
        <div className="space-y-8">
            {/* Error Profile Section */}
            {errorProfile && (
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Class-wise Error Profile
                    </h3>
                    <ErrorProfileTable errorProfile={errorProfile} />
                </div>
            )}

            {/* Confusion Matrix Section */}
            {confusionMatrix && (
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Confusion Matrix Analysis
                    </h3>

                    {/* Tab Navigation */}
                    <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
                        {['shift', 'current', 'reference'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setActiveHeatmap(type)}
                                className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                                    activeHeatmap === type
                                        ? 'bg-white text-[#8e78b7] shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Active Heatmap */}
                    <div className="transition-opacity duration-300">
                        {activeHeatmap === 'shift' && (
                            <ConfusionMatrixHeatmap
                                matrixData={confusionMatrix.shift}
                                title="Shift Matrix"
                                type="shift"
                            />
                        )}
                        {activeHeatmap === 'current' && (
                            <ConfusionMatrixHeatmap
                                matrixData={confusionMatrix.current}
                                title="Current Matrix"
                                type="current"
                            />
                        )}
                        {activeHeatmap === 'reference' && (
                            <ConfusionMatrixHeatmap
                                matrixData={confusionMatrix.reference}
                                title="Reference Matrix"
                                type="reference"
                            />
                        )}
                    </div>
                </div>
            )}

            {!errorProfile && !confusionMatrix && (
                <div className="text-center py-8 text-gray-500">
                    No class-wise details available for this intervention
                </div>
            )}
        </div>
    );
};

export default ModelDriftDetails;