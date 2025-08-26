import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  X,
  Database,
  List,
  Users,
  Settings,
  BarChart2,
  RefreshCcw,
  Search,
  Plus,
  Minus,
} from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview", icon: Database },
  { id: "messages", label: "Messages", icon: List },
//   { id: "consumers", label: "Consumers", icon: Users },
//   { id: "settings", label: "Settings", icon: Settings },
  { id: "statistics", label: "Statistics", icon: BarChart2 },
];

const TopicModal = ({ open, onClose, topicName, hostnameV1, token }) => {
  const [active, setActive] = useState("overview");
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagesError, setMessagesError] = useState(null);
  const [messageSearch, setMessageSearch] = useState("");

  const [expanded, setExpanded] = useState({});

  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const statsLoadedRef = React.useRef(false);
  const messagesLoadedRef = React.useRef(false);

  const [consumersLoading, setConsumersLoading] = useState(false);
  const [consumersError, setConsumersError] = useState(null);
  const [consumers, setConsumers] = useState([]);

  useEffect(() => {
    if (!open || !topicName) return;
    setActive("overview");

    // reset caches
    statsLoadedRef.current = false;
    messagesLoadedRef.current = false;

    setStats(null);
    setStatsError(null);

    setMessages([]);
    setMessagesError(null);

    setConsumers([]);
    setConsumersError(null);

    // fetch details once
    fetchDetails();
  }, [open, topicName]);

  const fetchDetails = () => {
    setLoadingDetails(true);
    setDetailsError(null);
    setDetails(null);
    axios
      .get(
        `${hostnameV1}/kafka/topic/${encodeURIComponent(topicName)}/details`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => setDetails(res.data))
      .catch((e) =>
        setDetailsError(e.response?.data?.detail || "Failed to load details")
      )
      .finally(() => setLoadingDetails(false));
  };

  const fetchStats = () => {
    if (!topicName) return;
    if (statsLoadedRef.current) return;
    setStatsLoading(true);
    setStatsError(null);
    axios
      .get(
        `${hostnameV1}/kafka/topic/${encodeURIComponent(
          topicName
        )}/statistics?sample_messages=1500`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        setStats(res.data);
        statsLoadedRef.current = true;
      })
      .catch((e) =>
        setStatsError(e.response?.data?.detail || "Failed to load statistics")
      )
      .finally(() => setStatsLoading(false));
  };

  const fetchConsumers = () => {
    if (!topicName) return;
    setConsumersLoading(true);
    setConsumersError(null);
    setConsumers([]);
    axios
      .get(
        `${hostnameV1}/kafka/consumer-groups?page=1&page_size=1000`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        const rows = Array.isArray(res.data?.consumer_groups)
          ? res.data.consumer_groups.filter((g) =>
              Array.isArray(g.topics) ? g.topics.includes(topicName) : false
            )
          : [];
        setConsumers(rows);
      })
      .catch((e) =>
        setConsumersError(e.response?.data?.detail || "Failed to load consumers")
      )
      .finally(() => setConsumersLoading(false));
  };

  const fetchMessages = () => {
    if (!topicName) return;
    // prevent re-fetching when data is already loaded
    if (messagesLoadedRef.current) return;

    setMessagesLoading(true);
    setMessagesError(null);
    setMessages([]);
    axios
      .get(
        `${hostnameV1}/kafka/topic/${encodeURIComponent(topicName)}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            partition: 0,
            offset: 0,
            max_messages: 50,
          },
        }
      )
      .then((res) => {
        const rows = Array.isArray(res.data?.messages) ? res.data.messages : [];
        setMessages(
          rows.map((m) => ({
            partition: m.partition,
            offset: m.offset,
            timestamp: m.timestamp,
            key: m.key ?? null,
            value: m.value ?? null,
          }))
        );
        // mark as loaded only on success
        messagesLoadedRef.current = true;
      })
      .catch((e) => {
        setMessagesError(e.response?.data?.detail || "Failed to load messages");
      })
      .finally(() => setMessagesLoading(false));
  };

  const toggleExpand = (rowKey) => {
    setExpanded((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }));
  };

  useEffect(() => {
    if (active === "messages") fetchMessages();
    if (active === "statistics") fetchStats();
    // if (active === "consumers") fetchConsumers();
  }, [active]);

  if (!open) return null;

  const TabButton = ({ t }) => {
    const Icon = t.icon;
    const activeCls =
      active === t.id
        ? "bg-[#8e78b7] text-white"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200";
    return (
      <button
        onClick={() => setActive(t.id)}
        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeCls}`}
      >
        <Icon className="w-4 h-4 mr-1.5" />
        {t.label}
      </button>
    );
  };

  const visibleMessages = messageSearch
    ? messages.filter(
        (m) =>
          (m.value || "").toLowerCase().includes(messageSearch.toLowerCase()) ||
          (m.key || "").toLowerCase().includes(messageSearch.toLowerCase())
      )
    : messages;

  function previewText(val, max = 120) {
    if (val == null) return null;
    const s =
      typeof val === "string" ? val : (() => { try { return JSON.stringify(val); } catch { return String(val); } })();
    const oneLine = s.replace(/\s+/g, " ").trim();
    return oneLine.length > max ? oneLine.slice(0, max) + "…" : oneLine;
  }
  function prettyJson(val) {
    if (val == null) return "null";
    try {
      const parsed = typeof val === "string" ? JSON.parse(val) : val;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return String(val);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-7xl rounded-xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-[#6b578f]">
              Topic: {topicName}
            </h3>
            <button
              onClick={fetchDetails}
              className="flex items-center text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
              title="Refresh details"
            >
              <RefreshCcw className="w-3 h-3 mr-1" /> Refresh
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 flex flex-wrap gap-2 border-b bg-gray-50">
          {tabs.map((t) => (
            <TabButton key={t.id} t={t} />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 text-sm">
          {loadingDetails && (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#8e78b7] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {detailsError && (
            <div className="bg-red-50 text-red-600 p-4 rounded">
              {detailsError}
            </div>
          )}

          {details && active === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
                <Metric label="Partitions" value={details.partitionCount} />
                <Metric label="Replication Factor" value={details.replicationFactor} />
                <Metric label="Replicas" value={details.replicas} />
                <Metric
                  label="In-Sync Replicas"
                  value={details.inSyncReplicas}
                  tone={
                    details.inSyncReplicas === details.replicas
                      ? "good"
                      : "warn"
                  }
                />
                <Metric
                  label="Under Replicated Partitions"
                  value={details.underReplicatedPartitions}
                  tone={details.underReplicatedPartitions === 0 ? "good" : "warn"}
                />
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="px-4 py-2 font-semibold text-gray-700 bg-gray-100">
                  Partitions
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs md:text-sm">
                    <thead>
                      <tr className="text-left border-b bg-gray-50 text-gray-500">
                        <Th>Partition</Th>
                        <Th>Leader</Th>
                        <Th>Replicas</Th>
                        <Th>Offset Min</Th>
                        <Th>Offset Max</Th>
                        <Th>Messages</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {details.partitions.map((p) => {
                        const msgCount =
                          (p.offsetMax || 0) - (p.offsetMin || 0);
                        return (
                          <tr key={p.partition} className="hover:bg-gray-50">
                            <Td>{p.partition}</Td>
                            <Td>{p.leader ?? "-"}</Td>
                            <Td>
                              <div className="flex flex-wrap gap-1">
                                {p.replicas.map((r) => (
                                  <span
                                    key={`${p.partition}-${r.broker}`}
                                    className={`px-1.5 py-0.5 rounded text-[10px] border ${
                                      r.inSync
                                        ? "bg-green-50 border-green-200 text-green-700"
                                        : "bg-red-50 border-red-200 text-red-600"
                                    }`}
                                    title={`Broker ${r.broker}${
                                      r.leader ? " (Leader)" : ""
                                    }`}
                                  >
                                    {r.broker}
                                    {r.leader}
                                  </span>
                                ))}
                              </div>
                            </Td>
                            <Td>{p.offsetMin}</Td>
                            <Td>{p.offsetMax}</Td>
                            <Td>{msgCount}</Td>
                          </tr>
                        );
                      })}
                      {!details.partitions.length && (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center py-10 text-gray-400"
                          >
                            No partitions
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {details && active === "messages" && (
            <div className="space-y-4">
              {messagesError && (
                <div className="text-red-600 bg-red-50 p-3 rounded">
                  {messagesError}
                </div>
              )}
              {messagesLoading && visibleMessages.length === 0 && (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-[#8e78b7] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <div className="overflow-auto border rounded">
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="text-left bg-gray-50 border-b text-gray-500">
                      <Th></Th>
                      <Th>Offset</Th>
                      <Th>Partition</Th>
                      <Th>Timestamp</Th>
                      <Th>Key</Th>
                      <Th>Content (Preview)</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {visibleMessages.map((m) => {
                      const rowKey = `${m.partition}-${m.offset}`;
                      const isOpen = !!expanded[rowKey];
                      return (
                        <React.Fragment key={rowKey}>
                          <tr className="hover:bg-gray-50">
                            <Td className="w-8">
                              <button
                                onClick={() => toggleExpand(rowKey)}
                                className="p-1 rounded hover:bg-gray-100 text-gray-600"
                                title={isOpen ? "Collapse" : "Expand"}
                              >
                                {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                              </button>
                            </Td>
                            <Td>{m.offset}</Td>
                            <Td>{m.partition}</Td>
                            <Td>{formatTs(m.timestamp)}</Td>
                            <Td className="max-w-[140px] truncate" title={m.key || ""}>
                              {m.key || <span className="text-gray-400">null</span>}
                            </Td>
                            <Td className="max-w-[560px] truncate font-mono" title={m.value || ""}>
                              {previewText(m.value) || <span className="text-gray-400">null</span>}
                            </Td>
                          </tr>
                          {isOpen && (
                            <tr className="bg-gray-50">
                              <td colSpan={6} className="p-0">
                                <div className="p-3">
                                  <pre className="whitespace-pre-wrap break-words font-mono text-[11px] md:text-xs">
                                    {prettyJson(m.value)}
                                  </pre>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {!messagesLoading && visibleMessages.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-gray-400">
                          No messages
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* {active === "consumers" && (
            <div className="space-y-4">
              {consumersError && (
                <div className="text-red-600 bg-red-50 p-3 rounded">
                  {consumersError}
                </div>
              )}
              {consumersLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-[#8e78b7] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto border rounded">
                  <table className="w-full text-xs md:text-sm">
                    <thead>
                      <tr className="text-left bg-gray-50 border-b text-gray-500">
                        <Th>Consumer Group ID</Th>
                        <Th>Active Consumers</Th>
                        <Th>Consumer Lag</Th>
                        <Th>State</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {consumers.map((g) => (
                        <tr key={g.groupId} className="hover:bg-gray-50">
                          <Td className="font-medium">{g.groupId}</Td>
                          <Td>{g.members}</Td>
                          <Td>{g.lag ?? 0}</Td>
                          <Td>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${
                                g.state === "Stable"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {g.state}
                            </span>
                          </Td>
                        </tr>
                      ))}
                      {consumers.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-10 text-gray-400">
                            No consumer groups for this topic
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {details && active === "settings" && (
            <div className="overflow-y-auto space-y-2">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="text-left bg-gray-50 border-b text-gray-500">
                    <Th>Key</Th>
                    <Th>Value</Th>
                    <Th>Default</Th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {Object.entries(details.configs || {}).map(([k, v]) => (
                    <tr key={k} className="hover:bg-gray-50">
                      <Td className="font-medium">{k}</Td>
                      <Td className="break-all">{String(v)}</Td>
                      <Td className="text-gray-400">-</Td>
                    </tr>
                  ))}
                  {Object.keys(details.configs || {}).length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-10 text-center text-gray-400"
                      >
                        No configs
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )} */}

          {active === "statistics" && (
            <div className="space-y-6">
              {statsLoading && (
                <div className="flex justify-center py-16">
                  <div className="w-10 h-10 border-4 border-[#8e78b7] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {statsError && (
                <div className="bg-red-50 text-red-600 p-4 rounded">
                  {statsError}
                </div>
              )}
              {stats && !statsLoading && (
                <>
                  <Section title="Messages">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                      <Metric
                        label="Total number"
                        value={formatNumber(stats.messages.total)}
                      />
                      <Metric
                        label="Offsets min-max"
                        value={`${stats.messages.offset_min} - ${stats.messages.offset_max}`}
                      />
                      <Metric
                        label="Timestamp min-max"
                        value={`${formatTs(stats.messages.timestamp_min)} - ${formatTs(
                          stats.messages.timestamp_max
                        )}`}
                      />
                      <Metric label="Null keys" value={stats.messages.null_keys} />
                      <Metric label="Unique keys" value={stats.messages.unique_keys} />
                      <Metric label="Null values" value={stats.messages.null_values} />
                      <Metric label="Unique values" value={stats.messages.unique_values} />
                    </div>
                  </Section>

                  <Section title="Key size">
                    {renderSizeRow(stats.key_size)}
                  </Section>

                  <Section title="Value size">
                    {renderSizeRow(stats.value_size)}
                  </Section>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Metric = ({ label, value, tone }) => {
  const colors =
    tone === "good"
      ? "bg-green-50 border-green-200"
      : tone === "warn"
      ? "bg-amber-50 border-amber-200"
      : "bg-gray-50 border-gray-200";
  return (
    <div className={`rounded-md p-3 border ${colors}`}>
      <div className="text-[10px] uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="text-sm font-semibold text-gray-800 mt-0.5 break-all">
        {value}
      </div>
    </div>
  );
};

const Th = ({ children, className = "" }) => (
  <th className={`py-2 px-3 font-semibold text-xs ${className}`}>{children}</th>
);
const Td = ({ children, className = "" }) => (
  <td className={`py-2 px-3 align-top ${className}`}>{children}</td>
);


const Section = ({ title, children }) => (
  <div className="space-y-3">
    <div className="font-semibold text-gray-700">{title}</div>
    {children}
  </div>
);

function renderSizeRow(dist) {
  if (!dist) return <div className="text-gray-400">No data</div>;
  const items = [
    ["Total size", formatBytes(dist.total_size)],
    ["Min size", formatBytes(dist.min)],
    ["Max size", formatBytes(dist.max)],
    ["Avg", formatBytes(dist.avg)],
    ["Percentile 50", formatBytes(dist.p50)],
    ["Percentile 75", formatBytes(dist.p75)],
    ["Percentile 95", formatBytes(dist.p95)],
    ["Percentile 99", formatBytes(dist.p99)],
    ["Percentile 999", formatBytes(dist.p999)],
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-9 gap-4">
      {items.map(([k, v]) => (
        <Metric key={k} label={k} value={v} />
      ))}
    </div>
  );
}

function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n;
}
function formatTs(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "-";
  return (
    d.toLocaleDateString(undefined, {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    }) +
    ", " +
    d.toLocaleTimeString(undefined, {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  );
}
function formatBytes(b) {
  if (b === 0) return "0 Bytes";
  if (!b || isNaN(b)) return "-";
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return (b / Math.pow(1024, i)).toFixed(0) + " " + units[i];
}

export default TopicModal;
