import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position, useEdges, useNodes } from 'reactflow';
import { Brain, X, ChevronDown } from 'lucide-react';
import { useCSV } from '../context/CSVcontext';
import { CustomSlider } from '../Buttons/CustomSlider';

const MultiSelectDropdown = ({ options, selectedValues, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-left text-gray-300 flex justify-between items-center"
      >
        <span>{`${selectedValues.length} ${label}${selectedValues.length !== 1 ? 's' : ''} selected`}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map(option => (
            <div
              key={option.value}
              className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-700 cursor-pointer"
              onClick={() => {
                onChange(option.value);
              }}
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => {}}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-300 text-sm">{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ML_TYPES = {
  binary: {
    label: 'Binary Classification',
    algorithms: [
      { value: 'logistic_regression', label: 'Logistic Regression' },
      { value: 'random_forest', label: 'Random Forest' },
      { value: 'xgboost', label: 'XGBoost' },
      { value: 'svm', label: 'SVM' },
      { value: 'decision_tree', label: 'Decision Tree' },
      { value: 'knn', label: 'KNN' },
      { value: 'naive_bayes', label: 'Naive Bayes' },
      { value: 'ann', label: 'ANN' }
    ],
    metrics: [
      { name: 'accuracy', label: 'Accuracy' },
      { name: 'precision', label: 'Precision' },
      { name: 'recall', label: 'Recall' },
      { name: 'f1', label: 'F1 Score' },
      { name: 'log_loss', label: 'Log Loss' },
      { name: 'roc_auc', label: 'ROC AUC' }
    ]
  },
  multiclass: {
    label: 'Multiclass Classification',
    algorithms: [
      { value: 'logistic_regression', label: 'Logistic Regression' },
      { value: 'random_forest', label: 'Random Forest' },
      { value: 'xgboost', label: 'XGBoost' },
      { value:'svm', label: 'SVM' },
      { value: 'decision_tree', label: 'Decision Tree' },
      { value: 'knn', label: 'KNN' },
      { value: 'naive_bayes', label: 'Naive Bayes' },
      { value: 'ann', label: 'ANN' }
    ],
    metrics: [
      { name: 'accuracy', label: 'Accuracy' },
      { name: 'precision', label: 'Precision' },
      { name: 'recall', label: 'Recall' },
      { name: 'f1', label: 'F1 Score' },
      { name: 'log_loss', label: 'Log Loss' },
      { name: 'roc_auc', label: 'ROC AUC' }
    ]
  }
};

const findDefineNode = (nodes, edges, startNodeId) => {
  const visited = new Set();
  const queue = [startNodeId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const node = nodes.find(n => n.id === currentId);
    if (node?.type === 'dataPreparation') {
      return node;
    }

    const incomingEdges = edges.filter(e => e.target === currentId);
    queue.push(...incomingEdges.map(e => e.source));
  }

  return null;
};

export function SupervisedMLNode({ id }) {
  const [predictionType, setPredictionType] = useState('binary');
  const [selectedAlgorithms, setSelectedAlgorithms] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState(['']);
  const [sensitiveColumn, setSensitiveColumn] = useState('');
  const [loading, setLoading] = useState(false);
  const [trainTestSplit, setTrainTestSplit] = useState(80);
  const edges = useEdges();
  const nodes = useNodes();
  const { getData, setData } = useCSV();

  const incomingEdge = edges.find(edge => edge.target === id);
  const DefineNode = incomingEdge ? findDefineNode(nodes, edges, id) : null;
  const csvData = DefineNode ? getData(DefineNode.id) || [] : [];

  const [columns, setColumns] = useState([]);

  useEffect(() => {
    if (csvData && csvData.fairness_df && csvData.fairness_df.length > 0) {
      const headers = Object.keys(csvData.fairness_df[0]);
      setColumns(headers);
    }
  }, [csvData]);

  const handleAlgorithmChange = (algorithm) => {
    setSelectedAlgorithms(prev =>
      prev.includes(algorithm) ? prev.filter(algo => algo !== algorithm) : [...prev, algorithm]
    );
  };

  const handleMetricChange = (metric) => {
    setSelectedMetrics(prev =>
      prev.includes(metric) ? prev.filter(met => met !== metric) : [...prev, metric]
    );
  };

  const handleTrain = async () => {
    const createCSVFile = (data, fileName) => {
      const keys = Object.keys(data[0]);
      const csvRows = [
        keys.join(","),
        ...data.map((row) => keys.map((key) => row[key]).join(",")),
      ];
      const csvString = csvRows.join("\n");
      return new File([new Blob([csvString], { type: "text/csv" })], fileName, {
        type: "text/csv",
      });
    };

    try {
      setLoading(true);

      const testSize = parseFloat(((100 - trainTestSplit) / 100).toFixed(1));

      const formData = new FormData();
      formData.append('prediction_type', predictionType);
      if(predictionType == 'binary' || predictionType == 'multiclass'){
        selectedMetrics.push('confusion_matrix');
      }
      formData.append('training_file', createCSVFile(csvData.cleaned_df, "cleaned_df.csv"));
      formData.append('fairness_file', createCSVFile(csvData.fairness_df, "fairness_df.csv"));
      formData.append('target_column', csvData.targetColumn);
      formData.append('sensitive_column', sensitiveColumn);
      formData.append('selected_algorithms', selectedAlgorithms.join(","));
      formData.append('metrics', selectedMetrics.join(","));
      formData.append('test_size', testSize);

      const response = await fetch('http://localhost:8000/v1/train/supervised', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process data - server returned an error.');
      }

      const result = await response.json();
      setData(id, {"supervisedApiData": result, "SupervisedPredictionType": predictionType})
    } catch (error) {
      console.error('Error in handleTrain:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg border-2 border-gray-700 min-w-[300px] relative group">
      <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4 text-white" />
      </button>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div className="flex items-center space-x-3 mb-4">
        <Brain className="w-5 h-5 text-blue-400" />
        <h3 className="text-white font-medium">Supervised ML</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Prediction Type
          </label>
          <select
            value={predictionType}
            onChange={(e) => {
              setPredictionType(e.target.value);
              setSelectedAlgorithms([]);
              setSelectedMetrics([]);
            }}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-300"
          >
            {Object.entries(ML_TYPES).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Algorithms
          </label>
          <MultiSelectDropdown
            options={ML_TYPES[predictionType].algorithms}
            selectedValues={selectedAlgorithms}
            onChange={handleAlgorithmChange}
            label="Algorithm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Metrics
          </label>
          <MultiSelectDropdown
            options={ML_TYPES[predictionType].metrics.map(m => ({ value: m.name, label: m.label }))}
            selectedValues={selectedMetrics}
            onChange={handleMetricChange}
            label="Metric"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Sensitive Column
          </label>
          <select
            value={sensitiveColumn}
            onChange={(e) => setSensitiveColumn(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-300"
            disabled={columns.length === 0}
          >
            <option value="">Select column</option>
            {columns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Train/Test Split
          </label>
          <CustomSlider
            value={trainTestSplit}
            onChange={setTrainTestSplit}
            min={0}
            max={100}
            step={5}
            labels={{ left: 'Test', right: 'Train' }}
          />
        </div>

        <button
          onClick={handleTrain}
          disabled={loading || selectedAlgorithms.length === 0 || selectedMetrics.length === 0 || !sensitiveColumn}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md text-white font-medium text-sm"
        >
          {loading ? 'Training...' : 'Train Model'}
        </button>
      </div>
    </div>
  );
}

SupervisedMLNode.propTypes = {
  id: PropTypes.string.isRequired
};