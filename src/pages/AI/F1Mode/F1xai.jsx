import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import F1XAIConfigModal from './F1XAIConfigModal';
import DataTable from '../../../components/DataTable';
import { useAIPlayground } from '../../../context/AIPlaygroundContext';

function ReportSection({ title, children }) {
    return (
        <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #E5E7EB' }}>
            <h3 className="font-bold text-base text-gray-900 mb-4" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                {title}
            </h3>
            {children}
        </div>
    );
}

function F1XAI() {
    const hostnameAI = window._env_?.VITE_AI_API;
    const { F1Mode: F1ModeCtx } = useAIPlayground();
    const launchData = F1ModeCtx?.launch ?? null;
    const sessionId = F1ModeCtx?.session_id ?? null;

    const modelsList = (launchData?.all_results ?? []).map(r => r.algorithm);

    const [selectedModel, setSelectedModel] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [reportGenerated, setReportGenerated] = useState(false);
    const [error, setError] = useState(null);

    const filteredModels = modelsList.filter(m =>
        m.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleModelSelect = (name) => {
        setSelectedModel(name);
        setIsDropdownOpen(false);
        setSearchQuery('');
        setReportData(null);
        setReportGenerated(false);
        setError(null);
    };

    const handleConfigureClick = () => {
        if (!selectedModel) return;
        setShowConfigModal(true);
    };

    const handleGenerateReport = async (configData) => {
        if (!sessionId || !selectedModel) return;
        setIsGenerating(true);
        setError(null);

        try {
            const payload = {
                session_id: sessionId,
                algorithm_name: selectedModel,
                run_shap: true,
                run_pdp: true,
                run_feature_flip: true,
                run_counterfactuals: true,
                run_lime: true,
                pdp_features: configData.pdpFeatures.length > 0
                    ? configData.pdpFeatures
                    : (launchData?.processed_feature_columns ?? []),
                pdp_target_class: configData.pdpTargetClass,
                lime_instance_index: configData.limeInstanceIndex,
                cf_instance_index: configData.cfInstanceIndex,
                cf_desired_class: parseInt(configData.cfDesiredClass),
            };

            const res = await fetch(`${hostnameAI}/data/f1/explain`, {
                method: 'POST',
                headers: { accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const data = await res.json();
            setReportData(data);
            setReportGenerated(true);
            setShowConfigModal(false);
        } catch (err) {
            setError(err.message || 'Failed to generate report.');
        } finally {
            setIsGenerating(false);
        }
    };

    const featureFlipColumns = [
        { key: 'sno', label: 'Sno', sortable: true, width: '80px' },
        { key: 'feature', label: 'Feature', sortable: true },
        { key: 'affected', label: '% Affected', sortable: true },
        { key: 'change', label: 'Avg Change', sortable: true },
        { key: 'direction', label: 'Direction', sortable: true },
    ];

    const featureFlipData = (reportData?.feature_flip_summary ?? []).map((item, i) => ({
        sno: i + 1,
        feature: item.Feature,
        affected: item['% of Users Affected'],
        change: item['Avg Change'],
        direction: item['Common Direction'],
    }));

    const counterfactualColumns = [
        { key: 'sno', label: 'Sno', sortable: true, width: '80px' },
        { key: 'feature', label: 'Feature', sortable: true },
        { key: 'original', label: 'Original', sortable: true },
        { key: 'counterfactual', label: 'Counterfactual', sortable: true },
        { key: 'change', label: 'Change', sortable: true },
        { key: 'changeType', label: 'Change Type', sortable: true },
    ];

    const counterfactualData = (reportData?.counterfactual_report ?? []).map((item, i) => ({
        sno: i + 1,
        feature: item.Feature,
        original: typeof item.Original === 'number' ? item.Original.toFixed(6) : item.Original,
        counterfactual: typeof item.Counterfactual === 'number' ? item.Counterfactual.toFixed(6) : item.Counterfactual,
        change: typeof item.Change === 'number' ? item.Change.toFixed(6) : item.Change,
        changeType: item.Change_Type,
    }));

    const limeColumns = [
        { key: 'sno', label: 'Sno', sortable: true, width: '80px' },
        { key: 'rule', label: 'Rule', sortable: true },
        { key: 'contribution', label: 'Contribution', sortable: true },
    ];

    const limeData = (reportData?.lime_report?.explanation_for_class ?? []).map((item, i) => ({
        sno: i + 1,
        rule: item[0],
        contribution: typeof item[1] === 'number' ? item[1].toFixed(4) : item[1],
    }));

    const pdpEntries = reportData?.pdp_plots ? Object.entries(reportData.pdp_plots) : [];

    return (
        <div className="rounded-2xl p-4 mb-5 flex flex-col gap-0" style={{ marginTop: '10px' }}>
            <style>{`@keyframes f1spin { to { transform: rotate(360deg); } }`}</style>

            <div className="rounded-xl px-8 py-2 flex items-center justify-between gap-8 flex-wrap" style={{ background: '#FAFAFA' }}>
                <div className="flex-1 min-w-0">
                    <h2 className="font-medium text-lg text-gray-900 mb-2 leading-none" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                        Explainability Report
                    </h2>
                    <p className="font-normal text-[15px] text-gray-500 leading-none" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                        Select a model and configure to generate XAI insights using SHAP, PDP, LIME, and counterfactuals.
                    </p>
                </div>

                <div className="bg-white rounded-[10px] px-[15px] py-[10px] my-1 flex items-end gap-3 flex-shrink-0" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                            Model Selection
                        </label>
                        <div className="relative w-[260px]">
                            <button
                                onClick={() => setIsDropdownOpen(o => !o)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white text-sm outline-none transition-all duration-150"
                                style={{
                                    border: isDropdownOpen ? '1px solid #8D1718' : '1px solid #D1D5DB',
                                    color: selectedModel ? '#111827' : '#9CA3AF',
                                    cursor: 'pointer',
                                    boxShadow: isDropdownOpen ? '0 0 0 3px rgba(141,23,24,0.1)' : 'none',
                                }}
                            >
                                <span className="overflow-hidden text-ellipsis whitespace-nowrap flex-1 text-left mr-2">
                                    {selectedModel || 'Select model'}
                                </span>
                                <ChevronDown size={16} className="flex-shrink-0 text-gray-400 transition-transform duration-200"
                                    style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none' }} />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-lg overflow-hidden"
                                    style={{
                                        border: '1px solid rgba(141,23,24,0.25)',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                    }}>
                                    <div className="px-3 py-2" style={{ borderBottom: '1px solid #F3F4F6' }}>
                                        <div className="flex items-center gap-2 px-2.5 py-[5px] rounded-md" style={{ background: '#FEF2F2' }}>
                                            <Search size={13} className="flex-shrink-0" style={{ color: '#8D1718' }} />
                                            <input
                                                type="text" value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                placeholder="Search..."
                                                autoFocus
                                                className="bg-transparent border-none outline-none text-[13px] text-gray-700 w-full"
                                            />
                                        </div>
                                    </div>
                                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                                        {filteredModels.length === 0 ? (
                                            <p className="px-4 py-3 text-[13px] text-gray-400 text-center">
                                                No models found
                                            </p>
                                        ) : filteredModels.map(name => (
                                            <button
                                                key={name}
                                                onClick={() => handleModelSelect(name)}
                                                className="block w-full text-left px-4 py-2.5 text-[13px] border-none cursor-pointer transition-all duration-100"
                                                style={{
                                                    background: selectedModel === name ? 'rgba(141,23,24,0.08)' : 'transparent',
                                                    color: selectedModel === name ? '#8D1718' : '#374151',
                                                    fontWeight: selectedModel === name ? 600 : 400,
                                                }}
                                                onMouseEnter={e => { if (selectedModel !== name) e.currentTarget.style.background = '#FEF2F2'; }}
                                                onMouseLeave={e => { if (selectedModel !== name) e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleConfigureClick}
                        disabled={!selectedModel}
                        className="px-5 py-2 rounded-lg border-none text-white text-sm font-semibold whitespace-nowrap tracking-wide transition-all duration-150"
                        style={{
                            fontFamily: 'Satoshi, sans-serif',
                            background: !selectedModel
                                ? 'rgba(141,23,24,0.35)'
                                : 'linear-gradient(270deg, #D30101 0%, #6D0101 117.78%)',
                            cursor: !selectedModel ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {reportGenerated ? 'Reconfigure' : 'Configure & Generate Report'}
                    </button>
                </div>
            </div>

            <div className="pt-5 flex flex-col gap-4">

                {error && (
                    <div className="rounded-[10px] px-4 py-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                        <p className="text-red-600 text-[13px]">{error}</p>
                    </div>
                )}

                {isGenerating && (
                    <div className="bg-white rounded-xl px-6 py-12 text-center" style={{ border: '1px solid #E5E7EB' }}>
                        <div className="mx-auto mb-3" style={{
                            width: 36, height: 36,
                            border: '3px solid rgba(141,23,24,0.15)',
                            borderTopColor: '#8D1718', borderRadius: '50%',
                            animation: 'f1spin 0.8s linear infinite',
                        }} />
                        <p className="text-gray-500 text-sm">
                            Generating XAI report for <strong>{selectedModel}</strong>…
                        </p>
                    </div>
                )}

                {!reportGenerated && !isGenerating && (
                    <div className="px-6 py-16 text-center">
                        <div className="mx-auto mb-4 flex items-center justify-center" style={{
                            width: 48, height: 48,
                            background: 'rgba(141,23,24,0.08)',
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    stroke="#8D1718" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        <p className="text-gray-700 text-[15px] font-semibold mb-1.5">No Report Generated</p>
                        <p className="text-gray-400 text-[13px]">
                            {selectedModel
                                ? 'Click "Configure & Generate Report" to start.'
                                : 'Select a model to get started.'}
                        </p>
                    </div>
                )}

                {reportGenerated && reportData && !isGenerating && (
                    <>
                        {reportData.shap_summary_plot && (
                            <ReportSection title="Feature Importance (SHAP Summary Plot)">
                                <div className="flex justify-center items-center rounded-lg p-4" style={{ minHeight: 300, background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <img
                                        src={`data:image/png;base64,${reportData.shap_summary_plot}`}
                                        alt="SHAP Summary Plot"
                                        className="max-w-full object-contain"
                                        style={{ maxHeight: 500 }}
                                    />
                                </div>
                            </ReportSection>
                        )}

                        {reportData.shap_beeswarm_plot && (
                            <ReportSection title="Feature Importance (SHAP Beeswarm Plot)">
                                <div className="flex justify-center items-center rounded-lg p-4" style={{ minHeight: 300, background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <img
                                        src={`data:image/png;base64,${reportData.shap_beeswarm_plot}`}
                                        alt="SHAP Beeswarm Plot"
                                        className="max-w-full object-contain"
                                        style={{ maxHeight: 500 }}
                                    />
                                </div>
                            </ReportSection>
                        )}

                        {pdpEntries.length > 0 && (
                            <ReportSection title="PDP Plots">
                                <div className="grid gap-4"
                                    style={{
                                        gridTemplateColumns: pdpEntries.length === 1
                                            ? '1fr'
                                            : pdpEntries.length === 2
                                                ? '1fr 1fr'
                                                : 'repeat(2, 1fr)',
                                    }}>
                                    {pdpEntries.map(([featureName, imageData]) => (
                                        <div key={featureName} className="rounded-lg p-4" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                            <p className="text-[13px] font-semibold text-gray-700 mb-2.5">
                                                {featureName}
                                            </p>
                                            <div className="flex justify-center items-center" style={{ minHeight: 200 }}>
                                                <img
                                                    src={`data:image/png;base64,${imageData}`}
                                                    alt={featureName}
                                                    className="max-w-full object-contain"
                                                    style={{ maxHeight: 320 }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ReportSection>
                        )}

                        {featureFlipData.length > 0 && (
                            <ReportSection title="Feature Flip Summary">
                                <DataTable
                                    columns={featureFlipColumns}
                                    data={featureFlipData}
                                    isLoading={false}
                                    isError={false}
                                />
                            </ReportSection>
                        )}

                        {counterfactualData.length > 0 && (
                            <ReportSection title="Counterfactual Report">
                                <DataTable
                                    columns={counterfactualColumns}
                                    data={counterfactualData}
                                    isLoading={false}
                                    isError={false}
                                />
                            </ReportSection>
                        )}

                        {limeData.length > 0 && (
                            <ReportSection title="LIME Report">
                                <div className="flex gap-10 mb-4 flex-wrap">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                            Predicted Class
                                        </p>
                                        <p className="text-[15px] font-bold text-gray-900" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                            {reportData.lime_report?.predicted_class_name ?? '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                            Intercept
                                        </p>
                                        <p className="text-[15px] font-bold text-gray-900" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                            {reportData.lime_report?.intercept != null
                                                ? reportData.lime_report.intercept.toFixed(6)
                                                : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                            Instance Index
                                        </p>
                                        <p className="text-[15px] font-bold text-gray-900" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                            {reportData.lime_report?.instance_index ?? '—'}
                                        </p>
                                    </div>
                                </div>
                                <DataTable
                                    columns={limeColumns}
                                    data={limeData}
                                    isLoading={false}
                                    isError={false}
                                />
                            </ReportSection>
                        )}
                    </>
                )}
            </div>

            <F1XAIConfigModal
                isOpen={showConfigModal}
                onClose={() => !isGenerating && setShowConfigModal(false)}
                onGenerate={handleGenerateReport}
                launchData={launchData}
                isGenerating={isGenerating}
            />
        </div>
    );
}

export default F1XAI;