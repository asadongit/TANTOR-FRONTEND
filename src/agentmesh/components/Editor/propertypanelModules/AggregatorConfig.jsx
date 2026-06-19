import React from "react";
import { FiLayers } from "react-icons/fi";
import { Field, Select, Input } from "./SharedComponents";

export default function AggregatorConfig({ data, update }) {
  return (
    <>
      <Field label="Action Strategy" hint="How to group the incoming items.">
        <Select
          value={data.action || "append"}
          onChange={(v) => update({ action: v })}
          options={[
            { value: "append", label: "Append to List (Array)" },
            { value: "merge", label: "Merge into Object (Dict)" },
            { value: "concatenate", label: "Concatenate (String)" },
          ]}
        />
      </Field>
      <Field
        label="Field to Aggregate"
        hint="The path to the data you want to collect (e.g. 'item')."
      >
        <Input
          value={data.field_to_aggregate || "item"}
          onChange={(v) => update({ field_to_aggregate: v })}
          placeholder="item"
        />
      </Field>
      <Field
        label="Destination Field"
        hint="Where to store the final combined result."
      >
        <Input
          value={data.destination_field || "aggregated_results"}
          onChange={(v) => update({ destination_field: v })}
          placeholder="aggregated_results"
        />
      </Field>
      {data.action === "concatenate" && (
        <Field
          label="Separator"
          hint="Characters used to join strings (e.g. \n)."
        >
          <Input
            value={data.separator || "\\n"}
            onChange={(v) => update({ separator: v })}
            placeholder="\\n"
          />
        </Field>
      )}
      <div
        style={{
          padding: 12,
          background: "#F0F9FF",
          borderRadius: 10,
          fontSize: 11,
          color: "#0369A1",
          border: "1px solid #BAE6FD",
          lineHeight: 1.5,
        }}
      >
        <FiLayers size={12} style={{ marginRight: 6 }} />
        Collects data across loop iterations. It will release the full payload
        to{" "}
        <strong>
          context.{data.destination_field || "aggregated_results"}
        </strong>{" "}
        automatically once the Splitter finishes.
      </div>
    </>
  );
}
