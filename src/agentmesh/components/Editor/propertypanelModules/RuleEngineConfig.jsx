import React from "react";
import { FiPlus } from "react-icons/fi";
import { RuleAccordionItem } from "./SharedComponents";

export default function RuleEngineConfig({ data, update }) {
  const rules = data.python_rules || [];

  const addRule = () => {
    const newRule = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Rule ${rules.length + 1}`,
      code: "",
      enabled: true,
    };
    update({ python_rules: [...rules, newRule] });
  };

  const updateRule = (index, key, val) => {
    const next = [...rules];
    next[index] = { ...next[index], [key]: val };
    update({ python_rules: next });
  };

  const removeRule = (index) => {
    const next = [...rules];
    next.splice(index, 1);
    update({ python_rules: next });
  };

  const moveRule = (index, dir) => {
    if (index + dir < 0 || index + dir >= rules.length) return;
    const next = [...rules];
    const temp = next[index];
    next[index] = next[index + dir];
    next[index + dir] = temp;
    update({ python_rules: next });
  };

  return (
    <div style={{ marginBottom: 20 }}>
      {rules.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "20px",
            border: "1px dashed var(--border)",
            borderRadius: 8,
            color: "var(--text-tertiary)",
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          No rules defined. Click "Add Rule" to create one.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {rules.map((rule, idx) => (
          <RuleAccordionItem
            key={rule.id}
            rule={rule}
            idx={idx}
            totalRules={rules.length}
            updateRule={updateRule}
            removeRule={removeRule}
            moveRule={moveRule}
          />
        ))}
      </div>

      <button
        onClick={addRule}
        style={{
          width: "100%",
          padding: "10px",
          background: "var(--bg-canvas, #F8FAFC)",
          border: "1px dashed var(--border)",
          borderRadius: "8px",
          fontSize: "11px",
          color: "var(--accent-btn)",
          cursor: "pointer",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          marginTop: "8px",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--bg-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--bg-canvas, #F8FAFC)";
        }}
      >
        <FiPlus size={12} /> Add Rule
      </button>

    </div>
  );
}
