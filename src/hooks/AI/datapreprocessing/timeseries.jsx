import axios from 'axios';
const hostnameAI = window._env_?.VITE_AI_API;


// DATA CLEANING 
export const cleanTimeSeriesData = async (params) => {
  try {
    const response = await axios.post(
      `${hostnameAI}/data/preprocess_timeseries/initial_clean`,
      {
        ensemble_id: params.ensembleId,
        workflow_id: params.workflowId,
        modify_data_types: params.modifyDataTypes || false,
        modify_data_types_map: params.modifyDataTypesMap || {},
      
      },
      {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error cleaning time series data:', error);
    throw error;
  }
};



// HANDLE MISSING VALUES
export const handleMissingValues = async (params) => {
  try {
    const response = await axios.post(
      `${hostnameAI}/data/preprocess_timeseries/handle_missing_values`,
      {
        ensemble_id: params.ensemble_id,
        workflow_id: params.workflow_id,
        high_missing_value_active: params.high_missing_value_active !== undefined ? params.high_missing_value_active : false,
        high_missing_value_threshold: params.high_missing_value_threshold !== undefined ? params.high_missing_value_threshold : 70,
        generated_missing_value_active: params.generated_missing_value_active !== undefined ? params.generated_missing_value_active : true,
        generated_missing_value_numeric_method: params.generated_missing_value_numeric_method || '',
        generated_missing_value_categorical_method: params.generated_missing_value_categorical_method || '',
        generated_missing_value_datetime_method: params.generated_missing_value_datetime_method || '',
        generated_missing_value_rolling_window: params.generated_missing_value_rolling_window !== undefined ? params.generated_missing_value_rolling_window : 3,
        generated_missing_value_categorical_seasonal_period:params.generated_missing_value_categorical_seasonal_period !== undefined ? params.generated_missing_value_categorical_seasonal_period : 7,
        generated_missing_value_numerical_seasonal_period:params.generated_missing_value_numerical_seasonal_period !== undefined ? params.generated_missing_value_numerical_seasonal_period : 7,
        original_missing_value_active: params.original_missing_value_active !== undefined ? params.original_missing_value_active : true,
        original_missing_value_numeric_method: params.original_missing_value_numeric_method || '',
        original_missing_value_categorical_method: params.original_missing_value_categorical_method || '',
        original_missing_value_datetime_method: params.original_missing_value_datetime_method || '',
        original_missing_value_polynomial_order: params.original_missing_value_polynomial_order !== undefined ? params.original_missing_value_polynomial_order : 2,
        original_missing_value_spline_order: params.original_missing_value_spline_order !== undefined ? params.original_missing_value_spline_order : 3,
        original_missing_value_seasonal_period: params.original_missing_value_seasonal_period !== undefined ? params.original_missing_value_seasonal_period : 7,
      },
      {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error handling missing values:', error);
    throw error;
  }
};

// FEATURE INTEGRITY
export const featureIntegrity = async (params) => {
  try {
    const response = await axios.post(
      `${hostnameAI}/data/preprocess_timeseries/feature_integrity_validation`,
      {
        ensemble_id: params.ensembleId,
        workflow_id: params.workflowId,
        drop_columns_active: params.dropColumnsActive !== undefined ? params.dropColumnsActive : true,
        columns_to_drop: params.columnsToDrop || [],
        outlier_detection_active: params.outlierDetectionActive !== undefined ? params.outlierDetectionActive : true,
        outlier_detection_method: params.outlierDetectionMethod || 'iqr',
        outlier_thershold: params.outlierThreshold !== undefined ? params.outlierThreshold : 3,
        outlier_seasonal_period: params.outlierSeasonPeriod !== undefined ? params.outlierSeasonPeriod : 7,
        outlier_rolling_window: params.outlierRollingWindow !== undefined ? params.outlierRollingWindow : 7,
        outlier_loess_frac: params.outlierLoessFrac !== undefined ? params.outlierLoessFrac : 0.3,
        outlier_pelt_penalty: params.outlierPeltPenalty !== undefined ? params.outlierPeltPenalty : 10,
        outlier_contamination: params.outlierContamination !== undefined ? params.outlierContamination : 0.05,
      },
      {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error handling missing values:', error);
    throw error;
  }
};

// DATA STABILIZATION
export const stabilizeData = async (params) => {
  try {
    const response = await axios.post(
      `${hostnameAI}/data/preprocess_timeseries/data_stabalization`,
      { 
        ensemble_id: params.ensembleId,
        workflow_id: params.workflowId,
        outlier_treatment_active: params.outlierTreatmentActive !== undefined ? params.outlierTreatmentActive : true,
        outlier_treatment_strategy: params.outlierTreatmentStrategy,
        outlier_threshold: params.outlierThreshold !== undefined ? params.outlierThreshold : 3,
        outlier_season_period: params.outlierSeasonPeriod !== undefined ? params.outlierSeasonPeriod : 8,
        outlier_rolling_window: params.outlierRollingWindow !== undefined ? params.outlierRollingWindow : 7,
        outlier_clip_bounds: params.outlierClipBounds !== undefined ? params.outlierClipBounds : [0],
        outlier_contamination: params.outlierContamination !== undefined ? params.outlierContamination : 0.05,
        seasonality_analysis: params.seasonalityAnalysis !== undefined ? params.seasonalityAnalysis : false,
        seasonality_min_period: params.seasonalityMinPeriod !== undefined ? params.seasonalityMinPeriod : 2,
        seasonality_max_period: params.seasonalityMaxPeriod !== undefined ? params.seasonalityMaxPeriod : 365,
      },
      {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'}
      }
    );

    return response.data;
  } catch (error) {
    console.error('Data stabilization API error:', error);
    throw error;
  }
};


// DATA SEASONALIZATION
export const seasonalizeData = async (params) => {
  try { 
    const response = await axios.post(
      `${hostnameAI}/data/preprocess_timeseries/data_seasonalization`,
      { 
        ensemble_id: params.ensembleId,
        workflow_id: params.workflowId,
        seasonality_treatment_active: params.seasonalityTreatmentActive !== undefined ? params.seasonalityTreatmentActive : true,
        seasonality_min_period: params.seasonalityMinPeriod !== undefined ? params.seasonalityMinPeriod : 2,
        seasonality_max_period: params.seasonalityMaxPeriod !== undefined ? params.seasonalityMaxPeriod : 24,
        seasonality_confidence_threshold: params.seasonalityConfidenceThreshold !== undefined ? params.seasonalityConfidenceThreshold : 0.1,
        stationarity_analysis_active: params.stationarityAnalysisActive !== undefined ? params.stationarityAnalysisActive : true,
        adf_significance: params.adfSignificance !== undefined ? params.adfSignificance : 0.05,
        kpss_significance: params.kpssSignificance !== undefined ? params.kpssSignificance : 0.05,
      },
      { 
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        } 
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error seasonalizing data:', error);
    throw error;
  }
};



// STATIONARITY TREATMENT 

export const stationarityTreatment = async (params) => {
  try {
    const response = await axios.post(
      `${hostnameAI}/data/preprocess_timeseries/data_stationarity_treatment`,
      {
        ensemble_id: params.ensembleId,
        workflow_id: params.workflowId,
        stationarity_treatment_active: params.stationarityTreatmentActive !== undefined ? params.stationarityTreatmentActive : true,
        adf_significance: params.adfSignificance !== undefined ? params.adfSignificance : 0.05,
        kpss_significance: params.kpssSignificance !== undefined ? params.kpssSignificance : 0.05,
        variance_growth_threshold: params.varianceGrowthThreshold !== undefined ? params.varianceGrowthThreshold : 1.5,
        rolling_window: params.rollingWindow !== undefined ? params.rollingWindow : 168,
        max_diff_order: params.maxDiffOrder !== undefined ? params.maxDiffOrder : 2,
      },
      {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error in stationarity treatment:', error);
    throw error;
  }
};


// FEATURE DEPENDENCY ANALYSIS
export const featureDependencyAnalysis = async (params) => {
  try {
    const response = await axios.post(
      `${hostnameAI}/data/preprocess_timeseries/feature_dependency_analysis`,
      {
        ensemble_id: params.ensembleId,
        workflow_id: params.workflowId,
        vif_active: params.vifActive !== undefined ? params.vifActive : false,
        correlation_active: params.correlationActive !== undefined ? params.correlationActive : false,
        feature_target_active: params.featureTargetActive !== undefined ? params.featureTargetActive : false,
        drop_columns_from_vif: params.dropColumnsFromVif || [],
        drop_columns_from_correlation: params.dropColumnsFromCorrelation || [],
        drop_columns_from_feature_target: params.dropColumnsFromFeatureTarget || [],
      },
      {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error in feature dependency analysis:', error);
    throw error;
  } 
};



// SCALING AND ENCODING 
export const scalingAndEncoding = async (params) => {
  try {
    const response = await axios.post(
      `${hostnameAI}/data/preprocess_timeseries/scaling_and_encoding`,
      {
        ensemble_id: params.ensembleId,
        workflow_id: params.workflowId,
        scaling_active: params.scalingActive !== undefined ? params.scalingActive : false,
        encoding_active: params.encodingActive !== undefined ? params.encodingActive : false,
        encoding_type: params.encodingType || 'onehot',
        scaling_method: params.scalingMethod || 'standard',
        handle_unknown: params.handleUnknown || 'ignore',
      
      },
      {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error in scaling and encoding:', error);
    throw error;
  } 
};






// Provide a default export for compatibility with various import styles
export default cleanTimeSeriesData;
