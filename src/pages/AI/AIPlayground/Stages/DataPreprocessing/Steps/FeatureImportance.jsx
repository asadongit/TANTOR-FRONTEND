import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAIPlayground } from '../../../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';

const ToggleSwitch = ({ checked, onChange, readonly }) => (
    <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={readonly}
            className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
    </label>
);

const RadioOption = ({ name, value, checked, onChange, label, readonly }) => (
    <label className={`flex items-center gap-2 group ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <input
            type="radio"
            name={name}
            value={value}
            checked={checked}
            onChange={onChange}
            disabled={readonly}
            className="w-4 h-4 text-[#8e78b7] border-gray-300 focus:ring-[#8e78b7]"
        />
        <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
    </label>
);

const FeatureSection = ({ title, description, isToggled, isExpanded, onToggle, onExpand, children, readonly }) => (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
        <div className="p-4 flex items-center justify-between">
            <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-700">{title}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            </div>
            <div className="flex items-center gap-3">
                <ToggleSwitch checked={isToggled} onChange={onToggle} readonly={readonly} />
                {isToggled && (
                    <button 
                        onClick={onExpand}
                        disabled={readonly}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                )}
            </div>
        </div>
        {isToggled && isExpanded && (
            <div className="px-4 pb-4 border-t border-gray-100">
                <div className="mt-4">{children}</div>
            </div>
        )}
    </div>
);

function FeatureImportance({ readonly = false, onApiCall }) {
    const hostnameAI = window._env_?.VITE_AI_API;
    const { workflowState, datasetState, updatePreprocessingStep } = useAIPlayground();
    
    const maxFeatures = workflowState?.dataPreprocessing?.step4?.apiResponse?.column_count || 0;

    const sessionId = datasetState?.sessionId;

    const [toggles, setToggles] = useState({ featureImportance: false, dimensionalityReduction: false });
    const [expandedSections, setExpandedSections] = useState({ featureImportance: false, dimensionalityReduction: false });
    
    const [methodCategory, setMethodCategory] = useState('filter');
    const [subMethod, setSubMethod] = useState('mutual_info');
    const [numFeatures, setNumFeatures] = useState(0);
    const [reductionMethod, setReductionMethod] = useState('pca');

    const subMethodMapping = {
        random_forest: [],
        filter: ["mutual_info", "fisher_score", "relief", "variance", "pca_loading", "correlation", "selectkbest_chi2", "selectkbest_f"],
        wrapper: ["rfe", "sfs", "rfecv"],
        embedded: ["lasso", "tree", "permutation", "selectfrommodel", "boruta"],
        unsupervised: ["variance", "pca_loading", "cluster_mi"]
    };

    const reductionMethods = [
        "pca", "lda", "ica", "tsne", "umap", "autoencoder", "sparse_pca", "factor_analysis", 
        "nmf", "lsa", "lle", "modified_lle", "hessian_lle", "ltsa", "isomap", "mds", 
        "spectral_embedding", "random_projection", "truncated_svd", "dictionary_learning", 
        "mini_batch_dictionary_learning", "vae"
    ];

    useEffect(() => {
        const availableSubMethods = subMethodMapping[methodCategory];
        if (availableSubMethods && availableSubMethods.length > 0) {
            setSubMethod(availableSubMethods[0]);
        } else {
            setSubMethod('');
        }
    }, [methodCategory]);


    const handleApiCall = async () => {

        try {
            const requestBody = {
                session_id: sessionId,
                feature_importance_selection: toggles.featureImportance,
                method: methodCategory,
                sub_method: subMethod || null,
                n_features: numFeatures,
                dimensionality_reduction: toggles.dimensionalityReduction,
                dimensionality_reduction_method: reductionMethod,
                n_components: 2
            };

            const response = await fetch(`${hostnameAI}/data/preprocess/feature_importance`, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `API request failed with status ${response.status}`);
            }

            const data = await response.json();

            updatePreprocessingStep('step6', {
                selections: {
                    toggles,
                    methodCategory,
                    subMethod,
                    numFeatures,
                    reductionMethod
                },
                apiResponse: data
            });

            toast.success('Feature importance analysis completed successfully!', {
                duration: 3000,
                position: 'top-right',
            });

            return true;
        } catch (error) {
            console.error('Feature importance API error:', error);
            toast.error(error.message || 'Feature importance analysis failed. Please try again.', {
                duration: 4000,
                position: 'top-right',
            });
            return false;
        }
    };

    useEffect(() => {
        if (onApiCall) {
            onApiCall(handleApiCall);
        }
    }, [onApiCall, sessionId, toggles, methodCategory, subMethod, numFeatures, reductionMethod]);

    const toggleSwitch = (key) => {
        if (readonly) return;
        setToggles(prev => {
            const newState = !prev[key];
            if (newState) {
                setExpandedSections({ featureImportance: false, dimensionalityReduction: false, [key]: true });
            }
            return { ...prev, [key]: newState };
        });
    };

    return (
        <div className="space-y-4">
            <FeatureSection
                title="Feature Importance"
                description="Identify and rank the most important features using various statistical methods."
                isToggled={toggles.featureImportance}
                isExpanded={expandedSections.featureImportance}
                onToggle={() => toggleSwitch('featureImportance')}
                onExpand={() => setExpandedSections(prev => ({ ...prev, featureImportance: !prev.featureImportance }))}
                readonly={readonly}
            >
                <div className="space-y-4">
                    <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Method Category</h5>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.keys(subMethodMapping).map(cat => (
                                <div key={cat} className={`px-3 py-2 rounded border ${methodCategory === cat ? 'bg-purple-50 border-[#8e78b7]' : 'bg-white border-gray-200'}`}>
                                    <RadioOption
                                        name="methodCategory"
                                        value={cat}
                                        checked={methodCategory === cat}
                                        onChange={(e) => setMethodCategory(e.target.value)}
                                        label={cat.replace('_', ' ')}
                                        readonly={readonly}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {subMethodMapping[methodCategory].length > 0 && (
                        <div className="pt-2">
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Sub-Method</h5>
                            <div className="grid grid-cols-2 gap-2">
                                {subMethodMapping[methodCategory].map(sub => (
                                    <div key={sub} className={`px-3 py-2 rounded border ${subMethod === sub ? 'bg-purple-50 border-[#8e78b7]' : 'bg-white border-gray-200'}`}>
                                        <RadioOption
                                            name="subMethod"
                                            value={sub}
                                            checked={subMethod === sub}
                                            onChange={(e) => setSubMethod(e.target.value)}
                                            label={sub}
                                            readonly={readonly}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-2">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Number of Features to Select</h5>
                        <input
                            type="range"
                            min="1"
                            max={maxFeatures}
                            value={numFeatures}
                            onChange={(e) => setNumFeatures(parseInt(e.target.value))}
                            disabled={readonly}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#8e78b7]"
                            style={{ background: `linear-gradient(to right, #8e78b7 0%, #8e78b7 ${((numFeatures - 1) / (maxFeatures - 1)) * 100}%, #e5e7eb ${((numFeatures - 1) / (maxFeatures - 1)) * 100}%, #e5e7eb 100%)` }}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>1</span>
                            <span className="font-bold text-[#8e78b7]">{numFeatures}</span>
                            <span>{maxFeatures}</span>
                        </div>
                    </div>
                </div>
            </FeatureSection>

            <FeatureSection
                title="Dimensionality Reduction"
                description="Reduce feature space while preserving important information."
                isToggled={toggles.dimensionalityReduction}
                isExpanded={expandedSections.dimensionalityReduction}
                onToggle={() => toggleSwitch('dimensionalityReduction')}
                onExpand={() => setExpandedSections(prev => ({ ...prev, dimensionalityReduction: !prev.dimensionalityReduction }))}
                readonly={readonly}
            >
                <div className="space-y-4">
                    <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Reduction Method</h5>
                        <select
                            value={reductionMethod}
                            onChange={(e) => setReductionMethod(e.target.value)}
                            disabled={readonly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#8e78b7] bg-white outline-none"
                        >
                            {reductionMethods.map(method => (
                                <option key={method} value={method}>{method.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </FeatureSection>
        </div>
    );
}

export default FeatureImportance;