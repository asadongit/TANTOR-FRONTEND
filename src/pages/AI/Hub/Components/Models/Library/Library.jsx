import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, LayoutDashboard } from 'lucide-react';
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
  Observability
} from './Tabs';
import { useAuth } from '../../../../../../context/AuthContext';

function Library() {
  const location = useLocation();
  const navigate = useNavigate();
  const { modelId } = useParams();
  const rawModelData = location.state?.modelData;
  const { token } = useAuth();
  const hostnameAI = window._env_?.VITE_AI_API;

  const [modelData, setModelData] = useState(rawModelData || null);
  const [isLoading, setIsLoading] = useState(!modelData);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!modelData && modelId) {
      const fetchModelData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`${hostnameAI}/canvas/model_list?model_id=${encodeURIComponent(modelId)}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            throw new Error('Failed to fetch model data');
          }
          const data = await response.json();
          // Handle different response formats
          const model = (Array.isArray(data) ? data[0] : data?.data?.[0] || data?.model || data) || null;
          if (model) {
            setModelData(model);
          } else {
            throw new Error('Model not found');
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchModelData();
    }
  }, [modelData, modelId, hostnameAI, token]);

  const processedModelData = useMemo(() => {
    if (!modelData) return null;

    return {
      ...modelData,
      name: modelData.name ?? modelData.run_name ?? '',
      run_name: modelData.run_name ?? modelData.name ?? '',
      description: modelData.description ?? '',
      created_date: modelData.created_date ?? modelData.createdDate ?? '',
      createdDate: modelData.createdDate ?? modelData.created_date ?? '',
      type: modelData.type ?? '',
      status: modelData.status ?? '',
      id: modelData.id,
    };
  }, [modelData]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const tabs = [
    { name: 'Overview', component: Overview },
    { name: 'Features', component: Features },
    // { name: 'Performance Timeline', component: PerformanceTimeline },
    { name: 'Parameters', component: Parameters },
    { name: 'XAI', component: XAI },
    { name: 'Comments', component: Comments },
    // { name: 'Access', component: Access },
    // { name: 'Quick Predict', component: QuickPredict },
    { name: 'Observability', component: Observability },
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
  const modelName =
    (processedModelData?.name || processedModelData?.run_name || '')
      ?.replace('Project - ', '') || 'Model';

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8e78b7] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading model...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <button
              onClick={() => navigate('/ai/hub/models')}
              className="px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a5fa8] transition-colors"
            >
              Back to Models
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!processedModelData) {
    return (
      <div className="p-6 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Model not found</p>
            <button
              onClick={() => navigate('/ai/hub/models')}
              className="px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a5fa8] transition-colors"
            >
              Back to Models
            </button>
          </div>
        </div>
      </div>
    );
  }

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

        </div>

        <div className="mt-4 border-t border-gray-200 pt-4">
          <nav className="flex gap-6">
            {tabs.map((tab, index) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(index)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${activeTab === index
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
        <ActiveTabComponent modelData={processedModelData} />
      </div>


    </div>
  );
}

export default Library;