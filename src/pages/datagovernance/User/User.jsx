import React, { useState, useEffect, useRef } from 'react';
import { Plus, RefreshCcw, Search, MoreHorizontal, Pencil, Trash2, RotateCw, X, ChevronLeft, ChevronRight,ChevronDown,FolderX , UserRound} from 'lucide-react';
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
      transform: rotate(-360deg);
    }
  }

  .icon-rotate {
    animation: rotate 1s linear infinite;
  }

  .toggle-disabled {
    pointer-events: none;
    opacity: 0.6;
  }

  .toggle-disabled svg {
    display: none !important;
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
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [totalUsers, setTotalUsers] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const initialFetchDone = useRef(false);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const rowsPerPage = itemsPerPage;

  const { token } = useAuth();

  // const fetchUserData = async (page = 1, search = '', isPagination = false) => {
  //   if (isPagination) {
  //     setIsPaginationLoading(true);
  //   } else {
  //     setIsLoading(true);
  //   }

  //   try {
  //     const skip = (page - 1) * rowsPerPage;
  //     let url = `${window._env_?.VITE_FAST_API}/auth/users?skip=${skip}&limit=${rowsPerPage}`;
  //     if (search.trim()) {
  //       url += `&search=${encodeURIComponent(search.trim())}`;
  //     }

  //     const response = await fetch(url, {
  //       method: 'GET',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       }
  //     });

  //     if (!response.ok) {
  //       throw new Error('Network response was not ok');
  //     }

  //     const data = await response.json();
  //     setUsers(data.users);
  //     setTotalUsers(data.total);
  //     setHasMore(data.has_more);
  //     return { success: true };
  //   } catch (error) {
  //     console.error('Error fetching user data:', error);
  //     return { success: false, error };
  //   } finally {
  //     if (isPagination) {
  //       setIsPaginationLoading(false);
  //     } else {
  //       setIsLoading(false);
  //     }
  //   }
  // };

  const fetchUserData = async (page = 1, search = '', isPagination = false, customPageSize = null) => {
  if (isPagination) {
    setIsPaginationLoading(true);
  } else {
    setIsLoading(true);
  }

  try {
    const pageSize = customPageSize !== null ? customPageSize : rowsPerPage; // Use custom size if provided
    const skip = (page - 1) * pageSize;
    let url = `${window._env_?.VITE_FAST_API}/auth/users?skip=${skip}&limit=${pageSize}`;
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

    // Debounce search to avoid too many API calls
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      fetchUserData(1, newSearchTerm);
    }, 500);
  };

  const filteredUsers = users.filter(user =>
  user.username.toLowerCase().includes(searchTerm.toLowerCase())
);

// Don't recalculate pagination - API handles it
// Just display what we got from the server
const currentUsers = users;

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      fetchUserData(newPage, searchTerm, true);
    }
  };

  const goToNextPage = () => {
    if (hasMore) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
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

  const handleItemsPerPageChange = (e) => {
  const newItemsPerPage = Number(e.target.value);
  setItemsPerPage(newItemsPerPage);
  setCurrentPage(1);
  fetchUserData(1, searchTerm, false, newItemsPerPage); // Pass new value
};

  return (
    <div className="px-6 py-4 bg-[#F3F5F7] min-h-screen">
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
      <div className="flex items-center justify-between mb-[18px]">
        <h1 className="text-2xl font-semibold">User</h1>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: '#818181' }} />
            <input
              type="text"
              placeholder="Search all user"
              className="pl-10 w-64 h-10 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <button onClick={() => { setSearchTerm(''); fetchUserData(1, ''); }} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                <Icon icon="mdi:close" width="16" height="16" />
              </button>
            )}
          </div>

          <button
            className={`flex items-center justify-center p-1 px-1.5 rounded-lg border border-gray-400 bg-gray-50 hover:bg-gray-100`}
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh"
            style={{ width: '40px', height: '40px', borderRadius: '8px', padding: '8px' }}
          >
            <RefreshCcw className={`${isLoading ? 'icon-rotate' : ''}`} size={20} style={{ color: '#818181' }} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#8e78b7] text-white rounded-lg text-base"
          >
            <Plus className="h-5 w-5 " /> Add user
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#29304a] text-white text-sm">
            <th className="text-left" style={{ padding: '16px 19.75px' }}>User</th>
              <th className="text-left" style={{ padding: '16px 19.75px' }}>Roles</th>
              <th className="text-left" style={{ padding: '16px 19.75px' }}>Persona</th>
              <th className="text-left" style={{ padding: '16px 19.75px' }}>Group</th>
              <th className="text-left" style={{ padding: '16px 19.75px' }}>Sub group</th>
              <th className="text-center" style={{ padding: '16px 19.75px' }}>Status</th>
              <th className="text-left" style={{ padding: '16px 19.75px' }}>Action</th>
          </tr>
          </thead>
          <tbody className="text-sm">
            {isPaginationLoading ? (
              <tr>
                <td colSpan="7" className="p-8 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-[#8e78b7] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500">Loading users...</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td style={{ padding: '16px 19.75px' }}>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#8d77ba] bg-opacity-25 text-[#8d77ba]">
                        <span className="text-sm font-semibold">{user.username.charAt(0).toUpperCase()}</span>
                      </div>
                      <button
                        className="text-[#8e78b7] font-medium hover:underline"
                        onClick={() => openUserDetails(user)}
                      >
                        {user.username}
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '16px 19.75px' }}>
                    <button
                      onClick={() => showDetailModal('role', user.roles, user)}
                      className="text-center font-medium underline decoration-1 underline-offset-4"
                    >
                      {getCount(user.roles)}
                    </button>
                  </td>
                  <td style={{ padding: '16px 19.75px' }}>
                    <button
                      onClick={() => showDetailModal('persona', user.persona, user)}
                      className="text-center font-medium underline decoration-1 underline-offset-4"
                    >
                      {getCount(user.persona)}
                    </button>
                  </td>
                  <td style={{ padding: '16px 19.75px' }}>
                    <button
                      onClick={() => showDetailModal('group', null, user)}
                      className="text-center font-medium underline decoration-1 underline-offset-4"
                    >
                      {getCount(null, 'group', user)}
                    </button>
                  </td>
                  <td style={{ padding: '16px 19.75px' }}>
                    <button
                      onClick={() => showDetailModal('subgroup', null, user)}
                      className="text-center font-medium underline decoration-1 underline-offset-4"
                    >
                      {getCount(null, 'subgroup', user)}
                    </button>
                  </td>
                  <td style={{ padding: '16px 19.75px' }}>
                    <div className="text-center align-middle">
                      {user.enabled ? (
                        <span className="inline-block px-6 py-2 rounded-md text-sm font-medium" 
                          style={{ background: '#def3e9', color: '#1a9962', minWidth: '88px', textAlign: 'center' }}>
                          Active
                        </span>
                      ) : (
                        <span className="inline-block px-6 py-2 rounded-md text-sm font-medium" 
                          style={{ background: '#f3f4f6', color: '#6b7280', minWidth: '88px', textAlign: 'center' }}>
                          Inactive
                        </span>
                      )}
                    </div>
                  </td>
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

        
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between px-4 py-3 border-t mt-0">
          <div className="text-sm text-gray-500 mb-3 md:mb-0">
              Showing {users.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, totalUsers)} of {totalUsers} users
              {searchTerm && ` (filtered by "${searchTerm}")`}
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Show per page</label>
              <div className="relative">
                <select value={itemsPerPage} onChange={handleItemsPerPageChange} className="border border-gray-400 rounded-md focus:outline-none text-sm text-center pl-2 pr-8" style={{ height: '31px', width: '55px', WebkitAppearance: 'none', appearance: 'none', paddingRight: '24px'}}>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
                <ChevronDown 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-700" 
                  style={{ top: '52%' }}  
                  size={14} 
                />
              </div>
            </div>

            <div className="flex items-center border border-gray-400 rounded-md bg-gray-50" style={{ height: '31px', width: '95px', overflow: 'hidden' }}>
              <button onClick={goToPreviousPage} disabled={currentPage === 1 || isPaginationLoading} title="Previous page" className={`flex-1 h-full flex items-center justify-center ${currentPage === 1 || isPaginationLoading ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`} style={{ padding: 0, border: 'none' }}>
                {isPaginationLoading && currentPage > 1 ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div> : <ChevronLeft size={14} />}
              </button>

              <button onClick={goToNextPage} disabled={!hasMore || isPaginationLoading} title="Next page" className={`flex-1 h-full flex items-center justify-center ${!hasMore || isPaginationLoading ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`} style={{ padding: 0, border: 'none', borderLeft: '1px solid rgba(156,163,175,0.45)' }}>
                {isPaginationLoading && hasMore ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div> : <ChevronRight size={14} />}
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
                <h2 className="text-md font-bold text-[#8e78b7]">User Details</h2>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-start ">
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
                {detailModalData.type === 'role' && <Icon icon="carbon:user-role" className="h-5 w-5 text-gray-600" />}
                {detailModalData.type === 'persona' && <Icon icon="mdi:face-agent" className="h-5 w-5 text-gray-600" />}
                {detailModalData.type === 'group' && <Icon icon="mdi:account-group" className="h-5 w-5 text-gray-600" />}
                {detailModalData.type === 'subgroup' && <Icon icon="mdi:account-group-outline" className="h-5 w-5 text-gray-600" />}
                <h2 className=" text-gray-600 text-md font-bold">{detailModalData.title}</h2>
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
                        detailModalData.type === 'role' ? 'bg-gray-100' :
                        detailModalData.type === 'persona' ? 'bg-gray-100' :
                        detailModalData.type === 'group' ? 'bg-gray-100' :
                        'bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {detailModalData.type === 'role' && <Icon icon="carbon:user-role" className="h-5 w-5 text-gray-500" />}
                        {detailModalData.type === 'persona' && <Icon icon="mdi:face-agent" className="h-5 w-5 text-gray-500" />}
                        {detailModalData.type === 'group' && <Icon icon="mdi:account-group" className="h-5 w-5 text-gray-500" />}
                        {detailModalData.type === 'subgroup' && <Icon icon="mdi:account-group-outline" className="h-5 w-5 text-gray-500" />}
                        <p className="font-medium">{item}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-lg">
                  <FolderX className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">No {detailModalData.type} information available</p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className={`px-5 py-2 rounded-lg text-white ${
                  detailModalData.type === 'role' ? 'bg-purple-600' :
                  detailModalData.type === 'persona' ? 'bg-purple-600' :
                  detailModalData.type === 'group' ? 'bg-purple-600' :
                  'bg-purple-600'
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