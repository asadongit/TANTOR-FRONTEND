import React from "react";
import { Field, Textarea, Input } from "./SharedComponents";

export default function PayloadBuilderConfig({ data, update }) {
  return (
    <>
      <Field
        label="Payload Template (JSON or String)"
        hint="Define the template. Supports {{context.var}} interpolation."
      >
        <Textarea
          value={
            typeof data.payload_template === "object" &&
            data.payload_template !== null
              ? JSON.stringify(data.payload_template, null, 2)
              : data.payload_template || ""
          }
          onChange={(v) => {
            try {
              const parsed = JSON.parse(v);
              update({ payload_template: parsed });
            } catch (e) {
              update({ payload_template: v });
            }
          }}
          placeholder='{\n  "customer_name": "{{context.customer_name}}"\n}'
          rows={10}
        />
      </Field>
      <Field
        label="Destination Key"
        hint="The context key where the built payload will be stored."
      >
        <Input
          value={data.payload_destination_key || "webhook_payload"}
          onChange={(v) => update({ payload_destination_key: v })}
          placeholder="webhook_payload"
        />
      </Field>
      <div
        style={{
          marginTop: 12,
          borderTop: "1px solid var(--border)",
          paddingTop: 12,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: "var(--text-muted)",
            marginBottom: 12,
            textTransform: "uppercase",
          }}
        >
          Auto-Collection Options
        </div>
        <Field
          label="Auto Collect Prefix"
          hint="Automatically merge all context keys matching this prefix into the payload (e.g., 'cd_output_')."
        >
          <Input
            value={data.auto_collect_prefix || ""}
            onChange={(v) => update({ auto_collect_prefix: v })}
            placeholder="cd_output_"
          />
        </Field>
        <Field
          label="Clean Binary Fields"
          hint="Comma-separated paths to remove from auto-collected items before final payload generation (e.g. 'binary_image, raw_pdf')."
        >
          <Input
            value={data.clean_binary_from || ""}
            onChange={(v) => update({ clean_binary_from: v })}
            placeholder="binary_data, image_bytes"
          />
        </Field>
      </div>
    </>
  );
}
