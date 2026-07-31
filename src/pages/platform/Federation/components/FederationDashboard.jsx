/*eslint-disable*/
import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify-icon/react";
import { Link } from 'react-router-dom';
import CreateViewDialog from "./createViewDailog";
import {
  Trash2,
  RotateCw,
  Code,
  Plus,
  Search,
  RefreshCcw,
  Globe,
  Copy,
  Check,
  Eye,
  EyeOff,
  ShieldAlert,
  X,
  Loader2,
  Pencil,
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../../../context/AuthContext";
import toast from "react-hot-toast";
import Breadcrumb from "../../../../components/Breadcrumb";
import CardGrid from "../../../../components/CardGrid";
import DataTable from "../../../../components/DataTable";
import { useFederationDashboardData, useFederationPolicyIds } from "../../../../hooks/platform/federation";
import { usePersonaStatuses } from "../../../../hooks/dataGovernance/Users/auth";

const FederationDashBoard = () => {
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalState, setModalState] = useState({
    queryType: "Regular",
    viewType: ""
  });

  const toggleModal = () => {
    setModalState({
      queryType: "Regular",
      viewType: ""
    });
    setIsModalOpen(!isModalOpen);
  };

  const { token, decodedToken, hostnameV1 } = useAuth();
  const { personaStatuses } = usePersonaStatuses();
  const ExternalAPI = window._env_?.VITE_EXTERNAL_API;
  const KongAPI = window._env_?.VITE_KONG_API;

  const isViewManager = decodedToken?.resource_access?.darch?.roles?.some(role => role.toLowerCase() === 'persona:view manager') && personaStatuses?.['persona:view manager'] === true;

  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [apiModalData, setApiModalData] = useState({
    viewName: "",
    curlCommand: "",
    apiKey: "",
    endpoint: "",
  });
  const [apiModalLoading, setApiModalLoading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    viewData: null,
    isDeleting: false
  });

  const [editBlockModalState, setEditBlockModalState] = useState({
    isOpen: false,
    viewData: null
  });

  const { isFetching: isFetchingPolicies, isLoading: isLoadingPolicies, refetch: fetchPolicyIds } = useFederationPolicyIds();
  const { data: dashboardDataRaw, isLoading, isFetching, refetch: fetchDashboardData } = useFederationDashboardData();

  const dashboardData = dashboardDataRaw || {
    total_view: 0,
    base_view: 0,
    business_view: 0,
    materalized_view: 0,
    views_details: []
  };

  const isCardsLoading = isLoading || isFetching || isFetchingPolicies || isLoadingPolicies;
  const isTableLoading = isLoading || isFetching || isFetchingPolicies || isLoadingPolicies;
  const [resetSortTrigger, setResetSortTrigger] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("both");


  const handleRefreshMV = async (viewName) => {
    try {
      const response = await fetch(`${hostnameV1}/refresh_view/${viewName}`, {
        method: "POST",
        headers: { accept: "application/json", "Authorization": `Bearer ${token}` },
      });
      if (response.ok) {
        toast.success("View refreshed successfully");
        await fetchDashboardData();
      } else {
        toast.error("Failed to refresh view");
      }
    } catch (error) {
      console.error("Error refreshing view:", error);
      toast.error("Failed to refresh view");
    }
  };

  const handleDeleteView = (row) => {
    setDeleteModalState({
      isOpen: true,
      viewData: row,
      isDeleting: false
    });
  };

  const confirmDeleteView = async () => {
    const row = deleteModalState.viewData;
    if (!row) return;

    setDeleteModalState(prev => ({ ...prev, isDeleting: true }));
    try {
      const payload = {
        view_name: row.view_name,
        ismaterializedview: row.materalized || false,
        iscached: row.cached || false
      };
      
      const response = await fetch(`${hostnameV1}/delete_view`, {
        method: "DELETE",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(`View ${row.view_name} deleted successfully`);
        await fetchDashboardData();
        setDeleteModalState({ isOpen: false, viewData: null, isDeleting: false });
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || "Failed to delete view");
        setDeleteModalState(prev => ({ ...prev, isDeleting: false }));
      }
    } catch (error) {
      console.error("Error deleting view:", error);
      toast.error("Failed to delete view");
      setDeleteModalState(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleViewExposedAPI = async (row) => {
    const viewName = row.view_name;
    setShowApiKey(false);
    setCopiedField(null);
    setApiModalData({ viewName, curlCommand: "", apiKey: "", endpoint: "" });
    setApiModalLoading(true);
    setIsApiModalOpen(true);

    try {
      const endpoint = `${ExternalAPI}/view/${viewName}`;
      let curlCommand = "";
      try {
        const curlResponse = await fetch(`${hostnameV1}/generate_curl`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url: endpoint, page: 1 }),
        });
        curlCommand = await curlResponse.text();
      } catch (e) {
        curlCommand = `curl --location '${endpoint}'`;
      }

      let apiKey = "";
      try {
        const username = decodedToken?.preferred_username || "sanitycheck";
        const keyResponse = await fetch(
          `${hostnameV1}/kong/key-auth/${username}`,
          { method: "GET" }
        );
        if (keyResponse.ok) {
          const keyData = await keyResponse.json();
          apiKey = keyData?.data?.[0]?.key || "";
        }
      } catch (e) {
        console.error("Error fetching API key:", e);
        apiKey = "";
      }

      setApiModalData({ viewName, curlCommand, apiKey, endpoint });
    } catch (error) {
      console.error("Error fetching API details:", error);
    } finally {
      setApiModalLoading(false);
    }
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handleEditView = async (row) => {
    if (row.dependent_views && row.dependent_views.length > 0) {
      setEditBlockModalState({
        isOpen: true,
        viewData: row
      });
      return;
    }

    if (row.type === "Custom View") {
      sessionStorage.setItem("editMode", "true");
      sessionStorage.setItem("editViewName", row.view_name);
      sessionStorage.setItem("editOriginalPayload", JSON.stringify(row));
      navigate("/editor");
      return;
    }

    const viewName = row.view_name;
    const toastId = toast.loading("Loading view data...");
    try {
      const response = await fetch(`${hostnameV1}/get-view-details/${viewName}`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();

        sessionStorage.setItem("editMode", "true");
        sessionStorage.setItem("editViewName", viewName);
        sessionStorage.setItem("editOriginalPayload", JSON.stringify(data));

        if (data.extra_info?.edit_flow) {
          sessionStorage.setItem("editFlowData", JSON.stringify(data.extra_info.edit_flow));
        }

        toast.success("View data loaded", { id: toastId });

        const queryType = data?.extra_info?.queryType || (data.complex_query ? "Complex" : "Regular");

        if (data.view_type === "Base") {
          navigate("/federation/view/source", { state: { viewType: data.view_type, queryType: queryType } });
        } else {
          navigate("/viewcanvas", { state: { viewType: data.view_type, queryType: queryType } });
        }
      } else {
        toast.error("Failed to load view details", { id: toastId });
      }
    } catch (error) {
      console.error("Error loading view details:", error);
      toast.error("An error occurred while fetching view data", { id: toastId });
    }
};

  useEffect(() => {
    // Initial fetch is handled automatically by useFederationDashboardData hook
  }, [token, decodedToken]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const columns = [
    { label: "View Name", key: "view_name", sortable: true },
    { label: "View Type", key: "type", sortable: true, render: (row) => <span className="capitalize">{row.type}</span> },
    {
      label: "Materialized",
      key: "materalized",
      sortable: true,
      render: (row) => row.materalized ? (
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium flex items-center w-fit">True</span>
      ) : (
        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md text-xs font-medium">False</span>
      )
    },
    {
      label: "Status",
      key: "status",
      sortable: true,
      render: (row) => row.status ? (
        <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${row.status === 'refreshing' ? 'bg-yellow-100 text-yellow-800' : row.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {row.status}
        </span>
      ) : (
        <span className="text-gray-500">-</span>
      )
    },
    { 
      label: "MV Expired In", 
      key: "expiry_time_left", 
      sortable: true,
      render: (row) => row.status === 'refreshing' ? '-' : (row.expiry_time_left || '-')
    },
    {
      label: "Created By",
      key: "created_by",
      sortable: true,
      render: (row) => row.created_by || "-"
    },
    {
      label: "Created At",
      key: "created_at",
      sortable: true,
      render: (row) => formatDate(row.created_at)
    },
    {
      label: "Updated At",
      key: "updated_at",
      sortable: true,
      render: (row) => formatDate(row.updated_at)
    },
    { label: "Action", sortable: false }
  ];

  const actions = [
    {
      label: "View Exposed API",
      icon: <Globe size={16} />,
      onClick: (row) => handleViewExposedAPI(row)
    },
    {
      label: "Refresh MV",
      icon: <RotateCw size={16} />,
      show: (row) => row.materalized && isViewManager,
      onClick: (row) => handleRefreshMV(row.view_name)
    },
    {
      label: "Delete",
      icon: <Trash2 size={16} />,
      show: (row) => row.materalized ? isViewManager : true,
      onClick: (row) => handleDeleteView(row)
    },
    {
      label: "Edit",
      icon: <Pencil size={16} />,
      show: (row) => row.materalized ? isViewManager : true,
      onClick: (row) => handleEditView(row)
    }
  ];

  const cards = [
    { icon: "lucide:layout-dashboard", bgcolor: "bg-[#d8d3e4] bg-opacity-25", iconcolor: "text-purple-700", title: "Total Views", count: dashboardData.total_view || 0 },
    { icon: "lucide:database", bgcolor: "bg-[#96CF7B] bg-opacity-25", iconcolor: "text-green-700", title: "Base Views", count: dashboardData.base_view || 0 },
    { icon: "lucide:briefcase", bgcolor: "bg-[#FFC93F] bg-opacity-25", iconcolor: "text-orange-700", title: "Business Views", count: dashboardData.business_view || 0 },
    { icon: "lucide:layers", bgcolor: "bg-[#16ABC2] bg-opacity-25", iconcolor: "text-cyan-700", title: "Custom Views", count: dashboardData.custom_view || 0 }
  ];

  const handleCardClick = () => {};

  return (
    <>
      <div className="w-full h-full px-6 pt-3">
        <Breadcrumb title="Platform" link={"/"} />
        <div className="flex gap-2 mb-6 items-center justify-between mt-4">
          <h1 className="text-2xl font-semibold">Federation</h1>
          <div className="flex items-center gap-2">

            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="pl-10 pr-4 py-2 w-[300px] border border-gray-300 rounded-lg focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            <div className="relative flex items-center">
              <button
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-400 hover:bg-gray-50"
                onClick={async () => {
                  try {
                    await fetchPolicyIds();
                    await fetchDashboardData();
                  } finally {
                    setSearchTerm("");
                    setResetSortTrigger(prev => prev + 1);
                    toast.success("Federation data refreshed successfully");
                  }
                }}
                title="Refresh data"
                disabled={isCardsLoading || isTableLoading}
              >
                <RefreshCcw
                  className={`h-5 w-5 text-gray-600 ${(isCardsLoading || isTableLoading) ? "icon-rotate" : ""}`}
                />
              </button>
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

            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('editMode');
                sessionStorage.removeItem('editViewName');
                sessionStorage.removeItem('editOriginalPayload');
                navigate('/editor');
              }}
              className="h-10 text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-4 flex items-center justify-center dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
            >
              <Code className="h-5 w-5 mr-2" />
              Editor
            </button>

            <button
              type="button"
              onClick={toggleModal}
              className="h-10 text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-4 flex items-center justify-center dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
            >
              <Plus className="h-5 w-5 mr-1" />
              Create View
            </button>
          </div>
        </div>

        {viewMode !== "list" && (
          <div className="mb-6 mt-6">
            <CardGrid
              cards={cards}
              onCardClick={handleCardClick}
              isLoading={isCardsLoading}
              showDetails={false}
            />
          </div>
        )}

        <DataTable
          columns={columns}
          data={(() => {
            const views = dashboardData.views_details || [];
            const sortedViews = [...views].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            if (searchTerm.trim()) {
              return sortedViews.filter(row =>
                Object.values(row).some(value =>
                  String(value).toLowerCase().includes(searchTerm.toLowerCase())
                )
              );
            }
            return sortedViews;
          })()}
          actions={actions}
          isLoading={isTableLoading}
          refetch={fetchDashboardData}
          resetSortTrigger={resetSortTrigger}
        />
      </div>

      {isModalOpen && (
        <CreateViewDialog
          isModalOpen={isModalOpen}
          toggleModal={toggleModal}
          modalState={modalState}
          setModalState={setModalState}
        />
      )}

      {isApiModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: "90vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#282F49] text-white rounded-t-2xl flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white bg-opacity-15 flex items-center justify-center">
                  <Globe size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold leading-tight">Exposed API</h2>
                  <p className="text-xs text-gray-300 mt-0.5 font-mono truncate max-w-xs">
                    {apiModalData.viewName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsApiModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-white hover:bg-opacity-15 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {apiModalLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 size={32} className="animate-spin text-[#8e78b7]" />
                  <p className="text-sm text-gray-500">Fetching API details…</p>
                </div>
              ) : (
                <>
                  {/* Endpoint row */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Endpoint
                    </p>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                      <span className="text-xs font-bold bg-[#8e78b7] text-white rounded-md px-2 py-0.5 flex-shrink-0">
                        POST
                      </span>
                      <span className="text-sm text-gray-700 font-mono break-all flex-1">
                        /api/v1/view/{apiModalData.viewName}
                      </span>
                      <button
                        onClick={() => handleCopy(`/api/v1/view/${apiModalData.viewName}`, "endpoint")}
                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Copy endpoint"
                      >
                        {copiedField === "endpoint" ? (
                          <Check size={15} className="text-green-600" />
                        ) : (
                          <Copy size={15} className="text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* cURL Command */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        cURL Command
                      </p>
                      <button
                        onClick={() => handleCopy(apiModalData.curlCommand, "curl")}
                        className="flex items-center gap-1.5 text-xs text-[#8e78b7] hover:text-[#7a63a8] font-medium transition-colors"
                      >
                        {copiedField === "curl" ? (
                          <><Check size={13} /> Copied</>
                        ) : (
                          <><Copy size={13} /> Copy</>
                        )}
                      </button>
                    </div>
                    <div className="bg-[#1e2235] rounded-xl p-4 overflow-x-auto">
                      <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap leading-relaxed">
                        {apiModalData.curlCommand || `curl --location '${apiModalData.endpoint || ExternalAPI + "/view/" + apiModalData.viewName}'`}
                      </pre>
                    </div>
                  </div>

                  {/* API Key */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        API Key
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
                        >
                          {showApiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                          {showApiKey ? "Hide" : "Reveal"}
                        </button>
                        {apiModalData.apiKey && (
                          <button
                            onClick={() => handleCopy(apiModalData.apiKey, "apiKey")}
                            className="flex items-center gap-1.5 text-xs text-[#8e78b7] hover:text-[#7a63a8] font-medium transition-colors"
                          >
                            {copiedField === "apiKey" ? (
                              <><Check size={13} /> Copied</>
                            ) : (
                              <><Copy size={13} /> Copy</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                      <span className="flex-1 text-sm font-mono text-gray-800 break-all">
                        {apiModalData.apiKey
                          ? showApiKey
                            ? apiModalData.apiKey
                            : "•".repeat(Math.min(apiModalData.apiKey.length, 32))
                          : <span className="text-gray-400 italic text-xs">No API key found</span>
                        }
                      </span>
                    </div>
                  </div>

                  {/* Confidentiality Note */}
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5">
                    <ShieldAlert size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800 mb-0.5">Confidential</p>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Use this key to authenticate calls to the endpoint above. This key is <strong>confidential</strong> and should <strong>not be shared</strong> with unauthorized parties.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => setIsApiModalOpen(false)}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-[#8e78b7] text-white hover:bg-[#7a63a8] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModalState.isOpen && deleteModalState.viewData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden transform transition-all">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-white">
              <div className="flex items-center gap-2">
                 {deleteModalState.viewData.dependent_views && deleteModalState.viewData.dependent_views.length > 0 ? (
                    <ShieldAlert size={20} className="text-red-500" />
                 ) : (
                    <Trash2 size={20} className="text-red-500" />
                 )}
                <h2 className="text-lg font-semibold text-gray-800">
                  {deleteModalState.viewData.dependent_views && deleteModalState.viewData.dependent_views.length > 0 
                    ? "Dependent Views Detected" 
                    : "Delete View"}
                </h2>
              </div>
              <button
                onClick={() => setDeleteModalState({ isOpen: false, viewData: null, isDeleting: false })}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-600"
                disabled={deleteModalState.isDeleting}
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 bg-white">
              {deleteModalState.viewData.dependent_views && deleteModalState.viewData.dependent_views.length > 0 ? (
                <div className="flex flex-col">
                  <div className="flex items-start gap-3 bg-red-50/80 border border-red-100 rounded-xl px-4 py-4 mb-6">
                    <div className="flex flex-col">
                      <p className="text-sm text-red-800 leading-relaxed">
                        Deleting the view <span className="font-semibold text-red-900">'{deleteModalState.viewData.view_name}'</span> is not permitted because it is currently used as a source for other views. Please remove these dependencies before proceeding with deletion.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Dependent Views ({deleteModalState.viewData.dependent_views.length})
                    </h4>
                    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[200px] overflow-y-auto bg-gray-50/50 shadow-inner">
                      <div className="divide-y divide-gray-100">
                        {deleteModalState.viewData.dependent_views.map((dv, idx) => (
                          <div key={idx} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors group">
                            <div className="w-8 h-8 rounded-full bg-[#8e78b7]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#8e78b7]/20 transition-colors">
                               <Icon icon="lucide:layers" className="text-[#8e78b7]" width="16" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{dv}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Are you sure you want to delete the view <span className="font-semibold text-gray-800">'{deleteModalState.viewData.view_name}'</span>? This action cannot be undone.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => setDeleteModalState({ isOpen: false, viewData: null, isDeleting: false })}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                disabled={deleteModalState.isDeleting}
              >
                {deleteModalState.viewData.dependent_views && deleteModalState.viewData.dependent_views.length > 0 ? "Understood" : "Cancel"}
              </button>
              
              {(!deleteModalState.viewData.dependent_views || deleteModalState.viewData.dependent_views.length === 0) && (
                <button
                  onClick={confirmDeleteView}
                  disabled={deleteModalState.isDeleting}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm shadow-red-200"
                >
                  {deleteModalState.isDeleting && <Loader2 size={16} className="animate-spin" />}
                  {deleteModalState.isDeleting ? "Deleting..." : "Delete View"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {editBlockModalState.isOpen && editBlockModalState.viewData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden transform transition-all">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-white">
              <div className="flex items-center gap-2">
                 <ShieldAlert size={20} className="text-amber-500" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Dependent Views Detected
                </h2>
              </div>
              <button
                onClick={() => setEditBlockModalState({ isOpen: false, viewData: null })}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 bg-white">
                <div className="flex flex-col">
                  <div className="flex items-start gap-3 bg-amber-50/80 border border-amber-100 rounded-xl px-4 py-4 mb-6">
                    <div className="flex flex-col">
                      <p className="text-sm text-amber-800 leading-relaxed">
                        Editing the view <span className="font-semibold text-amber-900">'{editBlockModalState.viewData.view_name}'</span> is not permitted because it is currently used as a source for other views. Please remove these dependencies before proceeding with the edit.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Dependent Views ({editBlockModalState.viewData.dependent_views.length})
                    </h4>
                    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[200px] overflow-y-auto bg-gray-50/50 shadow-inner">
                      <div className="divide-y divide-gray-100">
                        {editBlockModalState.viewData.dependent_views.map((dv, idx) => (
                          <div key={idx} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors group">
                            <div className="w-8 h-8 rounded-full bg-[#8e78b7]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#8e78b7]/20 transition-colors">
                               <Icon icon="lucide:layers" className="text-[#8e78b7]" width="16" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{dv}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => setEditBlockModalState({ isOpen: false, viewData: null })}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FederationDashBoard;