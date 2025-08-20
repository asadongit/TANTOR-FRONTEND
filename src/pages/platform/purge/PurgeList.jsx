import { Icon } from "@iconify-icon/react";
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Pencil,
  Trash2,
  Play,
  RefreshCcw,
  X,
} from "lucide-react";
import { encrypt } from "../../../utils/Crypto";
import { useSourceTypeCounts } from "../../../hooks/platform/cardCounts";
import { usePurgeData } from "../../../hooks/platform/purge";
import CardGrid from "../../../components/CardGrid";
import DataTable from "../../../components/DataTable";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
const PurgeList = () => {
  const { data: cardData, isLoading: isCardLoading, error: cardError,refetch : refetchCardData } = useSourceTypeCounts('purge');
  const { data: purgeData=[], isLoading: isPurgeLoading, error: purgeError, refetch : refetchPurges } = usePurgeData();


  const navigate = useNavigate();
const {token, hostnameV1}= useAuth()

  const handleCreatePurge = () => {
    navigate("/PurgeCanvas");
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
  const actions = [
    {
      label: "Edit",
      icon: <Pencil size={16} />,
      onClick: (row) => {
        // Navigate to edit/canvas page and pass ui_json for node pre-population
        navigate("/PurgeCanvas", { state: { ui_json: row.ui_json, purgeId: row.id } });
      },
    },
    {
      label: "Delete",
      icon: <Trash2 size={16} />,
      onClick: (row) => {
        setPurgeToDelete(row);
        setShowDeleteModal(true);
      },
    },
    {
      label: "Run",
      icon: <Play size={16} fill="currentColor" />,
      onClick: async (row) => {
        try {
          const response = await axios.get(`${hostnameV1}/purges/manualtrigger/${row.purge_name}`, {
            headers: {Authorization: `Bearer ${token}`},
          });
          toast.success("Purge triggered successfully!");
        } catch (error) {
          console.error("Failed to trigger Purge:", error);
          toast.error("Failed to trigger Purge.");
        }
      },
    },
  ];
  const handleCardClick = (card) => {
    const url = `/componentType=purge&dataScope=${card.title.replace(/\s+/g, '').toLowerCase()}&heading=${card.title}`;
    const encryptedUrl = encodeURIComponent(encrypt(url));
    navigate(`/details?${encryptedUrl}`);
  };

  // TBR
  const columns = [
    { key: "purge_name", label: "Name", sortable: true },
    { key: "project", label: "Project Name", sortable: true },
    { key: "created_by", label: "Created By", sortable: true },
    { key: "source_conn_name", label: "Source Connection", sortable: true },
    { key: "target_conn_name", label: "Target Connection", sortable: true },
    { key: "source_table", label: "Source Table", sortable: true },
    { key: "target_table", label: "Target Table", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { label: "Action", sortable: false },

    ]
    const [showDeleteModal, setShowDeleteModal] = useState(false);
const [purgeToDelete, setPurgeToDelete] = useState(null);

const handleDeletePurge = async () => {
  if (!purgeToDelete) return;
  try {
    await axios.delete(`${hostnameV1}/purges/${purgeToDelete.purge_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Purge deleted successfully!");
    setShowDeleteModal(false);
    setPurgeToDelete(null);
    refetchPurges();
  } catch (error) {
    toast.error("Failed to delete Purge.");
    setShowDeleteModal(false);
    setPurgeToDelete(null);
  }
};

  return (
    <div className="p-6">
      <div className="flex gap-2 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Purge</h1>
        <div>
          <button
            onClick={handleCreatePurge}
            type="button"
            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            Create Purge
          </button>
        </div>
      </div>
        <CardGrid cards={cards} onCardClick={handleCardClick} isLoading={isCardLoading}/>
            <DataTable
        actions={actions}
        columns={columns}
        data={purgeData}
        isLoading={isPurgeLoading}
        isError={purgeError}
        refetch={refetchPurges}/>
        {showDeleteModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      <h2 className="text-lg font-semibold mb-4">Delete Purge</h2>
      <p className="mb-6">Are you sure you want to delete this purge?</p>
      <div className="flex justify-end gap-4">
        <button
          className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
          onClick={() => setShowDeleteModal(false)}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          onClick={handleDeletePurge}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default PurgeList;
