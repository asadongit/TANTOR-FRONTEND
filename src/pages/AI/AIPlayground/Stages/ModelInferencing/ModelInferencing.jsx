import React, { useState, useMemo, useEffect } from 'react';
import { AIPlaygroundLayout } from '../../AIPlaygroundLayout';
import { useLocation } from 'react-router-dom';
import { useAIPlayground } from '../../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';
import BestModelCard from './BestModelCard';
import MetricsChart from './MetricsChart';
import PerformanceTab from './PerformanceTab';
import { FairnessTab, ChartsTab } from './Fairnesschartstab'

const ModelInferencing = () => {
  const hostnameAI = window._env_?.VITE_AI_API;
  const { workflowState, datasetState, mode } = useAIPlayground();
  const readonly = mode === 'view';
  const [activeTab, setActiveTab] = useState('performance');
  const [selectedFairnessModel, setSelectedFairnessModel] = useState('');
  const [selectedChartsModel, setSelectedChartsModel] = useState('');
  const [selectedChartDemographic, setSelectedChartDemographic] = useState('age');
  const [isLoading, setIsLoading] = useState(false);

  const truncateName = (name, maxLength = 30) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  const modelGenesisConfig = workflowState?.modelGenesis?.config;
  const dataPreprocessingMode = readonly
    ? modelGenesisConfig?.data_preprocessing_mode
    : modelGenesisConfig?.dataPreprocessing;
  const modelSelectionMode = readonly
    ? modelGenesisConfig?.model_mode
    : modelGenesisConfig?.modelSelection;

  const isDataPreprocessingAuto = dataPreprocessingMode &&
    ['Swift', 'Standard', 'Comprehensive'].includes(dataPreprocessingMode);
  const isModelSelectionAuto = modelSelectionMode &&
    ['Swift', 'Standard', 'Comprehensive'].includes(modelSelectionMode);

  const apiResults = useMemo(() => {
    // When both data preprocessing and model selection are auto
    if (isDataPreprocessingAuto && isModelSelectionAuto) {
      return workflowState?.modelGenesis?.apiResponse?.training_results || [];
    }
    // When data preprocessing is manual and model selection is auto
    if (!isDataPreprocessingAuto && isModelSelectionAuto) {
      return workflowState?.dataPreprocessing?.step7?.apiResponse?.training_results || [];
    }
    // Default case
    return workflowState?.modelSelection?.apiResponse?.results || [];
  }, [isDataPreprocessingAuto, isModelSelectionAuto, workflowState]);

  const legendTruncateLength = useMemo(() => {
    const modelCount = apiResults.length;
    if (modelCount <= 2) return 60;
    if (modelCount <= 4) return 40;
    return 30;
  }, [apiResults]);

  useMemo(() => {
    if (apiResults.length > 0 && !selectedFairnessModel) {
      setSelectedFairnessModel(apiResults[0].run_name);
    }
    if (apiResults.length > 0 && !selectedChartsModel) {
      setSelectedChartsModel(apiResults[0].run_name);
    }
  }, [apiResults]);

  const bestModel = useMemo(() => {
    if (apiResults.length === 0) {
      return {
        metricName: 'N/A',
        name: 'N/A',
        value: '0%',
      };
    }

    if ((isDataPreprocessingAuto && isModelSelectionAuto) ||
      (!isDataPreprocessingAuto && isModelSelectionAuto)) {

      const autoMetricOrder = ['train_accuracy', 'train_precision', 'train_recall', 'train_f1', 'train_log_loss'];

      const best = apiResults.reduce((prev, current) => {
        for (const metricKey of autoMetricOrder) {
          const prevValue = prev.metrics?.[metricKey] || 0;
          const currValue = current.metrics?.[metricKey] || 0;

          // For log_loss, lower is better
          if (metricKey === 'train_log_loss') {
            if (currValue < prevValue) return current;
            if (currValue > prevValue) return prev;
          } else {
            // For other metrics, higher is better
            if (currValue > prevValue) return current;
            if (currValue < prevValue) return prev;
          }
        }

        return prev;
      });

      const bestValue = best.metrics?.['train_accuracy'] || 0;
      const formattedValue = `${(bestValue * 100).toFixed(2)}%`;

      return {
        metricName: 'Accuracy',
        name: best.run_name,
        value: formattedValue,
      };
    }

    const performanceMetrics = workflowState?.modelSelection?.config?.performance_metrics || [];

    if (performanceMetrics.length === 0) {
      const metricKey = 'train_accuracy';
      const best = apiResults.reduce((prev, current) => {
        const prevValue = prev.metrics?.[metricKey] || 0;
        const currValue = current.metrics?.[metricKey] || 0;
        return currValue > prevValue ? current : prev;
      });

      const bestValue = best.metrics?.[metricKey] || 0;
      const formattedValue = `${(bestValue * 100).toFixed(2)}%`;

      return {
        metricName: 'Accuracy',
        name: best.run_name,
        value: formattedValue,
      };
    }

    const metricNameMap = {
      'accuracy': 'train_accuracy',
      'precision': 'train_precision',
      'recall': 'train_recall',
      'f1': 'train_f1',
      'log_loss': 'train_log_loss',
    };

    const orderedMetricKeys = performanceMetrics.map(metric => metricNameMap[metric]).filter(Boolean);

    if (orderedMetricKeys.length === 0) {
      const metricKey = 'train_accuracy';
      const best = apiResults.reduce((prev, current) => {
        const prevValue = prev.metrics?.[metricKey] || 0;
        const currValue = current.metrics?.[metricKey] || 0;
        return currValue > prevValue ? current : prev;
      });

      const bestValue = best.metrics?.[metricKey] || 0;
      const formattedValue = `${(bestValue * 100).toFixed(2)}%`;

      return {
        metricName: 'Accuracy',
        name: best.run_name,
        value: formattedValue,
      };
    }
    const best = apiResults.reduce((prev, current) => {
      for (const metricKey of orderedMetricKeys) {
        const prevValue = prev.metrics?.[metricKey] || 0;
        const currValue = current.metrics?.[metricKey] || 0;

        // For log_loss, lower is better
        if (metricKey === 'train_log_loss') {
          if (currValue < prevValue) return current;
          if (currValue > prevValue) return prev;
        } else {
          // For other metrics, higher is better
          if (currValue > prevValue) return current;
          if (currValue < prevValue) return prev;
        }
      }

      return prev;
    });

    const firstMetricKey = orderedMetricKeys[0];
    const bestValue = best.metrics?.[firstMetricKey] || 0;

    const metricDisplayNameMap = {
      'train_accuracy': 'Accuracy',
      'train_precision': 'Precision',
      'train_recall': 'Recall',
      'train_f1': 'F1 Score',
      'train_log_loss': 'Log Loss',
    };

    const displayMetricName = metricDisplayNameMap[firstMetricKey] || 'Accuracy';

    let formattedValue;
    if (firstMetricKey === 'train_log_loss') {
      formattedValue = bestValue.toFixed(4);
    } else {
      formattedValue = `${(bestValue * 100).toFixed(2)}%`;
    }

    return {
      metricName: displayMetricName,
      name: best.run_name,
      value: formattedValue,
    };
  }, [apiResults, workflowState, isDataPreprocessingAuto, isModelSelectionAuto]);

  const algorithmData = useMemo(() => {
    return apiResults.map((result) => {
      const metrics = result.metrics || {};

      return {
        name: result.run_name,
        fullName: result.run_name,
        displayName: truncateName(result.run_name),
        testAccuracy: metrics.test_accuracy !== undefined ? (metrics.test_accuracy * 100).toFixed(2) : 'N/A',
        testPrecision: metrics.test_precision !== undefined ? (metrics.test_precision * 100).toFixed(2) : 'N/A',
        testRecall: metrics.test_recall !== undefined ? (metrics.test_recall * 100).toFixed(2) : 'N/A',
        testF1: metrics.test_f1 !== undefined ? (metrics.test_f1 * 100).toFixed(2) : 'N/A',
        testLogLoss: metrics.test_log_loss !== undefined ? metrics.test_log_loss.toFixed(4) : 'N/A',
        trainAccuracy: metrics.train_accuracy !== undefined ? (metrics.train_accuracy * 100).toFixed(2) : 'N/A',
        trainPrecision: metrics.train_precision !== undefined ? (metrics.train_precision * 100).toFixed(2) : 'N/A',
        trainRecall: metrics.train_recall !== undefined ? (metrics.train_recall * 100).toFixed(2) : 'N/A',
        trainF1: metrics.train_f1 !== undefined ? (metrics.train_f1 * 100).toFixed(2) : 'N/A',
        trainLogLoss: metrics.train_log_loss !== undefined ? metrics.train_log_loss.toFixed(4) : 'N/A',
      };
    });
  }, [apiResults]);

  const availableMetrics = useMemo(() => {
    if (apiResults.length === 0) return [];

    const firstResult = apiResults[0];
    const metrics = firstResult.metrics || {};

    const allPossibleMetrics = [
      { name: 'Accuracy', key: 'accuracy' },
      { name: 'Precision', key: 'precision' },
      { name: 'Recall', key: 'recall' },
      { name: 'F1 Score', key: 'f1' },
      { name: 'Log Loss', key: 'log_loss' }
    ];

    return allPossibleMetrics.filter(metric => {
      const trainKey = `train_${metric.key}`;
      const testKey = `test_${metric.key}`;
      return metrics.hasOwnProperty(trainKey) || metrics.hasOwnProperty(testKey);
    });
  }, [apiResults]);

  const metricsData = useMemo(() => {
    if (availableMetrics.length === 0) return [];

    return availableMetrics.map(metricObj => {
      const dataPoint = { metric: metricObj.name };

      apiResults.forEach((result, index) => {
        const modelName = `${truncateName(result.run_name, legendTruncateLength)}_${index}`;

        const metricValue = result.metrics?.[`train_${metricObj.key}`];

        if (metricValue !== undefined && metricValue !== null && !isNaN(metricValue)) {
          dataPoint[modelName] = parseFloat((metricValue * 100).toFixed(2));
        } else {
          dataPoint[modelName] = 0;
        }
      });

      return dataPoint;
    });
  }, [apiResults, availableMetrics, legendTruncateLength]);

  const selectedModelFairnessData = useMemo(() => {
    const selectedModel = apiResults.find(result => result.run_name === selectedFairnessModel);
    if (!selectedModel) return null;

    const metrics = selectedModel.metrics || {};

    const demographics = ['age', 'gender'];
    const fairnessData = {};

    demographics.forEach(demo => {
      fairnessData[demo] = {
        demographic_parity_difference: metrics[`fairness_${demo}_demographic_parity_difference`] || 0,
        demographic_parity_ratio: metrics[`fairness_${demo}_demographic_parity_ratio`] || 0,
        accuracy_score_difference: metrics[`fairness_${demo}_accuracy_score_difference`] || 0,
      };
    });

    return {
      modelName: selectedModel.run_name,
      fairnessAssessment: selectedModel.fairness_assessment_message || 'N/A',
      ...fairnessData
    };
  }, [apiResults, selectedFairnessModel]);

  const selectedModelChartData = useMemo(() => {
    const selectedModel = apiResults.find(result => result.run_name === selectedChartsModel);
    if (!selectedModel) return null;

    return {
      modelName: selectedModel.run_name,
      fairnessBarCharts: selectedModel.fairness_bar_charts || {},
      profileRadialCharts: selectedModel.profile_radial_charts || {},
      fairnessAssessment: selectedModel.fairness_assessment_message || 'N/A',
    };
  }, [apiResults, selectedChartsModel]);

  const chartColors = ['#9ca3af', '#a78bfa', '#6ee7b7', '#fb923c', '#f472b6', '#60a5fa'];

  const fetchModelRuns = async () => {
    const sessionId = datasetState?.sessionId;

    if (!sessionId) {
      toast.error('Session ID not found', {
        duration: 4000,
        position: 'top-right',
      });
      return false;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${hostnameAI}/model/runs_logged/${sessionId}`,
        {
          method: 'GET',
          headers: {
            'accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      toast.success('Model Inferencing completed successfully!', {
        duration: 3000,
        position: 'top-right',
      });

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error fetching model runs:', error);
      toast.error(error.message || 'Model Inferencing failed. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
      setIsLoading(false);
      return false;
    }
  };

  const handleNextClick = async () => {
    if (readonly) return true;
    return await fetchModelRuns();
  };

  return (
    <AIPlaygroundLayout onNextClick={handleNextClick} isNextDisabled={isLoading}>
      <div className="min-h-screen">
        <div className='px-4 py-2'>
          <div className="mb-4">
            <h1 className="text-base sm:text-lg font-semibold text-gray-900">Model Performance Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0.5">Evaluate and compare model performance.</p>
          </div>

          <BestModelCard bestModel={bestModel} truncateName={truncateName} />
        </div>

        <MetricsChart
          metricsData={metricsData}
          apiResults={apiResults}
          truncateName={truncateName}
          legendTruncateLength={legendTruncateLength}
          chartColors={chartColors}
        />

        <div className='p-2'>
          <div className="bg-white rounded-t-lg border-b border-gray-200">
            <div className="flex gap-6 px-4">
              <button
                onClick={() => setActiveTab('performance')}
                className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'performance'
                  ? 'border-[#8e78b7] text-[#8e78b7]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Performance
              </button>
              <button
                onClick={() => setActiveTab('fairness')}
                className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'fairness'
                  ? 'border-[#8e78b7] text-[#8e78b7]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Fairness
              </button>
              <button
                onClick={() => setActiveTab('charts')}
                className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'charts'
                  ? 'border-[#8e78b7] text-[#8e78b7]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Charts
              </button>
            </div>
          </div>

          <div className="bg-white rounded-b-lg px-4 py-3 shadow-sm">
            {activeTab === 'performance' && (
              <PerformanceTab algorithmData={algorithmData} />
            )}

            {activeTab === 'fairness' && (
              <FairnessTab
                selectedFairnessModel={selectedFairnessModel}
                setSelectedFairnessModel={setSelectedFairnessModel}
                apiResults={apiResults}
                selectedModelFairnessData={selectedModelFairnessData}
              />
            )}

            {activeTab === 'charts' && (
              <ChartsTab
                selectedChartsModel={selectedChartsModel}
                setSelectedChartsModel={setSelectedChartsModel}
                selectedChartDemographic={selectedChartDemographic}
                setSelectedChartDemographic={setSelectedChartDemographic}
                apiResults={apiResults}
                selectedModelChartData={selectedModelChartData}
              />
            )}
          </div>
        </div>
      </div>
    </AIPlaygroundLayout>
  );
};

export default ModelInferencing;