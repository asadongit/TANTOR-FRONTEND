// contexts/TableContext.jsx
import { createContext, useContext, useState } from 'react';

const TableContext = createContext();

export const TableProvider = ({ children }) => {
  const [drawerState, setDrawerState] = useState({
    isOpen: false,
    selectedTable: null,
    nodeId: null
  });

  const openDrawer = (nodeId, table) => {
    setDrawerState({
      isOpen: true,
      selectedTable: table,
      nodeId: nodeId
    });
  };

  const closeDrawer = () => {
    setDrawerState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <TableContext.Provider value={{ drawerState, openDrawer, closeDrawer }}>
      {children}
    </TableContext.Provider>
  );
};

export const useTableContext = () => {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error('useTableContext must be used within a TableProvider');
  }
  return context;
};