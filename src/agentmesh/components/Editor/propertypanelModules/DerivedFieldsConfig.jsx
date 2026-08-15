import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Select, Field, Input } from "./SharedComponents";

/**
 * Derived Fields — calculate values from other values.
 *
 * Deliberately a table rather than a code box: the person who understands the
 * rule is usually not a programmer, and anyone reviewing the workflow should be
 * able to read what each value means without reading code.
 */
export default function DerivedFieldsConfig({ data, update }) {
  const rows = useMemo(
    () => (Array.isArray(data.df_fields) ? data.df_fields : []),
    [data.df_fields],
  );
  const [checks, setChecks] = useState({});

  // Check the calculations as they are typed. Nothing is evaluated, so this is
  // instant and cannot have side effects - it only reports whether each one is
  // a valid calculation and whether the names it uses exist.
  useEffect(() => {
    const usable = rows.filter((r) => (r.expression || "").trim());
    if (usable.length === 0) {
      setChecks({});
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const BASE =
          globalThis._env_?.VITE_AGENT_MESH ||
          import.meta.env.VITE_AGENT_MESH ||
          "http://localhost:8000/api/v1/agentmesh";
        const res = await fetch(BASE + "/node/check-expressions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            expressions: rows.map((r) => ({
              name: r.name || "",
              expression: r.expression || "",
            })),
          }),
        });
        const out = await res.json();
        const byIndex = {};
        (out.results || []).forEach((r, i) => {
          if (!r.ok) byIndex[i] = r.error;
        });
        setChecks(byIndex);
      } catch {
        setChecks({});
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [rows]);

  const setRows = (next) => update({ df_fields: next });
  const addRow = () =>
    setRows([...rows, { name: "", expression: "", group: "", enabled: true }]);
  const editRow = (i, patch) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));
  const moveRow = (i, delta) => {
    const j = i + delta;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
  };

  const cellStyle = {
    width: "100%",
    padding: "6px 8px",
    background: "white",
    border: "1px solid var(--border)",
    borderRadius: 6,
    fontSize: 12,
    outline: "none",
    color: "var(--text-primary)",
    boxSizing: "border-box",
  };

  return (
    <>
      <Field
        label="Read Values From"
        hint="Where the source values come from. Leave blank to use everything available to this node."
      >
        <Input
          stripBraces
          value={data.df_input_key || ""}
          onChange={(v) => update({ df_input_key: v })}
          placeholder="leave blank for everything"
        />
      </Field>

      <Field
        label="Save Results To"
        hint="Where the calculated values are stored so later steps can use them."
      >
        <Input
          stripBraces
          value={data.df_output_key || ""}
          onChange={(v) => update({ df_output_key: v })}
          placeholder="derived_fields"
        />
      </Field>

      {/* ── the table ─────────────────────────────────────────────────── */}
      <div style={{ marginTop: 18 }}>
        <label
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            display: "block",
            marginBottom: 6,
          }}
        >
          Values to Calculate
        </label>

        <div
          style={{
            fontSize: 10,
            color: "var(--text-muted)",
            marginBottom: 10,
            lineHeight: 1.5,
          }}
        >
          Each row calculates one value. Write the calculation using the names of
          values already in your data — for example{" "}
          <code>revenue - cost</code> or <code>total / count * 100</code>.
          <br />
          Rows are calculated <b>top to bottom</b>, and each result can be used
          by the rows below it. So you can calculate <code>profit</code> in one
          row and then use <code>profit</code> in the next.
        </div>

        {rows.length === 0 && (
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              padding: "12px 0",
              fontStyle: "italic",
            }}
          >
            No values yet. Add one below.
          </div>
        )}

        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 10,
              marginBottom: 8,
              background: row.enabled === false ? "transparent" : "var(--code)",
              opacity: row.enabled === false ? 0.55 : 1,
            }}
          >
            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: 3,
                  }}
                >
                  NAME OF THE VALUE
                </label>
                <input
                  style={cellStyle}
                  value={row.name || ""}
                  onChange={(e) => editRow(i, { name: e.target.value })}
                  placeholder="e.g. ProfitMargin"
                />
              </div>
              <div style={{ width: 110 }}>
                <label
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: 3,
                  }}
                >
                  GROUP
                </label>
                <input
                  style={cellStyle}
                  value={row.group || ""}
                  onChange={(e) => editRow(i, { group: e.target.value })}
                  placeholder="optional"
                />
              </div>
            </div>

            <label
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "var(--text-muted)",
                display: "block",
                marginBottom: 3,
              }}
            >
              CALCULATION
            </label>
            <input
              style={{
                ...cellStyle,
                fontFamily: "ui-monospace, Menlo, monospace",
                borderColor: checks[i] ? "#a1302a" : "var(--border)",
              }}
              value={row.expression || ""}
              onChange={(e) => editRow(i, { expression: e.target.value })}
              placeholder="e.g. profit / revenue * 100"
            />
            {checks[i] && (
              <div style={{ fontSize: 10, color: "#a1302a", marginTop: 3 }}>
                {checks[i]}
              </div>
            )}

            <input
              style={{ ...cellStyle, marginTop: 6 }}
              value={row.description || ""}
              onChange={(e) => editRow(i, { description: e.target.value })}
              placeholder="What this value means (optional, but helps whoever reads this later)"
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 8,
              }}
            >
              <label style={{ fontSize: 10, color: "var(--text-muted)" }}>
                <input
                  type="checkbox"
                  checked={row.enabled !== false}
                  onChange={(e) => editRow(i, { enabled: e.target.checked })}
                  style={{ marginRight: 4 }}
                />
                In use
              </label>
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => moveRow(i, -1)}
                  disabled={i === 0}
                  style={{ fontSize: 11, cursor: "pointer" }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveRow(i, 1)}
                  disabled={i === rows.length - 1}
                  style={{ fontSize: 11, cursor: "pointer" }}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  style={{ fontSize: 11, cursor: "pointer", color: "#a1302a" }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addRow}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px dashed var(--border)",
            borderRadius: 8,
            background: "transparent",
            color: "var(--text-muted)",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          + Add a value
        </button>
      </div>

      <Field
        label="If a Calculation Fails"
        hint="Each row is calculated on its own, so one failure never affects the others."
      >
        <Select
          value={data.df_on_error || "null"}
          onChange={(v) => update({ df_on_error: v })}
          options={[
            { value: "null", label: "Leave it empty and carry on" },
            { value: "skip", label: "Leave the value out entirely" },
            { value: "fail", label: "Stop the node" },
          ]}
        />
      </Field>

      <div
        style={{
          fontSize: 10,
          color: "var(--text-muted)",
          marginTop: 14,
          paddingTop: 10,
          borderTop: "1px solid var(--border)",
          lineHeight: 1.55,
        }}
      >
        <b>Available in calculations:</b> <code>+ - * /</code>, brackets, and{" "}
        <code>round</code>, <code>abs</code>, <code>min</code>, <code>max</code>,{" "}
        <code>sum</code>, <code>avg</code>, <code>len</code>,{" "}
        <code>floor</code>, <code>ceil</code>, <code>sqrt</code>.
        <br />
        <code>safe_div(a, b)</code> divides but gives an empty result instead of
        an error when <code>b</code> is zero.
        <br />
        <br />
        Values inside groups are reachable by joining the names with an
        underscore — a <code>totals</code> group containing <code>revenue</code>{" "}
        is written <code>totals_revenue</code>.
      </div>
    </>
  );
}

DerivedFieldsConfig.propTypes = {
  data: PropTypes.shape({
    df_fields: PropTypes.array,
    df_input_key: PropTypes.string,
    df_output_key: PropTypes.string,
    df_on_error: PropTypes.string,
  }),
  update: PropTypes.func.isRequired,
};

DerivedFieldsConfig.defaultProps = { data: {} };
