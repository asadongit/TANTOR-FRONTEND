/*eslint-disable*/
import React, { useState, useEffect, useMemo } from "react";
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
  LinkIcon,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Modal } from "@mui/material";
import { MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import { useAuth } from "../../../../context/AuthContext";
import { secureQuery } from '../../../datagovernance/DataCatalogue/Components/function.js';

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
  const [data, setData] = useState([]);
  const [connectionData, setConnectionData] = useState([]);
  const [schemaList, setSchemaList] = useState([])
  const [tableList, setTableList] = useState([])
  const [viewList, setViewList] = useState([])
  const { token, project, decodedToken, hostnameV1, hostnameV2 } = useAuth();
  const [count, setCount] = useState({});



  const fetchConnectionDetails = async () => {
  setIsLoading(true);
  try {
    const secureQueryResponse = await secureQuery({ user_query: "" }, token);
    const policyIds = secureQueryResponse.matched_policy_ids || [];

    if (policyIds.length === 0) {
          return;
        }

    const response = await fetch(`${hostnameV1}/connection_details`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ policy_id: policyIds }) 
    });
    const data = await response.json();
    
  
    const connections = [...new Set(data.map(item => item.connection_name))];
    const schemaList = {};
    const tableList = {};
    
    connections.forEach(conn => {
      const connData = data.filter(item => item.connection_name === conn);
      schemaList[conn] = [...new Set(connData.map(item => item.table_schema))];
      tableList[conn] = {};
      schemaList[conn].forEach(schema => {
        tableList[conn][schema] = [...new Set(connData
          .filter(item => item.table_schema === schema)
          .map(item => item.table_name))];
      });
    });

    setConnectionData(data);
    setSchemaList(schemaList);
    setTableList(tableList);
    setCount(prev => ({
      ...prev,
      connections,
      totalSchemaCount: Object.values(schemaList).reduce((sum, schemas) => sum + schemas.length, 0),
      totalTableCount: Object.values(tableList).reduce((sum, schemas) => 
        sum + Object.values(schemas).reduce((s, tables) => s + tables.length, 0), 0)
    }));
  } catch (error) {
    console.error("Error fetching connection details:", error);
  } finally {
    setIsLoading(false);
  }
};


const fetchViewCount = async (connectionNames) => {
    try {
      const response = await fetch(`${hostnameV2}/connections/views`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connection_names: connectionNames,
          created_by: decodedToken?.preferred_username || "",
          project: project || "default"
        })
      });

      let data = await response.json();
      console.log("views are  ===>", data);
      setViewList(data);
       setCount(prev => ({
      ...prev,
      totalViewsCount: Object.values(data).reduce((sum, views) => sum + views.length, 0)
    }));
    } catch (error) {
      console.error("Error fetching views:", error);
    }
  };


useEffect(() => {
  fetchConnectionDetails();
}, [token, project, decodedToken]);

useEffect(() => {
  if (connectionData.length > 0) {
    const connectionNames = [...new Set(connectionData.map(item => item.connection_name))];
    fetchViewCount(connectionNames);
  }
}, [connectionData]);


  const [cards, setCards] = useState([]);

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

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setPage(1);
  };
  
  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };
  
  const handleNextPage = () => {
    const maxPage = Math.ceil(rowData.length / itemsPerPage);
    if (page < maxPage) setPage(page + 1);
  };

  const totalItems = rowData.length;
  const startItem = totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, totalItems);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
  if (!connectionData.length) return;

  const updatedRowData = [...new Set(connectionData.map(item => item.connection_id))].map(id => {
    const item = connectionData.find(c => c.connection_id === id);
    return {
      ID: item.connection_id,
      Connections: item.connection_name,
      // Descriptions: item.description || "N/A",
      Schema: schemaList[item.connection_name]?.length || 0,
      Tables: Object.values(tableList[item.connection_name] || {}).reduce((sum, tables) => sum + tables.length, 0),
      Views: viewList[item.connection_name]?.length || 0,
      Created: new Date(item.created_at).toLocaleDateString()
    };
  }).sort((a, b) => new Date(b.Created) - new Date(a.Created));

  setRowData(updatedRowData);

  setCards([
    { icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#d8d3e4]", iconcolor: "text-purple-700", title: "Connections", count: count.connections.length },
    { icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#d8d3e4]", iconcolor: "text-purple-700", title: "Schemas", count: count.totalSchemaCount },
    { icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#d8d3e4]", iconcolor: "text-purple-700", title: "Tables", count: count.totalTableCount },
    { icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#d8d3e4]", iconcolor: "text-purple-700", title: "Views", count: count.totalViewsCount || 0 }
  ]);
}, [connectionData, schemaList, tableList, viewList, count]);

const paginatedData = useMemo(() => {
  const startIndex = (page - 1) * itemsPerPage;
  return rowData.slice(startIndex, startIndex + itemsPerPage);
}, [rowData, page, itemsPerPage]);

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
              className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 transition-transform transform hover:scale-105 hover:shadow-md`}
            >
              <div className="flex items-center mb-2">
                <div
                  className={`flex items-center justify-center aspect-square w-8 md:w-8 ${card.bgcolor} rounded-full ${card.iconcolor} mr-2`}
                >
                  <Icon icon={card.icon} />
                </div>
                <h3 className="text-lg font-semibold">{card.title}</h3>
              </div>
              <p className="text-black text-5xl font-bold">{card.count || 0}</p>
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

        <div className="bg-white rounded-lg shadow overflow-auto mt-10 mb-4 "
          style={{ maxHeight: "calc(100vh - 240px)" }}>
          <table className="w-full">
            <thead className="text-sm">
              <tr className="bg-[#29304a] text-white">
                <th className="text-center p-4">ID</th>
                <th className="text-center p-4">Connections</th>
                {/* <th className="text-center p-4">Descriptions</th> */}
                <th className="text-center p-4">Schema</th>
                <th className="text-center p-4">Tables</th>
                <th className="text-center p-4">Views</th>
                <th className="text-center p-4">Created</th>
                <th className="text-center p-4 last:rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {paginatedData.map((user, index) => (
                <tr key={index} className="border-b">
                  <td className="p-4 text-center">{user.ID}</td>
                  <td className="p-4 text-center">{user.Connections}</td>
                  {/* <td className="p-4 text-center">{user.Descriptions}</td> */}
                  <td className="p-4 text-center">{user.Schema}</td>
                  <td className="p-4 text-center">{user.Tables}</td>
                  <td className="p-4 text-center">{user.Views}</td>
                  <td className="p-4 text-center">{user.Created}</td>
                  <td className="p-4 text-center">
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
                          <div className="absolute top-0 right-14 mt-1 bg-white rounded-lg shadow-lg border z-20 animate-fadeIn">
                            <div className="flex items-center p-1 gap-1">
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
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="text-sm text-gray-500 mb-2 md:mb-0">
            {isLoading ? (
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
            ) : totalItems > 0 ? (
              `Showing ${startItem} to ${endItem} of ${totalItems} results`
            ) : (
              "No results found"
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Show per page</span>
            <select
              className="border rounded p-1 text-sm"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              aria-label="Show per page"
              disabled={isLoading}
            >
              {[10, 25, 50].map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <div className="flex items-center">
              <button
                onClick={handlePrevPage}
                className="p-1 border rounded-l hover:bg-gray-100 disabled:opacity-50"
                disabled={page === 1 || isLoading}
                aria-label="Previous page"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleNextPage}
                className="p-1 border rounded-r border-l-0 hover:bg-gray-100 disabled:opacity-50"
                disabled={page >= totalPages || isLoading}
                aria-label="Next page"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
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