import { useState } from "react";
import { agentMeshFetch } from "../../../api/authenticatedFetch";

const BASE =
  globalThis._env_?.VITE_AGENT_MESH ||
  import.meta.env.VITE_AGENT_MESH ||
  "http://localhost:8000/api/v1/agentmesh";

/**
 * Work out where each value belongs in a spreadsheet, by matching what is
 * already printed in it against sample data.
 *
 * Marking up a template by hand means finding the right cells among thousands.
 * This finds them, and the person confirms.
 */
export default function TemplateMarkerSuggest() {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState("");
  const [sample, setSample] = useState("{\n  \n}");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const suggest = async () => {
    setError(null);
    setResult(null);

    let parsed;
    try {
      parsed = sample.trim() ? JSON.parse(sample) : {};
    } catch (e) {
      setError(`The sample data is not valid JSON: ${e.message}`);
      return;
    }
    if (!path.trim()) {
      setError("Point this at a filled-in spreadsheet first.");
      return;
    }

    setBusy(true);
    try {
      const res = await agentMeshFetch(BASE + "/node/suggest-template-markers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_path: path,
          sample_data: parsed,
          max_suggestions: 500,
        }),
      });
      const out = await res.json();
      if (!res.ok) {
        setError(out.detail || "The spreadsheet could not be read.");
      } else {
        setResult(out);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const box = {
    width: "100%",
    padding: "8px 10px",
    background: "white",
    border: "1px solid var(--border)",
    borderRadius: 6,
    fontSize: 11,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    outline: "none",
    color: "var(--text-primary)",
    boxSizing: "border-box",
  };

  return (
    <div style={{ marginTop: 14 }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
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
        Work out where values go in a spreadsheet {open ? "▾" : "▸"}
      </button>

      {open && (
        <div style={{ marginTop: 10 }}>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              marginBottom: 8,
              lineHeight: 1.55,
            }}
          >
            Point this at a spreadsheet that is <b>already filled in</b>, and
            paste data containing those same values. Wherever the two match, the
            cell&apos;s purpose is known, and the marker to write there is
            suggested. Nothing is changed — you copy the markers into the
            spreadsheet yourself and save it as your template.
          </div>

          <label style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)" }}>
            FILLED-IN SPREADSHEET
          </label>
          <input
            style={{ ...box, marginBottom: 8 }}
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="path to an .xlsx file"
          />

          <label style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)" }}>
            DATA CONTAINING THE SAME VALUES
          </label>
          <textarea
            style={{ ...box, minHeight: 70, resize: "vertical" }}
            value={sample}
            onChange={(e) => setSample(e.target.value)}
            spellCheck={false}
          />

          <button
            type="button"
            onClick={suggest}
            disabled={busy}
            style={{
              marginTop: 8,
              padding: "7px 16px",
              border: "none",
              borderRadius: 6,
              background: busy ? "var(--border)" : "#5b4b8a",
              color: "white",
              fontSize: 12,
              fontWeight: 600,
              cursor: busy ? "default" : "pointer",
            }}
          >
            {busy ? "Matching…" : "Match"}
          </button>

          {error && (
            <div style={{ fontSize: 11, color: "#a1302a", marginTop: 8 }}>
              {error}
            </div>
          )}

          {result && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, marginBottom: 6 }}>
                <b>{result.suggestions?.length || 0}</b> suggestion(s) across{" "}
                {result.sheets_scanned} sheet(s)
                {result.ambiguous_count > 0 && (
                  <span style={{ color: "#8a5a00" }}>
                    {" "}
                    · {result.ambiguous_count} need a choice
                  </span>
                )}
              </div>

              {result.ambiguous_count > 0 && (
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    marginBottom: 8,
                    lineHeight: 1.5,
                  }}
                >
                  A value that appears in more than one place cannot be matched
                  with certainty. Those are marked, with the alternatives listed,
                  so you decide rather than the tool guessing.
                </div>
              )}

              <div style={{ maxHeight: 300, overflow: "auto" }}>
                {(result.suggestions || []).map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "baseline",
                      padding: "5px 6px",
                      borderBottom: "1px solid var(--border)",
                      fontSize: 10,
                    }}
                  >
                    <span style={{ width: 108, color: "var(--text-muted)" }}>
                      {s.sheet}
                    </span>
                    <span style={{ width: 40, fontWeight: 700 }}>{s.cell}</span>
                    <span
                      style={{
                        flex: 1,
                        fontFamily: "ui-monospace, Menlo, monospace",
                        color: s.ambiguous ? "#8a5a00" : "var(--text-primary)",
                        wordBreak: "break-all",
                      }}
                    >
                      {s.placeholder}
                      {s.ambiguous && s.alternatives?.length > 0 && (
                        <span style={{ color: "var(--text-muted)" }}>
                          {" "}
                          · or {s.alternatives.slice(0, 2).join(", ")}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
