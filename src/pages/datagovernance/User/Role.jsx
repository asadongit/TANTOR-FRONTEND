import React, { useState, useEffect, useRef } from "react";
import { PlusCircle, MoreVertical, Users, Search, Plus, Trash2, Pencil, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";
import AddRole from "./Components/Role/AddRole";
import EditRole from "./Components/Role/EditRole";
import { useAuth } from "../../../context/AuthContext";

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

const Role = () => {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const initialFetchDoneRef = useRef(false);
  const { token } = useAuth();
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('cards');
  const [refreshing, setRefreshing] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [togglingStatus, setTogglingStatus] = useState(null);
  const rowsPerPage = 10;

  const filteredRoles = roles.filter(role =>
    role.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRole = async (index) => {
    const roleToUpdate = roles[index];
    const newStatus = !roleToUpdate.enabled;

    setTogglingStatus(index);

    try {
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/auth/rolestatus`, {
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

      // Update card view
      const newRoles = [...roles];
      newRoles[index].enabled = newStatus;
      newRoles[index].attributes.Status = [newStatus ? "Enabled" : "Disabled"];
      setRoles(newRoles);

      // Update list view
      const updatedTableData = tableData.map(item => {
        if (item.name === roleToUpdate.title) {
          return {
            ...item,
            status: newStatus ? "Enabled" : "Disabled"
          };
        }
        return item;
      });
      setTableData(updatedTableData);

    } catch (error) {
      console.error("Error updating role status:", error);
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleClickOutside = () => {
    setActiveMenu(null);
  };

  useEffect(() => {
    if (!initialFetchDoneRef.current) {
      initialFetchDoneRef.current = true;
      Promise.all([
        FetchRoleDashboardData(),
        fetchRoleListData()
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, []);

  const FetchRoleDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/auth/roleshomepage`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();

      const transformedRoles = data.map(role => ({
        title: role.name,
        description: role.description || "No description available",
        users: role.user_count,
        enabled: role.attributes?.Status?.[0] === "Enabled",
        attributes: role.attributes || { Status: ["Disabled"] },
        icon: "material-symbols:tab-group-outline",
        bgcolor: "bg-[#8d77ba] bg-opacity-25",
        iconcolor: "text-[#8d77ba]",
      }));

      setRoles(transformedRoles);
    } catch (error) {
      console.error('Error fetching role data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleListData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/auth/roleslist`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();

      const transformedData = data.map(role => {
        return {
          id: role.id,
          name: role.name,
          description: role.description || "No description available",
          status: role.attributes?.Status?.[0] || "Disabled",
          createdOn: role.attributes?.createdOn?.[0] || "",
          startDate: role.attributes?.startDate?.[0] || "",
          endDate: role.attributes?.endDate?.[0] || ""
        };
      });

      setTableData(transformedData);
    } catch (error) {
      console.error('Error fetching role list data:', error);
    }
  };

  const refreshAllData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        FetchRoleDashboardData(),
        fetchRoleListData()
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = tableData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(tableData.length / rowsPerPage);

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

  const handleSave = async (roleData) => {
    console.log('Role created:', roleData);
    try {
      await refreshAllData();
      setShowModal(false);
    } catch (error) {
      console.error('Error refreshing data after role creation:', error);
    }
  };

  const handleEditClick = (role) => {
    setRoleToEdit(role);
    setShowEditModal(true);
    setActiveMenu(null);
  };

  const handleEditSave = async (data) => {
    console.log('Role updated:', data);
    try {
      await refreshAllData();
      setShowEditModal(false);
    } catch (error) {
      console.error('Error refreshing data after role update:', error);
    }
  };

  return (
    <div className="p-6">
      <Breadcrumb title="Data Governance" link="/" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Role</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 h-10 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              placeholder="Search role"
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
            onClick={() => setViewMode(viewMode === 'cards' ? 'list' : 'cards')}
            title={viewMode === 'cards' ? "Switch to List View" : "Switch to Card View"}
          >
            <Icon
              icon="material-symbols-light:format-list-bulleted"
              title="List view"
              width="24"
              height="24"
              className="text-gray-600"
            />
          </button>

          <button
            className="p-1 px-1.5 rounded-lg border border-gray-400 hover:bg-gray-50"
            onClick={refreshAllData}
            disabled={refreshing}
          >
            <Icon
              icon="material-symbols:autorenew-rounded"
              title="Refresh"
              width="24"
              height="24"
              className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-[#8e78b7] text-white rounded-lg"
            onClick={() => setShowModal(true)}
          >
            <Plus className="h-5 w-5" />
            New role
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRoles.map((role, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 ${role.bgcolor} rounded-full ${role.iconcolor} mr-2`}
                            >
                              <Icon icon={role.icon} />
                            </div>
                            <h3 className="text-lg font-semibold">{role.title}</h3>
                          </div>
                          <button className="p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-gray-500 mt-4 text-sm">{role.description}</p>
                        <div className="flex items-center justify-between mt-6">
                          <div className="flex items-center gap-2">
                            <Icon
                              icon="material-symbols:supervisor-account-outline"
                              width="24"
                              height="24"
                            />
                            <span className="text-sm">
                              {role.users.toString().padStart(2, "0")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {togglingStatus === index ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#8e78b7]"></div>
                            ) : (
                              <Toggle
                                enabled={role.enabled}
                                onToggle={() => toggleRole(index)}
                              />
                            )}
                            <span
                              className={`text-sm ${
                                role.enabled ? "text-[#1a9962]" : "text-gray-400"
                              }`}
                            >
                              {role.enabled ? "Enabled" : "Disabled"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 transition-opacity duration-300">
                  <Icon icon="material-symbols:search-off-outline" width="48" height="48" className="mb-4 text-gray-400" />
                  <p>No roles found matching "{searchTerm}"</p>
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

      <div className={`bg-white rounded-lg shadow overflow-hidden ${viewMode === 'cards' ? 'mt-5' : 'mt-0'}`}>
        <table className="w-full">
          <thead>
            <tr className="bg-[#29304a] text-white text-sm">
              <th className="text-left py-3 px-4">ID</th>
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Description</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Created On</th>
              <th className="text-left py-3 px-4">Start Date</th>
              <th className="text-left py-3 px-4">End Date</th>
              <th className="text-left py-3 px-4">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan="8" className="p-4 text-center">
                  <div className="flex justify-center items-center h-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8e78b7]"></div>
                  </div>
                </td>
              </tr>
            ) : (
              currentRows.map((role, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4" title={role.id}>{role.id.substring(0, 8)}...</td>
                  <td className="py-3 px-4 text-gray-600">{role.name}</td>
                  <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{role.description}</td>
                  <td className="py-3 px-4 text-gray-600">{role.status}</td>
                  <td className="py-3 px-4 text-gray-600">{role.createdOn || "-"}</td>
                  <td className="py-3 px-4 text-gray-600">{role.startDate || "-"}</td>
                  <td className="py-3 px-4 text-gray-600">{role.endDate || "-"}</td>
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
                                onClick={() => handleEditClick(role)}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
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

            {!loading && currentRows.length === 0 && (
              <tr>
                <td colSpan="8" className="p-4 text-center text-gray-500">
                  No roles found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {!loading && tableData.length > 0 && (
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
                        ? 'bg-[#8e78b7] text-white'
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

      <AddRole
        show={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />

      <EditRole
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditSave}
        roleData={roleToEdit}
      />
    </div>
  );
};

export default Role;
