import React, { useState, useEffect } from "react";
import { Columns3, X, Table, ChevronLeft, ChevronRight, RefreshCcw, TableOfContents, Layers, LayoutGrid, Search, Info } from "lucide-react";
import Breadcrumb from "../../../../components/Breadcrumb.jsx";
import { Icon } from "@iconify-icon/react";
import { useNavigate } from "react-router-dom";
import CatalogueChart from "../Components/CatalogueTrend.jsx";
import Hive from "../Components/Icons/Hive.png"
import Oracle from '../Components/Icons/Oracle.png';
// import Snowflake from '../Components/Icons/Snowflake.png';
import Postgres from '../Components/Icons/Postgres.png';
import { secureQuery, fetchConnectionDetails } from '../Components/function.js';
import { useAuth } from "../../../../context/AuthContext.jsx";
import MySQL from '../Components/Icons/Mysql.png';

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
  const [allRawData, setAllRawData] = useState([]);
  const [connectionData, setConnectionData] = useState([]);
  const [schemaData, setSchemaData] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [recentAccess, setRecentAccess] = useState([]);

  const [dbTypeFilter, setDbTypeFilter] = useState(null);

  // NEW: State for search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Set items per page

  const [cards, setCards] = useState([
    { title: "Oracle", icon: Oracle, count: 0 },
    { title: "Postgres", icon: Postgres, count: 0 },
    { title: "MySQL", icon: MySQL, count: 0 },
    { title: "Hive", icon: Hive, count: 0 },
    // { title: "Snowflake", icon: Snowflake, count: 0 },
  ]);

  const { token } = useAuth();
  const navigate = useNavigate();

  const processConnectionData = (data) => {
    const counts = { oracle: 0, hive: 0, postgres: 0, mysql: 0 };
    const uniqueConnections = new Set();
    data.forEach(item => {
      const connKey = `${item.connection_type}_${item.connection_id}`;
      if (!uniqueConnections.has(connKey)) {
        uniqueConnections.add(connKey);
        const connType = item.connection_type.toLowerCase();
        if (counts.hasOwnProperty(connType)) {
          counts[connType]++;
        }
      }
    });

    setCards(prevCards => prevCards.map(card => ({
      ...card,
      count: counts[card?.title?.toLowerCase()] || 0
    })));

    const connectionMap = new Map();
    data.forEach(item => {
      const connId = item.connection_id;
      if (!connectionMap.has(connId)) {
        connectionMap.set(connId, {
          id: item.connection_id, // Using full ID for a more reliable key
          connectionName: item.connection_name,
          Alias: item.connection_name,
          Database: item.connection_type,
          owner: item.created_by || '',
          Schema: 0,
          Tables: 0,
          Column: 0,
          CreatedDate: new Date(item.created_at).toLocaleDateString(),
          updatedDate: new Date(item.updated_at).toLocaleDateString(),
          schemas: new Set(),
          tableSet: new Set(),
          description: item.description
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
      }
    });

    return Array.from(connectionMap.values());
  };

  const [chartData, setChartData] = useState([]);
  const [chartDataKeys, setChartDataKeys] = useState([]);

  const fetchTrendData = async (policyIds) => {
    if (!policyIds || policyIds.length === 0) {
      setChartData([]);
      return;
    }
    try {
      const apiUrl = `${window._env_?.VITE_FAST_API}/data_catalogue/database_trend`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ policy_id: policyIds })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const rawTrendData = await response.json();
      const allDbTypes = new Set();
      rawTrendData.forEach(dayData => {
        Object.keys(dayData.connections).forEach(dbType => {
          if (dbType && dbType !== 'null') {
            allDbTypes.add(dbType);
          }
        });
      });
      const dynamicKeys = Array.from(allDbTypes);
      setChartDataKeys(dynamicKeys);
      const formattedData = rawTrendData.map(dayData => {

        const chartPoint = {
          day: dayData.date,
        };

        dynamicKeys.forEach(key => {
          chartPoint[key] = 0;
        });

        for (const [dbType, count] of Object.entries(dayData.connections)) {
          if (dynamicKeys.includes(dbType)) {
            chartPoint[dbType] = count;
          }
        }
        return chartPoint;
      });

      setChartData(formattedData.reverse());

    } catch (error) {
      console.error('Error fetching trend data:', error);
      setChartData([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const secureQueryResponse = await secureQuery({ user_query: "" }, token);
      const policyIds = secureQueryResponse.matched_policy_ids || [];
      const allConnectionsData = await fetchConnectionDetails(policyIds, token);

      setAllRawData(allConnectionsData);
      const processedData = processConnectionData(allConnectionsData);
      setConnectionData(processedData);

      await fetchRecentAccess(policyIds);
      await fetchTrendData(policyIds);
      return { success: true };
    } catch (error) {
      console.error('Error loading data:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentAccess = async (policyIds) => {
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/recentaccess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: policyIds })
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setRecentAccess(data.connections || []);
    } catch (error) {
      console.error('Error fetching recent access:', error);
      setRecentAccess([]);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  useEffect(() => {
    if (!allRawData || allRawData.length === 0) return;
    const connectionSchemaMap = new Map();

    allRawData.forEach((item) => {
      const connectionName = item.connection_name;

      if (!connectionSchemaMap.has(connectionName)) {
        connectionSchemaMap.set(connectionName, new Map());
      }
      const schemaMap = connectionSchemaMap.get(connectionName);

      if (!schemaMap.has(item.table_schema)) {
        schemaMap.set(item.table_schema, item.table_schema_description);
      }
    });

    const result = Array.from(connectionSchemaMap.entries()).map(([connectionName, schemaMap]) => {
      const schemasWithDescriptions = Array.from(schemaMap.entries()).map(([name, description]) => ({
        name: name,
        description: description || 'Schema Description'
      }));

      return {
        [connectionName]: {
          schemas: schemasWithDescriptions,
        }
      };
    });

    setSchemaData(result);
  }, [allRawData]);

  const resetFiltersAndPagination = () => {
    setDbTypeFilter(null);
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    resetFiltersAndPagination(); // Clear filters and reset pagination on refresh
    const result = await loadData();
    if (result.success) {
      setToast({ show: true, message: 'Database data refreshed successfully', type: 'success' });
    } else {
      setToast({ show: true, message: 'Failed to refresh database data', type: 'error' });
    }
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handeNavigateToDatabaseViewScreen = (item) => {
    navigate(`/datagovernance/data-catalogue/database/${item.connectionName}`, {
      state: {
        connectionData: item,
        schema: schemaData
      }
    });
  };

  const handleNavigateToSchemas = (db) => {
    navigate('/datagovernance/data-catalogue/schema', {
      state: { type: 'database', connectionName: db.connectionName }
    });
  };

  const handleNavigateToTables = (db) => {
    navigate('/datagovernance/data-catalogue/table', {
      state: { type: 'database', connectionName: db.connectionName }
    });
  };

  const handleNavigateToColumns = (db) => {
    navigate('/datagovernance/data-catalogue/column', {
      state: { type: 'database', connectionName: db.connectionName }
    });
  };

  // MODIFICATION: Filter data by type and search term
  const filteredData = connectionData.filter(item => {
    const typeMatch = !dbTypeFilter || item.Database.toLowerCase() === dbTypeFilter.toLowerCase();
    const searchMatch = !searchTerm ||
      item.connectionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.Database.toLowerCase().includes(searchTerm.toLowerCase());
    return typeMatch && searchMatch;
  });

  // NEW: Pagination logic
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const [showTooltip, setShowTooltip] = useState(false);


  return (
    <div className="p-4">
      <style>{rotateAnimation}</style>

      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn ${toast.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' :
          'bg-red-100 text-red-800 border-l-4 border-red-500'
          }`}>
          <Icon icon={toast.type === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'} className="h-5 w-5" />
          <p>{toast.message}</p>
          <button title="Close" onClick={() => setToast({ show: false, message: '', type: '' })} className="ml-2 text-gray-500 hover:text-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Breadcrumb />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Database</h1>
        <div className="flex items-center gap-2">
          {isTableView && (
            <div className="flex justify-end items-center my-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search connections..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 py-2 border rounded-lg shadow-sm w-80 focus:outline-none focus:ring-2 focus:ring-[#8d77ba]"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          )}

          <button
            title={isTableView ? "Grid View" : "List View"}
            onClick={() => {
              setIsTableView(!isTableView);
              resetFiltersAndPagination();
            }}
            className="text-black border border-gray-300 shadow-lg hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-2.5 me-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            {isTableView ? <LayoutGrid className="h-5 w-5" /> : <TableOfContents className="h-5 w-5" />}
          </button>
          <button
            title="Refresh"
            onClick={handleRefresh}
            disabled={loading}
            className="text-black border border-gray-300 shadow-lg hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-2.5 me-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading data...</p>
        </div>
      ) : !isTableView ? (
        <>
          <div className="mt-2 overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              {cards.map((card, index) => (
                <div key={index} className="min-w-[280px] bg-white rounded-lg shadow-sm border border-gray-100">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10">
                          <img src={card.icon} alt={`${card.title} icon`} className="w-6 h-6 md:w-8 md:h-8 object-contain" />
                        </div>
                        <h3 className="text-lg font-semibold">{card.title}</h3>
                      </div>
                    </div>
                    <div className="text-6xl font-semibold text-gray-800 mt-6">
                      {card.count.toString().padStart(2, "0")}
                    </div>
                    <div className="flex items-center justify-between mt-6">
                      <button
                        className={`text-sm font-medium underline opacity-90 ${card.count === 0 ? `text-gray-400 cursor-not-allowed` : "text-[#8d77ba] cursor-pointer"}`}
                        disabled={card.count === 0}
                        onClick={() => {
                          setDbTypeFilter(card.title);
                          setIsTableView(true);
                          setCurrentPage(1); // Reset page when filtering
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
          <div className="grid lg:grid-cols-3 gap-6 mt-10">
            <div className="lg:col-span-2">
              <CatalogueChart data={chartData} dataKeys={chartDataKeys} isDatabase={true} />
            </div>
            <div className="bg-white p-6 rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium">Recent access</h3>
                <div
                  className="relative"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center cursor-help">
                    <span className="text-gray-600 text-sm">i</span>
                  </div>
                  {showTooltip && (
                    <div className="absolute bottom-full right-0 mb-2 w-64 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg z-10">
                      A list of connections you have recently accessed.
                      <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
                    </div>
                  )}
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
          <div className="bg-white rounded-lg shadow text-sm overflow-x-auto mt-5">
            <table className="w-full">
              <thead>
                <tr className="bg-[#29304a] text-white">
                  <th className="text-left p-4">Id</th>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Alias</th>
                  <th className="text-left p-4">Description</th>
                  <th className="text-left p-4">Owner</th>
                  <th className="text-left p-4">Schema</th>
                  <th className="text-left p-4">Tables</th>
                  <th className="text-left p-4">Columns</th>
                  <th className="text-left p-4">Created Date</th>
                  <th className="text-left p-4">Updated Date</th>
                </tr>
              </thead>
              <tbody>
                {/* MODIFICATION: Map over paginated items */}
                {currentItems.length > 0 ? currentItems.map((item, index) => (
                  <tr key={item.id} className="border-b">
                    {/* MODIFICATION: Calculate correct row number */}
                    <td className="p-4">{indexOfFirstItem + index + 1}</td>
                    <td
                      onClick={() => handeNavigateToDatabaseViewScreen(item)}
                      className="p-4 underline underline-offset-4 text-blue-600 cursor-pointer">
                      {item.connectionName}
                    </td>
                    <td className="p-4">{item.Alias}</td>
                    <td className="p-4">{item.description}</td>
                    <td className="p-4">{item.owner}</td>
                    <td
                      onClick={() => handleNavigateToSchemas(item)}
                      className="p-4 underline underline-offset-4 text-blue-600 cursor-pointer">
                      {item.Schema}
                    </td>
                    <td
                      onClick={() => handleNavigateToTables(item)}
                      className="p-4 underline underline-offset-4 text-blue-600 cursor-pointer">
                      {item.Tables}
                    </td>
                    <td
                      onClick={() => handleNavigateToColumns(item)}
                      className="p-4 underline underline-offset-4 text-blue-600 cursor-pointer">
                      {item.Column}
                    </td>
                    <td className="p-4">{item.CreatedDate}</td>
                    <td className="p-4">{item.updatedDate}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" className="p-4 text-center text-gray-500">No data available for the current selection.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* NEW: Pagination Controls */}
          {totalItems > 0 && (
            <div className="flex justify-between items-center mt-4 text-sm text-gray-700">
              <span>
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} Entries
              </span>
              <div className="flex items-center gap-1">
                <button
                  title="Back"
                  className="px-2 py-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="px-3 py-1 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  title="Next"
                  className="px-2 py-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Database;