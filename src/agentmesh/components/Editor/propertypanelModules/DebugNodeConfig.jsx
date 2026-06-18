import React from "react";
import { FiInfo } from "react-icons/fi";
import { Select, Field, Input } from "./SharedComponents";

export default function DebugNodeConfig({ data, update }) {
  return (
    <>
      <Field label="Snapshot Scope" hint="Choose what to print to the console.">
        <Select
          value={data.debug_scope || "context"}
          onChange={(v) => update({ debug_scope: v })}
          options={[
            { value: "context", label: "Workflow Context (Variables)" },
            { value: "messages", label: "Last 5 Messages (History)" },
            { value: "full_state", label: "Full Engine State" },
            { value: "evaluation", label: "Evaluation Scope (Raw View)" },
            { value: "selective", label: "Selective Key" },
          ]}
        />
      </Field>

      {data.debug_scope === "selective" && (
        <Field
          label="Target Key"
          hint="The specific context key you want to inspect."
        >
          <Input
            value={data.debug_key || ""}
            onChange={(v) => update({ debug_key: v })}
            placeholder="e.g. results"
          />
        </Field>
      )}

      <div
        style={{
          padding: 12,
          background: "#F8FAFC",
          borderRadius: 10,
          fontSize: 11,
          color: "#475569",
          lineHeight: 1.5,
          border: "1px solid var(--border)",
        }}
      >
        <FiInfo size={12} style={{ marginRight: 6 }} />
        Prints a formatted JSON snapshot of the workflow state directly to the
        chat interface. Use this to verify data movement between nodes.
      </div>
    </>
  );
}
