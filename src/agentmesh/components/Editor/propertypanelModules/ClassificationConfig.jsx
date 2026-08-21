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
                Sort Each Page Separately
              </span>
              <FiInfo
                size={12}
                style={{ color: "var(--text-muted)", opacity: 0.5, cursor: "help" }}
                title="Turn this on when one file can contain more than one kind of document. Each page is sorted on its own and the result says which pages hold which class, instead of the whole file taking the class of its first page. Uses one model call per page."
              />
            </div>
            <MiniatureToggle
              checked={data.classification_per_page === true}
              onChange={(v) => update({ classification_per_page: v })}
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

      <div style={{ marginTop: 16 }}>
        <label
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-secondary)",
            display: "block",
            marginBottom: 6,
          }}
        >
          Save Result As (Optional)
        </label>
        <Input
          stripBraces
          value={data.classification_output_key || ""}
          onChange={(v) => update({ classification_output_key: v })}
          placeholder="e.g. doc_class"
        />
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
          Name to file this result under, so later steps can refer to it. Give
          each classifier its own name when a workflow has more than one,
          otherwise the second overwrites the first. Left empty, the result is
          still available as latest_classification.
        </div>
      </div>

      {data.classification_engine !== "regex" && (
        <div style={{ marginTop: 16 }}>
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
            Max Input Chars (Optional)
          </label>
          <Input
            type="number"
            value={data.classification_max_input_chars ?? ""}
            onChange={(v) => {
              // Tolerate whatever the input hands back — a raw string, a
              // number, or a change event. The previous handler assumed a
              // bare string and stored null for anything else, which is how
              // the panel came to display a value the server never received.
              const raw =
                v && typeof v === "object" && "target" in v ? v.target.value : v;
              const text = String(raw ?? "").trim();
              const n = parseInt(text, 10);
              update({
                classification_max_input_chars:
                  text === "" || Number.isNaN(n) || n <= 0 ? null : n,
              });
            }}
            placeholder="blank = no limit"
          />
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
            Caps how much text is sent to the model. Choosing a class needs a
            sample, not the whole document, and reasoning models given very long
            input can spend their whole output budget thinking and never answer.
            Only the prompt is capped &mdash; the full text is still stored and
            passed downstream. Try 4000.
          </div>
        </div>
      )}

    </>
  );
}
