import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Select, Field, Input } from "./SharedComponents";
import { agentMeshFetch } from "../../../api/authenticatedFetch";

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
        const res = await agentMeshFetch(BASE + "/node/check-expressions", {
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

  // ── Import / Export ──────────────────────────────────────────────────────
  // A long set of calculations is usually prepared once and reviewed once —
  // derived from a specification, or carried between environments. Retyping a
  // hundred rows is slow and is exactly where a wrong name creeps in unnoticed.
  const [ioOpen, setIoOpen] = useState(false);
  const [ioText, setIoText] = useState("");
  const [ioError, setIoError] = useState("");

  const handleExport = () => {
    setIoError("");
    setIoText(JSON.stringify(rows, null, 2));
  };

  // Only hand over rows once every one of them is valid. A partial import
  // leaves a table that looks configured and quietly is not.
  const parseIncoming = () => {
    let parsed;
    try {
      parsed = JSON.parse(ioText);
    } catch (e) {
      setIoError(`Not valid JSON: ${e.message}`);
      return null;
    }
    if (!Array.isArray(parsed)) {
      setIoError("Expected a list of rows — text starting with [ and ending with ].");
      return null;
    }
    const seen = new Set();
    for (let i = 0; i < parsed.length; i++) {
      const r = parsed[i];
      if (!r || typeof r !== "object" || Array.isArray(r)) {
        setIoError(`Row ${i + 1} is not a row — each one must be an object.`);
        return null;
      }
      if (!String(r.name || "").trim()) {
        setIoError(`Row ${i + 1} has no name.`);
        return null;
      }
      if (!String(r.expression || "").trim()) {
        setIoError(`Row ${i + 1} ("${r.name}") has no calculation.`);
        return null;
      }
      if (seen.has(r.name)) {
        setIoError(`Row ${i + 1}: "${r.name}" appears twice. The later one would silently replace the earlier.`);
        return null;
      }
      seen.add(r.name);
    }
    setIoError("");
    return parsed;
  };

  const handleImport = (mode) => {
    const parsed = parseIncoming();
    if (!parsed) return;
    update({ df_fields: mode === "replace" ? parsed : [...rows, ...parsed] });
    setIoText("");
  };

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

        {/* Import / Export — for tables prepared once and reused */}
        <div style={{ marginTop: 14 }}>
          <button
            type="button"
            onClick={() => setIoOpen(!ioOpen)}
            style={{
              width: "100%",
              padding: "8px 10px",
              border: "1px dashed var(--border)",
              borderRadius: 8,
              background: "transparent",
              color: "var(--text-primary)",
              fontSize: 12,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Import / Export values{" "}
            {rows.length > 0 && (
              <span style={{ color: "var(--text-muted)" }}>({rows.length} configured)</span>
            )}{" "}
            {ioOpen ? "▾" : "▸"}
          </button>

          {ioOpen && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8, lineHeight: 1.55 }}>
                Move a prepared set of values in or out as text. Useful when the same
                calculations are reused elsewhere, or when they were worked out and
                checked somewhere else and should arrive here exactly as checked.
              </div>

              <textarea
                value={ioText}
                onChange={(e) => { setIoText(e.target.value); setIoError(""); }}
                placeholder={'[ { "name": "profit", "expression": "revenue - cost" } ]'}
                rows={5}
                spellCheck={false}
                style={{
                  ...cellStyle,
                  fontFamily: "ui-monospace, Menlo, monospace",
                  resize: "vertical",
                }}
              />

              {ioError && (
                <div style={{ fontSize: 10, color: "#a1302a", marginTop: 6 }}>{ioError}</div>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={handleExport}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    background: "white",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Copy current values out
                </button>
                <button
                  type="button"
                  onClick={() => handleImport("append")}
                  disabled={!ioText.trim()}
                  style={{
                    padding: "6px 12px",
                    border: "none",
                    borderRadius: 6,
                    background: ioText.trim() ? "#5b4b8a" : "var(--border)",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: ioText.trim() ? "pointer" : "default",
                  }}
                >
                  Add to existing
                </button>
                <button
                  type="button"
                  onClick={() => handleImport("replace")}
                  disabled={!ioText.trim()}
                  style={{
                    padding: "6px 12px",
                    border: "none",
                    borderRadius: 6,
                    background: ioText.trim() ? "#5b4b8a" : "var(--border)",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: ioText.trim() ? "pointer" : "default",
                  }}
                >
                  Replace all
                </button>
              </div>

              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>
                Nothing is applied until every row is valid — each needs a name and a
                calculation, and two rows may not share a name. If one is wrong, the
                reason is shown and your existing values are left untouched.
              </div>
            </div>
          )}
        </div>
      </div>

      <Field
        label="Carry Doubt Forward From"
        hint="Optional. Where to find a note of which incoming values are trustworthy — for example the '_confidence' value an OCR node writes beside its text. Any row that reads a doubtful value is marked doubtful too, so a ratio built on a figure nobody could read cannot present itself as fact. A value the note says nothing about counts as sound. Leave blank and nothing is marked."
      >
        <Input
          value={data.df_confidence_key || ""}
          onChange={(v) => update({ df_confidence_key: v })}
          placeholder="e.g. vision_result_confidence"
        />
      </Field>

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
    df_confidence_key: PropTypes.string,
  }),
  update: PropTypes.func.isRequired,
};

DerivedFieldsConfig.defaultProps = { data: {} };
