import { Icon } from "@iconify-icon/react";
import { useState } from "react";
import {
  Pencil,
  Trash2,
  Play,
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { encrypt } from "../../../utils/Crypto";
import { useSourceTypeCounts } from "../../../hooks/platform/cardCounts";
import { useArchivalData } from "../../../hooks/platform/archival";
import DataTable from "../../../components/DataTable";
import CardGrid from "../../../components/CardGrid";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { useMigrationData } from "../../../hooks/platform/migration";


const MigrationList = () => {
  const { data: cardData, isLoading: isCardLoading, error: cardError, refetchCardData } = useSourceTypeCounts('migration');
 const { data: migrationData=[], isLoading: isMigrationLoading, error: migrationError, refetch: refetchMigrations } = useMigrationData();

  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState(null);

 
const {token, hostnameV1}= useAuth()
  
  const handleCreateMigration = () => {
    navigate('/Migrationcanvas'); 
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
      { key: "project", label: "Project ", sortable: true },
      { key: "created_by", label: "Created By", sortable: true },
      { key: "source_conn_name", label: "Source Connection", sortable: true },
      { key: "target_conn_name", label: "Target Connection", sortable: true },
      { key: "source_table", label: "Source Table", sortable: true },
      { key: "target_table", label: "Target Table", sortable: true },
      { key: "status", label: "Status", sortable: true },
      { label: "Action", sortable: false },
    ]

    const handleCardClick = (card) => {
      const url = `/componentType=migration&dataScope=${card.title.replace(/\s+/g, '').toLowerCase()}&heading=${card.title}`;
      const encryptedUrl = encodeURIComponent(encrypt(url));
      navigate(`/details?${encryptedUrl}`);
    };
    const actions = [
      {
        label: "Edit",
        icon: <Pencil size={16} />,
        onClick: (row) => console.log("Edit clicked for", row),
      },
      {
        label: "Delete",
        icon: <Trash2 size={16} />,
        onClick: (row) => console.log("Delete clicked for", row),
      },
      {
        label: "Run",
        icon: <Play size={16} fill="currentColor" />,
        onClick: async (row) => {
          try {
            const response = await axios.get(`${hostnameV1}/migrations/manualtrigger/${row.workflow_name}`, {
              headers: {Authorization: `Bearer ${token}`},
            });
            // console.log("Migration Run Response:", response.data);
            toast.success("Migration triggered successfully!");
            refetchArchival();
          } catch (error) {
            console.error("Failed to trigger Migration:", error);
            toast.error("Failed to trigger Migration.");
          }
        },
      },
    ];
  console.log("🔍 Migration Data Sample:", migrationData[0]);
  return (
    <div className="p-6">
      <div className="flex gap-2 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Migration</h1>
        <div>
        <button
            onClick={()=>navigate(`/details?${encodeURIComponent(encrypt("componentType=metadata&heading=metadata"))}`)}
            type="button"
            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            View Metadata
          </button>
          <button
            onClick={()=>navigate("/canvas/metadataCanvas")}
            type="button"
            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            Create Migration
          </button>
        </div>
      </div>


      <CardGrid cards={cards} onCardClick={handleCardClick} isLoading={isCardLoading}/>

      <DataTable  columns={columns}
  data={migrationData}
  actions={actions}
  isLoading={isMigrationLoading}
  isError={migrationError}
  refetch={refetchMigrations}
/>
    </div>
  );
};

export default MigrationList;
    