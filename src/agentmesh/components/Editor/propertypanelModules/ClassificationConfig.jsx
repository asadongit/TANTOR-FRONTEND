import React from "react";
import { FiCpu, FiInfo } from "react-icons/fi";

import {
  Select,
  Field,
  Input,
  Textarea,
  MiniatureToggle,
  VariableLinker,
  ClassificationClassesEditor,
  LLMConfigSection,
} from "./SharedComponents";

export default function ClassificationConfig({ data, update }) {
  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <label
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            display: "block",
            marginBottom: 6,
          }}
        >
          Classification Engine
        </label>
        <Select
          value={data.classification_engine || "llm"}
          onChange={(v) => update({ classification_engine: v })}
          options={[
            { value: "llm", label: "LLM (AI Classifier)" },
            { value: "regex", label: "Regex Patterns (Static Classifier)" },
          ]}
        />
      </div>

      {data.classification_engine !== "regex" && (
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
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <label
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
          }}
        >
          Classification Classes
        </label>
        <VariableLinker
          targetType={["schema_list", "list"]}
          onSelect={(variable) => {
            if (variable.var_type === "schema_list") {
              update({
                classification_classes: variable.value.map((item) => ({
                  class: item.name,
                  description: item.description || "",
                })),
              });
            } else if (variable.var_type === "list") {
              update({
                classification_classes: variable.value.map((name) => ({
                  class: name,
                  description: "",
                })),
              });
            }
          }}
          tooltip="Load from Variable"
        />
      </div>
      <ClassificationClassesEditor
        value={data.classification_classes || []}
        onChange={(v) => update({ classification_classes: v })}
        engine={data.classification_engine || "llm"}
      />

      <hr
        style={{
          border: "none",
          borderTop: "1px solid var(--border)",
          margin: "20px 0",
          opacity: 0.5,
        }}
      />

      {data.classification_engine !== "regex" && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary, #475569)", fontWeight: 600 }}>
                Summarize Classified Content
              </span>
              <FiInfo
                size={12}
                style={{ color: "var(--text-muted)", opacity: 0.5, cursor: "help" }}
                title="If enabled, the node will return a summary of the input data instead of the original raw data."
              />
            </div>
            <MiniatureToggle
              checked={data.classification_summary === true}
              onChange={(v) => update({ classification_summary: v })}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary, #475569)", fontWeight: 600 }}>
                Extract Identifiers (NER)
              </span>
              <FiInfo
                size={12}
                style={{ color: "var(--text-muted)", opacity: 0.5, cursor: "help" }}
                title="If enabled, dynamically extracts key reference IDs (e.g. Govt IDs, Account Numbers) into an array."
              />
            </div>
            <MiniatureToggle
              checked={data.classification_extract_identifiers === true}
              onChange={(v) => update({ classification_extract_identifiers: v })}
            />
          </div>
        </>
      )}

      <div style={{ marginBottom: 18 }}>
        <label
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            display: "block",
            marginBottom: 6,
          }}
        >
          Input Field Path (Optional)
        </label>
        <Input
          stripBraces
          value={data.classification_input_field || ""}
          onChange={(v) => update({ classification_input_field: v })}
          placeholder="e.g. context.customer_query"
        />
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
          Variables path to classify. If empty, falls back to latest message or
          payload.
        </div>
      </div>

    </>
  );
}
