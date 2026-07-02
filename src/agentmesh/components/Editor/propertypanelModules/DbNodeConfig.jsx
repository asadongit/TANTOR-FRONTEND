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

  const handleTestQuery = async () => {
    const op = data.db_operation || (engine === "mongodb" ? "insert_one" : "query");
    const isWrite = engine === "mongodb"
      ? ["insert_one", "insert_many", "update_one", "delete_one"].includes(op)
      : op === "execute";

    if (isWrite) {
      const confirmed = globalThis.confirm(
        `Warning: This is a write/destructive operation (${op}). Running it will modify the database. Are you sure you want to proceed?`
      );
      if (!confirmed) return;
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

        {testError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start gap-2">
            <FiAlertCircle className="mt-0.5 flex-shrink-0 text-red-500" size={14} />
            <div>
              <div className="font-bold mb-1">Execution Error</div>
              <pre className="font-mono m-0 overflow-auto max-h-40 whitespace-pre-wrap">{testError}</pre>
            </div>
          </div>
        )}

        {testResult && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-start gap-2">
            <FiCheckCircle className="mt-0.5 flex-shrink-0 text-emerald-600" size={14} />
            <div className="w-full overflow-hidden">
              <div className="font-bold mb-1">Execution Success</div>
              <div className="text-emerald-700 font-semibold mb-2">{testResult.summary}</div>
              {testResult.result !== undefined && (
                <>
                  <div className="font-semibold text-slate-500 mb-1">Response Data:</div>
                  <pre className="font-mono m-0 p-2 bg-slate-900 text-slate-100 rounded overflow-auto max-h-60 text-[10px] leading-relaxed">
                    {JSON.stringify(testResult.result, null, 2)}
                  </pre>
                </>
              )}
            </div>
          </div>
        )}
      </div>
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
