import React, { createContext, useContext, useState, useCallback } from "react";
import PropTypes from "prop-types";

const PlatformContext = createContext(null);

export function PlatformProvider({ children }) {

const [CDCData, setCDCData]= useState([])

  return (
    <PlatformContext.Provider value={{CDCData, setCDCData }}>
      {children}
    </PlatformContext.Provider>
  );
}

PlatformProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error("usePlatform must be used within a PlatformProvider");
  }
  return context;
};
