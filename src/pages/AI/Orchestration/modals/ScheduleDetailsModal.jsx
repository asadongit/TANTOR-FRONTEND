import { X, CheckCircle, AlertTriangle, Activity, Minus, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

const ScheduleDetailsModal = ({ isOpen, onClose, scheduleData, errorData, errorLoading }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible) return null;

    const {
        schedule_name,
        project_name,
        model_name,
        created_by,
        data_drift_check,
        model_drift_check,
        last_drift_check
    } = scheduleData || {};

    const showDataDrift = data_drift_check === 1;
    const showModelDrift = model_drift_check === 1;

    const parseErrorMessage = (errorData) => {
        if (!errorData || !errorData.error || !errorData.error.value) {
            return null;
        }

        try {
            const valueStr = errorData.error.value;

            const errorMatch = valueStr.match(/'error':\s*'(.+)'(?:\})?$/);
            if (!errorMatch) return null;

            let errorStr = errorMatch[1];

            const detailMatch = errorStr.match(/\{\\?"detail\\?":\\?"(.+?)\\?"\}/);
            if (detailMatch) {
                let detail = detailMatch[1];
                detail = detail.replace(/\\'/g, "'")
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\');
                return detail;
            }
            const simpleMatch = errorStr.match(/Predict API failed: \d+ - (.+)/);
            if (simpleMatch) {
                let errorText = simpleMatch[1];
                if (errorText.startsWith('{')) {
                    try {
                        errorText = errorText.replace(/\\"/g, '"');
                        const jsonMatch = errorText.match(/\{"detail":"(.+)"\}/);
                        if (jsonMatch) {
                            return jsonMatch[1].replace(/\\'/g, "'");
                        }
                    } catch (e) {
                    }
                }
                return errorText;
            }

            return errorStr;
        } catch (e) {
            console.error('Error parsing error message:', e);
            return null;
        }
    };

    const errorMessage = parseErrorMessage(errorData);

    const hasValidDriftCheck = last_drift_check &&
        ['Prediction Successful', 'Model Drift Detected', 'Data Drift Detected', 'Data Drift Failed', 'Model Drift Failed'].includes(last_drift_check);

    // Determine box colors and status
    const getBoxStatus = () => {
        if (last_drift_check === 'Prediction Successful') {
            return {
                dataDrift: { color: 'green', text: 'No Drift Detected', icon: CheckCircle },
                modelDrift: { color: 'green', text: 'No Drift Detected', icon: CheckCircle },
                prediction: { color: 'green', text: 'Prediction Successful', icon: CheckCircle }
            };
        } else if (last_drift_check === 'Model Drift Detected') {
            return {
                dataDrift: { color: 'green', text: 'No Drift Detected', icon: CheckCircle },
                modelDrift: { color: 'red', text: 'Model Drift Detected', icon: AlertTriangle },
                prediction: { color: 'gray', text: '', icon: Activity }
            };
        } else if (last_drift_check === 'Data Drift Detected') {
            return {
                dataDrift: { color: 'red', text: 'Data Drift Detected', icon: AlertTriangle },
                modelDrift: { color: 'gray', text: '', icon: Minus },
                prediction: { color: 'gray', text: '', icon: Activity }
            };
        } else if (last_drift_check === 'Data Drift Failed') {
            return {
                dataDrift: { color: 'red', text: 'Data Drift Failed', icon: AlertTriangle },
                modelDrift: { color: 'gray', text: '', icon: Minus },
                prediction: { color: 'gray', text: '', icon: Activity }
            };
        } else if (last_drift_check === 'Model Drift Failed') {
            return {
                dataDrift: { color: 'green', text: 'No Drift Detected', icon: CheckCircle },
                modelDrift: { color: 'red', text: 'Model Drift Failed', icon: AlertTriangle },
                prediction: { color: 'gray', text: '', icon: Activity }
            };
        }
        return null;
    };

    const boxStatus = getBoxStatus();

    const getColorClasses = (color) => {
        switch (color) {
            case 'green':
                return {
                    bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
                    border: 'border-green-200',
                    icon: 'text-green-600',
                    text: 'text-green-700',
                    iconBg: 'bg-green-100'
                };
            case 'red':
                return {
                    bg: 'bg-gradient-to-br from-red-50 to-rose-50',
                    border: 'border-red-200',
                    icon: 'text-red-600',
                    text: 'text-red-700',
                    iconBg: 'bg-red-100'
                };
            case 'gray':
                return {
                    bg: 'bg-gradient-to-br from-gray-50 to-slate-50',
                    border: 'border-gray-200',
                    icon: 'text-gray-500',
                    text: 'text-gray-600',
                    iconBg: 'bg-gray-100'
                };
            default:
                return {
                    bg: 'bg-white',
                    border: 'border-gray-200',
                    icon: 'text-gray-500',
                    text: 'text-gray-600',
                    iconBg: 'bg-gray-100'
                };
        }
    };

    const DriftBox = ({ title, status, icon: Icon }) => {
        const colors = getColorClasses(status.color);
        return (
            <div className={`${colors.bg} ${colors.border} border-2 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200 flex-1 min-w-0`}>
                <div className="flex flex-col items-center space-y-3">
                    <div className={`${colors.icon} ${colors.iconBg} p-3 rounded-full`}>
                        <Icon className="w-7 h-7" strokeWidth={2.5} />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-base font-semibold text-gray-800">
                            {title}
                        </h3>
                        {status.text && (
                            <p className={`${colors.text} text-sm font-medium`}>
                                {status.text}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const Connector = () => (
        <div className="hidden md:flex items-center justify-center px-2">
            <div className="w-10 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
            </div>
        </div>
    );

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className={`relative bg-white shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto transform transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-[#8e78b7] to-[#9d8ac4] px-7 py-5 shadow-md z-10">
                    <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                            <h2 className="text-2xl font-bold text-white">
                                Schedule Details
                            </h2>
                            <div className="flex flex-wrap gap-3 text-sm">
                                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                    <span className="text-white/90">Schedule:</span>
                                    <span className="text-white font-semibold">{schedule_name}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                    <span className="text-white/90">Project:</span>
                                    <span className="text-white font-semibold">{project_name}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                    <span className="text-white/90">Created by:</span>
                                    <span className="text-white font-semibold">{created_by}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                    <span className="text-white/90">Model:</span>
                                    <span className="text-white font-semibold">{model_name}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="ml-4 p-2 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-colors duration-200"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                <div className="p-7">
                    {hasValidDriftCheck && boxStatus && (
                        <>
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-1">Drift Analysis</h3>
                                <p className="text-sm text-gray-600">Monitor data quality, model performance, and prediction status</p>
                            </div>

                            {/* Drift Flow Boxes */}
                            <div className="flex flex-col md:flex-row items-stretch gap-4 mb-6">
                                {showDataDrift && (
                                    <>
                                        <DriftBox
                                            title="Data Drift"
                                            status={boxStatus.dataDrift}
                                            icon={boxStatus.dataDrift.icon}
                                        />
                                        <Connector />
                                    </>
                                )}

                                {showModelDrift && (
                                    <>
                                        <DriftBox
                                            title="Model Drift"
                                            status={boxStatus.modelDrift}
                                            icon={boxStatus.modelDrift.icon}
                                        />
                                        <Connector />
                                    </>
                                )}

                                <DriftBox
                                    title="Prediction"
                                    status={boxStatus.prediction}
                                    icon={boxStatus.prediction.icon}
                                />
                            </div>
                        </>
                    )}

                    {errorMessage ? (
                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 bg-red-100 p-3 rounded-full">
                                    <AlertCircle className="w-6 h-6 text-red-600" strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <h4 className="text-lg font-semibold text-red-800">Error Details</h4>
                                    <div className="bg-white rounded-lg p-4 border border-red-200">
                                        <p className="text-sm text-gray-800 leading-relaxed break-words">
                                            {errorMessage}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : !hasValidDriftCheck ? (
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full">
                                    <AlertCircle className="w-6 h-6 text-blue-600" strokeWidth={2.5} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-semibold text-blue-800 mb-2">No Run Data Available</h4>
                                    <p className="text-sm text-blue-700">
                                        This schedule hasn't run yet or the last run data is not available.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default ScheduleDetailsModal;