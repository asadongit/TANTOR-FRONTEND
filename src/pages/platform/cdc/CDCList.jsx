import React, { useEffect, useState, useMemo } from "react";
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
import { useParams, useNavigate } from "react-router-dom";
import { usePlatform } from "../../../context/platformContext";

const CDCList = () => {
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeMenu, setActiveMenu] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const { type } = useParams();
  const navigate = useNavigate();
  const { CDCData } = usePlatform();
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!CDCData.length > 0) {
      navigate("/cdc");
      return;
    }

    const filteredData = type
      ? CDCData.filter((item) => item.source_conn_type === type)
      : CDCData;

    setData(filteredData);
  }, [type, CDCData]);

  const processedData = useMemo(() => {
    let result = [...data];

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
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, page, itemsPerPage]);

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setPage(1);
  };

  const toggleActionMenu = (index) => {
    setActiveMenu(activeMenu === index ? null : index);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    const maxPage = Math.ceil(processedData.length / itemsPerPage);
    if (page < maxPage) setPage(page + 1);
  };

  const handleRefresh = () => {
    toast.success("Refreshed successfully!");
  };

  const tableColumns = [
    { key: "workflow_name", label: "Name" },
    { key: "project", label: "Project" },
    { key: "created_by", label: "Created by" },
    { key: "source_conn_name", label: "Source connection" },
    { key: "target_conn_name", label: "Table connection" },
    { key: "source_table", label: "Source table" },
    { key: "target_table", label: "Target table" },
    { key: "created_at", label: "Start date" },
    { key: "status", label: "Status" },
    { label: "Action", sortable: false },
  ];

  return (
    <div className="flex flex-col h-full">
      <div>
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2">
            <li className="inline-flex items-center">
              <span
                onClick={() => navigate("/")}
                className="inline-flex items-center text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700"
              >
                Platform
              </span>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 6 10"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 9 4-4-4-4"
                  />
                </svg>
                <span
                  onClick={() => navigate("/cdc")}
                  className="ms-1 text-sm font-medium cursor-pointer text-gray-500 hover:text-gray-700"
                >
                  CDC
                </span>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 6 10"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 9 4-4-4-4"
                  />
                </svg>
                <span className="ms-1 text-sm font-medium text-[#8e78b7]">
                  Details
                </span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="flex flex-col md:flex-row gap-4 mt-4 mb-4 items-center justify-between">
          <h4 className="text-2xl font-medium">CDC</h4>
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
      </div>

      <div
        className="overflow-auto border rounded-lg mb-4"
        style={{ maxHeight: "calc(100vh - 240px)" }}
      >
        <table className="w-full bg-white table-fixed">
          <thead>
            <tr className="bg-gray-800 text-white sticky top-0 z-10">
              {tableColumns.map((column, index) => (
                <th
                  key={column.label}
                  className="py-3 px-4 text-left sticky top-0 bg-gray-800 z-10"
                  style={{
                    width: index === tableColumns.length - 1 ? "100px" : "auto",
                    minWidth: "120px",
                  }}
                  onClick={() => column.key && handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.label}
                    {column.key && (
                      <ArrowUpDown
                        className="ml-2 cursor-pointer"
                        size={16}
                        color="white"
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan="11"
                  className="py-4 px-4 text-center text-gray-500"
                >
                  No data found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  {[
                    row.workflow_name,
                    row.project,
                    row.created_by,
                    row.source_conn_name,
                    row.target_conn_name,
                    row.source_table,
                    row.target_table,
                    row.created_at,
                    row.status,
                  ].map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="py-3 px-4 text-gray-600 truncate"
                    >
                      {cellIndex === 8 ? (
                        <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm">
                          {cell}
                        </span>
                      ) : (
                        <div className="truncate max-w-[200px]" title={cell}>
                          {cell}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="py-3 px-4 text-center relative">
                    <button
                      className="p-1 text-gray-600 hover:text-gray-800"
                      onClick={() => toggleActionMenu(index)}
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {activeMenu === index && (
                      <div className="absolute right-4 mt-2 bg-white shadow-lg rounded-lg py-1 px-3 z-10 border">
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
            onChange={handleItemsPerPageChange}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <div className="flex">
            <button
              onClick={handlePrevPage}
              className="p-1 border rounded-l hover:bg-gray-100"
              disabled={page === 1}
            >
              <ChevronLeft
                size={20}
                className={page === 1 ? "text-gray-300" : "text-gray-600"}
              />
            </button>
            <button
              onClick={handleNextPage}
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
    </div>
  );
};

export default CDCList;
