import React, { useState } from "react";
import PropTypes from "prop-types";
import { Select, Field, Input, Textarea } from "./SharedComponents";
import { runDbQuery } from "../../../api/agentmesh";
import { FiPlay, FiLoader, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

export default function DbNodeConfig({ data, update }) {
  const engine = data.db_engine || "mongodb";
  const isMongo = engine === "mongodb";
  const isSql = ["postgresql", "sqlite"].includes(engine);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState(null);

  // Modal editor states
  const [showModal, setShowModal] = useState(false);
  const [modalField, setModalField] = useState("db_query"); // "db_query" or "db_document"

  const handleTestQuery = async () => {
    const op = data.db_operation || (engine === "mongodb" ? "insert_one" : "query");
    
    // Automatically determine whether we are focusing on document or query/filter
    if (isSql) {
      setModalField("db_query");
    } else {
      if (["insert_one", "insert_many", "update_one"].includes(op)) {
        setModalField("db_document");
      } else {
        setModalField("db_query");
      }
    }
    
    // Auto-open modal to display test state/result
    setShowModal(true);

    const isWrite = engine === "mongodb"
      ? ["insert_one", "insert_many", "update_one", "delete_one"].includes(op)
      : op === "execute";

    if (isWrite) {
      const confirmed = globalThis.confirm(
        `Warning: This is a write/destructive operation (${op}). Running it will modify the database. Are you sure you want to proceed?`
      );
      if (!confirmed) {
        setShowModal(false);
        return;
      }
    }

    setTesting(true);
    setTestResult(null);
    setTestError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await runDbQuery({
        db_engine: engine,
        db_connection_string: data.db_connection_string,
        db_database: data.db_database,
        db_collection: data.db_collection,
        db_operation: op,
        db_document: data.db_document,
        db_query: data.db_query,
        db_limit: data.db_limit,
      }, { signal: controller.signal });
      setTestResult(res);
    } catch (err) {
      if (err.name === "AbortError") {
        setTestError("Query execution timed out after 15 seconds.");
      } else {
        setTestError(err.message || "Failed to execute query");
      }
    } finally {
      clearTimeout(timeoutId);
      setTesting(false);
    }
  };

  return (
    <>
      <Field label="Database Engine" hint="Choose the database engine type.">
        <Select
          value={engine}
          onChange={(v) => {
            // Reset operations and connection string advice when switching engine
            const defaultOp = v === "mongodb" ? "insert_one" : "query";
            update({ db_engine: v, db_operation: defaultOp });
          }}
          options={[
            { value: "mongodb", label: "MongoDB" },
            { value: "postgresql", label: "PostgreSQL" },
            { value: "sqlite", label: "SQLite" },
          ]}
        />
      </Field>

      {/* --- MongoDB Configurations --- */}
      {isMongo && (
        <>
          <Field label="Operation" hint="Choose the MongoDB CRUD operation.">
            <Select
              value={data.db_operation || "insert_one"}
              onChange={(v) => update({ db_operation: v })}
              options={[
                { value: "insert_one", label: "Insert One" },
                { value: "insert_many", label: "Insert Many" },
                { value: "find_one", label: "Find One" },
                { value: "find_many", label: "Find Many" },
                { value: "update_one", label: "Update One" },
                { value: "delete_one", label: "Delete One" },
              ]}
            />
          </Field>

          <Field
            label="Connection String"
            hint="MongoDB URI. Leave blank to use backend MONGODB_URI env var."
          >
            <Input
              value={data.db_connection_string || ""}
              onChange={(v) => update({ db_connection_string: v || null })}
              placeholder="mongodb://localhost:27017 (or leave blank)"
              type="password"
            />
          </Field>

          <Field label="Database Name" hint="Target MongoDB database.">
            <Input
              value={data.db_database || ""}
              onChange={(v) => update({ db_database: v })}
              placeholder="e.g. credit_decisioning"
            />
          </Field>

          <Field
            label="Collection Name"
            hint="Target MongoDB collection. Supports {{context.xxx}} interpolation."
          >
            <Input
              value={data.db_collection || ""}
              onChange={(v) => update({ db_collection: v })}
              placeholder="e.g. customer_profiles"
            />
          </Field>

          {["insert_one", "insert_many", "update_one"].includes(
            data.db_operation || "insert_one"
          ) && (
            <Field
              label="Document Template"
              hint="JSON template with {{context.xxx}} placeholders. Use {{__NOW__}} for current timestamp."
            >
              <Textarea
                value={
                  typeof data.db_document === "string"
                    ? data.db_document
                    : JSON.stringify(data.db_document || {}, null, 2)
                }
                onChange={(v) => {
                  try {
                    update({ db_document: JSON.parse(v) });
                  } catch {
                    update({ db_document: v });
                  }
                }}
                placeholder={
                  '{\n  "name": "{{extracted_identifiers.0.value}}",\n  "status": "completed",\n  "created_at": "{{__NOW__}}"\n}'
                }
                rows={8}
              />
            </Field>
          )}

          {["find_one", "find_many", "update_one", "delete_one"].includes(
            data.db_operation || "insert_one"
          ) && (
            <Field
              label="Query Filter"
              hint="MongoDB query filter with {{context.xxx}} placeholders."
            >
              <Textarea
                value={
                  typeof data.db_query === "string"
                    ? data.db_query
                    : JSON.stringify(data.db_query || {}, null, 2)
                }
                onChange={(v) => {
                  try {
                    update({ db_query: JSON.parse(v) });
                  } catch {
                    update({ db_query: v });
                  }
                }}
                placeholder={'{\n  "customer_uid": "{{customer_uid}}"\n}'}
                rows={4}
              />
            </Field>
          )}

          {["find_one", "find_many"].includes(
            data.db_operation || "insert_one"
          ) && (
            <Field label="Output Key" hint="Context key to store query results.">
              <Input
                value={data.db_output_key || "db_result"}
                onChange={(v) => update({ db_output_key: v })}
                placeholder="db_result"
              />
            </Field>
          )}

          {(data.db_operation || "insert_one") === "find_many" && (
            <Field label="Limit" hint="Maximum documents to return.">
              <Input
                type="number"
                value={data.db_limit ?? 100}
                onChange={(v) => update({ db_limit: Number.parseInt(v) || 100 })}
                placeholder="100"
              />
            </Field>
          )}
        </>
      )}

      {/* --- SQL (PostgreSQL, SQLite) Configurations --- */}
      {isSql && (
        <>
          <Field label="Operation" hint="Choose the SQL execution mode.">
            <Select
              value={data.db_operation || "query"}
              onChange={(v) => update({ db_operation: v })}
              options={[
                { value: "query", label: "Query (SELECT)" },
                { value: "execute", label: "Execute (INSERT/UPDATE/DELETE)" },
              ]}
            />
          </Field>

          <Field
            label="Connection / File Path"
            hint={
              engine === "sqlite"
                ? "Path to local sqlite database file (e.g. ./test.db)"
                : `${engine.toUpperCase()} connection URI. (e.g. ${engine}://user:pass@host:port/dbname)`
            }
          >
            <Input
              value={data.db_connection_string || ""}
              onChange={(v) => update({ db_connection_string: v || null })}
              placeholder={
                engine === "sqlite"
                  ? "./test.db"
                  : `${engine}://user:pass@host:port/dbname`
              }
              type={engine === "sqlite" ? "text" : "password"}
            />
          </Field>

          <Field
            label="SQL Query"
            hint="SQL statement. Supports {{context.xxx}} placeholders (automatically parameterized)."
          >
            <Textarea
              value={data.db_query || ""}
              onChange={(v) => update({ db_query: v })}
              placeholder={
                data.db_operation === "execute"
                  ? "INSERT INTO users (name, email) VALUES ({{name}}, {{email}})"
                  : "SELECT * FROM users WHERE email = {{target_email}}"
              }
              rows={6}
            />
          </Field>

          {(data.db_operation || "query") === "query" && (
            <>
              <Field label="Output Key" hint="Context key to store query results.">
                <Input
                  value={data.db_output_key || "db_result"}
                  onChange={(v) => update({ db_output_key: v })}
                  placeholder="db_result"
                />
              </Field>

              <Field label="Limit" hint="Maximum rows to return.">
                <Input
                  type="number"
                  value={data.db_limit ?? 100}
                  onChange={(v) => update({ db_limit: Number.parseInt(v) || 100 })}
                  placeholder="100"
                />
              </Field>
            </>
          )}
        </>
      )}

      {/* Test / Run Query Section */}
      <div className="border-t border-slate-200 pt-4 mt-6 flex flex-col gap-3">
        <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">
          Query Validation
        </div>
        
        <button
          onClick={handleTestQuery}
          disabled={testing}
          className="w-full px-4 py-2 bg-[#065F46] hover:bg-[#047857] disabled:bg-[#a7f3d0] disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg border-none flex items-center justify-center gap-2 cursor-pointer transition-colors duration-200"
        >
          {testing ? (
            <>
              <FiLoader className="animate-spin" size={14} />
              Executing Query...
            </>
          ) : (
            <>
              <FiPlay size={14} />
              Run / Test Query
            </>
          )}
        </button>
      </div>

      {/* --- Fullscreen/Expanded Editor and Query Runner Modal --- */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-800 m-0">
                  {isSql ? "SQL Query Editor & Runner" : "NoSQL Document Editor & Runner"}
                </h3>
                <p className="text-[11px] text-slate-500 m-0 mt-0.5">
                  Engine: <span className="font-semibold capitalize text-slate-700">{engine}</span> | Operation: <span className="font-semibold text-slate-700">{data.db_operation || "query"}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-none cursor-pointer text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden p-6 flex flex-col md:flex-row gap-6 min-h-0">
              {/* Left Side: Editor */}
              <div className="flex-1 flex flex-col gap-2 min-h-0">
                <div className="text-xs font-bold text-slate-600 flex items-center justify-between">
                  <span>Editor ({modalField === "db_document" ? "Document Template" : isSql ? "SQL Query" : "Query Filter"})</span>
                  <span className="text-[10px] font-normal text-slate-400">Supports variable interpolation</span>
                </div>
                <textarea
                  value={
                    modalField === "db_document"
                      ? (typeof data.db_document === "string" ? data.db_document : JSON.stringify(data.db_document || {}, null, 2))
                      : (typeof data.db_query === "string" ? data.db_query : JSON.stringify(data.db_query || {}, null, 2))
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (modalField === "db_document") {
                      try {
                        update({ db_document: JSON.parse(val) });
                      } catch {
                        update({ db_document: val });
                      }
                    } else {
                      if (isSql) {
                        update({ db_query: val });
                      } else {
                        try {
                          update({ db_query: JSON.parse(val) });
                        } catch {
                          update({ db_query: val });
                        }
                      }
                    }
                  }}
                  className="w-full flex-1 p-3 font-mono text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none min-h-0"
                  placeholder={
                    isSql
                      ? "SELECT * FROM table WHERE column = {{variable}}"
                      : "{\n  \"key\": \"{{value}}\"\n}"
                  }
                />
                
                <button
                  onClick={handleTestQuery}
                  disabled={testing}
                  className="w-full py-2.5 px-4 bg-[#065F46] hover:bg-[#047857] disabled:bg-[#a7f3d0] text-white text-xs font-bold rounded-lg border-none flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {testing ? (
                    <>
                      <FiLoader className="animate-spin" size={14} />
                      Executing Query...
                    </>
                  ) : (
                    <>
                      <FiPlay size={14} />
                      Re-run / Test Query
                    </>
                  )}
                </button>
              </div>

              {/* Right Side: Results */}
              <div className="w-full md:w-[480px] flex flex-col gap-2 min-h-0">
                <div className="text-xs font-bold text-slate-600">Test Execution Output</div>
                <div className="flex-1 border border-slate-200 rounded-lg bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-auto flex flex-col justify-start min-h-0">
                  {testing && (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                      <FiLoader className="animate-spin" size={18} />
                      <span>Executing query on backend...</span>
                    </div>
                  )}

                  {!testing && !testError && !testResult && (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center px-4">
                      <span>No query output yet. Configure settings and click "Run Test Query" to execute.</span>
                    </div>
                  )}

                  {!testing && testError && (
                    <div className="text-red-400">
                      <div className="font-bold text-red-500 mb-2 flex items-center gap-1">
                        <FiAlertCircle size={14} /> Execution Error:
                      </div>
                      <pre className="m-0 whitespace-pre-wrap overflow-auto max-h-[350px] text-[11px] leading-relaxed">
                        {testError}
                      </pre>
                    </div>
                  )}

                  {!testing && testResult && (
                    <div className="flex flex-col h-full min-h-0">
                      <div className="text-emerald-400 font-bold mb-1 flex items-center gap-1">
                        <FiCheckCircle size={14} /> Success:
                      </div>
                      <div className="text-slate-300 font-semibold mb-3 text-[11px]">{testResult.summary}</div>
                      {testResult.result !== undefined && (
                        <div className="flex-1 flex flex-col min-h-0">
                          <div className="text-slate-500 font-bold mb-1 text-[10px] uppercase tracking-wider">Result Dataset:</div>
                          <pre className="flex-1 m-0 p-3 bg-slate-900/60 rounded border border-slate-800 overflow-auto text-[10px] leading-relaxed text-emerald-300">
                            {JSON.stringify(testResult.result, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
              >
                Close Editor
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

DbNodeConfig.propTypes = {
  data: PropTypes.shape({
    db_engine: PropTypes.string,
    db_operation: PropTypes.string,
    db_connection_string: PropTypes.string,
    db_database: PropTypes.string,
    db_collection: PropTypes.string,
    db_document: PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.array]),
    db_query: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    db_output_key: PropTypes.string,
    db_limit: PropTypes.number,
  }).isRequired,
  update: PropTypes.func.isRequired,
};
