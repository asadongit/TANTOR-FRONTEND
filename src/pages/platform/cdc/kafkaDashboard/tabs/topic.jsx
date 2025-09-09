import React, { useEffect, useMemo, useRef, useState } from "react";
import { Database, Search, RefreshCw } from "lucide-react";
import { useAuth } from "../../../../../context/AuthContext";
import TopicModal from "../components/topicModal";

const TopicsTab = ({ active = false }) => {
  const { hostnameV1, token } = useAuth(); // include token
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [showInternal, setShowInternal] = useState(false);
  const wsRef = useRef(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // modal state
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const wsUrl = useMemo(() => {
    try {
      const u = new URL(hostnameV1);
      const proto = u.protocol === "https:" ? "wss:" : "ws:";
      return `${proto}//${u.host}${u.pathname.replace(/\/$/, "")}/ws/kafka/topics/details`;
    } catch {
      return `${hostnameV1.replace(/^http/, "ws").replace(/\/$/, "")}/ws/kafka/topics/details`;
    }
  }, [hostnameV1]);

  const resetData = () => {
    setRows([]);
    setError(null);
  };

  const connect = () => {
    resetData();
    setLoading(true);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          const batch = Array.isArray(data?.batch) ? data.batch : [];
          // Turn off initial loading once any data arrives
          if (batch.length >= 0) setLoading(false);
          setRows((prev) => {
            const merged = [...prev];
            for (const t of batch) {
              const idx = merged.findIndex((r) => r.name === t.name);
              const rec = {
                name: t.name,
                partitions: t.partitions ?? 0,
                replicas: t.replicas ?? 0,
                messages: t.messages ?? 0,
              };
              if (idx >= 0) merged[idx] = rec;
              else merged.push(rec);
            }
            return merged;
          });
        } catch (e) {
          setError("Failed to parse topics update.");
          setLoading(false);
        }
      };

      ws.onopen = () => {
      };

      ws.onerror = () => {
        setError("WebSocket error while loading topics.");
      };

      ws.onclose = () => {
        setLoading(false);
        setLoadedOnce(true);
      };
    } catch (e) {
      setError("Unable to open WebSocket.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (active && !loadedOnce && !wsRef.current) {
      connect();
    }
  }, [active, loadedOnce, wsUrl]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
        wsRef.current = null;
      }
    };
  }, []);

  const handleRefresh = () => {
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }
    setLoadedOnce(false);
    setPage(1);
    connect();
  };

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return rows
      .filter((r) => (showInternal ? true : !r.name.startsWith("_")))
      .filter((r) => (ql ? r.name.toLowerCase().includes(ql) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, q, showInternal]);

  useEffect(() => {
    setPage(1);
  }, [q, showInternal]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleOpenTopic = (name) => {
    setSelectedTopic(name);
    setModalOpen(true);
  };

  return (
    <div className="">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          {/* <Database className="w-5 h-5 mr-2 text-indigo-500" />
          Topics */}
        </h2>
        <div className="flex items-center gap-4">

          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#8e78b7]"
            title="Refresh topics"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            placeholder="Search by Topic Name"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </div>

      {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Topic Name</th>
              <th className="px-4 py-3 text-left font-medium">Partitions</th>
              {/* <th className="px-4 py-3 text-left font-medium">Out of sync replicas</th> */}
              <th className="px-4 py-3 text-left font-medium">Replication Factor</th>
              <th className="px-4 py-3 text-left font-medium">Number of messages</th>
              {/* <th className="px-4 py-3 text-left font-medium">Size</th> */}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && rows.length === 0 ? (
              [...Array(pageSize)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3"><div className="h-4 w-64 bg-gray-200 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-10 bg-gray-200 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-10 bg-gray-200 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  {loadedOnce ? "No topics found." : "No data yet."}
                </td>
              </tr>
            ) : (
              paged.map((t) => (
                <tr key={t.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">
                    <button
                      className="text-[#6b578f] hover:underline hover:text-[#8e78b7] cursor-pointer"
                      onClick={() => handleOpenTopic(t.name)}
                      title="View topic details"
                    >
                      {t.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{t.partitions}</td>
                  {/* <td className="px-4 py-3 text-gray-700">{t.outOfSync}</td> */}
                  <td className="px-4 py-3 text-gray-700">{t.replicas}</td>
                  <td className="px-4 py-3 text-gray-700">{t.messages.toLocaleString()}</td>
                  {/* <td className="px-4 py-3 text-gray-700">{t.sizeText}</td> */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <div>
          Page {filtered.length === 0 ? 0 : page} of {totalPages} • {filtered.length.toLocaleString()} topics
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1 || (loading && rows.length === 0)}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`px-3 py-1 rounded border ${page <= 1 || (loading && rows.length === 0) ? "text-gray-300 border-gray-200" : "text-gray-700 border-gray-300 hover:bg-gray-50"}`}
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages || (loading && rows.length === 0)}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={`px-3 py-1 rounded border ${page >= totalPages || (loading && rows.length === 0) ? "text-gray-300 border-gray-200" : "text-gray-700 border-gray-300 hover:bg-gray-50"}`}
          >
            Next
          </button>
        </div>
      </div>

      {/* Topic details modal */}
      {modalOpen && (
        <TopicModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          topicName={selectedTopic}
          hostnameV1={hostnameV1}
          token={token}
        />
      )}
    </div>
  );
};

export default TopicsTab;
