import React from "react";
import { FiBookOpen } from "react-icons/fi";
import {
  Select,
  Field,
  Input,
  Textarea,
  Toggle,
  WizardButton,
  LLMConfigSection,
} from "./SharedComponents";

export default function RagNodeConfig({
  data,
  update,
  handleFixGrammar,
  fixingGrammar,
}) {
  return (
    <>
      <Field
        label="Task"
        hint="Additional instructions appended to the internal RAG logic. Use this to refine how the agent answers (e.g. 'Answer in bullet points')."
        action={
          <WizardButton
            onClick={() => handleFixGrammar("task")}
            loading={fixingGrammar}
            disabled={!data.task}
          />
        }
      >
        <Textarea
          value={data.task}
          onChange={(v) => update({ task: v })}
          placeholder="e.g. Always respond in bullet points and be very concise."
          rows={4}
        />
      </Field>

      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-muted)",
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Query LLM
        </div>
        <LLMConfigSection llm={data.llm} onChange={(v) => update({ llm: v })} />
      </div>

      <Field label="Vector Store">
        <Select
          value={data.vector_store || "chroma"}
          onChange={(v) => update({ vector_store: v })}
          options={[
            { value: "chroma", label: "ChromaDB (Local)" },
            { value: "qdrant", label: "Qdrant (Cloud/Local)" },
          ]}
        />
      </Field>
      <Field label="Collection Name">
        <Input
          value={data.vector_collection || "default"}
          onChange={(v) => update({ vector_collection: v })}
        />
      </Field>

      <Field
        label="Search Type"
        hint="Similarity: semantic search. Hybrid: Vector + Keyword (BM25). Keyword: Exact text match."
      >
        <Select
          value={data.search_type || "similarity"}
          onChange={(v) => update({ search_type: v })}
          options={[
            { value: "similarity", label: "Similarity (Vector)" },
            { value: "hybrid", label: "Hybrid (Vector + Keyword)" },
            { value: "keyword", label: "Keyword (Lexical/BM25)" },
          ]}
        />
      </Field>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="Top K Results" hint="Number of chunks to fetch.">
            <Input
              type="number"
              value={data.k_results ?? 5}
              onChange={(v) =>
                update({ k_results: v === "" ? "" : parseInt(v) })
              }
            />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Threshold" hint="0.0 (Loose) to 1.0 (Exact).">
            <Input
              type="number"
              step="0.1"
              value={data.threshold ?? 0.5}
              onChange={(v) =>
                update({ threshold: v === "" ? "" : parseFloat(v) })
              }
            />
          </Field>
        </div>
      </div>

      <div
        style={{
          padding: 12,
          background: "#FFF7ED",
          borderRadius: 10,
          fontSize: 11,
          color: "#92400E",
          border: "1px solid #FED7AA",
          marginTop: 10,
        }}
      >
        <Field
          label="Show Citations"
          hint="If enabled, source filenames will be appended to retrieved document chunks."
        >
          <Toggle
            checked={data.show_citations || false}
            onChange={(v) => update({ show_citations: v })}
            label=""
          />
        </Field>
      </div>

      <div
        style={{
          padding: 12,
          background: "#FFF7ED",
          borderRadius: 10,
          fontSize: 11,
          color: "#92400E",
          border: "1px solid #FED7AA",
          marginTop: 10,
        }}
      >
        <FiBookOpen size={12} style={{ marginRight: 6 }} />
        The RAG node searches your vector database for relevant info and uses an
        LLM to generate an answer based only on those results.
      </div>
    </>
  );
}
