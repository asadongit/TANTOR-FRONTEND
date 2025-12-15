import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, List, RefreshCw, ChevronLeft, EllipsisVertical, ChevronDown, ChevronRight, EllipsisVerticalIcon } from 'lucide-react';
import DataTable from '../../../../../components/DataTable';
import Breadcrumb from '../../../../../components/Breadcrumb';
import CommentsTab from './CommentsTab';
import ClonesTab from './ClonesTab';

const OverviewTab = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };
    const handleRefresh = () => {
        setIsLoading(true);
        setRefreshTrigger(prev => prev + 1);
        setTimeout(() => setIsLoading(false), 1000);
    };
    const projectLibraryData = [
        {
            sno: 1,
            name: 'Project - Churn',
            description: 'Predict churn risk',
            owner: 'Salah',
            created_date: '01/10/2025',
            updated_date: '05/10/2025',
            domain: 'Retail',
            category: 'Analytics',
            tag: 'Churn Model',
            sub_tag: 'High Risk'
        },
        {
            sno: 2,
            name: 'Project - Convection',
            description: 'Improve conversion rates',
            owner: 'Jordan',
            created_date: '15/01/2025',
            updated_date: '30/01/2025',
            domain: 'E-commerce',
            category: 'Marketing',
            tag: 'Conversion Fun..',
            sub_tag: 'Medium Risk'
        },
        {
            sno: 3,
            name: 'Project - User',
            description: 'Enhance user engagement',
            owner: 'Alex',
            created_date: '20/02/2025',
            updated_date: '05/03/2025',
            domain: 'Mobile',
            category: 'Product',
            tag: 'Engagement St..',
            sub_tag: 'Low Risk'
        },
        {
            sno: 4,
            name: 'Project - Overhead',
            description: 'Analyze customer feedback',
            owner: 'Taylor',
            created_date: '10/03/2025',
            updated_date: '25/03/2025',
            domain: 'SaaS',
            category: 'Research',
            tag: 'Feedback And..',
            sub_tag: 'Medium Risk'
        },
        {
            sno: 5,
            name: 'Project - Marketing',
            description: 'Explore new markets',
            owner: 'Jamie',
            created_date: '01/04/2025',
            updated_date: '15/04/2025',
            domain: 'Retail',
            category: 'Strategy',
            tag: 'Expansion Plan',
            sub_tag: 'High Risk'
        },
        {
            sno: 6,
            name: 'Project - Production',
            description: 'Launch new product line',
            owner: 'Morgan',
            created_date: '16/05/2025',
            updated_date: '30/05/2025',
            domain: 'Technology',
            category: 'Development',
            tag: 'Product Launch',
            sub_tag: 'Medium Risk'
        },
        {
            sno: 7,
            name: 'Project - Brand',
            description: 'Increase brand visibility',
            owner: 'Chris',
            created_date: '01/06/2025',
            updated_date: '15/06/2025',
            domain: 'Marketing',
            category: 'Campaign',
            tag: 'Awareness Strategy',
            sub_tag: 'Low Risk'
        },
        {
            sno: 8,
            name: 'Project - Customer',
            description: 'Boost customer loyalty',
            owner: 'Pat',
            created_date: '20/06/2025',
            updated_date: '05/07/2025',
            domain: 'Retail',
            category: 'Analytics',
            tag: 'Retention Stud..',
            sub_tag: 'High Risk'
        },
        {
            sno: 9,
            name: 'Project - Social Media',
            description: 'Enhance social media',
            owner: 'Jordan',
            created_date: '10/07/2025',
            updated_date: '25/07/2025',
            domain: 'Digital Marketing',
            category: 'Social Media',
            tag: 'Social Engage..',
            sub_tag: 'Medium Risk'
        },
        {
            sno: 10,
            name: 'Project - Data',
            description: 'Strengthen data protection',
            owner: 'Taylor',
            created_date: '01/08/2025',
            updated_date: '30/08/2025',
            domain: 'Technology',
            category: 'Security',
            tag: 'Security Audit',
            sub_tag: 'High Risk'
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
        { key: 'owner', label: 'Owner', sortable: true },
        { key: 'created_date', label: 'Created Date', sortable: true },
        { key: 'updated_date', label: 'Updated Date', sortable: true },
        { key: 'domain', label: 'Domain', sortable: true },
        { key: 'category', label: 'Category', sortable: true },
        { key: 'tag', label: 'Tag', sortable: true },
        { key: 'sub_tag', label: 'Sub Tag', sortable: true },
    ];

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return projectLibraryData;
        const q = searchTerm.toLowerCase();
        return projectLibraryData.filter((row) =>
            Object.values(row || {}).some((val) =>
                String(val ?? '').toLowerCase().includes(q)
            )
        );
    }, [searchTerm]);

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search Projects"
                        className="w-full sm:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredData}
                actions={[]}
                isLoading={isLoading}
                isError={false}
                refetch={handleRefresh}
                resetSortTrigger={refreshTrigger}
            />
        </>
    )
}

export default OverviewTab