import React from "react";
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
    </>
  );
}
