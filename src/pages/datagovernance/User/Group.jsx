import React, { useState, useEffect, useRef } from "react";
import { MoreVertical, LayoutGrid, Plus, Info, MoreHorizontal, Pencil, Trash2, RefreshCcw, ChevronLeft, ChevronRight, List , ChevronDown} from "lucide-react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";
import AddGroup from "./Components/Group/AddGroup";
import DeleteGroup from "./Components/Group/DeleteGroup";
import EditGroup from "./Components/Group/EditGroup";
import { useAuth } from "../../../context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Search from "../../../assets/governance/search.svg"

const rotateAnimation = `
  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(-360deg);
    }
  }

  .icon-rotate {
    animation: rotate 1s linear infinite;
  }

  /* make the icon appear thinner: scale down and reduce stroke if present */
  .icon-rotate svg {
    transform-origin: center;
    transform: scale(0.88);
  }

  .icon-rotate svg path,
  .icon-rotate svg g {
    stroke-width: 0.75px !important;
    vector-effect: non-scaling-stroke;
  }
  /* non-rotating refresh icon stroke width */
  .refresh-icon svg path,
  .refresh-icon svg g {
    stroke-width: 75px !important;
    vector-effect: non-scaling-stroke;
  }

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

function Group() {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [groupToEdit, setGroupToEdit] = useState(null);
  const [group, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('cards');
  // const rowsPerPage = 10;
  const [togglingStatus, setTogglingStatus] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const { token } = useAuth();
  const { decodedToken } = useAuth();
  const updated_by = decodedToken?.preferred_username; 

  // const [visibleCards, setVisibleCards] = useState(9);
  // const [currentCardPage, setCurrentCardPage] = useState(1); 
  // const cardsPerPage = 9;
  const [activeMenu, setActiveMenu] = useState(null);
  const [showViewModeMenu, setShowViewModeMenu] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const initialFetchDoneRef = useRef(false);

  const filteredGroups = group.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTableData = tableData.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // const handleViewMore = () => {
  //   setVisibleCards(prev => prev + cardsPerPage);
  // };

  // const displayedGroups = filteredGroups.slice(0, visibleCards);
  // const hasMoreCards = visibleCards < filteredGroups.length;

  const cardViewTotalPages = Math.ceil(filteredGroups.length / itemsPerPage);
  const cardViewStartIndex = (currentPage - 1) * itemsPerPage;
  const cardViewEndIndex = cardViewStartIndex + itemsPerPage;
  const displayedGroups = filteredGroups.slice(cardViewStartIndex, cardViewEndIndex);

  const listViewTotalPages = Math.ceil(filteredTableData.length / itemsPerPage);
  const listViewStartIndex = (currentPage - 1) * itemsPerPage;
  const listViewEndIndex = listViewStartIndex + itemsPerPage;
  const listViewCurrentRows = filteredTableData.slice(listViewStartIndex, listViewEndIndex);

  //   const goToNextCardPage = () => {
  //   if (currentCardPage < totalCardPages) {
  //     setCurrentCardPage(currentCardPage + 1);
  //     window.scrollTo({ top: 0, behavior: 'smooth' }); // optional: scroll to top
  //   }
  // };

  // const goToPreviousCardPage = () => {
  //   if (currentCardPage > 1) {
  //     setCurrentCardPage(currentCardPage - 1);
  //     window.scrollTo({ top: 0, behavior: 'smooth' }); // optional: scroll to top
  //   }
  // };

  const handleClickOutside = () => {
    setActiveMenu(null);
    setShowViewModeMenu(false);
  };

  // const toggleRole = async (index) => {
  //   const groupToUpdate = group[index];
  //   const newStatus = !groupToUpdate.enabled;

  //   setTogglingStatus(index);

  //   try {
  //     const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/groupstatus`, {
  //       method: "PATCH",
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         name: groupToUpdate.title,
  //         status: newStatus ? "Enabled" : "Disabled"

  //       }),
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json().catch(() => ({}));
  //       throw new Error(errorData.detail || `Error: ${response.status} ${response.statusText}`);
  //     }

  //     const newGroup = [...group];
  //     newGroup[index].enabled = newStatus;
  //     setGroups(newGroup);

  //     const updatedTableData = tableData.map(item => {
  //       if (item.name === groupToUpdate.title) {
  //         return {
  //           ...item,
  //           status: newStatus ? "Enabled" : "Disabled"
  //         };
  //       }
  //       return item;
  //     });
  //     setTableData(updatedTableData);

  //   } catch (error) {
  //     console.error("Error updating group status:", error);
  //   } finally {
  //     setTogglingStatus(null);
  //   }
  // };
  const toggleRole = async (identifier) => {
    // identifier is group.title (stable name) instead of displayed index
    const index = group.findIndex(g => g.title === identifier);
    if (index === -1) return;

    const groupToUpdate = group[index];
    const newStatus = !groupToUpdate.enabled;

    setTogglingStatus(identifier);

    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/groupstatus`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: groupToUpdate.title,
          status: newStatus ? "Enabled" : "Disabled",
          updated_by: updated_by
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error: ${response.status} ${response.statusText}`);
      }

      const newGroup = [...group];
      newGroup[index].enabled = newStatus;
      setGroups(newGroup);

      const updatedTableData = tableData.map(item => {
        if (item.name === groupToUpdate.title) {
          return {
            ...item,
            status: newStatus ? "Enabled" : "Disabled"
          };
        }
        return item;
      });
      setTableData(updatedTableData);

    } catch (error) {
      console.error("Error updating group status:", error);
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;

    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/deletegroup`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },body: JSON.stringify({
          name: groupToDelete.name,
          updated_by: updated_by,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error: ${response.status} ${response.statusText}`);
      }

      await refreshAllData();

      return true;
    } catch (error) {
      console.error("Error deleting group:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (!initialFetchDoneRef.current) {
      initialFetchDoneRef.current = true;
      Promise.all([
        FetchRoleDashboardData(),
        fetchGroupList()
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, []);

  const FetchRoleDashboardData = async () => {
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/groupshomepage`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch group dashboard data: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();

      const transformedData = data.map((group) => ({
        title: group.name,
        description:
          group.attributes?.Description?.[0] ||
          group.attributes?.description?.[0] ||
          "No description available",
        users: group.user_count,
        enabled: group.attributes?.Status?.[0] === "Enabled",
        icon: "material-symbols:tab-group-outline",
        bgcolor: "bg-[#8d77ba] bg-opacity-25",
        iconcolor: "text-[#8d77ba]",
      }));

      setGroups(transformedData);
      return { success: true };
    } catch (error) {
      console.error("Error fetching group data:", error);
      return { success: false, error: error.message };
    }
  };

  const fetchGroupList = async () => {
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/grouplist`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch group list data: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();

      const transformedData = data.map((group) => {
        const createdOnValue =
          group.attributes?.createdOn?.[0] ||
          "";

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
          id: group.id,
          name: group.name,
          description: group.attributes?.Description?.[0] ||
            group.attributes?.description?.[0] ||
            "No description available",
          status: group.attributes?.Status?.[0] === "Enabled" ? "Enabled" : "Disabled",
          subGroup: group.subgroups?.join(", ") || "None",
          createdDate: formattedDate,
          updatedDate: "",
        };
      });

      setTableData(transformedData);

      return { success: true };
    } catch (error) {
      console.error("Error fetching group list:", error);
      return { success: false, error: error.message };
    }
  };

  const refreshAllData = async () => {
    setRefreshing(true);
    setSearchTerm("");
    setCurrentPage(1);
    try {
      const [dashboardResult, listResult] = await Promise.all([
        FetchRoleDashboardData(),
        fetchGroupList()
      ]);

      if (dashboardResult.success && listResult.success) {
        setToast({
          show: true,
          message: 'Group data refreshed successfully',
          type: 'success'
        });
      } else {
        const errorMessages = [];
        if (!dashboardResult.success) errorMessages.push('dashboard data');
        if (!listResult.success) errorMessages.push('list data');

        setToast({
          show: true,
          message: `Failed to refresh group ${errorMessages.join(' and ')}`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
      setToast({
        show: true,
        message: 'Failed to refresh group data',
        type: 'error'
      });
    } finally {
      setRefreshing(false);

      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
    }
  };

  // const indexOfLastRow = currentPage * rowsPerPage;
  // const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  // const currentRows = filteredTableData.slice(indexOfFirstRow, indexOfLastRow);
  // const totalPages = Math.ceil(filteredTableData.length / rowsPerPage);

  // const goToNextPage = () => {
  //   if (currentPage < totalPages) {
  //     setCurrentPage(currentPage + 1);
  //   }
  // };

  // const goToPreviousPage = () => {
  //   if (currentPage > 1) {
  //     setCurrentPage(currentPage - 1);
  //   }
  // };


  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    const maxPages = viewMode === 'cards' ? cardViewTotalPages : listViewTotalPages;
    if (currentPage < maxPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPage = (pageNum) => {
    setCurrentPage(pageNum);
  };

  const cardViewStartItem = filteredGroups.length === 0 ? 0 : cardViewStartIndex + 1;
  const cardViewEndItem = Math.min(cardViewEndIndex, filteredGroups.length);

  // For list view info
  const listViewStartItem = filteredTableData.length === 0 ? 0 : listViewStartIndex + 1;
  const listViewEndItem = Math.min(listViewEndIndex, filteredTableData.length);

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to page 1
  };

  const handleSave = async (result) => {

    if (result.success) {
      try {
        await refreshAllData();
        setToast({
          show: true,
          message: result.message || 'Group created successfully',
          type: 'success'
        });
        setShowModal(false);

        setTimeout(() => {
          setToast({ show: false, message: '', type: '' });
        }, 3000);
      } catch (error) {
        console.error('Error refreshing data after group creation:', error);
        setToast({
          show: true,
          message: 'Group created but failed to refresh data',
          type: 'error'
        });

        setTimeout(() => {
          setToast({ show: false, message: '', type: '' });
        }, 3000);
      }
    }
  };

  const handleEditSave = async () => {
    try {
      await refreshAllData();
      setToast({
        show: true,
        message: 'Group updated successfully',
        type: 'success'
      });
      setShowEditModal(false);

      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('Error refreshing data after group update:', error);
      setToast({
        show: true,
        message: 'Group updated but failed to refresh data',
        type: 'error'
      });

      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
    }
  };

  const getInitial = (g) => {
    // prefer title -> name -> id, then find the first alphanumeric (letter or number)
    const str = (g?.title || g?.name || g?.id || "").toString();
    // find first alphanumeric character (ignore spaces and special chars)
    const match = str.match(/[A-Za-z0-9]/);
    return match ? match[0].toUpperCase() : "";
  };

  return (
    //changed bg color and and reduced padding to p-4 , initially was p-6
    // <div className="p-4 bg-[#F3F5F7] min-h-screen">
    <div className="p-4  min-h-screen">
      <style>{rotateAnimation}</style>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn ${toast.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' :
          'bg-red-100 text-red-800 border-l-4 border-red-500'
          }`}>
          <Icon
            icon={toast.type === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'}
            className="h-5 w-5"
          />
          <p>{toast.message}</p>
          <button
            onClick={() => setToast({ show: false, message: '', type: '' })}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            <Icon icon="mdi:close" className="h-4 w-4" />
          </button>
        </div>
      )}

      <Breadcrumb />
      {/* changed mb-6 to mb-4 */}
      <div className="flex items-center justify-between mb-[18px]">
        <h1 className="text-2xl font-semibold">Group</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <img src={Search} alt="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 h-10 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              placeholder="Search group"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon icon="mdi:close" width="16" height="16" />
              </button>
            )}
          </div>

          {/* <button
            className={` flex items-center justify-center p-1 px-1.5 rounded-lg border ${viewMode === 'list' ? 'bg-gray-100 border-gray-500' : 'border-gray-400'} hover:bg-gray-50`}
            onClick={() => setViewMode(viewMode === 'cards' ? 'list' : 'cards')}
            style={{
              width: '40px',
              height: '40px' ,
              borderRadius: '8px',
              padding: '8px',
            }}
            title={viewMode === 'cards' ? "Switch to List View" : "Switch to Card View"}
          >
            <Icon
              icon="material-symbols-light:format-list-bulleted"
              width="24"
              height="24"
              style={{ color: '#818181' }}
              strokeWidth={3.5}
            />
          </button> */}
          <div className="relative">
            <button
              className={`flex items-center justify-center p-1 px-1.5 rounded-lg border border-gray-400 bg-gray-50 hover:bg-gray-100`}
              onClick={() => setShowViewModeMenu(prev => !prev)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                padding: '8px',
              }}
              title="Choose view mode"
            >
              {/* show grid icon by default for card view */}
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
                  <button
                    className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 hover:bg-gray-100 ${viewMode === 'list' ? 'bg-gray-50' : ''}`}
                    onClick={() => { setViewMode('list'); setShowViewModeMenu(false); }}
                  >
                    <span className="flex items-center gap-2">
                      <List className="h-4 w-4" />

                      List
                    </span>
                    {viewMode === 'list' && <Icon icon="mdi:check" width="14" height="14" />}
                  </button>
                  <button
                    className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 hover:bg-gray-100 ${viewMode === 'cards' ? 'bg-gray-50' : ''}`}
                    onClick={() => { setViewMode('cards'); setShowViewModeMenu(false); }}
                  >
                    <span className="flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4" />
                      Cards
                    </span>
                    {viewMode === 'cards' && <Icon icon="mdi:check" width="14" height="14" />}
                  </button>
                </div>
              </>
            )}
          </div>



          <button
            className={`flex items-center justify-center p-1 px-1.5 rounded-lg border ${refreshing ? 'bg-gray-50 border-gray-400' : 'bg-gray-50 border-gray-400'
              } hover:bg-gray-100`}
            onClick={refreshAllData}
            disabled={refreshing}
            title="Refresh"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              padding: '8px',
            }}
          >
            <RefreshCcw
              size={20}
              className={`${refreshing ? 'icon-rotate' : ''}`}
              style={{ color: '#818181' }}
              strokeWidth={1.7}
            />
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-[#8e78b7] text-white rounded-lg"
            onClick={() => setShowModal(true)}
          >
            <Plus className="h-5 w-5" />
            Add Group
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
              {filteredGroups.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {displayedGroups.map((group, index) => (
                      <div
                          key={index}
                          className="bg-white rounded-lg border border-gray-100 transform transition-all duration-300 hover:shadow-md hover:-translate-y-1 overflow-hidden"
                        >
                                                <div className="p-4">
                                                  <div className="flex items-start justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                                                      <div
                          className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 ${group.bgcolor} rounded-full ${group.iconcolor} flex-shrink-0`}
                          aria-hidden="true"
                        >
                                <span className="text-sm md:text-base font-semibold">
                                  {getInitial(group)}
                                </span>
                              </div>
                              <h3 className="text-lg font-semibold truncate">{group.title}</h3>
                            </div>

                            <div className="relative flex-shrink-0">
                              <button
                                onClick={() => setActiveMenu(activeMenu === `card-${index}` ? null : `card-${index}`)}
                                className="p-1.5 rounded-full hover:bg-gray-100"
                              >
                                <MoreVertical className="h-5 w-5 text-gray-600" />
                              </button>
                              {activeMenu === `card-${index}` && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={handleClickOutside} />
                                  <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border z-20 animate-fadeIn">
                                    <div className="flex items-center p-1 gap-1">
                                      <button
                                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                        onClick={() => {
                                          const groupData = tableData.find(g => g.name === group.title);
                                          setGroupToEdit(groupData || { name: group.title });
                                          setShowEditModal(true);
                                          setActiveMenu(null);
                                        }}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                      <button
                                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                        onClick={() => {
                                          const groupData = tableData.find(g => g.name === group.title);
                                          setGroupToDelete(groupData || { name: group.title });
                                          setShowDeleteModal(true);
                                          setActiveMenu(null);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-500 mt-4 text-sm line-clamp-2">{group.description}</p>
                          <div className="flex items-center justify-between mt-6">
                            <div className="flex items-center gap-2">
                              <Icon
                                icon="material-symbols:supervisor-account-outline"
                                width="24"
                                height="24"
                                style={{ color: '#818181' }}
                              />

                              <span className="text-sm">
                                {group.users.toString().padStart(2, "0")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm ${group.enabled ? "text-[#1a9962]" : "text-gray-400"}`}
                                >
                                  {group.enabled ? "Enabled" : "Disabled"}
                                </span>
                                <div className={togglingStatus === group.title ? 'toggle-disabled' : ''}>
                                  <Toggle
                                    enabled={togglingStatus === group.title ? !group.enabled : group.enabled}
                                    onToggle={() => toggleRole(group.title)}
                                    disabled={togglingStatus === group.title}
                                    size="md"
                                  />
                                </div>
                              </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* {hasMoreCards && (
                    <div className="flex justify-center mt-4 mb-6">
                      <button
                        onClick={handleViewMore}
                        className="flex items-center gap-2 px-6 py-2 bg-white border border-[#8e78b7] text-[#8e78b7] rounded-lg hover:bg-[#8e78b7] hover:text-white transition-all duration-200"
                      >
                        View More
                        <Icon icon="material-symbols:keyboard-arrow-down" width="20" height="20" />
                      </button>
                    </div>
                  )} */}
                  {filteredGroups.length > 0 && (
                    <div className="flex flex-col md:flex-row items-center justify-between mt-6 mb-6">
                      {/* Left: Info text */}
                      <div className="text-sm text-gray-500 mb-4 md:mb-0">
                        Showing {cardViewStartItem} to {cardViewEndItem} of {filteredGroups.length} groups
                      </div>

                      {/* Right: Show per page + Navigation */}
                      <div className="flex items-center space-x-4" style={{ transform: 'translateX(-20px)' }} >
                        {/* Show per page dropdown */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-500">Show per page</label>
                          <div className="relative">
                            <select
                              value={itemsPerPage}
                              onChange={handleItemsPerPageChange}
                              className="border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-left pl-2 pr-8"
                              style={{ height: '31px', width: '55px', WebkitAppearance: 'none', appearance: 'none', paddingRight: '28px'}}
                            >
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

                        {/* Navigation buttons */}
                        <div
                          className="flex items-center border border-gray-400 rounded-md bg-gray-50"
                          style={{ height: '31px', width: '55px', overflow: 'hidden' }}
                        >
                          <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            title="Previous page"
                            className={`flex-1 h-full flex items-center justify-center ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                            style={{ padding: 0, border: 'none' }}
                          >
                            <ChevronLeft size={14} />
                          </button>

                          <button
                            onClick={handleNextPage}
                            disabled={currentPage >= cardViewTotalPages || cardViewTotalPages === 0}
                            title="Next page"
                            className={`flex-1 h-full flex items-center justify-center ${currentPage >= cardViewTotalPages || cardViewTotalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                            style={{ padding: 0, border: 'none', borderLeft: '1px solid rgba(156,163,175,0.45)' }}
                          >
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
                  <p>No groups found matching "{searchTerm}"</p>
                  <button
                    onClick={() => setSearchTerm("")}
                    className="mt-2 text-[#8e78b7] hover:underline transition-all duration-200"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {viewMode === 'list' && (
        <>
          <div className="bg-white rounded-lg shadow mt-0 overflow-x-auto" style={{ overflowY: 'visible' }}>
        <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-[#29304a] text-white text-sm">
                {/* enforce 19.75px horizontal spacing between cells */}
                <th className="text-left" style={{ padding: '16px 19.75px' }}>ID</th>
                <th className="text-left" style={{ padding: '16px 19.75px' }}>Name</th>
                <th className="text-left" style={{ padding: '16px 19.75px' }}>Description</th>
                <th className="text-center" style={{ padding: '16px 19.75px' }}>Status</th>
                <th className="text-left" style={{ padding: '16px 19.75px' }}>Sub group</th>
                <th className="text-left" style={{ padding: '16px 19.75px' }}>Created Date</th>
                <th className="text-left" style={{ padding: '16px 19.75px' }}>Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-4 text-center">
                    <div className="flex justify-center items-center h-20">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8e78b7]"></div>
                    </div>
                  </td>
                </tr>
              ) : (
                listViewCurrentRows.map((group, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    {/* apply same horizontal padding to every cell so gap between "textboxes" = 19.75px */}
                    <td style={{ padding: '16px 19.75px' }} title={group.id}>{group.id.substring(0, 8)}...</td>
                    <td style={{ padding: '16px 19.75px' }} className="text-gray-600">
                      <div className="flex items-center">
                        <div
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-[#8d77ba] bg-opacity-25 text-[#8d77ba] mr-2"
                          aria-hidden="true"
                        >
                          <span className="text-sm font-semibold">{getInitial(group)}</span>
                        </div>
                        <div className="truncate">{group.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 19.75px' }} className="text-gray-600 max-w-xs truncate">{group.description}</td>
                    <td style={{ padding: '16px 19.75px' }}>
                      {/* center the pill under the Status header and vertically align */}
                      <div className="text-center align-middle">
                        {group.status === 'Enabled' ? (
                          <span
                            className="inline-block px-6 py-2 rounded-md text-sm font-medium"
                            style={{ background: '#def3e9', color: '#1a9962', minWidth: '88px', textAlign: 'center' }}
                            title="Enabled"
                          >
                            Enabled
                          </span>
                        ) : (
                          <span
                            className="inline-block px-6 py-2 rounded-md text-sm font-medium"
                            style={{ background: '#f3f4f6', color: '#6b7280', minWidth: '88px', textAlign: 'center' }}
                            title="Disabled"
                          >
                            Disabled
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 19.75px' }} className="text-gray-600 max-w-xs truncate">{group.subGroup}</td>
                    <td style={{ padding: '16px 19.75px' }} className="text-gray-600">{group.createdDate}</td>

                    <td style={{ padding: '16px 19.75px' }}>
                       <div className="relative">
                         <button
                           onClick={() => setActiveMenu(activeMenu === index ? null : index)}
                           className="p-1.5 rounded-full hover:bg-gray-100"
                         >
                           <MoreHorizontal className="h-5 w-5 text-gray-600" />
                         </button>

                         {activeMenu === index && (
                           <>
                             <div className="fixed inset-0 z-10" onClick={handleClickOutside} />
                             <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border z-20 animate-fadeIn">
                               <div className="flex items-center p-1 gap-1">
                                 <button
                                   className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                   onClick={() => {
                                     setGroupToEdit(group);
                                     setShowEditModal(true);
                                     setActiveMenu(null);
                                   }}
                                 >
                                   <Pencil className="h-4 w-4" />
                                 </button>
                                 <button
                                 className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                                 disabled={togglingStatus === group.name}
                                 onClick={async () => {
                                   setActiveMenu(null);
                                   await toggleRole(group.name);
                                 }}
                                 title={group.status === 'Enabled' ? 'Disable' : 'Enable'}
                               >
                                 <Toggle
                                   enabled={togglingStatus === group.name ? group.status !== 'Enabled' : group.status === 'Enabled'}
                                   onToggle={async () => { setActiveMenu(null); await toggleRole(group.name); }}
                                   disabled={togglingStatus === group.name}
                                   size="sm"
                                 />
                               </button>

                              <button
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                onClick={() => {
                                  setGroupToDelete(group);
                                  setShowDeleteModal(true);
                                  setActiveMenu(null);
                                }}
                              >
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
                      <>
                        <div className="flex flex-col items-center justify-center py-8">
                          <Icon icon="material-symbols:search-off-outline" width="48" height="48" className="mb-4 text-gray-400" />
                          <p>No groups found matching "{searchTerm}"</p>
                          <button
                            onClick={() => setSearchTerm("")}
                            className="mt-2 text-[#8e78b7] hover:underline transition-all duration-200"
                          >
                            Clear search
                          </button>
                        </div>
                      </>
                    ) : (
                      "No groups found"
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div> 
          

        {!loading && filteredTableData.length > 0 && (
      <div className="flex flex-col md:flex-row items-center justify-between mt-6 mb-6">
        {/* Left: Info text */}
        <div className="text-sm text-gray-500 mb-4 md:mb-0">
          Showing {listViewStartItem} to {listViewEndItem} of {filteredTableData.length} groups
        </div>

        {/* Right: Show per page + Navigation (match cards layout) */}
        <div className="flex items-center space-x-4" style={{ transform: 'translateX(-20px)' }} >
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Show per page</label>
            <div className="relative">
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-left pl-2 pr-8"
                style={{ height: '31px', width: '55px', WebkitAppearance: 'none', appearance: 'none', paddingRight: '28px' }}
              >
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

          <div
            className="flex items-center border border-gray-400 rounded-md bg-gray-50"
            style={{ height: '31px', width: '55px', overflow: 'hidden' }}
          >
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              title="Previous page"
              className={`flex-1 h-full flex items-center justify-center ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
              style={{ padding: 0, border: 'none' }}
            >
              <ChevronLeft size={14} />
            </button>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= listViewTotalPages || listViewTotalPages === 0}
              title="Next page"
              className={`flex-1 h-full flex items-center justify-center ${currentPage >= listViewTotalPages || listViewTotalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
              style={{ padding: 0, border: 'none', borderLeft: '1px solid rgba(156,163,175,0.45)' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    )}
  </>
)}


      <AddGroup
        showModal={showModal}
        setShowModal={setShowModal}
        onGroupAdded={handleSave}
      />

      <DeleteGroup
        showModal={showDeleteModal}
        setShowModal={setShowDeleteModal}
        groupName={groupToDelete?.name || ""}
        onConfirm={handleDeleteGroup}
      />

      <EditGroup
        showModal={showEditModal}
        setShowModal={setShowEditModal}
        groupData={groupToEdit}
        onGroupEdited={handleEditSave}
      />
    </div>
  );
}

export default Group;