import React from "react";
import { LLMConfigSection } from "./SharedComponents";

export default function ChatModelConfig({ data, update }) {
  return (
    <div style={{ paddingTop: 8 }}>
      <LLMConfigSection
        llm={{
          provider: data.provider,
          model: data.model,
          temperature: data.temperature,
          api_key_override: data.api_key_override,
        }}
        onChange={(llm) => update({ ...llm })}
      />
    </div>
  );
}
