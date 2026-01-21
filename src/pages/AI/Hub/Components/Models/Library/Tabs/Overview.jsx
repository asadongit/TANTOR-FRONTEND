import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Icon } from '@iconify-icon/react';

function Overview({ modelData }) {
  const [searchTerm, setSearchTerm] = useState('');

  const md = modelData?.modelData ?? modelData ?? {};

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    // screenshot shows date-only like 01/10/2025
    return d.toLocaleDateString('en-GB');
  };

  const overviewData = {
    // row 1
    name: md?.name || md?.run_name || '—',
    description: (md?.description ?? '') || '—',
    marketplaceId: md?.marketplace_id ?? md?.marketplaceId ?? '—',

    // row 2
    useCase: md?.usecase ?? md?.useCase ?? '—',
    owner: md?.user_name ?? md?.owner_name ?? md?.owner ?? '—',
    createdDate: formatDate(md?.created_at),

    // row 3
    updatedDate: formatDate(md?.updated_at),
    lastRunDate: formatDate(md?.last_run_at ?? md?.lastRunAt ?? md?.updated_at),
    type: md?.modeling_type || md?.type || '—',

    // row 4
    targetVariable: md?.target_variable || md?.targetVariable || md?.target || '—',
    projects: md?.project_name ?? md?.project ?? md?.projectName ?? '—',
  };

  const InfoCard = ({ label, value }) => (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-800 break-words">{value}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <InfoCard label="Name" value={overviewData.name} />
        <InfoCard label="Description" value={overviewData.description} />
        <InfoCard label="Marketplace ID" value={overviewData.marketplaceId} />

        <InfoCard label="Use Case" value={overviewData.useCase} />
        <InfoCard label="Owner" value={overviewData.owner} />
        <InfoCard label="Created Date" value={overviewData.createdDate} />

        <InfoCard label="Updated Date" value={overviewData.updatedDate} />
        <InfoCard label="Last Run Date" value={overviewData.lastRunDate} />
        <InfoCard label="Type" value={overviewData.type} />

        <InfoCard label="Target Variable" value={overviewData.targetVariable} />
        <InfoCard label="Projects" value={overviewData.projects} />
        <div className="bg-transparent" />
      </div>
    </div>
  );
}

export default Overview;
