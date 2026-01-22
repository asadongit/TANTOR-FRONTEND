import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const OverviewTab = ({ projectData }) => {
    const InfoField = ({ label, value }) => (
        <div className="bg-white rounded-lg p-4 space-y-2">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-sm text-gray-900 font-medium break-words">{value}</div>
        </div>
    );

    const formatDate = (iso) => {
        if (!iso) return '—';
        const d = new Date(iso);
        return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB');
    };

    const statusLabel = (s) => {
        if (!s) return '—';
        const v = String(s).toLowerCase();
        return v === 'active' ? 'Active' : v === 'inactive' ? 'Inactive' : s;
    };

    const teamMembersLabel = (members) => {
        if (!members) return '—';
        if (Array.isArray(members)) return members.length ? members.join(', ') : '—';
        const s = String(members).trim();
        return s ? s : '—';
    };

    return (
        <div className='bg-gray-50 p-6 rounded-xl'>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoField label="Name" value={projectData?.name || '—'} />
                <InfoField label="Description" value={projectData?.description || '—'} />
                <InfoField label="Owner" value={projectData?.owner_name || projectData?.owner || '—'} />
                <InfoField label="Team Members" value={teamMembersLabel(projectData?.team_members)} />

                <InfoField label="Status" value={statusLabel(projectData?.status)} />
                <InfoField label="Created Date" value={formatDate(projectData?.created_at)} />
                <InfoField label="Updated Date" value={formatDate(projectData?.updated_at)} />

                <InfoField label="Project ID" value={projectData?.id || '—'} />
                <InfoField label="MLflow Experiment ID" value={projectData?.mlflow_experiment_id ?? '—'} />
                <InfoField label="Clone ID" value={projectData?.clone_id ?? '—'} />
            </div>
        </div>
    )
}

export default OverviewTab