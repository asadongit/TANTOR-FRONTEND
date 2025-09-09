import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../../../context/AuthContext";
import { CheckCircle2 } from "lucide-react";

const StatCard = ({ title, value, subtitle }) => (
  <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
    <div className="text-xs text-gray-500">{title}</div>
    <div className="mt-1 text-lg font-semibold text-gray-900">{value}</div>
    {subtitle ? <div className="text-xs text-gray-400 mt-1">{subtitle}</div> : null}
  </div>
);

const BrokersTab = ({ active = false }) => {
  const { token, hostnameV1 } = useAuth();
  const [summary, setSummary] = useState(null);
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, d] = await Promise.all([
        axios.get(`${hostnameV1}/kafka/brokers/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${hostnameV1}/kafka/brokers/details`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setSummary(s.data || {});
      setBrokers(Array.isArray(d.data) ? d.data : []);
      setLoadedOnce(true);
    } catch (e) {
      setError("Failed to load brokers data.");
      setSummary(null);
      setBrokers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (active && !loadedOnce) {
      fetchData();
    }
  }, [active, loadedOnce, hostnameV1, token]);

  const formatBytesMB = (bytes) => {
    if (bytes == null) return "-";
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  const fmt = (n) => (n == null ? "-" : n.toLocaleString());
  const fmtPct = (n) => (n == null ? "-" : `${n > 0 ? "+" : ""}${n.toFixed(2)}%`);

  return (
    <div className="space-y-6">
      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="flex justify-end">
        {/* <button
          onClick={fetchData}
          className="text-sm text-gray-600 hover:text-[#8e78b7]"
          title="Refresh brokers"
        >
          Refresh
        </button> */}
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Uptime</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Broker Count" value={loading ? "…" : fmt(summary?.brokerCount)} />
          <StatCard title="Active Controller" value={loading ? "…" : fmt(summary?.activeControllers)} />
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Partitions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard
            title="Online"
            value={loading ? "…" : fmt(summary?.onlinePartitionCount)}
            subtitle={
              loading || summary == null
                ? ""
                : `of ${fmt((summary?.onlinePartitionCount || 0) + (summary?.offlinePartitionCount || 0))}`
            }
          />
          <StatCard title="URP" value={loading ? "…" : fmt(summary?.underReplicatedPartitionCount)} />
          <StatCard
            title="In Sync Replicas"
            value={loading ? "…" : fmt(summary?.inSyncReplicasCount)}
          />
          <StatCard
            title="Out Of Sync Replicas"
            value={loading ? "…" : fmt(summary?.outOfSyncReplicasCount)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Broker ID</th>
                <th className="px-4 py-3 text-left font-medium">Disk usage</th>
                <th className="px-4 py-3 text-left font-medium">Partitions skew</th>
                <th className="px-4 py-3 text-left font-medium">Leaders</th>
                <th className="px-4 py-3 text-left font-medium">Leader skew</th>
                <th className="px-4 py-3 text-left font-medium">Online partitions</th>
                <th className="px-4 py-3 text-left font-medium">Port</th>
                <th className="px-4 py-3 text-left font-medium">Host</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 w-10 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-40 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-12 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-10 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-12 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-10 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-40 bg-gray-200 rounded" /></td>
                  </tr>
                ))
              ) : brokers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                    No brokers found.
                  </td>
                </tr>
              ) : (
                brokers.map((b) => {
                  const summaryDisk = (summary?.diskUsage || []).find((d) => d.brokerId === b.id);
                  const segSize = formatBytesMB(summaryDisk?.segmentSize);
                  const segCount = summaryDisk?.segmentCount ?? null;
                  return (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-gray-900">{b.id}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {segSize}, {segCount != null ? `${segCount} segment(s)` : "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {b.partitionsSkew == null ? "-" : `${b.partitionsSkew}%`}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{fmt(b.partitionsLeader)}</td>
                      <td className="px-4 py-3 text-gray-700">{fmtPct(b.leadersSkew)}</td>
                      <td className="px-4 py-3 text-gray-700">{fmt(b.partitions)}</td>
                      <td className="px-4 py-3 text-gray-700">{b.port}</td>
                      <td className="px-4 py-3 text-gray-700">{b.host}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BrokersTab;
