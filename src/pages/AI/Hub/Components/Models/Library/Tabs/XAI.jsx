import React, { useState, useEffect, useRef } from 'react';
import { Download, X as CloseIcon, Search } from 'lucide-react';
import { useAuth } from '../../../../../../../context/AuthContext';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const XAI = ({ modelData }) => {
    const [searchTermFeatureFlip, setSearchTermFeatureFlip] = useState('');
    const [searchTermCounterfactual, setSearchTermCounterfactual] = useState('');
    const [searchTermLime, setSearchTermLime] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [xaiReport, setXaiReport] = useState(null);
    const [xaiResponse, setXaiResponse] = useState(null);
    const hostnameAI = window._env_?.VITE_AI_API;
    const { token } = useAuth();

    // For zoom modal
    const [zoomImg, setZoomImg] = useState(null);
    const [zoomAlt, setZoomAlt] = useState("");
    const reportRef = useRef();

    // Safe render helper with error handling
    const safeRender = (componentName, renderFn) => {
        try {
            console.log(`[XAI] Rendering ${componentName}...`);
            const result = renderFn();
            console.log(`[XAI] Successfully rendered ${componentName}`);
            return result;
        } catch (error) {
            console.error(`[XAI] Error rendering ${componentName}:`, error);
            return (
                <div className="bg-red-50 rounded-lg shadow p-4 border border-red-200">
                    <div className="text-red-600 font-semibold mb-1">Failed to load {componentName}</div>
                    <div className="text-red-500 text-xs">{error.message}</div>
                </div>
            );
        }
    };

    useEffect(() => {
        const fetchXAI = async () => {
            setIsLoading(true);
            try {
                console.log(`[XAI] Fetching XAI report for run_name: ${modelData.run_name}`);
                const res = await fetch(
                    `${hostnameAI}/canvas/mlflow/xai-report?run_name=${modelData.run_name}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                const json = await res.json();
                console.log(`[XAI] API response received:`, json);
                setXaiResponse(json);

                if (json?.xai_report && json?.xai_path) {
                    console.log(`[XAI] XAI report loaded successfully`);
                    setXaiReport(json.xai_report);
                } else {
                    console.warn(`[XAI] No xai_report or xai_path found in response`);
                    setXaiReport(null);
                }
            } catch (e) {
                console.error(`[XAI] Error fetching XAI report:`, e);
                setXaiResponse({ detail: "Failed to load XAI report." });
                setXaiReport(null);
            }
            setIsLoading(false);
        };
        fetchXAI();
    }, [hostnameAI, token, modelData.run_name]);

    const handleRefresh = () => {
        setIsLoading(true);
        setRefreshTrigger(prev => prev + 1);
        setTimeout(() => setIsLoading(false), 1000);
    };

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;
        const input = reportRef.current;
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "pt",
            format: "a4",
        });
        await html2canvas(input, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL("image/png");
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${xaiReport.model_name || "XAI_Report"}.pdf`);
        });
    };

    useEffect(() => {
        if (!zoomImg) return;
        const handler = (e) => {
            if (e.key === "Escape") setZoomImg(null);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [zoomImg]);

    if (isLoading) {
        console.log(`[XAI] Loading state - waiting for data`);
        return <div className="p-8 text-center text-gray-500">Loading XAI report...</div>;
    }

    if (!xaiReport) {
        const detail =
            xaiResponse?.message ??
            xaiResponse?.detail ??
            xaiResponse?.details ??
            "Failed to load XAI report.";

        console.warn(`[XAI] No report data available. Error message: ${detail}`);
        return (
            <div className="p-8">
                <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3  mx-auto">
                    <div className="text-sm" style={{ color: '#8E77BB' }}>
                        {String(detail)}
                    </div>
                </div>
            </div>
        );
    }

    console.log(`[XAI] Rendering XAI component with report for model: ${xaiReport.model_name}`);

    return (
        <div className="space-y-6">
            {zoomImg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                    <div className="relative bg-white rounded-lg shadow-lg p-4 max-w-3xl w-full flex flex-col items-center">
                        <button
                            className="absolute top-2 right-2 text-gray-700 hover:text-red-500"
                            onClick={() => setZoomImg(null)}
                        >
                            <CloseIcon className="w-6 h-6" />
                        </button>
                        <img
                            src={zoomImg}
                            alt={zoomAlt}
                            className="max-h-[80vh] max-w-full object-contain"
                        />
                        <div className="mt-2 text-xs text-gray-600">{zoomAlt}</div>
                    </div>
                </div>
            )}

            <div className="flex justify-end">
                <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition hover:opacity-90"
                    style={{ backgroundColor: '#8E77BB' }}
                >
                    <Download className="w-4 h-4" />
                    Download PDF
                </button>
            </div>

            <div ref={reportRef} className="space-y-6">
                {safeRender("Model Info", () => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-xs text-gray-500">Model Name</div>
                            <div className="font-semibold break-words max-w-full" style={{ wordBreak: "break-word" }}>
                                {xaiReport.model_name}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-xs text-gray-500">Model Version</div>
                            <div className="font-semibold">{xaiReport.model_version}</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-xs text-gray-500">Run ID</div>
                            <div className="font-mono text-xs break-all">{xaiReport.run_id}</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-xs text-gray-500">Status</div>
                            <div className="font-semibold">{xaiReport.message}</div>
                        </div>
                    </div>
                ))}

                {/* SHAP Plots */}
                {safeRender("SHAP Plots", () => (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
                            <div className="font-semibold mb-2">SHAP Summary Plot</div>
                            {xaiReport.shap_summary_plot ? (
                                <img
                                    src={`data:image/png;base64,${xaiReport.shap_summary_plot}`}
                                    alt="SHAP Summary"
                                    className="max-w-full max-h-80 cursor-zoom-in"
                                    onClick={() =>
                                        setZoomImg(`data:image/png;base64,${xaiReport.shap_summary_plot}`) ||
                                        setZoomAlt("SHAP Summary Plot")
                                    }
                                />
                            ) : (
                                <div className="text-gray-400">No plot available</div>
                            )}
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
                            <div className="font-semibold mb-2">SHAP Beeswarm Plot</div>
                            {xaiReport.shap_beeswarm_plot ? (
                                <img
                                    src={`data:image/png;base64,${xaiReport.shap_beeswarm_plot}`}
                                    alt="SHAP Beeswarm"
                                    className="max-w-full max-h-80 cursor-zoom-in"
                                    onClick={() =>
                                        setZoomImg(`data:image/png;base64,${xaiReport.shap_beeswarm_plot}`) ||
                                        setZoomAlt("SHAP Beeswarm Plot")
                                    }
                                />
                            ) : (
                                <div className="text-gray-400">No plot available</div>
                            )}
                        </div>
                    </div>
                ))}

                {/* PDP Plots */}
                {safeRender("PDP Plots", () => (
                    xaiReport.pdp_plots && Object.keys(xaiReport.pdp_plots).length > 0 && (
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="font-semibold mb-4">Partial Dependence Plots (PDP)</div>
                            <div className="flex flex-wrap gap-6">
                                {Object.entries(xaiReport.pdp_plots).map(([feature, base64], idx) => (
                                    <div key={feature} className="flex flex-col items-center">
                                        <div className="text-xs mb-1">{feature}</div>
                                        <img
                                            src={`data:image/png;base64,${base64}`}
                                            alt={`PDP ${feature}`}
                                            className="max-w-xs max-h-48 border rounded cursor-zoom-in"
                                            onClick={() =>
                                                setZoomImg(`data:image/png;base64,${base64}`) ||
                                                setZoomAlt(`PDP Plot: ${feature}`)
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                ))}

                {/* Feature Flip Summary Table */}
                {safeRender("Feature Flip Summary", () => (
                    xaiReport.feature_flip_summary && (
                        <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
                            <div className="flex justify-between items-center mb-4">
                                <div className="font-semibold">Feature Flip Summary</div>
                                <div className="relative max-w-sm">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search features..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400"
                                        value={searchTermFeatureFlip}
                                        onChange={(e) => setSearchTermFeatureFlip(e.target.value)}
                                    />
                                </div>
                            </div>
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-2 py-1 text-left">Feature</th>
                                        <th className="px-2 py-1 text-left">% of Users Affected</th>
                                        <th className="px-2 py-1 text-left">Avg Change</th>
                                        <th className="px-2 py-1 text-left">Common Direction</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {xaiReport.feature_flip_summary
                                        .filter(row => row["Feature"]?.toLowerCase?.().includes(searchTermFeatureFlip.toLowerCase()))
                                        .map((row, idx) => (
                                            <tr key={idx} className="border-t">
                                                <td className="px-2 py-1">{row["Feature"]}</td>
                                                <td className="px-2 py-1">{row["% of Users Affected"]}</td>
                                                <td className="px-2 py-1">{row["Avg Change"]}</td>
                                                <td className="px-2 py-1">{row["Common Direction"]}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ))}

                {/* Counterfactual Report Table */}
                {safeRender("Counterfactual Report", () => (
                    xaiReport.counterfactual_report && (
                        <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
                            <div className="flex justify-between items-center mb-4">
                                <div className="font-semibold">Counterfactual Report</div>
                                <div className="relative max-w-sm">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search features..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400"
                                        value={searchTermCounterfactual}
                                        onChange={(e) => setSearchTermCounterfactual(e.target.value)}
                                    />
                                </div>
                            </div>
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-2 py-1 text-left">Feature</th>
                                        <th className="px-2 py-1 text-left">Original</th>
                                        <th className="px-2 py-1 text-left">Counterfactual</th>
                                        <th className="px-2 py-1 text-left">Change</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {xaiReport.counterfactual_report
                                        .filter(row => row["Feature"]?.toLowerCase?.().includes(searchTermCounterfactual.toLowerCase()))
                                        .map((row, idx) => (
                                            <tr key={idx} className="border-t">
                                                <td className="px-2 py-1">{row["Feature"]}</td>
                                                <td className="px-2 py-1">{row["Original"]}</td>
                                                <td className="px-2 py-1">{row["Counterfactual"]}</td>
                                                <td className="px-2 py-1">{row["Change"]}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ))}

                {/* LIME Report Table */}
                {safeRender("LIME Report", () => (
                    xaiReport.lime_report && (
                        <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="font-semibold">LIME Explanation (Instance {xaiReport.lime_report.instance_index})</div>
                                    <div className="text-xs text-gray-500">
                                        Predicted Class: <span className="font-semibold">{xaiReport.lime_report.predicted_class_name}</span>
                                    </div>
                                </div>
                                <div className="relative max-w-sm">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search features..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400"
                                        value={searchTermLime}
                                        onChange={(e) => setSearchTermLime(e.target.value)}
                                    />
                                </div>
                            </div>
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-2 py-1 text-left">Feature</th>
                                        <th className="px-2 py-1 text-left">Weight</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {xaiReport.lime_report.explanation_for_class
                                        .filter(([feature, weight]) => feature?.toLowerCase?.().includes(searchTermLime.toLowerCase()))
                                        .map(([feature, weight], idx) => (
                                            <tr key={idx} className="border-t">
                                                <td className="px-2 py-1">{feature}</td>
                                                <td className="px-2 py-1">{weight}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                            <div className="mt-2 text-xs text-gray-500">
                                Intercept: <span className="font-mono">{xaiReport.lime_report.intercept}</span>
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};

export default XAI;