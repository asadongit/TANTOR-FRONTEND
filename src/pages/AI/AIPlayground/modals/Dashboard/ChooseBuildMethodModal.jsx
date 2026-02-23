import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useAIPlayground } from '../../../../../context/AIPlaygroundContext';
import { tw } from '../../../../../components/themeContext';
import ModelTrainingIcon from '../../../../../assets/ai/model_training.svg';
import AccountTreeIcon from '../../../../../assets/ai/account_tree.svg';

export const ChooseBuildMethodModal = ({ isOpen, onClose, onProceed }) => {
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [ensembleCount, setEnsembleCount] = useState(2);
    const { setMode } = useAIPlayground();

    if (!isOpen) return null;

    const handleProceed = (method) => {
        onProceed(method, ensembleCount);
        onClose();
        setMode('write');
    };

    const handleArrowClick = (e, method) => {
        e.stopPropagation();
        if (selectedMethod === method) {
            handleProceed(method);
        } else {
            setSelectedMethod(method);
        }
    };

    const decrementCount = () => {
        if (ensembleCount > 2) setEnsembleCount(ensembleCount - 1);
    };

    const incrementCount = () => {
        if (ensembleCount < 10) setEnsembleCount(ensembleCount + 1);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h2 className={tw.sectionHeading}>Choose Build Method</h2>
                    <button
                        onClick={onClose}
                        className="text-[#818181] hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className={tw.label + ' mb-6'}>
                        Select the mode that defines how your model will be configured and executed.
                    </p>

                    {/* Monolithic Option */}
                    <div
                        onClick={() => setSelectedMethod('monolithic')}
                        className={`rounded-lg p-4 mb-4 cursor-pointer transition-all ${
                            selectedMethod === 'monolithic'
                                ? 'bg-violet-50/50'
                                : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                                    <img src={ModelTrainingIcon} alt="Monolithic" className="w-5 h-5" />
                                </div>
                                <span className={`${tw.sectionHeading} text-[#8e78b7]`}>Monolithic</span>
                            </div>
                            <button
                                onClick={(e) => handleArrowClick(e, 'monolithic')}
                                disabled={selectedMethod !== 'monolithic'}
                                className={`p-1 rounded-full transition-all flex-shrink-0 ${
                                    selectedMethod === 'monolithic'
                                        ? 'bg-[#8e78b7] hover:bg-[#7d6ba3] cursor-pointer'
                                        : 'opacity-40 cursor-not-allowed'
                                }`}
                                title={selectedMethod === 'monolithic' ? 'Proceed with Monolithic' : 'Select this card first'}
                            >
                                <ArrowRight className={`w-5 h-5 ${selectedMethod === 'monolithic' ? 'text-white' : 'text-[#8e78b7]'}`} />
                            </button>
                        </div>
                        <p className={tw.label + ' ml-[52px]'}>
                            Train a single model using one unified configuration. Best for straightforward and faster workflows.
                        </p>
                    </div>

                    {/* OR Divider */}
                    <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className={tw.caption}>Or</span>
                        <div className="flex-1 h-px bg-slate-200" />
                    </div>

                    {/* Ensemble Option */}
                    <div
                        onClick={() => setSelectedMethod('ensemble')}
                        className={`rounded-lg p-4 cursor-pointer transition-all ${
                            selectedMethod === 'ensemble'
                                ? 'bg-violet-50/50'
                                : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                                    <img src={AccountTreeIcon} alt="Ensemble" className="w-5 h-5" />
                                </div>
                                <span className={`${tw.sectionHeading} text-[#8e78b7]`}>Ensemble</span>
                            </div>
                            <button
                                onClick={(e) => handleArrowClick(e, 'ensemble')}
                                disabled={selectedMethod !== 'ensemble'}
                                className={`p-1 rounded-full transition-all flex-shrink-0 ${
                                    selectedMethod === 'ensemble'
                                        ? 'bg-[#8e78b7] hover:bg-[#7d6ba3] cursor-pointer'
                                        : 'opacity-40 cursor-not-allowed'
                                }`}
                                title={selectedMethod === 'ensemble' ? 'Proceed with Ensemble' : 'Select this card first'}
                            >
                                <ArrowRight className={`w-5 h-5 ${selectedMethod === 'ensemble' ? 'text-white' : 'text-[#8e78b7]'}`} />
                            </button>
                        </div>
                        <p className={tw.label + ' mb-4 ml-[52px]'}>
                            Configure multiple models individually and combine their outputs. Ideal for improving accuracy and robustness.
                        </p>

                        <div className="ml-[52px]">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={(e) => { e.stopPropagation(); decrementCount(); }}
                                    disabled={ensembleCount <= 2}
                                    className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <span className="text-[#332849] text-lg leading-none">−</span>
                                </button>
                                <div className="w-10 h-8 flex items-center justify-center">
                                    <span className={`${tw.sectionHeading} text-[#8e78b7]`}>{ensembleCount}</span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); incrementCount(); }}
                                    disabled={ensembleCount >= 10}
                                    className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <span className="text-[#332849] text-lg leading-none">+</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Hint */}
                    <p className={`${tw.caption} text-center mt-4 transition-all ${selectedMethod ? 'text-[#8e78b7]' : 'text-slate-400'}`}>
                        {selectedMethod
                            ? `Click → to proceed with ${selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1)}`
                            : 'Click a card to select, then use → to proceed'}
                    </p>
                </div>
            </div>
        </div>
    );
};