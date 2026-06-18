import React from "react";
import { FiShield } from "react-icons/fi";
import {
  Select,
  Field,
  Input,
  ApiConfigSection,
  CollapsibleApiConfig,
} from "./SharedComponents";

export default function BeneficiaryRiskConfig({ data, update }) {
  const checks = data.risk_checks || [
    "mule_detection",
    "account_age",
    "sanctions_list",
    "relationship_graph",
  ];

  const toggleCheck = (key) => {
    const next = checks.includes(key)
      ? checks.filter((k) => k !== key)
      : [...checks, key];
    update({ risk_checks: next });
  };

  const checkList = [
    {
      key: "mule_detection",
      label: "Mule Velocity Check",
      desc: "Checks inbound velocity / mule indicators",
    },
    {
      key: "account_age",
      label: "Account Age Registry",
      desc: "Checks if recipient account is new",
    },
    {
      key: "sanctions_list",
      label: "Sanctions Check",
      desc: "Screens against OFAC & local blacklists",
    },
    {
      key: "relationship_graph",
      label: "Relationship Graph",
      desc: "Checks history between sender and receiver",
    },
  ];

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
          <FiShield color="var(--theme-primary)" size={14} /> Risk Evaluator
          Checks
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {checkList.map((chk) => (
            <div
              key={chk.key}
              onClick={() => toggleCheck(chk.key)}
              style={{
                padding: "10px 12px",
                background: checks.includes(chk.key)
                  ? "rgba(142, 119, 187, 0.05)"
                  : "#F8FAFC",
                border: checks.includes(chk.key)
                  ? "1.5px solid var(--theme-primary)"
                  : "1px solid var(--border)",
                borderRadius: 10,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.15s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  marginRight: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: checks.includes(chk.key)
                      ? "var(--theme-primary)"
                      : "var(--text-primary)",
                  }}
                >
                  {chk.label}
                </span>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  {chk.desc}
                </span>
              </div>
              <div
                style={{
                  width: 32,
                  height: 18,
                  borderRadius: 9,
                  position: "relative",
                  background: checks.includes(chk.key)
                    ? "var(--theme-primary)"
                    : "#cbd5e1",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 2,
                    left: checks.includes(chk.key) ? 16 : 2,
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: "#fff",
                    transition: "left 0.2s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
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
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ color: "#EF4444" }}>🔴</span> Known Fraudster Branch
        </div>
        <p
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            marginBottom: 14,
            lineHeight: 1.4,
          }}
        >
          Triggered only if deterministic check (Sanctions hit) matches 100%.
          Executes real-time block and raises alert.
        </p>
        <Field
          label="Alert Severity Level"
          hint="Level of severity logged downstream."
        >
          <Select
            value={data.fraud_alert_level ?? "CRITICAL"}
            onChange={(v) => update({ fraud_alert_level: v })}
            options={[
              { value: "CRITICAL", label: "Critical" },
              { value: "HIGH", label: "High" },
              { value: "MEDIUM", label: "Medium" },
            ]}
          />
        </Field>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            marginBottom: 10,
            textTransform: "uppercase",
          }}
        >
          Primary Fraud Alert API
        </div>
        <ApiConfigSection
          data={data}
          update={update}
          prefix="fraud_api_"
          urlKey="fraud_api_endpoint"
        />

        <div style={{ marginTop: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-muted)",
              marginBottom: 10,
              textTransform: "uppercase",
            }}
          >
            Additional APIs
          </div>
          {data.fraud_additional_apis?.map((apiConf, idx) => {
            const localUpdate = (changes) => {
              const newArr = [...(data.fraud_additional_apis || [])];
              newArr[idx] = { ...newArr[idx], ...changes };
              update({ fraud_additional_apis: newArr });
            };
            return (
              <CollapsibleApiConfig
                key={idx}
                data={apiConf}
                update={localUpdate}
                idx={idx}
                onRemove={() => {
                  const newArr = [...data.fraud_additional_apis];
                  newArr.splice(idx, 1);
                  update({ fraud_additional_apis: newArr });
                }}
              />
            );
          })}
          <button
            type="button"
            onClick={() => {
              const newArr = [
                ...(data.fraud_additional_apis || []),
                { url: "", method: "POST" },
              ];
              update({ fraud_additional_apis: newArr });
            }}
            style={{
              width: "100%",
              padding: "8px",
              background: "#F1F5F9",
              border: "1px dashed #CBD5E1",
              borderRadius: "8px",
              color: "#475569",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Add Another API
          </button>
        </div>
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
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ color: "#F59E0B" }}>🟡</span> New Beneficiary Branch
        </div>
        <p
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          <strong>Privacy Sandbox Active:</strong> This node strips private
          sender data and passes only recipient details (Name, Account, Bank)
          down the yellow wire for KYC/registration.
        </p>
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
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ color: "#10B981" }}>🟢</span> Safe / Continue Branch
        </div>
        <p
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          Payload passes untouched. Mule check scores and geo-velocity metrics
          are injected into `risk_profile` for downstream scoring engines.
        </p>
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
          Data Configuration
        </div>
        <Field
          label="Input Context Key"
          hint="Context key that holds the transaction payload."
        >
          <Input
            value={data.context_key ?? "enriched_transaction"}
            onChange={(v) => update({ context_key: v })}
            placeholder="enriched_transaction"
          />
        </Field>
        <Field
          label="Target Entity Field"
          hint="Which field in the data represents the beneficiary?"
        >
          <Input
            value={data.beneficiary_field ?? "beneficiary_id"}
            onChange={(v) => update({ beneficiary_field: v })}
            placeholder="e.g., beneficiary_id"
          />
        </Field>
        <Field
          label="New Beneficiary Rule"
          hint="Logical condition to define what a 'new' beneficiary is."
        >
          <Input
            value={data.new_beneficiary_rule ?? "account_age_days < 1"}
            onChange={(v) => update({ new_beneficiary_rule: v })}
            placeholder="e.g., account_age_days < 1"
          />
        </Field>
      </div>
    </>
  );
}
