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



const PurgeList = () => {
  const { data: cardData, isLoading: isCardLoading, error: cardError } = useSourceTypeCounts('purge');
  const { data: purgeData=[], isLoading: isPurgeLoading, error: purgeError } = usePurgeData();


  const navigate = useNavigate();

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
        <CardGrid cards={cards} onCardClick={handleCardClick} />
            <DataTable
        columns={columns}
        data={purgeData}
        // actions={actions}
      />
    </div>
  );
};

export default PurgeList;
