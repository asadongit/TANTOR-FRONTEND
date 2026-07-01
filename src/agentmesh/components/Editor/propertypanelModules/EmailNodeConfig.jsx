import React, { memo, useState } from "react";
import { FiEye, FiX } from "react-icons/fi";
import PropTypes from "prop-types";
import {
  VariablePicker,
  Field,
  Input,
  Textarea,
  Select,
  Toggle,
} from "./SharedComponents";

const PROVIDERS = [
  { value: "Gmail", label: "Google / Gmail" },
  { value: "Outlook", label: "Outlook / Office 365" },
  { value: "SendGrid", label: "SendGrid" },
  { value: "Mailgun", label: "Mailgun" },
  { value: "Custom", label: "Custom SMTP Server" },
];

const EmailNodeConfig = memo(function EmailNodeConfig({ data, update }) {
      const [toError, setToError] = useState("");
      const [ccError, setCcError] = useState("");
      const [bccError, setBccError] = useState("");
      const [showPreview, setShowPreview] = useState(false);
      const [headersError, setHeadersError] = useState("");

      const handleProviderChange = (provider) => {
        const presets = {
          Gmail: { host: "smtp.gmail.com", port: 587 },
          Outlook: { host: "smtp.office365.com", port: 587 },
          SendGrid: { host: "smtp.sendgrid.net", port: 587 },
          Mailgun: { host: "smtp.mailgun.org", port: 587 },
        };

        if (presets[provider]) {
          update({
            email_provider: provider,
            email_smtp_server: presets[provider].host,
            email_smtp_port: presets[provider].port,
          });
        } else {
          update({
            email_provider: "Custom",
          });
        }
      };

      const handleHeadersChange = (val) => {
        if (!val.trim()) {
          update({ email_headers: null });
          setHeadersError("");
          return;
        }
        try {
          const parsed = JSON.parse(val);
          if (typeof parsed === "object" && parsed !== null) {
            update({ email_headers: parsed });
            setHeadersError("");
          } else {
            setHeadersError("Headers must be a valid JSON object.");
          }
        } catch (e) {
          setHeadersError("Invalid JSON syntax: " + e.message);
        }
      };

      const headersString = data.email_headers
        ? JSON.stringify(data.email_headers, null, 2)
        : "";

      const validateEmails = (value) => {
        if (!value || !value.trim()) return "";
        const parts = value.split(/[\n,]+/).map(p => p.trim()).filter(Boolean);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidParts = [];
        for (const part of parts) {
          if (part.startsWith("{{") && part.endsWith("}}")) {
            continue;
          }
          if (!emailRegex.test(part)) {
            invalidParts.push(part);
          }
        }
        if (invalidParts.length > 0) {
          return `Invalid format: ${invalidParts.join(", ")}`;
        }
        return "";
      };

      React.useEffect(() => {
        setToError(validateEmails(data.email_to));
      }, [data.email_to]);

      React.useEffect(() => {
        setCcError(validateEmails(data.email_cc));
      }, [data.email_cc]);

      React.useEffect(() => {
        setBccError(validateEmails(data.email_bcc));
      }, [data.email_bcc]);

      return (
        <>
          <VariablePicker
            onSelect={(v) =>
              update({
                email_body: (data.email_body || "") + v,
              })
            }
          />

          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b pb-1">
            Email Connection & Authentication
          </div>
          <Field label="Authentication Method">
            <Select
              value={data.email_auth_method || "smtp"}
              onChange={(v) => update({ email_auth_method: v })}
              options={[
                { value: "smtp", label: "SMTP (Traditional Host/Port)" },
                { value: "oauth", label: "OAuth (Microsoft Graph API)" },
              ]}
            />
          </Field>

          {(data.email_auth_method === "smtp" || !data.email_auth_method) ? (
            <>
              <Field label="SMTP Provider Preset">
                <Select
                  value={data.email_provider || "Custom"}
                  onChange={handleProviderChange}
                  options={PROVIDERS}
                />
              </Field>

              {(data.email_provider === "Custom" || !data.email_provider) ? (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Field label="SMTP Server">
                    <Input
                      value={data.email_smtp_server || ""}
                      onChange={(v) => update({ email_smtp_server: v })}
                      placeholder="smtp.example.com"
                    />
                  </Field>
                  <Field label="SMTP Port">
                    <Input
                      value={data.email_smtp_port || 587}
                      onChange={(v) => {
                        const port = Number.parseInt(v, 10);
                        update({ email_smtp_port: Number.isNaN(port) ? 587 : port });
                      }}
                      placeholder="587"
                    />
                  </Field>
                </div>
              ) : (
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-3 text-xs text-slate-500">
                  <span className="font-semibold block text-slate-700 mb-1">Connection Details (Autofilled):</span>
                  Server: <code className="font-mono text-blue-600">{data.email_smtp_server}</code> · Port: <code className="font-mono text-blue-600">{data.email_smtp_port}</code>
                </div>
              )}

              <Field label="Username / Email">
                <Input
                  value={data.email_user || ""}
                  onChange={(v) => update({ email_user: v })}
                  placeholder="your-email@example.com"
                />
              </Field>
              <Field label="Password / App Password">
                <Input
                  type="password"
                  value={data.email_password || ""}
                  onChange={(v) => update({ email_password: v })}
                  placeholder="••••••••••••••••"
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="Tenant ID" hint="Azure AD / Microsoft Entra Tenant ID">
                <Input
                  value={data.email_tenant_id || ""}
                  onChange={(v) => update({ email_tenant_id: v })}
                  placeholder="00000000-0000-0000-0000-000000000000"
                />
              </Field>
              <Field label="Client ID" hint="Azure App Registration Client (Application) ID">
                <Input
                  value={data.email_client_id || ""}
                  onChange={(v) => update({ email_client_id: v })}
                  placeholder="00000000-0000-0000-0000-000000000000"
                />
              </Field>
              <Field label="Client Secret" hint="Azure App Client Secret">
                <Input
                  type="password"
                  value={data.email_client_secret || ""}
                  onChange={(v) => update({ email_client_secret: v })}
                  placeholder="••••••••••••••••"
                />
              </Field>
              <Field label="Sender Email" hint="Microsoft 365 User Email or Shared Mailbox">
                <Input
                  value={data.email_user || ""}
                  onChange={(v) => update({ email_user: v })}
                  placeholder="sender@yourdomain.com"
                />
              </Field>
            </>
          )}

          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider my-3 border-b pb-1">
            Mail Routing & Addressing
          </div>
          <Field label="To (Recipient)" hint="Supports {{variable}} interpolation. Comma/newline-separated for multiple.">
            <Textarea
              value={data.email_to || ""}
              onChange={(v) => update({ email_to: v })}
              placeholder="recipient@example.com, {{customer_email}}"
              rows={2}
            />
            {toError && <div style={{ color: "#EF4444", fontSize: "11px", marginTop: "4px" }}>{toError}</div>}
          </Field>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Cc" hint="Comma or newline-separated.">
              <Textarea
                value={data.email_cc || ""}
                onChange={(v) => update({ email_cc: v })}
                placeholder="cc@example.com"
                rows={2}
              />
              {ccError && <div style={{ color: "#EF4444", fontSize: "11px", marginTop: "4px" }}>{ccError}</div>}
            </Field>
            <Field label="Bcc" hint="Comma or newline-separated.">
              <Textarea
                value={data.email_bcc || ""}
                onChange={(v) => update({ email_bcc: v })}
                placeholder="bcc@example.com"
                rows={2}
              />
              {bccError && <div style={{ color: "#EF4444", fontSize: "11px", marginTop: "4px" }}>{bccError}</div>}
            </Field>
          </div>

      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider my-3 border-b pb-1">
        Email Content & Customization
      </div>
      <Field label="Subject" hint="Supports {{variable}} interpolation.">
        <Input
          value={data.email_subject || ""}
          onChange={(v) => update({ email_subject: v })}
          placeholder="Email Subject"
        />
      </Field>
      <Field 
        label="Email Body / Template"
        hint="Supports {{variable}} and HTML structure."
        action={
          <button
            onClick={() => setShowPreview(true)}
            title="Preview HTML Render"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--theme-primary)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              fontWeight: 600
            }}
          >
            <FiEye size={14} /> Preview HTML
          </button>
        }
      >
        <Textarea
          value={data.email_body || ""}
          onChange={(v) => update({ email_body: v })}
          placeholder="Hello {{name}},\n\nHere is your report: {{report_data.summary}}"
          rows={7}
        />
      </Field>
      <Toggle
        label="Send as HTML"
        checked={data.email_html || false}
        onChange={(v) => update({ email_html: v })}
      />

      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider my-3 border-b pb-1">
        Advanced Attachments & Headers
      </div>
      <Field label="Attachments" hint="Comma-separated paths or VFS file keys (e.g. report.pdf, ./mnt/file.pdf)">
        <Input
          value={data.email_attachments || ""}
          onChange={(v) => update({ email_attachments: v })}
          placeholder="report.pdf, summary.csv"
        />
      </Field>

      <Field label="SMTP Timeout (seconds)" hint="Connection timeout for SMTP server. Increase for large attachments.">
        <Input
          value={data.email_smtp_timeout ?? 15}
          onChange={(v) => {
            const t = Number.parseInt(v, 10);
            update({ email_smtp_timeout: Number.isNaN(t) ? 15 : t });
          }}
          placeholder="15"
        />
      </Field>

      <Field label="Custom Headers (JSON Object)" hint="Valid JSON keys/values e.g. {'X-Priority': 'High'}">
        <Textarea
          value={headersString}
          onChange={handleHeadersChange}
          placeholder={`{\n  "X-Workflow-Node": "email_sender",\n  "X-Priority": "1"\n}`}
          rows={4}
        />
        {headersError && (
          <span className="text-red-500 text-[10px] mt-1 block font-medium">
            {headersError}
          </span>
        )}
      </Field>

      {showPreview && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(2px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100000
        }}>
          <div style={{
            background: "white",
            width: "700px",
            height: "80%",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
          }}>
            {/* Header */}
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#F8FAFC"
            }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                Email HTML Live Preview
              </span>
              <button 
                onClick={() => setShowPreview(false)}
                style={{
                  background: "none", border: "none", cursor: "pointer", color: "#64748B"
                }}
              >
                <FiX size={18} />
              </button>
            </div>
            {/* Content */}
            <div style={{ flex: 1, padding: "20px", background: "#F1F5F9" }}>
              <iframe
                title="HTML Preview"
                srcDoc={data.email_body || "<p style='color:#64748B; font-family:sans-serif;'>No email body content to preview.</p>"}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  background: "white"
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
});

EmailNodeConfig.propTypes = {
  data: PropTypes.shape({
    email_auth_method: PropTypes.string,
    email_tenant_id: PropTypes.string,
    email_client_id: PropTypes.string,
    email_client_secret: PropTypes.string,
    email_provider: PropTypes.string,
    email_smtp_server: PropTypes.string,
    email_smtp_port: PropTypes.number,
    email_user: PropTypes.string,
    email_password: PropTypes.string,
    email_to: PropTypes.string,
    email_cc: PropTypes.string,
    email_bcc: PropTypes.string,
    email_subject: PropTypes.string,
    email_body: PropTypes.string,
    email_html: PropTypes.bool,
    email_attachments: PropTypes.string,
    email_headers: PropTypes.object,
    email_smtp_timeout: PropTypes.number,
  }).isRequired,
  update: PropTypes.func.isRequired,
};

export default EmailNodeConfig;
