import { Field, Input } from "./SharedComponents";

export default function EventEmitterConfig({ data, update }) {
  return (
    <>
      <Field
        label="Webhook URL"
        hint="The URL to ping when the workflow reaches this node (e.g. for SSE sync)."
      >
        <Input
          value={
            data.webhook_url ||
            "http://localhost:8000/documents/mesh-status-sync"
          }
          onChange={(v) => update({ webhook_url: v })}
          placeholder="http://localhost:8000/documents/mesh-status-sync"
        />
      </Field>

      <Field
        label="Emit Status"
        hint="Optional status to send in the payload (e.g., awaiting_classification_review)"
      >
        <Input
          value={data.emit_status || ""}
          onChange={(v) => update({ emit_status: v })}
          placeholder="awaiting_classification_review"
        />
      </Field>
    </>
  );
}
