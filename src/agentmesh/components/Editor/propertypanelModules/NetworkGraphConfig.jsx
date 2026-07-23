import React from "react";
import { FiDatabase, FiPlus, FiTrash2, FiGrid, FiCode, FiLayers } from "react-icons/fi";
import { Field, Input, Select, Textarea, CollapsibleSection } from "./SharedComponents";

export default function NetworkGraphConfig({ data, update }) {
  const mode = data.graph_ingestion_mode || "visual";
  const nodes = data.graph_nodes_schema || [];
  const relations = data.graph_relations_schema || [];

  // Helper to update nodes schema
  const updateNodes = (newNodes) => {
    update({ graph_nodes_schema: newNodes });
  };

  // Helper to update relationships schema
  const updateRelations = (newRelations) => {
    update({ graph_relations_schema: newRelations });
  };

  const addNodeDef = () => {
    updateNodes([...nodes, { label: "", id_path: "", properties: [] }]);
  };

  const removeNodeDef = (index) => {
    updateNodes(nodes.filter((_, i) => i !== index));
  };

  const updateNodeDef = (index, field, value) => {
    const updated = [...nodes];
    updated[index] = { ...updated[index], [field]: value };
    updateNodes(updated);
  };

  const addNodeProp = (nodeIndex) => {
    const updated = [...nodes];
    const node = updated[nodeIndex];
    node.properties = [...(node.properties || []), { name: "", path: "" }];
    updateNodes(updated);
  };

  const updateNodeProp = (nodeIndex, propIndex, field, value) => {
    const updated = [...nodes];
    const node = updated[nodeIndex];
    const props = [...node.properties];
    props[propIndex] = { ...props[propIndex], [field]: value };
    node.properties = props;
    updateNodes(updated);
  };

  const removeNodeProp = (nodeIndex, propIndex) => {
    const updated = [...nodes];
    const node = updated[nodeIndex];
    node.properties = node.properties.filter((_, i) => i !== propIndex);
    updateNodes(updated);
  };

  const addRelationDef = () => {
    updateRelations([...relations, { source_label: "", target_label: "", type: "", source_id_path: "", target_id_path: "" }]);
  };

  const removeRelationDef = (index) => {
    updateRelations(relations.filter((_, i) => i !== index));
  };

  const updateRelationDef = (index, field, value) => {
    const updated = [...relations];
    updated[index] = { ...updated[index], [field]: value };
    updateRelations(updated);
  };

  return (
    <>
      {/* ── Neo4j Connection ── */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          Neo4j Connection Settings
        </div>
        <Field
          label="Target Context Key"
          hint="Context key containing transaction details to ingest."
        >
          <Input
            stripBraces
            value={data.graph_target_key ?? "latest_message"}
            onChange={(v) => update({ graph_target_key: v })}
            placeholder="latest_message"
          />
        </Field>
        <Field
          label="Neo4j Connection URI"
          hint="Override default bolt connection string. E.g. bolt://localhost:7687"
        >
          <Input
            value={data.graph_neo4j_uri ?? ""}
            onChange={(v) => update({ graph_neo4j_uri: v })}
            placeholder="bolt://localhost:7687"
          />
        </Field>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Field label="Username">
              <Input
                value={data.graph_neo4j_user ?? ""}
                onChange={(v) => update({ graph_neo4j_user: v })}
                placeholder="neo4j"
              />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Password">
              <Input
                type="password"
                value={data.graph_neo4j_password ?? ""}
                onChange={(v) => update({ graph_neo4j_password: v })}
                placeholder="••••••••"
              />
            </Field>
          </div>
        </div>
        <Field
          label="Graph Namespace / Collection"
          hint="Dynamic label namespace tag applied to nodes/relations (e.g. FraudFlow, RetailFlow)."
        >
          <Input
            value={data.graph_collection ?? "FraudFlow"}
            onChange={(v) => update({ graph_collection: v })}
            placeholder="FraudFlow"
          />
        </Field>
      </div>

      {/* ── Ingestion Mode Selector ── */}
      <Field label="Ingestion Mode" hint="Choose Visual Dynamic Builder or write custom cypher query code.">
        <Select
          value={mode}
          onChange={(v) => update({ graph_ingestion_mode: v })}
          options={[
            { value: "visual", label: "Visual Builder (No-Code Mapper)" },
            { value: "cypher", label: "Cypher Query Editor (Code Mode)" }
          ]}
        />
      </Field>

      <div style={{ margin: "24px 0 16px", height: "1px", background: "var(--border, #E2E8F0)" }} />

      {/* ── Mode 1: Visual Builder (No-Code Mapper) ── */}
      {mode === "visual" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Nodes Schema */}
          <CollapsibleSection title={`Graph Nodes (${nodes.length})`} defaultOpen={true} icon={FiGrid}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button
                onClick={addNodeDef}
                style={{ display: "flex", alignItems: "center", gap: 4, background: "#F5F3FF", color: "#7C3AED", border: "1px solid #E9D5FF", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
              >
                <FiPlus size={12} /> Add Node
              </button>
            </div>

            {nodes.length === 0 ? (
              <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", padding: "12px 0" }}>No custom nodes configured. Click Add Node.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {nodes.map((node, nIdx) => (
                  <div key={nIdx} style={{ background: "white", padding: 12, borderRadius: 8, border: "1px solid var(--border)", position: "relative" }}>
                    <button
                      onClick={() => removeNodeDef(nIdx)}
                      style={{ position: "absolute", right: 10, top: 10, background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}
                    >
                      <FiTrash2 size={12} />
                    </button>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8, paddingRight: 24 }}>
                      <div style={{ flex: 1 }}>
                        <Field label="Node Label">
                          <Input
                            value={node.label || ""}
                            onChange={(v) => updateNodeDef(nIdx, "label", v)}
                            placeholder="e.g. User"
                          />
                        </Field>
                      </div>
                      <div style={{ flex: 1 }}>
                        <Field label="ID JSON Path">
                          <Input
                            value={node.id_path || ""}
                            onChange={(v) => updateNodeDef(nIdx, "id_path", v)}
                            placeholder="e.g. user_id"
                          />
                        </Field>
                      </div>
                    </div>

                    {/* Properties Map */}
                    <div style={{ marginTop: 8, paddingLeft: 8, borderLeft: "2px solid #E2E8F0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>Node Properties</span>
                        <button
                          onClick={() => addNodeProp(nIdx)}
                          style={{ background: "none", border: "none", color: "#7C3AED", fontSize: 10, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <FiPlus size={10} /> Add Property
                        </button>
                      </div>
                      {(node.properties || []).map((prop, pIdx) => (
                        <div key={pIdx} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                          <Input
                            value={prop.name || ""}
                            onChange={(v) => updateNodeProp(nIdx, pIdx, "name", v)}
                            placeholder="Property Key"
                            style={{ flex: 1, padding: "4px 8px", fontSize: 11 }}
                          />
                          <Input
                            value={prop.path || ""}
                            onChange={(v) => updateNodeProp(nIdx, pIdx, "path", v)}
                            placeholder="JSON Path Source"
                            style={{ flex: 1, padding: "4px 8px", fontSize: 11 }}
                          />
                          <button
                            onClick={() => removeNodeProp(nIdx, pIdx)}
                            style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", padding: 4 }}
                          >
                            <FiTrash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Relationships Schema */}
          <CollapsibleSection title={`Graph Relationships (${relations.length})`} defaultOpen={true} icon={FiLayers}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <button
                onClick={addRelationDef}
                style={{ display: "flex", alignItems: "center", gap: 4, background: "#F5F3FF", color: "#7C3AED", border: "1px solid #E9D5FF", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
              >
                <FiPlus size={12} /> Add Relation
              </button>
            </div>

            {relations.length === 0 ? (
              <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", padding: "12px 0" }}>No custom relationships configured. Click Add Relation.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {relations.map((rel, rIdx) => (
                  <div key={rIdx} style={{ background: "white", padding: 12, borderRadius: 8, border: "1px solid var(--border)", position: "relative" }}>
                    <button
                      onClick={() => removeRelationDef(rIdx)}
                      style={{ position: "absolute", right: 10, top: 10, background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}
                    >
                      <FiTrash2 size={12} />
                    </button>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingRight: 24 }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <Field label="Source Node Label">
                            <Input
                              value={rel.source_label || ""}
                              onChange={(v) => updateRelationDef(rIdx, "source_label", v)}
                              placeholder="e.g. User"
                            />
                          </Field>
                        </div>
                        <div style={{ flex: 1 }}>
                          <Field label="Relation Type">
                            <Input
                              value={rel.type || ""}
                              onChange={(v) => updateRelationDef(rIdx, "type", v)}
                              placeholder="e.g. OWNED_BY"
                            />
                          </Field>
                        </div>
                        <div style={{ flex: 1 }}>
                          <Field label="Target Node Label">
                            <Input
                              value={rel.target_label || ""}
                              onChange={(v) => updateRelationDef(rIdx, "target_label", v)}
                              placeholder="e.g. Device"
                            />
                          </Field>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <Field label="Source ID Path">
                            <Input
                              value={rel.source_id_path || ""}
                              onChange={(v) => updateRelationDef(rIdx, "source_id_path", v)}
                              placeholder="e.g. user_id"
                            />
                          </Field>
                        </div>
                        <div style={{ flex: 1 }}>
                          <Field label="Target ID Path">
                            <Input
                              value={rel.target_id_path || ""}
                              onChange={(v) => updateRelationDef(rIdx, "target_id_path", v)}
                              placeholder="e.g. device_id"
                            />
                          </Field>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>
        </div>
      )}

      {/* ── Mode 2: Cypher Query Code Mode ── */}
      {mode === "cypher" && (
        <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14, background: "#F8FAFC", marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-muted)",
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <FiCode size={12} /> Custom Cypher Script
          </div>
          <p
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginBottom: 14,
              lineHeight: 1.4,
            }}
          >
            Write a custom Cypher query to run for each transaction. The transaction properties are unpacked (e.g. use <code>$transaction_id</code> directly) and also available as <code>$item</code>.
          </p>
          <Field label="Cypher Query Command">
            <Textarea
              value={data.graph_cypher_query || ""}
              onChange={(v) => update({ graph_cypher_query: v })}
              placeholder="e.g. MERGE (u:User {id: $user_id}) MERGE (d:Device {id: $device_id}) MERGE (u)-[:USED]->(d)"
              rows={8}
            />
          </Field>
        </div>
      )}
    </>
  );
}
