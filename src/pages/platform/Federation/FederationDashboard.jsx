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
  Pencil,
  Trash2,
  MoreHorizontal,
  RotateCw,
  Eye,
  List,
  RefreshCcw,
  Code,
  Plus
} from "lucide-react";
import { useNavigate } from 'react-router-dom';

ModuleRegistry.registerModules([AllCommunityModule]);

const FederationDashBoard = () => {
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalState, setModalState] = useState({
    queryType: "Regular",
    viewType: ""
  });

  const toggleModal = () => {
    setModalState({
      queryType: "Regular",
      viewType: ""
    }
    )
    setIsModalOpen(!isModalOpen);
  };

  const encodedToken = import.meta.env.VITE_FEDERATION_ACCESS_TOKEN;
  const [data, setData] = useState([]);
  const [connectionData, setconnectionData] = useState([]);
  const [schemaList, setSchemaList] = useState([])
  const [tableList, setTableList] = useState([])
  const [viewList, setViewList] = useState([])

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
        console.log("connection data is ===>", data)
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
      const connectionNames = extractedData.map((item) => item.connection_name);
      fetchSchemaCount(connectionIds)
      fetchTableCount(connectionIds)
      fetchViewCount(connectionNames)
    } else {
      const extractedData = connectionData.filter(
        (item) =>
          // item.created_by.toUpperCase() ===
          // token.preferred_username.toUpperCase() &&
          item.is_deleted === false
      );
      setData(extractedData);
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
      console.log("schema data is ===>", data.schema_counts)
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
      console.log("table data is ===>", data.table_counts)
      setTableList(data.table_counts)
    } catch (error) {
      console.log(error);
    }
  };

  const fetchViewCount = async (connectionNames) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_FAST_API_V2}/connections/views`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${encodedToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "connection_names": connectionNames
        })
      });
      let data = await response.json();
      console.log("views are  ===>", data)
      setViewList(data)
    } catch (error) {
      console.log(error);
    }
  };


  useEffect(() => {

    const updatedRowData = connectionData.map((item) => {
      return {
        ID: item.connection_id,
        Connections: item.connection_name,
        Descriptions: item.description,
        Schema: schemaList[item.connection_id] || 0,
        Tables: tableList[item.connection_id] || 0,
        Views: viewList[item.connection_name]?.length || 0,
        Created: new Date(item.created_at).toLocaleDateString(),
      };
    });
    setRowData(updatedRowData);
  }, [connectionData]);


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
    // {
    //   ID: "12345",
    //   Connections: "Sample Connection 1",
    //   Descriptions: "This is a demo connection description.",
    //   Schema: 5,
    //   Tables: 10,
    //   Views: 5,
    //   Created: "2025-01-20",
    // },
    // {
    //   ID: "67890",
    //   Connections: "Sample Connection 2",
    //   Descriptions: "Another demo connection description.",
    //   Schema: 8,
    //   Tables: 15,
    //   Views: 9,
    //   Created: "2025-01-21",
    // },
    // {
    //   ID: "11223",
    //   Connections: "Sample Connection 3",
    //   Descriptions: "Yet another demo connection description.",
    //   Schema: 3,
    //   Tables: 7,
    //   Views: 17,
    //   Created: "2025-01-22",
    // },
    // {
    //   ID: "12345",
    //   Connections: "Sample Connection 1",
    //   Descriptions: "This is a demo connection description.",
    //   Schema: 5,
    //   Tables: 10,
    //   Views: 5,
    //   Created: "2025-01-20",
    // },
    // {
    //   ID: "67890",
    //   Connections: "Sample Connection 2",
    //   Descriptions: "Another demo connection description.",
    //   Schema: 8,
    //   Tables: 15,
    //   Views: 9,
    //   Created: "2025-01-21",
    // },
    // {
    //   ID: "11223",
    //   Connections: "Sample Connection 3",
    //   Descriptions: "Yet another demo connection description.",
    //   Schema: 3,
    //   Tables: 7,
    //   Views: 17,
    //   Created: "2025-01-22",
    // },
    // {
    //   ID: "12345",
    //   Connections: "Sample Connection 1",
    //   Descriptions: "This is a demo connection description.",
    //   Schema: 5,
    //   Tables: 10,
    //   Views: 5,
    //   Created: "2025-01-20",
    // },
    // {
    //   ID: "67890",
    //   Connections: "Sample Connection 2",
    //   Descriptions: "Another demo connection description.",
    //   Schema: 8,
    //   Tables: 15,
    //   Views: 9,
    //   Created: "2025-01-21",
    // },
    // {
    //   ID: "11223",
    //   Connections: "Sample Connection 3",
    //   Descriptions: "Yet another demo connection description.",
    //   Schema: 3,
    //   Tables: 7,
    //   Views: 17,
    //   Created: "2025-01-22",
    // }
  ]);


  // const ActionRenderer = (props) => {
  //   return (
  //     <button
  //         className="p-2 rounded flex justify-center items-center"
  //       >
  //         <Icon icon="system-uicons:circle-menu" className="text-purple-600 text-lg" style={{ fontSize: '20px'}} />
  //       </button>
  //   );
  // };

  // const [colDefs] = useState([
  //   { field: "ID", headerClass: "bg-customBlue" ,headerStyle: { backgroundColor: '#007BFF', color: '#fff' },flex: 1,cellClass: "flex items-center"},
  //   { field: "Connections", headerClass: "bg-customBlue", headerStyle: { backgroundColor: '#007BFF', color: '#fff' }, flex: 2, cellClass: "flex items-center" },
  //   { field: "Descriptions", headerClass: "bg-customBlue ",headerStyle: { backgroundColor: '#007BFF', color: '#fff' },flex: 2,cellClass: "flex items-center" },
  //   { field: "Schema", headerClass: "bg-customBlue",headerStyle: { backgroundColor: '#007BFF', color: '#fff' },flex: 1,cellClass: "flex items-center" },
  //   { field: "Tables", headerClass: "bg-customBlue" ,headerStyle: { backgroundColor: '#007BFF', color: '#fff' },flex: 1,cellClass: "flex items-center"},
  //   { field: "Views", headerClass: "bg-customBlue" ,headerStyle: { backgroundColor: '#007BFF', color: '#fff' },flex: 1,cellClass: "flex items-center"},
  //   { field: "Created", headerClass: "bg-customBlue",headerStyle: { backgroundColor: '#007BFF', color: '#fff' },flex: 1,cellClass: "flex items-center" },
  //   {
  //     field: "Actions",
  //     headerClass: "bg-customBlue",
  //     headerStyle: { backgroundColor: '#007BFF', color: '#fff' },
  //     flex: 1,
  //     cellClass: "flex items-center justify-center",
  //     cellRenderer: ActionRenderer,  
  //   },
  // ]);

  // const getRowClass = (params) => {
  //   return 'text-gray-500';
  // };


  const [activeMenu, setActiveMenu] = useState(null);

  const handleClickOutside = () => {
    setActiveMenu(null);
  };

  const openModal = (modalName, data = null) => {
    setIsModalOpen((prev) => ({ ...prev, [modalName]: true }));
    setModalData((prev) => ({ ...prev, [modalName]: data }));
  };

  return (
    <>
      <div className="w-full h-full px-6 pt-3">
        <div>
          <Link to="/">Platform</Link> &gt; <Link to="/federation" className="text-purple-600 hover:text-purple-700">Federation</Link>
        </div>
        <div className="flex w-full justify-between">
          <h1 className="text-2xl font-semibold">Federation</h1>
          <div className="flex">
            <button
              type="button"
              onClick={() => navigate('/editor')}
              className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-4 py-2.5 me-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
            >
              <div className="flex justify-between">
                <Code className="h-5 w-5 mr-2" />
                Editor
              </div>
            </button>
            <button
              type="button"
              className="text-black shadow-lg hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-2.5 me-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
            >
              <List className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="text-black shadow-lg hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-2.5 me-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
            >
              <RefreshCcw className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={toggleModal}
              className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-4 py-2.5 me-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
            >
              <div className="flex justify-between">
                <Plus className="h-5 w-5 mr-1" />
                Create View
              </div>
            </button>
          </div>
        </div>
        {/* Render modal when it's open */}
        <div className="grid grid-cols-1 md:grid-cols-2 justify-center lg:grid-cols-4 gap-12 mt-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className={`bg-white p-6 rounded-lg shadow-sm border-gray-200`}
            >
              <div className="flex items-center mb-2">
                <div
                  className={`flex items-center justify-center aspect-square w-8 md:w-8 ${card.bgcolor} rounded-full ${card.iconcolor} mr-2`}
                >
                  <Icon icon={card.icon} />
                </div>
                <h3 className="text-lg font-semibold">{card.title}</h3>
              </div>
              <p className="text-black text-5xl font-bold">{card.count}</p>
              <div className="flex items-center justify-between">
                <button className="mt-4 text-purple-600 text-sm hover:text-purple-700">
                  See details
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden mt-10">
          <table className="w-full">
            <thead className="text-sm">
              <tr className="bg-[#29304a] text-white">
                <th className="text-left p-4">ID</th>
                <th className="text-left p-4">Connections</th>
                <th className="text-left p-4">Descriptions</th>
                <th className="text-left p-4">Schema</th>
                <th className="text-left p-4">Tables</th>
                <th className="text-left p-4">Views</th>
                <th className="text-left p-4">Created</th>
                <th className="text-left p-4 last:rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {rowData.map((user, index) => (
                <tr key={index} className="border-b">
                  <td className="p-4 text-left">{user.ID}</td>
                  <td className="p-4 text-left">{user.Connections}</td>
                  <td className="p-4 text-left">{user.Descriptions}</td>
                  <td className="p-4 text-left">{user.Schema}</td>
                  <td className="p-4 text-left">{user.Tables}</td>
                  <td className="p-4 text-left">{user.Views}</td>
                  <td className="p-4 text-left">{user.Created}</td>
                  <td className="p-4 text-left">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveMenu(activeMenu === index ? null : index)
                        }
                        className="p-1.5 rounded-full hover:bg-gray-100"
                      >
                        <MoreHorizontal className="h-5 w-5" />
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
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                <RotateCw className="h-4 w-4" />
                              </button>
                              <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
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
            </tbody>
          </table>
        </div>
        {/* <AgGridReact className="ag-theme-alpine border rounded-lg mt-4"
    rowData={rowData}
    columnDefs={colDefs}
    rowHeight={50}
    headerHeight={50}
    paginationPageSize={10}
    pagination= {true}
    getRowClass={getRowClass}
    theme="legacy" 
  /> */}
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