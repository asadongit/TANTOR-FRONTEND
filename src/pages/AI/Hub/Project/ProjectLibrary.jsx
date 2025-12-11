// ProjectLibrary.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import CommentsTab from './CommentsTab';
import ClonesTab from './ClonesTab';
import OverviewTab from './OverviewTab';
import ComponentsTab from './ComponentsTab';

const ProjectLibrary = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Overview');

    const tabs = ['Overview', 'Components', 'Comments', 'Clones'];

    const getProjectName = () => {
        const projectNames = {
            'churn': 'Churn',
            'analysis': 'Analysis',
            'retention': 'Retention',
            'acquisition': 'Acquisition',
            'engagement': 'Engagement',
            'onboarding': 'Onboarding',
            'feedback': 'Feedback',
            'analysis-2': 'Analysis',
            'strategy': 'Strategy',
            'optimization': 'Optimization'
        };
        return projectNames[projectId] || 'Unknown';
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

    return (
        <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 min-h-screen">

            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={handleLibraryBack}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    aria-label="Go back to projects"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold text-gray-900">Project Library - </h1>
                    <span className="text-xl font-semibold text-[#8e78b7]">{getProjectName()}</span>
                </div>
                <button className="ml-auto px-6 py-2 font-semibold rounded-lg bg-purple-200 text-[#8e78b7] transition-colors text-sm">
                    AI/ML
                </button>
            </div>

            <div className="flex items-center gap-6 mb-6 border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === tab
                            ? 'text-[#8e78b7]'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8e78b7]"></div>
                        )}
                    </button>
                ))}
            </div>

            <div className='bg-white p-4 rounded-lg border border-gray-200'>
                {activeTab === 'Overview' && (
                    <OverviewTab />
                )}
                {activeTab === 'Components' && (
                    <ComponentsTab />
                )}
                {activeTab === 'Comments' && (
                    <CommentsTab />
                )}
                {activeTab === 'Clones' && (
                    <ClonesTab />
                )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
                <button
                    onClick={handleBack}
                    className="px-10 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Back
                </button>
                {activeTab !== 'Clones' && (
                    <button
                        onClick={handleNext}
                        className="px-10 py-2 bg-[#8e78b7] text-white rounded-lg transition-colors">
                        Next
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProjectLibrary;