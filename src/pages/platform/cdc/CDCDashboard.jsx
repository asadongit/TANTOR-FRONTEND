import { Icon } from "@iconify-icon/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { List, RefreshCcw, BarChart3 } from "lucide-react";
import { useRealtimeUpdate } from "../../../hooks/platform/realtime_update";
import Charts from "./components/Charts";
import { Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { usePlatform } from "../../../context/platformContext";
import { useCDCData } from "../../../hooks/platform/cdc";
import { useSourceTypeCounts } from "../../../hooks/platform/cardCounts";
import CardGrid from "../../../components/CardGrid";
import { encrypt } from "../../../utils/Crypto";
import { FeatureFlag, featureFlags } from "../../../components/FeatureFlag";
import { useAuth } from "../../../context/AuthContext";

const rotateAnimation = `
  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .icon-rotate {
    animation: rotate 1s linear infinite;
  }
`;

const CDCDashboard = () => {
  const { data: cardData, isLoading: isCardLoading, error: cardError, refetch: refetchCardCounts } = useSourceTypeCounts('cdc');
  const { data: CDCData = [], isLoading: isCDCLoading, error: CDCError, refetch: refetchCDCData } = useCDCData();

  const navigate = useNavigate();
  const { decodedToken } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRealtimeUpdate = useCallback(() => {
    refetchCDCData();
    refetchCardCounts();
  }, [refetchCDCData, refetchCardCounts]);

  useRealtimeUpdate("cdcv2", handleRealtimeUpdate);





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


  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (typeof refetchCardCounts === "function") await refetchCardCounts();
      if (typeof refetchCDCData === "function") await refetchCDCData();
      toast.success("refreshed successfully!");
    } catch (e) {
      toast.error("Failed to refresh CDC data");
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
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
  const handleMetricsClick = () => {
    window.open('https://kafbat-ui.tantor.io/', '_blank');
  };


  return (
    <div>
      <style>{rotateAnimation}</style>
      <div className="flex gap-2 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">CDC</h1>
        <div className="flex items-center gap-2">
          <FeatureFlag flag={featureFlags.SHOW_KAFKA_METRICS_IN_CDC}>
            <button
              type="button"
              className="flex items-center gap-2 w-auto h-10 px-3 rounded-lg border border-gray-400 hover:bg-gray-50"
              onClick={handleMetricsClick}
              title="Metrics Dashboard"
            >
              <BarChart3 className="h-5 w-5 text-[#8d77ba]" />
              <span className="text-[#8d77ba] font-medium">Dashboard</span>
            </button>
          </FeatureFlag>

          <div className="relative flex items-center">
            <button
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-400 hover:bg-gray-50"
              onClick={handleRefresh}
              title="Refresh data"
              disabled={isRefreshing || isCDCLoading || isCardLoading}
            >
              <RefreshCcw
                className={`h-5 w-5 text-gray-600 ${(isRefreshing || isCDCLoading || isCardLoading) ? "icon-rotate" : ""}`}
              />
            </button>
          </div>

          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-400 hover:bg-gray-50"
            onClick={handleListClick}
            title="Show List"
          >
            <List className="h-5 w-5 text-[#8d77ba]" />
          </button>

          <button
            onClick={() => navigate("/canvas/CDCcanvas")}
            type="button"
            className="px-4 py-2 rounded-lg bg-[#8d77ba] text-white flex items-center gap-2 hover:bg-opacity-90"
          >
            <Icon
              icon="material-symbols:add"
              width="20"
              height="20"
              className="text-white"
            />
            <span>Create CDC</span>
          </button>
        </div>
      </div>

      <CardGrid cards={cards} onCardClick={handleCardClick} isLoading={isCardLoading} />

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