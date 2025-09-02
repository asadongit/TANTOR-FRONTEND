import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Users, Search, RefreshCw } from "lucide-react";
import { useAuth } from "../../../../../context/AuthContext";

const SortIndicator = ({ dir }) => (
  <span className="ml-1 inline-block text-xs text-gray-400">{dir === "asc" ? "▲" : "▼"}</span>
);

const ConsumerGroupsTab = ({ active = false }) => {
  const { token, hostnameV1 } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [sortKey, setSortKey] = useState("groupId");
  const [sortDir, setSortDir] = useState("asc");

  const fetchData = async (pageArg = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${hostnameV1}/kafka/consumer-groups`, {
        params: { page: pageArg, page_size: pageSize },
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows(res.data?.consumer_groups ?? []);
      setTotalPages(res.data?.total_pages ?? 1);
      setTotal(res.data?.total ?? 0);
      setLoadedOnce(true);
    } catch (e) {
      setError("Failed to load consumer groups.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (active && !loadedOnce) {
      fetchData(1);
      setPage(1);
    }
  }, [active, loadedOnce, hostnameV1, token]);

  useEffect(() => {
    if (active && loadedOnce) {
      fetchData(page);
    }
  }, [page, pageSize, active]);

  const onSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filteredSorted = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const base = rows.filter((r) =>
      ql ? (r.groupId || "").toLowerCase().includes(ql) : true
    );

    const getter = (r) => {
      switch (sortKey) {
        case "members": return r.members ?? 0;
        case "topics": return (r.topics?.length ?? 0);
        case "lag": return r.lag ?? 0;
        case "coordinator": return r.coordinator ?? "";
        case "state": return r.state ?? "";
        default: return r.groupId ?? "";
      }
    };

    const sorted = [...base].sort((a, b) => {
      const av = getter(a);
      const bv = getter(b);
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

    return sorted;
  }, [rows, q, sortKey, sortDir]);

  const stateBadge = (state) => {
    const s = (state || "").toUpperCase();
    const cls =
      s === "STABLE"
        ? "bg-green-100 text-green-700"
        : s === "EMPTY"
        ? "bg-gray-100 text-gray-700"
        : s === "DEAD"
        ? "bg-red-100 text-red-700"
        : "bg-yellow-100 text-yellow-700";
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{s || "UNKNOWN"}</span>;
  };

  const handleRefresh = () => {
    fetchData(page);
  };

  return (
    <div className="">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          {/* <Users className="w-5 h-5 mr-2 text-teal-500" />
          Consumers */}
        </h2>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#8e78b7]"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="mb-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            placeholder="Search by Consumer Group ID"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-10 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
              title="Clear"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium cursor-pointer select-none" onClick={() => onSort("groupId")}>
                Group ID {sortKey === "groupId" && <SortIndicator dir={sortDir} />}
              </th>
              <th className="px-4 py-3 text-left font-medium cursor-pointer select-none" onClick={() => onSort("members")}>
                Num Of Members {sortKey === "members" && <SortIndicator dir={sortDir} />}
              </th>
              <th className="px-4 py-3 text-left font-medium cursor-pointer select-none" onClick={() => onSort("topics")}>
                Num Of Topics {sortKey === "topics" && <SortIndicator dir={sortDir} />}
              </th>
              <th className="px-4 py-3 text-left font-medium cursor-pointer select-none" onClick={() => onSort("lag")}>
                Consumer Lag {sortKey === "lag" && <SortIndicator dir={sortDir} />}
              </th>
              <th className="px-4 py-3 text-left font-medium cursor-pointer select-none" onClick={() => onSort("coordinator")}>
                Coordinator {sortKey === "coordinator" && <SortIndicator dir={sortDir} />}
              </th>
              <th className="px-4 py-3 text-left font-medium cursor-pointer select-none" onClick={() => onSort("state")}>
                State {sortKey === "state" && <SortIndicator dir={sortDir} />}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3"><div className="h-4 w-80 bg-gray-200 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-10 bg-gray-200 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-10 bg-gray-200 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-12 bg-gray-200 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-8 bg-gray-200 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-200 rounded-full" /></td>
                </tr>
              ))
            ) : filteredSorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  {loadedOnce ? "No consumer groups found." : "No data yet."}
                </td>
              </tr>
            ) : (
              filteredSorted.map((g) => (
                <tr key={g.groupId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{g.groupId}</td>
                  <td className="px-4 py-3 text-gray-700">{g.members ?? 0}</td>
                  <td className="px-4 py-3 text-gray-700">{g.topics?.length ?? 0}</td>
                  <td className="px-4 py-3 text-gray-700">{g.lag ?? "N/A"}</td>
                  <td className="px-4 py-3 text-gray-700">{g.coordinator ?? "N/A"}</td>
                  <td className="px-4 py-3">{stateBadge(g.state)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <div>
          Page {total === 0 ? 0 : page} of {totalPages} • {total.toLocaleString()} groups
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1 || loading}
            onClick={() => {
              setLoading(true);
              setPage((p) => Math.max(1, p - 1));
            }}
            className={`px-3 py-1 rounded border ${page <= 1 || loading ? "text-gray-300 border-gray-200" : "text-gray-700 border-gray-300 hover:bg-gray-50"}`}
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages || loading}
            onClick={() => {
              setLoading(true);
              setPage((p) => Math.min(totalPages, p + 1));
            }}
            className={`px-3 py-1 rounded border ${page >= totalPages || loading ? "text-gray-300 border-gray-200" : "text-gray-700 border-gray-300 hover:bg-gray-50"}`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsumerGroupsTab;
