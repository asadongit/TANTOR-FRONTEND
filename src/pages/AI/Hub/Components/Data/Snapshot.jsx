import React, { useState, useEffect } from 'react';
import DataTable from '../../../../../components/DataTable';
import { useAuth } from '../../../../../context/AuthContext';

function Snapshot({ datasetData }) {
    const [data, setData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { token } = useAuth();
    const hostnameAI = window._env_?.VITE_AI_API;

    useEffect(() => {
        if (!datasetData?.id || !datasetData?.file_name) return;

        const fetchSnapshot = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${hostnameAI}/canvas/dataset/preview/top-50?dataset_id=${datasetData.id}&dataset_name=${datasetData.file_name}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) throw new Error('Failed to fetch snapshot data');
                const result = await response.json();
                const snapshotData = result.data || [];
                setData(snapshotData);
                if (snapshotData.length > 0) {
                    const cols = Object.keys(snapshotData[0]).map(key => ({
                        key,
                        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        sortable: true,
                        width: '150px',
                    }));
                    setColumns(cols);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSnapshot();
    }, [datasetData, hostnameAI, token]);

    return (
        <div>
            <h2 className="text-lg font-semibold mb-4">Snapshot</h2>
            {loading && <div>Loading...</div>}
            {error && <div className="text-red-500">{error}</div>}
            {!loading && !error && (
                <div style={{ overflowX: 'auto' }}>
                    <DataTable
                        columns={columns}
                        data={data}
                        isLoading={false}
                        isError={false}
                    />
                </div>
            )}
        </div>
    );
}

export default Snapshot;