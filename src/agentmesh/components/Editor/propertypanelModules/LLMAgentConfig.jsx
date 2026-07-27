import React, { memo } from "react";
import { FiCpu, FiBookOpen } from "react-icons/fi";
import {
  Field,
  Input,
  Textarea,
  ToolTagInput,
  Select,
  LLMConfigSection,
  Toggle,
  IterationConfigSection,
  WizardButton,
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
          <WizardButton
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
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "var(--text-muted)",
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            Data Subscriptions (Pub/Sub)
          </div>
          <Field
            label="Subscription Filters (JSON Array/Object)"
            hint="If provided, the agent will filter the input array and ONLY execute if matches are found."
          >
            <Textarea
              value={
                typeof data.subscription_filters === "string"
                  ? data.subscription_filters
                  : data.subscription_filters
                    ? JSON.stringify(data.subscription_filters, null, 2)
                    : ""
              }
              onChange={(v) => update({ subscription_filters: v })}
              placeholder='{\n  "class": ["BALANCE_SHEET"]\n}'
              rows={4}
              debounceMs={300}
            />
          </Field>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Field
                label="Input Array Key"
                hint="The context key containing the array to filter."
              >
                <Input
                  stripBraces
                  value={
                    data.subscription_input_key !== undefined
                      ? data.subscription_input_key
                      : "aggregated_results"
                  }
                  onChange={(v) => update({ subscription_input_key: v })}
                  placeholder="aggregated_results"
                />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field
                label="Output Data Key"
                hint="Where the matched data is stored for the prompt."
              >
                <Input
                  stripBraces
                  value={data.subscription_output_key || ""}
                  onChange={(v) => update({ subscription_output_key: v })}
                  placeholder="latest_ocr_output"
                />
              </Field>
            </div>
          </div>
        </div>

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
            Routing & Execution
          </div>
          <Field
            label="Routing Key"
            hint="Optional: Save the agent's output into this state key (e.g. 'intent') to determine the next path in conditional edges."
          >
            <Input
              stripBraces
              value={data.routing_key || ""}
              onChange={(v) => update({ routing_key: v })}
              placeholder="e.g. intent"
            />
          </Field>
          <Toggle
            checked={data.return_direct}
            onChange={(v) => syncToggle("return_direct", v)}
            label="Return result direct to user"
          />
        </div>

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
            Data Serialization Options
          </div>
          <Field
            label="Agent Input Prefix"
            hint="Prefix for context keys to inject into the agent prompt (default: 'agent_input_')."
          >
            <Input
              value={
                data.agent_input_prefix !== undefined
                  ? data.agent_input_prefix
                  : "agent_input_"
              }
              onChange={(v) => update({ agent_input_prefix: v })}
              placeholder="agent_input_"
            />
          </Field>
          <Field
            label="Output Key Prefix"
            hint="Prefix used when saving the agent's output back to context (default: 'cd_output_')."
          >
            <Input
              value={
                data.output_key_prefix !== undefined
                  ? data.output_key_prefix
                  : "cd_output_"
              }
              onChange={(v) => update({ output_key_prefix: v })}
              placeholder="cd_output_"
            />
          </Field>
        </div>

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
