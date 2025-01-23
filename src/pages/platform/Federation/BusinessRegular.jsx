/*eslint-disable*/
import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import {BusinessSidebar } from '../../../components/BusinessSidebar';
import { FlowCanvas } from '../../../components/FlowCanvas';
import { DrawerProvider } from '../../../context/DrawerContext';

function BusinessRegular() {
  return (
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
  );
}

export default BusinessRegular;