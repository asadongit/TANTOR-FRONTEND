import React from "react";
import {
  Select,
  Field,
  Input,
  Textarea,
  Toggle,
  VisualOperationsEditor,
} from "./SharedComponents";

export default function JsonTransformConfig({ data, update }) {
  return (
    <>
      <Field
        label="Input Context Key"
        hint="Context key to read data from (e.g. latest_api_result or nodes.node_id). Leave empty to query the full root context."
      >
        <Input
          stripBraces
          value={data.jt_input_key ?? ""}
          onChange={(v) => update({ jt_input_key: v })}
          placeholder="Leave empty for root context (or e.g. latest_api_result)"
        />
      </Field>

      <Field
        label="Output Context Key"
        hint="Context key where the transformed data will be saved. Defaults to transformed_data."
      >
        <Input
          stripBraces
          value={data.jt_output_key ?? "transformed_data"}
          onChange={(v) => update({ jt_output_key: v })}
          placeholder="transformed_data"
        />
      </Field>

      <Field
        label="Transform Mode"
        hint="JMESPath (declarative queries), Python Expression (custom sandboxed logic), or Operations (visual rules)."
      >
        <Select
          value={data.jt_mode ?? "jmespath"}
          onChange={(v) => update({ jt_mode: v })}
          options={[
            { value: "jmespath", label: "JMESPath (JSON Query)" },
            { value: "python_expr", label: "Python Expression (Sandboxed)" },
            { value: "operations", label: "Visual Operations" },
          ]}
        />
      </Field>

      {data.jt_mode === "jmespath" && (
        <Field
          label="JMESPath Query"
          hint="Query string. E.g. tasks[?status=='SUCCESS'].task_id or job_status.tasks[*].task_id. Wrap a context key in {{ }} to substitute its value (e.g. tasks[?age > {{min_age}}])."
        >
          <Textarea
            value={data.jt_query ?? ""}
            onChange={(v) => update({ jt_query: v })}
            placeholder="job_status.tasks[*].task_id"
            rows={4}
          />
        </Field>
      )}

      {data.jt_mode === "python_expr" && (
        <Field
          label="Python Expression"
          hint="A sandboxed python expression. Use 'data' as the input variable. E.g. [t['task_id'] for t in data['tasks']]"
        >
          <Textarea
            value={data.jt_expression ?? ""}
            onChange={(v) => update({ jt_expression: v })}
            placeholder="[t['task_id'] for t in data['tasks']]"
            rows={4}
          />
        </Field>
      )}

      {data.jt_mode === "operations" && (
        <VisualOperationsEditor
          value={data.jt_operations || []}
          onChange={(ops) => update({ jt_operations: ops })}
        />
      )}

      <Toggle
        label="Merge / Pass Through Input"
        checked={data.jt_pass_through || false}
        onChange={(v) => update({ jt_pass_through: v })}
      />
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          marginTop: -8,
          marginBottom: 20,
        }}
      >
        If enabled, merges the output dictionary into the input dictionary.
      </div>
    </>
  );
}
