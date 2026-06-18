import React from "react";
import { FiDatabase } from "react-icons/fi";
import { Field, Input } from "./SharedComponents";

export default function NetworkGraphConfig({ data, update }) {
  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <FiDatabase color="#10B981" size={14} /> Neo4j Connection Settings
        </div>
        <Field
          label="Target Context Key"
          hint="Context key containing transaction details to ingest."
        >
          <Input
            value={data.graph_target_key ?? "latest_message"}
            onChange={(v) => update({ graph_target_key: v })}
            placeholder="latest_message"
          />
        </Field>
        <Field
          label="Neo4j Connection URI"
          hint="Override default bolt connection string. E.g. bolt://localhost:7687"
        >
          <Input
            value={data.graph_neo4j_uri ?? ""}
            onChange={(v) => update({ graph_neo4j_uri: v })}
            placeholder="bolt://localhost:7687"
          />
        </Field>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Field label="Username">
              <Input
                value={data.graph_neo4j_user ?? ""}
                onChange={(v) => update({ graph_neo4j_user: v })}
                placeholder="neo4j"
              />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Password">
              <Input
                type="password"
                value={data.graph_neo4j_password ?? ""}
                onChange={(v) => update({ graph_neo4j_password: v })}
                placeholder="••••••••"
              />
            </Field>
          </div>
        </div>
        <Field
          label="Graph Label / Collection"
          hint="Dynamic label/collection tag applied to accounts/transactions (e.g. FraudFlow, RetailFlow)."
        >
          <Input
            value={data.graph_collection ?? "FraudFlow"}
            onChange={(v) => update({ graph_collection: v })}
            placeholder="FraudFlow"
          />
        </Field>
      </div>

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 14,
          background: "#F8FAFC",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            marginBottom: 14,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Dynamic Data Binding (JSON Mapping)
        </div>
        <p
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            marginBottom: 14,
            lineHeight: 1.4,
          }}
        >
          Map fields from your input transaction JSON to the network graph keys.
          Leave empty to fallback to standard transactional fraud schema keys.
        </p>
        <Field
          label="Sender Account Key"
          hint="Path in transaction JSON for sender ID (e.g. account_id or sender.id)"
        >
          <Input
            value={data.graph_sender_key ?? ""}
            onChange={(v) => update({ graph_sender_key: v })}
            placeholder="account_id"
          />
        </Field>
        <Field
          label="Beneficiary Account Key"
          hint="Path in transaction JSON for receiver ID (e.g. beneficiary_id or receiver.id)"
        >
          <Input
            value={data.graph_receiver_key ?? ""}
            onChange={(v) => update({ graph_receiver_key: v })}
            placeholder="beneficiary_id"
          />
        </Field>
        <Field
          label="Transaction ID Key"
          hint="Path in transaction JSON for unique TX identifier (e.g. transaction_id)"
        >
          <Input
            value={data.graph_txn_id_key ?? ""}
            onChange={(v) => update({ graph_txn_id_key: v })}
            placeholder="transaction_id"
          />
        </Field>
        <Field
          label="Transaction Amount Key"
          hint="Path in transaction JSON for amount field (e.g. transaction_amount)"
        >
          <Input
            value={data.graph_amount_key ?? ""}
            onChange={(v) => update({ graph_amount_key: v })}
            placeholder="transaction_amount"
          />
        </Field>
        <Field
          label="Transaction Timestamp Key"
          hint="Path in transaction JSON for timestamp field (e.g. timestamp)"
        >
          <Input
            value={data.graph_timestamp_key ?? ""}
            onChange={(v) => update({ graph_timestamp_key: v })}
            placeholder="timestamp"
          />
        </Field>
      </div>
    </>
  );
}
