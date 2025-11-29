import { Icon } from "@iconify-icon/react";
import { useState, useEffect } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
  const [apiCounts, setApiCounts] = useState(null);
  const [technicalCounts, setTechnicalCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, decodedToken } = useAuth();

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
            console.warn('Secure query failed, setting technical counts to 0');
            setTechnicalCounts({
              connectors: 0,
              schemas: 0,
              tables: 0,
              columns: 0
            });
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
              }
            } else {
              setTechnicalCounts({
                connectors: 0,
                schemas: 0,
                tables: 0,
                columns: 0
              });
            }
          }
        } catch (technicalErr) {
          setTechnicalCounts({
            connectors: 0,
            schemas: 0,
            tables: 0,
            columns: 0
          });
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        if (!technicalCounts) {
          setTechnicalCounts({
            connectors: 0,
            schemas: 0,
            tables: 0,
            columns: 0
          });
        }
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

  const cards = [
    {
      icon: "material-symbols:build-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-20",
      iconcolor: "text-[#16ABC2]",
      bordercolor: "border-[#16ABC2]",
      title: "Technical",
      stats: [
        { label: "Connectors", value: technicalCounts?.connectors?.toString().padStart(2, '0') || "00" },
        { label: "Schema", value: technicalCounts?.schemas?.toString().padStart(2, '0') || "00" },
        { label: "Tables", value: technicalCounts?.tables?.toString().padStart(2, '0') || "00" },
        { label: "Columns", value: technicalCounts?.columns?.toString().padStart(2, '0') || "00" }
      ]
    },
    {
      icon: "material-symbols:business-center-outline",
      bgcolor: "bg-[#FFC93F] bg-opacity-20",
      iconcolor: "text-[#FFC93F]",
      bordercolor: "border-[#FFC93F]",
      title: "Business",
      stats: [
        { label: "Domain", value: apiCounts?.domain_count?.toString().padStart(2, '0') || "00" },
        { label: "Terms", value: apiCounts?.term_count?.toString().padStart(2, '0') || "00" },
        { label: "Category", value: apiCounts?.category_count?.toString().padStart(2, '0') || "00" },
        { label: "SubCategory", value: apiCounts?.subcategory_count?.toString().padStart(2, '0') || "00" }
      ]
    },
    {
      icon: "material-symbols:hub-outline",
      bgcolor: "bg-[#AF52DE] bg-opacity-20",
      iconcolor: "text-[#AF52DE]",
      bordercolor: "border-[#AF52DE]",
      title: "Operational",
      stats: [
        { label: "Policies", value: apiCounts?.policy_count?.toString().padStart(2, '0') || "00" },
        { label: "Tags", value: apiCounts?.tag_count?.toString().padStart(2, '0') || "00" },
        { label: "Rules", value: apiCounts?.rules_count?.toString().padStart(2, '0') || "00" },
        { label: "Persona", value: apiCounts?.persona_count?.toString().padStart(2, '0') || "00" }
      ]
    }
  ];

  const activities = [
    { title: "Favourites", content: "Your favorites list is empty." },
    { title: "Updates", content: "Your update list is empty." },
    { title: "History", content: "Your history list is empty." }
  ];

  const repositoryData = [
    {
      name: 'Hive',
      sensitive: 35,
      nonSensitive: 40,
      personal: 25
    },
    {
      name: 'Oracle',
      sensitive: 25,
      nonSensitive: 30,
      personal: 45
    },
    {
      name: 'Postgres',
      sensitive: 10,
      nonSensitive: 35,
      personal: 55
    }
  ];

  const governanceData = [
    { subject: 'Security', value: 78 },
    { subject: 'Quality', value: 85 },
    { subject: 'Business definition', value: 65 },
    { subject: 'Steward', value: 70 },
    { subject: 'Validation', value: 75 },
    { subject: 'Catalog', value: 80 }
  ];

  const RepositoryBar = ({ data }) => {
    return (
      <div className="flex flex-col space-y-4">
        {data.map((item) => (
          <div key={item.name} className="w-full">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">{item.name}</span>
            </div>
            <div className="flex h-4 sm:h-6 rounded-md overflow-hidden">
              <div
                style={{ width: `${item.sensitive}%` }}
                className="bg-orange-500"
              />
              <div
                style={{ width: `${item.nonSensitive}%` }}
                className="bg-yellow-300"
              />
              <div
                style={{ width: `${item.personal}%` }}
                className="bg-blue-500"
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const assetsCountData = [
    { name: 'Postgress', count: 100 },
    { name: 'Hive', count: 150 },
    { name: 'Oracle', count: 120 },
    { name: 'Snowflake', count: 90 },
    { name: 'MSQL', count: 80 },
    { name: 'DB2', count: 70 }
  ];

  const ConnectorBarChart = () => {
    const total = assetsCountData.reduce((sum, item) => sum + item.count, 0);

    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
        <div className="flex items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold">Assets count by connector</h2>
          <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div className="block sm:hidden space-y-3">
          {assetsCountData.map((item, index) => (
            <div key={item.name} className="flex items-center">
              <span className="text-xs text-gray-600 w-20 mr-2">{item.name}</span>
              <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  style={{ width: `${(item.count / total) * 100}%` }}
                  className="h-full bg-orange-500"
                />
              </div>
              <span className="text-xs ml-2 text-gray-600">{item.count}</span>
            </div>
          ))}
        </div>

        <div className="hidden sm:block">
          <div className="flex mb-2">
            {assetsCountData.map((item, index) => (
              <div
                key={item.name}
                style={{ width: `${(item.count / total) * 100}%` }}
              >
                <span className="text-sm text-gray-600 block truncate px-1">{item.name}</span>
              </div>
            ))}
          </div>

          <div className="h-6 sm:h-8 flex rounded-md overflow-hidden">
            {assetsCountData.map((item, index) => (
              <div
                key={item.name}
                style={{
                  width: `${(item.count / total) * 100}%`,
                  backgroundColor: `rgba(255, 87, 34, ${1 - (index * 0.15)})`
                }}
                className="h-full"
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4">
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
          <RepositoryBar data={repositoryData} />
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
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Data governance maturity model</h2>
          <div className="flex justify-center">
            <div className="w-full max-w-xs sm:max-w-sm lg:max-w-md">
              <RadarChart 
                width={300} 
                height={250} 
                data={governanceData}
                className="mx-auto"
              >
                <PolarGrid />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fontSize: 10 }}
                />
                <Radar
                  name="Maturity"
                  dataKey="value"
                  stroke="#AF52DE"
                  fill="#AF52DE"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-10">
        <ConnectorBarChart />
      </div>

      <div className="mt-6 sm:mt-10">
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
      </div>
    </div>
  );
};

export default Dashboard;