import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const OverviewTab = ({ projectData }) => {
    const InfoField = ({ label, value }) => (
        <div className="bg-white rounded-lg p-4 space-y-2">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-sm text-gray-900 font-medium">{value}</div>
        </div>
    );

    return (
        <div className='bg-gray-50 p-6 rounded-xl'>
            <div className="grid grid-cols-3 gap-4">
                <InfoField label="Name" value={projectData?.name || 'Project - Churn'} />
                <InfoField label="Description" value={projectData?.description || 'Predict churn risk'} />
                <InfoField label="Owner" value={projectData?.owner || 'Salish'} />

                <InfoField label="Created Date" value={projectData?.created_date || '01/10/2025'} />
                <InfoField label="Updated Date" value={projectData?.updated_date || '05/10/2025'} />
                <InfoField label="Domain" value={projectData?.domain || 'Retail'} />

                <InfoField label="Category" value={projectData?.category || 'Analytics'} />
                <InfoField label="Tag" value={projectData?.tag || 'Churn Model'} />
                <InfoField label="Sub Tag" value={projectData?.sub_tag || 'High Risk'} />
            </div>
        </div>
    )
}

export default OverviewTab