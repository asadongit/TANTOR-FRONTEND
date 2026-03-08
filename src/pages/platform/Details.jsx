import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  RefreshCcw,
  Search,
  ChevronDown,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { decrypt } from "../../utils/Crypto";
import { useConnectionData } from "../../hooks/platform/connection";
import { usePurgeData } from "../../hooks/platform/purge";
import { useReportData } from "../../hooks/platform/report";
import { useCDCData } from "../../hooks/platform/cdc";
import { useMigrationData } from "../../hooks/platform/migration";
import { useMetadataData } from "../../hooks/platform/metadata";
import { useProjectData } from "../../hooks/platform/project";
import { useRuleData } from "../../hooks/platform/reportingframework/rules";
import DataTable from "../../components/DataTable";
import { getActionConfigurations } from "../../components/actionsConfig";
import columnConfigurations from "../../components/columnsConfig";
import { useAuth } from "../../context/AuthContext";
import Breadcrumb from "../../components/Breadcrumb";
import { useRef } from "react";
import axios from "axios";

const useDynamicData = (componentType) => {

  const hookMap = {
    cdc: useCDCData,
    migration: useMigrationData,
    purge: usePurgeData,
    project: useProjectData,
    connections: useConnectionData,
    metadata: useMetadataData,
    report: useReportData,
    rules: useRuleData,
    //   federation: useFederationData,
  };


  return hookMap[componentType] ? hookMap[componentType]() : [];
};

const Details = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, project, hostnameV2, hostnameV1, decodedToken } = useAuth();
  const encryptedQuery = location.search.slice(1);
  const decryptedQuery = decrypt(decodeURIComponent(encryptedQuery));
  const queryString = decryptedQuery.startsWith("/") ? decryptedQuery.slice(1) : decryptedQuery;
  const params = new URLSearchParams(queryString);

  const componentType = params.get("componentType");
  const cardType = params.get("cardType")?.toLowerCase();
  const dataScope = params.get("dataScope");
  const heading = params.get("heading");

  const columnAliases = {
    migration: "migration",
    cdc: "cdc",
    purge: "purge",
    transformation: "transformation",
    "metadata-archivals": "migration",
  };


  const selectedType = cardType || componentType;
  const storageKeyIdentifier = [componentType, dataScope].filter(Boolean).join('_').toLowerCase();

  const { data = [], isLoading, isError, refetch } = useDynamicData(selectedType);

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [activeMenu, setActiveMenu] = useState(null);

  const [autoRefreshInterval, setAutoRefreshInterval] = useState(() => {
    const saved = localStorage.getItem(`autoRefresh_details_${storageKeyIdentifier}_${decodedToken?.preferred_username}`);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isAutoRefreshMenuOpen, setIsAutoRefreshMenuOpen] = useState(false);
  const autoRefreshMenuRef = useRef(null);

  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, type: null, onConfirm: null });

  const [resetSortTrigger, setResetSortTrigger] = useState(0);
  const handleClearSort = () => {
    setResetSortTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (decodedToken?.preferred_username && storageKeyIdentifier) {
      const saved = localStorage.getItem(`autoRefresh_details_${storageKeyIdentifier}_${decodedToken?.preferred_username}`);
      if (saved) {
        setAutoRefreshInterval(parseInt(saved, 10));
      } else {
        setAutoRefreshInterval(0);
      }
    }
  }, [decodedToken, storageKeyIdentifier]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autoRefreshMenuRef.current && !autoRefreshMenuRef.current.contains(event.target)) {
        setIsAutoRefreshMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getColumnConfiguration = useCallback((type) => {
    const resolvedType = columnAliases[type] || type;
    return [
      ...columnConfigurations.common,
      ...(columnConfigurations[resolvedType] || []),
    ];
  }, []);

  const columns = useMemo(
    () => getColumnConfiguration(cardType || componentType),
    [getColumnConfiguration, cardType, componentType]
  );


  const processedData = useMemo(() => {
    let result = [...data];

    if (project !== "none" && project !== "default" && project && componentType !== "project") {
      result = result.filter((row) => row.project === project);
    }

    if (dataScope) {
      result = result?.filter((row) => {
        const filterMap = {
          connections:
            row?.status?.toLowerCase() === dataScope?.toLowerCase() ||
            row.pool_type?.toLowerCase() === dataScope?.toLowerCase(),
          cdc: row.source_conn_type === dataScope,
          migration: row.source_conn_type === dataScope,
          purge: row.source_conn_type === dataScope,
          transformation: row.source_conn_type === dataScope,
          metadata: row.source_conn_type === dataScope,
        };
        return filterMap[selectedType] ?? true;
      });
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(row =>
        Object.values(row)
          .filter(val => typeof val === "string" || typeof val === "number")
          .some(val =>
            String(val).toLowerCase().includes(lowerSearch)
          )
      );
    }

    return result;
  }, [data, dataScope, componentType, searchTerm, project]);


  const actions = useMemo(() => {
    return getActionConfigurations({ token, project, hostnameV2, hostnameV1, navigate, setDeleteModal, refetch })[selectedType];
  }, [selectedType, token, project, hostnameV2, hostnameV1, navigate, refetch]);

  useEffect(() => {
    refetch();

    if (autoRefreshInterval === 0) return;

    const intervalId = setInterval(() => {
      refetch();
    }, autoRefreshInterval);

    return () => clearInterval(intervalId);
  }, [refetch, autoRefreshInterval]);

  const handleCDCDeleteSelected = (selectedItems) => {
    if (!selectedItems || selectedItems.length === 0) return;

    const cdcIds = selectedItems.map((row) => row.cdc_id);

    setDeleteModal({
      open: true,
      type: "CDC connectors",
      onConfirm: async () => {
        const loadingToast = toast.loading("Deleting selected CDC connectors...");

        try {
          await axios.delete(`${hostnameV2}/cdc/bulk-delete`, {
            headers: { Authorization: `Bearer ${token}` },
            data: cdcIds,
          });

          toast.dismiss(loadingToast);
          toast.success("Selected CDC connectors deleted successfully");

          if (refetch) await refetch();
        } catch (error) {
          toast.dismiss(loadingToast);
          console.error("Bulk delete failed:", error);
          toast.error("Failed to delete selected CDC connectors");
        }
      },
    });
  };

  const handleMetadataDeleteSelected = (selectedItems) => {
    if (!selectedItems || selectedItems.length === 0) return;

    const metadataIds = selectedItems.map((row) => row.metadata_id);

    setDeleteModal({
      open: true,
      type: "selected metadata records",
      onConfirm: async () => {
        const loadingToast = toast.loading("Deleting selected metadata records...");

        try {
          await axios.delete(`${hostnameV1}/metadata-archivals/bulk-delete`, {
            headers: { Authorization: `Bearer ${token}` },
            data: metadataIds,
          });

          toast.dismiss(loadingToast);
          toast.success("Selected metadata records deleted successfully");

          if (refetch) await refetch();
        } catch (error) {
          toast.dismiss(loadingToast);
          console.error("Bulk metadata delete failed:", error);
          toast.error("Failed to delete selected metadata records");
        }
      },
    });
  };


  return (
    <div className="flex flex-col h-full p-4">
      <Breadcrumb
        title="Platform"
        link="/"
        title2={componentType === "metadata" ? "Migration" : componentType?.charAt(0).toUpperCase() + componentType?.slice(1)}
        link2={componentType === "metadata" ? '/migration' : `/${componentType}`}
        title3={componentType === "metadata" ? 'Metadata Details' : 'Details'}
      />

      <div className="flex flex-col md:flex-row gap-4 mt-6 mb-4 items-center justify-between">
        <h4 className="text-xl font-semibold">{heading?.toUpperCase()}</h4>

        <div className="flex items-center gap-2">

          <div className="relative">
            <input
              type="text"
              placeholder="Search details"
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
                  refetch();
                  setSearchTerm("");
                  handleClearSort();
                  toast.success("Details data refreshed successfully");
                }}
                title="Refresh data"
                disabled={isLoading}
              >
                <RefreshCcw
                  className={`h-5 w-5 text-gray-600 ${isLoading ? "icon-rotate" : ""}`}
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
                        localStorage.setItem(`autoRefresh_details_${storageKeyIdentifier}_${decodedToken?.preferred_username}`, option.value.toString());
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
        </div>
      </div>

      <DataTable
        columns={columns}
        data={processedData}
        actions={actions}
        isLoading={isLoading}
        isError={isError}
        refetch={refetch}
        resetSortTrigger={resetSortTrigger}
        onDeleteSelected={
          selectedType === "cdc"
            ? handleCDCDeleteSelected
            : selectedType === "metadata"
              ? handleMetadataDeleteSelected
              : undefined
        }

      />

      {deleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[400px] p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[#8e78b7] mb-4">
              Confirm Deletion
            </h2>
            <p className="mb-6 text-gray-700">
              Are you sure you want to delete {deleteModal.type}?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteModal({ open: false, id: null, type: null, onConfirm: null })}
                className="px-6 py-2 border border-gray-400 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteModal.onConfirm();
                  setDeleteModal({ open: false, id: null, type: null, onConfirm: null });
                }}
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

export default Details;
