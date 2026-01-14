import { Webhook } from 'lucide-react';

const DeliveryAlertsTab = ({ alertFormData, handleAlertInputChange }) => {
    const renderSlider = (label, value, color, onChange, max = 1, step = 0.01) => {
        const sliderColor = color === 'orange' ? '#f97316' : color === 'red' ? '#ef4444' : '#8e78b7';
        const percentage = value * (max === 1 ? 100 : 1);

        return (
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <label className={`text-sm font-medium ${
                        color === 'orange' ? 'text-orange-500' : 
                        color === 'red' ? 'text-red-500' : 
                        'text-gray-700'
                    }`}>
                        {label}
                    </label>
                    <span className="text-base font-semibold text-gray-900">
                        {max === 1 ? value : `${value}%`}
                    </span>
                </div>
                <div className="relative">
                    <input 
                        type="range" 
                        min="0" 
                        max={max} 
                        step={step} 
                        value={value} 
                        onChange={onChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                        style={{
                            background: `linear-gradient(to right, ${sliderColor} 0%, ${sliderColor} ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
                        }}
                    />
                    <div className="absolute" style={{ left: `calc(${percentage}% - 20px)`, top: '20px' }}>
                        <div className="bg-[#8e78b7] text-white text-xs px-2 py-0.5 rounded font-medium">
                            {max === 1 ? value.toFixed(2) : value}
                        </div>
                    </div>
                </div>
                {max === 1 && (
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-gray-600">Strict</span>
                        <span className="text-sm text-gray-600">Loose</span>
                    </div>
                )}
            </div>
        );
    };

    const renderSelect = (label, value, options, field) => (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
            <select 
                value={value} 
                onChange={(e) => handleAlertInputChange(field, e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-500 bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
            >
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );

    return (
        <div className="w-full space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-1.5">Guardrail Setting</h2>
                <p className="text-sm text-gray-500 mb-6">
                    Define thresholds to detect, warn, or halt model runs when data or performance drifts.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg p-6 space-y-6">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                                Global Data Drift Thresholds
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Set default limits to flag or block model runs based on the Population.
                            </p>
                        </div>
                        <div className="space-y-8">
                            {renderSlider(
                                'Warning Threshold', 
                                alertFormData.warningThreshold, 
                                'orange', 
                                (e) => handleAlertInputChange('warningThreshold', parseFloat(e.target.value))
                            )}
                            {renderSlider(
                                'Blocking Threshold (Halt Run)', 
                                alertFormData.blockingThreshold, 
                                'red', 
                                (e) => handleAlertInputChange('blockingThreshold', parseFloat(e.target.value))
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-6 space-y-6">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900 mb-1.5">Model Drift Monitor</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Receive alerts when model performance drops below the baseline.
                            </p>
                        </div>
                        <div>
                            {renderSlider(
                                'F1 Score Decay', 
                                alertFormData.f1ScoreDecay, 
                                'purple', 
                                (e) => handleAlertInputChange('f1ScoreDecay', parseInt(e.target.value)), 
                                100, 
                                1
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-1.5">Alert Channels</h2>
                <p className="text-sm text-gray-500 mb-4">Select how alerts should be delivered.</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                    {[
                        { 
                            key: 'emailEnabled', 
                            label: 'Email', 
                            icon: (
                                <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                </svg>
                            )
                        },
                        { 
                            key: 'slackEnabled', 
                            label: 'Slack', 
                            icon: (
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A" />
                                </svg>
                            )
                        },
                        { 
                            key: 'webhookEnabled', 
                            label: 'Webhook', 
                            icon: <Webhook className="w-6 h-6 text-purple-600" /> 
                        }
                    ].map(({ key, label, icon }) => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={alertFormData[key]} 
                                onChange={(e) => handleAlertInputChange(key, e.target.checked)}
                                className="w-4 h-4 text-[#8e78b7] border-gray-300 rounded focus:ring-[#8e78b7]" 
                            />
                            {icon}
                            <span className="text-base font-medium text-gray-900">{label}</span>
                        </label>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {renderSelect('Alert Subject Template', alertFormData.alertSubjectTemplate, [
                        { value: '', label: 'Select' }, 
                        { value: 'template1', label: 'Default Template' }, 
                        { value: 'template2', label: 'Custom Template' }
                    ], 'alertSubjectTemplate')}
                    {renderSelect('Report Format', alertFormData.reportFormat, [
                        { value: '', label: 'Select' }, 
                        { value: 'pdf', label: 'PDF' }, 
                        { value: 'html', label: 'HTML' }, 
                        { value: 'json', label: 'JSON' }
                    ], 'reportFormat')}
                </div>
            </div>
        </div>
    );
};

export default DeliveryAlertsTab;