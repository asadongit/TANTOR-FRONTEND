import React from "react";
import { FiGlobe, FiLayers, FiPlus } from "react-icons/fi";
import { Field, Input, CustomCollapsibleApiConfig } from "./SharedComponents";

export default function BankingEnrichmentConfig({ data, update }) {
  const customExtList = data.custom_external_apis || [];
  const customIntList = data.custom_internal_apis || [];

  const extOptions = [
    { value: "custom", label: "Custom HTTP API" },
    { value: "cibil_experian", label: "CIBIL / Experian Bureau" },
    { value: "npci_registry", label: "NPCI Fraud Registry" },
    { value: "sanctions_lists", label: "OFAC / RBI Sanctions" },
    { value: "ip_geolocation", label: "MaxMind IP Geolocation" },
    { value: "threat_metrix", label: "ThreatMetrix Device ID" },
    { value: "telecom_data", label: "Telecom Carrier API" },
  ];

  const intOptions = [
    { value: "custom", label: "Custom HTTP API" },
    { value: "core_banking", label: "Core Banking (CBS)" },
    { value: "card_management", label: "Card Management (CMS)" },
    { value: "mobile_app_logs", label: "Mobile App Session logs" },
    { value: "kyc_repository", label: "KYC Registry" },
    { value: "crm_system", label: "CRM System" },
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
          <FiGlobe color="var(--theme-primary)" size={14} /> 1. External
          Third-Party Sources
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {customExtList.map((apiDef, idx) => (
            <CustomCollapsibleApiConfig
              key={apiDef.id || `ext-fallback-${idx}`}
              apiDef={apiDef}
              index={idx}
              list={customExtList}
              keyName="custom_external_apis"
              update={update}
              providerOptions={extOptions}
            />
          ))}

          <div
            onClick={() => {
              const next = [
                ...customExtList,
                {
                  id: `ext-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  provider: "custom",
                  method: "GET",
                },
              ];
              update({ custom_external_apis: next });
            }}
            style={{
              marginTop: 10,
              padding: "10px 12px",
              background: "rgba(124, 58, 237, 0.05)",
              border: "1px dashed var(--theme-primary)",
              borderRadius: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              color: "var(--theme-primary)",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <FiPlus size={14} /> Add Source
          </div>
        </div>
      </div>

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
          <FiLayers color="var(--theme-primary)" size={14} /> 2. Internal Bank
          Systems
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {customIntList.map((apiDef, idx) => (
            <CustomCollapsibleApiConfig
              key={apiDef.id || `int-fallback-${idx}`}
              apiDef={apiDef}
              index={idx}
              list={customIntList}
              keyName="custom_internal_apis"
              update={update}
              providerOptions={intOptions}
            />
          ))}

          <div
            onClick={() => {
              const next = [
                ...customIntList,
                {
                  id: `int-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  provider: "custom",
                  method: "GET",
                },
              ];
              update({ custom_internal_apis: next });
            }}
            style={{
              marginTop: 10,
              padding: "10px 12px",
              background: "rgba(124, 58, 237, 0.05)",
              border: "1px dashed var(--theme-primary)",
              borderRadius: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              color: "var(--theme-primary)",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <FiPlus size={14} /> Add Source
          </div>
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
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            marginBottom: 14,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Data Keys
        </div>
        <Field
          label="Source Context Key"
          hint="Key where canonical transaction data resides."
        >
          <Input
            stripBraces
            value={data.source_key ?? "canonical_transaction"}
            onChange={(v) => update({ source_key: v })}
            placeholder="canonical_transaction"
          />
        </Field>
        <Field
          label="Destination Context Key"
          hint="Key to store the resulting enriched payload."
        >
          <Input
            stripBraces
            value={data.destination_key ?? "enriched_transaction"}
            onChange={(v) => update({ destination_key: v })}
            placeholder="enriched_transaction"
          />
        </Field>
      </div>
    </>
  );
}
