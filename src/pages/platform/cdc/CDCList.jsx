import React, { useState } from "react";
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
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const CDCList = () => {
    const navigate = useNavigate();
  
  const [data, setData] = useState([
    {
      id: "#01",
      name: "CDC_JOB",
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
      name: "CDC_JOB",
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
      name: "CDC_JOB",
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
      name: "CDC_JOB",
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
      name: "CDC_JOB",
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
      name: "CDC_JOB",
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
      name: "CDC_JOB",
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
      name: "CDC_JOB",
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
      name: "CDC_JOB",
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
      name: "CDC_JOB",
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

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeMenu, setActiveMenu] = useState(null);

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

  const handleRefresh=()=>{
    toast.success("Refreshed successfully!")
  }
  return (
    <div>
          <nav className="flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
          <li className="inline-flex items-center">
            <span
              onClick={() => navigate("/")}
              className="inline-flex items-center text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
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
              className={`ms-1 text-sm font-medium cursor-pointer md:ms-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                }`}
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
              <span
              onClick={() => navigate("/cdclist")}
              className={`ms-1 text-sm font-medium cursor-pointer md:ms-2 text-[#8e78b7] hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Details
              </span>
            </div>
          </li>
        </ol>
      </nav>
      <div className="flex gap-2 mb-6 items-center justify-between">
        <h4 className="text-2xl font-medium">CDC</h4>
        <div>
          <button
            type="button"
            className="text-[#818181] shadow-lg  border hover:bg-[#8e78b7] hover:text-white focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-2.5 me-2 mb-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
            onClick={handleRefresh}
          >
            <RefreshCcw className="h-5 w-5 " />
          </button>
        </div>
      </div>
      <div className="w-full overflow-x-auto shadow rounded-lg">
        <table className="w-full bg-white">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="py-3 px-4 text-left">ID</th>
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

export default CDCList;
