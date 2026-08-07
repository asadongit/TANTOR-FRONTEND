import React, { memo } from "react";
import { FiCpu, FiBookOpen } from "react-icons/fi";
import {
  Field,
  Input,
  Textarea,
  ToolTagInput,
  Select,
  LLMConfigSection,
  IterationConfigSection,
  ArchitectButton,
  NodeIdList,
  AdvancedSection,
  InfoBanner
} from "./SharedComponents";


const LLMAgentConfig = memo(function LLMAgentConfig({
  data,
  update,
  nodes,
  edges,
  availableTools,
  fixingGrammar,
  handleFixGrammar,
  syncTools,
  syncToggle,
  selectedNodeId,
  hitlSection,
}) {
  return (
    <>
      <Field
        label="System Instructions"
        hint="Define the agent's core role, persona, and behavior rules. This is the 'soul' of the agent."
        action={
          <ArchitectButton
            onClick={() => handleFixGrammar("task")}
            loading={fixingGrammar}
            disabled={!data.task}
          />
        }
      >
        <Textarea
          value={data.task}
          onChange={(v) => update({ task: v })}
          placeholder="You are a helpful assistant that…"
          rows={7}
          debounceMs={300}
        />
      </Field>

      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <FiCpu size={12} /> Model Settings
        </div>
        <LLMConfigSection
          llm={
            data.llm || {
              provider: "groq",
              model: "llama-3.3-70b-versatile",
              temperature: 0,
            }
          }
          onChange={(llm) => update({ llm })}
        />
      </div>

      <Field
        label="Agent Tools"
        hint="Assign specific capabilities to this agent. These are auto-synced with connected Tool Nodes."
      >
        <ToolTagInput
          value={data.tools || []}
          configs={data.tool_configs || {}}
          onUpdate={syncTools}
          availableTools={availableTools}
        />
      </Field>

      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <FiBookOpen size={12} /> Memory & History
        </div>
        <Field
          label="Memory Type"
          hint="Buffer: keeps last N messages. Vector: uses semantic search for long-term recall. None: stateless."
        >
          <Select
            value={data.memory?.type_name || "buffer_memory"}
            onChange={(v) =>
              update({ memory: { ...data.memory, type_name: v } })
            }
            options={[
              {
                value: "buffer_memory",
                label: "Buffer Memory (Recent context)",
              },
              {
                value: "summary_buffer_memory",
                label: "Summary Memory (Condensed)",
              },
              {
                value: "vector_memory",
                label: "Vector Memory (Semantic recall)",
              },
              { value: "none", label: "No Memory (One-shot / Stateless)" },
            ]}
          />
        </Field>
        {(data.memory?.type_name || "buffer_memory") !== "none" && (
          <Field
            label="Memory Scope"
            hint="Unified: shares conversation history. Isolated: only remembers this agent's actions/tools."
          >
            <Select
              value={data.memory?.scope || "unified"}
              onChange={(v) => update({ memory: { ...data.memory, scope: v } })}
              options={[
                { value: "unified", label: "Unified (Shared history)" },
                { value: "isolated", label: "Isolated (Private history)" },
              ]}
            />
          </Field>
        )}
        {(data.memory?.type_name || "buffer_memory") === "vector_memory" && (
          <>
            <Field
              label="Vector DB Provider"
              hint="Select vector store engine (ChromaDB for local, Qdrant for production)."
            >
              <Select
                value={data.memory?.vector_db || "chroma"}
                onChange={(v) => update({ memory: { ...data.memory, vector_db: v } })}
                options={[
                  { value: "chroma", label: "ChromaDB (Local)" },
                  { value: "qdrant", label: "Qdrant (Production)" },
                ]}
              />
            </Field>
            <Field
              label="Retrieval Search Type"
              hint="Cosine similarity vector search or Hybrid BM25+Vector search."
            >
              <Select
                value={data.memory?.search_type || "similarity"}
                onChange={(v) => update({ memory: { ...data.memory, search_type: v } })}
                options={[
                  { value: "similarity", label: "Similarity (Cosine Vector)" },
                  { value: "hybrid", label: "Hybrid (BM25 + Cosine)" },
                ]}
              />
            </Field>
            <Field
              label="Top K Memories"
              hint="Number of semantically relevant past turns to retrieve."
            >
              <Input
                type="number"
                value={data.memory?.top_k ?? 3}
                onChange={(v) =>
                  update({
                    memory: { ...data.memory, top_k: parseInt(v) || 3 },
                  })
                }
                placeholder="3"
              />
            </Field>
          </>
        )}
        {(data.memory?.type_name || "buffer_memory") !== "vector_memory" &&
          (data.memory?.type_name || "buffer_memory") !== "none" && (
            <Field
              label="Window Size"
              hint="How many previous messages the agent remembers. Larger windows use more tokens."
            >
              <Input
                type="number"
                value={data.memory?.window_size ?? 10}
                onChange={(v) =>
                  update({
                    memory: { ...data.memory, window_size: parseInt(v) || 10 },
                  })
                }
                placeholder="10"
              />
            </Field>
          )}
      </div>


      <AdvancedSection
        hitlSection={hitlSection}
        nodes={nodes}
        selectedNodeId={selectedNodeId}
        onErrorValue={data.on_error}
        onErrorChange={(v) => update({ on_error: v })}
      >
        <div style={{ marginBottom: 20 }}>
          <IterationConfigSection
            policy={data.iteration_policy}
            onChange={(policy) => update({ iteration_policy: policy })}
          />
        </div>

        <div
          style={{
            height: "1px",
            background: "var(--border)",
            margin: "16px 0",
          }}
        />



        <div
          style={{
            height: "1px",
            background: "var(--border)",
            margin: "16px 0",
          }}
        />

        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "var(--text-muted)",
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            Context Management
          </div>
          <Field
            label="Context Mode"
            hint="Smart: auto-calculates safe limit per model. Strict: aggressive truncation. Passthrough: sends full context (may exceed token limits)."
          >
            <Select
              value={data.context_mode || "smart"}
              onChange={(v) => update({ context_mode: v })}
              options={[
                { value: "smart", label: "Smart (Auto)" },
                { value: "strict", label: "Strict (500 chars)" },
                { value: "passthrough", label: "Passthrough (Full)" },
              ]}
            />
          </Field>
          <Field
            label="Max Context Length (chars)"
            hint="Optional override for the context character limit. Leave empty for backend auto-calculation."
          >
            <Input
              type="number"
              value={data.max_context_chars || ""}
              onChange={(v) =>
                update({
                  max_context_chars: v ? parseInt(v) || 20000 : undefined,
                })
              }
              placeholder="20000"
            />
          </Field>
        </div>
      </AdvancedSection>

      {nodes.some(
        (n) =>
          n.data?.type === "swarm" &&
          (n.data?.member_ids || []).includes(selectedNodeId),
      ) && (
        <InfoBanner type="danger" style={{ marginTop: 8 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#9D174D",
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Swarm Handoff Rules
          </div>
          <Field
            label="Allowed Handoffs"
            hint="Restrict which other swarm members this agent can transfer control to."
          >
            <NodeIdList
              value={data.allowed_transitions || []}
              onChange={(ids) =>
                update({ allowed_transitions: ids.length > 0 ? ids : null })
              }
              allNodes={nodes}
            />
          </Field>
        </InfoBanner>
      )}
    </>
  );
});

export default LLMAgentConfig;
