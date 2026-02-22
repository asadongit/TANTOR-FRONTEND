import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../../../../context/AuthContext";
import DataTable from "../../../../../components/DataTable";
import { useNavigate } from "react-router-dom";

const ProjectsTab = ({ datasetId, projectId }) => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const hostnameAI = window._env_?.VITE_AI_API;
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!projectId) {
            setProjects([]);
            return;
        }
        setLoading(true);
        setError(null);
        fetch(`${hostnameAI}/canvas/project_list/?project_id=${encodeURIComponent(projectId)}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((resp) => {
                if (!resp.ok) throw new Error("Failed to fetch projects");
                return resp.json();
            })
            .then((data) => {
                // API returns an array of projects
                if (Array.isArray(data)) {
                    setProjects(data);
                } else {
                    setProjects([]);
                }
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [projectId, hostnameAI, token]);

    const handleProjectLibrary = async (row) => {
        const projectId = row?.id || row?.project_id;
        if (!hostnameAI || !token || !projectId) return;

        setLoading(true);
        setError(null);
        try {
            const resp = await fetch(
                `${hostnameAI}/canvas/project_list/?project_id=${encodeURIComponent(projectId)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!resp.ok) throw new Error("Failed to fetch project");
            const data = await resp.json();

            const project = Array.isArray(data) ? (data[0] ?? row) : (data ?? row);
            const resolvedId = project?.id || projectId;

            navigate(`/ai/hub/projects/${resolvedId}/library`, { state: { ProjectData: project } });
        } catch (err) {
            setError(err?.message || "Failed to open project library");
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        const normalized = String(status || '').toLowerCase();
        switch (normalized) {
            case 'active':
                return 'bg-green-100 text-green-700';
            case 'inactive':
                return 'bg-red-100 text-red-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const columns = useMemo(() => [
        {
            key: 'sno',
            label: 'S.No',
            sortable: false,
            width:`60px`,
            render: (_row, idx) => idx + 1,
        },
        {
            key: 'name',
            label: 'Name',
            sortable: true,
            render: (row) => (
                <span
                    className="text-[#8e78b7] hover:underline cursor-pointer whitespace-normal break-words"
                    style={{ overflowWrap: "anywhere" }}
                    onClick={() => handleProjectLibrary(row)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleProjectLibrary(row)}
                    title={row.name ?? ""}
                >
                    {row.name}
                </span>
            ),
        },
        {
            key: 'description',
            label: 'Description',
            sortable: true,
        },
        {
            key: 'created_at',
            label: 'Created Date',
            sortable: true,
            render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB") : "—",
        },
        {
            key: 'owner_name',
            label: 'Created By',
            sortable: true,
            render: (row) => row.owner_name ?? '—',
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (row) => (
                <span className={`px-3 py-1 rounded-md text-xs font-medium ${getStatusStyle(row.status)}`}>
                    {String(row.status || '').toLowerCase() === 'active' ? 'Active' : String(row.status || '—')}
                </span>
            ),
        },
        // No actions column for tab view
    ], [hostnameAI, token]);

    return (
        <div >
            <DataTable
                columns={columns}
                data={projects}
                isLoading={loading}
                isError={!!error}
                refetch={() => {}}
            />
            {error && (
                <div className="text-center py-8 text-red-500">{error}</div>
            )}
            {!loading && !error && projects.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <p>No projects found for this dataset.</p>
                </div>
            )}
        </div>
    );
};

export default ProjectsTab;