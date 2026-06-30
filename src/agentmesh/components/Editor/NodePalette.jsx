import React, { useState } from 'react';
import { useWorkflowStore } from '../../store';
import {
  FiPlay, FiCpu, FiBox, FiGitMerge,
  FiTarget, FiShare2, FiBookOpen, FiLink,
  FiSearch, FiGlobe, FiClock, FiVolume2, FiRepeat, FiFileText, FiBell, FiAlertTriangle, FiZap, FiGitBranch, FiActivity, FiCheck, FiEdit, FiFilter, FiShield, FiCamera, FiLayers, FiInbox, FiDatabase, FiServer,
  FiCode, FiSliders, FiInfo, FiMic, FiEye, FiVideo, FiMail
} from 'react-icons/fi';

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
  { type: 'signature_stamp_extractor', icon: FiEdit, label: 'Signature & Stamp Extractor', desc: 'Extract signatures and stamps from documents.', detailedDesc: 'Uses color-specific thresholding to find ink blobs (signatures and stamps), crops them, encodes them to base64, and classifies them using a vision LLM.', bg: '#FDF2F8', color: '#DB2777', category: 'Media Services' },

  // External Integrations
  { type: 'tool_node',  icon: FiBox,       label: 'Tool',         desc: 'Executes database or utility functions as requested by agents.', detailedDesc: 'Serves as the execution bridge for LLM tools, running functions (e.g., sending emails, database queries, arithmetic calculations) and returning the results directly to the calling agent.', bg: '#FFE4B8', color: '#B45309', category: 'External Integrations' },
  { type: 'direct_tool', icon: FiBox,       label: 'Direct Tool',  desc: 'Runs a single integration tool directly without an agent.', detailedDesc: 'Executes a specific utility function directly in the workflow using input parameters, saving the output to a designated context variable.', bg: '#FFF7ED', color: '#F97316', category: 'External Integrations' },
  { type: 'api_node',   icon: FiGlobe,     label: 'API Request',  desc: 'Triggers HTTP requests to external APIs with dynamic values.', detailedDesc: 'Triggers HTTP requests (GET, POST, PUT, etc.) to external APIs with dynamic values interpolated from context variables. Supports REST/SOAP/GraphQL protocols, OAuth/Basic auth connections, and sequential or parallel execution. Results are saved to context.api_result_<node_id> (and latest_api_result) for use in prompts via {{api_result_<node_id>.field}}.', bg: '#E0F2FE', color: '#0EA5E9', category: 'External Integrations' },
  { type: 'email_node',  icon: FiMail,      label: 'SMTP Email Sender', desc: 'Sends an email via any custom SMTP server.', detailedDesc: 'Sends an email with support for HTML templates, Jinja2 rendering, and custom SMTP server configuration. Sensitive credentials are encrypted at rest.', bg: '#EFF6FF', color: '#1D4ED8', category: 'External Integrations' },
  
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
  { type: 'pattern_extract', icon: FiSearch, label: 'Pattern Extractor', desc: 'Extracts specific values using Regex or keywords.', detailedDesc: 'Searches text data for specific patterns (like dates, invoice numbers, or amounts) using regular expressions or keyword match lists and saves them as structured variables.', bg: '#FDF2F8', color: '#DB2777', category: 'Data & Storage' },
  { type: 'db_node',    icon: FiBox,       label: 'MongoDB',        desc: 'Reads or writes data to MongoDB collections.', detailedDesc: 'Directly queries, updates, inserts, or deletes documents in a MongoDB database using connection strings and query parameters.', bg: '#D1FAE5', color: '#065F46', category: 'Data & Storage' },
  { type: 'json_transform', icon: FiCode,   label: 'JSON Transform', desc: 'Reshapes JSON data using JMESPath queries or Python.', detailedDesc: 'Applies JMESPath query syntax or lightweight Python code to filter, reshape, map, and transform complex JSON payloads into the desired format.', bg: '#F5F3FF', color: '#7C3AED', category: 'Data & Storage' },
  { type: 'json_transform_va', icon: FiCode,   label: 'Flatten JSON (VA)', desc: 'Flattens, picks, renames, or omits JSON fields.', detailedDesc: 'A simplified utility to flatten nested objects, select specific fields, rename keys, or omit sensitive values from JSON datasets.', bg: '#E0F2FE', color: '#0369A1', category: 'Data & Storage' },
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
  { type: 'textToAudio', icon: FiVolume2,   label: 'Text to Audio', desc: 'Converts text passages into natural speech audio.', detailedDesc: 'Utilizes text-to-speech audio synthesis models to generate audio files (.mp3/.wav) from written scripts or AI messages.', bg: '#FFE4E1', color: '#C71585', category: 'Media Services' },

  // Visual Organizers
  { type: 'cardboard',   icon: FiLayers,    label: 'Sticky Note',     desc: 'Sticky notes to add visual documentation on the canvas.', detailedDesc: 'Visual layout containers that allow developers to group nodes, add comments, and document canvas flows without affecting runtime execution.', bg: '#F1F5F9', color: '#64748B', category: 'Visual Organizers' },

  // Banking
  { type: 'ingestion_adapter', icon: FiInbox,  label: 'Ingestion Adapter', desc: 'Converts raw banking formats to canonical transaction schema.', detailedDesc: 'Standardizes bank statement formats (CSV, XML, JSON, ISO8583) into a unified canonical schema for financial analytics.', bg: '#F5F3FF', color: '#7C3AED', category: 'Banking' },
  { type: 'banking_enrichment', icon: FiServer,   label: 'Banking Pre-Enrichment Node', desc: 'Gathers external and internal data to enrich accounts.', detailedDesc: 'Queries third-party risk files, account profiles, and transaction histories to enrich banking files before evaluation.', bg: '#F5F3FF', color: '#7C3AED', category: 'Banking' },
  { type: 'beneficiary_risk', icon: FiGitBranch,   label: 'Beneficiary Risk Router', desc: 'Evaluates beneficiary mule risk and routes paths.', detailedDesc: 'Analyzes receiver account details, velocity spikes, and network history to flag potential money-mule accounts.', bg: '#FEF2F2', color: '#EF4444', category: 'Banking' },
  { type: 'rule_engine', icon: FiShield,    label: 'Rule Engine',    desc: 'Runs custom Python rule blocks and scoring cards.', detailedDesc: 'Evaluates complex scoring grids, financial metrics, and custom business validation rules via a lightweight Python sandbox.', bg: '#FEE2E2', color: '#DC2626', category: 'Banking' },
  { type: 'weightage', icon: FiSliders,    label: 'Weightage System', desc: 'Calculates overall weighted scores across multiple categories.', detailedDesc: 'Applies custom category weights to values in context, producing aggregated risk scores or compliance grades.', bg: '#E0F2FE', color: '#0369A1', category: 'Banking' },
];

export default function NodePalette({ onClose }) {
  const addNode = useWorkflowStore((s) => s.addNode);
  const setNodeData = useWorkflowStore((s) => s.setNodeData);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState({});
  const [tooltipData, setTooltipData] = useState(null); // { node, x, y }

  const toggleCategory = (cat) => {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const allNodes = [...NODE_TYPES];

  const filteredNodes = allNodes.filter(n => 
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
    if (n.isTemplate && n.config) {
       e.dataTransfer.setData('application/agentmesh-config', JSON.stringify(n.config));
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleAdd = (n) => {
    const id = addNode(n.type, { x: 200 + Math.random() * 300, y: 100 + Math.random() * 200 });
    if (n.isTemplate && n.config && id) {
       setNodeData(id, n.config);
    }
    onClose?.();
  };

  return (
    <div className="h-full flex flex-col bg-white relative font-sans">
      {/* Header */}
      <div className="p-5 pb-4 border-b border-slate-200">
        <div className="text-sm font-bold text-slate-800">Node library ({filteredNodes.length})</div>
        
        {/* Search Bar */}
        <div className="relative mt-2">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none transition-all focus:border-indigo-500 focus:bg-white font-sans"
          />
        </div>
      </div>

      {/* Node list grouped by category */}
      <div className="flex-1 overflow-y-auto px-2 py-3 msg-scrollbar">
        {categories.map(category => {
          const categoryNodes = filteredNodes.filter(n => n.category === category);
          if (categoryNodes.length === 0) return null;
          
          const isCollapsed = collapsed[category];

          return (
            <div key={category} className="mb-2">
              {/* Category Header */}
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

              {/* Category Content */}
              {!isCollapsed && (
                <div className="flex flex-col gap-0.5 mt-1">
                  {categoryNodes.map((n) => {
                    const Icon = n.icon;
                    return (
                      <div
                        key={n.isTemplate ? `template_${n.label}` : n.type}
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
        })}
        
        {filteredNodes.length === 0 && (
          <div className="py-10 px-5 text-center text-slate-400 text-xs">
            <div className="text-2xl mb-3">🔍</div>
            No nodes match your search
          </div>
        )}
      </div>

      {/* Shared Portal/Tooltip Overlay */}
      {tooltipData && (
        <div 
          style={{
            left: tooltipData.x,
            top: Math.max(10, Math.min(window.innerHeight - 240, tooltipData.y)),
          }}
          className="fixed w-80 bg-white rounded-xl shadow-xl z-[99999] p-4 pointer-events-none flex flex-col gap-3 border border-slate-200 animate-fade-in font-sans"
        >
          {/* Header */}
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

          {/* Description */}
          <div className="text-[11.5px] text-slate-600 leading-relaxed whitespace-normal break-word">
            {tooltipData.node.detailedDesc || tooltipData.node.desc}
          </div>

          {/* Footer tip */}
          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-1">
            <FiZap size={10} className="text-indigo-500" />
            <span>Drag to canvas or click to add</span>
          </div>
        </div>
      )}
    </div>
  );
}
