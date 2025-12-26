import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  RefreshCcw,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Loader,
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
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [viewMode, setViewMode] = useState("both");
  const [transformationData, setTransformationData] = useState([]);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    transformation: null,
  });
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
  const { project, decodedToken, token } = useAuth();

  const hostname = window._env_?.VITE_FAST_API;

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
      title: "Successful",
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

  const fetchTransformationData = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching transformation data:", error);
      setToast({
        show: true,
        message: "Failed to fetch transformation data",
        type: "error",
      });
      setIsLoading(false);
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
      setToast({
        show: true,
        message: "Failed to fetch dashboard data",
        type: "error",
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
    setIsLoading(true);

    try {
      await fetchTransformationData();
      await fetchDashboardData();
      setToast({
        show: true,
        message: "Transformation data refreshed successfully",
        type: "success",
      });
    } catch (error) {
      setToast({
        show: true,
        message: "Failed to refresh transformation data",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setToast({ show: false, message: "", type: "" });
      }, 3000);
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
              className={`p-1 rounded-md ${
                currentPage >= totalPages - 1
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
              className={`p-1 rounded-md ${
                currentPage <= 0
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
                stroke="#ff5555"
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
                stroke="#5555aa"
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
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
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
        setToast({
          show: true,
          message: "ETL Job in progress",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Error triggering ETL job:", error);
      setToast({
        show: true,
        message: "Failed to trigger ETL job",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setToast({ show: false, message: "", type: "" });
      }, 3000);
    }
  };

  const handleDeleteTransformation = (transformation) => {
    setDeleteModal({ isOpen: true, transformation });
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
      setToast({
        show: true,
        message: "Failed to delete transformation",
        type: "error",
      });
      setTimeout(() => {
        setToast({ show: false, message: "", type: "" });
      }, 3000);
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
    { key: "transformation_name", label: "Name", sortable: true },
    { key: "description", label: "Description", sortable: true },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      render: (row) => formatDate(row.created_at),
    },
    {
      key: "updated_at",
      label: "Updated",
      sortable: true,
      render: (row) => formatDate(row.updated_at),
    },
    { key: "created_by", label: "Owner", sortable: true },
    { key: "status", label: "Status", sortable: true },
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
          className={`${
            row.source_count && Object.keys(row.source_count).length > 0
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
          className={`${
            row.target_count && Object.keys(row.target_count).length > 0
              ? "text-blue-600 hover:underline cursor-pointer"
              : "text-gray-900 cursor-default"
          }`}
        >
          {calculateTotalCount(row.target_count)}
        </button>
      ),
    },
    { key: "duration", label: "Duration", sortable: true },
    { label: "Action", sortable: false },
  ];

  const actions = [
    {
      label: "Run",
      icon: <Icon icon="material-symbols:play-arrow" className="w-5 h-5" />,
      onClick: (row) => handleTriggerETL(row.transformation_name),
      show: (row) => row.status !== "creating" && row.status !== "Running",
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

  const DeleteTransformation = ({
    isOpen,
    onClose,
    transformationData,
    onConfirmDelete,
  }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleted, setIsDeleted] = useState(false);

    useEffect(() => {
      if (isOpen) {
        setIsDeleted(false);
        setIsLoading(false);
      }
    }, [isOpen, transformationData]);

    if (!isOpen || !transformationData) return null;

    const handleClose = () => {
      setIsDeleted(false);
      setIsLoading(false);
      onClose();
    };

    const handleConfirm = async () => {
      setIsLoading(true);

      try {
        const success = await onConfirmDelete(
          transformationData.transformation_id
        );
        if (success) {
          setToast({
            show: true,
            message: "Transformation deleted successfully",
            type: "success",
          });
          setTimeout(() => {
            setToast({ show: false, message: "", type: "" });
          }, 3000);
          onClose();
        }
      } catch (error) {
        console.error("Error deleting transformation:", error);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl w-[500px] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {isDeleted ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              <h2 className="text-xl font-bold text-red-500">
                {isDeleted ? "Transformation Deleted" : "Delete Confirmation"}
              </h2>
            </div>
            {!isLoading && (
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="mb-8">
            {isLoading && (
              <div className="p-4 bg-gray-50 rounded-lg text-center mb-6 flex flex-col items-center">
                <Loader className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
                <p className="text-lg font-medium text-gray-800">
                  Deleting transformation...
                </p>
              </div>
            )}

            {isDeleted && (
              <div className="p-4 bg-green-50 rounded-lg text-center mb-6">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-lg font-medium text-gray-800">
                  Transformation "{transformationData.transformation_name}"
                  deleted successfully
                </p>
                <button
                  onClick={handleClose}
                  className="mt-6 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Close
                </button>
              </div>
            )}

            {!isLoading && !isDeleted && (
              <>
                <div className="p-4 bg-red-50 rounded-lg text-center mb-6">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                  <p className="text-lg font-medium text-gray-800">
                    You are about to delete the transformation "
                    {transformationData.transformation_name}"
                  </p>
                  <p className="text-gray-500 mt-2">
                    This action cannot be undone.
                  </p>
                </div>
                <p className="text-gray-600 text-center mb-6">
                  Do you want to continue?
                </p>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleConfirm}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    No
                  </button>
                </div>
              </>
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

      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn ${
            toast.type === "success"
              ? "bg-green-100 text-green-800 border-l-4 border-green-500"
              : "bg-red-100 text-red-800 border-l-4 border-red-500"
          }`}
        >
          <Icon
            icon={
              toast.type === "success" ? "mdi:check-circle" : "mdi:alert-circle"
            }
            className="h-5 w-5"
          />
          <p>{toast.message}</p>
          <button
            onClick={() => setToast({ show: false, message: "", type: "" })}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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

          <button
            className="p-2 px-2 rounded-lg border border-gray-400 hover:bg-gray-50"
            onClick={handleRefresh}
            title="Refresh data"
            disabled={isLoading}
          >
            <RefreshCcw
              className={`h-5 w-5 text-gray-600 ${
                isLoading ? "icon-rotate" : ""
              }`}
            />
          </button>

          <button
            className={`p-1 px-1.5 rounded-lg border ${
              viewMode === "list"
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <MovementChart />
            <LastTransformations />
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
      />

      <DeleteTransformation
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, transformation: null })}
        transformationData={deleteModal.transformation}
        onConfirmDelete={confirmDeleteTransformation}
      />

      <CountDetailsModal
        isOpen={countModal.isOpen}
        onClose={() =>
          setCountModal({ isOpen: false, type: null, data: null, title: null })
        }
        type={countModal.type}
        data={countModal.data}
        title={countModal.title}
      />
    </div>
  );
}

export default Transformation;
