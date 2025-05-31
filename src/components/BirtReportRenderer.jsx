import React, { useState } from "react";

const formatOptions = [
  { value: "pdf", label: "PDF" },
  { value: "xls", label: "Excel" },
  { value: "doc", label: "Word" },
  { value: "ppt", label: "PowerPoint" },
  { value: "html", label: "HTML" },
];

const BirtReportRenderer = ({ reportName, serverUrl, parameterDefs = [] }) => {
  const [format, setFormat] = useState("pdf");
  const [reportUrl, setReportUrl] = useState("");
  const [params, setParams] = useState({});

  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const buildUrl = () => {
    let url = `${serverUrl}/run?__report=${encodeURIComponent(reportName)}&__format=${format}`;
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      }
    });
    return url;
  };

  const handleGenerate = () => {
    setReportUrl(buildUrl());
  };

  const handleDownload = () => {
    window.open(reportUrl, "_blank");
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 8 }}>Format:</label>
        <select value={format} onChange={e => setFormat(e.target.value)}>
          {formatOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {parameterDefs.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4>Parameters</h4>
          {parameterDefs.map(param => (
            <div key={param.name} style={{ marginBottom: 8 }}>
              <label style={{ marginRight: 8 }}>{param.label || param.name}:</label>
              <input
                type="text"
                value={params[param.name] || ""}
                onChange={e => handleParamChange(param.name, e.target.value)}
                placeholder={param.placeholder || ""}
              />
            </div>
          ))}
        </div>
      )}
      <button onClick={handleGenerate} style={{ marginBottom: 16 }}>Generate</button>
      {reportUrl && (
        <div style={{ marginTop: 20 }}>
          {(format === "pdf" || format === "html") && (
            <iframe
              src={reportUrl}
              title="BIRT Report"
              width="100%"
              height="600px"
              style={{ border: "1px solid #ccc" }}
            />
          )}
          {["xls", "doc", "ppt"].includes(format) && (
            <button onClick={handleDownload} style={{ marginTop: 16 }}>
              Download {formatOptions.find(opt => opt.value === format)?.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BirtReportRenderer; 