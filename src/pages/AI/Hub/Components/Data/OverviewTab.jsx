import React from 'react';

const OverviewTab = ({ datasetData }) => {
    const InfoField = ({ label, value }) => (
        <div className="bg-white rounded-lg p-4 space-y-2 shadow-sm">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-sm text-gray-900 font-medium">{value}</div>
        </div>
    );

    return (
        <div className='bg-gray-50 p-6 rounded-xl'>
            <div className="grid grid-cols-3 gap-4">
                <InfoField label="ID" value={datasetData?.id || '-'} />
                <InfoField label="File Name" value={datasetData?.file_name || '-'} />
                <InfoField label="Owner ID" value={datasetData?.user_id || '-'} />
                <InfoField label="Project ID" value={datasetData?.project_id || '-'} />
                <InfoField label="Rows" value={datasetData?.row_count ?? '-'} />
                <InfoField label="Columns" value={datasetData?.column_count ?? '-'} />
                <InfoField label="Source" value={datasetData?.source || '-'} />
                {/* <InfoField label="File Path" value={datasetData?.filepath || '-'} /> */}
                <InfoField label="Status" value={datasetData?.status || '-'} />
                <InfoField label="Description" value={datasetData?.description || '-'} />
                <InfoField label="Created Date" value={datasetData?.created_at ? new Date(datasetData.created_at).toLocaleString('en-GB') : '-'} />
                <InfoField label="Updated Date" value={datasetData?.updated_at ? new Date(datasetData.updated_at).toLocaleString('en-GB') : '-'} />
                <InfoField label="Domain" value={datasetData?.domain || '-'} />
                <InfoField label="Category" value={datasetData?.category || '-'} />
                <InfoField label="Tag" value={datasetData?.tag || '-'} />
                <InfoField label="Sub-Tag" value={datasetData?.sub_tag || '-'} />
                <InfoField label="Size" value={datasetData?.size_mb ?? '-'} />
            </div>
        </div>
    );
};

export default OverviewTab;