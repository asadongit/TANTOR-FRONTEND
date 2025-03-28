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
const PurgeList = () => {
  const hostname = import.meta.env.VITE_FAST_API;
  const token = import.meta.env.VITE_ACCESS_TOKEN;
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState(null);

  const handleClickOutside = () => {
    setActiveMenu(null);
  };

  const handleCreatePurge = () => {
    navigate("/PurgeCanvas");
  };

  const [data, setData] = useState([
    {
      id: "#01",
      name: "Purge_job",
      projectName: "DEFAULT",
      createdBy: "sorv",
      sourceConn: "Orc_schema",
      tableConn: "Cust_admin",
      sourceTable: "Cust_admin",
      targetTable: "Source",
      startDate: "2024-11-20 06:44:36.311",
      status: "Completed",
    },
    {
      id: "#01",
      name: "Purge_job",
      projectName: "DEFAULT",
      createdBy: "sorv",
      sourceConn: "Orc_schema",
      tableConn: "Cust_admin",
      sourceTable: "Cust_admin",
      targetTable: "Source",
      startDate: "2024-11-20 06:44:36.311",
      status: "Completed",
    },
    {
      id: "#01",
      name: "Purge_job",
      projectName: "DEFAULT",
      createdBy: "sorv",
      sourceConn: "Orc_schema",
      tableConn: "Cust_admin",
      sourceTable: "Cust_admin",
      targetTable: "Source",
      startDate: "2024-11-20 06:44:36.311",
      status: "Completed",
    },
    {
      id: "#01",
      name: "Purge_job",
      projectName: "DEFAULT",
      createdBy: "sorv",
      sourceConn: "Orc_schema",
      tableConn: "Cust_admin",
      sourceTable: "Cust_admin",
      targetTable: "Source",
      startDate: "2024-11-20 06:44:36.311",
      status: "Completed",
    },
    {
      id: "#01",
      name: "Purge_job",
      projectName: "DEFAULT",
      createdBy: "sorv",
      sourceConn: "Orc_schema",
      tableConn: "Cust_admin",
      sourceTable: "Cust_admin",
      targetTable: "Source",
      startDate: "2024-11-20 06:44:36.311",
      status: "Completed",
    },
    {
      id: "#01",
      name: "Purge_job",
      projectName: "DEFAULT",
      createdBy: "sorv",
      sourceConn: "Orc_schema",
      tableConn: "Cust_admin",
      sourceTable: "Cust_admin",
      targetTable: "Source",
      startDate: "2024-11-20 06:44:36.311",
      status: "Completed",
    },
    {
      id: "#01",
      name: "Purge_job",
      projectName: "DEFAULT",
      createdBy: "sorv",
      sourceConn: "Orc_schema",
      tableConn: "Cust_admin",
      sourceTable: "Cust_admin",
      targetTable: "Source",
      startDate: "2024-11-20 06:44:36.311",
      status: "Completed",
    },
    {
      id: "#01",
      name: "Purge_job",
      projectName: "DEFAULT",
      createdBy: "sorv",
      sourceConn: "Orc_schema",
      tableConn: "Cust_admin",
      sourceTable: "Cust_admin",
      targetTable: "Source",
      startDate: "2024-11-20 06:44:36.311",
      status: "Completed",
    },
    {
      id: "#01",
      name: "Purge_job",
      projectName: "DEFAULT",
      createdBy: "sorv",
      sourceConn: "Orc_schema",
      tableConn: "Cust_admin",
      sourceTable: "Cust_admin",
      targetTable: "Source",
      startDate: "2024-11-20 06:44:36.311",
      status: "Completed",
    },
    {
      id: "#01",
      name: "Purge_job",
      projectName: "DEFAULT",
      createdBy: "sorv",
      sourceConn: "Orc_schema",
      tableConn: "Cust_admin",
      sourceTable: "Cust_admin",
      targetTable: "Source",
      startDate: "2024-11-20 06:44:36.311",
      status: "Completed",
    },
  ]);

  const cards = [
    {
      icon: "material-symbols:database-upload-outline",
      bgcolor: "bg-[#d8d3e4] bg-opacity-25",
      iconcolor: "text-purple-700",
      title: "Oracle",
      count: "27",
    },
    {
      icon: "material-symbols-light:two-pager-store-outline",
      bgcolor: "bg-[#FFC93F] bg-opacity-25",
      iconcolor: "text-orange-700",
      title: "DB2",
      count: "11",
    },
    {
      icon: "material-symbols:cloud-sync-outline",
      bgcolor: "bg-[#96CF7B] bg-opacity-25",
      iconcolor: "text-green-700",
      title: "MS SQL",
      count: "07",
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "MySQL",
      count: "17",
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Postgres",
      count: "06",
    },
  ];

  const fetchPurge = useCallback(async () => {
    try {
      const response = await fetch(`${hostname}/Purges`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch connections: ${response.status}`);
      }

      const CDCData = await response.json();
      setData(CDCData);
      setFilteredData(CDCData);
    } catch (error) {
      console.error("Error fetching connections:", error);
    }
  }, []);

  useEffect(() => {
    fetchPurge();
  }, [fetchPurge]);

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
    setPage(page + 1);
  };
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 transition-transform transform hover:scale-105 hover:shadow-md"
          >
            <div className="flex items-center mb-2">
              <div
                className={`flex items-center justify-center aspect-square w-8 md:w-10 ${card.bgcolor} rounded-full ${card.iconcolor} mr-2`}
              >
                <Icon icon={card.icon} />
              </div>
              <h3 className="text-lg font-semibold">{card.title}</h3>
            </div>
            <p className="text-black text-5xl font-bold">{card.count}</p>

            <button
              className="mt-4 text-purple-600 text-sm font-normal relative transition-all duration-300 group hover:scale-105 hover:font-medium"
              onClick={() => {
                const url = `/componentType=purge&dataScope=${card.title.replace(/\s+/g, '').toLowerCase()}&heading=${card.title}`;
                const encryptedUrl = encodeURIComponent(encrypt(url));
                navigate(`/details?${encryptedUrl}`);
              }}              >
              See details
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-purple-600 transition-all duration-300 group-hover:w-full"></span>
            </button>
          </div>
        ))}
      </div>

      <div className="w-full overflow-x-auto shadow rounded-lg mt-4">
        <table className="w-full bg-white " style={{ maxHeight: "70vh" }}>
          <thead>
            <tr className="bg-gray-800 text-white">
            <th className="py-3 px-4 text-left">id</th>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">DEFAULT</th>
              <th className="py-3 px-4 text-left">Created by</th>
              <th className="py-3 px-4 text-left">Source connection</th>
              <th className="py-3 px-4 text-left">Table connection</th>
              <th className="py-3 px-4 text-left">Source table</th>
              <th className="py-3 px-4 text-left">Target table</th>
              <th className="py-3 px-4 text-left">Start date</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b hover:bg-gray-50 relative">
                <td className="py-3 px-4 text-gray-500">{row.id}</td>
                <td className="py-3 px-4 text-gray-600">{row.name}</td>
                <td className="py-3 px-4 text-gray-600">{row.projectName}</td>
                <td className="py-3 px-4 text-gray-600">{row.createdBy}</td>
                <td className="py-3 px-4 text-gray-600">{row.sourceConn}</td>
                <td className="py-3 px-4 text-gray-600">{row.tableConn}</td>
                <td className="py-3 px-4 text-gray-600">{row.sourceTable}</td>
                <td className="py-3 px-4 text-gray-600">{row.targetTable}</td>
                <td className="py-3 px-4 text-gray-600">{row.startDate}</td>
                <td className="py-3 px-4">
                  <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm">
                    {row.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-center relative">
                  <button
                    className="p-1 text-gray-600 hover:text-gray-800"
                    onClick={() => toggleActionMenu(index)}
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {activeMenu === index && (
                    <div className="absolute right-4 mt-2 bg-white shadow-lg rounded-lg py-1 px-3 z-10 border">
                      {/* <div className="flex justify-between items-center mb-1">
               <span className="text-xs font-medium text-gray-500">Actions</span>
               <button 
                 className="text-gray-400 hover:text-gray-600" 
                 onClick={() => toggleActionMenu(null)}
               >
                 <X size={14} />
               </button>
             </div> */}
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
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-4 mt-2">
        <div className="text-sm text-gray-500">1 to 1 of results</div>
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
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurgeList;
