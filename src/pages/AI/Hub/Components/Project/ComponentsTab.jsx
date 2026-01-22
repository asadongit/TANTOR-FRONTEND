import { ChevronDown, ChevronRight, Search, BookOpen, Gauge, Palette, Archive, Trash2, Rocket, Sparkles } from "lucide-react"
import DataTable from "../../../../../components/DataTable"
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../../context/AuthContext";

const ComponentsTab = ({ projectData }) => {
    const navigate = useNavigate();
    const { token, decodedToken } = useAuth();
    const hostnameAI = window._env_?.VITE_AI_API;

    const projectId = projectData?.id;
    const projectName = projectData?.name;

    const [searchTerm, setSearchTerm] = useState('');
    const [expandedSections, setExpandedSections] = useState({
        datasets: false,
        models: false,
    });

    // Datasets state
    const [datasets, setDatasets] = useState([]);
    const [datasetsLoading, setDatasetsLoading] = useState(false);
    const [datasetsError, setDatasetsError] = useState(null);

    const [models, setModels] = useState([]);
    const [modelsLoading, setModelsLoading] = useState(false);
    const [modelsError, setModelsError] = useState(null);

    const [entityNavLoading, setEntityNavLoading] = useState(false);

    const fetchDatasetById = async (row) => {
        const datasetId = row?.dataset_id ?? row?.id ?? row?.uuid ?? row?.file_id;
        if (!datasetId) return row;
        const res = await fetch(`${hostnameAI}/canvas/list_data_info?data_id=${encodeURIComponent(datasetId)}`, {
            headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
        });
        if (!res.ok) throw new Error("Failed to fetch dataset");
        const list = await res.json();
        return Array.isArray(list) && list.length > 0 ? list[0] : row;
    };

    const fetchModelById = async (row) => {
        const modelId = row?.model_id ?? row?.id;
        if (!modelId) return row;
        const res = await fetch(`${hostnameAI}/canvas/model_list?model_id=${encodeURIComponent(modelId)}`, {
            headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
        });
        if (!res.ok) throw new Error("Failed to fetch model");
        const list = await res.json();
        return Array.isArray(list) && list.length > 0 ? list[0] : row;
    };

    const openDatasetLibraryFromComponents = async (row) => {
        if (!hostnameAI || !token) return;
        setEntityNavLoading(true);
        try {
            const fullRow = await fetchDatasetById(row);
            const datasetKey =
                fullRow?.id ||
                fullRow?.dataset_id ||
                fullRow?.uuid ||
                fullRow?.file_id ||
                fullRow?.file_name ||
                row?.dataset_id ||
                row?.id ||
                row?.dataset_name;

            navigate(`/ai/hub/data/library/${encodeURIComponent(String(datasetKey))}`, {
                state: { datasetData: fullRow },
            });
        } catch (e) {
            // fallback: still navigate with what we have
            const datasetKey = row?.dataset_id || row?.id || row?.dataset_name;
            if (datasetKey) {
                navigate(`/ai/hub/data/library/${encodeURIComponent(String(datasetKey))}`, {
                    state: { datasetData: row },
                });
            }
        } finally {
            setEntityNavLoading(false);
        }
    };

    const openModelLibraryFromComponents = async (row) => {
        if (!hostnameAI || !token) return;
        setEntityNavLoading(true);
        try {
            const fullRow = await fetchModelById(row);
            navigate("/ai/hub/models/library", {
                state: { modelData: fullRow },
            });
        } catch (e) {
            navigate("/ai/hub/models/library", {
                state: { modelData: row },
            });
        } finally {
            setEntityNavLoading(false);
        }
    };

    useEffect(() => {
        if (!hostnameAI || !token || !projectName) return;
        setDatasetsLoading(true);
        setDatasetsError(null);
        const fetchDatasets = async () => {
            try {
                const url = `${hostnameAI}/canvas/projects/${encodeURIComponent(projectName)}/datasets`;
                const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) throw new Error('Failed to fetch datasets');
                const data = await res.json();
                setDatasets(Array.isArray(data.datasets) ? data.datasets : []);
            } catch (e) {
                setDatasets([]);
                setDatasetsError(e?.message || 'Failed to fetch datasets');
            } finally {
                setDatasetsLoading(false);
            }
        };
        fetchDatasets();
    }, [hostnameAI, token, projectName]);

    useEffect(() => {
        if (!hostnameAI || !token || !projectName) return;
        setModelsLoading(true);
        setModelsError(null);
        const fetchModels = async () => {
            try {
                const url = `${hostnameAI}/canvas/projects/${encodeURIComponent(projectName)}/models`;
                const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) throw new Error('Failed to fetch models');
                const data = await res.json();
                setModels(Array.isArray(data.models) ? data.models : []);
            } catch (e) {
                setModels([]);
                setModelsError(e?.message || 'Failed to fetch models');
            } finally {
                setModelsLoading(false);
            }
        };
        fetchModels();
    }, [hostnameAI, token, projectName]);

    // Dataset actions
    const datasetActions = [
        {
            label: 'Library',
            icon: <BookOpen className="w-4 h-4" />,
            onClick: (row) => {
                navigate(`/ai/hub/data/library/${row.dataset_id || row.dataset_name || row.id}`, {
                    state: { datasetData: row }
                });
            },
            tooltip: 'Library',
        },
        {
            label: 'F1 Mode',
            icon: <Gauge className="w-4 h-4" />,
            onClick: (row) => console.log('F1 Mode:', row),
            tooltip: 'F1 Mode',
        },
        {
            label: 'AI Canvas',
            icon: <Palette className="w-4 h-4" />,
            onClick: (row) => console.log('AI Canvas:', row),
            tooltip: 'AI Canvas',
        },
        {
            label: 'Archive',
            icon: <Archive className="w-4 h-4" />,
            onClick: (row) => console.log('Archive:', row),
            tooltip: 'Archive',
        },
        {
            label: 'Delete',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: (row) => console.log('Delete:', row),
            tooltip: 'Delete',
        },
    ];

    // Model actions
    const modelActions = [
        {
            label: "Library",
            icon: <BookOpen className="w-4 h-4" />,
            onClick: (row) =>
                navigate("/ai/hub/models/library", { state: { modelData: row } }),
            tooltip: "Library",
        },
        {
            label: "F1 Mode",
            icon: <Gauge className="w-4 h-4" />,
            onClick: (row) => console.log("F1 Mode:", row),
            tooltip: "F1 Mode",
        },
        {
            label: "AI Canvas",
            icon: <Palette className="w-4 h-4" />,
            onClick: (row) =>
                navigate("/ai/playground/model-genesis", {
                    state: {
                        mode: "view",
                        model: row,
                    },
                }),
            tooltip: "AI Canvas",
        },
        {
            label: "Deploy",
            icon: <Rocket className="w-4 h-4" />,
            onClick: (row) => console.log("Deploy:", row),
            tooltip: "Deploy",
        },
        {
            label: "Archive",
            icon: <Archive className="w-4 h-4" />,
            onClick: (row) => console.log("Archive:", row),
            tooltip: "Archive",
        },
        {
            label: "Quick Predict",
            icon: <Sparkles className="w-4 h-4" />,
            onClick: (row) => console.log("Quick Predict:", row),
            tooltip: "Quick Predict",
        },
        {
            label: "Delete",
            icon: <Trash2 className="w-4 h-4" />,
            onClick: (row) => console.log("Delete:", row),
            tooltip: "Delete",
        },
    ];

    // Columns for datasets
    const datasetColumns = [
        { key: 'dataset_id', label: 'ID', sortable: true, width: '80px' },
        {
            key: 'dataset_name',
            label: 'Name',
            sortable: true,
            render: (row) => (
                <span
                    className={`block text-[#8e78b7] hover:underline cursor-pointer whitespace-normal break-words ${entityNavLoading ? 'opacity-60 pointer-events-none' : ''}`}
                    style={{ overflowWrap: 'anywhere' }}
                    title={row.dataset_name ?? ''}
                    onClick={() => openDatasetLibraryFromComponents(row)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && openDatasetLibraryFromComponents(row)}
                >
                    {row.dataset_name}
                </span>
            ),
        },
        { key: 'row_count', label: 'Rows', sortable: true },
        { key: 'column_count', label: 'Columns', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'created_at', label: 'Created Date', sortable: true, render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB') : '—' },
        // { label: 'Action', sortable: false, width: '100px' },
    ];

    // Columns for models
    const modelColumns = [
        { key: 'model_id', label: 'ID', sortable: true, width: '80px' },
        {
            key: 'model_name',
            label: 'Name',
            sortable: true,
            render: (row) => (
                <span
                    className={`block text-[#8e78b7] hover:underline cursor-pointer whitespace-normal break-words ${entityNavLoading ? 'opacity-60 pointer-events-none' : ''}`}
                    style={{ overflowWrap: 'anywhere' }}
                    title={row.model_name ?? ''}
                    onClick={() => openModelLibraryFromComponents(row)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && openModelLibraryFromComponents(row)}
                >
                    {row.model_name}
                </span>
            ),
        },
        // { key: 'status', label: 'Status', sortable: true },
        { key: 'modeling_type', label: 'Modeling Type', sortable: true },
        { key: 'run_mode_modelling', label: 'Run Mode', sortable: true },
        { key: 'run_type_modelling', label: 'Run Type', sortable: true },
        { key: 'target_variable', label: 'Target Variable', sortable: true },
        { key: 'created_at', label: 'Created At', sortable: true, render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB') : '—' },
        { key: 'updated_at', label: 'Updated At', sortable: true, render: (row) => row.updated_at ? new Date(row.updated_at).toLocaleDateString('en-GB') : '—' },
        // { label: 'Action', sortable: false, width: '100px' },
    ];

    // Filtered data
    const filteredDatasets = useMemo(() => {
        if (!searchTerm.trim()) return datasets;
        const q = searchTerm.toLowerCase();
        return datasets.filter(row =>
            Object.values(row || {}).some(val => String(val ?? '').toLowerCase().includes(q))
        );
    }, [datasets, searchTerm]);

    const filteredModels = useMemo(() => {
        if (!searchTerm.trim()) return models;
        const q = searchTerm.toLowerCase();
        return models.filter(row =>
            Object.values(row || {}).some(val => String(val ?? '').toLowerCase().includes(q))
        );
    }, [models, searchTerm]);

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    return (
        <div className="space-y-4">
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search Components"
                    className="w-full sm:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="border border-gray-200 rounded-lg">
                <button
                    onClick={() => toggleSection('datasets')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                    <div className="w-full flex items-center justify-between">
                        <span className="text-base font-medium text-[#8e78b7]">
                            Datasets ({datasets.length})
                        </span>
                        {expandedSections.datasets ? (
                            <ChevronDown className="w-5 h-5 text-[#8e78b7]" />
                        ) : (
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        )}
                    </div>
                </button>
                {expandedSections.datasets && (
                    <div className="px-4 pb-4">
                        {datasetsError && <div className="text-red-600 text-sm mb-2">{datasetsError}</div>}
                        <DataTable
                            columns={datasetColumns}
                            data={filteredDatasets}
                            actions={datasetActions}
                            isLoading={datasetsLoading}
                            isError={!!datasetsError}
                        />
                    </div>
                )}
            </div>

            <div className="border border-gray-200 rounded-lg">
                <button
                    onClick={() => toggleSection('models')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                    <div className="w-full flex items-center justify-between">
                        <span className="text-base font-medium text-[#8e78b7]">
                            Models ({models.length})
                        </span>
                        {expandedSections.models ? (
                            <ChevronDown className="w-5 h-5 text-[#8e78b7]" />
                        ) : (
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        )}
                    </div>
                </button>
                {expandedSections.models && (
                    <div className="px-4 pb-4">
                        {modelsError && <div className="text-red-600 text-sm mb-2">{modelsError}</div>}
                        <DataTable
                            columns={modelColumns}
                            data={filteredModels}
                            actions={modelActions}
                            isLoading={modelsLoading}
                            isError={!!modelsError}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
export default ComponentsTab