import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown, Search, X } from 'lucide-react';
import React, { useState, useMemo } from 'react';

const COLUMNS = [
  { key: 'displayName', label: 'Algorithms' },
  { key: 'Accuracy', label: 'Accuracy' },
  { key: 'Precision', label: 'Precision' },
  { key: 'Recall', label: 'Recall' },
  { key: 'F1', label: 'F1' },
  { key: 'LogLoss', label: 'Log Loss' },
];

const SortIcon = ({ column, sortConfig }) => {
  if (sortConfig.key !== column) {
    return <ChevronsUpDown className="w-3 h-3 ml-1 text-gray-400 inline-block" />;
  }
  return sortConfig.direction === 'asc'
    ? <ChevronUp className="w-3 h-3 ml-1 text-indigo-600 inline-block" />
    : <ChevronDown className="w-3 h-3 ml-1 text-indigo-600 inline-block" />;
};

const getRawValue = (algo, key, prefix) => ({
  displayName: algo.fullName ?? algo.displayName,
  Accuracy: prefix === 'test' ? algo.testAccuracy : algo.trainAccuracy,
  Precision: prefix === 'test' ? algo.testPrecision : algo.trainPrecision,
  Recall: prefix === 'test' ? algo.testRecall : algo.trainRecall,
  F1: prefix === 'test' ? algo.testF1 : algo.trainF1,
  LogLoss: prefix === 'test' ? algo.testLogLoss : algo.trainLogLoss,
}[key]);

const getShortName = (fullName) => {
  if (!fullName) return fullName;
  const MAX = 35;
  if (fullName.length <= MAX) return fullName;
  return '...' + fullName.slice(-MAX);
};

const HighlightMatch = ({ text, query }) => {
  if (!query) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-gray-900 rounded-sm px-0">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </span>
  );
};

const Pagination = ({ currentPage, totalPages, onPrev, onNext, startIndex, endIndex, total }) => (
  <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
    <span>
      Showing {total === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, total)} of {total} results
    </span>
    <div className="flex items-center gap-2">
      <button
        onClick={onPrev}
        disabled={currentPage === 1}
        className={currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900'}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span className="text-gray-600">Page {currentPage} of {Math.max(totalPages, 1)}</span>
      <button
        onClick={onNext}
        disabled={currentPage === totalPages || totalPages === 0}
        className={currentPage === totalPages || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900'}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  </div>
);

const MetricsTable = ({ title, allData, prefix, searchQuery, rowsPerPage = 10 }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  useMemo(() => { setCurrentPage(1); }, [searchQuery]);

  const processedData = useMemo(() => {
    let filtered = allData.filter(algo => {
      const name = (algo.fullName ?? algo.displayName ?? '').toLowerCase();
      const shortName = getShortName(algo.fullName ?? algo.displayName).toLowerCase();
      const q = searchQuery.toLowerCase();
      return name.includes(q) || shortName.includes(q);
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = getRawValue(a, sortConfig.key, prefix);
        const bVal = getRawValue(b, sortConfig.key, prefix);

        if (aVal === 'N/A' && bVal === 'N/A') return 0;
        if (aVal === 'N/A') return 1;
        if (bVal === 'N/A') return -1;

        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }

        const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' });
        return sortConfig.direction === 'asc' ? cmp : -cmp;
      });
    }

    return filtered;
  }, [allData, sortConfig, prefix, searchQuery]);

  const totalPages = Math.ceil(processedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const pageData = processedData.slice(startIndex, endIndex);

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  const formatVal = (val) => (val !== 'N/A' ? `${val}%` : val);

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="text-left py-2 px-3 font-medium text-gray-600 cursor-pointer select-none whitespace-nowrap"
                >
                  <span className="inline-flex items-center hover:text-indigo-600 transition-colors duration-150">
                    {col.label}
                    <SortIcon column={col.key} sortConfig={sortConfig} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length > 0 ? (
              pageData.map((algo, idx) => (
                <tr key={idx} className="border-t border-gray-200 hover:bg-indigo-50/40 transition-colors duration-100">
                  <td className="py-2 px-3 text-gray-700" title={algo.fullName}>
                    <HighlightMatch text={getShortName(algo.fullName ?? algo.displayName)} query={searchQuery} />
                  </td>
                  <td className="py-2 px-3 text-gray-700">{formatVal(prefix === 'test' ? algo.testAccuracy : algo.trainAccuracy)}</td>
                  <td className="py-2 px-3 text-gray-700">{formatVal(prefix === 'test' ? algo.testPrecision : algo.trainPrecision)}</td>
                  <td className="py-2 px-3 text-gray-700">{formatVal(prefix === 'test' ? algo.testRecall : algo.trainRecall)}</td>
                  <td className="py-2 px-3 text-gray-700">{formatVal(prefix === 'test' ? algo.testF1 : algo.trainF1)}</td>
                  <td className="py-2 px-3 text-gray-700">{prefix === 'test' ? algo.testLogLoss : algo.trainLogLoss}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                  No algorithms match your search
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPrev={() => setCurrentPage(p => Math.max(p - 1, 1))}
        onNext={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
        startIndex={startIndex}
        endIndex={endIndex}
        total={processedData.length}
      />
    </div>
  );
};

const PerformanceTab = ({ algorithmData }) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Model Performance Overview</h2>
      <p className="text-xs text-gray-500 mb-4">
        Compare training and testing performance across standard evaluation metrics.
      </p>

      {/* Search bar */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search algorithms..."
          className="w-full pl-8 pr-8 py-1.5 text-xs border border-gray-300 rounded-md bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {algorithmData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MetricsTable title="Test Metrics" allData={algorithmData} prefix="test" searchQuery={searchQuery} />
          <MetricsTable title="Train Metrics" allData={algorithmData} prefix="train" searchQuery={searchQuery} />
        </div>
      ) : (
        <div className="py-12 text-center bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-500">No performance data available</p>
          <p className="text-xs text-gray-400 mt-1">Model metrics are not present in the results</p>
        </div>
      )}
    </div>
  );
};

export default PerformanceTab;