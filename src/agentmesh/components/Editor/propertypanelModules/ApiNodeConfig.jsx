import React, { useState } from "react";
import { FiInfo, FiPlus } from "react-icons/fi";
import {
  Field,
  Textarea,
  Select,
  Input,
  ApiConfigSection,
  ListAccordionItem,
} from "./SharedComponents";
import ConnectionsDropdown from "../ConnectionsDropdown";

export default function ApiNodeConfig({ data, update, selectedNodeId }) {
  const additionalApis = data.additional_apis || [];
  const totalCount = 1 + additionalApis.length;

  const [collapsedIndices, setCollapsedIndices] = useState({ 0: false });

  const toggleCollapse = (idx) => {
    setCollapsedIndices((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const moveApi = (index, direction) => {
    const allApis = [
      {
        name: data.api_name || "API #1 (Primary)",
        description: data.api_description || "",
        enabled: data.api_enabled ?? true,
        api_method: data.api_method || "GET",
        api_url: data.api_url || "",
        api_headers: data.api_headers || {},
        api_params: data.api_params || {},
        api_body: data.api_body || "",
        api_auth_type: data.api_auth_type || "None",
        api_auth_config: data.api_auth_config || {},
        api_response_format: data.api_response_format || "json",
        connection_id: data.connection_id || null,
        api_protocol: data.api_protocol || "REST",
      },
      ...additionalApis.map((api, idx) => ({
        name: api.name || `API #${idx + 2}`,
        description: api.description || "",
        enabled: api.enabled ?? true,
        api_method: api.api_method || "GET",
        api_url: api.api_url || "",
        api_headers: api.api_headers || {},
        api_params: api.api_params || {},
        api_body: api.api_body || "",
        api_auth_type: api.api_auth_type || "None",
        api_auth_config: api.api_auth_config || {},
        api_response_format: api.api_response_format || "json",
        connection_id: api.connection_id || null,
      })),
    ];

    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= allApis.length) return;

    // Swap items
    const temp = allApis[index];
    allApis[index] = allApis[targetIdx];
    allApis[targetIdx] = temp;

    // Save primary back to top-level fields
    const primary = allApis[0];
    const additional = allApis.slice(1);

    update({
      api_name: primary.name,
      api_description: primary.description,
      api_enabled: primary.enabled,
      api_method: primary.api_method,
      api_url: primary.api_url,
      api_headers: primary.api_headers,
      api_params: primary.api_params,
      api_body: primary.api_body,
      api_auth_type: primary.api_auth_type,
      api_auth_config: primary.api_auth_config,
      api_response_format: primary.api_response_format,
      connection_id: primary.connection_id,
      api_protocol: primary.api_protocol,
      additional_apis: additional,
    });

    // Sync collapse states to their new indices
    setCollapsedIndices((prev) => {
      const next = {};
      Object.keys(prev).forEach((k) => {
        const keyInt = parseInt(k);
        if (keyInt === index) {
          next[targetIdx] = prev[index];
        } else if (keyInt === targetIdx) {
          next[index] = prev[targetIdx];
        } else {
          next[keyInt] = prev[keyInt];
        }
      });
      return next;
    });
  };

  const getHeaderContent = (api, isPrimary, idx) => {
    const name = isPrimary
      ? data.api_name || "API #1 (Primary)"
      : api.name || `API #${idx + 1}`;
    const method = api.api_method || "GET";

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
        <span
          style={{
            fontWeight: 700,
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 150,
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontSize: 9,
            padding: "2px 6px",
            borderRadius: 4,
            background: "#E0F2FE",
            color: "#0369A1",
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {method}
        </span>
      </div>
    );
  };

  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <Field label="Config Mode" hint="Choose between standard UI configuration or raw cURL command entry.">
          <Select
            value={data.use_curl ? "cURL" : "standard"}
            onChange={(v) => {
              const isCurl = v === "cURL";
              const updatedAdditional = additionalApis.map(api => ({
                ...api,
                use_curl: isCurl
              }));
              update({ 
                use_curl: isCurl,
                additional_apis: updatedAdditional
              });
            }}
            options={[
              { value: "standard", label: "Standard UI" },
              { value: "cURL", label: "cURL Command" },
            ]}
          />
        </Field>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Field label="Execution Mode" hint="Choose how the APIs are executed.">
          <Select
            value={data.api_execution_mode || "sequential"}
            onChange={(v) => update({ api_execution_mode: v })}
            disabled={totalCount <= 1}
            options={[
              { value: "sequential", label: "Sequential (Step-by-step)" },
              { value: "parallel", label: "Parallel (Concurrent)" },
            ]}
          />
        </Field>
      </div>

      <div style={{ display: "flex", flexDirection: "column", marginBottom: 15 }}>
        {/* Primary API */}
        <ListAccordionItem
          headerContent={getHeaderContent(data, true, 0)}
          index={0}
          totalItems={totalCount}
          isCollapsed={collapsedIndices[0] ?? true}
          onToggleCollapse={() => toggleCollapse(0)}
          isEnabled={data.api_enabled ?? true}
          onToggleEnabled={
            totalCount > 1 ? (v) => update({ api_enabled: v }) : null
          }
          onMoveUp={totalCount > 1 ? () => moveApi(0, -1) : null}
          onMoveDown={totalCount > 1 ? () => moveApi(0, 1) : null}
        >
          <Field
            label="Description"
            hint="Explain the purpose of this primary API call."
          >
            <Textarea
              value={data.api_description || ""}
              onChange={(v) => update({ api_description: v })}
              placeholder="e.g. Fetches baseline authentication or initial user credentials."
              rows={2}
            />
          </Field>

          {data.use_curl ? (
            <Field
              label="cURL Command"
              hint="Raw cURL command. Supports {{variables}} and multiline."
            >
              <Textarea
                value={data.curl_command || ""}
                onChange={(v) => update({ curl_command: v })}
                placeholder={
                  'curl -X POST "http://..." -d "{\\"key\\": \\"value\\"}"'
                }
                rows={6}
              />
            </Field>
          ) : (
            <>
              <div
                style={{
                  padding: 16,
                  background: "var(--bg-card-info, #F0F9FF)",
                  borderRadius: 12,
                  border: "1px solid var(--border-card-info, #BAE6FD)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-card-info, #0369A1)",
                    marginBottom: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Enterprise Connector
                </div>

                <Field
                  label="Connection Profile"
                  hint="Select a saved connection from the vault to handle Auth automatically."
                >
                  <ConnectionsDropdown
                    value={data.connection_id}
                    onChange={(v) => update({ connection_id: v })}
                  />
                </Field>

                <Field label="API Protocol">
                  <Select
                    value={data.api_protocol || "REST"}
                    onChange={(v) => update({ api_protocol: v })}
                    options={[
                      { value: "REST", label: "REST (Standard JSON)" },
                      { value: "SOAP", label: "SOAP (Strict XML)" },
                      { value: "GRAPHQL", label: "GraphQL (Query)" },
                    ]}
                  />
                </Field>
              </div>

              <ApiConfigSection
                data={data}
                update={update}
                prefix="api_"
                urlKey="api_url"
              />
            </>
          )}

          <Field label="Response Format">
            <Select
              value={data.api_response_format || "json"}
              onChange={(v) => update({ api_response_format: v })}
              options={[
                { value: "json", label: "JSON (Parsed Object)" },
                { value: "text", label: "Raw String" },
                { value: "binary", label: "Binary Info" },
              ]}
            />
          </Field>
        </ListAccordionItem>

        {/* Additional APIs */}
        {additionalApis.map((api, idx) => {
          const listIdx = idx + 1;
          const localUpdate = (changes) => {
            const newArr = [...additionalApis];
            newArr[idx] = { ...newArr[idx], ...changes };
            update({ additional_apis: newArr });
          };
          return (
            <ListAccordionItem
              key={idx}
              headerContent={getHeaderContent(api, false, listIdx)}
              index={listIdx}
              totalItems={totalCount}
              isCollapsed={collapsedIndices[listIdx] ?? true}
              onToggleCollapse={() => toggleCollapse(listIdx)}
              isEnabled={api.enabled ?? true}
              onToggleEnabled={(v) => localUpdate({ enabled: v })}
              onMoveUp={() => moveApi(listIdx, -1)}
              onMoveDown={() => moveApi(listIdx, 1)}
              onDelete={() => {
                const newArr = [...additionalApis];
                newArr.splice(idx, 1);
                update({ additional_apis: newArr });
              }}
            >
              <Field label="API Name" hint="A descriptive label for this call.">
                <Input
                  value={api.name || ""}
                  onChange={(v) => localUpdate({ name: v })}
                  placeholder={`e.g. Fetch Customer Info`}
                />
              </Field>

              <Field
                label="Description"
                hint="Explain the purpose of this API call."
              >
                <Textarea
                  value={api.description || ""}
                  onChange={(v) => localUpdate({ description: v })}
                  placeholder="e.g. Calls the internal CRM endpoint to fetch customer address."
                  rows={2}
                />
              </Field>

              {data.use_curl ? (
                <Field
                  label="cURL Command"
                  hint="Raw cURL command. Supports {{variables}} and multiline."
                >
                  <Textarea
                    value={api.curl_command || ""}
                    onChange={(v) => localUpdate({ curl_command: v, use_curl: true })}
                    placeholder={
                      'curl -X POST "http://..." -d "{\\"key\\": \\"value\\"}"'
                    }
                    rows={6}
                  />
                </Field>
              ) : (
                <>
                  <div
                    style={{
                      padding: 16,
                      background: "var(--bg-card-info, #F0F9FF)",
                      borderRadius: 12,
                      border: "1px solid var(--border-card-info, #BAE6FD)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--text-card-info, #0369A1)",
                        marginBottom: 12,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Enterprise Connector
                    </div>

                    <Field
                      label="Connection Profile"
                      hint="Select a saved connection from the vault to handle Auth automatically."
                    >
                      <ConnectionsDropdown
                        value={api.connection_id}
                        onChange={(v) => localUpdate({ connection_id: v })}
                      />
                    </Field>
                  </div>

                  <ApiConfigSection
                    data={api}
                    update={(changes) => localUpdate({ ...changes, use_curl: false })}
                    prefix="api_"
                    urlKey="api_url"
                  />
                </>
              )}

              <Field label="Response Format">
                <Select
                  value={api.api_response_format || "json"}
                  onChange={(v) => localUpdate({ api_response_format: v })}
                  options={[
                    { value: "json", label: "JSON (Parsed Object)" },
                    { value: "text", label: "Raw String" },
                    { value: "binary", label: "Binary Info" },
                  ]}
                />
              </Field>
            </ListAccordionItem>
          );
        })}
      </div>

      {/* Add Additional API Button */}
      <button
        type="button"
        onClick={() => {
          const newArr = [
            ...additionalApis,
            {
              name: `API #${additionalApis.length + 2}`,
              description: "",
              enabled: true,
              api_method: "GET",
              api_url: "",
              api_headers: {},
              api_params: {},
              api_body: "",
              api_auth_type: "None",
              api_auth_config: {},
              api_response_format: "json",
              use_curl: data.use_curl || false,
              curl_command: "",
            },
          ];
          update({ additional_apis: newArr });
        }}
        style={{
          width: "100%",
          padding: "10px",
          background: "#F1F5F9",
          border: "1px dashed #CBD5E1",
          borderRadius: "8px",
          color: "#475569",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          transition: "background 0.2s",
          marginBottom: 20,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#E2E8F0")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#F1F5F9")}
      >
        <FiPlus size={14} /> Add Additional API
      </button>
    </>
  );
}
