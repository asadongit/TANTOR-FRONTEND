import React, { useEffect, useState } from "react";
import { useMonitoringContext } from "../context/monitoringcontext";
import SingleLineAreaChart from "./SingleLineAreaChart";
import StatCard from "./StatCard";
import { RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

function MetricViewer() {
  const { monitoringConfig, getPodMetrics } = useMonitoringContext();
  const [cpuUsage, setCpuUsage] = useState([]);
  const [memoryUsage, setMemoryUsage] = useState([]);
  const [statCardData, setStatCardData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPodMetrics = async () => {
    try {
      setLoading(true);
      const results = (await getPodMetrics(monitoringConfig))["results"];
      const cpuFrame = results?.A?.frames?.[0];
      const memFrame = results?.B?.frames?.[0];

      const cpuData = [];
      const memoryData = [];

      if (cpuFrame && cpuFrame.data?.values?.length === 2) {
        const [timestamps, cpuValues] = cpuFrame.data.values;
        for (let i = 0; i < timestamps.length; i++) {
          cpuData.push({
            time: new Date(timestamps[i]).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            value: cpuValues[i],
          });
        }
      }

      if (memFrame && memFrame.data?.values?.length === 2) {
        const [timestamps, memValues] = memFrame.data.values;
        for (let i = 0; i < timestamps.length; i++) {
          memoryData.push({
            time: new Date(timestamps[i]).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            value: Math.round(memValues[i] / (1024 * 1024)), // bytes to MB
          });
        }
      }

      setCpuUsage(cpuData);
      setMemoryUsage(memoryData);

      const latestCPU =
        cpuData.length > 0 ? cpuData[cpuData.length - 1].value : 0;
      const latestMemory =
        memoryData.length > 0 ? memoryData[memoryData.length - 1].value : 0;

      const cpuStats = [{ label: "CPU Used", value: latestCPU.toFixed(2) }];
      const memoryStats = [
        { label: "Memory Used", value: latestMemory.toFixed(2) },
      ];

      setStatCardData({ cpuStats, memoryStats });
      toast.success("Metris fetched successfully");
    } catch (error) {
      console.error(error);
      setCpuUsage([]);
      toast.error(error.message || "Failed to fetch pods");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!monitoringConfig.pod) return;
    fetchPodMetrics();
  }, []);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={fetchPodMetrics}
          disabled={loading}
          className={`flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:text-indigo-600 hover:border-indigo-600 transition-all ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          title="Refresh metrics"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 place-items-center">
        <StatCard
          title="CPU Usage"
          data={statCardData.cpuStats || []}
          unit="cores"
        />
        <StatCard
          title="Memory Usage"
          data={statCardData.memoryStats || []}
          unit="MiB"
        />
      </div>

      <div className="flex flex-col gap-6 w-full m-4">
        <SingleLineAreaChart
          title="CPU Usage"
          data={cpuUsage}
          unit="cores"
          color="#8884d8"
        />
        <SingleLineAreaChart
          title="Memory Usage"
          data={memoryUsage}
          unit="MB"
          color="#82ca9d"
        />
      </div>
    </div>
  );
}

export default MetricViewer;
