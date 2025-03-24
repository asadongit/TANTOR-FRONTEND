import { createContext, useContext, useState } from 'react';

const DrawerContext = createContext();

export const DrawerProvider = ({ children }) => {
  const [drawerStates, setDrawerStates] = useState({
    migration: { isOpen: false, selectedTable: null, nodeId: null, pipelineId: null, drawerType: "",data: null },
    cdc: { isOpen: false, selectedTable: null, nodeId: null, pipelineId: null, drawerType: "",data: null }
  });
  
  const openDrawer = (canvasType,drawerType, nodeId, pipelineId, data=null ) => {
    setDrawerStates((prev) => ({
      ...prev,
      [canvasType]: { isOpen: true,  nodeId:nodeId, pipelineId:pipelineId, drawerType:drawerType, data }
    }));
  };
  
  const closeDrawer = (canvasType) => {
    setDrawerStates((prev) => ({
      ...prev,
      [canvasType]: { isOpen: false, nodeId: null, pipelineId: null, drawerType: "", data:null }
    }));
  };
  

  return (
    <DrawerContext.Provider value={{ drawerStates, openDrawer, closeDrawer }}>
      {children}
    </DrawerContext.Provider>
  );
};

export const useDrawerContext = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawerContext must be used within a TableProvider');
  }
  return context;
};
