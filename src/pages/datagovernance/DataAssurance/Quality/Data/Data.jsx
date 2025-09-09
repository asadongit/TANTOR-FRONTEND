import React, { useState, useCallback } from 'react';
import Breadcrumb from '../../../../../components/Breadcrumb';
import Dataset from './Components/Dataset';
import Quality from './Components/Quality';
import Profiling from './Components/Profiling';
import Cleaning, { initialFormData } from './Components/Cleaning';

function Data() {
  const [activeStep, setActiveStep] = useState(0);
  const [query, setQuery] = useState('');
  const [isQuerySuccess, setIsQuerySuccess] = useState(false);
  const [isProfilingSuccess, setProfilingSuccess] = useState(true);
  const [cleaningFormState, setCleaningFormState] = useState(initialFormData);

  const handleSetQuery = useCallback((newQuery) => {
    setQuery(newQuery);
  }, []);

  const handleSetQuerySuccess = useCallback((success) => {
    setIsQuerySuccess(success);
  }, []);

  const steps = [
    {
      label: 'Dataset',
      component: Dataset,
      props: { query, setQuery: handleSetQuery, setQuerySuccess: handleSetQuerySuccess, setFormData: setCleaningFormState},
    },
    { label: 'Quality', component: Quality, props: { query } },
    { label: 'Profiling', component: Profiling, props: { query, setProfilingSuccess } },
    {
      label: 'Cleaning', component: Cleaning, props: {
        query,
        formData: cleaningFormState,
        setFormData: setCleaningFormState,
      }
    },
  ];

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrev = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const CurrentComponent = steps[activeStep].component;
  const currentComponentProps = steps[activeStep].props;

  return (
    <div className="p-0 h-full bg-[#f9f9f9]">
      <Breadcrumb />

      <div className="pb-4 px-5">
        <div className="flex gap-[35px]">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`py-2 px-16 rounded-[50px] bg-white border text-sm cursor-pointer transition-all duration-200
              ${index === activeStep
                  ? 'border-[#8d77ba] text-[#8d77ba] font-medium shadow-sm'
                  : 'border-[#e0e0e0] text-[#666]'}`}
            // onClick={() => setActiveStep(index)}
            >
              {step.label}
            </div>
          ))}
        </div>
      </div>

      <div className="px-5">
        <CurrentComponent {...currentComponentProps} />
      </div>

      <div className="flex justify-end gap-3 mt-2">
        {activeStep > 0 && (
          <button
            className="py-1.5 px-4 bg-transparent border border-[#8d77ba] text-[#8d77ba] rounded hover:bg-[#8d77ba10] transition-all duration-200"
            onClick={handlePrev}
          >
            Previous
          </button>
        )}
        {activeStep < steps.length - 1 && (
          <button
            className={`py-1.5 px-7 border border-[#8d77ba] rounded transition-all duration-200 ${(activeStep === 0 && !isQuerySuccess) || (activeStep === 2 && !isProfilingSuccess)
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-[#8d77ba] text-white hover:bg-[#7d69a8]'
              }`}
            onClick={handleNext}
            disabled={(activeStep === 0 && !isQuerySuccess) || (activeStep === 2 && !isProfilingSuccess)}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

export default Data;