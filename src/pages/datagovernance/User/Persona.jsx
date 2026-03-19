import React, { useEffect, useState, useRef } from "react";
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
  ChevronDown,
  AlertTriangle,
  Info
} from "lucide-react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";
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
.toggle-disabled {
    pointer-events: none;
    opacity: 0.6;
  }
  
  .toggle-disabled svg {
    display: none !important;
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
      className={`relative inline-flex ${s.h} ${s.w} ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"} rounded-full transition-colors ease-in-out duration-200 ${
        enabled ? "bg-[#1a9962]" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block ${s.knob} transform rounded-full bg-white transition ease-in-out duration-200 m-0.5 ${
          enabled ? s.translate : "translate-x-0"
        }`}
      />
    </div>
  );
};

const getInitial = (r) => {
  const str = (r?.title || r?.name || r?.id || "").toString();
  const match = str.match(/[A-Za-z0-9]/);
  return match ? match[0].toUpperCase() : "";
};

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isConfirming,
  policyCount = null,
  policyCountLoading = false
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button title="Close" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <svg className="h-5 w-5 text-gray-600" viewBox="0 0 24 24"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="mt-1 flex-1">
            <p className="text-sm text-gray-600">{message}</p>

            {policyCountLoading ? (
              <div className="mt-3 flex items-center gap-2">
                <RefreshCcw className="h-4 w-4 text-gray-500 animate-spin" />
                <p className="text-xs text-gray-500">Checking related policies...</p>
              </div>
            ) : policyCount !== null && policyCount > 0 ? (
              <p className="text-xs text-orange-600 mt-3 font-medium">
                ⚠️ This will also delete {policyCount} {policyCount === 1 ? "policy" : "policies"} linked to this persona.
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className=" px-4 py-2 text-sm font-medium text-white bg-[#8e78b7] hover:bg-[#7a67a0] rounded-lg focus:outline-none"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none disabled:bg-red-300 disabled:cursor-wait"
          >
            {isConfirming ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Persona = () => {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [personaToEdit, setPersonaToEdit] = useState(null);
  const [personaToDelete, setPersonaToDelete] = useState(null);

  const [cards, setCards] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("cards");
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [togglingStatus, setTogglingStatus] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [showViewModeMenu, setShowViewModeMenu] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const [formData, setFormData] = useState({ name: "", description: "", enabled: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [policyCount, setPolicyCount] = useState(null);
  const [policyCountLoading, setPolicyCountLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const initialFetchDoneRef = useRef(false);
  const { token } = useAuth();
  const { decodedToken } = useAuth();

  const processCards = (data = []) => data.map(item => ({
    id: item.id,
    title: item.name,
    description: item.description || "No description available",
    users: item.user_count || 0,
    enabled: item.attributes?.Status?.[0] === "Enabled",
    icon: "material-symbols:tab-group-outline",
    bgcolor: "bg-[#8d77ba] bg-opacity-25",
    iconcolor: "text-[#8d77ba]",
  }));

  const fetchPersonaDashboard = async () => {
    try {
      const res = await fetch(`${window._env_?.VITE_FAST_API}/auth/personahomepage`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to fetch dashboard: ${res.status}`);
      const data = await res.json();
      setCards(processCards(data));
      return { success: true };
    } catch (err) {
      console.error("fetchPersonaDashboard:", err);
      return { success: false, error: err.message };
    }
  };

  const fetchPersonaList = async () => {
    try {
      const res = await fetch(`${window._env_?.VITE_FAST_API}/auth/personalist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to fetch list: ${res.status}`);
      const data = await res.json();
      const transformed = data.map(item => {
        const createdOn = item.attributes?.createdOn?.[0] || "";
        let createdFormatted = createdOn;
        try {
          const d = new Date(createdOn);
          if (!isNaN(d.getTime())) createdFormatted = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {}
        return {
          id: item.id,
          name: item.name,
          description: item.description || "No description available",
          status: item.attributes?.Status?.[0] === "Enabled" ? "Enabled" : "Disabled",
          createdOn: createdFormatted,
        };
      });
      setTableData(transformed);
      return { success: true };
    } catch (err) {
      console.error("fetchPersonaList:", err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    if (!initialFetchDoneRef.current) {
      initialFetchDoneRef.current = true;
      Promise.all([fetchPersonaDashboard(), fetchPersonaList()]).finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshAllData = async (showToast = false) => {
    setRefreshing(true);
    setSearchTerm("");
    setCurrentPage(1);
    try {
      const [dResult, lResult] = await Promise.all([fetchPersonaDashboard(), fetchPersonaList()]);
      if (dResult.success && lResult.success) {
        if (showToast) {
          setToast({ show: true, message: "Persona data refreshed successfully", type: "success" });
          setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
        }
        return { success: true };
      } else {
        if (showToast) {
          setToast({ show: true, message: "Failed to refresh persona data", type: "error" });
          setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
        }
        return { success: false, error: "Failed to refresh" };
      }
    } catch (err) {
      console.error("refreshAllData:", err);
      if (showToast) {
        setToast({ show: true, message: "Failed to refresh persona data", type: "error" });
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
      }
      return { success: false, error: err.message };
    } finally {
      setRefreshing(false);
    }
  };

  const togglePersona = async (identifier) => {
    const index = cards.findIndex(c => c.title === identifier);
    if (index === -1) return;
    const persona = cards[index];
    const newStatus = !persona.enabled;
    setTogglingStatus(identifier);
    try {
      const res = await fetch(`${window._env_?.VITE_FAST_API}/auth/personastatus`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: persona.title, status: newStatus ? "Enabled" : "Disabled", updated_by: decodedToken?.preferred_username}),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Status patch failed: ${res.status}`);
      }
      const newCards = [...cards];
      newCards[index].enabled = newStatus;
      setCards(newCards);
      setTableData(prev => prev.map(it => it.name === persona.title ? { ...it, status: newStatus ? "Enabled" : "Disabled" } : it));
    } catch (err) {
      console.error("togglePersona:", err);
      setToast({ show: true, message: "Failed to update persona status", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    } finally {
      setTogglingStatus(null);
    }
  };

  const fetchPolicyCount = async (personaName) => {
    setPolicyCountLoading(true);
    setPolicyCount(null);
    try {
      const res = await fetch(`${window._env_?.VITE_FAST_API}/auth/policies/count/persona/${encodeURIComponent(personaName)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to get policy count: ${res.status}`);
      const data = await res.json();
      setPolicyCount(data.policy_count ?? null);
    } catch (err) {
      console.error("fetchPolicyCount:", err);
      setPolicyCount(null);
    } finally {
      setPolicyCountLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setPersonaToEdit(null);
    setFormData({ name: "", description: "", enabled: true });
    setShowModal(true);
  };

  const handleOpenEditModal = (p) => {
    setPersonaToEdit(p);
    setFormData({
      name: p.name,
      description: p.description,
      enabled: (p.status || "").toLowerCase() === "enabled"
    });
    setShowEditModal(true);
    setActiveMenu(null);
  };

  const handleOpenDeleteModal = (p) => {
    setPersonaToDelete(p);
    setShowDeleteModal(true);
    setActiveMenu(null);
    if (p?.name) fetchPolicyCount(p.name);
  };

  const handleConfirmDelete = async () => {
    if (!personaToDelete) return;
    setIsDeleting(true);
    try {
      const nameEncoded = encodeURIComponent(personaToDelete.name);
      const res = await fetch(`${window._env_?.VITE_FAST_API}/auth/deletepersona`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: personaToDelete.name,
          updated_by: decodedToken?.preferred_username
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Failed to delete: ${res.status}`);
      }
      await refreshAllData(true);
      setToast({ show: true, message: `Persona "${personaToDelete.name}" deleted`, type: "success" });
      setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    } catch (err) {
      console.error("handleConfirmDelete:", err);
      setToast({ show: true, message: `Failed to delete persona: ${err.message}`, type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setPersonaToDelete(null);
      setPolicyCount(null);
    }
  };

  const handleSaveNew = async (closeOnSave = true) => {
    if (!formData.name.trim() || !formData.description.trim()) {
      setToast({ show: true, message: "Name and Description are required.", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
      return;
    }
    setIsSubmitting(true);
    try {
      if (personaToEdit) {
        // edit
        const payload = { name: personaToEdit.name, new_name: formData.name.trim(), description: formData.description.trim(), updated_by: decodedToken?.preferred_username };
        const res = await fetch(`${window._env_?.VITE_FAST_API}/auth/editpersona`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Failed to edit: ${res.status}`);
        }
        setToast({ show: true, message: `Persona "${payload.new_name}" updated`, type: "success" });
      } else {
        // create
        const payload = { name: formData.name.trim(), description: formData.description.trim(), status: formData.enabled ? "yes" : "no" };
        const res = await fetch(`${window._env_?.VITE_FAST_API}/auth/createpersona`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Failed to create: ${res.status}`);
        }
        setToast({ show: true, message: `Persona "${payload.name}" created`, type: "success" });
      }
      await refreshAllData(true);
      if (closeOnSave) {
        setShowModal(false);
        setShowEditModal(false);
      } else {
        if (!personaToEdit) setFormData({ name: "", description: "", enabled: true });
      }
    } catch (err) {
      console.error("handleSaveNew:", err);
      setToast({ show: true, message: `Save failed: ${err.message}`, type: "error" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    }
  };

  const filteredCards = cards.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredTable = tableData.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.description.toLowerCase().includes(searchTerm.toLowerCase()));

  // cards pagination
  const cardTotalPages = Math.ceil(filteredCards.length / itemsPerPage);
  const cardStartIndex = (currentPage - 1) * itemsPerPage;
  const displayedCards = filteredCards.slice(cardStartIndex, cardStartIndex + itemsPerPage);

  // list pagination
  const listTotalPages = Math.ceil(filteredTable.length / itemsPerPage);
  const listStartIndex = (currentPage - 1) * itemsPerPage;
  const displayedRows = filteredTable.slice(listStartIndex, listStartIndex + itemsPerPage);

  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNextPage = () => {
    const max = viewMode === "cards" ? cardTotalPages : listTotalPages;
    setCurrentPage(p => Math.min(max || 1, p + 1));
  };

  const handleItemsPerPageChange = (e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); };

  const handleClickOutside = () => { setActiveMenu(null); setShowViewModeMenu(false); };

  return (
    // <div className="p-4 bg-[#F3F5F7] min-h-screen">
    <div className="p-4  min-h-screen">
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
      <div className="flex items-center justify-between mb-[18px] overflow-visible">
        <div className="flex items-center gap-2 overflow-visible">
          <h1 className="text-2xl font-semibold">Persona</h1>
          <div className="relative group">
  
</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <img src={Search} alt="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10 w-64 h-10 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              placeholder="Search persona"
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

          <button className="flex items-center gap-2 px-4 py-2 bg-[#8e78b7] text-white rounded-lg" onClick={handleOpenAddModal}>
            <Plus className="h-5 w-5" /> New persona
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
              {filteredCards.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {displayedCards.map((card, index) => (
                     <div key={card.id || index} className="bg-white rounded-lg border border-gray-100 transform transition-all duration-300 hover:shadow-md hover:-translate-y-1 overflow-hidden">
                        <div className="p-6">
                          <div className="flex items-start justify-between gap-2 min-w-0">
  <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 ${card.bgcolor} rounded-full ${card.iconcolor} flex-shrink-0`} aria-hidden="true">
                                <span className="text-sm md:text-base font-semibold">{getInitial(card)}</span>
                              </div>
                              <h3 className="text-lg font-semibold truncate">{card.title}</h3>
                            </div>

                            <div className="relative flex-shrink-0">
  <button onClick={() => setActiveMenu(activeMenu === `card-${index}` ? null : `card-${index}`)} className="p-1.5 rounded-full hover:bg-gray-100">
                                <MoreVertical className="h-5 w-5 text-gray-600" />
                              </button>
                              {activeMenu === `card-${index}` && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={handleClickOutside} />
                                  <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border z-20 animate-fadeIn">
                                    <div className="flex items-center p-1 gap-1">
                                      <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => { handleOpenEditModal({ name: card.title, description: card.description, status: card.enabled ? "Enabled" : "Disabled" }); setActiveMenu(null); }}>
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                      <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => { handleOpenDeleteModal({ name: card.title, description: card.description }); setActiveMenu(null); }}>
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          <p className="text-gray-500 mt-4 text-sm line-clamp-2">{card.description}</p>

                          <div className="flex items-center justify-between mt-6">
                            <div className="flex items-center gap-2">
                              <Icon icon="material-symbols:supervisor-account-outline" width="24" height="24" style={{ color: '#818181' }} />
                              <span className="text-sm">{card.users.toString().padStart(2, "0")}</span>
                            </div>

                            <div className="flex items-center gap-2">
  <span className={`text-sm ${card.enabled ? "text-[#1a9962]" : "text-gray-400"}`}>
    {card.enabled ? "Enabled" : "Disabled"}
  </span>
  <div className={togglingStatus === card.title ? 'toggle-disabled' : ''}>
    <Toggle
      enabled={togglingStatus === card.title ? !card.enabled : card.enabled}
      onToggle={() => togglePersona(card.title)}
      disabled={togglingStatus === card.title}
      size="md"
    />
  </div>
</div>
                          </div>
                        </div>
                      </div>
                    ))}

                  </div>

                  {filteredCards.length > 0 && (
                    <div className="flex flex-col md:flex-row items-center justify-between mt-6 mb-6">
                      <div className="text-sm text-gray-500 mb-4 md:mb-0">Showing {cardStartIndex + 1} to {Math.min(cardStartIndex + displayedCards.length, filteredCards.length)} of {filteredCards.length} personas</div>

                      <div className="flex items-center space-x-4" style={{ transform: 'translateX(-20px)' }}>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-500">Show per page</label>
                          <div className="relative">
                            <select value={itemsPerPage} onChange={handleItemsPerPageChange} className="border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-center pl-2 pr-8" style={{ height: '31px', width: '55px', WebkitAppearance: 'none', appearance: 'none', paddingRight: '24px'}}>
                              <option value={12}>12</option>
                              <option value={24}>24</option>
                              <option value={48}>48</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-700" size={14} />
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
                  <p>No personas found matching "{searchTerm}"</p>
                  <button onClick={() => setSearchTerm("")} className="mt-2 text-[#8e78b7] hover:underline transition-all duration-200">Clear search</button>
                </div>
              )}
            </>
          )}

          {viewMode === 'list' && (
            <>
              <div className="bg-white rounded-lg shadow mt-0 overflow-x-auto" style={{ overflowY: 'visible' }}>
        <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="bg-[#29304a] text-white text-sm">
                      <th className="text-left" style={{ padding: '16px 19.75px' }}>ID</th>
                      <th className="text-left" style={{ padding: '16px 19.75px' }}>Name</th>
                      <th className="text-left" style={{ padding: '16px 19.75px' }}>Description</th>
                      <th className="text-center" style={{ padding: '16px 19.75px' }}>Status</th>
                      <th className="text-left" style={{ padding: '16px 19.75px' }}>Created On</th>
                      <th className="text-left" style={{ padding: '16px 19.75px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {displayedRows.map((row, idx) => (
                      <tr key={row.id || idx} className="border-b hover:bg-gray-50">
                        <td style={{ padding: '16px 19.75px' }} title={row.id}>{row.id?.substring(0, 8)}...</td>
                        <td style={{ padding: '16px 19.75px' }} className="text-gray-600">
                          <div className="flex items-center">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#8d77ba] bg-opacity-25 text-[#8d77ba] mr-2">
                              <span className="text-sm font-semibold">{getInitial(row)}</span>
                            </div>
                            <div className="truncate">{row.name}</div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 19.75px' }} className="text-gray-600 max-w-xs truncate">{row.description}</td>
                        <td style={{ padding: '16px 19.75px' }}>
                          <div className="text-center align-middle">
                            {row.status === 'Enabled' ? (
                              <span className="inline-block px-6 py-2 rounded-md text-sm font-medium" style={{ background: '#def3e9', color: '#1a9962', minWidth: '88px', textAlign: 'center' }} title="Enabled">Enabled</span>
                            ) : (
                              <span className="inline-block px-6 py-2 rounded-md text-sm font-medium" style={{ background: '#f3f4f6', color: '#6b7280', minWidth: '88px', textAlign: 'center' }} title="Disabled">Disabled</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px 19.75px' }} className="text-gray-600">{row.createdOn || "-"}</td>
                        <td style={{ padding: '16px 19.75px' }}>
                          <div className="relative">
                            <button onClick={() => setActiveMenu(activeMenu === idx ? null : idx)} className="p-1.5 rounded-full hover:bg-gray-100">
                              <MoreHorizontal className="h-5 w-5 text-gray-600" />
                            </button>

                            {activeMenu === idx && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={handleClickOutside} />
                                <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border z-20 animate-fadeIn">
                                  <div className="flex items-center p-1 gap-1">
                                    <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => { setPersonaToEdit(row); setFormData({ name: row.name, description: row.description, enabled: (row.status || "").toLowerCase() === 'enabled' }); setShowEditModal(true); setActiveMenu(null); }}>
                                      <Pencil className="h-4 w-4" />
                                    </button>

                                    <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2" 
  onClick={async () => { setActiveMenu(null); await togglePersona(row.name); }} 
  disabled={togglingStatus === row.name} 
  title={row.status === 'Enabled' ? 'Disable' : 'Enable'}>
  <Toggle
    enabled={togglingStatus === row.name ? row.status !== 'Enabled' : row.status === 'Enabled'}
    onToggle={async () => { setActiveMenu(null); await togglePersona(row.name); }}
    disabled={togglingStatus === row.name}
    size="sm"
  />
</button>

                                    <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => { setPersonaToDelete(row); setShowDeleteModal(true); setActiveMenu(null); }}>
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

                    {!loading && displayedRows.length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-gray-500">
                          {searchTerm ? (
                            <div className="flex flex-col items-center justify-center py-8">
                              <Icon icon="material-symbols:search-off-outline" width="48" height="48" className="mb-4 text-gray-400" />
                              <p>No personas found matching "{searchTerm}"</p>
                              <button onClick={() => setSearchTerm("")} className="mt-2 text-[#8e78b7] hover:underline transition-all duration-200">Clear search</button>
                            </div>
                          ) : "No personas found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!loading && filteredTable.length > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between mt-6 mb-6">
                  <div className="text-sm text-gray-500 mb-4 md:mb-0">Showing {listStartIndex + 1} to {Math.min(listStartIndex + displayedRows.length, filteredTable.length)} of {filteredTable.length} personas</div>

                  <div className="flex items-center space-x-4" style={{ transform: 'translateX(-20px)' }}>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-500">Show per page</label>
                      <div className="relative">
                        <select value={itemsPerPage} onChange={handleItemsPerPageChange} className="border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-center pl-2 pr-8" style={{ height: '31px', width: '55px', WebkitAppearance: 'none', appearance: 'none', paddingRight: '28px' }}>
                          <option value={12}>12</option>
                          <option value={24}>24</option>
                          <option value={48}>48</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-700" size={14} />
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

      {/* Add / Edit Modal */}
      {(showModal || showEditModal) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => { if (!isSubmitting) { setShowModal(false); setShowEditModal(false); } }}></div>
            <div className="inline-block w-full max-w-xl p-6 my-8 text-left bg-white shadow-xl rounded-lg z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#282F49]">{personaToEdit ? 'Edit Persona' : 'Add Persona'}</h3>
                {/* right side reserved for future controls (close button, etc.) */}
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-[#332849] font-bold mb-1">Persona Name <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent text-[#818181]" placeholder="Enter a unique name" />
                </div>
                <div>
                  <label className="block text-sm text-[#332849] font-bold mb-1">Description <span className="text-red-500">*</span></label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent text-[#818181]" rows="4" placeholder="Provide details about the persona's purpose"></textarea>
                </div>

                {!personaToEdit && (
                  <div>
                    {/* <label className="block text-sm font-medium text-gray-700 mb-2">Enabled</label> */}
                    <div className="flex items-center gap-4">
                      <Toggle enabled={!!formData.enabled} onToggle={() => setFormData({ ...formData, enabled: !formData.enabled })} />
                      <span className={`text-sm ${formData.enabled ? 'text-[#1a9962]' : 'text-gray-400'}`}>{formData.enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-start items-center gap-3 pt-4 border-t mt-6">
                  <button
                    disabled={isSubmitting}
                    onClick={() => { setShowModal(false); setShowEditModal(false); }}
                    className="px-4 py-2 w-28 text-center text-white bg-[#8e78b7] hover:bg-[#7a67a0] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveNew(true)}
                    disabled={!formData.name.trim() || !formData.description.trim() || isSubmitting}
                    className="px-4 py-2 w-28 text-center text-white bg-[#8e78b7] hover:bg-[#7a67a0] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setPolicyCount(null); setPolicyCountLoading(false); }}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the persona "${personaToDelete?.name}"? This action cannot be undone.`}
        isConfirming={isDeleting}
        policyCount={policyCount}
        policyCountLoading={policyCountLoading}
      />
    </div>
  );
};

export default Persona;