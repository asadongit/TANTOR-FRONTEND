import React, { useState, useCallback } from 'react'; // Import useCallback
import Breadcrumb from '../../../../../components/Breadcrumb';
import Dataset from './Components/Dataset';
import Quality from './Components/Quality';
import Profiling from './Components/Profiling';
import Cleaning from './Components/Cleaning';

const MemoizedProfiling = React.memo(Profiling);
const MemoizedCleaning = React.memo(Cleaning);

function Data() {
  const [activeStep, setActiveStep] = useState(0);
  const [query, setQuery] = useState(''); 

  const handleSetQuery = useCallback((newQuery) => {
    setQuery(newQuery);
  }, []); 
  const steps = [
    { label: 'Dataset', component: Dataset, props: { query: query,setQuery: handleSetQuery } },
    { label: 'Quality', component: Quality, props: { query: query } }, 
    { label: 'Profiling', component: MemoizedProfiling, props: {} }, 
    { label: 'Cleaning', component: MemoizedCleaning, props: {} }
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
            className="py-1.5 px-5 bg-[#8d77ba] text-white border border-[#8d77ba] rounded hover:bg-[#7d69a8] transition-all duration-200"
            onClick={handleNext}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

export default Data;