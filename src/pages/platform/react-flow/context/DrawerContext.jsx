import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

const DrawerContext = createContext(null);

export function DrawerProvider({ children }) {
  const [drawer, setDrawer] = useState({
    isOpen: false,
    type: null,
    props: null
  });

  const openDrawer = useCallback((type, props) => {
    setDrawer({
      isOpen: true,
      type,
      props
    });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer({
      isOpen: false,
      type: null,
      props: null
    });
  }, []);

  return (
    <DrawerContext.Provider value={{ drawer, openDrawer, closeDrawer }}>
      {children}
    </DrawerContext.Provider>
  );
}

DrawerProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  return context;
};