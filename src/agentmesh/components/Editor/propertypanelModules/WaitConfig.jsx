import React from "react";
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
    </>
  );
}
