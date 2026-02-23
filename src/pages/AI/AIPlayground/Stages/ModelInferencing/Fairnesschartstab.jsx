import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Info, ChevronDown, Search, X } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder = 'Search...', label, className = '' }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = options.filter(opt =>
    opt.label.toLowerCase().includes(query.toLowerCase())
  );

  const selectedLabel = options.find(o => o.value === value)?.label ?? value ?? '';

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
    setQuery('');
  };

  const handleToggle = () => {
    setOpen(prev => !prev);
    if (!open) setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-left hover:border-gray-400 focus:outline-none transition-colors"
        style={{ outline: 'none' }}
        onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px #c4b5f4'}
        onBlur={e => e.currentTarget.style.boxShadow = 'none'}
        title={selectedLabel}
      >
        <span className="truncate text-gray-900">{selectedLabel || placeholder}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[220px] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={placeholder}
              className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Options list */}
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length > 0 ? (
              filtered.map(opt => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    title={opt.label}
                    className={`w-full text-left px-3 py-2 text-sm truncate transition-colors ${
                      opt.value === value
                        ? 'font-medium'
                        : 'text-gray-800'
                    }`}
                    style={
                      opt.value === value
                        ? { background: '#ede9f6', color: '#6b52a8' }
                        : {}
                    }
                    onMouseEnter={e => {
                      if (opt.value !== value) {
                        e.currentTarget.style.background = '#ede9f6';
                        e.currentTarget.style.color = '#6b52a8';
                      }
                    }}
                    onMouseLeave={e => {
                      if (opt.value !== value) {
                        e.currentTarget.style.background = '';
                        e.currentTarget.style.color = '';
                      }
                    }}
                  >
                    {opt.label}
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-3 text-xs text-gray-400 text-center">No results found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// ─── FairnessTab ──────────────────────────────────────────────────────────────
const FairnessTab = ({
  selectedFairnessModel,
  setSelectedFairnessModel,
  apiResults,
  selectedModelFairnessData
}) => {
  const formatMetricName = (metricKey) =>
    metricKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const modelOptions = apiResults.map(r => ({ value: r.run_name, label: r.run_name }));

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Fairness Metrics Overview</h2>
          <p className="text-xs text-gray-500">
            Evaluate bias across demographic groups. Select a model to view fairness metrics specific to that model.
          </p>
        </div>
        <SearchableSelect
          options={modelOptions}
          value={selectedFairnessModel}
          onChange={setSelectedFairnessModel}
          placeholder="Search models..."
          className="min-w-[260px]"
        />
      </div>

      {selectedModelFairnessData && (
        <>

          {/* Fairness assessment banner */}
          <div
            className="mb-6 p-4 rounded-lg border"
            style={{ background: '#ede9f6', borderColor: '#c4b5f4' }}
          >
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 flex-shrink-0" style={{ color: '#8e78b7' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: '#8e78b7' }}>Fairness Assessment</p>
                <p className="text-xs mt-1" style={{ color: '#8e78b7' }}>{selectedModelFairnessData.fairnessAssessment}</p>
              </div>
            </div>
          </div>

          {selectedModelFairnessData.demographics && selectedModelFairnessData.demographics.length > 0 ? (
            <div className="space-y-6">
              {selectedModelFairnessData.demographics.map((demographic) => {
                const data = selectedModelFairnessData[demographic];
                if (!data) return null;
                const displayName = demographic.charAt(0).toUpperCase() + demographic.slice(1);
                const availableMetrics = Object.entries(data).filter(([, v]) => v !== null);
                if (availableMetrics.length === 0) return null;

                return (
                  <div key={demographic}>
                    <h3 className="text-base font-semibold text-gray-900 mb-4">{displayName} Fairness Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableMetrics.map(([metricKey, metricValue]) => (
                        <div key={metricKey} className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-xs text-gray-600 mb-2">
                            {formatMetricName(metricKey)} ({displayName})
                          </h4>
                          <p className="text-2xl font-semibold text-gray-900">
                            {typeof metricValue === 'number' ? metricValue.toFixed(4) : metricValue}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-500">No fairness metrics available</p>
              <p className="text-xs text-gray-400 mt-1">Fairness data is not present for this model</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── ChartsTab ────────────────────────────────────────────────────────────────
const ChartsTab = ({
  selectedChartsModel,
  setSelectedChartsModel,
  selectedChartDemographic,
  setSelectedChartDemographic,
  apiResults,
  selectedModelChartData
}) => {
  const availableDemographics = React.useMemo(() => {
    if (!selectedModelChartData) return [];
    const demographics = new Set();

    if (selectedModelChartData.fairnessBarCharts) {
      Object.keys(selectedModelChartData.fairnessBarCharts).forEach(key => {
        if (selectedModelChartData.fairnessBarCharts[key]) demographics.add(key);
      });
    }
    if (selectedModelChartData.profileRadialCharts) {
      Object.keys(selectedModelChartData.profileRadialCharts).forEach(key => {
        if (selectedModelChartData.profileRadialCharts[key]) demographics.add(key);
      });
    }
    return Array.from(demographics).sort();
  }, [selectedModelChartData]);

  useEffect(() => {
    if (availableDemographics.length > 0 && !availableDemographics.includes(selectedChartDemographic)) {
      setSelectedChartDemographic(availableDemographics[0]);
    }
  }, [availableDemographics, selectedChartDemographic, setSelectedChartDemographic]);

  const modelOptions = apiResults.map(r => ({ value: r.run_name, label: r.run_name }));
  const demographicOptions = availableDemographics.map(d => ({
    value: d,
    label: d.charAt(0).toUpperCase() + d.slice(1)
  }));

  return (
    <div className="bg-gray-50 p-4 rounded-lg -mx-4 -mb-3">
      <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm">
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Fairness Visualizations</h2>
                <p className="text-xs text-gray-500">View fairness metrics through bar charts and radial profiles.</p>
              </div>

              <div className="flex gap-3 flex-wrap">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Select Model:</label>
                  <SearchableSelect
                    options={modelOptions}
                    value={selectedChartsModel}
                    onChange={setSelectedChartsModel}
                    placeholder="Search models..."
                    className="min-w-[260px]"
                  />
                </div>

                {availableDemographics.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Select Demographic:</label>
                    <SearchableSelect
                      options={demographicOptions}
                      value={selectedChartDemographic}
                      onChange={setSelectedChartDemographic}
                      placeholder="Search demographics..."
                      className="min-w-[180px]"
                    />
                  </div>
                )}
              </div>
            </div>

            {selectedModelChartData && (
              <>
                {/* Fairness assessment banner */}
                <div
                  className="mb-6 p-4 rounded-lg border"
                  style={{ background: '#ede9f6', borderColor: '#c4b5f4' }}
                >
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 flex-shrink-0" style={{ color: '#8e78b7' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#4a3880' }}>Fairness Assessment</p>
                      <p className="text-xs mt-1" style={{ color: '#6b52a8' }}>{selectedModelChartData.fairnessAssessment}</p>
                    </div>
                  </div>
                </div>

                {availableDemographics.length > 0 ? (
                  <>
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                      <h3 className="text-base font-semibold text-gray-900 mb-4">
                        Fairness Bar Chart for '{selectedChartDemographic.charAt(0).toUpperCase() + selectedChartDemographic.slice(1)}' ({selectedModelChartData.modelName})
                      </h3>
                      {selectedModelChartData.fairnessBarCharts[selectedChartDemographic] ? (
                        <div className="flex justify-center">
                          <img
                            src={`data:image/png;base64,${selectedModelChartData.fairnessBarCharts[selectedChartDemographic]}`}
                            alt={`Fairness bar chart for ${selectedChartDemographic}`}
                            className="max-w-2xl w-full h-auto rounded-lg shadow-md"
                          />
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <p>No bar chart data available for {selectedChartDemographic}</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-base font-semibold text-gray-900 mb-4">
                        Profile Radial Chart for '{selectedChartDemographic.charAt(0).toUpperCase() + selectedChartDemographic.slice(1)}' ({selectedModelChartData.modelName})
                      </h3>
                      {selectedModelChartData.profileRadialCharts[selectedChartDemographic] ? (
                        <div className="flex justify-center">
                          <img
                            src={`data:image/png;base64,${selectedModelChartData.profileRadialCharts[selectedChartDemographic]}`}
                            alt={`Profile radial chart for ${selectedChartDemographic}`}
                            className="max-w-lg w-full h-auto rounded-lg shadow-md"
                          />
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <p>No radial chart data available for {selectedChartDemographic}</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-500">No chart data available</p>
                    <p className="text-xs text-gray-400 mt-1">No demographic charts are present for this model</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { FairnessTab, ChartsTab };