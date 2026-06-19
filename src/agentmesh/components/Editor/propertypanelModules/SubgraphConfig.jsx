import React from "react";
import { Field, SearchableSelect, Toggle } from "./SharedComponents";

export default function SubgraphConfig({
  data,
  update,
  currentWorkflowId,
  workflows,
}) {
  return (
    <>
      <Field
        label="Target Workflow"
        hint="Select the compiled workflow to invoke as a sub-agent."
      >
        <SearchableSelect
          value={data.workflow_id || ""}
          onChange={(v) => update({ workflow_id: v })}
          placeholder="Choose a workflow..."
          options={[
            { value: "", label: "— No workflow selected —" },
            ...workflows
              .filter((w) => w.id !== currentWorkflowId)
              .map((w) => ({
                value: w.id,
                label: w.name,
                sublabel: `${w.category || "General"} • ${w.id.slice(0, 8)}`,
              })),
          ]}
        />
      </Field>
      <div
        style={{
          padding: 12,
          background: "var(--bg-primary)",
          borderRadius: 12,
          border: "1px solid var(--border)",
          marginBottom: 18,
        }}
      >
        <Toggle
          checked={data.return_direct}
          onChange={(v) => update({ return_direct: v })}
          label="Return response directly to user"
        />
      </div>
      {!data.workflow_id && (
        <div
          style={{
            padding: 12,
            background: "#FFFBEB",
            borderRadius: 10,
            fontSize: 12,
            color: "#92400E",
            border: "1px solid #FDE68A",
          }}
        >
          Select a compiled workflow to use as a subgraph.
        </div>
      )}
    </>
  );
}
