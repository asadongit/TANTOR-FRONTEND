/*eslint-disable*/
import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import {BusinessSidebar } from '../../../components/BusinessSidebar';
import { FlowCanvas } from '../../../components/FlowCanvas';
import { DrawerProvider } from '../../../context/DrawerContext';
import { ThemeProvider } from '../../../context/ThemeContext';


function BusinessRegular() {
  return (
    <ThemeProvider>
      <DrawerProvider>
          <div className="flex h-screen bg-gray-50 text-gray-100">
            <BusinessSidebar />
            <div className="flex-1">
              <ReactFlowProvider>
                <FlowCanvas />
              </ReactFlowProvider>
            </div>
          </div>
      </DrawerProvider>
    </ThemeProvider>
  );
}

export default BusinessRegular;