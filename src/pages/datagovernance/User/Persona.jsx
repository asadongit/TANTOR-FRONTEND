import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  MoreVertical, Search, Plus, Pencil, Trash2, MoreHorizontal,
  X, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, RefreshCcw, AlertTriangle,
  List
} from "lucide-react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isConfirming }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button title="Close" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X className="h-5 w-5 text-gray-600" /></button>
        </div>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
          <div className="mt-1"><p className="text-sm text-gray-600">{message}</p></div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none">Cancel</button>
          <button onClick={onConfirm} disabled={isConfirming} className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none disabled:bg-red-300 disabled:cursor-wait">
            {isConfirming ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Toggle Switch Component
const ToggleSwitch = ({ enabled, onChange, disabled = false, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-9 h-5',
    md: 'w-11 h-6',
    lg: 'w-14 h-7'
  };

  const thumbSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`${sizeClasses[size]} ${enabled ? 'bg-green-500' : 'bg-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
    >
      <span
        className={`${thumbSizeClasses[size]} ${enabled ? `translate-x-5` : 'translate-x-0.5'
          } inline-block transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  );
};

// Helper Component: Table Row Skeleton
const TableRowSkeleton = ({ columns }) => (
  <tr className="border-b animate-pulse">{Array.from({ length: columns }).map((_, i) => (<td key={i} className="p-4"><div className="h-4 bg-gray-200 rounded w-full"></div></td>))}</tr>
);

function Persona() {
  // Component States
  const [personaCards, setPersonaCards] = useState([]);
  const [isCardsLoading, setIsCardsLoading] = useState(true);
  const [cardsError, setCardsError] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [tableError, setTableError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({});
  const [activeMenu, setActiveMenu] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toggleStates, setToggleStates] = useState({});
  const [isCardViewVisible, setIsCardViewVisible] = useState(true);
  const { token } = useAuth();
  const rowsPerPage = 10;

  const initialFormState = {
    name: "",
    description: "",
    enabled: true,
  };
  const [formData, setFormData] = useState(initialFormState);

  const handleClickOutside = () => setActiveMenu(null);

  // --- Data Fetching and Processing ---
  const processPersonaCardData = (apiData) => {
    if (!Array.isArray(apiData)) { console.error("Invalid API response for cards: Expected an array.", apiData); return []; }
    return apiData.map((item) => ({ id: item.id, title: item.name, description: item.description, users: item.user_count, enabled: item.attributes?.Status?.[0] === "Enabled", icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#8d77ba] bg-opacity-25", iconcolor: "text-[#8d77ba]", }));
  };

  const fetchPersonaHomepageData = useCallback(async () => {
    setIsCardsLoading(true);
    setCardsError(null);
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/personahomepage`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setPersonaCards(processPersonaCardData(data));
    } catch (error) {
      console.error("Error fetching persona cards:", error);
      setCardsError("Failed to load persona stats.");
      toast.error("Failed to load persona stats.");
    } finally {
      setIsCardsLoading(false);
    }
  }, []);

  const fetchPersonaListData = useCallback(async (isRefresh = false) => {
    setIsTableLoading(true);
    setTableError(null);
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/personalist`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      const formattedData = data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        status: item.attributes?.Status?.[0] || 'N/A',
        createdOn: item.attributes?.createdOn?.[0] || 'N/A',
      }));
      setTableData(formattedData);
      if (isRefresh) {
        toast.success('Persona list refreshed!');
      }
    } catch (error) {
      console.error("Error fetching persona list:", error);
      setTableError("Failed to load persona list.");
      toast.error("Failed to load persona list.");
    } finally {
      setIsTableLoading(false);
    }
  }, []);

  const handleToggleStatus = async (personaName, currentEnabled) => {
    const toggleKey = `toggle-${personaName}`;
    setToggleStates(prev => ({ ...prev, [toggleKey]: true }));

    try {
      const newStatus = currentEnabled ? 'Disabled' : 'Enabled';
      const payload = {
        name: personaName,
        status: newStatus
      };

      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/personastatus`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred.' }));
        throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
      }

      setPersonaCards(prev => prev.map(card =>
        card.title === personaName
          ? { ...card, enabled: !currentEnabled }
          : card
      ));

      setTableData(prev => prev.map(item =>
        item.name === personaName
          ? { ...item, status: newStatus }
          : item
      ));

      toast.success(`Persona "${personaName}" ${newStatus.toLowerCase()} successfully!`);

    } catch (error) {
      console.error("Failed to toggle persona status:", error);
      toast.error(`Failed to toggle persona status: ${error.message}`);
    } finally {
      setToggleStates(prev => ({ ...prev, [toggleKey]: false }));
    }
  };

  useEffect(() => {
    fetchPersonaHomepageData();
    fetchPersonaListData();
  }, [fetchPersonaHomepageData, fetchPersonaListData]);

  const filteredCards = useMemo(() => {
    if (!searchTerm.trim()) return personaCards;
    return personaCards.filter(card =>
      card.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [personaCards, searchTerm]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = tableData.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key] ?? '';
        let bValue = b[sortConfig.key] ?? '';

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [tableData, searchTerm, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);
  const currentItems = filteredAndSortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // --- Handlers ---
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleRefresh = useCallback(() => {
    setSearchTerm('');
    setSortConfig({});
    setCurrentPage(1);
    fetchPersonaHomepageData();
    fetchPersonaListData(true);
  }, [fetchPersonaHomepageData, fetchPersonaListData]);

  const handleToggleView = () => {
    setIsCardViewVisible(prev => !prev);
  };

  const handleSave = async (closeOnSave) => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error("Name and Description are required.");
      return;
    }
    setIsSubmitting(true);

    try {
      if (itemToEdit) {
        // --- EDIT LOGIC ---
        const payload = {
          name: itemToEdit.name,
          new_name: formData.name.trim(),
          description: formData.description.trim(),
        };

        const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/editpersona`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred.' }));
          throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
        }

        toast.success(`Persona "${payload.new_name}" updated successfully!`);

      } else {
        // --- CREATE LOGIC ---
        const payload = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          status: formData.enabled ? 'yes' : 'no',
        };

        const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/createpersona`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred.' }));
          throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
        }

        toast.success(`Persona "${payload.name}" created successfully!`);
      }

      handleRefresh();
      if (closeOnSave) {
        setShowModal(false);
      } else if (!itemToEdit) {
        setFormData(initialFormState);
      }

    } catch (error) {
      const action = itemToEdit ? "update" : "create";
      console.error(`Failed to ${action} persona:`, error);
      toast.error(`Failed to ${action} persona: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleOpenAddModal = () => {
    setItemToEdit(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const handleOpenEditModal = (item) => {
    setItemToEdit(item);
    setFormData({
      name: item.name,
      description: item.description,
      enabled: item.status?.toLowerCase() === 'enabled' || item.status?.toLowerCase() === 'active' || item.status?.toLowerCase() === 'yes',
    });
    setShowModal(true);
    setActiveMenu(null);
  };

  const handleOpenDeleteModal = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
    setActiveMenu(null);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      const personaName = encodeURIComponent(itemToDelete.name);
      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/deletepersona/${personaName}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred.' }));
        throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
      }

      toast.success(`Persona "${itemToDelete.name}" deleted successfully.`);
      handleRefresh();

    } catch (error) {
      console.error("Failed to delete persona:", error);
      toast.error(`Failed to delete persona: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };


  // --- UI Helpers ---
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4 inline-block ml-1 opacity-40" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 inline-block ml-1" /> : <ArrowDown className="h-4 w-4 inline-block ml-1" />;
  };

  const getStatusBadge = (status) => {
    const lowerStatus = status?.toLowerCase();
    let styles = "px-2.5 py-1 text-xs font-semibold rounded-full ";
    switch (lowerStatus) {
      case 'enabled':
      case 'active':
      case 'yes':
        styles += "text-green-800 bg-green-100";
        break;
      case 'disabled':
      case 'inactive':
      case 'no':
        styles += "text-yellow-800 bg-yellow-100";
        break;
      default:
        styles += "text-gray-800 bg-gray-100";
        break;
    }
    return <span className={styles}>{status}</span>;
  };

  const tableHeaders = [
    { key: 'id', label: 'Id' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status' },
    { key: 'createdOn', label: 'Created On' },
    { key: 'action', label: 'Action' }
  ];

  const isFormInvalid = !formData.name.trim() || !formData.description.trim();

  return (
    <div className="p-6">
      <Breadcrumb />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Persona</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input type="text" className="pl-10 w-64 h-10 rounded-lg border border-gray-400 focus:outline-none" placeholder="Search personas..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
          </div>
          <button title="Refresh Data" onClick={handleRefresh} disabled={isTableLoading || isCardsLoading} className="p-2.5 border border-gray-400 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <RefreshCcw className={`h-5 w-5 text-gray-600 ${(isTableLoading || isCardsLoading) ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            title="Toggle Card/List View"
            onClick={handleToggleView}
            className="p-2.5 border border-gray-400 rounded-lg hover:bg-gray-50"
          >
            <List className="h-5 w-5 text-gray-600" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#8e78b7] text-white rounded-lg" onClick={handleOpenAddModal}>
            <Plus className="h-5 w-5" /> New Persona
          </button>
        </div>
      </div>

      {isCardViewVisible && (
        isCardsLoading ? (<div className="text-center p-6">Loading personas...</div>) : cardsError ? (<div className="text-center p-6 bg-red-50 text-red-600 rounded-lg">{cardsError}</div>) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card) => {
              const cardIndex = personaCards.findIndex(c => c.id === card.id);
              return (
                <div key={card.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                        <div className={`flex items-center justify-center w-10 h-10 ${card.bgcolor} rounded-full ${card.iconcolor} flex-shrink-0`}>
                          <Icon icon={card.icon} />
                        </div>
                        <h3 className="text-lg font-semibold truncate" title={card.title}>{card.title}</h3>
                      </div>
                      <div className="relative flex-shrink-0">
                        <button onClick={() => setActiveMenu(activeMenu === `card-${cardIndex}` ? null : `card-${cardIndex}`)} className="p-1.5 rounded-full hover:bg-gray-100" title="See Actions" >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {activeMenu === `card-${cardIndex}` && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={handleClickOutside} />
                            <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border z-20 animate-fadeIn">
                              <div className="flex items-center p-1 gap-1">
                                <button onClick={() => handleOpenEditModal({ id: card.id, name: card.title, description: card.description, status: card.enabled ? 'enabled' : 'disabled' })} title="Edit Persona" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleOpenDeleteModal({ id: card.id, name: card.title, description: card.description })} title="Delete Persona" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-500 mt-4 text-sm overflow-hidden" title={card.description}>{card.description}</p>
                    <div className="flex items-center justify-between mt-6">
                      <div className="flex items-center gap-2">
                        <Icon icon="material-symbols:supervisor-account-outline" width="24" height="24" />
                        <span className="text-sm">{card.users}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {card.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <ToggleSwitch
                          enabled={card.enabled}
                          onChange={() => handleToggleStatus(card.title, card.enabled)}
                          disabled={toggleStates[`toggle-${card.title}`]}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-8 border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-white">
              <tr>
                {tableHeaders.map(header => (
                  <th key={header.key} className="text-left p-3 font-semibold tracking-wider" onClick={() => header.key !== 'action' && header.key !== 'id' && handleSort(header.key)}>
                    <span className={`inline-flex items-center ${header.key !== 'action' && header.key !== 'id' ? 'cursor-pointer' : ''}`}>
                      {header.label}
                      {header.key !== 'action' && header.key !== 'id' && getSortIcon(header.key)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isTableLoading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} columns={tableHeaders.length} />)
              ) : tableError ? (
                <tr><td colSpan={tableHeaders.length} className="text-center p-6 text-red-600">{tableError}</td></tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((item, index) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-gray-700 font-medium">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                    <td className="p-3 text-gray-600">{item.name}</td>
                    <td className="p-3 text-gray-600 max-w-sm truncate" title={item.description}>{item.description}</td>
                    <td className="p-3">{getStatusBadge(item.status)}</td>
                    <td className="p-3 text-gray-600">{item.createdOn}</td>
                    <td className="px-6 p-4 text-center whitespace-nowrap">
                      <div className="relative">
                        <button onClick={() => setActiveMenu(activeMenu === index ? null : index)} className="p-1.5 rounded-full hover:bg-gray-100" title="See Actions" >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                        {activeMenu === index && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={handleClickOutside} />
                            <div className="absolute top-1 right-8 bg-white rounded-lg shadow-lg border z-20 animate-fadeIn">
                              <div className="flex items-center p-1 gap-1">
                                <button onClick={() => handleOpenEditModal(item)} title="Edit Persona" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleOpenDeleteModal(item)} title="Delete Persona" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" >
                                  <Trash2 className="h-4 w-4 text-red-600" />
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
                <tr><td colSpan={tableHeaders.length} className="text-center p-6 text-gray-500">No personas found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center px-4 py-3 border-t">
          <span className="text-sm text-gray-600">
            Showing {filteredAndSortedData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to {Math.min(currentPage * rowsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-2 rounded-lg disabled:text-gray-300 text-gray-600 hover:bg-gray-100"><ChevronLeft className="h-5 w-5" /></button>
            <span className="text-sm text-gray-600">Page {currentPage} of {totalPages > 0 ? totalPages : 1}</span>
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-lg disabled:text-gray-300 text-gray-600 hover:bg-gray-100"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => !isSubmitting && setShowModal(false)}></div>
            <div className="inline-block w-full max-w-xl p-6 my-8 text-left bg-white shadow-xl rounded-lg z-10">
              <h3 className="text-lg font-bold text-[#8f79b8] mb-6">{itemToEdit ? 'Edit Persona' : 'Add New Persona'}</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Persona Name <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:outline-none" placeholder="Enter a unique name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:outline-none" rows="4" placeholder="Provide details about the persona's purpose"></textarea>
                </div>

                {/* --- Conditional Rendering for Status --- */}
                {!itemToEdit && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Enabled</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center cursor-pointer">
                        <input type="radio" name="status" checked={formData.enabled === true} onChange={() => setFormData({ ...formData, enabled: true })} className="form-radio h-4 w-4 text-[#8e78b7]" />
                        <span className="ml-2 text-sm text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input type="radio" name="status" checked={formData.enabled === false} onChange={() => setFormData({ ...formData, enabled: false })} className="form-radio h-4 w-4 text-[#8e78b7]" />
                        <span className="ml-2 text-sm text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex justify-end items-center gap-3 pt-4 border-t mt-6">
                  <button disabled={isSubmitting} className="px-4 py-2 text-gray-700 border border-gray-300 hover:bg-gray-100 rounded-lg disabled:opacity-50" onClick={() => setShowModal(false)}>Cancel</button>
                  {!itemToEdit && (
                    <button onClick={() => handleSave(false)} disabled={isFormInvalid || isSubmitting} className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-wait">
                      {isSubmitting ? 'Saving...' : 'Save & Add Another'}
                    </button>
                  )}
                  <button onClick={() => handleSave(true)} disabled={isFormInvalid || isSubmitting} className="px-4 py-2 text-white bg-[#8e78b7] hover:bg-[#7a67a0] rounded-lg disabled:opacity-50 disabled:cursor-wait">
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} title="Confirm Deletion" message={`Are you sure you want to delete the persona "${itemToDelete?.name}"? This action cannot be undone.`} isConfirming={isDeleting} />
    </div>
  );
}

export default Persona;