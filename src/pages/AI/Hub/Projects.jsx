import { Search, List, RefreshCw, CheckCircle, MoreVertical, TrendingUp, TrendingDown, Target, Library, Trash2, ChevronLeft, ChevronRight, BookOpenText } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Breadcrumb from '../../../components/Breadcrumb';

const Projects = () => {
    const [openMenu, setOpenMenu] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenu(null);
            }
        };

        if (openMenu !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenu]);

    const statsCards = [
        { label: 'Projects', value: '17', trend: '2%', trendUp: true },
        { label: 'Projects', value: '39', trend: '2%', trendUp: true },
        { label: 'Projects', value: '67', trend: '2%', trendUp: true },
        { label: 'Notebooks', value: '5', trend: '2%', trendUp: false },
    ];

    const lastAccessed = [
        { id: 1, name: 'Project 1' },
        { id: 2, name: 'Project 2' },
    ];

    const projectsData = [
        {
            id: 1,
            name: 'Project - Churn',
            description: 'Churn',
            createdDate: '01/10/2025',
            owner: 'Salah',
            status: 'Active'
        },
        {
            id: 2,
            name: 'Project - Analysis',
            description: 'Churn',
            createdDate: '01/10/2025',
            owner: 'Salah',
            status: 'Inactive'
        },
        {
            id: 3,
            name: 'Project - Retention',
            description: 'Retention',
            createdDate: '15/11/2025',
            owner: 'Mekong',
            status: 'Active'
        },
        {
            id: 4,
            name: 'Project - Acquisition',
            description: 'Acquisition',
            createdDate: '01/12/2025',
            owner: 'Amazon',
            status: 'Active'
        },
        {
            id: 5,
            name: 'Project - Engagement',
            description: 'Engagement',
            createdDate: '20/12/2025',
            owner: 'Nile',
            status: 'Inactive'
        },
        {
            id: 6,
            name: 'Project - Onboarding',
            description: 'Onboarding',
            createdDate: '05/01/2026',
            owner: 'Yangtze',
            status: 'Active'
        },
        {
            id: 7,
            name: 'Project - Feedback',
            description: 'Feedback',
            createdDate: '30/01/2026',
            owner: 'Danube',
            status: 'Active'
        },
        {
            id: 8,
            name: 'Project - Analysis',
            description: 'Analysis',
            createdDate: '15/02/2026',
            owner: 'Thames',
            status: 'Inactive'
        },
        {
            id: 9,
            name: 'Project - Strategy',
            description: 'Strategy',
            createdDate: '01/03/2026',
            owner: 'Seine',
            status: 'Active'
        },
        {
            id: 10,
            name: 'Project - Optimization',
            description: 'Optimization',
            createdDate: '15/03/2026',
            owner: 'Mississippi',
            status: 'Active'
        }
    ];

    const StatCard = ({ label, value, trend, trendUp }) => (
        <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-600 text-sm">{label}</span>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-800">{value}</span>
                <div className={`flex items-center gap-1 ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
                    {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="text-sm font-medium">{trend}</span>
                </div>
            </div>
        </div>
    );

    const LastAccessedCard = () => (
        <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <span className="text-gray-600 text-sm">Last Accessed</span>
            </div>
            <div className="flex items-center gap-2">
                {lastAccessed.map((project) => (
                    <div key={project.id} className="flex items-center gap-2 bg-gray-100 px-2 py-1.5 rounded-md">
                        <Target className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{project.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 min-h-screen">
            <Breadcrumb />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Projects</h1>
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search database"
                            className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <List className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <RefreshCw className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-400 via-purple-300 to-purple-200 rounded-xl p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {statsCards.map((stat, index) => (
                            <StatCard key={index} {...stat} />
                        ))}
                        <LastAccessedCard />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sno</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {projectsData.map((project) => (
                                    <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 hover:text-purple-800 cursor-pointer underline">
                                            {project.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.createdDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.owner}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${project.status === 'Active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex items-center justify-end">
                                                <div className="relative" ref={openMenu === project.id ? menuRef : null}>
                                                    <button
                                                        onClick={() => setOpenMenu(openMenu === project.id ? null : project.id)}
                                                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                    >
                                                        <MoreVertical className="w-5 h-5 text-gray-400" />
                                                    </button>

                                                    {openMenu === project.id && (
                                                        <div className={`absolute ${project.id <= 5 ? 'right-6 top-0' : 'right-6 bottom-0'} mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 px-2 z-10`}>
                                                            <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-purple-100 hover:text-purple-700 rounded flex items-center gap-3">
                                                                <BookOpenText className="w-4 h-4 text-gray-600" />
                                                                <span>Project Library</span>
                                                            </button>
                                                            <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-100 flex items-center gap-3 rounded">
                                                                <Trash2 className="w-4 h-4" />
                                                                <span>Delete</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
                        <span className="text-sm text-gray-600">10 to 10 of results</span>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">Show per page:</span>
                            <select className="border border-gray-300 rounded-md px-3 py-1 text-sm">
                                <option>04</option>
                                <option>10</option>
                                <option>20</option>
                                <option>50</option>
                            </select>
                            <div className="flex gap-1">
                                <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                                    <ChevronLeft className="h-5 w-5"/>
                                </button>
                                <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                                    <ChevronRight className="h-5 w-5"/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Projects;