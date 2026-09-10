import { agentMeshFetch } from './authenticatedFetch';

const BASE = globalThis._env_?.VITE_AGENT_MESH || import.meta.env.VITE_AGENT_MESH || 'http://localhost:8000/api/v1/agentmesh';

export const getBackendUrl = () => {
  return BASE.replace('/api/v1/agentmesh', '');
};

async function request(path, options = {}) {
  const res = await agentMeshFetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    let msg = err.detail || 'Request failed';
    if (typeof msg !== 'string') msg = JSON.stringify(msg);
    const error = new Error(msg);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

// ─── Workflows ────────────────────────────────────────────────────────────────
export const listWorkflows = (params = {}) => {
  const { page = 1, limit = 100, group, category, search } = params;
  const p = new URLSearchParams({ page, limit });
  if (group && group !== 'All') p.set('group', group);
  if (category && category !== 'All') p.set('category', category);
  if (search) p.set('search', search);
  return request(`/workflows?${p}`);
};
export const listWorkflowCategories = () => request('/workflow-categories');
export const getWorkflow = (id) => request(`/workflow/${id}`);
export const deleteWorkflow = (id) => request(`/workflow/${id}`, { method: 'DELETE' });
export const compileWorkflow = (config) =>
  request(`/workflow/${config.id}/compile`, { method: 'POST', body: JSON.stringify(config) });
export const saveWorkflow = (config) =>
  request(`/workflow/${config.id}`, { method: 'PUT', body: JSON.stringify(config) });
export const cloneWorkflow = (id) =>
  request(`/workflow/${id}/clone`, { method: 'POST' });

export const publishWorkflow = (id, params = {}) =>
  request(`/workflow/${id}/publish`, { method: 'POST', body: JSON.stringify(params) });

export const getMarketplaceUsecase = (id) =>
  request(`/workflow/${id}/marketplace`);

export const listMarketplaceUsecases = (params = {}, options = {}) => {
  const { page = 1, limit = 100, group, category, search, tag, adminStatus } = params;
  const p = new URLSearchParams({ page, limit });
  if (group && group !== 'All') p.set('group', group);
  if (category && category !== 'All') p.set('category', category);
  if (search) p.set('search', search);
  if (tag && tag !== 'All') p.set('tag', tag);
  if (adminStatus) p.set('admin_status', adminStatus);
  return request(`/marketplace/usecases?${p}`, options);
};

export const updateMarketplaceUsecaseStatus = (workflowId, status, remarks = null) =>
  request(`/workflow/${workflowId}/marketplace/status`, { method: 'PATCH', body: JSON.stringify({ status, remarks }) });

export const deleteMarketplaceUsecase = (workflowId) =>
  request(`/workflow/${workflowId}/marketplace`, { method: 'DELETE' });

export const dispatchScheduleAction = (id, action) =>
  request(`/workflow/${id}/schedule`, { method: 'POST', body: JSON.stringify({ action }) });

export const setWorkflowWarmup = (id, warmup) =>
  request(`/workflow/${id}/warmup`, { method: 'PATCH', body: JSON.stringify({ warmup }) });

// ─── Run / Stream ─────────────────────────────────────────────────────────────
export const executeWorkflow = (id, payload) => {
  payload.mode = payload.mode || 'run';
  return request(`/workflow/${id}/execute`, { method: 'POST', body: JSON.stringify(payload) });
};

export const streamWorkflow = (workflowId, payload, onEvent) => {
  payload.mode = 'stream';
  const ctrl = new AbortController();
  (async () => {
    const res = await agentMeshFetch(`${BASE}/workflow/${workflowId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split('\n\n');
      buf = parts.pop();
      for (const part of parts) {
        if (part.startsWith('data: ')) {
          try { onEvent(JSON.parse(part.slice(6))); } catch { /* ignore */ }
        }
      }
    }
    onEvent({ type: 'done' });
  })().catch((e) => { if (e.name !== 'AbortError') onEvent({ type: 'error', content: e.message }); });
  return () => ctrl.abort();
};

// ─── Tools ────────────────────────────────────────────────────────────────────
export const listTools = (params = {}, options = {}) => {
  const { page = 1, limit = 100, search, category, package: pkg } = params;
  const p = new URLSearchParams({ page, limit });
  if (search) p.set('search', search);
  if (category) p.set('category', category);
  if (pkg) p.set('package', pkg);
  return request(`/tools?${p}`, options);
};
export const listToolPackages = (params = {}) => {
  const { page = 1, limit = 10, search } = params;
  const p = new URLSearchParams({ page, limit });
  if (search) p.set('search', search);
  return request(`/tools/packages?${p}`);
};
export const registerMCPServer = (payload) =>
  request('/tools/mcp/register', { method: 'POST', body: JSON.stringify(payload) });
export const listMCPServers = () => request('/tools/mcp/list');
export const deleteMCPServer = (name) => request(`/tools/mcp/${name}`, { method: 'DELETE' });
export const syncMCPTools = () => request('/tools/mcp/sync', { method: 'POST' });

export const listCollections = (vectorStore = 'chroma') =>
  request(`/rag/collections?vector_store=${vectorStore}`);

export const getCollectionDetails = (collectionName, vectorStore = 'chroma', limit = 50, offset = 0) =>
  request(`/rag/collections/details?collection_name=${encodeURIComponent(collectionName)}&vector_store=${vectorStore}&limit=${limit}&offset=${offset}`);

export const deleteCollection = (collectionName, vectorStore = 'chroma') =>
  request(`/rag/collections?collection_name=${encodeURIComponent(collectionName)}&vector_store=${vectorStore}`, { method: 'DELETE' });

export const ingestData = (formData) => {
  return agentMeshFetch(`${BASE}/rag/ingest`, {
    method: 'POST',
    body: formData,
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Ingestion failed');
    }
    return res.json();
  });
};

export const uploadTempFile = (formData) => {
  return agentMeshFetch(`${BASE}/execution/upload-temp`, {
    method: 'POST',
    body: formData,
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  });
};

// ─── Notes ────────────────────────────────────────────────────────────────────
export const listWorkflowNotes = (workflowId) =>
  request(`/workflow/${workflowId}/notes/action`, { method: 'POST', body: JSON.stringify({ action: 'list' }) });
export const createWorkflowNote = (workflowId, content, category = 'General') =>
  request(`/workflow/${workflowId}/notes/action`, { method: 'POST', body: JSON.stringify({ action: 'create', content, category }) });
export const deleteWorkflowNote = (workflowId, noteId) =>
  request(`/workflow/${workflowId}/notes/action`, { method: 'POST', body: JSON.stringify({ action: 'delete', note_id: noteId }) });
export const updateWorkflowNote = (workflowId, noteId, content, category) =>
  request(`/workflow/${workflowId}/notes/action`, { method: 'POST', body: JSON.stringify({ action: 'update', note_id: noteId, content, category }) });
export const fixGrammar = (text, llm) =>
  request('/utils/action', { method: 'POST', body: JSON.stringify({ action: 'fix_grammar', payload: { text, llm } }) });
export const explainWorkflow = (workflow, llm) =>
  request('/utils/action', { method: 'POST', body: JSON.stringify({ action: 'explain_workflow', payload: { workflow, llm } }) });
export const chatArchitect = (workflow, context, messages, llm) =>
  request('/utils/action', { method: 'POST', body: JSON.stringify({ action: 'chat_architect', payload: { workflow, context, messages, llm } }) });
export const generateSkillSop = (payload) =>
  request('/utils/action', { method: 'POST', body: JSON.stringify({ action: 'generate_skill_sop', payload }) });
export const generatePythonRule = (prompt, llm) =>
  request('/utils/action', { method: 'POST', body: JSON.stringify({ action: 'generate_python_rule', payload: { prompt, existing_code: "", llm } }) });

// ─── Notifications ────────────────────────────────────────────────────────────
export const listNotifications = (params = {}) => {
  const { page = 1, limit = 50, unreadOnly = false, workflowId, type } = params;
  const p = new URLSearchParams({ page, limit, unread_only: unreadOnly });
  if (workflowId) p.set('workflow_id', workflowId);
  if (type) p.set('type', type);
  return request(`/notifications?${p}`);
};
export const processNotifications = (payload) => request('/notifications/action', { method: 'POST', body: JSON.stringify(payload) });

// ─── History ──────────────────────────────────────────────────────────────────
export const listThreads = (workflowId, params = {}) => {
  const { page = 1, limit = 20 } = params;
  const p = new URLSearchParams({ page, limit });
  return request(`/workflow/${workflowId}/threads?${p}`);
};
export const getThreadHistory = (workflowId, threadId) => request(`/workflow/${workflowId}/thread/${threadId}`);
export const deleteThread = (threadId) => request(`/thread/${threadId}`, { method: 'DELETE' });

// ─── Health ───────────────────────────────────────────────────────────────────
export const healthCheck = () => request('/health');

// ─── Realtime ─────────────────────────────────────────────────────────────────
export const getActiveRuns = () => request('/active-runs');

// ─── Workflow API Console ─────────────────────────────────────────────────
export const fetchWorkflowApiSpec = (workflowId) => request(`/workflow/${workflowId}/api-spec`);
export const sendWebhookTest = async (url, { method = 'POST', headers = {}, body }) => {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  let data;
  try { data = await res.json(); } catch { data = { raw: 'Non-JSON response' }; }
  return { status: res.status, statusText: res.statusText, headers: Object.fromEntries(res.headers.entries()), body: data };
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const getDashboardStats = () => request('/dashboard/stats');

// ─── Observability (Langfuse metrics proxy) ─────────────────────────────────
export const getObservabilityOverview = (params = {}) => {
  const p = new URLSearchParams({ fromTimestamp: params.fromTimestamp, toTimestamp: params.toTimestamp });
  return request(`/observability/metrics/overview?${p}`);
};
export const getObservabilityTimeseries = (params = {}) => {
  const p = new URLSearchParams({ fromTimestamp: params.fromTimestamp, toTimestamp: params.toTimestamp, granularity: params.granularity || 'day' });
  return request(`/observability/metrics/timeseries?${p}`);
};
export const getObservabilityByModel = (params = {}) => {
  const p = new URLSearchParams({ fromTimestamp: params.fromTimestamp, toTimestamp: params.toTimestamp, dimension: params.dimension || 'providedModelName', limit: params.limit || 20 });
  return request(`/observability/metrics/by-model?${p}`);
};
export const getObservabilityScoreMetrics = (params = {}) => {
  const p = new URLSearchParams({ fromTimestamp: params.fromTimestamp, toTimestamp: params.toTimestamp, limit: params.limit || 20 });
  if (params.granularity) p.set('granularity', params.granularity);
  if (params.name) p.set('name', params.name);
  if (params.dataType) p.set('dataType', params.dataType);
  if (params.source) p.set('source', params.source);
  return request(`/observability/metrics/scores?${p}`);
};
export const getObservabilityToxicity = (params = {}) => {
  const p = new URLSearchParams({ fromTimestamp: params.fromTimestamp, toTimestamp: params.toTimestamp });
  if (params.userId) p.set('userId', params.userId);
  if (params.sessionId) p.set('sessionId', params.sessionId);
  if (params.traceName) p.set('traceName', params.traceName);
  if (params.groupBy) p.set('groupBy', params.groupBy);
  if (params.threshold != null && params.threshold !== '') p.set('threshold', params.threshold);
  if (params.limit) p.set('limit', params.limit);
  return request(`/observability/metrics/toxicity?${p}`);
};
export const getObservabilityTraces = (params = {}) => {
  const p = new URLSearchParams({ fromTimestamp: params.fromTimestamp, toTimestamp: params.toTimestamp, limit: params.limit || 50 });
  if (params.cursor) p.set('cursor', params.cursor);
  if (params.level) p.set('level', params.level);
  if (params.search) p.set('search', params.search);
  if (params.kind) p.set('kind', params.kind);
  if (params.environment) p.set('environment', params.environment);
  if (params.userId) p.set('userId', params.userId);
  if (params.sessionId) p.set('sessionId', params.sessionId);
  if (params.tags) p.set('tags', params.tags);
  // traceId: direct exact ID filter (Langfuse v2 observations API supports ?traceId=)
  // Used when navigating from Scores → Traces to view a specific trace.
  if (params.traceId) p.set('traceId', params.traceId);
  return request(`/observability/traces?${p}`);
};
export const getObservabilityTraceDetail = (traceId) =>
  request(`/observability/traces/${encodeURIComponent(traceId)}`);
export const getObservabilityScores = (params = {}) => {
  const p = new URLSearchParams({ fromTimestamp: params.fromTimestamp, toTimestamp: params.toTimestamp, limit: params.limit || 100 });
  if (params.cursor) p.set('cursor', params.cursor);
  if (params.name) p.set('name', params.name);
  if (params.dataType) p.set('dataType', params.dataType);
  if (params.source) p.set('source', params.source);
  if (params.environment) p.set('environment', params.environment);
  if (params.authorUserId) p.set('authorUserId', params.authorUserId);
  if (params.configId) p.set('configId', params.configId);
  if (params.queueId) p.set('queueId', params.queueId);
  if (params.traceId) p.set('traceId', params.traceId);
  if (params.traceName) p.set('traceName', params.traceName);
  if (params.observationId) p.set('observationId', params.observationId);
  if (params.sessionId) p.set('sessionId', params.sessionId);
  if (params.value != null && params.value !== '') p.set('value', params.value);
  if (params.valueMin != null && params.valueMin !== '') p.set('valueMin', params.valueMin);
  if (params.valueMax != null && params.valueMax !== '') p.set('valueMax', params.valueMax);
  return request(`/observability/scores?${p}`);
};
export const getObservabilitySessions = (params = {}) => {
  const p = new URLSearchParams({ fromTimestamp: params.fromTimestamp, toTimestamp: params.toTimestamp, page: params.page || 1, limit: params.limit || 20 });
  if (params.search) p.set('search', params.search);
  if (params.environment) p.set('environment', params.environment);
  if (params.userId) p.set('userId', params.userId);
  if (params.sessionId) p.set('sessionId', params.sessionId);
  if (params.tags) p.set('tags', params.tags);
  const numKeys = ['durationSec', 'inputTokens', 'outputTokens', 'totalTokens', 'inputCost', 'outputCost', 'totalCost'];
  numKeys.forEach((k) => {
    if (params[`min${k[0].toUpperCase()}${k.slice(1)}`] != null && params[`min${k[0].toUpperCase()}${k.slice(1)}`] !== '') p.set(`min${k[0].toUpperCase()}${k.slice(1)}`, params[`min${k[0].toUpperCase()}${k.slice(1)}`]);
    if (params[`max${k[0].toUpperCase()}${k.slice(1)}`] != null && params[`max${k[0].toUpperCase()}${k.slice(1)}`] !== '') p.set(`max${k[0].toUpperCase()}${k.slice(1)}`, params[`max${k[0].toUpperCase()}${k.slice(1)}`]);
  });
  return request(`/observability/sessions?${p}`);
};
export const getObservabilityFacets = (params = {}) => {
  const p = new URLSearchParams({ fromTimestamp: params.fromTimestamp, toTimestamp: params.toTimestamp, entity: params.entity || 'traces' });
  return request(`/observability/facets?${p}`);
};
export const getObservabilityWorkflows = (params = {}) => {
  const p = new URLSearchParams({ fromTimestamp: params.fromTimestamp, toTimestamp: params.toTimestamp, limit: params.limit || 20 });
  return request(`/observability/workflows?${p}`);
};
export const getObservabilityLatency = (params = {}) => {
  const p = new URLSearchParams({ fromTimestamp: params.fromTimestamp, toTimestamp: params.toTimestamp, limit: params.limit || 10 });
  return request(`/observability/latency?${p}`);
};
export const getObservabilityModelLatency = (params = {}) => {
  const p = new URLSearchParams({ fromTimestamp: params.fromTimestamp, toTimestamp: params.toTimestamp, granularity: params.granularity || 'day', limit: params.limit || 20 });
  if (params.models) p.set('models', params.models);
  return request(`/observability/metrics/model-latency?${p}`);
};
export const getObservabilitySystemMetrics = () =>
  request('/observability/system-metrics');

// ─── 2026 Deep Agent Protocols ────────────────────────────────────────────────
export const listVfsFiles = (rootDir, threadId) => {
  const p = new URLSearchParams({ root_dir: rootDir, thread_id: threadId });
  return request(`/deep-agent/vfs/list?${p}`);
};
export const readVfsFile = (rootDir, filePath, threadId) => {
  const p = new URLSearchParams({ root_dir: rootDir, file_path: filePath, thread_id: threadId });
  return request(`/deep-agent/vfs/read?${p}`);
};
export const listAvailableSkills = (params = {}, options = {}) => {
  const { page = 1, limit = 1000, search } = params;
  const p = new URLSearchParams({ page, limit });
  if (search) p.set('search', search);
  return request(`/skills/list?${p}`, options);
};
export const createSkill = (payload) => request('/skills/create', { method: 'POST', body: JSON.stringify(payload) });
export const deleteSkill = (id) => request(`/skills/${id}`, { method: 'DELETE' });
export const listAvailableModels = () => request('/models/available');
export const testConnection = (payload) => request('/models/test-connection', { method: 'POST', body: JSON.stringify(payload) });

// ─── Agent Templates ──────────────────────────────────────────────────────────
export const listAgentTemplates = (params = {}, options = {}) => {
  const { page = 1, limit = 50, group, category, search } = params;
  const p = new URLSearchParams({ page, limit });
  if (group) p.set('group', group);
  if (category) p.set('category', category);
  if (search) p.set('search', search);
  return request(`/agent-templates?${p}`, options);
};
export const saveAgentTemplate = (payload) =>
  request('/agent-templates', { method: 'POST', body: JSON.stringify(payload) });
export const deleteAgentTemplate = (id) =>
  request(`/agent-template/${id}`, { method: 'DELETE' });
export const getAgentTemplate = (id) =>
  request(`/agent-template/${id}`);

// ─── Enterprise Connections Vault ────────────────────────────────────────────────
export const listConnections = () => request('/connections');
export const saveConnection = (data) => request('/connections', { method: 'POST', body: JSON.stringify(data) });
export const deleteConnection = (id) => request(`/connections/${id}`, { method: 'DELETE' });

// ─── API Categories & Component Templates ──────────────────────────────────────
export const listCategories = (type) => {
  const p = new URLSearchParams();
  if (type) p.set('type', type);
  return request(`/categories?${p}`);
};
export const createCategory = (payload) =>
  request('/categories', { method: 'POST', body: JSON.stringify(payload) });

export const listComponentTemplateFilters = (params) => {
  const p = new URLSearchParams();
  if (typeof params === 'string') {
    p.set('type', params);
  } else if (params && typeof params === 'object') {
    const { type, exclude_type } = params;
    if (type) p.set('type', type);
    if (exclude_type) p.set('exclude_type', exclude_type);
  }
  return request(`/component-templates/filters?${p}`);
};

export const listComponentTemplates = (params = {}) => {
  const { page = 1, limit = 50, group, category_id, category_name, type, search, exclude_type } = params;
  const p = new URLSearchParams({ page, limit });
  if (group) p.set('group', group);
  if (category_id) p.set('category_id', category_id);
  if (category_name) p.set('category_name', category_name);
  if (type) p.set('type', type);
  if (exclude_type) p.set('exclude_type', exclude_type);
  if (search) p.set('search', search);
  return request(`/component-templates?${p}`);
};

export const saveComponentTemplate = (payload) =>
  request('/component-templates', { method: 'POST', body: JSON.stringify(payload) });
export const deleteComponentTemplate = (id) =>
  request(`/component-template/${id}`, { method: 'DELETE' });

// ─── Workflow Templates ──────────────────────────────────────────────────────
export const saveWorkflowTemplate = (payload) =>
  request('/workflow-templates', { method: 'POST', body: JSON.stringify(payload) });

export const listWorkflowTemplates = (params = {}) => {
  const { page = 1, limit = 12, group, category, search, scope, status } = params;
  const p = new URLSearchParams({ page, limit });
  if (group && group !== 'All') p.set('group', group);
  if (category && category !== 'All') p.set('category', category);
  if (search) p.set('search', search);
  if (scope && scope !== 'All') p.set('scope', scope);
  if (status && status !== 'All') p.set('status', status);
  return request(`/workflow-templates?${p}`);
};

export const cloneWorkflowTemplate = (id) =>
  request(`/workflow-template/${id}/clone`, { method: 'POST' });

export const getWorkflowTemplate = (id) =>
  request(`/workflow-template/${id}`);

export const updateWorkflowTemplateStatus = (id, status) =>
  request(`/workflow-template/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

export const deleteWorkflowTemplate = (id) =>
  request(`/workflow-template/${id}`, { method: 'DELETE' });

// ─── Workflow Variables ───────────────────────────────────────────────────────
export const listWorkflowVariables = (workflowId) => request(`/workflow/${workflowId}/variables`);
export const getWorkflowVariable = (workflowId, key) => request(`/workflow/${workflowId}/variables/${key}`);
export const setWorkflowVariable = (workflowId, payload) => request(`/workflow/${workflowId}/variables`, { method: 'POST', body: JSON.stringify(payload) });
export const deleteWorkflowVariable = (workflowId, key) => request(`/workflow/${workflowId}/variables/${key}`, { method: 'DELETE' });
const upload = (url, formData) => fetch(url, { method: 'POST', body: formData }).then(async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
});

export const uploadJsonVariable = (workflowId, formData) =>
  upload(`${BASE}/workflow/${workflowId}/variables/extract-json-keys`, formData);

// Working out what a document type contains. Each of these stands alone: it
// takes a name and writes a name the caller chooses, so none assumes another
// has been run, and someone who would rather type a list still can.
export const uploadSheetVariable = (workflowId, formData) =>
  upload(`${BASE}/workflow/${workflowId}/variables/extract-sheet-rows`, formData);

export const compareVariableSources = (workflowId, payload) =>
  request(`/workflow/${workflowId}/variables/compare-sources`, { method: 'POST', body: JSON.stringify(payload) });

export const classifyVariableKeys = (workflowId, payload) =>
  request(`/workflow/${workflowId}/variables/classify-keys`, { method: 'POST', body: JSON.stringify(payload) });

// ─── Blackboard / Tasks ──────────────────────────────────────────────────────
export const getBlackboardTasks = (threadId) =>
  request(`/workflow/thread/${threadId}/blackboard`);

// ─── Database Operations ─────────────────────────────────────────────────────
export const runDbQuery = (payload) =>
  request('/db/run-query', { method: 'POST', body: JSON.stringify(payload) });
