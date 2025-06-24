import React, { useState } from 'react';
import { Play, Pencil, ChevronLeft, ChevronRight, TriangleAlert, X,Check } from 'lucide-react';
import { Icon } from "@iconify-icon/react";

const RuleRunDetails = ({ show, onClose, runDetails, ruleSummary }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;

    if (!show || !ruleSummary || runDetails.length === 0) return null;

    const totalPages = Math.ceil(runDetails.length / rowsPerPage);
    const indexOfLastItem = currentPage * rowsPerPage;
    const indexOfFirstItem = indexOfLastItem - rowsPerPage;
    const currentItems = runDetails.slice(indexOfFirstItem, indexOfLastItem);

    const goToPage = (pageNumber) => setCurrentPage(pageNumber);
    const goToPreviousPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
    const goToNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

    return (
        <div className="fixed inset-0 bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto transform transition-all duration-300 scale-100">
                <div className="flex justify-between items-center border-b border-gray-200 pb-5 mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Rule Snapshot</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                        aria-label="Close modal"
                    >
                        <X className="h-7 w-7" />
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 mb-8 text-base">
                    <div>
                        <span className="font-semibold text-gray-700">ID:</span>
                        <span className="ml-2 text-gray-800">{ruleSummary.id}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Severity:</span>
                        <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                            ruleSummary.severity === 'High' ? 'bg-red-100 text-red-800' :
                            ruleSummary.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                        }`}>
                            {ruleSummary.severity}
                        </span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Name:</span>
                        <span className="ml-2 text-gray-800">{ruleSummary.name || '-'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Type:</span>
                        <span className="ml-2 text-gray-800">{ruleSummary.type || '-'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Group:</span>
                        <span className="ml-2 text-gray-800">{ruleSummary.group_name || '-'}</span>
                    </div>
                    <div className="col-span-2 lg:col-span-3">
                        <span className="font-semibold text-gray-700">Description:</span>
                        <span className="ml-2 text-gray-800">{ruleSummary.description || '-'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Created Date:</span>
                        <span className="ml-2 text-gray-800">{ruleSummary.created_date || '-'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Last Run Date:</span>
                        <span className="ml-2 text-gray-800">{ruleSummary.last_run || '-'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Frequency:</span>
                        <span className="ml-2 text-gray-800">-</span>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[55vh] rounded-lg border border-gray-200">
                    <table className="w-full text-base">
                        <thead>
                            <tr className="bg-gray-800 text-white sticky top-0">
                                <th className="px-6 py-3 text-left font-semibold">Connection</th>
                                <th className="px-6 py-3 text-left font-semibold">Schema</th>
                                <th className="px-6 py-3 text-left font-semibold">Table</th>
                                <th className="px-6 py-3 text-left font-semibold">Column</th>
                                <th className="px-6 py-3 text-left font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((detail, index) => (
                                <tr
                                    key={index}
                                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150"
                                >
                                    <td className="px-6 py-3">{detail.connection_details?.connection || '-'}</td>
                                    <td className="px-6 py-3">{detail.connection_details?.schema || '-'}</td>
                                    <td className="px-6 py-3">{detail.connection_details?.table || '-'}</td>
                                    <td className="px-6 py-3">{detail.connection_details?.column || '-'}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            detail.status?.toLowerCase() === 'violation' ? 'bg-red-100 text-red-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                            {detail.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {runDetails.length > rowsPerPage && (
                    <div className="flex justify-end items-center py-3 border-t">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={goToPreviousPage}
                                disabled={currentPage === 1}
                                className={`p-1 rounded ${currentPage === 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <div className="flex items-center">
                                {[...Array(totalPages)].map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => goToPage(index + 1)}
                                        className={`px-2 py-1 mx-0.5 rounded ${
                                            currentPage === index + 1
                                                ? 'bg-[#8e78b7] text-white'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={goToNextPage}
                                disabled={currentPage === totalPages}
                                className={`p-1 rounded ${currentPage === totalPages ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
                <div className="flex justify-end mt-8">
                    <button
                        onClick={onClose}
                        className="px-8 py-2.5 bg-[#8e78b7] text-white rounded-lg hover:from-[#7a67a0] hover:to-[#5a4b80] transition-all duration-200 font-medium text-base"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const RuleRunSummary = ({ show, onClose, selectedRules, ruleRunResults, onQuickAction, isLoading }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [showRunDetailsPopup, setShowRunDetailsPopup] = useState(false);
    const [currentRuleRunDetails, setCurrentRuleRunDetails] = useState([]);
    const [currentRuleSummary, setCurrentRuleSummary] = useState(null);

    const rowsPerPage = 5;

    if (!show) return null;

    const groups = [...new Set(selectedRules.map(rule => rule.group_name))].length;

    const connections = selectedRules.reduce((acc, curr) => {
        const ruleConnections = curr.mappings?.flatMap(mapping =>
            mapping.connection_details?.map(detail => detail.connection) || []
        ).length || 0;
        return acc + ruleConnections;
    }, 0);

    const schemas = selectedRules.reduce((acc, curr) => {
        const ruleSchemas = curr.mappings?.flatMap(mapping =>
            mapping.connection_details?.map(detail => detail.schema) || []
        ).length || 0;
        return acc + ruleSchemas;
    }, 0);

    const tables = selectedRules.reduce((acc, curr) => {
        const ruleTables = curr.mappings?.flatMap(mapping =>
            mapping.connection_details?.flatMap(detail => detail.tables || []) || []
        ).length || 0;
        return acc + ruleTables;
    }, 0);

    const columns = selectedRules.reduce((acc, curr) => {
        const ruleColumns = curr.mappings?.flatMap(mapping =>
            mapping.connection_details?.flatMap(detail => detail.columns || []) || []
        ).length || 0;
        return acc + ruleColumns;
    }, 0);

    const issuesFound = ruleRunResults.filter(item => item?.status?.toLowerCase() === 'violation').length;

    const totalPages = Math.ceil(selectedRules.length / rowsPerPage);
    const indexOfLastItem = currentPage * rowsPerPage;
    const indexOfFirstItem = indexOfLastItem - rowsPerPage;
    const currentItems = selectedRules.slice(indexOfFirstItem, indexOfLastItem);

    const goToPage = (pageNumber) => setCurrentPage(pageNumber);
    const goToPreviousPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
    const goToNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

    const handleRunQuickAction = (rule) => {
        const detailsForThisRule = ruleRunResults.filter(result => result.rule_id === rule.id);
        setCurrentRuleRunDetails(detailsForThisRule);
        setCurrentRuleSummary(rule);
        setShowRunDetailsPopup(true);
    };

    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                {isLoading ? (
                    <div className="flex justify-center items-center h-[40vh]">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#8e78b7]"></div>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Rule Run Summary</h2>
                            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="border border-gray-200 px-6 py-4 rounded-xl mb-8 bg-gradient-to-r from-gray-50 to-gray-100 shadow-sm">
                            <div className="flex items-center justify-between px-10">
                                <div className="flex flex-col items-center gap-2">
                                    {issuesFound === 0 ? (
                                        <>
                                        <span className="text-xl text-gray-700 font-medium">No Issues Found</span>
                                        <Check className="h-10 w-10 text-green-600" />
                                        </>
                                    ) : (
                                        <>
                                        <span className="text-xl text-gray-700 font-medium">Issues Found</span>
                                        <TriangleAlert className="h-9 w-9 text-red-600" />
                                        </>
                                    )}
                                </div>
                                <div className="flex space-x-8 text-base text-gray-700">
                                    {[
                                        { label: 'Groups', value: groups },
                                        { label: 'Connections', value: connections },
                                        { label: 'Schemas', value: schemas },
                                        { label: 'Tables', value: tables },
                                        { label: 'Columns', value: columns },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex flex-col items-center">
                                            <span className="font-semibold text-sm">{item.label}</span>
                                            <span className="text-2xl font-bold text-gray-900">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto max-h-[55vh] rounded-lg">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[#29304a] text-white">
                                        <th className="px-2 py-2 text-left font-semibold">#</th>
                                        <th className="px-2 py-2 text-left font-semibold">ID</th>
                                        <th className="px-2 py-2 text-left font-semibold">Type</th>
                                        <th className="px-2 py-2 text-left font-semibold">Group</th>
                                        <th className="px-2 py-2 text-left font-semibold">Name</th>
                                        <th className="px-2 py-2 text-left font-semibold">Severity</th>
                                        <th className="px-2 py-2 text-left font-semibold">Owner</th>
                                        <th className="px-2 py-2 text-left font-semibold">Quick Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((rule, index) => (
                                        <tr key={rule.id} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="px-2 py-2">{indexOfFirstItem + index + 1}</td>
                                            <td className="px-2 py-2">{rule.id}</td>
                                            <td className="px-2 py-2 max-w-[150px] truncate tooltip">{rule.type || '-'}</td>
                                            <td className="px-2 py-2 max-w-[150px] truncate">{rule.group_name || '-'}</td>
                                            <td className="px-2 py-2 max-w-[300px] truncate">{rule.name || '-'}</td>
                                            <td className="px-2 py-2 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    rule.severity === 'High' ? 'bg-red-100 text-red-700' :
                                                    rule.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                    {rule.severity}
                                                </span>
                                            </td>
                                            <td className="px-2 py-2">{rule.owner || '-'}</td>
                                            <td className="px-2 py-2">
                                                <div className="flex gap-2 justify-center">
                                                    <button
                                                        onClick={() => handleRunQuickAction(rule)}
                                                        className="p-2 hover:bg-green-100 rounded-full"
                                                        title="Run"
                                                    >
                                                        <Play className="h-4 w-4 text-[#8e78b7]" />
                                                    </button>
                                                    <button
                                                        onClick={() => onQuickAction('Edit', rule)}
                                                        className="p-2 hover:bg-blue-100 rounded-full"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-4 w-4 text-[#8e78b7]" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end items-center py-3 border-t">
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={goToPreviousPage}
                                    disabled={currentPage === 1}
                                    className={`p-1 rounded ${currentPage === 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <div className="flex items-center">
                                    {[...Array(totalPages)].map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => goToPage(index + 1)}
                                            className={`px-2 py-1 mx-0.5 rounded ${
                                                currentPage === index + 1
                                                    ? 'bg-[#8e78b7] text-white'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                    className={`p-1 rounded ${currentPage === totalPages ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 mt-4">
                            <button
                                className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-6 py-2 bg-[#8e78b7] text-white rounded hover:bg-[#7a67a0]"
                                onClick={onClose}
                            >
                                OK
                            </button>
                        </div>
                    </>
                )}
            </div>

            <RuleRunDetails
                show={showRunDetailsPopup}
                onClose={() => setShowRunDetailsPopup(false)}
                runDetails={currentRuleRunDetails}
                ruleSummary={currentRuleSummary}
            />
        </div>
    );
};

export default RuleRunSummary;