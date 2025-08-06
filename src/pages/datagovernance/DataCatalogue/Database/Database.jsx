import React, { useState, useEffect } from "react";
import { Columns3, MoreVertical, X, Table } from "lucide-react";
import Breadcrumb from "../../../../components/Breadcrumb.jsx";
import { Icon } from "@iconify-icon/react";
import { useNavigate } from "react-router-dom";
import CatalogueChart from "../Components/CatalogueTrend.jsx";
// import Hive from "./Components/Icons/Hive.png";
import Hive from "../Components/Icons/Hive.png"
import Oracle from '../Components/Icons/Oracle.png';
import Snowflake from '../Components/Icons/Snowflake.png';
import Postgres from '../Components/Icons/Postgres.png';
import { secureQuery, fetchConnectionDetails } from '../Components/function.js';
import { useAuth } from "../../../../context/AuthContext.jsx";

const rotateAnimation = `
  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .icon-rotate {
    animation: rotate 1s linear infinite;
  }
`;

const Database = () => {
  const [isTableView, setIsTableView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [policyIds, setPolicyIds] = useState([]);
  const [connectionData, setConnectionData] = useState([]);
  const [schemaData, setSchemaData] = useState(null)
  const [connectionCounts, setConnectionCounts] = useState({
    oracle: 0,
    hive: 0,
    snowflake: 0,
    postgres: 0
  });
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [recentAccess, setRecentAccess] = useState([]);
  const [isSchemaPopupOpen, setIsSchemaPopupOpen] = useState(false)
  const [currentDatabase, setCurrentDatabase] = useState(null)
  const [tableData, setTableData] = useState({});
  const [tableDataPopup, setTableDataPopup] = useState(false);
  const [tableId, setTableId] = useState("")
  
  

  const [cards, setCards] = useState([
    {
      title: "Oracle",
      enabled: true,
      icon: Oracle,
      count: 0,
      seeDetailsLink: "/database-details",
    },
    {
      title: "Postgres",
      enabled: true,
      icon: Postgres,
      count: 0,
      seeDetailsLink: "/tables-details",
    },
    {
      title: "Hive",
      enabled: true,
      icon: Hive,
      count: 0,
      seeDetailsLink: "/schema-details",
    },
    {
      title: "Snowflake",
      enabled: true,
      icon: Snowflake,
      count: 0,
      seeDetailsLink: "/schema-details",
    },
  ]);

  const { token } = useAuth();

  const navigate = useNavigate();

  const processConnectionData = (data) => {
    const counts = {
      oracle: 0,
      hive: 0,
      snowflake: 0,
      postgres: 0
    };

    const uniqueConnections = new Set();

    data.forEach(item => {
      const connKey = `${item.connection_type}_${item.connection_id}`;
      if (!uniqueConnections.has(connKey)) {
        uniqueConnections.add(connKey);

        const connType = item.connection_type.toLowerCase();
        if (connType === 'oracle') counts.oracle++;
        else if (connType === 'hive') counts.hive++;
        else if (connType === 'snowflake') counts.snowflake++;
        else if (connType === 'postgres') counts.postgres++;
      }
    });

    setConnectionCounts(counts);

    setCards(prevCards => prevCards.map(card => {
      const title = card.title.toLowerCase();
      return {
        ...card,
        count: counts[title] || 0
      };
    }));

    const processedTableData = processTableData(data);
    setTableData(processedTableData.tableDataMap);
    return processedTableData.connections;
  };

  const processTableData = (data) => {
    const connectionMap = new Map();
    const tableDataMap = {};

    data.forEach(item => {
      const connId = item.connection_id;
      if (!connectionMap.has(connId)) {
        connectionMap.set(connId, {
          id: item.connection_id.substring(0, 8),
          connectionName: item.connection_name,
          Database: item.connection_type,
          owner: item.created_by,
          Schema: 0,
          Tables: 0,
          Views: 0,
          Column: 0,
          CreatedDate: new Date(item.created_at).toLocaleDateString(),
          updatedDate: new Date(item.updated_at).toLocaleDateString(),
          schemas: new Set(),
          tableSet: new Set(),
        });
      }

      const entry = connectionMap.get(connId);

      entry.Column++;

      entry.schemas.add(item.table_schema);
      entry.Schema = entry.schemas.size;

      const tableKey = `${item.table_schema}_${item.table_name}`;
      if (!entry.tableSet.has(tableKey)) {
        entry.tableSet.add(tableKey);
        entry.Tables = entry.tableSet.size;

        const groupKey = `${item.connection_name}_${item.table_schema}`;
        if (!tableDataMap[groupKey]) {
          tableDataMap[groupKey] = [];
        }
        tableDataMap[groupKey].push({
          table_name: item.table_name,
          description: "table description",
          database: item.connection_type,
          schema: item.table_schema,
          owner: item.created_by,
        });
      }
    });

    return {
      connections: Array.from(connectionMap.values()),
      tableDataMap,
    };
  };


  const fetchRecentAccess = async (policyIds) => {
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/recentaccess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: policyIds
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setRecentAccess(data.connections || []);
      return data;
    } catch (error) {
      console.error('Error fetching recent access:', error);
      setRecentAccess([]);
      return [];
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const secureQueryResponse = await secureQuery({
        user_query: "",
      },
      token);
      const policyIds = secureQueryResponse.matched_policy_ids || [];
      setPolicyIds(policyIds);

      const allConnectionsData = await fetchConnectionDetails(policyIds, token);
      setConnectionData(allConnectionsData);

      const tableData = processConnectionData(allConnectionsData);
      setSampleData(tableData);

      // Fetch recent access data
      await fetchRecentAccess(policyIds);

      return { success: true };
    } catch (error) {
      console.error('Error loading data:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // New handler to refresh data with toast
  const handleRefresh = async () => {
    const result = await loadData();

    if (result.success) {
      setToast({
        show: true,
        message: 'Database data refreshed successfully',
        type: 'success'
      });
    } else {
      setToast({
        show: true,
        message: 'Failed to refresh database data',
        type: 'error'
      });
    }

    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const trendData = [
    { day: '1 day', Database: 20, Schema: 9, Tables: 13, View: 11 },
    { day: '2 day', Database: 25, Schema: 9, Tables: 17, View: 11 },
    { day: '3 day', Database: 26, Schema: 17, Tables: 9, View: 8 },
    { day: '4 day', Database: 27, Schema: 17, Tables: 15, View: 18 },
    { day: '5 day', Database: 25, Schema: 14, Tables: 13, View: 23 },
    { day: '6 day', Database: 23, Schema: 20, Tables: 15, View: 16 },
    { day: '7 day', Database: 21, Schema: 27, Tables: 16, View: 15 },
  ];

  const [sampleData, setSampleData] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [selectedDbType, setSelectedDbType] = useState(null);

  // Filtered data for modal
  const getDbDetails = (dbType) => {
    return sampleData.filter(item => item.Database && item.Database.toLowerCase() === dbType.toLowerCase());
  };

  const handleSchemaPopup = (item) => {
    setIsSchemaPopupOpen(true);
    setCurrentDatabase(item)
  }

  const handleTableDataPopup = (connection) => {
    const [schema] = [...connection.schemas];

    const id = connection.connectionName + "_" + schema
    setTableId(id);
    setTableDataPopup(true);
    setCurrentDatabase(connection);
    setIsTableView(true); 
  }

  useEffect(() => {
    const schemaMap = {};

    connectionData.forEach((item) => {
      const key = `${item.connection_name}__${item.connection_type}`;
      if (!schemaMap[key]) {
        schemaMap[key] = new Set();
      }
      schemaMap[key].add(item.table_schema);
    });

    const result = Object.entries(schemaMap).map(([key, schemaSet]) => {
      const [connection_name] = key.split("__");
      return {
        [connection_name]: {
          schemas: Array.from(schemaSet),
        }
      };
    });

    setSchemaData(result)
  }, [connectionData])

  const handeNavigateToDatabaseViewScreen = (item) => {
    navigate(`/datagovernance/data-catalogue/database/${item.connectionName}`, {
      state: { connectionData: item,
        schema: schemaData
        }
    });
     setIsTableView(true); 
  }

  const connectionName = currentDatabase?.connectionName;
  const schemaList = schemaData?.find((item) => item[connectionName])?.[connectionName]?.schemas || [];


  return (
    <div className="">
      <style>{rotateAnimation}</style>

      {/* Toast notification */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn ${
          toast.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' :
          'bg-red-100 text-red-800 border-l-4 border-red-500'
        }`}>
          <Icon
            icon={toast.type === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'}
            className="h-5 w-5"
          />
          <p>{toast.message}</p>
          <button
            onClick={() => setToast({ show: false, message: '', type: '' })}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setShowModal(false)}
            >
              <X className="h-6 w-6" />
            </button>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 capitalize">{selectedDbType} Database Details</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#29304a] text-white">
                      <th className="text-left p-4">Sno</th>
                      <th className="text-left p-4">Connection Name</th>
                      <th className="text-left p-4">Database</th>
                      <th className="text-left p-4">Schema</th>
                      <th className="text-left p-4">Tables</th>
                      <th className="text-left p-4">Views</th>
                      <th className="text-left p-4">Columns</th>
                      <th className="text-left p-4">Created Date</th>
                      <th className="text-left p-4">Updated Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getDbDetails(selectedDbType).length > 0 ? getDbDetails(selectedDbType).map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-4">{index + 1}</td>
                        <td className="p-4">{item.connectionName}</td>
                        <td className="p-4">{item.Database}</td>
                        <td className="p-4  ">{item.Schema}</td>
                        <td className="p-4  ">{item.Tables}</td>
                        <td className="p-4  ">{item.Views || 0}</td>
                        <td className="p-4  ">{item.Column}</td>
                        <td className="p-4">{item.CreatedDate}</td>
                        <td className="p-4">{item.updatedDate}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="9" className="p-4 text-center">No database available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      <Breadcrumb/>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Database</h1>
        <div className="flex items-center gap-2">
          <button
            className="px-2 pt-1 rounded-lg border border-gray-400 hover:bg-gray-50"
            onClick={() => setIsTableView(!isTableView)}
          >
            <Icon
              icon={isTableView ? "material-symbols-light:cards-outline" : "material-symbols-light:format-list-bulleted"}
              width="24"
              height="24"
              className="text-gray-600"
            />
          </button>

          <button
            className="px-2 pt-1 rounded-lg border border-gray-400 hover:bg-gray-50 disabled:opacity-50"
            onClick={handleRefresh}
            disabled={loading}
          >
            <Icon
              icon="material-symbols:autorenew-rounded"
              width="24"
              height="24"
              className={`text-gray-600 ${loading ? 'icon-rotate' : ''}`}
            />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading data...</p>
        </div>
        ) : !isTableView ? (
        <>
          <div className="mt-4 overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              {cards.map((card, index) => (
                <div
                  key={index}
                  className="min-w-[280px] bg-white rounded-lg shadow-sm border border-gray-100"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10">
                          <img
                            src={card.icon}
                            alt={`${card.title} icon`}
                            className="w-6 h-6 md:w-8 md:h-8 object-contain"
                          />
                        </div>
                        <h3 className="text-lg font-semibold">{card.title}</h3>
                      </div>
                    </div>
                    <div className="text-6xl font-semibold text-gray-800 mt-6">
                      {card.count.toString().padStart(2, "0")}
                    </div>
                    <div className="flex items-center justify-between mt-6">
                      <button
                        className={`text-sm text-[#8d77ba] font-medium underline opacity-90
                          ${card.count === 0 ? `text-gray-400 cursor-not-allowed underline-offset-2` : 
                            "text-[#8d77ba] cursor-pointer"
                          }`}
                        disabled={card.count === 0}
                        onClick={() => {
                          setSelectedDbType(card.title);
                          setShowModal(true);
                        }}
                      >
                        See details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>


          <div className="grid lg:grid-cols-2 gap-6 mt-10">
            <CatalogueChart data={trendData} />
            <div className="bg-white p-6 rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium">Recent access</h3>
                <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 text-sm">i</span>
                </div>
              </div>
              <div className="space-y-4">
                {recentAccess.length > 0 ? recentAccess.map((item, index) => (
                  <div key={index} className="pb-4 border-b border-gray-100 last:border-0">
                    <span className="text-gray-600">{index + 1}. {item}</span>
                  </div>
                )) : (
                  <div className="pb-4 border-b border-gray-100">
                    <span className="text-gray-500">No recent access data available</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
        ) : (
        <>
        <div className="bg-white rounded-lg shadow text-sm overflow-hidden mt-5">
          <table className="w-full">
            <thead>
              <tr className="bg-[#29304a] text-white">
                <th className="text-left p-4">Sno</th>
                <th className="text-left p-4">Connection Name</th>
                <th className="text-left p-4">Database</th>
                <th className="text-left p-4">Schema</th>
                <th className="text-left p-4">Tables</th>
                <th className="text-left p-4">Created Date</th>
                <th className="text-left p-4">Updated Date</th>
              </tr>
            </thead>
            <tbody>
              {sampleData.length > 0 ? sampleData.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="p-4">{index + 1}</td>
                  <td 
                    onClick={() => handeNavigateToDatabaseViewScreen(item)}
                    className="p-4 underline underline-offset-4 text-blue-600 cursor-pointer">
                    {item.connectionName}
                  </td>
                  <td className="p-4">{item.Database}</td>
                  <td 
                    onClick={() => handleSchemaPopup(item)}
                    className="p-4 underline underline-offset-4 text-blue-600 cursor-pointer">
                    {item.Schema}
                  </td>
                  <td 
                    onClick={() => handleTableDataPopup(item)}
                    className="p-4 underline underline-offset-4 text-blue-600 cursor-pointer">
                      {item.Tables}
                  </td>
                  <td className="p-4">{item.CreatedDate}</td>
                  <td className="p-4">{item.updatedDate}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9" className="p-4 text-center">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </>
      )}

      {tableDataPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setTableDataPopup(false)}
          ></div>

          <div className="relative h-[500px] bg-white rounded-lg shadow-2xl mx-4 w-full max-w-5xl transform transition-all duration-300 ease-out flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center">
                <span className="pr-1 text-[#8d77ba]"><Table /></span>
                <span className="text-lg font-semibold text-gray-900 pr-3"> Table Details:</span>
                <span className="text-md text-lg">{currentDatabase.connectionName}</span>
              </div>
              <button
                onClick={() => setTableDataPopup(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-7">
              <table className="min-w-full text-sm text-left border border-gray-200 rounded-lg">
                <thead className="bg-[#262B46] text-white uppercase text-xs sticky top-0 z-20">
                  <tr>
                    <th className="px-4 py-3 font-medium bg-[#262B46]">Table name</th>
                    <th className="px-4 py-3 font-medium bg-[#262B46]">Description</th>
                    <th className="px-4 py-3 font-medium bg-[#262B46]">Database</th>
                    <th className="px-4 py-3 font-medium bg-[#262B46]">Schema</th>
                    <th className="px-4 py-3 font-medium bg-[#262B46]">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData[tableId]?.map((table, idx) => 
                    {
                      return (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2">{table.table_name}</td>
                          <td className="px-4 py-2">{table.description}</td>
                          <td className="px-4 py-2">{table.database}</td>
                          <td className="px-4 py-2">{table.schema}</td>
                          <td className="px-4 py-2">{table.owner}</td>
                        </tr>
                      )
                    }
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end bg-white sticky bottom-0 z-10">
              <button
                onClick={() => setTableDataPopup(false)}
                className="px-4 py-2 text-white bg-[#8d77ba] rounded-md hover:bg-[#7a66a8] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isSchemaPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setIsSchemaPopupOpen(false)}
          ></div>

          <div className="relative h-[500px] bg-white rounded-lg shadow-2xl mx-4 w-full max-w-5xl transform transition-all duration-300 ease-out flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center">
                <span className="pr-1 text-[#8d77ba]"><Columns3 /></span>
                <span className="text-lg font-semibold text-gray-900 pr-3">Schema Details:</span>
                <span className="text-md">{currentDatabase.connectionName}</span>
              </div>
              <button
                onClick={() => setIsSchemaPopupOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-7 h-[400px]">
              <table className="min-w-full text-sm text-left border border-gray-200 rounded-lg">
                <thead className="bg-[#262B46] text-white uppercase text-xs sticky top-0 z-20 rounded-lg">
                  <tr className="">
                    <th className="px-4 py-3 font-medium bg-[#262B46]">Schema name</th>
                    <th className="px-4 py-3 font-medium bg-[#262B46]">Description</th>
                    <th className="px-4 py-3 font-medium bg-[#262B46]">Database</th>
                    <th className="px-4 py-3 font-medium bg-[#262B46]">Owner</th>
                  </tr>
                </thead>
                <tbody className="text-[#262B46] bg-white rounded-lg">
                  {schemaList.map((schema, idx) => {
                    return (
                      <tr key={idx} className="border-b">
                        <td className="p-4">{schema}</td>
                        <td className="p-4">Schema description</td>
                        <td className="p-4">{currentDatabase.Database}</td>
                        <td className="p-4">{currentDatabase.owner}</td>
                      </tr>
                    )
                  })}
                  {/* {columnData[columnId].map((column) => {
                    const meta = column.column_metadata;
                    return (
                      <tr key={column.column_name} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{column.column_name}</td>
                        <td className="px-4 py-2">{meta.DATA_TYPE}</td>
                        <td className="px-4 py-2">{meta.DATA_LENGTH}</td>
                        <td className="px-4 py-2">{meta.DATA_PRECISION}</td>
                        <td className="px-4 py-2">{meta.DATA_SCALE}</td>
                        <td className="px-4 py-2">{meta.is_nullable === 'N' ? 'No' : 'Yes'}</td>
                      </tr>
                    );
                  })} */}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end bg-white sticky bottom-0 z-10">
              <button
                onClick={() => setIsSchemaPopupOpen(false)}
                className="px-4 py-2 text-white bg-[#8d77ba] rounded-md hover:bg-[#7a66a8] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Database;