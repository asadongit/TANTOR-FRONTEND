import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Pencil,
  Trash2,
  RotateCw,
  Eye,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { encrypt } from "../../../utils/Crypto";
import { useConnectionCardData } from "../../../hooks/platform/cardCounts";
import { useConnectionData } from "../../../hooks/platform/connection";
import DataTable from "../../../components/DataTable";
import CardGrid from "../../../components/CardGrid";
import toast  from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import columnConfigurations from "../../../components/columnsConfig";
import ViewConnection from "./components/viewConnection";
import ConnectionWizard from "./components/ConnectionWizard";
import Modal from "../cdc/components/Modal";
import axios from "axios";
import { useModal } from "../cdc/context/ModalProvider";
const Connections = () => {

const {token, project, setSelectedProject, hostnameV1 }= useAuth();
  const {openModal, closeModal}= useModal()
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

  const openLocalModal = (modalName, data = null) => {
    setActiveModal({ name: modalName, data });
  };
  
  const closeLocalModal = () => {
    closeModal()   
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


  const columns = columnConfigurations['connections']


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
          refetchConnections();
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
        openLocalModal('view')
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
        onClick: (row) => openLocalModal('editCreate', row),
      },
      {
        label: "Delete",
        icon: <Trash2 size={16} />,
        onClick: (row) =>  openModal({
          title: "Confirm Deletion",
          message: `Are you sure you want to delete this connection ${row.connection_name}?`,
          type: "question",
          onConfirm: () => deleteConnection(row.connection_id),
           loadingText : "Deleting....."
        }),
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




  const deleteConnection = async (id) => {
    try {
      const response = await axios.delete(`${hostnameV1}/connection-saves/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        // toast.success("Connection deleted successfully");
        refetchConnections(); 
      } else {
        toast.error("Failed to delete connection");
      }
    } catch (error) {
      console.error("Error deleting connection:", error);
      toast.error("Error deleting connection");
    }
    finally{
      openModal({
        title: "Success",
        message: `Your connection has been deleted successfully!`,
        type: "success",
        onConfirm: ()=> closeLocalModal,
        loadingText:'Deleting'
      })
    }
  };
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
            <option value="default">Default{" "}</option>
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
              openLocalModal("editCreate", null)
            }}
            type="button"
            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            + Add Connector
          </button>
        </div>
      </div>

<CardGrid cards={cards} onCardClick={handleCardClick} isLoading={isCardLoading}/>

<DataTable columns={columns} data={connections} actions={actions} isLoading={isConnectionsLoading} isError={connectionsError} refetch={refetchConnections}/>
 
{activeModal?.name === 'editCreate' && (
  <ConnectionWizard 
    editConnectionData={activeModal.data} 
    closeLocalModal={closeLocalModal} 
  />
)}

{/* tbd */}
{activeModal?.name === 'view' && (
  <ViewConnection 
    viewConnectionData={viewConnectionData} 
    setViewConnectionData={setViewConnectionData} 
    connectionDetails={connectionDetails} 
    closeModal={closeLocalModal} 
  />
)}

</div>
  );
};

export default Connections;
