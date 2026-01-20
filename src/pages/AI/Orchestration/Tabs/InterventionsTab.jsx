import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAIPlayground } from '../../../../context/AIPlaygroundContext';

const InterventionsTab = ({ }) => {
    const [interventionsData, setInterventionsData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIntervention, setSelectedIntervention] = useState(null);
    const [modalTab, setModalTab] = useState('SCORE');
    const { schedulerState, setSchedulerState } = useAIPlayground();
    const hostnameAI = window._env_?.VITE_AI_API;

    useEffect(() => {
        if (schedulerState.owner_id) {
            fetchInterventionsData();
        }
    }, [schedulerState.owner_id]);

    const fetchInterventionsData = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${hostnameAI}/orchestration/intervention?owner_id=${schedulerState.owner_id}`,
                {
                    method: 'GET',
                    headers: {
                        'accept': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch interventions');
            }

            const data = await response.json();
            setInterventionsData(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching interventions data:', error);
            setLoading(false);
        }
    };

    const getScoreMetrics = (intervention) => {
        const interventionType = intervention.intervention_type?.[0];
        const metrics = [];

        if (interventionType === 'DATA_DRIFT') {
            const aggregated = intervention.monitoring_data?.data_drift_score?.aggregated_metrics;
            const thresholds = intervention.data_drift_threshold;

            if (aggregated && thresholds) {
                metrics.push(
                    { label: 'AUC', value: aggregated.auc, threshold: thresholds.distribution_drift_threshold },
                    { label: 'KS Stat', value: aggregated.ks_stat, threshold: thresholds.distribution_drift_threshold },
                    { label: 'PSI', value: aggregated.psi, threshold: thresholds.distribution_drift_threshold },
                    { label: 'Wasserstein', value: aggregated.wasserstein, threshold: thresholds.distribution_drift_threshold },
                    { label: 'KS P-value', value: aggregated.ks_pvalue, threshold: thresholds.statistical_significance_level },
                    { label: 'Entropy Shift', value: aggregated.entropy_shift, threshold: thresholds.information_stability_threshold },
                    { label: 'Confidence Shift', value: aggregated.confidence_shift, threshold: thresholds.information_stability_threshold },
                    { label: 'Class Prior Shift L1', value: aggregated.class_prior_shift_L1, threshold: thresholds.target_stability_threshold }
                );
            }
        } else if (interventionType === 'MODEL_DRIFT') {
            const modelDrift = intervention.monitoring_data?.model_drift_score;
            const thresholds = intervention.model_drift_threshold;

            if (modelDrift && thresholds) {
                // Phase 1 metrics
                if (modelDrift.phase_1) {
                    metrics.push(
                        { label: 'Entropy Shift', value: modelDrift.phase_1.entropy_shift, threshold: thresholds.prediction_drift_threshold },
                        { label: 'Confidence PSI', value: modelDrift.phase_1.confidence_psi, threshold: thresholds.prediction_drift_threshold },
                        { label: 'Entropy Mean Ref', value: modelDrift.phase_1.entropy_mean_ref, threshold: thresholds.prediction_drift_threshold },
                        { label: 'Predicted Label JSD', value: modelDrift.phase_1.predicted_label_jsd, threshold: thresholds.prediction_drift_threshold },
                        { label: 'Mean Probability PSI', value: modelDrift.phase_1.mean_probability_psi, threshold: thresholds.prediction_drift_threshold }
                    );
                }

                // Phase 2 metrics
                if (modelDrift.phase_2?.metric_shifts) {
                    metrics.push(
                        { label: 'ROC AUC', value: modelDrift.phase_2.metric_shifts.roc_auc, threshold: thresholds.performance_drift_threshold },
                        { label: 'Accuracy', value: modelDrift.phase_2.metric_shifts.accuracy, threshold: thresholds.performance_drift_threshold },
                        { label: 'Log Loss', value: modelDrift.phase_2.metric_shifts.log_loss, threshold: thresholds.performance_drift_threshold },
                        { label: 'Macro F1', value: modelDrift.phase_2.metric_shifts.macro_f1, threshold: thresholds.performance_drift_threshold }
                    );
                }
            }
        }

        return metrics;
    };

    const ScoreBar = ({ label, value, threshold }) => {
        const isAboveThreshold = Math.abs(value) > Math.abs(threshold);
        const maxValue = Math.max(Math.abs(value), Math.abs(threshold)) * 1.5;
        const valuePercentage = maxValue > 0 ? (Math.abs(value) / maxValue) * 100 : 0;
        const thresholdPercentage = maxValue > 0 ? (Math.abs(threshold) / maxValue) * 100 : 0;

        return (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-800">{label}</span>
                    <span className={`text-sm font-bold ${isAboveThreshold ? 'text-red-600' : 'text-green-600'}`}>
                        {typeof value === 'number' ? value.toFixed(4) : 'N/A'}
                    </span>
                </div>

                <div className="relative mb-3">
                    <div className="w-full bg-gray-300 rounded-full h-2.5 relative overflow-hidden">
                        <div
                            className={`absolute top-0 left-0 h-full rounded-full transition-all ${isAboveThreshold ? 'bg-red-500' : 'bg-green-500'
                                }`}
                            style={{ width: `${Math.min(valuePercentage, 100)}%` }}
                        ></div>
                    </div>
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gray-700 rounded"
                        style={{ left: `${Math.min(thresholdPercentage, 100)}%` }}
                    ></div>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Threshold</span>
                    <span className="text-xs font-medium text-gray-700">
                        {typeof threshold === 'number' ? threshold.toFixed(4) : 'N/A'}
                    </span>
                </div>
            </div>
        );
    };

    if (loading) {
        return <div className="text-center py-8 text-gray-500">Loading...</div>;
    }

    if (interventionsData.length === 0) {
        return <div className="text-center py-8 text-gray-500">No interventions found</div>;
    }

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
                {interventionsData.map((intervention, index) => (
                    <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                            setSelectedIntervention(intervention);
                            setModalTab('SCORE');
                        }}
                    >
                        <div className="flex items-start justify-between mb-3 gap-2">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate hover:text-[#8e78b7]">
                                    {intervention.schedule_name}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                    Scheduled: {intervention.schedule_time}
                                </p>
                            </div>
                            <span className="px-2 sm:px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium whitespace-nowrap">
                                Blocked
                            </span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 mt-4">
                            <button
                                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Force Run
                            </button>
                            <button
                                className="flex-1 px-3 sm:px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7d6aa3] transition-colors text-sm font-medium"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Retrain
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {selectedIntervention && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {selectedIntervention.schedule_name}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Intervention Type: {selectedIntervention.intervention_type?.[0]?.replace('_', ' ')}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedIntervention(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="border-b border-gray-200">
                            <div className="flex gap-6 px-6">
                                {['SCORE', 'DETAILS'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setModalTab(tab)}
                                        className={`px-4 py-3 text-sm font-medium transition-colors relative ${modalTab === tab
                                            ? 'text-[#8e78b7]'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        {tab}
                                        {modalTab === tab && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8e78b7]"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {modalTab === 'SCORE' && (
                                <div className="space-y-2">
                                    {getScoreMetrics(selectedIntervention).length > 0 ? (
                                        getScoreMetrics(selectedIntervention).map((metric, idx) => (
                                            <ScoreBar
                                                key={idx}
                                                label={metric.label}
                                                value={metric.value}
                                                threshold={metric.threshold}
                                            />
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            No score metrics available
                                        </div>
                                    )}
                                </div>
                            )}

                            {modalTab === 'DETAILS' && (
                                <div className="text-center py-8 text-gray-500">
                                    Details coming soon...
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                            <button
                                onClick={() => setSelectedIntervention(null)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                            >
                                Close
                            </button>
                            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                                Force Run
                            </button>
                            <button className="px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7d6aa3] transition-colors text-sm font-medium">
                                Retrain
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default InterventionsTab;