import { Icon } from "@iconify-icon/react";
import { useState, useEffect, useCallback } from "react";
import {
  Pencil,
  Trash2,
  X,
  List,
  RefreshCcw,
  ChevronDown,
  Search,
  BadgeCheck,
} from "lucide-react";
import successBackground from "../../assets/green.png";
import { useNavigate } from "react-router-dom";
import { encrypt } from "../../utils/Crypto";

const Project = () => {

  const hostname = import.meta.env.VITE_FAST_API;
  const token = import.meta.env.VITE_ACCESS_TOKEN;

  let projectsList;

  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState({
    modal1: false,
    modal2: false,
  });

  const navigate = useNavigate();
  // Function to open a specific modal
  const openModal = (modalName) => {
    setIsModalOpen((prevState) => ({ ...prevState, [modalName]: true }));
  };

  // Function to close a specific modal
  const closeModal = (modalName) => {
    setIsModalOpen((prevState) => ({ ...prevState, [modalName]: false }));
  };


  const [refresh, setRefresh] = useState(0);
  const handleRefresh = () => {
    fetchProjects(true);
    setRefresh((prev) => prev + 1);
  };

  const fetchProjects = useCallback(async (forceRefresh = false) => {
    try {
      const cachedProjectsResponse =
        sessionStorage.getItem("projectsList");

      if (!forceRefresh && cachedProjectsResponse) {
        projectsList = JSON.parse(cachedProjectsResponse);
        setProjects(projectsList);
      }
      else {
        const projectsResponse = await fetch(`${hostname}/projects`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        projectsList = await projectsResponse.json();
        sessionStorage.setItem(
          "projectsList",
          JSON.stringify(projectsList)
        );
      }
      setProjects(projectsList);
    } catch (error) {
      console.error("Error fetching reports", error);
    }
  }, []);

  useEffect(() => {
    fetchProjects(refresh > 0);
  }, [fetchProjects, refresh]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "assigned_users") {
      setProjectData(prev => ({
        ...prev,
        assigned_users: {
          assigned_users: value
        }
      }));
    } else {
      setProjectData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const [projectData, setProjectData] = useState({
    project: "",
    description: "",
    assigned_users: {
      assigned_users: ""
    }
  });

  const createProject = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("user"));

      const payload = {
        project: projectData.project,
        description: projectData.description,
        assigned_users: {
          assigned_users: projectData.assigned_users.assigned_users
        },
        created_by: currentUser?.email || "system_default"
      };

      const response = await fetch(`${hostname}/projects`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Failed to create project");


      closeModal("modal1");

      sessionStorage.removeItem("projectsList");
      await fetchProjects(true);

      openModal("modal2");

      setProjectData({
        project: "",
        description: "",
        assigned_users: {
          assigned_users: ""
        }
      });
  
    } catch (error) {
      console.error("Creation failed:", error);
      alert("Failed to create project. Please try again.");
    }
  };

  const sampleData = [
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
    },
  ];

  const cards = [
    {
      icon: "material-symbols:database-upload-outline",
      bgcolor: "bg-[#d8d3e4] bg-opacity-25",
      iconcolor: "text-purple-700",
      title: "Purge",
      count: "27",
      endpoint: "purges"
    },
    {
      icon: "material-symbols-light:two-pager-store-outline",
      bgcolor: "bg-[#FFC93F] bg-opacity-25",
      iconcolor: "text-orange-700",
      title: "Migration",
      count: "11",
      endpoint: "metadata-archivals"
    },
    {
      icon: "material-symbols:cloud-sync-outline",
      bgcolor: "bg-[#96CF7B] bg-opacity-25",
      iconcolor: "text-green-700",
      title: "CDC",
      count: "07",
      endpoint: "cdc"

    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Federation",
      count: "17",
      endpoint: "federation"

    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Transformation",
      count: "06",
      endpoint: "migrations"

    },
  ];

  return (
    <div className="p-6">
      <div className="flex gap-2 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Project</h1>
        <div>
          <button
            type="button"
            className="text-black shadow-lg hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            <List className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="text-black shadow-lg hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
            onClick={handleRefresh}
          >
            <RefreshCcw className="h-5 w-5" />
          </button>
          <button
            onClick={() => openModal("modal1")}
            type="button"
            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            + Create Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 transition-transform transform hover:scale-105 hover:shadow-md"
          >
            <div className="flex items-center mb-2">
              <div
                className={`flex items-center justify-center aspect-square w-8 md:w-10 ${card.bgcolor} rounded-full ${card.iconcolor} mr-2`}
              >
                <Icon icon={card.icon} />
              </div>
              <h3 className="text-lg font-semibold">{card.title}</h3>
            </div>
            <p className="text-black text-5xl font-bold">{card.count}</p>

            <button
              className="mt-4 text-purple-600 text-sm font-normal relative transition-all duration-300 group hover:scale-105 hover:font-medium"
              onClick={() => {
                const url = `/componentType=project&cardType=${card.endpoint}&heading=${card.title}`;
                const encryptedUrl = encodeURIComponent(encrypt(url));
                navigate(`/details?${encryptedUrl}`);
              }}

            >
              See details
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-purple-600 transition-all duration-300 group-hover:w-full"></span>
            </button>
          </div>
        ))}
      </div>
      {/* Add Project Model */}

      {isModalOpen.modal1 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[1000px] p-8">
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

            <div className="grid grid-cols-3 gap-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-black mb-1.5">
                      Name
                    </label>
                    <input
                      type="text"
                      name="project"
                      value={projectData.project}
                      onChange={handleInputChange}
                      placeholder="Name"
                      className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
                    />
                  </div>
                  <div>
                    <div className="relative">
                      <label className="block text-sm text-black mb-1.5">
                        Sub Category
                      </label>
                      <select
                        className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] appearance-none bg-white">
                        <option>Select</option>
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-10 pointer-events-none text-gray-500"
                        size={18}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-black mb-1.5">
                      Description
                    </label>
                    <input
                      type="text"
                      name="description"
                      value={projectData.description}
                      onChange={handleInputChange}
                      placeholder="Description"
                      className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
                    />
                  </div>
                  <div>
                    <div className="relative">
                      <label className="block text-sm text-black mb-1.5">
                        Manager
                      </label>
                      <input
                        type="text"
                        name="assigned_users"
                        value={projectData.assigned_users.assigned_users}
                        onChange={handleInputChange}
                        placeholder="Manager"
                        className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
                      />
                      <Search
                        className="absolute right-3 top-10 pointer-events-none text-gray-500"
                        size={18}
                      />
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
                      </label>
                      <select
                        className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] appearance-none bg-white">
                        <option>Select</option>
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-10 pointer-events-none text-gray-500"
                        size={18}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-start gap-4 mt-8">
              <button
                onClick={() => closeModal("modal1")}
                className="px-6 py-2 border border-gray-400 rounded-lg hover:bg-[#8e78b7] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                className="px-6 py-2 border border-gray-400 rounded-lg hover:bg-[#8e78b7] hover:text-white transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Project Model */}

      {isModalOpen.modal2 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[600px] overflow-hidden">
            <div className="relative h-24">
              {" "}
              {/* Increased height */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${successBackground})` }}
              >
                <button
                  onClick={() => closeModal("modal2")}
                  className="absolute top-4 right-4 text-black p-1"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="flex items-center space-x-4 mb-4">
                <BadgeCheck className="w-8 h-8 text-green-500" />{" "}
                {/* Increased icon size */}
                <h2 className="text-2xl font-bold">Congratulations!</h2>{" "}
                {/* Larger text */}
              </div>
              <p className="text-lg text-gray-800">
                {" "}
                {/* Larger text */}
                You have successfully created a project.
              </p>

              <div className="flex justify-start gap-4 mt-8">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-lg border border-gray-400 rounded-lg hover:bg-[#8e78b7] hover:text-white transition-colors"
                >
                  Alright
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Listing Table */}

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg mt-10">
        <table className="w-full text-sm text-left rtl:text-right text-black">
          <thead className="text-xs text-white-700 uppercase dark:bg-[#282F49] dark:text-white">
            <tr>
              <th scope="col" className="px-6 py-3">
                ID
              </th>
              <th scope="col" className="px-6 py-3">
                Name
              </th>
              <th scope="col" className="px-6 py-3">
                Description
              </th>
              <th scope="col" className="px-6 py-3">
                Type
              </th>
              <th scope="col" className="px-6 py-3">
                Owner
              </th>
              <th scope="col" className="px-6 py-3">
                Created By
              </th>
              <th scope="col" className="px-6 py-3">
                Updated By
              </th>
              <th scope="col" className="px-6 py-3"></th>
              <th scope="col" className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sampleData.map((user, index) => (
              // <tr key={index} className="border-b"></tr>
              <tr key={index} className="border-b dark:border-white-700">
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-black-900 whitespace-nowrap dark:text-black"
                >
                  {user.id}
                </th>
                <td className="px-6 py-4">{user.name}</td>
                <td className="px-6 py-4">{user.description}</td>
                <td className="px-6 py-4">{user.type}</td>
                <td className="px-6 py-4">{user.owner}</td>
                <td className="px-6 py-4">{user.created_by}</td>
                <td className="px-6 py-4">{user.updated_by}</td>
                <td className="px-6 py-4">
                  <Pencil className="h-5 w-5" />
                </td>
                <td className="px-6 py-4">
                  <Trash2 className="h-5 w-5" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Project;
