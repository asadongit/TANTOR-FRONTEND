// ProjectLibrary.jsx
import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Cloud, LayoutDashboard } from 'lucide-react';
import CommentsTab from './CommentsTab';
import OverviewTab from './OverviewTab';
import ComponentsTab from './ComponentsTab';

const ProjectLibrary = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Overview');

    const ProjectData = location.state?.ProjectData || {};

    const tabs = ['Overview', 'Components', 'Comments'];

    const getProjectName = () => {
        if (ProjectData?.name) {
            return ProjectData.name.replace('Project - ', '');
        }
        return projectId; // fallback label
    };

    const handleLibraryBack = () => {
        navigate('/ai/hub/projects');
    };

    const handleBack = () => {
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex > 0) {
            setActiveTab(tabs[currentIndex - 1]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            navigate('/ai/hub/projects');
        }
    };

    const handleNext = () => {
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex < tabs.length - 1) {
            setActiveTab(tabs[currentIndex + 1]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

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
                {activeTab === 'Overview' && <OverviewTab projectData={ProjectData} />}
                {activeTab === 'Components' && <ComponentsTab projectData={ProjectData} />}
                {activeTab === 'Comments' && <CommentsTab projectData={ProjectData} />}
            </div>


        </div>
    );
};

export default ProjectLibrary;