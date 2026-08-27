import React, { memo } from "react";
import { FiCpu, FiBookOpen, FiLayers } from "react-icons/fi";
import {
  Field,
  Input,
  Textarea,
  ToolTagInput,
  Select,
  Toggle,
  LLMConfigSection,
  IterationConfigSection,
  ArchitectButton,
  NodeIdList,
  AdvancedSection,
  CollapsibleSection,
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

          {/* Without this, an answer is only stored when it happens to contain
              particular field names, and otherwise vanishes without a word. */}
          <Field
            label="Save Answer To"
            hint="Where to store this agent's answer when it replies with structured data. Set this whenever a later step needs the answer — leave blank and it may not be stored at all."
          >
            <Input
              stripBraces
              value={data.agent_output_key || ""}
              onChange={(v) => update({ agent_output_key: v || null })}
              placeholder="e.g. extracted_data"
            />
          </Field>

          {/* A model occasionally returns a fraction of what it should, with no
              error and valid output — which reads downstream as a thin document
              rather than a thin answer. This states what "too short" looks like
              and asks again. */}
          <Field
            label="Ask Again If The Answer Is Too Short"
            hint="A description of an answer worth rejecting, written as a test — for example: len(answer.lines) < 20. When it is true the agent is asked again. Leave empty to accept whatever comes back first. Use this when the same input sometimes returns much less than it should."
          >
            <Input
              value={data.agent_retry_when || ""}
              onChange={(v) => update({ agent_retry_when: v || null })}
              placeholder="e.g. len(answer.lines) < 20"
            />
          </Field>

          {data.agent_retry_when && (
            <Field
              label="How Many Extra Tries"
              hint="How many more times to ask when the answer is rejected. The first acceptable answer is used. If every try is rejected the fullest one is kept, and that is recorded alongside it so nobody mistakes it for a good answer."
            >
              <Input
                type="number"
                min={0}
                value={data.agent_retry_max ?? 2}
                onChange={(v) =>
                  update({ agent_retry_max: Math.max(0, Number(v) || 0) })
                }
              />
            </Field>
          )}

          {/* Asking for hundreds of fields in one answer costs accuracy — the
              model drops entries or abandons the shape part way through. This
              asks for them a batch at a time and joins the answers up. */}
          <Field
            label="Ask In Batches"
            hint="Ask this agent for a long list a handful at a time instead of all at once, then join the answers into one. Use it when the list is long enough that the agent starts missing things. Off means one ordinary call, exactly as before."
          >
            <Toggle
              checked={!!data.agent_batch_enabled}
              onChange={(v) => update({ agent_batch_enabled: v })}
            />
          </Field>

          {data.agent_batch_enabled && (
            <CollapsibleSection
              title="Batch Settings"
              defaultOpen={true}
              icon={FiLayers}
            >
              <Field
                label="The Full List"
                hint="The whole list of things to ask for, kept somewhere outside the prompt. The agent never sees all of it at once — this is just where it lives. Keeping it here means adding more later is a change to a list, not to the instructions."
              >
                <Input
                  value={data.agent_batch_items || ""}
                  onChange={(v) => update({ agent_batch_items: v || null })}
                  placeholder="e.g. {{ balance_sheet_fields }}"
                />
              </Field>

              <Field
                label="How Many At A Time"
                hint="How much of the list to ask for in one go. Ask for too much at once and the answer starts dropping things. Smaller is usually more accurate but means more calls: a list of 615 asked 50 at a time is 13 calls."
              >
                <Input
                  type="number"
                  min={1}
                  value={data.agent_batch_size ?? 50}
                  onChange={(v) =>
                    update({ agent_batch_size: Math.max(1, Number(v) || 50) })
                  }
                />
              </Field>

              <Field
                label="What To Call It In The Instructions"
                hint="The name the current handful goes by inside your instructions. Write {{ batch_items }} in the prompt and each call quietly swaps in that call's share of the list. Only change this if that name clashes with something else."
              >
                <Input
                  stripBraces
                  value={data.agent_batch_var || ""}
                  onChange={(v) => update({ agent_batch_var: v || "batch_items" })}
                  placeholder="batch_items"
                />
              </Field>

              <Field
                label="What Makes Two Entries The Same One"
                hint="If every answer comes back with a list — one entry per year, say — this says how to tell which entries are really the same entry. Put 'slot' here and year 1 from every call becomes one year 1. Leave it blank and you get one entry per call instead, which for three years and thirteen calls means 39 entries rather than 3."
              >
                <Input
                  stripBraces
                  value={data.agent_batch_merge_key || ""}
                  onChange={(v) => update({ agent_batch_merge_key: v || null })}
                  placeholder="e.g. slot"
                />
              </Field>

              <Field
                label="How The Answers Are Put Together"
                hint="Deep is the normal choice: it fits all the answers into one, however deeply nested. Shallow only joins the outermost level and ignores what is inside. Keep separate does not join them at all and hands back one answer per call, for when you want to look at them yourself."
              >
                <Select
                  value={data.agent_batch_merge || "deep_merge"}
                  onChange={(v) => update({ agent_batch_merge: v })}
                  options={[
                    { value: "deep_merge", label: "Deep (join everything)" },
                    { value: "shallow_merge", label: "Shallow (outer level only)" },
                    { value: "list_concat", label: "Keep separate" },
                  ]}
                />
              </Field>

              <Field
                label="How Many Calls At Once"
                hint="Whether to ask several times at once or wait for each answer before asking again. One at a time is slowest and safest. Raising it is faster but asks the model provider for more at once, and they may refuse if you go too fast."
              >
                <Input
                  type="number"
                  min={1}
                  value={data.agent_batch_max_parallel ?? 1}
                  onChange={(v) =>
                    update({ agent_batch_max_parallel: Math.max(1, Number(v) || 1) })
                  }
                />
              </Field>

              <Field
                label="If One Call Goes Wrong"
                hint="Carry on means the rest still run; only that handful comes back empty, and you are told which one failed so nobody mistakes empty for zero. Stop means one bad call throws the whole thing away, including the parts that worked."
              >
                <Select
                  value={data.agent_batch_on_error || "continue"}
                  onChange={(v) => update({ agent_batch_on_error: v })}
                  options={[
                    { value: "continue", label: "Carry on and tell me" },
                    { value: "fail", label: "Stop everything" },
                  ]}
                />
              </Field>
            </CollapsibleSection>
          )}

          <Field
            label="Always Include These Values"
            hint="Comma-separated. Some large values are held back from the prompt by default. Name any this agent must receive — for example the text a previous step extracted."
          >
            <Input
              value={(data.agent_context_include || []).join(", ")}
              onChange={(v) =>
                update({
                  agent_context_include: v
                    ? v.split(",").map((s) => s.trim()).filter(Boolean)
                    : null,
                })
              }
              placeholder="e.g. vision_result"
            />
          </Field>

          <Field
            label="Never Include These Values"
            hint="Comma-separated. Keeps large values out of this agent's prompt when it does not need them but a later step does."
          >
            <Input
              value={(data.agent_context_exclude || []).join(", ")}
              onChange={(v) =>
                update({
                  agent_context_exclude: v
                    ? v.split(",").map((s) => s.trim()).filter(Boolean)
                    : null,
                })
              }
              placeholder="e.g. raw_payload"
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
