import React, { useState } from 'react';
import { Play, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { Icon } from "@iconify-icon/react";

const RuleRunSummaryPopup = ({ show, onClose, selectedRules, onQuickAction }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  if (!show) return null;

  const issuesFound = selectedRules.length;
  const groups = [...new Set(selectedRules.map(rule => rule.group_name))].length;
  const rules = selectedRules.length;
  const schemas = [...new Set(selectedRules.map(rule => rule.category))].length;
  const tables = selectedRules.reduce((acc, rule) => acc + (rule.tables || 0), 0);
  const columns = selectedRules.reduce((acc, rule) => acc + (rule.columns || 0), 0);

  const totalPages = Math.ceil(selectedRules.length / rowsPerPage);
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = selectedRules.slice(indexOfFirstItem, indexOfLastItem);

  const goToPage = (pageNumber) => setCurrentPage(pageNumber);
  const goToPreviousPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Rule Run Summary</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div className="border border-gray-200 p-6 rounded-xl mb-8 bg-gradient-to-r from-gray-50 to-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-10">
            <div className="flex items-center gap-4">
              <span className="text-red-600 text-4xl font-extrabold">{issuesFound}</span>
              <span className="text-xl text-gray-700 font-medium">Issues Found</span>
              <span className="text-red-600 text-2xl">!</span>
            </div>
            <div className="flex space-x-8 text-base text-gray-700">
              {[
                { label: 'Groups', value: groups },
                { label: 'Rules', value: rules },
                { label: 'Schema', value: schemas },
                { label: 'Tables', value: tables },
                { label: 'Columns', value: columns },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="font-semibold text-gray-600">{item.label}</span>
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
                  <td className="px-2 py-2 max-w-xs truncate tooltip">{rule.type}</td>
                  <td className="px-2 py-2 max-w-xs truncate tooltip">{rule.group_name}</td>
                  <td className="px-2 py-2 max-w-xs truncate tooltip">{rule.name}</td>
                  <td className="px-2 py-2">
                    <span className={`px-2 py-2 rounded-full text-xs font-medium ${
                      rule.severity === 'High' ? 'bg-red-100 text-red-700' :
                      rule.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {rule.severity}
                    </span>
                  </td>
                  <td className="px-2 py-2">{rule.owner}</td>
                  <td className="px-2 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onQuickAction('Run', rule)}
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
      </div>
    </div>
  );
};

export default RuleRunSummaryPopup;