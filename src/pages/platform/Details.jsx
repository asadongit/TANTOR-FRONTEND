import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePlatform } from "../../context/platformContext";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Play,
  RefreshCcw,
  ArrowUpDown,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import { decrypt } from "../../utils/Crypto";
import { useConnectionData } from "../../hooks/platform/connection";
import { useAllConnectionData } from "../../hooks/platform/connection";
import { usePurgeData } from "../../hooks/platform/purge";
import { useReportData } from "../../hooks/platform/report";
import { useCDCData } from "../../hooks/platform/cdc";
import { useArchivalData } from "../../hooks/platform/archival";
import { useMigrationData } from "../../hooks/platform/migration";
import { useProjectData } from "../../hooks/platform/project";
import DataTable from "../../components/DataTable";
import { getActionConfigurations } from "../../components/actionsConfig";
import columnConfigurations from "../../components/columnsConfig";
import { useAuth } from "../../context/AuthContext";

const useDynamicData = (componentType) => {
  const hookMap = {
    cdc: useCDCData,
    migration: useMigrationData,
    purge: usePurgeData,
    project: useProjectData,
    connections: useConnectionData,
    transformation: useArchivalData,
    report: useReportData,
    metadata: useArchivalData,
  };

  return hookMap[componentType] ? hookMap[componentType]() : [];
};

const Details = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, project, hostnameV2, hostnameV1 } = useAuth();
  const encryptedQuery = location.search.slice(1);
  const decryptedQuery = decrypt(decodeURIComponent(encryptedQuery));
  const queryString = decryptedQuery.startsWith("/") ? decryptedQuery.slice(1) : decryptedQuery;
  const params = new URLSearchParams(queryString);

  const componentType = params.get("componentType");
  const cardType = params.get("cardType")?.toLowerCase();
  const dataScope = params.get("dataScope");
  const heading = params.get("heading");

  const selectedType = cardType || componentType;

  const { connectionData, requestHandler, setMigrationData } = usePlatform();
  const [filteredData, setFilteredData] = useState([]);

  const { data = [], isLoading, isError, refetch } = useDynamicData(selectedType);

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [activeMenu, setActiveMenu] = useState(null);

  const getColumnConfiguration = useCallback((type) => {
    return [
      ...columnConfigurations.common,
      ...(columnConfigurations[type] || []),
    ];
  }, []);

  const columns = useMemo(() => {
    return [
      ...columnConfigurations.common,
      ...(columnConfigurations["migration"] || [])
    ];
  }, []);

  useEffect(() => {
  if (componentType === "migration" && dataScope) {
    const filtered = data.filter(
      (row) =>
        row?.source_conn_type?.toLowerCase() === dataScope.toLowerCase()
    );
    setFilteredData(filtered);
  } else {
    setFilteredData(data);
  }
}, [data, dataScope, componentType]);

const processedData = useMemo(() => {
  let result = [...filteredData];

  if (searchTerm) {
    const lowerSearch = searchTerm.toLowerCase();
    result = result.filter((row) =>
      Object.values(row)
        .filter((val) => typeof val === "string" || typeof val === "number")
        .some((val) => String(val).toLowerCase().includes(lowerSearch))
    );
  }

  return result;
}, [filteredData, searchTerm]);

  const actions = useMemo(() => {
    return getActionConfigurations({ token, project, hostnameV2, navigate })[selectedType];
  }, [selectedType]);

  return (
    <div className="flex flex-col h-full p-4">
      {/* ... UI code unchanged ... */}

      <DataTable
        columns={columns}
        data={processedData}
        actions={actions}
        isLoading={isLoading}
        isError={isError}
        refetch={refetch}
      />
    </div>
  );
};

export default Details;
