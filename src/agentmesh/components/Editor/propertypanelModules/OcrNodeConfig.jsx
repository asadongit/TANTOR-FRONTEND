import React from "react";
import { FiSettings } from "react-icons/fi";
import {
  Select,
  Field,
  Input,
  Textarea,
  KeyValueEditor,
  LLMConfigSection,
} from "./SharedComponents";

export default function OcrNodeConfig({ data, update }) {
  return (
    <>
      <Field
        label="OCR Mode"
        hint="Hybrid reads a PDF's built-in text layer and only calls the AI for scans — faster, cheaper and more accurate on digital PDFs. Vision sends every page to a Cloud LLM; Standard uses local engines; External sends files to an API service (e.g., DocBot)."
      >
        <Select
          value={data.ocr_engine || "vision"}
          onChange={(v) => update({ ocr_engine: v })}
          options={[
            { value: "hybrid", label: "Hybrid — text layer first, AI for scans" },
            { value: "vision", label: "Vision OCR (AI/LLM)" },
            { value: "standard", label: "Standard OCR (Local)" },
            { value: "external", label: "External Service (API)" },
          ]}
        />
      </Field>

      {data.ocr_engine === "hybrid" && (
        <div
          style={{
            marginTop: 16,
            marginBottom: 16,
            padding: "12px 14px",
            border: "1px solid var(--border)",
            borderRadius: 8,
            background: "var(--bg-hover)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              marginBottom: 10,
            }}
          >
            Hybrid Settings
          </div>

          <Field
            label="Fallback Engine"
            hint="Used for pages with no readable text — scans and photographs."
          >
            <Select
              value={data.ocr_fallback_engine || "vision"}
              onChange={(v) => update({ ocr_fallback_engine: v })}
              options={[
                { value: "vision", label: "Vision OCR (AI/LLM)" },
                { value: "standard", label: "Standard OCR (Local)" },
              ]}
            />
          </Field>

          <Field
            label="Minimum Text Characters"
            hint="How much embedded text counts as a real digital PDF. A scan yields almost none; a genuine page yields thousands — so this threshold is not delicate. Default 100."
          >
            <Input
              type="number"
              value={data.ocr_text_layer_min_chars ?? 100}
              onChange={(v) => update({ ocr_text_layer_min_chars: Number(v) })}
              placeholder="100"
            />
          </Field>

          <Field
            label="Max Pages"
            hint="Guard against one enormous file consuming the whole AI budget. 0 = no limit."
          >
            <Input
              type="number"
              value={data.ocr_max_pages ?? 0}
              onChange={(v) => update({ ocr_max_pages: Number(v) })}
              placeholder="0"
            />
          </Field>

          <Field
            label="When Max Pages Is Exceeded"
            hint="Truncate processes the first N pages and carries on; Fail stops the run."
          >
            <Select
              value={data.ocr_on_max_pages || "truncate"}
              onChange={(v) => update({ ocr_on_max_pages: v })}
              options={[
                { value: "truncate", label: "Truncate — process the first N pages" },
                { value: "fail", label: "Fail — stop the run" },
              ]}
            />
          </Field>
        </div>
      )}

      {["vision", "hybrid"].includes(data.ocr_engine || "vision") && (
        <>
          <Field
            label="OCR Instruction / Prompt"
            hint="Instruction for the vision model. Be specific about what data to extract."
          >
            <Textarea
              value={data.ocr_prompt}
              onChange={(v) => update({ ocr_prompt: v })}
              placeholder="e.g. Extract all text from this receipt accurately..."
            />
          </Field>

          <div
            style={{
              marginTop: 20,
              borderTop: "1px solid var(--border)",
              paddingTop: 20,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Model Settings
            </div>
            <LLMConfigSection
              llm={data.llm}
              onChange={(v) => update({ llm: v })}
            />
          </div>
        </>
      )}

      {data.ocr_engine === "standard" && (
        <div
          style={{
            padding: "16px",
            background: "var(--bg-card-neutral, #F8FAFC)",
            borderRadius: 12,
            border: "1px solid var(--border)",
            marginTop: 10,
          }}
        >
          <Field
            label="Local OCR Engine"
            hint="Select the local model installed on your server."
          >
            <Select
              value={data.ocr_standard_model || "tesseract"}
              onChange={(v) => update({ ocr_standard_model: v })}
              options={[
                { value: "tesseract", label: "Tesseract OCR" },
                { value: "chandra", label: "Chandra OCR" },
                { value: "surya", label: "Surya OCR" },
              ]}
            />
          </Field>
          <div
            style={{
              fontSize: 11,
              color: "#64748B",
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FiSettings size={12} /> Running on local CPU/GPU resources.
          </div>
        </div>
      )}

      {data.ocr_engine === "external" && (
        <>
          <div
            style={{
              padding: 16,
              background: "#FFF7ED",
              borderRadius: 12,
              border: "1px solid #FED7AA",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#9A3412",
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              External OCR Service
            </div>

            <Field
              label="Service URL"
              hint="Full URL of the extraction API endpoint."
            >
              <Input
                value={data.ocr_service_url || ""}
                onChange={(v) => update({ ocr_service_url: v })}
                placeholder="http://localhost:8003/api/ocr/upload"
              />
            </Field>

            <Field label="Response Type" hint="How the service returns data.">
              <Select
                value={data.ocr_service_response_type || "sse"}
                onChange={(v) => update({ ocr_service_response_type: v })}
                options={[
                  { value: "sse", label: "SSE Stream (Server-Sent Events)" },
                  { value: "json", label: "JSON (Standard Response)" },
                ]}
              />
            </Field>

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <Field
                  label="File Field Name"
                  hint="Multipart form field name for file."
                >
                  <Input
                    stripBraces
                    value={data.ocr_service_file_field || "files"}
                    onChange={(v) => update({ ocr_service_file_field: v })}
                    placeholder="files"
                  />
                </Field>
              </div>
              <div style={{ flex: 1 }}>
                <Field
                  label="Text Path in Response"
                  hint="Dot-path to extracted text in each event/result."
                >
                  <Input
                    value={data.ocr_service_text_path || "data.text"}
                    onChange={(v) => update({ ocr_service_text_path: v })}
                    placeholder="data.text"
                  />
                </Field>
              </div>
            </div>
          </div>

          <KeyValueEditor
            label="Service Form Fields"
            value={data.ocr_service_params || {}}
            onChange={(v) => update({ ocr_service_params: v })}
            hint="Extra fields sent with the file (e.g., provider: groq, mask_pii: true)"
          />

          <KeyValueEditor
            label="Service Headers"
            value={data.ocr_service_headers || {}}
            onChange={(v) => update({ ocr_service_headers: v })}
            hint="Optional headers (e.g., Authorization: Bearer xxx)"
          />

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--border)",
              margin: "16px 0",
              opacity: 0.5,
            }}
          />

          <Field
            label="Multi-File Input Key (Optional)"
            hint="Context key containing a list of uploaded file objects (e.g., payload.uploaded_files). If set, processes ALL files."
          >
            <Input
              stripBraces
              value={data.ocr_multi_file_key || ""}
              onChange={(v) => update({ ocr_multi_file_key: v })}
              placeholder="e.g. payload.uploaded_files"
            />
          </Field>
        </>
      )}

      <div style={{ marginTop: 16 }}>
        <Field
          label="Allowed File Formats"
          hint="Restrict allowed file upload formats for this OCR Node."
        >
          <Select
            value={data.allowed_file_types || "all"}
            onChange={(v) => update({ allowed_file_types: v })}
            options={[
              { value: "all", label: "All Formats (PDF, PNG, JPG, WEBP)" },
              { value: "images", label: "Images Only (PNG, JPG, WEBP)" },
              { value: "pdf", label: "PDF Only (.pdf)" },
            ]}
          />
        </Field>

        <Field
          label="Input File Path Key"
          hint="Context key containing file path to process. Defaults to 'latest_file_path'."
        >
          <Input
            stripBraces
            value={data.ocr_input_key || "latest_file_path"}
            onChange={(v) => update({ ocr_input_key: v })}
            placeholder="latest_file_path"
          />
        </Field>

        <Field
          label="Destination Key"
          hint="The context key where OCR results are saved. Defaults to 'latest_ocr_output'."
        >
          <Input
            stripBraces
            value={data.destination_key || "latest_ocr_output"}
            onChange={(v) => update({ destination_key: v })}
            placeholder="latest_ocr_output"
          />
        </Field>
      </div>
    </>
  );
}
