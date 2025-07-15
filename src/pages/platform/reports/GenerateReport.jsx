import { Icon } from "@iconify-icon/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import ReportDownloader from "./ReportDownloader";
import { useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";

const GenerateReport = () => {
  const hostname = window._env_?.VITE_FAST_API;
  const { token, decodedToken, project } = useAuth();

  const [reportType, setReportType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortController = useRef(new AbortController());
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState({
    modal1: false,
    modal2: false,
  });

  const openModal = (modalName) => {
    setIsModalOpen((prevState) => ({ ...prevState, [modalName]: true }));
  };

  const closeModal = (modalName) => {
    setIsModalOpen((prevState) => ({ ...prevState, [modalName]: false }));
  };

  const handleCancel = () => {
    setReportType("");
    setStartDate("");
    setEndDate("");
  };

  const handleGenerateReport = async () => {
    if (!reportType || !startDate || !endDate) {
      toast.error("Please fill all required fields");
      setError("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = { reportType, startDate, endDate };
      const response = await fetch(
        "https://jsonplaceholder.typicode.com/posts",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: abortController.current.signal,
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      closeModal("modal1");
      openModal("modal2");
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error:", error);
        setError(error.message || "Failed to generate report");
        toast.error("Failed to generate report");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = useCallback(async () => {
    try {
      const reportsResponse = await fetch(`${hostname}/reports`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-project": project,
        },
      });

      let reportsData = await reportsResponse.json();
      setReports(reportsData);
      //setAllReports(reportsData);
      //openModal("modal2");
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  }, []);

  const filteredReportsAccToUserAndCurrData = reports.filter(
    (report) =>
      report?.updated_at.split("T")[0] ===
        new Date().toISOString().split("T")[0] &&
      report?.created_by === decodedToken.preferred_username
  );

  const sortFilteredReportAccToStartTime =
    filteredReportsAccToUserAndCurrData.sort(
      (a, b) => new Date(b.start_time) - new Date(a.start_time)
    );

  //for pop up reports
  function getReportsBetweenRange(startDate, endDate) {
    let results = [];

    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      const createdDate = report.created_at.split("T")[0];

      if (createdDate >= startDate && createdDate <= endDate) {
        results.push(report);
      }
    }

    const sortedReports = results.sort((a, b) => {
      return new Date(b.start_time) - new Date(a.start_time);
    });

    const filterAccToWorkFlowType = sortedReports.filter(
      (workflow) => workflow.workflow_type == reportType
    );

    return filterAccToWorkFlowType;
  }

  const filteredReports = getReportsBetweenRange(startDate, endDate);

  useEffect(() => {
    return () => {
      abortController.current.abort();
      abortController.current = new AbortController();
    };
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const sampleData = [
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
      status: "Completed",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
      status: "Completed",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
      status: "Failed",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
      status: "Completed",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
      status: "Failed",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
      status: "Completed",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
      status: "Completed",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
      status: "Completed",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
      status: "Completed",
    },
    {
      id: "02",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
      status: "Completed",
    },
    {
      id: "02",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
      status: "Completed",
    },
  ];

  const cards = [
    {
      icon: "material-symbols:database-upload-outline",
      bgcolor: "bg-[#d8d3e4] bg-opacity-25",
      iconcolor: "text-purple-700",
      title: "Purge",
      count: "27",
    },
    {
      icon: "material-symbols-light:two-pager-store-outline",
      bgcolor: "bg-[#FFC93F] bg-opacity-25",
      iconcolor: "text-orange-700",
      title: "Migration",
      count: "11",
    },
    {
      icon: "material-symbols:cloud-sync-outline",
      bgcolor: "bg-[#96CF7B] bg-opacity-25",
      iconcolor: "text-green-700",
      title: "CDC",
      count: "07",
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Federation",
      count: "17",
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Transformation",
      count: "06",
    },
  ];

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFilteredReports = filteredReports.slice(startIndex, endIndex);
  const paginatedReports = sortFilteredReportAccToStartTime.slice(
    startIndex,
    endIndex
  );

  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = Number(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setPage(1);
  };

  const handlePrevPage = () => {
    setPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleNextPage = () => {
    setPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  return (
    <div className="p-6">
      <div className="flex gap-2 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Details</h1>
        <div>
          <button
            onClick={() => openModal("modal1")}
            type="button"
            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 focus:outline-none"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Add Project Model */}

      {isModalOpen.modal1 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed right-0 top-0 bottom-0 w-1/3 bg-white rounded-l-2xl flex flex-col">
            {/* Header Section */}
            <div className="p-8 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon
                    className="h-5 w-5 text-[#8e78b7]"
                    icon={"material-symbols:tactic-rounded"}
                    width="24"
                    height="24"
                  />
                  <h2 className="text-xl font-bold text-[#8e78b7]">
                    Generate Report
                  </h2>
                </div>
                <button
                  onClick={() => closeModal("modal1")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border-b border-gray-200 mb-4"></div>

              {/* Report Type */}
              <div className="relative mb-4">
                <label className="block text-sm text-black mb-1.5">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] appearance-none bg-white"
                >
                  <option value="">Select</option>
                  <option value="Migration">Migration</option>
                  <option value="Purge">Purge</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-10 pointer-events-none text-gray-500"
                  size={18}
                />
              </div>

              {/* Date Inputs */}
              <div className="flex gap-4 mb-4">
                <div className="relative w-1/2">
                  <label className="block text-sm text-black mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
                  />
                </div>
                <div className="relative w-1/2">
                  <label className="block text-sm text-black mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
                  />
                </div>
              </div>
            </div>

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto px-8">
              <div className="space-y-6">
                <div className="h-96">{/* Your content here */}</div>
              </div>
            </div>

            {/* Footer Section */}
            <div className="p-8 pt-4">
              <div className="border-t border-gray-200 mb-4"></div>
              {error && (
                <div className="text-red-500 text-sm mb-4">{error}</div>
              )}
              <div className="flex justify-start gap-4">
                <button
                  onClick={() => {
                    closeModal("modal1");
                    handleCancel();
                  }}
                  className="px-6 py-2 border border-gray-400 rounded-lg hover:bg-[#8e78b7] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleGenerateReport();
                  }}
                  disabled={loading}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    loading
                      ? "bg-gray-300 cursor-not-allowed"
                      : "border border-gray-400 hover:bg-[#8e78b7] hover:text-white"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Icon
                        icon="svg-spinners:180-ring"
                        className="h-5 w-5 text-[#8e78b7] animate-spin"
                      />
                      Creating...
                    </div>
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Reports Model */}

      {isModalOpen.modal2 && filteredReports.length !== 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-auto p-5 mx-9">
            {/* <div className="overflow-x-auto"> */}
            <div className="overflow-y-auto h-72">
              <table className="w-full text-sm text-left rtl:text-right text-black">
                <thead className="text-xs text-white-700 uppercase bg-black text-white sticky top-0 z-10">
                  <tr>
                    <th scope="col" className=" px-3 py-1">
                      Workflow Name
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Report For
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Execute Type
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Project
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Users
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Start date
                    </th>
                    <th scope="col" className="px-3 py-2">
                      End date
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Before Source table Count
                    </th>
                    <th scope="col" className="px-3 py-2">
                      After Target table Count
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Table Size Before
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Table Size After
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Remark
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFilteredReports.map((user, index) => (
                    // <tr key={index} className="border-b"></tr>
                    <tr
                      key={index}
                      className="border-b  bg-white border-white-700"
                    >
                      {/* <th
                  scope="row"
                  className="px-3 py-2 font-medium text-black-900 whitespace-nowrap text-black"
                >
                  {user.id}
                </th> */}
                      <td className="px-3 py-2">{user.workflow_name}</td>
                      <td className="px-3 py-2">{user.workflow_type}</td>
                      <td className="px-3 py-2">{user.execute_type}</td>
                      <td className="px-3 py-2">{user.project}</td>
                      <td className="px-3 py-2">{user.created_by}</td>
                      <td className="px-3 py-2">
                        {user.start_time
                          ? user.start_time.split("T")[0]
                          : user.start_time}
                      </td>
                      <td className="px-3 py-2">
                        {user.end_time
                          ? user.end_time.split("T")[0]
                          : user.end_time}
                      </td>
                      <td className="px-3 py-2">
                        {user.before_source_table_count}
                      </td>
                      <td className="px-3 py-2">
                        {user.after_target_table_count}
                      </td>
                      <td className="px-3 py-2">{user.table_size_before}</td>
                      <td className="px-3 py-2">{user.table_size_after}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`pr-3 py-1 rounded-full text-sm ${
                            user.status_choices === "Completed"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {user.status_choices}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {user.remarks
                          ? user.remarks
                          : user.workflow_type === "Purge" &&
                            user.status_choices === "Completed"
                          ? "Purge successful"
                          : user.workflow_type === "Migration" &&
                            user.status_choices === "Completed"
                          ? "Migration successful"
                          : user.status_choices !== "Completed"
                          ? `${user.workflow_type} running`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* </div> */}

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 mt-2">
              <div className="text-sm text-gray-500">
                {startIndex + 1} to {Math.min(endIndex, filteredReports.length)}{" "}
                of {filteredReports.length} results
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
                    disabled={page === totalPages}
                  >
                    <ChevronRight
                      size={20}
                      className={
                        page === totalPages ? "text-gray-300" : "text-gray-600"
                      }
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <div
                onClick={() => {
                  closeModal("modal2");
                  handleCancel();
                }}
                className="px-6 py-2 border border-gray-400 rounded-lg hover:bg-[#8e78b7] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </div>
              <div>
                <ReportDownloader data={filteredReports} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Listing Table */}

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg mt-10">
        <div className="max-h-[calc(100vh-310px)] overflow-y-auto">
          <table className="w-auto text-sm text-left rtl:text-right text-black">
            <thead className="text-xs text-white-700 uppercase bg-black text-white sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 w-48">
                  Workflow Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Report For
                </th>
                <th scope="col" className="px-6 py-3">
                  Execute Type
                </th>
                <th scope="col" className="px-6 py-3">
                  Project
                </th>
                <th scope="col" className="px-6 py-3">
                  Users
                </th>
                <th scope="col" className="px-6 py-3">
                  Start date
                </th>
                <th scope="col" className="px-6 py-3">
                  End date
                </th>
                <th scope="col" className="px-6 py-3">
                  Before Source table Count
                </th>
                <th scope="col" className="px-6 py-3">
                  After Target table Count
                </th>
                <th scope="col" className="px-6 py-3">
                  Table Size Before
                </th>
                <th scope="col" className="px-6 py-3">
                  Table Size After
                </th>
                <th scope="col" className="px-6 py-3">
                  Status
                </th>
                <th scope="col" className="px-6 py-3">
                  Remark
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedReports.map((user, index) => (
                <tr key={index} className="border-b bg-white border-white-700">
                  <td className="px-6 py-4 max-w-48 truncate">
                    {user.workflow_name}
                  </td>
                  <td className="px-6 py-4">{user.workflow_type}</td>
                  <td className="px-6 py-4">{user.execute_type}</td>
                  <td className="px-6 py-4">{user.project}</td>
                  <td className="px-3 py-2">{user.created_by}</td>
                  <td className="px-6 py-4">
                    {user.start_time
                      ? user.start_time.split("T")[0]
                      : user.start_time}
                  </td>
                  <td className="px-6 py-4">
                    {user.end_time
                      ? user.end_time.split("T")[0]
                      : user.end_time}
                  </td>
                  <td className="px-6 py-4">
                    {user.before_source_table_count}
                  </td>
                  <td className="px-6 py-4">{user.after_target_table_count}</td>
                  <td className="px-6 py-4">{user.table_size_before}</td>
                  <td className="px-3 py-2">{user.table_size_after}</td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        user.status_choices === "Completed"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {user.status_choices}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {user.remarks
                      ? user.remarks
                      : user.workflow_type === "Purge" &&
                        user.status_choices === "Completed"
                      ? "Purge successful"
                      : user.workflow_type === "Migration" &&
                        user.status_choices === "Completed"
                      ? "Migration successful"
                      : user.status_choices !== "Completed"
                      ? `${user.workflow_type} running`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 mt-2">
        <div className="text-sm text-gray-500">
          {startIndex + 1} to{" "}
          {Math.min(endIndex, filteredReports.length || reports.length)} of{" "}
          {filteredReports.length || reports.length} results
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
              disabled={page === totalPages}
            >
              <ChevronRight
                size={20}
                className={
                  page === totalPages ? "text-gray-300" : "text-gray-600"
                }
              />
            </button>
          </div>
        </div>
      </div>

      {/* <div className="relative overflow-x-auto shadow-md sm:rounded-lg mt-10">
        <table className="w-full text-sm text-left rtl:text-right text-black">
          <thead className="text-xs text-white-700 uppercase bg-[#282F49] text-white">
            <tr>
              <th scope="col" className="px-6 py-3">
                ID
              </th>
              <th scope="col" className="px-6 py-3">
                Workflow Name
              </th>
              <th scope="col" className="px-6 py-3">
                Report Type
              </th>
              <th scope="col" className="px-6 py-3">
                Execution Type
              </th>
              <th scope="col" className="px-6 py-3">
                Project
              </th>
              <th scope="col" className="px-6 py-3">
                Users
              </th>
              <th scope="col" className="px-6 py-3">
                Start date
              </th>
              <th scope="col" className="px-6 py-3">
                End date
              </th>
              <th scope="col" className="px-6 py-3">
                Source table
              </th>
              <th scope="col" className="px-6 py-3">
                Target table
              </th>
              <th scope="col" className="px-6 py-3">
                Status
              </th>
              <th scope="col" className="px-6 py-3">
                Remark
              </th>
            </tr>
          </thead>
          <tbody>
            {sampleData.map((user, index) => (
              // <tr key={index} className="border-b"></tr>
              <tr key={index} className="border-b border-white-700">
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-black-900 whitespace-nowrap text-black"
                >
                  {user.id}
                </th>
                <td className="px-6 py-4">{user.name}</td>
                <td className="px-6 py-4">{user.description}</td>
                <td className="px-6 py-4">{user.type}</td>
                <td className="px-6 py-4">{user.owner}</td>
                <td className="px-6 py-4">{user.created_by}</td>
                <td className="px-6 py-4">{user.updated_by}</td>
                <td className="px-6 py-4">{user.updated_by}</td>
                <td className="px-6 py-4">{user.updated_by}</td>
                <td className="px-6 py-4">{user.updated_by}</td>
                <td className="p-4 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-sm ${
                      user.status === "Completed"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4">{user.updated_by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div> */}
    </div>
  );
};

export default GenerateReport;
