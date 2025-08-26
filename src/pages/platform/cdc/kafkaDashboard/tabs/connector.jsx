import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import { Plus, Minus, RefreshCcw, Copy, Search, Upload, Download } from 'lucide-react'; // added Upload, Download

function Connector({ active }) {
  const { token, hostnameV1 } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectors, setConnectors] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [copiedFor, setCopiedFor] = useState(null);
  const loadedRef = React.useRef(false);
  const socketRef = React.useRef(null);
  const totalRef = React.useRef(null);

  // NEW: search + pagination
  const [search, setSearch] = useState('');
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);

  // NEW: Import modal state
  const [showImport, setShowImport] = useState(false);
  const [importMode, setImportMode] = useState('json'); // 'json' | 'form'
  const [newName, setNewName] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [formConfig, setFormConfig] = useState({
    connector_class: '',
    tasks_max: '',
    topic: '',
    topics: ''
  });
  const [extraPairs, setExtraPairs] = useState([{ key: '', value: '' }]);
  const [importErr, setImportErr] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const toWsBase = (base) => {
    try {
      const u = new URL(base);
      u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
      return u.toString().replace(/\/$/, '');
    } catch {
      return base.startsWith('https')
        ? base.replace(/^https:/, 'wss:')
        : base.replace(/^http:/, 'ws:');
    }
  };

  const openSocket = () => {
    if (!active) return;
    // close any existing socket
    try { socketRef.current?.close(); } catch {}
    socketRef.current = null;

    // reset state
    setError(null);
    setConnectors([]);
    setLoading(true);
    totalRef.current = null;

    const wsUrl = `${toWsBase(hostnameV1)}/ws/kafka/connect/connectors`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      loadedRef.current = true;
    };

    socket.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data || '{}');
        if (typeof msg.total === 'number') {
          totalRef.current = msg.total;
        }
        if (msg.connector) {
          setConnectors((prev) => [...prev, msg.connector]);
          setLoading(false);
        }
        if (msg.error) {
          setError(String(msg.error));
          setLoading(false);
        }
        if (msg.done) {
          setLoading(false);
        }
      } catch (e) {
        // ignore malformed messages
      }
    };

    socket.onerror = () => {
      setError('WebSocket error while loading connectors');
      setLoading(false);
    };

    socket.onclose = () => {
      setLoading(false);
    };
  };

  const refreshStream = () => {
    loadedRef.current = false;
    setPage(1);            // reset page on refresh
    openSocket();
  };

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Clamp page when connectors list changes (streaming)
  const filtered = useMemo(() => {
    const q = (search || '').toLowerCase();
    if (!q) return connectors;
    return connectors.filter((c) => {
      const name = (c.name || c.connector || '').toString().toLowerCase();
      return name.includes(q);
    });
  }, [connectors, search]);

  const totalPages = Math.max(1, Math.ceil((filtered?.length || 0) / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    if (active && !loadedRef.current) {
      openSocket();
    }
    return () => {
      try { socketRef.current?.close(); } catch {}
      socketRef.current = null;
    };
  }, [active, hostnameV1 /* token not used for WS here */]);

  const Th = ({ children, className = '' }) => (
    <th className={`py-2 px-3 font-semibold text-xs ${className}`}>{children}</th>
  );
  const Td = ({ children, className = '' }) => (
    <td className={`py-2 px-3 align-top ${className}`}>{children}</td>
  );

  function pretty(val) {
    try {
      return JSON.stringify(val ?? {}, null, 2);
    } catch {
      return String(val ?? '');
    }
  }

  const exportConnector = (c) => {
    try {
      const name = c.name || c.connector || 'connector';
      const data = {
        name,
        type: c.type || c.status?.type || null,
        config: c.config ?? null,
        tasks: c.tasks ?? c.status?.tasks ?? null,
        status: c.status ?? null
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `connector-${name}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const handleImportSubmit = async () => {
    setImportErr(null);
    setSubmitting(true);
    try {
      let payload = null;

      if (importMode === 'json') {
        let parsed;
        try {
          parsed = JSON.parse(jsonText || '{}');
        } catch (e) {
          throw new Error('Invalid JSON provided');
        }
        if (parsed && typeof parsed === 'object' && parsed.name && parsed.config) {
          payload = parsed;
        } else {
          if (!newName) throw new Error('Connector name is required');
          payload = { name: newName, config: parsed };
        }
      } else {
        if (!newName) throw new Error('Connector name is required');
        const cfg = {};
        if (formConfig.connector_class) cfg['connector.class'] = formConfig.connector_class;
        if (formConfig.tasks_max) cfg['tasks.max'] = String(formConfig.tasks_max);
        if (formConfig.topic) cfg['topic'] = formConfig.topic;
        if (formConfig.topics) cfg['topics'] = formConfig.topics;
        extraPairs.forEach(({ key, value }) => {
          if (key) cfg[key] = value ?? '';
        });
        payload = { name: newName, config: cfg };
      }

      const res = await fetch(`${hostnameV1}/kafka/connect/connectors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Import failed (${res.status}): ${txt || res.statusText}`);
      }
      // success
      setShowImport(false);
      setNewName('');
      setJsonText('');
      setFormConfig({ connector_class: '', tasks_max: '', topic: '', topics: '' });
      setExtraPairs([{ key: '', value: '' }]);
      refreshStream();
    } catch (e) {
      setImportErr(String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  };

  const onUploadFile = async (file) => {
    if (!file) return;
    try {
      const txt = await file.text();
      setJsonText(txt);
    } catch {}
  };

  return (
    <div className={active ? 'block' : 'hidden'}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-[#6b578f]"></h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search connectors"
              className="pl-7 pr-3 py-1.5 text-xs border rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7]"
              type="text"
            />
          </div>

          <button
            onClick={() => { setShowImport(true); setImportErr(null); }}
            className="flex items-center text-xs px-2 py-1 rounded bg-[#8e78b7] hover:bg-[#7b67a1] text-white"
            title="Import new connector"
          >
            <Upload className="w-3 h-3 mr-1" /> Import
          </button>

          <button
            onClick={refreshStream}
            className="flex items-center text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
            title="Refresh connectors"
          >
            <RefreshCcw className="w-3 h-3 mr-1" /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

      {loading && connectors.length === 0 ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-[#8e78b7] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="text-left bg-gray-50 border-b text-gray-500">
                <Th className="w-8"></Th>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>State</Th>
                <Th>Tasks</Th>
                <Th className="w-32">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pageRows.map((c) => {
                const name = c.name || c.connector || 'unknown';
                const isOpen = !!expanded[name];
                const type = c.type || c.status?.type || '-';
                const state =
                  c.status?.connector?.state ||
                  c.status?.connector?.state ||
                  c.status?.state ||
                  '-';
                const tasksCount = Array.isArray(c.tasks)
                  ? c.tasks.length
                  : (Array.isArray(c.status?.tasks) ? c.status.tasks.length : 0);

                return (
                  <React.Fragment key={name}>
                    <tr className="hover:bg-gray-50">
                      <Td className="w-8">
                        <button
                          onClick={() => setExpanded((prev) => ({ ...prev, [name]: !prev[name] }))}
                          className="p-1 rounded hover:bg-gray-100 text-gray-600"
                          title={isOpen ? 'Collapse' : 'Expand'}
                        >
                          {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </Td>
                      <Td className="font-medium">{name}</Td>
                      <Td>{type || '-'}</Td>
                      <Td>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            state === 'RUNNING'
                              ? 'bg-green-100 text-green-700'
                              : state === 'PAUSED'
                              ? 'bg-amber-100 text-amber-700'
                              : state === 'FAILED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {state}
                        </span>
                      </Td>
                      <Td>{tasksCount}</Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              try {
                                navigator.clipboard.writeText(JSON.stringify(c.config ?? {}, null, 2));
                                setCopiedFor(name);
                                setTimeout(() => setCopiedFor((prev) => (prev === name ? null : prev)), 1500);
                              } catch {}
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-700"
                          title="Copy configuration"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {copiedFor === name ? 'Copied' : 'Copy'}
                        </button>
                        <button
                          onClick={() => exportConnector(c)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-700"
                          title="Export connector details"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Export
                        </button>
                      </div>
                      </Td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="p-0">
                          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="border rounded">
                              <div className="px-3 py-2 bg-gray-100 font-semibold text-gray-700">
                                Status
                              </div>
                              <div className="p-3 space-y-2">
                                {c.info_error && (
                                  <div className="text-red-600 text-xs">
                                    Info error: {String(c.info_error)}
                                  </div>
                                )}
                                {c.status_error && (
                                  <div className="text-red-600 text-xs">
                                    Status error: {String(c.status_error)}
                                  </div>
                                )}
                                <div className="text-xs">
                                  <div><span className="text-gray-500">Type:</span> {type || '-'}</div>
                                  <div><span className="text-gray-500">Connector state:</span> {state || '-'}</div>
                                  <div><span className="text-gray-500">Worker:</span> {c.status?.connector?.worker_id || '-'}</div>
                                </div>
                                <div className="mt-2">
                                  <div className="text-xs font-semibold text-gray-700 mb-1">Tasks</div>
                                  <div className="overflow-auto border rounded">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="text-left bg-gray-50 border-b text-gray-500">
                                          <Th>ID</Th>
                                          <Th>State</Th>
                                          <Th>Worker</Th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y">
                                        {(c.status?.tasks || c.tasks || []).map((t, idx) => {
                                          const id = t.id ?? idx;
                                          const tState = t.state || '-';
                                          const worker = t.worker_id || '-';
                                          return (
                                            <tr key={id} className="hover:bg-gray-50">
                                              <Td>{id}</Td>
                                              <Td>{tState}</Td>
                                              <Td>{worker}</Td>
                                            </tr>
                                          );
                                        })}
                                        {((c.status?.tasks || c.tasks || []).length === 0) && (
                                          <tr>
                                            <td colSpan={3} className="py-6 text-center text-gray-400">No tasks</td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="border rounded">
                              <div className="px-3 py-2 bg-gray-100 flex items-center justify-between">
                                <div className="font-semibold text-gray-700">Configuration</div>
                                <button
                                  onClick={() => {
                                    try {
                                      navigator.clipboard.writeText(JSON.stringify(c.config ?? {}, null, 2));
                                      setCopiedFor(name);
                                      setTimeout(() => setCopiedFor((prev) => (prev === name ? null : prev)), 1500);
                                    } catch {}
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs"
                                  title="Copy configuration"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  {copiedFor === name ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                              <div className="p-3">
                                <pre className="whitespace-pre-wrap break-words font-mono text-[11px] md:text-xs">
                                  {pretty(c.config)}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    No connectors
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Pagination footer */}
          <div className="flex items-center justify-between px-3 py-2 border-t text-xs text-gray-600">
            <div>
              {filtered.length > 0 ? (
                <>
                  Showing {(page - 1) * PAGE_SIZE + 1} – {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </>
              ) : (
                'No results'
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={`px-2 py-1 rounded border ${page <= 1 ? 'text-gray-300 border-gray-200' : 'hover:bg-gray-50 border-gray-200'}`}
              >
                Prev
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={`px-2 py-1 rounded border ${page >= totalPages ? 'text-gray-300 border-gray-200' : 'hover:bg-gray-50 border-gray-200'}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Import modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded shadow-lg w-[95vw] max-w-3xl">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="font-semibold text-sm">Import Connector</div>
              <button
                onClick={() => setShowImport(false)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Close
              </button>
            </div>
            <div className="p-4 space-y-3">
              {importErr && <div className="text-xs text-red-600 bg-red-50 border border-red-100 p-2 rounded">{importErr}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Connector name</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm"
                    placeholder="my-connector"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Mode</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setImportMode('json')}
                      className={`px-2 py-1 rounded border text-xs ${importMode === 'json' ? 'bg-gray-100 border-gray-300' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => setImportMode('form')}
                      className={`px-2 py-1 rounded border text-xs ${importMode === 'form' ? 'bg-gray-100 border-gray-300' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      Form
                    </button>
                  </div>
                </div>
              </div>

              {importMode === 'json' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs text-gray-600">Paste JSON (either full {"{ name, config }"} or just config)</label>
                    <label className="text-xs cursor-pointer inline-flex items-center gap-2 px-2 py-1 border rounded hover:bg-gray-50">
                      <Upload className="w-3.5 h-3.5" />
                      Upload JSON file
                      <input
                        type="file"
                        accept="application/json,.json,.txt"
                        className="hidden"
                        onChange={(e) => onUploadFile(e.target.files?.[0])}
                      />
                    </label>
                  </div>
                  <textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    rows={12}
                    className="w-full border rounded px-2 py-1.5 font-mono text-xs"
                    placeholder='{"name": "my-connector", "config": {"connector.class": "...", "tasks.max": "1", ...}}'
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">connector.class</label>
                      <input
                        value={formConfig.connector_class}
                        onChange={(e) => setFormConfig((s) => ({ ...s, connector_class: e.target.value }))
                        }
                        className="w-full border rounded px-2 py-1.5 text-sm"
                        placeholder="io.debezium.connector.postgresql.PostgresConnector"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">tasks.max</label>
                      <input
                        value={formConfig.tasks_max}
                        onChange={(e) => setFormConfig((s) => ({ ...s, tasks_max: e.target.value }))
                        }
                        className="w-full border rounded px-2 py-1.5 text-sm"
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">topic</label>
                      <input
                        value={formConfig.topic}
                        onChange={(e) => setFormConfig((s) => ({ ...s, topic: e.target.value }))
                        }
                        className="w-full border rounded px-2 py-1.5 text-sm"
                        placeholder="optional"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">topics</label>
                      <input
                        value={formConfig.topics}
                        onChange={(e) => setFormConfig((s) => ({ ...s, topics: e.target.value }))
                        }
                        className="w-full border rounded px-2 py-1.5 text-sm"
                        placeholder="optional, comma-separated"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-gray-600">Extra properties</div>
                    {extraPairs.map((p, idx) => (
                      <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                        <input
                          value={p.key}
                          onChange={(e) => {
                            const v = e.target.value;
                            setExtraPairs((arr) => arr.map((it, i) => (i === idx ? { ...it, key: v } : it)));
                          }}
                          className="col-span-2 border rounded px-2 py-1.5 text-sm"
                          placeholder="property.key"
                        />
                        <input
                          value={p.value}
                          onChange={(e) => {
                            const v = e.target.value;
                            setExtraPairs((arr) => arr.map((it, i) => (i === idx ? { ...it, value: v } : it)));
                          }}
                          className="col-span-2 border rounded px-2 py-1.5 text-sm"
                          placeholder="value"
                        />
                        <button
                          onClick={() => setExtraPairs((arr) => arr.filter((_, i) => i !== idx))}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setExtraPairs((arr) => [...arr, { key: '', value: '' }])}
                      className="text-xs text-[#6b578f] hover:underline"
                    >
                      + Add property
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
              <button
                onClick={() => setShowImport(false)}
                className="px-3 py-1.5 text-xs rounded border border-gray-200 hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                className="px-3 py-1.5 text-xs rounded bg-[#8e78b7] hover:bg-[#7b67a1] text-white disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Connector;