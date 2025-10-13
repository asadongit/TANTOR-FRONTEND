// import React, { useEffect, useState } from "react";
// import { Server, Database, Users, Activity, RefreshCw } from "lucide-react";
// import axios from "axios";
// import { useAuth } from "../../../../context/AuthContext";
// import BrokersTab from "./tabs/broker";
// import TopicsTab from "./tabs/topic";
// import ConsumerGroupsTab from "./tabs/consumerGroup";
// import Connector from "./tabs/connector";
// import { MonitoringProvider } from "../../monitoring/context/MonitoringContext";
// import { KafkaMonitoringProvider } from "../../monitoring/context/KafkaMonitoringContext";
// import KafkaMonitoring from "../../monitoring/KafkaMonitoring";

// const KafkaDashboard = () => {
//   const { session_state, token, hostnameV1 } = useAuth();
//   const [counts, setCounts] = useState({
//     brokers: 0,
//     active_topics: 0,
//     consumer_groups: 0,
//     total_messages: 0,
//   });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [lastRefresh, setLastRefresh] = useState(new Date());

//   const [activeTab, setActiveTab] = useState("overview");
//   const openkafbat = async () => {
//     try {
//       await fetch(`${hostnameV1}/auth/silent-auth?session_state=${session_state}`, {
//         method: "GET",
//         credentials: "include"
//       });
//     } catch (e) {
//       // Optionally handle error, but still open window
//     }
//     window.open("https://kafbat-ui.tantor.io/");
//   }

//   const [loadedTabs, setLoadedTabs] = useState({});

//   const tabs = [
//     { key: "overview", label: "Overview" },
//     { key: "brokers", label: "Brokers" },
//     { key: "topics", label: "Topics" },
//     { key: "consumer-groups", label: "Consumer Groups" },
//     { key: "connectors", label: "Connectors" },

//   ];

//   const markLoaded = (key) =>
//     setLoadedTabs((p) => (p[key] ? p : { ...p, [key]: true }));

//   const fetchCounts = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await axios.get(`${hostnameV1}/kafka/count`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setCounts({
//         brokers: res.data?.brokers ?? 0,
//         active_topics: res.data?.active_topics ?? 0,
//         consumer_groups: res.data?.consumer_groups ?? 0,
//         total_messages: res.data?.total_messages ?? 0,
//       });
//       markLoaded("overview");
//     } catch {
//       setError("Failed to load Kafka counts.");
//       setCounts({ brokers: 0, active_topics: 0, consumer_groups: 0, total_messages: 0 });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (activeTab === "overview" && !loadedTabs["overview"]) {
//       fetchCounts();
//     }
//   }, [hostnameV1, token, activeTab, loadedTabs]);

//   const formatNumber = (num) => {
//     if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
//     if (num >= 1000) return (num / 1000).toFixed(1) + "K";
//     return num.toString();
//   };

//   const handleRefreshOverview = () => {
//     fetchCounts();
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//         {/* Header */}
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 pb-2 border-b border-gray-200">
//           <div>
//             <h1 className="text-3xl font-medium text-[#8e78b7] mb-5">Kafka Dashboard</h1>
//             <div className="mt-3 flex flex-wrap gap-2">
//               {tabs.map((t) => (
//                 <button
//                   key={t.key}
//                   onClick={() => setActiveTab(t.key)}
//                   className={`px-5 py-2 rounded-full text-sm font-medium transition border ${
//                     activeTab === t.key
//                       ? "bg-[#8e78b7] text-white border-[#8e78b7]"
//                       : "bg-white text-gray-600 hover:text-[#8e78b7] border-gray-200"
//                   }`}
//                 >
//                   {t.label}
//                 </button>
//               ))}
//               <button onClick={() => openkafbat()}>Kafbat UI</button>
//             </div>
//           </div>
//         </div>

//         <div className={activeTab === "overview" ? "block" : "hidden"}>
//           {error && <div className="text-red-500 mb-4">{error}</div>}
//           <div className="flex justify-end mb-3">
//             <button
//               onClick={handleRefreshOverview}
//               className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#8e78b7]"
//               title="Refresh Overview"
//             >
//               <RefreshCw className="w-4 h-4" />
//               Refresh
//             </button>
//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//             <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
//               <div className="flex items-center space-x-4">
//                 <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
//                   <Server className="w-6 h-6 text-blue-600" />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-900">Total Brokers</h3>
//                   {loading ? (
//                     <div className="h-4 w-24 bg-gray-200 animate-pulse rounded mt-1" />
//                   ) : (
//                     <p className="text-sm text-gray-500">{counts.brokers} brokers</p>
//                   )}
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
//               <div className="flex items-center space-x-4">
//                 <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
//                   <Database className="w-6 h-6 text-indigo-600" />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-900">Active Topics</h3>
//                   {loading ? (
//                     <div className="h-4 w-16 bg-gray-200 animate-pulse rounded mt-1" />
//                   ) : (
//                     <p className="text-sm text-gray-500">{counts.active_topics} topics</p>
//                   )}
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
//               <div className="flex items-center space-x-4">
//                 <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
//                   <Users className="w-6 h-6 text-teal-600" />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-900">Consumer Groups</h3>
//                   {loading ? (
//                     <div className="h-4 w-20 bg-gray-200 animate-pulse rounded mt-1" />
//                   ) : (
//                     <p className="text-sm text-gray-500">{counts.consumer_groups} groups</p>
//                   )}
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
//               <div className="flex items-center space-x-4">
//                 <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
//                   <Activity className="w-6 h-6 text-amber-600" />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-900">Total Messages</h3>
//                   {loading ? (
//                     <div className="h-4 w-28 bg-gray-200 animate-pulse rounded mt-1" />
//                   ) : (
//                     <p className="text-sm text-gray-500">{formatNumber(counts.total_messages)}</p>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* <div className="mt-8">
//             <MonitoringProvider>
//               <KafkaMonitoringProvider>
//                 <KafkaMonitoring />
//               </KafkaMonitoringProvider>
//             </MonitoringProvider>
//           </div> */}
//         </div>

//         <div className={activeTab === "brokers" ? "block" : "hidden"}>
//           <BrokersTab active={activeTab === "brokers"} />
//         </div>

//         <div className={activeTab === "topics" ? "block" : "hidden"}>
//           <TopicsTab active={activeTab === "topics"} />
//         </div>

//         <div className={activeTab === "consumer-groups" ? "block" : "hidden"}>
//           <ConsumerGroupsTab active={activeTab === "consumer-groups"} />
//         </div>

//         <div className={activeTab === "connectors" ? "block" : "hidden"}>
//           <Connector active={activeTab === "connectors"} />
//         </div>

//       </div>
//     </div>
//   );
// };

// export default KafkaDashboard;

import React from "react";
import { ExternalLink } from "lucide-react";
import { MonitoringProvider } from "../../monitoring/context/MonitoringContext";
import { KafkaMonitoringProvider } from "../../monitoring/context/KafkaMonitoringContext";
import KafkaMonitoring from "../../monitoring/KafkaMonitoring";

const KafkaDashboard = () => {
  const handleOpenKafbat = () => {
    window.open("https://kafbat-ui.tantor.io/", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-medium text-[#8e78b7]">Kafka Monitoring</h1>

          <button
            type="button"
            onClick={handleOpenKafbat}
            className="inline-flex items-center gap-2 rounded-md bg-[#8e78b7] px-3 py-1.5 text-sm text-white hover:bg-[#7b67a0] focus:outline-none focus:ring-2 focus:ring-[#8e78b7]/40 focus:ring-offset-2"
            aria-label="See more in Kafbat (opens in a new tab)"
          >
            See more
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4">
          <MonitoringProvider>
            <KafkaMonitoringProvider>
              <KafkaMonitoring />
            </KafkaMonitoringProvider>
          </MonitoringProvider>
        </div>
      </div>
    </div>
  );
};

export default KafkaDashboard;

