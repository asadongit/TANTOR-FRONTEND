import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../../../../context/AuthContext";
import DataTable from "../../../../../components/DataTable";
import { useNavigate } from "react-router-dom";

const ProjectsTab = ({ datasetId }) => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const hostnameAI = window._env_?.VITE_AI_API;
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!datasetId) return;
        setLoading(true);
        setError(null);
        fetch(`${hostnameAI}/canvas/projects/by-dataset/${encodeURIComponent(datasetId)}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((resp) => {
                if (!resp.ok) throw new Error("Failed to fetch projects");
                return resp.json();
            })
            .then((data) => {
                // API returns a single project object under "project"
                if (data?.project) {
                    setProjects([data.project]);
                } else {
                    setProjects([]);
                }
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [datasetId, hostnameAI, token]);

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

    const columns = useMemo(() => [
        {
            key: 'project_name',
            label: 'Project Name',
            sortable: true,
            render: (row) => (
                <span
                    className="text-[#8e78b7] font-medium hover:underline cursor-pointer whitespace-normal break-words"
                    style={{ overflowWrap: "anywhere" }}
                    onClick={() => handleProjectLibrary(row)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleProjectLibrary(row)}
                    title={row.project_name ?? ""}
                >
                    {row.project_name}
                </span>
            ),
        },
        {
            key: 'owner_id',
            label: 'Owner ID',
            sortable: false,
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
        },
        {
            key: 'created_at',
            label: 'Created At',
            sortable: true,
            render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB") : "-",
        },
        {
            key: 'description',
            label: 'Description',
            sortable: false,
        },
    ], [hostnameAI, token]);

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
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