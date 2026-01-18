import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Icon } from '@iconify-icon/react';

function Overview({ modelData }) {
  const [searchTerm, setSearchTerm] = useState('');

  const md = modelData?.modelData ?? modelData ?? {};

  const formatDateTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-GB');
  };

  const overviewData = {
    name: md?.name || md?.run_name || '—',
    description: md?.description || '—',
    status: md?.status || '—',
    type: md?.modeling_type || md?.type || '—',
    targetVariable: md?.target_variable || md?.targetVariable || md?.target || '—',
    createdAt: formatDateTime(md?.created_at),
    updatedAt: formatDateTime(md?.updated_at),
    modelId: md?.id ?? '—',
    marketplaceId: md?.marketplace_id ?? md?.marketplaceId ?? '—',
    useCase: md?.usecase ?? md?.useCase ?? '—',
  };

  const InfoCard = ({ label, value }) => (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-base font-semibold text-gray-800 break-words">{value}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <InfoCard label="Model Name" value={overviewData.name} />
        <InfoCard label="Status" value={overviewData.status} />
        <InfoCard label="Model Type" value={overviewData.type} />

        <InfoCard label="Target Variable" value={overviewData.targetVariable} />
        <InfoCard label="Created At" value={overviewData.createdAt} />
        <InfoCard label="Updated At" value={overviewData.updatedAt} />

        <InfoCard label="Description" value={overviewData.description} />
        <InfoCard label="Model ID" value={overviewData.modelId} />
        <InfoCard label="Use Case" value={overviewData.useCase} />
      </div>
    </div>
  );
}

export default Overview;
