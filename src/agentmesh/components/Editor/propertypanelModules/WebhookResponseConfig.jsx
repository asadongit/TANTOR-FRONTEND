import React from "react";
import { Field, Input, KeyValueEditor } from "./SharedComponents";
import { FiShare2 } from "react-icons/fi";

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

      <div
        style={{
          padding: 12,
          background: "#ECFDF5",
          borderRadius: 10,
          fontSize: 11,
          color: "#059669",
          lineHeight: 1.5,
          border: "1px solid #A7F3D0",
          marginTop: 10,
        }}
      >
        <FiShare2 size={12} style={{ marginRight: 6 }} />
        This node only has an effect if the Webhook Trigger is set to{" "}
        <strong>On Completion</strong> mode. It captures specific data and
        prepares the final HTTP response for the caller.
      </div>
    </>
  );
}
