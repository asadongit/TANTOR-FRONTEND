import React from "react";
import { Field, Select, Input } from "./SharedComponents";

export default function MemoryConfig({ data, update }) {
  return (
    <div style={{ paddingTop: 8 }}>
      <Field label="Memory Type">
        <Select
          value={data.type_name || "buffer_memory"}
          onChange={(v) => update({ type_name: v })}
          options={[
            {
              value: "buffer_memory",
              label: "Buffer Memory (last N messages)",
            },
            {
              value: "summary_buffer_memory",
              label: "Summary Buffer (compressed)",
            },
            { value: "vector_memory", label: "Vector Memory (semantic)" },
            { value: "none", label: "No Memory (One-shot / Stateless)" },
          ]}
        />
      </Field>
      {(data.type_name || "buffer_memory") !== "none" && (
        <Field
          label="Memory Scope"
          hint="Unified: shares conversation history. Isolated: only remembers this agent's actions/tools."
        >
          <Select
            value={data.scope || "unified"}
            onChange={(v) => update({ scope: v })}
            options={[
              { value: "unified", label: "Unified (Shared history)" },
              { value: "isolated", label: "Isolated (Private history)" },
            ]}
          />
        </Field>
      )}
      {(data.type_name || "buffer_memory") === "vector_memory" && (
        <>
          <Field
            label="Vector DB Provider"
            hint="Select vector store engine (ChromaDB for local, Qdrant for production)."
          >
            <Select
              value={data.vector_db || "chroma"}
              onChange={(v) => update({ vector_db: v })}
              options={[
                { value: "chroma", label: "ChromaDB (Local)" },
                { value: "qdrant", label: "Qdrant (Production)" },
              ]}
            />
          </Field>
          <Field
            label="Retrieval Search Type"
            hint="Cosine similarity vector search or Hybrid BM25+Vector search."
          >
            <Select
              value={data.search_type || "similarity"}
              onChange={(v) => update({ search_type: v })}
              options={[
                { value: "similarity", label: "Similarity (Cosine Vector)" },
                { value: "hybrid", label: "Hybrid (BM25 + Cosine)" },
              ]}
            />
          </Field>
          <Field
            label="Top K Memories"
            hint="Number of semantically relevant past turns to retrieve."
          >
            <Input
              type="number"
              value={data.top_k ?? 3}
              onChange={(v) => update({ top_k: parseInt(v) || 3 })}
              placeholder="3"
            />
          </Field>
        </>
      )}
      {(data.type_name || "buffer_memory") !== "vector_memory" &&
        (data.type_name || "buffer_memory") !== "none" && (
          <Field
            label="Window Size"
            hint="Number of recent messages to retain in context."
          >
            <Input
              type="number"
              value={data.window_size ?? 10}
              onChange={(v) => update({ window_size: parseInt(v) || 10 })}
              placeholder="10"
            />
          </Field>
        )}
    </div>

  );
}
