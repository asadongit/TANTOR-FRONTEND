import React, { useMemo, useState, useEffect } from "react";
import { useKafkaMonitoringContext } from "./context/KafkaMonitoringContext";
import { useMonitoringContext } from "./context/monitoringcontext";
import toast from "react-hot-toast";
import { GroupedLineChart, KafkaPieChart } from "./components/KafkaCharts";
import StatCard from "./components/StatCard";
import { Clock, MemoryStick, RefreshCw } from "lucide-react";

function KafkaMonitoring() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    messagesPerTopic: false,
    produceRatePerTopic: false,
    produceReqPerBroker: false,
    diskRead: false,
    diskWrite: false,
    jvmMemory: false,
    gcTime: false,
    jvmCpu: false,
  });
  const { getKafkaMetrics } = useKafkaMonitoringContext();
  const { getTimerangeInMilliseconds } = useMonitoringContext();

  const [forceRefresh, setForceRefresh] = useState(false);
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState("");

  const [messagesPerTopic, setMessagesPerTopic] = useState([]);
  const [produceRatePerTopic, setProduceRatePerTopic] = useState([]);
  const [produceReqPerBroker, setProduceReqPerBroker] = useState([]);
  const [diskReadData, setDiskReadData] = useState([]);
  const [diskWriteData, setDiskWriteData] = useState([]);
  const [jvmMemoryMemoryUsageData, setJvmMemoryMemoryUsageData] = useState([]);
  const [timeSpentInGCChartData, setTimeSpentInGCChartData] = useState([]);
  const [jvmCpuUsagePieChartData, setJvmCpuUsagePieChartData] = useState([]);

  const setLoading = (key, value) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };
  async function fetchMessagesPerTopic() {
    setLoading("messagesPerTopic", true);

    const expr =
      "sum by(topic) (rate(kafka_server_brokertopicmetrics_bytesoutpersec[1m]))";

    const { start, end } = getTimerangeInMilliseconds(1440);

    try {
      const response = await getKafkaMetrics({ start, end, expr });
      const frames = response?.results?.A?.frames || [];

      const groupedData = {};

      frames.forEach((frame) => {
        const topicName =
          frame?.schema?.fields?.[1]?.labels?.topic ||
          frame?.schema?.fields?.[1]?.config?.displayNameFromDS ||
          "Unknown";

        const timestamps = frame?.data?.values?.[0] || [];
        const values = frame?.data?.values?.[1] || [];

        if (!groupedData[topicName]) {
          groupedData[topicName] = { points: [] };
        }

        for (let i = 0; i < timestamps.length; i++) {
          groupedData[topicName].points.push({
            x: timestamps[i],
            y: values[i],
          });
        }
      });

      setMessagesPerTopic(groupedData);
    } catch (error) {
      toast.error("Error fetching messages per topic data.");
      setMessagesPerTopic([]);
    }finally{
      setLoading("messagesPerTopic", false);
    }
  }

  async function fetchProduceReqRatePerTopic() {
    setLoading("produceRatePerTopic", true);

    const expr =
      "sum by(topic) (rate(kafka_server_brokertopicmetrics_totalproducerequestspersec[1m]))";

    const { start, end } = getTimerangeInMilliseconds(1440);

    try {
      const response = await getKafkaMetrics({ start, end, expr });
      const frames = response?.results?.A?.frames || [];

      const groupedData = {};

      frames.forEach((frame) => {
        const topicName =
          frame?.schema?.fields?.[1]?.labels?.topic ||
          frame?.schema?.fields?.[1]?.config?.displayNameFromDS ||
          "Unknown";

        const timestamps = frame?.data?.values?.[0] || [];
        const values = frame?.data?.values?.[1] || [];

        if (!groupedData[topicName]) {
          groupedData[topicName] = { points: [] };
        }

        for (let i = 0; i < timestamps.length; i++) {
          groupedData[topicName].points.push({
            x: timestamps[i],
            y: values[i],
          });
        }
      });

      setProduceRatePerTopic(groupedData);
    } catch (error) {
      toast.error(error?.message || "Error fetching produce req rate data.");
      setProduceRatePerTopic([]);
    }finally{
      setLoading("produceRatePerTopic", false);
    }
  }

  async function fetchProduceReqPerBroker() {
    setLoading("produceReqPerBroker", true);

    const expr =
      "sum by(instance) (rate(kafka_server_brokertopicmetrics_totalproducerequestspersec[1m]))";

    const { start, end } = getTimerangeInMilliseconds(1440);

    try {
      const response = await getKafkaMetrics({ start, end, expr });
      const frames = response?.results?.A?.frames || [];

      const groupedData = {};

      frames.forEach((frame) => {
        const topicName =
          frame?.schema?.fields?.[1]?.labels?.instance ||
          frame?.schema?.fields?.[1]?.config?.displayNameFromDS ||
          "Unknown";

        const timestamps = frame?.data?.values?.[0] || [];
        const values = frame?.data?.values?.[1] || [];

        if (!groupedData[topicName]) {
          groupedData[topicName] = { points: [] };
        }

        for (let i = 0; i < timestamps.length; i++) {
          groupedData[topicName].points.push({
            x: timestamps[i],
            y: values[i],
          });
        }
      });

      setProduceReqPerBroker(groupedData);
    } catch (error) {
      toast.error("Error fetching messages per topic data.");
      setProduceReqPerBroker([]);
    }finally{
      setLoading("produceReqPerBroker", false);
    }
  }

  async function fetchDiskReadDataForPieChart() {
    setLoading("diskRead", true);

    const expr =
      "sum by(instance) (kafka_server_kafkaserver_linux_disk_read_bytes)";

    const { start, end } = getTimerangeInMilliseconds(0);

    try {
      const response = await getKafkaMetrics({ start, end, expr });
      const frames = response?.results?.A?.frames || [];
      const aggregatedDiskRead = {};

      frames.forEach((frame) => {
        const instanceName = frame?.schema?.fields?.[1]?.labels?.instance;
        const values = frame?.data?.values?.[1] || [];

        if (instanceName) {
          const totalBytesForInstance = values.reduce(
            (sum, current) => sum + current,
            0
          );
          const totalMBForInstance = totalBytesForInstance / (1024 * 1024);
          aggregatedDiskRead[instanceName] = totalMBForInstance;
        }
      });

      const pieChartData = Object.keys(aggregatedDiskRead).map((instance) => ({
        name: `Instance Broker: ${instance}`,
        value: aggregatedDiskRead[instance],
      }));

      setDiskReadData(pieChartData);
    } catch (error) {
      toast.error(error?.message || "Error fetching disk read data.");
    }finally{
      setLoading("diskRead", false);
    }
  }

  async function fetchDiskWriteDataForPieChart() {
    setLoading("diskWrite", true);

    const expr =
      "sum by(instance) (kafka_server_controllerserver_linux_disk_write_bytes)";

    const { start, end } = getTimerangeInMilliseconds(0);

    try {
      const response = await getKafkaMetrics({ start, end, expr });
      const frames = response?.results?.A?.frames || [];
      const aggregatedDiskRead = {};

      frames.forEach((frame) => {
        const instanceName = frame?.schema?.fields?.[1]?.labels?.instance;
        const values = frame?.data?.values?.[1] || [];

        if (instanceName) {
          const totalBytesForInstance = values.reduce(
            (sum, current) => sum + current,
            0
          );
          const totalMBForInstance = totalBytesForInstance / (1024 * 1024);
          aggregatedDiskRead[instanceName] = totalMBForInstance;
        }
      });

      const pieChartData = Object.keys(aggregatedDiskRead).map((instance) => ({
        name: `Instance Broker: ${instance}`,
        value: aggregatedDiskRead[instance],
      }));

      setDiskWriteData(pieChartData);
    } catch (error) {
      toast.error(error?.message || "Error fetching disk read data.");
    }finally{
      setLoading("diskWrite", false);
    }
  }

  async function fetchJvmMemoryUsage() {
    setLoading("jvmMemory", true);
    
    const expr = "sum by(instance) (jvm_memory_used_bytes)";

    const { start, end } = getTimerangeInMilliseconds(0);

    try {
      const response = await getKafkaMetrics({ start, end, expr });
      const frames = response?.results?.A?.frames || [];
      const aggregatedJvmData = {};

      frames.forEach((frame) => {
        const instanceName = frame?.schema?.fields?.[1]?.labels?.instance;
        const values = frame?.data?.values?.[1] || [];

        if (instanceName) {
          const totalBytesForInstance = values.reduce(
            (sum, current) => sum + current,
            0
          );

          const totalBillionBytes = totalBytesForInstance / 1000000000;
          aggregatedJvmData[instanceName] = totalBillionBytes;
        }
      });

      const jvmMemoryData = Object.keys(aggregatedJvmData).map((instance) => ({
        label: `Broker- ${instance}`,
        value: aggregatedJvmData[instance].toFixed(2),
      }));

      setJvmMemoryMemoryUsageData(jvmMemoryData);
    } catch (error) {
      toast.error(error?.message || "Error fetching disk read data.");
    }finally{
      setLoading("jvmMemory", false);
    }
  }

  async function fetchTimeSpentInGC() {
    setLoading("gcTime", true);

    const expr = "sum without(gc) (rate(jvm_gc_collection_seconds_sum[1m]))";

    const { start, end } = getTimerangeInMilliseconds(0);

    try {
      const response = await getKafkaMetrics({ start, end, expr });
      const frames = response?.results?.A?.frames || [];
      const aggregatedGCData = {};

      frames.forEach((frame) => {
        const instanceName = frame?.schema?.fields?.[1]?.labels?.instance;
        const values = frame?.data?.values?.[1] || [];

        if (instanceName) {
          const totalBytesForInstance = values.reduce(
            (sum, current) => sum + current,
            0
          );

          aggregatedGCData[instanceName] = totalBytesForInstance;
        }
      });

      const timeSpendInGCData = Object.keys(aggregatedGCData).map(
        (instance) => ({
          label: instance,
          value: aggregatedGCData[instance].toFixed(6),
        })
      );

      setTimeSpentInGCChartData(timeSpendInGCData);
    } catch (error) {
      toast.error(error?.message || "Error fetching disk read data.");
    }finally{
      setLoading("gcTime", false);
    }
  }

  async function fetchJvmCpuUsage() {
    setLoading("jvmCpu", true);
    
    const expr = "sum by(instance) (process_cpu_seconds_total)";

    const { start, end } = getTimerangeInMilliseconds(0);

    try {
      const response = await getKafkaMetrics({ start, end, expr });
      const frames = response?.results?.A?.frames || [];
      const aggregatedJvmCpuData = {};

      frames.forEach((frame) => {
        const instanceName = frame?.schema?.fields?.[1]?.labels?.instance;
        const values = frame?.data?.values?.[1] || [];

        if (instanceName) {
          const totalBytesForInstance = values.reduce(
            (sum, current) => sum + current,
            0
          );

          aggregatedJvmCpuData[instanceName] = totalBytesForInstance;
        }
      });

      const pieChartData = Object.keys(aggregatedJvmCpuData).map(
        (instance) => ({
          name: `Broker- ${instance}`,
          value: aggregatedJvmCpuData[instance],
        })
      );
      setJvmCpuUsagePieChartData(pieChartData);
    } catch (error) {
      toast.error(error?.message || "Error fetching disk read data.");
    }finally{
      setLoading("jvmCpu", false);
    }
  }

  const fetchData = async () => {
    setIsLoading(true);
    setForceRefresh(true);
    try {
      await Promise.all([
        fetchMessagesPerTopic(),
        fetchProduceReqRatePerTopic(),
        fetchProduceReqPerBroker(),
        fetchDiskReadDataForPieChart(),
        fetchDiskWriteDataForPieChart(),
        fetchJvmMemoryUsage(),
        fetchTimeSpentInGC(),
        fetchJvmCpuUsage(),
      ]);
      setLastRefreshTimestamp(new Date().toLocaleString());
    } catch (error) {
      toast.error("Failed to refresh all Kafka metrics.");
    } finally {
      setForceRefresh(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  return (
    <div className="bg-[#f9fafbce]">
      <h1 className="text-2xl font-semibold">Kafka Monitoring</h1>
      <div className="flex justify-between items-center mt-4">
        {/* Always render the paragraph, but conditionally render the text inside */}
        <p className="text-sm text-gray-500">
          {lastRefreshTimestamp && (
            <>
              Last refreshed: <strong>{lastRefreshTimestamp}</strong>
            </>
          )}
        </p>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className={`flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:text-indigo-600 hover:border-indigo-600 transition-all ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          title="Refresh"
        >
          Refresh
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

          <div className="flex flex-wrap gap-4 mt-6">
        <div className="flex-1 min-w-[300px] max-w-[500px]">
          <KafkaPieChart
            data={diskReadData}
            loading={loadingStates.diskRead}
            title="Disk Read Bytes (MB)"
            tooltipUnit="MB"
          />
        </div>
        <div className="flex-1 min-w-[300px] max-w-[500px]">
          <KafkaPieChart
            data={diskWriteData}
            loading={loadingStates.diskWrite}
            title="Disk Write Bytes (MB)"
            tooltipUnit="MB"
          />
        </div>
        <div className="flex-1 min-w-[300px] max-w-[500px]">
          <KafkaPieChart
            data={jvmCpuUsagePieChartData}
            loading={loadingStates.jvmCpu}
            title="JVM CPU Usage (%)"
            tooltipUnit="CPU seconds"
          />
        </div>
      </div>

      <div className="flex justify-evenly gap-4 mt-10">
        <StatCard
          title="JVM Memory Usage"
          data={jvmMemoryMemoryUsageData}
          unit="Bil"
          icon={<MemoryStick />}
        />
        <StatCard
          title="Time Spent in GC"
          data={timeSpentInGCChartData}
          unit=""
          icon={<Clock />}
        />
      </div>

      <div className="mt-8">
        <GroupedLineChart
          groupedData={messagesPerTopic}
          loading={loadingStates.messagesPerTopic}
          title="Messages in per topic"
          xAxisLabel="Time"
          yAxisLabel="Messages (Bytes/sec)"
        />
        <GroupedLineChart
          groupedData={produceRatePerTopic}
          loading={loadingStates.produceRatePerTopic}
          title="Produce request rate per topic"
          xAxisLabel="Time"
          yAxisLabel="Req/s"
        />
        <GroupedLineChart
          groupedData={produceReqPerBroker}
          loading={loadingStates.produceReqPerBroker}
          title="Produce request per broker"
          xAxisLabel="Time"
          yAxisLabel="Req/s"
        />
      </div>
    </div>
  );
}

export default KafkaMonitoring;
