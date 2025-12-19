import React, { useState } from 'react';
import { 
  Network, 
  Bot, 
  BarChart3, 
  Activity, 
  Upload, 
  Database 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AIPlayground = () => {
  const [selectedExperiment, setSelectedExperiment] = useState('');
  const navigate = useNavigate();

  const experimentOptions = [
    { value: '', label: 'Select' },
    { value: 'exp1', label: 'Experiment 1' },
    { value: 'exp2', label: 'Experiment 2' },
  ];

  const capabilities = [
    {
      title: 'Build Machine Learning',
      desc: 'Design, train, and deploy machine learning models using your injected dataset.',
      icon: <Network className="w-5 h-5 text-cyan-500" />,
      bgColor: 'bg-cyan-50',
      path: '/ai/playground/model-genesis'
    },
    {
      title: 'GenAI',
      desc: 'Build generative AI workflows powered by your data and models.',
      icon: <Bot className="w-5 h-5 text-orange-400" />,
      bgColor: 'bg-orange-50',
      path: '/ai/playground/gen-ai'
    },
    {
      title: 'Business Analysis',
      desc: 'Explore trends, patterns, and insights to support business decisions.',
      icon: <BarChart3 className="w-5 h-5 text-purple-500" />,
      bgColor: 'bg-purple-50',
      path: '/ai/playground/business-analysis'
    },
    {
      title: 'Model Observability',
      desc: 'Monitor model performance, behavior, and drift in production.',
      icon: <Activity className="w-5 h-5 text-green-500" />,
      bgColor: 'bg-green-50',
      path: '/ai/playground/model-observability'
    }
  ];

  const isDisabled = !selectedExperiment;

    const handleCapabilityClick = (path) => {
    if (!isDisabled) {
      navigate(path);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] p-6 font-sans text-slate-900">
      <div className="">
        <h1 className="text-2xl font-bold mb-4">AI playground</h1>
        
        <div className="mb-8">
          <h2 className="text-base font-semibold mb-2">Inject Your Data to Get Started</h2>
          <p className="text-sm text-slate-500 max-w-3xl">
            Select an experiment and upload a dataset—or fetch data from views—to begin machine learning, GenAI, analytics, and observability workflows.
          </p>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <label className="text-sm font-medium min-w-[140px]">Experiment Name</label>
          <select
            value={selectedExperiment}
            onChange={(e) => setSelectedExperiment(e.target.value)}
            className="w-64 h-10 px-3 rounded-md border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
          >
            {experimentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-stretch mb-8">
          {/* Upload Box */}
          <div className={`border-2 border-dashed border-slate-200 rounded-xl p-8 text-center transition-opacity ${isDisabled ? 'opacity-50 bg-slate-50' : 'bg-white shadow-sm'}`}>
            <div className="flex justify-center mb-4 text-slate-400">
              <Upload size={24} />
            </div>
            <div className="text-sm font-medium text-slate-500 mb-1">Drag & Drop or Choose file to Upload</div>
            <div className="text-xs text-slate-400 mb-6">Supported: Pdf, XL, XLSX | Max size: 25 MB</div>
            <button
              disabled={isDisabled}
              className="px-6 py-2 bg-violet-50 text-violet-600 border border-violet-100 rounded-md text-sm font-semibold hover:bg-violet-100 disabled:cursor-not-allowed transition-colors"
            >
              Upload
            </button>
          </div>

          <div className="hidden md:block w-px bg-slate-200 self-stretch" />

          <div className={`border border-slate-200 rounded-xl p-8 text-center transition-opacity ${isDisabled ? 'opacity-50 bg-slate-50' : 'bg-white shadow-sm'}`}>
            <div className="flex justify-center mb-4 text-slate-400">
              <Database size={24} />
            </div>
            <div className="text-sm font-medium text-slate-500 mb-1">Fetch Data from Views</div>
            <div className="text-xs text-slate-400 mb-6">Load data directly from available database views.</div>
            <button
              disabled={isDisabled}
              className="px-6 py-2 bg-violet-50 text-violet-600 border border-violet-100 rounded-md text-sm font-semibold hover:bg-violet-100 disabled:cursor-not-allowed transition-colors"
            >
              Fetch Data
            </button>
          </div>
        </div>

        <div className="mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {capabilities.map((cap, idx) => (
              <div 
                key={idx} 
                onClick={() => handleCapabilityClick(cap.path)}
                className={`bg-white border border-slate-200 p-5 rounded-lg shadow-sm transition-all ${
                  !isDisabled 
                    ? 'hover:shadow-md hover:border-violet-300 cursor-pointer hover:scale-105' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div className={`w-10 h-10 ${cap.bgColor} rounded-md flex items-center justify-center mb-4`}>
                  {cap.icon}
                </div>
                <h3 className="text-[15px] font-bold text-slate-800 mb-2">{cap.title}</h3>
                <p className="text-xs leading-relaxed text-slate-400">
                  {cap.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPlayground;