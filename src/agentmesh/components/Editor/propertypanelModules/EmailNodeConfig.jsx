import React, { memo, useState } from "react";
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
        SMTP Provider & Connection
      </div>
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

      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider my-3 border-b pb-1">
        Mail Routing & Addressing
      </div>
      <Field label="To (Recipient)" hint="Supports {{variable}} interpolation. Comma-separated for multiple.">
        <Input
          value={data.email_to || ""}
          onChange={(v) => update({ email_to: v })}
          placeholder="recipient@example.com"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="Cc" hint="Comma-separated emails.">
          <Input
            value={data.email_cc || ""}
            onChange={(v) => update({ email_cc: v })}
            placeholder="cc@example.com"
          />
        </Field>
        <Field label="Bcc" hint="Comma-separated emails.">
          <Input
            value={data.email_bcc || ""}
            onChange={(v) => update({ email_bcc: v })}
            placeholder="bcc@example.com"
          />
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
      <Field label="Email Body / Template" hint="Supports {{variable}} and HTML structure.">
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
    </>
  );
});

EmailNodeConfig.propTypes = {
  data: PropTypes.shape({
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
