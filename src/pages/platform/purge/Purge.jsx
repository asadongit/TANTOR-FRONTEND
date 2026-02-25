import { Icon } from "@iconify-icon/react";
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Pencil,
  Trash2,
  Play,
  X,
  ExternalLink,
} from "lucide-react";
import { encrypt } from "../../../utils/Crypto";
import { useSourceTypeCounts } from "../../../hooks/platform/cardCounts";
import { usePurgeData } from "../../../hooks/platform/purge";
import CardGrid from "../../../components/CardGrid";
import DataTable from "../../../components/DataTable";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import Breadcrumb from "../../../components/Breadcrumb";
import { DagErrorModal } from "../../../components/DagErrorModal";

const PurgeList = () => {
  const { data: cardData, isLoading: isCardLoading, error: cardError,refetch : refetchCardData } = useSourceTypeCounts('purge');
  const { data: purgeData=[], isLoading: isPurgeLoading, error: purgeError, refetch : refetchPurges } = usePurgeData();


  const navigate = useNavigate();
  const {token, hostnameV1}= useAuth();

  const [dagErrorModal, setDagErrorModal] = useState({
    isOpen: false,
    isLoading: false,
    data: null,
    dagId: null,
  });

  const handleCreatePurge = () => {
    navigate("/PurgeCanvas");
  };

  const fetchDagFailure = async (dagId) => {
    console.log("dag id ", dagId)
    setDagErrorModal({ isOpen: true, isLoading: true, data: null, dagId });
    try {
      const response = await axios.get(
        `${hostnameV1}/dag-failure?dag_id=${dagId}&dag_type=purge`,
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
  const actions = [
    {
      label: "Edit",
      icon: <Pencil size={16} />,
      onClick: (row) => {
        // Navigate to edit/canvas page and pass ui_json for node pre-population
        navigate("/PurgeCanvas", {state: {ui_json: row?.ui_json, purge_id: row?.purge_id}});
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
    { key: "status", label: "Status", sortable: true, render: (row) => {
        let className = "px-2 py-1 rounded-full font-medium";
        if (row.status.toLowerCase() === "failed") {
          className += " bg-red-100 text-red-600";
          return (
            <button
              onClick={() => fetchDagFailure(row.purge_name)}
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
      }, },
    { label: "Action", sortable: false},

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
      <Breadcrumb title="Platform" link={"/"} />
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

      <DagErrorModal
        isOpen={dagErrorModal.isOpen}
        onClose={() => setDagErrorModal({ isOpen: false, isLoading: false, data: null, dagId: null })}
        isLoading={dagErrorModal.isLoading}
        data={dagErrorModal.data}
      />
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

const PurgeEmpty = () => {

  const navigate = useNavigate();

  const handleCreatePurging = () => {
    navigate('/PurgeCanvas')
  }

  return (
    <div className="p-6">
        <Breadcrumb title="Platform" link={"/"} />

      <div className="flex gap-2 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Purge</h1>
      </div>
      <div className="bg-gray-50 p-8 rounded-lg shadow-sm w-full text-center outline outline-slate-100">
        <Icon icon="ic:baseline-move-down" width="48" height="48" className="text-gray-300"/>
        <h2 className="text-black-500 text-3xl mb-4 font-semibold w-full block">
          Sorry, no purging found
        </h2>
        <p className="text-gray-500 text-lg mb-4">
          There are no item with this data.
        </p>
        <button onClick={handleCreatePurging} className="bg-[#8e78b7] text-white px-5 py-2.5 rounded-md hover:bg-[#8e78b7] transition-colors text-sm font-medium">
          Create Purge
        </button>
      </div>
    </div>
  );
};

const Purge = () => {

  const isLoggedIn = true;

  return (
    <div>
      {isLoggedIn ?
        (
          <PurgeList />
        )
        :
        (
          <PurgeEmpty />
        )}
    </div>
  );
};

export default Purge;