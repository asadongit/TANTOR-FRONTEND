import React, { useState } from 'react';
import { AIPlaygroundLayout } from '../AIPlaygroundLayout';

const RadioButton = ({ label, checked, onChange, name }) => (
  <label className="flex items-center gap-2 cursor-pointer group">
    <div className="relative">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
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
  <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
);

const NotebookModeModal = ({ isOpen, onCancel, onContinue }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onCancel}></div>

      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Switch to Notebook Mode?
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            In Notebook mode, all pipeline setup and execution must be done through code instead of the visual workflow.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">
            Do you want to continue?
          </p>
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

const ModeSelection = ({ config, setConfig }) => {
  const [showModal, setShowModal] = useState(false);
  const [pendingNotebookState, setPendingNotebookState] = useState(false);

  const handleNotebookToggle = (checked) => {
    if (checked) {
      setPendingNotebookState(true);
      setShowModal(true);
    } else {
      setConfig({ ...config, notebookMode: false });
    }
  };

  const handleModalContinue = () => {
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
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_1fr] bg-gray-50 border-b border-gray-200">
              <div className="px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">
                Feature Type
              </div>
              <div className="px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">
                Auto
              </div>
              <div className="px-4 py-3 text-sm font-medium text-gray-700">
                Manual
              </div>
            </div>

            <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-gray-200">
              <div className="px-4 bg-gray-50 py-4 text-sm text-gray-700 border-r border-gray-200 flex items-center">
                Data Pre-processing
              </div>
              <div className="px-4 py-4 flex flex-col gap-2 border-r border-gray-200">
                <RadioButton
                  label="Swift"
                  checked={config.dataPreprocessing === 'Swift'}
                  onChange={() => setConfig({ ...config, dataPreprocessing: 'Swift' })}
                  name="dataPreprocessing-auto"
                />
                <RadioButton
                  label="Standard"
                  checked={config.dataPreprocessing === 'Standard'}
                  onChange={() => setConfig({ ...config, dataPreprocessing: 'Standard' })}
                  name="dataPreprocessing-auto"
                />
                <RadioButton
                  label="Comprehensive"
                  checked={config.dataPreprocessing === 'Comprehensive'}
                  onChange={() => setConfig({ ...config, dataPreprocessing: 'Comprehensive' })}
                  name="dataPreprocessing-auto"
                />
              </div>
              <div className="px-4 py-4 flex items-center">
                <RadioButton
                  label="Manual"
                  checked={config.dataPreprocessing === 'Manual'}
                  onChange={() => setConfig({ ...config, dataPreprocessing: 'Manual' })}
                  name="dataPreprocessing-manual"
                />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_1fr_1fr]">
              <div className="px-4 bg-gray-50 py-4 text-sm text-gray-700 border-r border-gray-200 flex items-center">
                Example detail seven
              </div>
              <div className="px-4 py-4 flex flex-col gap-2 border-r border-gray-200">
                <RadioButton
                  label="Swift"
                  checked={config.exampleDetail === 'Swift'}
                  onChange={() => setConfig({ ...config, exampleDetail: 'Swift' })}
                  name="exampleDetail-auto"
                />
                <RadioButton
                  label="Standard"
                  checked={config.exampleDetail === 'Standard'}
                  onChange={() => setConfig({ ...config, exampleDetail: 'Standard' })}
                  name="exampleDetail-auto"
                />
                <RadioButton
                  label="Comprehensive"
                  checked={config.exampleDetail === 'Comprehensive'}
                  onChange={() => setConfig({ ...config, exampleDetail: 'Comprehensive' })}
                  name="exampleDetail-auto"
                />
              </div>
              <div className="px-4 py-4 flex items-center">
                <RadioButton
                  label="Manual"
                  checked={config.exampleDetail === 'Manual'}
                  onChange={() => setConfig({ ...config, exampleDetail: 'Manual' })}
                  name="exampleDetail-manual"
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
            <div className="border border-gray-200 rounded-lg p-5 w-full bg-gray-50">
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-4">Notebook Mode</div>
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
                  <span className="text-sm text-gray-700">Notebook</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.notebookMode}
                      onChange={(e) => handleNotebookToggle(e.target.checked)}
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
      />
    </>
  );
};

const PredictionType = ({ config, setConfig, isValidated, onValidate }) => {
  const tabs = ['Supervised', 'Unsupervised', 'Time Series', 'Anomaly Detection'];

  const handleValidate = () => {
    if (config.classification && config.targetFeature) {
      onValidate();
    }
  };

  const isValidateDisabled = !config.classification || !config.targetFeature;

  return (
    <Section title="Prediction Type" className="bg-gray-50">
      <div className="flex gap-1 border-b border-gray-300 mb-6 -mx-6 px-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setConfig({ ...config, predictionType: tab })}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${config.predictionType === tab
                ? 'text-[#8e78b7] bg-white'
                : 'text-gray-600 hover:text-gray-900'
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
        <div className="bg-white border border-gray-200 rounded-lg p-6 -mx-6 mx-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-5">Supervised Learning Configuration</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Classification</label>
              <div className="space-y-2.5">
                <RadioButton
                  label="Binary"
                  checked={config.classification === 'Binary'}
                  onChange={() => setConfig({ ...config, classification: 'Binary' })}
                  name="classification"
                />
                <RadioButton
                  label="Multiclass"
                  checked={config.classification === 'Multiclass'}
                  onChange={() => setConfig({ ...config, classification: 'Multiclass' })}
                  name="classification"
                />
                <RadioButton
                  label="Regression"
                  checked={config.classification === 'Regression'}
                  onChange={() => setConfig({ ...config, classification: 'Regression' })}
                  name="classification"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Target Feature</label>
              <div className="relative">
                <select
                  value={config.targetFeature}
                  onChange={(e) => setConfig({ ...config, targetFeature: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Select</option>
                  <option value="feature1">Feature 1</option>
                  <option value="feature2">Feature 2</option>
                  <option value="feature3">Feature 3</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleValidate}
              disabled={isValidateDisabled || isValidated}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                isValidated
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : isValidateDisabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#8e78b7] text-white hover:bg-[#7d67a6]'
              }`}
            >
              {isValidated ? 'Validated ✓' : 'Validate'}
            </button>
          </div>
        </div>
      )}
    </Section>
  );
};

const SplitSetting = ({ config, setConfig }) => {
  const handleSliderChange = (type, value) => {
    const newConfig = { ...config };
    const total = 100;

    if (type === 'train') {
      newConfig.trainSplit = value;
      const remaining = total - value;
      const currentTestValidationSum = config.testSplit + config.validationSplit;
      if (currentTestValidationSum > 0) {
        const testRatio = config.testSplit / currentTestValidationSum;
        newConfig.testSplit = Math.round(remaining * testRatio);
        newConfig.validationSplit = remaining - newConfig.testSplit;
      } else {
        newConfig.testSplit = Math.round(remaining / 2);
        newConfig.validationSplit = remaining - newConfig.testSplit;
      }
    } else if (type === 'test') {
      const maxTest = total - config.trainSplit;
      const constrainedValue = Math.min(value, maxTest);
      newConfig.testSplit = constrainedValue;
      newConfig.validationSplit = total - config.trainSplit - constrainedValue;
    } else if (type === 'validation') {
      const maxValidation = total - config.trainSplit;
      const constrainedValue = Math.min(value, maxValidation);
      newConfig.validationSplit = constrainedValue;
      newConfig.testSplit = total - config.trainSplit - constrainedValue;
    }

    setConfig(newConfig);
  };

  return (
    <Section title="Split Setting">
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Split</span>
            <span className="text-sm text-gray-600">Total: 100%</span>
          </div>

          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${config.trainSplit}%` }}
              className="bg-[#8e78b7] h-full"
            />
            <div
              style={{ width: `${config.testSplit}%` }}
              className="bg-orange-400 h-full"
            />
            <div
              style={{ width: `${config.validationSplit}%` }}
              className="bg-teal-500 h-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
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
                onChange={(e) => handleSliderChange('train', parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
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
                onChange={(e) => handleSliderChange('test', parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #fc842eff 0%, #fc842eff ${config.testSplit}%, #e5e7eb ${config.testSplit}%, #e5e7eb 100%)`
                }}
              />
              <span className="text-sm text-gray-600 w-10 text-right">{config.testSplit}%</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Validation</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={config.validationSplit}
                onChange={(e) => handleSliderChange('validation', parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${config.validationSplit}%, #e5e7eb ${config.validationSplit}%, #e5e7eb 100%)`
                }}
              />
              <span className="text-sm text-gray-600 w-10 text-right">{config.validationSplit}%</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-[#8e78b7] rounded-md p-2">
          <p className="text-sm ">
            <span className="font-medium text-[#8e78b7]">Note:</span> To proceed, make sure the Train, Test, and Validation percentages together equal 100%. You can adjust the sliders to balance the data as needed.
          </p>
        </div>
      </div>
    </Section>
  );
};

const FairnessAttribute = ({ config, setConfig }) => {
  const [showMore, setShowMore] = useState(false);
  
  const allOptions = [
    'Option 1', 'Option 2', 'Option 3', 'Option 4',
    'Option 5', 'Option 6', 'Option 7', 'Option 8', 'Option 9', 'Option 10', 'Option 12', 'Option 13', 'Option 14',
    'Option 15', 'Option 16', 'Option 17', 'Option 18', 'Option 19'
  ];

  const toggleOption = (option) => {
    const newSelected = config.fairnessAttributes.includes(option)
      ? config.fairnessAttributes.filter(o => o !== option)
      : [...config.fairnessAttributes, option];
    setConfig({ ...config, fairnessAttributes: newSelected });
  };

  const displayedOptions = showMore ? config.fairnessAttributes : config.fairnessAttributes.slice(0, 8);
  const remainingCount = config.fairnessAttributes.length - 8;

  return (
    <Section title="Fairness Attribute">
      <div className="space-y-3">
        <div className="relative">
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            value=""
            onChange={(e) => {
              if (e.target.value) toggleOption(e.target.value);
            }}
          >
            <option value="">{config.fairnessAttributes.length} Options Selected</option>
            {allOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {displayedOptions.map(option => (
            <span
              key={option}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md"
            >
              {option}
              <button
                onClick={() => toggleOption(option)}
                className="ml-1 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          {!showMore && remainingCount > 0 && (
            <button 
              onClick={() => setShowMore(true)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
            >
              +{remainingCount} More
            </button>
          )}
          {showMore && config.fairnessAttributes.length > 8 && (
            <button 
              onClick={() => setShowMore(false)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
            >
              Show Less
            </button>
          )}
        </div>
      </div>
    </Section>
  );
};

function ModelGenesis() {
  const [config, setConfig] = useState({
    dataPreprocessing: 'Standard',
    exampleDetail: 'Manual',
    notebookMode: false,

    predictionType: 'Supervised',
    classification: 'Multiclass',
    targetFeature: '',

    trainSplit: 70,
    testSplit: 20,
    validationSplit: 10,

    fairnessAttributes: ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5', 'Option 6', 'Option 7', 'Option 8', 'Option 9', 'Option 10', 'Option 12', 'Option 13', 'Option 14']
  });

  const [isValidated, setIsValidated] = useState(false);

  const handleValidate = () => {
    setIsValidated(true);
  };

  return (
    <AIPlaygroundLayout isNextDisabled={!isValidated}>
      <div className="space-y-6">
        <ModeSelection config={config} setConfig={setConfig} />
        <PredictionType 
          config={config} 
          setConfig={setConfig}
          isValidated={isValidated}
          onValidate={handleValidate}
        />
        <SplitSetting config={config} setConfig={setConfig} />
        <FairnessAttribute config={config} setConfig={setConfig} />
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