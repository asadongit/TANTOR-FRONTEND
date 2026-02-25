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
import { useConnectionCardData } from "../../../hooks/platform/cardCounts";
import { useConnectionData } from "../../../hooks/platform/connection";
import DataTable from "../../../components/DataTable";
import CardGrid from "../../../components/CardGrid";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import columnConfigurations from "../../../components/columnsConfig";
import ViewConnection from "./components/viewConnection";
import ConnectionWizard from "./components/ConnectionWizard";
import Modal from "../cdc/components/Modal";
import axios from "axios";
import { useModal } from "../cdc/context/ModalProvider";
import Breadcrumb from "../../../components/Breadcrumb";

const Connections = () => {
  const { token, project, setSelectedProject, hostnameV1, hostnameV2 } = useAuth();
  const { openModal, closeModal } = useModal();
  const [searchTerm, setSearchTerm] = useState('');

  const [viewMode, setViewMode] = useState("both");
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(0); // 0 = off
  const [isAutoRefreshMenuOpen, setIsAutoRefreshMenuOpen] = useState(false);
  const autoRefreshMenuRef = useRef(null);
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
  const [viewConnectionData, setViewConnectionData] = useState(null);
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [connectionViews, setConnectionViews] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const navigate = useNavigate();

  const openLocalModal = (modalName, data = null) => {
    setActiveModal({ name: modalName, data });
  };

  const closeLocalModal = () => {
    closeModal()
    setActiveModal(null);
  };

  useEffect(() => {
    if (autoRefreshInterval === 0) return;

    const interval = setInterval(() => {
      refetchConnections();
      refetchCardData();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, refetchConnections, refetchCardData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autoRefreshMenuRef.current && !autoRefreshMenuRef.current.contains(event.target)) {
        setIsAutoRefreshMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cards = useMemo(() => {
    return [
      {
        icon: "material-symbols:database-upload-outline",
        bgcolor: "bg-[#d8d3e4] bg-opacity-25",
        iconcolor: "text-purple-700",
        title: "Active",
        count: cardData?.active || 0,
      },
      {
        icon: "material-symbols-light:two-pager-store-outline",
        bgcolor: "bg-[#FFC93F] bg-opacity-25",
        iconcolor: "text-orange-700",
        title: "Inactive",
        count: cardData?.inactive || 0,
      },
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
    setConnectionDetails(connection)
    setViewConnectionData(null)
    openLocalModal('view')
    fetch(
      `${hostnameV1}/connection-master-metadata/find-by-conn-name-type?conn_name=${connection.connection_name}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const sortedData = data.sort((a, b) => a.table_name.localeCompare(b.table_name));
        setViewConnectionData(sortedData);
      })
      .catch((error) => {
        console.error("Error fetching table data:", error);
      });
  }, []);

  const actions = [
    {
      label: "View",
      icon: <Eye size={16} />,
      onClick: (row) => fetchViewConnections(row),
    },
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
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const views = await response.json();
            setConnectionViews(views);

            if (views.length > 0) {
              openModal({
                title: "Confirm Deletion",
                message: (
                  <div>
                    <p>All views associated with this connection will be deleted</p>
                    <ul className="list-disc pl-5 mt-2">
                      {views.map((view, index) => (
                        <li key={index}>{view}</li>
                      ))}
                    </ul>
                    <p className="mt-4">Are you sure you want to delete this connection?</p>
                  </div>
                ),
                type: "question",
                onConfirm: () => deleteConnection(row.connection_id),
                loadingText: "Deleting....."
              });
            } else {
              // Show simple confirmation if no views exist
              openModal({
                title: "Confirm Deletion",
                message: `Are you sure you want to delete connection ${row.connection_name}?`,
                type: "question",
                onConfirm: () => deleteConnection(row.connection_id),
                loadingText: "Deleting....."
              });
            }
          } else {
            throw new Error('Failed to fetch views');
          }
        } catch (error) {
          console.error("Error fetching views:", error);
          openModal({
            title: "Confirm Deletion",
            message: `Are you sure you want to delete connection ${row.connection_name}?`,
            type: "question",
            onConfirm: () => deleteConnection(row.connection_id),
            loadingText: "Deleting....."
          });
        }
      },
    },
    {
      label: "Run",
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
      if (!projectsResponse.ok) {
        throw new Error('Failed to fetch projects');
      }
      const projectsList = await projectsResponse.json();
      setProjects(projectsList);
    } catch (error) {
      console.error("Error fetching options:", error)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

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
      } else {
        toast.error("Failed to delete connection");
      }
    } catch (error) {
      console.error("Error deleting connection:", error);
      toast.error("Error deleting connection");
    }
    finally {
      openModal({
        title: "Success",
        message: `Your connection has been deleted successfully!`,
        type: "success",
        onConfirm: () => closeLocalModal,
        loadingText: 'Deleting'
      })
    }
  };

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
              onChange={(e) => {
                const projectName = e.target.value;
                setSelectedProject(projectName);
              }}
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

          <div className="relative flex items-center" ref={autoRefreshMenuRef}>
            <div className="flex rounded-lg border border-gray-400 hover:bg-gray-50 h-10">
              <button
                className="w-10 flex items-center justify-center border-r border-gray-300"
                onClick={() => {
                  refetchConnections();
                  refetchCardData();
                  toast.success("Connections data refreshed successfully");
                }}
                title="Refresh data"
                disabled={isConnectionsLoading || isCardLoading}
              >
                <RefreshCcw
                  className={`h-5 w-5 text-gray-600 ${(isConnectionsLoading || isCardLoading) ? "animate-spin" : ""}`}
                />
              </button>
              <button
                className="px-2 flex items-center justify-center"
                onClick={() => setIsAutoRefreshMenuOpen(!isAutoRefreshMenuOpen)}
                title="Auto Refresh Settings"
              >
                <ChevronDown className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {isAutoRefreshMenuOpen && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  Auto Refresh
                </div>
                {[
                  { label: "Off", value: 0 },
                  { label: "5 seconds", value: 5000 },
                  { label: "10 seconds", value: 10000 },
                  { label: "1 minute", value: 60000 },
                  { label: "2 minutes", value: 120000 },
                  { label: "5 minutes", value: 300000 },
                ].map((option) => (
                  <button
                    key={option.value}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${autoRefreshInterval === option.value ? "text-[#8d77ba] font-medium bg-purple-50" : "text-gray-700"
                      }`}
                    onClick={() => {
                      setAutoRefreshInterval(option.value);
                      setIsAutoRefreshMenuOpen(false);
                    }}
                  >
                    {option.label}
                    {autoRefreshInterval === option.value && (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
            )}
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

          <button
            onClick={() => {
              openLocalModal("editCreate", null)
            }}
            type="button"
            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] h-10 focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2 flex items-center justify-center dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            <Icon icon="material-symbols:add" width="20" height="20" className="mr-1 inline-block" />
            Create
          </button>
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
        />
      )}
    </div>
  );
};

export default Connections;