import React, { memo } from "react";
import {
  Field,
  Textarea,
  LLMConfigSection,
  NodeIdList,
  ToolTagInput,
  IterationConfigSection,
  WizardButton,
  AdvancedSection,
} from "./SharedComponents";

const SupervisorConfig = memo(function SupervisorConfig({
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
        hint="Define the supervisor's orchestration behavior and team goal."
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
          placeholder="You are a manager who..."
          rows={5}
          debounceMs={300}
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
          Supervisor LLM
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
        label="Member Agents"
        hint="Select the agent nodes that this supervisor orchestrates."
      >
        <NodeIdList
          value={data.member_ids || []}
          onChange={(member_ids) => update({ member_ids })}
          allNodes={nodes}
        />
      </Field>

      <Field
        label="Supervisor Tools"
        hint="Tools given to the supervisor (Synced with Tool Nodes)."
      >
        <ToolTagInput
          value={data.tools || []}
          configs={data.tool_configs || {}}
          onUpdate={syncTools}
          availableTools={availableTools}
        />
      </Field>

      <AdvancedSection
        hitlSection={hitlSection}
        nodes={nodes}
        selectedNodeId={selectedNodeId}
        onErrorValue={data.on_error}
        onErrorChange={(v) => update({ on_error: v })}
        onErrorHint="If supervision fails, jump to this error handler."
      >
        <div style={{ marginBottom: 20 }}>
          <IterationConfigSection
            policy={data.iteration_policy}
            onChange={(policy) => update({ iteration_policy: policy })}
          />
        </div>
      </AdvancedSection>
    </>
  );
});

export default SupervisorConfig;
