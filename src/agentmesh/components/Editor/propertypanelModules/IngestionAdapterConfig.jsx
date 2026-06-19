import React from "react";
import PropTypes from "prop-types";
import { FiInbox } from "react-icons/fi";
import { Select, Field, Input } from "./SharedComponents";

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
            Banking schema normalization
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
        label="Destination Key"
        hint="The context field where the validated canonical payload will be saved."
      >
        <Input
          value={data.destination_key || "canonical_transaction"}
          onChange={(v) => update({ destination_key: v })}
          placeholder="e.g. canonical_transaction"
        />
      </Field>

      <div
        style={{
          padding: "12px 16px",
          background: "rgba(59, 130, 246, 0.05)",
          borderRadius: 12,
          fontSize: 11,
          color: "#0369A1",
          border: "1px dashed rgba(59, 130, 246, 0.2)",
          lineHeight: 1.6,
          marginTop: 4,
        }}
      >
        <strong>Auto-Normalization:</strong> Transaction streams, custom
        columns, and up to 200 dynamic fields are preserved automatically via
        the Pydantic pass-through schema config.
      </div>
    </div>
  );
}

IngestionAdapterConfig.propTypes = {
  data: PropTypes.shape({
    source_format: PropTypes.string,
    target_serialization: PropTypes.string,
    destination_key: PropTypes.string,
  }),
  update: PropTypes.func.isRequired,
};

IngestionAdapterConfig.defaultProps = {
  data: {},
};
