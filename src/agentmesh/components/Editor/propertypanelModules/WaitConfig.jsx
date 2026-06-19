import React from "react";
import { FiInfo } from "react-icons/fi";
import { Field, Input } from "./SharedComponents";

export default function WaitConfig({ data, update }) {
  return (
    <>
      <Field
        label="Wait Duration (Seconds)"
        hint="Workflow will pause for this many seconds before continuing."
      >
        <Input
          type="number"
          value={data.wait_seconds ?? 0}
          onChange={(v) => update({ wait_seconds: v })}
          placeholder="e.g. 60"
        />
      </Field>
      <div
        style={{
          padding: 12,
          background: "#F8FAFC",
          borderRadius: 10,
          fontSize: 11,
          color: "#475569",
          lineHeight: 1.5,
          border: "1px solid var(--border)",
          marginTop: 10,
        }}
      >
        <FiInfo size={12} style={{ marginRight: 6 }} />
        Useful for rate limiting or waiting for external processes to settle.
      </div>
    </>
  );
}
