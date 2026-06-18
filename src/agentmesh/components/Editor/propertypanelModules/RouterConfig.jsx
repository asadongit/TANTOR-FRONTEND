import React from "react";
import { FiInfo } from "react-icons/fi";
import { Field, Input } from "./SharedComponents";

export default function RouterConfig({ data, update }) {
  return (
    <>
      <Field
        label="Routing Key"
        hint="The state key whose value determines which node to route to."
      >
        <Input
          value={data.routing_key || "next"}
          onChange={(v) => update({ routing_key: v })}
          placeholder="next"
        />
      </Field>
      <div
        style={{
          padding: 12,
          background: "#F5F3FF",
          borderRadius: 10,
          fontSize: 12,
          color: "#6D28D9",
          border: "1px solid #DDD6FE",
          lineHeight: 1.5,
        }}
      >
        <FiInfo size={12} style={{ marginRight: 5 }} />
        Connect edges from this router to each possible destination. The routing
        key value must match the edge condition values.
      </div>
    </>
  );
}
