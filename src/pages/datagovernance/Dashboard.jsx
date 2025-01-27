import { Icon } from "@iconify-icon/react";
import { useState, useEffect } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';


const Dashboard = () => {
  const cards = [
    {
      icon: "material-symbols:build-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-20",
      iconcolor: "text-[#16ABC2]",
      bordercolor: "border-[#16ABC2]",
      title: "Technical",
      stats: [
        { label: "Connectors", value: "07" },
        { label: "Schema", value: "20" },
        { label: "Tables", value: "39" },
        { label: "Columns", value: "77" }
      ]
    },
    {
      icon: "material-symbols:business-center-outline",
      bgcolor: "bg-[#FFC93F] bg-opacity-20",
      iconcolor: "text-[#FFC93F]",
      bordercolor: "border-[#FFC93F]",
      title: "Business",
      stats: [
        { label: "Domain", value: "12" },
        { label: "Terms", value: "44" },
        { label: "Definitions", value: "29" },
        { label: "LOB", value: "06" }
      ]
    },
    {
      icon: "material-symbols:hub-outline",
      bgcolor: "bg-[#AF52DE] bg-opacity-20",
      iconcolor: "text-[#AF52DE]",
      bordercolor: "border-[#AF52DE]",
      title: "Operational",
      stats: [
        { label: "Policies", value: "71" },
        { label: "Tags", value: "60" },
        { label: "Rules", value: "68" },
        { label: "Persona", value: "17" }
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
    const totalWidth = 100;

    return (
      <div className="flex flex-col space-y-4">
        {data.map((item) => (
          <div key={item.name} className="w-full">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">{item.name}</span>
            </div>
            <div className="flex h-6 rounded-md overflow-hidden">
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
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center mb-6">
        <h2 className="text-xl font-semibold">Assets count by connector</h2>
        <svg className="w-5 h-5 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <div className="flex mb-2">
        {assetsCountData.map((item, index) => (
          <div
            key={item.name}
            style={{
              width: `${(item.count / total) * 100}%`,
            }}
          >
            <span className="text-sm text-gray-600 block">{item.name}</span>
          </div>
        ))}
      </div>

      <div className="h-8 flex rounded-md overflow-hidden">
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
  );
};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, index) => (
          <div
            key={card.title}
            className={`bg-white p-6 rounded-lg shadow-sm border-b-8 ${card.bordercolor}`}
          >
            <div className="flex items-center mb-6">
              <div
                className={`flex items-center justify-center w-10 h-10 ${card.bgcolor} rounded-full ${card.iconcolor} mr-3`}
              >
                <Icon icon={card.icon} width="24" height="24" />
              </div>
              <h3 className="text-lg font-semibold">{card.title}</h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {card.stats.map((stat, statIndex) => (
                <div
                  key={stat.label}
                  className={`flex flex-col ${
                    statIndex !== 3 ? 'border-r border-gray-200' : ''
                  }`}
                >
                  <span className="text-md font-bold pr-4">{stat.value}</span>
                  <span className="text-gray-600 text-sm pr-4">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Data repository by sensitivity</h2>
          <RepositoryBar data={repositoryData} />
          <div className="flex justify-start mt-4 space-x-6">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#ff9500] rounded-sm mr-2" />
              <span className="text-sm text-gray-600">Sensitive</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#ffcf57] rounded-sm mr-2" />
              <span className="text-sm text-gray-600">Non-Sensitive</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#268ede] rounded-sm mr-2" />
              <span className="text-sm text-gray-600">Personal</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Data governance maturity model</h2>
          <div className="flex justify-center">
            <RadarChart width={500} height={300} data={governanceData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
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

      <div className="mt-10">

          <ConnectorBarChart />


        {/* <div className="w-full h-64 bg-white rounded-lg shadow-sm mb-10"></div> */}

        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-6">
            Your activities
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <div key={activity.title} className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">{activity.title}</h3>
                <p className="text-gray-500 text-center py-8">{activity.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
