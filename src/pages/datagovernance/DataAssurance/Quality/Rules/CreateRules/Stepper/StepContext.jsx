import React, { createContext, useContext, useState } from 'react';

const StepContext = createContext();

export function StepProvider({ children }) {
  const [stepData, setStepData] = useState({});
  const resetStepData = () => setStepData({});
  return (
    <StepContext.Provider value={{ stepData, setStepData, resetStepData }}>
      {children}
    </StepContext.Provider>
  );
}

export function useStepData() {
  return useContext(StepContext);
}
