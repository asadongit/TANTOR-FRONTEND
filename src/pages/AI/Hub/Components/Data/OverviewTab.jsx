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
                <InfoField label="Name" value="Customer_Transactions_2024" />
                <InfoField label="Description" value="Contains transactional data of customers for..." />
                <InfoField label="Size (in GB)" value={datasetData?.size || '2.4 GB'} />

                <InfoField label="Connection" value="PostgreSQL — Analytics_DB" />
                <InfoField label="Schema" value="public" />
                <InfoField label="Table" value="customer_transactions" />

                <InfoField label="Owner" value="Data Engineering Team" />
                <InfoField label="Created Date" value={datasetData?.createdDate || '05/10/2025'} />
                <InfoField label="Updated Date" value={datasetData?.updatedDate || '05/10/2025'} />

                <InfoField label="Last Used" value={datasetData?.lastUsedDate || '05/10/2025'} />
                <InfoField label="Rows" value={datasetData?.rows || '1,245,320'} />
                <InfoField label="Features" value={datasetData?.features || 'customer_id, transaction_id, transaction_date...'} />

                <InfoField label="Domain" value="Finance" />
                <InfoField label="Category" value="Customer Transactions" />
                <InfoField label="Tag" value="Payments" />

                <InfoField label="Sub-Tag" value="Credit & Debit Transactions" />
            </div>
        </div>
    );
};

export default OverviewTab;