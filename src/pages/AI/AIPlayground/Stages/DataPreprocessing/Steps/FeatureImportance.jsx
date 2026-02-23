import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAIPlayground } from '../../../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';
import InfoButton from '../../../components/InfoButton';

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

// FeatureSection — no outer border, red highlight when hasError
const FeatureSection = ({
    title,
    isToggled,
    isExpanded,
    onToggle,
    onExpand,
    children,
    readonly,
    sectionKey,
    isLastSection = false,
    hasError = false,
}) => {
    const sectionDescriptions = {
        featureImportance: "Feature Importance is the process of identifying and ranking input features based on how much they contribute to a model's predictions. It helps remove irrelevant or redundant features, improve model performance, and increase interpretability by focusing on the most influential variables.",
        dimensionalityReduction: "Dimensional Reduction is the process of reducing the number of input features while retaining the most important information in the data."
    };

    return (
        <div className={`rounded-lg transition-all ${hasError ? 'bg-red-50 border border-red-400' : 'bg-gray-50'}`}>
            <div className="p-4 flex items-center justify-between">
                <div className="flex-1 flex items-center gap-2">
                    <div>
                        <h4 className={`text-sm font-medium ${hasError ? 'text-red-700' : 'text-gray-900'}`}>{title}</h4>
                    </div>
                    <InfoButton sectionDescriptions={sectionDescriptions} section={sectionKey} isLastSection={isLastSection} />
                </div>
                <div className="flex items-center gap-3">
                    <ToggleSwitch checked={isToggled} onChange={onToggle} readonly={readonly} />
                    {isToggled && (
                        <button onClick={onExpand} className="text-gray-400 hover:text-gray-600">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                    )}
                </div>
            </div>
            {isToggled && isExpanded && (
                <div className="px-4 pb-4">
                    <div className="mt-4">{children}</div>
                </div>
            )}
        </div>
    );
};

const FEATURE_IMPORTANCE_OPTIONS_CONFIG = {
    methods: [
        {
            value: 'random',
            label: 'Random Forest',
            description: 'Random Forest feature importance assigns importance scores without using data relationships or model learning. It is mainly used as a baseline to compare against meaningful feature selection methods.',
            availability: { binary: 'yes', multiclass: 'yes' },
            subMethods: []
        },
        {
            value: 'filter',
            label: 'Filter',
            description: 'Filter methods evaluate feature importance using statistical measures independent of any machine learning model. They are fast, scalable, and help remove irrelevant features before model training.',
            availability: { binary: 'yes', multiclass: 'yes' },
            subMethods: [
                { value: 'mutual_info', label: 'Mutual Information', description: 'Measures how much information a feature provides about the target variable. Higher values indicate a stronger dependency, even when the relationship is non-linear.', availability: { binary: 'yes', multiclass: 'yes' } },
                { value: 'relief', label: 'Relief', description: 'Estimates feature relevance by distinguishing between nearby instances of different classes. Features that help distinguish similar records with different outcomes are ranked higher.', availability: { binary: 'yes', multiclass: 'yes' } },
                { value: 'variance', label: 'Variance', description: 'Variance measures how much a feature\'s values spread across records. Features with very low variance provide little information and can be removed.', availability: { binary: 'yes', multiclass: 'yes' } },
                { value: 'pca_loading', label: 'PCA Loading', description: 'PCA Loading represents how much each original feature contributes to a principal component. Features with higher loadings are considered more influential in explaining data variation.', availability: { binary: 'yes', multiclass: 'yes' } },
                { value: 'correlation', label: 'Correlation', description: 'Measures the strength and direction of relationship between a feature and target. Strongly correlated features are considered more important.', availability: { binary: 'yes', multiclass: 'yes' } },
                { value: 'selectkbest_f', label: 'SelectKBest F (F-test)', description: 'Measures linear dependency between feature and target using variance ratio. This method selects the top K features based on the F-statistic.', availability: { binary: 'yes', multiclass: 'yes' } }
            ]
        },
        {
            value: 'embedded',
            label: 'Embedded',
            description: 'Embedded methods determine feature importance during model training. The model automatically learns which features contribute most to predictions.',
            availability: { binary: 'yes', multiclass: 'yes' },
            subMethods: [
                { value: 'tree', label: 'Tree-Based', description: 'Tree-based models compute feature importance based on impurity reduction or information gain during splits.', availability: { binary: 'yes', multiclass: 'yes' } },
                { value: 'permutation', label: 'Permutation', description: 'Permutation importance measures feature importance by randomly shuffling a feature and observing the drop in model performance.', availability: { binary: 'yes', multiclass: 'yes' } },
                { value: 'selectfrommodel', label: 'Select From Model', description: 'SelectFromModel selects features based on importance or coefficients from a pre-trained model.', availability: { binary: 'yes', multiclass: 'yes' } },
                { value: 'boruta', label: 'Boruta', description: 'Boruta is an all-relevant feature selection algorithm built on top of Random Forest. Ensures no important feature is missed.', availability: { binary: 'yes', multiclass: 'yes' } }
            ]
        },
        {
            value: 'wrapper',
            label: 'Wrapper',
            description: 'Wrapper methods evaluate feature importance by training models on different feature subsets. They provide high accuracy but are computationally expensive.',
            availability: { binary: 'yes', multiclass: 'yes' },
            subMethods: [
                { value: 'rfe', label: 'RFE (Recursive Feature Elimination)', description: 'RFE is a wrapper feature selection method that recursively removes the least important features based on a model\'s feature importance or coefficients.', availability: { binary: 'yes', multiclass: 'yes' } },
                { value: 'sfs', label: 'SFS (Sequential Feature Selection)', description: 'SFS is a wrapper method that iteratively adds or removes features based on model performance.', availability: { binary: 'yes', multiclass: 'yes' } },
                { value: 'rfecv', label: 'RFECV (RFE with Cross-Validation)', description: 'RFECV extends RFE by using cross-validation to automatically determine the optimal number of features.', availability: { binary: 'yes', multiclass: 'yes' } }
            ]
        },
        {
            value: 'unsupervised',
            label: 'Unsupervised',
            description: 'Unsupervised feature importance identifies important features without using a target variable. It relies on data structure, variance, or clustering patterns.',
            availability: { binary: 'yes', multiclass: 'yes' },
            subMethods: [
                { value: 'variance', label: 'Variance', description: 'Variance Threshold removes features whose variance falls below a specified threshold.', availability: { binary: 'yes', multiclass: 'yes' } },
                { value: 'pca_loading', label: 'PCA Loading', description: 'PCA loadings represent the contribution of each original feature to the principal components.', availability: { binary: 'yes', multiclass: 'yes' } },
                { value: 'cluster_mi', label: 'Cluster MI (Mutual Information)', description: 'Cluster Mutual Information measures how much information a feature shares with cluster assignments instead of target labels.', availability: { binary: 'yes', multiclass: 'yes' } }
            ]
        }
    ]
};

const DIMENSIONALITY_REDUCTION_DESCRIPTIONS = {
    pca: "PCA reduces dimensions by transforming features into uncorrelated components that capture maximum variance. It helps simplify data while retaining most of the original information.",
    lda: "LDA reduces dimensions by maximizing class separability using labeled data. It is mainly used for supervised classification tasks.",
    tsne: "t-SNE maps high-dimensional data into a lower-dimensional space while preserving local similarities. It is primarily used for visualization, not model training.",
    umap: "UMAP reduces dimensions by preserving both local and global data structure. It is faster and more scalable than t-SNE.",
    sparse_pca: "Sparse PCA is a variant of PCA that enforces feature sparsity in components. It improves interpretability by using fewer original features.",
    factor_analysis: "Factor Analysis models data using a smaller number of latent factors. It focuses on explaining correlations among observed variables.",
    lsa: "LSA reduces dimensions using Singular Value Decomposition on text data. It captures underlying semantic relationships between terms.",
    spectral_embedding: "Spectral Embedding uses graph-based techniques to reduce dimensions. It preserves neighborhood relationships in the data.",
    random_projection: "Random Projection reduces dimensions using random linear mappings. It is fast and suitable for very high-dimensional data.",
    truncated_svd: "Truncated SVD reduces dimensions by keeping the most significant singular values. It is commonly used for sparse and text-based datasets.",
    dictionary_learning: "Dictionary Learning represents data as a sparse combination of basis vectors. It captures important patterns with fewer components.",
    mini_batch_dictionary_learning: "This is a scalable version of Dictionary Learning using mini-batches. It is suitable for large datasets.",
    isomap: "Isomap reduces dimensions by preserving geodesic distances between data points. It is effective for unfolding non-linear manifolds.",
    mds: "MDS reduces dimensions by preserving pairwise distances between data points. It is mainly used for visualization and exploratory analysis.",
    ica: "ICA is a dimensionality reduction and signal separation technique that transforms data into statistically independent components."
};

const SearchableDropdown = ({
    value, onChange, options, disabled = false, label,
    searchValue, setSearchValue, showDropdown, setShowDropdown,
}) => {
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const [hoveredOption, setHoveredOption] = useState(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                triggerRef.current && !triggerRef.current.contains(event.target) &&
                menuRef.current && !menuRef.current.contains(event.target)
            ) {
                setShowDropdown(false);
                setSearchValue('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setShowDropdown, setSearchValue]);

    const filteredOptions = options.filter((option) =>
        option.toLowerCase().includes(searchValue.toLowerCase())
    );

    const getDescription = (option) => DIMENSIONALITY_REDUCTION_DESCRIPTIONS[option] || null;

    return (
        <div className="relative w-[350px]" ref={triggerRef}>
            {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
            <div
                onClick={() => !disabled && setShowDropdown(!showDropdown)}
                className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm ${
                    disabled
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-70'
                        : 'bg-white text-gray-800 cursor-pointer hover:border-[#8e78b7] focus:border-[#8e78b7] focus:ring-2 focus:ring-[#8e78b7]/30'
                } transition-all duration-150`}
            >
                {value.toUpperCase()}
            </div>

            {showDropdown && !disabled && (
                <div
                    ref={menuRef}
                    className="absolute left-0 z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-72 flex flex-col overflow-hidden"
                >
                    <div className="p-2 border-b border-gray-200">
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Search methods..."
                            className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]/50 transition"
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-60">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => {
                                const isSelected = value === option;
                                const description = getDescription(option);
                                return (
                                    <div
                                        key={option}
                                        className={`px-4 py-2.5 text-sm cursor-pointer border-b border-gray-50 last:border-b-0 ${
                                            isSelected
                                                ? 'bg-purple-50 text-[#8e78b7] font-medium'
                                                : 'text-gray-800 hover:bg-purple-50/60'
                                        } transition-colors duration-100`}
                                        onMouseEnter={() => setHoveredOption(option)}
                                        onMouseLeave={() => setHoveredOption(null)}
                                        onClick={() => {
                                            onChange(option);
                                            setSearchValue('');
                                            setShowDropdown(false);
                                        }}
                                    >
                                        {option.toUpperCase()}
                                        {hoveredOption === option && description && (
                                            <div
                                                className="fixed z-[9999] w-80 p-4 bg-gray-900 text-white text-xs leading-relaxed rounded-lg shadow-2xl pointer-events-none"
                                                style={{
                                                    left: menuRef.current ? `${menuRef.current.getBoundingClientRect().right + 12}px` : '0px',
                                                    top: menuRef.current ? `${menuRef.current.getBoundingClientRect().top}px` : '0px',
                                                    maxWidth: 'calc(100vw - 40px)',
                                                }}
                                            >
                                                <div className="font-semibold mb-2 text-sm uppercase tracking-wide text-purple-300">
                                                    {option.replace(/_/g, ' ')}
                                                </div>
                                                <p className="opacity-95 leading-5">{description}</p>
                                                <div className="absolute top-4 -left-2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-gray-900 border-b-8 border-b-transparent" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-4 py-6 text-sm text-gray-400 text-center italic">No methods found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const getAvailableFeatureImportanceMethods = (classificationType) => {
    return FEATURE_IMPORTANCE_OPTIONS_CONFIG.methods
        .filter(method => method.availability[classificationType] === 'yes')
        .map(method => ({
            ...method,
            subMethods: method.subMethods.filter(sm => sm.availability[classificationType] === 'yes')
        }));
};

const getAvailableSubMethods = (methodValue, classificationType) => {
    const method = FEATURE_IMPORTANCE_OPTIONS_CONFIG.methods.find(m => m.value === methodValue);
    if (!method || !method.subMethods) return [];
    return method.subMethods.filter(sm => sm.availability[classificationType] === 'yes');
};

// MethodOption — selected = purple bg + border, unselected = white + gray border
const MethodOption = ({ option, name, checked, onChange, readonly }) => (
    <label
        className={`px-4 py-3 rounded-lg transition-colors group relative ${
            checked
                ? 'bg-purple-100 border border-[#8e78b7]'
                : 'bg-white'
        } ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <div className="flex items-center gap-2">
            <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={onChange}
                disabled={readonly}
                className={`w-4 h-4 accent-[#8e78b7] ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            />
            <span className={`text-sm font-medium ${checked ? 'text-[#8e78b7]' : 'text-gray-700'}`}>
                {option.label}
            </span>
        </div>

        {/* Tooltip */}
        <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
            <p className="leading-relaxed">{option.description}</p>
            <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </div>
    </label>
);

function FeatureImportance({ onApiCall }) {
    const hostnameAI = window._env_?.VITE_AI_API;
    const { workflowState, datasetState, updatePreprocessingStep, mode } = useAIPlayground();
    const readonly = mode === 'view';

    const maxFeatures = workflowState?.dataPreprocessing?.step4?.apiResponse?.column_count || 0;
    const step5Response = workflowState?.dataPreprocessing?.step5?.apiResponse;
    const sessionId = datasetState?.sessionId;

    const [toggles, setToggles] = useState({ featureImportance: false, dimensionalityReduction: false });
    const [expandedSections, setExpandedSections] = useState({ featureImportance: false, dimensionalityReduction: false });

    const [methodCategory, setMethodCategory] = useState('filter');
    const [subMethod, setSubMethod] = useState('mutual_info');
    const [numFeatures, setNumFeatures] = useState(0);
    const [reductionMethod, setReductionMethod] = useState('pca');
    const [nComponents, setNComponents] = useState(2);
    const [searchValue, setSearchValue] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const classificationType = workflowState?.modelGenesis?.config?.modelling_type || 'binary';

    const reductionMethodsConfig = step5Response?.dimensionality_reduction?.dimentionality_reduction_n_components || [];
    const availableReductionMethods = Object.keys(DIMENSIONALITY_REDUCTION_DESCRIPTIONS);

    const getNComponentsRange = (method) => {
        const config = reductionMethodsConfig.find(c => c.methods.includes(method));
        return config ? { low: config.low, high: config.high } : { low: 2, high: 2 };
    };

    const currentRange = getNComponentsRange(reductionMethod);
    const availableMethods = getAvailableFeatureImportanceMethods(classificationType);
    const availableSubMethods = getAvailableSubMethods(methodCategory, classificationType);

    useEffect(() => {
        if ((mode === 'view' || mode === 'edit') && workflowState?.dataPreprocessing?.step6?.config) {
            const config = workflowState.dataPreprocessing.step6.config;
            setToggles({
                featureImportance: config.feature_importance_selection || false,
                dimensionalityReduction: config.dimensionality_reduction || false
            });
            setMethodCategory(config.method || 'filter');
            setSubMethod(config.sub_method || 'mutual_info');
            setNumFeatures(config.n_features || 0);
            setReductionMethod(config.dimensionality_reduction_method || 'pca');
            setNComponents(config.n_components || 2);
        }
    }, [mode, workflowState]);

    useEffect(() => {
        const range = getNComponentsRange(reductionMethod);
        setNComponents(range.low);
    }, [reductionMethod]);

    useEffect(() => {
        const availableSubs = getAvailableSubMethods(methodCategory, classificationType);
        if (availableSubs.length > 0) {
            setSubMethod(availableSubs[0].value);
        } else {
            setSubMethod('');
        }
    }, [methodCategory, classificationType]);

    const handleApiCall = async () => {
        if (readonly) return true;
        try {
            const requestBody = {
                session_id: sessionId,
                feature_importance_selection: toggles.featureImportance,
                method: methodCategory,
                sub_method: subMethod || 'random',
                n_features: numFeatures,
                dimensionality_reduction: toggles.dimensionalityReduction,
                dimensionality_reduction_method: reductionMethod,
                n_components: nComponents
            };

            const response = await fetch(`${hostnameAI}/data/preprocess/feature_importance`, {
                method: 'POST',
                headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `API request failed with status ${response.status}`);
            }

            const data = await response.json();

            updatePreprocessingStep('step6', {
                config: {
                    feature_importance_selection: toggles.featureImportance,
                    method: methodCategory,
                    sub_method: subMethod,
                    n_features: numFeatures,
                    dimensionality_reduction: toggles.dimensionalityReduction,
                    dimensionality_reduction_method: reductionMethod,
                    n_components: nComponents
                },
                apiResponse: data
            });

            toast.success('Feature importance analysis completed successfully!', { duration: 3000, position: 'top-right' });
            return true;
        } catch (error) {
            console.error('Feature importance API error:', error);
            toast.error(error.message || 'Feature importance analysis failed. Please try again.', { duration: 4000, position: 'top-right' });
            return false;
        }
    };

    useEffect(() => {
        if (onApiCall) onApiCall(handleApiCall);
    }, [onApiCall, sessionId, toggles, methodCategory, subMethod, numFeatures, reductionMethod, nComponents]);

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
            {/* ── Feature Importance ── */}
            <FeatureSection
                title="Feature Importance"
                isToggled={toggles.featureImportance}
                isExpanded={expandedSections.featureImportance}
                onToggle={() => toggleSwitch('featureImportance')}
                onExpand={() => setExpandedSections(prev => ({ ...prev, featureImportance: !prev.featureImportance }))}
                readonly={readonly}
                sectionKey="featureImportance"
            >
                <div className="space-y-4">
                    {/* Method Category */}
                    <div className="mb-6">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Method Category</h5>
                        <div className="grid grid-cols-2 gap-3">
                            {availableMethods.map(method => (
                                <MethodOption
                                    key={method.value}
                                    option={method}
                                    name="methodCategory"
                                    checked={methodCategory === method.value}
                                    onChange={(e) => !readonly && setMethodCategory(e.target.value)}
                                    readonly={readonly}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Sub-Method */}
                    {availableSubMethods.length > 0 && (
                        <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Sub-Method</h5>
                            <div className="grid grid-cols-2 gap-3">
                                {availableSubMethods.map(subMethodOption => (
                                    <MethodOption
                                        key={subMethodOption.value}
                                        option={subMethodOption}
                                        name="subMethod"
                                        checked={subMethod === subMethodOption.value}
                                        onChange={(e) => !readonly && setSubMethod(e.target.value)}
                                        readonly={readonly}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Number of Features slider */}
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
                            style={{
                                background: `linear-gradient(to right, #8e78b7 0%, #8e78b7 ${((numFeatures - 1) / (maxFeatures - 1)) * 100}%, #e5e7eb ${((numFeatures - 1) / (maxFeatures - 1)) * 100}%, #e5e7eb 100%)`
                            }}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>1</span>
                            <span className="font-bold text-[#8e78b7]">{numFeatures}</span>
                            <span>{maxFeatures}</span>
                        </div>
                    </div>
                </div>
            </FeatureSection>

            {/* ── Dimensionality Reduction ── */}
            <FeatureSection
                title="Dimensionality Reduction"
                isToggled={toggles.dimensionalityReduction}
                isExpanded={expandedSections.dimensionalityReduction}
                onToggle={() => toggleSwitch('dimensionalityReduction')}
                onExpand={() => setExpandedSections(prev => ({ ...prev, dimensionalityReduction: !prev.dimensionalityReduction }))}
                readonly={readonly}
                sectionKey="dimensionalityReduction"
                isLastSection={true}
            >
                <div className="space-y-4">
                    <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Reduction Method</h5>
                        <SearchableDropdown
                            value={reductionMethod}
                            onChange={setReductionMethod}
                            options={availableReductionMethods}
                            disabled={readonly}
                            label={null}
                            searchValue={searchValue}
                            setSearchValue={setSearchValue}
                            showDropdown={showDropdown}
                            setShowDropdown={setShowDropdown}
                            type="dimensionality"
                        />
                    </div>

                    {currentRange.low !== currentRange.high && (
                        <div className="pt-2">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Number of Components</h5>
                            <input
                                type="range"
                                min={currentRange.low}
                                max={currentRange.high}
                                value={nComponents}
                                onChange={(e) => setNComponents(parseInt(e.target.value))}
                                disabled={readonly}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#8e78b7]"
                                style={{
                                    background: `linear-gradient(to right, #8e78b7 0%, #8e78b7 ${((nComponents - currentRange.low) / (currentRange.high - currentRange.low)) * 100}%, #e5e7eb ${((nComponents - currentRange.low) / (currentRange.high - currentRange.low)) * 100}%, #e5e7eb 100%)`
                                }}
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>{currentRange.low}</span>
                                <span className="font-bold text-[#8e78b7]">{nComponents}</span>
                                <span>{currentRange.high}</span>
                            </div>
                        </div>
                    )}

                    {currentRange.low === currentRange.high && (
                        <div className="pt-2">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Number of Components</h5>
                            <div className="px-3 py-2 bg-gray-100 rounded border border-gray-200 text-sm text-gray-700">
                                Fixed at <span className="font-bold text-[#8e78b7]">{currentRange.low}</span> component(s)
                            </div>
                        </div>
                    )}
                </div>
            </FeatureSection>
        </div>
    );
}

export default FeatureImportance;