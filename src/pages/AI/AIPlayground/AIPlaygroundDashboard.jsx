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
  BarChart2,
  RotateCcw,
  Search,
  AlertTriangle,
  Download
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
import { tw, backgrounds } from '../../../components/themeContext';
import SearchIcon from '../../../assets/ai/search.svg';
import RefreshIcon from '../../../assets/ai/replay.svg'
import SchemaIcon from '../../../assets/ai/schema.svg'
import RobotIcon from '../../../assets/ai/robotIcon.svg';
import BidLandscapeIcons from '../../../assets/ai/bid_landscape.svg';
import DataProfilingIcon from '../../../assets/ai/Data_profiling_icon.svg';
import FileTypeIcon from '../../../assets/ai/File_type_icon.svg';
import DownloadIcon from '../../../assets/ai/download.svg';
import CloseIcon from '../../../assets/ai/close.svg';
import ArrowRightIcon from '../../../assets/ai/arrow_right.svg';

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
    icon: <img src={SchemaIcon} alt="schema" className="w-5 h-5" style={{ filter: 'invert(55%) sepia(80%) saturate(500%) hue-rotate(155deg) brightness(95%) contrast(95%)' }} />,
    iconColor: '#16ABC2',
    bgColor: '#C5EAF0',
    path: '/ai/playground/model-genesis'
  },
  {
    title: 'GenAI',
    desc: 'Build generative AI workflows powered by your data and models.',
    icon: <img src={RobotIcon} alt="robot" className="w-6 h-6" style={{ filter: 'invert(60%) sepia(90%) saturate(700%) hue-rotate(360deg) brightness(105%) contrast(105%)' }} />,
    iconColor: '#FF9500',
    bgColor: '#FFF1CF',
    path: '/ai/playground/gen-ai'
  },
  {
    title: 'Business Analysis',
    desc: 'Explore trends, patterns, and insights to support business decisions.',
    icon: <img src={BidLandscapeIcons} alt="bid landscape" className="w-5 h-5" />,
    iconColor: '#AF52DE',
    bgColor: '#EBD4F7',
    path: '/ai/playground/business-analysis'
  }
];

const AIPlayground = () => {
  const navigate = useNavigate();
  const hostnameAI = window._env_?.VITE_AI_API;

  const { projectState, setProjectState, datasetState, setDatasetState, setWorkflowState, setModelState, setMode, mode, setIsAIPlaygroundActive, isAIPlaygroundActive, resetAllStates } = useAIPlayground();
  const { token, decodedToken } = useAuth();

  const [selectedProject, setSelectedProject] = useState('');

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [tempFile, setTempFile] = useState(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const [isCancelLoading, setIsCancelLoading] = useState(false);

  const [modals, setModals] = useState({
    createProject: false,
    datasetDescription: false,
    selectTable: false,
    resetProject: false,
    chooseBuildMethod: false
  });

  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    const handlePopState = (event) => {
      const currentPath = window.location.pathname;

      if (currentPath === '/ai/playground' && isAIPlaygroundActive) {
        event.preventDefault();

        window.history.pushState(null, '', currentPath);
        setShowCancelModal(true);
      }
    };

    window.addEventListener('popstate', handlePopState);

    if (isAIPlaygroundActive) {
      window.history.pushState(null, '', window.location.pathname);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isAIPlaygroundActive]);

  const handleConfirmCancel = async () => {
    setIsCancelLoading(true);
    try {
      await fetch(`${hostnameAI}/model/cleanup`, {
        method: 'POST',
        headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: datasetState.sessionId, training_flag: false })
      });
    } catch (error) {
      console.error('Cleanup API error:', error);
    }
    setSelectedProject('');
    setTempFile(null);
    setUploadedFile(null);
    resetAllStates();
    setIsCancelLoading(false);
    setShowCancelModal(false);
    navigate('/ai/playground');
  };

  const handleCancelModalClose = () => {
    setShowCancelModal(false);
  };

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

  useEffect(() => {
    if (selectedProject != '' || projectState?.selectedProject != '') {
      setIsAIPlaygroundActive(true)
    }
  }, [projectState?.selectedProject]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

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
    setIsAIPlaygroundActive(false);
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

  const handleCloseProfileReport = () => {
    setShowProfileReport(false);
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showProfileReport) {
        setShowProfileReport(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showProfileReport]);

  return (
    // OUTER: #FAFAFA gray background
    <div className="h-full overflow-y-auto font-satoshi" style={{ backgroundColor: '#FAFAFA' }}>

      {/* Data Profiling Modal */}
      {showProfileReport && datasetState?.profileReportHtml && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseProfileReport(); }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white rounded-t-xl flex-shrink-0">
              <h2 className="text-lg font-semibold text-[#282F49]">Data Profiling</h2>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const blob = new Blob([datasetState.profileReportHtml], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${datasetState?.tableName || 'data-profiling'}-report.html`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
                  style={{ background: '#FAFAFA', border: '1px solid #CCCCCC' }}
                  aria-label="Download"
                >
                  <img src={DownloadIcon} alt="download" className="w-4 h-4" />
                </button>

                {/* Close Button */}
                <button
                  onClick={handleCloseProfileReport}
                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <img src={CloseIcon} alt="close" className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden">
              <iframe
                srcDoc={datasetState.profileReportHtml}
                className="w-full h-full border-0"
                title="Data Profiling Report"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>

          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <h2 className={tw.pageHeading}>
                  Cancel AI Playground Workflow?
                </h2>
              </div>

              <p className={tw.body + " mb-6"}>
                Are you sure you want to cancel? All unsaved progress and configurations will be lost. This action cannot be undone.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelModalClose}
                  className="px-4 py-2 border border-slate-200 rounded-md text-sm font-medium text-[#332849] leading-normal hover:bg-slate-50 transition-colors"
                >
                  Continue Working
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={isCancelLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {isCancelLoading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {isCancelLoading ? 'Cancelling...' : 'Yes, Discard Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MIDDLE: full white card wrapping all page content */}
      <div className="p-6 h-full">
        <div className="bg-white rounded-xl p-6 h-full">

          <div className="flex items-center justify-between mb-6">
            <h1 className={tw.pageHeading}>AI playground</h1>
          </div>

          {!uploadedFile && (
            <>
              {/* INNER CONTENT: #FAFAFA gray background section */}
              <div className="rounded-lg p-5 mb-6" style={{ backgroundColor: '#FAFAFA' }}>
                <div className="mb-6">
                  <h2 className={tw.sectionHeading + " mb-3"}>Inject Your Data to Get Started</h2>
                  <p className={tw.body}>
                    Select a project and fetch data from tables — to begin machine learning, GenAI, analytics, and observability workflows.
                  </p>
                </div>

                {mode === 'schedule' ? (
                  <div className='flex items-start justify-between mb-6'>
                    <div className="relative w-80">
                      <input
                        type="text"
                        value={selectedProject || 'No project selected'}
                        readOnly
                        disabled
                        className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm font-normal text-[#818181] cursor-not-allowed"
                      />
                    </div>
                    <button
                      onClick={() => toggleModal('resetProject', true)}
                      className="px-4 py-2 text-sm font-medium text-[#8e78b7] border border-slate-200 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-2 bg-white"
                    >
                      <img src={RefreshIcon} alt="reset" className="w-4 h-4" />
                      Reset project
                    </button>
                  </div>
                ) : (
                  <div className="mb-6 relative w-80" ref={dropdownRef}>
                    <label className={tw.label + " block mb-1.5"}>Project Name</label>

                    {/* Trigger Button */}
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      disabled={loading}
                      title={selectedProject || ''}
                      className={`
                        w-full h-10 px-3 rounded-md border text-sm text-left
                        flex items-center justify-between
                        transition-all focus:outline-none
                        font-satoshi font-normal leading-none tracking-normal
                        ${isDropdownOpen
                          ? 'border-[#8e78b7] bg-[#F5F0FF] text-[#332849]'
                          : 'border-slate-200 bg-white text-[#818181]'}
                        disabled:cursor-not-allowed
                      `}
                    >
                      <span className={`truncate block ${selectedProject ? tw.label : 'font-satoshi text-sm font-normal text-[#818181] leading-none tracking-normal'}`}>
                        {loading
                          ? 'Loading projects...'
                          : error
                            ? 'Error loading projects'
                            : selectedProject
                              ? projects.find(opt => opt.label === selectedProject)?.label
                              : 'Select'}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'text-[#8e78b7]' : 'text-[#818181]'}`} />
                    </button>

                    {/* Dropdown Panel */}
                    {isDropdownOpen && !loading && !error && (
                      <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg z-10 overflow-hidden">

                        {/* Search Input */}
                        <div className="p-2">
                          <div className="relative">
                            <img
                              src={SearchIcon}
                              alt="search"
                              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
                            />
                            <input
                              ref={searchInputRef}
                              type="text"
                              placeholder="Search"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="
                                w-full pl-9 pr-3 py-1.5 rounded-md
                                border border-slate-200
                                font-satoshi text-sm font-normal text-[#332849] leading-none tracking-normal
                                placeholder:text-[#818181]
                                focus:outline-none focus:border-[#8e78b7]
                                transition-colors
                              "
                            />
                          </div>
                        </div>

                        {/* List Items */}
                        <div className="max-h-48 overflow-y-auto">
                          {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => handleSelectExperiment(opt.label)}
                                title={opt.label}
                                className={`w-full px-4 py-2.5 text-left ${tw.label} hover:bg-slate-50 transition-colors truncate`}
                              >
                                {opt.label}
                              </button>
                            ))
                          ) : (
                            <div className={`px-4 py-2.5 ${tw.caption}`}>
                              No projects found
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            toggleModal('createProject', true);
                          }}
                          className="
                            w-full px-4 py-2.5 text-left
                            font-satoshi text-sm font-medium text-[#8e78b7] bg-[#F9F9F9] leading-none tracking-normal
                            hover:bg-violet-50 transition-colors
                            border-t border-slate-200
                            flex items-center gap-1.5
                            shadow-[0_-2px_10px_0px_rgba(0,0,0,0.07)]
                          "
                        >
                          <span className="text-base leading-none">+</span>
                          <span>Create</span>
                        </button>
                      </div>
                    )}

                    {/* Error State */}
                    {error && (
                      <div className="mt-2 flex items-center gap-1 font-satoshi text-xs font-normal text-red-500 leading-none tracking-normal">
                        <span>Failed to load projects.</span>
                        <button onClick={fetchProjects} className="text-[#8e78b7] hover:underline">
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Fetch Data Card — gray inner background */}
                <div
                  className={`border border-slate-200 rounded-lg p-5 transition-opacity ${isDisabled ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <div className={tw.cardTitle + " mb-3"}>
                          Fetch Data from Table
                        </div>
                        <div className={tw.caption}>
                          Load data directly from available database tables
                        </div>
                      </div>
                    </div>
                    <button
                      disabled={isDisabled}
                      onClick={handleFetchData}
                      className="px-6 py-2.5 border border-[#8e78b7] bg-white text-[#8e78b7] rounded-md text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 disabled:border-slate-300 disabled:text-slate-300 transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Download size={16} />
                      Fetch Data
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Data Ingestion Section */}
          {uploadedFile && (
            <div className="rounded-lg p-6 mb-6 bg-[#FAFAFA]">
              {/* Header row: title + reset button */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className={tw.sectionHeading + " mb-1"}>Data Ingestion</h2>
                  <p className={tw.body}>
                    Your dataset has been successfully injected and will be used across all selected workflows.
                  </p>
                </div>
                <button
                  onClick={() => toggleModal('resetProject', true)}
                  className="px-4 py-2 text-sm font-medium text-[#8e78b7] border border-[#8e78b7] rounded-md hover:bg-slate-50 transition-colors flex items-center gap-2 flex-shrink-0 bg-white"
                >
                  <img src={RefreshIcon} alt="reset" className="w-4 h-4" />
                  Reset project
                </button>
              </div>


              {/* Cards row — #FAFAFA background area */}
              <div
                className="rounded-lg p-4 flex flex-col bg-white"
              >
                <div className="mb-4">
                  <div className={tw.body}>
                    Project Name:{' '}
                    <span className={tw.cardTitle}>
                      {selectedProject}
                    </span>
                  </div>
                </div>

                <div className='flex items-center gap-3 '>
                  {/* File Card — fixed 320x56px */}
                  <div
                    className="bg-[#FAFAFA] rounded-lg flex items-center gap-3 px-3 flex-shrink-0"
                    style={{ width: '320px', height: '56px' }}
                  >
                    <div className="w-8 h-8 bg-[#F1F0F3] rounded flex items-center justify-center flex-shrink-0">
                      <img
                        src={FileTypeIcon}
                        alt="file"
                        className="w-5 h-5"
                        style={{ filter: 'brightness(0) saturate(100%) invert(82%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(85%)' }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={tw.cardTitle + " truncate text-sm"}>
                        {uploadedFile.type === 'database'
                          ? uploadedFile.displayName || uploadedFile.name
                          : uploadedFile.name}
                      </div>
                      <div className={tw.caption + " text-xs mt-1"}>
                        {uploadedFile.type === 'database'
                          && 'Table • Fetched just now'}
                      </div>
                    </div>
                  </div>

                  <img src={ArrowRightIcon} alt="arrow right" className="w-4 h-4 flex-shrink-0" />

                  {/* Data Profiling Card — fixed 320x56px */}
                  <div
                    className="rounded-lg flex items-center gap-3 px-3 flex-shrink-0 overflow-hidden bg-[#FAFAFA]"
                    style={{ width: '320px', height: '56px' }}
                  >
                    <div className="w-8 h-8 bg-[#F2EBFF] rounded flex items-center justify-center flex-shrink-0">
                      <img
                        src={DataProfilingIcon}
                        alt="data profiling"
                        className="w-5 h-5"
                        style={{ filter: 'brightness(0) saturate(100%) invert(45%) sepia(60%) saturate(400%) hue-rotate(220deg) brightness(95%) contrast(90%)' }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={tw.cardTitle + " text-sm"}>Data Profiling</div>
                    </div>
                    {/* View button — white background */}
                    <button
                      onClick={handleViewProfiling}
                      className="text-sm font-medium text-[#8e78b7] hover:text-purple-700 flex-shrink-0 bg-white px-3 py-1 rounded transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Capability Cards — gray inner background */}
          {uploadedFile && (
            <div className="rounded-lg py-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {CAPABILITIES.map((cap, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleCapabilityClick(cap.path, cap.title)}
                    className="bg-white border border-[#CCCCCC] p-5 rounded-lg shadow-sm transition-all hover:shadow-md hover:border-violet-300 cursor-pointer hover:scale-105"
                  >
                    <div
                      className="w-10 h-10 rounded-md flex items-center justify-center mb-4"
                      style={
                        { backgroundColor: cap.bgColor }
                      }
                    >
                      {cap.icon}
                    </div>
                    <h3 className={tw.cardTitle + " mb-2"}>{cap.title}</h3>
                    <p className={tw.caption}>{cap.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
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

    </div>
  );
};

export default AIPlayground;