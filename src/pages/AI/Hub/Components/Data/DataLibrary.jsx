// DataLibrary.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ChevronLeft, LayoutDashboard } from 'lucide-react';
import OverviewTab from './OverviewTab';
import ProjectsTab from './ProjectsTab';
import CommentsTab from './CommentsTab';
import AccessTab from './AccessTab';
import Snapshot from './Snapshot';
import { useAuth } from '../../../../../context/AuthContext';

const DataLibrary = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { projectId } = useParams();
    const [activeTab, setActiveTab] = useState('Overview');
    const [datasetData, setDatasetData] = useState(location.state?.datasetData || null);
    const [isLoading, setIsLoading] = useState(!datasetData);
    const [error, setError] = useState(null);
    const { token } = useAuth();
    const hostnameAI = window._env_?.VITE_AI_API;

    useEffect(() => {
        if (!datasetData && projectId) {
            const fetchDatasetData = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const response = await fetch(`${hostnameAI}/canvas/list_data_info?data_id=${encodeURIComponent(projectId)}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    if (!response.ok) {
                        throw new Error('Failed to fetch dataset data');
                    }
                    const data = await response.json();
                    // Handle different response formats (array, object with data, or direct object)
                    const dataset = (Array.isArray(data) ? data[0] : data?.data?.[0] || data?.dataset || data) || null;
                    if (dataset) {
                        setDatasetData(dataset);
                    } else {
                        throw new Error('Dataset not found');
                    }
                } catch (err) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchDatasetData();
        }
    }, [datasetData, projectId, hostnameAI, token]);

    const tabs = ['Overview', 'Projects', 'Comments', 'Snapshot'];

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
        return datasetData?.file_name || 'Dataset';
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8e78b7] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dataset...</p>
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
                        onClick={() => navigate('/ai/hub/data')}
                        className="px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a5fa8] transition-colors"
                    >
                        Back to Data Hub
                    </button>
                </div>
            </div>
        );
    }

    if (!datasetData) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Dataset not found</p>
                    <button
                        onClick={() => navigate('/ai/hub/data')}
                        className="px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a5fa8] transition-colors"
                    >
                        Back to Data Hub
                    </button>
                </div>
            </div>
        );
    }

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
                    <button className="px-3 py-1.5 rounded bg-purple-100 text-[#8e78b7] font-medium text-sm flex items-center gap-1.5 hover:bg-purple-200 transition-colors"
                        onClick={() => navigate('/ai/hub/data')}>
                        <LayoutDashboard className="w-4 h-4" />
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
                        <ProjectsTab
                            datasetId={datasetData?.id}
                            projectId={datasetData?.project_id}
                        />
                    )}

                    {activeTab === 'Comments' && (
                        <CommentsTab datasetId={datasetData.id} projectId={datasetData.project_id} />
                    )}

                    {/* {activeTab === 'Access' && (
                        <AccessTab />
                    )} */}
                    {activeTab === 'Snapshot' && (
                        <Snapshot datasetData={datasetData} />
                    )}
                </div>
            </div>


        </div>
    );
};

export default DataLibrary;