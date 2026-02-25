import { Icon } from "@iconify-icon/react";
import { useState} from "react";
import { Pencil, Trash2, Play, ExternalLink } from "lucide-react";
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
  
  const { token, hostnameV1, hostnameV2 } = useAuth();

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
    { key: "status", label: "Status", sortable: true ,
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
        } else if(row.status.toLowerCase() === "pending"){
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
        <div>
          <button
            onClick={() =>
              navigate(
                `/details?${encodeURIComponent(
                  encrypt("componentType=metadata&heading=metadata")
                )}`
              )
            }
            type="button"
            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            View Metadata
          </button>

          <button
            onClick={() => navigate("/migrationCanvas")}
            type="button"
            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            Create Migration
          </button>
        </div>
      </div>

      <CardGrid
        cards={cards}
        onCardClick={handleCardClick}
        isLoading={isCardLoading}
      />

      {/* Migration Listing Table */}

      <DataTable
        columns={columns}
        data={archivalData}
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
