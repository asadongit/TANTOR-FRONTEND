import React from "react";
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
            stripBraces
            value={data.debug_key || ""}
            onChange={(v) => update({ debug_key: v })}
            placeholder="e.g. results"
          />
        </Field>
      )}
    </>
  );
}
