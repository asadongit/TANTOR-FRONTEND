import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ChevronDown, RefreshCcw, CheckCircle } from "lucide-react";
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

  const [autoRefreshInterval, setAutoRefreshInterval] = useState(() => {
    const saved = localStorage.getItem(`autoRefresh_reports_${decodedToken?.preferred_username}`);
    return saved ? parseInt(saved, 10) : 0;
  });

  const [isAutoRefreshMenuOpen, setIsAutoRefreshMenuOpen] = useState(false);
  const autoRefreshMenuRef = useRef(null);

  const handleClearFilters = () => {
    setReportType("");
    setStartDate("");
    setEndDate("");
  };

  const fetchReports = useCallback(async () => {
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
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [hostname, token, project]);

  useEffect(() => {
    if (decodedToken?.preferred_username) {
      const saved = localStorage.getItem(`autoRefresh_reports_${decodedToken?.preferred_username}`);
      if (saved) {
        setAutoRefreshInterval(parseInt(saved, 10));
      }
    }
  }, [decodedToken]);

  useEffect(() => {
    if (autoRefreshInterval === 0) return;

    const interval = setInterval(() => {
      fetchReports();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchReports]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autoRefreshMenuRef.current && !autoRefreshMenuRef.current.contains(event.target)) {
        setIsAutoRefreshMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          <div className="relative flex items-center" ref={autoRefreshMenuRef}>
            <div className="flex rounded-lg border border-gray-300 hover:bg-gray-50 h-10">
              <button
                className="w-10 flex items-center justify-center border-r border-gray-300"
                onClick={fetchReports}
                title="Refresh Data"
                disabled={isRefreshing}
              >
                <RefreshCcw
                  className={`h-5 w-5 text-gray-500 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </button>
              <button
                className="px-2 flex items-center justify-center text-gray-500"
                onClick={() => setIsAutoRefreshMenuOpen(!isAutoRefreshMenuOpen)}
                title="Auto Refresh Settings"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {isAutoRefreshMenuOpen && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1 font-normal">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  Auto Refresh
                </div>
                {[
                  { label: "Off", value: 0 },
                  { label: "5 seconds", value: 5000 },
                  { label: "10 seconds", value: 10000 },
                  { label: "1 minute", value: 60000 },
                  { label: "2 minutes", value: 120000 },
                  { label: "5 minutes", value: 300000 },
                ].map((option) => (
                  <button
                    key={option.value}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${autoRefreshInterval === option.value ? "text-[#8d77ba] font-medium bg-purple-50" : "text-gray-700"
                      }`}
                    onClick={() => {
                      setAutoRefreshInterval(option.value);
                      if (decodedToken?.preferred_username) {
                        localStorage.setItem(`autoRefresh_reports_${decodedToken?.preferred_username}`, option.value.toString());
                      }
                      setIsAutoRefreshMenuOpen(false);
                    }}
                  >
                    {option.label}
                    {autoRefreshInterval === option.value && (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
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
