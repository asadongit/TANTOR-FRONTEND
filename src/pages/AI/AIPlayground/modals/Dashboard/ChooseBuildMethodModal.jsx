import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useAIPlayground } from '../../../../../context/AIPlaygroundContext';
import { tw } from '../../../../../components/themeContext';
import ModelTrainingIcon from '../../../../../assets/ai/model_training.svg';
import AccountTreeIcon from '../../../../../assets/ai/account_tree.svg';
import ArrowRightIcon from '../../../../../assets/ai/arrow_right.svg';

const headingCls = "font-['Satoshi'] font-medium text-[18px] leading-none tracking-normal";
const bodyCls = "font-['Satoshi'] font-normal text-[16px] leading-none tracking-normal";

export const ChooseBuildMethodModal = ({ isOpen, onClose, onProceed }) => {
    const [ensembleCount, setEnsembleCount] = useState(2);
    const { setMode } = useAIPlayground();

    if (!isOpen) return null;

    const handleProceed = (method) => {
        onProceed(method, ensembleCount);
        onClose();
        setMode('write');
    };

    const decrementCount = () => {
        if (ensembleCount > 2) setEnsembleCount(ensembleCount - 1);
    };

    const incrementCount = () => {
        if (ensembleCount < 10) setEnsembleCount(ensembleCount + 1);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-xl w-full">

                {/* Header */}
                <div className="flex items-center justify-between p-6">
                    <h2 className={`${headingCls} text-[#282F49]`}>Choose Build Method</h2>
                    <button
                        onClick={onClose}
                        className="text-[#818181] hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 pb-6">
                    <p className={`${bodyCls} mb-6 text-[#332849]`}>
                        Select the mode that defines how your model will be configured and executed.
                    </p>

                    {/* Monolithic Option */}
                    <div
                        onClick={() => handleProceed('monolithic')}
                        className="rounded-lg p-4 mb-4 cursor-pointer transition-all bg-[#FAFAFA] hover:bg-[#FAF8FF] hover:shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-5 h-5 flex items-center flex-shrink-0 mr-3">
                                    <img src={ModelTrainingIcon} alt="Monolithic" className="w-5 h-5" />
                                </div>
                                <span className={`${headingCls} text-[#8e78b7]`}>Monolithic</span>
                            </div>
                            <img src={ArrowRightIcon} alt="arrow right" className="w-4 h-4 flex-shrink-0" style={{ filter: 'brightness(0) saturate(100%) invert(45%) sepia(60%) saturate(400%) hue-rotate(220deg) brightness(95%) contrast(90%)' }} />
                        </div>
                        <p className={`${bodyCls} mt-4 text-[#332849]`} style={{ lineHeight: '1.5' }}>
                            Train a single model using one unified configuration.<br />
                            Best for straightforward and faster workflows.
                        </p>
                    </div>

                    {/* OR Divider */}
                    <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-[#F1F0F3]" />
                        <span className={`${bodyCls} text-[#818181]`}>Or</span>
                        <div className="flex-1 h-px bg-[#F1F0F3]" />
                    </div>

                    {/* Ensemble Option */}
                    <div
                        onClick={() => handleProceed('ensemble')}
                        className="rounded-lg p-4 cursor-pointer transition-all bg-[#FAFAFA] hover:bg-[#FAF8FF] hover:shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-5 h-5 flex items-center flex-shrink-0 mr-2">
                                    <img src={AccountTreeIcon} alt="Ensemble" className="w-5 h-5" />
                                </div>
                                <span className={`${headingCls} text-[#8e78b7]`}>Ensemble</span>
                            </div>
                            <img src={ArrowRightIcon} alt="arrow right" className="w-4 h-4 flex-shrink-0" style={{ filter: 'brightness(0) saturate(100%) invert(45%) sepia(60%) saturate(400%) hue-rotate(220deg) brightness(95%) contrast(90%)' }} />
                        </div>

                        <p className={`${bodyCls} mt-4 text-[#332849]`} style={{ lineHeight: '1.5' }}>
                            Configure multiple models individually and combine their outputs.<br />
                            Ideal for improving accuracy and robustness.
                        </p>

                        <p className={`${bodyCls} mt-3 border-t border-[#F1F0F3] pt-3 text-[#332849]`} style={{ lineHeight: '1.5' }}>
                            Choose how many models you want to build as part of this ensemble.
                        </p>

                        <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center gap-6 bg-white p-2 inline-flex rounded-lg">
                                <button
                                    onClick={(e) => { e.stopPropagation(); decrementCount(); }}
                                    disabled={ensembleCount <= 2}
                                    className="w-10 h-10 rounded-lg bg-[#FAFAFA] flex items-center justify-center hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <span className={`${headingCls} text-[#332849]`}>−</span>
                                </button>
                                <div className="w-10 h-10 flex items-center justify-center">
                                    <span className={`${headingCls} text-[#8e78b7]`}>{ensembleCount}</span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); incrementCount(); }}
                                    disabled={ensembleCount >= 10}
                                    className="w-10 h-10 rounded-lg bg-[#FAFAFA] flex items-center justify-center hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <span className={`${headingCls} text-[#332849]`}>+</span>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};