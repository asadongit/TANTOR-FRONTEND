import React, { memo } from "react";
import { FiCpu, FiBookOpen, FiZap } from "react-icons/fi";
import {
  Field,
  Input,
  Textarea,
  ToolTagInput,
  LLMConfigSection,
  ArchitectButton,
  NodeIdList,
  AdvancedSection,
} from "./SharedComponents";


const DeepAgentConfig = memo(function DeepAgentConfig({
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
  setSkillGalleryOpen,
  hitlSection,
}) {
  return (
    <>
      <Field
        label="System Instructions"
        hint="The high-level objective and behavioral rules. The Deep Agent will use this to generate its own sub-tasks and to-do list."
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
          placeholder="e.g. Research the latest 2026 AI trends and write a report..."
          rows={5}
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
          <FiCpu size={12} /> Reasoning Model
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
        label="Autonomous Subagents"
        hint="Select other nodes in this mesh that this Deep Agent can delegate tasks to."
      >
        <NodeIdList
          value={data.subagents || []}
          onChange={(ids) => update({ subagents: ids })}
          allNodes={nodes}
        />
      </Field>

      <Field
        label="Managed Tools"
        hint="Tools given to the Deep Agent for its research loops. Synced with connected Tool Nodes."
      >
        <ToolTagInput
          value={data.tools || []}
          configs={data.tool_configs || {}}
          onUpdate={syncTools}
          availableTools={availableTools}
        />
      </Field>

      {/* Skills selection */}
      <Field
        label="Agent Skills (VFS Templates)"
        hint="Equip this agent with specialized executable python task files."
        action={
          <button
            onClick={() => setSkillGalleryOpen(true)}
            style={{
              padding: "4px 10px",
              background: "#F5F3FF",
              color: "#8B5CF6",
              borderRadius: 6,
              fontSize: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontWeight: 700,
              border: "none",
            }}
          >
            <FiBookOpen size={10} /> BROWSE GALLERY
          </button>
        }
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {(!data.skills || data.skills.length === 0) && (
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontStyle: "italic",
                padding: "4px 0",
              }}
            >
              No skills applied yet.
            </div>
          )}
          {(data.skills || []).map((skillPath) => {
            const label = skillPath
              .split("/")
              .pop()
              .replace(/-/g, " ")
              .toUpperCase();
            return (
              <div
                key={skillPath}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  background: "white",
                  border: "1px solid var(--border)",
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                <FiZap size={10} color="#8B5CF6" />
                {label}
                <button
                  onClick={() => {
                    const newSkills = (data.skills || []).filter(
                      (s) => s !== skillPath,
                    );
                    update({ skills: newSkills });
                  }}
                  style={{
                    border: "none",
                    background: "none",
                    padding: 2,
                    cursor: "pointer",
                    color: "var(--text-muted)",
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </Field>

      <AdvancedSection
        hitlSection={hitlSection}
        nodes={nodes}
        selectedNodeId={selectedNodeId}
        onErrorValue={data.on_error}
        onErrorChange={(v) => update({ on_error: v })}
        onErrorHint="If this node fails, jump to this error handler."
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
            Planning Limits
          </div>
          <Field
            label="Max Reasoning Steps"
            hint="Limits the number of autonomous task updates."
          >
            <Input
              type="number"
              value={data.max_iterations ?? 10}
              onChange={(v) => update({ max_iterations: parseInt(v) || 10 })}
              placeholder="10"
            />
          </Field>
          <Field label="Timeout (Seconds)">
            <Input
              type="number"
              value={data.timeout_seconds ?? 300}
              onChange={(v) => update({ timeout_seconds: parseInt(v) || 300 })}
              placeholder="300"
            />
          </Field>
        </div>
      </AdvancedSection>
    </>
  );
});

export default DeepAgentConfig;
