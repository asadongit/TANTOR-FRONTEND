/**
 * Centralized descriptions for data preprocessing sections
 * Used across data preprocessing components for consistent messaging
 */

export const dataPreprocessingDescriptions = {
  changeDataType: "Change Data Type refers to converting a feature to its appropriate data format (e.g., string to numeric, date to datetime). Correct data types ensure accurate calculations, proper validation, and correct model behavior.",
  aggregation: " Aggregation combines multiple records with the same timestamp. It combines those rows into a single row by applying operations like sum, average, max, or count. This removes duplication and creates one clean summarized value for analysis.",
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

export const outlierTreatmentMethods = [
  {
    value: 'cap_95',
    label: 'Cap 95%',
    description: 'Cap 95% is an outlier treatment technique that limits extreme values to the 95th percentile of the data. Any value above this threshold is replaced with the 95th percentile value, reducing the impact of extreme observations while keeping all records.'
  },
  {
    value: 'cap_99',
    label: 'Cap 99%',
    description: 'Cap 99% is an outlier treatment method that limits extreme values to the 99th percentile. It preserves most data variability while preventing very rare extreme values from dominating the analysis.'
  },
  {
    value: 'log',
    label: 'Log Transform',
    description: 'Log Transform is a mathematical transformation that reduces the effect of large values by applying a logarithmic scale. It compresses extreme values and helps normalize skewed data, making patterns easier for models to learn.'
  },
  {
    value: 'bin',
    label: 'Bin',
    description: 'Binning groups continuous values into discrete intervals or bins, reducing the impact of outliers by treating them as part of boundary bins.'
  },
  {
    value: 'remove',
    label: 'Remove',
    description: 'Remove is an outlier handling approach that completely deletes records identified as outliers. This method is used when extreme values are invalid, erroneous, or likely to distort model performance.'
  }
];

export const outlierMethods = [
  { value: 'zscore', label: 'Z-Score', description: 'A statistical method that identifies outliers based on how far a data point deviates from the mean in terms of standard deviation. Values with very high or low Z-scores are considered outliers. Best suited for data that follows a normal distribution.' },
  { value: 'modified_zscore', label: 'Modified Z-Score', description: 'A robust version of Z-score that uses the median and median absolute deviation (MAD). It reduces the impact of extreme values. More reliable than standard Z-score for skewed data.' },
  { value: 'iqr', label: 'IQR', description: 'A statistical method that identifies outliers using the range between the first and third quartiles. Values falling far below or above this range are treated as outliers. Commonly used for non-normal data distributions.' },
  { value: 'isolation_forest', label: 'Isolation Forest', description: 'A tree-based anomaly detection algorithm that isolates outliers by randomly partitioning data. Outliers are detected because they require fewer splits to isolate. Effective for large and high-dimensional datasets.' },
  { value: 'lof', label: 'LOF', description: 'A density-based method that detects outliers by comparing local data density. Points with significantly lower density than their neighbors are flagged as outliers. Captures local anomalies effectively.' },
  { value: 'one_class_svm', label: 'One Class SVM', description: 'A machine learning algorithm that learns the boundary of normal data. Data points falling outside the learned boundary are treated as outliers. Useful when only normal data is available for training.' },
  { value: 'elliptic_envelope', label: 'Elliptic Envelope', description: 'A statistical method that fits an elliptical boundary around normal data points. Observations outside the ellipse are considered outliers. Works best when data follows a Gaussian distribution.' },
  { value: 'dbscan', label: 'DBSCAN', description: 'A density-based clustering algorithm that identifies noise points as outliers. Points not belonging to any dense cluster are labeled as outliers. Effective for detecting clusters of arbitrary shape.' }
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
