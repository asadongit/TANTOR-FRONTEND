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

const Details = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const encryptedQuery = location.search.slice(1);
  const decryptedQuery = decrypt(decodeURIComponent(encryptedQuery));
  const queryString = decryptedQuery.startsWith("/")
    ? decryptedQuery.slice(1)
    : decryptedQuery;

  const params = new URLSearchParams(queryString);

  const componentType = params.get("componentType");
  const cardType = params.get("cardType");
  const dataScope = params.get("dataScope");
  const heading = params.get("heading");

  const columnAliases = {
    migrations: "archival",
    purges: "purge",
    Transformation: "migration",
    "metadata-archivals": "migration",
  };


  const { requestHandler, dataMap } = usePlatform();

  const selectedType = columnAliases[cardType] || componentType;

  const { data, setData, endpoint } = dataMap[selectedType] || {
    data: [],
    setData: () => {},
    endpoint: "",
  };

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [activeMenu, setActiveMenu] = useState(null);
  let updatedEndpoint;
  if (cardType) {
    updatedEndpoint = `/${cardType}`;
  }

  const columnConfigurations = {
    common: [],
    //  [
    //   { key: "created_by", label: "Created By", sortable: true },
    //   { key: "created_at", label: "Created At", sortable: true },
    //   { key: "project", label: "Project", sortable: true },
    // ],

    cdc: [
      { key: "workflow_name", label: "Name", sortable: true },
      { key: "project", label: "Project Name", sortable: true },
      { key: "created_by", label: "Created By", sortable: true },
      { key: "source_conn_name", label: "Source Connection", sortable: true },
      { key: "target_conn_name", label: "Target Connection", sortable: true },
      { key: "source_table", label: "Source Table", sortable: true },
      { key: "target_table", label: "Target Table", sortable: true },
    ],
    connection: [
      { key: "connection_name", label: "Name", sortable: true },
      { key: "project", label: "Project Name", sortable: true },
      { key: "created_by", label: "Created By", sortable: true },
      { key: "connection_type", label: "connection Type", sortable: true },
      { key: "database_name", label: "database Name", sortable: true },
      { key: "username", label: "Username", sortable: true },
      { key: "host_address", label: "Hostname", sortable: true },

      { key: "", label: "No. of Tables", sortable: true },
      { key: "status", label: "Status", sortable: true },
    ],
    transformation: [
      { key: "workflow_name", label: "Name", sortable: true },
      { key: "project", label: "Project Name", sortable: true },
      { key: "created_by", label: "Created By", sortable: true },
      { key: "source_conn_name", label: "Source Connection", sortable: true },
      { key: "target_conn_name", label: "Target Connection", sortable: true },
      { key: "source_table", label: "Source Table", sortable: true },
      { key: "target_table", label: "Target Table", sortable: true },
      { key: "status", label: "Status", sortable: true },
    ],
    migration: [
      { key: "metadata_name", label: "Name", sortable: true },
      { key: "project", label: "Project ", sortable: true },
      { key: "created_by", label: "Created By", sortable: true },
      { key: "source_conn_name", label: "Source Connection", sortable: true },
      { key: "target_conn_name", label: "Target Connection", sortable: true },
      { key: "source_table", label: "Source Table", sortable: true },
      { key: "target_table", label: "Target Table", sortable: true },
      { key: "status", label: "Status", sortable: true },
    ],
    purge: [
      { key: "purge_name", label: "Name", sortable: true },
      { key: "project", label: "Project Name", sortable: true },
      { key: "created_by", label: "Created By", sortable: true },
      { key: "source_conn_name", label: "Source Connection", sortable: true },
      { key: "target_conn_name", label: "Target Connection", sortable: true },
      { key: "source_table", label: "Source Table", sortable: true },
      { key: "target_table", label: "Target Table", sortable: true },
      { key: "status", label: "Status", sortable: true },
    ],

    project: [
      { key: "project_name", label: "Project Name", sortable: true },
      { key: "records_purged", label: "Records Purged", sortable: true },
      { key: "timestamp", label: "Purge Timestamp", sortable: true },
      { key: "size_before", label: "Size Before", sortable: true },
      { key: "size_after", label: "Size After", sortable: true },
    ],
    federation: [
      { key: "connection_name", label: "Name", sortable: true },
      { key: "project", label: "Project", sortable: true },
      { key: "schema", label: "Schema", sortable: true },
      { key: "timestamp", label: "Table", sortable: true },
      { key: "Views", label: "Views", sortable: true },
    ],
  };

  const getColumnConfiguration = useCallback((type) => {
    const resolvedType = columnAliases[type] || type;
    return [
      ...columnConfigurations.common,
      ...(columnConfigurations[resolvedType] || []),
    ];
  }, []);

  const tableColumns = useMemo(
    () => getColumnConfiguration(cardType || componentType),
    [getColumnConfiguration, cardType, componentType]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const finalEndpoint = updatedEndpoint || endpoint;
        await requestHandler({ endpoint: finalEndpoint, setState: setData });
      } catch (error) {
        console.error(`Failed to fetch ${componentType} data:`, error);
      }
    };

    if (data.length === 0 || updatedEndpoint) {
      fetchData();
    }
  }, [endpoint, updatedEndpoint]);

  const processedData = useMemo(() => {
    let result = [...data];
    if (dataScope) {
      result = result.filter((row) => {
        const filterMap = {
          connection: row.status === dataScope || row.pool_type === dataScope,
          cdc: row.source_conn_type === dataScope,
          migration: row.source_conn_type === dataScope,
          purge: row.source_conn_type === dataScope,
          transformation: row.source_conn_type === dataScope,
        };

        return filterMap[componentType] ?? true;
      });
    }

    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchTermLower)
        )
      );
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        const comparison = a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchTerm, sortConfig, dataScope, componentType]);

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, page, itemsPerPage]);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleRefresh = useCallback(() => {
    requestHandler({ endpoint, setState: setData });
    toast.success("Data refreshed successfully!");
  }, [endpoint, requestHandler, setData]);

  const toggleActionMenu = useCallback((index) => {
    setActiveMenu((prev) => (prev === index ? null : index));
  }, []);

  const renderPaginationControls = () => (
    <div className="flex flex-col md:flex-row items-center justify-between">
      <div className="text-sm text-gray-500 mb-2 md:mb-0">
        {`${(page - 1) * itemsPerPage + 1} to ${Math.min(
          page * itemsPerPage,
          processedData.length
        )} of ${processedData.length} results`}
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">Show per page</span>
        <select
          className="border rounded p-1 text-sm"
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setPage(1);
          }}
        >
          {[10, 25, 50].map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
        <div className="flex">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="p-1 border rounded-l hover:bg-gray-100"
            disabled={page === 1}
          >
            <ChevronLeft
              size={20}
              className={page === 1 ? "text-gray-300" : "text-gray-600"}
            />
          </button>
          <button
            onClick={() =>
              setPage((prev) =>
                prev < Math.ceil(processedData.length / itemsPerPage)
                  ? prev + 1
                  : prev
              )
            }
            className="p-1 border rounded-r border-l-0 hover:bg-gray-100"
            disabled={page >= Math.ceil(processedData.length / itemsPerPage)}
          >
            <ChevronRight
              size={20}
              className={
                page >= Math.ceil(processedData.length / itemsPerPage)
                  ? "text-gray-300"
                  : "text-gray-600"
              }
            />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full p-4">
      <nav className="flex mb-4" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-2">
          {[
            { label: "Platform", path: "/" },
            {
              label:
                componentType.charAt(0).toUpperCase() + componentType.slice(1),
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
        <h4 className="text-2xl font-medium">{heading}</h4>
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
            onClick={handleRefresh}
          >
            <RefreshCcw className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        className="overflow-auto border rounded-lg mb-4"
        style={{ maxHeight: "calc(100vh - 240px)" }}
      >
        <table className="w-full bg-white table-fixed">
          <thead>
            <tr className="bg-gray-800 text-white sticky top-0 z-10">
              {tableColumns.map((column) => (
                <th
                  key={column.label}
                  className="py-3 px-4 text-left sticky top-0 bg-gray-800 z-10"
                  style={{ minWidth: "120px" }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.label}
                    {column.sortable && (
                      <ArrowUpDown
                        className="ml-2 cursor-pointer"
                        size={16}
                        color="white"
                      />
                    )}
                  </div>
                </th>
              ))}
              <th className="py-3 px-4 text-left sticky top-0 bg-gray-800 z-10 w-[100px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={tableColumns.length + 1}
                  className="py-4 px-4 text-center text-gray-500"
                >
                  No data found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b hover:bg-gray-50 relative group"
                >
                  {tableColumns.map((column) => (
                    <td
                      key={column.key}
                      className="py-3 px-4 text-gray-600 truncate"
                    >
                      <div
                        className="truncate max-w-[200px]"
                        title={row[column.key] || "N/A"}
                      >
                        {row[column.key] || "N/A"}
                      </div>
                    </td>
                  ))}
                  <td className="py-3 px-4 text-center relative">
                    <div className="relative">
                      <button
                        className="p-1 text-gray-600 hover:text-gray-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleActionMenu(rowIndex);
                        }}
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {activeMenu === rowIndex && (
                        <div
                          className="absolute right-4 mt-2 bg-white shadow-lg rounded-lg py-1 px-3 z-10 border"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center space-x-3">
                            <button className="p-1 text-gray-500 hover:text-gray-800">
                              <Pencil size={18} />
                            </button>
                            <button className="p-1 text-gray-500 hover:text-gray-800">
                              <Trash2 size={18} />
                            </button>
                            <button className="p-1 text-gray-500 hover:text-gray-800">
                              <Play size={18} fill="currentColor" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {renderPaginationControls()}
    </div>
  );
};

export default Details;
