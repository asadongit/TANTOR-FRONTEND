import { Icon } from "@iconify-icon/react";
import { useState, useEffect, useRef } from "react";
import { List, RefreshCcw, BarChart3, ChevronDown, CheckCircle } from "lucide-react";
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
  const [isAutoRefreshMenuOpen, setIsAutoRefreshMenuOpen] = useState(false);
  const autoRefreshMenuRef = useRef(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(() => {
    const saved = localStorage.getItem(`autoRefresh_cdc_${decodedToken?.preferred_username}`);
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    if (decodedToken?.preferred_username) {
      const saved = localStorage.getItem(`autoRefresh_cdc_${decodedToken?.preferred_username}`);
      if (saved) {
        setAutoRefreshInterval(parseInt(saved, 10));
      }
    }
  }, [decodedToken]);

  useEffect(() => {
    if (autoRefreshInterval === 0) return;

    const interval = setInterval(() => {
      refetchCDCData();
      refetchCardCounts();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, refetchCDCData, refetchCardCounts]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autoRefreshMenuRef.current && !autoRefreshMenuRef.current.contains(event.target)) {
        setIsAutoRefreshMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


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

          <div className="relative flex items-center" ref={autoRefreshMenuRef}>
            <div className="flex rounded-lg border border-gray-400 hover:bg-gray-50 h-10">
              <button
                className="w-10 flex items-center justify-center border-r border-gray-300"
                onClick={handleRefresh}
                title="Refresh data"
                disabled={isRefreshing || isCDCLoading || isCardLoading}
              >
                <RefreshCcw
                  className={`h-5 w-5 text-gray-600 ${(isRefreshing || isCDCLoading || isCardLoading) ? "icon-rotate" : ""}`}
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
                      if (decodedToken?.preferred_username) {
                        localStorage.setItem(`autoRefresh_cdc_${decodedToken?.preferred_username}`, option.value.toString());
                      }
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