import { toast } from 'react-hot-toast';

// Validation functions for supervised and time series predictions
export const validateSupervisedLearning = async (config, datasetState, activeWorkflowId, hostnameAI, setIsValidating, onValidate) => {
  if (!config.classification || !config.targetFeature) return;

  setIsValidating(true);

  try {
    const modellingTypeMap = {
      'Binary': 'binary',
      'Multiclass': 'multiclass',
      'Regression': 'regression'
    };

    const modellingType = modellingTypeMap[config.classification];
    const ensembleId = datasetState.ensembleId;
    const targetColumn = config.targetFeature;

    const response = await fetch(`${hostnameAI}/genesis/validate-target-column`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ensemble_id: ensembleId,
        workflow_id: activeWorkflowId,
        target_column: targetColumn,
        modelling_type: modellingType
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success') {
        toast.success('Validation successful!', { duration: 3000, position: 'top-right' });
        onValidate();
      } else {
        toast.error('Target column is not compatible with the selected modeling type.', { duration: 4000, position: 'top-right' });
      }
    } else {
      toast.error('Target column is not compatible with the selected modeling type.', { duration: 4000, position: 'top-right' });
    }
  } catch (error) {
    console.error('Validation error:', error);
    toast.error('Target column is not compatible with the selected modeling type.', { duration: 4000, position: 'top-right' });
  } finally {
    setIsValidating(false);
  }
};

export const validateTimeSeriesLearning = async (config, datasetState, activeWorkflowId, hostnameAI, setIsValidating, setIsTimeSeriesValidated) => {
  if (!config.timeSeriesType || !config.targetFeature || !config.timeColumn) return;

  setIsValidating(true);

  try {
    const timeSeriesTypeMap = {
      'Univariate': 'univariate_timeseries',
      'Multivariate': 'multivariate_timeseries',
      'Multivariate Multiseries': 'multivariate_multiseries',
      'Univariate Multiseries': 'univariate_multiseries'
    };

    const modellingType = timeSeriesTypeMap[config.timeSeriesType];
    const ensembleId = datasetState.ensembleId;
    const targetColumn = config.targetFeature;
    const timeColumn = config.timeColumn;

    const response = await fetch(`${hostnameAI}/genesis/validate-target-column`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ensemble_id: ensembleId,
        workflow_id: activeWorkflowId,
        target_column: targetColumn,
        modelling_type: modellingType,
        time_column: timeColumn,
        frequency: config.frequency || '', // Include frequency if available, otherwise send an empty string
        entity_cols: ['multivariate_multiseries', 'univariate_multiseries'].includes(modellingType) ? (config.entity_cols || []) : undefined
      })
    });

  if (response.ok) {
  const data = await response.json();

  if (data.status === 'success') {

    if (data.frequency_match === true) {
      toast.success('Time Series validation successful!', {
        duration: 3000,
        position: 'top-right'
      });

      setIsTimeSeriesValidated(true);
    }

    return data;
  }

  toast.error(
    'Time column or target column is not compatible with the selected modeling type.',
    {
      duration: 4000,
      position: 'top-right'
    }
  );

  return null;
} else {
  toast.error(
    'Failed to validate.',
    {
      duration: 4000,
      position: 'top-right'
    }
  );

  return null;
}

} catch (error) {
  console.error('Time Series validation error:', error);

  toast.error(
    'Failed to validate.',
    {
      duration: 4000,
      position: 'top-right'
    }
  );

  return null;
} finally {
  setIsValidating(false);
}
};

// Validation function for running target column validation
export const runTargetColumnValidation = async (config, datasetState, activeWorkflowId, hostnameAI) => {
  if (!config.classification || !config.targetFeature) {
    toast.error('Please select classification type and target feature.', {
      duration: 4000,
      position: 'top-right',
    });
    return false;
  }

  try {
    const modellingTypeMap = {
      'Binary': 'binary',
      'Multiclass': 'multiclass',
      'Regression': 'regression'
    };

    const modellingType = modellingTypeMap[config.classification];
    const ensembleId = datasetState.ensembleId;
    const targetColumn = config.targetFeature;

    const response = await fetch(`${hostnameAI}/genesis/validate-target-column`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ensemble_id: ensembleId,
        workflow_id: activeWorkflowId,
        target_column: targetColumn,
        modelling_type: modellingType
      })
    });

    if (response.ok) {
      const data = await response.json();

      if (data.status === 'success') {
        return true;
      } else {
        toast.error('Target column is not compatible with the selected modeling type.', {
          duration: 4000,
          position: 'top-right',
        });
        return false;
      }
    } else {
      toast.error('Target column is not compatible with the selected modeling type.', {
        duration: 4000,
        position: 'top-right',
      });
      return false;
    }
  } catch (error) {
    toast.error('Target column is not compatible with the selected modeling type.', {
      duration: 4000,
      position: 'top-right',
    });
    return false;
  }
};
