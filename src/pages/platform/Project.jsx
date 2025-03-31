import { Icon } from "@iconify-icon/react";
import { useState, useEffect } from "react";
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
  AlertCircle
} from "lucide-react";
import successBackground from "../../assets/green.png";
import { useNavigate } from "react-router-dom";
import { encrypt } from "../../utils/Crypto";
import DataTable from "../../components/DataTable";
import { useProjectData } from "../../hooks/platform/project";
import { useProjectCardData } from "../../hooks/platform/cardCounts";
import CardGrid from "../../components/CardGrid";
import { useAuth } from "../../context/AuthContext";
const Project = () => {
  const { data: cardData, isLoading: isCardLoading, error: cardError } = useProjectCardData();
  const { data: projectData = [], isLoading: isProjectLoading, error: projectError, refetch: refetchProjects } = useProjectData();
  const {token, decodedToken} = useAuth();

  const initialFormState = {
    project: "",
    description: "",
    // category: "",
    // subCategory: "",
    assigned_users: { assigned_users: "" },
    created_by:decodedToken?.preferred_username
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hostname = import.meta.env.VITE_FAST_API;

  const [isModalOpen, setIsModalOpen] = useState({
    modal1: false,
    modal2: false,
  });

  const navigate = useNavigate();

  const openModal = (modalName) => {
    if (modalName === "modal1") {
      setFormData(initialFormState);
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

    if (!formData.project.trim()) {
      formErrors.project = "Project name is required";
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

  const createProject = async () => {
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
           
      const response = await fetch(`${hostname}/projects`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to create project");
      }
  
      refetchProjects();
      
      closeModal("modal1");
      openModal("modal2");
    } catch (error) {
      console.error("Creation failed:", error);
      setErrors({
        ...errors,
        api: error.message || "Failed to create project. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRefresh = () => {
    refetchProjects();
  };

  const categories = ["Data Migration", "Data Integration", "Data Transformation", "Data Analytics"];
  const subCategories = {
    "Data Migration": ["Database Migration", "Cloud Migration", "App Migration"],
    "Data Integration": ["API Integration", "System Integration", "ETL Processes"],
    "Data Transformation": ["Data Cleansing", "Data Enrichment", "Format Conversion"],
    "Data Analytics": ["BI Reports", "Data Visualization", "Predictive Analytics"]
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
      count: cardData?.metadata || 0,
    },
    {
      icon: "material-symbols:cloud-sync-outline",
      bgcolor: "bg-[#96CF7B] bg-opacity-25",
      iconcolor: "text-green-700",
      title: "CDC",
      count: cardData?.cdc || 0,
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Federation",
      count: cardData?.federation || 0,
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Transformation",
      count: cardData?.migration || 0,
    },
  ];

  const actions = [
    {
      label: "Edit",
      icon: <Pencil size={16} />,
      onClick: (row) => console.log("Edit clicked for", row),
    },
    {
      label: "Delete",
      icon: <Trash2 size={16} />,
      onClick: (row) => console.log("Delete clicked for", row),
    },
    {
      label: "Run",
      icon: <Play size={16} fill="currentColor" />,
      onClick: (row) => console.log("Run clicked for", row),
    },
  ];
  
  const columns = [
    { key: "project", label: "Project Name" },
    { key: "created_by", label: "Created By" },
    { key: "owner", label: "Owner" },
    { key: "connections", label: "Connections" },
    { key: "metadata", label: "Migrations" },
    { key: "migration", label: "Transformations" },
    { key: "purge", label: "Purges" },
    { key: "cdc", label: "CDC" },
    { label: "Action", sortable: false },
  ];
  
  const handleCardClick = (card) => {
    const url = `/componentType=project&cardType=${card.title}&heading=${card.title}`;
    const encryptedUrl = encodeURIComponent(encrypt(url));
    navigate(`/details?${encryptedUrl}`);
  };

  return (
    <div className="p-6">
      <div className="flex gap-2 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Project</h1>
        <div className="flex items-center">
       
          <button
            type="button"
            className="text-black shadow-lg hover:bg-[#8e78b7] hover:text-white focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7] transition-colors"
          >
            <List className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="text-black shadow-lg hover:bg-[#8e78b7] hover:text-white focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7] transition-colors"
            onClick={handleRefresh}
          >
            <RefreshCcw className={`h-5 w-5 ${isProjectLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => openModal("modal1")}
            type="button"
            className="text-white bg-[#8e78b7] hover:bg-[#7a66a3] focus:ring-2 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 dark:bg-[#8e78b7] dark:hover:bg-[#7a66a3] focus:outline-none dark:focus:ring-[#8e78b7] transition-colors"
          >
            + Create Project
          </button>
        </div>
      </div>

   

    
        <CardGrid cards={cards} onCardClick={handleCardClick} />

     
        <DataTable
          columns={columns}
          data={projectData}
          actions={actions}
          emptyMessage="No projects found. Create your first project to get started!"
        />

      {/* Add Project Modal */}
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
                  Create a Project
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
                      className={`w-full p-2.5 border ${errors.project ? 'border-red-500' : 'border-gray-400'} rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]`}
                    />
                    {errors.project && (
                      <p className="mt-1 text-sm text-red-500">{errors.project}</p>
                    )}
                  </div>
                  <div>
                    <div className="relative">
                      <label className="block text-sm text-black mb-1.5">
                        Sub Category 
                        {/* <span className="text-red-500">*</span> */}
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
                  </div>
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
                        placeholder="manager@example.com"
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

              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="relative">
                      <label className="block text-sm text-black mb-1.5">
                        Category 
                        {/* <span className="text-red-500">*</span> */}
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
                onClick={createProject}
                disabled={isSubmitting}
                className={`px-6 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a66a3] transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Creating...' : 'Create'}
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
    </div>
  );
};

export default Project;