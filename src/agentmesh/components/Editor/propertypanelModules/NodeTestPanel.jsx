import { useState } from "react";
import PropTypes from "prop-types";
import { agentMeshFetch } from "../../../api/authenticatedFetch";

const BASE =
  globalThis._env_?.VITE_AGENT_MESH ||
  import.meta.env.VITE_AGENT_MESH ||
  "http://localhost:8000/api/v1/agentmesh";

/**
 * Try a single node with sample data, without running the whole workflow.
 *
 * Collapsed by default so it never gets in the way of the settings above it.
 */
export default function NodeTestPanel({ data, nodeId }) {
  const [open, setOpen] = useState(false);
  const [sample, setSample] = useState("{\n  \n}");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [parseError, setParseError] = useState(null);

  const runTest = async () => {
    setParseError(null);
    setResult(null);

    let parsed;
    try {
      parsed = sample.trim() ? JSON.parse(sample) : {};
    } catch (e) {
      setParseError(`The sample data is not valid JSON: ${e.message}`);
      return;
    }

    setBusy(true);
    try {
      const res = await agentMeshFetch(`${BASE}/node/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          node_config: { ...data, id: nodeId || "test_node" },
          sample_input: parsed,
          timeout_seconds: 60,
        }),
      });
      setResult(await res.json());
    } catch (e) {
      setResult({ ok: false, error: e.message, hint: "Could not reach the server." });
    } finally {
      setBusy(false);
    }
  };

  const box = {
    width: "100%",
    minHeight: 76,
    padding: "8px 10px",
    background: "white",
    border: "1px solid var(--border)",
    borderRadius: 6,
    fontSize: 11,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    outline: "none",
    color: "var(--text-primary)",
    boxSizing: "border-box",
    resize: "vertical",
  };

  return (
    <div
      style={{
        marginTop: 18,
        paddingTop: 14,
        borderTop: "1px solid var(--border)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "8px 10px",
          border: "1px solid var(--border)",
          borderRadius: 8,
          background: "transparent",
          color: "var(--text-primary)",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>Try this step</span>
        <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
          {open ? "hide" : "show"}
        </span>
      </button>

      {open && (
        <div style={{ marginTop: 10 }}>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              marginBottom: 6,
              lineHeight: 1.5,
            }}
          >
            Runs <b>only this step</b> with the sample values below, so you can
            check the settings without running the whole workflow. Put in the
            kind of values earlier steps would produce.
          </div>

          <textarea
            style={box}
            value={sample}
            onChange={(e) => setSample(e.target.value)}
            spellCheck={false}
            placeholder='{ "amount": 1000 }'
          />

          {parseError && (
            <div style={{ fontSize: 11, color: "#a1302a", marginTop: 6 }}>
              {parseError}
            </div>
          )}

          <button
            type="button"
            onClick={runTest}
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
            {busy ? "Running…" : "Run"}
          </button>

          {result && (
            <div style={{ marginTop: 12 }}>
              {result.ok ? (
                <>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#1a7f52",
                      marginBottom: 6,
                    }}
                  >
                    Worked
                    {typeof result.duration_ms === "number"
                      ? ` — took ${result.duration_ms} ms`
                      : ""}
                  </div>

                  {Object.keys(result.produced || {}).length === 0 ? (
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      This step ran but produced no new values. That may be
                      correct, or a sign that a setting points at something the
                      sample does not contain.
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text-muted)",
                          marginBottom: 4,
                        }}
                      >
                        What this step produced:
                      </div>
                      <pre
                        style={{
                          ...box,
                          minHeight: 0,
                          maxHeight: 260,
                          overflow: "auto",
                          margin: 0,
                        }}
                      >
                        {JSON.stringify(result.produced, null, 2)}
                      </pre>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#a1302a",
                      marginBottom: 6,
                    }}
                  >
                    Did not work
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-primary)",
                      marginBottom: 6,
                      wordBreak: "break-word",
                    }}
                  >
                    {result.error}
                  </div>
                  {result.hint && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        padding: "8px 10px",
                        background: "var(--code)",
                        borderRadius: 6,
                        lineHeight: 1.5,
                      }}
                    >
                      {result.hint}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

NodeTestPanel.propTypes = {
  data: PropTypes.object,
  nodeId: PropTypes.string,
};

NodeTestPanel.defaultProps = { data: {}, nodeId: "test_node" };
