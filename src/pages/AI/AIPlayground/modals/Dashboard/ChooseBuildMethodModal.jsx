
import React, { useState } from 'react';
import { X, ArrowRight, Network, Layers } from 'lucide-react';

export const ChooseBuildMethodModal = ({ isOpen, onClose, onProceed }) => {
    const [selectedMethod, setSelectedMethod] = useState('monolithic');
    const [ensembleCount, setEnsembleCount] = useState(2);

    if (!isOpen) return null;

    const handleProceed = () => {
        onProceed(selectedMethod, ensembleCount);
        onClose();
    };

    const decrementCount = () => {
        if (ensembleCount > 2) {
            setEnsembleCount(ensembleCount - 1);
        }
    };

    const incrementCount = () => {
        if (ensembleCount < 10) {
            setEnsembleCount(ensembleCount + 1);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 mx-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900">Choose Build Method</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-sm text-slate-600 mb-6">
                        Select the mode that defines how your model will be configured and executed.
                    </p>

                    {/* Monolithic Option */}
                    <div
                        onClick={() => setSelectedMethod('monolithic')}
                        className={`border-2 rounded-lg p-4 mb-4 cursor-pointer transition-all ${selectedMethod === 'monolithic'
                            ? 'border-[#8e78b7] bg-violet-50/50'
                            : 'border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center">
                                    <Network className="w-5 h-5 text-cyan-600" />
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                                        Monolithic
                                    </div>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-600 ml-[52px]">
                            Train a single model using one unified configuration. Best for straightforward and faster workflows.
                        </p>
                    </div>

                    {/* OR Divider */}
                    <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-slate-200"></div>
                        <span className="text-xs font-medium text-slate-400">Or</span>
                        <div className="flex-1 h-px bg-slate-200"></div>
                    </div>

                    {/* Ensemble Option */}
                    <div
                        onClick={() => setSelectedMethod('ensemble')}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${selectedMethod === 'ensemble'
                            ? 'border-[#8e78b7] bg-violet-50/50'
                            : 'border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                                    <Layers className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-900">Ensemble</div>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-600 mb-4 ml-[52px]">
                            Configure multiple models individually and combine their outputs. Ideal for improving accuracy and robustness.
                        </p>

                        {selectedMethod === 'ensemble' && (
                            <div className="ml-[52px]">
                                <div className="text-sm text-slate-700 mb-2">
                                    Choose how many models you want to build as part of this ensemble:
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            decrementCount();
                                        }}
                                        disabled={ensembleCount <= 2}
                                        className="w-8 h-8 rounded border border-slate-300 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <span className="text-slate-600 text-lg leading-none">−</span>
                                    </button>
                                    <div className="w-16 h-8 border border-slate-300 rounded flex items-center justify-center text-sm font-medium text-slate-900">
                                        {ensembleCount}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            incrementCount();
                                        }}
                                        disabled={ensembleCount >= 10}
                                        className="w-8 h-8 rounded border border-slate-300 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <span className="text-slate-600 text-lg leading-none">+</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleProceed}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#8e78b7] hover:bg-[#7d6ba3] rounded-md transition-colors"
                    >
                        Proceed
                    </button>
                </div>
            </div>
        </div>
    );
};