import React, { useState, useMemo } from 'react';
import { Search, EllipsisVerticalIcon } from 'lucide-react';
import DataTable from '../../../../../../../components/DataTable';

const XAI = (modelData) => {
    console.log(modelData.modelData.run_name)
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

    const xaiData = [
        {
            sno: 1,
            shap: 'SHAP Analysis 1',
            pdp: 'PDP Result 1',
            lime: 'LIME Explanation 1',
            cf: 'CF Analysis 1',
            lift_chart: 'Lift Chart 1',
            fairness: 'Fair'
        },
        {
            sno: 2,
            shap: 'SHAP Analysis 2',
            pdp: 'PDP Result 2',
            lime: 'LIME Explanation 2',
            cf: 'CF Analysis 2',
            lift_chart: 'Lift Chart 2',
            fairness: 'Biased'
        },
        {
            sno: 3,
            shap: 'SHAP Analysis 3',
            pdp: 'PDP Result 3',
            lime: 'LIME Explanation 3',
            cf: 'CF Analysis 3',
            lift_chart: 'Lift Chart 3',
            fairness: 'Fair'
        },
        {
            sno: 4,
            shap: 'SHAP Analysis 4',
            pdp: 'PDP Result 4',
            lime: 'LIME Explanation 4',
            cf: 'CF Analysis 4',
            lift_chart: 'Lift Chart 4',
            fairness: 'Fair'
        },
        {
            sno: 5,
            shap: 'SHAP Analysis 5',
            pdp: 'PDP Result 5',
            lime: 'LIME Explanation 5',
            cf: 'CF Analysis 5',
            lift_chart: 'Lift Chart 5',
            fairness: 'Biased'
        }
    ];

    const columns = [
        { key: 'sno', label: 'Sno', sortable: true, width: '80px' },
        { key: 'shap', label: 'Shap', sortable: true },
        { key: 'pdp', label: 'PDP', sortable: true },
        { key: 'lime', label: 'Lime', sortable: true },
        { key: 'cf', label: 'CF', sortable: true },
        { key: 'lift_chart', label: 'Lift Chart', sortable: true },
        { key: 'fairness', label: 'Fairness', sortable: true },
    ];

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return xaiData;
        const q = searchTerm.toLowerCase();
        return xaiData.filter((row) =>
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
                        placeholder="Search XAI"
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

export default XAI;