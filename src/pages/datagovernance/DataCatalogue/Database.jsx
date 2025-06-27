import React, { useState, useEffect } from "react";
import { MoreVertical, X } from "lucide-react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";
import { useNavigate } from "react-router-dom";
import CatalogueChart from "./Components/CatalogueTrend";
import Hive from './Components/Icons/Hive.png';
import Oracle from './Components/Icons/Oracle.png';
import Snowflake from './Components/Icons/Snowflake.png';
import Postgres from './Components/Icons/Postgres.png';
import { secureQuery, fetchConnectionDetails } from './Components/function.js';
import { useAuth } from "../../../context/AuthContext.jsx";

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
  const [connectionCounts, setConnectionCounts] = useState({
    oracle: 0,
    hive: 0,
    snowflake: 0,
    postgres: 0
  });
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [recentAccess, setRecentAccess] = useState([]);

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
    }
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
    return processedTableData;
  };

  const processTableData = (data) => {
    const connectionMap = new Map();

    data.forEach(item => {
      const connId = item.connection_id;
      if (!connectionMap.has(connId)) {
        connectionMap.set(connId, {
          id: item.connection_id.substring(0, 8),
          connectionName: item.connection_name,
          Database: item.connection_type,
          Schema: 0,
          Tables: 0,
          Views: 0,
          Column: 0,
          CreatedDate: new Date(item.created_at).toLocaleDateString(),
          updatedDate: new Date(item.updated_at).toLocaleDateString()
        });
      }

      const entry = connectionMap.get(connId);

      entry.Column++;

      const schemaKey = item.table_schema;
      if (!entry.schemas) entry.schemas = new Set();
      entry.schemas.add(schemaKey);
      entry.Schema = entry.schemas.size;

      const tableKey = `${item.table_schema}_${item.table_name}`;
      if (!entry.tableSet) entry.tableSet = new Set();
      entry.tableSet.add(tableKey);
      entry.Tables = entry.tableSet.size;
    });

    return Array.from(connectionMap.values());
  };

  const fetchRecentAccess = async (policyIds) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/recentaccess`, {
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

  return (
    <div>
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
            className="p-1 px-1.5 rounded-lg border border-gray-400 hover:bg-gray-50"
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
            className="p-1 px-1.5 rounded-lg border border-gray-400 hover:bg-gray-50 disabled:opacity-50"
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
          <div className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((card, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-100"
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
                      {/* <button className="p-1 rounded-lg hover:bg-gray-100">
                        <MoreVertical className="h-4 w-4" />
                      </button> */}
                    </div>
                    <div className="text-6xl font-semibold text-gray-800 mt-6">
                      {card.count.toString().padStart(2, "0")}
                    </div>
                    <div className="flex items-center justify-between mt-6">
                      <button
                        className="text-sm text-[#8d77ba] font-medium underline cursor-pointer opacity-90"
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
        <div className="bg-white rounded-lg shadow overflow-hidden mt-5">
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
              {sampleData.length > 0 ? sampleData.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="p-4">{index + 1}</td>
                  <td className="p-4">{item.connectionName}</td>
                  <td className="p-4">{item.Database}</td>
                  <td className="p-4 ">{item.Schema}</td>
                  <td className="p-4">{item.Views || 0}</td>
                  <td className="p-4">{item.Column}</td>
                  <td className="p-4">{item.Tables}</td>
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
      )}
    </div>
  );
};

export default Database;