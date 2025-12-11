import React, { useState } from 'react';
import {
  Upload,
  Boxes,
  SlidersHorizontal,
  ListChecks,
  BrainCircuit,
  Rocket,
  Lightbulb,
  Sparkles,
  BarChart3,
  Activity
} from 'lucide-react';

const workflowStages = [
  { id: 'data-ingestion', label: 'Data Ingestion', icon: Upload },
  { id: 'model-genesis', label: 'Model Genesis', icon: Boxes },
  { id: 'data-preprocessing', label: 'Data Pre-Processing', icon: SlidersHorizontal },
  { id: 'model-selection', label: 'Model Selection', icon: ListChecks },
  { id: 'model-inferencing', label: 'Model Inferencing', icon: BrainCircuit },
  { id: 'model-deployment', label: 'Model Deployment', icon: Rocket },
  { id: 'xai', label: 'XAI', icon: Lightbulb },
  { id: 'gen-ai', label: 'Gen AI', icon: Sparkles },
  { id: 'business-analysis', label: 'Business Analysis', icon: BarChart3 },
  { id: 'model-observability', label: 'Model Observability', icon: Activity },
];

function AIPlaygroundDashboard() {
  const [selectedStage, setSelectedStage] = useState('data-ingestion');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-gray-100 flex items-center justify-center p-10">
      <div className="text-center max-w-4xl w-full">
        <h1 className="text-3xl font-semibold text-gray-900 mb-3">
          Start Your <span className="text-purple-600">AI Workflow</span>
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          Select a workflow stage to configure data, train models, and deploy intelligent solutions.
        </p>

        <div className="grid grid-cols-5 gap-4">
          {workflowStages.map((stage) => {
            const IconComponent = stage.icon;
            const isSelected = selectedStage === stage.id;
            return (
              <button
                key={stage.id}
                className={`bg-white rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200 shadow-sm border-2 ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50/30'
                    : 'border-transparent hover:border-purple-200 hover:shadow-md'
                }`}
                onClick={() => setSelectedStage(stage.id)}
              >
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    isSelected
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <IconComponent size={24} />
                </div>
                <span className="text-sm font-medium text-gray-600">{stage.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AIPlaygroundDashboard;