import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Pencil,
  Trash2,
  RefreshCw,
  Eye,
  ChevronDown,
  Search,
  CheckCircle,
  RefreshCcw,
} from "lucide-react";
import { Icon } from "@iconify-icon/react";
import { useNavigate } from "react-router-dom";
import { encrypt } from "../../../utils/Crypto";
import { useConnectionData } from "../../../hooks/platform/connection";
import DataTable from "../../../components/DataTable";
import CardGrid from "../../../components/CardGrid";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import columnConfigurations from "../../../components/columnsConfig";
import ViewConnection from "./components/viewConnection";
import ConnectionWizard from "./components/ConnectionWizard";
import axios from "axios";
import Breadcrumb from "../../../components/Breadcrumb";
import { useRealtimeUpdate } from "../../../hooks/platform/realtime_update";
import { useConnectionCardData, usePolicyIds } from "../../../hooks/platform/cardCounts";

const Connections = () => {
  const { token, project, setSelectedProject, hostnameV1, hostnameV2, decodedToken } = useAuth();
  const { data: policyIds = [] } = usePolicyIds();
  const isConnectionCreation = useMemo(() => 
  decodedToken?.resource_access?.darch?.roles?.some(
    r => r.toLowerCase() === 'persona:connection manager'
  ), [decodedToken]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState("both");

  const [viewConnectionData, setViewConnectionData] = useState(null);
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [connectionViews, setConnectionViews] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, type: null, message: null, onConfirm: null });
  const navigate = useNavigate();

  const [resetSortTrigger, setResetSortTrigger] = useState(0);
  const handleClearSort = () => {
    setResetSortTrigger(prev => prev + 1);
  };

  const {
    data: cardData,
    isLoading: isCardLoading,
    error: cardError,
    refetch: refetchCardData,
  } = useConnectionCardData();

  const {
    data: connections = [],
    isLoading: isConnectionsLoading,
    error: connectionsError,
    refetch: refetchConnections,
  } = useConnectionData();

  const openLocalModal = (modalName, data = null) => {
    setActiveModal({ name: modalName, data });
  };

  const closeLocalModal = () => {
    setActiveModal(null);
  };


  const cards = useMemo(() => {
    return [
      {
        icon: "material-symbols:database-upload-outline",
        bgcolor: "bg-[#d8d3e4] bg-opacity-25",
        iconcolor: "text-purple-700",
        title: "Active",
        count: cardData?.active || 0,
      },
      // {
      //   icon: "material-symbols-light:two-pager-store-outline",
      //   bgcolor: "bg-[#FFC93F] bg-opacity-25",
      //   iconcolor: "text-orange-700",
      //   title: "Inactive",
      //   count: cardData?.inactive || 0,
      // },
      {
        icon: "material-symbols:cloud-sync-outline",
        bgcolor: "bg-[#96CF7B] bg-opacity-25",
        iconcolor: "text-green-700",
        title: "Source",
        count: cardData?.source || 0,
      },
      {
        icon: "material-symbols:tab-group-outline",
        bgcolor: "bg-[#16ABC2] bg-opacity-25",
        iconcolor: "text-cyan-700",
        title: "Target",
        count: cardData?.target || 0,
      },
      {
        icon: "material-symbols:tab-group-outline",
        bgcolor: "bg-[#16ABC2] bg-opacity-25",
        iconcolor: "text-cyan-700",
        title: "Both",
        count: cardData?.both || 0,
      },
    ];
  }, [cardData]);

  const columns = columnConfigurations['connections']

  const handleRefresh = (id) => {
    fetch(`${hostnameV1}/refresh/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (response.status === 200) {
          toast.success("Reload Successful");
          refetchConnections();
        } else {
          return response.json().then((data) => {
            throw new Error(data.errorMessage || "Reload Failed");
          });
        }
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const fetchViewConnections = useCallback(async (connection) => {
    setConnectionDetails(connection);
    setViewConnectionData(null);
    openLocalModal('view');

    const params = new URLSearchParams({ conn_name: connection.connection_name });
    if (policyIds.length > 0) params.append('policy_ids', policyIds[0]);

    fetch(`${hostnameV1}/connection-master-metadata/find-by-conn-name-type?${params}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => {
        setViewConnectionData(data.sort((a, b) => a.table_name.localeCompare(b.table_name)));
      })
      .catch((err) => console.error("Error fetching table data:", err));
  }, [policyIds, token, hostnameV1]);

  const deleteConnection = async (id) => {
    try {
      const response = await axios.delete(`${hostnameV1}/connection-saves/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        refetchConnections();
        toast.success("Connection deleted successfully");
      } else {
        toast.error("Failed to delete connection");
      }
    } catch (error) {
      console.error("Error deleting connection:", error);
      toast.error("Error deleting connection");
    }
  };

  const actions = [
    {
      label: "View",
      icon: <Eye size={16} />,
      onClick: (row) => fetchViewConnections(row),
    },
    ...(isConnectionCreation ? [
    {
      label: "Edit",
      icon: <Pencil size={16} />,
      onClick: (row) => openLocalModal('editCreate', row),
    },
    {
      label: "Delete",
      icon: <Trash2 size={16} />,
      onClick: async (row) => {
        try {
          const response = await fetch(`${hostnameV2}/connection-views/${row.connection_name}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          const views = response.ok ? await response.json() : [];

          setDeleteModal({
            open: true,
            type: "connection",
            message:
              views.length > 0 ? (
                <div>
                  <p>All views associated with this connection will be deleted:</p>
                  <ul className="list-disc pl-5 mt-2 text-sm text-gray-600">
                    {views.map((view, i) => (
                      <li key={i}>{view}</li>
                    ))}
                  </ul>
                  <p className="mt-4">Are you sure you want to continue?</p>
                </div>
              ) : (
                `Are you sure you want to delete connection ${row.connection_name}?`
              ),
            onConfirm: () => deleteConnection(row.connection_id),
          });
        } catch {
          setDeleteModal({
            open: true,
            type: "connection",
            message: `Are you sure you want to delete connection ${row.connection_name}?`,
            onConfirm: () => deleteConnection(row.connection_id),
          });
        }
      },
    },
    ] : []),
    {
      label: "Refresh",
      icon: <RefreshCw size={16} />,
      onClick: (row) => handleRefresh(row.connection_id),
    },
  ];

  const handleCardClick = (card) => {
    const url = `/componentType=connections&dataScope=${card.title
      .replace(/\s+/g, "")
      .toLowerCase()}&heading=${card.title}`;
    const encryptedUrl = encodeURIComponent(encrypt(url));
    navigate(`/details?${encryptedUrl}`);
  };

  let [projects, setProjects] = useState([]);

  const fetchProjects = useCallback(async () => {
    try {
      const projectsResponse = await fetch(`${hostnameV1}/projects`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-type": "application/json",
        },
      });
      if (!projectsResponse.ok) throw new Error('Failed to fetch projects');
      const projectsList = await projectsResponse.json();
      setProjects(projectsList);
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredConnections = useMemo(() => {
    let filtered = connections;

    if (project !== "none" && project !== "default" && project) {
      filtered = filtered.filter((conn) => conn.project === project);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(conn =>
        Object.values(conn).some(value =>
          String(value).toLowerCase().includes(search)
        )
      );
    }

    return filtered;
  }, [connections, project, searchTerm]);

  return (
    <div className="p-6">
      <Breadcrumb title="Platform" link={"/"} />

      <div className="flex gap-2 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Connections</h1>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search connections"
              className="pl-10 pr-4 py-2 w-[300px] border border-gray-300 rounded-lg focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          <div className="relative">
            <select
              value={project}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-44 appearance-none text-slate-500 font-medium rounded-lg text-sm px-4 py-2 h-10 inline-flex items-center bg-white shadow-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] cursor-pointer"
            >
              <option value="default">Default</option>
              {projects?.map((p, idx) => (
                <option key={idx} value={p?.project}>
                  {p?.project}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500 pointer-events-none" />
          </div>

          <div className="relative flex items-center">
            <button
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-400 hover:bg-gray-50"
              onClick={() => {
                refetchConnections();
                refetchCardData();

                setSearchTerm("");
                handleClearSort();
                toast.success("Connections data refreshed successfully");
              }}
              title="Refresh data"
              disabled={isConnectionsLoading || isCardLoading}
            >
              <RefreshCcw
                className={`h-5 w-5 text-gray-600 ${(isConnectionsLoading || isCardLoading) ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          <button
            className={`w-10 h-10 flex items-center justify-center rounded-lg border ${viewMode === "list"
              ? "bg-gray-100 border-gray-500"
              : "border-gray-400"
              } hover:bg-gray-50`}
            onClick={() => setViewMode(viewMode === "list" ? "both" : "list")}
            title={viewMode === "list" ? "Show All Views" : "Show List Only"}
          >
            <Icon
              icon="material-symbols-light:format-list-bulleted"
              width="24"
              height="24"
              className="text-[#8d77ba]"
            />
          </button>

          {isConnectionCreation && (
          <button
            onClick={() => openLocalModal("editCreate", null)}
            type="button"
            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] h-10 focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2 flex items-center justify-center dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            <Icon icon="material-symbols:add" width="20" height="20" className="mr-1 inline-block" />
            Create
          </button>
        )}
        </div>
      </div>

      {viewMode !== "list" && (
        <CardGrid cards={cards} onCardClick={handleCardClick} isLoading={isCardLoading} />
      )}

      <DataTable
        columns={columns}
        data={filteredConnections}
        actions={actions}
        isLoading={isConnectionsLoading}
        isError={connectionsError}
        refetch={refetchConnections}
        resetSortTrigger={resetSortTrigger}
      />

      {activeModal?.name === 'editCreate' && (
        <ConnectionWizard
          editConnectionData={activeModal.data}
          closeLocalModal={closeLocalModal}
        />
      )}

      {activeModal?.name === 'view' && (
        <ViewConnection
          viewConnectionData={viewConnectionData}
          setViewConnectionData={setViewConnectionData}
          connectionDetails={connectionDetails}
          closeModal={closeLocalModal}
          policyIds={policyIds} 
        />
      )}

      {deleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[400px] p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[#8e78b7] mb-4">Confirm Deletion</h2>
            <div className="mb-6 text-gray-700">
              {deleteModal.message}
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteModal({ open: false, type: null, message: null, onConfirm: null })}
                className="px-6 py-2 border border-gray-400 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteModal.onConfirm();
                  setDeleteModal({ open: false, type: null, message: null, onConfirm: null });
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Connections;