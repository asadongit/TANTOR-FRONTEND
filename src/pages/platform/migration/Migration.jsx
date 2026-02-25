import { Icon } from "@iconify-icon/react";
import { useState, useEffect, useMemo, useRef } from "react";
import { Pencil, Trash2, Play, ExternalLink, Search, RefreshCcw, ChevronDown, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { encrypt } from "../../../utils/Crypto";
import { useSourceTypeCounts } from "../../../hooks/platform/cardCounts";
import { useMigrationData } from "../../../hooks/platform/migration";

import DataTable from "../../../components/DataTable";
import CardGrid from "../../../components/CardGrid";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import Breadcrumb from "../../../components/Breadcrumb";
import { DagErrorModal } from "../../../components/DagErrorModal";

const MigrationEmpty = () => {
  return (
    <div className="p-6">
      <div className="flex gap-2 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Migration</h1>
      </div>
      <div className="bg-gray-50 p-8 rounded-lg shadow-sm w-full text-center outline outline-slate-100">
        <Icon
          icon="ic:baseline-move-down"
          width="48"
          height="48"
          className="text-gray-300"
        />
        <h2 className="text-black-500 text-3xl mb-4 font-semibold w-full block">
          Sorry, no migration found
        </h2>
        <p className="text-gray-500 text-lg mb-4">
          There are no item with this data.
        </p>
        <button className="bg-[#8e78b7] text-white px-5 py-2.5 rounded-md hover:bg-[#8e78b7] transition-colors text-sm font-medium">
          Create Migration
        </button>
      </div>
    </div>
  );
};

const MigrationList = () => {
  const {
    data: cardData,
    isLoading: isCardLoading,
    error: cardError,
    refetchCardData,
  } = useSourceTypeCounts("migration");
  const {
    data: archivalData = [],
    isLoading: isArchivalLoading,
    error: archivalError,
    refetch: refetchArchival,
  } = useMigrationData();

  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(null);

  const [dagErrorModal, setDagErrorModal] = useState({
    isOpen: false,
    isLoading: false,
    data: null,
    dagId: null,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("both");
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(0); // 0 = off
  const [isAutoRefreshMenuOpen, setIsAutoRefreshMenuOpen] = useState(false);
  const autoRefreshMenuRef = useRef(null);

  useEffect(() => {
    if (autoRefreshInterval === 0) return;

    const interval = setInterval(() => {
      refetchArchival();
      refetchCardData();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, refetchArchival, refetchCardData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autoRefreshMenuRef.current && !autoRefreshMenuRef.current.contains(event.target)) {
        setIsAutoRefreshMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { token, hostnameV1, hostnameV2, project } = useAuth();

  const fetchDagFailure = async (dagId) => {
    console.log("dag id ", dagId)
    setDagErrorModal({ isOpen: true, isLoading: true, data: null, dagId });
    try {
      const response = await axios.get(
        `${hostnameV1}/dag-failure?dag_id=${dagId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDagErrorModal({ isOpen: true, isLoading: false, data: response.data, dagId });
    } catch (error) {
      console.error("Error fetching DAG failure info:", error);
      setDagErrorModal({
        isOpen: true,
        isLoading: false,
        data: { status: "ERROR", error_message: "Failed to retrieve DAG failure details." },
        dagId,
      });
    }
  };

  const cards = [
    {
      icon: "material-symbols:database-upload-outline",
      bgcolor: "bg-[#d8d3e4] bg-opacity-25",
      iconcolor: "text-purple-700",
      title: "Oracle",
      count: cardData?.oracle || 0,
    },
    {
      icon: "material-symbols-light:two-pager-store-outline",
      bgcolor: "bg-[#FFC93F] bg-opacity-25",
      iconcolor: "text-orange-700",
      title: "DB2",
      count: cardData?.db2 || 0,
    },
    {
      icon: "material-symbols:cloud-sync-outline",
      bgcolor: "bg-[#96CF7B] bg-opacity-25",
      iconcolor: "text-green-700",
      title: "MS SQL",
      count: cardData?.mssql || 0,
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "MySQL",
      count: cardData?.mysql || 0,
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Postgres",
      count: cardData?.postgres || 0,
    },
  ];

  const columns = [
    { key: "workflow_name", label: "Name", sortable: true },
    { key: "project", label: "Project Name", sortable: true },
    { key: "created_by", label: "Created By", sortable: true },
    { key: "source_conn_name", label: "Source Connection", sortable: true },
    { key: "target_conn_name", label: "Target Connection", sortable: true },
    { key: "source_table", label: "Source Table", sortable: true },
    { key: "target_table", label: "Target Table", sortable: true },
    {
      key: "status", label: "Status", sortable: true,
      render: (row) => {
        let className = "px-2 py-1 rounded-full font-medium";
        if (row.status.toLowerCase() === "failed") {
          className += " bg-red-100 text-red-600";
          return (
            <button
              onClick={() => fetchDagFailure(row.workflow_name)}
              className={`flex items-center gap-1 ${className} hover:bg-red-200`}
              title="View failure details"
            >
              <span>Failed</span>
              <ExternalLink className="ml-1 w-3 h-3" />
            </button>
          );
        } else if (row.status.toLowerCase() === "completed") {
          className += " bg-green-100 text-green-600";
        } else if (row.status.toLowerCase() === "pending") {
          className += "bg-yellow-100 text-yellow-600";
        }
        else {
          className += " bg-gray-100 text-gray-600";
        }
        return <span className={className}>{row.status}</span>;
      },
    },
    { label: "Action", sortable: false },
  ];

  const handleCardClick = (card) => {
    const url = `/componentType=migration&dataScope=${card.title
      .replace(/\s+/g, "")
      .toLowerCase()}&heading=${card.title}`;

    const encryptedUrl = encodeURIComponent(encrypt(url));
    navigate(`/details?${encryptedUrl}`);
  };

  const filteredArchivalData = useMemo(() => {
    let filtered = archivalData;

    if (project !== "none" && project !== "default" && project) {
      filtered = filtered.filter((row) => row.project === project);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(search)
        )
      );
    }
    return filtered;
  }, [archivalData, project, searchTerm]);

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    migrationId: null,
  });

  const handleDeleteClick = (row) => {
    setDeleteModal({ open: true, migrationId: row.migration_id });
  };

  const confirmDeleteMigration = async () => {
    if (!deleteModal.migrationId) return;
    try {
      await axios.delete(
        `${hostnameV2}/delete-migration/${deleteModal.migrationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Migration removed from platform.");
      refetchArchival();
    } catch (error) {
      toast.error("Failed to remove migration.");
    } finally {
      setDeleteModal({ open: false, migrationId: null });
    }
  };

  const handleEditClick = async (row) => {
    try {
      const nodeJson = row.ui_json
        ? JSON.parse(JSON.stringify(row.ui_json))
        : null;

      console.log("Fetched Migration Node JSON:", nodeJson);

      if (nodeJson) {
        navigate("/migrationCanvas", {
          state: { nodeJson, isEditMode: true, migration_id: row.migration_id },
        });
      } else {
        toast.error("No migration node data found.");
      }
    } catch (error) {
      toast.error("Failed to fetch migration node data.");
    }
  };

  const actions = [
    {
      label: "Edit",
      icon: <Pencil size={16} />,
      onClick: handleEditClick,
    },
    {
      label: "Delete",
      icon: <Trash2 size={16} />,
      onClick: handleDeleteClick,
    },
    {
      label: "Run",
      icon: <Play size={16} fill="currentColor" />,
      onClick: async (row) => {
        try {
          const response = await axios.get(
            `${hostnameV1}/migrations/manualtrigger/${row.workflow_name}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          toast.success("Migration triggered successfully!");
          refetchArchival();
        } catch (error) {
          console.error("Failed to trigger Migration:", error);
          toast.error("Failed to trigger Migration.");
        }
      },
    },
  ];

  return (
    <div className="p-6">
      <Breadcrumb title="Platform" link={"/"} />
      <div className="flex gap-2 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Migration</h1>
        <div className="flex items-center gap-2">

          <div className="relative">
            <input
              type="text"
              placeholder="Search migrations"
              className="pl-10 pr-4 py-2 w-[300px] border border-gray-300 rounded-lg focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          <div className="relative flex items-center" ref={autoRefreshMenuRef}>
            <div className="flex rounded-lg border border-gray-400 hover:bg-gray-50 h-10">
              <button
                className="w-10 flex items-center justify-center border-r border-gray-300"
                onClick={() => {
                  refetchArchival();
                  refetchCardData();
                  toast.success("Migration data refreshed successfully");
                }}
                title="Refresh data"
                disabled={isArchivalLoading || isCardLoading}
              >
                <RefreshCcw
                  className={`h-5 w-5 text-gray-600 ${(isArchivalLoading || isCardLoading) ? "icon-rotate" : ""}`}
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
            onClick={() =>
              navigate(
                `/details?${encodeURIComponent(
                  encrypt("componentType=metadata&heading=metadata")
                )}`
              )
            }
            type="button"
            className="h-10 text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 flex items-center justify-center dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            View Metadata
          </button>

          <button
            onClick={() => navigate("/migrationCanvas")}
            type="button"
            className="h-10 text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 flex items-center justify-center dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            <Icon icon="material-symbols:add" width="20" height="20" className="mr-1 inline-block" />
            Create
          </button>
        </div>
      </div>

      {viewMode !== "list" && (
        <CardGrid
          cards={cards}
          onCardClick={handleCardClick}
          isLoading={isCardLoading}
        />
      )}

      {/* Migration Listing Table */}

      <DataTable
        columns={columns}
        data={filteredArchivalData}
        actions={actions}
        isLoading={isArchivalLoading}
        isError={archivalError}
        refetch={refetchArchival}
      />

      <DagErrorModal
        isOpen={dagErrorModal.isOpen}
        onClose={() => setDagErrorModal({ isOpen: false, isLoading: false, data: null, dagId: null })}
        isLoading={dagErrorModal.isLoading}
        data={dagErrorModal.data}
      />

      {/* Delete Migration Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[400px] p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[#8e78b7] mb-4">
              Remove Migration
            </h2>
            <p className="mb-4 text-gray-700">
              Are you sure you want to remove this migration?
            </p>
            <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
              Note: This will only remove the listing from the platform, not
              from the connections.
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() =>
                  setDeleteModal({ open: false, migrationId: null })
                }
                className="px-6 py-2 border border-gray-400 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteMigration}
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

const Migration = () => {
  const isLoggedIn = true;

  return (
    <div>
      {isLoggedIn ? (
        <MigrationList />
      ) : (
        <>
          <MigrationEmpty />
        </>
      )}
    </div>
  );
};

export default Migration;
