import React, { useState, useEffect, useRef } from "react";
import { MoreVertical, Search, Plus, MoreHorizontal, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
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

const Toggle = ({ enabled, onToggle }) => {
  return (
    <div
      onClick={onToggle}
      className={`relative inline-flex h-5 w-10 cursor-pointer rounded-full transition-colors ease-in-out duration-200 ${
        enabled ? "bg-[#1a9962]" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ease-in-out duration-200 m-0.5 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
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
  const [viewMode, setViewMode] = useState('both');
  const rowsPerPage = 10;
  const [togglingStatus, setTogglingStatus] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const { token } = useAuth();
  const [visibleCards, setVisibleCards] = useState(9);
  const cardsPerPage = 9;

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
    setVisibleCards(cardsPerPage);
  }, [searchTerm]);

  const handleViewMore = () => {
    setVisibleCards(prev => prev + cardsPerPage);
  };

  const displayedSubgroups = filteredSubgroups.slice(0, visibleCards);
  const hasMoreCards = visibleCards < filteredSubgroups.length;

  const [activeMenu, setActiveMenu] = useState(null);
  const handleClickOutside = () => {
    setActiveMenu(null);
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
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/auth/subgroupshomepage`, {
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
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/auth/subgrouplist`, {
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
      console.log("Fetched subgroup list data:", transformedData);
      return { success: true };
    } catch (error) {
      console.error("Error fetching subgroup list data:", error);
      return { success: false, error: error.message };
    }
  };

  const refreshAllData = async () => {
    setRefreshing(true);
    setSearchTerm("");
    setVisibleCards(cardsPerPage);
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
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/auth/subgroupstatus`, {
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

  const toggleRole = async (index) => {
    const subgroup = subgroups[index];
    const newStatus = !subgroup.enabled;

    setTogglingStatus(index);

    try {
      const result = await updateSubgroupStatus(subgroup.title, newStatus);

      if (result.success) {
        const newSubgroups = [...subgroups];
        newSubgroups[index].enabled = newStatus;
        setSubgroups(newSubgroups);

        setToast({
          show: true,
          message: `Subgroup status ${newStatus ? 'enabled' : 'disabled'} successfully`,
          type: 'success'
        });

        await refreshAllData();
      } else {
        setToast({
          show: true,
          message: `Failed to update status: ${result.error}`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error("Error in toggle operation:", error);
      setToast({
        show: true,
        message: `Error toggling status: ${error.message}`,
        type: 'error'
      });
    } finally {
      setTogglingStatus(null);

      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
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

  const handleSave = async (result) => {
    console.log('Subgroup creation result:', result);

    if (result.success) {
      try {
        await refreshAllData();
        setToast({
          show: true,
          message: result.message || 'Subgroup created successfully',
          type: 'success'
        });
        setShowModal(false);

        setTimeout(() => {
          setToast({ show: false, message: '', type: '' });
        }, 3000);
      } catch (error) {
        console.error('Error refreshing data after subgroup creation:', error);
        setToast({
          show: true,
          message: 'Subgroup created but failed to refresh data',
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
        message: 'Subgroup updated successfully',
        type: 'success'
      });
      setShowEditModal(false);

      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('Error refreshing data after subgroup update:', error);
      setToast({
        show: true,
        message: 'Subgroup updated but failed to refresh data',
        type: 'error'
      });

      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
    }
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredTableData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredTableData.length / rowsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="p-6">
      <style>{rotateAnimation}</style>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn ${
          toast.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' :
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

      <Breadcrumb/>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Subgroup</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 h-10 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              placeholder="Search subgroup"
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

          <button
            className={`p-1 px-1.5 rounded-lg border ${viewMode === 'list' ? 'bg-gray-100 border-gray-500' : 'border-gray-400'} hover:bg-gray-50`}
            onClick={() => setViewMode(viewMode === 'both' ? 'list' : 'both')}
            title={viewMode === 'both' ? "Hide Cards View" : "Show Both Views"}
          >
            <Icon
              icon="material-symbols-light:format-list-bulleted"
              width="24"
              height="24"
              className="text-gray-600"
            />
          </button>

          <button
            className="p-1 px-1.5 rounded-lg border border-gray-400 hover:bg-gray-50"
            onClick={refreshAllData}
            disabled={refreshing}
            title="Refresh"
          >
            <Icon
              icon="material-symbols:autorenew-rounded"
              width="24"
              height="24"
              className={`text-gray-600 ${refreshing ? 'icon-rotate' : ''}`}
            />
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-[#8e78b7] text-white rounded-lg"
            onClick={() => setShowModal(true)}
          >
            <Plus className="h-5 w-5" />
            Add Subgroup
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6a8caf]"></div>
        </div>
      ) : (
        <>
          {(viewMode === 'cards' || viewMode === 'both') && (
            <>
              {filteredSubgroups.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedSubgroups.map((subgroup, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 ${subgroup.bgcolor} rounded-full ${subgroup.iconcolor} mr-2`}
                              >
                                <Icon icon={subgroup.icon} />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold">{subgroup.title}</h3>
                              </div>
                            </div>

                            <div className="relative">
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
                                          const subgroupData = tableData.find(sg => sg.name === subgroup.title);
                                          setSubgroupToEdit(subgroupData || { name: subgroup.title });
                                          setShowEditModal(true);
                                          setActiveMenu(null);
                                        }}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                      <button
                                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                        onClick={() => {
                                          const subgroupData = tableData.find(sg => sg.name === subgroup.title);
                                          setSubgroupToDelete(subgroupData || { name: subgroup.title });
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
                          <p className="text-gray-500 mt-4 text-sm">{subgroup.description}</p>
                          <div className="flex items-center justify-between mt-6">
                            <div className="flex items-center gap-2">
                              <Icon
                                icon="material-symbols:supervisor-account-outline"
                                width="24"
                                height="24"
                              />
                              <span className="text-sm">
                                {subgroup.users.toString().padStart(2, "0")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {togglingStatus === index ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#6a8caf]"></div>
                              ) : (
                                <Toggle
                                  enabled={subgroup.enabled}
                                  onToggle={() => toggleRole(index)}
                                />
                              )}
                              <span
                                className={`text-sm ${
                                  subgroup.enabled ? "text-[#1a9962]" : "text-gray-400"
                                }`}
                              >
                                {subgroup.enabled ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {hasMoreCards && (
                    <div className="flex justify-center mt-4 mb-6">
                      <button
                        onClick={handleViewMore}
                        className="flex items-center gap-2 px-6 py-2 bg-white border border-[#8e78b7] text-[#8e78b7] rounded-lg hover:bg-[#8e78b7] hover:text-white transition-all duration-200"
                      >
                        View More
                        <Icon icon="material-symbols:keyboard-arrow-down" width="20" height="20" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 transition-opacity duration-300">
                  <Icon icon="material-symbols:search-off-outline" width="48" height="48" className="mb-4 text-gray-400" />
                  <p>No subgroups found matching "{searchTerm}"</p>
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

      {(viewMode === 'list' || viewMode === 'both') && (
        <div className={`bg-white rounded-lg shadow overflow-hidden ${viewMode === 'both' ? 'mt-8' : 'mt-0'}`}>
          <table className="w-full">
            <thead>
              <tr className="bg-[#29304a] text-white text-sm">
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Parent Group</th>
                <th className="text-left py-3 px-4">Description</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Created Date</th>
                <th className="text-left py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-4 text-center">
                    <div className="flex justify-center items-center h-20">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6a8caf]"></div>
                    </div>
                  </td>
                </tr>
              ) : currentRows.length > 0 ? (
                currentRows.map((subgroup, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4" title={subgroup.id}>{subgroup.id.substring(0, 8)}...</td>
                    <td className="py-3 px-4 text-gray-600">{subgroup.name}</td>
                    <td className="py-3 px-4 text-gray-600">{subgroup.parentGroup}</td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{subgroup.description}</td>
                    <td className="py-3 px-4 text-gray-600">{subgroup.status}</td>
                    <td className="py-3 px-4 text-gray-600">{subgroup.createdDate}</td>
                    <td className="py-3 px-4">
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
                                  onClick={() => handleEditClick(subgroup)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                  onClick={() => handleDeleteClick(subgroup)}
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
              ) : (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-gray-500">
                    {searchTerm ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Icon icon="material-symbols:search-off-outline" width="48" height="48" className="mb-4 text-gray-400" />
                        <p>No subgroups found matching "{searchTerm}"</p>
                        <button
                          onClick={() => setSearchTerm("")}
                          className="mt-2 text-[#8e78b7] hover:underline transition-all duration-200"
                        >
                          Clear search
                        </button>
                      </div>
                    ) : (
                      "No subgroups data available"
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {!loading && filteredTableData.length > 0 && (
            <div className="flex justify-end items-center p-4">
              <div className="flex items-center space-x-1">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md ${
                        currentPage === pageNum
                          ? 'bg-[#6a8caf] text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`p-2 rounded-md ${
                    currentPage === totalPages || totalPages === 0
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <AddSubgroup
        showModal={showModal}
        setShowModal={setShowModal}
        onSubgroupAdded={handleSave}
      />

      <DeleteSubgroup
        showModal={showDeleteModal}
        setShowModal={setShowDeleteModal}
        subgroupName={subgroupToDelete?.name || ""}
        onConfirm={refreshAllData}
      />

      <EditSubgroup
        showModal={showEditModal}
        setShowModal={setShowEditModal}
        subgroupData={subgroupToEdit}
        onSubgroupUpdated={handleEditSave}
      />
    </div>
  );
}

export default Subgroup;