import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronDown, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";
import ReportDownloader from "./ReportDownloader";
import { useAuth } from "../../../context/AuthContext";
import DataTable from "../../../components/DataTable";

const GenerateReport = () => {
  const hostname = window._env_?.VITE_FAST_API;
  const { token, project, decodedToken } = useAuth();

  const [reportType, setReportType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reports, setReports] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleClearFilters = () => {
    setReportType("");
    setStartDate("");
    setEndDate("");
  };

  const fetchReports = useCallback(async (showToast = false) => {
    try {
      setIsRefreshing(true);
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
      if (showToast) toast.success("Reports refreshed successfully");
    } catch (error) {
      console.error("Error fetching reports:", error);
      if (showToast) toast.error("Failed to refresh reports");
    } finally {
      setIsRefreshing(false);
    }
  }, [hostname, token, project]);

  const displayedReports = useMemo(() => {
    let results = [...reports];

    if (startDate) {
      results = results.filter((report) => {
        const createdDate = report.created_at ? report.created_at.split("T")[0] : (report.start_time ? report.start_time.split("T")[0] : "");
        return createdDate >= startDate;
      });
    }
    if (endDate) {
      results = results.filter((report) => {
        const createdDate = report.created_at ? report.created_at.split("T")[0] : (report.start_time ? report.start_time.split("T")[0] : "");
        return createdDate <= endDate;
      });
    }

    if (reportType) {
      results = results.filter((report) => report.workflow_type === reportType);
    }

    return results.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()).reverse();
  }, [reports, startDate, endDate, reportType]);

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
    fetchReports();
  }, [fetchReports]);

  return (
    <div className="p-6">
      <div className="flex gap-2 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <div className="flex items-center gap-2">
          <button
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50"
            onClick={() => fetchReports(true)}
            title="Refresh Data"
            disabled={isRefreshing}
          >
            <RefreshCcw
              className={`h-5 w-5 text-gray-500 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
          {displayedReports.length > 0 && (
            <div className="h-10 flex items-stretch">
              <ReportDownloader data={displayedReports} />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="block text-sm text-black mb-1.5">
            Report Type
          </label>
          <div className="relative">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-[280px] h-10 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] appearance-none bg-white font-normal"
            >
              <option value="">All</option>
              <option value="Migration">Migration</option>
              <option value="Purge">Purge</option>
            </select>
            <ChevronDown
              className="absolute right-3 top-2.5 pointer-events-none text-gray-500"
              size={18}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-black mb-1.5">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-[280px] h-10 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] bg-white font-normal"
          />
        </div>
        <div>
          <label className="block text-sm text-black mb-1.5">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[280px] h-10 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] bg-white font-normal"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClearFilters}
            className="w-[280px] md:w-auto px-6 h-10 text-sm border border-[#8e78b7] text-[#8e78b7] font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-[#8e78b7]"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="mt-10">
        <DataTable
          columns={columns}
          data={displayedReports}
        />
      </div>
    </div>
  );
};

export default GenerateReport;
