import React from "react";
import { Field, Select, Input, Textarea } from "./SharedComponents";

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript (coming soon)", disabled: true },
];

const MODES = [
  { value: "run_once", label: "Run Once for All Items" },
  { value: "run_for_each", label: "Run Once for Each Item" },
];

export default function CodeExecutionConfig({ data, update }) {
  return (
    <div style={{ paddingTop: 8 }}>
      <Field label="Language" hint="Python is supported. JavaScript reserved for future use.">
        <Select
          value={data.ce_language || "python"}
          onChange={(v) => update({ ce_language: v })}
          options={LANGUAGES}
        />
      </Field>

      <Field label="Execution Mode" hint="Run once with all input data, or once per item in a list.">
        <Select
          value={data.ce_mode || "run_once"}
          onChange={(v) => update({ ce_mode: v })}
          options={MODES}
        />
      </Field>

      <Field label="Input Key" hint="Context key to read input data from. Available as 'input_data' in your code.">
        <Input
          stripBraces
          value={data.ce_input_key || "latest_api_result"}
          onChange={(v) => update({ ce_input_key: v })}
          placeholder="latest_api_result"
        />
      </Field>

      <Field label="Output Key" hint="Context key to write the result to. Also set as latest_code_result.">
        <Input
          stripBraces
          value={data.ce_output_key || "code_result"}
          onChange={(v) => update({ ce_output_key: v })}
          placeholder="code_result"
        />
      </Field>

      <Field label="Code" hint="Write your Python script. Available variables: input_data, input_items, context. Set 'result' to produce output.">
        <Textarea
          value={data.ce_code || ""}
          onChange={(v) => update({ ce_code: v })}
          placeholder={`# Example: filter items\nresult = [x for x in input_data if x.get("status") == "active"]`}
          rows={12}
          noVariablePicker
        />
      </Field>

      <div
        style={{
          marginTop: 4,
          padding: "12px",
          background: "var(--bg-hover, #F8FAFC)",
          borderRadius: 8,
          border: "1px solid var(--border)",
          fontSize: 11,
          color: "var(--text-muted)",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ display: "block", marginBottom: 4, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Available Variables
        </strong>
        <code style={{ display: "block", fontFamily: "monospace" }}>
          input_data   — Data from the configured input key (dict or list)<br />
          input_items  — Always a list (wraps single values)<br />
          context      — Full workflow context (read-only)<br />
          _index       — Current item index (only in "Run for Each" mode)<br />
          result       — Set this variable as your output
        </code>
      </div>

      <div
        style={{
          marginTop: 8,
          padding: "12px",
          background: "#FFFBEB",
          borderRadius: 8,
          border: "1px solid #FDE68A",
          fontSize: 11,
          color: "#92400E",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ display: "block", marginBottom: 4, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
          ⚠️ Sandbox Restrictions
        </strong>
        <code style={{ display: "block", fontFamily: "monospace" }}>
          No imports · No file access · No exec/eval · No network<br />
          Safe builtins only: list, dict, str, int, float, bool, len, range,<br />
          &nbsp;&nbsp;enumerate, zip, map, filter, sorted, sum, min, max, any, all
        </code>
      </div>
    </div>
  );
}
