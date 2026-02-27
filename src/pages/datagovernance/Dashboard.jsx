import { Icon } from "@iconify-icon/react";
import { useState, useEffect } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
  const [apiCounts, setApiCounts] = useState(null);
  const [technicalCounts, setTechnicalCounts] = useState(null);
  const [connectionTypes, setConnectionTypes] = useState({});
  const [connectorAssets, setConnectorAssets] = useState([]);
  const [repositoryData, setRepositoryData] = useState([]);
  const [maturityModelData, setMaturityModelData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [technicalLoading, setTechnicalLoading] = useState(true);
  const [connectorLoading, setConnectorLoading] = useState(true);
  const [repositoryLoading, setRepositoryLoading] = useState(true);
  const [maturityLoading, setMaturityLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, decodedToken } = useAuth();

  const fetchConnectionTypes = async (connectionNames) => {
    try {
      const response = await fetch(
        `${window._env_?.VITE_FAST_API}/connection_type_by_name`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            connection: connectionNames
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch connection types');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching connection types:', err);
      return {};
    }
  };

  const fetchRepositoryData = async (policyIds) => {
    try {
      const response = await fetch(
        `${window._env_?.VITE_FAST_API}/governance/dashboard/repository`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            policy_id: policyIds
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch repository data');
      }

      const data = await response.json();
      
      const transformedData = Object.keys(data).map(dbName => {
        const dbData = data[dbName];
        const total = dbData.sensitive + dbData.non_sensitive + dbData.personal + dbData.others;
        
        return {
          name: dbName.charAt(0).toUpperCase() + dbName.slice(1),
          sensitive: dbData.sensitive,
          nonSensitive: dbData.non_sensitive,
          personal: dbData.personal,
          others: dbData.others,
          total: total,
          sensitivePercent: total > 0 ? (dbData.sensitive / total) * 100 : 0,
          nonSensitivePercent: total > 0 ? (dbData.non_sensitive / total) * 100 : 0,
          personalPercent: total > 0 ? (dbData.personal / total) * 100 : 0,
          othersPercent: total > 0 ? (dbData.others / total) * 100 : 0
        };
      });

      return transformedData;
    } catch (err) {
      console.error('Error fetching repository data:', err);
      return [];
    }
  };

  const fetchMaturityModel = async (policyIds) => {
    try {
      const response = await fetch(
        `${window._env_?.VITE_FAST_API}/governance/dashboard/maturity_model`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            owner: decodedToken.preferred_username,
            policy_id: policyIds
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch maturity model data');
      }

      const data = await response.json();
      
      const transformedData = [
        { 
          subject: 'Data Quality', 
          value: Math.min(data['Data Quality']?.dmm_data_quality_score || 0, 5),
          fullScore: data['Data Quality']?.quality_score || 0,
          details: data['Data Quality']
        },
        { 
          subject: 'Catalog', 
          value: Math.min(data['Catalog']?.dmm_catalog_score || 0, 5),
          details: data['Catalog']
        },
        { 
          subject: 'Business Definition', 
          value: Math.min(data['Business Definition']?.dmm_business_definition_score || 0, 5),
          details: data['Business Definition']
        },
        { 
          subject: 'Security', 
          value: Math.min(data['Security']?.dmm_security_score || 0, 5),
          details: data['Security']
        },
        { 
          subject: 'Validation', 
          value: Math.min(data['Validation']?.dmm_validation_score || 0, 5),
          details: data['Validation']
        },
        { 
          subject: 'Stewardship', 
          value: Math.min(data['Stewardship']?.dmm_stewardship_score || 0, 5),
          details: data['Stewardship']
        }
      ];

      return transformedData;
    } catch (err) {
      console.error('Error fetching maturity model:', err);
      return [];
    }
  };

  const calculateConnectorAssets = (connectionDetails, connectionTypesData) => {
    const connectorMap = {};
    
    connectionDetails.forEach(item => {
      const connectorType = Object.keys(connectionTypesData).find(type => 
        connectionTypesData[type].includes(item.connection_name)
      );
      
      if (connectorType) {
        if (!connectorMap[connectorType]) {
          connectorMap[connectorType] = {
            connections: new Set(),
            schemas: new Set(),
            tables: new Set(),
            columns: 0
          };
        }
        
        connectorMap[connectorType].connections.add(item.connection_name);
        connectorMap[connectorType].schemas.add(`${item.connection_name}_${item.table_schema}`);
        connectorMap[connectorType].tables.add(`${item.connection_name}_${item.table_schema}_${item.table_name}`);
        connectorMap[connectorType].columns++;
      }
    });
    
    return Object.keys(connectorMap).map(type => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      count: connectorMap[type].connections.size,
      connectionCount: connectorMap[type].connections.size,
      schemaCount: connectorMap[type].schemas.size,
      tableCount: connectorMap[type].tables.size,
      columnCount: connectorMap[type].columns
    }));
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const countsResponse = await fetch(
          `${window._env_?.VITE_FAST_API}/governance/dashboard/count`,
          {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              owner: decodedToken.preferred_username
            })
          }
        );

        if (!countsResponse.ok) {
          throw new Error('Failed to fetch dashboard counts');
        }

        const countsData = await countsResponse.json();
        setApiCounts(countsData);

        try {
          const secureQueryResponse = await fetch(
            `${window._env_?.VITE_FAST_API}/secure-query`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ user_query: "" }),
            }
          );

          if (!secureQueryResponse.ok) {
            setTechnicalCounts({
              connectors: 0,
              schemas: 0,
              tables: 0,
              columns: 0
            });
            setMaturityModelData([]);
          } else {
            const secureQueryData = await secureQueryResponse.json();
            const policyIds = secureQueryData.matched_policy_ids || [];

            if (policyIds.length > 0) {
              const connectionDetailsResponse = await fetch(
                `${window._env_?.VITE_FAST_API}/policy-connection-details`,
                {
                  method: 'POST',
                  headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    policy_id: policyIds
                  })
                }
              );

              if (!connectionDetailsResponse.ok) {
                setTechnicalCounts({
                  connectors: 0,
                  schemas: 0,
                  tables: 0,
                  columns: 0
                });
              } else {
                const connectionDetailsData = await connectionDetailsResponse.json();

                const uniqueConnectors = new Set();
                const uniqueSchemas = new Set();
                const uniqueTables = new Set();
                let totalColumns = 0;

                connectionDetailsData.forEach(item => {
                  uniqueConnectors.add(item.connection_name);
                  uniqueSchemas.add(`${item.connection_name}_${item.table_schema}`);
                  uniqueTables.add(`${item.connection_name}_${item.table_schema}_${item.table_name}`);
                  totalColumns++;
                });

                setTechnicalCounts({
                  connectors: uniqueConnectors.size,
                  schemas: uniqueSchemas.size,
                  tables: uniqueTables.size,
                  columns: totalColumns
                });

                if (uniqueConnectors.size > 0) {
                  setConnectorLoading(true);
                  const connectionNames = Array.from(uniqueConnectors);
                  const typesData = await fetchConnectionTypes(connectionNames);
                  setConnectionTypes(typesData);
                  
                  const assetsData = calculateConnectorAssets(connectionDetailsData, typesData);
                  setConnectorAssets(assetsData);

                  const repoData = await fetchRepositoryData(policyIds);
                  setRepositoryData(repoData);

                  const maturityData = await fetchMaturityModel(policyIds);
                  setMaturityModelData(maturityData);
                } else {
                  setConnectorAssets([]);
                  setRepositoryData([]);
                  setMaturityModelData([]);
                }
              }
            } else {
              setTechnicalCounts({
                connectors: 0,
                schemas: 0,
                tables: 0,
                columns: 0
              });
              setConnectorAssets([]);
              setRepositoryData([]);
              setMaturityModelData([]);
            }
          }
        } catch (technicalErr) {
          setTechnicalCounts({
            connectors: 0,
            schemas: 0,
            tables: 0,
            columns: 0
          });
          setConnectorAssets([]);
          setRepositoryData([]);
          setMaturityModelData([]);
        } finally {
          setTechnicalLoading(false);
          setConnectorLoading(false);
          setRepositoryLoading(false);
          setMaturityLoading(false);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        setTechnicalLoading(false);
        setConnectorLoading(false);
        setRepositoryLoading(false);
        setMaturityLoading(false);
        if (!technicalCounts) {
          setTechnicalCounts({
            connectors: 0,
            schemas: 0,
            tables: 0,
            columns: 0
          });
        }
        setConnectorAssets([]);
        setRepositoryData([]);
        setMaturityModelData([]);
      }
    };

    if (token && decodedToken?.preferred_username) {
      fetchAllData();
    }
  }, [token, decodedToken]);

  const CardsLoadingSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
      {[1, 2, 3].map((item) => (
        <div key={item} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border-b-4 border-gray-200">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full animate-pulse mr-3"></div>
            <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {[1, 2, 3, 4].map((stat) => (
              <div key={stat} className={`flex flex-col items-center text-center ${stat !== 4 ? 'border-r border-gray-200' : ''}`}>
                <div className="h-6 bg-gray-200 rounded w-8 animate-pulse mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const ConnectorBarChartSkeleton = () => (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
      <div className="flex items-center mb-4 sm:mb-6">
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
      </div>
      <div className="h-6 sm:h-8 bg-gray-200 rounded-md animate-pulse"></div>
      <div className="flex mt-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="mr-4">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse mb-1"></div>
          </div>
        ))}
      </div>
    </div>
  );

  const MaturityModelLoadingSkeleton = () => (
    <div className="flex justify-center">
      <div className="w-full max-w-xs sm:max-w-sm lg:max-w-md">
        <div className="w-[300px] h-[250px] bg-gray-200 rounded-lg animate-pulse mx-auto"></div>
      </div>
    </div>
  );

  const cards = [
    {
      icon: "material-symbols:build-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-20",
      iconcolor: "text-[#16ABC2]",
      bordercolor: "border-[#16ABC2]",
      title: "Technical",
      stats: [
        { label: "Connectors", value: technicalLoading ? "..." : technicalCounts?.connectors?.toString().padStart(2, '0') || "00" },
        { label: "Schema", value: technicalLoading ? "..." : technicalCounts?.schemas?.toString().padStart(2, '0') || "00" },
        { label: "Tables", value: technicalLoading ? "..." : technicalCounts?.tables?.toString().padStart(2, '0') || "00" },
        { label: "Columns", value: technicalLoading ? "..." : technicalCounts?.columns?.toString().padStart(2, '0') || "00" }
      ]
    },
    {
      icon: "material-symbols:business-center-outline",
      bgcolor: "bg-[#FFC93F] bg-opacity-20",
      iconcolor: "text-[#FFC93F]",
      bordercolor: "border-[#FFC93F]",
      title: "Business",
      stats: [
        { label: "Domain", value: loading ? "..." : apiCounts?.domain_count?.toString().padStart(2, '0') || "00" },
        { label: "Terms", value: loading ? "..." : apiCounts?.term_count?.toString().padStart(2, '0') || "00" },
        { label: "Category", value: loading ? "..." : apiCounts?.category_count?.toString().padStart(2, '0') || "00" },
        { label: "SubCategory", value: loading ? "..." : apiCounts?.subcategory_count?.toString().padStart(2, '0') || "00" }
      ]
    },
    {
      icon: "material-symbols:hub-outline",
      bgcolor: "bg-[#AF52DE] bg-opacity-20",
      iconcolor: "text-[#AF52DE]",
      bordercolor: "border-[#AF52DE]",
      title: "Operational",
      stats: [
        { label: "Policies", value: loading ? "..." : apiCounts?.policy_count?.toString().padStart(2, '0') || "00" },
        { label: "Tags", value: loading ? "..." : apiCounts?.tag_count?.toString().padStart(2, '0') || "00" },
        { label: "Rules", value: loading ? "..." : apiCounts?.rules_count?.toString().padStart(2, '0') || "00" },
        { label: "Persona", value: loading ? "..." : apiCounts?.persona_count?.toString().padStart(2, '0') || "00" }
      ]
    }
  ];

  const activities = [
    { title: "Favourites", content: "Your favorites list is empty." },
    { title: "Updates", content: "Your update list is empty." },
    { title: "History", content: "Your history list is empty." }
  ];

  const RepositoryBar = ({ data, loading }) => {
    if (loading) {
      return (
        <div className="flex flex-col space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="w-full">
              <div className="flex justify-between mb-1">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
              <div className="h-4 sm:h-6 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
          ))}
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-gray-50 rounded-full p-4 mb-4">
            <Icon icon="material-symbols:database-outline" className="text-gray-400" width="48" height="48" />
          </div>
          <p className="text-gray-500 font-medium mb-1">No data repository found</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col space-y-4">
        {data.map((item) => (
          <div key={item.name} className="w-full group/database relative">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600 font-medium">{item.name}</span>
              <span className="text-xs text-gray-500">Total: {item.total}</span>
            </div>
            
            <div className="absolute z-20 invisible group-hover/database:visible bg-gray-800 text-white text-xs rounded-lg p-3 shadow-lg -top-2 left-0 transform -translate-y-full w-56">
              <div className="font-semibold mb-2 pb-2 border-b border-gray-600">{item.name} Database</div>
              <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-sm mr-2"></div>
                  <span className="text-gray-300">Sensitive:</span>
                </div>
                <div className="text-right font-medium">{item.sensitive}</div>
                
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-300 rounded-sm mr-2"></div>
                  <span className="text-gray-300">Non-Sensitive:</span>
                </div>
                <div className="text-right font-medium">{item.nonSensitive}</div>
                
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm mr-2"></div>
                  <span className="text-gray-300">Personal:</span>
                </div>
                <div className="text-right font-medium">{item.personal}</div>
                
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-300 rounded-sm mr-2"></div>
                  <span className="text-gray-300">Others:</span>
                </div>
                <div className="text-right font-medium">{item.others}</div>
                
              </div>
              <div className="absolute left-4 bottom-0 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
            </div>
            
            <div className="flex h-4 sm:h-6 rounded-md overflow-hidden relative cursor-pointer">
              {item.sensitivePercent > 0 && (
                <div
                  style={{ width: `${item.sensitivePercent}%` }}
                  className="bg-orange-500 relative group/segment"
                >
                  <div className="absolute z-10 invisible group-hover/segment:visible bg-gray-800 text-white text-xs rounded p-2 w-32 left-0 -top-12 whitespace-nowrap">
                    Sensitive: {item.sensitive}
                  </div>
                </div>
              )}
              {item.nonSensitivePercent > 0 && (
                <div
                  style={{ width: `${item.nonSensitivePercent}%` }}
                  className="bg-yellow-300 relative group/segment"
                >
                  <div className="absolute z-10 invisible group-hover/segment:visible bg-gray-800 text-white text-xs rounded p-2 w-32 left-0 -top-12 whitespace-nowrap">
                    Non-Sensitive: {item.nonSensitive}
                  </div>
                </div>
              )}
              {item.personalPercent > 0 && (
                <div
                  style={{ width: `${item.personalPercent}%` }}
                  className="bg-blue-500 relative group/segment"
                >
                  <div className="absolute z-10 invisible group-hover/segment:visible bg-gray-800 text-white text-xs rounded p-2 w-32 left-0 -top-12 whitespace-nowrap">
                    Personal: {item.personal}
                  </div>
                </div>
              )}
              {item.othersPercent > 0 && (
                <div
                  style={{ width: `${item.othersPercent}%` }}
                  className="bg-gray-300 relative group/segment"
                >
                  <div className="absolute z-10 invisible group-hover/segment:visible bg-gray-800 text-white text-xs rounded p-2 w-32 left-0 -top-12 whitespace-nowrap">
                    Others: {item.others}
                  </div>
                </div>
              )}
              {item.total === 0 && (
                <div className="w-full bg-gray-100 flex items-center justify-center">
                  <span className="text-xs text-gray-400">No data</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const ConnectorBarChart = () => {
    const total = connectorAssets.reduce((sum, item) => sum + item.count, 0);

    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
        <div className="flex items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold">Assets count by connector</h2>
        </div>

        {connectorLoading ? (
          <div className="h-8 bg-gray-200 rounded-md animate-pulse"></div>
        ) : connectorAssets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No connector found
          </div>
        ) : (
          <>
            <div className="block sm:hidden space-y-3">
              {connectorAssets.map((item, index) => (
                <div key={item.name} className="relative group">
                  <div className="flex items-center">
                    <span className="text-xs text-gray-600 w-20 mr-2">{item.name}</span>
                    <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${(item.count / total) * 100}%` }}
                        className="h-full bg-orange-500"
                      />
                    </div>
                    <span className="text-xs ml-2 text-gray-600">{item.count}</span>
                  </div>
                  <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-xs rounded p-2 w-48 -left-4 top-6">
                    <div className="grid grid-cols-2 gap-1">
                      <div className="font-medium">Connections:</div>
                      <div>{item.connectionCount}</div>
                      <div className="font-medium">Schemas:</div>
                      <div>{item.schemaCount}</div>
                      <div className="font-medium">Tables:</div>
                      <div>{item.tableCount}</div>
                      <div className="font-medium">Columns:</div>
                      <div>{item.columnCount}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden sm:block">
              <div className="flex mb-2">
                {connectorAssets.map((item, index) => (
                  <div
                    key={item.name}
                    style={{ width: `${(item.count / total) * 100}%` }}
                    className="relative group"
                  >
                    <span className="text-sm text-gray-600 block truncate px-1">{item.name}</span>
                    <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-xs rounded p-2 w-48 -left-4 top-6">
                      <div className="grid grid-cols-2 gap-1">
                        <div className="font-medium">Connections:</div>
                        <div>{item.connectionCount}</div>
                        <div className="font-medium">Schemas:</div>
                        <div>{item.schemaCount}</div>
                        <div className="font-medium">Tables:</div>
                        <div>{item.tableCount}</div>
                        <div className="font-medium">Columns:</div>
                        <div>{item.columnCount}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-6 sm:h-8 flex rounded-md overflow-hidden">
                {connectorAssets.map((item, index) => (
                  <div
                    key={item.name}
                    style={{
                      width: `${(item.count / total) * 100}%`,
                      backgroundColor: `rgba(255, 87, 34, ${1 - (index * 0.15)})`
                    }}
                    className="h-full relative group"
                  >
                    <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-xs rounded p-2 w-48 -left-4 top-8">
                      <div className="grid grid-cols-2 gap-1">
                        <div className="font-medium">Connections:</div>
                        <div>{item.connectionCount}</div>
                        <div className="font-medium">Schemas:</div>
                        <div>{item.schemaCount}</div>
                        <div className="font-medium">Tables:</div>
                        <div>{item.tableCount}</div>
                        <div className="font-medium">Columns:</div>
                        <div>{item.columnCount}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const MaturityModelChart = () => {
    if (maturityLoading) {
      return <MaturityModelLoadingSkeleton />;
    }

    if (!maturityModelData || maturityModelData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-gray-50 rounded-full p-4 mb-4">
            <Icon icon="material-symbols:pie-chart-outline" className="text-gray-400" width="48" height="48" />
          </div>
          <p className="text-gray-500 font-medium mb-1">No policy data available</p>
          <p className="text-gray-400 text-sm">Maturity model requires active policies to display data</p>
        </div>
      );
    }

    const CustomTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
            <p className="font-semibold text-gray-800 mb-1 text-sm">{data.subject}</p>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-xs">Score:</span>
              <span className="font-bold text-[#AF52DE] text-sm">{data.value.toFixed(2)} / 5</span>
            </div>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="flex justify-center">
        <div className="w-full max-w-xs sm:max-w-sm lg:max-w-md">
          <RadarChart 
            width={300} 
            height={250} 
            data={maturityModelData}
            className="mx-auto"
          >
            <PolarGrid />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fontSize: 10 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 5]}
              tickCount={6}
              tick={false}
            />
            <Radar
              name="Maturity"
              dataKey="value"
              stroke="#AF52DE"
              fill="#AF52DE"
              fillOpacity={0.2}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-full">
      {error && (
        <div className="mb-4 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm sm:text-base">
          Error loading dashboard data: {error}
        </div>
      )}
      
      {loading ? (
        <CardsLoadingSkeleton />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {cards.map((card, index) => (
            <div
              key={card.title}
              className={`bg-white p-4 sm:p-6 rounded-lg shadow-sm border-b-4 sm:border-b-8 ${card.bordercolor}`}
            >
              <div className="flex items-center mb-4 sm:mb-6">
                <div
                  className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 ${card.bgcolor} rounded-full ${card.iconcolor} mr-3`}
                >
                  <Icon icon={card.icon} width="20" height="20" className="sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold">{card.title}</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {card.stats.map((stat, statIndex) => (
                  <div
                    key={stat.label}
                    className={`flex flex-col items-center text-center ${
                      statIndex !== 3 ? 'border-r border-gray-200' : ''
                    }`}
                  >
                    <span className="text-sm sm:text-md font-bold mb-1">{stat.value}</span>
                    <span className="text-gray-600 text-xs sm:text-sm leading-tight break-words px-1">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Data repository by sensitivity</h2>
          <RepositoryBar data={repositoryData} loading={repositoryLoading} />
          {repositoryData && repositoryData.length > 0 && (
            <div className="flex flex-wrap justify-start gap-3 sm:gap-6 mt-4">
              <div className="flex items-center">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#ff9500] rounded-sm mr-2" />
                <span className="text-xs sm:text-sm text-gray-600">Sensitive</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#ffcf57] rounded-sm mr-2" />
                <span className="text-xs sm:text-sm text-gray-600">Non-Sensitive</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#268ede] rounded-sm mr-2" />
                <span className="text-xs sm:text-sm text-gray-600">Personal</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-300 rounded-sm mr-2" />
                <span className="text-xs sm:text-sm text-gray-600">Others</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Data governance maturity model</h2>
          <MaturityModelChart />
        </div>
      </div>

      <div className="mt-6 sm:mt-10">
        {connectorLoading ? <ConnectorBarChartSkeleton /> : <ConnectorBarChart />}
      </div>

      {/* <div className="mt-6 sm:mt-10">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
          Your activities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {activities.map((activity) => (
            <div key={activity.title} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{activity.title}</h3>
              <p className="text-gray-500 text-center py-4 sm:py-8 text-sm sm:text-base">{activity.content}</p>
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
};

export default Dashboard;