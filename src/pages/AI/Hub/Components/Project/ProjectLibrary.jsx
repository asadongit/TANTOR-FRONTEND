// ProjectLibrary.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Cloud, LayoutDashboard } from 'lucide-react';
import CommentsTab from './CommentsTab';
import OverviewTab from './OverviewTab';
import ComponentsTab from './ComponentsTab';
import { useAuth } from '../../../../../context/AuthContext';

const ProjectLibrary = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Overview');
    const [projectData, setProjectData] = useState(location.state?.ProjectData || null);
    const [isLoading, setIsLoading] = useState(!projectData);
    const [error, setError] = useState(null);
    const { token } = useAuth();
    const hostnameAI = window._env_?.VITE_AI_API;

    useEffect(() => {
        if (!projectData && projectId) {
            const fetchProjectData = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const response = await fetch(`${hostnameAI}/canvas/project_list/?project_id=${encodeURIComponent(projectId)}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    if (!response.ok) {
                        throw new Error('Failed to fetch project data');
                    }
                    const data = await response.json();
                    // Handle different response formats
                    const project = (Array.isArray(data) ? data[0] : data?.data?.[0] || data?.project || data) || null;
                    if (project) {
                        setProjectData(project);
                    } else {
                        throw new Error('Project not found');
                    }
                } catch (err) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchProjectData();
        }
    }, [projectData, projectId, hostnameAI, token]);

    const tabs = ['Overview', 'Components', 'Comments'];

    const getProjectName = () => {
        if (projectData?.name) {
            return projectData.name.replace('Project - ', '');
        }
        return projectId; // fallback label
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8e78b7] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading project...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Error: {error}</p>
                    <button
                        onClick={() => navigate('/ai/hub/projects')}
                        className="px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a5fa8] transition-colors"
                    >
                        Back to Projects
                    </button>
                </div>
            </div>
        );
    }

    if (!projectData) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Project not found</p>
                    <button
                        onClick={() => navigate('/ai/hub/projects')}
                        className="px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a5fa8] transition-colors"
                    >
                        Back to Projects
                    </button>
                </div>
            </div>
        );
    }

    const ProjectName = getProjectName();

    return (
        <div className="min-h-screen bg-gray-50 p-6 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleLibraryBack}
                            className="hover:bg-gray-100 rounded-lg transition-colors p-1"
                            aria-label="Go back to projects"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-semibold text-gray-900">Project Library - </h1>
                            <span className="text-lg font-semibold text-[#8e78b7]">{ProjectName}</span>
                        </div>
                    </div>
                    <button className="px-3 py-1.5 rounded bg-purple-100 text-[#8e78b7] font-medium text-sm flex items-center gap-1.5 hover:bg-purple-200 transition-colors"
                        onClick={() => navigate('/ai/hub/projects')}>
                        <LayoutDashboard className="w-4 h-4" />
                        AI/ML
                    </button>
                </div>

                <div className="flex items-center gap-8 px-6 pt-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === tab
                                ? 'text-[#8e78b7]'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-[-8px] right-[-8px] h-1 bg-[#8e78b7] rounded-t"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                {activeTab === 'Overview' && <OverviewTab projectData={projectData} />}
                {activeTab === 'Components' && <ComponentsTab projectData={projectData} />}
                {activeTab === 'Comments' && <CommentsTab projectData={projectData} />}
            </div>


        </div>
    );
};

export default ProjectLibrary;