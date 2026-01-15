import React, { useState } from 'react';
import { AIPlaygroundLayout } from '../AIPlaygroundLayout';
import { Check, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAIPlayground } from '../../../../context/AIPlaygroundContext';
import { toast } from 'react-hot-toast';

const RadioButton = ({ label, checked, onChange, name, readonly }) => (
  <label
    className={`flex items-center gap-2 group ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
  >
    <div className="relative">
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={readonly}
        onChange={readonly ? undefined : onChange}
        className="sr-only peer"
      />
      <div className="w-4 h-4 border-2 border-gray-300 rounded-full peer-checked:border-[#8e78b7] transition-colors">
        {checked && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#8e78b7] rounded-full" />
        )}
      </div>
    </div>
    <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
  </label>
);

const Section = ({ title, children, className = '' }) => (
  <div className={`bg-white ${className}`}>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
);

const NotebookModeModal = ({ isOpen, onCancel, onContinue, readonly }) => {
  if (!isOpen || readonly) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onCancel}></div>

      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Switch to Notebook Mode?</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            In Notebook mode, all pipeline setup and execution must be done through code instead of the visual workflow.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">Do you want to continue?</p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            className="px-4 py-2 text-sm font-medium text-white bg-[#8e78b7] rounded-lg hover:bg-[#7d67a6] transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

const ModeSelection = ({ config, setConfig, readonly }) => {
  const [showModal, setShowModal] = useState(false);
  const [pendingNotebookState, setPendingNotebookState] = useState(false);

  const handleNotebookToggle = (checked) => {
    if (readonly) return;

    if (checked) {
      setPendingNotebookState(true);
      setShowModal(true);
    } else {
      setConfig({ ...config, notebookMode: false });
    }
  };

  const handleModalContinue = () => {
    if (readonly) return;
    setConfig({ ...config, notebookMode: pendingNotebookState });
    setShowModal(false);
  };

  const handleModalCancel = () => {
    setPendingNotebookState(false);
    setShowModal(false);
  };

  return (
    <>
      <Section title="Mode Selection">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_auto_1fr] gap-4">
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div className="grid grid-cols-[1fr_1fr_1fr] bg-gray-50 border-b border-gray-200">
              <div className="px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">
                Feature Type
              </div>
              <div className="px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">
                Auto
              </div>
              <div className="px-4 py-3 text-sm font-medium text-gray-700">Manual</div>
            </div>

            <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-gray-200">
              <div className="px-4 bg-gray-50 py-4 text-sm text-gray-700 border-r border-gray-200 flex items-center">
                Data Pre-processing
              </div>

              <div className="px-4 py-4 flex flex-col gap-2 border-r border-gray-200 bg-white">
                <RadioButton
                  label="Swift"
                  checked={config.dataPreprocessing === 'Swift'}
                  onChange={() => setConfig({ ...config, dataPreprocessing: 'Swift' })}
                  name="dataPreprocessing-auto"
                  readonly={readonly}
                />
                <RadioButton
                  label="Standard"
                  checked={config.dataPreprocessing === 'Standard'}
                  onChange={() => setConfig({ ...config, dataPreprocessing: 'Standard' })}
                  name="dataPreprocessing-auto"
                  readonly={readonly}
                />
                <RadioButton
                  label="Comprehensive"
                  checked={config.dataPreprocessing === 'Comprehensive'}
                  onChange={() => setConfig({ ...config, dataPreprocessing: 'Comprehensive' })}
                  name="dataPreprocessing-auto"
                  readonly={readonly}
                />
              </div>

              <div className="px-4 py-4 flex items-center bg-white">
                <RadioButton
                  label="Manual"
                  checked={config.dataPreprocessing === 'Manual'}
                  onChange={() => setConfig({ ...config, dataPreprocessing: 'Manual' })}
                  name="dataPreprocessing-manual"
                  readonly={readonly}
                />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_1fr_1fr]">
              <div className="px-4 bg-gray-50 py-4 text-sm text-gray-700 border-r border-gray-200 flex items-center">
                Model Selection
              </div>

              <div className="px-4 py-4 flex flex-col gap-2 border-r border-gray-200 bg-white">
                <RadioButton
                  label="Swift"
                  checked={config.modelSelection === 'Swift'}
                  onChange={() => setConfig({ ...config, modelSelection: 'Swift' })}
                  name="modelSelection-auto"
                  readonly={readonly}
                />
                <RadioButton
                  label="Standard"
                  checked={config.modelSelection === 'Standard'}
                  onChange={() => setConfig({ ...config, modelSelection: 'Standard' })}
                  name="modelSelection-auto"
                  readonly={readonly}
                />
                <RadioButton
                  label="Comprehensive"
                  checked={config.modelSelection === 'Comprehensive'}
                  onChange={() => setConfig({ ...config, modelSelection: 'Comprehensive' })}
                  name="modelSelection-auto"
                  readonly={readonly}
                />
              </div>

              <div className="px-4 py-4 flex items-center bg-white">
                <RadioButton
                  label="Manual"
                  checked={config.modelSelection === 'Manual'}
                  onChange={() => setConfig({ ...config, modelSelection: 'Manual' })}
                  name="modelSelection-manual"
                  readonly={readonly}
                />
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-center justify-center px-4">
            <div className="flex-1 w-px bg-gray-300"></div>
            <div className="text-gray-400 text-sm font-medium py-3">OR</div>
            <div className="flex-1 w-px bg-gray-300"></div>
          </div>

          <div className="flex items-stretch">
            <div className="border border-gray-200 rounded-lg p-5 w-full bg-white">
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-4">Notebook Mode</div>
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <span className="text-sm text-gray-700">Notebook</span>

                  <label className={`relative inline-flex items-center ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={config.notebookMode}
                      disabled={readonly}
                      onChange={readonly ? undefined : (e) => handleNotebookToggle(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
                  </label>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>Work in a dedicated notebook environment for full code-based control.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>Your pipeline must be defined and executed entirely through code.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <NotebookModeModal
        isOpen={showModal}
        onCancel={handleModalCancel}
        onContinue={handleModalContinue}
        readonly={readonly}
      />
    </>
  );
};

const PredictionType = ({ config, setConfig, isValidated, onValidate, readonly, columnNames }) => {
  const hostnameAI = window._env_?.VITE_AI_API;
  const { datasetState } = useAIPlayground();
  const [isValidating, setIsValidating] = useState(false);
  const tabs = ['Supervised', 'Unsupervised', 'Time Series', 'Anomaly Detection'];

  const handleValidate = async () => {
    if (readonly || !config.classification || !config.targetFeature) return;

    setIsValidating(true);

    try {
      const modellingTypeMap = {
        'Binary': 'binary',
        'Multiclass': 'multiclass',
        'Regression': 'regression'
      };

      const modellingType = modellingTypeMap[config.classification];
      const sessionId = datasetState.sessionId;
      const targetColumn = config.targetFeature;

      const apiUrl = `${hostnameAI}/data/validate-targetcolumn-modellingtype?session_id=${sessionId}&target_column=${encodeURIComponent(targetColumn)}&modelling_type=${modellingType}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();

        if (data.status === 'success') {
          toast.success('Validation successful!', {
            duration: 3000,
            position: 'top-right',
          });
          onValidate();
        } else {
          toast.error('Unable to validate. Please check your configuration.', {
            duration: 4000,
            position: 'top-right',
          });
        }
      } else {
        toast.error('Unable to validate. Please try again.', {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Unable to validate. Network error occurred.', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
    if (isValidated) {
      onValidate();
    }
  };

  const isValidateDisabled = !config.classification || !config.targetFeature || isValidating;

  return (
    <Section title="Prediction Type" className="!bg-gray-50 p-6 rounded-lg border border-gray-200">
      <div className="flex gap-1 border-b border-gray-300 -mx-6 px-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setConfig({ ...config, predictionType: tab })}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative rounded-md ${config.predictionType === tab ? 'text-[#8e78b7] bg-purple-50' : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            {tab}
            {config.predictionType === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8e78b7]" />
            )}
          </button>
        ))}
      </div>

      {config.predictionType === 'Supervised' && (
        <div className="bg-gray-50 rounded-lg p-6 -mx-6 -mb-6 mt-0 pt-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-5">Supervised Learning Configuration</h4>

          <div className="grid grid-cols-1 md:grid-cols-[60%_40%] gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Classification</label>
                  <div className="space-y-2.5">
                    <RadioButton
                      label="Binary"
                      checked={config.classification === 'Binary'}
                      onChange={() => handleConfigChange({ ...config, classification: 'Binary' })}
                      name="learning-type"
                      readonly={readonly}
                    />
                    <RadioButton
                      label="Multiclass"
                      checked={config.classification === 'Multiclass'}
                      onChange={() => handleConfigChange({ ...config, classification: 'Multiclass' })}
                      name="learning-type"
                      readonly={readonly}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Regression</label>
                  <div className="space-y-2.5">
                    <RadioButton
                      label="Regression"
                      checked={config.classification === 'Regression'}
                      onChange={() => handleConfigChange({ ...config, classification: 'Regression' })}
                      name="learning-type"
                      readonly={readonly}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <label className="block text-sm font-medium text-gray-700 mb-3">Target Feature</label>
              {columnNames.length > 0 ? (
                <div className="relative">
                  <select
                    value={config.targetFeature}
                    disabled={readonly}
                    onChange={
                      readonly
                        ? undefined
                        : (e) => handleConfigChange({ ...config, targetFeature: e.target.value })
                    }
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent appearance-none bg-white ${readonly ? 'cursor-not-allowed' : ''
                      }`}
                  >
                    <option value="">Select...</option>
                    {columnNames.map((column) => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500 bg-gray-50">
                  No columns found in the dataset
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleValidate}
              disabled={readonly || isValidateDisabled || isValidated}
              className={`px-8 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${isValidated
                ? 'bg-green-100 text-green-700 cursor-default border border-green-400'
                : readonly || isValidateDisabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#8e78b7] text-white hover:bg-[#7d67a6]'
                }`}
            >
              {isValidating ? (
                <>
                  Validating...
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </>
              ) : isValidated ? (
                <>
                  Validated <Check className="w-5 h-5" />
                </>
              ) : (
                'Validate'
              )}
            </button>
          </div>
        </div>
      )}
    </Section>
  );
};

const SplitSetting = ({ config, setConfig, readonly }) => {
  const handleSliderChange = (type, value) => {
    if (readonly) return;

    const newConfig = { ...config };
    const total = 100;

    if (type === 'train') {
      newConfig.trainSplit = value;
      newConfig.testSplit = total - value;
    } else if (type === 'test') {
      newConfig.testSplit = value;
      newConfig.trainSplit = total - value;
    }

    setConfig(newConfig);
  };

  return (
    <Section title="Split Setting" className="!bg-gray-50 p-6 rounded-lg border border-gray-200">
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Split</span>
            <span className="text-sm text-gray-600">Total: 100%</span>
          </div>

          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden flex">
            <div style={{ width: `${config.trainSplit}%` }} className="bg-[#8e78b7] h-full" />
            <div style={{ width: `${config.testSplit}%` }} className="bg-orange-400 h-full" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Train</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={config.trainSplit}
                disabled={readonly}
                onChange={
                  readonly
                    ? undefined
                    : (e) => handleSliderChange('train', parseInt(e.target.value))
                }
                className={`flex-1 h-2 bg-gray-200 rounded-lg appearance-none ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                style={{
                  background: `linear-gradient(to right, #8e78b7 0%, #8e78b7 ${config.trainSplit}%, #e5e7eb ${config.trainSplit}%, #e5e7eb 100%)`
                }}
              />
              <span className="text-sm text-gray-600 w-10 text-right">{config.trainSplit}%</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Test</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={config.testSplit}
                disabled={readonly}
                onChange={
                  readonly
                    ? undefined
                    : (e) => handleSliderChange('test', parseInt(e.target.value))
                }
                className={`flex-1 h-2 bg-gray-200 rounded-lg appearance-none ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                style={{
                  background: `linear-gradient(to right, #fc842eff 0%, #fc842eff ${config.testSplit}%, #e5e7eb ${config.testSplit}%, #e5e7eb 100%)`
                }}
              />
              <span className="text-sm text-gray-600 w-10 text-right">{config.testSplit}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#8e78b7] rounded-md p-2">
          <p className="text-sm ">
            <span className="font-medium text-[#8e78b7]">Note:</span> To proceed, make sure the Train and Test
            percentages together equal 100%. You can adjust the sliders to balance the data as needed.
          </p>
        </div>
      </div>
    </Section>
  );
};

const FairnessAttribute = ({ config, setConfig, readonly, columnNames = [] }) => {
  const [showMore, setShowMore] = useState(false);

  const allOptions = Array.isArray(columnNames) ? columnNames : [];

  const toggleOption = (option) => {
    if (readonly) return;

    const newSelected = config.fairnessAttributes.includes(option)
      ? config.fairnessAttributes.filter(o => o !== option)
      : config.fairnessAttributes.length < 3
        ? [...config.fairnessAttributes, option]
        : config.fairnessAttributes;

    setConfig({ ...config, fairnessAttributes: newSelected });
  };

  const displayedOptions = showMore ? config.fairnessAttributes : config.fairnessAttributes.slice(0, 3);
  const remainingCount = config.fairnessAttributes.length - 3;

  const availableOptions = allOptions.filter(option => !config.fairnessAttributes.includes(option));

  return (
    <Section title="Fairness Attribute" className="!bg-gray-50 p-6 rounded-lg border border-gray-200">
      <div className="space-y-3">
        <div className="relative">
          <select
            disabled={readonly || config.fairnessAttributes.length >= 3 || allOptions.length === 0}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${readonly || config.fairnessAttributes.length >= 3 || allOptions.length === 0
                ? 'cursor-not-allowed opacity-50 bg-gray-50'
                : ''
              }`}
            value=""
            onChange={(e) => {
              if (e.target.value) toggleOption(e.target.value);
            }}
          >
            {allOptions.length === 0 ? (
              <option value="">No columns available</option>
            ) : (
              <option value="">
                {config.fairnessAttributes.length >= 3
                  ? "Maximum selection reached"
                  : `${config.fairnessAttributes.length}/3 Options Selected`}
              </option>
            )}

            {availableOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {config.fairnessAttributes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {displayedOptions.map(option => (
              <span
                key={option}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 text-gray-700 text-sm rounded-md"
              >
                {option}
                <button
                  disabled={readonly}
                  onClick={() => toggleOption(option)}
                  className={`ml-1 ${readonly ? 'cursor-not-allowed' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
};

function ModelGenesis() {
  const hostnameAI = window._env_?.VITE_AI_API;
  const location = useLocation();
  const mode = location.state?.mode ?? 'edit';
  const readonly = mode === 'view';

  const { datasetState, updateWorkflowStage } = useAIPlayground();

  const [config, setConfig] = useState({
    dataPreprocessing: 'Manual',
    modelSelection: 'Manual',
    notebookMode: false,

    predictionType: 'Supervised',
    classification: 'Multiclass',
    targetFeature: '',

    trainSplit: 70,
    testSplit: 30,

    fairnessAttributes: []
  });

  const [isValidated, setIsValidated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleValidate = () => {
    if (readonly) return;
    setIsValidated(!isValidated);
  };

  const handleNextClick = async () => {
    if (readonly || !isValidated) return false;

    setIsSubmitting(true);

    try {
      const trainSize = config.trainSplit / 100;
      const testSize = config.testSplit / 100;

      const sum = trainSize + testSize;
      if (Math.abs(sum - 1.0) > 0.01) {
        toast.error('Traina and Test splits must equal 100%', {
          duration: 4000,
          position: 'top-right',
        });
        setIsSubmitting(false);
        return false;
      }

      const payload = {
        session_id: datasetState.sessionId,
        test_size: testSize,
        train_size: trainSize,
        random_state: 42,
        fairness_columns: config.fairnessAttributes,
        data_preprocessing_mode: config.dataPreprocessing,
        model_mode: config.modelSelection
      };

      const response = await fetch(`${hostnameAI}/data/genesis`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();

        updateWorkflowStage('modelGenesis', {
          config: {
            ...config,
            trainSize,
            testSize
          },
          apiResponse: data
        });

        toast.success('Model genesis completed successfully!', {
          duration: 3000,
          position: 'top-right',
        });

        return true;

      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to complete model genesis. Please try again.', {
          duration: 4000,
          position: 'top-right',
        });
        return false;
      }
    } catch (error) {
      console.error('Model genesis error:', error);
      toast.error('Network error occurred. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AIPlaygroundLayout
      isNextDisabled={!isValidated || isSubmitting}
      onNextClick={handleNextClick}
    >
      <div className="space-y-6">
        <ModeSelection config={config} setConfig={setConfig} readonly={readonly} />

        <PredictionType
          config={config}
          setConfig={setConfig}
          isValidated={isValidated}
          onValidate={handleValidate}
          readonly={readonly}
          columnNames={datasetState.columnNames}
        />

        <SplitSetting config={config} setConfig={setConfig} readonly={readonly} />

        <FairnessAttribute
          config={config}
          setConfig={setConfig}
          readonly={readonly}
          columnNames={datasetState.columnNames}
        />
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 2px solid currentColor;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 2px solid currentColor;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>
    </AIPlaygroundLayout>
  );
}

export default ModelGenesis;