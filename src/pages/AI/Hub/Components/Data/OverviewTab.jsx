import React from 'react';

const OverviewTab = ({ datasetData }) => {
    const InfoField = ({ label, value }) => (
        <div className="space-y-1">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-base text-gray-900 font-medium truncate">{value}</div>
        </div>
    );

    return (
        <div className="bg-gray-50 p-6 rounded-xl">
            <div className="grid grid-cols-3 gap-6">
                <InfoField label="Name" value={datasetData?.file_name || '-'} />
                <InfoField label="Description" value={datasetData?.description || '-'} />
                <InfoField label="Size" value={datasetData?.size_gb ?? datasetData?.size_mb ? (datasetData.size_mb / 1024).toFixed(1) + ' GB' : '-'} />
                <InfoField label="Owner" value={datasetData?.username || '-'} />
                <InfoField label="Project" value={datasetData?.project_name || '-'} />
                <InfoField label="Created Date" value={datasetData?.created_at ? new Date(datasetData.created_at).toLocaleDateString('en-GB') : '-'} />
                <InfoField label="Updated Date" value={datasetData?.updated_at ? new Date(datasetData.updated_at).toLocaleDateString('en-GB') : '-'} />
                <InfoField label="Rows" value={datasetData?.row_count?.toLocaleString() ?? '-'} />
                <InfoField label="Columns" value={datasetData?.column_count?.toLocaleString() ?? '-'} />

                <InfoField label="Domain" value={datasetData?.domain || '-'} />
                <InfoField label="Category" value={datasetData?.category || '-'} />
                <InfoField label="Tag" value={datasetData?.tag || '-'} />
                <InfoField label="Sub-Tag" value={datasetData?.sub_tag || '-'} />
            </div>
        </div>
    );
};

export default OverviewTab;