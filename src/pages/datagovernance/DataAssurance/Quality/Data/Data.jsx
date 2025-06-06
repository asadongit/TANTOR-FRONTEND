import React, { useState } from 'react'
import Breadcrumb from '../../../../../components/Breadcrumb'
import Dataset from './Components/Dataset'
import Quality from './Components/Quality'
import Profiling from './Components/Profiling'
import Cleaning from './Components/Cleaning'

function Data() {
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    { label: 'Dataset', component: Dataset },
    { label: 'Quality', component: Quality },
    { label: 'Profiling', component: Profiling },
    { label: 'Cleaning', component: Cleaning }
  ]

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1)
    }
  }

  const handlePrev = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1)
    }
  }

  const CurrentComponent = steps[activeStep].component

  return (
    <div className="p-0 pb-5 min-h-screen bg-[#f9f9f9]">
      <Breadcrumb />

      <div className="py-[15px] px-5">
        <div className="flex gap-[10px]">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`py-2 px-6 rounded-[50px] bg-white border text-sm cursor-pointer transition-all duration-200
              ${index === activeStep
                ? 'border-[#8d77ba] text-[#8d77ba] font-medium shadow-sm'
                : 'border-[#e0e0e0] text-[#666]'}`}
              onClick={() => setActiveStep(index)}
            >
              {step.label}
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mb-5">
        <h2 className="text-2xl font-semibold text-[#333] m-0">{steps[activeStep].label}</h2>
      </div>

      <div className="px-5">
        <CurrentComponent />
      </div>

      <div className="flex justify-end gap-3 p-5 mt-5">
        {activeStep > 0 && (
          <button
            className="py-2 px-4 bg-transparent border border-[#8d77ba] text-[#8d77ba] rounded hover:bg-[#8d77ba10] transition-all duration-200"
            onClick={handlePrev}
          >
            Previous
          </button>
        )}
        {activeStep < steps.length - 1 && (
          <button
            className="py-2 px-4 bg-[#8d77ba] text-white border border-[#8d77ba] rounded hover:bg-[#7d69a8] transition-all duration-200"
            onClick={handleNext}
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}

export default Data