import { Icon } from "@iconify-icon/react";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Pencil,
  Trash2,
  MoreHorizontal,
  RotateCw,
  Eye,
  X,
  BadgeCheck,
  ChevronDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Play,
  RefreshCcw,
  Search,
} from "lucide-react";
import successBackground from "../../../assets/green.png";
import PostgreSQL from "../../../assets/connector/postgresql-connector.png";
import Oracle from "../../../assets/connector/oracle-connector.png";
import Hive from "../../../assets/connector/hive-connector.png";
import MongoDB from "../../../assets/connector/mongodb-connector.png";
import MySQL from "../../../assets/connector/mysql-connector.png";
import Snowflake from "../../../assets/connector/snowflake-connector.png";
import MSSQL from "../../../assets/connector/mssql-connector.png";
import DB2 from "../../../assets/connector/db2-connector.png";
import Kafka from "../../../assets/connector/kafka-connector.png";
import { useNavigate } from "react-router-dom";
import { encrypt } from "../../../utils/Crypto";
import { useConnectionCardData } from "../../../hooks/platform/cardCounts";
import { useConnectionData } from "../../../hooks/platform/connection";
import DataTable from "../../../components/DataTable";
import CardGrid from "../../../components/CardGrid";
import toast  from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import columnConfigurations from "../../../components/columnsConfig";
import ViewConnection from "./viewConnection";
const Connections = () => {

const {token, project, setSelectedProject, hostnameV1 }= useAuth();

  const {
    data: cardData,
    isLoading: isCardLoading,
    error: cardError,
    refetch: refetchCardData, 
  } = useConnectionCardData();
  
  const {
    data: connections = [],
    isLoading: isConnectionsLoading,
    error: connectionsError,
    refetch: refetchConnections, 
  } = useConnectionData();

  const [isModalOpen, setIsModalOpen] = useState({
    modal1: false,
    modal2: false,
    modal3: false,
    modal4: false,
  });
  const navigate = useNavigate();
  
  const [modalData, setModalData] = useState({
    modal1: null,
    modal2: null,
    modal3: null,
    modal4: null,
  });

  // Function to open a specific modal
  const openModal = (modalName, data = null) => {
    setIsModalOpen((prev) => ({ ...prev, [modalName]: true }));
    setModalData((prev) => ({ ...prev, [modalName]: data }));
  };

  // Function to close a specific modal
  const closeModal = (modalName) => {
    setIsModalOpen((prev) => ({ ...prev, [modalName]: false }));
    setModalData((prev) => ({ ...prev, [modalName]: null }));
  };

  const [selectedCard, setSelectedCard] = useState(null);

  const cards = useMemo(() => {
    return [
      {
        icon: "material-symbols:database-upload-outline",
        bgcolor: "bg-[#d8d3e4] bg-opacity-25",
        iconcolor: "text-purple-700",
        title: "Active",
        count: cardData?.active || 0,
      },
      {
        icon: "material-symbols-light:two-pager-store-outline",
        bgcolor: "bg-[#FFC93F] bg-opacity-25",
        iconcolor: "text-orange-700",
        title: "Inactive",
        count: cardData?.inactive || 0,
      },
      {
        icon: "material-symbols:cloud-sync-outline",
        bgcolor: "bg-[#96CF7B] bg-opacity-25",
        iconcolor: "text-green-700",
        title: "Source",
        count: cardData?.source || 0,
      },
      {
        icon: "material-symbols:tab-group-outline",
        bgcolor: "bg-[#16ABC2] bg-opacity-25",
        iconcolor: "text-cyan-700",
        title: "Target",
        count: cardData?.target || 0,
      },
      {
        icon: "material-symbols:tab-group-outline",
        bgcolor: "bg-[#16ABC2] bg-opacity-25",
        iconcolor: "text-cyan-700",
        title: "Both",
        count: cardData?.both || 0,
      },
    ];
  }, [cardData]);

  const connectorCards = [
    {
      title: "Oracle",
      icon: Oracle,
    },
    {
      title: "MySQL",
      icon: MySQL,
    },
    {
      title: "MSSQL",
      icon: MSSQL,
    },
    {
      title: "DB2",
      icon: DB2,
    },
    {
      title: "PostgreSQL",
      icon: PostgreSQL,
    },
    {
      title: "Hive",
      icon: Hive,
    },
    {
      title: "Snowflake",
      icon: Snowflake,
    },
    {
      title: "Kafka",
      icon: Kafka,
    },
    {
      title: "MongoDB",
      icon: MongoDB,
    },
  ];

  const [formData, setFormData] = useState({});

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const [isTestSuccessful, setIsTestSuccessful] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const testSubmit = async () => {
    let requiredFields = getConnectorFields(modalData.modal2)
      .filter((field) => field.required)
      .map((field) => field.name);

    requiredFields.push("name", "description", "behaviour");

    const isValid = requiredFields.every((field) => formData[field]);

    if (!isValid) {
      alert("Please fill all required fields");
      return;
    }

    setIsTesting(true);

    try {
      // Mock API call - replace with your actual API call
      let response = await fetch(`${hostnameV1}/test-connection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      // Mock response as ok for testing
      response = { ok: true };

      if (response.ok) {
        setIsTestSuccessful(true);
      } else {
        alert("Connection test failed");
      }
    } catch (error) {
      alert("Test failed: " + error.message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async () => {
    if (!isTestSuccessful) {
      alert("Please run a successful test first");
      return;
    }

    try {
      // Your save API call
      let response = await fetch(`${hostnameV1}/create-connection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      // Mock response as ok for testing
      response = { ok: true };

      if (response.ok) {
        setFormData({});
        setIsTestSuccessful(false);
        closeModal("modal2");
        openModal("modal3");
      }
    } catch (error) {
      alert("Save failed: " + error.message);
    }
  };

  const getConnectorFields = (connectorType) => {
    const fieldConfig = {
      Oracle: [
        {
          name: "host",
          label: "Host",
          required: true,
          placeholder: "Enter host address",
        },
        {
          name: "port",
          label: "Port",
          type: "number",
          required: true,
          placeholder: "Enter port number",
        },
        { name: "username", label: "Username", required: true },
        {
          name: "password",
          label: "Password",
          type: "password",
          required: true,
        },
        { name: "dbname", label: "Database Name", required: true },
      ],
      PostgreSQL: [
        {
          name: "host",
          label: "Host",
          required: true,
          placeholder: "Enter host address",
        },
        {
          name: "port",
          label: "Port",
          type: "number",
          required: true,
          placeholder: "Enter port number",
        },
        { name: "username", label: "Username", required: true },
        {
          name: "password",
          label: "Password",
          type: "password",
          required: true,
        },
        { name: "dbname", label: "Database Name", required: true },
      ],
      Hive: [
        { name: "host", label: "Host", required: true },
        { name: "port", label: "Port", type: "number", required: true },
        { name: "client", label: "Client", required: true },
        {
          name: "servicePrincipal",
          label: "Service Principal",
          required: true,
        },
        { name: "username", label: "Username" },
        { name: "password", label: "Password", type: "password" },
      ],
      // Add other connectors as needed
    };

    return fieldConfig[connectorType] || [];
  };



  const columns = [
    { key: "connection_name", label: "Connection Name" },
    { key: "project", label: "Project Name" },
    { key: "created_by", label: "Created By" },
    { key: "database_name", label: "Database" },
    { key: "connection_type", label: "Connection Type" },
    { key: "host_address", label: "Host" },
    { key: "username", label: "Username" },
    { key: "table_count", label: "No of Table" },
    { key: "status", label: "Status" },
    { label: "Action", sortable: false },
  ];


  const handleRefresh = (id) => {
    fetch(`${hostnameV1}/refresh/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (response.status === 200) {
          toast.success("Reload Successful");
        } else {
          return response.json().then((data) => {
            throw new Error(data.errorMessage || "Reload Failed");
          });
        }
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const [viewConnectionData, setViewConnectionData] = useState([]);
  const [connectionDetails, setConnectionDetails] = useState(null);

      const fetchViewConnections = useCallback(async (connection) => {
        setConnectionDetails(connection)
        setViewConnectionData(null)
        openModal('modal4')
        fetch(
          `${hostnameV1}/connection-master-metadata/find-by-conn-name-type?conn_name=${connection.connection_name}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
          .then((response) => response.json())
          .then((data) => {
            const sortedData = data.sort((a, b) => a.table_name.localeCompare(b.table_name));
    
            setViewConnectionData(sortedData);
          })
          .catch((error) => {
            console.error("Error fetching table data:", error);
          });
        }, []);
    


    const actions = [
      {
        label: "View",
        icon: <Eye size={16} />,
        onClick: (row) => fetchViewConnections(row),
      },
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
        icon: <RotateCw size={16}  />,
        onClick: (row) => handleRefresh(row.connection_id),
      },
    ];

    
  const handleCardClick = (card) => {
    const url = `/componentType=connections&dataScope=${card.title
      .replace(/\s+/g, "")
      .toLowerCase()}&heading=${card.title}`;
    const encryptedUrl = encodeURIComponent(encrypt(url));
    navigate(`/details?${encryptedUrl}`);
  };

  let projectsList;
  let [projects, setProjects] = useState([]);

  const fetchProjects = useCallback(async () => {
    try {
      const projectsResponse = await fetch(`${hostnameV1}/projects`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-type": "application/json",
        },
      });
      if (!projectsResponse.ok) {
        throw new Error('Failed to fetch projects');
      }
      projectsList = await projectsResponse.json();
      setProjects(projectsList);
    } catch (error) {
      console.error("Error fetching options:", error)
    }
  }, [])

  useEffect(() => { 
    fetchProjects() 
  }, [fetchProjects])

  const filteredConnections = useMemo(() => {
    if (project === "none" || !project) {
      return connections;
    }
    return connections.filter((conn) => conn.project === project)
  }, [connections, project])





  return (
    <div className="p-6">
      <div className="flex gap-2 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Connections</h1>
        <div className="flex items-center gap-4">
          <select
            value={project}
            onChange={(e) => {
              const projectName = e.target.value;
              setSelectedProject(projectName);
            }}
            className=" w-44 text-slate-500 font-medium rounded-lg text-sm px-1 py-2.5 me-2 mb-2 text-center inline-flex items-center dark:bg-white shadow-md"
          >
            <option value="none">Default{" "}</option>
            {/* <svg
              className="w-2.5 h-2.5 ms-3"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 10 6"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m1 1 4 4 4-4"
              />
            </svg> */}
             {projects?.map((project, idx) => (
              <option key={idx} value={project?.project}
              >
                {project?.project}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 mr-2 mb-2">
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>

          <button
            onClick={() => openModal("modal1")}
            type="button"
            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            + Add Connector
          </button>
        </div>
      </div>

      <CardGrid cards={cards} onCardClick={handleCardClick} isLoading={isCardLoading}/>

      {/* Connection Listing Table */}

<DataTable
  columns={columns}
  data={filteredConnections}
  actions={actions}
  isLoading={isConnectionsLoading}
  isError={connectionsError}
  refetch={refetchConnections}
/>
 

      {isModalOpen.modal1 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[1000px] p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div>
                  <Icon
                    className="h-5 w-5 text-[#8e78b7]"
                    icon={"material-symbols-light:cable-rounded"}
                    width="24"
                    height="24"
                  />
                </div>
                <h2 className="text-xl font-bold text-[#8e78b7]">
                  Add Connector
                </h2>
              </div>
              <button
                onClick={() => closeModal("modal1")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="block text-md text-black mb-1.5 font-bold">
              Connect your data
            </label>
            {/* Search Icon */}
            <form className="max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-500 dark:text-gray-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 20"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                    />
                  </svg>
                </div>
                <input
                  type="search"
                  id="default-search"
                  className="block w-full p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Search Connector"
                  required
                />
                {/* <button
                  type="submit"
                  className="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  Search
                </button> */}
              </div>
            </form>

            <label className="block text-md text-black mb-1.5 mt-4 text-gray-500">
              {connectorCards.length} Connector
              {connectorCards.length !== 1 ? "s" : ""} Available
            </label>

            {/* Connector Cards */}
            <div
              className="overflow-y-auto scroll-smooth pr-2 scrollbar-thin scrollbar-thumb-[#8e78b7] scrollbar-track-gray-100 pt-2 pl-2 pr-2 pb-2"
              style={{
                maxHeight:
                  "calc(3 * (90px + 24px))" /* (3 rows * (card height + gap)) */,
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6 pb-4">
                {connectorCards.map((card) => (
                  <div
                    key={card.title}
                    className={`bg-white p-4 rounded-lg shadow-sm border-gray-200 outline outline-slate-200 flex items-center justify-center cursor-pointer
                      ${
                        selectedCard === card.title
                          ? "outline-2 outline outline-purple-400"
                          : "outline outline-slate-200"
                      }`}
                    onClick={() => setSelectedCard(card.title)}
                  >
                    <img
                      src={card.icon}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                ))}
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
                onClick={() => {
                  if (selectedCard) {
                    openModal("modal2", selectedCard);
                    closeModal("modal1");
                  } else {
                    alert("Please select a connector first");
                  }
                }}
                className="px-6 py-2 border border-gray-400 rounded-lg hover:bg-[#8e78b7] hover:text-white transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pass Connection Detail Model */}
      {isModalOpen.modal2 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[1000px] p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div>
                  <Icon
                    className="h-5 w-5 text-[#8e78b7]"
                    icon={"material-symbols-light:cable-rounded"}
                    width="24"
                    height="24"
                  />
                </div>
                <h2 className="text-xl font-bold text-[#8e78b7]">
                  Add Connection
                </h2>
              </div>
              <button
                onClick={() => closeModal("modal2")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="block text-md text-[#8e78b7] mb-1.5 font-bold">
              Connector
            </label>

            {/* Connector Card */}
            <div className="items-left w-full sm:w-[196px] mt-2">
              <div
                className="bg-white rounded-lg shadow-sm border-gray-200 outline outline-slate-200 
                w-[196px] h-[46px] flex items-center overflow-hidden hover:shadow-md transition-all"
              >
                <img
                  src={
                    connectorCards.find(
                      (card) => card.title === modalData.modal2
                    ).icon
                  }
                  className="w-[90%] h-[80%] object-contain mx-auto p-1"
                  onClick={(e) => {
                    e.currentTarget.style.transform = "scale(0.95)";
                    setTimeout(() => {
                      closeModal("modal2");
                      openModal("modal1");
                      e.currentTarget.style.transform = "";
                    }, 200);
                  }}
                  alt={`${modalData.modal2} logo`}
                />
              </div>
            </div>

            <label className="block text-md text-[#8e78b7] mb-1.5 font-bold mt-5">
              Details
            </label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                  <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  type="text"
                  placeholder="Name"
                  className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                  <span className="text-red-500">*</span>
                </label>
                <input
                  name="description"
                  value={formData.description || ""}
                  onChange={handleInputChange}
                  type="text"
                  placeholder="Description"
                  className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
                />
              </div>
              <div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Behaviour
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="behaviour"
                    value={formData.behaviour || ""}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] appearance-none bg-white"
                  >
                    <option>Select</option>
                    <option value="source">Source</option>
                    <option value="target">Target</option>
                    <option value="both">Both</option>
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-10 pointer-events-none text-gray-500"
                    size={18}
                  />
                </div>
              </div>
            </div>

            <label className="block text-md text-[#8e78b7] mb-1.5 font-bold mt-5">
              Credentials
            </label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              {getConnectorFields(modalData.modal2).map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={field.type || "text"}
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={handleInputChange}
                    placeholder={field.placeholder}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                    required={field.required}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-start gap-4 mt-8">
              <button
                onClick={testSubmit}
                disabled={isTesting}
                className={`px-6 py-2 border rounded-lg transition-colors ${
                  isTesting
                    ? "bg-gray-300 border-gray-400 cursor-not-allowed"
                    : "border-gray-400 hover:bg-[#8e78b7] hover:text-white"
                }`}
              >
                {isTesting ? "Testing..." : "Test"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isTestSuccessful}
                className={`px-6 py-2 border rounded-lg transition-colors ${
                  !isTestSuccessful
                    ? "bg-gray-300 border-gray-400 cursor-not-allowed"
                    : "border-gray-400 hover:bg-[#8e78b7] hover:text-white"
                }`}
              >
                Create and Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Connection Detail Model */}

      {isModalOpen.modal3 && (
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
                  onClick={() => closeModal("modal3")}
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
                You have successfully created a connection.
              </p>

              <div className="flex justify-start gap-4 mt-8">
                <button
                  onClick={() => closeModal("modal3")}
                  className="px-6 py-3 text-lg border border-gray-400 rounded-lg hover:bg-[#8e78b7] hover:text-white transition-colors"
                >
                  Alright
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*Start---------------------------Edit Connection Modal--------------------------Start */}

{isModalOpen.modal4 && (

<ViewConnection viewConnectionData={viewConnectionData } setViewConnectionData={setViewConnectionData} connectionDetails={connectionDetails} closeModal={closeModal}/>

)}
      {/*End---------------------------Edit Connection Modal--------------------------End */}
    </div>
  );
};

export default Connections;
