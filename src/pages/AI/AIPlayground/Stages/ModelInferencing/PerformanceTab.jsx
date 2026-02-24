import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown, Search, X } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { tw } from '../../../../../components/themeContext';

const METRIC_KEYS = [
  { key: 'Accuracy',  label: 'Accuracy',  testKey: 'testAccuracy',  trainKey: 'trainAccuracy',  isLogLoss: false },
  { key: 'Precision', label: 'Precision', testKey: 'testPrecision', trainKey: 'trainPrecision', isLogLoss: false },
  { key: 'Recall',    label: 'Recall',    testKey: 'testRecall',    trainKey: 'trainRecall',    isLogLoss: false },
  { key: 'F1',        label: 'F1',        testKey: 'testF1',        trainKey: 'trainF1',        isLogLoss: false },
  { key: 'LogLoss',   label: 'Log Loss',  testKey: 'testLogLoss',   trainKey: 'trainLogLoss',   isLogLoss: true  },
];

const SortIcon = ({ active, direction }) => {
  if (!active) return <ChevronsUpDown className="w-3 h-3 ml-1 text-gray-400 inline-block" />;
  return direction === 'asc'
    ? <ChevronUp className="w-3 h-3 ml-1 text-[#8e78b7] inline-block" />
    : <ChevronDown className="w-3 h-3 ml-1 text-[#8e78b7] inline-block" />;
};

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
  <div className="text-xs text-gray-500 flex items-center justify-between">
    <span>
      Showing {total === 0 ? 0 : startIndex + 1}–{Math.min(endIndex, total)} of {total} results
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

const formatVal = (val, isLogLoss = false) =>
  val !== 'N/A' && val !== undefined && val !== null
    ? (isLogLoss ? val : `${val}%`)
    : 'N/A';

const UnifiedMetricsTable = ({ allData, searchQuery, rowsPerPage = 10 }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, prefix: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  useMemo(() => { setCurrentPage(1); }, [searchQuery]);

  // Determine which metric columns have at least one non-N/A value across test OR train
  const visibleMetrics = useMemo(() => {
    return METRIC_KEYS.filter(m => {
      return allData.some(algo =>
        (algo[m.testKey] !== 'N/A' && algo[m.testKey] !== undefined && algo[m.testKey] !== null) ||
        (algo[m.trainKey] !== 'N/A' && algo[m.trainKey] !== undefined && algo[m.trainKey] !== null)
      );
    });
  }, [allData]);

  // For each visible metric, check if test side has any data and train side has any data
  const testVisible = useMemo(() => {
    const map = {};
    visibleMetrics.forEach(m => {
      map[m.key] = allData.some(algo => algo[m.testKey] !== 'N/A' && algo[m.testKey] !== undefined && algo[m.testKey] !== null);
    });
    return map;
  }, [visibleMetrics, allData]);

  const trainVisible = useMemo(() => {
    const map = {};
    visibleMetrics.forEach(m => {
      map[m.key] = allData.some(algo => algo[m.trainKey] !== 'N/A' && algo[m.trainKey] !== undefined && algo[m.trainKey] !== null);
    });
    return map;
  }, [visibleMetrics, allData]);

  const testColCount = visibleMetrics.filter(m => testVisible[m.key]).length;
  const trainColCount = visibleMetrics.filter(m => trainVisible[m.key]).length;

  const processedData = useMemo(() => {
    let filtered = allData.filter(algo => {
      const name      = (algo.fullName ?? algo.displayName ?? '').toLowerCase();
      const shortName = getShortName(algo.fullName ?? algo.displayName).toLowerCase();
      const q         = searchQuery.toLowerCase();
      return name.includes(q) || shortName.includes(q);
    });

    if (sortConfig.key && sortConfig.prefix) {
      const metric = METRIC_KEYS.find(m => m.key === sortConfig.key);
      if (metric) {
        const dataKey = sortConfig.prefix === 'test' ? metric.testKey : metric.trainKey;
        filtered.sort((a, b) => {
          const aVal = a[dataKey];
          const bVal = b[dataKey];
          if (aVal === 'N/A' && bVal === 'N/A') return 0;
          if (aVal === 'N/A') return 1;
          if (bVal === 'N/A') return -1;
          const aNum = parseFloat(aVal);
          const bNum = parseFloat(bVal);
          if (!isNaN(aNum) && !isNaN(bNum))
            return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
          return 0;
        });
      }
    }
    return filtered;
  }, [allData, sortConfig, searchQuery]);

  const totalPages = Math.ceil(processedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex   = startIndex + rowsPerPage;
  const pageData   = processedData.slice(startIndex, endIndex);

  const handleSort = (key, prefix) => {
    setSortConfig(prev => {
      if (prev.key === key && prev.prefix === prefix) {
        if (prev.direction === 'asc') return { key, prefix, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, prefix: null, direction: 'asc' };
      }
      return { key, prefix, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            {/* Group header row */}
            <tr className="bg-gray-50 border-b border-gray-100">
              {/* Algorithm col spanning 2 rows via rowSpan — we use an empty top-left cell here */}
              <th
                rowSpan={2}
                className="text-left py-2.5 px-4 font-semibold text-gray-600 border-r border-gray-200 whitespace-nowrap align-middle min-w-[180px]"
              >
                Algorithms
              </th>

              {testColCount > 0 && (
                <th
                  colSpan={testColCount}
                  className="text-center py-1.5 px-4 font-semibold text-gray-600 border-r border-gray-200 tracking-wide uppercase text-[10px]"
                >
                  Test
                </th>
              )}

              {trainColCount > 0 && (
                <th
                  colSpan={trainColCount}
                  className="text-center py-1.5 px-4 font-semibold text-gray-600 tracking-wide uppercase text-[10px]"
                >
                  Train
                </th>
              )}
            </tr>

            {/* Sub-header row: individual metric columns */}
            <tr className="bg-gray-50 border-b border-gray-200">
              {visibleMetrics.filter(m => testVisible[m.key]).map((m, i) => (
                <th
                  key={`test-${m.key}`}
                  onClick={() => handleSort(m.key, 'test')}
                  className={`text-left py-1.5 px-4 font-semibold text-gray-500 cursor-pointer select-none whitespace-nowrap ${
                    i === visibleMetrics.filter(x => testVisible[x.key]).length - 1 ? 'border-r border-gray-200' : ''
                  }`}
                >
                  <span className="inline-flex items-center hover:text-[#8e78b7] transition-colors duration-150">
                    {m.label}
                    <SortIcon
                      active={sortConfig.key === m.key && sortConfig.prefix === 'test'}
                      direction={sortConfig.direction}
                    />
                  </span>
                </th>
              ))}

              {visibleMetrics.filter(m => trainVisible[m.key]).map((m) => (
                <th
                  key={`train-${m.key}`}
                  onClick={() => handleSort(m.key, 'train')}
                  className="text-left py-1.5 px-4 font-semibold text-gray-500 cursor-pointer select-none whitespace-nowrap"
                >
                  <span className="inline-flex items-center hover:text-[#8e78b7] transition-colors duration-150">
                    {m.label}
                    <SortIcon
                      active={sortConfig.key === m.key && sortConfig.prefix === 'train'}
                      direction={sortConfig.direction}
                    />
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {pageData.length > 0 ? (
              pageData.map((algo, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-[#f5f3ff]/40 transition-colors duration-100"
                >
                  {/* Algorithm name */}
                  <td className="py-1.5 px-4 text-gray-800 border-r border-gray-200 font-medium" title={algo.fullName}>
                    <HighlightMatch
                      text={getShortName(algo.fullName ?? algo.displayName)}
                      query={searchQuery}
                    />
                  </td>

                  {/* Test metric cells */}
                  {visibleMetrics.filter(m => testVisible[m.key]).map((m, i) => {
                    const isLast = i === visibleMetrics.filter(x => testVisible[x.key]).length - 1;
                    return (
                      <td
                        key={`test-${m.key}`}
                        className={`py-1.5 px-4 text-gray-700 ${isLast ? 'border-r border-gray-200' : ''}`}
                      >
                        {formatVal(algo[m.testKey], m.isLogLoss)}
                      </td>
                    );
                  })}

                  {/* Train metric cells */}
                  {visibleMetrics.filter(m => trainVisible[m.key]).map((m) => (
                    <td key={`train-${m.key}`} className="py-1.5 px-4 text-gray-700">
                      {formatVal(algo[m.trainKey], m.isLogLoss)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={1 + testColCount + trainColCount}
                  className="py-10 text-center text-gray-400 text-xs"
                >
                  No algorithms match your search
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="px-4 py-2.5 border-t border-gray-100 bg-white">
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
    </div>
  );
};

const PerformanceTab = ({ algorithmData }) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 className={`${tw.sectionHeading} text-gray-900 mb-0.5`}>Model Performance Overview</h2>
        <p className="text-xs text-gray-500">
          Compare training and testing performance across standard evaluation metrics.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search models by name..."
          className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8e78b7]/40 focus:border-[#8e78b7] transition-colors"
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
        <UnifiedMetricsTable
          allData={algorithmData}
          searchQuery={searchQuery}
        />
      ) : (
        <div className="py-12 text-center bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm font-medium text-gray-500">No performance data available</p>
          <p className="text-xs text-gray-400 mt-1">Model metrics will appear here once training completes</p>
        </div>
      )}
    </div>
  );
};

export default PerformanceTab;