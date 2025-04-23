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
    //   federation: useFederationData,
  };

  return hookMap[componentType] ? hookMap[componentType]() : [];
};

const Details = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {token, project, hostnameV2, hostnameV1}= useAuth()
  const encryptedQuery = location.search.slice(1);
  const decryptedQuery = decrypt(decodeURIComponent(encryptedQuery));
  const queryString = decryptedQuery.startsWith("/")
    ? decryptedQuery.slice(1)
    : decryptedQuery;

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

  const { data = [], isLoading, isError, refetch } = useDynamicData(selectedType);

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [activeMenu, setActiveMenu] = useState(null);



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
        };
        return filterMap[selectedType] ?? true;
      });
    }

    return result;
  }, [data, dataScope, componentType]);

  const actions = useMemo(() => {
    return getActionConfigurations({ token, project, hostnameV2,navigate  })[selectedType];;
  }, [selectedType]);
  
  return (
    <div className="flex flex-col h-full p-4">
      <nav className="flex mb-4" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-2">
          {[
            { label: "Platform", path: "/" },
            {
              label:
                componentType?.charAt(0).toUpperCase() + componentType.slice(1),
              path: `/${componentType}`,
            },
            { label: "Details", path: null },
          ].map((item, index) => (
            <li key={item.label} className="inline-flex items-center">
              {index > 0 && (
                <svg
                  className="w-3 h-3 text-gray-400 mx-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 6 10"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 9 4-4-4-4"
                  />
                </svg>
              )}
              {item.path ? (
                <span
                  onClick={() => navigate(item.path)}
                  className="text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                >
                  {item.label}
                </span>
              ) : (
                <span className="text-sm font-medium text-[#8e78b7]">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex flex-col md:flex-row gap-4 mb-4 items-center justify-between">
        <h4 className="text-2xl font-medium">{heading?.toUpperCase()}</h4>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8e78b7]"
            />
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
          </div>
          <button
            type="button"
            className="text-[#818181] shadow-lg border hover:bg-[#8e78b7] hover:text-white focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-2.5"
            onClick={()=>{refetch() 
              toast.success('Refreshed sucessfully!')
            }}
          >
            <RefreshCcw className="h-5 w-5" />
          </button>
        </div>
      </div>

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
