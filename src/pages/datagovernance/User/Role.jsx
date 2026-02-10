import React, { useState, useEffect, useRef } from "react";
import {
  MoreVertical,
  LayoutGrid,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  List,
  ChevronDown
} from "lucide-react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";
import AddRole from "./Components/Role/AddRole";
import EditRole from "./Components/Role/EditRole";
import DeleteRole from "./Components/Role/DeleteRole";
import { useAuth } from "../../../context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Search from "../../../assets/governance/search.svg"

const rotateAnimation = `
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(-360deg); }
  }
  .icon-rotate { animation: rotate 1s linear infinite; }
  .icon-rotate svg { transform-origin: center; transform: scale(0.88); }
  .icon-rotate svg path, .icon-rotate svg g { stroke-width: 0.75px !important; vector-effect: non-scaling-stroke; }
  .toggle-disabled {
    pointer-events: none;
    opacity: 0.6;
  }
  
  .toggle-disabled svg {
    display: none !important;
  }
    table {
  border-collapse: separate;
  border-spacing: 0;
}

thead tr:first-child th:first-child {
  border-top-left-radius: 0.5rem;
}

thead tr:first-child th:last-child {
  border-top-right-radius: 0.5rem;
}

tbody tr:last-child td:first-child {
  border-bottom-left-radius: 0.5rem;
}

tbody tr:last-child td:last-child {
  border-bottom-right-radius: 0.5rem;
}
`;

const Toggle = ({ enabled, onToggle, disabled = false, size = "md" }) => {
  const sizes = {
    sm: { w: "w-8", h: "h-4", knob: "h-3 w-3", translate: "translate-x-4" },
    md: { w: "w-10", h: "h-5", knob: "h-4 w-4", translate: "translate-x-5" },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div
      onClick={() => !disabled && onToggle && onToggle()}
      role="button"
      aria-disabled={disabled}
      className={`relative inline-flex ${s.h} ${s.w} ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"} rounded-full transition-colors ease-in-out duration-200 ${enabled ? "bg-[#1a9962]" : "bg-gray-200"}`}
    >
      <span
        className={`inline-block ${s.knob} transform rounded-full bg-white transition ease-in-out duration-200 m-0.5 ${enabled ? s.translate : "translate-x-0"}`}
      />
    </div>
  );
};

const getInitial = (r) => {
  const str = (r?.title || r?.name || r?.id || "").toString();
  const match = str.match(/[A-Za-z0-9]/);
  return match ? match[0].toUpperCase() : "";
};

const Role = () => {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [roles, setRoles] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("cards");
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [togglingStatus, setTogglingStatus] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [activeMenu, setActiveMenu] = useState(null);
  const [showViewModeMenu, setShowViewModeMenu] = useState(false);
  const initialFetchDoneRef = useRef(false);
  const { token } = useAuth();

  const filteredRoles = roles.filter(role =>
    role.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTableData = tableData.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage, viewMode]);

  const handleClickOutside = () => {
    setActiveMenu(null);
    setShowViewModeMenu(false);
  };

  const toggleRole = async (identifier) => {
    const index = roles.findIndex(r => r.title === identifier);
    if (index === -1) return;

    const roleToUpdate = roles[index];
    const newStatus = !roleToUpdate.enabled;
    setTogglingStatus(identifier);

    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/rolestatus`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: roleToUpdate.title,
          status: newStatus ? "Enabled" : "Disabled"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error: ${response.status} ${response.statusText}`);
      }

      const newRoles = [...roles];
      newRoles[index].enabled = newStatus;
      newRoles[index].attributes = { ...(newRoles[index].attributes || {}), Status: [newStatus ? "Enabled" : "Disabled"] };
      setRoles(newRoles);

      const updatedTableData = tableData.map(item => {
        if (item.name === roleToUpdate.title) {
          return { ...item, status: newStatus ? "Enabled" : "Disabled" };
        }
        return item;
      });
      setTableData(updatedTableData);
    } catch (error) {
      console.error("Error updating role status:", error);
      setToast({ show: true, message: "Failed to update role status", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    } finally {
      setTogglingStatus(null);
    }
  };

  const FetchRoleDashboardData = async () => {
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/roleshomepage`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch role dashboard data: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();

      const transformedRoles = data.map(role => ({
        title: role.name,
        description: role.description || "No description available",
        users: role.user_count || 0,
        enabled: role.attributes?.Status?.[0] === "Enabled",
        attributes: role.attributes || { Status: ["Disabled"] },
        icon: "material-symbols:tab-group-outline",
        bgcolor: "bg-[#8d77ba] bg-opacity-25",
        iconcolor: "text-[#8d77ba]",
      }));

      setRoles(transformedRoles);
      return { success: true };
    } catch (error) {
      console.error("Error fetching role data:", error);
      return { success: false, error: error.message };
    }
  };

  const fetchRoleList = async () => {
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/roleslist`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch role list data: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();

      const transformedData = data.map(role => {
        const createdOn = role.attributes?.createdOn?.[0] || "";
        let formattedDate = "";
        if (createdOn) {
          try {
            const d = new Date(createdOn);
            formattedDate = !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : createdOn;
          } catch {
            formattedDate = createdOn;
          }
        }
        return {
          id: role.id,
          name: role.name,
          description: role.description || "No description available",
          status: role.attributes?.Status?.[0] === "Enabled" ? "Enabled" : "Disabled",
          createdOn: formattedDate,
          startDate: role.attributes?.startDate?.[0] || "",
          endDate: role.attributes?.endDate?.[0] || "",
        };
      });

      setTableData(transformedData);
      return { success: true };
    } catch (error) {
      console.error("Error fetching role list:", error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    if (!initialFetchDoneRef.current) {
      initialFetchDoneRef.current = true;
      Promise.all([FetchRoleDashboardData(), fetchRoleList()]).finally(() => setLoading(false));
    }
  }, []);

  const refreshAllData = async (showToast = false) => {
    setRefreshing(true);
    setSearchTerm("");
    setCurrentPage(1);
    try {
      const [dashboardResult, listResult] = await Promise.all([FetchRoleDashboardData(), fetchRoleList()]);
      if (dashboardResult.success && listResult.success) {
        if (showToast) {
          setToast({ show: true, message: "Role data refreshed successfully", type: "success" });
          setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
        }
        return { success: true };
      } else {
        if (showToast) {
          setToast({ show: true, message: "Failed to refresh role data", type: "error" });
          setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
        }
        return { success: false, error: "Failed to refresh role data" };
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
      if (showToast) {
        setToast({ show: true, message: "Failed to refresh role data", type: "error" });
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
      }
      return { success: false, error: error.message };
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/deleterole/${roleToDelete.name}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error: ${response.status} ${response.statusText}`);
      }
      await refreshAllData();
      return true;
    } catch (error) {
      console.error("Error deleting role:", error);
      throw error;
    }
  };

  // pagination helpers (cards and list)
  const cardTotalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const cardStartIndex = (currentPage - 1) * itemsPerPage;
  const cardEndIndex = cardStartIndex + itemsPerPage;
  const displayedRoles = filteredRoles.slice(cardStartIndex, cardEndIndex);

  const listTotalPages = Math.ceil(filteredTableData.length / itemsPerPage);
  const listStartIndex = (currentPage - 1) * itemsPerPage;
  const listEndIndex = listStartIndex + itemsPerPage;
  const listCurrentRows = filteredTableData.slice(listStartIndex, listEndIndex);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
  const handleNextPage = () => {
    const maxPages = viewMode === "cards" ? cardTotalPages : listTotalPages;
    if (currentPage < maxPages) setCurrentPage(currentPage + 1);
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleSave = async (result) => {
    if (result.success) {
      await refreshAllData();
      setToast({ show: true, message: result.message || "Role created successfully", type: "success" });
      setShowModal(false);
      setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    }
  };

  const handleEditSave = async () => {
    await refreshAllData();
    setToast({ show: true, message: "Role updated successfully", type: "success" });
    setShowEditModal(false);
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const cardStartItem = filteredRoles.length === 0 ? 0 : cardStartIndex + 1;
  const cardEndItem = Math.min(cardEndIndex, filteredRoles.length);
  const listStartItem = filteredTableData.length === 0 ? 0 : listStartIndex + 1;
  const listEndItem = Math.min(listEndIndex, filteredTableData.length);

  return (
    // <div className="px-6 py-4 bg-[#F3F5F7] min-h-screen">
    <div className="px-6 py-4  min-h-screen"> 
      <style>{rotateAnimation}</style>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn ${toast.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 'bg-red-100 text-red-800 border-l-4 border-red-500'}`}>
          <Icon icon={toast.type === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'} className="h-5 w-5" />
          <p>{toast.message}</p>
          <button onClick={() => setToast({ show: false, message: "", type: "" })} className="ml-2 text-gray-500 hover:text-gray-700">
            <Icon icon="mdi:close" className="h-4 w-4" />
          </button>
        </div>
      )}

      <Breadcrumb />
      <div className="flex items-center justify-between mb-[18px]">
        <h1 className="text-2xl font-semibold">Role</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <img src={Search} alt="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 h-10 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              placeholder="Search role"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                <Icon icon="mdi:close" width="16" height="16" />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              className={`flex items-center justify-center p-1 px-1.5 rounded-lg border border-gray-400 bg-gray-50 hover:bg-gray-100`}
              onClick={() => setShowViewModeMenu(prev => !prev)}
              style={{ width: '40px', height: '40px', borderRadius: '8px', padding: '8px' }}
              title="Choose view mode"
            >
              {viewMode === 'cards' ? <LayoutGrid className="h-5 w-5" style={{ color: '#818181' }} /> : <List className="h-5 w-5" style={{ color: '#818181' }} strokeWidth={1.5} />}
            </button>

            {showViewModeMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={handleClickOutside} />
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border z-20 animate-fadeIn">
                  <button className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 hover:bg-gray-100 ${viewMode === 'list' ? 'bg-gray-50' : ''}`} onClick={() => { setViewMode('list'); setShowViewModeMenu(false); }}>
                    <span className="flex items-center gap-2"><List className="h-4 w-4" />List</span>
                    {viewMode === 'list' && <Icon icon="mdi:check" width="14" height="14" />}
                  </button>
                  <button className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 hover:bg-gray-100 ${viewMode === 'cards' ? 'bg-gray-50' : ''}`} onClick={() => { setViewMode('cards'); setShowViewModeMenu(false); }}>
                    <span className="flex items-center gap-2"><LayoutGrid className="h-4 w-4" />Cards</span>
                    {viewMode === 'cards' && <Icon icon="mdi:check" width="14" height="14" />}
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            className={`flex items-center justify-center p-1 px-1.5 rounded-lg border  border-gray-400 bg-gray-50 hover:bg-gray-100`}
            onClick={() => refreshAllData(true)}
            disabled={refreshing}
            title="Refresh"
            style={{ width: '40px', height: '40px', borderRadius: '8px', padding: '8px' }}
          >
            <RefreshCcw size={20} className={`${refreshing ? 'icon-rotate' : ''}`} style={{ color: '#818181' }} strokeWidth={1.7} />
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-[#8e78b7] text-white rounded-lg text-base" onClick={() => setShowModal(true)}>
            <Plus className="h-5 w-5 " /> New role
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8e78b7]"></div>
        </div>
      ) : (
        <>
          {viewMode === 'cards' && (
            <>
              {filteredRoles.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {displayedRoles.map((role, index) => (
                      <div key={index} className="bg-white rounded-lg border border-gray-100 transform transition-all duration-300 hover:shadow-md hover:-translate-y-1 overflow-hidden">
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 min-w-0">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 ${role.bgcolor} rounded-full ${role.iconcolor} flex-shrink-0`} aria-hidden="true">
                                <span className="text-sm md:text-base font-semibold">{getInitial(role)}</span>
                              </div>
                              <h3 className="text-lg font-semibold truncate">{role.title}</h3>
                            </div>

                            <div className="relative flex-shrink-0">
                             <button onClick={() => setActiveMenu(activeMenu === `card-${index}` ? null : `card-${index}`)} className="rounded-full hover:bg-gray-100">
                                <MoreVertical className="h-5 w-5 text-gray-600" />
                              </button>
                              {activeMenu === `card-${index}` && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={handleClickOutside} />
                                  <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border z-20 animate-fadeIn">
                                    <div className="flex items-center p-1 gap-1">
                                      <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => {
                                        const roleData = tableData.find(r => r.name === role.title);
                                        setRoleToEdit(roleData || { name: role.title, description: role.description });
                                        setShowEditModal(true);
                                        setActiveMenu(null);
                                      }}>
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                      <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => {
                                        const roleData = tableData.find(r => r.name === role.title);
                                        setRoleToDelete(roleData || { name: role.title });
                                        setShowDeleteModal(true);
                                        setActiveMenu(null);
                                      }}>
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          <p className="text-gray-500 mt-2 text-sm line-clamp-2">{role.description}</p>

                          <div className="flex items-center justify-between mt-6">
                            <div className="flex items-center gap-2">
                              <Icon icon="material-symbols:supervisor-account-outline" width="24" height="24" style={{ color: '#818181' }} />
                              <span className="text-sm">{role.users.toString().padStart(2, "0")}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-sm ${role.enabled ? "text-[#1a9962]" : "text-gray-400"}`}>{role.enabled ? "Enabled" : "Disabled"}</span>
                              {/* show a disabled toggle that visually flips while request is pending  --- no timeout implemented*/}
                              <div className={togglingStatus === role.title ? 'toggle-disabled' : ''}>
                              <Toggle
                                enabled={togglingStatus === role.title ? !role.enabled : role.enabled}
                                onToggle={() => toggleRole(role.title)}
                                disabled={togglingStatus === role.title}
                                size="md"
                              />
                            </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredRoles.length > 0 && (
                    <div className="flex flex-col md:flex-row items-center justify-between mt-6 mb-6">
                      <div className="text-sm text-gray-500 mb-4 md:mb-0">Showing {cardStartItem} to {cardEndItem} of {filteredRoles.length} roles</div>

                      <div className="flex items-center space-x-4" style={{ transform: 'translateX(-20px)' }}>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-500">Show per page</label>
                          <div className="relative">
                            <select value={itemsPerPage} onChange={handleItemsPerPageChange} className="border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-center pl-2 pr-8" style={{ height: '31px', width: '55px', WebkitAppearance: 'none', appearance: 'none', paddingRight: '24px'}}>
                              <option value={12} style={{ color: '#282F49' }}>12</option>
                              <option value={24} style={{ color: '#282F49' }}>24</option>
                              <option value={48} style={{ color: '#282F49' }}>48</option>
                            </select>
                            <ChevronDown 
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-700" 
                              style={{ top: '52%' }}  
                              size={14} 
                            />
                          </div>
                        </div>

                        <div className="flex items-center border border-gray-400 rounded-md bg-gray-50" style={{ height: '31px', width: '55px', overflow: 'hidden' }}>
                          <button onClick={handlePrevPage} disabled={currentPage === 1} title="Previous page" className={`flex-1 h-full flex items-center justify-center ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`} style={{ padding: 0, border: 'none' }}>
                            <ChevronLeft size={14} />
                          </button>
                          <button onClick={handleNextPage} disabled={currentPage >= cardTotalPages || cardTotalPages === 0} title="Next page" className={`flex-1 h-full flex items-center justify-center ${currentPage >= cardTotalPages || cardTotalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`} style={{ padding: 0, border: 'none', borderLeft: '1px solid rgba(156,163,175,0.45)' }}>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 transition-opacity duration-300">
                  <Icon icon="material-symbols:search-off-outline" width="48" height="48" className="mb-4 text-gray-400" />
                  <p>No roles found matching "{searchTerm}"</p>
                  <button onClick={() => setSearchTerm("")} className="mt-2 text-[#8e78b7] hover:underline transition-all duration-200">Clear search</button>
                </div>
              )}
            </>
          )}

          {viewMode === 'list' && (
            <>
              <div className="bg-white rounded-lg shadow mt-0 overflow-x-auto" style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
        <table className="w-full min-w-[900px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#29304a] text-white rounded-t-lg text-sm">
                      <th className="text-left" style={{ padding: '16px 19.75px' }}>ID</th>
                      <th className="text-left" style={{ padding: '16px 19.75px' }}>Name</th>
                      <th className="text-left" style={{ padding: '16px 19.75px' }}>Description</th>
                      <th className="text-center" style={{ padding: '16px 19.75px' }}>Status</th>
                      <th className="text-left" style={{ padding: '16px 19.75px' }}>Created On</th>
                      <th className="text-left" style={{ padding: '16px 19.75px' }}>Start Date</th>
                      <th className="text-left" style={{ padding: '16px 19.75px' }}>End Date</th>
                      <th className="text-left" style={{ padding: '16px 19.75px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {listCurrentRows.map((role, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 relative">
                        <td style={{ padding: '16px 19.75px' }} title={role.id}>{role.id?.substring(0, 8)}...</td>
                        <td style={{ padding: '16px 19.75px' }} className="text-gray-600">
                          <div className="flex items-center">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#8d77ba] bg-opacity-25 text-[#8d77ba] mr-2">
                              <span className="text-sm font-semibold">{getInitial(role)}</span>
                            </div>
                            <div className="truncate">{role.name}</div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 19.75px' }} className="text-gray-600 max-w-xs truncate">{role.description}</td>
                        <td style={{ padding: '16px 19.75px' }}>
                          <div className="text-center align-middle">
                            {role.status === 'Enabled' ? (
                              <span className="inline-block px-6 py-2 rounded-md text-sm font-medium" style={{ background: '#def3e9', color: '#1a9962', minWidth: '88px', textAlign: 'center' }} title="Enabled">Enabled</span>
                            ) : (
                              <span className="inline-block px-6 py-2 rounded-md text-sm font-medium" style={{ background: '#f3f4f6', color: '#6b7280', minWidth: '88px', textAlign: 'center' }} title="Disabled">Disabled</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px 19.75px' }} className="text-gray-600">{role.createdOn || "-"}</td>
                        <td style={{ padding: '16px 19.75px' }} className="text-gray-600">{role.startDate || "-"}</td>
                        <td style={{ padding: '16px 19.75px' }} className="text-gray-600">{role.endDate || "-"}</td>
                        <td style={{ padding: '16px 19.75px' }}>
                          <div className="relative">
                            <button onClick={() => setActiveMenu(activeMenu === index ? null : index)} className="p-1.5 rounded-full hover:bg-gray-100">
                              <MoreHorizontal className="h-5 w-5 text-gray-600" />
                            </button>

                            {activeMenu === index && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={handleClickOutside} />
                                <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border z-50 animate-fadeIn min-w-max">
                                  <div className="flex items-center p-1 gap-1">
                                    <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => { setRoleToEdit(role); setShowEditModal(true); setActiveMenu(null); }}>
                                      <Pencil className="h-4 w-4" />
                                    </button>

                                    <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2" onClick={async () => { setActiveMenu(null); await toggleRole(role.name); }} disabled={togglingStatus === role.name} title={role.status === 'Enabled' ? 'Disable' : 'Enable'}>
                                      <Toggle
                                        enabled={togglingStatus === role.name ? role.status !== 'Enabled' : role.status === 'Enabled'}
                                        onToggle={async () => { setActiveMenu(null); await toggleRole(role.name); }}
                                        disabled={togglingStatus === role.name}
                                        size="sm"
                                      />
                                    </button>

                                    <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => { setRoleToDelete(role); setShowDeleteModal(true); setActiveMenu(null); }}>
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {!loading && listCurrentRows.length === 0 && (
                      <tr>
                        <td colSpan="8" className="p-4 text-center text-gray-500">
                          {searchTerm ? (
                            <div className="flex flex-col items-center justify-center py-8">
                              <Icon icon="material-symbols:search-off-outline" width="48" height="48" className="mb-4 text-gray-400" />
                              <p>No roles found matching "{searchTerm}"</p>
                              <button onClick={() => setSearchTerm("")} className="mt-2 text-[#8e78b7] hover:underline transition-all duration-200">Clear search</button>
                            </div>
                          ) : "No roles found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!loading && filteredTableData.length > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between mt-6 mb-6">
                  <div className="text-sm text-gray-500 mb-4 md:mb-0">Showing {listStartItem} to {listEndItem} of {filteredTableData.length} roles</div>

                  <div className="flex items-center space-x-4" style={{ transform: 'translateX(-20px)' }}>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-500">Show per page</label>
                      <div className="relative">
                        <select value={itemsPerPage} onChange={handleItemsPerPageChange} className="border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-center pl-2 pr-8" style={{ height: '31px', width: '55px', WebkitAppearance: 'none', appearance: 'none', paddingRight: '28px' }}>
                          <option value={12} style={{ color: '#282F49' }}>12</option>
                          <option value={24} style={{ color: '#282F49' }}>24</option>
                          <option value={48} style={{ color: '#282F49' }}>48</option>
                        </select>
                        <ChevronDown 
  className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-700" 
  style={{ top: '52%' }}  
  size={14} 
/>
                      </div>
                    </div>

                    <div className="flex items-center border border-gray-400 rounded-md bg-gray-50" style={{ height: '31px', width: '55px', overflow: 'hidden' }}>
                      <button onClick={handlePrevPage} disabled={currentPage === 1} title="Previous page" className={`flex-1 h-full flex items-center justify-center ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`} style={{ padding: 0, border: 'none' }}>
                        <ChevronLeft size={14} />
                      </button>

                      <button onClick={handleNextPage} disabled={currentPage >= listTotalPages || listTotalPages === 0} title="Next page" className={`flex-1 h-full flex items-center justify-center ${currentPage >= listTotalPages || listTotalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`} style={{ padding: 0, border: 'none', borderLeft: '1px solid rgba(156,163,175,0.45)' }}>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      <AddRole show={showModal} onClose={() => setShowModal(false)} onSave={handleSave} />

      <EditRole show={showEditModal} onClose={() => setShowEditModal(false)} onSave={handleEditSave} roleData={roleToEdit} />

      <DeleteRole showModal={showDeleteModal} setShowModal={setShowDeleteModal} roleName={roleToDelete?.name || ""} onConfirm={async () => { await handleDeleteRole(); setRoleToDelete(null); }} />
    </div>
  );
};

export default Role;
