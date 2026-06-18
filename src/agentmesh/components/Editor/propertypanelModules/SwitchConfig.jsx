import React from "react";
import { FiPlus, FiTrash2, FiInfo } from "react-icons/fi";
import { Field, Input, Textarea, LogicHelper } from "./SharedComponents";

export default function SwitchConfig({ data, update }) {
  return (
    <>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#1E293B",
          marginBottom: 12,
        }}
      >
        Logical Branches
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(data.branches || []).map((branch, idx) => (
          <div
            key={idx}
            style={{
              padding: 12,
              background: "#F8FAFC",
              borderRadius: 10,
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B" }}>
                BRANCH {idx + 1}
              </div>
              <button
                onClick={() => {
                  const newBranches = [...(data.branches || [])];
                  newBranches.splice(idx, 1);
                  update({ branches: newBranches });
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#EF4444",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <FiTrash2 size={12} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Path Name" hint="Appears on the canvas port">
                <Input
                  value={branch.name || ""}
                  onChange={(v) => {
                    const newBranches = [...(data.branches || [])];
                    newBranches[idx] = { ...newBranches[idx], name: v };
                    update({ branches: newBranches });
                  }}
                  placeholder="e.g. gold_member"
                />
              </Field>
              <Field
                label="Condition"
                hint="Python logic. Tip: Use keys directly (e.g. status == 'ok') or text searches like 'pass' in msg."
              >
                <Textarea
                  value={branch.condition || ""}
                  onChange={(v) => {
                    const newBranches = [...(data.branches || [])];
                    newBranches[idx] = { ...newBranches[idx], condition: v };
                    update({ branches: newBranches });
                  }}
                  placeholder="total > 1000 or 'urgent' in msg"
                  rows={2}
                />
              </Field>
            </div>
          </div>
        ))}
        <LogicHelper />
        <button
          onClick={() => {
            const newBranches = [
              ...(data.branches || []),
              {
                name: `Path ${(data.branches?.length || 0) + 1}`,
                condition: "",
              },
            ];
            update({ branches: newBranches });
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "10px",
            borderRadius: 10,
            border: "1px dashed #CBD5E1",
            background: "white",
            color: "#64748B",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            marginTop: 8,
          }}
        >
          <FiPlus size={14} /> Add Branch
        </button>
      </div>
      <div
        style={{
          padding: 12,
          background: "#F1F5F9",
          borderRadius: 10,
          fontSize: 11,
          color: "#475569",
          lineHeight: 1.5,
          border: "1px solid var(--border)",
          marginTop: 16,
        }}
      >
        <FiInfo size={12} style={{ marginRight: 6 }} />
        The workflow routes to the <strong>first</strong> branch that evaluates
        to True. If none match, it follows the <strong>ELSE</strong> path.
      </div>
    </>
  );
}
