import React, { useState, useMemo } from 'react';
import { Search, EllipsisVerticalIcon } from 'lucide-react';
import DataTable from '../../../../../../../components/DataTable';

const Access = () => {
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

    const accessData = [
        {
            sno: 1,
            name: 'John Doe',
            role: 'Admin',
            group: 'Engineering',
            sub_group: 'Frontend',
            persona: 'Developer'
        },
        {
            sno: 2,
            name: 'Jane Smith',
            role: 'Editor',
            group: 'Marketing',
            sub_group: 'Content',
            persona: 'Analyst'
        },
        {
            sno: 3,
            name: 'Mike Johnson',
            role: 'Viewer',
            group: 'Sales',
            sub_group: 'Regional',
            persona: 'Manager'
        },
        {
            sno: 4,
            name: 'Sarah Williams',
            role: 'Admin',
            group: 'Engineering',
            sub_group: 'Backend',
            persona: 'Developer'
        },
        {
            sno: 5,
            name: 'Chris Brown',
            role: 'Editor',
            group: 'Product',
            sub_group: 'Design',
            persona: 'Designer'
        }
    ];

    const columns = [
        { key: 'sno', label: 'Sno', sortable: true, width: '80px' },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'role', label: 'Role', sortable: true },
        { key: 'group', label: 'Group', sortable: true },
        { key: 'sub_group', label: 'Sub Group', sortable: true },
        { key: 'persona', label: 'Persona', sortable: true },
    ];

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return accessData;
        const q = searchTerm.toLowerCase();
        return accessData.filter((row) =>
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
                        placeholder="Search Access"
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
    );
};

export default Access;