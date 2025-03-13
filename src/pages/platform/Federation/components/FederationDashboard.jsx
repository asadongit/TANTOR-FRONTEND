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
  Trash2,
  MoreHorizontal,
  RotateCw,
  List,
  RefreshCcw,
  Code,
  Plus,
  LinkIcon
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Modal } from "@mui/material";
import { MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import { useStateContext } from "../context/contextProvider";

ModuleRegistry.registerModules([AllCommunityModule]);

const FederationDashBoard = () => {
    const { handleViewPayload, handleConnectionPayload, handleConsolidationPayload,handleFinalPayload, setColumnSettings} = useStateContext("");
  
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
    handleViewPayload([])
    handleConnectionPayload([])
    handleConsolidationPayload([])
    handleFinalPayload({})
    setColumnSettings({})
  };

  const encodedToken = import.meta.env.VITE_FEDERATION_ACCESS_TOKEN;
  const [data, setData] = useState([]);
  const [connectionData, setconnectionData] = useState([]);
  const [schemaList, setSchemaList] = useState([])
  const [tableList, setTableList] = useState([])
  const [viewList, setViewList] = useState([])

  const [count, setCount] = useState({});

  useEffect(() => {
    var project = "dummy";
    var preferred_username = "sabhyata";
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
              item.created_by.toUpperCase() === preferred_username.toUpperCase() &&
              !item.is_deleted
          );
        } else {
          data = data.filter(
            (item) =>
              item.created_by.toUpperCase() === preferred_username.toUpperCase() &&
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
    if (connectionData.length === 0) return;

    var project = "dummy";
    connectionData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    var extractedData;
    if (project !== "none") {
      data.map((item) => { });
      extractedData = connectionData.filter(
        (item) =>
          // item.project.toUpperCase() === project.toUpperCase() &&
          // item.created_by.toUpperCase() ===
          // token.preferred_username.toUpperCase() &&
          item.is_deleted === false
      );
    } else {
      extractedData = connectionData.filter(
        (item) =>
          // item.created_by.toUpperCase() ===
          // token.preferred_username.toUpperCase() &&
          item.is_deleted === false
      );
    }
    console.log("connection data is ====>", extractedData)
    setData(extractedData);
    const connectionIds = extractedData.map((item) => item.connection_id);
    const connectionNames = extractedData.map((item) => item.connection_name);
    fetchSchemaCount(connectionNames)
    fetchTableCount(connectionNames)
    fetchViewCount(connectionNames)

  }, [connectionData]);


  const fetchSchemaCount = async (connectionNames) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/schema_names`, {
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
      console.log("schema data is ===>", data.schema_names)
      setSchemaList(data.schema_names)
    } catch (error) {
      console.log(error);
    }
  };


  const fetchTableCount = async (connectionNames) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/table_names`, {
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
      console.log("table data is ===>", data.table_names)
      setTableList(data.table_names)
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

  const getTableCount = (tableList, connectionId) => {
    if (!tableList || !tableList[connectionId]) {
      return 0;
    }

    let totalTables = 0;
    Object.keys(tableList[connectionId]).forEach((user) => {
      totalTables += Array.isArray(tableList[connectionId][user])
        ? tableList[connectionId][user].length
        : 0;
    });
    return totalTables;
  };

  const getSchemaMainCount = async (connectionNames) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/schemas/count`, {
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
      console.log("schema main count is  ===>", data["schema-count"]);

      if (data && data["schema-count"] !== undefined) {
        return data["schema-count"];
      } else {
        return 0;
      }

    } catch (error) {
      console.log("Error fetching schema count:", error);
      return 0;
    }
  };

  const getTableMainCount = async (connectionNames) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/tables/count`, {
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
      console.log("table-count is  ===>", data["table-count"]);

      if (data && data["table-count"] !== undefined) {
        return data["table-count"];
      } else {
        return 0;
      }

    } catch (error) {
      console.log("Error fetching schema count:", error);
      return 0;
    }
  };


  useEffect(() => {
    const fetchData = async () => {
      if (!connectionData || connectionData.length === 0 || !schemaList || !viewList || !tableList) {
        return;
      }
      const connectionNames = connectionData.map(connection => connection.connection_name);
      console.log("connection names are ====>", connectionNames);
      if (!connectionNames.length) return;

      const totalViewsCount = Object.values(viewList).reduce((sum, views) => sum + views.length, 0);
      var totalSchemaCount = 0;
      var totalTableCount = 0;

      if (connectionNames) {
        totalSchemaCount = await getSchemaMainCount(connectionNames);
        totalTableCount = await getTableMainCount(connectionNames);
      }

      setCount({
        connections: connectionNames,
        totalSchemaCount: totalSchemaCount,
        totalTableCount: totalTableCount,
        totalViewsCount: totalViewsCount
      });

      const updatedRowData = connectionData.map((item) => {
        return {
          ID: item.connection_id,
          Connections: item.connection_name,
          Descriptions: item.description,
          Schema: schemaList?.[item.connection_name]?.length || 0,
          Tables: tableList ? getTableCount(tableList, item.connection_name) : 0,
          Views: viewList?.[item.connection_name]?.length || 0,
          Created: new Date(item.created_at).toLocaleDateString(),
        };
      });
      setRowData(updatedRowData);
    };

    fetchData();
  }, [connectionData, schemaList, tableList, viewList]);



  const [cards, setCards] = useState([
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#d8d3e4]",
      iconcolor: "text-purple-700",
      title: "Connections",
      count: "0"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#d8d3e4]",
      iconcolor: "text-purple-700",
      title: "Schemas",
      count: "0"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#d8d3e4]",
      iconcolor: "text-purple-700",
      title: "Tables",
      count: "0"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#d8d3e4]",
      iconcolor: "text-purple-700",
      title: "Views",
      count: "0"
    }
  ]);

  useEffect(() => {
    if (count.connections && count.totalViewsCount) {
      setCards([
        {
          icon: "material-symbols:tab-group-outline",
          bgcolor: "bg-[#d8d3e4]",
          iconcolor: "text-purple-700",
          title: "Connections",
          count: `${count.connections.length}` || 0
        },
        {
          icon: "material-symbols:tab-group-outline",
          bgcolor: "bg-[#d8d3e4]",
          iconcolor: "text-purple-700",
          title: "Schemas",
          count: `${count.totalSchemaCount}` || 0
        },
        {
          icon: "material-symbols:tab-group-outline",
          bgcolor: "bg-[#d8d3e4]",
          iconcolor: "text-purple-700",
          title: "Tables",
          count: `${count.totalTableCount}` || 0
        },
        {
          icon: "material-symbols:tab-group-outline",
          bgcolor: "bg-[#d8d3e4]",
          iconcolor: "text-purple-700",
          title: "Views",
          count: `${count.totalViewsCount}` || 0
        }
      ]);
    }
  }, [count]);

  const [rowData, setRowData] = useState([]);

  const [activeMenu, setActiveMenu] = useState(null);

  const handleClickOutside = () => {
    setActiveMenu(null);
  };

  const openModal = (modalName, data = null) => {
    setIsModalOpen((prev) => ({ ...prev, [modalName]: true }));
    setModalData((prev) => ({ ...prev, [modalName]: data }));
  };

  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const handleConnectionsOpen = () => setConnectionsOpen(true);
  const handleConnectionsClose = () => setConnectionsOpen(false);

  const [searchConnection, setSearchConnection] = useState("");
  const filteredConnections = count.connections?.filter((name) =>
    name.toLowerCase().includes(searchConnection.toLowerCase())
  );

  const [schemasOpen, setSchemasOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState("");
  const [schemas, setSchemas] = useState([]);

  const handleSchemasOpen = () => {
    setSchemasOpen(true);
    setSelectedConnection("");
    setSchemas([]);
  };

  const handleSchemasClose = () => {
    setSchemasOpen(false);
    setSelectedConnection("");
  };

  const handleConnectionSelect = (event) => {
    const connectionName = event.target.value;
    setSelectedConnection(connectionName);
    setSchemas(schemaList[connectionName] || []);
  };

  const [tablesOpen, setTablesOpen] = useState(false);
  const [selectedTableConnection, setSelectedTableConnection] = useState('');
  const [selectedTableSchema, setSelectedTableSchema] = useState('');
  const [tables, setTables] = useState([]);

  const handleTablesOpen = () => {
    setTablesOpen(true);
    setSelectedTableConnection('');
    setSelectedTableSchema('');
    setTables([]);
  };

  const handleTablesClose = () => {
    setTablesOpen(false);
  };

  const handleTableConnectionSelect = (event) => {
    const connectionName = event.target.value;
    setSelectedTableConnection(connectionName);
    setSelectedTableSchema('');
  };

  const handleTableSchemaSelect = (event) => {
    const schemaName = event.target.value;
    setSelectedTableSchema(schemaName);
    setTables(tableList[selectedTableConnection]?.[schemaName] || []);
  };

  const [selectedView, setSelectedView] = useState("");

  const [viewOpen, setViewOpen] = useState(false);
  const handleViewsOpen = () => setViewOpen(true);
  const handleViewsClose = () => setViewOpen(false);

  const handleConnectionChange = (e) => {
    setSelectedConnection(e.target.value);
    setSelectedView("");
  };

  const handleViewChange = (e) => {
    setSelectedView(e.target.value);
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
                {card.title === "Schemas" && (
                  <button
                    onClick={handleSchemasOpen}
                    className="mt-4 text-purple-600 text-sm hover:text-purple-700"
                  >
                    See details
                  </button>
                )}
                {card.title === "Connections" && (
                  <button
                    onClick={handleConnectionsOpen}
                    className="mt-4 text-purple-600 text-sm hover:text-purple-700"
                  >
                    See details
                  </button>
                )}
                {card.title === "Tables" && (
                  <button
                    onClick={handleTablesOpen}
                    className="mt-4 text-purple-600 text-sm hover:text-purple-700"
                  >
                    See details
                  </button>
                )}
                {card.title === "Views" && (
                  <button
                    onClick={handleViewsOpen}
                    className="mt-4 text-purple-600 text-sm hover:text-purple-700"
                  >
                    See details
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow overflow-auto mt-10">
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
                              {/* <button
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <Pencil className="h-4 w-4" />
                              </button> */}
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
      <Modal open={connectionsOpen} onClose={handleConnectionsClose}>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-lg px-6 pb-5 pt-3 rounded-2xl shadow-xl max-h-[90vh] w-96 border border-gray-200 flex flex-col">
          <div className="flex text-center justify-center mb-4">
            {/* <LinkIcon className="h-5 w-5 mr-4 mt-1" /> */}
            <h2 className="text-xl font-bold text-gray-900">Connections Details</h2>
          </div>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search connections..."
            value={searchConnection}
            onChange={(e) => setSearchConnection(e.target.value)}
            className="mt-3 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          {/* Connections List */}
          <div className="mt-4 flex-1 overflow-y-auto py-2 pr-4 space-y-3">
            {filteredConnections?.length > 0 ? (
              filteredConnections.map((name, index) => (
                <div
                  key={index}
                  className="p-3 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <span className="text-gray-800 font-medium">{name}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No connections found</p>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={handleConnectionsClose}
            className="mt-6 w-full bg-[#8E77BB] text-white py-2 rounded-lg hover:opacity-90 font-medium shadow-md"
          >
            Close
          </button>
        </div>
      </Modal>


      <Modal open={schemasOpen} onClose={handleSchemasClose}>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-lg px-6 pb-5 pt-3 rounded-2xl shadow-xl max-h-[90vh] w-96 border border-gray-200 flex flex-col">
          <div className="flex text-center justify-center">
            <h2 className="text-xl font-bold text-gray-900">Schemas Details</h2>
          </div>

          {/* Dropdown to select a connection */}
          <FormControl fullWidth variant="outlined" margin="normal">
            <InputLabel id="connection-select-label">Select Connection</InputLabel>
            <Select
              labelId="connection-select-label"
              value={selectedConnection}
              onChange={handleConnectionSelect}
              label="Select Connection"
            >
              {Object.keys(schemaList).map((connection, index) => (
                <MenuItem key={index} value={connection}>
                  {connection}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedConnection && (
            <div className="mt-4 flex-1 overflow-y-auto py-2 pr-4 space-y-3">
              {schemas.length > 0 ? (
                schemas.map((schema, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg hover:bg-gray-50 transition flex items-center gap-2"
                  >
                    <span className="text-gray-800 font-medium">{schema}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No schemas found</p>
              )}
            </div>
          )}

          <button
            onClick={handleSchemasClose}
            className="mt-6 w-full bg-[#8E77BB] text-white py-2 rounded-lg hover:opacity-90 font-medium shadow-md"
          >
            Close
          </button>
        </div>
      </Modal>


      <Modal open={tablesOpen} onClose={handleTablesClose}>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-lg px-6 pb-5 pt-3 rounded-2xl shadow-xl max-h-[90vh] w-96 border border-gray-200 flex flex-col">
          <div className="flex text-center justify-center">
            <h2 className="text-xl font-bold text-gray-900">Tables Details</h2>
          </div>

          <FormControl fullWidth variant="outlined" margin="normal">
            <InputLabel id="table-connection-select-label">Select Connection</InputLabel>
            <Select
              labelId="table-connection-select-label"
              value={selectedTableConnection}
              onChange={handleTableConnectionSelect}
              label="Select Connection"
            >
              {Object.keys(tableList).map((connection, index) => (
                <MenuItem key={index} value={connection}>
                  {connection}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedTableConnection && (
            <FormControl fullWidth variant="outlined" margin="normal">
              <InputLabel id="table-schema-select-label">Select Schema</InputLabel>
              <Select
                labelId="table-schema-select-label"
                value={selectedTableSchema}
                onChange={handleTableSchemaSelect}
                label="Select Schema"
              >
                {Object.keys(tableList[selectedTableConnection] || {}).map((schema, index) => (
                  <MenuItem key={index} value={schema}>
                    {schema}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {selectedTableSchema && (
            <div className="mt-4 flex-1 overflow-y-auto py-2 pr-4 space-y-3">
              {tables.length > 0 ? (
                tables.map((table, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg hover:bg-gray-50 transition flex items-center gap-2"
                  >
                    <span className="text-gray-800 font-medium break-words max-w-full overflow-x-auto">{table}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No tables found</p>
              )}
            </div>
          )}

          <button
            onClick={handleTablesClose}
            className="mt-6 w-full bg-[#8E77BB] text-white py-2 rounded-lg hover:opacity-90 font-medium shadow-md"
          >
            Close
          </button>
        </div>
      </Modal>


      <Modal open={viewOpen} onClose={handleViewsClose}>

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-lg px-6 pb-5 pt-3 rounded-2xl shadow-xl max-h-[90vh] w-96 border border-gray-200 flex flex-col">
          <div className="flex text-center justify-center">
            <h2 className="text-xl font-bold text-gray-900">Views Details</h2>
          </div>

          {/* Dropdown to select a connection */}
          <FormControl fullWidth variant="outlined" margin="normal">
            <InputLabel id="connection-select-label">Select Connection</InputLabel>
            <Select
              labelId="connection-select-label"
              value={selectedConnection}
              onChange={handleConnectionChange}
              label="Select Connection"
            >
              {Object.keys(schemaList).map((connection, index) => (
                <MenuItem key={index} value={connection}>
                  {connection}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedConnection && (
            <div className="mt-4 flex-1 overflow-y-auto py-2 pr-4 space-y-3">
              {viewList[selectedConnection]?.length > 0 ? (
                  viewList[selectedConnection].map((view, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg hover:bg-gray-50 transition flex items-center gap-2"
                  >
                    <span className="text-gray-800 font-medium">{view}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No views found</p>
              )}
            </div>
          )}

          <button
            onClick={handleViewsClose}
            className="mt-6 w-full bg-[#8E77BB] text-white py-2 rounded-lg hover:opacity-90 font-medium shadow-md"
          >
            Close
          </button>
        </div>
      </Modal>




    </>
  );

};

export default FederationDashBoard;