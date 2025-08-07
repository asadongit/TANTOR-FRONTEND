import React, { useEffect, useState } from "react";
import { Activity, Server, Database, Users, RefreshCw, AlertCircle, CheckCircle, Clock, Plus } from "lucide-react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";

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
      {loading && <div className="text-gray-500">Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {details && (
        <div className="space-y-2 text-sm">
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
  const [consumerGroups, setConsumerGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [modal, setModal] = useState({ type: null, open: false });
  const [form, setForm] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [topicModal, setTopicModal] = useState({ open: false, topic: null });

  const fetchKafkaData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      axios.get(`${hostnameV1}/kafka/brokers`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${hostnameV1}/kafka/topics`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${hostnameV1}/kafka/consumer-groups`, { headers: { Authorization: `Bearer ${token}` } })
    ])
      .then(([brokersRes, topicsRes, groupsRes]) => {
        setBrokers(Array.isArray(brokersRes.data?.brokers) ? brokersRes.data.brokers : []);
        setTopics(Array.isArray(topicsRes.data?.topics) ? topicsRes.data.topics : []);
        setConsumerGroups(Array.isArray(groupsRes.data) ? groupsRes.data : []);
        setLastRefresh(new Date());
      })
      .catch(() => setError("Failed to load Kafka data."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchKafkaData();
  }, [hostnameV1, token]);

  const refreshData = () => {
    fetchKafkaData();
  };

  const getBrokerData = (broker) => ({
    id: broker.id || broker.broker_id || 'Unknown',
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

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
      case "stable":
        return "text-green-600 bg-green-100";
      case "offline":
      case "rebalancing":
        return "text-red-600 bg-red-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "online":
      case "stable":
        return <CheckCircle className="w-4 h-4" />;
      case "offline":
      case "rebalancing":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#8e78b7] animate-spin mx-auto mb-4" />
          <div className="text-lg text-gray-600">Loading Kafka Dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#8e78b7] mb-2">Kafka Dashboard</h1>
            <p className="text-gray-600">Monitor your Kafka cluster in real-time</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <button
              onClick={refreshData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a69a5] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-[#8e78b7]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Brokers</p>
                <p className="text-2xl font-bold text-[#8e78b7]">{brokers.length}</p>
                <p className="text-green-600 text-xs mt-1">
                  {brokers.filter(b => getBrokerData(b).status === 'online').length} online
                </p>
              </div>
              <Server className="w-8 h-8 text-[#8e78b7]" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Topics</p>
                <p className="text-2xl font-bold text-blue-600">{topics.length}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {topics.reduce((sum, topic) => sum + getTopicData(topic).partitions, 0)} partitions
                </p>
              </div>
              <Database className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Consumer Groups</p>
                <p className="text-2xl font-bold text-emerald-600">{consumerGroups.length}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {consumerGroups.reduce((sum, group) => sum + getConsumerGroupData(group).members, 0)} members
                </p>
              </div>
              <Users className="w-8 h-8 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Messages</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatNumber(topics.reduce((sum, topic) => sum + getTopicData(topic).messages, 0))}
                </p>
                <p className="text-gray-500 text-xs mt-1">across all topics</p>
              </div>
              <Activity className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Brokers */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#8e78b7] flex items-center">
                <Server className="w-5 h-5 mr-2" />
                Kafka Brokers
              </h2>
              <button onClick={() => openModal('broker')} className="flex items-center px-3 py-1.5 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a69a5] text-sm">
                <Plus className="w-4 h-4 mr-1" /> Create Broker
              </button>
            </div>
            <div className="space-y-4">
              {brokers.map(broker => {
                const brokerData = getBrokerData(broker);
                return (
                  <div key={brokerData.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(brokerData.status)}`}>
                        {getStatusIcon(brokerData.status)}
                        <span className="ml-1 capitalize">{brokerData.status}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Broker {brokerData.id}</div>
                        <div className="text-sm text-gray-600">{brokerData.host}:{brokerData.port}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">Uptime</div>
                      <div className="text-sm text-gray-600">{brokerData.uptime}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Topics */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#8e78b7] flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Topics
              </h2>
              <button onClick={() => openModal('topic')} className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                <Plus className="w-4 h-4 mr-1" /> Create Topic
              </button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {topics.map(topic => (
                <div key={typeof topic === 'string' ? topic : topic.name} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => setTopicModal({ open: true, topic: typeof topic === 'string' ? topic : topic.name })}>
                  <div className="font-medium text-gray-900 truncate">{typeof topic === 'string' ? topic : topic.name}</div>
                </div>
              ))}
              {topics.length === 0 && <div className="text-gray-400">No topics found.</div>}
            </div>
          </div>

          {/* Consumer Groups */}
          <div className="xl:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#8e78b7] flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Consumer Groups
              </h2>
              <button onClick={() => openModal('consumer')} className="flex items-center px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm">
                <Plus className="w-4 h-4 mr-1" /> Create Consumer
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Group ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">State</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Members</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Lag</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Topics</th>
                  </tr>
                </thead>
                <tbody>
                  {consumerGroups.map(group => {
                    const groupData = getConsumerGroupData(group);
                    return (
                      <tr key={groupData.groupId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{groupData.groupId}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(groupData.state)}`}>
                            {getStatusIcon(groupData.state)}
                            <span className="ml-1 capitalize">{groupData.state}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{groupData.members}</td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${groupData.lag > 100 ? 'text-red-600' : groupData.lag > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {groupData.lag}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {groupData.topics.map(topic => (
                              <span key={topic} className="px-2 py-1 bg-[#8e78b7] bg-opacity-10 text-[#8e78b7] text-xs rounded-full">
                                {topic}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
            <button type="submit" disabled={formLoading} className="w-full bg-[#8e78b7] text-white py-2 rounded-lg hover:bg-[#7a69a5] mt-2">{formLoading ? 'Creating...' : 'Create Broker'}</button>
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
            <button type="submit" disabled={formLoading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 mt-2">{formLoading ? 'Creating...' : 'Create Topic'}</button>
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
    </div>
  );
};

export default KafkaDashboard;
