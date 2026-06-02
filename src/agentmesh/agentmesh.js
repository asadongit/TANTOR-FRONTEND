const BASE = window._env_?.VITE_AGENT_MESH || import.meta.env.VITE_AGENT_MESH || 'http://localhost:8000/api/v1/agentmesh';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    let msg = err.detail || 'Request failed';
    if (typeof msg !== 'string') msg = JSON.stringify(msg);
    throw new Error(msg);
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
    const res = await fetch(`${BASE}/workflow/${workflowId}/execute`, {
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
export const listTools = (params = {}) => {
  const { page = 1, limit = 100, search, category, package: pkg } = params;
  const p = new URLSearchParams({ page, limit });
  if (search) p.set('search', search);
  if (category) p.set('category', category);
  if (pkg) p.set('package', pkg);
  return request(`/tools?${p}`);
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

// ─── RAG ──────────────────────────────────────────────────────────────────────
export const ingestData = (formData) => {
  return fetch(`${BASE}/rag/ingest`, {
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

// ─── Logs ─────────────────────────────────────────────────────────────────────
export const getExecutionLogs = (params = {}) => {
  const { workflowId, page = 1, limit = 100 } = params;
  const p = new URLSearchParams({ page, limit });
  if (workflowId) p.set('workflow_id', workflowId);
  return request(`/execution-logs?${p}`);
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
export const fixGrammar = (text) => 
  request('/utils/action', { method: 'POST', body: JSON.stringify({ action: 'fix_grammar', payload: { text } }) });
export const explainWorkflow = (workflow, llm) =>
  request('/utils/action', { method: 'POST', body: JSON.stringify({ action: 'explain_workflow', payload: { workflow, llm } }) });
export const generateSkillSop = (payload) =>
  request('/utils/action', { method: 'POST', body: JSON.stringify({ action: 'generate_skill_sop', payload }) });

// ─── Notifications ────────────────────────────────────────────────────────────
export const listNotifications = (params = {}) => {
  const { page = 1, limit = 50, unreadOnly = false, workflowId } = params;
  const p = new URLSearchParams({ page, limit, unread_only: unreadOnly });
  if (workflowId) p.set('workflow_id', workflowId);
  return request(`/notifications?${p}`);
};
export const processNotifications = (payload) => request('/notifications/action', { method: 'POST', body: JSON.stringify(payload) });

// ─── History ──────────────────────────────────────────────────────────────────
export const listThreads = (workflowId) => request(`/workflow/${workflowId}/threads`);
export const getThreadHistory = (workflowId, threadId) => request(`/workflow/${workflowId}/thread/${threadId}`);
export const deleteThread = (threadId) => request(`/thread/${threadId}`, { method: 'DELETE' });

// ─── Health ───────────────────────────────────────────────────────────────────
export const healthCheck = () => request('/health');

// ─── Realtime ─────────────────────────────────────────────────────────────────
export const getActiveRuns = () => request('/active-runs');

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const getDashboardStats = () => request('/dashboard/stats');

// ─── 2026 Deep Agent Protocols ────────────────────────────────────────────────
export const listVfsFiles = (rootDir, threadId) => {
  const p = new URLSearchParams({ root_dir: rootDir, thread_id: threadId });
  return request(`/deep-agent/vfs/list?${p}`);
};
export const readVfsFile = (rootDir, filePath, threadId) => {
  const p = new URLSearchParams({ root_dir: rootDir, file_path: filePath, thread_id: threadId });
  return request(`/deep-agent/vfs/read?${p}`);
};
export const listAvailableSkills = () => request('/skills/list');
export const createSkill = (payload) => request('/skills/create', { method: 'POST', body: JSON.stringify(payload) });
export const deleteSkill = (id) => request(`/skills/${id}`, { method: 'DELETE' });
export const listAvailableModels = () => request('/models/available');
export const testConnection = (payload) => request('/models/test-connection', { method: 'POST', body: JSON.stringify(payload) });

// ─── Agent Templates ──────────────────────────────────────────────────────────
export const listAgentTemplates = (params = {}) => {
  const { page = 1, limit = 50, group, category, search } = params;
  const p = new URLSearchParams({ page, limit });
  if (group) p.set('group', group);
  if (category) p.set('category', category);
  if (search) p.set('search', search);
  return request(`/agent-templates?${p}`);
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

export const listComponentTemplates = (params = {}) => {
  const { page = 1, limit = 50, group, category_id, category_name, type, search } = params;
  const p = new URLSearchParams({ page, limit });
  if (group) p.set('group', group);
  if (category_id) p.set('category_id', category_id);
  if (category_name) p.set('category_name', category_name);
  if (type) p.set('type', type);
  if (search) p.set('search', search);
  return request(`/component-templates?${p}`);
};
export const saveComponentTemplate = (payload) =>
  request('/component-templates', { method: 'POST', body: JSON.stringify(payload) });
export const deleteComponentTemplate = (id) =>
  request(`/component-template/${id}`, { method: 'DELETE' });

