import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { useWorkflowStore } from '../../store';
import {
  FiPlay, FiCpu, FiBox, FiGitMerge,
  FiTarget, FiShare2, FiBookOpen, FiLink,
  FiSearch, FiGlobe, FiClock, FiVolume2, FiRepeat, FiFileText, FiBell, FiAlertTriangle, FiZap, FiGitBranch, FiActivity, FiCheck, FiEdit, FiFilter, FiShield, FiLayers, FiInbox, FiDatabase, FiServer,
  FiCode, FiSliders, FiInfo, FiMic, FiEye, FiVideo, FiMail, FiChevronDown, FiUploadCloud
} from 'react-icons/fi';
import { 
  listAgentTemplates, 
  getAgentTemplate,
  listComponentTemplates, 
  listTools, 
  listAvailableSkills, 
  listWorkflowTemplates,
  getWorkflowTemplate 
} from '../../api/agentmesh';
import AddToolModal from '../Apps/AgentMeshModules/addToolModal';
import AddSkillModal from '../Apps/AgentMeshModules/addSkillModal';
import AgentTypeSelectorModal from './AgentTypeSelectorModal';

export const NODE_TYPES = [
  // Events & Triggers
  { type: 'webhook',    icon: FiGlobe,     label: 'Webhook',      desc: 'Receives external HTTP requests to start or resume a workflow.', detailedDesc: 'Sets up an HTTP endpoint that triggers this workflow when hit. Can run asynchronously or synchronously, wait for specific payload variables, and support custom authentication methods.', bg: '#E0F2FE', color: '#0369A1', category: 'Events & Triggers' },
  { type: 'webhook_response', icon: FiShare2,  label: 'Webhook Response', desc: 'Returns a custom HTTP response to a synchronous Webhook trigger.', detailedDesc: 'Used at the end of a synchronous webhook branch to send back customized HTTP status codes, headers, and body payloads directly to the calling client.', bg: '#E0F2FE', color: '#0369A1', category: 'Events & Triggers' },
  { type: 'event_emitter', icon: FiGlobe, label: 'Event Emitter', desc: 'Sends real-time status updates and progress webhooks to external systems.', detailedDesc: 'Publishes execution updates or workflow progress payloads to a configured external webhook URL as the pipeline executes.', bg: '#E0F2FE', color: '#0369A1', category: 'Events & Triggers' },
  { type: 'cron',       icon: FiClock,     label: 'Cron',         desc: 'Triggers the workflow automatically on a scheduled interval.', detailedDesc: 'Starts workflow runs at specified times using standard cron syntax (e.g., "0 9 * * *" for daily at 9 AM). Supports timezone configurations.', bg: '#FEF3C7', color: '#B45309', category: 'Events & Triggers' },
  { type: 'polling',    icon: FiClock,     label: 'Polling Trigger', desc: 'Triggers the workflow by periodically querying an external tool.', detailedDesc: 'Periodically runs an external integration tool to fetch new items (like support tickets or emails) and feeds them into the workflow on a set cron schedule.', bg: '#FDF2F8', color: '#DB2777', category: 'Events & Triggers' },
  { type: 'button_trigger', icon: FiZap,     label: 'Button',       desc: 'Manually triggers the workflow from the dashboard UI.', detailedDesc: 'Creates a manual start button in the dashboard, enabling users to launch workflow runs on demand with optional input data.', bg: '#D1FAE5', color: '#059669', category: 'Events & Triggers' },
  { type: 'auto_trigger',   icon: FiPlay,    label: 'Auto Trigger', desc: 'Triggers the workflow instantly when it is compiled or deployed.', detailedDesc: 'Automatically runs the workflow immediately upon startup, compilation, or deployment. Ideal for one-off tasks or continuous processes.', bg: '#D1FAE5', color: '#059669', category: 'Events & Triggers' },
  { type: 'stt_trigger', icon: FiMic, label: 'Speech to Text', desc: 'Captures voice input using the browser microphone.', detailedDesc: 'Pauses the workflow and activates the microphone in the Run Panel. Users speak naturally, and their speech is transcribed to text. Supports auto-stop on silence or manual click-to-stop.', bg: '#F0F9FF', color: '#0891B2', category: 'Media Services' },

  // Autonomous Agents
  { type: 'llm_agent',  icon: FiCpu,       label: 'Agent',        desc: 'An LLM-powered agent with access to memory and tools.', detailedDesc: 'An advanced AI assistant utilizing language models (LLMs). It evaluates instructions, calls registered tools to fetch data or perform actions, uses context variables, and maintains conversation memory.', bg: '#C9DEFF', color: '#1A56DB', category: 'Autonomous Agents' },
  { type: 'deep_agent', icon: FiCpu,       label: 'Deep Agent',   desc: 'An autonomous agent that creates plans and reasons step-by-step.', detailedDesc: 'A reasoning agent built for complex workflows. It breaks down goals into planned tasks, reasons through multiple steps, uses external files or tools, and operates autonomously to achieve high-accuracy results.', bg: '#E9D5FF', color: '#6B21A8', category: 'Autonomous Agents' },
  { type: 'supervisor', icon: FiTarget,    label: 'Supervisor',   desc: 'Orchestrates a group of worker agents to perform tasks.', detailedDesc: 'An AI supervisor that directs a team of autonomous agents, routing sub-tasks dynamically and consolidating their results to complete a larger objective.', bg: '#C9F5E0', color: '#065F46', category: 'Autonomous Agents' },
  { type: 'swarm',      icon: FiShare2,    label: 'Swarm',        desc: 'A multi-agent network that passes tasks back and forth.', detailedDesc: 'Uses the swarm pattern to coordinate handoffs between specialized agents, allowing them to pass tasks to each other seamlessly depending on the needs of the conversation.', bg: '#FFD9EE', color: '#9D174D', category: 'Autonomous Agents' },
  { type: 'classification', icon: FiFilter, label: 'Classification Agent', desc: 'Classifies input data into categories using LLMs or Regex.', detailedDesc: 'Analyzes files or text inputs and assigns them to defined categories (e.g., classifying a document as a Tax Return or Bank Statement) using AI prompt evaluation or pattern-matching rules.', bg: '#C9DEFF', color: '#1A56DB', category: 'Autonomous Agents' },
  
  // Knowledge & RAG
  { type: 'rag_node',   icon: FiBookOpen,  label: 'RAG',          desc: 'Retrieves relevant context from a vector search database.', detailedDesc: 'Retrieves relevant reference chunks from knowledge collection vector databases using similarity searches to ground AI prompts and prevent hallucinations.', bg: '#FFF3B8', color: '#92400E', category: 'Knowledge & RAG' },
  { type: 'vector_ingestion', icon: FiBox,      label: 'Vector Ingestion',    desc: 'Indexes external document collections into the RAG vector store.', detailedDesc: 'Processes, chunks, embeds, and uploads directories of documents into the vector store database for use by RAG retrieval systems.', bg: '#E0F2FE', color: '#0EA5E9', category: 'Knowledge & RAG' },
  { type: 'ocr_node',       icon: FiEye,   label: 'OCR Node',     desc: 'Extract text from images or PDF documents.', detailedDesc: 'Uses advanced vision models or OCR engines to convert scanned files, PDFs, or images into raw text. The extracted text is saved to context variables.', bg: '#FDF2F8', color: '#DB2777', category: 'Media Services' },
  { type: 'multi_file_ingestion', icon: FiUploadCloud, label: 'Multi-File Ingestion', desc: 'Uploads & validates multi-file batches, extracts page/document metadata, and iterates through queue.', detailedDesc: 'Interactive batch uploader node with size & extension validation, session file storage, rich metadata calculation, page-by-page PDF splitting, and loop/done output routing handles.', bg: '#EEF2FF', color: '#4F46E5', category: 'Media Services' },
  { type: 'signature_stamp_extractor', icon: FiEdit, label: 'Signature & Stamp Extractor', desc: 'Extract signatures and stamps from documents.', detailedDesc: 'Uses color-specific thresholding to find ink blobs (signatures and stamps), crops them, encodes them to base64, and classifies them using a vision LLM.', bg: '#FDF2F8', color: '#DB2777', category: 'Media Services' },

  // External Integrations
  { type: 'tool_node',  icon: FiBox,       label: 'Tool',         desc: 'Executes database or utility functions as requested by agents.', detailedDesc: 'Serves as the execution bridge for LLM tools, running functions (e.g., sending emails, database queries, arithmetic calculations) and returning the results directly to the calling agent.', bg: '#FFE4B8', color: '#B45309', category: 'External Integrations' },
  { type: 'direct_tool', icon: FiBox,       label: 'Direct Tool',  desc: 'Runs a single integration tool directly without an agent.', detailedDesc: 'Executes a specific utility function directly in the workflow using input parameters, saving the output to a designated context variable.', bg: '#FFF7ED', color: '#F97316', category: 'External Integrations' },
  { type: 'api_node',   icon: FiGlobe,     label: 'API Request',  desc: 'Triggers HTTP requests to external APIs with dynamic values.', detailedDesc: 'Triggers HTTP requests (GET, POST, PUT, etc.) to external APIs with dynamic values interpolated from context variables. Supports REST/SOAP/GraphQL protocols, OAuth/Basic auth connections, and sequential or parallel execution. Results are saved to context.api_result_<node_id> (and latest_api_result) for use in prompts via {{api_result_<node_id>.field}}.', bg: '#E0F2FE', color: '#0EA5E9', category: 'External Integrations' },
  { type: 'email_node',  icon: FiMail,      label: 'Email Sender', desc: 'Sends an email via any custom SMTP server.', detailedDesc: 'Sends an email with support for HTML templates, Jinja2 rendering, and custom SMTP server configuration. Sensitive credentials are encrypted at rest.', bg: '#EFF6FF', color: '#1D4ED8', category: 'External Integrations' },
  
  // Logic & Routing
  { type: 'router',     icon: FiGitMerge,  label: 'Router',       desc: 'Evaluates edge conditions to route the workflow.', detailedDesc: 'Routes execution path dynamically by evaluating conditions (key, operator, value) on outbound connections. Ideal for branching based on agent output.', bg: '#E5D9FF', color: '#7C3AED', category: 'Logic & Routing' },
  { type: 'ingestion_router', icon: FiLayers, label: 'Ingestion Router', desc: 'Dispatches batch items into isolated run threads.', detailedDesc: 'Splits batch ingestion files into individual items and dispatches them across separate run threads to accelerate document processing concurrently.', bg: '#C9F5E0', color: '#065F46', category: 'Logic & Routing' },
  { type: 'condition',  icon: FiActivity,  label: 'Condition (If)', desc: 'Splits the workflow into True/False branches based on conditions.', detailedDesc: 'A binary gate that evaluates a condition and routes flow down the True or False path based on context variables.', bg: '#FEF3C7', color: '#D97706', category: 'Logic & Routing' },
  { type: 'switch',     icon: FiGitBranch, label: 'Switch',         desc: 'Routes execution to one of multiple paths based on a value.', detailedDesc: 'Evaluates a specific variable against multiple cases, directing flow to the first matching branch (similar to a programming switch-case statement).', bg: '#E0F2FE', color: '#0369A1', category: 'Logic & Routing' },
  
  // Flow Control
  { type: 'splitter',   icon: FiRepeat,    label: 'Splitter (Loop)', desc: 'Iterates over a list of items (looping).', detailedDesc: 'Splits an array of items (like a list of documents or database rows) to run downstream nodes iteratively for each item.', bg: '#FFF7ED', color: '#EA580C', category: 'Flow Control' },
  { type: 'aggregator', icon: FiLayers,    label: 'Aggregator',     desc: 'Collects and aggregates loop execution results.', detailedDesc: 'Gathers outputs from all splitter loops and merges them back into a single structured array, ready for consolidated reporting.', bg: '#E0F2FE', color: '#0369A1', category: 'Flow Control' },
  { type: 'wait',       icon: FiClock,     label: 'Wait',           desc: 'Pauses the workflow for a specified duration.', detailedDesc: 'Delays execution for a set amount of seconds, minutes, or hours before letting the workflow resume automatically.', bg: '#F1F5F9', color: '#475569', category: 'Flow Control' },
  { type: 'join',       icon: FiCheck,     label: 'Join',           desc: 'Merges multiple parallel paths into a single path.', detailedDesc: 'Waits for all parallel execution paths or incoming edges to complete before allowing the next step in the workflow to proceed.', bg: '#ECFDF5', color: '#059669', category: 'Flow Control' },
  { type: 'subgraph',   icon: FiLink,      label: 'Subgraph',     desc: 'Runs another workflow as a sub-process.', detailedDesc: 'Triggers and executes a separate compiled workflow from the registry, passing variables in and returning results to the parent workflow.', bg: '#C9F5F5', color: '#065555', category: 'Flow Control' },
  { type: 'form_node',  icon: FiEdit,      label: 'Form Submission', desc: 'Pauses the workflow for manual form submission.', detailedDesc: 'Halts execution and presents a customizable interactive form to users in the dashboard UI. The workflow resumes once the form is submitted with the input data.', bg: '#F5F3FF', color: '#7C3AED', category: 'Flow Control' },
  { type: 'camera',     icon: FiVideo,    label: 'Camera Capture', desc: 'Captures a live webcam image.', detailedDesc: 'Pauses workflow to capture a live webcam photo from the user.', bg: '#E0F2FE', color: '#0369A1', category: 'Media Services' },

  // Document Processing
  { type: 'template_node', icon: FiFileText,  label: 'Template Engine',   desc: 'Renders text/markdown templates using context variables.', detailedDesc: 'Takes a markdown or text template and uses Jinja2 formatting to render values dynamically (e.g. creating a personalized email body or document template).', bg: '#FDF2F8', color: '#DB2777', category: 'Document Processing' },
  { type: 'report_generator', icon: FiFileText,  label: 'Report Generator',   desc: 'Generates and exports data into PDF, Docx, or Excel reports.', detailedDesc: 'Populates predefined templates with workflow data to generate download-ready business documents, spreadsheets, or summaries.', bg: '#E0E7FF', color: '#4338CA', category: 'Document Processing' },

  // Data & Storage
  { type: 'set_data',   icon: FiEdit,      label: 'Set Message',    desc: 'Saves static values or sets custom messages in context.', detailedDesc: 'Directly injects or updates key-value pairs in the workflow state context, useful for initializing variables or formatting static response text.', bg: '#F5F3FF', color: '#7C3AED', category: 'Data & Storage' },
  { type: 'output_parser', icon: FiFilter,  label: 'Output Parser',  desc: 'Repairs and validates malformed JSON text outputs.', detailedDesc: 'Analyzes raw agent text outputs, extracts JSON strings, repairs syntax errors, and validates schema format to ensure robust structured data downstream.', bg: '#FEF3C7', color: '#D97706', category: 'Data & Storage' },
  { type: 'payload_builder', icon: FiBox,  label: 'Payload Builder',  desc: 'Constructs structured JSON objects from templates.', detailedDesc: 'Builds custom JSON payloads by mapping keys and values from context variables, preparing data to be sent to external webhooks or APIs.', bg: '#E0F2FE', color: '#0369A1', category: 'Data & Storage' },
  { type: 'db_node',    icon: FiDatabase,  label: 'Database',       desc: 'Reads or writes data to SQL (Postgres, SQLite) or NoSQL (MongoDB) databases.', detailedDesc: 'Directly executes queries, updates, inserts, or deletes in PostgreSQL, SQLite, or MongoDB using connection strings and parameterized inputs.', bg: '#D1FAE5', color: '#065F46', category: 'Data & Storage' },
  { type: 'json_transform', icon: FiCode,   label: 'JSON Transform', desc: 'Reshapes JSON data using JMESPath queries or Python.', detailedDesc: 'Applies JMESPath query syntax or lightweight Python code to filter, reshape, map, and transform complex JSON payloads into the desired format.', bg: '#F5F3FF', color: '#7C3AED', category: 'Data & Storage' },
  { type: 'code_execution', icon: FiCode,   label: 'Code',         desc: 'Executes custom Python scripts for data processing and transformation.', detailedDesc: 'Write and run Python code directly in your workflow. Full multi-line script support with sandboxed execution. Available variables: input_data, input_items, context. Set the result variable to produce output.', bg: '#F1F5F9', color: '#475569', category: 'Data & Storage' },
  { type: 'data_cleaning', icon: FiFilter,  label: 'Data Cleaning',  desc: 'Cleans datasets using predefined rules or Pandas scripts.', detailedDesc: 'Applies standard data hygiene rules (like trimming whitespaces, fixing casing, or dropping nulls) or executes custom Pandas python scripts on tabular data.', bg: '#ECFDF5', color: '#059669', category: 'Data & Storage' },
  { type: 'graph_ingestion', icon: FiDatabase, label: 'Graph Ingestion', desc: 'Ingests structured transaction nodes into Neo4j.', detailedDesc: 'Extracts entity relationships from context datasets and saves them as node and edge records in a Neo4j graph database.', bg: '#EFF6FF', color: '#1D4ED8', category: 'Knowledge & RAG' },
  { type: 'file_store', icon: FiFileText,  label: 'File Store',   desc: 'Saves dataset tables directly to CSV or Excel files.', detailedDesc: 'Converts context arrays or JSON objects into structured CSV or XLSX files and stores them in the virtual filesystem.', bg: '#ECFDF5', color: '#059669', category: 'Data & Storage' },
  { type: 'notification', icon: FiBell,     label: 'Notification', desc: 'Saves in-app alerts and notifications to the dashboard.', detailedDesc: 'Creates custom execution alerts or progress notifications that are displayed to team members directly inside the main UI dashboard.', bg: '#F0F4FF', color: '#6366F1', category: 'Data & Storage' },
  
  // System & Debug
  { type: 'debug_node',  icon: FiActivity,  label: 'Debug Console',  desc: 'Inspects variables and dumps context for debugging.', detailedDesc: 'Dumps the current workflow context or specific state variables to the logs/console view to assist developers in testing and troubleshooting.', bg: '#F1F5F9', color: '#475569', category: 'System & Debug' },
  { type: 'error_router', icon: FiAlertTriangle, label: 'Error Router', desc: 'Routes failures and handles system execution exceptions.', detailedDesc: 'Acts as a catch-all safety valve, capturing node errors or API timeouts to execute fallback logic, retry nodes, or alert administrators.', bg: '#FEE2E2', color: '#DC2626', category: 'System & Debug' },
  { type: 'pii_node',   icon: FiShield,    label: 'PII Masking',  desc: 'Redacts or masks sensitive PII/PHI information.', detailedDesc: 'Scans text for personally identifiable information (like emails, phone numbers, SSNs) and redacts or masks it to ensure security compliance.', bg: '#FFEBEE', color: '#D32F2F', category: 'Security & Privacy' },
  { type: 'sensitivity_classifier', icon: FiShield,   label: 'Sensitivity Classifier', desc: 'Classifies input text for sensitive data flags.', detailedDesc: 'Checks input data for presence of sensitive content types and sets safety flags in context to guide downstream routing.', bg: '#FEF3C7', color: '#B45309', category: 'Security & Privacy' },

  // Media Services
  { type: 'textToAudio', icon: FiVolume2,   label: 'Text to Speech', desc: 'Converts text passages into natural speech audio.', detailedDesc: 'Utilizes text-to-speech audio synthesis models to generate audio files (.mp3/.wav) from written scripts or AI messages.', bg: '#FFE4E1', color: '#C71585', category: 'Media Services' },
  { type: 'vision_intelligence', icon: FiEye, label: 'Vision Intelligence', desc: 'Unified AI vision engine for face verification, signature/stamp detection, and quality gates.', detailedDesc: 'Comprehensive Computer Vision engine that unifies InsightFace biometric face match (1:1 verification), signature/stamp extraction, and document quality gates in a single node.', bg: '#F3E8FF', color: '#7E22CE', category: 'Media Services' },

  // Visual Organizers
  { type: 'cardboard',   icon: FiLayers,    label: 'Sticky Note',     desc: 'Sticky notes to add visual documentation on the canvas.', detailedDesc: 'Visual layout containers that allow developers to group nodes, add comments, and document canvas flows without affecting runtime execution.', bg: '#F1F5F9', color: '#64748B', category: 'Visual Organizers' },

  // Banking
  { type: 'ingestion_adapter', icon: FiInbox,  label: 'Ingestion Adapter', desc: 'Converts raw banking formats to canonical transaction schema.', detailedDesc: 'Standardizes bank statement formats (CSV, XML, JSON, ISO8583) into a unified canonical schema for financial analytics.', bg: '#F5F3FF', color: '#7C3AED', category: 'Banking' },
  { type: 'banking_enrichment', icon: FiServer,   label: 'Banking Pre-Enrichment Node', desc: 'Gathers external and internal data to enrich accounts.', detailedDesc: 'Queries third-party risk files, account profiles, and transaction histories to enrich banking files before evaluation.', bg: '#F5F3FF', color: '#7C3AED', category: 'Banking' },
  { type: 'beneficiary_risk', icon: FiGitBranch,   label: 'Beneficiary Risk Router', desc: 'Evaluates beneficiary mule risk and routes paths.', detailedDesc: 'Analyzes receiver account details, velocity spikes, and network history to flag potential money-mule accounts.', bg: '#FEF2F2', color: '#EF4444', category: 'Banking' },
  { type: 'rule_engine', icon: FiShield,    label: 'Rule Engine',    desc: 'Runs custom Python rule blocks and scoring cards.', detailedDesc: 'Evaluates complex scoring grids, financial metrics, and custom business validation rules via a lightweight Python sandbox.', bg: '#FEE2E2', color: '#DC2626', category: 'Banking' },
  { type: 'weightage', icon: FiSliders,    label: 'Weightage System', desc: 'Calculates overall weighted scores across multiple categories.', detailedDesc: 'Applies custom category weights to values in context, producing aggregated risk scores or compliance grades.', bg: '#E0F2FE', color: '#0369A1', category: 'Banking' },
];

function getNodeDetails(type) {
  const found = NODE_TYPES.find(n => n.type === type);
  return found || { icon: FiLayers, label: type, desc: 'Custom configured node', bg: '#E0F2FE', color: '#0EA5E9' };
}

// Returns a label that doesn't collide with any label already in `existing`.
// e.g. base "X" -> "X", then "X (Copy)", then "X (Copy 2)", "X (Copy 3)"...
function uniqueLabel(base, existing) {
  if (!existing.has(base)) return base;
  if (!existing.has(`${base} (Copy)`)) return `${base} (Copy)`;
  let n = 2;
  while (existing.has(`${base} (Copy ${n})`)) n += 1;
  return `${base} (Copy ${n})`;
}

const instantiateGroupTemplate = (config, newPosition, existingIds = new Set()) => {
  const originalPos = config.position || { x: 0, y: 0 };
  const dx = newPosition.x - originalPos.x;
  const dy = newPosition.y - originalPos.y;

  const idMap = {};
  const internalNodes = (config.internal_nodes || []).map(n => {
    const oldId = n.id;
    const type = n.data?.type || 'node';
    let newId;
    do {
      newId = `${type}_${Math.random().toString(36).substring(2, 7)}`;
    } while (existingIds.has(newId));
    idMap[oldId] = newId;
    existingIds.add(newId);

    return {
      ...n,
      id: newId,
      position: {
        x: (n.position?.x ?? 0) + dx,
        y: (n.position?.y ?? 0) + dy
      },
      data: {
        ...n.data,
        id: newId
      }
    };
  });

  const mapEdges = (edges) => (edges || []).map(e => ({
    ...e,
    id: `e_${idMap[e.source] || e.source}_to_${idMap[e.target] || e.target}_${Math.random().toString(36).substring(2, 7)}`,
    source: idMap[e.source] || e.source,
    target: idMap[e.target] || e.target
  }));

  const internalEdges = mapEdges(config.internal_edges);
  const originalEdges = mapEdges(config.original_edges);

  return {
    ...config,
    internal_nodes: internalNodes,
    internal_edges: internalEdges,
    original_edges: originalEdges
  };
};

export default function NodePalette({ onClose }) {
  const addNode = useWorkflowStore((s) => s.addNode);
  const setNodeData = useWorkflowStore((s) => s.setNodeData);
  const mergeTemplateIntoEditor = useWorkflowStore((s) => s.mergeTemplateIntoEditor);
  const nodes = useWorkflowStore((s) => s.nodes);
  const setNodesDirty = useWorkflowStore((s) => s.setNodesDirty);
  
  const [viewMode, setViewMode] = useState('nodes'); // 'nodes' | 'custom_nodes' | 'agents' | 'apis' | 'tools' | 'skills' | 'templates'
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mergingTemplateId, setMergingTemplateId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const isFetchingRef = useRef(false);
  const tooltipRef = useRef(null);
  const usedLabelsRef = useRef(new Set());

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [collapsed, setCollapsed] = useState({});
  const [tooltipData, setTooltipData] = useState(null); // { node, x, y }
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [tooltipHeight, setTooltipHeight] = useState(240);

  // Modals state
  const [toolToAdd, setToolToAdd] = useState(null);
  const [skillToAdd, setSkillToAdd] = useState(null);
  const [agentTypeToSelect, setAgentTypeToSelect] = useState(null);

  const toggleCategory = (cat) => {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const filteredNodes = NODE_TYPES.filter(n => 
    n.label.toLowerCase().includes(search.toLowerCase()) || 
    n.desc.toLowerCase().includes(search.toLowerCase())
  );

  const CATEGORY_ORDER = [
    'Events & Triggers', 
    'Visual Organizers',
    'Autonomous Agents', 
    'Knowledge & RAG', 
    'External Integrations', 
    'Logic & Routing', 
    'Flow Control', 
    'Document Processing',
    'Data & Storage', 
    'Security & Privacy',
    'Media Services',
    'System & Debug',
    'Banking'
  ];
  const categories = CATEGORY_ORDER.filter(cat => 
    filteredNodes.some(n => n.category === cat)
  );

  const handleDragStart = (e, n) => {
    e.dataTransfer.setData('application/agentmesh-node', n.type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleAdd = (n) => {
    addNode(n.type, { x: 200 + Math.random() * 300, y: 100 + Math.random() * 200 });
    onClose?.();
  };

  // Debounce search input changes and reset page
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Monitor window resize to recalculate screen limits for tooltips
  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Recalculate tooltip offset height when tooltip contents change
  useEffect(() => {
    if (tooltipRef.current) {
      setTooltipHeight(tooltipRef.current.offsetHeight);
    }
  }, [tooltipData]);

  // Fetch logic for backend libraries (executed immediately on dependencies change)
  useEffect(() => {
    if (viewMode === 'nodes') {
      setItems([]);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchLibrary = async () => {
      isFetchingRef.current = true;
      setLoading(true);
      try {
        let res;
        const limit = 25;
        let newItems = [];
        let total = 0;
        if (viewMode === 'agents') {
          res = await listAgentTemplates({ page: currentPage, limit, search: debouncedSearch }, { signal });
          newItems = res.templates || [];
          total = res.total || 0;
        } else if (viewMode === 'custom_nodes') {
          res = await listComponentTemplates({ exclude_type: 'api_node', page: currentPage, limit, search: debouncedSearch }, { signal });
          newItems = res.templates || [];
          total = res.total || 0;
        } else if (viewMode === 'apis') {
          res = await listComponentTemplates({ type: 'api_node', page: currentPage, limit, search: debouncedSearch }, { signal });
          newItems = res.templates || [];
          total = res.total || 0;
        } else if (viewMode === 'tools') {
          res = await listTools({ page: currentPage, limit, search: debouncedSearch }, { signal });
          newItems = res.tools || [];
          total = res.total || 0;
        } else if (viewMode === 'skills') {
          res = await listAvailableSkills({ page: currentPage, limit, search: debouncedSearch }, { signal });
          newItems = res.skills || [];
          total = res.total || 0;
        } else if (viewMode === 'templates') {
          res = await listWorkflowTemplates({ page: currentPage, limit, search: debouncedSearch }, { signal });
          newItems = res.templates || [];
          total = res.total || 0;
        }

        if (!signal.aborted) {
          setTotalCount(total);
          setTotalPages(Math.ceil(total / limit));
          if (currentPage === 1) {
            setItems(newItems);
          } else {
            setItems(prev => [...prev, ...newItems]);
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Error fetching library items:", err);
          toast.error("Failed to load library items: " + err.message);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
          isFetchingRef.current = false;
        }
      }
    };
    fetchLibrary();

    return () => {
      controller.abort();
    };
  }, [viewMode, debouncedSearch, currentPage]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setCurrentPage(1);
    setSearch('');
    setDebouncedSearch('');
    setDropdownOpen(false);
  };

  const handleScroll = (e) => {
    if (viewMode === 'nodes' || loading || isFetchingRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Check if scrolled near the bottom (with 50px buffer for responsiveness)
    if (scrollHeight - scrollTop - clientHeight < 50) {
      if (currentPage < totalPages) {
        isFetchingRef.current = true;
        setCurrentPage(prev => prev + 1);
      }
    }
  };

  const handleBackendDragStart = (e, item, mode) => {
    if (mode === 'agents') {
      e.dataTransfer.setData('application/agentmesh-node', 'llm_agent');
      if (item.config) {
        e.dataTransfer.setData('application/agentmesh-config', JSON.stringify({
          ...item.config,
          label: item.name || item.config.label
        }));
      }
    } else if (mode === 'custom_nodes') {
      const isCardboard = item.type === 'cardboard';
      e.dataTransfer.setData('application/agentmesh-node', isCardboard ? 'cardboardNode' : 'agentNode');
      e.dataTransfer.setData('application/agentmesh-config', JSON.stringify({
        ...item.config,
        type: item.type,
        label: item.name || (item.config && item.config.label) || item.name
      }));
    } else if (mode === 'apis') {
      e.dataTransfer.setData('application/agentmesh-node', 'api_node');
      if (item.config) {
        e.dataTransfer.setData('application/agentmesh-config', JSON.stringify({
          ...item.config,
          label: item.name || item.config.label
        }));
      }
    } else if (mode === 'tools') {
      e.dataTransfer.setData('application/agentmesh-node', 'tool_node');
      e.dataTransfer.setData('application/agentmesh-config', JSON.stringify({
        label: item.display_name || item.name,
        tools: [item.name]
      }));
    } else if (mode === 'skills') {
      e.dataTransfer.setData('application/agentmesh-node', 'deep_agent');
      e.dataTransfer.setData('application/agentmesh-config', JSON.stringify({
        label: 'Deep Agent',
        skills: [item.name]
      }));
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleBackendClick = async (item, mode) => {
    if (mode === 'agents') {
      setAgentTypeToSelect(item);
    } else if (mode === 'custom_nodes') {
      let config = item.config || {};
      const type = item.type || 'llm_agent';
      
      const lastNode = nodes[nodes.length - 1];
      const position = lastNode 
        ? { x: lastNode.position.x + 60, y: lastNode.position.y + 60 }
        : { x: 200 + Math.random() * 300, y: 100 + Math.random() * 200 };

      if (type === 'group') {
        config = instantiateGroupTemplate(config, position, new Set(nodes.map(n => n.id)));
      }

      const existingIds = new Set(nodes.map(n => n.id));
      const existingNames = new Set(nodes.map(n => n.data?.label));
      // Merge session-created labels so rapid re-drops of the same template
      // (before the store re-renders) still get a unique " (Copy N)" suffix.
      for (const used of usedLabelsRef.current) existingNames.add(used);
      let id;
      do {
        id = `${type}_${Math.random().toString(36).substring(2, 7)}`;
      } while (existingIds.has(id));
      const label = uniqueLabel(item.name || config.label || type, existingNames);
      usedLabelsRef.current.add(label);
      const newNode = {
        id,
        type: 'agentNode',
        position,
        data: {
          ...config,
          id,
          type,
          label
        }
      };
      setNodesDirty([...nodes, newNode]);
      onClose?.();
    } else if (mode === 'apis') {
      const config = item.config || {};
      const id = addNode('api_node', { x: 200 + Math.random() * 300, y: 100 + Math.random() * 200 });
      if (id) {
        const existingNames = new Set(nodes.map(n => n.data?.label));
        for (const used of usedLabelsRef.current) existingNames.add(used);
        const label = uniqueLabel(item.name || config.label || 'API Node', existingNames);
        usedLabelsRef.current.add(label);
        setNodeData(id, {
          ...config,
          id,
          type: 'api_node',
          label
        });
      }
      onClose?.();
    } else if (mode === 'tools') {
      setToolToAdd(item);
    } else if (mode === 'skills') {
      setSkillToAdd(item);
    } else if (mode === 'templates') {
      setMergingTemplateId(item.id);
      try {
        const res = await getWorkflowTemplate(item.id);
        if (res.status === 'success') {
          mergeTemplateIntoEditor(res);
          toast.success('Template merged successfully!');
          onClose?.();
        } else {
          toast.error('Failed to merge template: ' + (res.message || 'Unknown error'));
        }
      } catch (e) {
        toast.error('Failed to merge template: ' + e.message);
      } finally {
        setMergingTemplateId(null);
      }
    }
  };

  const finalizeUseAgent = async (type) => {
    if (!agentTypeToSelect) return;
    let config = agentTypeToSelect.config;
    if (!config) {
      try {
        const full = await getAgentTemplate(agentTypeToSelect.id);
        config = full?.config || {};
      } catch { config = {}; }
    }
    const id = addNode(type, { x: 200 + Math.random() * 300, y: 100 + Math.random() * 200 });
    if (id) {
      const existingNames = new Set(nodes.map(n => n.data?.label));
      for (const used of usedLabelsRef.current) existingNames.add(used);
      const label = uniqueLabel(agentTypeToSelect.name || config.label || type, existingNames);
      usedLabelsRef.current.add(label);
      setNodeData(id, {
        ...config,
        id,
        type,
        label
      });
    }
    setAgentTypeToSelect(null);
    onClose?.();
  };

  return (
    <div className="h-full flex flex-col bg-white relative font-sans">
      {/* Header with Selector */}
      <div className="p-5 pb-4 border-b border-slate-200 z-10 relative">
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors focus:outline-none bg-transparent border-0 cursor-pointer p-0"
          >
            <span>
              {viewMode === 'nodes' && `Node library (${filteredNodes.length})`}
              {viewMode === 'custom_nodes' && `Nodes (${totalCount})`}
              {viewMode === 'agents' && `Agents (${totalCount})`}
              {viewMode === 'apis' && `APIs (${totalCount})`}
              {viewMode === 'tools' && `Tools (${totalCount})`}
              {viewMode === 'skills' && `Skills (${totalCount})`}
              {viewMode === 'templates' && `Templates (${totalCount})`}
            </span>
            <FiChevronDown className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5 animate-fade-in">
              {[
                { id: 'nodes', label: 'Node Library', icon: FiBox },
                { id: 'custom_nodes', label: 'Nodes', icon: FiLayers },
                { id: 'agents', label: 'Agents', icon: FiCpu },
                { id: 'apis', label: 'APIs', icon: FiGlobe },
                { id: 'tools', label: 'Tools', icon: FiSliders },
                { id: 'skills', label: 'Skills', icon: FiBookOpen },
                { id: 'templates', label: 'Templates', icon: FiLayers },
              ].map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleViewModeChange(opt.id)}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-left transition-colors border-0 cursor-pointer ${viewMode === opt.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Icon size={14} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Search Bar */}
        <div className="relative mt-2">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={viewMode === 'nodes' ? "Search nodes..." : "Search library..."}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none transition-all focus:border-indigo-500 focus:bg-white font-sans"
          />
        </div>
      </div>

      {/* List Content */}
      <div onScroll={handleScroll} className="flex-1 overflow-y-auto px-2 py-3 msg-scrollbar">
        {viewMode === 'nodes' ? (
          categories.map(category => {
            const categoryNodes = filteredNodes.filter(n => n.category === category);
            if (categoryNodes.length === 0) return null;
            
            const isCollapsed = collapsed[category];

            return (
              <div key={category} className="mb-2">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-2.5 py-2 bg-transparent border-none cursor-pointer outline-none"
                >
                  <div className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 flex items-center gap-1">
                    {category} <span className="text-slate-400 font-semibold">({categoryNodes.length})</span>
                  </div>
                  <div className={`text-[10px] text-slate-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>
                    ▼
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="flex flex-col gap-0.5 mt-1">
                    {categoryNodes.map((n) => {
                      const Icon = n.icon;
                      return (
                        <div
                          key={n.type}
                          draggable
                          onDragStart={(e) => handleDragStart(e, n)}
                          onClick={() => handleAdd(n)}
                          className="node-palette-item group flex items-center gap-3 p-2.5 rounded-lg bg-white border border-transparent cursor-grab transition-all hover:bg-slate-50 hover:border-slate-200 relative"
                        >
                          <div 
                            style={{ backgroundColor: n.bg, color: n.color }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          >
                            <Icon size={16} strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-800 truncate">{n.label}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5 truncate">{n.desc}</div>
                          </div>
                          <div
                            className="info-icon opacity-0 group-hover:opacity-100 flex items-center justify-center p-1.5 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-all duration-150 shrink-0 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTooltipData({
                                node: n,
                                x: rect.right + 10,
                                y: rect.top - 10,
                              });
                            }}
                            onMouseLeave={() => {
                              setTooltipData(null);
                            }}
                          >
                            <FiInfo size={14} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (loading && items.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent" />
            <div className="text-[11px]">Loading items...</div>
          </div>
        ) : items.length === 0 ? (
          <div className="min-h-[250px] flex flex-col items-center justify-center py-10 px-5 text-center text-slate-400 text-xs">
            <FiSearch size={24} className="text-slate-300 mb-2" />
            No items found
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {items.map((item, idx) => {
              let Icon = FiBox;
              let bg = '#F1F5F9';
              let color = '#64748B';
              let title = item.name || '';
              let desc = item.description || '';
              let typeLabel = '';

              if (viewMode === 'agents') {
                Icon = FiCpu;
                bg = '#C9DEFF';
                color = '#1A56DB';
                typeLabel = item.category || 'Agent';
              } else if (viewMode === 'custom_nodes') {
                const details = getNodeDetails(item.type);
                Icon = details.icon;
                bg = details.bg || '#E0F2FE';
                color = details.color || '#0EA5E9';
                typeLabel = details.label || 'Node';
              } else if (viewMode === 'apis') {
                Icon = FiGlobe;
                bg = '#E0F2FE';
                color = '#0EA5E9';
                typeLabel = item.category_name || 'API';
              } else if (viewMode === 'tools') {
                Icon = FiSliders;
                bg = '#FFE4B8';
                color = '#B45309';
                title = item.display_name || item.name;
                typeLabel = item.category || 'Tool';
              } else if (viewMode === 'skills') {
                Icon = FiBookOpen;
                bg = '#FFF3B8';
                color = '#92400E';
                title = item.name ? item.name.replace(/-/g, ' ') : '';
                typeLabel = 'Skill';
              } else if (viewMode === 'templates') {
                Icon = FiLayers;
                bg = '#E5D9FF';
                color = '#7C3AED';
                typeLabel = item.category || 'Template';
              }

              const tooltipNode = {
                bg,
                color,
                icon: Icon,
                label: title,
                category: typeLabel,
                desc: desc || 'Custom template resource'
              };

              const isMerging = mergingTemplateId === item.id;

              return (
                <div
                  key={item.id || item.name || idx}
                  draggable={viewMode !== 'templates' && !isMerging}
                  onDragStart={(e) => handleBackendDragStart(e, item, viewMode)}
                  onClick={() => !isMerging && handleBackendClick(item, viewMode)}
                  className={`group flex items-center gap-3 p-2.5 rounded-lg bg-white border border-transparent cursor-grab transition-all hover:bg-slate-50 hover:border-slate-200 relative ${isMerging ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div 
                    style={{ backgroundColor: bg, color: color }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  >
                    {isMerging ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent" />
                    ) : (
                      <Icon size={16} strokeWidth={2} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate">{title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">{desc || typeLabel}</div>
                  </div>
                  <div
                    className="info-icon opacity-0 group-hover:opacity-100 flex items-center justify-center p-1.5 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-all duration-150 shrink-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipData({
                        node: tooltipNode,
                        x: rect.right + 10,
                        y: rect.top - 10,
                      });
                    }}
                    onMouseLeave={() => {
                      setTooltipData(null);
                    }}
                  >
                    <FiInfo size={14} />
                  </div>
                </div>
              );
            })}
            
            {loading && (
              <div className="flex items-center justify-center py-2 gap-1.5 text-slate-400 text-[10px]">
                <div className="animate-spin rounded-full h-3.5 w-3.5 border border-indigo-500 border-t-transparent" />
                <span>Loading more...</span>
              </div>
            )}
          </div>
        )}

        {viewMode === 'nodes' && filteredNodes.length === 0 && (
          <div className="min-h-[250px] flex flex-col items-center justify-center py-10 px-5 text-center text-slate-400 text-xs">
            <FiSearch size={24} className="text-slate-300 mb-2" />
            No nodes match your search
          </div>
        )}
      </div>

      {/* Tooltip Overlay */}
      {tooltipData && (
        <div 
          ref={tooltipRef}
          style={{
            left: tooltipData.x,
            top: Math.max(10, Math.min(windowHeight - tooltipHeight, tooltipData.y)),
          }}
          className="fixed w-80 bg-white rounded-xl shadow-xl z-[99999] p-4 pointer-events-none flex flex-col gap-3 border border-slate-200 animate-fade-in font-sans"
        >
          <div className="flex items-center gap-2.5">
            <div 
              style={{ backgroundColor: tooltipData.node.bg, color: tooltipData.node.color }}
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            >
              {React.createElement(tooltipData.node.icon, { size: 16, strokeWidth: 2 })}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800">{tooltipData.node.label}</div>
              <div 
                style={{ backgroundColor: tooltipData.node.bg, color: tooltipData.node.color }}
                className="text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block uppercase tracking-wider"
              >
                {tooltipData.node.category}
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          <div className="text-[11.5px] text-slate-600 leading-relaxed whitespace-normal break-word">
            {tooltipData.node.detailedDesc || tooltipData.node.desc}
          </div>

          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-1">
            <FiZap size={10} className="text-indigo-500" />
            <span>Drag to canvas or click to add</span>
          </div>
        </div>
      )}

      {/* Tool Addition Modal */}
      <AddToolModal
        isOpen={!!toolToAdd}
        onClose={() => setToolToAdd(null)}
        tool={toolToAdd}
      />

      {/* Skill Addition Modal */}
      <AddSkillModal
        isOpen={!!skillToAdd}
        onClose={() => setSkillToAdd(null)}
        skill={skillToAdd}
      />

      {/* Agent Type Selector popover component */}
      <AgentTypeSelectorModal
        isOpen={!!agentTypeToSelect}
        onClose={() => setAgentTypeToSelect(null)}
        onSelect={finalizeUseAgent}
      />
    </div>
  );
}

NodePalette.propTypes = {
  onClose: PropTypes.func
};
