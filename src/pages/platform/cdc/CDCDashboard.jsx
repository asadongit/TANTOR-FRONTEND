import { Icon } from "@iconify-icon/react";
import { useState, useEffect } from "react";
import { List, RefreshCcw } from "lucide-react";
import Charts from "./components/Charts";
import { Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { usePlatform } from "../../../context/platformContext";
import { useCDCData } from "../../../hooks/platform/cdc";
import { useSourceTypeCounts } from "../../../hooks/platform/cardCounts";
import CardGrid from "../../../components/CardGrid";
import { encrypt } from "../../../utils/Crypto";
const CDCDashboard = () => {
const { data: cardData, isLoading: isCardLoading, error: cardError } = useSourceTypeCounts('cdc');
const { data: CDCData=[], isLoading: isCDCLoading, error: CDCError } = useCDCData();

const navigate = useNavigate();


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


  const handleRefresh = () => {
    toast.success("refreshed successfully!");
  };

  const handleCardClick = (card) => {
    const url = `/componentType=cdc&dataScope=${card.title.replace(/\s+/g, '').toLowerCase()}&heading=${card.title}`;
    const encryptedUrl = encodeURIComponent(encrypt(url));
    navigate(`/details?${encryptedUrl}`);
  };
  const handleListClick = (card) => {
    const url = `/componentType=cdc&heading=cdc`;
    const encryptedUrl = encodeURIComponent(encrypt(url));
    navigate(`/details?${encryptedUrl}`);
  };
  const handlekafkaClick = () => {
    navigate("/cdc/kafka-dashboard");
  };


  return (
    <div>
      <div className="flex gap-2 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">CDC</h1>
        <div>

           <button
            type="button"
            className="text-black shadow-lg hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
            onClick={handlekafkaClick}
          >
            {/* <List className="h-5 w-5" /> */}
            <h1 className="mb5">Kafka Dashboard</h1>
          </button>
          <button
            type="button"
            className="text-black shadow-lg hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
            onClick={handleListClick}
          >
            <List className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="text-black shadow-lg hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
            onClick={handleRefresh}
          >
            <RefreshCcw className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate("/canvas/CDCcanvas")}
            type="button"
            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            + Create CDC
          </button>
        </div>
      </div>

      <CardGrid cards={cards} onCardClick={handleCardClick} isLoading={isCardLoading}/>

      <div className="flex flex-col items-start gap-2.5 m-2">
        <h2
          size="heading_h2_proxima_bold_20_px"
          as="h4"
          className="text-[20px] font-medium"
        >
          {" "}
          CDC Overview{" "}
        </h2>
      </div>
      <div className="flex gap-4 self-stretch ">
        <Charts data={CDCData} />
      </div>
    </div>
  );
};

export default CDCDashboard;