import React, { useState, useMemo, useRef, useCallback } from 'react';
import { ArrowUp, ArrowDown, Info } from 'lucide-react';
import { Icon } from '@iconify-icon/react';
import DataTable from '../../../../../../../components/DataTable';

function Features() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);


  const metricsData = [
    {
      title: 'Projects',
      count: 39,
      trend: 'up',
      trendValue: '10%',
      icon: 'material-symbols:check-circle-outline',
      color: 'border-l-purple-500',
    },
    {
      title: 'Projects',
      count: 15,
      trend: 'up',
      trendValue: '6%',
      icon: 'material-symbols:check-circle-outline',
      color: 'border-l-green-500',
    },
    {
      title: 'Projects',
      count: '82%',
      trend: 'up',
      trendValue: '2%',
      icon: 'material-symbols:check-circle-outline',
      color: 'border-l-yellow-500',
    },
    {
      title: 'Projects',
      count: 9,
      trend: 'down',
      trendValue: '2%',
      icon: 'material-symbols:check-circle-outline',
      color: 'border-l-pink-500',
    },
    {
      title: 'Projects',
      count: '17sec',
      trend: 'down',
      trendValue: '2%',
      icon: 'material-symbols:check-circle-outline',
      color: 'border-l-cyan-500',
    },
  ];

  const columns = [
      { key: 'sno', label: 'Sno', sortable: true, width: '90px' },
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        render: (row) => <span className="text-purple-600 hover:underline cursor-pointer">{row.name}</span>,
      },
      { key: 'description', label: 'Description', sortable: true },
      { key: 'created_date', label: 'Created Date', sortable: true },
      { key: 'type', label: 'Type', sortable: true },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (row) => (
          <span className={`px-3 py-1 rounded-md text-xs font-medium ${getStatusStyle(row.status)}`}>
            {row.status}
          </span>
        ),
      },
      { label: 'Action', sortable: false },
    ];

    const projectsData = [
    { sno: 1, name: 'Project - Churn', description: 'Churn', created_date: '01/10/2025', type: 'Salish', status: 'Deployed' },
    { sno: 2, name: 'Project - Analysis', description: 'Churn', created_date: '01/10/2025', type: 'Salish', status: 'Archived' },
    { sno: 3, name: 'Project - Retention', description: 'Retention', created_date: '15/11/2025', type: 'Mekong', status: 'Deployed' },
    { sno: 4, name: 'Project - Acquisition', description: 'Acquisition', created_date: '01/12/2025', type: 'Amazon', status: 'Deployed' },
    { sno: 5, name: 'Project - Engagement', description: 'Engagement', created_date: '20/12/2025', type: 'Nile', status: 'In progress' },
    { sno: 6, name: 'Project - Onboarding', description: 'Onboarding', created_date: '05/01/2026', type: 'Yangtze', status: 'Inactive' },
    { sno: 7, name: 'Project - Feedback', description: 'Feedback', created_date: '30/01/2026', type: 'Danube', status: 'Deployed' },
    { sno: 8, name: 'Project - Analysis', description: 'Analysis', created_date: '15/02/2026', type: 'Thames', status: 'Archived' },
    { sno: 9, name: 'Project - Strategy', description: 'Strategy', created_date: '01/03/2026', type: 'Seine', status: 'Deployed' },
    { sno: 10, name: 'Project - Optimization', description: 'Optimization', created_date: '15/03/2026', type: 'Mississippi', status: 'Archived' },
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Deployed':
        return 'bg-green-100 text-green-700';
      case 'Archived':
        return 'bg-gray-100 text-gray-600';
      case 'In progress':
        return 'bg-blue-100 text-blue-700';
      case 'Inactive':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

    const actions = [
      {
        label: 'Library',
        icon: <Icon icon="material-symbols:library-books-outline" className="w-5 h-5" />,
        onClick: (row) => navigate('/ai/hub/models/library', { state: { modelData: row } }),
        tooltip: 'Library',
      },
      {
        label: 'F1 Mode',
        icon: <Icon icon="material-symbols:speed-outline" className="w-5 h-5" />,
        onClick: (row) => console.log('F1 Mode:', row),
        tooltip: 'F1 Mode',
      },
      {
        label: 'AI Canvas',
        icon: <Icon icon="material-symbols:draw-outline" className="w-5 h-5" />,
        onClick: (row) => console.log('AI Canvas:', row),
        tooltip: 'AI Canvas',
      },
      {
        label: 'Deploy',
        icon: <Icon icon="material-symbols:rocket-launch-outline" className="w-5 h-5" />,
        onClick: (row) => console.log('Deploy:', row),
        tooltip: 'Deploy',
      },
      {
        label: 'Archive',
        icon: <Icon icon="material-symbols:archive-outline" className="w-5 h-5" />,
        onClick: (row) => console.log('Archive:', row),
        tooltip: 'Archive',
      },
      {
        label: 'Delete',
        icon: <Icon icon="material-symbols:delete-outline" className="w-5 h-5" />,
        onClick: (row) => console.log('Delete:', row),
        tooltip: 'Delete',
      },
    ];

      const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return projectsData;
        const q = searchTerm.toLowerCase();
        return projectsData.filter((row) =>
          Object.values(row || {}).some((val) =>
            String(val ?? '').toLowerCase().includes(q)
          )
        );
      }, [searchTerm, projectsData]);

  const StatCard = ({ title, count, trend, trendValue, icon, color }) => (
    <div className="bg-white rounded-xl px-5 py-4 border border-purple-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Icon icon={icon} className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-gray-600 text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-800">{count}</span>
          {trend === 'up' ? (
            <ArrowUp className="w-4 h-4 text-orange-500" />
          ) : (
            <ArrowDown className="w-4 h-4 text-orange-500" />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
<div className="bg-gradient-to-r from-purple-400 via-purple-300 to-purple-200 rounded-2xl p-4">
            <div className="grid grid-cols-5 gap-4">
              {metricsData.map((metric, index) => (
                <StatCard key={index} {...metric} />
              ))}
            </div>



          </div>

          <DataTable
        columns={columns}
        data={filteredData}
        actions={actions}
        isLoading={isLoading}
        isError={false}
        // refetch={handleRefresh}
        // resetSortTrigger={refreshTrigger}
      />
    </div>


  )
}

export default Features