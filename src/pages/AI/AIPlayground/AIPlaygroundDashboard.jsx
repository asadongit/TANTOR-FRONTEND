// AIPlayground.jsx
import React, { useState, useRef } from 'react';
import {
  Network,
  Bot,
  BarChart3,
  Activity,
  Upload,
  Database,
  ChevronDown,
  File,
  MoveRight,
  ChartColumnDecreasing,
  RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreateProjectModal } from './modals/Dashboard/CreateProjectModal';
import { DatasetDescriptionModal } from './modals/Dashboard/DatasetDescriptionModal';
import { SelectDataViewModal } from './modals/Dashboard/SelectDataViewModal';
import { ResetProjectModal } from './modals/Dashboard/ResetProjectModal';

// Import Modal Components
// import { CreateProjectModal, DatasetDescriptionModal, SelectDataViewModal, ResetProjectModal } from './modals/AIPlaygroundModal';


// Constants
const EXPERIMENT_OPTIONS = [
  { value: 'exp1', label: 'List 1' },
  { value: 'exp2', label: 'List 2' },
  { value: 'exp3', label: 'List 3' },
  { value: 'exp4', label: 'List 4' },
];

const OWNER_OPTIONS = [
  { value: 'abc', label: 'ABC' },
  { value: 'xyz', label: 'XYZ' },
];

const MEMBER_OPTIONS = [
  { value: 'member1', label: 'Member 1' },
  { value: 'member2', label: 'Member 2' },
];

const CAPABILITIES = [
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

const AIPlayground = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // State Management
  const [selectedExperiment, setSelectedExperiment] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [tempFile, setTempFile] = useState(null);

  // Modal States
  const [modals, setModals] = useState({
    createProject: false,
    datasetDescription: false,
    selectView: false,
    resetProject: false
  });

  // Helper Functions
  const toggleModal = (modalName, isOpen) => {
    setModals(prev => ({ ...prev, [modalName]: isOpen }));
  };

  const filteredOptions = EXPERIMENT_OPTIONS.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isDisabled = !selectedExperiment;

  // Event Handlers
  const handleSelectExperiment = (value) => {
    setSelectedExperiment(value);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleCreateProject = (formData) => {
    console.log('Creating project:', formData);
    // Add your project creation logic here
  };

  const validateFile = (file) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const validExtensions = ['.pdf', '.xls', '.xlsx'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      alert('Please upload a valid file (PDF, XLS, or XLSX)');
      return false;
    }

    if (file.size > 25 * 1024 * 1024) {
      alert('File size must be less than 25 MB');
      return false;
    }

    return true;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (validateFile(file)) {
      setTempFile(file);
      toggleModal('datasetDescription', true);
    }

    e.target.value = '';
  };

  const handleFetchData = () => {
    toggleModal('selectView', true);
  };

  const handleDataViewSelected = (viewData) => {
    setTempFile({
      name: viewData.label,
      type: 'database',
      viewId: viewData.value
    });
    toggleModal('datasetDescription', true);
  };

  const handleSaveDescription = (description) => {
    if (tempFile) {
      setUploadedFile({ ...tempFile, description });
      setTempFile(null);
    }
  };

  const handleSkipDescription = () => {
    if (tempFile) {
      setUploadedFile(tempFile);
      setTempFile(null);
    }
  };

  const handleConfirmReset = () => {
    setUploadedFile(null);
    setSelectedExperiment('');
    toggleModal('resetProject', false);
  };

  const handleCapabilityClick = (path) => {
    if (!isDisabled) {
      navigate(path);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] p-6 font-sans text-slate-900">
      <div className="">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">AI playground</h1>
        </div>

        {/* Initial Setup Section */}
        {!uploadedFile && (
          <>
            <div className="mb-8">
              <h2 className="text-base font-semibold mb-2">Inject Your Data to Get Started</h2>
              <p className="text-sm text-slate-500 max-w-3xl">
                Select an experiment and upload a dataset—or fetch data from views—to begin machine learning, GenAI, analytics, and observability workflows.
              </p>
            </div>

            {/* Project Selection Dropdown */}
            <div className="mb-8 relative">
              <label className="text-sm font-medium block mb-2">Project Name</label>
              <div className="relative w-80">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-left focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all flex items-center justify-between"
                >
                  <span className={selectedExperiment ? 'text-slate-900' : 'text-slate-400'}>
                    {selectedExperiment
                      ? EXPERIMENT_OPTIONS.find(opt => opt.value === selectedExperiment)?.label
                      : 'Select'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg z-10">
                    <div className="p-2 border-b border-slate-200">
                      <div className="relative">
                        <svg
                          className="w-4 h-4 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleSelectExperiment(opt.value)}
                          className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        toggleModal('createProject', true);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-[#8e78b7] hover:bg-violet-50 transition-colors border-t border-slate-200 flex items-center gap-2"
                    >
                      <span className="text-lg leading-none">+</span>
                      <span>Create</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Data Upload Section */}
            <div className="flex items-center gap-4 mb-8">
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept=".pdf,.xls,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Upload Box */}
              <div
                className={`flex-1 border-2 border-dashed border-slate-200 rounded-lg p-4 transition-opacity ${
                  isDisabled ? 'opacity-50 bg-slate-50' : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-700 mb-1">
                      Drag & Drop or Choose file to Upload
                    </div>
                    <div className="text-xs text-slate-400">
                      Supported: Pdf, XL, XLSX | Max size: 25 MB
                    </div>
                  </div>
                  <button
                    disabled={isDisabled}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2 bg-white text-[#8e78b7] border border-violet-200 rounded-md text-sm font-medium hover:bg-violet-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Upload size={16} />
                    Upload
                  </button>
                </div>
              </div>

              <div className="text-sm font-medium text-slate-400">OR</div>

              {/* Fetch Data Box */}
              <div
                className={`flex-1 border border-slate-200 rounded-lg p-4 transition-opacity ${
                  isDisabled ? 'opacity-50 bg-slate-50' : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-700 mb-1">
                      Fetch Data from Views
                    </div>
                    <div className="text-xs text-slate-400">
                      Load data directly from available database views.
                    </div>
                  </div>
                  <button
                    disabled={isDisabled}
                    onClick={handleFetchData}
                    className="px-5 py-2 bg-white text-[#8e78b7] border border-violet-200 rounded-md text-sm font-medium hover:bg-violet-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Database size={16} />
                    Fetch Data
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Data Ingestion Section */}
        {uploadedFile && (
          <div className="bg-white rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">Data Ingestion</h2>
                <p className="text-sm text-slate-500">
                  Your dataset has been successfully injected and will be used across all selected workflows.
                </p>
              </div>
              <button
                onClick={() => toggleModal('resetProject', true)}
                className="px-4 py-2 text-sm font-medium text-[#8e78b7] border border-slate-200 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset project
              </button>
            </div>

            <div className="mb-4">
              <div className="text-md text-slate-500">
                Project Name:{' '}
                <span className="text-slate-900 font-medium">
                  {EXPERIMENT_OPTIONS.find(opt => opt.value === selectedExperiment)?.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* File Card */}
              <div className="flex-1 bg-white border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
                    <File className="text-slate-400" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-900 mb-0.5">
                      {uploadedFile.type === 'database' ? 'Data from Views' : uploadedFile.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {uploadedFile.type === 'database'
                        ? 'Database • Fetched just now'
                        : `CSV • ${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB`}
                    </div>
                  </div>
                </div>
              </div>

              <MoveRight className="text-slate-400" />

              {/* Data Profiling Card */}
              <div className="flex-1 bg-white border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded flex items-center justify-center flex-shrink-0">
                    <ChartColumnDecreasing className="text-[#8e78b7]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-900">Data Profiling</div>
                  </div>

                  <button className="text-sm text-purple-600 hover:text-purple-700 font-medium flex-shrink-0">
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Capability Cards */}
        {uploadedFile && (
          <div className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CAPABILITIES.map((cap, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCapabilityClick(cap.path)}
                  className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm transition-all hover:shadow-md hover:border-violet-300 cursor-pointer hover:scale-105"
                >
                  <div
                    className={`w-10 h-10 ${cap.bgColor} rounded-md flex items-center justify-center mb-4`}
                  >
                    {cap.icon}
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-800 mb-2">{cap.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-400">{cap.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateProjectModal
        isOpen={modals.createProject}
        onClose={() => toggleModal('createProject', false)}
        onSubmit={handleCreateProject}
        ownerOptions={OWNER_OPTIONS}
        memberOptions={MEMBER_OPTIONS}
      />

      <DatasetDescriptionModal
        isOpen={modals.datasetDescription}
        onClose={() => toggleModal('datasetDescription', false)}
        onSave={handleSaveDescription}
        onSkip={handleSkipDescription}
      />

      <SelectDataViewModal
        isOpen={modals.selectView}
        onClose={() => toggleModal('selectView', false)}
        onProceed={handleDataViewSelected}
      />

      <ResetProjectModal
        isOpen={modals.resetProject}
        onConfirm={handleConfirmReset}
        onCancel={() => toggleModal('resetProject', false)}
      />
    </div>
  );
};

export default AIPlayground;