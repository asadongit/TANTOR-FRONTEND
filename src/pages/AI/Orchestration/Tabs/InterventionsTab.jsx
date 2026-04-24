import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useAIPlayground } from '../../../../context/AIPlaygroundContext';
import ModelDriftDetails from './ModelDriftDetails';
import { useNavigate } from 'react-router-dom';

const InterventionsTab = ({ }) => {
    const [interventionsData, setInterventionsData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIntervention, setSelectedIntervention] = useState(null);
    const [modalTab, setModalTab] = useState('SCORE');
    const [actionLoading, setActionLoading] = useState(null);
    const [successModal, setSuccessModal] = useState({ show: false, message: '', scheduleName: '' });
    const [interventionSearchTerm, setInterventionSearchTerm] = useState('');
    const { schedulerState, setProjectState, setMode } = useAIPlayground();
    const hostnameAI = window._env_?.VITE_AI_API;
    const navigate = useNavigate();
    const [retrainModal, setRetrainModal] = useState({ show: false, scheduleName: '', projectId: '', scheduleId: '' });

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

    const handleForceRun = async (scheduleName, scheduleId, e) => {
        e.stopPropagation();
        setActionLoading(`force-${scheduleName}`);

        try {
            const patchResponse = await fetch(
                `${hostnameAI}/orchestration/alerts/action?schedule_id=${scheduleId}&schedule_name=${scheduleName}&action=force_run`,
                {
                    method: 'PATCH',
                    headers: {
                        'accept': 'application/json'
                    }
                }
            );

            if (!patchResponse.ok) {
                throw new Error('Failed to update alert action');
            }

            const response = await fetch(
                `${hostnameAI}/orchestration/model/manualtrigger/${scheduleName}`,
                {
                    method: 'GET',
                    headers: {
                        'accept': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to trigger force run');
            }

            setSuccessModal({
                show: true,
                message: 'Force Run',
                scheduleName: scheduleName
            });

            await fetchInterventionsData();
        } catch (error) {
            console.error('Error triggering force run:', error);
            alert('Failed to trigger force run. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRetrain = async (scheduleName, scheduleId, e) => {
        e.stopPropagation();

        const intervention = interventionsData.find(i => i.schedule_name === scheduleName);
        if (!intervention || !intervention.project_id) {
            return;
        }

        setRetrainModal({
            show: true,
            scheduleName: scheduleName,
            projectId: intervention.project_id,
            scheduleId: scheduleId
        });
    };

    const confirmRetrain = async () => {
        setActionLoading(`retrain-${retrainModal.scheduleName}`);

        try {
            const patchResponse = await fetch(
                `${hostnameAI}/orchestration/alerts/action?schedule_id=${retrainModal.scheduleId}&schedule_name=${retrainModal.scheduleName}&action=retrain`,
                {
                    method: 'PATCH',
                    headers: {
                        'accept': 'application/json'
                    }
                }
            );

            if (!patchResponse.ok) {
                throw new Error('Failed to update alert action for retrain');
            }

            const projectResponse = await fetch(
                `${hostnameAI}/orchestration/project/name-by-id?project_id=${retrainModal.projectId}`,
                {
                    method: 'GET',
                    headers: {
                        'accept': 'application/json'
                    }
                }
            );

            if (!projectResponse.ok) {
                throw new Error('Failed to fetch project name');
            }

            const projectData = await projectResponse.json();

            setProjectState({ selectedProject: projectData.project_name });
            setMode('schedule')

            // Close modal
            setRetrainModal({ show: false, scheduleName: '', projectId: '', scheduleId: '' });
            setActionLoading(null);

            navigate('/ai/playground');
        } catch (error) {
            console.error('Error triggering retrain:', error);
            alert('Failed to trigger retrain. Please try again.');
            setActionLoading(null);
            setRetrainModal({ show: false, scheduleName: '', projectId: '', scheduleId: '' });
        }
    };

    const isRegressionModel = (intervention) => {
        return intervention.modeling_type === 'regression';
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
            const isRegression = isRegressionModel(intervention);

            if (modelDrift && thresholds) {
                // Phase 1 metrics
                if (modelDrift.phase_1) {
                    if (isRegression) {
                        metrics.push(
                            { label: 'Prediction PSI', value: modelDrift.phase_1.prediction_psi, threshold: thresholds.prediction_drift_threshold },
                            { label: 'Residual MAE PSI', value: modelDrift.phase_1.residual_mae_psi, threshold: thresholds.prediction_drift_threshold },
                            { label: 'Residual Std Shift', value: modelDrift.phase_1.residual_std_shift, threshold: thresholds.prediction_drift_threshold },
                            { label: 'Predicted Value JSD', value: modelDrift.phase_1.predicted_value_jsd, threshold: thresholds.prediction_drift_threshold },
                            { label: 'Residual Mean Shift', value: modelDrift.phase_1.residual_mean_shift, threshold: thresholds.prediction_drift_threshold },
                            { label: 'Prediction Std Shift', value: modelDrift.phase_1.prediction_std_shift, threshold: thresholds.prediction_drift_threshold },
                            { label: 'Prediction Mean Shift', value: modelDrift.phase_1.prediction_mean_shift, threshold: thresholds.prediction_drift_threshold },
                            { label: 'Prediction Range Shift', value: modelDrift.phase_1.prediction_range_shift, threshold: thresholds.prediction_drift_threshold }
                        );
                    } else {
                        metrics.push(
                            { label: 'Entropy Shift', value: modelDrift.phase_1.entropy_shift, threshold: thresholds.prediction_drift_threshold },
                            { label: 'Confidence PSI', value: modelDrift.phase_1.confidence_psi, threshold: thresholds.prediction_drift_threshold },
                            { label: 'Entropy Mean Ref', value: modelDrift.phase_1.entropy_mean_ref, threshold: thresholds.prediction_drift_threshold },
                            { label: 'Predicted Label JSD', value: modelDrift.phase_1.predicted_label_jsd, threshold: thresholds.prediction_drift_threshold },
                            { label: 'Mean Probability PSI', value: modelDrift.phase_1.mean_probability_psi, threshold: thresholds.prediction_drift_threshold }
                        );
                    }
                }

                // Phase 2 metrics
                if (modelDrift.phase_2?.metric_shifts) {
                    if (isRegression) {
                        metrics.push(
                            { label: 'R² Shift', value: modelDrift.phase_2.metric_shifts.r2, threshold: thresholds.performance_drift_threshold },
                            { label: 'MAE Shift', value: modelDrift.phase_2.metric_shifts.mae, threshold: thresholds.performance_drift_threshold },
                            { label: 'RMSE Shift', value: modelDrift.phase_2.metric_shifts.rmse, threshold: thresholds.performance_drift_threshold }
                        );
                    } else {
                        metrics.push(
                            { label: 'ROC AUC', value: modelDrift.phase_2.metric_shifts.roc_auc, threshold: thresholds.performance_drift_threshold },
                            { label: 'Accuracy', value: modelDrift.phase_2.metric_shifts.accuracy, threshold: thresholds.performance_drift_threshold },
                            { label: 'Log Loss', value: modelDrift.phase_2.metric_shifts.log_loss, threshold: thresholds.performance_drift_threshold },
                            { label: 'Macro F1', value: modelDrift.phase_2.metric_shifts.macro_f1, threshold: thresholds.performance_drift_threshold }
                        );
                    }
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

    // Filter interventions based on search term
    const filteredInterventionsData = interventionsData.filter(intervention =>
        intervention.schedule_name.toLowerCase().includes(interventionSearchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="text-center py-8 text-gray-500">Loading...</div>;
    }

    if (interventionsData.length === 0) {
        return <div className="text-center py-8 text-gray-500">No interventions found</div>;
    }

    return (
        <>
            {/* Search Bar - Compact, right aligned */}
            <div className="flex justify-end py-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={interventionSearchTerm}
                        onChange={(e) => setInterventionSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                    />
                </div>
            </div>

            {filteredInterventionsData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    {interventionSearchTerm ? 'No interventions found matching your search' : 'No interventions found'}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                    {filteredInterventionsData.map((intervention, index) => (
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
                                    className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={(e) => handleForceRun(intervention.schedule_name, intervention.schedule_id, e)}
                                    disabled={actionLoading === `force-${intervention.schedule_name}`}
                                >
                                    {actionLoading === `force-${intervention.schedule_name}` ? 'Running...' : 'Force Run'}
                                </button>
                                <button
                                    className="flex-1 px-3 sm:px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7d6aa3] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={(e) => handleRetrain(intervention.schedule_name, intervention.schedule_id, e)}
                                    disabled={actionLoading === `retrain-${intervention.schedule_name}`}
                                >
                                    {actionLoading === `retrain-${intervention.schedule_name}` ? 'Retraining...' : 'Retrain'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
                                <div className="space-y-6">
                                    {/* DATA_DRIFT Details */}
                                    {selectedIntervention.intervention_type?.[0] === 'DATA_DRIFT' &&
                                        selectedIntervention.monitoring_data?.data_drift_score?.report_1_raw_features ? (
                                        <>
                                            {/* Numeric Features Table */}
                                            {selectedIntervention.monitoring_data.data_drift_score.report_1_raw_features
                                                .filter(f => f.type === 'numeric').length > 0 && (
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                                            Numeric Features
                                                        </h3>
                                                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                                            <table className="min-w-full divide-y divide-gray-200">
                                                                <thead className="bg-gray-50">
                                                                    <tr>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                            Feature
                                                                        </th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                            KS Stat
                                                                        </th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                            KS P-value
                                                                        </th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                            Wasserstein
                                                                        </th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                            PSI
                                                                        </th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                            Mean Shift
                                                                        </th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                            P95 Shift
                                                                        </th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                            Std Shift
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="bg-white divide-y divide-gray-200">
                                                                    {selectedIntervention.monitoring_data.data_drift_score.report_1_raw_features
                                                                        .filter(f => f.type === 'numeric')
                                                                        .map((feature, idx) => (
                                                                            <tr key={idx} className="hover:bg-gray-50">
                                                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                                                    {feature.feature}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                                                    {typeof feature.ks_stat === 'number' ? feature.ks_stat.toFixed(4) : 'N/A'}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                                                    {typeof feature.ks_pvalue === 'number' ? feature.ks_pvalue.toFixed(4) : 'N/A'}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                                                    {typeof feature.wasserstein === 'number' ? feature.wasserstein.toFixed(4) : 'N/A'}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                                                    {typeof feature.psi === 'number' ? feature.psi.toFixed(4) : 'N/A'}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                                                    {typeof feature.mean_shift === 'number' ? feature.mean_shift.toFixed(4) : 'N/A'}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                                                    {typeof feature.p95_shift === 'number' ? feature.p95_shift.toFixed(4) : 'N/A'}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                                                    {typeof feature.std_shift === 'number' ? feature.std_shift.toFixed(4) : 'N/A'}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                            {/* Categorical Features Table */}
                                            {selectedIntervention.monitoring_data.data_drift_score.report_1_raw_features
                                                .filter(f => f.type === 'categorical').length > 0 && (
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                                            Categorical Features
                                                        </h3>
                                                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                                            <table className="min-w-full divide-y divide-gray-200">
                                                                <thead className="bg-gray-50">
                                                                    <tr>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                            Feature
                                                                        </th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                            Chi2
                                                                        </th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                            Chi2 P-value
                                                                        </th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                            JS Divergence
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="bg-white divide-y divide-gray-200">
                                                                    {selectedIntervention.monitoring_data.data_drift_score.report_1_raw_features
                                                                        .filter(f => f.type === 'categorical')
                                                                        .map((feature, idx) => (
                                                                            <tr key={idx} className="hover:bg-gray-50">
                                                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                                                    {feature.feature}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                                                    {typeof feature.chi2 === 'number' ? feature.chi2.toFixed(4) : 'N/A'}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                                                    {typeof feature.chi2_pvalue === 'number' ? feature.chi2_pvalue.toFixed(4) : 'N/A'}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                                                    {typeof feature.js_divergence === 'number' ? feature.js_divergence.toFixed(4) : 'N/A'}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}
                                        </>
                                    ) : selectedIntervention.intervention_type?.[0] === 'MODEL_DRIFT' &&
                                        selectedIntervention.monitoring_data?.model_drift_score ? (
                                        isRegressionModel(selectedIntervention) ? (
                                            // Regression Model Drift Details
                                            <div className="space-y-6">
                                                {/* Performance Metrics */}
                                                {selectedIntervention.monitoring_data.model_drift_score.phase_2 && (
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                                            Performance Metrics
                                                        </h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                                <p className="text-sm text-gray-600 mb-2">R² Score</p>
                                                                <div className="flex justify-between items-end gap-4">
                                                                    <div>
                                                                        <p className="text-xs text-gray-500 mb-1">Reference</p>
                                                                        <p className="text-lg font-bold text-gray-900">
                                                                            {typeof selectedIntervention.monitoring_data.model_drift_score.phase_2.reference_metrics?.r2 === 'number'
                                                                                ? selectedIntervention.monitoring_data.model_drift_score.phase_2.reference_metrics.r2.toFixed(4)
                                                                                : 'N/A'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500 mb-1">Current</p>
                                                                        <p className="text-lg font-bold text-gray-900">
                                                                            {typeof selectedIntervention.monitoring_data.model_drift_score.phase_2.current_metrics?.r2 === 'number'
                                                                                ? selectedIntervention.monitoring_data.model_drift_score.phase_2.current_metrics.r2.toFixed(4)
                                                                                : 'N/A'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                                <p className="text-sm text-gray-600 mb-2">MAE</p>
                                                                <div className="flex justify-between items-end gap-4">
                                                                    <div>
                                                                        <p className="text-xs text-gray-500 mb-1">Reference</p>
                                                                        <p className="text-lg font-bold text-gray-900">
                                                                            {typeof selectedIntervention.monitoring_data.model_drift_score.phase_2.reference_metrics?.mae === 'number'
                                                                                ? selectedIntervention.monitoring_data.model_drift_score.phase_2.reference_metrics.mae.toFixed(2)
                                                                                : 'N/A'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500 mb-1">Current</p>
                                                                        <p className="text-lg font-bold text-gray-900">
                                                                            {typeof selectedIntervention.monitoring_data.model_drift_score.phase_2.current_metrics?.mae === 'number'
                                                                                ? selectedIntervention.monitoring_data.model_drift_score.phase_2.current_metrics.mae.toFixed(2)
                                                                                : 'N/A'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                                <p className="text-sm text-gray-600 mb-2">RMSE</p>
                                                                <div className="flex justify-between items-end gap-4">
                                                                    <div>
                                                                        <p className="text-xs text-gray-500 mb-1">Reference</p>
                                                                        <p className="text-lg font-bold text-gray-900">
                                                                            {typeof selectedIntervention.monitoring_data.model_drift_score.phase_2.reference_metrics?.rmse === 'number'
                                                                                ? selectedIntervention.monitoring_data.model_drift_score.phase_2.reference_metrics.rmse.toFixed(2)
                                                                                : 'N/A'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500 mb-1">Current</p>
                                                                        <p className="text-lg font-bold text-gray-900">
                                                                            {typeof selectedIntervention.monitoring_data.model_drift_score.phase_2.current_metrics?.rmse === 'number'
                                                                                ? selectedIntervention.monitoring_data.model_drift_score.phase_2.current_metrics.rmse.toFixed(2)
                                                                                : 'N/A'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Residual Profile */}
                                                {selectedIntervention.monitoring_data.model_drift_score.class_wise?.residual_profile && (
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                                            Residual Profile Analysis
                                                        </h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                                <p className="text-sm font-semibold text-gray-800 mb-3">Reference Dataset</p>
                                                                <div className="space-y-2 text-sm">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Mean Residual:</span>
                                                                        <span className="font-medium text-gray-900">
                                                                            {typeof selectedIntervention.monitoring_data.model_drift_score.class_wise.residual_profile.reference?.mean_residual === 'number'
                                                                                ? selectedIntervention.monitoring_data.model_drift_score.class_wise.residual_profile.reference.mean_residual.toFixed(4)
                                                                                : 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Median Residual:</span>
                                                                        <span className="font-medium text-gray-900">
                                                                            {typeof selectedIntervention.monitoring_data.model_drift_score.class_wise.residual_profile.reference?.median_residual === 'number'
                                                                                ? selectedIntervention.monitoring_data.model_drift_score.class_wise.residual_profile.reference.median_residual.toFixed(4)
                                                                                : 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Std Residual:</span>
                                                                        <span className="font-medium text-gray-900">
                                                                            {typeof selectedIntervention.monitoring_data.model_drift_score.class_wise.residual_profile.reference?.std_residual === 'number'
                                                                                ? selectedIntervention.monitoring_data.model_drift_score.class_wise.residual_profile.reference.std_residual.toFixed(2)
                                                                                : 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Mean Absolute Residual:</span>
                                                                        <span className="font-medium text-gray-900">
                                                                            {typeof selectedIntervention.monitoring_data.model_drift_score.class_wise.residual_profile.reference?.mean_absolute_residual === 'number'
                                                                                ? selectedIntervention.monitoring_data.model_drift_score.class_wise.residual_profile.reference.mean_absolute_residual.toFixed(2)
                                                                                : 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">P95 Absolute Residual:</span>
                                                                        <span className="font-medium text-gray-900">
                                                                            {typeof selectedIntervention.monitoring_data.model_drift_score.class_wise.residual_profile.reference?.p95_absolute_residual === 'number'
                                                                                ? selectedIntervention.monitoring_data.model_drift_score.class_wise.residual_profile.reference.p95_absolute_residual.toFixed(2)
                                                                                : 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                                <p className="text-sm font-semibold text-gray-800 mb-3">Current Dataset</p>
                                                                <div className="space-y-2 text-sm">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Mean Residual:</span>
                                                                        <span className="font-medium text-gray-900">
                                                                            {typeof selectedIntervention.monitoring_data.model_drift_score.class_wise.residual_profile.current?.mean_residual === 'number'
                                                                                ? selectedIntervention.monitoring_data.model_drift_score.class_wise.residual_profile.current.mean_residual.toFixed(4)
                                                                                : 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Median Residual:</span>
                                                                        <span className="font-medium text-gray-900">
                                                                            {typeof selectedIntervention.monitoring_data.model_drift_score.class_wise.residual_profile.current?.median_residual === 'number'
                                                                                ? selectedIntervention.monitoring_data.model_drift_score.class_wise.residual_profile.current.median_residual.toFixed(4)
                                                                                : 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Std Residual:</span>
                                                                        <span className="font-medium text-gray-900">
                                                                            {typeof selectedIntervention.monitoring_data.model_drift_score.class_wise.residual_profile.current?.std_residual === 'number'
                                                                                ? selectedIntervention.monitoring_data.model_drift_score.class_wise.residual_profile.current.std_residual.toFixed(2)
                                                                                : 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Mean Absolute Residual:</span>
                                                                        <span className="font-medium text-gray-900">
                                                                            {typeof selectedIntervention.monitoring_data.model_drift_score.class_wise.residual_profile.current?.mean_absolute_residual === 'number'
                                                                                ? selectedIntervention.monitoring_data.model_drift_score.class_wise.residual_profile.current.mean_absolute_residual.toFixed(2)
                                                                                : 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">P95 Absolute Residual:</span>
                                                                        <span className="font-medium text-gray-900">
                                                                            {typeof selectedIntervention.monitoring_data.model_drift_score.class_wise.residual_profile.current?.p95_absolute_residual === 'number'
                                                                                ? selectedIntervention.monitoring_data.model_drift_score.class_wise.residual_profile.current.p95_absolute_residual.toFixed(2)
                                                                                : 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Target Quantile Error Analysis */}
                                                {selectedIntervention.monitoring_data.model_drift_score.class_wise?.target_quantile_error && (
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                                            Target Quantile Error Analysis
                                                        </h3>
                                                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                                            <table className="min-w-full divide-y divide-gray-200">
                                                                <thead className="bg-gray-50">
                                                                    <tr>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                            Quarter
                                                                        </th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                            MAE Shift
                                                                        </th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                            Bias Shift
                                                                        </th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                            RMSE Shift
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="bg-white divide-y divide-gray-200">
                                                                    {selectedIntervention.monitoring_data.model_drift_score.class_wise.target_quantile_error.shift && 
                                                                        selectedIntervention.monitoring_data.model_drift_score.class_wise.target_quantile_error.shift.map((quantile, idx) => (
                                                                            <tr key={idx} className="hover:bg-gray-50">
                                                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                                                    {quantile.bucket}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                                                    {typeof quantile.mae_shift === 'number' ? quantile.mae_shift.toFixed(4) : 'N/A'}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                                                    {typeof quantile.bias_shift === 'number' ? quantile.bias_shift.toFixed(4) : 'N/A'}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                                                    {typeof quantile.rmse_shift === 'number' ? quantile.rmse_shift.toFixed(4) : 'N/A'}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            // Classification Model Drift Details
                                            <ModelDriftDetails selectedIntervention={selectedIntervention} />
                                        )
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            No details available for this intervention type
                                        </div>
                                    )}
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
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {successModal.show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
                            <p className="text-gray-600 mb-6">
                                Schedule <span className="font-semibold text-gray-900">{successModal.scheduleName}</span> has been triggered successfully.
                            </p>
                            <button
                                onClick={() => setSuccessModal({ show: false, message: '', scheduleName: '' })}
                                className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7d6aa3] transition-colors text-sm font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Retrain Confirmation Modal */}
            {retrainModal.show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex flex-col">
                            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4">
                                <svg className="w-8 h-8 text-[#8e78b7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Retrain Model</h3>
                            <p className="text-gray-600 mb-2 text-center">
                                You are about to retrain the model for:
                            </p>
                            <p className="text-center mb-6">
                                <span className="font-semibold text-gray-900">{retrainModal.scheduleName}</span>
                            </p>
                            <p className="text-sm text-gray-500 mb-6 text-center">
                                This will navigate you to the AI Playground where you can configure and retrain the model.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setRetrainModal({ show: false, scheduleName: '', projectId: '', scheduleId: '' })}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                    disabled={actionLoading === `retrain-${retrainModal.scheduleName}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmRetrain}
                                    className="flex-1 px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7d6aa3] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={actionLoading === `retrain-${retrainModal.scheduleName}`}
                                >
                                    {actionLoading === `retrain-${retrainModal.scheduleName}` ? 'Processing...' : 'Continue'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default InterventionsTab;