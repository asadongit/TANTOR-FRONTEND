import React, { useEffect, useState, useCallback } from "react";
import { Activity, Server, Database, Users, RefreshCw, AlertCircle, CheckCircle, Clock, Plus, Trash2, Search, ActivityIcon } from "lucide-react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Modal component
const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        <h3 className="text-lg font-semibold mb-4 text-[#8e78b7]">{title}</h3>
        {children}
      </div>
    </div>
  );
};

// Add TopicDetailsModal
const TopicDetailsModal = ({ open, onClose, topicName, hostnameV1, token }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !topicName) return;
    setLoading(true);
    setError(null);
    setDetails(null);
    axios.get(`${hostnameV1}/kafka/topics/${encodeURIComponent(topicName)}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setDetails(res.data))
      .catch(() => setError('Failed to fetch topic details.'))
      .finally(() => setLoading(false));
  }, [open, topicName, hostnameV1, token]);

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={`Topic Details: ${topicName}`}>
  {loading && (
    <div className="text-center text-blue-500 font-semibold py-4">Loading...</div>
  )}

  {error && (
    <div className="bg-red-100 text-red-700 p-3 rounded-md my-2 text-center font-semibold">
      {error}
    </div>
  )}

  {details && (
    <div className="space-y-3 text-sm max-h-[60vh] overflow-y-auto font-sans">
      {Object.entries(details).map(([key, value]) => {
        // Color coding for some known keys
        let keyColorClass = "text-sky-600"; // default color
        if (key.toLowerCase().includes("partition")) keyColorClass = "text-green-600";
        else if (key.toLowerCase().includes("replication")) keyColorClass = "text-blue-600";
        else if (key.toLowerCase().includes("config")) keyColorClass = "text-yellow-600";
        else if (key.toLowerCase().includes("error")) keyColorClass = "text-red-600";

        return (
          <div key={key} className="flex flex-col md:flex-row md:items-start md:space-x-2 break-words">
            <span className={`font-semibold capitalize min-w-[150px] ${keyColorClass}`}>
              {key}:
            </span>
            <pre className="whitespace-pre-wrap text-gray-900 flex-1 bg-gray-100 rounded-md p-2 shadow-sm">
              {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
            </pre>
          </div>
        );
      })}
    </div>
  )}
</Modal>

  );
};

// Add ConsumerGroupDetailsModal
const ConsumerGroupDetailsModal = ({ open, onClose, groupId, hostnameV1, token }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !groupId) return;
    setLoading(true);
    setError(null);
    setDetails(null);
    axios.get(`${hostnameV1}/kafka/consumer-groups/${encodeURIComponent(groupId)}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setDetails(res.data))
      .catch(() => setError('Failed to fetch consumer group details.'))
      .finally(() => setLoading(false));
  }, [open, groupId, hostnameV1, token]);

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={`Consumer Group Details: ${groupId}`}>
      {loading && <div className="text-gray-500">Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {details && (
        <div className="space-y-2 text-sm max-h-[60vh] overflow-y-auto">
          {Object.entries(details).map(([key, value]) => (
            <div key={key}>
              <span className="font-medium text-gray-700">{key}:</span> <span className="text-gray-900">{JSON.stringify(value)}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

const KafkaDashboard = () => {
  const { token, hostnameV1 } = useAuth();
  const [brokers, setBrokers] = useState([]);
  const [topics, setTopics] = useState([]);
  const [topicsDetails, setTopicsDetails] = useState([]);
  const [consumerGroups, setConsumerGroups] = useState([]);
  const [consumerGroupsDetails, setConsumerGroupsDetails] = useState([]);
  const [messagesTotal, setMessagesTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [modal, setModal] = useState({ type: null, open: false });
  const [form, setForm] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [topicModal, setTopicModal] = useState({ open: false, topic: null });
  const [consumerModal, setConsumerModal] = useState({ open: false, groupId: null });
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [hasMoreTopics, setHasMoreTopics] = useState(true);
  const [topicsBatchStart, setTopicsBatchStart] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [initialLoaded, setInitialLoaded] = useState(false);
  const didFetchRef = React.useRef(false);

  const navigate = useNavigate();

  // Fetch all Kafka data (APIs)
  const fetchKafkaData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        brokersRes,
        topicsRes,
        groupsRes,
        msgRes
      ] = await Promise.all([
        axios.get(`${hostnameV1}/kafka/brokers`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${hostnameV1}/kafka/topics/count`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${hostnameV1}/kafka/consumer-groups`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${hostnameV1}/kafka/messages/total`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setBrokers(Array.isArray(brokersRes.data?.brokers) ? brokersRes.data.brokers : []);
      setTopics(Array.isArray(topicsRes.data?.topics) ? topicsRes.data.topics : []);
      setConsumerGroups(Array.isArray(groupsRes.data?.consumer_groups) ? groupsRes.data.consumer_groups : []);
      setMessagesTotal(msgRes.data?.total_messages || 0);
      setLastRefresh(new Date());
      setInitialLoaded(true);
    } catch {
      setError("Failed to load Kafka data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    fetchKafkaData();
  }, [hostnameV1, token]);

  useEffect(() => {
    if (!initialLoaded) return;
    setLoadingTopics(true);
    setTopicsDetails([]);
    setHasMoreTopics(true);
    setTopicsBatchStart(0);

    const ws = new WebSocket(`${hostnameV1.replace(/^http/, "ws")}/ws/kafka/topics/details`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setTopicsDetails(prev => [...prev, ...data.batch]);
      setTopicsBatchStart(data.end);
      setHasMoreTopics(data.end < data.total);
      setLoadingTopics(false);
    };
    ws.onerror = () => {
      setLoadingTopics(false);
      setHasMoreTopics(false);
    };
    ws.onclose = () => {
      setLoadingTopics(false);
    };
    window._kafkaTopicsWS = ws;
    return () => ws.close();
  }, [initialLoaded, hostnameV1]);

  const refreshData = () => {
    fetchKafkaData();
  };

  const getBrokerData = (broker) => ({
    id: broker.id || broker.node_id || 'Unknown',
    host: broker.host || 'Unknown',
    port: broker.port || 'Unknown',
    status: broker.status || (broker.host ? 'online' : 'unknown'),
    uptime: broker.uptime || 'N/A'
  });

  const getTopicData = (topic) => ({
    name: topic.name || topic.topic_name || 'Unknown',
    partitions: topic.partitions || topic.partition_count || 0,
    replicas: topic.replicas || topic.replication_factor || 0,
    messages: topic.messages || topic.message_count || 0,
    size: topic.size || 'N/A'
  });

  const getConsumerGroupData = (group) => ({
    groupId: group.groupId || group.group_id || 'Unknown',
    state: group.state || group.status || 'unknown',
    members: group.members || group.member_count || 0,
    lag: group.lag || group.total_lag || 0,
    topics: group.topics || group.subscribed_topics || []
  });

  const handleTopicsScroll = (e) => {
    const el = e.target;
    if (hasMoreTopics && !loadingTopics && el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
      setLoadingTopics(true);
    }
  };



  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  // Modal open/close helpers
  const openModal = (type) => {
    setForm({});
    setFormError(null);
    setModal({ type, open: true });
  };
  const closeModal = () => setModal({ type: null, open: false });

  // Form submit handlers
  const handleCreateBroker = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      await axios.post(`${hostnameV1}/kafka/brokers`, form, { headers: { Authorization: `Bearer ${token}` } });
      closeModal();
      fetchKafkaData();
    } catch (err) {
      setFormError("Failed to create broker.");
    } finally {
      setFormLoading(false);
    }
  };
  const handleCreateTopic = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      await axios.post(`${hostnameV1}/kafka/topics`, form, { headers: { Authorization: `Bearer ${token}` } });
      closeModal();
      fetchKafkaData();
    } catch (err) {
      setFormError("Failed to create topic.");
    } finally {
      setFormLoading(false);
    }
  };
  const handleCreateConsumer = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      await axios.post(`${hostnameV1}/kafka/consumer-groups`, form, { headers: { Authorization: `Bearer ${token}` } });
      closeModal();
      fetchKafkaData();
    } catch (err) {
      setFormError("Failed to create consumer group.");
    } finally {
      setFormLoading(false);
    }
  };

  const filteredTopicsDetails = searchTerm
    ? topicsDetails.slice(0, topicsBatchStart).filter(
        details =>
          details.name &&
          details.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : topicsDetails.slice(0, topicsBatchStart);

  if (loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#8e78b7] animate-spin mx-auto mb-4" />
          <div className="text-lg text-gray-600">Loading Kafka Dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
       <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <div className="text-lg text-red-600">{error}</div>
          <button
            onClick={refreshData}
            className="mt-4 px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a69a5] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ✅ MAIN DASHBOARD JSX RETURN
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-medium text-[#8e78b7] mb-1">Kafka Dashboard</h1>
            <p className="text-gray-500 flex items-center">
              <Server className="w-4 h-4 mr-2" />
              Cluster Status: {brokers.filter(b => getBrokerData(b).status === 'online').length} of {brokers.length} brokers online
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <button
              onClick={() => {navigate("/monitoring/kafka")}}
              // disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#6b578f] transition-colors disabled:opacity-50 shadow-sm"
            >
              <ActivityIcon className={`w-4 h-4`} />
              <span>Show Metrics</span>
            </button>
            <div className="bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200 text-sm text-gray-500 flex items-center">
              <Clock className="w-4 h-4 mr-1.5 text-blue-500" />
              Updated {lastRefresh.toLocaleTimeString()}
            </div>
            <button
              onClick={refreshData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#6b578f] transition-colors disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Server className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Brokers</h3>
                <p className="text-sm text-gray-500">{brokers.filter(b => getBrokerData(b).status === 'online').length} online</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <Database className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Active Topics</h3>
                <p className="text-sm text-gray-500">{topics.length} topics</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Consumer Groups</h3>
                <p className="text-sm text-gray-500">{consumerGroups.reduce((sum, group) => sum + getConsumerGroupData(group).members, 0)} members</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Messages</h3>
                <p className="text-sm text-gray-500">{formatNumber(messagesTotal)} across all topics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Brokers */}
          <div className="bg-white rounded-xl shadow-md p-6 xl:col-span-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Server className="w-5 h-5 mr-2 text-blue-500" />
                Kafka Brokers
              </h2>
              {/* <button onClick={() => openModal('broker')} className="flex items-center px-3 py-1.5 bg-[#8e78b7] text-white rounded-lg hover:bg-[#6b578f] text-sm shadow-sm">
                <Plus className="w-4 h-4 mr-1" /> Add
              </button> */}
            </div>
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
              {brokers.map(broker => {
                const brokerData = getBrokerData(broker);
                return (
                  <div key={brokerData.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#8e78b7] transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${brokerData.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <div className="font-medium text-gray-900">Broker ID: {brokerData.id}</div>
                        <div className="text-xs text-gray-500">{brokerData.host}:{brokerData.port}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Uptime</div>
                      <div className="text-sm font-medium text-gray-900">{brokerData.uptime}</div>
                    </div>
                  </div>
                );
              })}
              {brokers.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Server className="w-12 h-12 mx-auto opacity-20 mb-3" />
                  <p>No brokers available</p>
                </div>
              )}
            </div>
          </div>

          {/* Topics */}
          <div className="bg-white rounded-xl shadow-md p-6 xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Database className="w-5 h-5 mr-2 text-indigo-500" />
                Topics
              </h2>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search topic..."
                    className="w-64 px-4 py-2 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 text-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
                </div>
                <span className="text-sm text-gray-500">{topicsDetails.length} topics</span>
                <button onClick={() => openModal('topic')} className="flex items-center px-3 py-1.5 bg-[#8e78b7] text-white rounded-lg hover:bg-[#6b578f] text-sm shadow-sm">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </button>
              </div>
            </div>

            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin"
              onScroll={handleTopicsScroll}
            >
              {filteredTopicsDetails.map(details => (
                <div
                  key={details.name}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#8e78b7] hover:bg-indigo-50/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate max-w-[200px]" title={details.name}>{details.name}</h3>
                    <div className="flex items-center space-x-2">
                      {/* <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{details.size || '--'}</span> */}
                      <button
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete topic"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex flex-col">
                      <span className="text-gray-500">Partitions</span>
                      <span className="font-medium text-gray-900">{details.partitions}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Replicas</span>
                      <span className="font-medium text-gray-900">{details.replicas}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Messages</span>
                      <span className="font-medium text-gray-900">{formatNumber(details.messages)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {loadingTopics && (
                <div className="md:col-span-2 flex justify-center py-6">
                  <div className="w-8 h-8 border-4 border-[#8e78b7] border-t-[#6b578f] rounded-full animate-spin"></div>
                </div>
              )}

              {!loadingTopics && !hasMoreTopics && filteredTopicsDetails.length === 0 && (
                <div className="md:col-span-2 text-center py-10 text-gray-400">
                  <Database className="w-12 h-12 mx-auto opacity-20 mb-3" />
                  <p>No topics found</p>
                </div>
              )}
            </div>
          </div>

          {/* Consumer Groups */}
          <div className="xl:col-span-3 bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Users className="w-5 h-5 mr-2 text-teal-500" />
                Consumer Groups
              </h2>
              <button onClick={() => openModal('consumer')} className="flex items-center px-3 py-1.5 bg-[#8e78b7] text-white rounded-lg hover:bg-[#6b578f] text-sm shadow-sm">
                <Plus className="w-4 h-4 mr-1" /> Add
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Group ID</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">State</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Members</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Lag</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Subscribed Topics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {consumerGroups.map(group => {
                    const groupData = getConsumerGroupData(group);
                    return (
                      <tr
                        key={groupData.groupId}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setConsumerModal({ open: true, groupId: groupData.groupId })}
                      >
                        <td className="py-3 px-4 font-medium text-gray-900 truncate max-w-[200px]" title={groupData.groupId}>{groupData.groupId}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                            ${groupData.state === 'stable' ? 'bg-green-100 text-green-800' :
                              groupData.state === 'rebalancing' ? 'bg-yellow-100 text-yellow-800' :
                              groupData.state === 'offline' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5
                              ${groupData.state === 'stable' ? 'bg-green-600' :
                                groupData.state === 'rebalancing' ? 'bg-yellow-600' :
                                groupData.state === 'offline' ? 'bg-red-600' :
                                'bg-gray-600'}`}>
                            </span>
                            {groupData.state}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{groupData.members}</td>
                        <td className="py-3 px-4">
                          <span className={`font-medium
                            ${groupData.lag > 1000 ? 'text-red-600' :
                              groupData.lag > 100 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {formatNumber(groupData.lag)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {groupData.topics.slice(0, 3).map(topic => (
                              <span key={topic} className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded-full border border-teal-100">
                                {topic}
                              </span>
                            ))}
                            {groupData.topics.length > 3 && (
                              <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                                +{groupData.topics.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {consumerGroups.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <Users className="w-12 h-12 mx-auto opacity-20 mb-3" />
                  <p>No consumer groups available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Create Broker/Topic/Consumer */}
      <Modal open={modal.open} onClose={closeModal} title={modal.type === 'broker' ? 'Create Broker' : modal.type === 'topic' ? 'Create Topic' : 'Create Consumer Group'}>
        {modal.type === 'broker' && (
          <form onSubmit={handleCreateBroker} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Host</label>
              <input type="text" required className="mt-1 w-full border rounded px-3 py-2" value={form.host || ''} onChange={e => setForm(f => ({ ...f, host: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Port</label>
              <input type="number" required className="mt-1 w-full border rounded px-3 py-2" value={form.port || ''} onChange={e => setForm(f => ({ ...f, port: e.target.value }))} />
            </div>
            {formError && <div className="text-red-500 text-sm">{formError}</div>}
            <button type="submit" disabled={formLoading} className="w-full bg-[#8e78b7] text-white py-2 rounded-lg hover:bg-[#6b578f] mt-2">{formLoading ? 'Creating...' : 'Create Broker'}</button>
          </form>
        )}
        {modal.type === 'topic' && (
          <form onSubmit={handleCreateTopic} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Topic Name</label>
              <input type="text" required className="mt-1 w-full border rounded px-3 py-2" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Partitions</label>
              <input type="number" min="1" required className="mt-1 w-full border rounded px-3 py-2" value={form.partitions || ''} onChange={e => setForm(f => ({ ...f, partitions: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Replication Factor</label>
              <input type="number" min="1" required className="mt-1 w-full border rounded px-3 py-2" value={form.replication_factor || ''} onChange={e => setForm(f => ({ ...f, replication_factor: e.target.value }))} />
            </div>
            {formError && <div className="text-red-500 text-sm">{formError}</div>}
            <button type="submit" disabled={formLoading} className="w-full bg-[#8e78b7] text-white py-2 rounded-lg hover:bg-[#6b578f] mt-2">{formLoading ? 'Creating...' : 'Create Topic'}</button>
          </form>
        )}
        {modal.type === 'consumer' && (
          <form onSubmit={handleCreateConsumer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Group ID</label>
              <input type="text" required className="mt-1 w-full border rounded px-3 py-2" value={form.group_id || ''} onChange={e => setForm(f => ({ ...f, group_id: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Topics</label>
              <select multiple className="mt-1 w-full border rounded px-3 py-2" value={form.topics || []} onChange={e => setForm(f => ({ ...f, topics: Array.from(e.target.selectedOptions, o => o.value) }))}>
                {topics.map(topic => {
                  const topicData = getTopicData(topic);
                  return <option key={topicData.name} value={topicData.name}>{topicData.name}</option>;
                })}
              </select>
              <span className="text-xs text-gray-400">Hold Ctrl (Windows) or Cmd (Mac) to select multiple topics</span>
            </div>
            {formError && <div className="text-red-500 text-sm">{formError}</div>}
            <button type="submit" disabled={formLoading} className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 mt-2">{formLoading ? 'Creating...' : 'Create Consumer Group'}</button>
          </form>
        )}
      </Modal>

      {/* Topic Details Modal */}
      <TopicDetailsModal open={topicModal.open} onClose={() => setTopicModal({ open: false, topic: null })} topicName={topicModal.topic} hostnameV1={hostnameV1} token={token} />

      {/* Consumer Group Details Modal */}
      <ConsumerGroupDetailsModal open={consumerModal.open} onClose={() => setConsumerModal({ open: false, groupId: null })} groupId={consumerModal.groupId} hostnameV1={hostnameV1} token={token} />
    </div>
  );
};

export default KafkaDashboard;
