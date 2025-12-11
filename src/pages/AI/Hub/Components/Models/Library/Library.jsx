import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Icon } from '@iconify-icon/react';
import {
  Overview,
  Features,
  PerformanceTimeline,
  Parameters,
  XAI,
  Comments,
  Access,
  QuickPredict,
} from './Tabs';

function Library() {
  const location = useLocation();
  const navigate = useNavigate();
  const modelData = location.state?.modelData;

  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { name: 'Overview', component: Overview },
    { name: 'Features', component: Features },
    { name: 'Performance Timeline', component: PerformanceTimeline },
    { name: 'Parameters', component: Parameters },
    { name: 'XAI', component: XAI },
    { name: 'Comments', component: Comments },
    { name: 'Access', component: Access },
    { name: 'Quick Predict', component: QuickPredict },
  ];

  const handleBack = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    } else {
      navigate(-1);
    }
  };

  const handleNext = () => {
    if (activeTab < tabs.length - 1) {
      setActiveTab(activeTab + 1);
    }
  };

  const ActiveTabComponent = tabs[activeTab].component;
  const modelName = modelData?.name?.replace('Project - ', '') || 'Churn';

  return (
    <div className="p-6 space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold">
              Model Library - <span className="text-purple-600">{modelName}</span>
            </h1>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200">
            <Icon icon="mdi:cloud-outline" className="w-5 h-5" />
            <span className="font-medium">AI/ML</span>
          </button>
        </div>

        <div className="mt-4 border-t border-gray-200 pt-4">
          <nav className="flex gap-6">
            {tabs.map((tab, index) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(index)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === index
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ActiveTabComponent modelData={modelData} />
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          onClick={handleBack}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={activeTab === tabs.length - 1}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Library;