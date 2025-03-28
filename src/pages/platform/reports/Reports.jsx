import { Icon } from "@iconify-icon/react";
import { useState, useEffect } from "react";
import CreationChart from "./Components/CreationChart";
import RemarksChart from "./Components/RemarksChart";
import StatusChart from "./Components/StatusChart";
import { useNavigate } from 'react-router-dom';
import { encrypt } from "../../../utils/Crypto";
const Reports = () => {
  const navigate = useNavigate();
  const cards = 
  [
    {
      icon: "material-symbols:database-upload-outline",
      bgcolor: "bg-[#d8d3e4] bg-opacity-25",
      iconcolor: "text-purple-700",
      title: "Reports",
      count: "27",
      route: "/generateReport"
    },
    {
      icon: "material-symbols-light:two-pager-store-outline",
      bgcolor: "bg-[#FFC93F] bg-opacity-25",
      iconcolor: "text-orange-700",
      title: "Projects",
      count: "11",
      route: "/project"
    },
    {
      icon: "material-symbols:cloud-sync-outline",
      bgcolor: "bg-[#96CF7B] bg-opacity-25",
      iconcolor: "text-green-700",
      title: "Users",
      count: "07",
      route: "/migration-report"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Source Table",
      count: "17",
      route: "/migration-report"
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Target Table",
      count: "06",
      route: "/migration-report"
    },
  ];


  const handleCreateReport = (route) => {
    navigate(route);
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

  const [data, setData] = useState({
    favourites: [],
    updates: [],
    history: [],
  });
  const [error, setError] = useState({
    favourites: null,
    updates: null,
    history: null,
  });
  const [loading, setLoading] = useState({
    favourites: true,
    updates: true,
    history: true,
  });


  // Favourites Card state
  useEffect(() => {
    fetch("https://api.example.com/favorites")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((favouritesData) => {
        setData((prevData) => ({ ...prevData, favourites: favouritesData }));
        setError((prevError) => ({ ...prevError, favourites: null }));
      })
      .catch((error) => {
        setError((prevError) => ({
          ...prevError,
          favourites: error.message || "An error occurred.",
        }));
        setData((prevData) => ({ ...prevData, favourites: [] }));
      })
      .finally(() => {
        setLoading((prevLoading) => ({ ...prevLoading, favourites: false }));
      });
  }, []);

  // Updates Card state
  useEffect(() => {
    fetch("https://api.example.com/updates")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((updatesData) => {
        setData((prevData) => ({ ...prevData, updates: updatesData }));
        setError((prevError) => ({ ...prevError, updates: null }));
      })
      .catch((error) => {
        setError((prevError) => ({
          ...prevError,
          updates: error.message || "An error occurred.",
        }));
        setData((prevData) => ({ ...prevData, updates: [] }));
      })
      .finally(() => {
        setLoading((prevLoading) => ({ ...prevLoading, updates: false }));
      });
  }, []);

  // History Card state
  useEffect(() => {
    fetch("https://api.example.com/history")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((historyData) => {
        setData((prevData) => ({ ...prevData, history: historyData }));
        setError((prevError) => ({ ...prevError, history: null }));
      })
      .catch((error) => {
        setError((prevError) => ({
          ...prevError,
          history: error.message || "An error occurred.",
        }));
        setData((prevData) => ({ ...prevData, history: [] }));
      })
      .finally(() => {
        setLoading((prevLoading) => ({ ...prevLoading, history: false }));
      });
  }, []);



  return (
    <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 transition-transform transform hover:scale-105 hover:shadow-md"
          >
            <div className="flex items-center mb-2">
              <div
                className={`flex items-center justify-center aspect-square w-8 md:w-10 ${card.bgcolor} rounded-full ${card.iconcolor} mr-2`}
              >
                <Icon icon={card.icon} />
              </div>
              <h3 className="text-lg font-semibold">{card.title}</h3>
            </div>
            <p className="text-black text-5xl font-bold">{card.count}</p>

            <button
              className="mt-4 text-purple-600 text-sm font-normal relative transition-all duration-300 group hover:scale-105 hover:font-medium"

                            onClick={() => {
                              const url = `/componentType=report&dataScope=${card.title}&heading=${card.title}`;
                              const encryptedUrl = encodeURIComponent(encrypt(url));
                              navigate(`/details?${encryptedUrl}`);
                            }}
              >
              See details
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-purple-600 transition-all duration-300 group-hover:w-full"></span>
            </button>
          </div>
        ))}
      </div>
      <div className="mt-10">
        <h1
          style={{
            fontFamily: "Proxima Nova",
            fontWeight: 700,
            fontSize: "20px",
            lineHeight: "24.36px",
            width: "1168px",
            height: "24px",
          }}
        >
          Weekly Workflow Overview
        </h1>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1 */}
        <CreationChart data={trendData} />
        {/* Card 2 */}
        <RemarksChart data={trendData} />
        {/* Card 3 */}
        <StatusChart data={trendData} />
      </div>
    </div>
  );
};

export default Reports;
