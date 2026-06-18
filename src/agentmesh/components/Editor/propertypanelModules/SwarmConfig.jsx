import React, { memo } from "react";
import {
  Field,
  Textarea,
  LLMConfigSection,
  NodeIdList,
  ToolTagInput,
  IterationConfigSection,
  WizardButton,
  CollapsibleSection,
  ErrorTargetField,
} from "./SharedComponents";

const SwarmConfig = memo(function SwarmConfig({
  data,
  update,
  nodes,
  availableTools,
  fixingGrammar,
  handleFixGrammar,
  syncTools,
  selectedNodeId,
  hitlSection,
}) {
  return (
    <>
      <Field
        label="System Instructions"
        hint="General persona and rules shared across the swarm behavior."
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
          placeholder="You are a team of..."
          rows={5}
          debounceMs={300}
        />
      </Field>

      <Field
        label="Swarm Agents"
        hint="Agents that can hand off to each other. Order determines initial priority."
      >
        <NodeIdList
          value={data.member_ids || []}
          onChange={(member_ids) => update({ member_ids })}
          allNodes={nodes}
        />
      </Field>

      <Field
        label="Swarm Tools"
        hint="Tools available to all swarm members. (Synced with Tool Nodes)"
      >
        <ToolTagInput
          value={data.tools || []}
          configs={data.tool_configs || {}}
          onUpdate={syncTools}
          availableTools={availableTools}
        />
      </Field>

      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-muted)",
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Swarm LLM
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

      <CollapsibleSection title="Advanced Options">
        {hitlSection}
        <div
          style={{
            height: "1px",
            background: "var(--border)",
            margin: "16px 0",
          }}
        />
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

        <ErrorTargetField
          value={data.on_error}
          onChange={(v) => update({ on_error: v })}
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          hint="If the swarm orchestration fails, jump to this error handler."
        />
      </CollapsibleSection>
    </>
  );
});

export default SwarmConfig;
