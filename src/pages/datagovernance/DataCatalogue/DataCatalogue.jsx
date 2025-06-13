import React, { useState, useEffect, useRef, useCallback } from "react";
import { MoreVertical } from "lucide-react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";
import { useNavigate } from "react-router-dom";
import CatalogueChart from "./Components/CatalogueTrend";
import { secureQuery } from "./Components/function";
import { useAuth } from "../../../context/AuthContext";

const Toggle = ({ enabled, onToggle }) => {
  return (
    <div
      onClick={onToggle}
      className={`relative inline-flex h-5 w-10 cursor-pointer rounded-full transition-colors ease-in-out duration-200 ${
        enabled ? "bg-[#1a9962]" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ease-in-out duration-200 m-0.5 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </div>
  );
};

const DataCatalogue = () => {
  const [cards, setCards] = useState([
    {
      title: "Database",
      enabled: true,
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      count: 0,
      seeDetailsLink: "/datagovernance/data-catalogue/database",
    },
    {
      title: "Schema",
      enabled: true,
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      count: 0,
      seeDetailsLink: "/datagovernance/data-catalogue/schema",
    },
    {
      title: "Tables",
      enabled: true,
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      count: 0,
      seeDetailsLink: "/datagovernance/data-catalogue/table",
    },
    {
      title: "Columns",
      enabled: true,
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
      count: 0,
      seeDetailsLink: "/datagovernance/data-catalogue/column",
    },
  ]);

  const navigate = useNavigate();

  const trendData = [
    { day: "1 day", Database: 20, Schema: 9, Tables: 13, Columns: 11 },
    { day: "2 day", Database: 25, Schema: 9, Tables: 17, Columns: 11 },
    { day: "3 day", Database: 26, Schema: 17, Tables: 9, Columns: 8 },
    { day: "4 day", Database: 27, Schema: 17, Tables: 15, Columns: 18 },
    { day: "5 day", Database: 25, Schema: 14, Tables: 13, Columns: 23 },
    { day: "6 day", Database: 23, Schema: 20, Tables: 15, Columns: 16 },
    { day: "7 day", Database: 21, Schema: 27, Tables: 16, Columns: 15 },
  ];

  const { token } = useAuth();
  const [userPolicies, setUserPolicies] = useState([]);
  const [catalogData, setCatalogData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentAccess, setRecentAccess] = useState([]);
  const fetchedPoliciesRef = useRef(new Set());

  const toggleRole = (index) => {
    const newCards = [...cards];
    newCards[index].enabled = !newCards[index].enabled;
    setCards(newCards);
  };

  const fetchPolicyCatalogs = useCallback(
    async (policyId) => {
      if (fetchedPoliciesRef.current.has(policyId)) {
        console.log(`Skipping duplicate fetch for policy ${policyId}`);
        return null;
      }

      try {
        console.log(`Fetching catalog for policy ${policyId}`);
        const response = await fetch(
          `${import.meta.env.VITE_FAST_API}/catalog/${policyId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        fetchedPoliciesRef.current.add(policyId);

        if (!response.ok) {
          throw new Error(`Failed to fetch catalog for policy ${policyId}`);
        }
        return await response.json();
      } catch (error) {
        console.error(`Error fetching catalog for policy ${policyId}:`, error);
        return null;
      }
    },
    [token]
  );

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

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted) return;
      setIsLoading(true);

      try {
        const result = await secureQuery(
          {
            user_query: "",
          },
          token
        );
        console.log("Query result:", result);

        if (!isMounted) return;

        const policyIds = result.matched_policy_ids || [];
        setUserPolicies(policyIds);

        const unfetchedPolicyIds = policyIds.filter(
          (id) => !fetchedPoliciesRef.current.has(id)
        );

        if (unfetchedPolicyIds.length === 0) {
          console.log("All policies already fetched, skipping catalog calls");
          setIsLoading(false);
          return;
        }

        console.log(`Fetching catalogs for ${unfetchedPolicyIds.length} policies`);
        const catalogPromises = unfetchedPolicyIds.map(fetchPolicyCatalogs);
        const catalogResults = await Promise.all(catalogPromises);

        if (!isMounted) return;

        const validCatalogs = catalogResults.filter(
          (catalog) => catalog !== null
        );

        setCatalogData((prevCatalogs) => {
          const newCatalogs = [...prevCatalogs, ...validCatalogs];
          updateCatalogCounts(newCatalogs);
          updateTableData(newCatalogs);
          return newCatalogs;
        });

        // Fetch recent access data
        await fetchRecentAccess(policyIds);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const updateCatalogCounts = (catalogs) => {
      let totalDatabases = 0;
      let totalSchemas = 0;
      let totalTables = 0;
      let totalColumns = 0;

      catalogs.forEach((catalog) => {
        if (catalog && catalog.counts) {
          totalDatabases += catalog.counts.databases || 0;
          totalSchemas += catalog.counts.schemas || 0;
          totalTables += catalog.counts.tables || 0;
          totalColumns += catalog.counts.columns || 0;
        }
      });

      setCards((prevCards) => {
        const updatedCards = [...prevCards];
        updatedCards[0].count = totalDatabases;
        updatedCards[1].count = totalSchemas;
        updatedCards[2].count = totalTables;
        updatedCards[3].count = totalColumns;
        return updatedCards;
      });
    };

    const updateTableData = (catalogs) => {
      const newTableData = [];

      catalogs.forEach((catalog, catalogIndex) => {
        if (catalog && catalog.data_connection) {
          catalog.data_connection.forEach((conn, index) => {
            const connectionName = conn.connection;
            const schema = conn.schema.split('.')[1];
            const tableCount = conn.tables ? conn.tables.length : 0;
            const columnCount = conn.columns ? conn.columns.length : 0;

            newTableData.push({
              id: `${catalogIndex + 1}.${index + 1}`,
              connectionName: connectionName,
              Database: connectionName,
              Schema: schema,
              Tables: tableCount.toString(),
              Columns: columnCount.toString(),
              CreatedDate: new Date().toLocaleDateString(),
              updatedDate: new Date().toLocaleDateString(),
            });
          });
        }
      });

      setTableData(newTableData);
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [token, fetchPolicyCatalogs]);

  return (
    <div>
      <Breadcrumb/>
      <h1 className="text-2xl font-semibold">Data Catalogue</h1>
      <div className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-100"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 ${card.bgcolor} rounded-full ${card.iconcolor} mr-2`}
                    >
                      <Icon icon={card.icon} />
                    </div>
                    <h3 className="text-lg font-semibold">{card.title}</h3>
                  </div>
                  <button className="p-1 rounded-lg hover:bg-gray-100">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-6xl font-semibold text-gray-800 mt-6">
                  {card.count.toString().padStart(2, "0")}
                </div>
                <div className="flex items-center justify-between mt-6">
                  <a
                    className="text-sm text-[#8d77ba] font-medium underline cursor-pointer opacity-90"
                    onClick={() => navigate(`${card.seeDetailsLink}`)}
                  >
                    See details
                  </a>
                  <div className="flex items-center gap-2">
                    <Toggle
                      enabled={card.enabled}
                      onToggle={() => toggleRole(index)}
                    />
                    <span
                      className={`text-sm ${
                        card.enabled ? "text-[#1a9962]" : "text-gray-400"
                      }`}
                    >
                      {card.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
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
              <div
                key={index}
                className="pb-4 border-b border-gray-100 last:border-0"
              >
                <span className="text-gray-600">
                  {index + 1}. {item}
                </span>
              </div>
            )) : (
              <div className="pb-4 border-b border-gray-100">
                <span className="text-gray-500">No recent access data available</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mt-5">
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
            {isLoading ? (
              <tr>
                <td colSpan="8" className="p-4 text-center">Loading data...</td>
              </tr>
            ) : tableData.length > 0 ? (
              tableData.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="p-4">{item.id}</td>
                  <td className="p-4">{item.connectionName}</td>
                  <td className="p-4">{item.Database}</td>
                  <td className="p-4 text-gray-500 underline">{item.Schema}</td>
                  <td className="p-4 text-gray-500 underline">{item.Tables}</td>
                  <td className="p-4 text-gray-500 underline">{item.Columns}</td>
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
    </div>
  );
};

export default DataCatalogue;
