/*eslint-disable*/
import React from 'react';
import { useDrawer } from '../context/DrawerContext';
import { ManualPrepDrawer } from './ManualPrepDrawer';

const DRAWER_COMPONENTS = {
  'manual-prep': ManualPrepDrawer
};

export function DrawerContainer() {
  const { drawer, closeDrawer } = useDrawer();
  
  if (!drawer.isOpen || !drawer.type) return null;
  
  const DrawerComponent = DRAWER_COMPONENTS[drawer.type];
  
  if (!DrawerComponent) {
    console.warn(`No drawer component found for type: ${drawer.type}`);
    return null;
  }

  return <DrawerComponent isOpen={true} onClose={closeDrawer} {...drawer.props} />;
}