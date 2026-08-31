import { useState, useRef } from "react";
import PropTypes from "prop-types";
import {
  FiUploadCloud, FiGitMerge, FiScissors, FiLoader, FiCheck,
  FiAlertCircle, FiChevronDown, FiX, FiInfo,
} from "react-icons/fi";
import { useVariablesStore } from "../../store";

/**
 * Working out which fields a workflow has to produce.
 *
 * This is set-up work, done once by a person against a sample of the real
 * thing - not something a workflow repeats on every run. It lives here rather
 * than in a node for that reason.
 *
 * The three tools are INDEPENDENT. Each takes a list you name and writes a list
 * you name, so none assumes another has been used, and anyone who would rather
 * type their fields by hand still can. They happen to follow on from one
 * another; they are not a wizard and nothing is compulsory.
 *
 * Nothing here knows what any particular document contains. Where patterns are
 * needed, they are suggested from YOUR sample and confirmed by you - so the
 * same screen serves a financial statement, a policy schedule or a manifest.
 */

const C = {
  border: "1px solid var(--border, #e2e8f0)",
  text: "var(--text-primary, #1e293b)",
  muted: "var(--text-secondary, #64748b)",
  accent: "var(--theme-primary, #6366f1)",
  panel: "var(--bg-secondary, #fff)",
  canvas: "var(--bg-canvas, #f8fafc)",
};

const S = {
  section: { border: C.border, borderRadius: 12, marginBottom: 14, overflow: "hidden" },
  head: {
    padding: "12px 16px", background: C.canvas, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    userSelect: "none",
  },
  title: { fontSize: 13, fontWeight: 700, color: C.text, display: "flex", alignItems: "center", gap: 9 },
  body: { padding: 16, background: C.panel },
  label: { fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6, display: "block" },
  hint: { fontSize: 11, color: C.muted, lineHeight: 1.5, marginTop: 5 },
  input: {
    width: "100%", padding: "8px 11px", border: C.border, borderRadius: 9,
    fontSize: 12.5, color: C.text, background: C.panel, outline: "none", boxSizing: "border-box",
  },
  btn: {
    padding: "8px 15px", borderRadius: 10, border: "none", cursor: "pointer",
    fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 7,
    background: "#D8D2E7", color: "#3B1F70",
  },
  ghost: {
    padding: "7px 13px", borderRadius: 9, border: C.border, cursor: "pointer",
    fontSize: 11.5, fontWeight: 600, background: C.panel, color: C.muted,
  },
  row: { display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" },
  field: { flex: "1 1 190px", minWidth: 160 },
  result: {
    marginTop: 13, padding: 12, borderRadius: 10, background: C.canvas,
    border: C.border, fontSize: 12, color: C.text, lineHeight: 1.6,
  },
  chips: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9, maxHeight: 190, overflowY: "auto" },
  chip: {
    padding: "3px 9px", borderRadius: 7, background: "rgba(99,102,241,0.08)",
    border: "1px solid rgba(99,102,241,0.18)", fontSize: 11,
    fontFamily: "ui-monospace, Menlo, monospace", color: C.text,
  },
};

function Section({ icon: Icon, title, subtitle, open, onToggle, children }) {
  return (
    <div style={S.section}>
      <div style={S.head} onClick={onToggle}>
        <div>
          <div style={S.title}><Icon size={15} color={C.accent} />{title}</div>
          <div style={{ ...S.hint, marginTop: 3, marginLeft: 24 }}>{subtitle}</div>
        </div>
        <FiChevronDown
          size={15} color={C.muted}
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}
        />
      </div>
      {open && <div style={S.body}>{children}</div>}
    </div>
  );
}
Section.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  open: PropTypes.bool,
  onToggle: PropTypes.func,
  children: PropTypes.node,
};

function Note({ tone = "info", children }) {
  const colours = {
    info: ["rgba(99,102,241,0.07)", C.accent],
    good: ["rgba(34,197,94,0.09)", "var(--green, #22c55e)"],
    bad: ["rgba(239,68,68,0.09)", "var(--red, #ef4444)"],
  }[tone];
  const Icon = tone === "bad" ? FiAlertCircle : tone === "good" ? FiCheck : FiInfo;
  return (
    <div style={{
      display: "flex", gap: 8, alignItems: "flex-start", padding: "9px 12px",
      borderRadius: 9, background: colours[0], color: C.text, fontSize: 11.5,
      lineHeight: 1.55, marginTop: 11,
    }}>
      <Icon size={13} color={colours[1]} style={{ flexShrink: 0, marginTop: 2 }} />
      <div>{children}</div>
    </div>
  );
}
Note.propTypes = { tone: PropTypes.string, children: PropTypes.node };

export default function FieldListBuilder({ workflowId, variables, onClose }) {
  const { uploadJsonFile, uploadSheetFile, compareSources, classifyKeys } = useVariablesStore();

  const [open, setOpen] = useState("sample");
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);

  // ── from a sample file ──
  const jsonRef = useRef(null);
  const sheetRef = useRef(null);
  const [jsonName, setJsonName] = useState("sample_json_keys");
  const [collapse, setCollapse] = useState(true);
  const [sheetName, setSheetName] = useState("sample_sheet_rows");
  const [whichSheet, setWhichSheet] = useState("");
  const [sampleResult, setSampleResult] = useState(null);

  // ── comparing ──
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [unionName, setUnionName] = useState("");
  const [compareResult, setCompareResult] = useState(null);

  // ── splitting ──
  const [source, setSource] = useState("");
  const [patterns, setPatterns] = useState("");
  const [matchedName, setMatchedName] = useState("");
  const [restName, setRestName] = useState("");
  const [splitResult, setSplitResult] = useState(null);

  const lists = (variables || []).filter(
    (v) => Array.isArray(v.value) || v.var_type === "json_keys" || v.var_type === "list",
  );

  const guard = async (tag, fn) => {
    setBusy(tag); setErr(null);
    try { await fn(); } catch (e) { setErr(e.message || String(e)); } finally { setBusy(null); }
  };

  const onJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    guard("json", async () => {
      const res = await uploadJsonFile(workflowId, file, {
        variableKey: jsonName, collapseRepeats: collapse,
      });
      setSampleResult(res);
    }).finally(() => { if (jsonRef.current) jsonRef.current.value = ""; });
  };

  const onSheet = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    guard("sheet", async () => {
      const res = await uploadSheetFile(workflowId, file, {
        variableKey: sheetName, sheetName: whichSheet || undefined,
      });
      setSampleResult(res);
    }).finally(() => { if (sheetRef.current) sheetRef.current.value = ""; });
  };

  const patternList = patterns.split(",").map((p) => p.trim()).filter(Boolean);

  return (
    <div style={{ padding: "18px 22px", overflowY: "auto", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text }}>
            Build a field list
          </h3>
          <div style={{ ...S.hint, marginTop: 4, maxWidth: 620 }}>
            Work out which fields this workflow must produce, from a real sample.
            Every tool below stands on its own — use one, use all three, or skip
            them and type your list by hand. Nothing here is a required step.
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ ...S.ghost, padding: 7 }} title="Close">
            <FiX size={15} />
          </button>
        )}
      </div>

      {err && <Note tone="bad">{err}</Note>}

      {/* ─────────────── 1. from a sample ─────────────── */}
      <Section
        icon={FiUploadCloud}
        title="Read the names out of a sample"
        subtitle="Point at one real output file and take the field names from it, instead of typing them."
        open={open === "sample"}
        onToggle={() => setOpen(open === "sample" ? null : "sample")}
      >
        <div style={S.row}>
          <div style={S.field}>
            <label style={S.label}>Save the names as</label>
            <input style={S.input} value={jsonName} onChange={(e) => setJsonName(e.target.value)} placeholder="e.g. fsa_fields" />
          </div>
          <div style={{ flex: "1 1 240px" }}>
            <label style={{ ...S.label, marginBottom: 8 }}>Repeated groups</label>
            <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11.5, color: C.text, cursor: "pointer" }}>
              <input type="checkbox" checked={collapse} onChange={(e) => setCollapse(e.target.checked)} style={{ marginTop: 2 }} />
              <span>
                List each field once
                <span style={{ ...S.hint, display: "block" }}>
                  A sample usually repeats its whole structure — once per year,
                  per entry — so the same field appears many times. Tick this to
                  count it once.
                </span>
              </span>
            </label>
          </div>
          <input type="file" ref={jsonRef} accept=".json,.txt" onChange={onJson} style={{ display: "none" }} />
          <button style={S.btn} disabled={busy === "json"} onClick={() => jsonRef.current?.click()}>
            {busy === "json" ? <FiLoader className="spin" size={14} /> : <FiUploadCloud size={14} />}
            {busy === "json" ? "Reading…" : "Choose a JSON file"}
          </button>
        </div>

        <div style={{ height: 1, background: "var(--border, #e2e8f0)", margin: "16px 0" }} />

        <div style={S.row}>
          <div style={S.field}>
            <label style={S.label}>Save the rows as</label>
            <input style={S.input} value={sheetName} onChange={(e) => setSheetName(e.target.value)} placeholder="e.g. fsa_sheet_rows" />
          </div>
          <div style={S.field}>
            <label style={S.label}>Sheet (optional)</label>
            <input style={S.input} value={whichSheet} onChange={(e) => setWhichSheet(e.target.value)} placeholder="first sheet if left blank" />
          </div>
          <input type="file" ref={sheetRef} accept=".xlsx,.xlsm" onChange={onSheet} style={{ display: "none" }} />
          <button style={S.btn} disabled={busy === "sheet"} onClick={() => sheetRef.current?.click()}>
            {busy === "sheet" ? <FiLoader className="spin" size={14} /> : <FiUploadCloud size={14} />}
            {busy === "sheet" ? "Reading…" : "Choose a spreadsheet"}
          </button>
        </div>
        <div style={S.hint}>
          Only the names are read. No amount or value from the sample is stored.
        </div>

        {sampleResult && (
          <div style={S.result}>
            <strong>{sampleResult.message}</strong>
            {sampleResult.headings_ignored > 0 && (
              <div style={S.hint}>
                {sampleResult.headings_ignored} rows were headings with no value
                beside them, and were left out.
              </div>
            )}
            {sampleResult.available_sheets?.length > 1 && (
              <div style={S.hint}>
                Other sheets in this file: {sampleResult.available_sheets.join(", ")}
              </div>
            )}
            <div style={S.chips}>
              {(sampleResult.keys || sampleResult.labels || []).slice(0, 60).map((k) => (
                <span key={k} style={S.chip}>{k}</span>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* ─────────────── 2. comparing ─────────────── */}
      <Section
        icon={FiGitMerge}
        title="Check two lists against each other"
        subtitle="Where a deliverable has two faces, see what one has that the other does not, before it is built into anything."
        open={open === "compare"}
        onToggle={() => setOpen(open === "compare" ? null : "compare")}
      >
        <div style={S.row}>
          <div style={S.field}>
            <label style={S.label}>First list</label>
            <select style={S.input} value={left} onChange={(e) => setLeft(e.target.value)}>
              <option value="">choose…</option>
              {lists.map((v) => <option key={v.key} value={v.key}>{v.key}</option>)}
            </select>
          </div>
          <div style={S.field}>
            <label style={S.label}>Second list</label>
            <select style={S.input} value={right} onChange={(e) => setRight(e.target.value)}>
              <option value="">choose…</option>
              {lists.map((v) => <option key={v.key} value={v.key}>{v.key}</option>)}
            </select>
          </div>
          <div style={S.field}>
            <label style={S.label}>Save everything as (optional)</label>
            <input style={S.input} value={unionName} onChange={(e) => setUnionName(e.target.value)} placeholder="leave blank to just look" />
          </div>
          <button
            style={{ ...S.btn, opacity: left && right ? 1 : 0.5 }}
            disabled={!left || !right || busy === "compare"}
            onClick={() => guard("compare", async () => {
              setCompareResult(await compareSources(workflowId, {
                left, right, save_as: unionName || undefined,
              }));
            })}
          >
            {busy === "compare" ? <FiLoader className="spin" size={14} /> : <FiGitMerge size={14} />}
            Compare
          </button>
        </div>

        {compareResult && (
          <div style={S.result}>
            <strong>{compareResult.message}</strong>
            {compareResult.only_in_right?.length > 0 && (
              <>
                <div style={{ marginTop: 10, fontWeight: 700 }}>
                  Only in {right} — these would be missed if you built from {left} alone:
                </div>
                <div style={S.chips}>
                  {compareResult.only_in_right.slice(0, 80).map((k) => <span key={k} style={S.chip}>{k}</span>)}
                </div>
              </>
            )}
            {compareResult.only_in_left?.length > 0 && (
              <>
                <div style={{ marginTop: 10, fontWeight: 700 }}>Only in {left}:</div>
                <div style={S.chips}>
                  {compareResult.only_in_left.slice(0, 80).map((k) => <span key={k} style={S.chip}>{k}</span>)}
                </div>
              </>
            )}
            {!compareResult.only_in_left?.length && !compareResult.only_in_right?.length && (
              <Note tone="good">The two lists cover exactly the same names.</Note>
            )}
          </div>
        )}
      </Section>

      {/* ─────────────── 3. splitting ─────────────── */}
      <Section
        icon={FiScissors}
        title="Separate what is read from what is worked out"
        subtitle="Some fields are calculated, not printed. Asking an agent to read those invites it to invent them."
        open={open === "split"}
        onToggle={() => setOpen(open === "split" ? null : "split")}
      >
        <div style={S.row}>
          <div style={S.field}>
            <label style={S.label}>List to split</label>
            <select style={S.input} value={source} onChange={(e) => { setSource(e.target.value); setSplitResult(null); }}>
              <option value="">choose…</option>
              {lists.map((v) => <option key={v.key} value={v.key}>{v.key}</option>)}
            </select>
          </div>
          <button
            style={{ ...S.ghost, opacity: source ? 1 : 0.5 }}
            disabled={!source || busy === "suggest"}
            onClick={() => guard("suggest", async () => {
              setSplitResult(await classifyKeys(workflowId, { source, patterns: [] }));
            })}
          >
            {busy === "suggest" ? <FiLoader className="spin" size={13} /> : null}
            Suggest patterns
          </button>
        </div>

        {splitResult?.suggestions && (
          <div style={S.result}>
            <strong>Words that recur in “{source}”.</strong>
            <div style={S.hint}>
              These come from your own sample — click any to use it. Nothing is
              split until you press Split below.
            </div>
            <div style={S.chips}>
              {splitResult.suggestions.map((s) => {
                const on = patternList.includes(s.pattern);
                return (
                  <span
                    key={s.pattern}
                    onClick={() => setPatterns(
                      on ? patternList.filter((p) => p !== s.pattern).join(", ")
                         : [...patternList, s.pattern].join(", "),
                    )}
                    title={s.examples?.join("\n")}
                    style={{
                      ...S.chip, cursor: "pointer",
                      background: on ? "rgba(99,102,241,0.22)" : S.chip.background,
                      fontWeight: on ? 700 : 400,
                    }}
                  >
                    {s.pattern} · {s.would_match}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <label style={S.label}>Patterns</label>
          <input
            style={S.input} value={patterns}
            onChange={(e) => setPatterns(e.target.value)}
            placeholder="comma separated, e.g. total, net, gross"
          />
          <div style={S.hint}>
            A name containing any of these goes to the first list; everything
            else goes to the second.
          </div>
        </div>

        <div style={{ ...S.row, marginTop: 12 }}>
          <div style={S.field}>
            <label style={S.label}>Matched — save as</label>
            <input style={S.input} value={matchedName} onChange={(e) => setMatchedName(e.target.value)} placeholder="e.g. calculated_fields" />
          </div>
          <div style={S.field}>
            <label style={S.label}>The rest — save as</label>
            <input style={S.input} value={restName} onChange={(e) => setRestName(e.target.value)} placeholder="e.g. fields_to_read" />
          </div>
          <button
            style={{ ...S.btn, opacity: source && patternList.length ? 1 : 0.5 }}
            disabled={!source || !patternList.length || busy === "split"}
            onClick={() => guard("split", async () => {
              setSplitResult(await classifyKeys(workflowId, {
                source, patterns: patternList,
                save_matched_as: matchedName || undefined,
                save_rest_as: restName || undefined,
              }));
            })}
          >
            {busy === "split" ? <FiLoader className="spin" size={14} /> : <FiScissors size={14} />}
            Split
          </button>
        </div>

        {splitResult && !splitResult.suggestions && (
          <div style={S.result}>
            <strong>{splitResult.message}</strong>
            {splitResult.invalid_patterns?.length > 0 && (
              <Note tone="bad">
                These were not understood and were ignored:{" "}
                {splitResult.invalid_patterns.map((p) => p.pattern).join(", ")}
              </Note>
            )}
            <div style={{ marginTop: 9, fontSize: 11.5, color: C.muted }}>
              {Object.entries(splitResult.per_pattern || {}).map(([p, n]) => (
                <div key={p}>“{p}” caught {n}</div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontWeight: 700 }}>Matched:</div>
            <div style={S.chips}>
              {(splitResult.matched || []).slice(0, 60).map((k) => <span key={k} style={S.chip}>{k}</span>)}
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

FieldListBuilder.propTypes = {
  workflowId: PropTypes.string,
  variables: PropTypes.array,
  onClose: PropTypes.func,
};
