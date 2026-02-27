import React, { useState, useEffect, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import {
  RefreshCcw,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Loader,
  Expand,
  ChevronDown,
} from "lucide-react";
import { Icon } from "@iconify-icon/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Breadcrumb from "../../../components/Breadcrumb";
import { useAuth } from "../../../context/AuthContext";
import DataTable from "../../../components/DataTable";
import CardGrid from "../../../components/CardGrid";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from "recharts";
import { ExternalLink } from "lucide-react";

const rotateAnimation = `
  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .icon-rotate {
    animation: rotate 1s linear infinite;
  }
`;

function Transformation() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [viewMode, setViewMode] = useState("both");
  const [transformationData, setTransformationData] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, type: null, onConfirm: null });
  const [dashboardData, setDashboardData] = useState({
    cards: { total: 0, success: 0, failed: 0, average_duration: 0 },
    last5transformations: [],
    movementgraph: [],
  });
  const [countModal, setCountModal] = useState({
    isOpen: false,
    type: null,
    data: null,
    title: null,
  });
  const [dagErrorModal, setDagErrorModal] = useState({
    isOpen: false,
    isLoading: false,
    data: null,
    dagId: null,
  });

  const [autoRefreshInterval, setAutoRefreshInterval] = useState(0); // 0 = off
  const [isAutoRefreshMenuOpen, setIsAutoRefreshMenuOpen] = useState(false);
  const autoRefreshMenuRef = useRef(null);

  const { project, decodedToken, token } = useAuth();
  
  const hostname = window._env_?.VITE_FAST_API;

  const [resetSortTrigger, setResetSortTrigger] = useState(0);
  const handleClearSort = () => {
    setResetSortTrigger(prev => prev + 1);
  };

  const metricsData = [
    {
      icon: "material-symbols:dataset-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-30",
      iconcolor: "text-[#8d77ba]",
      title: "Total",
      count: dashboardData.cards.total,
    },
    {
      icon: "material-symbols:check-circle-outline",
      bgcolor: "bg-[#55aa55] bg-opacity-20",
      iconcolor: "text-[#55aa55]",
      title: "Success",
      count: dashboardData.cards.success,
    },
    {
      icon: "material-symbols:error-outline",
      bgcolor: "bg-[#ff5555] bg-opacity-20",
      iconcolor: "text-[#ff5555]",
      title: "Failed",
      count: dashboardData.cards.failed,
    },
    {
      icon: "material-symbols:schedule-outline",
      bgcolor: "bg-[#fbbf24] bg-opacity-20",
      iconcolor: "text-[#fbbf24]",
      title: "Average Duration",
      count: dashboardData.cards.average_duration,
    },
  ];

  useEffect(() => {
    fetchTransformationData();
    fetchDashboardData();
  }, [project, decodedToken]);

  useEffect(() => {
    if (autoRefreshInterval === 0) return;

    const interval = setInterval(() => {
      fetchTransformationData(false);
      fetchDashboardData();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, project, decodedToken]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autoRefreshMenuRef.current && !autoRefreshMenuRef.current.contains(event.target)) {
        setIsAutoRefreshMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchTransformationData = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const response = await axios.get(
        `${hostname}/etl/transformation/tableview?project=${project}&created_by=${decodedToken.preferred_username}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const sortedData = response.data.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setTransformationData(sortedData);
    } catch (error) {
      console.error("Error fetching transformation data:", error);
      if (showLoader) {
        toast.error("Failed to fetch transformation data");
      }
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(
        `${hostname}/etl/dashboarddata?project=${project}&created_by=${decodedToken.preferred_username}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to fetch dashboard data");
    }
  };

  const fetchDagFailure = async (dagId) => {
    setDagErrorModal({ isOpen: true, isLoading: true, data: null, dagId });
    try {
      const response = await axios.get(
        `${hostname}/dag-failure?dag_id=${dagId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDagErrorModal({ isOpen: true, isLoading: false, data: response.data, dagId });
    } catch (error) {
      console.error("Error fetching DAG failure info:", error);
      setDagErrorModal({
        isOpen: true,
        isLoading: false,
        data: { status: "ERROR", error_message: "Failed to retrieve DAG failure details." },
        dagId,
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRefresh = async () => {
    setSearchTerm("");
    handleClearSort();
    setIsLoading(true);

    try {
      await fetchTransformationData();
      await fetchDashboardData();
      toast.success("Transformation data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh transformation data");
    } finally {
      setIsLoading(false);
    }
  };

  const MovementChart = () => {
    const [currentPage, setCurrentPage] = useState(0);

    const chartData = (dashboardData.movementgraph || [])
      .slice()
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (!chartData.length) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Icon
              icon="material-symbols:trending-up"
              className="w-5 h-5 text-[#8d77ba]"
            />
            <h3 className="text-lg font-semibold text-gray-800">Movement</h3>
          </div>
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">No movement data available</p>
          </div>
        </div>
      );
    }

    const daysPerPage = 5;
    const totalPages = Math.ceil(chartData.length / daysPerPage);

    const paginatedData = chartData
      .slice()
      .reverse()
      .slice(currentPage * daysPerPage, (currentPage + 1) * daysPerPage)
      .reverse();

    const formattedData = paginatedData.map((item) => ({
      ...item,
      shortDate: new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));

    const getDateRange = () => {
      if (paginatedData.length === 0) return "No data";

      const firstDate = new Date(paginatedData[0].date).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
        }
      );
      const lastDate = new Date(
        paginatedData[paginatedData.length - 1].date
      ).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      return `${firstDate} - ${lastDate}`;
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon
              icon="material-symbols:trending-up"
              className="w-5 h-5 text-[#8d77ba]"
            />
            <h3 className="text-lg font-semibold text-gray-800">Movement</h3>
            <span className="text-sm text-gray-500 ml-2">
              ({getDateRange()})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))
              }
              disabled={currentPage >= totalPages - 1}
              className={`p-1 rounded-md ${currentPage >= totalPages - 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100"
                }`}
              title="View older data"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs text-gray-500 min-w-[40px] text-center">
              {totalPages > 0
                ? `${totalPages - currentPage}/${totalPages}`
                : "0/0"}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
              disabled={currentPage <= 0}
              className={`p-1 rounded-md ${currentPage <= 0
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100"
                }`}
              title="View newer data"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              margin={{ top: 5, right: 20, left: 10, bottom: 25 }}
            >
              {/* <CartesianGrid strokeDasharray="3 3" /> */}
              <XAxis
                dataKey="shortDate"
                tickMargin={10}
                padding={{ left: 10, right: 10 }}
              >
                <Label value="Date" offset={-20} position="insideBottom" />
              </XAxis>
              <YAxis tickMargin={10} domain={["auto", "auto"]}>
                <Label
                  value="No of transformations"
                  angle={-90}
                  position="insideLeft"
                  offset={-5}
                  style={{ textAnchor: "middle" }}
                />
              </YAxis>
              <Tooltip
                contentStyle={{ backgroundColor: "white", borderRadius: "4px" }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                align="right"
                iconType="circle"
                wrapperStyle={{
                  paddingTop: 5,
                  paddingBottom: 20,
                  lineHeight: "24px",
                }}
                formatter={(value) => (
                  <span
                    style={{
                      color: "rgba(0, 0, 0, 0.87)",
                      fontSize: "13px",
                      marginTop: "5px",
                    }}
                  >
                    {value}
                  </span>
                )}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#8d77ba"
                name="Total"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="success"
                stroke="#55aa55"
                name="Success"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="failed"
                stroke="#ff5555"
                name="Failed"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const LastTransformations = () => {
    const lastTransformations = dashboardData.last5transformations || [];

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full">
        <div className="flex items-center gap-2 mb-4">
          <Icon
            icon="material-symbols:history"
            className="w-5 h-5 text-[#8d77ba]"
          />
          <h3 className="text-lg font-semibold text-gray-800">
            Last 5 Transformations
          </h3>
        </div>

        <div className="space-y-2">
          {lastTransformations.length > 0 ? (
            lastTransformations.map((name, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-100"
              >
                <span className="text-gray-700 text-sm">{name}</span>
              </div>
            ))
          ) : (
            <div className="py-2 text-center text-gray-500">
              No transformation history available
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleTriggerETL = async (workflowName) => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${hostname}/etl/manualtrigger/${workflowName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        toast.success("ETL Job in progress");

        // Immediately fetch fresh data when triggered
        fetchTransformationData(false);
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error triggering ETL job:", error);
      toast.error("Failed to trigger ETL job");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransformation = (row) => {
  setDeleteModal({
    open: true,
    type: "transformation",
    onConfirm: async () => {
      try {
        const success = await confirmDeleteTransformation(row.transformation_id);
        if (success) toast.success("Transformation deleted successfully");
      } catch {
        toast.error("Failed to delete transformation");
      }
    },
  });
};

  const confirmDeleteTransformation = async (transformationId) => {
    try {
      const response = await axios.delete(
        `${hostname}/etl/transformation/delete?transformation_id=${transformationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        fetchTransformationData();
        fetchDashboardData();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting transformation:", error);
      toast.error("Failed to delete transformation");
      throw error;
    }
  };

  const calculateTotalCount = (countObj) => {
    if (!countObj || Object.keys(countObj).length === 0) {
      return "-";
    }
    return Object.values(countObj).reduce(
      (sum, count) => sum + (count || 0),
      0
    );
  };

  const columns = [
    {
      key: "transformation_name",
      label: "Name",
      sortable: true,
      width: "250px",
      // render: (row) => (
      //   <div className="break-words max-w-[250px]">{row.transformation_name}</div>
      // ),
    },
    { key: "description", width: "250px", label: "Description", sortable: false },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      render: (row) => formatDate(row.created_at),
    },
    // {
    //   key: "updated_at",
    //   label: "Updated",
    //   sortable: true,
    //   render: (row) => formatDate(row.updated_at),
    // },
    // { key: "created_by", label: "Owner", sortable: true },

    {
      key: "source_count",
      label: "Source Records",
      sortable: true,
      render: (row) => (
        <button
          onClick={() => {
            if (row.source_count && Object.keys(row.source_count).length > 0) {
              setCountModal({
                isOpen: true,
                type: "source",
                data: row.source_count,
                title: "Source Records Details",
              });
            }
          }}
          className={`${row.source_count && Object.keys(row.source_count).length > 0
            ? "text-blue-600 hover:underline cursor-pointer"
            : "text-gray-900 cursor-default"
            }`}
        >
          {calculateTotalCount(row.source_count)}
        </button>
      ),
    },
    {
      key: "target_count",
      label: "Target Records",
      sortable: true,
      render: (row) => (
        <button
          onClick={() => {
            if (row.target_count && Object.keys(row.target_count).length > 0) {
              setCountModal({
                isOpen: true,
                type: "target",
                data: row.target_count,
                title: "Target Records Details",
              });
            }
          }}
          className={`${row.target_count && Object.keys(row.target_count).length > 0
            ? "text-blue-600 hover:underline cursor-pointer"
            : "text-gray-900 cursor-default"
            }`}
        >
          {calculateTotalCount(row.target_count)}
        </button>
      ),
    },
    { key: "duration", label: "Duration", sortable: true },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => {
        let className = "px-2 py-1 rounded-full font-medium";
        if (row.status === "Failed") {
          className += " bg-red-100 text-red-600";
          return (
            <button
              onClick={() => fetchDagFailure(row.transformation_name)}
              className={`flex items-center gap-1 ${className} hover:bg-red-200`}
              title="View failure details"
            >
              <span>Failed</span>
              <ExternalLink className="ml-1 w-3 h-3" />
            </button>
          );
        } else if (row.status === "Success" || row.status === "success") {
          className += " bg-green-100 text-green-600";
        } else {
          className += " bg-gray-100 text-gray-600";
        }
        return <span className={className}>{row.status}</span>;
      },
    },
    { label: "Action", sortable: false },
  ];

  const actions = [
    {
      label: "Run",
      icon: <Icon icon="material-symbols:play-arrow" className="w-5 h-5" />,
      onClick: (row) => handleTriggerETL(row.transformation_name),
      show: (row) => {
        const s = String(row.status || "").toLowerCase();
        return s !== "creating" && s !== "running" && s !== "created";
      },
    },
    {
      label: "Edit",
      icon: <Icon icon="material-symbols:edit-outline" className="w-5 h-5" />,
      onClick: (row) => handleEditTransformation(row),
    },
    // {
    //   label: "Info",
    //   icon: <Icon icon="material-symbols:info-outline" className="w-5 h-5" />,
    //   onClick: (row) => console.log("Info:", row),
    // },
    {
      label: "Delete",
      icon: <Icon icon="material-symbols:delete-outline" className="w-5 h-5" />,
      onClick: (row) => handleDeleteTransformation(row),
    },
  ];

  const handleEditTransformation = async (transformation) => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${hostname}/etl/transformation/${transformation.transformation_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        const transformationData = response.data;

        if (transformationData.extra_info?.edit_flow) {
          sessionStorage.setItem(
            "editFlowData",
            JSON.stringify(transformationData.extra_info.edit_flow)
          );
          sessionStorage.setItem(
            "editTransformationId",
            transformation.transformation_id.toString()
          );
          sessionStorage.setItem("editMode", "true");
        }

        navigate("/transformation/studio");
      }
    } catch (error) {
      console.error("Error fetching transformation for edit:", error);
      setToast({
        show: true,
        message: "Failed to load transformation for editing",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setToast({ show: false, message: "", type: "" });
      }, 3000);
    }
  };

  const DagErrorModal = ({ isOpen, onClose, isLoading, data }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl w-[900px] max-h-[80vh] flex flex-col p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon icon="material-symbols:error-outline" className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-800">DAG Failure Details</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-600">Fetching failure details...</p>
              </div>
            ) : data ? (
              <div className="space-y-3">
                {data.status && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-500 w-28">Status:</span>
                    <span className={`text-sm font-medium px-2 py-0.5 rounded ${data.status === "FAILED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                      }`}>{data.status}</span>
                  </div>
                )}

                {(data.error || data.error_message) && (
                  <div className="mt-3">
                    <span className="text-sm font-semibold text-gray-500">Error Log:</span>
                    <pre className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-800 whitespace-pre-wrap break-all max-h-[350px] overflow-y-auto">
                      {data.error || data.error_message}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No failure data available.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const CountDetailsModal = ({ isOpen, onClose, type, data, title }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl w-[500px] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Name</th>
                  <th className="text-right py-2 px-4">Count</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data || {}).map(([key, value]) => (
                  <tr key={key} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 text-gray-700">{key}</td>
                    <td className="py-2 px-4 text-right text-gray-900">
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const filteredTransformationData = useMemo(() => {
    if (!searchTerm.trim()) return transformationData;
    const q = searchTerm.toLowerCase();
    return transformationData.filter((row) =>
      Object.values(row || {}).some((val) =>
        String(val ?? "")
          .toLowerCase()
          .includes(q)
      )
    );
  }, [searchTerm, transformationData]);

  return (
    <div className="p-6">
      <style>{rotateAnimation}</style>

      <Breadcrumb title="Platform" link={"/"} />

      <div className="flex gap-4 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Transformation</h1>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search transformations"
              className="pl-10 pr-4 py-2 w-[300px] border border-gray-300 rounded-lg focus:outline-none"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          <div className="relative flex items-center" ref={autoRefreshMenuRef}>
            <div className="flex rounded-lg border border-gray-400 hover:bg-gray-50 h-10">
              <button
                className="w-10 flex items-center justify-center border-r border-gray-300"
                onClick={handleRefresh}
                title="Refresh data"
                disabled={isLoading}
              >
                <RefreshCcw
                  className={`h-5 w-5 text-gray-600 ${isLoading ? "icon-rotate" : ""}`}
                />
              </button>
              <button
                className="px-2 flex items-center justify-center"
                onClick={() => setIsAutoRefreshMenuOpen(!isAutoRefreshMenuOpen)}
                title="Auto Refresh Settings"
              >
                <ChevronDown className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {isAutoRefreshMenuOpen && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
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

          <button
            className={`w-10 h-10 flex items-center justify-center rounded-lg border ${viewMode === "list"
              ? "bg-gray-100 border-gray-500"
              : "border-gray-400"
              } hover:bg-gray-50`}
            onClick={() => setViewMode(viewMode === "list" ? "both" : "list")}
            title={viewMode === "list" ? "Show All Views" : "Show List Only"}
          >
            <Icon
              icon="material-symbols-light:format-list-bulleted"
              width="24"
              height="24"
              className="text-[#8d77ba]"
            />
          </button>

          {/* <button
            className="p-1 px-1.5 rounded-lg border border-gray-400 hover:bg-gray-50"
            title="Download"
          >
            <Icon
              icon="material-symbols:download"
              width="24"
              height="24"
              className="text-[#8d77ba]"
            />
          </button> */}

          <button
            onClick={() => navigate("/transformation/studio")}
            className="px-4 py-2 rounded-lg bg-[#8d77ba] text-white flex items-center gap-2 hover:bg-opacity-90"
          >
            <Icon
              icon="material-symbols:add"
              width="20"
              height="20"
              className="text-white"
            />
            <span>Create</span>
          </button>
        </div>
      </div>

      {viewMode !== "list" && (
        <>
          <CardGrid
            cards={metricsData}
            isLoading={isLoading}
            showDetails={false}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2">
              <MovementChart />
            </div>
            <div className="lg:col-span-1">
              <LastTransformations />
            </div>
          </div>
        </>
      )}

      <DataTable
        columns={columns}
        data={filteredTransformationData}
        actions={actions}
        isLoading={isLoading}
        isError={false}
        refetch={fetchTransformationData}
        title="Transformations"
        resetSortTrigger={resetSortTrigger}
      />

      {deleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[400px] p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[#8e78b7] mb-4">Confirm Deletion</h2>
            <p className="mb-6 text-gray-700">
              Are you sure you want to delete this {deleteModal.type}?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteModal({ open: false, type: null, onConfirm: null })}
                className="px-6 py-2 border border-gray-400 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteModal.onConfirm();
                  setDeleteModal({ open: false, type: null, onConfirm: null });
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <CountDetailsModal
        isOpen={countModal.isOpen}
        onClose={() =>
          setCountModal({ isOpen: false, type: null, data: null, title: null })
        }
        type={countModal.type}
        data={countModal.data}
        title={countModal.title}
      />

      <DagErrorModal
        isOpen={dagErrorModal.isOpen}
        onClose={() => setDagErrorModal({ isOpen: false, isLoading: false, data: null, dagId: null })}
        isLoading={dagErrorModal.isLoading}
        data={dagErrorModal.data}
      />
    </div>
  );
}

export default Transformation;
