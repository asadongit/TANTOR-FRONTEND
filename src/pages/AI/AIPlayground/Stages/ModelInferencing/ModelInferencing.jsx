import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AIPlaygroundLayout } from '../../AIPlaygroundLayout';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAIPlayground } from '../../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';
import BestModelCard from './BestModelCard';
import MetricsChart from './MetricsChart';
import PerformanceTab from './PerformanceTab';
import { FairnessTab, ChartsTab } from './Fairnesschartstab';
import { ConfusionMatrixTab } from './ConfusionMatrixTab';
import BatchIcon from '../../../../../assets/ai/workspace_premium.svg';
import { tw, aithemestyle } from '../../../../../components/themeContext';

const ModelInferencing = () => {
  const hostnameAI = window._env_?.VITE_AI_API;
  const { workflowsState, datasetState, mode, updateWorkflowStage,activeWorkflowId} = useAIPlayground();
  const readonly = mode === 'view';
  const [activeTab, setActiveTab] = useState('performance');
  const [selectedFairnessModel, setSelectedFairnessModel] = useState('');
  const [selectedChartsModel, setSelectedChartsModel] = useState('');
  const [selectedChartDemographic, setSelectedChartDemographic] = useState('');
  const [selectedConfusionModel, setSelectedConfusionModel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAllPending, setShowAllPending] = useState(false);
  const navigate = useNavigate();
  const pollingIntervalRef = useRef(null);
  const workflowState = activeWorkflowId
    ? workflowsState[activeWorkflowId]
    : null;  
    

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const fetchJobStatus = async () => {
    const ensembleId = datasetState?.ensembleId;
    const jobId = workflowState?.completedJobs?.config?.job_id;

    if (!ensembleId || !jobId) return false;

    setIsLoading(true);
    try {
      const jobsResponse = await fetch(`${hostnameAI}/jobs/${jobId}`, {
        method: 'GET',
        headers: { accept: 'application/json' },
      });
      if (!jobsResponse.ok) throw new Error(`Jobs error! status: ${jobsResponse.status}`);
      const data = await jobsResponse.json();

      updateWorkflowStage('completedJobs', { apiResponse: data });

      // Stop polling once all tasks are done (no pending/running tasks)
      const hasPending = (data.tasks || []).some(t => t.status !== 'SUCCESS' && t.status !== 'FAILURE');
      if (!hasPending) {
        stopPolling();
      }

      return true;
    } catch (error) {
      console.error('Error during job status fetch:', error);
      toast.error(error.message || 'Failed to fetch job status. Will retry.', {
        duration: 4000,
        position: 'top-right',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!datasetState?.ensembleId) {
      navigate('/ai/playground');
      return;
    }

    stopPolling();

    if (!readonly) {
      fetchJobStatus();
      pollingIntervalRef.current = setInterval(() => {
        fetchJobStatus();
      }, 5000);
    }

    return () => stopPolling();
  }, [readonly, datasetState?.ensembleId, activeWorkflowId, workflowState?.completedJobs?.config?.job_id]);

  const truncateName = useCallback((name, maxLength = 30) => {
    const safeName = typeof name === 'string' ? name : '';
    if (!maxLength || maxLength === Infinity || safeName.length <= maxLength) return safeName;
    return '...' + safeName.substring(safeName.length - maxLength);
  }, []);

  const modelGenesisConfig = workflowState?.modelGenesis?.config;
  const dataPreprocessingMode = modelGenesisConfig?.data_preprocessing_mode || modelGenesisConfig?.dataPreprocessing;
  const modelSelectionMode = modelGenesisConfig?.model_mode || modelGenesisConfig?.modelSelection;
  const isDataPreprocessingAuto = dataPreprocessingMode && ['Swift', 'Standard', 'Comprehensive'].includes(dataPreprocessingMode);
  const isModelSelectionAuto = modelSelectionMode && ['Swift', 'Standard', 'Comprehensive'].includes(modelSelectionMode);
  
  // Get the classification type to determine which metrics to show
  const rawClassificationType = modelGenesisConfig?.modelling_type ?? modelGenesisConfig?.classification;
  const classificationType = typeof rawClassificationType === 'string' ? rawClassificationType.trim() : '';
  const isRegressionModel = classificationType !== '' && classificationType.toLowerCase() === 'regression';
  
  const predictionType =modelGenesisConfig?.prediction_type ||modelGenesisConfig?.predictionType || modelGenesisConfig?.modelling_type || '';
  const isTimeSeriesModel =
    String(predictionType).trim().toLowerCase() === 'time series' ||
    String(predictionType).trim().toLowerCase() === 'timeseries' ||
    String(predictionType).trim().toLowerCase() === 'univariate_timeseries' ||
    String(predictionType).trim().toLowerCase() === 'multivariate_timeseries';
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

    const modelGenesisTrainingResultsRaw = workflowState?.modelGenesis?.apiResponse?.training_results;
    const step7TrainingResultsRaw = workflowState?.dataPreprocessing?.step7?.apiResponse?.training_results;
    const modelSelectionResultsRaw = workflowState?.modelSelection?.apiResponse?.results;
    const modelSelectionTrainingResultsRaw = workflowState?.modelSelection?.apiResponse?.training_results;

    const modelGenesisTrainingResults = Array.isArray(modelGenesisTrainingResultsRaw)
      ? modelGenesisTrainingResultsRaw
      : [];
    const step7TrainingResults = Array.isArray(step7TrainingResultsRaw)
      ? step7TrainingResultsRaw
      : [];
    const modelSelectionResults = Array.isArray(modelSelectionResultsRaw)
      ? modelSelectionResultsRaw
      : [];
    const modelSelectionTrainingResults = Array.isArray(modelSelectionTrainingResultsRaw)
      ? modelSelectionTrainingResultsRaw
      : [];

    const modelSelectionFallback = modelSelectionResults.length
      ? modelSelectionResults
      : modelSelectionTrainingResults;

    if (isDataPreprocessingAuto && isModelSelectionAuto) {
      return modelGenesisTrainingResults.length
        ? modelGenesisTrainingResults
        : modelSelectionFallback;
    }

    if (!isDataPreprocessingAuto && isModelSelectionAuto) {
      return step7TrainingResults.length
        ? step7TrainingResults
        : modelSelectionFallback;
    }

    if (modelSelectionFallback.length) {
      return modelSelectionFallback;
    }

    return modelGenesisTrainingResults.length ? modelGenesisTrainingResults : step7TrainingResults;
  }, [
    readonly,
    completedJobsApiResults,
    isDataPreprocessingAuto,
    isModelSelectionAuto,
    workflowState?.modelGenesis?.apiResponse?.training_results,
    workflowState?.dataPreprocessing?.step7?.apiResponse?.training_results,
    workflowState?.modelSelection?.apiResponse?.results,
    workflowState?.modelSelection?.apiResponse?.training_results,
  ]);

  const legendTruncateLength = useMemo(() => {
    const modelCount = apiResults.length;
    if (modelCount <= 3) return Infinity;
    if (modelCount <= 5) return 50;
    if (modelCount <= 8) return 35;
    return 25;
  }, [apiResults]);

  useEffect(() => {
    if (apiResults.length === 0) {
      setSelectedFairnessModel('');
      setSelectedChartsModel('');
      setSelectedConfusionModel('');
      return;
    }

    if (!apiResults.some(r => r.run_name === selectedFairnessModel)) {
      setSelectedFairnessModel(apiResults[0].run_name);
    }

    if (!apiResults.some(r => r.run_name === selectedChartsModel)) {
      setSelectedChartsModel(apiResults[0].run_name);
    }

    if (!apiResults.some(r => r.run_name === selectedConfusionModel)) {
      setSelectedConfusionModel(apiResults[0].run_name);
    }
  }, [apiResults, selectedFairnessModel, selectedChartsModel, selectedConfusionModel]);

  const bestModel = useMemo(() => {
    if (apiResults.length === 0) {
      return { metricName: 'N/A', name: 'N/A', value: '0%' };
    }

    const classificationMetricMap = {
      accuracy: 'train_accuracy',
      precision: 'train_precision',
      recall: 'train_recall',
      f1: 'train_f1',
      log_loss: 'train_log_loss',
    };

const regressionMetricMap = {
  mae: 'train_mae',
  rmse: 'train_rmse',
  r2: 'train_r2',
  mape: 'train_mape',
  quantile_loss: 'train_quantile_loss',
  huber_loss: 'train_huber_loss',
};

const timeseriesMetricMap = {
  mae: 'train_mae',
  rmse: 'train_rmse',
  mape: 'train_mape',
  smape: 'train_smape',
  wmape: 'train_wmape',
  mase: 'train_mase',
};

const metricNameMap = isTimeSeriesModel
  ? timeseriesMetricMap
  : isRegressionModel
    ? regressionMetricMap
    : classificationMetricMap;

    const classificationDisplayMap = {
  train_accuracy: 'Accuracy',
  train_precision: 'Precision',
  train_recall: 'Recall',
  train_f1: 'F1 Score',
  train_log_loss: 'Log Loss',
};

const regressionDisplayMap = {
  train_mae: 'MAE',
  train_rmse: 'RMSE',
  train_r2: 'R²',
  train_mape: 'MAPE',
  train_quantile_loss: 'Quantile Loss',
  train_huber_loss: 'Huber Loss',
};
const timeseriesDisplayMap = {
  train_mae: 'MAE',
  train_rmse: 'RMSE',
  train_mape: 'MAPE',
  train_smape: 'SMAPE',
  train_wmape: 'WMAPE',
  train_mase: 'MASE',
};

const metricDisplayNameMap = isTimeSeriesModel
  ? timeseriesDisplayMap
  : isRegressionModel
    ? regressionDisplayMap
    : classificationDisplayMap;

    const fallbackBest = () => {
  const defaultMetric = isTimeSeriesModel
  ? 'train_rmse'
  : isRegressionModel
    ? 'train_r2'
    : 'train_accuracy';

  const best = apiResults.reduce((prev, curr) => {
    return (curr.metrics?.[defaultMetric] || 0) >
           (prev.metrics?.[defaultMetric] || 0)
      ? curr
      : prev;
  });

  const bestValue = best.metrics?.[defaultMetric] ?? 0;

  return {
    metricName: metricDisplayNameMap[defaultMetric] || defaultMetric,
    name: best.run_name,
    value: isRegressionModel
      ? bestValue.toFixed(4)
      : `${(bestValue * 100).toFixed(2)}%`,
  };
};

    // Always check performance_metrics config first, regardless of mode
    const performanceMetrics = workflowState?.modelSelection?.config?.performance_metrics || [];
    const orderedMetricKeys = performanceMetrics.map(m => metricNameMap[m]).filter(Boolean);

    if (orderedMetricKeys.length > 0) {
      const best = apiResults.reduce((prev, current) => {
        for (const metricKey of orderedMetricKeys) {
          const prevValue = prev.metrics?.[metricKey] ?? 0;
          const currValue = current.metrics?.[metricKey] ?? 0;
          // Metrics to minimize (lower is better): log_loss, mse, rmse, mae, mape
          const shouldMinimize = ['train_log_loss', 'train_mse', 'train_rmse', 'train_mae', 'train_mape','train_smape',
'train_wmape',
'train_mase'].includes(metricKey);
          if (shouldMinimize) {
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
      const bestValue = best.metrics?.[firstMetricKey] ?? 0;
      const shouldMinimize = ['train_log_loss', 'train_mse', 'train_rmse', 'train_mae', 'train_mape','train_smape','train_wmape','train_mase'].includes(firstMetricKey);
      const shouldFormat = ['train_r2', 'train_accuracy', 'train_precision', 'train_recall', 'train_f1', 'train_mape'].includes(firstMetricKey);
      
      return {
        metricName: metricDisplayNameMap[firstMetricKey] || 'N/A',
        name: best.run_name,
        value: shouldFormat
          ? `${(bestValue * 100).toFixed(2)}%`
          : bestValue.toFixed(4),
      };
    }

    // No performance_metrics config — fall back to accuracy or R²
    return fallbackBest();
  }, [apiResults, workflowState, isDataPreprocessingAuto, isModelSelectionAuto, readonly, isRegressionModel]);

  const algorithmData = useMemo(() => {
  return apiResults.map((result) => {
    const metrics = result.metrics || {};

    return {
      name: result.run_name,
      fullName: result.run_name,
      displayName: truncateName(result.run_name, legendTruncateLength),

      ...(isTimeSeriesModel
  ? {
      testMAE: metrics.test_mae?.toFixed(3) ?? 'N/A',
      testRMSE: metrics.test_rmse?.toFixed(3) ?? 'N/A',
      testMAPE: metrics.test_mape?.toFixed(3) ?? 'N/A',
      testSMAPE: metrics.test_smape?.toFixed(3) ?? 'N/A',
      testWMAPE: metrics.test_wmape?.toFixed(3) ?? 'N/A',
      testMASE: metrics.test_mase?.toFixed(3) ?? 'N/A',

      trainMAE: metrics.train_mae?.toFixed(3) ?? 'N/A',
      trainRMSE: metrics.train_rmse?.toFixed(3) ?? 'N/A',
      trainMAPE: metrics.train_mape?.toFixed(3) ?? 'N/A',
      trainSMAPE: metrics.train_smape?.toFixed(3) ?? 'N/A',
      trainWMAPE: metrics.train_wmape?.toFixed(3) ?? 'N/A',
      trainMASE: metrics.train_mase?.toFixed(3) ?? 'N/A',
    }
  : isRegressionModel
  ? {
            testMAE: metrics.test_mae?.toFixed(3) ?? 'N/A',
testRMSE: metrics.test_rmse?.toFixed(3) ?? 'N/A',
testR2: metrics.test_r2?.toFixed(3) ?? 'N/A',
testMAPE: metrics.test_mape?.toFixed(3) ?? 'N/A',
testQuantileLoss: metrics.test_quantile_loss?.toFixed(3) ?? 'N/A',
testHuberLoss: metrics.test_huber_loss?.toFixed(3) ?? 'N/A',

trainMAE: metrics.train_mae?.toFixed(3) ?? 'N/A',
trainRMSE: metrics.train_rmse?.toFixed(3) ?? 'N/A',
trainR2: metrics.train_r2?.toFixed(3) ?? 'N/A',
trainMAPE: metrics.train_mape?.toFixed(3) ?? 'N/A',
trainQuantileLoss: metrics.train_quantile_loss?.toFixed(3) ?? 'N/A',
trainHuberLoss: metrics.train_huber_loss?.toFixed(3) ?? 'N/A',
          }
        : {
            // CLASSIFICATION (unchanged)
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
            
          }),
    };
  });
}, [apiResults, legendTruncateLength, isRegressionModel,isTimeSeriesModel, truncateName]);

  const availableMetrics = useMemo(() => {
    if (apiResults.length === 0) return [];
    const metrics = apiResults[0].metrics || {};

    if (isTimeSeriesModel) {
      return [
        { name: 'MAE', key: 'mae' },
        { name: 'RMSE', key: 'rmse' },
        { name: 'MAPE', key: 'mape' },
        { name: 'SMAPE', key: 'smape' },
        { name: 'WMAPE', key: 'wmape' },
        { name: 'MASE', key: 'mase' },
      ].filter(
        m =>
          metrics.hasOwnProperty(`train_${m.key}`) ||
          metrics.hasOwnProperty(`test_${m.key}`)
      );
    }

    if (isRegressionModel) {
      // For regression models, show regression-specific metrics
      return [
        { name: 'MSE', key: 'mse' },
        { name: 'RMSE', key: 'rmse' },
        { name: 'MAE', key: 'mae' },
        { name: 'R²', key: 'r2' },
        { name: 'MAPE', key: 'mape' },
        { name: 'Huber Loss', key: 'huber_loss' },
        { name: 'Quantile Loss', key: 'quantile_loss' },
      ].filter(m => metrics.hasOwnProperty(`train_${m.key}`) || metrics.hasOwnProperty(`test_${m.key}`));
    } else {
      // For classification models, show classification metrics
      return [
        { name: 'Accuracy', key: 'accuracy' },
        { name: 'Precision', key: 'precision' },
        { name: 'Recall', key: 'recall' },
        { name: 'F1 Score', key: 'f1' },
        { name: 'Log Loss', key: 'log_loss' },
      ].filter(m => metrics.hasOwnProperty(`train_${m.key}`) || metrics.hasOwnProperty(`test_${m.key}`));
    }
  }, [apiResults, isRegressionModel, isTimeSeriesModel]);

  const metricsData = useMemo(() => {
    if (availableMetrics.length === 0) return [];
    return availableMetrics.map(metricObj => {
      const dataPoint = { metric: metricObj.name };
      apiResults.forEach((result, index) => {
        const modelName = `${truncateName(result.run_name, legendTruncateLength)}_${index}`;
        const metricValue = result.metrics?.[`train_${metricObj.key}`];
        
        // Plot classification score metrics on a 0-100 scale for readability.
        const shouldMultiplyBy100 = !isRegressionModel && ['accuracy', 'precision', 'recall', 'f1'].includes(metricObj.key);
        
        dataPoint[modelName] =
          metricValue !== undefined && metricValue !== null && !isNaN(metricValue)
            ? parseFloat((shouldMultiplyBy100 ? (metricValue * 100) : metricValue).toFixed(2))
            : 0;
      });
      return dataPoint;
    });
  }, [apiResults, availableMetrics, legendTruncateLength, isRegressionModel, truncateName]);

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

  const selectedConfusionData = useMemo(() => {
    const selectedModel = apiResults.find(r => r.run_name === selectedConfusionModel);
    if (!selectedModel) return null;
    const metrics = selectedModel.metrics || {};
    return {
      modelName: selectedModel.run_name,
      train: metrics.train_confusion_matrix || null,
      test: metrics.test_confusion_matrix || null,
    };
  }, [apiResults, selectedConfusionModel]);

  useEffect(() => {
    // Ensure workflow-specific UI state does not bleed across model tabs.
    setActiveTab('performance');
    setSelectedChartDemographic('');
  }, [activeWorkflowId]);

  const chartColors = ['#9ca3af', '#a78bfa', '#6ee7b7', '#fb923c', '#f472b6', '#60a5fa'];

  const handleNextClick = async () => {
    return true;
  };

  return (
    <AIPlaygroundLayout
      title="Model Performance Dashboard"
      description="Evaluate and compare model performance."
      onNextClick={handleNextClick}
      isLoading={isLoading}
    >
      <div className="min-h-screen">
        <div className="px-4 py-2">
          {/* Page Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className={tw.sectionHeading}>Model Performance Dashboard</h1>
              <p className="text-xs text-gray-500 mt-0.5">Evaluate and compare model performance.</p>
            </div>
          </div>

          {/* Best Model Card */}
          <BestModelCard bestModel={bestModel} batchIcon={BatchIcon} />

          {/* Pending models banner */}
          {!readonly && nonSuccessTasks.length > 0 && (() => {
            const PREVIEW_COUNT = 12;
            const visibleTasks = showAllPending ? nonSuccessTasks : nonSuccessTasks.slice(0, PREVIEW_COUNT);
            const hiddenCount = nonSuccessTasks.length - PREVIEW_COUNT;

            return (
              <div className="mb-4 rounded-xl bg-[#FAFAFA] px-4 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`${tw.sectionHeading} text-[#818181]`}>
                    {nonSuccessTasks.length} model{nonSuccessTasks.length > 1 ? 's' : ''} still training — results update automatically
                  </span>
                  {nonSuccessTasks.length > PREVIEW_COUNT && (
                    <button
                      onClick={() => setShowAllPending(prev => !prev)}
                      className="text-xs font-normal text-[#818181] underline underline-offset-2 transition-colors flex-shrink-0 ml-3"
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
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-normal bg-white text-[#818181] border border-[#CCCCCC]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FAFAFA] flex-shrink-0" />
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
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-normal bg-[#FAFAFA] text-[#818181] border border-[#CCCCCC]  transition-colors"
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
            metricsDescription={isRegressionModel ? 'MSE, RMSE, MAE, R², MAPE, Huber Loss & Quantile Loss' : 'Accuracy, precision, recall & F1 score'}
          />

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex gap-8">
              <button
                onClick={() => setActiveTab('performance')}
                className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'performance'
                  ? 'border-[#8e78b7] text-[#8e78b7]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Performance
              </button>
              
              {!isTimeSeriesModel && (
                <button
                  onClick={() => setActiveTab('fairness')}
                  className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'fairness'
                    ? 'border-[#8e78b7] text-[#8e78b7]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Fairness
                </button>
              )}
              {!isTimeSeriesModel && (
                <button
                  onClick={() => setActiveTab('charts')}
                  className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'charts'
                    ? 'border-[#8e78b7] text-[#8e78b7]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Charts
                </button>
              )}
              {!isRegressionModel && !isTimeSeriesModel && (
                <button
                  onClick={() => setActiveTab('confusion_matrix')}
                  className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'confusion_matrix'
                    ? 'border-[#8e78b7] text-[#8e78b7]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Confusion Matrix
                </button>
              )}
            </nav>
          </div>

          {activeTab === 'performance' && (
            <PerformanceTab algorithmData={algorithmData} isRegressionModel={isRegressionModel} />
          )}
          {!isTimeSeriesModel && activeTab === 'fairness' && (
            <FairnessTab
              apiResults={apiResults}
              selectedFairnessModel={selectedFairnessModel}
              setSelectedFairnessModel={setSelectedFairnessModel}
              selectedModelFairnessData={selectedModelFairnessData}
            />
          )}
          {!isTimeSeriesModel && activeTab === 'charts' && (
            <ChartsTab
              apiResults={apiResults}
              selectedChartsModel={selectedChartsModel}
              setSelectedChartsModel={setSelectedChartsModel}
              selectedChartDemographic={selectedChartDemographic}
              setSelectedChartDemographic={setSelectedChartDemographic}
              selectedModelChartData={selectedModelChartData}
            />
          )}
          {activeTab === 'confusion_matrix' && (
            !isRegressionModel ? (
              <ConfusionMatrixTab
                apiResults={apiResults}
                selectedConfusionModel={selectedConfusionModel}
                setSelectedConfusionModel={setSelectedConfusionModel}
                selectedConfusionData={selectedConfusionData}
              />
            ) : (
              <div className="py-12 text-center bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Confusion matrix is only available for classification models</p>
              </div>
            )
          )}
        </div>
      </div>
    </AIPlaygroundLayout>
  );
};

export default ModelInferencing;