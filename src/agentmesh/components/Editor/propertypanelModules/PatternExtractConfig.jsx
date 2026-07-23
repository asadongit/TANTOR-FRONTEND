import React from "react";
import { FiPlus, FiX } from "react-icons/fi";
import {
  Select,
  Field,
  Input,
  CommaArrayEditor,
  VariableLinker,
  VariableDropdown,
  Toggle,
} from "./SharedComponents";


export default function PatternExtractConfig({ data, update }) {
  const renderPatternRow = (pattern, idx) => (
    <div
      key={idx}
      style={{
        padding: 10,
        background: "#F8FAFC",
        borderRadius: 8,
        border: "1px solid var(--border)",
        position: "relative",
      }}
    >
      <button
        onClick={() => {
          const next = [...(data.extract_patterns || [])];
          next.splice(idx, 1);
          update({ extract_patterns: next });
        }}
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          background: "none",
          border: "none",
          color: "#EF4444",
          cursor: "pointer",
        }}
      >
        <FiX size={12} />
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
          marginBottom: 6,
        }}
      >
        <div>
          <label
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "var(--text-muted)",
              display: "block",
              marginBottom: 2,
            }}
          >
            CONCEPT
          </label>
          <Input
            value={pattern.concept || ""}
            onChange={(v) => {
              const next = [...(data.extract_patterns || [])];
              next[idx] = {
                ...next[idx],
                concept: v,
                display_label: next[idx].display_label || v,
              };
              update({ extract_patterns: next });
            }}
            placeholder="e.g. ID_Number"
            style={{ padding: "4px 8px", fontSize: 11 }}
          />
        </div>
        <div>
          <label
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "var(--text-muted)",
              display: "block",
              marginBottom: 2,
            }}
          >
            DISPLAY LABEL
          </label>
          <Input
            value={pattern.display_label || ""}
            onChange={(v) => {
              const next = [...(data.extract_patterns || [])];
              next[idx] = { ...next[idx], display_label: v };
              update({ extract_patterns: next });
            }}
            placeholder="e.g. ID Number"
            style={{ padding: "4px 8px", fontSize: 11 }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 6 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 2,
          }}
        >
          <label
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "var(--text-muted)",
              display: "block",
            }}
          >
            SEARCH KEYWORDS (comma-separated)
          </label>
          <VariableLinker
            targetType="json_keys"
            onSelect={(variable) => {
              const next = [...(data.extract_patterns || [])];
              const current = next[idx].search_keywords || [];
              next[idx] = {
                ...next[idx],
                search_keywords: [...new Set([...current, ...variable.value])],
              };
              update({ extract_patterns: next });
            }}
            tooltip="Pick from JSON Keys"
          />
        </div>
        <CommaArrayEditor
          value={pattern.search_keywords}
          onChange={(v) => {
            const next = [...(data.extract_patterns || [])];
            next[idx] = { ...next[idx], search_keywords: v };
            update({ extract_patterns: next });
          }}
          placeholder="id, id_number, account"
          style={{ padding: "4px 8px", fontSize: 11 }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <div>
          <label
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "var(--text-muted)",
              display: "block",
              marginBottom: 2,
            }}
          >
            STRATEGY
          </label>
          <Select
            value={pattern.match_strategy || "contains"}
            onChange={(v) => {
              const next = [...(data.extract_patterns || [])];
              next[idx] = { ...next[idx], match_strategy: v };
              update({ extract_patterns: next });
            }}
            options={[
              { value: "contains", label: "Contains" },
              { value: "exact", label: "Exact Match" },
              { value: "starts_with", label: "Starts With" },
              { value: "ends_with", label: "Ends With" },
              { value: "regex", label: "Regex" },
            ]}
          />
        </div>
        {data.extract_mode !== "field_mapper" && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              paddingBottom: 4,
            }}
          >
            <Toggle
              checked={pattern.is_required || false}
              onChange={(v) => {
                const next = [...(data.extract_patterns || [])];
                next[idx] = { ...next[idx], is_required: v };
                update({ extract_patterns: next });
              }}
              label="Required"
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Field
        label="Extraction Mode"
        hint="Identifier: extract labeled values. Field Mapper: group by target class."
      >
        <Select
          value={data.extract_mode || "identifier"}
          onChange={(v) => update({ extract_mode: v })}
          options={[
            {
              value: "identifier",
              label: "Identifier (ID, Name, Account No.)",
            },
            {
              value: "field_mapper",
              label: "Field Mapper (group by agent class)",
            },
            {
              value: "text_renderer",
              label: "Text Renderer (Generate ocr_like_results)",
            },
          ]}
        />
      </Field>

      <Field
        label="Input Key"
        hint="Context variable containing the flat dictionary to scan."
      >
        <Input
          stripBraces
          value={data.extract_input_key || "transformed_json"}
          onChange={(v) => update({ extract_input_key: v })}
          placeholder="transformed_json"
        />
      </Field>

      <Field
        label="Output Key"
        hint="Context variable where extraction results are stored."
      >
        <Input
          stripBraces
          value={
            data.extract_output_key ||
            ((data.extract_mode || "identifier") === "identifier"
              ? "extracted_identifiers"
              : data.extract_mode === "text_renderer"
                ? "ocr_like_results"
                : "mapped_fields")
          }
          onChange={(v) => update({ extract_output_key: v })}
          placeholder="extracted_identifiers"
        />
      </Field>

      {data.extract_mode === "text_renderer" && (
        <Field
          label="Identifiers Input Key"
          hint="Context variable containing previously extracted identifiers (for merging)."
        >
          <Input
            stripBraces
            value={data.identifiers_input_key || "extracted_identifiers"}
            onChange={(v) => update({ identifiers_input_key: v })}
            placeholder="extracted_identifiers"
          />
        </Field>
      )}

      {data.extract_mode !== "text_renderer" && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Patterns ({(data.extract_patterns || []).length})
            </label>
            {data.extract_mode !== "field_mapper" && (
              <button
                onClick={() =>
                  update({
                    extract_patterns: [
                      ...(data.extract_patterns || []),
                      {
                        concept: "",
                        display_label: "",
                        search_keywords: [],
                        match_strategy: "contains",
                        is_required: false,
                        target_class:
                          (data.extract_mode || "identifier") === "field_mapper"
                            ? ""
                            : undefined,
                      },
                    ],
                  })
                }
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-btn)",
                  cursor: "pointer",
                  padding: "2px 4px",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 4,
                }}
              >
                <FiPlus size={16} strokeWidth={3} />
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(() => {
              if (data.extract_mode === "field_mapper") {
                const grouped = (data.extract_patterns || []).reduce(
                  (acc, p, idx) => {
                    const tc = p.target_class || "Unassigned";
                    if (!acc[tc]) acc[tc] = [];
                    acc[tc].push({ ...p, originalIndex: idx });
                    return acc;
                  },
                  {},
                );

                return (
                  <>
                    {Object.entries(grouped).map(([tc, groupPatterns]) => (
                      <div
                        key={tc}
                        style={{
                          padding: 12,
                          background: "white",
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          boxShadow: "var(--shadow-sm)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderBottom: "1px solid var(--border)",
                            paddingBottom: 8,
                            marginBottom: 4,
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: "var(--text-muted)",
                              }}
                            >
                              CLASS:
                            </span>
                            <VariableDropdown
                              value={tc === "Unassigned" ? "" : tc}
                              onChange={(newClass) => {
                                const next = [...(data.extract_patterns || [])];
                                groupPatterns.forEach((p) => {
                                  next[p.originalIndex].target_class = newClass;
                                });
                                update({ extract_patterns: next });
                              }}
                              placeholder="Select Target Class"
                              style={{
                                padding: "4px 8px",
                                fontSize: 12,
                                fontWeight: 600,
                                border: "none",
                                background: "transparent",
                                color: "var(--theme-primary)",
                                minWidth: 200,
                                outline: "none",
                              }}
                            />
                          </div>
                          <button
                            onClick={() => {
                              const next = [...(data.extract_patterns || [])];
                              next.push({
                                concept: "",
                                display_label: "",
                                search_keywords: [],
                                match_strategy: "contains",
                                is_required: false,
                                target_class: tc !== "Unassigned" ? tc : "",
                              });
                              update({ extract_patterns: next });
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--accent-btn)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            <FiPlus size={12} /> ADD FIELD
                          </button>
                        </div>
                        {groupPatterns.map((p) =>
                          renderPatternRow(p, p.originalIndex),
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const next = [...(data.extract_patterns || [])];
                        next.push({
                          concept: "",
                          display_label: "",
                          search_keywords: [],
                          match_strategy: "contains",
                          is_required: false,
                          target_class: "",
                        });
                        update({ extract_patterns: next });
                      }}
                      style={{
                        padding: "8px",
                        background: "var(--bg-hover)",
                        border: "1px dashed var(--border)",
                        borderRadius: 8,
                        color: "var(--text-primary)",
                        fontWeight: 600,
                        fontSize: 11,
                        cursor: "pointer",
                        marginTop: 4,
                        width: "100%",
                      }}
                    >
                      + ADD TARGET CLASS GROUP
                    </button>
                  </>
                );
              }

              return (data.extract_patterns || []).map((pattern, idx) =>
                renderPatternRow(pattern, idx),
              );
            })()}
            {(data.extract_patterns || []).length === 0 && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontStyle: "italic",
                  padding: "4px 0",
                }}
              >
                No patterns defined. Click the plus button above to add
                patterns.
              </div>
            )}
          </div>
        </div>
      )}    </>
  );
}
