import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Icon } from '@iconify-icon/react';

function Overview({ modelData }) {
  const [searchTerm, setSearchTerm] = useState('');

  const libraryData = [
    { sno: 1, name: 'Project - Churn', description: 'Predict churn risk', marketplaceId: '#1234', useCase: 'Use Case 1', createdDate: '01/10/2025', updatedDate: '05/10/2025', lastRunDate: '05/10/2025', type: 'Analytics', target: 'Churn' },
    { sno: 2, name: 'Project - Conversion', description: 'Improve conversion rates', marketplaceId: '#1234', useCase: 'Use Case 1', createdDate: '15/01/2025', updatedDate: '30/01/2025', lastRunDate: '05/10/2025', type: 'Marketing', target: 'Conver' },
    { sno: 3, name: 'Project - User Engage...', description: 'Enhance user engagement', marketplaceId: '#1234', useCase: 'Use Case 1', createdDate: '20/02/2025', updatedDate: '05/10/2025', lastRunDate: '05/10/2025', type: 'Product', target: 'Engag' },
    { sno: 4, name: 'Project - Customer Fe...', description: 'Analyze customer feedback', marketplaceId: '#1234', useCase: 'Use Case 1', createdDate: '10/03/2025', updatedDate: '25/03/2025', lastRunDate: '05/10/2025', type: 'Research', target: 'Feedb' },
    { sno: 5, name: 'Project - Market Expa...', description: 'Explore new markets', marketplaceId: '#1234', useCase: 'Use Case 1', createdDate: '01/04/2025', updatedDate: '15/04/2025', lastRunDate: '05/10/2025', type: 'Strategy', target: 'Expan' },
    { sno: 6, name: 'Project - Product Dev...', description: 'Launch new product line', marketplaceId: '#1234', useCase: 'Use Case 1', createdDate: '15/05/2025', updatedDate: '30/05/2025', lastRunDate: '05/10/2025', type: 'Development', target: 'Produ' },
    { sno: 7, name: 'Project - Brand Aware...', description: 'Increase brand visibility', marketplaceId: '#1234', useCase: 'Use Case 1', createdDate: '01/06/2025', updatedDate: '15/06/2025', lastRunDate: '05/10/2025', type: 'Campaign', target: 'Aware' },
    { sno: 8, name: 'Project - Customer Re...', description: 'Boost customer loyalty', marketplaceId: '#1234', useCase: 'Use Case 1', createdDate: '20/06/2025', updatedDate: '05/07/2025', lastRunDate: '05/10/2025', type: 'Analytics', target: 'Retent' },
    { sno: 9, name: 'Project - Social Media...', description: 'Enhance social media pre...', marketplaceId: '#1234', useCase: 'Use Case 1', createdDate: '10/07/2025', updatedDate: '25/07/2025', lastRunDate: '05/10/2025', type: 'Social Media', target: 'Social' },
    { sno: 10, name: 'Project - Data Security', description: 'Strengthen data protection', marketplaceId: '#1234', useCase: 'Use Case 1', createdDate: '01/08/2025', updatedDate: '15/08/2025', lastRunDate: '05/10/2025', type: 'Security', target: 'Secur' },
  ];

  const columns = [
    { key: 'sno', label: 'Sno', sortable: true, width: '60px' },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row) => <span className="text-purple-600">{row.name}</span>,
    },
    { key: 'description', label: 'Description', sortable: true },
    { key: 'marketplaceId', label: 'Marketplace ID', sortable: true },
    {
      key: 'useCase',
      label: 'Use Case',
      sortable: true,
      render: (row) => <span className="text-purple-600">{row.useCase}</span>,
    },
    { key: 'createdDate', label: 'Created Date', sortable: true },
    { key: 'updatedDate', label: 'Updated Date', sortable: true },
    { key: 'lastRunDate', label: 'Last Run Date', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'target', label: 'Target', sortable: true },
  ];

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return libraryData;
    const q = searchTerm.toLowerCase();
    return libraryData.filter((row) =>
      Object.values(row || {}).some((val) =>
        String(val ?? '').toLowerCase().includes(q)
      )
    );
  }, [searchTerm]);

  const overviewData = {
    name: modelData?.name || modelData?.run_name || '—',
    description: modelData?.description || '—',
    marketplaceId: modelData?.marketplaceId || '—',
    useCase: modelData?.useCase || '—',
    owner: modelData?.owner || '—',
    createdDate: modelData?.createdDate || modelData?.created_date || '—',
    updatedDate: modelData?.updatedDate || '—',
    lastRunDate: modelData?.lastRunDate || '—',
    type: modelData?.type || '—',
    targetVariable: modelData?.targetVariable || modelData?.target || '—',
    projects: modelData?.projects || '—',
    status: modelData?.status || '—',
    modelId: modelData?.id ?? '—',
  };

  const InfoCard = ({ label, value }) => (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-base font-semibold text-gray-800">{value}</p>
    </div>
  );

  return (
    <div className="space-y-4">


      <div className="grid grid-cols-3 gap-4">
        <InfoCard label="Name" value={overviewData.name} />
        <InfoCard label="Description" value={overviewData.description} />
        <InfoCard label="Model ID" value={overviewData.modelId} />

        <InfoCard label="Status" value={overviewData.status} />
        <InfoCard label="Created Date" value={overviewData.createdDate} />
        <InfoCard label="Type" value={overviewData.type} />

        <InfoCard label="Use Case" value={overviewData.useCase} />
        <InfoCard label="Owner" value={overviewData.owner} />
        <InfoCard label="Marketplace ID" value={overviewData.marketplaceId} />

        <InfoCard label="Updated Date" value={overviewData.updatedDate} />
        <InfoCard label="Last Run Date" value={overviewData.lastRunDate} />
        <InfoCard label="Target Variable" value={overviewData.targetVariable} />

        <InfoCard label="Projects" value={overviewData.projects} />
      </div>
    </div>
  );
}

export default Overview;
