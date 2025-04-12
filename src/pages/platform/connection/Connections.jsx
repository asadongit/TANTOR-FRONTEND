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
import ConnectionWizard from "./ConnectionWizard";
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
  // const [editConnectionData, setEditConnectionData]= useState(null)
  const [viewConnectionData, setViewConnectionData] = useState(null);
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [activeModal, setActiveModal] = useState(null); 
  const navigate = useNavigate();

  const openModal = (modalName, data = null) => {
    setActiveModal({ name: modalName, data });
  };
  
  const closeModal = () => {
    setActiveModal(null);
  };


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



      const fetchViewConnections = useCallback(async (connection) => {
        setConnectionDetails(connection)
        setViewConnectionData(null)
        openModal('view')
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

const handleEditConnection=(connection)=>{
  setEditConnectionData(connection);
  openModal('editCreate', connection);

}
    const actions = [
      {
        label: "View",
        icon: <Eye size={16} />,
        onClick: (row) => fetchViewConnections(row),
      },
      {
        label: "Edit",
        icon: <Pencil size={16} />,
        onClick: (row) => handleEditConnection(row),
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
     const projectsList = await projectsResponse.json();
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
            onClick={() =>{
              openModal("editCreate", null)
            }}
            type="button"
            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            + Add Connector
          </button>
        </div>
      </div>

<CardGrid cards={cards} onCardClick={handleCardClick} isLoading={isCardLoading}/>

<DataTable columns={columns} data={filteredConnections} actions={actions} isLoading={isConnectionsLoading} isError={connectionsError} refetch={refetchConnections}/>
 
{activeModal?.name === 'editCreate' && (
  <ConnectionWizard 
    editConnectionData={activeModal.data} 
    closeModal={closeModal} 
  />
)}

{/* tbd */}
{activeModal?.name === 'view' && (
  <ViewConnection 
    viewConnectionData={viewConnectionData} 
    setViewConnectionData={setViewConnectionData} 
    connectionDetails={connectionDetails} 
    closeModal={closeModal} 
  />
)}

</div>
  );
};

export default Connections;
