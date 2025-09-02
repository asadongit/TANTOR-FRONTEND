import React, { useState, useEffect, useRef } from "react";
import { MoreVertical, Info, ChevronLeft, ChevronRight } from "lucide-react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";
import { useNavigate } from "react-router-dom";
import CatalogueChart from "./Components/CatalogueTrend";
import { secureQuery } from "./Components/function";
import { useAuth } from "../../../context/AuthContext";

const DataCatalogue = () => {
  const [cards, setCards] = useState([
    {
      title: "Database",
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      count: 0,
      seeDetailsLink: "/datagovernance/data-catalogue/database",
    },
    {
      title: "Schema",
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      count: 0,
      seeDetailsLink: "/datagovernance/data-catalogue/schema",
    },
    {
      title: "Tables",
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      count: 0,
      seeDetailsLink: "/datagovernance/data-catalogue/table",
    },
    {
      title: "Columns",
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      count: 0,
      seeDetailsLink: "/datagovernance/data-catalogue/column",
    },
  ]);

  const navigate = useNavigate();

  const [trendData, setTrendData] = useState([]);
  const [trendDataKeys, setTrendDataKeys] = useState(['Database', 'Schema', 'Tables', 'Columns']);

  const { token } = useAuth();
  const [userPolicies, setUserPolicies] = useState([]);
  const [catalogData, setCatalogData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentAccess, setRecentAccess] = useState([]);
  const fetchedPoliciesRef = useRef(new Set());
  const [showTooltip, setShowTooltip] = useState(false);
  const [showChartTooltip, setShowChartTooltip] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchConnectionDetails = async (policyIds) => {
    if (policyIds.length === 0) {
      return null;
    }
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/connection_details`, {
        method: "POST",
        headers: {
          "accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ policy_id: policyIds }),
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch connection details: ${response.status}`);
      }
      const data = await response.json();
      policyIds.forEach((id) => fetchedPoliciesRef.current.add(id));
      return data;
    } catch (error) {
      console.error("Error fetching connection details:", error);
      return null;
    }
  };

  const fetchRecentAccess = async (policyIds) => {
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/recentaccess`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ id: policyIds }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setRecentAccess(data.connections || []);
      return data;
    } catch (error) {
      console.error("Error fetching recent access:", error);
      setRecentAccess([]);
      return [];
    }
  };

  const fetchTrendData = async (policyIds) => {
    if (!policyIds || policyIds.length === 0) {
      setTrendData([]);
      return;
    }
    try {
      const apiUrl = `${window._env_?.VITE_FAST_API}/data_catalogue/catalogue_trend`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ policy_id: policyIds })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const rawData = await response.json();
      const formattedData = rawData.map(item => ({
        day: item.date,
        Database: parseInt(item.connection_count, 10) || 0,
        Schema: parseInt(item.schema_count, 10) || 0,
        Tables: parseInt(item.table_count, 10) || 0,
        Columns: parseInt(item.column_count, 10) || 0,
      }));
      setTrendData(formattedData.reverse());
    } catch (error) {
      console.error('Error fetching catalogue trend data:', error);
      setTrendData([]);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      try {
        const result = await secureQuery({ user_query: "" }, token);
        if (!isMounted) return;
        const policyIds = result.matched_policy_ids || [];
        setUserPolicies(policyIds);
        await Promise.all([
          fetchRecentAccess(policyIds),
          fetchTrendData(policyIds)
        ]);
        const unfetchedPolicyIds = policyIds.filter(id => !fetchedPoliciesRef.current.has(id));
        if (unfetchedPolicyIds.length > 0) {
          const connectionDetails = await fetchConnectionDetails(unfetchedPolicyIds);
          if (isMounted && connectionDetails) {
            setCatalogData((prevCatalogs) => {
              const newCatalogs = [...prevCatalogs, ...connectionDetails];
              updateCatalogCounts(newCatalogs);
              updateTableData(newCatalogs);
              return newCatalogs;
            });
          }
        } else {
          updateCatalogCounts(catalogData);
          updateTableData(catalogData);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const updateCatalogCounts = (catalogs) => {
      const uniqueConnections = new Set();
      const uniqueSchemas = new Set();
      const uniqueTables = new Set();
      let totalColumns = 0;
      catalogs.forEach((item) => {
        if (item.connection_name) uniqueConnections.add(item.connection_name);
        if (item.table_schema) uniqueSchemas.add(`${item.connection_name}.${item.table_schema}`);
        if (item.table_name) uniqueTables.add(`${item.connection_name}.${item.table_schema}.${item.table_name}`);
        if (item.column_name) totalColumns += 1;
      });
      setCards((prevCards) => {
        const updatedCards = [...prevCards];
        updatedCards[0].count = uniqueConnections.size;
        updatedCards[1].count = uniqueSchemas.size;
        updatedCards[2].count = uniqueTables.size;
        updatedCards[3].count = totalColumns;
        return updatedCards;
      });
    };

    const updateTableData = (catalogs) => {
      const connectionSchemaMap = new Map();
      catalogs.forEach((item) => {
        const key = `${item.connection_name}.${item.table_schema}`;
        if (!connectionSchemaMap.has(key)) {
          connectionSchemaMap.set(key, {
            connectionName: item.connection_name,
            Database: item.connection_type,
            Schema: item.table_schema,
            Tables: new Set(),
            Columns: 0,
            CreatedDate: item.created_at,
            updatedDate: item.updated_at,
          });
        }
        const conn = connectionSchemaMap.get(key);
        if (item.table_name) conn.Tables.add(item.table_name);
        if (item.column_name) conn.Columns += 1;
      });
      const newTableData = Array.from(connectionSchemaMap.values()).map((data) => ({
        connectionName: data.connectionName,
        Database: data.Database,
        Schema: data.Schema,
        Tables: data.Tables.size.toString(),
        Columns: data.Columns.toString(),
        CreatedDate: new Date(data.CreatedDate).toLocaleDateString(),
        updatedDate: new Date(data.updatedDate).toLocaleDateString(),
      }));
      setTableData(newTableData);
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const totalItems = tableData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTableData = tableData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">Loading ...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Breadcrumb />
      <h1 className="text-2xl font-semibold">Data Catalogue</h1>
      <div className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 ${card.bgcolor} rounded-full ${card.iconcolor} mr-2`}>
                      <Icon icon={card.icon} />
                    </div>
                    <h3 className="text-lg font-semibold">{card.title}</h3>
                  </div>
                </div>
                <div className="text-6xl font-semibold text-gray-800 mt-6">
                  {card.count.toString().padStart(2, "0")}
                </div>
                <div className="flex items-center justify-between mt-6">
                  <a className="text-sm text-[#8d77ba] font-medium underline cursor-pointer opacity-90" onClick={() => navigate(`${card.seeDetailsLink}`)}>
                    See details
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-10">
        <div className="lg:col-span-2 relative">
          <div className="absolute top-0 right-0 z-10 p-2">
            <div
              className="relative cursor-help"
              onMouseEnter={() => setShowChartTooltip(true)}
              onMouseLeave={() => setShowChartTooltip(false)}
            >
              <Info className="h-5 w-5 mt-2 mr-2 text-gray-500" />
              {showChartTooltip && (
                <div className="absolute bottom-full right-0 mb-2 w-72 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg">
                  This graph shows the trend of total assets you have access to over the last seven days.
                  <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
                </div>
              )}
            </div>
          </div>
          <CatalogueChart data={trendData} dataKeys={trendDataKeys} isDatabase={false} />
        </div>

        <div className="bg-white p-6 rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium">Recent access</h3>
            <div className="relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
              <Info className="h-5 w-5 text-gray-500" />
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

      <div className="bg-white rounded-lg shadow overflow-x-auto mt-5">
        <table className="w-full">
          <thead>
            <tr className="bg-[#29304a] text-white">
              <th className="text-left p-4">Id</th>
              <th className="text-left p-4">Connection Name</th>
              <th className="text-left p-4">Database</th>
              <th className="text-left p-4">Schema</th>
              <th className="text-left p-4">Tables</th>
              <th className="text-left p-4">Columns</th>
              <th className="text-left p-4">Created Date</th>
              <th className="text-left p-4">Updated Date</th>
            </tr>
          </thead>
          <tbody>
            {currentTableData.length > 0 ? (
              currentTableData.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="p-4">{indexOfFirstItem + index + 1}</td>
                  <td className="p-4">{item.connectionName}</td>
                  <td className="p-4">{item.Database}</td>
                  <td className="p-4 text-gray-500">{item.Schema}</td>
                  <td className="p-4 text-gray-500">{item.Tables}</td>
                  <td className="p-4 text-gray-500">{item.Columns}</td>
                  <td className="p-4">{item.CreatedDate}</td>
                  <td className="p-4">{item.updatedDate}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-4 text-center">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
    </div>
  );
};

export default DataCatalogue;