// DataLibrary.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Database } from 'lucide-react';
import OverviewTab from './OverviewTab';
import ProjectsTab from './ProjectsTab';
import CommentsTab from './CommentsTab';
import AccessTab from './AccessTab';

const DataLibrary = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('Overview');

    const datasetData = location.state?.datasetData;

    const tabs = ['Overview', 'Projects', 'Comments', 'Access'];

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNext = () => {
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex < tabs.length - 1) {
            setActiveTab(tabs[currentIndex + 1]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex > 0) {
            setActiveTab(tabs[currentIndex - 1]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            navigate('/ai/hub/data');
        }
    };

    const handleLibraryBack = () => {
        navigate('/ai/hub/data');
    };

    const getDatasetName = () => {
        if (datasetData?.name) {
            return datasetData.name.replace('Project - ', '');
        }
        return 'Dataset';
    };

    const DatasetName = getDatasetName();

    return (
        <div className="min-h-screen bg-gray-50 p-6 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleLibraryBack}
                            className="hover:bg-gray-100 rounded-lg transition-colors p-1"
                            aria-label="Go back to data"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-semibold text-gray-900">Data Library - </h1>
                            <span className="text-lg font-semibold text-[#8e78b7]">{DatasetName}</span>
                        </div>
                    </div>
                    <button className="px-3 py-1.5 rounded bg-purple-100 text-[#8e78b7] font-medium text-sm flex items-center gap-1.5 hover:bg-purple-200 transition-colors">
                        <Database className="w-4 h-4" />
                        AI/ML
                    </button>
                </div>

                <div className="flex items-center gap-8 px-6 pt-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === tab
                                ? 'text-[#8e78b7]'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#8e78b7] rounded-t"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="space-y-6">
                    {activeTab === 'Overview' && (
                        <OverviewTab datasetData={datasetData} />
                    )}

                    {activeTab === 'Projects' && (
                        <ProjectsTab />
                    )}

                    {activeTab === 'Comments' && (
                        <CommentsTab />
                    )}

                    {activeTab === 'Access' && (
                        <AccessTab />
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <button
                    onClick={handleBack}
                    className="px-10 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Back
                </button>
                {activeTab !== 'Access' && (
                    <button
                        onClick={handleNext}
                        className="px-10 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7d6ba3] transition-colors"
                    >
                        Next
                    </button>
                )}
            </div>
        </div>
    );
};

export default DataLibrary;