import React, { useState, useEffect } from "react";
import { Icon } from "@iconify-icon/react";
import {
  Eye,
  Search,
  X,
  Filter,
  Download,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../../../../context/AuthContext";

const ViewConnection = ({
  viewConnectionData,
  setViewConnectionData,
  connectionDetails,
  closeModal,
}) => {
  const [serviceSelection, setServiceSelection] = useState({
    is_migrated: false,
    is_purged: false,
    is_virtualization: false,
    cdc_enabled: false,
  });
  const [viewSchema, setViewSchema] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [isLoadingConnection, setIsLoadingConnection] = useState(true);
  const { token, hostnameV1 } = useAuth();

  const viewColumns = [
    { key: "table_name", label: "Table Name", sortable: true },
    { key: "viewTable", label: "View Columns", sortable: false },
    { key: "is_migrated", label: "Migration", sortable: true },
    { key: "is_purged", label: "Purge", sortable: true },
    { key: "is_virtualization", label: "Data Federation", sortable: true },
    { key: "cdc_enabled", label: "CDC", sortable: true },
  ];

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    if (viewConnectionData) {
      setIsLoadingConnection(false);
      let filtered = viewConnectionData.filter((row) =>
        row.table_name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (sortConfig.key) {
        filtered.sort((a, b) => {
          if (sortConfig.key === "table_name") {
            const valA = a.table_name || "";
            const valB = b.table_name || "";
            return sortConfig.direction === 'asc'
              ? valA.localeCompare(valB)
              : valB.localeCompare(valA);
          } else {
            const valA = a[sortConfig.key] ? 1 : 0;
            const valB = b[sortConfig.key] ? 1 : 0;
            // asc: checked (1) first, then unchecked (0)
            // desc: unchecked (0) first, then checked (1)
            return sortConfig.direction === 'asc' ? valB - valA : valA - valB;
          }
        });
      }

      setFilteredData(filtered);
    } else {
      setIsLoadingConnection(true);
    }
  }, [searchTerm, viewConnectionData, sortConfig]);

  const handleServiceCheckboxChange = (tableName, columnName) => {
    const updatedSelection = viewConnectionData.map((row) => {
      if (row.table_name === tableName) {
        return { ...row, [columnName]: !row[columnName] };
      }
      return row;
    });
    setViewConnectionData(updatedSelection);
  };

  const handleSelectAllServices = (columnName) => {
    const updatedSelection = {
      ...serviceSelection,
      [columnName]: !serviceSelection[columnName],
    };
    setServiceSelection(updatedSelection);

    const updatedTables = viewConnectionData?.map((row) => ({
      ...row,
      [columnName]: !serviceSelection[columnName],
    }));
    setViewConnectionData(updatedTables);
  };

  const handleUpdateConnection = () => {
    toast.success("Connection updated successfully");
    closeModal("modal4");
  };

  const openSchemaModal = (connection) => {
    setViewSchema({});
    setIsLoadingSchema(true);

    fetch(
      `${hostnameV1}/connection-master-metadata/find-column-json?conn_name=${connection.connection_name}&table_name=${connection.table_name}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        if (data && data.column_json) {
          setTimeout(() => {
            setViewSchema({ ...data, table_name: connection.table_name });
            setIsLoadingSchema(false);
          }, 300);
        } else {
          setIsLoadingSchema(false);
        }
        document.body.style.overflow = "hidden";
      })
      .catch((error) => {
        console.error("Error fetching column data:", error);
        setIsLoadingSchema(false);
        setViewSchema(null);
      });
  };

  useEffect(() => {
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    if (!viewSchema) {
      document.body.style.overflow = "auto";
    }
  }, [viewSchema]);

  const TableRowSkeleton = ({ colCount }) => (
    <tr className="border-b animate-pulse">
      {Array(colCount)
        .fill(0)
        .map((_, i) => (
          <td key={i} className="p-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </td>
        ))}
    </tr>
  );

  const SchemaRowSkeleton = () => (
    <tr className="border-b animate-pulse">
      <td className="p-3">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </td>
      <td className="p-3">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="p-3">
        <div className="h-4 bg-gray-200 rounded w-10"></div>
      </td>
      <td className="p-3">
        <div className="h-4 bg-gray-200 rounded w-10"></div>
      </td>
      <td className="p-3">
        <div className="h-4 bg-gray-200 rounded w-10"></div>
      </td>
      <td className="p-3">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </td>
    </tr>
  );

  return (
    <div className="fixed inset-0 z-50 bg-gray-500 bg-opacity-75 flex justify-center items-center overflow-auto">
      <div className="bg-white w-4/5 p-6 rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-[#8e78b7]">
              View Connection
            </h2>
            <Icon
              icon="material-symbols-light:info-outline"
              width="24"
              height="24"
              className="ml-2 text-gray-400"
            />
          </div>

          <button
            className="text-gray-500 hover:text-black rounded-full p-1 hover:bg-gray-100 transition-all"
            onClick={() => closeModal("modal4")}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex flex-wrap justify-between items-center">
            <div className="flex space-x-12">
              <div>
                <div className="text-gray-500 text-sm">Connector</div>
                {isLoadingConnection ? (
                  <div className="h-5 bg-gray-200 rounded w-24 animate-pulse mt-1"></div>
                ) : (
                  <div className="font-semibold text-gray-800">
                    {connectionDetails?.connection_type.toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="text-gray-500 text-sm">Connection Name</div>
                {isLoadingConnection ? (
                  <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mt-1"></div>
                ) : (
                  <div className="font-semibold text-gray-800">
                    {connectionDetails?.connection_name.toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="text-gray-500 text-sm">No. of Tables</div>
                {isLoadingConnection ? (
                  <div className="h-5 bg-gray-200 rounded w-8 animate-pulse mt-1"></div>
                ) : (
                  <div className="font-semibold text-gray-800">
                    {connectionDetails?.table_count || 0}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] transition-all"
                  placeholder="Search tables..."
                  disabled={isLoadingConnection}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-hidden bg-white rounded-lg shadow">
          <div className="max-h-[55vh] overflow-auto">
            <table className="w-full">
              <thead className="bg-[#29304a] text-white sticky top-0 z-10">
                <tr>
                  {viewColumns.map((col) => (
                    <th key={col.key} className="text-left p-4">
                      <div className="flex items-center">
                        {col.key !== "table_name" && col.key !== "viewTable" ? (
                          <div className="flex flex-col items-center mr-2">
                            {viewConnectionData?.length > 0 && (
                              <input
                                type="checkbox"
                                onChange={() =>
                                  handleSelectAllServices(col.key)
                                }
                                checked={serviceSelection?.[col.key] || false}
                                className="w-4 h-4"
                                disabled={isLoadingConnection}
                              />
                            )}
                          </div>
                        ) : null}
                        <div
                          className={`flex items-center ${col.sortable ? 'cursor-pointer hover:text-gray-200' : ''}`}
                          onClick={() => col.sortable && handleSort(col.key)}
                        >
                          <span>{col.label}</span>
                          {col.sortable && (
                            <ArrowUpDown
                              size={14}
                              className={`ml-1 ${sortConfig.key === col.key ? 'text-white' : 'text-gray-400'}`}
                            />
                          )}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {isLoadingConnection ? (
                  Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <TableRowSkeleton
                        key={index}
                        colCount={viewColumns.length}
                      />
                    ))
                ) : filteredData?.length > 0 ? (
                  filteredData.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      {viewColumns.map((col, colIndex) => (
                        <td key={colIndex} className="p-4 text-gray-700">
                          {col.key === "table_name" ? (
                            <div className="flex items-center">
                              <Icon
                                icon="material-symbols:table-rows-narrow-outline"
                                width="20"
                                height="20"
                                className="text-gray-500 mr-2"
                              />
                              <span className="font-medium">
                                {row[col.key]}
                              </span>
                            </div>
                          ) : col.key === "viewTable" ? (
                            <div className="flex justify-center">
                              <button
                                onClick={() => openSchemaModal(row)}
                                className="p-1.5 hover:bg-gray-200 rounded-full transition-all transform hover:scale-110 active:scale-95"
                                title="View Schema"
                              >
                                <Eye
                                  size={18}
                                  className="text-gray-500 hover:text-gray-600 transition-colors"
                                />
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <input
                                type="checkbox"
                                checked={row[col.key] || false}
                                onChange={() =>
                                  handleServiceCheckboxChange(
                                    row.table_name,
                                    col.key
                                  )
                                }
                                className="w-4 h-4"
                              />
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={viewColumns.length}
                      className="p-8 text-center text-gray-500"
                    >
                      {searchTerm
                        ? "No matching tables found"
                        : "No tables available"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            className="px-6 py-2 border rounded-lg text-gray-700 transition-all border-gray-300 hover:bg-[#8e78b7] hover:text-white"
            onClick={() => closeModal("modal4")}
          >
            Cancel
          </button>

          <button
            className="px-6 py-2 text-white rounded-lg bg-[#8e78b7] hover:bg-gray-400 transition-all"
            onClick={handleUpdateConnection}
            disabled={isLoadingConnection}
          >
            Save Changes
          </button>
        </div>
      </div>

      {viewSchema && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex justify-center items-center rounded-lg">
          <div className="bg-white w-3/4 p-6 rounded-lg shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-2 border-b">
              <div>
                <h2 className="text-xl font-bold text-[#8e78b7]">
                  Column Details
                </h2>

                <div>
                  <div className="text-sm text-gray-500 mt-2 flex flex-wrap gap-10">
                    <div>
                      Table:{" "}
                      {isLoadingSchema ? (
                        <span className="inline-block h-4 bg-gray-200 rounded w-32 animate-pulse align-middle"></span>
                      ) : (
                        <span className="font-semibold text-gray-800">
                          {viewSchema?.table_name?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      No. of Columns:{" "}
                      {isLoadingSchema ? (
                        <span className="inline-block h-4 bg-gray-200 rounded w-16 animate-pulse align-middle"></span>
                      ) : (
                        <span className="font-semibold text-gray-800">
                          {viewSchema?.column_json?.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                className="text-gray-500 hover:text-black rounded-full p-1 hover:bg-gray-100 transition-all"
                onClick={() => setViewSchema(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-grow overflow-auto rounded-lg">
              <table className="w-full">
                <thead className="bg-[#29304a] text-white sticky top-0 z-10">
                  <tr>
                    <th className="text-left p-3">Column Name</th>
                    <th className="text-left p-3">Data Type</th>
                    <th className="text-left p-3">Length</th>
                    <th className="text-left p-3">Precision</th>
                    <th className="text-left p-3">Scale</th>
                    <th className="text-left p-3">Nullable</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingSchema ? (
                    Array(8)
                      .fill(0)
                      .map((_, index) => <SchemaRowSkeleton key={index} />)
                  ) : viewSchema?.column_json?.length > 0 ? (
                    viewSchema.column_json.map((column, index) => (
                      <tr
                        key={index}
                        className={`border-b ${index % 2 === 0 ? "bg-gray-50" : "bg-white"
                          }`}
                      >
                        <td className="p-3 font-medium">
                          {column.column_name}
                        </td>
                        <td className="p-3">{column.DATA_TYPE}</td>
                        <td className="p-3">{column.DATA_LENGTH || "-"}</td>
                        <td className="p-3">{column.DATA_PRECISION || "-"}</td>
                        <td className="p-3">{column.DATA_SCALE || "-"}</td>
                        <td className="p-3">
                          {column.is_nullable?.toLowerCase() === "yes" ? (
                            <span className="text-green-600">Yes</span>
                          ) : (
                            <span className="text-red-600">No</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        No schema data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-6 pt-3 border-t">
              <button
                className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-gray-400 transition-all"
                onClick={() => setViewSchema(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewConnection;
