import { Icon } from "@iconify-icon/react";
import { useState, useEffect } from "react";

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

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-6">
          Assets count by connector
        </h2>

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
