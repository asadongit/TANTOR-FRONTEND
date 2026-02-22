import React, { useState, useMemo, useEffect } from 'react';
import { AIPlaygroundLayout } from '../../AIPlaygroundLayout';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAIPlayground } from '../../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';
import { RefreshCw } from 'lucide-react';
import BestModelCard from './BestModelCard';
import MetricsChart from './MetricsChart';
import PerformanceTab from './PerformanceTab';
import { FairnessTab, ChartsTab } from './Fairnesschartstab';

const ModelInferencing = () => {
  const hostnameAI = window._env_?.VITE_AI_API;
  const { workflowState, datasetState, mode, updateWorkflowStage } = useAIPlayground();
  const readonly = mode === 'view';
  const [activeTab, setActiveTab] = useState('performance');
  const [selectedFairnessModel, setSelectedFairnessModel] = useState('');
  const [selectedChartsModel, setSelectedChartsModel] = useState('');
  const [selectedChartDemographic, setSelectedChartDemographic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [showAllPending, setShowAllPending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (datasetState.sessionId == '') {
      navigate('/ai/playground');
    }
  }, []);

  const truncateName = (name, maxLength = 30) => {
    if (!maxLength || maxLength === Infinity || name.length <= maxLength) return name;
    return '...' + name.substring(name.length - maxLength);
  };

  const modelGenesisConfig = workflowState?.modelGenesis?.config;
  const dataPreprocessingMode = readonly ? modelGenesisConfig?.data_preprocessing_mode : modelGenesisConfig?.dataPreprocessing;
  const modelSelectionMode = readonly ? modelGenesisConfig?.model_mode : modelGenesisConfig?.modelSelection;
  const isDataPreprocessingAuto = dataPreprocessingMode && ['Swift', 'Standard', 'Comprehensive'].includes(dataPreprocessingMode);
  const isModelSelectionAuto = modelSelectionMode && ['Swift', 'Standard', 'Comprehensive'].includes(modelSelectionMode);

  const completedJobsResponse = workflowState?.completedJobs?.apiResponse;

  const allTasks = useMemo(() => {
    if (readonly) return [];
    return completedJobsResponse?.tasks || [];
  }, [readonly, completedJobsResponse]);

  const successTasks = useMemo(() => {
    return allTasks.filter(t => t.status === 'SUCCESS');
  }, [allTasks]);

  const nonSuccessTasks = useMemo(() => {
    return allTasks.filter(t => t.status !== 'SUCCESS');
  }, [allTasks]);

  const completedJobsApiResults = useMemo(() => {
    return successTasks.map(task => ({
      run_name: task.result?.run_name || task.algorithm,
      run_id: task.result?.run_id || task.task_id,
      metrics: task.result?.metrics || {},
      fairness_bar_charts: task.result?.fairness_bar_charts || {},
      profile_radial_charts: task.result?.profile_radial_charts || {},
      fairness_assessment_message: task.result?.fairness_assessment_message || 'N/A',
    }));
  }, [successTasks]);

  const apiResults = useMemo(() => {
    if (!readonly) {
      return completedJobsApiResults;
    }
    if (isDataPreprocessingAuto && isModelSelectionAuto) {
      return workflowState?.modelGenesis?.apiResponse?.training_results || [];
    }
    if (!isDataPreprocessingAuto && isModelSelectionAuto) {
      return workflowState?.dataPreprocessing?.step7?.apiResponse?.training_results || [];
    }
    return workflowState?.modelSelection?.apiResponse?.results || [];
  }, [readonly, completedJobsApiResults, isDataPreprocessingAuto, isModelSelectionAuto, workflowState]);

  const legendTruncateLength = useMemo(() => {
    const modelCount = apiResults.length;
    if (modelCount <= 3) return Infinity;
    if (modelCount <= 5) return 50;
    if (modelCount <= 8) return 35;
    return 25;
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
      return { metricName: 'N/A', name: 'N/A', value: '0%' };
    }

    if (
      readonly
        ? (isDataPreprocessingAuto && isModelSelectionAuto) || (!isDataPreprocessingAuto && isModelSelectionAuto)
        : true
    ) {
      const autoMetricOrder = ['train_accuracy', 'train_precision', 'train_recall', 'train_f1', 'train_log_loss'];
      const best = apiResults.reduce((prev, current) => {
        for (const metricKey of autoMetricOrder) {
          const prevValue = prev.metrics?.[metricKey] || 0;
          const currValue = current.metrics?.[metricKey] || 0;
          if (metricKey === 'train_log_loss') {
            if (currValue < prevValue) return current;
            if (currValue > prevValue) return prev;
          } else {
            if (currValue > prevValue) return current;
            if (currValue < prevValue) return prev;
          }
        }
        return prev;
      });
      const bestValue = best.metrics?.['train_accuracy'] || 0;
      return {
        metricName: 'Accuracy',
        name: best.run_name,
        value: `${(bestValue * 100).toFixed(2)}%`,
      };
    }

    const performanceMetrics = workflowState?.modelSelection?.config?.performance_metrics || [];
    const metricNameMap = {
      accuracy: 'train_accuracy',
      precision: 'train_precision',
      recall: 'train_recall',
      f1: 'train_f1',
      log_loss: 'train_log_loss',
    };
    const orderedMetricKeys = performanceMetrics.map(m => metricNameMap[m]).filter(Boolean);

    const fallbackBest = () => {
      const best = apiResults.reduce((prev, curr) => {
        return (curr.metrics?.['train_accuracy'] || 0) > (prev.metrics?.['train_accuracy'] || 0) ? curr : prev;
      });
      return {
        metricName: 'Accuracy',
        name: best.run_name,
        value: `${((best.metrics?.['train_accuracy'] || 0) * 100).toFixed(2)}%`,
      };
    };

    if (orderedMetricKeys.length === 0) return fallbackBest();

    const best = apiResults.reduce((prev, current) => {
      for (const metricKey of orderedMetricKeys) {
        const prevValue = prev.metrics?.[metricKey] || 0;
        const currValue = current.metrics?.[metricKey] || 0;
        if (metricKey === 'train_log_loss') {
          if (currValue < prevValue) return current;
          if (currValue > prevValue) return prev;
        } else {
          if (currValue > prevValue) return current;
          if (currValue < prevValue) return prev;
        }
      }
      return prev;
    });

    const firstMetricKey = orderedMetricKeys[0];
    const bestValue = best.metrics?.[firstMetricKey] || 0;
    const metricDisplayNameMap = {
      train_accuracy: 'Accuracy',
      train_precision: 'Precision',
      train_recall: 'Recall',
      train_f1: 'F1 Score',
      train_log_loss: 'Log Loss',
    };

    return {
      metricName: metricDisplayNameMap[firstMetricKey] || 'Accuracy',
      name: best.run_name,
      value: firstMetricKey === 'train_log_loss' ? bestValue.toFixed(4) : `${(bestValue * 100).toFixed(2)}%`,
    };
  }, [apiResults, workflowState, isDataPreprocessingAuto, isModelSelectionAuto, readonly]);

  const algorithmData = useMemo(() => {
    return apiResults.map((result) => {
      const metrics = result.metrics || {};
      return {
        name: result.run_name,
        fullName: result.run_name,
        displayName: truncateName(result.run_name, legendTruncateLength),
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
  }, [apiResults, legendTruncateLength]);

  const availableMetrics = useMemo(() => {
    if (apiResults.length === 0) return [];
    const metrics = apiResults[0].metrics || {};
    return [
      { name: 'Accuracy', key: 'accuracy' },
      { name: 'Precision', key: 'precision' },
      { name: 'Recall', key: 'recall' },
      { name: 'F1 Score', key: 'f1' },
      { name: 'Log Loss', key: 'log_loss' },
    ].filter(m => metrics.hasOwnProperty(`train_${m.key}`) || metrics.hasOwnProperty(`test_${m.key}`));
  }, [apiResults]);

  const metricsData = useMemo(() => {
    if (availableMetrics.length === 0) return [];
    return availableMetrics.map(metricObj => {
      const dataPoint = { metric: metricObj.name };
      apiResults.forEach((result, index) => {
        const modelName = `${truncateName(result.run_name, legendTruncateLength)}_${index}`;
        const metricValue = result.metrics?.[`train_${metricObj.key}`];
        dataPoint[modelName] =
          metricValue !== undefined && metricValue !== null && !isNaN(metricValue)
            ? parseFloat((metricValue * 100).toFixed(2))
            : 0;
      });
      return dataPoint;
    });
  }, [apiResults, availableMetrics, legendTruncateLength]);

  const selectedModelFairnessData = useMemo(() => {
    const selectedModel = apiResults.find(r => r.run_name === selectedFairnessModel);
    if (!selectedModel) return null;
    const metrics = selectedModel.metrics || {};
    const demographicMetrics = {};
    Object.keys(metrics).forEach(key => {
      if (key.startsWith('fairness_')) {
        const withoutPrefix = key.substring(9);
        const parts = withoutPrefix.split('_');
        const metricKeywords = ['difference', 'ratio', 'score', 'odds', 'opportunity', 'disparity', 'parity'];
        let demographic = '', metricName = '';
        for (let i = 0; i < parts.length; i++) {
          if (metricKeywords.some(kw => parts.slice(i).join('_').includes(kw))) {
            demographic = parts.slice(0, i).join('_');
            metricName = parts.slice(i).join('_');
            break;
          }
        }
        if (!demographic || !metricName) {
          demographic = parts[0];
          metricName = parts.slice(1).join('_');
        }
        if (demographic && metricName) {
          if (!demographicMetrics[demographic]) demographicMetrics[demographic] = {};
          demographicMetrics[demographic][metricName] = metrics[key];
        }
      }
    });
    const demographics = Object.keys(demographicMetrics).sort();
    const fairnessData = {};
    demographics.forEach(d => {
      fairnessData[d] = demographicMetrics[d] || {};
    });
    return {
      modelName: selectedModel.run_name,
      fairnessAssessment: selectedModel.fairness_assessment_message || 'N/A',
      demographics,
      ...fairnessData,
    };
  }, [apiResults, selectedFairnessModel]);

  const selectedModelChartData = useMemo(() => {
    const selectedModel = apiResults.find(r => r.run_name === selectedChartsModel);
    if (!selectedModel) return null;
    return {
      modelName: selectedModel.run_name,
      fairnessBarCharts: selectedModel.fairness_bar_charts || {},
      profileRadialCharts: selectedModel.profile_radial_charts || {},
      fairnessAssessment: selectedModel.fairness_assessment_message || 'N/A',
    };
  }, [apiResults, selectedChartsModel]);

  const chartColors = ['#9ca3af', '#a78bfa', '#6ee7b7', '#fb923c', '#f472b6', '#60a5fa'];

  const handleReload = async () => {
    let jobId = workflowState?.completedJobs?.config?.job_id;
    if (!jobId) {
      toast.error('Job ID not found', { duration: 4000, position: 'top-right' });
      return;
    }
    setIsReloading(true);
    try {
      const response = await fetch(`${hostnameAI}/jobs/${jobId}`, {
        method: 'GET',
        headers: { accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      updateWorkflowStage('completedJobs', { apiResponse: data });
      const successCount = (data.tasks || []).filter(t => t.status === 'SUCCESS').length;
      const totalCount = (data.tasks || []).length;
      toast.success(`Refreshed: ${successCount}/${totalCount} models ready`, {
        duration: 3000,
        position: 'top-right',
      });
    } catch (error) {
      console.error('Error reloading job status:', error);
      toast.error(error.message || 'Failed to reload. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setIsReloading(false);
    }
  };

  const fetchModelRuns = async () => {
    const sessionId = datasetState?.sessionId;
    if (!sessionId) {
      toast.error('Session ID not found', { duration: 4000, position: 'top-right' });
      return false;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${hostnameAI}/model/runs_logged/${sessionId}`, {
        method: 'GET',
        headers: { accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      await response.json();
      toast.success('Model Inferencing completed successfully!', { duration: 3000, position: 'top-right' });
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
    <AIPlaygroundLayout
      title="Model Performance Dashboard"
      description="Evaluate and compare model performance."
      onNext={handleNextClick}
      isLoading={isLoading}
    >
      <div className="min-h-screen">
        <div className="px-4 py-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-gray-900">Model Performance Dashboard</h1>
              <p className="text-xs text-gray-500 mt-0.5">Evaluate and compare model performance.</p>
            </div>

            {!readonly && nonSuccessTasks.length > 0 && (
              <div className="flex justify-end mb-2">
                <button
                  onClick={handleReload}
                  disabled={isReloading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#8e78b7] text-sm font-medium text-[#8e78b7] hover:bg-[#f3f0fa] disabled:opacity-50 transition-colors"
                >
                  <RefreshCw size={14} className={isReloading ? 'animate-spin' : ''} />
                  {isReloading ? 'Refreshing…' : 'Reload'}
                </button>
              </div>
            )}
          </div>

          <BestModelCard bestModel={bestModel} />

          {!readonly && nonSuccessTasks.length > 0 && (() => {
            const PREVIEW_COUNT = 12;
            const visibleTasks = showAllPending ? nonSuccessTasks : nonSuccessTasks.slice(0, PREVIEW_COUNT);
            const hiddenCount = nonSuccessTasks.length - PREVIEW_COUNT;

            return (
              <div className="mb-4 rounded-xl border border-[#c4b5e8] bg-[#f3f0fb] px-4 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#6d4fa8]">
                    {nonSuccessTasks.length} model{nonSuccessTasks.length > 1 ? 's' : ''} still training — results will appear after reload
                  </span>
                  {nonSuccessTasks.length > PREVIEW_COUNT && (
                    <button
                      onClick={() => setShowAllPending(prev => !prev)}
                      className="text-xs font-medium text-[#8e78b7] underline underline-offset-2 hover:text-[#6d4fa8] transition-colors flex-shrink-0 ml-3"
                    >
                      {showAllPending ? 'Show less' : `Show all ${nonSuccessTasks.length}`}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {visibleTasks.map(task => (
                    <span
                      key={task.task_id}
                      title={task.algorithm}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white text-[#6d4fa8] border border-[#b39ddb]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8e78b7] flex-shrink-0" />
                      {nonSuccessTasks.length <= 3
                        ? task.algorithm
                        : task.algorithm.length > 28
                          ? '...' + task.algorithm.slice(-28)
                          : task.algorithm}
                    </span>
                  ))}
                  {!showAllPending && hiddenCount > 0 && (
                    <button
                      onClick={() => setShowAllPending(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#ddd6f3] text-[#6d4fa8] border border-[#b39ddb] hover:bg-[#c4b5e8] transition-colors"
                    >
                      +{hiddenCount} more
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          <MetricsChart
            metricsData={metricsData}
            apiResults={apiResults}
            legendTruncateLength={legendTruncateLength}
            truncateName={truncateName}
            chartColors={chartColors}
          />

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex gap-8">
              {['performance', 'fairness', 'charts'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab
                      ? 'border-[#8e78b7] text-[#8e78b7]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'performance' && (
            <PerformanceTab algorithmData={algorithmData} />
          )}
          {activeTab === 'fairness' && (
            <FairnessTab
              apiResults={apiResults}
              selectedFairnessModel={selectedFairnessModel}
              setSelectedFairnessModel={setSelectedFairnessModel}
              selectedModelFairnessData={selectedModelFairnessData}
            />
          )}
          {activeTab === 'charts' && (
            <ChartsTab
              apiResults={apiResults}
              selectedChartsModel={selectedChartsModel}
              setSelectedChartsModel={setSelectedChartsModel}
              selectedChartDemographic={selectedChartDemographic}
              setSelectedChartDemographic={setSelectedChartDemographic}
              selectedModelChartData={selectedModelChartData}
            />
          )}
        </div>
      </div>
    </AIPlaygroundLayout>
  );
};

export default ModelInferencing;