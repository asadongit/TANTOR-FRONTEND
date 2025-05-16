// import { useState } from "react";
// import { FileText, Filter, Clock, Search, ChevronLeft, ChevronRight, Calendar, AlertCircle, Download, RefreshCw } from "lucide-react";

// export default function Logs({logs}) {
//     console.log("LOGGGGGGGGGGGGGGGG",logs)
//   const [timeRange, setTimeRange] = useState("1h");
//   const [showFilters, setShowFilters] = useState(false);
//   const [logLevel, setLogLevel] = useState("all");
//   const [connectorFilter, setConnectorFilter] = useState("all");
  


//   return (
//     <div className="flex flex-col h-full">
//       <div className="flex justify-between items-center mb-4 bg-white p-3 border-b border-gray-200 sticky top-0">
//         <div className="flex items-center">
//           <h3 className="text-lg font-medium text-gray-800 flex items-center">
//             <FileText className="w-5 h-5 mr-2 text-indigo-600" />
//             System Logs
//           </h3>
//           <div className="ml-4 hidden md:block">
//             <div className="flex items-center space-x-3 text-sm">
//               <span className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded" 
//                     onClick={() => setLogLevel(logLevel === "INFO" ? "all" : "INFO")}>
//                 <span className={`w-2 h-2 rounded-full bg-green-500 mr-1 ${logLevel === "INFO" ? "ring-2 ring-green-200" : ""}`}></span>
//                 INFO
//               </span>
//               <span className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
//                     onClick={() => setLogLevel(logLevel === "WARN" ? "all" : "WARN")}>
//                 <span className={`w-2 h-2 rounded-full bg-yellow-500 mr-1 ${logLevel === "WARN" ? "ring-2 ring-yellow-200" : ""}`}></span>
//                 WARN
//               </span>
//               <span className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
//                     onClick={() => setLogLevel(logLevel === "ERROR" ? "all" : "ERROR")}>
//                 <span className={`w-2 h-2 rounded-full bg-red-500 mr-1 ${logLevel === "ERROR" ? "ring-2 ring-red-200" : ""}`}></span>
//                 ERROR
//               </span>
//             </div>
//           </div>
//         </div>
//         <div className="flex items-center space-x-2">
//           <button 
//             onClick={() => setShowFilters(!showFilters)}
//             className={`px-3 py-1.5 ${showFilters ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'} rounded-md text-sm flex items-center`}
//           >
//             <Filter className="w-4 h-4 mr-1.5" />
//             Filters
//           </button>
//           <button className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md text-sm flex items-center">
//             <RefreshCw className="w-4 h-4 mr-1.5" />
//             Refresh
//           </button>
//           <button className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md text-sm flex items-center">
//             <Download className="w-4 h-4 mr-1.5" />
//             Export
//           </button>
//         </div>
//       </div>

//       {showFilters && (
//         <div className="bg-gray-50 p-3 mb-4 rounded-md border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
//           <div className="flex flex-col">
//             <label htmlFor="connector-filter" className="text-sm text-gray-600 mb-1 flex items-center">
//               <Filter className="w-4 h-4 mr-1" /> Connector Type:
//             </label>
//             <select
//               id="connector-filter"
//               value={connectorFilter}
//               onChange={(e) => setConnectorFilter(e.target.value)}
//               className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
//             >
//               <option value="all">All Connectors</option>
//               <option value="source">Source</option>
//               <option value="sink">Sink</option>
//             </select>
//           </div>

//           <div className="flex flex-col">
//             <label htmlFor="log-level" className="text-sm text-gray-600 mb-1 flex items-center">
//               <AlertCircle className="w-4 h-4 mr-1" /> Log Level:
//             </label>
//             <select
//               id="log-level"
//               value={logLevel}
//               onChange={(e) => setLogLevel(e.target.value)}
//               className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
//             >
//               <option value="all">All Levels</option>
//               <option value="INFO">INFO</option>
//               <option value="WARN">WARNING</option>
//               <option value="ERROR">ERROR</option>
//             </select>
//           </div>

//           <div className="flex flex-col">
//             <label htmlFor="time-range" className="text-sm text-gray-600 mb-1 flex items-center">
//               <Clock className="w-4 h-4 mr-1" /> Time Range:
//             </label>
//             <select
//               id="time-range"
//               value={timeRange}
//               onChange={(e) => setTimeRange(e.target.value)}
//               className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
//             >
//               <option value="15m">Last 15 minutes</option>
//               <option value="1h">Last hour</option>
//               <option value="6h">Last 6 hours</option>
//               <option value="24h">Last 24 hours</option>
//               <option value="7d">Last 7 days</option>
//               <option value="custom">Custom range</option>
//             </select>
//           </div>

//           <div className="flex flex-col">
//             <label htmlFor="search-logs" className="text-sm text-gray-600 mb-1 flex items-center">
//               <Search className="w-4 h-4 mr-1" /> Search Logs:
//             </label>
//             <div className="flex">
//               <input
//                 type="text"
//                 id="search-logs"
//                 placeholder="Search messages..."
//                 className="text-sm border-gray-300 rounded-l-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 flex-grow"
//               />
//               <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-r-md text-sm flex items-center">
//                 <Search className="w-4 h-4" />
//               </button>
//             </div>
//           </div>

//           {timeRange === "custom" && (
//             <div className="flex flex-col md:col-span-4 md:flex-row gap-4">
//               <div className="flex flex-col flex-1">
//                 <label className="text-sm text-gray-600 mb-1 flex items-center">
//                   <Calendar className="w-4 h-4 mr-1" /> Start Date:
//                 </label>
//                 <input 
//                   type="datetime-local" 
//                   className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" 
//                 />
//               </div>
//               <div className="flex flex-col flex-1">
//                 <label className="text-sm text-gray-600 mb-1 flex items-center">
//                   <Calendar className="w-4 h-4 mr-1" /> End Date:
//                 </label>
//                 <input 
//                   type="datetime-local" 
//                   className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" 
//                 />
//               </div>
//               <div className="flex items-end">
//                 <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium">
//                   Apply Date Range
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden flex-grow flex flex-col">
//         <div className="overflow-auto h-64">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-100 sticky top-0">
//               <tr>
//                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Timestamp</th>
//                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Level</th>
//                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Connector</th>
//                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Message</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {logs?.map((log, index) => (
//                 <tr key={index} className="hover:bg-gray-50">
//                   <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{log.timestamp}</td>
//                   <td className="px-4 py-2 whitespace-nowrap">
//                     <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
//                       log.level === 'INFO' ? 'bg-green-100 text-green-800' :
//                       log.level === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
//                       'bg-red-100 text-red-800'
//                     }`}>
//                       {log.level}
//                     </span>
//                   </td>
//                   <td className="px-4 py-2 whitespace-nowrap text-sm">
//                     <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${
//                       log.connector === 'source' ? 'bg-indigo-50 text-indigo-700' : 'bg-purple-50 text-purple-700'
//                     }`}>
//                       {log.connector}
//                     </span>
//                   </td>
//                   <td className="px-4 py-2 text-sm text-gray-800">{log.message}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//         <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 flex items-center justify-between">
//           <div className="flex-1 flex justify-between sm:hidden">
//             <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
//               Previous
//             </button>
//             <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
//               Next
//             </button>
//           </div>
//           <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
//             <div>
//               <p className="text-sm text-gray-700">
//                 Showing <span className="font-medium">1</span> to <span className="font-medium">8</span> of{' '}
//                 <span className="font-medium">97</span> logs
//               </p>
//             </div>
//             <div>
//               <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
//                 <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
//                   <span className="sr-only">Previous</span>
//                   <ChevronLeft className="h-5 w-5" />
//                 </button>
//                 <button className="bg-indigo-50 border-indigo-500 text-indigo-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
//                   1
//                 </button>
//                 <button className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
//                   2
//                 </button>
//                 <button className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hidden md:inline-flex relative items-center px-4 py-2 border text-sm font-medium">
//                   3
//                 </button>
//                 <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
//                   ...
//                 </span>
//                 <button className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hidden md:inline-flex relative items-center px-4 py-2 border text-sm font-medium">
//                   9
//                 </button>
//                 <button className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
//                   10
//                 </button>
//                 <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
//                   <span className="sr-only">Next</span>
//                   <ChevronRight className="h-5 w-5" />
//                 </button>
//               </nav>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  FileText, 
  Filter, 
  Clock, 
  Search, 
  Calendar, 
  AlertCircle, 
  Download, 
  RefreshCw,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { useAuth } from "../../../../../context/AuthContext";

export default function Logs({ data }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("1h");
  const [showFilters, setShowFilters] = useState(false);
  const [logLevel, setLogLevel] = useState("all");
  const [connectorFilter, setConnectorFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeConnector, setActiveConnector] = useState("source"); // "source" or "target"
  const logsContainerRef = useRef(null);
  
  const sourceConnectorName = data?.source_connector?.config?.name;
  const targetConnectorName = data?.target_connector?.config?.name;
  const { hostnameV2, token, project } = useAuth();

  // Get start and end times based on selected time range
  const getTimeRangeValues = () => {
    const now = new Date();
    const end = now.getTime() * 1000000; // Convert to nanoseconds
    
    let start;
    switch (timeRange) {
      case "15m":
        start = new Date(now - 15 * 60 * 1000).getTime() * 1000000;
        break;
      case "1h":
        start = new Date(now - 60 * 60 * 1000).getTime() * 1000000;
        break;
      case "6h":
        start = new Date(now - 6 * 60 * 60 * 1000).getTime() * 1000000;
        break;
      case "24h":
        start = new Date(now - 24 * 60 * 60 * 1000).getTime() * 1000000;
        break;
      case "7d":
        start = new Date(now - 7 * 24 * 60 * 60 * 1000).getTime() * 1000000;
        break;
      case "custom":
        if (startDate && endDate) {
          start = new Date(startDate).getTime() * 1000000;
          return { start, end: new Date(endDate).getTime() * 1000000 };
        }
        // Default to 1h if custom dates aren't set
        start = new Date(now - 60 * 60 * 1000).getTime() * 1000000;
        break;
      default:
        start = new Date(now - 60 * 60 * 1000).getTime() * 1000000;
    }
    
    return { start, end };
  };

  const fetchLokiLogs = async () => {
    const connectorName = activeConnector === "source" ? sourceConnectorName : targetConnectorName;
    
    if (!connectorName) {
      console.error(`No ${activeConnector} connector name provided`);
      return;
    }

    setLoading(true);
    try {
      const { start, end } = getTimeRangeValues();
      
      const response = await axios.get(`${hostnameV2}/cdc/logs/loki`, {
        params: {
          connector_name: connectorName,
          start: start,
          end: end,
          step: "30s"
        }
      });
      
      if (response.data?.data?.result?.length > 0 && response.data.data.result[0]?.values) {
        const logsData = response.data.data.result[0].values.map((log) => {
          const logMessage = log[1];
          
          // Extract timestamp
          const timestampEndIndex = logMessage.indexOf(']');
          const timestamp = logMessage.substring(1, timestampEndIndex).trim();
          
          // Extract log level
          const remainingMessage = logMessage.substring(timestampEndIndex + 1).trim();
          const firstSpaceIndex = remainingMessage.indexOf(' ');
          const level = firstSpaceIndex > 0 ? remainingMessage.substring(0, firstSpaceIndex) : 'INFO';
          
          // Extract message content
          const message = remainingMessage.substring(firstSpaceIndex + 1).trim();
          
          return {
            timestamp,
            level,
            connector: activeConnector, 
            message
          };
        });
        
        setLogs(logsData);
      } else {
        console.log(`No logs found for ${activeConnector} connector:`, connectorName);
        setLogs([]);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch logs when component mounts or when connector/timeRange changes
  useEffect(() => {
    fetchLokiLogs();
    // Set interval to refresh logs every minute
    const intervalId = setInterval(fetchLokiLogs, 60000);
    
    // Clean up on component unmount
    return () => clearInterval(intervalId);
  }, [activeConnector, timeRange]);

  // Apply custom date range
  const applyCustomDateRange = () => {
    if (startDate && endDate) {
      fetchLokiLogs();
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    fetchLokiLogs();
  };

  // Toggle between source and target connector
  const toggleConnector = () => {
    setActiveConnector(activeConnector === "source" ? "target" : "source");
  };

  // Export logs to CSV
  const exportLogs = () => {
    if (filteredLogs.length === 0) return;
    
    const headers = ["Timestamp", "Level", "Connector", "Message"];
    const csvContent = [
      headers.join(","),
      ...filteredLogs.map(log => 
        `"${log.timestamp}","${log.level}","${log.connector}","${log.message.replace(/"/g, '""')}"`
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `logs_${activeConnector === "source" ? sourceConnectorName : targetConnectorName}_${new Date().toISOString()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logs based on level, connector type and search query
  const filteredLogs = logs.filter(log => {
    let matchesLevel = logLevel === "all" || log.level === logLevel;
    let matchesConnector = connectorFilter === "all" || log.connector === connectorFilter;
    let matchesSearch = searchQuery === "" || 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.level.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesLevel && matchesConnector && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 bg-white p-3 border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center">
          <h3 className="text-lg font-medium text-gray-800 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-indigo-600" />
             Logs: {activeConnector === "source" ? sourceConnectorName : targetConnectorName}
          </h3>
          <div className="ml-4 hidden md:block">
            <div className="flex items-center space-x-3 text-sm">
              <span className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded" 
                    onClick={() => setLogLevel(logLevel === "INFO" ? "all" : "INFO")}>
                <span className={`w-2 h-2 rounded-full bg-green-500 mr-1 ${logLevel === "INFO" ? "ring-2 ring-green-200" : ""}`}></span>
                INFO
              </span>
              <span className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                    onClick={() => setLogLevel(logLevel === "WARN" ? "all" : "WARN")}>
                <span className={`w-2 h-2 rounded-full bg-yellow-500 mr-1 ${logLevel === "WARN" ? "ring-2 ring-yellow-200" : ""}`}></span>
                WARN
              </span>
              <span className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                    onClick={() => setLogLevel(logLevel === "ERROR" ? "all" : "ERROR")}>
                <span className={`w-2 h-2 rounded-full bg-red-500 mr-1 ${logLevel === "ERROR" ? "ring-2 ring-red-200" : ""}`}></span>
                ERROR
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleConnector}
            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md text-sm flex items-center"
          >
            {activeConnector === "source" ? (
              <>
                <ToggleLeft className="w-4 h-4 mr-1.5" />
                Switch to Target
              </>
            ) : (
              <>
                <ToggleRight className="w-4 h-4 mr-1.5" />
                Switch to Source
              </>
            )}
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 ${showFilters ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'} rounded-md text-sm flex items-center`}
          >
            <Filter className="w-4 h-4 mr-1.5" />
            Filters
          </button>
          <button 
            onClick={handleRefresh}
            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md text-sm flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={exportLogs}
            disabled={filteredLogs.length === 0}
            className={`px-3 py-1.5 ${filteredLogs.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'} rounded-md text-sm flex items-center`}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 p-3 mb-4 rounded-md border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <label htmlFor="connector-filter" className="text-sm text-gray-600 mb-1 flex items-center">
              <Filter className="w-4 h-4 mr-1" /> Connector Type:
            </label>
            <select
              id="connector-filter"
              value={connectorFilter}
              onChange={(e) => setConnectorFilter(e.target.value)}
              className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="all">All Connectors</option>
              <option value="source">Source</option>
              <option value="target">Target</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label htmlFor="log-level" className="text-sm text-gray-600 mb-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" /> Log Level:
            </label>
            <select
              id="log-level"
              value={logLevel}
              onChange={(e) => setLogLevel(e.target.value)}
              className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="all">All Levels</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARNING</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label htmlFor="time-range" className="text-sm text-gray-600 mb-1 flex items-center">
              <Clock className="w-4 h-4 mr-1" /> Time Range:
            </label>
            <select
              id="time-range"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="15m">Last 15 minutes</option>
              <option value="1h">Last hour</option>
              <option value="6h">Last 6 hours</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="custom">Custom range</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label htmlFor="search-logs" className="text-sm text-gray-600 mb-1 flex items-center">
              <Search className="w-4 h-4 mr-1" /> Search Logs:
            </label>
            <div className="flex">
              <input
                type="text"
                id="search-logs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="text-sm border-gray-300 rounded-l-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 flex-grow"
              />
              <button 
                onClick={() => setSearchQuery(document.getElementById('search-logs').value)}
                className="px-3 py-1.5 bg-[#8e78b7] hover:bg-gray-400 text-white rounded-r-md text-sm flex items-center"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {timeRange === "custom" && (
            <div className="flex flex-col md:col-span-4 md:flex-row gap-4">
              <div className="flex flex-col flex-1">
                <label className="text-sm text-gray-600 mb-1 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" /> Start Date:
                </label>
                <input 
                  type="datetime-local" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" 
                />
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-sm text-gray-600 mb-1 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" /> End Date:
                </label>
                <input 
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-sm border-gray-300 rounded-md shadow-sm focus:border-[#8e78b7] focus:ring focus:ring-purple-200 focus:ring-opacity-50" 
                />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={applyCustomDateRange}
                  className="px-4 py-2 bg-[#8e78b7] hover:bg-gray-400 text-white rounded-md text-sm font-medium"
                >
                  Apply Date Range
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden flex-grow flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <span className="ml-2 text-gray-600">Loading logs...</span>
          </div>
        ) : (
          <div 
            ref={logsContainerRef}
            className="overflow-auto flex-grow h-96"
          >
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Timestamp</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Level</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Connector</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Message</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{log.timestamp}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                          log.level === 'INFO' ? 'bg-green-100 text-green-800' :
                          log.level === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${
                          log.connector === 'source' ? 'bg-indigo-50 text-indigo-700' : 'bg-purple-50 text-purple-700'
                        }`}>
                          {log.connector}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">{log.message}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                      {logs.length === 0 ? `No logs found for this ${activeConnector} connector` : "No logs match your filter criteria"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">
              {filteredLogs.length > 0 ? (
                <>
                  Showing <span className="font-medium">{filteredLogs.length}</span> logs
                </>
              ) : (
                "No logs to display"
              )}
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}