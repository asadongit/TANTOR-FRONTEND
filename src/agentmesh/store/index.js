import { create } from 'zustand';
// ─── Constants & Utils ──────────────────────────────────────────────────────────
const genId = () => Math.random().toString(36).substring(2, 7);

// Generate a node ID guaranteed not to collide with existing node IDs.
const genUniqueNodeId = (type, existingIds) => {
  let id;
  do {
    id = `${type}_${genId()}`;
  } while (existingIds.has(id));
  return id;
};

// Type-based unique name: set_data, set_data_1, set_data_2, ...
const genUniqueTypeName = (type, existingNames) => {
  if (!existingNames.has(type)) return type;
  let n = 1;
  while (existingNames.has(`${type}_${n}`)) n++;
  return `${type}_${n}`;
};

// Ensure a duplicated node's label stays unique (X (Copy), X (Copy) 1, ...).
const genUniqueCopyName = (baseCopy, existingNames) => {
  if (!existingNames.has(baseCopy)) return baseCopy;
  let n = 1;
  while (existingNames.has(`${baseCopy} ${n}`)) n++;
  return `${baseCopy} ${n}`;
};

// Native deep-clone for history snapshots — 3-5x faster than the legacy
// JSON.parse(JSON.stringify(...)) double-encode path in modern engines (F5).
// Falls back to the JSON technique where structuredClone is unavailable.
const deepClone = (value) => {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};

const NODE_DEFAULTS = {
  start: { label: 'START' },
  end: { label: 'END' },
  chat_model: { label: 'Chat Model', provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0 },
  memory: { label: 'Memory', type_name: 'buffer_memory', window_size: 10 },
  llm_agent: { label: 'LLM Agent', task: '', llm: { provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0 }, iteration_policy: { enabled: false, max_iterations: 3, target_score: 0.8, evaluator_task: '', inject_feedback_as: 'human' }, memory: null, tools: [], tool_configs: {}, return_direct: false, interrupt_before: false, interrupt_after: false, allowed_transitions: null, agent_input_prefix: 'agent_input_', output_key_prefix: 'cd_output_', context_mode: 'smart' },
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
  splitter: { label: 'Splitter', split_field: 'items', batch_size: 1, destination_field: 'item', discovery_keys: '' },
  aggregator: { label: 'Aggregator', action: 'append', field_to_aggregate: 'item', destination_field: 'aggregated_results', group_by: '' },
  form_node: { label: 'Form Submission', form_title: 'Information Required', form_description: 'Please fill out the following form.', form_fields: [{ id: 'feedback', label: 'Your Feedback', type: 'text', required: true }], form_submit_label: 'Submit' },
  camera: { label: 'Camera Capture', form_title: 'Camera Verification', form_description: 'Please align your face in the frame and capture a live image for verification.', form_fields: [], form_submit_label: 'Submit Photo' },
  notification: { label: 'Notification', notification_title: 'Workflow Alert', notification_message: 'The workflow has reached this point.', notification_type: 'info' },
  error_router: { label: 'Error Router', llm: { provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0 } },
  set_data: { label: 'Set Data', message: '' },
  output_parser: { label: 'Output Parser', parse_mode: 'auto', fallback_to_raw: true, output_context_key: 'parsed_output' },
  pii_node: { label: 'PII Masking', pii_engine: 'regex', pii_target: 'latest_message', pii_entities: ['EMAIL_ADDRESS', 'PHONE_NUMBER', 'PERSON'], pii_custom_regex: [], docbot_url: 'http://localhost:8000', docbot_method: 'hybrid', hitl_enabled: false, identifiers_input_key: 'extracted_identifiers', rendered_input_key: 'ocr_like_results' },
  data_cleaning: { label: 'Data Cleaning', data_cleaning_rules: ['GEN_TRIM_WHITESPACE'], data_cleaning_target: 'latest_message', data_cleaning_input_key: '', data_cleaning_output_key: 'cleaned_data' },
  graph_ingestion: { label: 'Graph Ingestion', graph_target_key: 'latest_message', graph_neo4j_uri: '', graph_neo4j_user: '', graph_neo4j_password: '', graph_ingestion_mode: 'visual', graph_cypher_query: '', graph_nodes_schema: [], graph_relations_schema: [] },
  db_node: { label: 'Database', db_engine: 'mongodb', db_operation: 'insert_one', db_output_key: 'db_result', db_limit: 100 },
  ocr_node: { label: 'OCR Node', ocr_input_key: '', ocr_prompt: 'Please perform OCR on this document and return the full text accurately.', llm: { provider: 'groq', model: 'llama-3.2-90b-vision-preview', temperature: 0 }, interrupt_before: false, interrupt_after: false },
  multi_file_ingestion: { label: 'Multi-File Ingestion', allowed_extensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp'], max_file_size_mb: 25.0, max_files_count: 10, strategy_rules: [], interrupt_before: true, interrupt_after: false },
  signature_stamp_extractor: { label: 'Signature & Stamp Extractor', extractor_input_key: 'latest_file_path', extractor_output_key: 'extracted_elements', llm: { provider: 'groq', model: 'meta-llama/llama-4-scout-17b-16e-instruct', temperature: 0 }, interrupt_before: false, interrupt_after: false },
  api_node: { label: 'API Request', method: 'GET', url: '', headers: {}, params: {}, body: '', auth_method: 'none', api_auth_config: {}, use_curl: false, curl_command: '' },
  vector_ingestion: { label: 'Vector Ingestion', vector_store: 'chroma', vector_collection: 'default', chunk_size: 1000, chunk_overlap: 100, chunking_strategy: 'recursive', ingestion_source_key: 'latest_ocr_output' },
  classification: { label: 'Classification Agent', classification_classes: [{ class: 'Class A', description: 'Description for Class A' }], classification_summary: false, classification_engine: 'llm', classification_input_field: '', classification_input_key: '', llm: { provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0 } },
  sensitivity_classifier: { label: 'Sensitivity Classifier', classification_input_key: 'latest_ocr_output', classification_output_key: '', engine_mode: 'both', custom_entities: '', output_format: 'markdown' },
  pii_gate_node: { label: 'PII Verification Gate', input_key: 'latest_ocr_output', interrupt_after: true },
  ingestion_router: { label: 'Ingestion Router', scan_mode: 'auto', file_filters: ['.pdf', '.jpg', '.png', '.jpeg'], concurrency_limit: 5, parent_folder_key: 'parent_folder_path', folder_identifier_key: 'customer_folder_name', curl_command_key: 'curl_command' },
  event_emitter: { label: 'Event Emitter', webhook_url: 'http://localhost:8000/documents/mesh-status-sync', emit_status: '', interrupt_before: false, interrupt_after: false },
  cardboard: { label: 'Sticky Note', color: 'slate' },
  json_transform: {
    label: 'JSON Transform',
    jt_input_key: '',
    jt_output_key: 'transformed_data',
    jt_mode: 'jmespath',
    jt_query: '',
    jt_operations: [],
    jt_expression: '',
    jt_pass_through: false
  },
  code_execution: {
    label: 'Code',
    ce_language: 'python',
    ce_code: '',
    ce_input_key: 'latest_api_result',
    ce_output_key: 'code_result',
    ce_mode: 'run_once',
  },
  email_node: {
    label: 'Email Sender',
    email_auth_method: 'smtp',
    email_tenant_id: '',
    email_client_id: '',
    email_client_secret: '',
    email_google_service_account_json: '',
    email_google_delegated_user: '',
    email_provider: 'Custom',
    email_to: '',
    email_cc: '',
    email_bcc: '',
    email_subject: '',
    email_body: '',
    email_html: false,
    email_smtp_server: 'smtp.gmail.com',
    email_smtp_port: 587,
    email_user: '',
    email_password: '',
    email_attachments: '',
    email_headers: {},
    email_smtp_timeout: 15
  },
  stt_trigger: {
    label: 'Speech to Text',
    auto_start: false,
    auto_stop: true,
    silence_delay: 1500,
    stt_lang: 'en-US'
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
  },
  group: {
    label: 'Group Node',
    name: 'Group Node',
    description: '',
    internal_nodes: [],
    internal_edges: [],
    original_edges: []
  },
  textToAudio: {
    label: 'Text to Speech',
    tts_library: 'piper',
    audio_voice: 'en-US-GuyNeural',
    kittentts_model: 'KittenML/kitten-tts-micro-0.8',
    audio_speed: 1.0,
    mute_audio: false,
    audio_input_text: ''
  },
  vision_intelligence: {
    label: 'Vision Intelligence',
    vision_mode: 'face_verification',
    vision_enable_llm: false,
    vision_face_match_threshold: 0.65,
    vision_quality_min_score: 0.70,
    vision_quality_blur_threshold: 100,
    vision_quality_min_contrast: 0.10,
    vision_quality_max_contrast: 0.45,
    vision_id_image_key: 'latest_file_path',
    vision_selfie_image_key: 'vcip_capture_path',
    vision_output_key: 'vision_result',
    llm: { provider: 'groq', model: 'meta-llama/llama-4-scout-17b-16e-instruct', temperature: 0 }
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
          custom_python_rules: n.custom_python_rules || n.data?.custom_python_rules || '',
          member_ids: n.member_ids || n.data?.member_ids || [],
          iteration_policy: n.iteration_policy || n.data?.iteration_policy || { enabled: false, max_iterations: 3, target_score: 0.8, evaluator_task: '', inject_feedback_as: 'human' },
          branches: n.branches || n.data?.branches || [],
          condition: n.condition || n.data?.condition || '',
          message: n.message || n.data?.message || '',
          task: n.task || n.data?.task || '',
          llm: n.llm || n.data?.llm || { provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0 },
          wait_seconds: n.wait_seconds || n.data?.wait_seconds || 0,
          skills: n.skills || n.data?.skills || [],
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
          use_curl: n.use_curl ?? n.data?.use_curl ?? false,
          curl_command: n.curl_command || n.data?.curl_command || '',
          jt_input_key: n.jt_input_key ?? n.data?.jt_input_key ?? '',
          jt_output_key: n.jt_output_key || n.data?.jt_output_key || 'transformed_data',
          jt_mode: n.jt_mode || n.data?.jt_mode || 'jmespath',
          jt_query: n.jt_query || n.data?.jt_query || '',
          jt_operations: n.jt_operations || n.data?.jt_operations || [],
          jt_expression: n.jt_expression || n.data?.jt_expression || '',
          jt_pass_through: n.jt_pass_through ?? n.data?.jt_pass_through ?? false,
          weightage_categories: n.weightage_categories || n.data?.weightage_categories || [],
          weightage_output_key: n.weightage_output_key || n.data?.weightage_output_key || 'weightage_result',
          weightage_approve_threshold: n.weightage_approve_threshold ?? n.data?.weightage_approve_threshold ?? 80,
          weightage_review_threshold: n.weightage_review_threshold ?? n.data?.weightage_review_threshold ?? 50,
          weightage_risk_bands: n.weightage_risk_bands || n.data?.weightage_risk_bands || [],
          weightage_output_flags: n.weightage_output_flags || n.data?.weightage_output_flags || [],
          weightage_cross_rules: n.weightage_cross_rules || n.data?.weightage_cross_rules || [],
          extractor_input_key: n.extractor_input_key || n.data?.extractor_input_key || 'latest_file_path',
          extractor_output_key: n.extractor_output_key || n.data?.extractor_output_key || 'extracted_elements',
          vision_mode: n.vision_mode || n.data?.vision_mode || 'face_verification',
          vision_enable_llm: n.vision_enable_llm ?? n.data?.vision_enable_llm ?? false,
          vision_face_match_threshold: n.vision_face_match_threshold ?? n.data?.vision_face_match_threshold ?? 0.65,
          vision_quality_min_score: n.vision_quality_min_score ?? n.data?.vision_quality_min_score ?? 0.70,
          vision_quality_blur_threshold: n.vision_quality_blur_threshold ?? n.data?.vision_quality_blur_threshold ?? 100,
          vision_quality_min_contrast: n.vision_quality_min_contrast ?? n.data?.vision_quality_min_contrast ?? 0.10,
          vision_quality_max_contrast: n.vision_quality_max_contrast ?? n.data?.vision_quality_max_contrast ?? 0.45,
          vision_id_image_key: n.vision_id_image_key || n.data?.vision_id_image_key || 'latest_file_path',
          vision_selfie_image_key: n.vision_selfie_image_key || n.data?.vision_selfie_image_key || 'vcip_capture_path',
          vision_output_key: n.vision_output_key || n.data?.vision_output_key || 'vision_result',
          allowed_extensions: n.allowed_extensions || n.data?.allowed_extensions || ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
          max_file_size_mb: n.max_file_size_mb ?? n.data?.max_file_size_mb ?? 25.0,
          max_files_count: n.max_files_count ?? n.data?.max_files_count ?? 10,
          strategy_rules: n.strategy_rules || n.data?.strategy_rules || [],
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

  const restoredCardboards = (meta.cardboards || []).map(n => ({ ...n, type: 'cardboardNode', zIndex: n.zIndex ?? -10, draggable: !n.data?.locked, selectable: !n.data?.locked }));
  const allNodes = [...restoredCardboards, ...rfNodes];

  const startNode = rawNodes.find(n => n.type === 'start');
  const endNode = rawNodes.find(n => n.type === 'end');

  const mappedEdges = rawEdges.map((e, i) => {
    const cond = e.condition;
    const hasCond = cond && cond.key && cond.value;
    const isBp = Boolean(e.is_breakpoint || e.data?.isBreakpoint);
    return {
      id: e.id || `e${i}`,
      source: (e.source === 'START' || e.source === 'start' || e.source === startNode?.id) ? '__start__' : e.source,
      target: (e.target === 'END' || e.target === 'end' || e.target === endNode?.id) ? '__end__' : e.target,
      sourceHandle: e.source_handle || e.sourceHandle || null,
      targetHandle: e.target_handle || e.targetHandle || null,
      data: { condition: e.condition, isBreakpoint: isBp, ...(e.data || {}) },
      animated: !!hasCond,
      label: hasCond ? `${cond.key} ${cond.operator || '=='} ${cond.value}` : null,
      labelStyle: { fill: '#4F46E5', fontWeight: 700, fontSize: 10 },
      labelBgStyle: { fill: '#F5F3FF', fillOpacity: 0.9, rx: 4, stroke: '#C7D2FE', strokeWidth: 1 },
      type: 'smoothstep',
      style: { stroke: isBp ? '#ef4444' : '#CBD5E1', strokeWidth: isBp ? 2.5 : 1.5 },
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
      nodes: deepClone(s.nodes),
      edges: deepClone(s.edges),
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
      nodes: deepClone(get().nodes),
      edges: deepClone(get().edges),
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
      nodes: deepClone(get().nodes),
      edges: deepClone(get().edges),
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
  previewingGroupId: null,
  previewNodeIds: [],
  previewGroupOriginalNode: null,

  // Persisted workflows list
  workflows: [], // Used for paged list in Workflows page
  allWorkflows: [], // Global catalog for dropdowns
  loadingWorkflows: false,
  loadingAllWorkflows: false,
  isLoadingWorkflow: false,

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
      workflowGroup: group ?? '',
      workflowCategory: category ?? '',
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
      // 1. Update the target node (checks top-level and inside group nodes)
      let nextNodes = s.nodes.map((n) => {
        if (n.id === nodeId) {
          const nextData = { ...n.data, ...data };
          return {
            ...n,
            data: nextData,
            ...(data.locked !== undefined ? { draggable: !data.locked, selectable: !data.locked } : {})
          };
        }
        if (n.data?.type === 'group' && n.data?.internal_nodes) {
          const hasMatch = n.data.internal_nodes.some(sub => sub.id === nodeId);
          if (hasMatch) {
            const updatedInternalNodes = n.data.internal_nodes.map((sub) => {
              if (sub.id === nodeId) {
                return {
                  ...sub,
                  data: { ...sub.data, ...data }
                };
              }
              return sub;
            });
            return {
              ...n,
              data: {
                ...n.data,
                internal_nodes: updatedInternalNodes
              }
            };
          }
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
    const existingNodes = get().nodes;
    const existingIds = new Set(existingNodes.map(n => n.id));
    const existingNames = new Set(existingNodes.map(n => n.data?.label));

    let id;
    if (type === 'start') id = '__start__';
    else if (type === 'end') id = '__end__';
    else id = genUniqueNodeId(type, existingIds);

    // Prevent duplicates of start/end (check by ID and by Type)
    const isSystemNode = type === 'start' || type === 'end';
    if (existingNodes.some(n => n.id === id || (isSystemNode && n.data?.type === type))) return id;

    const isCardboard = type === 'cardboard';
    const defaults = NODE_DEFAULTS[type] || { label: type };
    const label = isSystemNode ? (defaults.label || type) : genUniqueTypeName(type, existingNames);
    const newNode = {
      id,
      type: isCardboard ? 'cardboardNode' : 'agentNode',
      position,
      data: { id, type, ...defaults, label },
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
    if (!node || node.id === '__start__' || node.id === '__end__' || node.data?.type === 'group') return;

    const type = node.data?.type || 'node';
    const existingNodes = get().nodes;
    const existingIds = new Set(existingNodes.map(n => n.id));
    const existingNames = new Set(existingNodes.map(n => n.data?.label));
    const newId = genUniqueNodeId(type, existingIds);
    const label = genUniqueCopyName(`${node.data.label || type} (Copy)`, existingNames);
    const newNode = {
      ...node,
      id: newId,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      data: { ...node.data, id: newId, label },
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

  duplicateNodes: (nodeIds) => {
    const idsToDuplicate = nodeIds.filter(id => {
      const node = get().nodes.find(n => n.id === id);
      return id !== '__start__' && id !== '__end__' && node?.data?.type !== 'group';
    });
    if (idsToDuplicate.length === 0) return;
    
    get().takeHistorySnapshot();
    set((s) => {
      const newNodes = [];
      const usedIds = new Set(s.nodes.map(n => n.id));
      const usedNames = new Set(s.nodes.map(n => n.data?.label));

      idsToDuplicate.forEach((nodeId) => {
        const node = s.nodes.find((n) => n.id === nodeId);
        if (!node) return;
        
        const type = node.data?.type || 'node';
        const newId = genUniqueNodeId(type, usedIds);
        const label = genUniqueCopyName(`${node.data.label || type} (Copy)`, usedNames);
        usedIds.add(newId);
        usedNames.add(label);
        
        const newNode = {
          ...node,
          id: newId,
          position: { x: node.position.x + 40, y: node.position.y + 40 },
          data: { ...node.data, id: newId, label },
          selected: false,
        };
        newNodes.push(newNode);
      });
      
      const nextNodes = [...s.nodes, ...newNodes];
      nextNodes.sort((a, b) => {
        const aIsBack = a.type === 'cardboardNode' || a.data?.type === 'cardboard';
        const bIsBack = b.type === 'cardboardNode' || b.data?.type === 'cardboard';
        if (aIsBack && !bIsBack) return -1;
        if (!aIsBack && bIsBack) return 1;
        return 0;
      });
      
      return { 
        nodes: nextNodes, 
        isDirty: true, 
        isCompiled: false 
      };
    });
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

  groupNodes: (nodeIds) => {
    if (!nodeIds || nodeIds.length < 2) return;
    get().takeHistorySnapshot();

    const currentNodes = get().nodes;
    const currentEdges = get().edges;

    const validNodeIds = nodeIds.filter(id => id !== '__start__' && id !== '__end__' && id !== 'START' && id !== 'END');
    if (validNodeIds.length < 2) return;

    const groupedNodes = currentNodes.filter(n => validNodeIds.includes(n.id) && n.type !== 'cardboardNode' && n.data?.type !== 'cardboard');
    if (groupedNodes.length < 2) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    groupedNodes.forEach(n => {
      const x = n.position?.x ?? 0;
      const y = n.position?.y ?? 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });

    const centerX = minX + (maxX - minX) / 2;
    const centerY = minY + (maxY - minY) / 2;

    const groupId = `group_${genId()}`;
    const groupNode = {
      id: groupId,
      type: 'agentNode',
      position: { x: centerX, y: centerY },
      data: {
        id: groupId,
        type: 'group',
        label: 'Group Node',
        name: 'Group Node',
        description: '',
        internal_nodes: groupedNodes,
        internal_edges: [],
        original_edges: []
      }
    };

    const internalEdges = [];
    const originalEdges = [];
    const nextEdges = [];

    currentEdges.forEach(e => {
      const isSourceInside = validNodeIds.includes(e.source);
      const isTargetInside = validNodeIds.includes(e.target);

      if (isSourceInside && isTargetInside) {
        internalEdges.push(e);
        originalEdges.push(e);
      } else if (isSourceInside && !isTargetInside) {
        originalEdges.push(e);
        nextEdges.push({
          ...e,
          id: `e_${groupId}_to_${e.target}_${genId()}`,
          source: groupId,
          sourceHandle: null
        });
      } else if (!isSourceInside && isTargetInside) {
        originalEdges.push(e);
        nextEdges.push({
          ...e,
          id: `e_${e.source}_to_${groupId}_${genId()}`,
          target: groupId,
          targetHandle: null
        });
      } else {
        nextEdges.push(e);
      }
    });

    groupNode.data.internal_edges = internalEdges;
    groupNode.data.original_edges = originalEdges;

    const nextNodes = currentNodes.filter(n => !validNodeIds.includes(n.id));
    nextNodes.push(groupNode);

    set({
      nodes: nextNodes,
      edges: nextEdges,
      isDirty: true,
      isCompiled: false
    });

    useUIStore.getState().setSelectedNode(groupId);
  },

  ungroupNode: (groupNodeId) => {
    const currentNodes = get().nodes;
    const currentEdges = get().edges;

    const groupNode = currentNodes.find(n => n.id === groupNodeId);
    if (!groupNode || groupNode.data?.type !== 'group') return;

    get().takeHistorySnapshot();

    const internalNodes = groupNode.data.internal_nodes || [];
    const originalEdges = groupNode.data.original_edges || [];

    const nextNodes = currentNodes.filter(n => n.id !== groupNodeId);
    nextNodes.push(...internalNodes);

    const outsideEdges = currentEdges.filter(e => e.source !== groupNodeId && e.target !== groupNodeId);
    const nextEdges = [...outsideEdges, ...originalEdges];

    set({
      nodes: nextNodes,
      edges: nextEdges,
      isDirty: true,
      isCompiled: false
    });

    useUIStore.getState().setSelectedNode(null);
  },

  enterGroupPreview: (groupId) => {
    const currentNodes = get().nodes;
    const currentEdges = get().edges;

    const groupNode = currentNodes.find(n => n.id === groupId);
    if (!groupNode || groupNode.data?.type !== 'group') return;

    get().takeHistorySnapshot();

    const internalNodes = groupNode.data.internal_nodes || [];
    const originalEdges = groupNode.data.original_edges || [];

    const nextNodes = currentNodes.filter(n => n.id !== groupId);
    nextNodes.push(...internalNodes);

    const outsideEdges = currentEdges.filter(e => e.source !== groupId && e.target !== groupId);
    const nextEdges = [...outsideEdges, ...originalEdges];

    set({
      nodes: nextNodes,
      edges: nextEdges,
      previewingGroupId: groupId,
      previewNodeIds: internalNodes.map(n => n.id),
      previewGroupOriginalNode: groupNode,
      isDirty: true,
      isCompiled: false
    });

    useUIStore.getState().setSelectedNode(null);
  },

  exitGroupPreview: (regroup = true) => {
    const { previewingGroupId, previewNodeIds, previewGroupOriginalNode } = get();
    if (!previewingGroupId) return;

    if (!regroup) {
      set({
        previewingGroupId: null,
        previewNodeIds: [],
        previewGroupOriginalNode: null
      });
      return;
    }

    get().takeHistorySnapshot();

    const currentNodes = get().nodes;
    const currentEdges = get().edges;

    const groupedNodes = currentNodes.filter(n => previewNodeIds.includes(n.id));
    
    if (groupedNodes.length === 0) {
      set({
        nodes: currentNodes.filter(n => !previewNodeIds.includes(n.id)),
        previewingGroupId: null,
        previewNodeIds: [],
        previewGroupOriginalNode: null,
        isDirty: true,
        isCompiled: false
      });
      return;
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    groupedNodes.forEach(n => {
      const x = n.position?.x ?? 0;
      const y = n.position?.y ?? 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });

    const centerX = minX + (maxX - minX) / 2;
    const centerY = minY + (maxY - minY) / 2;

    const groupNode = {
      ...previewGroupOriginalNode,
      position: { x: centerX, y: centerY },
      data: {
        ...previewGroupOriginalNode.data,
        internal_nodes: groupedNodes,
        internal_edges: [],
        original_edges: []
      }
    };

    const internalEdges = [];
    const originalEdges = [];
    const nextEdges = [];

    currentEdges.forEach(e => {
      const isSourceInside = previewNodeIds.includes(e.source);
      const isTargetInside = previewNodeIds.includes(e.target);

      if (isSourceInside && isTargetInside) {
        internalEdges.push(e);
        originalEdges.push(e);
      } else if (isSourceInside && !isTargetInside) {
        originalEdges.push(e);
        nextEdges.push({
          ...e,
          id: `e_${previewingGroupId}_to_${e.target}_${genId()}`,
          source: previewingGroupId,
          sourceHandle: null
        });
      } else if (!isSourceInside && isTargetInside) {
        originalEdges.push(e);
        nextEdges.push({
          ...e,
          id: `e_${e.source}_to_${previewingGroupId}_${genId()}`,
          target: previewingGroupId,
          targetHandle: null
        });
      } else {
        nextEdges.push(e);
      }
    });

    groupNode.data.internal_edges = internalEdges;
    groupNode.data.original_edges = originalEdges;

    const nextNodes = currentNodes.filter(n => !previewNodeIds.includes(n.id));
    nextNodes.push(groupNode);

    set({
      nodes: nextNodes,
      edges: nextEdges,
      previewingGroupId: null,
      previewNodeIds: [],
      previewGroupOriginalNode: null,
      isDirty: true,
      isCompiled: false
    });

    useUIStore.getState().setSelectedNode(previewingGroupId);
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
    useVariablesStore.getState().reset();
  },

  loadWorkflowIntoEditor: async (w) => {
    if (!w) return;

    set({ isLoadingWorkflow: true });
    // If this is a summary object from the list endpoint (no config),
    // fetch the full workflow first before loading into the editor.
    if (!w.config) {
      try {
        const { getWorkflow } = await import('../api/agentmesh');
        const full = await getWorkflow(w.id);
        if (full) w = { ...w, ...full };
      } catch (e) {
        console.error('loadWorkflowIntoEditor: failed to fetch full config', e);
        set({ isLoadingWorkflow: false });
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
      isLoadingWorkflow: false,
    });
    // ✅ VARIABLE EXPLORER: Clear data explorer when loading an existing workflow
    useRunStore.getState().reset();
    useVariablesStore.getState().reset();
  },

  // ─── Per-node-type field maps (only export what's relevant) ──────────────────
  PER_TYPE_FIELDS: {
    // Common agent fields shared by many node types
    _agent: ['task', 'llm', 'memory', 'iteration_policy', 'tools', 'tool_configs', 'return_direct', 'skills', 'subagents', 'harness_profile', 'code_interpreter', 'max_iterations', 'timeout_seconds', 'context_schema', 'agent_input_prefix', 'output_key_prefix'],
    _common: ['interrupt_before', 'interrupt_after', 'hitl_actions', 'on_error', 'continue_on_fail', 'mute_chat_bubble', 'context_mode', 'max_context_chars'],

    llm_agent: ['task', 'llm', 'memory', 'iteration_policy', 'tools', 'tool_configs', 'return_direct', 'skills', 'subagents', 'harness_profile', 'code_interpreter', 'max_iterations', 'timeout_seconds', 'context_schema', 'agent_input_prefix', 'output_key_prefix', 'interrupt_before', 'interrupt_after', 'hitl_actions', 'on_error', 'continue_on_fail', 'mute_chat_bubble', 'context_mode', 'max_context_chars', 'allowed_transitions'],
    deep_agent: ['task', 'llm', 'tools', 'tool_configs', 'skills', 'deep_agent_backend', 'deep_agent_root_dir', 'interrupt_before', 'interrupt_after', 'on_error', 'continue_on_fail'],
    tool_node: ['tools', 'tool_configs', 'return_direct', 'interrupt_before', 'interrupt_after'],
    direct_tool: ['direct_tool_name', 'tool_arguments', 'destination_key', 'return_direct', 'interrupt_before', 'interrupt_after'],
    router: ['routing_key', 'member_ids', 'branches', 'condition', 'custom_python_rules', 'python_rules'],
    switch: ['routing_key', 'branches', 'condition', 'custom_python_rules', 'python_rules'],
    condition: ['condition', 'custom_python_rules', 'python_rules'],
    set_data: ['message'],
    wait: ['wait_seconds'],
    chat_model: ['llm'],
    rag_node: ['task', 'llm', 'search_type', 'vector_store', 'vector_collection', 'embedding_model', 'k_results', 'threshold', 'chunking_strategy', 'show_citations', 'interrupt_before', 'interrupt_after', 'chunk_size', 'chunk_overlap', 'ingestion_source_key'],
    subgraph: ['workflow_id', 'interrupt_before', 'interrupt_after'],
    supervisor: ['member_ids', 'llm', 'iteration_policy', 'tools', 'tool_configs', 'allowed_transitions', 'interrupt_before', 'interrupt_after'],
    swarm: ['member_ids', 'llm', 'iteration_policy', 'tools', 'tool_configs', 'allowed_transitions', 'interrupt_before', 'interrupt_after'],
    webhook: ['enabled', 'path', 'secret', 'auth_method', 'response_mode', 'response_node'],
    webhook_response: ['response_status', 'response_headers', 'response_body_key'],
    cron: ['enabled', 'cron_expression', 'timezone'],
    polling: ['enabled', 'poller_tool', 'tool_arguments', 'destination_key', 'cron_expression', 'timezone'],
    splitter: ['split_field', 'batch_size', 'destination_field', 'discovery_keys', 'interrupt_before', 'interrupt_after'],
    aggregator: ['action', 'field_to_aggregate', 'destination_field', 'separator', 'group_by'],
    form_node: ['form_title', 'form_description', 'form_fields', 'form_submit_label', 'form_use_context_schema', 'interrupt_before', 'interrupt_after'],
    camera: ['form_title', 'form_description', 'form_fields', 'form_submit_label', 'interrupt_before', 'interrupt_after'],
    notification: ['notification_title', 'notification_message', 'notification_type', 'mute_notification_message', 'show_chat_button'],
    error_router: ['llm', 'on_error'],
    output_parser: ['parse_mode', 'fallback_to_raw', 'output_context_key'],
    pii_node: ['pii_engine', 'datafog_engine', 'pii_target', 'pii_entities', 'pii_custom_regex', 'docbot_url', 'docbot_method', 'hitl_enabled', 'identifiers_input_key', 'rendered_input_key', 'context_variable_key', 'interrupt_before', 'interrupt_after'],
    data_cleaning: ['data_cleaning_rules', 'data_cleaning_target', 'data_cleaning_input_key', 'data_cleaning_output_key'],
    graph_ingestion: ['graph_target_key', 'graph_neo4j_uri', 'graph_neo4j_user', 'graph_neo4j_password', 'graph_ingestion_mode', 'graph_cypher_query', 'graph_nodes_schema', 'graph_relations_schema', 'graph_collection', 'graph_sender_key', 'graph_receiver_key', 'graph_txn_id_key', 'graph_amount_key', 'graph_timestamp_key'],
    db_node: ['db_engine', 'db_connection_string', 'db_database', 'db_collection', 'db_operation', 'db_document', 'db_query', 'db_output_key', 'db_limit'],
    ocr_node: ['ocr_input_key', 'ocr_prompt', 'ocr_engine', 'ocr_standard_model', 'llm', 'interrupt_before', 'interrupt_after', 'on_error', 'continue_on_fail', 'docbot_url', 'docbot_method'],
    multi_file_ingestion: ['allowed_extensions', 'max_file_size_mb', 'max_files_count', 'strategy_rules', 'interrupt_before', 'interrupt_after', 'hitl_actions', 'on_error'],
    signature_stamp_extractor: ['extractor_input_key', 'extractor_output_key', 'llm', 'interrupt_before', 'interrupt_after'],
    api_node: ['api_method', 'api_url', 'api_headers', 'api_params', 'api_body', 'api_auth_type', 'api_auth_config', 'api_response_format', 'connection_id', 'api_protocol', 'graphql_query', 'use_curl', 'curl_command', 'on_error', 'continue_on_fail', 'api_description', 'api_enabled', 'api_execution_mode', 'additional_apis'],
    vector_ingestion: ['vector_store', 'vector_collection', 'chunk_size', 'chunk_overlap', 'chunking_strategy', 'ingestion_source_key'],
    classification: ['classification_classes', 'classification_summary', 'classification_engine', 'classification_input_field', 'classification_input_key', 'classification_output_key', 'classification_extract_identifiers', 'llm', 'interrupt_before', 'interrupt_after'],
    sensitivity_classifier: ['classification_input_key', 'classification_output_key', 'engine_mode', 'custom_entities', 'output_format', 'llm', 'interrupt_before', 'interrupt_after'],
    pii_gate_node: ['input_key', 'interrupt_after'],
    ingestion_router: ['scan_mode', 'file_filters', 'concurrency_limit', 'parent_folder_key', 'folder_identifier_key', 'curl_command_key', 'interrupt_before', 'interrupt_after', 'on_error', 'continue_on_fail'],
    event_emitter: ['webhook_url', 'emit_status', 'interrupt_before', 'interrupt_after'],
    json_transform: ['jt_input_key', 'jt_output_key', 'jt_mode', 'jt_query', 'jt_operations', 'jt_expression', 'jt_pass_through'],
    code_execution: ['ce_language', 'ce_code', 'ce_input_key', 'ce_output_key', 'ce_mode'],
    email_node: ['email_provider', 'email_to', 'email_cc', 'email_bcc', 'email_subject', 'email_body', 'email_html', 'email_smtp_server', 'email_smtp_port', 'email_user', 'email_password', 'email_attachments', 'email_headers', 'email_smtp_timeout', 'email_auth_method', 'email_tenant_id', 'email_client_id', 'email_client_secret', 'email_google_service_account_json', 'email_google_delegated_user'],
    stt_trigger: ['auto_start', 'auto_stop', 'silence_delay', 'stt_lang'],
    button_trigger: ['button_label', 'button_input', 'button_category'],
    auto_trigger: ['button_input', 'task', 'llm'],
    textToAudio: ['tts_library', 'audio_voice', 'kittentts_model', 'audio_speed', 'mute_audio', 'audio_input_text'],
    vision_intelligence: ['vision_mode', 'vision_enable_llm', 'vision_face_match_threshold', 'vision_quality_min_score', 'vision_quality_blur_threshold', 'vision_quality_min_contrast', 'vision_quality_max_contrast', 'vision_id_image_key', 'vision_selfie_image_key', 'vision_output_key', 'llm', 'interrupt_before', 'interrupt_after'],
    group: ['name', 'description', 'internal_nodes', 'internal_edges', 'original_edges'],
    ingestion_adapter: ['source_format', 'target_serialization', 'validation_mode', 'flatten_depth', 'flatten_separator', 'field_aliases', 'default_values', 'source_key', 'external_integrations', 'internal_integrations', 'interrupt_before', 'interrupt_after', 'on_error', 'continue_on_fail'],
    payload_builder: ['payload_template', 'payload_destination_key'],
    webhook_response: ['response_status', 'response_headers', 'response_body_key'],
    report_generator: ['template_content', 'template_output_key', 'template_data_key', 'template_file_path', 'template_id', 'input_data_key', 'output_file_name', 'report_format', 'template_category', 'interrupt_before', 'interrupt_after'],
    weightage: ['weightage_categories', 'weightage_output_key', 'weightage_approve_threshold', 'weightage_review_threshold', 'weightage_risk_bands', 'weightage_output_flags', 'weightage_cross_rules', 'interrupt_before', 'interrupt_after'],
    form_decisions: ['form_decisions'],
    debug: ['debug_scope', 'debug_key'],
    ingestion: ['scan_mode', 'file_filters', 'concurrency_limit', 'webhook_url', 'emit_status'],
  },

  buildConfig: () => {
    const s = get();

    // Compute connected node IDs from edges (including START/END edges)
    const connectedNodeIds = new Set(s.edges.flatMap(e => [e.source, e.target]));

    // Filter out system nodes, cardboards, and orphan (disconnected) nodes
    const finalNodes = s.nodes
      .filter(n => {
        if (['__start__', '__end__'].includes(n.id)) return false;
        if (n.type === 'cardboardNode' || n.data?.type === 'cardboard') return false;
        // Keep trigger nodes even if disconnected (they act as implicit START nodes)
        if (['webhook', 'cron', 'polling'].includes(n.data?.type)) return true;
        // Drop orphan nodes with no edges
        if (!connectedNodeIds.has(n.id)) return false;
        return true;
      })
      .map((n) => {
        const d = n.data;
        const nodeType = n.data?.type || n.type;

        // Per-type field whitelist — only export what's relevant to this node type
        const typeFields = get().PER_TYPE_FIELDS[nodeType] || [];
        const validFields = new Set([
          'id', 'type', 'label', 'position', 'routing_key',
          ...typeFields
        ]);

        const nodeConfig = {};
        validFields.forEach(field => {
          if (d[field] !== undefined) {
            nodeConfig[field] = d[field];
          }
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
        s.nodes.filter(n => systemIds.has(n.id) || ['webhook', 'cron', 'polling'].includes(n.data?.type)).map(n => [n.id === '__start__' || n.id === '__end__' ? n.id : n.data?.type, n.position])
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
        const isBp = Boolean(e.data?.isBreakpoint || e.is_breakpoint);
        return {
          source: e.source === '__start__' ? 'START' : e.source,
          target: e.target === '__end__' ? 'END' : e.target,
          source_handle: e.sourceHandle || null,
          target_handle: e.targetHandle || null,
          condition: e.data?.condition || null,
          is_breakpoint: isBp,
          data: { ...(e.data || {}), isBreakpoint: isBp },
        };
      });


    // Extract Triggers from special trigger nodes with validation
    const webhookNode = s.nodes.find(n => n.data?.type === 'webhook');
    const cronNode = s.nodes.find(n => n.data?.type === 'cron');
    const pollingNode = s.nodes.find(n => n.data?.type === 'polling');

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
  showFlowchart: false,
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
  toggleFlowchart: (val) => set((s) => ({ showFlowchart: typeof val === 'boolean' ? val : !s.showFlowchart })),
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
  canvasSnapGrid: parseInt((typeof window !== 'undefined' ? localStorage.getItem('canvas_snap_grid') : '20') || '20', 10),
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
  setCanvasSnapGrid: (v) => {
    if (typeof window !== 'undefined') localStorage.setItem('canvas_snap_grid', v.toString());
    set({ canvasSnapGrid: v });
  },
}));

// ─── Run Store ────────────────────────────────────────────────────────────────
const MAX_STREAM_EVENTS = 2000;

export const useRunStore = create((set) => ({
  running: false,
  streamEvents: [],
  eventVersion: 0,
  nextEventSeq: 1,
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
  addEvent: (evt) => set((s) => {
    const withSeq = { ...evt, _seq: s.nextEventSeq };
    let streamEvents = [...s.streamEvents, withSeq];
    if (streamEvents.length > MAX_STREAM_EVENTS) {
      streamEvents = streamEvents.slice(streamEvents.length - MAX_STREAM_EVENTS);
    }
    return {
      streamEvents,
      eventVersion: s.eventVersion + 1,
      nextEventSeq: s.nextEventSeq + 1,
    };
  }),
  setEvents: (evts) => set((s) => {
    const withSeq = (evts || []).map((e, i) => ({ ...e, _seq: s.nextEventSeq + i }));
    return {
      streamEvents: withSeq,
      eventVersion: s.eventVersion + 1,
      nextEventSeq: s.nextEventSeq + withSeq.length,
    };
  }),
  finishRun: (output) => set({ running: false, runOutput: output }),
  setError: (err) => set({ running: false, runError: err }),
  setPausedInfo: (info) => set((s) => ({ pausedInfo: { ...s.pausedInfo, ...info } })),
  removeEventsFromIndex: (seq) => set((s) => {
    const pos = s.streamEvents.findIndex((e) => e._seq === seq);
    return {
      streamEvents: pos < 0 ? s.streamEvents : s.streamEvents.slice(0, pos),
      eventVersion: s.eventVersion + 1,
    };
  }),

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
    eventVersion: 0,
    nextEventSeq: 1,
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

export const useVariablesStore = create((set, get) => ({
  variables: [],
  isLoading: false,
  error: null,
  showVariablesPanel: false,
  setShowVariablesPanel: (show) => set({ showVariablesPanel: show }),
  setVariables: (variables) => set({ variables, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  addVariable: (variable) => set((state) => {
    // Prevent duplicates by updating if key exists
    const idx = state.variables.findIndex(v => v.key === variable.key);
    if (idx >= 0) {
      const next = [...state.variables];
      next[idx] = variable;
      return { variables: next };
    }
    return { variables: [...state.variables, variable] };
  }),
  removeVariable: (key) => set((state) => ({
    variables: state.variables.filter(v => v.key !== key)
  })),
  reset: () => set({ variables: [], isLoading: false, error: null, showVariablesPanel: false }),

  // Async API wrappers
  fetchVariables: async (workflowId) => {
    set({ isLoading: true, error: null });
    try {
      const api = await import('../api/agentmesh');
      const res = await api.listWorkflowVariables(workflowId);
      set({ variables: res.variables || [], isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },
  upsertVariable: async (workflowId, payload) => {
    const api = await import('../api/agentmesh');
    const res = await api.setWorkflowVariable(workflowId, payload);
    if (res.status === 'success') {
      get().addVariable(res.variable);
      return res.variable;
    }
    throw new Error(res.message || 'Failed to save variable');
  },
  deleteVariable: async (workflowId, key) => {
    const api = await import('../api/agentmesh');
    const res = await api.deleteWorkflowVariable(workflowId, key);
    if (res.status === 'success') {
      get().removeVariable(key);
      return true;
    }
    throw new Error(res.message || 'Failed to delete variable');
  },
  uploadJsonFile: async (workflowId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const api = await import('../api/agentmesh');
    const res = await api.uploadJsonVariable(workflowId, formData);
    if (res.status === 'success') {
      await get().fetchVariables(workflowId);
      return res;
    }
    throw new Error(res.message || 'Failed to upload JSON');
  }
}));
