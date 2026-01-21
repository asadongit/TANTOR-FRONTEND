// AIPlayground.jsx
import React, { useState, useRef, useEffect } from 'react';
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
  BarChart2,
  RotateCcw,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreateProjectModal } from './modals/Dashboard/CreateProjectModal';
import { DatasetDescriptionModal } from './modals/Dashboard/DatasetDescriptionModal';
import { SelectDataViewModal } from './modals/Dashboard/SelectDataViewModal';
import { ResetProjectModal } from './modals/Dashboard/ResetProjectModal';
import { ChooseBuildMethodModal } from './modals/Dashboard/ChooseBuildMethodModal';
import { useAIPlayground } from '../../../context/AIPlaygroundContext';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

// Constants
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
  const hostnameAI = window._env_?.VITE_AI_API;

  const { projectState, setProjectState, datasetState, setDatasetState, setWorkflowState, setModelState, setMode, mode } = useAIPlayground();
  const { token, decodedToken } = useAuth();

  const [selectedProject, setSelectedProject] = useState('');

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [tempFile, setTempFile] = useState(null);

  const [modals, setModals] = useState({
    createProject: false,
    datasetDescription: false,
    selectTable: false,
    resetProject: false,
    chooseBuildMethod: false
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (mode === "dataset") {
      if (projectState?.selectedProject) {
        setSelectedProject(projectState.selectedProject);
      }
      if (datasetState?.tableName) {
        setUploadedFile({
          name: datasetState.tableName,
          type: 'database',
          TableId: datasetState.tableName,
          displayName: datasetState.tableName
        });
      }
    }
    else if (mode === "schedule") {
      if (projectState?.selectedProject) {
        setSelectedProject(projectState.selectedProject);
      }
    }
    else {
      setProjectState({ selectedProject: '' });
      setModelState({ selectedModel: '' })
      setDatasetState({
        tableName: '',
        sessionId: '',
        columnNames: [],
        profileReportHtml: ''
      });
      setSelectedProject('');
      setUploadedFile(null);
      setMode('write')
    }

    setWorkflowState({
      modelGenesis: {
        config: null,
        apiResponse: null
      },
      dataPreprocessing: {
        step1: { config: null, apiResponse: null },
        step2: { config: null, apiResponse: null },
        step3: { config: null, apiResponse: null },
        step4: { config: null, apiResponse: null },
        step5: { config: null, apiResponse: null },
        step6: { config: null, apiResponse: null },
        step7: { config: null, apiResponse: null }
      },
      modelSelection: { config: null, apiResponse: null },
      modelInferencing: { config: null, apiResponse: null },
      xai: { config: null, apiResponse: null },
      modelDeployment: { config: null, apiResponse: null }
    });
  }, [mode]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${hostnameAI}/model/list_projects`, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status}`);
      }

      const data = await response.json();

      const transformedProjects = data.projects.map(project => ({
        value: project.id,
        label: project.name,
        description: project.description,
        status: project.status
      }));

      setProjects(transformedProjects);
    } catch (err) {
      toast.error('Error fetching projects', {
        duration: 3000,
        position: 'top-right',
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleModal = (modalName, isOpen) => {
    setModals(prev => ({ ...prev, [modalName]: isOpen }));
  };

  const filteredOptions = projects.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isDisabled = !selectedProject;

  const handleSelectExperiment = (value) => {
    setSelectedProject(value);
    setProjectState(prev => ({ ...prev, selectedProject: value }));
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleCreateProject = async (formData) => {
    await fetchProjects();
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
    toggleModal('selectTable', true);
  };

  const handleDataTableSelected = async (tableData) => {
    const tempFileData = {
      name: tableData.label,
      type: 'database',
      TableId: tableData.value,
      displayName: tableData.label
    };

    setTempFile(tempFileData);

    try {
      const username = decodedToken?.preferred_username;
      if (!username) {
        toggleModal('datasetDescription', true);
        return;
      }

      const userResponse = await fetch(
        `${hostnameAI}/users/users/get-id?username=${encodeURIComponent(username)}`,
        {
          method: 'GET',
          headers: {
            'accept': 'application/json'
          }
        }
      );

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user ID');
      }

      const userData = await userResponse.json();
      const userId = userData.user_id;

      const checkResponse = await fetch(
        `${hostnameAI}/data/check_dataset_exists?project_name=${encodeURIComponent(selectedProject)}&owner_id=${encodeURIComponent(userId)}&file_name=${encodeURIComponent(tableData.value)}`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json'
          }
        }
      );

      if (!checkResponse.ok) {
        throw new Error('Failed to check dataset existence');
      }

      const checkData = await checkResponse.json();

      if (checkData.description_flag === 0) {
        toggleModal('datasetDescription', true);
      } else {
        setUploadedFile(tempFileData);
        setTempFile(null);
      }
    } catch (error) {
      console.error('Error checking dataset existence:', error);
      toggleModal('datasetDescription', true);
    }
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
    setSelectedProject('');
    setProjectState(prev => ({ ...prev, selectedProject: '' }));
    setDatasetState({
      tableName: '',
      sessionId: '',
      columnNames: [],
      profileReportHtml: ''
    });
    toggleModal('resetProject', false);
    setMode('write')
    toast.success('Project has been reset successfully', {
      duration: 3000,
      position: 'top-right',
    });
  };

  const handleCapabilityClick = (path, title) => {
    if (!isDisabled) {
      if (title === 'Build Machine Learning') {
        toggleModal('chooseBuildMethod', true);
      } else {
        navigate(path);
      }
    }
  };

  const handleBuildMethodSelected = (method, ensembleCount) => {
    const isEnsemble = method === 'ensemble';
    navigate('/ai/playground/model-genesis', {
      state: { isEnsemble, ensembleCount }
    });
  };

  const [showProfileReport, setShowProfileReport] = useState(false);

  const handleViewProfiling = () => {
    setShowProfileReport(true);
  };

  const handleBackToDashboard = () => {
    setShowProfileReport(false);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] p-6 font-sans text-slate-900">
      {showProfileReport && datasetState?.profileReportHtml ? (
        <div className="min-h-screen bg-white -m-6">
          <div className="sticky top-0 z-10 bg-gray-50 border-b border-purple-100 px-6 py-2 shadow-sm rounded-t-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToDashboard}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-all"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#8e78b7] rounded-lg flex items-center justify-center shadow-sm">
                    <BarChart2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Data Profiling Report
                    </h2>
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                      {datasetState?.tableName || 'Dataset Analysis'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full">
            <iframe
              srcDoc={datasetState.profileReportHtml}
              className="w-full min-h-screen border-0"
              title="Data Profiling Report"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </div>
      ) : (
        <>
          <div className="">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">AI playground</h1>
            </div>

            {!uploadedFile && (
              <>
                <div className="mb-8">
                  <h2 className="text-base font-semibold mb-2">Inject Your Data to Get Started</h2>
                  <p className="text-sm text-slate-500 max-w-3xl">
                    Select an experiment and upload a dataset—or fetch data from tables—to begin machine learning, GenAI, analytics, and observability workflows.
                  </p>
                </div>

                {mode === 'schedule' ? (
                  <div className='flex items-start justify-between'>
                    <div className="mb-8 relative w-80">
                      <input
                        type="text"
                        value={selectedProject || 'No project selected'}
                        readOnly
                        disabled
                        className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-600 cursor-not-allowed"
                      />
                    </div>
                    <button
                      onClick={() => toggleModal('resetProject', true)}
                      className="px-4 py-2 text-sm font-medium text-[#8e78b7] border border-slate-200 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset project
                    </button>
                  </div>
                ) : (
                  <div className=" mb-8 relative w-80">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-left focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all flex items-center justify-between"
                      disabled={loading}
                    >
                      <span className={selectedProject ? 'text-slate-900' : 'text-slate-400'}>
                        {loading
                          ? 'Loading projects...'
                          : error
                            ? 'Error loading projects'
                            : selectedProject
                              ? projects.find(opt => opt.label === selectedProject)?.label
                              : 'Select'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    {isDropdownOpen && !loading && !error && (
                      <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg z-10">
                        <div className="p-2 border-b border-slate-200">
                          <div className="relative">
                            <Search className='w-4 h-4 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2' />
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
                          {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => handleSelectExperiment(opt.label)}
                                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                {opt.label}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-slate-400">
                              No projects found
                            </div>
                          )}
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

                    {error && (
                      <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                        <span>Failed to load projects.</span>
                        <button
                          onClick={fetchProjects}
                          className="text-[#8e78b7] hover:underline"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-8">
                  <div
                    className={`border border-slate-200 rounded-lg p-5 transition-opacity ${isDisabled ? 'opacity-50 bg-slate-50' : 'bg-white'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Database className="w-6 h-6 text-cyan-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-700 mb-1">
                            Fetch Data from Table
                          </div>
                          <div className="text-xs text-slate-400">
                            Load data directly from available database tables
                          </div>
                        </div>
                      </div>
                      <button
                        disabled={isDisabled}
                        onClick={handleFetchData}
                        className="px-6 py-2.5 bg-[#8e78b7] text-white rounded-md text-sm font-medium disabled:cursor-not-allowed disabled:bg-slate-300 transition-colors flex items-center gap-2 shadow-sm"
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
                      {selectedProject}
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
                          {uploadedFile.type === 'database'
                            ? uploadedFile.displayName || uploadedFile.name
                            : uploadedFile.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {uploadedFile.type === 'database'
                            ? 'Table • Fetched just now'
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
                        <BarChart2 className="text-[#8e78b7]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-900">Data Profiling</div>
                      </div>

                      <button
                        onClick={handleViewProfiling}
                        className="text-sm text-[#8e78b7] hover:text-purple-700 font-medium flex-shrink-0"
                      >
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
                      onClick={() => handleCapabilityClick(cap.path, cap.title)}
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
            projectList={projects}
          />

          <DatasetDescriptionModal
            isOpen={modals.datasetDescription}
            onClose={() => toggleModal('datasetDescription', false)}
            onSave={handleSaveDescription}
            onSkip={handleSkipDescription}
          />

          <SelectDataViewModal
            isOpen={modals.selectTable}
            onClose={() => toggleModal('selectTable', false)}
            onProceed={handleDataTableSelected}
          />

          <ResetProjectModal
            isOpen={modals.resetProject}
            onConfirm={handleConfirmReset}
            onCancel={() => toggleModal('resetProject', false)}
          />

          <ChooseBuildMethodModal
            isOpen={modals.chooseBuildMethod}
            onClose={() => toggleModal('chooseBuildMethod', false)}
            onProceed={handleBuildMethodSelected}
          />

        </>
      )}
    </div>
  );
};

export default AIPlayground;