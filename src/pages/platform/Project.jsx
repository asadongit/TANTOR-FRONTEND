import { Icon } from "@iconify-icon/react";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Pencil,
  Trash2,
  X,
  List,
  RefreshCcw,
  ChevronDown,
  Search,
  BadgeCheck,
  Play,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import successBackground from "../../assets/green.png";
import { useNavigate } from "react-router-dom";
import { encrypt } from "../../utils/Crypto";
import DataTable from "../../components/DataTable";
import { useProjectData } from "../../hooks/platform/project";
import { useProjectCardData } from "../../hooks/platform/cardCounts";
import CardGrid from "../../components/CardGrid";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import Breadcrumb from "../../components/Breadcrumb";

const Project = () => {
  const { data: cardData, isLoading: isCardLoading, error: cardError, refetch: refetchCardData } = useProjectCardData();
  const { data: projectData = [], isLoading: isProjectLoading, error: projectError, refetch: refetchProjects } = useProjectData();
  const { token, decodedToken, hostnameV1 } = useAuth();
  const initialFormState = {
    project: "",
    description: "",
    // category: "",
    // subCategory: "",
    assigned_users: { assigned_users: "" },
    created_by: decodedToken?.preferred_username
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, projectId: null });
  const [isModalOpen, setIsModalOpen] = useState({
    modal1: false,
    modal2: false,
  });
  const [editMode, setEditMode] = useState(false);
  const [editProjectId, setEditProjectId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("both");
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(0); // 0 = off
  const [isAutoRefreshMenuOpen, setIsAutoRefreshMenuOpen] = useState(false);
  const autoRefreshMenuRef = useRef(null);

  const [resetSortTrigger, setResetSortTrigger] = useState(0);
  const handleClearSort = () => {
    setResetSortTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (autoRefreshInterval === 0) return;

    const interval = setInterval(() => {
      refetchProjects();
      refetchCardData();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, refetchProjects, refetchCardData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autoRefreshMenuRef.current && !autoRefreshMenuRef.current.contains(event.target)) {
        setIsAutoRefreshMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigate = useNavigate();

  const openModal = (modalName, editData = null) => {
    if (modalName === "modal1") {
      if (editData) {
        setFormData({
          project: editData.project,
          description: editData.description,
          assigned_users: { assigned_users: editData.assigned_users?.assigned_users || "" },
          // category: editData.category || "Select",
          // subCategory: editData.subCategory || "Select",
          created_by: editData.created_by || decodedToken?.preferred_username,
        });
        setEditMode(true);
        setEditProjectId(editData.project_id);
      } else {
        setFormData(initialFormState);
        setEditMode(false);
        setEditProjectId(null);
      }
      setErrors({});
    }
    setIsModalOpen((prevState) => ({ ...prevState, [modalName]: true }));
  };

  const closeModal = (modalName) => {
    setIsModalOpen((prevState) => ({ ...prevState, [modalName]: false }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      if (name === "assigned_users") {
        return {
          ...prev,
          assigned_users: {
            ...prev.assigned_users,
            assigned_users: value,
          },
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
  };

  const validateForm = () => {
    let formErrors = {};
    let isValid = true;
    const projectName = formData.project.trim();
    if (!projectName) {
      formErrors.project = "Project name is required";
      isValid = false;
    } else if (!/^[a-zA-Z]/.test(projectName)) {
      formErrors.project = "Project name must start with a letter";
      isValid = false;
    } else if (projectName.length > 100) {
      formErrors.project = "Project name cannot exceed 100 characters";
      isValid = false;
    }

    // if (!formData.description.trim()) {
    //   formErrors.description = "Description is required";
    //   isValid = false;
    // }

    const email = formData.assigned_users.assigned_users;
    if (!email.trim()) {
      formErrors.assigned_users = "Manager email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      formErrors.assigned_users = "Please enter a valid email address";
      isValid = false;
    }

    // if (!formData.category || formData.category === "Select") {
    //   formErrors.category = "Please select a category";
    //   isValid = false;
    // }

    // if (!formData.subCategory || formData.subCategory === "Select") {
    //   formErrors.subCategory = "Please select a sub-category";
    //   isValid = false;
    // }

    setErrors(formErrors);
    return isValid;
  };

  const createOrEditProject = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      let response;
      if (editMode && editProjectId) {
        response = await fetch(`${hostnameV1}/projects/${editProjectId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch(`${hostnameV1}/projects`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to save project");
      }
      refetchProjects();
      closeModal("modal1");
      openModal("modal2");
    } catch (error) {
      setErrors({ ...errors, api: error.message || "Failed to save project. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      setSearchTerm("");
      handleClearSort();
      
      await Promise.all([refetchProjects(), refetchCardData()]);
      toast.success("Projects fetched successfully");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteModal({ open: true, projectId: row.project_id });
  };

  const handleEditClick = (row) => {
    openModal("modal1", row);
  };


  const categories = ["Ingestion", "CDC", "Federation"];
  const subCategories = {
    "Ingestion": ["Migration", "Transformation", "Purge"],
    "CDC": [""],
    "Federation": [""],
  };

  const cards = [
    {
      icon: "material-symbols:database-upload-outline",
      bgcolor: "bg-[#d8d3e4] bg-opacity-25",
      iconcolor: "text-purple-700",
      title: "Purge",
      count: cardData?.purge || 0,
    },
    {
      icon: "material-symbols-light:two-pager-store-outline",
      bgcolor: "bg-[#FFC93F] bg-opacity-25",
      iconcolor: "text-orange-700",
      title: "Migration",
      count: cardData?.migration || 0,
    },
    {
      icon: "material-symbols:cloud-sync-outline",
      bgcolor: "bg-[#96CF7B] bg-opacity-25",
      iconcolor: "text-green-700",
      title: "CDC",
      count: cardData?.cdc || 0,
    },
    // {
    //   icon: "material-symbols:tab-group-outline",
    //   bgcolor: "bg-[#16ABC2] bg-opacity-25",
    //   iconcolor: "text-cyan-700",
    //   title: "Federation",
    //   count: cardData?.federation || 0,
    // },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Metadata",
      count: cardData?.metadata || 0,
    },
  ];

  const actions = [
    {
      label: "Edit",
      icon: <Pencil size={16} />,
      onClick: handleEditClick,
    },
    {
      label: "Delete",
      icon: <Trash2 size={16} />,
      onClick: handleDeleteClick,
    },
  ];

  const filteredProjectData = useMemo(() => {
    let filtered = projectData;
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(proj =>
        Object.values(proj).some(value =>
          String(value).toLowerCase().includes(search)
        )
      );
    }
    return filtered;
  }, [projectData, searchTerm]);

  const columns = [
    { key: "project", label: "Project Name" },
    { key: "description", label: "Description", sortable: false},
    { key: "owner", label: "Owner"},
    { key: "connections", label: "Connections" },
    { key: "metadata", label: "Metadata" },
    { key: "migration", label: "Migrations" },
    { key: "purge", label: "Purges" },
    { key: "cdc", label: "CDC" },
    { key: "created_at", label: "Created At" },
    { label: "Action", sortable: false },
  ];

  const handleCardClick = (card) => {
    const url = `/componentType=project&cardType=${card.title}&heading=${card.title}`;
    const encryptedUrl = encodeURIComponent(encrypt(url));
    navigate(`/details?${encryptedUrl}`);
  };

  const confirmDeleteProject = async () => {
    if (!deleteModal.projectId) return;
    try {
      const response = await fetch(`${hostnameV1}/projects/${deleteModal.projectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.detail || "Failed to delete project");
        throw new Error(errorData?.detail || "Failed to delete project");
      }
      toast.success("Project deleted successfully");
      refetchProjects();
      setDeleteModal({ open: false, projectId: null });
    } catch (error) {
      console.error("Delete failed:", error);
      setErrors({ ...errors, api: error.message || "Failed to delete project. Please try again." });
      setDeleteModal({ open: false, projectId: null });
    }
  };

  return (
    <div className="p-6">
      <Breadcrumb title="Platform" link={"/"} />
      <div className="flex gap-2 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Project</h1>
        <div className="flex items-center gap-2">

          <div className="relative">
            <input
              type="text"
              placeholder="Search projects"
              className="pl-10 pr-4 py-2 w-[300px] border border-gray-300 rounded-lg focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          <div className="relative flex items-center" ref={autoRefreshMenuRef}>
            <div className="flex rounded-lg border border-gray-400 hover:bg-gray-50 h-10">
              <button
                className="w-10 flex items-center justify-center border-r border-gray-300"
                onClick={handleRefresh}
                title="Refresh data"
                disabled={isProjectLoading || isCardLoading || refreshing}
              >
                <RefreshCcw
                  className={`h-5 w-5 text-gray-600 ${(isProjectLoading || isCardLoading || refreshing) ? "icon-rotate" : ""}`}
                />
              </button>
              <button
                className="px-2 flex items-center justify-center"
                onClick={() => setIsAutoRefreshMenuOpen(!isAutoRefreshMenuOpen)}
                title="Auto Refresh Settings"
              >
                <ChevronDown className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {isAutoRefreshMenuOpen && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  Auto Refresh
                </div>
                {[
                  { label: "Off", value: 0 },
                  { label: "5 seconds", value: 5000 },
                  { label: "10 seconds", value: 10000 },
                  { label: "1 minute", value: 60000 },
                  { label: "2 minutes", value: 120000 },
                  { label: "5 minutes", value: 300000 },
                ].map((option) => (
                  <button
                    key={option.value}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${autoRefreshInterval === option.value ? "text-[#8d77ba] font-medium bg-purple-50" : "text-gray-700"
                      }`}
                    onClick={() => {
                      setAutoRefreshInterval(option.value);
                      setIsAutoRefreshMenuOpen(false);
                    }}
                  >
                    {option.label}
                    {autoRefreshInterval === option.value && (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
            )}
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
            onClick={() => openModal("modal1")}
            type="button"
            className="text-white bg-[#8e78b7] hover:bg-[#7a66a3] h-10 focus:ring-2 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2 flex items-center justify-center dark:bg-[#8e78b7] dark:hover:bg-[#7a66a3] focus:outline-none dark:focus:ring-[#8e78b7] transition-colors"
          >
            <Icon icon="material-symbols:add" width="20" height="20" className="mr-1 inline-block" />
            Create Project
          </button>
        </div>
      </div>

      {viewMode !== "list" && (
        <CardGrid cards={cards} onCardClick={handleCardClick} isLoading={isCardLoading} />
      )}

      <DataTable
        columns={columns}
        data={filteredProjectData}
        actions={actions}
        isLoading={isProjectLoading}
        isError={projectError}
        refetch={refetchProjects}
        resetSortTrigger={resetSortTrigger}
      />

      {/* Add/Edit Project Modal */}
      {isModalOpen.modal1 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[1000px] p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div>
                  <Icon
                    className="h-5 w-5 text-[#8e78b7]"
                    icon={"material-symbols:tactic-rounded"}
                    width="24"
                    height="24"
                  />
                </div>
                <h2 className="text-xl font-bold text-[#8e78b7]">
                  {editMode ? "Edit Project" : "Create a Project"}
                </h2>
              </div>
              <button
                onClick={() => closeModal("modal1")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errors.api && (
              <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                {errors.api}
              </div>
            )}

            <div className="grid grid-cols-3 gap-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-black mb-1.5">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="project"
                      value={formData.project}
                      onChange={handleInputChange}
                      placeholder="Name"
                      maxLength={100}
                      className={`w-full p-2.5 border ${errors.project ? 'border-red-500' : 'border-gray-400'} rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]`}
                    />
                    {errors.project && (
                      <p className="mt-1 text-sm text-red-500">{errors.project}</p>
                    )}
                  </div>

                  {/* <div>
                    <div className="relative">
                      <label className="block text-sm text-black mb-1.5">
                        Sub Category
                      </label>
                      <select
                        name="subCategory"
                        value={formData.subCategory}
                        onChange={handleInputChange}
                        className={`w-full p-2.5 border ${errors.subCategory ? 'border-red-500' : 'border-gray-400'} rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] appearance-none bg-white`}
                      >
                        <option value="Select">Select</option>
                        {formData.category && formData.category !== "Select" &&
                          subCategories[formData.category]?.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))
                        }
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-10 pointer-events-none text-gray-500"
                        size={18}
                      />
                      {errors.subCategory && (
                        <p className="mt-1 text-sm text-red-500">{errors.subCategory}</p>
                      )}
                    </div>
                  </div> */}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-black mb-1.5">
                      Description
                      {/* <span className="text-red-500">*</span> */}
                    </label>
                    <input
                      name="description"
                      type="text"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Description"
                      className={`w-full p-2.5 border ${errors.description ? 'border-red-500' : 'border-gray-400'} rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]`}
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  {/* <div>
                    <div className="relative">
                      <label className="block text-sm text-black mb-1.5">
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className={`w-full p-2.5 border ${errors.category ? 'border-red-500' : 'border-gray-400'} rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] appearance-none bg-white`}
                      >
                        <option value="Select">Select</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-10 pointer-events-none text-gray-500"
                        size={18}
                      />
                      {errors.category && (
                        <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                      )}
                    </div>
                  </div> */}

                  <div>
                    <div className="relative">
                      <label className="block text-sm text-black mb-1.5">
                        Manager <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="assigned_users"
                        value={formData.assigned_users.assigned_users}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            assigned_users: { assigned_users: e.target.value },
                          }))
                        }
                        placeholder="Manager"
                        className={`w-full p-2.5 border ${errors.assigned_users ? 'border-red-500' : 'border-gray-400'} rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]`}
                      />
                      <Search
                        className="absolute right-3 top-10 pointer-events-none text-gray-500"
                        size={18}
                      />
                      {errors.assigned_users && (
                        <p className="mt-1 text-sm text-red-500">{errors.assigned_users}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-start gap-4 mt-8">
              <button
                onClick={() => closeModal("modal1")}
                className="px-6 py-2 border border-gray-400 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={createOrEditProject}
                disabled={isSubmitting}
                className={`px-6 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a66a3] transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (editMode ? 'Saving...' : 'Creating...') : (editMode ? 'Save' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}


      {isModalOpen.modal2 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[600px] overflow-hidden shadow-xl">
            <div className="relative h-24">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${successBackground})` }}
              >
                <button
                  onClick={() => closeModal("modal2")}
                  className="absolute top-4 right-4 text-black p-1 hover:bg-white hover:bg-opacity-20 rounded-full"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="flex items-center space-x-4 mb-4">
                <BadgeCheck className="w-8 h-8 text-green-500" />{" "}
                <h2 className="text-2xl font-bold">Congratulations!</h2>
              </div>
              <p className="text-lg text-gray-800 mb-2">
                Your have successfully created a project  "{formData.project}".
              </p>


              <div className="flex justify-start gap-4 mt-8">
                <button
                  onClick={() => closeModal("modal2")}
                  className="px-6 py-3 text-lg bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a66a3] transition-colors"
                >
                  Alright
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[400px] p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[#8e78b7] mb-4">Delete Project</h2>
            <p className="mb-6 text-gray-700">Are you sure you want to delete this project?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteModal({ open: false, projectId: null })}
                className="px-6 py-2 border border-gray-400 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProject}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Project;