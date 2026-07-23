import React from "react";
import { Field, Input } from "./SharedComponents";

export default function SplitterConfig({ data, update }) {
  return (
    <>
      <Field
        label="Field to Split"
        hint="The key in state/context that contains the array (e.g., 'items')."
      >
        <Input
          stripBraces
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
          stripBraces
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
            stripBraces
            value={data.discovery_keys || ""}
            onChange={(v) => update({ discovery_keys: v })}
            placeholder="cd_output_, ocr_like_results"
          />
        </Field>
      </div>
    </>
  );
}
