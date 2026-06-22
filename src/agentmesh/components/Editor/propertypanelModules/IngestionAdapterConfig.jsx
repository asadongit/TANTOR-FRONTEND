import React from "react";
import PropTypes from "prop-types";
import { FiInbox } from "react-icons/fi";
import { Select, Field, Input, KeyValueEditor } from "./SharedComponents";

export default function IngestionAdapterConfig({ data, update }) {
  return (
    <div
      style={{
        padding: 16,
        background: "var(--bg-card-purple, #F5F3FF)",
        borderRadius: 12,
        border: "1px solid var(--border-card-purple, #DDD6FE)",
        marginBottom: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "linear-gradient(135deg, #F3E8FF 0%, #E0E7FF 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#7C3AED",
            boxShadow: "0 2px 10px rgba(124, 58, 237, 0.1)",
          }}
        >
          <FiInbox size={16} />
        </div>
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#1E293B",
              letterSpacing: "-0.3px",
            }}
          >
            Ingestion Configuration
          </div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
            Generic multi-format payload normalization
          </div>
        </div>
      </div>

      <Field
        label="Source Format"
        hint="Define how the incoming stream format will be identified."
      >
        <Select
          value={data.source_format || "Auto-Detect"}
          onChange={(v) => update({ source_format: v })}
          options={[
            { value: "Auto-Detect", label: "Auto-Detect Format (Dynamic)" },
            { value: "JSON", label: "JSON" },
            { value: "XML", label: "XML / SOAP" },
            { value: "CSV", label: "CSV / Delimited" },
            { value: "ISO_8583", label: "ISO 8583 (Card Switch)" },
          ]}
        />
      </Field>

      <Field
        label="Target Serialization"
        hint="Downstream message serialization target format."
      >
        <Select
          value={data.target_serialization || "Canonical JSON"}
          onChange={(v) => update({ target_serialization: v })}
          options={[
            { value: "Canonical JSON", label: "Canonical JSON" },
            { value: "CSV String", label: "CSV String (MDM Flatfile)" },
            { value: "Raw Dictionary", label: "Raw Dict Map" },
          ]}
        />
      </Field>

      <Field
        label="Flatten Depth"
        hint="How deeply to flatten nested objects in the parsed data."
      >
        <Select
          value={data.flatten_depth || "one_level"}
          onChange={(v) => update({ flatten_depth: v })}
          options={[
            { value: "none", label: "None — Keep original structure" },
            { value: "one_level", label: "One Level — Flatten top-level objects" },
            { value: "recursive", label: "Full Recursive — Flatten everything" },
          ]}
        />
      </Field>

      <Field
        label="Flatten Separator"
        hint="Character used to join flattened key paths (e.g. '.' gives 'address.city')."
      >
        <Input
          value={data.flatten_separator || "."}
          onChange={(v) => update({ flatten_separator: v })}
          placeholder="."
        />
      </Field>

      <Field
        label="Destination Key"
        hint="The context field where the normalized payload will be saved."
      >
        <Input
          value={data.destination_key || "normalized_payload"}
          onChange={(v) => update({ destination_key: v })}
          placeholder="e.g. normalized_payload"
        />
      </Field>

      {/* ── Field Aliases Section ── */}
      <div
        style={{
          marginTop: 16,
          borderTop: "1px solid var(--border, #E2E8F0)",
          paddingTop: 16,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: "var(--text-muted)",
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Field Aliases (Rename Keys)
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#64748B",
            marginBottom: 12,
            lineHeight: 1.5,
          }}
        >
          Rename fields after parsing. Key = original field name, Value = new field name.
          Only applied if the original field exists and the new name doesn't.
        </div>
        <KeyValueEditor
          value={data.field_aliases || {}}
          onChange={(v) => update({ field_aliases: v })}
          keyPlaceholder="Original field name"
          valuePlaceholder="New field name"
        />
      </div>

      {/* ── Default Values Section ── */}
      <div
        style={{
          marginTop: 16,
          borderTop: "1px solid var(--border, #E2E8F0)",
          paddingTop: 16,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: "var(--text-muted)",
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Default Values (Inject Missing Fields)
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#64748B",
            marginBottom: 12,
            lineHeight: 1.5,
          }}
        >
          Inject default values for fields that are missing from the parsed data.
          Supports auto-type: "0" → number, "true" → boolean, "null" → null.
        </div>
        <KeyValueEditor
          value={data.default_values || {}}
          onChange={(v) => update({ default_values: v })}
          keyPlaceholder="Field name"
          valuePlaceholder="Default value"
        />
      </div>

      <div
        style={{
          padding: "12px 16px",
          background: "rgba(59, 130, 246, 0.05)",
          borderRadius: 12,
          fontSize: 11,
          color: "#0369A1",
          border: "1px dashed rgba(59, 130, 246, 0.2)",
          lineHeight: 1.6,
          marginTop: 16,
        }}
      >
        <strong>Domain-Agnostic:</strong> This node handles format detection and
        parsing only. Configure field aliases and defaults above for your
        specific workflow (fraud, LOS, compliance, etc.).
      </div>
    </div>
  );
}

IngestionAdapterConfig.propTypes = {
  data: PropTypes.shape({
    source_format: PropTypes.string,
    target_serialization: PropTypes.string,
    flatten_depth: PropTypes.string,
    flatten_separator: PropTypes.string,
    destination_key: PropTypes.string,
    field_aliases: PropTypes.object,
    default_values: PropTypes.object,
  }),
  update: PropTypes.func.isRequired,
};

IngestionAdapterConfig.defaultProps = {
  data: {},
};
