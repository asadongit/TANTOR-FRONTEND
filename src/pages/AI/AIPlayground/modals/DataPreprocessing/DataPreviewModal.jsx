import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Eye } from 'lucide-react';
import { useAIPlayground } from '../../../../../context/AIPlaygroundContext';

const DataPreviewModal = ({ isOpen, onClose, currentStep, predictionType }) => {
    const { datasetState, activeWorkflowId } = useAIPlayground();
    const [previewData, setPreviewData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 20;
    const hostnameAI = window._env_?.VITE_AI_API;

    const getPrefix = (step) => {
        const isTimeSeries = predictionType && [
            'univariate_timeseries',
            'multivariate_timeseries',
            'multiseries_timeseries'
        ].includes(predictionType);

        const supervisedPrefixMap = {
            2: 'initial_clean',
            3: 'feature_selection',
            4: 'feature_engineering',
            5: 'advanced_transformation',
            6: 'statistical_analysis',
            7: 'feature_importance'
        };

        const timeseriesPrefixMap = {
            2: 'initial_clean',
            3: 'handle_missing_values',
            4: 'feature_integrity_validation',
            5: 'data_stabalization',
            6: 'data_seasonalization',
            7: 'data_stationarity_treatment',
            8: 'feature_dependency_analysis',
            9: 'scaling_and_encoding'
        };

        const prefixMap = isTimeSeries ? timeseriesPrefixMap : supervisedPrefixMap;
        return prefixMap[step] || null;
    };

    useEffect(() => {
        if (isOpen && currentStep > 1) {
            fetchPreviewData();
        }
    }, [isOpen, currentStep]);

    const fetchPreviewData = async () => {
        const prefix = getPrefix(currentStep);
        if (!prefix) return;

        setLoading(true);
        setError(null);
        setCurrentPage(1);

        try {
            const query = new URLSearchParams({
                ensemble_id: datasetState?.ensembleId || '',
                workflow_id: activeWorkflowId || '',
                prefix,
                split: 'train'
            }).toString();

            const response = await fetch(
                `${hostnameAI}/data/view_processed_file?${query}`,
                {
                    method: 'GET',
                    headers: {
                        'accept': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch preview data: ${response.statusText}`);
            }

            const data = await response.json();
            setPreviewData(data);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching preview data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const totalPages = previewData?.data_preview
        ? Math.ceil(previewData.data_preview.length / rowsPerPage)
        : 0;

    const paginatedData = previewData?.data_preview?.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    ) || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Eye className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Data Preview</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {loading && (
                        <div className="flex items-center justify-center h-96">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading preview data...</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center justify-center h-96">
                            <div className="text-center max-w-md">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <X className="w-8 h-8 text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Data</h3>
                                <button
                                    onClick={fetchPreviewData}
                                    className="px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a6ba0] transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}

                    {!loading && !error && previewData && (
                        <>
                            <div className="overflow-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                                <table className="w-full">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 bg-gray-50">
                                                #
                                            </th>
                                            {previewData.columns.map((column) => (
                                                <th
                                                    key={column}
                                                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 bg-gray-50 whitespace-nowrap"
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        <span>{column}</span>
                                                        <span className="text-xs font-normal text-gray-500 normal-case">
                                                            {previewData.data_types[column]}
                                                        </span>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedData.map((row, rowIndex) => (
                                            <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-gray-500 font-medium border-r border-gray-200">
                                                    {(currentPage - 1) * rowsPerPage + rowIndex + 1}
                                                </td>
                                                {previewData.columns.map((column) => (
                                                    <td
                                                        key={column}
                                                        className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                                                    >
                                                        {typeof row[column] === 'number'
                                                            ? row[column].toLocaleString(undefined, {
                                                                maximumFractionDigits: 2,
                                                                minimumFractionDigits: 0
                                                            })
                                                            : row[column]?.toString() || '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                                    <div className="text-sm text-gray-600">
                                        Showing {(currentPage - 1) * rowsPerPage + 1} to{' '}
                                        {Math.min(currentPage * rowsPerPage, previewData.data_preview.length)} of{' '}
                                        {previewData.data_preview.length} rows
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }

                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                                                                ? 'bg-purple-600 text-white'
                                                                : 'text-gray-600 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button
                                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4 text-gray-600" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DataPreviewModal;