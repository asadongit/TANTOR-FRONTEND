/*eslint-disable*/
import React, { useState, useEffect } from "react";
import { Icon } from "@iconify-icon/react";
import { Link } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import CreateViewDialog from "./createViewDailog";
import {
  List,
  RefreshCcw,
} from "lucide-react";
 
ModuleRegistry.registerModules([AllCommunityModule]);
 
const FederationDashBoard = () => {

  const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalState, setModalState] = useState({ 
      queryType: "Regular", 
      viewType: "" 
    });
  
    const toggleModal = () => {
      setModalState({
        queryType: "Regular", 
        viewType: "" }
      )
      setIsModalOpen(!isModalOpen);
    };

  var encodedToken = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJfT0JkZW9SZGQxaVVwd3RJb2t6Y2JYdnZ1QXdMeENzMk1KTTYwa0s5QUw0In0.eyJleHAiOjE3MzI2MjI0ODMsImlhdCI6MTczMjYyMjE4MywianRpIjoiN2ZhZWI1MWUtMDBkMy00YjFiLTlkNWUtMTE4Y2VkZDM0NTE0IiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay50YW50b3IuaW8vcmVhbG1zL0dhdGVrZWVwZXIiLCJhdWQiOlsicmVhbG0tbWFuYWdlbWVudCIsImFjY291bnQiXSwic3ViIjoiMjBlMTNmMmEtNmI4OS00OGMzLTk0NTAtYjQ2NmYxMDhkYjE4IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiZGFyY2giLCJzZXNzaW9uX3N0YXRlIjoiY2M4YzNlYTMtNDlkYy00N2UxLWJmZTgtNTc5OTA4OWJlZmYwIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJvZmZsaW5lX2FjY2VzcyIsImRlZmF1bHQtcm9sZXMtZ2F0ZWtlZXBlciIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsicmVhbG0tbWFuYWdlbWVudCI6eyJyb2xlcyI6WyJ2aWV3LWlkZW50aXR5LXByb3ZpZGVycyIsInZpZXctcmVhbG0iLCJtYW5hZ2UtaWRlbnRpdHktcHJvdmlkZXJzIiwiaW1wZXJzb25hdGlvbiIsInJlYWxtLWFkbWluIiwiY3JlYXRlLWNsaWVudCIsIm1hbmFnZS11c2VycyIsInF1ZXJ5LXJlYWxtcyIsInZpZXctYXV0aG9yaXphdGlvbiIsInF1ZXJ5LWNsaWVudHMiLCJxdWVyeS11c2VycyIsIm1hbmFnZS1ldmVudHMiLCJtYW5hZ2UtcmVhbG0iLCJ2aWV3LWV2ZW50cyIsInZpZXctdXNlcnMiLCJ2aWV3LWNsaWVudHMiLCJtYW5hZ2UtYXV0aG9yaXphdGlvbiIsIm1hbmFnZS1jbGllbnRzIiwicXVlcnktZ3JvdXBzIl19LCJkYXJjaCI6eyJyb2xlcyI6WyJnbG9iYWwtYWRtaW4iXX0sImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIGVtYWlsIHByb2ZpbGUiLCJzaWQiOiJjYzhjM2VhMy00OWRjLTQ3ZTEtYmZlOC01Nzk5MDg5YmVmZjAiLCJuYW1lIjoiYWRtaW4iLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhZG1pbiIsImdpdmVuX25hbWUiOiJhZG1pbiIsImZhbWlseV9uYW1lIjoiIn0.KP26Vqwa6540YVbG6imzaS5yt3BGhsRNt7dpQ6YNKkCvAk-1zAqJZgVABmVxRk6SUEak1k6Wcyda-br-d_t896YlZ_ELe-xmhCilVTiDqTv6jwmAPNjsOE229u4WuXDmhO6cqaCwLLjLaGKbp3R9dsk-y8WtaIeK6k1as_psktZq51Fhxa-gfQWmwqxu53IdH6T0jwRKfpM6VMWIYi6gmw-hgFYWly4eECJagQwgOnVJ1_AIzuaUQEGmGIA9sHA89tvN-A53cKcwQtZk0pLM4_zQ4cSXx-OXl5T8oY9xV7nUN-PLLQr_yHKAp-ju0zEij4VZfzP0zRB6o_K-M9ErXw'
  const [data, setData] = useState([]);
  const [connectionData, setconnectionData] = useState([]);
  const [schemaList, setSchemaList] = useState([])
  const [tableList, setTableList] = useState([])
 
 
  useEffect(() => {
    var project = "me";
    const fetchData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_FAST_API}/connection-saves`, {
          headers: {
            Authorization: `Bearer ${encodedToken}`,
            'Content-Type': 'application/json',
          },
        });
        let data = await response.json();
 
        if (project !== "none") {
          data = data.filter(
            (item) =>
              // item.project.toUpperCase() === project.toUpperCase() &&
              // item.created_by.toUpperCase() === token.preferred_username.toUpperCase() &&
              !item.is_deleted
          );
        } else {
          data = data.filter(
            (item) =>
              // item.created_by.toUpperCase() === token.preferred_username.toUpperCase() &&
              !item.is_deleted
          );
        }
        console.log("connection data is ===>",data)
        setconnectionData(data);
      } catch (error) {
        console.log(error);
      }
    };
 
    fetchData();
  }, []);
 
 
  useEffect(() => {
    var project = "me";
    connectionData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (project !== "none") {
      data.map((item) => { });
      const extractedData = connectionData.filter(
        (item) =>
          // item.project.toUpperCase() === project.toUpperCase() &&
          // item.created_by.toUpperCase() ===
          // token.preferred_username.toUpperCase() &&
          item.is_deleted === false
      );
      setData(extractedData);
      const connectionIds = extractedData.map((item) => item.connection_id);
      fetchSchemaCount(connectionIds)
      fetchTableCount(connectionIds)
    } else {
      const extractedData = connectionData.filter(
        (item) =>
          // item.created_by.toUpperCase() ===
          // token.preferred_username.toUpperCase() &&
          item.is_deleted === false
      );
      setData(extractedData);
      // const connectionNames = extractedData.map((item) => item.connection_name);
      // fetchSchemaCount(connectionNames)
    }
 
  }, [connectionData]);
 
 
    const fetchSchemaCount = async (connectionIds) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_FAST_API}/schema_count`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${encodedToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            "connection_id": connectionIds
          })
        });
        let data = await response.json();
        console.log("schema data is ===>",data.schema_counts)
        setSchemaList(data.schema_counts)
      } catch (error) {
        console.log(error);
      }
    };
 
 
    const fetchTableCount = async (connectionIds) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_FAST_API}/table_count`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${encodedToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            "connection_id": connectionIds
          })
        });
        let data = await response.json();
        console.log("schema data is ===>",data.table_counts)
        setTableList(data.table_counts)
      } catch (error) {
        console.log(error);
      }
    };
 
  //   useEffect(() => {
 
  //     const updatedRowData = connectionData.map((item) => {
  //         return {
  //             ID: item.connection_id,
  //             Connections: item.connection_name,
  //             Descriptions: item.description,
  //             Schema: schemaList[item.connection_id] || 0,
  //             Tables: tableList[item.connection_id] || 0,
  //             Views: item.status,
  //             Created: new Date(item.created_at).toLocaleDateString(),
  //         };
  //     });
  //     setRowData(updatedRowData);
  // }, [schemaList, connectionData, tableList]);
 
 
  const cards = [
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#d8d3e4]",
      iconcolor: "text-purple-700",
      title: "Connections",
      count: "20"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#d8d3e4]",
      iconcolor: "text-purple-700",
      title: "Schemas",
      count: "10"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#d8d3e4]",
      iconcolor: "text-purple-700",
      title: "Tables",
      count: "50"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#d8d3e4]",
      iconcolor: "text-purple-700",
      title: "Views",
      count: "15",
    }
  ];
 
  const [rowData, setRowData] = useState([
    {
      ID: "12345",
      Connections: "Sample Connection 1",
      Descriptions: "This is a demo connection description.",
      Schema: 5,
      Tables: 10,
      Views: 5,
      Created: "2025-01-20",
    },
    {
      ID: "67890",
      Connections: "Sample Connection 2",
      Descriptions: "Another demo connection description.",
      Schema: 8,
      Tables: 15,
      Views: 9,
      Created: "2025-01-21",
    },
    {
      ID: "11223",
      Connections: "Sample Connection 3",
      Descriptions: "Yet another demo connection description.",
      Schema: 3,
      Tables: 7,
      Views: 17,
      Created: "2025-01-22",
    },
  ]);
  
 
  const ActionRenderer = (props) => {
    return (
      <button
          className="p-2 rounded flex justify-center items-center"
        >
          <Icon icon="system-uicons:circle-menu" className="text-purple-600 text-lg" style={{ fontSize: '20px'}} />
        </button>
    );
  };
 
  const [colDefs] = useState([
    { field: "ID", headerClass: "bg-customBlue" ,headerStyle: { backgroundColor: '#007BFF', color: '#fff' },flex: 1,cellClass: "flex items-center"},
    { field: "Connections", headerClass: "bg-customBlue", headerStyle: { backgroundColor: '#007BFF', color: '#fff' }, flex: 2, cellClass: "flex items-center" },
    { field: "Descriptions", headerClass: "bg-customBlue ",headerStyle: { backgroundColor: '#007BFF', color: '#fff' },flex: 2,cellClass: "flex items-center" },
    { field: "Schema", headerClass: "bg-customBlue",headerStyle: { backgroundColor: '#007BFF', color: '#fff' },flex: 1,cellClass: "flex items-center" },
    { field: "Tables", headerClass: "bg-customBlue" ,headerStyle: { backgroundColor: '#007BFF', color: '#fff' },flex: 1,cellClass: "flex items-center"},
    { field: "Views", headerClass: "bg-customBlue" ,headerStyle: { backgroundColor: '#007BFF', color: '#fff' },flex: 1,cellClass: "flex items-center"},
    { field: "Created", headerClass: "bg-customBlue",headerStyle: { backgroundColor: '#007BFF', color: '#fff' },flex: 1,cellClass: "flex items-center" },
    {
      field: "Actions",
      headerClass: "bg-customBlue",
      headerStyle: { backgroundColor: '#007BFF', color: '#fff' },
      flex: 1,
      cellClass: "flex items-center justify-center",
      cellRenderer: ActionRenderer,  
    },
  ]);
 
  const getRowClass = (params) => {
    return 'text-gray-500';
  };
  return (
    <>
    <div className="w-full h-full">
      <div>
        <Link to="/">Platform</Link> &gt; <Link to="/federation" className="text-purple-600 hover:text-purple-700">Federation</Link>
      </div>
      <div className="flex w-full justify-between">
        <h1 className="text-2xl font-semibold">Federation</h1>
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
          >
            <RefreshCcw className="h-5 w-5" />
          </button>
          <button
            // onClick={() => openModal("modal1")}
            type="button"
            onClick={toggleModal}
            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            + Create View
          </button>
        </div>
      </div>
      {/* Render modal when it's open */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 w-auto justify-self-center mt-2">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`bg-white p-5 rounded-lg shadow-sm border-gray-200`}
          >
            <div className="flex items-center mb-2">
              <div
                className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 ${card.bgcolor} rounded-full ${card.iconcolor} mr-2`}
              >
                <Icon icon={card.icon} />
              </div>
              <h3 className="text-lg font-semibold">{card.title}</h3>
            </div>
            <p className="text-black text-5xl font-bold">{card.count}</p>
            <button className="mt-4 text-purple-600 text-sm hover:text-purple-700">
              See details
            </button>
          </div>
        ))}
      </div>
  <AgGridReact className="ag-theme-alpine border rounded-lg mt-4"
    rowData={rowData}
    columnDefs={colDefs}
    rowHeight={50}
    headerHeight={50}
    paginationPageSize={10}
    pagination= {true}
    getRowClass={getRowClass}
    theme="legacy" 
  />
    </div>
     {isModalOpen && (
      <CreateViewDialog
        isModalOpen={isModalOpen}
        toggleModal={toggleModal}
        modalState={modalState}
        setModalState={setModalState}
      />
    )}
    </>
  );
  
};
 
export default FederationDashBoard;