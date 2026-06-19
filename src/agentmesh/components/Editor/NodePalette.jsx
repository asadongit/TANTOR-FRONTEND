import React, { useState } from 'react';
import { useWorkflowStore } from '../../store';
import {
  FiPlay, FiCpu, FiBox, FiGitMerge,
  FiTarget, FiShare2, FiBookOpen, FiLink,
  FiSearch, FiGlobe, FiClock, FiVolume2, FiRepeat, FiFileText, FiBell, FiAlertTriangle, FiZap, FiGitBranch, FiActivity, FiCheck, FiEdit, FiFilter, FiShield, FiCamera, FiLayers, FiInbox, FiDatabase, FiServer,
  FiCode, FiSliders
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

  // Autonomous Agents
  { type: 'llm_agent',  icon: FiCpu,       label: 'Agent',        desc: 'An LLM-powered agent with access to memory and tools.', detailedDesc: 'An advanced AI assistant utilizing language models (LLMs). It evaluates instructions, calls registered tools to fetch data or perform actions, uses context variables, and maintains conversation memory.', bg: '#C9DEFF', color: '#1A56DB', category: 'Autonomous Agents' },
  { type: 'deep_agent', icon: FiCpu,       label: 'Deep Agent',   desc: 'An autonomous agent that creates plans and reasons step-by-step.', detailedDesc: 'A reasoning agent built for complex workflows. It breaks down goals into planned tasks, reasons through multiple steps, uses external files or tools, and operates autonomously to achieve high-accuracy results.', bg: '#E9D5FF', color: '#6B21A8', category: 'Autonomous Agents' },
  { type: 'supervisor', icon: FiTarget,    label: 'Supervisor',   desc: 'Orchestrates a group of worker agents to perform tasks.', detailedDesc: 'An AI supervisor that directs a team of autonomous agents, routing sub-tasks dynamically and consolidating their results to complete a larger objective.', bg: '#C9F5E0', color: '#065F46', category: 'Autonomous Agents' },
  { type: 'swarm',      icon: FiShare2,    label: 'Swarm',        desc: 'A multi-agent network that passes tasks back and forth.', detailedDesc: 'Uses the swarm pattern to coordinate handoffs between specialized agents, allowing them to pass tasks to each other seamlessly depending on the needs of the conversation.', bg: '#FFD9EE', color: '#9D174D', category: 'Autonomous Agents' },
  { type: 'classification', icon: FiFilter, label: 'Classification Agent', desc: 'Classifies input data into categories using LLMs or Regex.', detailedDesc: 'Analyzes files or text inputs and assigns them to defined categories (e.g., classifying a document as a Tax Return or Bank Statement) using AI prompt evaluation or pattern-matching rules.', bg: '#C9DEFF', color: '#1A56DB', category: 'Autonomous Agents' },
  
  // Knowledge & RAG
  { type: 'rag_node',   icon: FiBookOpen,  label: 'RAG',          desc: 'Retrieves relevant context from a vector search database.', detailedDesc: 'Retrieves relevant reference chunks from knowledge collection vector databases using similarity searches to ground AI prompts and prevent hallucinations.', bg: '#FFF3B8', color: '#92400E', category: 'Knowledge & RAG' },
  { type: 'ingestion_node', icon: FiBox,      label: 'Ingestion',    desc: 'Indexes external document collections into the RAG vector store.', detailedDesc: 'Processes, chunks, embeds, and uploads directories of documents into the vector store database for use by RAG retrieval systems.', bg: '#E0F2FE', color: '#0EA5E9', category: 'Knowledge & RAG' },
  { type: 'ocr_node',       icon: FiCamera,   label: 'OCR Node',     desc: 'Extract text from images or PDF documents.', detailedDesc: 'Uses advanced vision models or OCR engines to convert scanned files, PDFs, or images into raw text. The extracted text is saved to context variables.', bg: '#FDF2F8', color: '#DB2777', category: 'Knowledge & RAG' },

  // External Integrations
  { type: 'tool_node',  icon: FiBox,       label: 'Tool',         desc: 'Executes database or utility functions as requested by agents.', detailedDesc: 'Serves as the execution bridge for LLM tools, running functions (e.g., sending emails, database queries, arithmetic calculations) and returning the results directly to the calling agent.', bg: '#FFE4B8', color: '#B45309', category: 'External Integrations' },
  { type: 'direct_tool', icon: FiBox,       label: 'Direct Tool',  desc: 'Runs a single integration tool directly without an agent.', detailedDesc: 'Executes a specific utility function directly in the workflow using input parameters, saving the output to a designated context variable.', bg: '#FFF7ED', color: '#F97316', category: 'External Integrations' },
  { type: 'api_node',   icon: FiGlobe,     label: 'API Request',  desc: 'Triggers HTTP requests to external APIs with dynamic values.', detailedDesc: 'Triggers HTTP requests (GET, POST, PUT, etc.) to external APIs with dynamic values interpolated from context variables. Supports REST/SOAP/GraphQL protocols, OAuth/Basic auth connections, and sequential or parallel execution. Results are saved to context.api_result_<node_id> (and latest_api_result) for use in prompts via {{api_result_<node_id>.field}}.', bg: '#E0F2FE', color: '#0EA5E9', category: 'External Integrations' },
  
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
  { type: 'data_cleaning', icon: FiFilter,  label: 'Data Cleaning',  desc: 'Cleans datasets using predefined rules or Pandas scripts.', detailedDesc: 'Applies standard data hygiene rules (like trimming whitespaces, fixing casing, or dropping nulls) or executes custom Pandas python scripts on tabular data.', bg: '#ECFDF5', color: '#059669', category: 'Data & Storage' },
  { type: 'network_graph', icon: FiDatabase, label: 'Network Graph', desc: 'Ingests structured transaction nodes into Neo4j.', detailedDesc: 'Extracts entity relationships from context datasets and saves them as node and edge records in a Neo4j graph database.', bg: '#EFF6FF', color: '#1D4ED8', category: 'Data & Storage' },
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'white', fontFamily: "'Google Sans','Roboto',sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Node library ({filteredNodes.length})</div>
        
        
        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes..."
            style={{
              width: '100%',
              padding: '9px 12px 9px 34px',
              background: '#F8F9FB',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'all 0.15s'
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.background = 'white'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = '#F8F9FB'; }}
          />
        </div>
      </div>

      {/* Node list grouped by category */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }} className="msg-scrollbar">
        {categories.map(category => {
          const categoryNodes = filteredNodes.filter(n => n.category === category);
          if (categoryNodes.length === 0) return null;
          
          const isCollapsed = collapsed[category];

          return (
            <div key={category} style={{ marginBottom: 8 }}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <div style={{ 
                  fontSize: 11, 
                  fontWeight: 800, 
                  letterSpacing: '0.05em', 
                  textTransform: 'uppercase', 
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  {category} <span style={{ color: '#94A3B8', fontWeight: 600 }}>({categoryNodes.length})</span>
                </div>
                <div style={{ 
                  fontSize: 10, 
                  color: 'var(--text-muted)',
                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}>
                  ▼
                </div>
              </button>

              {/* Category Content */}
              {!isCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                  {categoryNodes.map((n) => {
                    const Icon = n.icon;
                    return (
                      <div
                        key={n.isTemplate ? `template_${n.label}` : n.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, n)}
                        onClick={() => handleAdd(n)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 12px', borderRadius: 8,
                          background: 'white', border: '1px solid transparent',
                          cursor: 'grab', transition: 'all 0.12s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.border = '1px solid var(--border)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.border = '1px solid transparent'; }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: n.bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, color: n.color,
                        }}>
                          <Icon size={16} strokeWidth={2} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{n.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{n.desc}</div>
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
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>🔍</div>
            No nodes match your search
          </div>
        )}
      </div>
    </div>
  );
}
