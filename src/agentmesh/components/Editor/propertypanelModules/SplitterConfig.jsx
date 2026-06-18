import React from "react";
import { FiInfo } from "react-icons/fi";
import { Field, Input } from "./SharedComponents";

export default function SplitterConfig({ data, update }) {
  return (
    <>
      <Field
        label="Field to Split"
        hint="The key in state/context that contains the array (e.g., 'items')."
      >
        <Input
          value={data.split_field || "items"}
          onChange={(v) => update({ split_field: v })}
          placeholder="e.g. items"
        />
      </Field>
      <Field
        label="Batch Size"
        hint="Number of items to process per iteration."
      >
        <Input
          type="number"
          value={data.batch_size ?? 1}
          onChange={(v) => update({ batch_size: parseInt(v) || 1 })}
          placeholder="1"
        />
      </Field>
      <Field
        label="Destination Field"
        hint="The context key where the current item will be stored (default: 'item')."
      >
        <Input
          value={data.destination_field || "item"}
          onChange={(v) => update({ destination_field: v })}
          placeholder="item"
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
          Global Discovery Options
        </div>
        <Field
          label="Discovery Keys (Optional)"
          hint="Comma-separated prefix patterns (e.g. 'cd_output_') to gather extra keys from state and inject them into each split iteration's context."
        >
          <Input
            value={data.discovery_keys || ""}
            onChange={(v) => update({ discovery_keys: v })}
            placeholder="cd_output_, ocr_like_results"
          />
        </Field>
      </div>
      <div
        style={{
          padding: 12,
          background: "var(--bg-card-warning-alt, #FFF7ED)",
          borderRadius: 10,
          fontSize: 11,
          color: "var(--text-card-warning-alt, #9A3412)",
          border: "1px solid var(--border-card-warning-alt, #FED7AA)",
          lineHeight: 1.5,
        }}
      >
        <FiInfo size={12} style={{ marginRight: 6 }} />
        Iterates through a list. Each iteration puts the current item into{" "}
        <strong>context.{data.destination_field || "item"}</strong>.
        <br />
        <br />
        Use <strong>intent == 'loop'</strong> for the processing path and{" "}
        <strong>intent == 'done'</strong> for the completion path.
      </div>
    </>
  );
}
