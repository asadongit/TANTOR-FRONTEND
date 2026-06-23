import React from "react";
import { Field, Input, KeyValueEditor } from "./SharedComponents";

export default function WebhookResponseConfig({ data, update }) {
  return (
    <>
      <Field
        label="HTTP Status Code"
        hint="Set the status code for the synchronous webhook response (default: 200)."
      >
        <Input
          type="number"
          value={data.response_status ?? 200}
          onChange={(v) => update({ response_status: parseInt(v) || 200 })}
          placeholder="200"
        />
      </Field>

      <KeyValueEditor
        label="Response Headers"
        value={data.response_headers || {}}
        onChange={(v) => update({ response_headers: v })}
        hint="Custom headers to return to the caller (e.g. Content-Type: text/plain)"
      />

      <Field
        label="Response Body Key"
        hint="Select a context key to use as the response body. If empty, returns the full context."
      >
        <Input
          value={data.response_body_key || ""}
          onChange={(v) => update({ response_body_key: v })}
          placeholder="e.g. final_report"
        />
      </Field>
    </>
  );
}
