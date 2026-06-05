/**
 * Centralized descriptions for data preprocessing sections
 * Used across data preprocessing components for consistent messaging
 */

export const dataPreprocessingDescriptions = {
  changeDataType: "Change Data Type refers to converting a feature to its appropriate data format (e.g., string to numeric, date to datetime). Correct data types ensure accurate calculations, proper validation, and correct model behavior.",
  aggregation: " Aggregation combines multiple records with the same timestamp. It combines those rows into a single row by applying operations like sum, average, max, or count. This removes duplication and creates one clean summarized value for analysis.",
  handleHighMissing: "Configure the threshold used to identify columns with a high percentage of missing values",
  handleOriginalMissing: "Handle missing values that existed in the original dataset using interpolation or forward/backward fill methods.",
  handleGeneratedMissing: "Handle missing values that were created during preprocessing or feature generation.",
  stationarityTreatment: "Stationarity Treatment applies transformations to non-stationary time series to achieve statistical stationarity. This includes differencing, detrending, and other techniques to stabilize the mean, variance, and autocovariance over time, making the data suitable for time series modeling.",
  seasonalityAnalysis: "Seasonality Analysis detects and quantifies recurring patterns in time series data. It identifies periodic fluctuations that repeat at fixed intervals, helping to understand cyclic behavior and improve forecasting accuracy.",
  vif: "VIF Analysis measures how much a feature is linearly dependent on other features in the dataset. High VIF values indicate multicollinearity, which can reduce model stability and interpretability.",
  correlation: "Correlation Analysis visually represents the strength and direction of relationships between numerical variables. It helps identify strong positive or negative correlations, which can indicate redundant or highly related features.",
  featureTarget: "Feature Target Analysis examines the relationship between each feature and the target variable. It helps identify which features have strong predictive power for your target, enabling better feature selection and model interpretability."
};

export default dataPreprocessingDescriptions;

export const featureSelectionDescriptions = {
  dropLowValue: "Drop Low-Value Column refers to the removal of features that provide little or no useful information for model learning, such as columns with very low variance or a single dominant value. Removing such columns helps reduce noise, improve model efficiency, and prevent unnecessary complexity.",
  handleMissing: "Fix missing entries using dropping or imputation techniques.",
  createBasic: "Add new domain features for enhanced model performance.",
  detectOutliers: "Detect outliers in numerical fields using various statistical and machine learning methods to identify anomalous data points.",
  dropColumns: "Remove columns exceeding missing value threshold",
  imputation: "Imputation is the process of handling missing or null values by replacing them with meaningful estimates based on data patterns or predefined rules. It helps maintain dataset completeness, prevents errors during model training, and ensures reliable analytical results."
};



export const dataStabilizationDescriptions = {
  outlierTreatment: "Outlier Treatment refers to techniques used to identify and handle extreme or abnormal values that can distort time series behavior. These methods help reduce noise, improve stability, and make downstream forecasting more reliable.",
  stationarityAnalysis: "Stationarity Analysis evaluates whether a time series has stable statistical properties over time. Identifying non-stationary behavior helps determine whether transformations are needed before modeling.",
  seasonalityAnalysis: "Seasonality Analysis detects and quantifies recurring patterns in time series data. It identifies periodic fluctuations that repeat at fixed intervals, helping to understand cyclic behavior and improve forecasting accuracy."
};
export const univariateOutlierDetectionMethods = [
  {
    value: 'stl_mad',
    label: 'STL + MAD',
    description:
      'Uses STL decomposition and Median Absolute Deviation (MAD) on residuals to identify anomalous observations.',
    subMethod: 'seasonal_period'
  },
  {
    value: 'rolling_median_iqr',
    label: 'Rolling Median + IQR',
    description:
      'Detects outliers using a rolling median and Interquartile Range (IQR) within a moving window.',
    subMethod: 'rolling_window'
  },
  {
    value: 'rolling_mean_sigma',
    label: 'Rolling Mean + Sigma',
    description:
      'Detects outliers by measuring deviations from the rolling mean using standard deviation thresholds.',
    subMethod: 'rolling_window'
  },
  {
    value: 'seasonal_decomp_residuals',
    label: 'Seasonal Decomposition Residuals',
    description:
      'Performs seasonal decomposition and identifies anomalies from the residual component.',
    subMethod: 'seasonal_period'
  },
  {
    value: 'loess_residuals',
    label: 'LOESS Residuals',
    description:
      'Uses LOESS smoothing and detects outliers based on deviations from the locally fitted trend.'
  },
  {
    value: 'isolation_forest',
    label: 'Isolation Forest',
    description:
      'A tree-based anomaly detection algorithm that isolates observations through random partitioning. Outliers require fewer splits and are identified as anomalies.'
  },
  {
    value: 'pelt',
    label: 'PELT',
    description:
      'Pruned Exact Linear Time (PELT) detects structural changes and changepoints that may indicate anomalous behavior.'
  },
  {
    value: 'modified_zscore',
    label: 'Modified Z-Score',
    description:
      'A robust statistical method that uses the median and Median Absolute Deviation (MAD) to identify outliers.'
  }
];

export const multivariateOutlierDetectionMethods = [
  {
    value: 'isolation_forest',
    label: 'Isolation Forest',
    description:
      'A tree-based anomaly detection algorithm that isolates observations through random partitioning. Outliers require fewer splits and are identified as anomalies.'
  },
  {
    value: 'lof',
    label: 'LOF',
    description:
      'Local Outlier Factor detects anomalies by comparing the local density of each observation with its neighbors.'
  },
  {
    value: 'one_class_svm',
    label: 'One Class SVM',
    description:
      'Learns the boundary of normal observations and flags records lying outside that boundary as anomalies.'
  },
  {
    value: 'elliptic_envelope',
    label: 'Elliptic Envelope',
    description:
      'Fits a robust covariance-based elliptical boundary around normal observations and identifies points outside it as outliers.'
  },
  {
    value: 'dbscan',
    label: 'DBSCAN',
    description:
      'A density-based clustering algorithm that identifies observations not belonging to any dense cluster as anomalies.'
  }
];


export const univariateOutlierMethods = [
  {
    value: 'pchip',
    label: 'PCHIP',
    description:
      'Piecewise Cubic Hermite Interpolating Polynomial (PCHIP) replaces outliers using a shape-preserving interpolation technique. It maintains local trends and avoids overshooting, making it suitable for smooth time series reconstruction.'
  },
  {
    value: 'linear',
    label: 'Linear',
    description:
      'Linear interpolation replaces outliers by estimating values along a straight line between neighboring observations. It is simple, efficient, and works well when changes between observations are gradual.'
  },
  {
    value: 'cubic_spline',
    label: 'Cubic Spline',
    description:
      'Cubic spline interpolation replaces outliers using smooth polynomial curves fitted between neighboring observations. It produces smoother transitions than linear interpolation and captures non-linear patterns.'
  },
  {
    value: 'time_weighted',
    label: 'Time Weighted',
    description:
      'Time-weighted interpolation estimates replacement values based on the temporal distance between observations. Closer observations receive greater influence than distant observations.'
  },
  {
    value: 'rolling_median',
    label: 'Rolling Median',
    description:
      'Rolling Median replaces outliers using the median value within a moving window. It is robust to extreme observations and helps preserve the underlying trend.',
    subMethod: 'rolling_window'
  },
  {
    value: 'rolling_mean',
    label: 'Rolling Mean',
    description:
      'Rolling Mean replaces outliers using the average value within a moving window. It smooths short-term fluctuations and reduces the influence of isolated spikes.',
    subMethod: 'rolling_window'
  },
  {
    value: 'ewm',
    label: 'Exponentially Weighted Mean',
    description:
      'Exponentially Weighted Mean replaces outliers using a weighted average that assigns greater importance to recent observations. This helps preserve recent trends while reducing noise.',
    subMethod: 'rolling_window'
  },
  {
    value: 'seasonal_naive',
    label: 'Seasonal Naive',
    description:
      'Seasonal Naive replaces outliers using values from the same seasonal position in previous cycles. It is effective when the series exhibits strong repeating seasonal patterns.',
    subMethod: 'seasonal_period'
  },
  {
    value: 'seasonal_median',
    label: 'Seasonal Median',
    description:
      'Seasonal Median replaces outliers using the median of values from equivalent seasonal positions across cycles. This reduces sensitivity to extreme seasonal observations.',
    subMethod: 'seasonal_period'
  },
  {
    value: 'seasonal_mean',
    label: 'Seasonal Mean',
    description:
      'Seasonal Mean replaces outliers using the average value from equivalent seasonal positions across cycles. It preserves recurring seasonal behavior while reducing noise.',
    subMethod: 'seasonal_period'
  },
  {
    value: 'stl_reconstruction',
    label: 'STL Reconstruction',
    description:
      'STL Reconstruction decomposes the series into trend, seasonal, and residual components. Outliers are replaced using the reconstructed signal while preserving overall structure.',
    subMethod: 'seasonal_period'
  },
  {
    value: 'ffill',
    label: 'Forward Fill',
    description:
      'Forward Fill replaces outliers using the most recent valid observation. This approach is useful when values are expected to remain relatively stable over short periods.'
  },
  {
    value: 'bfill',
    label: 'Backward Fill',
    description:
      'Backward Fill replaces outliers using the next available valid observation. It is useful when future observations provide a reasonable estimate of the abnormal value.'
  },
  {
    value: 'nearest',
    label: 'Nearest',
    description:
      'Nearest replacement substitutes outliers with the closest valid neighboring observation. It preserves existing values without introducing interpolated estimates.'
  },
  {
    value: 'local_winsorize',
    label: 'Local Winsorize',
    description:
      'Local Winsorization limits extreme values within a moving window by capping them to local percentile boundaries. This reduces the influence of outliers while retaining observations.',
    subMethod: 'rolling_window'
  },
  {
    value: 'hard_clip',
    label: 'Hard Clip',
    description:
      'Hard Clip replaces values outside predefined limits with boundary values. This prevents extreme observations from disproportionately influencing analysis.'
  },
  {
    value: 'flag_binary',
    label: 'Flag Binary',
    description:
      'Flag Binary creates an indicator variable identifying whether an observation is considered an outlier. The original value remains unchanged.'
  },
  {
    value: 'flag_magnitude',
    label: 'Flag Magnitude',
    description:
      'Flag Magnitude records the severity of deviation from expected behavior. It preserves information about the size of the anomaly while allowing downstream handling.',
    subMethod: 'rolling_window'
  }
];


export const multivariateOutlierMethods = [
  {
    value: 'pchip',
    label: 'PCHIP',
    description:
      'PCHIP interpolation replaces outliers while preserving local shape and monotonicity across related variables.'
  },
  {
    value: 'rolling_median',
    label: 'Rolling Median',
    description:
      'Rolling Median replaces outliers using the median value within a moving window, reducing sensitivity to extreme observations.',
    subMethod: 'rolling_window'
  },
  {
    value: 'flag_binary',
    label: 'Flag Binary',
    description:
      'Creates an indicator feature showing whether a record has been identified as an outlier.'
  },
  {
    value: 'flag_magnitude',
    label: 'Flag Magnitude',
    description:
      'Creates a feature representing the magnitude of deviation from expected behavior.',
    subMethod: 'rolling_window'
  },
  {
    value: 'mahalanobis_clip',
    label: 'Mahalanobis Clip',
    description:
      'Uses Mahalanobis distance to identify multivariate outliers and clips observations that exceed the acceptable threshold while preserving overall relationships between variables.'
  },
  {
    value: 'median_impute',
    label: 'Median Impute',
    description:
      'Replaces detected outliers with the median value of the corresponding feature. This approach is robust to skewed distributions and extreme observations.'
  },
  {
    value: 'knn_impute',
    label: 'KNN Impute',
    description:
      'Uses K-Nearest Neighbors to replace outliers with values inferred from similar observations. It preserves local structure and feature relationships.'
  },
  {
    value: 'soft_impute',
    label: 'Soft Impute',
    description:
      'Uses matrix-completion techniques to estimate replacement values while preserving relationships across multiple variables.'
  },
  {
    value: 'remove',
    label: 'Remove',
    description:
      'Removes observations identified as outliers from the dataset. This method is suitable when abnormal values are likely caused by errors or corruption.'
  }
];




export const encodingMethods = [
  {
    value: 'onehot',
    label: 'One Hot',
    description: 'One-Hot Encoding converts each category into a separate binary column. Each column indicates the presence or absence of a category, making the data usable for most machine learning models.'
  },
  {
    value: 'label',
    label: 'Label',
    description: 'Label Encoding assigns a unique numeric label to each category. It is simple and works best for ordered or ordinal categorical features.'
  },
  {
    value: 'target',
    label: 'Target',
    description: 'Target Encoding replaces each category with the average target value for that category. It captures the relationship between the category and the prediction outcome.'
  },
  {
    value: 'woe',
    label: 'WOE',
    description: 'WOE encoding replaces categories with a value based on their predictive power relative to the target. It is widely used in credit risk and banking models for interpretability.'
  },
  {
    value: 'frequency',
    label: 'Frequency',
    description: 'Frequency Encoding replaces categories with their occurrence frequency in the dataset. It preserves information about how common each category is.'
  },
  {
    value: 'binary',
    label: 'Binary',
    description: 'Binary Encoding converts categories into binary digits and splits them across multiple columns. It reduces dimensionality compared to one-hot encoding.'
  },
  {
    value: 'leave_one_out',
    label: 'Leave One Out',
    description: 'Leave-One-Out Encoding replaces a category using the target mean excluding the current row. This helps reduce overfitting compared to standard target encoding.'
  },
  {
    value: 'james_stein',
    label: 'James Stein',
    description: 'James-Stein Encoding is a shrinkage-based target encoding method. It pulls category means toward the global mean to reduce overfitting.'
  },
  {
    value: 'm_estimate',
    label: 'M-Estimate',
    description: 'M-Estimate Encoding smooths target encoding by combining category statistics with global averages. It improves stability for categories with few samples.'
  },
  {
    value: 'catboost',
    label: 'CatBoost',
    description: 'CatBoost Encoding is a target-based method that uses ordered statistics to avoid data leakage. It is optimized for gradient-boosting models like CatBoost.'
  },
  {
    value: 'count',
    label: 'Count',
    description: 'Count Encoding replaces each category with the number of times it appears in the data. It is simple and effective for high-cardinality features.'
  },
  {
    value: 'basen',
    label: 'BaseN',
    description: 'Base-N Encoding represents categories as digits in a base-N numeral system. It is a generalized form of binary encoding that balances feature size and information.'
  },
  {
    value: 'hashing',
    label: 'Hashing',
    description: 'Hashing Encoding converts categories into numeric features using a hash function. It is memory-efficient and suitable for large-scale datasets.'
  },
  {
    value: 'helmert',
    label: 'Helmert',
    description: 'Helmert Encoding compares each category with the mean of subsequent categories. It is commonly used in statistical modeling and hypothesis testing.'
  },
  {
    value: 'sum',
    label: 'Sum',
    description: 'Sum Encoding represents categories using deviation from the overall mean. It is mainly used in regression and statistical analysis.'
  },
  {
    value: 'backward_difference',
    label: 'Backward Difference',
    description: 'Backward Difference Encoding compares each category with the previous category in order. It is useful for ordered categorical features.'
  },
  {
    value: 'polynomial',
    label: 'Polynomial',
    description: 'Polynomial Encoding creates contrast-based numeric representations for categorical variables. It is mainly used in statistical and regression-based models.'
  }
];

export const scalingMethods = [
  { value: 'standard', label: 'Standard', description: 'Standard Scaler transforms features to have zero mean and unit variance. It is commonly used when data follows a normal distribution.' },
  { value: 'minmax', label: 'MinMax', description: 'Min-Max Scaler rescales values to a fixed range, usually between 0 and 1. It is sensitive to outliers but easy to interpret.' },
  { value: 'robust', label: 'Robust', description: 'Robust Scaler uses the median and interquartile range (IQR) instead of mean and standard deviation. It is effective when data contains outliers or extreme values.' },
  { value: 'maxabs', label: 'MaxAbs', description: 'MaxAbs Scaler scales values by dividing them by the maximum absolute value. It preserves sparsity and works well for data already centered around zero.' },
  { value: 'quantile', label: 'Quantile', description: 'Quantile Scaler transforms features to follow a uniform or normal distribution based on quantiles. It reduces the effect of outliers and makes feature distributions consistent.' },
  { value: 'power', label: 'Power', description: 'Power Scaler applies a power transformation to stabilize variance and reduce skewness. It helps make features more suitable for machine learning models.' },
  { value: 'normalizer', label: 'Normalizer', description: 'Normalization rescales each data record so its overall magnitude equals one. It is mainly used for distance-based algorithms such as KNN and clustering.' }
];
