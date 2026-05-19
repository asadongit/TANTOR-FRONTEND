import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import Plot from 'react-plotly.js';

const SearchableSelect = ({ options, value, onChange, placeholder = 'Search...', className = '' }) => {
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
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-left hover:border-gray-400 focus:outline-none transition-colors"
        title={selectedLabel}
      >
        <span className="truncate text-gray-900">{selectedLabel || placeholder}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[220px] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
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

const ConfusionMatrixTab = ({
  selectedConfusionModel,
  setSelectedConfusionModel,
  apiResults,
  selectedConfusionData
}) => {
  const modelOptions = apiResults.map(r => ({ value: r.run_name, label: r.run_name }));

  const normalizeMatrixPayload = (payload) => {
    if (!payload) {
      return { matrix: null, labels: [] };
    }

    if (Array.isArray(payload)) {
      return {
        matrix: payload,
        labels: payload.map((_, index) => `Class ${index}`)
      };
    }

    const matrix = payload.matrix || payload.data || payload.values || null;
    const labels = payload.labels || payload.class_labels || payload.classNames || payload.class_names;
    const resolvedLabels = Array.isArray(labels) && labels.length > 0
      ? labels
      : Array.isArray(matrix)
        ? matrix.map((_, index) => `Class ${index}`)
        : [];

    return { matrix, labels: resolvedLabels };
  };

  const buildAnnotations = (matrix, labels) => {
    if (!Array.isArray(matrix) || matrix.length === 0) return [];

    const flatValues = matrix.flat().filter(value => typeof value === 'number');
    const maxValue = flatValues.length > 0 ? Math.max(...flatValues) : 0;

    return matrix.flatMap((row, rowIndex) =>
      row.map((value, colIndex) => ({
        x: labels[colIndex],
        y: labels[rowIndex],
        text: String(value),
        showarrow: false,
        font: {
          size: 12,
          color: value >= maxValue * 0.6 ? '#ffffff' : '#4a3880',
        },
      }))
    );
  };

  const renderMatrixCard = (datasetKey, title) => {
    const { matrix: matrixData, labels } = normalizeMatrixPayload(selectedConfusionData?.[datasetKey]);
    const axisAnnotations = [
      {
        x: 0.5,
        y: 1.14,
        xref: 'paper',
        yref: 'paper',
        text: 'Predicted',
        showarrow: false,
        font: {
          size: 12,
          color: '#4b5563',
        },
      },
      {
        x: -0.16,
        y: 0.5,
        xref: 'paper',
        yref: 'paper',
        text: 'Actual',
        textangle: -90,
        showarrow: false,
        font: {
          size: 12,
          color: '#4b5563',
        },
      },
    ];

    const annotations = [...buildAnnotations(matrixData, labels), ...axisAnnotations];

    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>

        {matrixData ? (
          <Plot
            data={[
              {
                z: matrixData,
                x: labels,
                y: labels,
                type: 'heatmap',
                colorscale: [[0, '#fbf7ff'], [0.25, '#e9d8ff'], [0.5, '#d0b3ff'], [0.75, '#b08cff'], [1, '#6b52a8']],
                showscale: false,
                hovertemplate: 'Predicted: %{x}<br>Actual: %{y}<br>Count: %{z}<extra></extra>',
              }
            ]}
            layout={{
              title: `${title} - ${selectedConfusionData.modelName}`,
              xaxis: {
                title: 'Predicted Labels',
                side: 'bottom',
                tickangle: 0,
                tickfont: { size: 11 },
                automargin: true,
                tickmode: 'array',
                tickvals: labels,
                ticktext: labels,
                ticks: 'outside',
                standoff: 8,
              },
              yaxis: {
                title: 'Actual Labels',
                autorange: 'reversed',
                automargin: true,
                tickmode: 'array',
                tickvals: labels,
                ticktext: labels,
                tickfont: { size: 11 },
              },
              annotations,
              margin: { l: 130, r: 20, t: 100, b: 220 },
              autosize: true,
              height: 480,
            }}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler
            config={{ responsive: true }}
          />
        ) : (
          <div className="py-12 text-center bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-500">No {title.toLowerCase()} data available</p>
            <p className="text-xs text-gray-400 mt-1">Confusion matrix data is not present for this dataset</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Confusion Matrix</h2>
          <p className="text-xs text-gray-500">
            Visualize model predictions vs actual labels. Select a model to view its confusion matrix.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div>
            <label className="text-xs text-gray-600 block mb-1">Select Model:</label>
            <SearchableSelect
              options={modelOptions}
              value={selectedConfusionModel}
              onChange={setSelectedConfusionModel}
              placeholder="Search models..."
              className="min-w-[260px]"
            />
          </div>
        </div>
      </div>

      {selectedConfusionData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderMatrixCard('train', 'Train Matrix')}
          {renderMatrixCard('test', 'Test Matrix')}
        </div>
      ) : (
        <div className="py-12 text-center bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-500">No confusion matrix data available</p>
          <p className="text-xs text-gray-400 mt-1">Confusion matrix data is not present for this model</p>
        </div>
      )}
    </div>
  );
};

export { ConfusionMatrixTab };
