import { X } from 'lucide-react';
import React, { useState, useEffect } from 'react';

const API_BASE_URL = `${window._env_?.VITE_FAST_API}/data_lineage`;

const AssetInformationModal = ({ nodeData, isOpen, onClose }) => {
    const [assetInfo, setAssetInfo] = useState(null);
    const [businessCatalog, setBusinessCatalog] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && nodeData) {
            fetchAssetInformation();
        } else {
            setAssetInfo(null);
            setBusinessCatalog(null);
            setError(null);
        }
    }, [isOpen, nodeData]);

    const extractSchemaName = (fullSchemaPath) => {
        if (!fullSchemaPath) return 'Unknown';

        const parts = fullSchemaPath.split('.');
        return parts[parts.length - 1];
    };

    const fetchAssetInformation = async () => {
        if (!nodeData) return;

        setIsLoading(true);
        setError(null);

        try {
            const nodeId = nodeData.fullName || '';
            const parts = nodeId.split('.');

            let connectionName = parts[0] || 'Unknown';
            let schemaName = 'Unknown';
            let tableName = null;

            if (nodeData.type === 'schema') {
                schemaName = extractSchemaName(nodeId);
            } else if (nodeData.type === 'table') {
                if (parts.length > 1) {
                    const schemaParts = parts.slice(0, -1);
                    schemaName = extractSchemaName(schemaParts.join('.'));
                    tableName = parts[parts.length - 1];
                }
            }

            const payload = {
                connection_name: connectionName,
                table_schema: schemaName,
                type: nodeData.type.toLowerCase()
            };

            if (nodeData.type === 'table' && tableName) {
                payload.table_name = tableName;
            }

            const response = await fetch(`${API_BASE_URL}/vizualization/asset_information`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setAssetInfo(data.asset_information);
            setBusinessCatalog(data.business_catalogue || {});
        } catch (err) {
            console.error('Error fetching asset information:', err);
            setError('Failed to fetch asset information');
        } finally {
            setIsLoading(false);
        }
    };

    const getCommaSeparatedValues = (items, key = 'name') => {
        if (!items || !Array.isArray(items) || items.length === 0) return 'N/A';

        return items
            .map(item => item[key] || '')
            .filter(value => value)
            .join(', ');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
            <div className="bg-white w-[24%] h-full overflow-y-auto shadow-xl flex flex-col">
                <div className="flex justify-between items-center p-5 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Asset Information</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-lg font-semibold"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="w-10 h-10 border-2 border-[#8e78b7] border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-600">Loading asset information...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 p-4 rounded-md">
                            <p className="font-medium text-red-700">Error</p>
                            <p className="mt-1 text-red-600">{error}</p>
                        </div>
                    ) : assetInfo ? (
                        <div className="space-y-6">

                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-4 uppercase tracking-wide">Basic Information</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Type</p>
                                        <p className="text-sm text-gray-800 capitalize">{assetInfo.type || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Database</p>
                                        <p className="text-sm text-gray-800 capitalize">{assetInfo.connection_type || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Connection</p>
                                        <p className="text-sm text-gray-800">{assetInfo.connection_name || 'N/A'}</p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Schema</p>
                                        <p className="text-sm text-gray-800">{assetInfo.table_schema || 'N/A'}</p>
                                    </div>

                                    {assetInfo.table_name && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Table</p>
                                            <p className="text-sm text-gray-800">{assetInfo.table_name}</p>
                                        </div>
                                    )}

                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Created By</p>
                                        <p className="text-sm text-gray-800">{assetInfo.created_by || 'N/A'}</p>
                                    </div>

                                </div>
                            </div>

                            {businessCatalog && Object.keys(businessCatalog).length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-4 uppercase tracking-wide">Business Catalog</h3>
                                    <div className="space-y-4">
                                        {businessCatalog.domain && businessCatalog.domain.length > 0 && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Domains</p>
                                                <p className="text-sm text-gray-800">
                                                    {getCommaSeparatedValues(businessCatalog.domain)}
                                                </p>
                                            </div>
                                        )}

                                        {businessCatalog.category && businessCatalog.category.length > 0 && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Categories</p>
                                                <p className="text-sm text-gray-800">
                                                    {getCommaSeparatedValues(businessCatalog.category)}
                                                </p>
                                            </div>
                                        )}

                                        {businessCatalog.sub_category && businessCatalog.sub_category.length > 0 && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Sub Categories</p>
                                                <p className="text-sm text-gray-800">
                                                    {getCommaSeparatedValues(businessCatalog.sub_category)}
                                                </p>
                                            </div>
                                        )}

                                        {businessCatalog.tag && businessCatalog.tag.length > 0 && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Tags</p>
                                                <p className="text-sm text-gray-800">
                                                    {getCommaSeparatedValues(businessCatalog.tag)}
                                                </p>
                                            </div>
                                        )}

                                        {businessCatalog.sub_tag && businessCatalog.sub_tag.length > 0 && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Sub Tags</p>
                                                <p className="text-sm text-gray-800">
                                                    {getCommaSeparatedValues(businessCatalog.sub_tag)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <p>No asset information available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssetInformationModal;