import React, { useState, useEffect, useRef } from 'react';
import { Plus, RefreshCcw, Search, MoreHorizontal, Pencil, Trash2, RotateCw, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Icon } from "@iconify-icon/react";
import Breadcrumb from '../../../components/Breadcrumb';
import AddUser from './Components/User/AddUser';
import EditUser from './Components/User/EditUser';
import DeleteUser from './Components/User/DeleteUser';
import { useAuth } from '../../../context/AuthContext';

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

const User = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  const [detailModalData, setDetailModalData] = useState({ type: '', data: [] });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [checkedUsers, setCheckedUsers] = useState({});
  const [allChecked, setAllChecked] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [totalUsers, setTotalUsers] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const initialFetchDone = useRef(false);
  const rowsPerPage = 10;

  const { token } = useAuth();

  const fetchUserData = async (page = 1, search = '', isPagination = false) => {
    if (isPagination) {
      setIsPaginationLoading(true);
    } else {
      setIsLoading(true);
    }

    try {
      const skip = (page - 1) * rowsPerPage;
      let url = `${window._env_?.VITE_FAST_API}/auth/users?skip=${skip}&limit=${rowsPerPage}`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }

      const response = await fetch(url, {
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
      setUsers(data.users);
      setTotalUsers(data.total);
      setHasMore(data.has_more);
      return { success: true };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { success: false, error };
    } finally {
      if (isPagination) {
        setIsPaginationLoading(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchUserData(1, searchTerm);
      initialFetchDone.current = true;
    }
  }, []);

  const handleClickOutside = () => {
    setActiveMenu(null);
  };

  const openUserDetails = (user) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  const handleSaveUser = () => {
    setIsModalOpen(false);
    fetchUserData(currentPage, searchTerm);
  };

  const handleEditClick = (user) => {
    setUserToEdit(user);
    setIsEditModalOpen(true);
    setActiveMenu(null);
  };

  const handleEditSave = () => {
    setIsEditModalOpen(false);
    fetchUserData(currentPage, searchTerm);
  };

  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setCurrentPage(1);
    setCheckedUsers({});
    setAllChecked(false);

    // Debounce search to avoid too many API calls
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      fetchUserData(1, newSearchTerm);
    }, 500);
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const indexOfLastUser = currentPage * rowsPerPage;
  const indexOfFirstUser = indexOfLastUser - rowsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      setCheckedUsers({});
      setAllChecked(false);
      fetchUserData(newPage, searchTerm, true);
    }
  };

  const goToNextPage = () => {
    if (hasMore) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      setCheckedUsers({});
      setAllChecked(false);
      fetchUserData(newPage, searchTerm, true);
    }
  };

  const showDetailModal = (type, data, user) => {
    let modalTitle = '';
    let modalData = [];

    switch(type) {
      case 'role':
        modalTitle = `${user.username}'s Roles`;
        modalData = Array.isArray(data) ? data : (data ? [data] : []);
        break;
      case 'persona':
        modalTitle = `${user.username}'s Persona`;
        modalData = Array.isArray(data) ? data : (data ? [data] : []);
        break;
      case 'group':
        modalTitle = `${user.username}'s Groups`;
        if (user.group_subgroup) {
          modalData = Object.keys(user.group_subgroup);
        } else if (user.group) {
          modalData = Array.isArray(user.group) ? user.group : [user.group];
        } else {
          modalData = [];
        }
        break;
      case 'subgroup':
        modalTitle = `${user.username}'s Subgroups`;
        if (user.group_subgroup) {
          modalData = [];
          Object.entries(user.group_subgroup).forEach(([group, subgroups]) => {
            if (subgroups && subgroups.length > 0) {
              subgroups.forEach(subgroup => {
                modalData.push(`${group} > ${subgroup}`);
              });
            }
          });
        } else if (user.subgroup) {
          modalData = [user.subgroup];
        } else {
          modalData = [];
        }
        break;
      default:
        modalTitle = 'Details';
        modalData = [];
    }

    setDetailModalData({ type, title: modalTitle, data: modalData, username: user.username });
    setIsDetailModalOpen(true);
  };

  const getCount = (item, type, user) => {
    if (type === 'group' && user.group_subgroup) {
      return Object.keys(user.group_subgroup).length;
    } else if (type === 'subgroup' && user.group_subgroup) {
      let count = 0;
      Object.values(user.group_subgroup).forEach(subgroups => {
        count += subgroups.length;
      });
      return count;
    }

    if (!item) return 0;
    if (Array.isArray(item)) {
      const filteredItems = item.filter(i => i && i.toString().trim() !== '');
      return filteredItems.length;
    }
    return 1;
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
    setActiveMenu(null);
  };

  const handleDeleteConfirm = () => {
    fetchUserData(currentPage, searchTerm);
  };

  const handleRefresh = async () => {
    setSearchTerm('');
    setCurrentPage(1);
    setCheckedUsers({});
    setAllChecked(false);

    const result = await fetchUserData(1, '');

    if (result.success) {
      setToast({
        show: true,
        message: 'User data refreshed successfully',
        type: 'success'
      });
    } else {
      setToast({
        show: true,
        message: 'Failed to refresh user data',
        type: 'error'
      });
    }

    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleCheckAll = () => {
    const newAllChecked = !allChecked;
    setAllChecked(newAllChecked);

    const newCheckedUsers = {};
    if (newAllChecked) {
      users.forEach(user => {
        newCheckedUsers[user.id] = true;
      });
    }
    setCheckedUsers(newCheckedUsers);
  };

  return (
    <div className="p-6">

      <style>{rotateAnimation}</style>

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
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Breadcrumb />
      <div className="flex gap-4 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">User</h1>

        <div className="flex items-center gap-4 ml-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search all user"
              className="pl-10 pr-4 py-2 w-[300px] border border-gray-300 rounded-lg focus:outline-none"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          <button
            className="p-2.5 rounded-lg bg-gray-100 disabled:opacity-50"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCcw className={`h-5 w-5 ${isLoading ? 'icon-rotate' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#8e78b7] text-white rounded-lg"
          >
            <Plus className="h-5 w-5" />
            Add user
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#29304a] text-white">
              <th className="w-8 p-4 first:rounded-tl-lg">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={handleCheckAll}
                />
              </th>
              <th className="text-left p-4">User</th>
              <th className="text-left p-4">Roles</th>
              <th className="text-left p-4">Persona</th>
              <th className="text-left p-4">Group</th>
              <th className="text-left p-4">Sub group</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4 last:rounded-tr-lg">Action</th>
            </tr>
          </thead>
          <tbody>
            {isPaginationLoading ? (
              <tr>
                <td colSpan="8" className="p-8 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-[#8e78b7] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500">Loading users...</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={!!checkedUsers[user.id]}
                      onChange={() => handleCheckUser(user.id)}
                    />
                  </td>
                  <td className="p-4">
                    <button
                      className="text-[#8e78b7] font-medium hover:underline"
                      onClick={() => openUserDetails(user)}
                    >
                      {user.username}
                    </button>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => showDetailModal('role', user.roles, user)}
                      className="text-center font-medium underline decoration-1 underline-offset-4"
                    >
                      {getCount(user.roles)}
                    </button>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => showDetailModal('persona', user.persona, user)}
                      className="text-center font-medium underline decoration-1 underline-offset-4"
                    >
                      {getCount(user.persona)}
                    </button>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => showDetailModal('group', null, user)}
                      className="text-center font-medium underline decoration-1 underline-offset-4"
                    >
                      {getCount(null, 'group', user)}
                    </button>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => showDetailModal('subgroup', null, user)}
                      className="text-center font-medium underline decoration-1 underline-offset-4"
                    >
                      {getCount(null, 'subgroup', user)}
                    </button>
                  </td>
                  <td className="p-4">
                    {user.enabled ?
                      <span className="px-2 py-1 rounded-full text-sm text-green-600 bg-green-50">Active</span> :
                      <span className="px-2 py-1 rounded-full text-sm text-red-600 bg-red-50">Inactive</span>
                    }
                  </td>
                  <td className="p-4">
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === index ? null : index)}
                        className="p-1.5 rounded-full hover:bg-gray-100"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>

                      {activeMenu === index && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={handleClickOutside}
                          />
                          <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border z-20 animate-fadeIn">
                            <div className="flex items-center p-1 gap-1">
                              <button
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                onClick={() => handleEditClick(user)}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                onClick={() => handleDeleteClick(user)}
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
          </tbody>
        </table>

        <div className="flex justify-between items-center px-4 py-3 border-t">
          <div className="text-sm text-gray-500">
            Showing {users.length} of {totalUsers} users
            {searchTerm && ` (filtered by "${searchTerm}")`}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1 || isPaginationLoading}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg ${
                currentPage === 1 || isPaginationLoading
                  ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                  : 'text-gray-600 hover:bg-gray-100 bg-white border'
              }`}
            >
              {isPaginationLoading && currentPage > 1 ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
              Previous
            </button>

            <span className="px-3 py-2 text-sm text-gray-600">
              Page {currentPage}
            </span>

            <button
              onClick={goToNextPage}
              disabled={!hasMore || isPaginationLoading}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg ${
                !hasMore || isPaginationLoading
                  ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                  : 'text-gray-600 hover:bg-gray-100 bg-white border'
              }`}
            >
              Next
              {isPaginationLoading && hasMore ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <AddUser
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
      />

      <EditUser
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditSave}
        userData={userToEdit}
      />

      <DeleteUser
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleDeleteConfirm}
        userData={userToDelete}
      />

      {isDetailsModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[600px] p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div>
                  <Icon className="h-5 w-5 text-[#8e78b7]" icon={"material-symbols:person"} width="24" height="24" />
                </div>
                <h2 className="text-xl font-bold text-[#8e78b7]">User Details</h2>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-center mb-6">
                <div className="h-24 w-24 rounded-full bg-[#8e78b7] text-white flex items-center justify-center text-3xl">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Username</p>
                  <p className="font-medium truncate" title={selectedUser.username}>{selectedUser.username}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500">User ID</p>
                  <p className="font-medium text-xs truncate">{selectedUser.id}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium truncate">{selectedUser.email || "-"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">
                    {selectedUser.enabled ?
                      <span className="px-2 py-0.5 rounded-full text-sm text-green-600 bg-green-50">Active</span> :
                      <span className="px-2 py-0.5 rounded-full text-sm text-red-600 bg-red-50">Inactive</span>
                    }
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500">First Name</p>
                  <p className="font-medium truncate">{selectedUser.firstName || "-"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Last Name</p>
                  <p className="font-medium truncate">{selectedUser.lastName || "-"}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[500px] p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {detailModalData.type === 'role' && <Icon icon="carbon:user-role" className="h-5 w-5 text-blue-600" />}
                {detailModalData.type === 'persona' && <Icon icon="mdi:face-agent" className="h-5 w-5 text-purple-600" />}
                {detailModalData.type === 'group' && <Icon icon="mdi:account-group" className="h-5 w-5 text-teal-600" />}
                {detailModalData.type === 'subgroup' && <Icon icon="mdi:account-group-outline" className="h-5 w-5 text-amber-600" />}
                <h2 className="text-lg font-bold">{detailModalData.title}</h2>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-full bg-[#8e78b7] text-white flex items-center justify-center text-lg">
                  {detailModalData.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{detailModalData.username}</p>
                  <p className="text-sm text-gray-500">
                    {detailModalData.type === 'role' ? 'Has the following roles' :
                     detailModalData.type === 'persona' ? 'Has the following persona' :
                     detailModalData.type === 'group' ? 'Belongs to the following group' :
                     'Belongs to the following subgroup'}
                  </p>
                </div>
              </div>

              {detailModalData.data.length > 0 ? (
                <div className="space-y-2">
                  {detailModalData.data.map((item, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg ${
                        detailModalData.type === 'role' ? 'bg-blue-50' :
                        detailModalData.type === 'persona' ? 'bg-purple-50' :
                        detailModalData.type === 'group' ? 'bg-teal-50' :
                        'bg-amber-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {detailModalData.type === 'role' && <Icon icon="carbon:user-role" className="h-5 w-5 text-blue-600" />}
                        {detailModalData.type === 'persona' && <Icon icon="mdi:face-agent" className="h-5 w-5 text-purple-600" />}
                        {detailModalData.type === 'group' && <Icon icon="mdi:account-group" className="h-5 w-5 text-teal-600" />}
                        {detailModalData.type === 'subgroup' && <Icon icon="mdi:account-group-outline" className="h-5 w-5 text-amber-600" />}
                        <p className="font-medium">{item}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-lg">
                  <Icon icon="mdi:folder-information-outline" className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">No {detailModalData.type} information available</p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className={`px-5 py-2 rounded-lg text-white ${
                  detailModalData.type === 'role' ? 'bg-blue-600' :
                  detailModalData.type === 'persona' ? 'bg-purple-600' :
                  detailModalData.type === 'group' ? 'bg-teal-600' :
                  'bg-amber-600'
                } hover:bg-opacity-90 transition-colors`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default User;