import React, { useState, useEffect, useRef } from "react";
import { MoreVertical, LayoutGrid, Search, Plus, MoreHorizontal, Pencil, Trash2, RefreshCcw, ChevronLeft, ChevronRight, List, ChevronDown } from "lucide-react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";
import { useAuth } from "../../../context/AuthContext";
import AddSubgroup from "./Components/Subgroup/AddSubgroup";
import DeleteSubgroup from "./Components/Subgroup/DeleteSubgroup";
import EditSubgroup from "./Components/Subgroup/EditSubgroup";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

function Subgroup() {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [subgroupToDelete, setSubgroupToDelete] = useState(null);
  const [subgroupToEdit, setSubgroupToEdit] = useState(null);
  const [subgroups, setSubgroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('cards');
  const [togglingStatus, setTogglingStatus] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const { token } = useAuth();

  const [activeMenu, setActiveMenu] = useState(null);
  const [showViewModeMenu, setShowViewModeMenu] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const initialFetchDoneRef = useRef(false);

  const filteredSubgroups = subgroups.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTableData = tableData.filter(subgroup =>
    subgroup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subgroup.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subgroup.parentGroup.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const cardViewTotalPages = Math.ceil(filteredSubgroups.length / itemsPerPage);
  const cardViewStartIndex = (currentPage - 1) * itemsPerPage;
  const cardViewEndIndex = cardViewStartIndex + itemsPerPage;
  const displayedSubgroups = filteredSubgroups.slice(cardViewStartIndex, cardViewEndIndex);

  const listViewTotalPages = Math.ceil(filteredTableData.length / itemsPerPage);
  const listViewStartIndex = (currentPage - 1) * itemsPerPage;
  const listViewEndIndex = listViewStartIndex + itemsPerPage;
  const listViewCurrentRows = filteredTableData.slice(listViewStartIndex, listViewEndIndex);

  const handleClickOutside = () => {
    setActiveMenu(null);
    setShowViewModeMenu(false);
  };

  useEffect(() => {
    if (!initialFetchDoneRef.current) {
      initialFetchDoneRef.current = true;
      Promise.all([
        fetchSubgroupsData(),
        fetchSubgroupListData()
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, []);

  const fetchSubgroupsData = async () => {
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/subgroupshomepage`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch subgroup dashboard data: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();

      const transformedData = data.map((subgroup) => ({
        id: `${subgroup.group}-${subgroup.subgroup}`,
        title: subgroup.subgroup,
        parentGroup: subgroup.group,
        description: subgroup.attributes?.Description?.[0] ||
                    subgroup.attributes?.description?.[0] ||
                    "No description available",
        users: subgroup.user_count,
        enabled: subgroup.attributes?.Status?.[0] === "Enabled",
        icon: "material-symbols:subtitles-outline",
        bgcolor: "bg-[#8d77ba] bg-opacity-25",
        iconcolor: "text-[#8d77ba]",
      }));

      setSubgroups(transformedData);
      return { success: true };
    } catch (error) {
      console.error("Error fetching subgroup data:", error);
      return { success: false, error: error.message };
    }
  };

  const fetchSubgroupListData = async () => {
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/subgrouplist`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch subgroup list data: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();

      const transformedData = data.map(subgroup => {
        const createdOnValue = subgroup.attributes?.createdOn?.[0] || "";

        let formattedDate = "";
        if (createdOnValue) {
          try {
            const dateObj = new Date(createdOnValue);
            if (!isNaN(dateObj.getTime())) {
              formattedDate = dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
            } else {
              formattedDate = createdOnValue;
            }
          } catch (e) {
            console.warn("Error formatting date:", e);
            formattedDate = createdOnValue;
          }
        }

        return {
          id: subgroup.id,
          name: subgroup.name,
          parentGroup: subgroup.parent_group,
          description: subgroup.attributes?.description?.[0] ||
                      subgroup.attributes?.Description?.[0] ||
                      "No description available",
          status: subgroup.attributes?.Status?.[0] === "Enabled" ? "Enabled" : "Disabled",
          createdDate: formattedDate,
        };
      });

      setTableData(transformedData);
      return { success: true };
    } catch (error) {
      console.error("Error fetching subgroup list data:", error);
      return { success: false, error: error.message };
    }
  };

  const refreshAllData = async () => {
    setRefreshing(true);
    setSearchTerm("");
    setCurrentPage(1);
    try {
      const [subgroupsResult, listResult] = await Promise.all([
        fetchSubgroupsData(),
        fetchSubgroupListData()
      ]);

      if (subgroupsResult.success && listResult.success) {
        setToast({
          show: true,
          message: 'Subgroup data refreshed successfully',
          type: 'success'
        });
      } else {
        const errorMessages = [];
        if (!subgroupsResult.success) errorMessages.push('dashboard data');
        if (!listResult.success) errorMessages.push('list data');

        setToast({
          show: true,
          message: `Failed to refresh subgroup ${errorMessages.join(' and ')}`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
      setToast({
        show: true,
        message: 'Failed to refresh subgroup data',
        type: 'error'
      });
    } finally {
      setRefreshing(false);

      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
    }
  };

  const updateSubgroupStatus = async (subgroupName, newStatus) => {
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/subgroupstatus`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: subgroupName,
          status: newStatus ? "Enabled" : "Disabled"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Status code: ${response.status}`);
      }

      return { success: true, data: await response.json() };
    } catch (error) {
      console.error("Error updating subgroup status:", error);
      return { success: false, error: error.message };
    }
  };

  const toggleRole = async (identifier) => {
    const index = subgroups.findIndex(s => s.title === identifier);
    if (index === -1) return;

    const subgroup = subgroups[index];
    const newStatus = !subgroup.enabled;

    setTogglingStatus(identifier);
    try {
      const result = await updateSubgroupStatus(subgroup.title, newStatus);

      if (result.success) {
        const newSubgroups = [...subgroups];
        newSubgroups[index].enabled = newStatus;
        setSubgroups(newSubgroups);

        const updatedTableData = tableData.map(item => {
          if (item.name === subgroup.title) {
            return {
              ...item,
              status: newStatus ? "Enabled" : "Disabled"
            };
          }
          return item;
        });
        setTableData(updatedTableData);
      } else {
        setToast({ show: true, message: `Failed to update status: ${result.error}`, type: 'error' });
      }
    } catch (error) {
      console.error("Error in toggle operation:", error);
      setToast({ show: true, message: `Error toggling status: ${error.message}`, type: 'error' });
    } finally {
      setTogglingStatus(null);
      setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    }
  };

  const handleEditClick = (subgroup) => {
    setSubgroupToEdit(subgroup);
    setShowEditModal(true);
    setActiveMenu(null);
  };

  const handleDeleteClick = (subgroup) => {
    setSubgroupToDelete(subgroup);
    setShowDeleteModal(true);
    setActiveMenu(null);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleSave = async (result) => {
    if (result.success) {
      try {
        await refreshAllData();
        setToast({ show: true, message: result.message || 'Subgroup created successfully', type: 'success' });
        setShowModal(false);
      } catch (error) {
        console.error('Error refreshing data after subgroup creation:', error);
        setToast({ show: true, message: 'Subgroup created but failed to refresh data', type: 'error' });
      } finally {
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
      }
    }
  };

  const handleEditSave = async () => {
    try {
      await refreshAllData();
      setToast({ show: true, message: 'Subgroup updated successfully', type: 'success' });
      setShowEditModal(false);
    } catch (error) {
      console.error('Error refreshing data after subgroup update:', error);
      setToast({ show: true, message: 'Subgroup updated but failed to refresh data', type: 'error' });
    } finally {
      setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    const maxPages = viewMode === 'cards' ? cardViewTotalPages : listViewTotalPages;
    if (currentPage < maxPages) setCurrentPage(currentPage + 1);
  };

  const cardViewStartItem = filteredSubgroups.length === 0 ? 0 : cardViewStartIndex + 1;
  const cardViewEndItem = Math.min(cardViewEndIndex, filteredSubgroups.length);

  const listViewStartItem = filteredTableData.length === 0 ? 0 : listViewStartIndex + 1;
  const listViewEndItem = Math.min(listViewEndIndex, filteredTableData.length);

  const getInitial = (s) => {
    const str = (s?.title || s?.name || s?.id || "").toString();
    const match = str.match(/[A-Za-z0-9]/);
    return match ? match[0].toUpperCase() : "";
  };

  return (
    <div className="px-6 py-4 bg-[#F3F5F7] min-h-screen">
      <style>{rotateAnimation}</style>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn ${toast.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 'bg-red-100 text-red-800 border-l-4 border-red-500'}`}>
          <Icon icon={toast.type === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'} className="h-5 w-5" />
          <p>{toast.message}</p>
          <button onClick={() => setToast({ show: false, message: '', type: '' })} className="ml-2 text-gray-500 hover:text-gray-700">
            <Icon icon="mdi:close" className="h-4 w-4" />
          </button>
        </div>
      )}

      <Breadcrumb />
      <div className="flex items-center justify-between mb-[18px]">
        <h1 className="text-2xl font-semibold">Subgroup</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: '#818181' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 h-10 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              placeholder="Search subgroup"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                <Icon icon="mdi:close" width="16" height="16" />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              className={`flex items-center justify-center p-1 px-1.5 rounded-lg border border-gray-400 bg-white hover:bg-gray-100`}
              onClick={() => setShowViewModeMenu(prev => !prev)}
              style={{ width: '40px', height: '40px', borderRadius: '8px', padding: '8px' }}
              title="Choose view mode"
            >
              {viewMode === 'cards' ? (
                <LayoutGrid className="h-5 w-5" style={{ color: '#818181' }} />
              ) : (
                <List className="h-5 w-5" style={{ color: '#818181' }} strokeWidth={1.5} />
              )}
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
            className={`flex items-center justify-center p-1 px-1.5 rounded-lg border border-gray-400 bg-white hover:bg-gray-100`}
            onClick={refreshAllData}
            disabled={refreshing}
            title="Refresh"
            style={{ width: '40px', height: '40px', borderRadius: '8px', padding: '8px' }}
          >
            <RefreshCcw size={20} className={`${refreshing ? 'icon-rotate' : ''}`} style={{ color: '#818181' }} strokeWidth={1.7} />
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-[#8e78b7] text-white rounded-lg text-base" onClick={() => setShowModal(true)}>
            <Plus className="h-5 w-5" />
            Add Subgroup
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
              {filteredSubgroups.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {displayedSubgroups.map((subgroup, index) => (
                      <div key={index} className="bg-white rounded-lg border border-gray-100 transform transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 ${subgroup.bgcolor} rounded-full ${subgroup.iconcolor}`} aria-hidden="true">
                                <span className="text-sm md:text-base font-semibold">{getInitial(subgroup)}</span>
                              </div>
                              <h3 className="text-lg font-semibold">{subgroup.title}</h3>
                            </div>

                            <div className="relative">
                              <button onClick={() => setActiveMenu(activeMenu === `card-${index}` ? null : `card-${index}`)} className="rounded-full hover:bg-gray-100">
                                <MoreVertical className="h-5 w-5 text-gray-600" />
                              </button>
                              {activeMenu === `card-${index}` && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={handleClickOutside} />
                                  <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border z-20 animate-fadeIn">
                                    <div className="flex items-center p-1 gap-1">
                                      <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => {
                                        const subgroupData = tableData.find(sg => sg.name === subgroup.title);
                                        setSubgroupToEdit(subgroupData || { name: subgroup.title });
                                        setShowEditModal(true);
                                        setActiveMenu(null);
                                      }}>
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                      <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => {
                                        const subgroupData = tableData.find(sg => sg.name === subgroup.title);
                                        setSubgroupToDelete(subgroupData || { name: subgroup.title });
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

                          <p className="text-gray-500 mt-2 text-sm">{subgroup.description}</p>
                          <div className="flex items-center justify-between mt-6">
                            <div className="flex items-center gap-2">
                              <Icon icon="material-symbols:supervisor-account-outline" width="24" height="24" style={{ color: '#818181' }} />
                              <span className="text-sm">{subgroup.users.toString().padStart(2, "0")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {togglingStatus === subgroup.title ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#8e78b7]"></div>
                              ) : (
                                <div className={togglingStatus === subgroup.title ? 'toggle-disabled' : ''}>
                                  <Toggle
                                    enabled={togglingStatus === subgroup.title ? !subgroup.enabled : subgroup.enabled}
                                    onToggle={() => toggleRole(subgroup.title)}
                                    disabled={togglingStatus === subgroup.title}
                                    size="md"
                                  />
                                </div>
                              )}
                              <span className={`text-sm ${subgroup.enabled ? "text-[#1a9962]" : "text-gray-400"}`}>{subgroup.enabled ? "Enabled" : "Disabled"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredSubgroups.length > 0 && (
                    <div className="flex flex-col md:flex-row items-center justify-between mt-6 mb-6">
                      <div className="text-sm text-gray-500 mb-4 md:mb-0">
                        Showing {cardViewStartItem} to {cardViewEndItem} of {filteredSubgroups.length} subgroups
                      </div>

                      <div className="flex items-center space-x-4" style={{ transform: 'translateX(-20px)' }}>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-500">Show per page</label>
                          <div className="relative">
                            { /* cards pagination select - match Role.jsx (text-center, paddingRight: 24px) */ }
                            <select
                              value={itemsPerPage}
                              onChange={handleItemsPerPageChange}
                              className="border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-center pl-2 pr-8"
                              style={{ height: '31px', width: '55px', WebkitAppearance: 'none', appearance: 'none', paddingRight: '24px' }}
                            >
                              <option value={12} style={{ color: '#282F49' }}>12</option>
                              <option value={24} style={{ color: '#282F49' }}>24</option>
                              <option value={48} style={{ color: '#282F49' }}>48</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-700" style={{ top: '52%' }} size={14} />
                          </div>
                        </div>

                        <div className="flex items-center border border-gray-400 rounded-md bg-gray-50" style={{ height: '31px', width: '55px', overflow: 'hidden' }}>
                          <button onClick={handlePrevPage} disabled={currentPage === 1} title="Previous page" className={`flex-1 h-full flex items-center justify-center ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`} style={{ padding: 0, border: 'none' }}>
                            <ChevronLeft size={14} />
                          </button>
                          <button onClick={handleNextPage} disabled={currentPage >= cardViewTotalPages || cardViewTotalPages === 0} title="Next page" className={`flex-1 h-full flex items-center justify-center ${currentPage >= cardViewTotalPages || cardViewTotalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`} style={{ padding: 0, border: 'none', borderLeft: '1px solid rgba(156,163,175,0.45)' }}>
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
                  <p>No subgroups found matching "{searchTerm}"</p>
                  <button onClick={() => setSearchTerm("")} className="mt-2 text-[#8e78b7] hover:underline transition-all duration-200">Clear search</button>
                </div>
              )}
            </>
          )}

          {viewMode === 'list' && (
            <>
              <div className="bg-white rounded-lg shadow mt-0" style={{ overflow: 'visible' }}>
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#29304a] text-white text-sm">
                      <th className="text-left" style={{ padding: '16px 19.75px' }}>ID</th>
                      <th className="text-left" style={{ padding: '16px 19.75px' }}>Name</th>
                      <th className="text-left" style={{ padding: '16px 19.75px' }}>Parent Group</th>
                      <th className="text-left" style={{ padding: '16px 19.75px' }}>Description</th>
                      <th className="text-center" style={{ padding: '16px 19.75px' }}>Status</th>
                      <th className="text-left" style={{ padding: '16px 19.75px' }}>Created Date</th>
                      <th className="text-left" style={{ padding: '16px 19.75px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="p-4 text-center">
                          <div className="flex justify-center items-center h-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8e78b7]"></div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      listViewCurrentRows.map((subgroup, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td style={{ padding: '16px 19.75px' }} title={subgroup.id}>{subgroup.id.substring(0, 8)}...</td>
                          <td style={{ padding: '16px 19.75px' }} className="text-gray-600">
                            <div className="flex items-center">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#8d77ba] bg-opacity-25 text-[#8d77ba] mr-2" aria-hidden="true">
                                <span className="text-sm font-semibold">{getInitial(subgroup)}</span>
                              </div>
                              <div className="truncate">{subgroup.name}</div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 19.75px' }} className="text-gray-600">{subgroup.parentGroup}</td>
                          <td style={{ padding: '16px 19.75px' }} className="text-gray-600 max-w-xs truncate">{subgroup.description}</td>
                          <td style={{ padding: '16px 19.75px' }}>
                            <div className="text-center align-middle">
                              {subgroup.status === 'Enabled' ? (
                                <span className="inline-block px-6 py-2 rounded-md text-sm font-medium" style={{ background: '#def3e9', color: '#1a9962', minWidth: '88px', textAlign: 'center' }}>Enabled</span>
                              ) : (
                                <span className="inline-block px-6 py-2 rounded-md text-sm font-medium" style={{ background: '#f3f4f6', color: '#6b7280', minWidth: '88px', textAlign: 'center' }}>Disabled</span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '16px 19.75px' }} className="text-gray-600">{subgroup.createdDate}</td>
                          <td style={{ padding: '16px 19.75px' }}>
                            <div className="relative">
                              <button onClick={() => setActiveMenu(activeMenu === index ? null : index)} className="p-1.5 rounded-full hover:bg-gray-100">
                                <MoreHorizontal className="h-5 w-5 text-gray-600" />
                              </button>

                              {activeMenu === index && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={handleClickOutside} />
                                  <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border z-20 animate-fadeIn">
                                    <div className="flex items-center p-1 gap-1">
                                      <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => { setSubgroupToEdit(subgroup); setShowEditModal(true); setActiveMenu(null); }}>
                                        <Pencil className="h-4 w-4" />
                                      </button>

                                      <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2" onClick={async () => { setActiveMenu(null); await toggleRole(subgroup.name); }} disabled={togglingStatus === subgroup.name} title={subgroup.status === 'Enabled' ? 'Disable' : 'Enable'}>
                                        {togglingStatus === subgroup.name ? (
                                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#8e78b7]" />
                                        ) : (
                                          <Toggle
                                            enabled={togglingStatus === subgroup.name ? subgroup.status !== 'Enabled' : subgroup.status === 'Enabled'}
                                            onToggle={async () => { setActiveMenu(null); await toggleRole(subgroup.name); }}
                                            disabled={togglingStatus === subgroup.name}
                                            size="sm"
                                          />
                                        )}
                                      </button>

                                      <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => { setSubgroupToDelete(subgroup); setShowDeleteModal(true); setActiveMenu(null); }}>
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}

                    {!loading && listViewCurrentRows.length === 0 && (
                      <tr>
                        <td colSpan="7" className="p-4 text-center text-gray-500">
                          {searchTerm ? (
                            <div className="flex flex-col items-center justify-center py-8">
                              <Icon icon="material-symbols:search-off-outline" width="48" height="48" className="mb-4 text-gray-400" />
                              <p>No subgroups found matching "{searchTerm}"</p>
                              <button onClick={() => setSearchTerm("")} className="mt-2 text-[#8e78b7] hover:underline transition-all duration-200">Clear search</button>
                            </div>
                          ) : (
                            "No subgroups found"
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!loading && filteredTableData.length > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between mt-6 mb-6">
                  <div className="text-sm text-gray-500 mb-4 md:mb-0">
                    Showing {listViewStartItem} to {listViewEndItem} of {filteredTableData.length} subgroups
                  </div>

                  <div className="flex items-center space-x-4" style={{ transform: 'translateX(-20px)' }}>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-500">Show per page</label>
                      <div className="relative">
                        { /* list pagination select - match Role.jsx (text-center, paddingRight: 28px) */ }
                        <select
                          value={itemsPerPage}
                          onChange={handleItemsPerPageChange}
                          className="border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-center pl-2 pr-8"
                          style={{ height: '31px', width: '55px', WebkitAppearance: 'none', appearance: 'none', paddingRight: '28px' }}
                        >
                          <option value={12} style={{ color: '#282F49' }}>12</option>
                          <option value={24} style={{ color: '#282F49' }}>24</option>
                          <option value={48} style={{ color: '#282F49' }}>48</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-700" style={{ top: '52%' }} size={14} />
                      </div>
                    </div>

                    <div className="flex items-center border border-gray-400 rounded-md bg-gray-50" style={{ height: '31px', width: '55px', overflow: 'hidden' }}>
                      <button onClick={handlePrevPage} disabled={currentPage === 1} title="Previous page" className={`flex-1 h-full flex items-center justify-center ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`} style={{ padding: 0, border: 'none' }}>
                        <ChevronLeft size={14} />
                      </button>
                      <button onClick={handleNextPage} disabled={currentPage >= listViewTotalPages || listViewTotalPages === 0} title="Next page" className={`flex-1 h-full flex items-center justify-center ${currentPage >= listViewTotalPages || listViewTotalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`} style={{ padding: 0, border: 'none', borderLeft: '1px solid rgba(156,163,175,0.45)' }}>
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

      <AddSubgroup showModal={showModal} setShowModal={setShowModal} onSubgroupAdded={handleSave} />

      <DeleteSubgroup showModal={showDeleteModal} setShowModal={setShowDeleteModal} subgroupName={subgroupToDelete?.name || ""} onConfirm={refreshAllData} />

      <EditSubgroup showModal={showEditModal} setShowModal={setShowEditModal} subgroupData={subgroupToEdit} onSubgroupUpdated={handleEditSave} />
    </div>
  );
}

export default Subgroup;