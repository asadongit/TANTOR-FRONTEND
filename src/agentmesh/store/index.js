import { create } from 'zustand';
// ─── Constants & Utils ──────────────────────────────────────────────────────────
const genId = () => Math.random().toString(36).substring(2, 7);

const NODE_DEFAULTS = {
  start: { label: 'START' },
  end: { label: 'END' },
  chat_model: { label: 'Chat Model', provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0 },
  memory: { label: 'Memory', type_name: 'buffer_memory', window_size: 10 },
  llm_agent: { label: 'LLM Agent', task: '', llm: { provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0 }, iteration_policy: { enabled: false, max_iterations: 3, target_score: 0.8, evaluator_task: '', inject_feedback_as: 'human' }, memory: null, tools: [], tool_configs: {}, return_direct: false, interrupt_before: false, interrupt_after: false, allowed_transitions: null },
  deep_agent: { label: 'Deep Agent', task: '', llm: { provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0 }, tools: [], tool_configs: {}, skills: [], deep_agent_backend: 'postgres', deep_agent_root_dir: './mnt/deep_agents', interrupt_before: false, interrupt_after: false },
  tool_node: { label: 'Tool Node', tools: [], tool_configs: {}, return_direct: false, interrupt_before: false, interrupt_after: false },
  direct_tool: { label: 'Direct Tool', direct_tool_name: '', tool_arguments: {}, destination_key: '', return_direct: false, interrupt_before: false, interrupt_after: false },
  router: { label: 'Router', routing_key: 'next', member_ids: [] },
  rag_node: { label: 'RAG Node', task: '', search_type: 'similarity', vector_store: 'chroma', vector_collection: 'default', k_results: 5, threshold: 0.5, embedding_model: null, chunking_strategy: 'recursive', show_citations: false, interrupt_before: false, interrupt_after: false },
  subgraph: { label: 'Subgraph', workflow_id: '', interrupt_before: false, interrupt_after: false },
  supervisor: { label: 'Supervisor', member_ids: [], llm: { provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0 }, iteration_policy: { enabled: false, max_iterations: 3, target_score: 0.8, evaluator_task: '', inject_feedback_as: 'human' }, tools: [], tool_configs: {}, interrupt_before: false, interrupt_after: false },
  swarm: { label: 'Swarm', member_ids: [], llm: { provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0 }, iteration_policy: { enabled: false, max_iterations: 3, target_score: 0.8, evaluator_task: '', inject_feedback_as: 'human' }, tools: [], tool_configs: {}, interrupt_before: false, interrupt_after: false },
  webhook: { label: 'Webhook', enabled: true, path: '', secret: '', auth_method: 'header', response_mode: 'immediate', response_node: '' },
  webhook_response: { label: 'Webhook Response', response_status: 200, response_headers: {}, response_body_key: '' },
  cron: { label: 'Cron Schedule', enabled: true, cron_expression: '0 9 * * *', timezone: 'UTC' },
  polling: { label: 'Polling Trigger', enabled: true, poller_tool: '', tool_arguments: {}, destination_key: 'payload', cron_expression: '*/5 * * * *', timezone: 'UTC' },
  splitter: { label: 'Splitter', split_field: 'items', batch_size: 1, destination_field: 'item' },
  aggregator: { label: 'Aggregator', action: 'append', field_to_aggregate: 'item', destination_field: 'aggregated_results' },
  form_node: { label: 'Form Submission', form_title: 'Information Required', form_description: 'Please fill out the following form.', form_fields: [{ id: 'feedback', label: 'Your Feedback', type: 'text', required: true }], form_submit_label: 'Submit' },
  notification: { label: 'Notification', notification_title: 'Workflow Alert', notification_message: 'The workflow has reached this point.', notification_type: 'info' },
  error_router: { label: 'Error Router', llm: { provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0 } },
  set_data: { label: 'Set Data', message: '' },
  output_parser: { label: 'Output Parser', parse_mode: 'auto', fallback_to_raw: true, output_context_key: 'parsed_output' },
  pii_node: { label: 'PII Masking', pii_engine: 'regex', pii_target: 'latest_message', pii_entities: ['EMAIL_ADDRESS', 'PHONE_NUMBER', 'PERSON'], pii_custom_regex: [] },
  data_cleaning: { label: 'Data Cleaning', data_cleaning_rules: ['GEN_TRIM_WHITESPACE'], data_cleaning_target: 'latest_message', data_cleaning_input_key: '', data_cleaning_output_key: 'cleaned_data' },
  network_graph: { label: 'Network Graph', graph_target_key: 'latest_message', graph_neo4j_uri: '', graph_neo4j_user: '', graph_neo4j_password: '' },
  ocr_node: { label: 'OCR Node', ocr_input_key: 'latest_file_path', ocr_prompt: 'Please perform OCR on this document and return the full text accurately.', llm: { provider: 'groq', model: 'llama-3.2-90b-vision-preview', temperature: 0 }, interrupt_before: false, interrupt_after: false },
  api_node: { label: 'API Request', method: 'GET', url: '', headers: {}, params: {}, body: '', auth_method: 'none', api_auth_config: {} },
  ingestion_node: { label: 'Ingestion', vector_store: 'chroma', vector_collection: 'default', chunk_size: 1000, chunk_overlap: 100, chunking_strategy: 'recursive', ingestion_source_key: 'latest_ocr_output' },
  classification: { label: 'Classification Agent', classification_classes: [{ class: 'Class A', description: 'Description for Class A' }], classification_summary: false, classification_engine: 'llm', classification_input_field: '', llm: { provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0 } },
  sensitivity_classifier: { label: 'Sensitivity Classifier', classification_input_key: 'latest_ocr_output', classification_output_key: '', engine_mode: 'both', custom_entities: '', output_format: 'markdown' },
  cardboard: { label: 'Sticky Note', color: 'slate' },
  json_transform: {
    label: 'JSON Transform',
    jt_input_key: 'latest_api_result',
    jt_output_key: 'transformed_data',
    jt_mode: 'jmespath',
    jt_query: '',
    jt_operations: [],
    jt_expression: '',
    jt_pass_through: false
  },
  button_trigger: {
    label: 'Button Trigger',
    button_label: 'Start Workflow',
    button_input: 'Start',
    button_category: 'action'
  },
  auto_trigger: {
    label: 'Auto Trigger',
    button_input: 'Auto Start'
  }
};

const _reconstructRFNodesAndEdges = (rawNodes, rawEdges, meta, triggers) => {
  const systemPositions = meta.system_positions || {};

  rawNodes.forEach(n => {
    if (n.type === 'start') systemPositions['__start__'] = n.position || systemPositions['__start__'];
    if (n.type === 'end') systemPositions['__end__'] = n.position || systemPositions['__end__'];
  });

  const rfNodes = rawNodes
    .filter(n => n.type !== 'start' && n.type !== 'end')
    .map((n, i) => {
      const type = n.type || 'llm_agent';
      return {
        id: n.id,
        type: 'agentNode',
        position: n.position || { x: 250 + (i % 3) * 280, y: 100 + Math.floor(i / 3) * 220 },
        data: {
          ...(NODE_DEFAULTS[type] || {}),
          ...n,
          ...(n.data || {}),
          id: n.id,
          type,
          label: n.label || n.data?.label || n.id,
          tools: n.tools || n.data?.tools || [],
          tool_configs: n.tool_configs || n.data?.tool_configs || {},
          direct_tool_name: n.direct_tool_name || n.data?.direct_tool_name || '',
          tool_arguments: n.tool_arguments || n.data?.tool_arguments || {},
          destination_key: n.destination_key || n.data?.destination_key || '',
          return_direct: n.return_direct || n.data?.return_direct || false,
          member_ids: n.member_ids || n.data?.member_ids || [],
          iteration_policy: n.iteration_policy || n.data?.iteration_policy || { enabled: false, max_iterations: 3, target_score: 0.8, evaluator_task: '', inject_feedback_as: 'human' },
          branches: n.branches || n.data?.branches || [],
          condition: n.condition || n.data?.condition || '',
          message: n.message || n.data?.message || '',
          task: n.task || n.data?.task || '',
          llm: n.llm || n.data?.llm || { provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0 },
          wait_seconds: n.wait_seconds || n.data?.wait_seconds || 0,
          skills: n.skills || n.data?.skills || [],
          custom_python_rules: n.custom_python_rules || n.data?.custom_python_rules || '',
          python_rules: n.python_rules || n.data?.python_rules || [],
          deep_agent_backend: n.deep_agent_backend || n.data?.deep_agent_backend || 'postgres',
          deep_agent_root_dir: n.deep_agent_root_dir || n.data?.deep_agent_root_dir || './mnt/deep_agents',
          allowed_transitions: n.allowed_transitions ?? n.data?.allowed_transitions ?? null,
          pii_engine: n.pii_engine || n.data?.pii_engine || 'regex',
          pii_target: n.pii_target || n.data?.pii_target || 'latest_message',
          pii_entities: n.pii_entities || n.data?.pii_entities || ['EMAIL_ADDRESS', 'PHONE_NUMBER', 'PERSON'],
          pii_custom_regex: n.pii_custom_regex || n.data?.pii_custom_regex || [],
          data_cleaning_rules: n.data_cleaning_rules || n.data?.data_cleaning_rules || ['GEN_TRIM_WHITESPACE'],
          data_cleaning_target: n.data_cleaning_target || n.data?.data_cleaning_target || 'latest_message',
          data_cleaning_input_key: n.data_cleaning_input_key || n.data?.data_cleaning_input_key || '',
          data_cleaning_output_key: n.data_cleaning_output_key || n.data?.data_cleaning_output_key || 'cleaned_data',
          graph_target_key: n.graph_target_key || n.data?.graph_target_key || 'latest_message',
          graph_neo4j_uri: n.graph_neo4j_uri || n.data?.graph_neo4j_uri || '',
          graph_neo4j_user: n.graph_neo4j_user || n.data?.graph_neo4j_user || '',
          graph_neo4j_password: n.graph_neo4j_password || n.data?.graph_neo4j_password || '',
          response_status: n.response_status || n.data?.response_status || 200,
          response_headers: n.response_headers || n.data?.response_headers || {},
          response_body_key: n.response_body_key || n.data?.response_body_key || '',
          classification_classes: n.classification_classes || n.data?.classification_classes || [],
          classification_summary: n.classification_summary ?? n.data?.classification_summary ?? false,
          classification_engine: n.classification_engine || n.data?.classification_engine || 'llm',
          classification_input_field: n.classification_input_field || n.data?.classification_input_field || '',
          jt_input_key: n.jt_input_key || n.data?.jt_input_key || 'latest_api_result',
          jt_output_key: n.jt_output_key || n.data?.jt_output_key || 'transformed_data',
          jt_mode: n.jt_mode || n.data?.jt_mode || 'jmespath',
          jt_query: n.jt_query || n.data?.jt_query || '',
          jt_operations: n.jt_operations || n.data?.jt_operations || [],
          jt_expression: n.jt_expression || n.data?.jt_expression || '',
          jt_pass_through: n.jt_pass_through ?? n.data?.jt_pass_through ?? false,
          weightage_categories: n.weightage_categories || n.data?.weightage_categories || [],
          weightage_output_key: n.weightage_output_key || n.data?.weightage_output_key || 'weightage_result',
        },
      };
    });

  rfNodes.unshift({ id: '__start__', type: 'agentNode', position: systemPositions['__start__'] || { x: 50, y: 200 }, data: { id: '__start__', type: 'start', label: 'START' } });
  rfNodes.push({ id: '__end__', type: 'agentNode', position: systemPositions['__end__'] || { x: 800, y: 200 }, data: { id: '__end__', type: 'end', label: 'END' } });

  if (triggers.webhook) {
    const existing = rfNodes.find(n => n.data?.type === 'webhook');
    if (existing) existing.data = { ...existing.data, ...triggers.webhook };
    else rfNodes.push({ id: `webhook_${genId()}`, type: 'agentNode', position: systemPositions['webhook'] || { x: 50, y: 50 }, data: { id: `webhook_${genId()}`, type: 'webhook', label: 'Webhook', ...triggers.webhook } });
  }

  if (triggers.cron) {
    const existing = rfNodes.find(n => n.data?.type === 'cron');
    if (existing) existing.data = { ...existing.data, ...triggers.cron };
    else rfNodes.push({ id: `cron_${genId()}`, type: 'agentNode', position: systemPositions['cron'] || { x: 50, y: 120 }, data: { id: `cron_${genId()}`, type: 'cron', label: 'Cron', ...triggers.cron } });
  }

  if (triggers.polling) {
    const existing = rfNodes.find(n => n.data?.type === 'polling');
    if (existing) existing.data = { ...existing.data, ...triggers.polling };
    else rfNodes.push({ id: `polling_${genId()}`, type: 'agentNode', position: systemPositions['polling'] || { x: 50, y: 190 }, data: { id: `polling_${genId()}`, type: 'polling', label: 'Polling Trigger', ...triggers.polling } });
  }

  const restoredCardboards = (meta.cardboards || []).map(n => ({ ...n, type: 'cardboardNode', zIndex: n.zIndex ?? -10, draggable: !n.data?.locked }));
  const allNodes = [...restoredCardboards, ...rfNodes];

  const startNode = rawNodes.find(n => n.type === 'start');
  const endNode = rawNodes.find(n => n.type === 'end');
  
  const mappedEdges = rawEdges.map((e, i) => {
    const cond = e.condition;
    const hasCond = cond && cond.key && cond.value;
    return {
      id: `e${i}`,
      source: (e.source === 'START' || e.source === 'start' || e.source === startNode?.id) ? '__start__' : e.source,
      target: (e.target === 'END' || e.target === 'end' || e.target === endNode?.id) ? '__end__' : e.target,
      sourceHandle: e.source_handle || e.sourceHandle || null,
      targetHandle: e.target_handle || e.targetHandle || null,
      data: { condition: e.condition },
      animated: !!hasCond,
      label: hasCond ? `${cond.key} ${cond.operator || '=='} ${cond.value}` : null,
      labelStyle: { fill: '#4F46E5', fontWeight: 700, fontSize: 10 },
      labelBgStyle: { fill: '#F5F3FF', fillOpacity: 0.9, rx: 4, stroke: '#C7D2FE', strokeWidth: 1 },
      type: 'smoothstep',
      style: { stroke: '#CBD5E1', strokeWidth: 1.5 },
    };
  });

  return { allNodes, rfEdges: mappedEdges };
};

let lastPropertyChangeTime = 0;

export const useWorkflowStore = create((set, get) => ({
  // Active workflow history
  history: {
    past: [],
    future: [],
  },

  takeHistorySnapshot: () => {
    const s = get();
    const current = {
      nodes: JSON.parse(JSON.stringify(s.nodes)),
      edges: JSON.parse(JSON.stringify(s.edges)),
    };
    const lastPast = s.history.past[s.history.past.length - 1];
    if (lastPast && JSON.stringify(lastPast) === JSON.stringify(current)) {
      return;
    }
    const newPast = [...s.history.past, current];
    if (newPast.length > 50) {
      newPast.shift();
    }
    set({
      history: {
        past: newPast,
        future: [],
      }
    });
  },

  undo: () => {
    const { past, future } = get().history;
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const current = {
      nodes: JSON.parse(JSON.stringify(get().nodes)),
      edges: JSON.parse(JSON.stringify(get().edges)),
    };
    const newFuture = [current, ...future];

    set({
      nodes: previous.nodes,
      edges: previous.edges,
      isDirty: true,
      history: {
        past: newPast,
        future: newFuture,
      }
    });
  },

  redo: () => {
    const { past, future } = get().history;
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);
    const current = {
      nodes: JSON.parse(JSON.stringify(get().nodes)),
      edges: JSON.parse(JSON.stringify(get().edges)),
    };
    const newPast = [...past, current];

    set({
      nodes: next.nodes,
      edges: next.edges,
      isDirty: true,
      history: {
        past: newPast,
        future: newFuture,
      }
    });
  },

  clearHistory: () => {
    set({
      history: {
        past: [],
        future: [],
      }
    });
  },

  // Active workflow being edited
  workflowId: `wf_${genId()}${Date.now().toString(36)}`,
  workflowName: 'Untitled Workflow',
  workflowDescription: '',
  workflowGroup: 'Default',
  workflowCategory: 'General',
  nodes: [
    { id: '__start__', type: 'agentNode', position: { x: 50, y: 200 }, data: { id: '__start__', type: 'start', label: 'START' } },
    { id: '__end__', type: 'agentNode', position: { x: 650, y: 200 }, data: { id: '__end__', type: 'end', label: 'END' } }
  ],
  edges: [],
  isDirty: false,
  isCompiled: false,
  dynamicResumption: false,
  warmup: false,
  autoNewSession: false,
  createdAt: null,
  updatedAt: null,

  // Persisted workflows list
  workflows: [], // Used for paged list in Workflows page
  allWorkflows: [], // Global catalog for dropdowns
  loadingWorkflows: false,
  loadingAllWorkflows: false,

  // Global Enterprise Connections Vault Cache
  connectionsVault: [],
  isVaultLoaded: false,
  invalidateVaultCache: () => set({ isVaultLoaded: false }),
  fetchConnectionsVault: async () => {
    if (get().isVaultLoaded) return;
    try {
      const api = await import('../api/agentmesh');
      const res = await api.listConnections();
      if (res.status === 'success') {
        set({ connectionsVault: res.connections || [], isVaultLoaded: true });
      }
    } catch (e) {
      console.error("Failed to load vault connections into store:", e);
    }
  },

  // PERSISTENT LIST STATE (Sticky Filters/Pagination)
  listCurrentPage: 1,
  listSearch: '',
  listCategory: 'All',
  listGroup: 'All',
  listViewMode: 'cards',

  setListCurrentPage: (val) => set({ listCurrentPage: val }),
  setListSearch: (val) => set({ listSearch: val }),
  setListCategory: (val) => set({ listCategory: val }),
  setListGroup: (val) => set({ listGroup: val }),
  setListViewMode: (val) => set({ listViewMode: val }),

  setWorkflowMeta: (id, name, desc, group, category, globalErrorNode, dynamicResumption, warmup, autoNewSession) =>
    set({
      workflowId: id,
      workflowName: name,
      workflowDescription: desc,
      workflowGroup: group || 'Default',
      workflowCategory: category || 'General',
      globalErrorNode: globalErrorNode || '',
      dynamicResumption: dynamicResumption ?? false,
      warmup: warmup ?? false,
      autoNewSession: autoNewSession ?? false,
      isDirty: true
    }),

  // setNodes/setEdges: only mark dirty for real content changes (not selection / layout changes from ReactFlow)
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  // Explicitly mark dirty when content changes
  setNodesDirty: (nodes) => set({ nodes, isDirty: true, isCompiled: false }),
  setEdgesDirty: (edges) => set({ edges, isDirty: true, isCompiled: false }),

  setNodeData: (nodeId, data) => {
    const now = Date.now();
    if (now - lastPropertyChangeTime > 1500) {
      get().takeHistorySnapshot();
    }
    lastPropertyChangeTime = now;
    set((s) => {
      // 1. Update the target node
      let nextNodes = s.nodes.map((n) => {
        if (n.id === nodeId) {
          const nextData = { ...n.data, ...data };
          return {
            ...n,
            data: nextData,
            ...(data.locked !== undefined ? { draggable: !data.locked } : {})
          };
        }
        return n;
      });

      // 2. SMART SYNC: If tools or configs changed, propagate to connected partners (Agent <-> ToolNode)
      if (data.tools || data.tool_configs) {
        const targetNode = nextNodes.find(n => n.id === nodeId);
        if (targetNode) {
          const type = targetNode.data?.type;
          const isAgent = ['llm_agent', 'deep_agent', 'supervisor', 'swarm'].includes(type);
          const isToolNode = type === 'tool_node';

          if (isAgent || isToolNode) {
            // Find all connected partners of the opposite role
            const partners = new Set(s.edges
              .filter(e => e.source === nodeId || e.target === nodeId)
              .map(e => e.source === nodeId ? e.target : e.source));

            nextNodes = nextNodes.map(n => {
              const isPartner = partners.has(n.id);
              const isOppositeType = isAgent ? n.data?.type === 'tool_node' : ['llm_agent', 'deep_agent', 'supervisor', 'swarm'].includes(n.data?.type);

              if (isPartner && isOppositeType) {
                return {
                  ...n,
                  data: {
                    ...n.data,
                    ...(data.tools ? { tools: data.tools } : {}),
                    ...(data.tool_configs ? { tool_configs: data.tool_configs } : {})
                  }
                };
              }
              return n;
            });
          }
        }
      }

      return {
        nodes: nextNodes,
        isDirty: true,
        isCompiled: false,
      };
    });
  },

  setEdgeData: (edgeId, data) => {
    get().takeHistorySnapshot();
    set((s) => ({
      edges: s.edges.map((e) => {
        if (e.id === edgeId) {
          const newData = { ...e.data, ...data };
          const cond = newData.condition;
          const hasCond = cond && cond.key && cond.value;
          return {
            ...e,
            data: newData,
            animated: !!hasCond,
            label: hasCond ? `${cond.key} ${cond.operator} ${cond.value}` : null,
            labelStyle: { fill: '#4F46E5', fontWeight: 700, fontSize: 10 },
            labelBgStyle: { fill: '#F5F3FF', fillOpacity: 0.9, rx: 4, stroke: '#C7D2FE', strokeWidth: 1 },
            labelBgPadding: [6, 4],
          };
        }
        return e;
      }),
      isDirty: true,
      isCompiled: false,
    }));
  },

  addNode: (type, position) => {
    let id = `${type}_${genId()}`;
    if (type === 'start') id = '__start__';
    if (type === 'end') id = '__end__';

    // Prevent duplicates of start/end (check by ID and by Type)
    const isSystemNode = type === 'start' || type === 'end';
    if (get().nodes.some(n => n.id === id || (isSystemNode && n.data?.type === type))) return id;

    const isCardboard = type === 'cardboard';
    const newNode = {
      id,
      type: isCardboard ? 'cardboardNode' : 'agentNode',
      position,
      data: { id, type, ...(NODE_DEFAULTS[type] || { label: type }) },
      ...(isCardboard ? {
        style: { width: 400, height: 300 },
        zIndex: -10
      } : {})
    };
    get().takeHistorySnapshot();
    set((s) => {
      const nextNodes = [...s.nodes, newNode];
      nextNodes.sort((a, b) => {
        const aIsBack = a.type === 'cardboardNode' || a.data?.type === 'cardboard';
        const bIsBack = b.type === 'cardboardNode' || b.data?.type === 'cardboard';
        if (aIsBack && !bIsBack) return -1;
        if (!aIsBack && bIsBack) return 1;
        return 0;
      });
      return { nodes: nextNodes, isDirty: true, isCompiled: false };
    });
    return id;
  },

  duplicateNode: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node || node.id === '__start__' || node.id === '__end__') return;

    const type = node.data?.type || 'node';
    const newId = `${type}_${genId()}`;
    const newNode = {
      ...node,
      id: newId,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      data: { ...node.data, id: newId, label: `${node.data.label} (Copy)` },
      selected: false,
    };

    get().takeHistorySnapshot();
    set((s) => {
      const nextNodes = [...s.nodes, newNode];
      nextNodes.sort((a, b) => {
        const aIsBack = a.type === 'cardboardNode' || a.data?.type === 'cardboard';
        const bIsBack = b.type === 'cardboardNode' || b.data?.type === 'cardboard';
        if (aIsBack && !bIsBack) return -1;
        if (!aIsBack && bIsBack) return 1;
        return 0;
      });
      return { nodes: nextNodes, isDirty: true, isCompiled: false };
    });
    return newId;
  },

  clearNodeData: (nodeId) => {
    get().takeHistorySnapshot();
    set((s) => ({
      nodes: s.nodes.map((n) => {
        if (n.id === nodeId) {
          const type = n.data?.type;
          return {
            ...n,
            data: { id: nodeId, type, ...(NODE_DEFAULTS[type] || { label: type }) },
          };
        }
        return n;
      }),
      isDirty: true,
      isCompiled: false,
    }));
  },

  unlinkNode: (nodeId) => {
    get().takeHistorySnapshot();
    set((s) => ({
      edges: s.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      isDirty: true,
      isCompiled: false,
    }));
  },

  removeNode: (nodeId) => {
    // Prevent deletion of system nodes
    if (nodeId === '__start__' || nodeId === '__end__') return;
    get().takeHistorySnapshot();
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== nodeId),
      edges: s.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      isDirty: true,
      isCompiled: false,
    }));
  },

  newWorkflow: () => {
    const id = `wf_${genId()}${Date.now().toString(36)}`;
    set({
      history: { past: [], future: [] },
      workflowId: id,
      workflowName: 'Untitled Workflow',
      workflowDescription: '',
      workflowGroup: 'Default',
      workflowCategory: 'General',
      nodes: [
        { id: '__start__', type: 'agentNode', position: { x: 50, y: 200 }, data: { id: '__start__', type: 'start', label: 'START' } },
        { id: '__end__', type: 'agentNode', position: { x: 650, y: 200 }, data: { id: '__end__', type: 'end', label: 'END' } },
      ],
      edges: [],
      isDirty: false,
      isCompiled: false,
      globalErrorNode: '',
      dynamicResumption: false,
      autoNewSession: false,
      createdAt: null,
      updatedAt: null,
    });
    // ✅ VARIABLE EXPLORER: Clear data explorer when starting a new workflow
    useRunStore.getState().reset();
  },

  loadWorkflowIntoEditor: async (w) => {
    if (!w) return;

    // If this is a summary object from the list endpoint (no config),
    // fetch the full workflow first before loading into the editor.
    if (!w.config) {
      try {
        const { getWorkflow } = await import('../api/agentmesh');
        const full = await getWorkflow(w.id);
        if (full) w = { ...w, ...full };
      } catch (e) {
        console.error('loadWorkflowIntoEditor: failed to fetch full config', e);
        return;
      }
    }

    const meta = w.config?.frontend_meta || w.frontend_meta || {};
    const rawNodes = (w.config?.nodes || w.nodes || []);
    const rawEdges = (w.config?.edges || w.edges || []);
    const triggers = w.config?.triggers || w.triggers || {};

    const { allNodes, rfEdges } = _reconstructRFNodesAndEdges(rawNodes, rawEdges, meta, triggers);

    set({
      history: { past: [], future: [] },
      workflowId: w.id,
      workflowName: w.name,
      workflowDescription: w.description || '',
      workflowGroup: w.group || 'Default',
      workflowCategory: w.category || 'General',
      globalErrorNode: w.config?.global_error_node || w.global_error_node || '',
      dynamicResumption: w.config?.dynamic_resumption || w.dynamic_resumption || false,
      warmup: w.warmup || false,
      autoNewSession: w.config?.auto_new_session || w.auto_new_session || false,
      nodes: allNodes,
      edges: rfEdges,
      isDirty: false,
      isCompiled: w.is_active || false,
      createdAt: w.created_at || null,
      updatedAt: w.updated_at || null,
    });
    // ✅ VARIABLE EXPLORER: Clear data explorer when loading an existing workflow
    useRunStore.getState().reset();
  },

  buildConfig: () => {
    const s = get();

    // Filter out system nodes and cardboards for the backend config
    const finalNodes = s.nodes
      .filter(n => !['__start__', '__end__'].includes(n.id) && n.type !== 'cardboardNode' && n.data?.type !== 'cardboard')
      .map((n) => {
        const d = n.data;

        // 🧪 WHITELIST: Only export fields defined in the Backend NodeConfig schema
        const validFields = [
          'id', 'type', 'label', 'position', 'task', 'llm', 'memory', 'iteration_policy',
          'tools', 'tool_configs', 'return_direct', 'routing_key', 'workflow_id', 'member_ids', 'allowed_transitions',
          'branches', 'condition', 'message', 'wait_seconds', 'skills', 'custom_python_rules', 'python_rules',
          'subagents', 'harness_profile', 'code_interpreter', 'max_iterations', 'timeout_seconds', 'context_schema',
          'parse_mode', 'fallback_to_raw', 'output_context_key',
          'deep_agent_backend', 'deep_agent_root_dir',
          'vector_store', 'vector_collection', 'embedding_model',
          'chunk_size', 'chunk_overlap', 'ingestion_source_key',
          'k_results', 'threshold', 'chunking_strategy', 'search_type',
          'interrupt_before', 'interrupt_after', 'hitl_actions',
          'audio_voice', 'mute_audio',
          'split_field', 'batch_size',
          'file_format', 'file_name', 'file_data_key', 'file_overwrite',
          'api_method', 'api_url', 'api_headers', 'api_params', 'api_body', 'api_auth_type', 'api_auth_config', 'api_response_format', 'connection_id', 'api_protocol', 'graphql_query',
          'notification_title', 'notification_message', 'notification_type', 'mute_notification_message', 'show_chat_button',
          'form_title', 'form_description', 'form_fields', 'form_submit_label', 'form_use_context_schema',
          'pii_engine', 'pii_target', 'pii_entities', 'pii_custom_regex',
          'data_cleaning_rules', 'data_cleaning_target', 'data_cleaning_input_key', 'data_cleaning_output_key',
          'graph_target_key', 'graph_neo4j_uri', 'graph_neo4j_user', 'graph_neo4j_password',
          'graph_collection', 'graph_sender_key', 'graph_receiver_key', 'graph_txn_id_key', 'graph_amount_key', 'graph_timestamp_key',
          'ocr_input_key', 'ocr_prompt', 'ocr_engine', 'ocr_standard_model',
          'on_error',
          'response_status', 'response_headers', 'response_body_key',
          'direct_tool_name', 'tool_arguments', 'destination_key',
          'classification_classes', 'classification_summary', 'classification_engine', 'classification_input_field',
          'template_content', 'template_output_key', 'template_data_key', 'template_file_path',
          'button_label', 'button_input', 'button_category',
          'jt_input_key', 'jt_output_key', 'jt_mode', 'jt_query', 'jt_operations', 'jt_expression', 'jt_pass_through',
          'weightage_categories', 'weightage_output_key'
        ];

        const nodeConfig = {};
        validFields.forEach(field => {
          if (d[field] !== undefined) nodeConfig[field] = d[field];
        });

        // Ensure ID and position are correctly set from React Flow node state
        nodeConfig.id = n.id;
        nodeConfig.position = n.position || { x: 0, y: 0 };
        if (!nodeConfig.label) nodeConfig.label = d.label || n.id;

        return nodeConfig;
      });

    const systemIds = new Set(['__start__', '__end__']);

    const cardboardNodes = s.nodes.filter(n => n.type === 'cardboardNode' || n.data?.type === 'cardboard');

    const frontend_meta = {
      // Store positions of START/END nodes for full layout restoration
      system_positions: Object.fromEntries(
        s.nodes.filter(n => systemIds.has(n.id) || ['webhook', 'cron', 'polling'].includes(n.data.type)).map(n => [n.id === '__start__' || n.id === '__end__' ? n.id : n.data.type, n.position])
      ),
      cardboards: cardboardNodes.map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
        style: n.style,
        zIndex: n.zIndex ?? -10
      }))
    };

    const finalEdges = s.edges
      .filter(e => !systemIds.has(e.source) || !systemIds.has(e.target))
      .map((e) => {
        return {
          source: e.source === '__start__' ? 'START' : e.source,
          target: e.target === '__end__' ? 'END' : e.target,
          source_handle: e.sourceHandle || null,
          target_handle: e.targetHandle || null,
          condition: e.data?.condition || null,
        };
      });

    // Extract Triggers from special trigger nodes with validation
    const webhookNode = s.nodes.find(n => n.data.type === 'webhook');
    const cronNode = s.nodes.find(n => n.data.type === 'cron');
    const pollingNode = s.nodes.find(n => n.data.type === 'polling');

    const triggers = {};

    if (webhookNode) {
      triggers.webhook = {
        enabled: webhookNode.data.enabled !== false,
        path: webhookNode.data.path || null,
        secret: webhookNode.data.secret || null,
        auth_method: webhookNode.data.auth_method || 'header',
        response_mode: webhookNode.data.response_mode || 'immediate',
        response_node: webhookNode.data.response_node || null
      };
    }

    if (cronNode) {
      // ✅ FIX: Validate cron_expression is not empty (required field)
      const cronExpr = cronNode.data.cron_expression?.trim();
      if (!cronExpr) {
        throw new Error('❌ Cron node requires a valid cron expression (e.g., "0 9 * * *")');
      }

      triggers.cron = {
        enabled: cronNode.data.enabled !== false,
        cron_expression: cronExpr,
        timezone: cronNode.data.timezone || 'UTC'
      };
    }

    if (pollingNode) {
      const pollerTool = pollingNode.data.poller_tool?.trim();
      if (!pollerTool) {
        throw new Error('❌ Polling trigger requires a valid poller tool (e.g., "fetch_support_tickets")');
      }

      triggers.polling = {
        enabled: pollingNode.data.enabled !== false,
        poller_tool: pollerTool,
        tool_arguments: pollingNode.data.tool_arguments || {},
        destination_key: pollingNode.data.destination_key || 'payload',
        cron_expression: pollingNode.data.cron_expression || '*/5 * * * *',
        timezone: pollingNode.data.timezone || 'UTC'
      };
    }

    return {
      id: s.workflowId || genId(),
      name: s.workflowName,
      description: s.workflowDescription,
      group: s.workflowGroup,
      category: s.workflowCategory,
      global_error_node: s.globalErrorNode || null,
      dynamic_resumption: s.dynamicResumption || false,
      warmup: s.warmup || false,
      auto_new_session: s.autoNewSession || false,
      triggers: Object.keys(triggers).length > 0 ? triggers : null,
      nodes: finalNodes,
      edges: finalEdges,
      frontend_meta,
    };
  },

  setWorkflows: (workflows) => set({ workflows }),
  setAllWorkflows: (allWorkflows) => set({ allWorkflows }),
  setLoadingWorkflows: (v) => set({ loadingWorkflows: v }),
  setLoadingAllWorkflows: (v) => set({ loadingAllWorkflows: v }),

  markClean: () => set({ isDirty: false }),
  markCompiled: () => set({ isDirty: false, isCompiled: true }),

  importWorkflow: (config) => {
    const newId = config.id || `wf_${genId()}${Date.now().toString(36)}`;
    const meta = config.config?.frontend_meta || config.frontend_meta || {};
    const rawNodes = (config.config?.nodes || config.nodes || []);
    const rawEdges = (config.config?.edges || config.edges || []);
    const triggers = config.triggers || {};

    const { allNodes, rfEdges } = _reconstructRFNodesAndEdges(rawNodes, rawEdges, meta, triggers);

    set({
      history: { past: [], future: [] },
      workflowId: newId,
      workflowName: config.name || 'Imported Workflow',
      workflowDescription: config.description || '',
      globalErrorNode: config.global_error_node || '',
      dynamicResumption: config.dynamic_resumption || false,
      autoNewSession: config.auto_new_session || false,
      nodes: allNodes,
      edges: rfEdges,
      isDirty: true,
      isCompiled: false,
    });
    return newId;
  },

  mergeTemplateIntoEditor: (w) => {
    if (!w) return;
    const meta = w.config?.frontend_meta || w.frontend_meta || {};
    const rawNodes = (w.config?.nodes || w.nodes || []);
    const rawEdges = (w.config?.edges || w.edges || []);
    const triggers = w.config?.triggers || w.triggers || {};

    const { allNodes, rfEdges } = _reconstructRFNodesAndEdges(rawNodes, rawEdges, meta, triggers);

    // 1. Filter out system nodes like '__start__' and '__end__'
    const operationalNodes = allNodes.filter(n => n.id !== '__start__' && n.id !== '__end__');

    // 2. Resolve ID Collisions & generate unique IDs for incoming nodes
    const existingNodeIds = new Set(get().nodes.map(n => n.id));
    const idMap = {}; // oldId -> newId

    // Estimate coordinates to shift so they don't overlap. Shift slightly offset.
    const offset = 180;

    const processedNodes = operationalNodes.map(n => {
      let newId = n.id;
      if (existingNodeIds.has(n.id)) {
        newId = `${n.id}_merged_${Math.random().toString(36).substring(2, 6)}`;
      }
      idMap[n.id] = newId;

      const nextPosition = {
        x: (n.position?.x ?? 0) + offset,
        y: (n.position?.y ?? 0) + offset
      };

      return {
        ...n,
        id: newId,
        position: nextPosition,
        data: {
          ...n.data,
          id: newId
        }
      };
    });

    // 3. Map edge IDs, sources, and targets, filtering out start/end connections
    const processedEdges = rfEdges
      .filter(e => e.source !== '__start__' && e.target !== '__end__')
      .map((e, idx) => {
        const newSource = idMap[e.source] || e.source;
        const newTarget = idMap[e.target] || e.target;
        const newId = `e_merged_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}_${idx}`;
        return {
          ...e,
          id: newId,
          source: newSource,
          target: newTarget
        };
      });

    get().takeHistorySnapshot();
    // 4. Append to active state
    set((s) => ({
      nodes: [...s.nodes, ...processedNodes],
      edges: [...s.edges, ...processedEdges],
      isDirty: true,
      isCompiled: false
    }));
  },
}));

// ─── UI Store ─────────────────────────────────────────────────────────────────
export const useUIStore = create((set) => ({
  activePage: 'dashboard',   // dashboard | canvas | workflows | logs | tools | rag
  selectedNodeId: null,
  selectedEdgeId: null,
  panelOpen: false,
  rightPanel: 'properties', // properties | palette
  sidebarCollapsed: false,
  showNotes: false,
  showNotifications: false,
  showVariableExplorer: false,
  setShowVariableExplorer: (v) => set({ showVariableExplorer: v }),
  unreadCount: 0,
  activeLibraryTab: 'agents', // agents | tools | apis
  setActiveLibraryTab: (tab) => set({ activeLibraryTab: tab }),
  suggestionSource: null, // { nodeId, handleId }
  setSuggestionSource: (v) => set({ suggestionSource: v }),
  searchOpen: false,
  setSearchOpen: (v) => set({ searchOpen: v }),

  // ─── Initialization guard (Strict Mode safe) ───────────────────────────────
  // Static class property (MainComponent._initialized) is NOT safe in React
  // Strict Mode — effects run twice and the flag blocks the second run.
  // Zustand state survives the double-invoke correctly.
  meshInitialized: false,
  setMeshInitialized: (v) => set({ meshInitialized: v }),

  // ─── Template browser visibility ──────────────────────────────────────────
  // Previously missing from the store — useUIStore(s => s.showTemplates) in
  // MainComponent was always returning undefined (falsy), meaning !showTemplates
  // was always true and the Navbar always rendered. Now properly wired so any
  // future template browser feature can call setShowTemplates(true) and the
  // Navbar hides correctly.
  showTemplates: false,
  setShowTemplates: (v) => set({ showTemplates: v }),

  // Management states (for Navbar integration)
  managementSearch: '',
  managementWfFilter: '',
  refreshTrigger: 0,
  showManagementModal: false,
  isSyncing: false,
  runOpen: false,
  initialRunInput: null,
  targetNodeId: null,
  setInitialRunInput: (val) => set({ initialRunInput: val }),
  setTargetNodeId: (val) => set({ targetNodeId: val }),

  setActivePage: (p) => set({
    activePage: p,
    selectedNodeId: null,
    selectedEdgeId: null,
    panelOpen: false,
    managementSearch: '',
    managementWfFilter: '',
    showManagementModal: false
  }),
  setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null, panelOpen: !!id, rightPanel: 'properties' }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null, panelOpen: !!id, rightPanel: 'properties' }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  toggleNotes: () => set((s) => ({ showNotes: !s.showNotes })),
  setShowNotifications: (v) => set({ showNotifications: v }),
  setUnreadCount: (v) => set((s) => ({ unreadCount: typeof v === 'function' ? v(s.unreadCount) : v })),
  openPalette: () => set({ panelOpen: true, rightPanel: 'palette', selectedNodeId: null, selectedEdgeId: null }),
  setRightPanel: (p) => set({ rightPanel: p }),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  setManagementSearch: (s) => set({ managementSearch: s }),
  setManagementWfFilter: (f) => set({ managementWfFilter: f }),
  triggerRefresh: () => set((s) => ({ refreshTrigger: s.refreshTrigger + 1 })),
  setShowManagementModal: (v) => set({ showManagementModal: v }),
  setIsSyncing: (v) => set({ isSyncing: v }),
  setRunOpen: (v) => set({ runOpen: v }),

  // ─── Canvas Visual Settings (persisted to localStorage) ───────────────────
  canvasWireStyle: (typeof window !== 'undefined' ? localStorage.getItem('canvas_wire_style') : 'square') || 'square',
  canvasBackgroundStyle: (typeof window !== 'undefined' ? localStorage.getItem('canvas_background_style') : 'dots') || 'dots',
  canvasNodeTheme: (typeof window !== 'undefined' ? localStorage.getItem('canvas_node_theme') : 'modern') || 'modern',
  canvasDotSize: parseFloat((typeof window !== 'undefined' ? localStorage.getItem('canvas_dot_size') : '1.5') || '1.5'),
  canvasEdgeWidth: parseFloat((typeof window !== 'undefined' ? localStorage.getItem('canvas_edge_width') : '3.5') || '3.5'),
  canvasHandleSize: parseInt((typeof window !== 'undefined' ? localStorage.getItem('canvas_handle_size') : '10') || '10', 10),
  canvasConnectionRadius: parseInt((typeof window !== 'undefined' ? localStorage.getItem('canvas_connection_radius') : '20') || '20', 10),
  setCanvasWireStyle: (v) => {
    if (typeof window !== 'undefined') localStorage.setItem('canvas_wire_style', v);
    set({ canvasWireStyle: v });
  },
  setCanvasBackgroundStyle: (v) => {
    if (typeof window !== 'undefined') localStorage.setItem('canvas_background_style', v);
    set({ canvasBackgroundStyle: v });
  },
  setCanvasNodeTheme: (v) => {
    if (typeof window !== 'undefined') localStorage.setItem('canvas_node_theme', v);
    set({ canvasNodeTheme: v });
  },
  setCanvasDotSize: (v) => {
    if (typeof window !== 'undefined') localStorage.setItem('canvas_dot_size', v.toString());
    set({ canvasDotSize: v });
  },
  setCanvasEdgeWidth: (v) => {
    if (typeof window !== 'undefined') localStorage.setItem('canvas_edge_width', v.toString());
    set({ canvasEdgeWidth: v });
  },
  setCanvasHandleSize: (v) => {
    if (typeof window !== 'undefined') localStorage.setItem('canvas_handle_size', v.toString());
    set({ canvasHandleSize: v });
  },
  setCanvasConnectionRadius: (v) => {
    if (typeof window !== 'undefined') localStorage.setItem('canvas_connection_radius', v.toString());
    set({ canvasConnectionRadius: v });
  },
}));

// ─── Run Store ────────────────────────────────────────────────────────────────
export const useRunStore = create((set) => ({
  running: false,
  streamEvents: [],
  runOutput: null,
  runError: null,
  threadId: null,
  history: [], // List of previous threads { thread_id, first_message, created_at }
  latestContext: {},
  setLatestContext: (ctx) => set({ latestContext: ctx }),
  pausedInfo: {
    isPaused: false,
    nextNode: null,
    pausedNodeOutput: null,
    threadId: null,
    currentStep: 0,
    totalSteps: 0,
    inputTokens: 0,
    outputTokens: 0,
    showReworkForm: false,
    enabledActions: ['approve', 'rework', 'reject'],
    includeOriginalOutput: true,
    injectFeedback: true
  },

  startRun: (threadId) => set((s) => ({
    running: true,
    runError: null,
    runOutput: null,
    threadId: threadId || s.threadId
  })),
  addEvent: (evt) => set((s) => ({ streamEvents: [...s.streamEvents, evt] })),
  setEvents: (evts) => set({ streamEvents: evts }),
  finishRun: (output) => set({ running: false, runOutput: output }),
  setError: (err) => set({ running: false, runError: err }),
  setPausedInfo: (info) => set({ pausedInfo: info }),
  removeEventsFromIndex: (index) => set((s) => ({ streamEvents: s.streamEvents.slice(0, index) })),

  setHistory: (history) => set({ history }),
  addToHistory: (item) => set((s) => ({
    history: [item, ...s.history.filter(h => h.thread_id !== item.thread_id)]
  })),
  removeFromHistory: (threadId) => set((s) => ({
    history: s.history.filter(h => h.thread_id !== threadId)
  })),
  reset: () => set({
    running: false,
    streamEvents: [],
    runOutput: null,
    runError: null,
    threadId: null,
    latestContext: {},
    pausedInfo: {
      isPaused: false,
      nextNode: null,
      pausedNodeOutput: null,
      threadId: null,
      currentStep: 0,
      totalSteps: 0,
      inputTokens: 0,
      outputTokens: 0,
      showReworkForm: false,
      enabledActions: ['approve', 'rework', 'reject'],
      includeOriginalOutput: true,
      injectFeedback: true
    }
  }),
}));
