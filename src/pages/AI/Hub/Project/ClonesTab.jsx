// ClonesTab.jsx
import React, { useState, useMemo } from 'react';
import { Search, EllipsisVertical } from 'lucide-react';
import DataTable from '../../../../components/DataTable';

const ClonesTab = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const clonesData = [
        {
            sno: 1,
            name: 'Project - Churn',
            description: 'Churn',
            created_date: '01/10/2025',
            owner: 'Salah',
            status: 'Active'
        },
        {
            sno: 2,
            name: 'Project - Analysis',
            description: 'Churn',
            created_date: '01/10/2025',
            owner: 'Salah',
            status: 'Inactive'
        },
        {
            sno: 3,
            name: 'Project - Retention',
            description: 'Retention',
            created_date: '15/11/2025',
            owner: 'Mekong',
            status: 'Active'
        },
        {
            sno: 4,
            name: 'Project - Acquisition',
            description: 'Acquisition',
            created_date: '01/12/2025',
            owner: 'Amazon',
            status: 'Active'
        },
        {
            sno: 5,
            name: 'Project - Engagement',
            description: 'Engagement',
            created_date: '20/12/2025',
            owner: 'Nile',
            status: 'Inactive'
        },
        {
            sno: 6,
            name: 'Project - Onboarding',
            description: 'Onboarding',
            created_date: '05/01/2026',
            owner: 'Yangtze',
            status: 'Active'
        },
        {
            sno: 7,
            name: 'Project - Feedback',
            description: 'Feedback',
            created_date: '30/01/2026',
            owner: 'Danube',
            status: 'Active'
        },
        {
            sno: 8,
            name: 'Project - Analysis',
            description: 'Analysis',
            created_date: '15/02/2026',
            owner: 'Thames',
            status: 'Inactive'
        },
        {
            sno: 9,
            name: 'Project - Strategy',
            description: 'Strategy',
            created_date: '01/03/2026',
            owner: 'Seine',
            status: 'Active'
        },
        {
            sno: 10,
            name: 'Project - Optimization',
            description: 'Optimization',
            created_date: '15/03/2026',
            owner: 'Mississippi',
            status: 'Active'
        }
    ];

    const columns = [
        { key: 'sno', label: 'Sno', sortable: true, width: '80px' },
        {
            key: 'name',
            label: 'Name',
            sortable: true,
            render: (row) => <span className="text-[#8e78b7] hover:underline cursor-pointer">{row.name}</span>,
        },
        { key: 'description', label: 'Description', sortable: true },
        { key: 'created_date', label: 'Created Date', sortable: true },
        { key: 'owner', label: 'Owner', sortable: true },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (row) => (
                <span className={`px-3 py-1 rounded-md text-xs font-medium ${row.status === 'Active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {row.status}
                </span>
            )
        },
    ];

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return clonesData;
        const q = searchTerm.toLowerCase();
        return clonesData.filter((row) =>
            Object.values(row || {}).some((val) =>
                String(val ?? '').toLowerCase().includes(q)
            )
        );
    }, [searchTerm]);

    return (
        <div>
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search Clones"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                </div>
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <EllipsisVertical className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            <DataTable
                columns={columns}
                data={filteredData}
                actions={[]}
                isLoading={isLoading}
                isError={false}
            />
        </div>
    );
};

export default ClonesTab;