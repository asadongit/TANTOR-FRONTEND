import React from "react";
import { FiCpu, FiInfo } from "react-icons/fi";
import {
  Select,
  Field,
  Input,
  Textarea,
  Toggle,
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
          <div style={{ marginBottom: 18 }}>
            <Toggle
              checked={data.classification_summary === true}
              onChange={(v) => update({ classification_summary: v })}
              label="Summarize Classified Content"
            />
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginTop: 4,
                marginLeft: 28,
                marginBottom: 20,
              }}
            >
              If enabled, the node will return a summary of the input data
              instead of the original raw data.
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <Toggle
              checked={data.classification_extract_identifiers === true}
              onChange={(v) =>
                update({ classification_extract_identifiers: v })
              }
              label="Extract Identifiers (NER)"
            />
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginTop: 4,
                marginLeft: 28,
                marginBottom: 20,
              }}
            >
              If enabled, dynamically extracts key reference IDs (e.g. Govt IDs,
              Account Numbers) into an array.
            </div>
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
          value={data.classification_input_field || ""}
          onChange={(v) => update({ classification_input_field: v })}
          placeholder="e.g. context.customer_query"
        />
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
          Variables path to classify. If empty, falls back to latest message or
          payload.
        </div>
      </div>

      <div
        style={{
          padding: "12px 14px",
          background: "#F0F9FF",
          borderRadius: 10,
          fontSize: 11,
          color: "#0369A1",
          border: "1px solid #BAE6FD",
          lineHeight: 1.5,
          marginTop: 18,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <FiInfo size={14} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, fontWeight: 500 }}>
          Classification Agent: Classifies the incoming message or payload into
          one of your custom classes using{" "}
          {data.classification_engine === "regex"
            ? "Regex rules"
            : "the configured LLM"}
          . Returns a JSON object with keys <strong>class</strong> and either{" "}
          <strong>original_data</strong> or <strong>summary</strong>.
        </span>
      </div>
    </>
  );
}
