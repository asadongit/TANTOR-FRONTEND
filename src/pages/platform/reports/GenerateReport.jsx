import { Icon } from "@iconify-icon/react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import ReportDownloader from "./ReportDownloader";
import { useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";
import DataTable from "../../../components/DataTable";

const GenerateReport = () => {
  const hostname = window._env_?.VITE_FAST_API;
  const { token, decodedToken, project } = useAuth();

  const [reportType, setReportType] = useState("");
  const [reportName, setReportName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortController = useRef(new AbortController());
  const [reports, setReports] = useState([]);

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
    setReportName("");
    setReportType("");
    setStartDate("");
    setEndDate("");
  };

  const handleGenerateReport = async () => {
    if (!reportName || !reportType || !startDate || !endDate) {
      toast.error("Please fill all required fields");
      setError("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        workflow_name: reportName,
        workflow_type: reportType,
        condition: "N/A",
        execute_type: "Manual",
        status_choices: "Completed",
        before_source_table_count: 0,
        after_target_table_count: 0,
        project: project || "default",
        created_by: decodedToken?.preferred_username || "user",
        start_time: startDate ? new Date(startDate).toISOString() : null,
        end_time: endDate ? new Date(endDate).toISOString() : null,
      };
      const response = await fetch(
        `${hostname}/reports`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-project": project,
          },
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

  const sortFilteredReportAccToStartTime = [...reports].sort(
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

  const columns = useMemo(() => [
    { key: "workflow_name", label: "Name", minWidth: "120px" },
    { key: "workflow_type", label: "Report\u00a0For", minWidth: "110px" },
    { key: "execute_type", label: "Type", minWidth: "90px" },
    { key: "project", label: "Project", minWidth: "100px" },
    { key: "created_by", label: "Users", minWidth: "100px" },
    {
      key: "start_time",
      label: "Start\u00a0Date",
      minWidth: "100px",
      render: (row) => row.start_time ? row.start_time.split("T")[0] : row.start_time
    },
    {
      key: "end_time",
      label: "End\u00a0Date",
      minWidth: "100px",
      render: (row) => row.end_time ? row.end_time.split("T")[0] : row.end_time
    },
    { key: "before_source_table_count", label: "Before\u00a0Source\u00a0Table\u00a0Count", minWidth: "160px" },
    { key: "after_target_table_count", label: "After\u00a0Target\u00a0Table\u00a0Count", minWidth: "150px" },
    { key: "table_size_before", label: "Table\u00a0Size\u00a0Before", minWidth: "110px" },
    { key: "table_size_after", label: "Table\u00a0Size\u00a0After", minWidth: "100px" },
    {
      key: "status_choices",
      label: "Status",
      minWidth: "100px",
      render: (row) => (
        <div className="text-center">
          <span
            className={`px-3 py-1 rounded-full text-xs ${row.status_choices === "Completed"
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-600"
              }`}
          >
            {row.status_choices}
          </span>
        </div>
      )
    },
    {
      key: "remarks",
      label: "Remark",
      minWidth: "130px",
      render: (row) => row.remarks
        ? row.remarks
        : row.workflow_type === "Purge" && row.status_choices === "Completed"
          ? "Purge successful"
          : row.workflow_type === "Migration" && row.status_choices === "Completed"
            ? "Migration successful"
            : row.status_choices !== "Completed"
              ? `${row.workflow_type} running`
              : "-"
    },
  ], []);

  useEffect(() => {
    return () => {
      abortController.current.abort();
      abortController.current = new AbortController();
    };
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <div className="p-6">
      <div className="flex gap-2 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Reports</h1>
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

              {/* Report Name */}
              <div className="mb-4">
                <label className="block text-sm text-black mb-1.5">
                  Report Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Enter report name"
                  className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
                />
              </div>

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
                  className={`px-6 py-2 rounded-lg transition-colors ${loading
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[95vw] max-h-[90vh] flex flex-col p-5">
            <h2 className="text-xl font-bold mb-4">Generated Reports</h2>
            <div className="flex-1 overflow-auto">
              <DataTable
                columns={columns}
                data={filteredReports}
              />
            </div>
            <div className="flex justify-end gap-4 mt-6">
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

      <div className="mt-10">
        <DataTable
          columns={columns}
          data={sortFilteredReportAccToStartTime}
        />
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
