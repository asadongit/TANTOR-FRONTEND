import { Icon } from "@iconify-icon/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
const Dashboard = () => {
  const navigate = useNavigate();

  const cards = [
    {
      icon: "material-symbols:database-upload-outline",
      bgcolor: "bg-[#d8d3e4] bg-opacity-25",
      iconcolor: "text-purple-700",
      bordercolor: "border-purple-700",
      title: "Migration",
      description:
        "Data movement transfers data across systems using ETL, batch, or streaming methods, enabling integration, processing, and maintaining data integrity.",
      type: "platform",
      path: "/migration",
    },
    {
      icon: "material-symbols-light:two-pager-store-outline",
      bgcolor: "bg-[#FFC93F] bg-opacity-25",
      iconcolor: "text-orange-700",
      bordercolor: "border-orange-700",
      title: "Purge",
      description:
        "AI data fuels machine learning models, encompassing structured and unstructured datasets, enabling training, predictions, and decision-making for intelligent systems and applications.",
      type: "platform",
      path: "/purge",
    },
    {
      icon: "material-symbols:cloud-sync-outline",
      bgcolor: "bg-[#96CF7B] bg-opacity-25",
      iconcolor: "text-green-700",
      bordercolor: "border-green-700",
      title: "CDC",
      description:
        "Change Data Capture (CDC) identifies and tracks data changes in real-time, enabling efficient updates and synchronization across systems or databases.",
      type: "platform",
      path: "/cdc",
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      bordercolor: "border-cyan-700",
      title: "Federation",
      description:
        "Federated data integrates distributed datasets from multiple sources, enabling unified access, analysis, and collaboration without centralizing or duplicating data storage.",
      type: "platform",
      path: "/federation",
    },
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
    favourites: false,
    updates: false,
    history: false,
  });
  const [showDescription, setShowDescription] = useState({
    1: false,
    2: false,
    3: false,
  });

  // Favourites Card state
  // useEffect(() => {
  //   fetch("https://api.example.com/favorites")
  //     .then((response) => {
  //       if (!response.ok) {
  //         throw new Error("Network response was not ok");
  //       }
  //       return response.json();
  //     })
  //     .then((favouritesData) => {
  //       setData((prevData) => ({ ...prevData, favourites: favouritesData }));
  //       setError((prevError) => ({ ...prevError, favourites: null }));
  //     })
  //     .catch((error) => {
  //       setError((prevError) => ({
  //         ...prevError,
  //         favourites: error.message || "An error occurred.",
  //       }));
  //       setData((prevData) => ({ ...prevData, favourites: [] }));
  //     })
  //     .finally(() => {
  //       setLoading((prevLoading) => ({ ...prevLoading, favourites: false }));
  //     });
  // }, []);

  // Updates Card state
  // useEffect(() => {
  //   fetch("https://api.example.com/updates")
  //     .then((response) => {
  //       if (!response.ok) {
  //         throw new Error("Network response was not ok");
  //       }
  //       return response.json();
  //     })
  //     .then((updatesData) => {
  //       setData((prevData) => ({ ...prevData, updates: updatesData }));
  //       setError((prevError) => ({ ...prevError, updates: null }));
  //     })
  //     .catch((error) => {
  //       setError((prevError) => ({
  //         ...prevError,
  //         updates: error.message || "An error occurred.",
  //       }));
  //       setData((prevData) => ({ ...prevData, updates: [] }));
  //     })
  //     .finally(() => {
  //       setLoading((prevLoading) => ({ ...prevLoading, updates: false }));
  //     });
  // }, []);

  // History Card state
  // useEffect(() => {
  //   fetch("https://api.example.com/history")
  //     .then((response) => {
  //       if (!response.ok) {
  //         throw new Error("Network response was not ok");
  //       }
  //       return response.json();
  //     })
  //     .then((historyData) => {
  //       setData((prevData) => ({ ...prevData, history: historyData }));
  //       setError((prevError) => ({ ...prevError, history: null }));
  //     })
  //     .catch((error) => {
  //       setError((prevError) => ({
  //         ...prevError,
  //         history: error.message || "An error occurred.",
  //       }));
  //       setData((prevData) => ({ ...prevData, history: [] }));
  //     })
  //     .finally(() => {
  //       setLoading((prevLoading) => ({ ...prevLoading, history: false }));
  //     });
  // }, []);

  const handleDescriptionToggle = (index) => {
    setShowDescription((prev) => {
      const newShowDescription = {};
      newShowDescription[index] = !prev[index];
      return newShowDescription;
    });
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div
            key={card.title}
            className={`bg-white p-6 rounded-lg shadow-sm border-gray-200 border-b-8 ${card.bordercolor}`}
          >
            <div className="flex items-center mb-2">
              <div
                className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 ${card.bgcolor} rounded-full ${card.iconcolor} mr-2`}
              >
                <Icon icon={card.icon} />
              </div>
              <h3 className="text-lg font-semibold">{card.title}</h3>
            </div>
            <p className="text-gray-600 text-sm">{card.description}</p>
            <button className="mt-4 text-purple-600 text-sm hover:text-purple-700" onClick={() => navigate(card?.path || "/")}>
              See details
            </button>
          </div>
        ))}
      </div>
      {/* <div className="mt-10">
        <h1 className="text-xl font-bold text-black"
        >
          Your Activities
        </h1>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-1 p-4 bg-white border rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Favourites</h2>
            <div className="relative flex items-center">
              <Icon
                icon="material-symbols:info-outline"
                className="text-gray-500 cursor-pointer"
                onClick={() => handleDescriptionToggle(1)}
                title="This is the description of favourites card."
              />
              {showDescription[1] && (
                <div className="absolute top-0 left-8 bg-white border rounded-lg shadow-md p-2 text-xs text-gray-600">
                  This is the description of favourites card.
                </div>
              )}
            </div>
          </div>
          <hr className="my-2" />
          {loading.favourites ? (
            <p className="text-gray-600">Coming Soon</p>
          ) : error.favourites ? (
            <p className="text-gray-600">{error.favourites}</p>
          ) : data.favourites.length > 0 ? (
            <ul className="list-disc pl-4 text-gray-600">
              {data.favourites.map((item, index) => (
                <li key={index}>{item.name}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">Your favourites list is empty</p>
          )}
        </div>

        <div className="col-span-1 p-4 bg-white border rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Updated</h2>
            <div className="relative flex items-center">
              <Icon
                icon="material-symbols:info-outline"
                className="text-gray-500 cursor-pointer"
                onClick={() => handleDescriptionToggle(2)}
                title="This is the description of updates card."
              />
              {showDescription[2] && (
                <div className="absolute top-0 left-8 bg-white border rounded-lg shadow-md p-2 text-xs text-gray-600">
                  This is the description of updates card.
                </div>
              )}
            </div>
          </div>
          <hr className="my-2" />
          {loading.updates ? (
            <p className="text-gray-600">Coming Soon</p>
          ) : error.updates ? (
            <p className="text-gray-600">{error.updates}</p>
          ) : data.updates.length > 0 ? (
            <ul className="list-disc pl-4 text-gray-600">
              {data.updates.map((item, index) => (
                <li key={index}>{item.title}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">Your update list is empty</p>
          )}
        </div>

        <div className="col-span-1 p-4 bg-white border rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">History</h2>
            <div className="relative flex items-center">
              <Icon
                icon="material-symbols:info-outline"
                className="text-gray-500 cursor-pointer"
                onClick={() => handleDescriptionToggle(3)}
                title="This is the description of history card."
              />
              {showDescription[3] && (
                <div className="absolute top-0 left-8 bg-white border rounded-lg shadow-md p-2 text-xs text-gray-600">
                  This is the description of history card.
                </div>
              )}
            </div>
          </div>
          <hr className="my-2" />
          {loading.history ? (
            <p className="text-gray-600">Coming Soon</p>
          ) : error.history ? (
            <p className="text-gray-600">{error.history}</p>
          ) : data.history.length > 0 ? (
            <ul className="list-disc pl-4 text-gray-600">
              {data.history.map((item, index) => (
                <li key={index}>{item.historyItem}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No history available.</p>
          )}
        </div>
      </div> */}
    </div>
  );
};

export default Dashboard;
