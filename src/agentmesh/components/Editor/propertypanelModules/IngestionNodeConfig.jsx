import React from "react";
import { Select, Field, Input } from "./SharedComponents";

export default function IngestionNodeConfig({ data, update }) {
  return (
    <>
      <Field label="Vector Store" hint="Target database for indexing.">
        <Select
          value={data.vector_store || "chroma"}
          onChange={(v) => update({ vector_store: v })}
          options={[
            { value: "chroma", label: "ChromaDB (Local)" },
            { value: "qdrant", label: "Qdrant (Cloud/Local)" },
          ]}
        />
      </Field>
      <Field label="Collection Name" hint="Grouping key for your data.">
        <Input
          value={data.vector_collection || "default"}
          onChange={(v) => update({ vector_collection: v })}
          placeholder="e.g. documentation"
        />
      </Field>

      <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Chunk Size" hint="Chars per block.">
            <Input
              type="number"
              value={data.chunk_size ?? 1000}
              onChange={(v) =>
                update({ chunk_size: v === "" ? "" : Number.parseInt(v) })
              }
            />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Overlap" hint="Context padding.">
            <Input
              type="number"
              value={data.chunk_overlap ?? 100}
              onChange={(v) =>
                update({ chunk_overlap: v === "" ? "" : Number.parseInt(v) })
              }
            />
          </Field>
        </div>
      </div>

      <Field label="Chunking Strategy">
        <Select
          value={data.chunking_strategy || "recursive"}
          onChange={(v) => update({ chunking_strategy: v })}
          options={[
            { value: "recursive", label: "Recursive Character (Smart)" },
            { value: "token", label: "Token-based (Exact)" },
            { value: "json", label: "JSON Strategy (Structured)" },
            { value: "none", label: "None (No Chunking)" },
          ]}
        />
      </Field>

      <Field
        label="Source Context Key"
        hint="Leave empty to ingest the latest chat message."
      >
        <Input
          stripBraces
          value={data.ingestion_source_key || ""}
          onChange={(v) => update({ ingestion_source_key: v })}
          placeholder="e.g. latest_ocr_output"
        />
      </Field>
    </>
  );
}
