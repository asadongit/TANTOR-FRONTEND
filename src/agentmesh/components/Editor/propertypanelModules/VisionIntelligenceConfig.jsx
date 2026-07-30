import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { FiUploadCloud, FiCheckCircle, FiXCircle, FiTrash2, FiRefreshCw } from "react-icons/fi";
import {
  Select,
  Field,
  Input,
  Textarea,
  Slider,
  InfoBanner,
  AdvancedSection,
  HitlConfigSection,
  LLMConfigSection,
} from "./SharedComponents";

export default function VisionIntelligenceConfig({
  data,
  update,
  nodes,
  selectedNodeId,
}) {
  const currentMode = data.vision_mode || "face_verification";

  // Strip {{ }} wrapper — these key fields expect bare context keys, not template syntax
  const stripBraces = (v) => typeof v === "string" ? v.replace(/^\{\{/, "").replace(/\}\}$/, "") : v;

  // Reference Test Images State for Interactive Quality Tuning
  const [refImages, setRefImages] = useState([]);
  const [aggregateStats, setAggregateStats] = useState(null);
  const fileInputRef = useRef(null);

  // Analyze a single image and return its metrics
  const analyzeSingleImage = useCallback((imageDataUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageDataUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const dataArr = imgData.data;
        const totalPixels = img.width * img.height;

        // 1. Grayscale & Mean Brightness
        let totalBrightness = 0;
        const grayArr = new Float32Array(totalPixels);
        for (let i = 0; i < dataArr.length; i += 4) {
          const gray = 0.299 * dataArr[i] + 0.587 * dataArr[i + 1] + 0.114 * dataArr[i + 2];
          grayArr[i / 4] = gray;
          totalBrightness += gray;
        }
        const meanBrightness = totalBrightness / totalPixels;

        // 2. Contrast (std dev normalized to [0, 1])
        let varianceSum = 0;
        for (let i = 0; i < totalPixels; i++) {
          const diff = grayArr[i] - meanBrightness;
          varianceSum += diff * diff;
        }
        const contrastStdDev = Math.sqrt(varianceSum / totalPixels) / 255.0;

        // 3. Blur (Laplacian Variance approximation)
        let laplacianVarSum = 0;
        const w = img.width;
        const h = img.height;
        let count = 0;
        for (let y = 1; y < h - 1; y += 2) {
          for (let x = 1; x < w - 1; x += 2) {
            const idx = y * w + x;
            const lap = (
              4 * grayArr[idx] -
              grayArr[idx - 1] -
              grayArr[idx + 1] -
              grayArr[idx - w] -
              grayArr[idx + w]
            );
            laplacianVarSum += lap * lap;
            count++;
          }
        }
        const laplacianVariance = count > 0 ? laplacianVarSum / count : 120.0;

        resolve({
          blur: Math.round(laplacianVariance),
          contrast: parseFloat(contrastStdDev.toFixed(4)),
          brightness: Math.round(meanBrightness),
          resolution: Math.min(w, h),
          width: w,
          height: h,
        });
      };
      img.onerror = () => resolve(null);
    });
  }, []);

  // Recompute aggregate stats whenever refImages changes
  const recomputeAggregate = useCallback((images) => {
    if (images.length === 0) {
      setAggregateStats(null);
      return;
    }

    const allMetrics = images.map((img) => img.metrics).filter(Boolean);
    if (allMetrics.length === 0) {
      setAggregateStats(null);
      return;
    }

    const keys = ["blur", "contrast", "brightness", "resolution"];
    const stats = {};
    keys.forEach((key) => {
      const values = allMetrics.map((m) => m[key]).filter((v) => v !== undefined);
      if (values.length === 0) return;
      const sum = values.reduce((a, b) => a + b, 0);
      stats[key] = {
        avg: key === "blur" || key === "brightness" || key === "resolution"
          ? Math.round(sum / values.length)
          : parseFloat((sum / values.length).toFixed(4)),
        min: key === "contrast" ? Math.min(...values) : (key === "blur" || key === "brightness" || key === "resolution" ? Math.round(Math.min(...values)) : Math.min(...values)),
        max: key === "contrast" ? Math.max(...values) : (key === "blur" || key === "brightness" || key === "resolution" ? Math.round(Math.max(...values)) : Math.max(...values)),
      };
    });

    setAggregateStats(stats);
  }, []);

  // Auto-recompute aggregate when refImages changes
  useEffect(() => {
    recomputeAggregate(refImages);
  }, [refImages, recomputeAggregate]);

  const handleFilesSelected = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    // Convert FileList to array to avoid stale reference during async processing
    const fileArray = Array.from(files);
    const newImages = [];
    for (const file of fileArray) {
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (evt) => resolve(evt.target.result);
        reader.readAsDataURL(file);
      });
      const metrics = await analyzeSingleImage(dataUrl);
      newImages.push({
        file,
        name: file.name,
        preview: dataUrl,
        metrics,
      });
    }

    // Use functional update so we don't depend on stale refImages
    setRefImages(prev => [...prev, ...newImages]);
  }, [analyzeSingleImage]);

  const handleFileChange = useCallback((e) => {
    handleFilesSelected(e.target.files);
    e.target.value = "";
  }, [handleFilesSelected]);

  const removeImage = useCallback((index) => {
    setRefImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAllImages = useCallback(() => {
    setRefImages([]);
    setAggregateStats(null);
  }, []);

  // Apply min/max from reference images as thresholds (all images pass)
  const applyMinMax = useCallback(() => {
    if (!aggregateStats) return;
    const updates = {};
    if (aggregateStats.blur) updates.vision_quality_blur_threshold = aggregateStats.blur.min;
    if (aggregateStats.contrast) {
      updates.vision_quality_min_contrast = aggregateStats.contrast.min;
      updates.vision_quality_max_contrast = aggregateStats.contrast.max;
    }
    if (aggregateStats.brightness) {
      updates.vision_quality_min_brightness = aggregateStats.brightness.min;
      updates.vision_quality_max_brightness = aggregateStats.brightness.max;
    }
    if (aggregateStats.resolution) updates.vision_quality_min_shortest_side = aggregateStats.resolution.min;
    update(updates);
  }, [aggregateStats, update]);

  // Reset all thresholds to backend defaults
  const resetToDefaults = useCallback(() => {
    update({
      vision_quality_blur_threshold: 100,
      vision_quality_min_contrast: 0.10,
      vision_quality_max_contrast: 0.45,
      vision_quality_min_brightness: 40,
      vision_quality_max_brightness: 215,
      vision_quality_min_shortest_side: 600,
    });
  }, [update]);

  // Evaluate pass/fail for aggregate stats based on current thresholds
  const evalMetric = useCallback((key, value) => {
    if (value === undefined || value === null) return null;
    switch (key) {
      case "blur":
        return value >= (data.vision_quality_blur_threshold ?? 100);
      case "contrast":
        return value >= (data.vision_quality_min_contrast ?? 0.10) &&
          value <= (data.vision_quality_max_contrast ?? 0.45);
      case "brightness":
        return value >= (data.vision_quality_min_brightness ?? 40) &&
          value <= (data.vision_quality_max_brightness ?? 215);
      case "resolution":
        return value >= (data.vision_quality_min_shortest_side ?? 600);
      default:
        return true;
    }
  }, [data]);

  const overallPass = useMemo(() => {
    if (!aggregateStats) return null;
    const checks = ["blur", "contrast", "brightness", "resolution"].every((key) => {
      const s = aggregateStats[key];
      if (!s) return true;
      return evalMetric(key, s.avg);
    });
    return checks;
  }, [aggregateStats, evalMetric]);

  return (
    <>
      <Field
        label="Vision Operation Mode"
        hint="Select the active computer vision task for this node."
      >
        <Select
          value={currentMode}
          onChange={(v) => update({ vision_mode: v })}
          options={[
            {
              value: "face_verification",
              label: "Biometric Face Verification (InsightFace)",
            },
            {
              value: "ocr",
              label: "Document OCR Extraction (Vision LLM)",
            },
            {
              value: "signature_stamp_detection",
              label: "Signature & Stamp Extraction",
            },
            {
              value: "document_quality_gate",
              label: "Document Image Quality Gate",
            },
            {
              value: "object_detection",
              label: "General Object Detection",
            },
          ]}
        />
      </Field>

      {/* Mode: OCR Extraction */}
      {currentMode === "ocr" && (
        <div style={{ marginTop: 10 }}>
          <Field
            label="OCR Mode"
            hint="Vision uses Cloud LLMs; Standard uses local engines; External sends files to an API service (e.g., DocBot)."
          >
            <Select
              value={data.ocr_engine || "vision"}
              onChange={(v) => update({ ocr_engine: v })}
              options={[
                { value: "vision", label: "Vision OCR (AI/LLM)" },
                { value: "standard", label: "Standard OCR (Local)" },
                { value: "external", label: "External Service (API)" },
              ]}
            />
          </Field>

          {(data.ocr_engine || "vision") === "vision" && (
            <>
              <Field
                label="OCR Instruction / Prompt"
                hint="Instruction for the vision model. Be specific about what data to extract."
              >
                <Textarea
                  value={data.ocr_prompt || "Please perform OCR on this document and return the full text accurately."}
                  onChange={(v) => update({ ocr_prompt: v })}
                  placeholder="e.g. Extract all text from this receipt accurately..."
                />
              </Field>

              <div
                style={{
                  marginTop: 16,
                  borderTop: "1px solid var(--border)",
                  paddingTop: 16,
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
            </div>
          )}

          {data.ocr_engine === "external" && (
            <div
              style={{
                padding: 16,
                background: "#FFF7ED",
                borderRadius: 12,
                border: "1px solid #FED7AA",
                marginTop: 10,
              }}
            >
              <Field label="Service URL" hint="Full URL of the extraction API endpoint.">
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
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <Field
              label="Document Image / File Key"
              hint="Context key containing file path to process. Defaults to 'latest_file_path'."
            >
              <Input
                value={data.ocr_input_key || "latest_file_path"}
                onChange={(v) => update({ ocr_input_key: stripBraces(v) })}
                placeholder="latest_file_path"
              />
            </Field>
          </div>
        </div>
      )}

      {/* Mode 1: Face Verification Configs */}
      {currentMode === "face_verification" && (
        <>
          <Field
            label="ID Document Image Key"
            hint="Context key containing file path or base64 of the ID photo (e.g. Passport/Aadhaar)."
          >
            <Input
              value={data.vision_id_image_key || "latest_file_path"}
              onChange={(v) => update({ vision_id_image_key: stripBraces(v) })}
              placeholder="latest_file_path"
            />
          </Field>

          <Field
            label="Live Selfie Image Key"
            hint="Context key containing file path or base64 of the live camera selfie."
          >
            <Input
              value={data.vision_selfie_image_key || "vcip_capture_path"}
              onChange={(v) => update({ vision_selfie_image_key: stripBraces(v) })}
              placeholder="vcip_capture_path"
            />
          </Field>

          <Field
            label="Match Score Threshold"
            hint="Cosine similarity threshold required to issue a PASS decision (Default: 0.65)."
          >
            <Slider
              value={data.vision_face_match_threshold ?? 0.65}
              min={0.0}
              max={1.0}
              step={0.05}
              onChange={(v) => update({ vision_face_match_threshold: v })}
            />
          </Field>
        </>
      )}

      {/* Mode 2: Signature & Stamp Detection */}
      {currentMode === "signature_stamp_detection" && (
        <>
          <Field
            label="Document Image / PDF Source Key"
            hint="Context key containing document file path (image/PDF) or base64 to scan."
          >
            <Input
              value={data.vision_id_image_key || data.extractor_input_key || "latest_file_path"}
              onChange={(v) =>
                update({
                  vision_id_image_key: stripBraces(v),
                  extractor_input_key: stripBraces(v),
                })
              }
              placeholder="latest_file_path"
            />
          </Field>

          <Field
            label="Extraction Mode / AI Engine"
            hint="Choose between fast local CV candidate bounding boxes or Vision LLM AI text OCR analysis."
          >
            <Select
              value={data.vision_enable_llm ? "llm" : "cv"}
              onChange={(v) => update({ vision_enable_llm: v === "llm" })}
              options={[
                {
                  value: "llm",
                  label: "Vision LLM Enabled (Deep AI OCR & Analysis)",
                },
                {
                  value: "cv",
                  label: "CV-Only Detection (Fast Local Ink Bounding Boxes)",
                },
              ]}
            />
          </Field>

          {data.vision_enable_llm && (
            <div style={{ marginTop: 12, padding: 12, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-primary)" }}>
              <LLMConfigSection data={data} update={update} />
            </div>
          )}
        </>
      )}

      {/* Mode 3: Document Quality Gate */}
      {currentMode === "document_quality_gate" && (
        <>
          <Field
            label="Document Image Source Key"
            hint="Context key containing the image to check for blur, contrast, brightness, and resolution."
          >
            <Input
              value={data.vision_id_image_key || "latest_file_path"}
              onChange={(v) => update({ vision_id_image_key: stripBraces(v) })}
              placeholder="latest_file_path"
            />
          </Field>

          <Field
            label="Minimum Overall Quality Score"
            hint="Minimum composite score required to pass quality check (Default: 0.70)."
          >
            <Slider
              value={data.vision_quality_min_score ?? 0.70}
              min={0.0}
              max={1.0}
              step={0.05}
              onChange={(v) => update({ vision_quality_min_score: v })}
            />
          </Field>

          <Field
            label="Blur Threshold (Laplacian Variance)"
            hint="Lower values = more sensitive to blur. Default: 100. Increase if sharp images fail."
          >
            <Slider
              value={data.vision_quality_blur_threshold ?? 100}
              min={10}
              max={500}
              step={5}
              onChange={(v) => update({ vision_quality_blur_threshold: v })}
            />
          </Field>

          <Field
            label="Min Contrast (Normalised Std-Dev)"
            hint="Minimum contrast. Default: 0.10. Increase if washed-out images pass."
          >
            <Slider
              value={data.vision_quality_min_contrast ?? 0.10}
              min={0.0}
              max={0.50}
              step={0.01}
              onChange={(v) => update({ vision_quality_min_contrast: v })}
            />
          </Field>

          <Field
            label="Max Contrast (Normalised Std-Dev)"
            hint="Maximum contrast. Default: 0.45. Decrease if harsh shadows pass."
          >
            <Slider
              value={data.vision_quality_max_contrast ?? 0.45}
              min={0.20}
              max={0.90}
              step={0.01}
              onChange={(v) => update({ vision_quality_max_contrast: v })}
            />
          </Field>

          <Field
            label="Min Brightness (Mean Pixel Intensity)"
            hint="Minimum brightness. Default: 40. Values below = underexposed/dark."
          >
            <Slider
              value={data.vision_quality_min_brightness ?? 40}
              min={0}
              max={100}
              step={5}
              onChange={(v) => update({ vision_quality_min_brightness: v })}
            />
          </Field>

          <Field
            label="Max Brightness (Mean Pixel Intensity)"
            hint="Maximum brightness. Default: 215. Values above = overexposed/glare."
          >
            <Slider
              value={data.vision_quality_max_brightness ?? 215}
              min={150}
              max={255}
              step={5}
              onChange={(v) => update({ vision_quality_max_brightness: v })}
            />
          </Field>

          <Field
            label="Min Shortest Side (Pixels)"
            hint="Minimum shortest-side resolution for OCR legibility. Default: 600px."
          >
            <Slider
              value={data.vision_quality_min_shortest_side ?? 600}
              min={200}
              max={2000}
              step={50}
              unit="px"
              onChange={(v) => update({ vision_quality_min_shortest_side: v })}
            />
          </Field>

          {/* Reference Image Threshold Tester (Multi-Image) */}
          <div style={{
            marginTop: 20,
            marginBottom: 20,
            padding: 14,
            background: "var(--bg-primary, #FAFBFC)",
            border: "1px solid var(--border)",
            borderRadius: 10,
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                Reference Image Threshold Tester
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                {refImages.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllImages}
                    style={{
                      padding: "4px 8px",
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#DC2626",
                      background: "#FEF2F2",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <FiTrash2 size={12} /> Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "4px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#7E22CE",
                    background: "#F3E8FF",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <FiUploadCloud size={14} /> {refImages.length > 0 ? "Add More" : "Upload Images"}
                </button>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            {refImages.length > 0 && aggregateStats ? (
              <>
                {/* Thumbnail Strip */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {refImages.map((img, i) => (
                    <div key={i} style={{ position: "relative", width: 48, height: 48 }}>
                      <img
                        src={img.preview}
                        alt={img.name}
                        style={{
                          width: 48, height: 48, objectFit: "cover",
                          borderRadius: 6, border: "1px solid var(--border)",
                        }}
                        title={`${img.name}\nBlur: ${img.metrics?.blur}\nContrast: ${img.metrics?.contrast}\nBrightness: ${img.metrics?.brightness}\nRes: ${img.metrics?.resolution}px`}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        style={{
                          position: "absolute", top: -4, right: -4,
                          width: 16, height: 16, borderRadius: "50%",
                          background: "#DC2626", color: "white", border: "1px solid white",
                          fontSize: 9, cursor: "pointer", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          padding: 0, lineHeight: 1,
                        }}
                        title={`Remove ${img.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* Aggregate Stats Table */}
                <div style={{ fontSize: 11, marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                    Overall ({refImages.length} images):{" "}
                    {overallPass ? (
                      <span style={{ color: "#16A34A", display: "flex", alignItems: "center", gap: 2 }}>
                        <FiCheckCircle /> PASS
                      </span>
                    ) : (
                      <span style={{ color: "#DC2626", display: "flex", alignItems: "center", gap: 2 }}>
                        <FiXCircle /> FAIL
                      </span>
                    )}
                  </div>

                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                    <thead>
                      <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                        <th style={{ textAlign: "left", padding: "2px 4px", fontWeight: 600 }}>Metric</th>
                        <th style={{ textAlign: "center", padding: "2px 4px", fontWeight: 600 }}>Avg</th>
                        <th style={{ textAlign: "center", padding: "2px 4px", fontWeight: 600 }}>Min</th>
                        <th style={{ textAlign: "center", padding: "2px 4px", fontWeight: 600 }}>Max</th>
                        <th style={{ textAlign: "right", padding: "2px 4px", fontWeight: 600 }}>Threshold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: "blur", label: "Blur", unit: "", req: `≥${data.vision_quality_blur_threshold ?? 100}` },
                        { key: "contrast", label: "Contrast", unit: "", req: `${Number(data.vision_quality_min_contrast ?? 0.10).toFixed(4)}–${Number(data.vision_quality_max_contrast ?? 0.45).toFixed(4)}` },
                        { key: "brightness", label: "Brightness", unit: "", req: `${data.vision_quality_min_brightness ?? 40}–${data.vision_quality_max_brightness ?? 215}` },
                        { key: "resolution", label: "Resolution", unit: "px", req: `≥${data.vision_quality_min_shortest_side ?? 600}` },
                      ].map(({ key, label, unit, req }) => {
                        const s = aggregateStats[key];
                        if (!s) return null;
                        const avgPass = evalMetric(key, s.avg);
                        return (
                          <tr key={key} style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "3px 4px", fontWeight: 600 }}>{label}</td>
                            <td style={{ textAlign: "center", padding: "3px 4px", color: avgPass ? "#16A34A" : "#DC2626", fontWeight: 700 }}>{s.avg}{unit}</td>
                            <td style={{ textAlign: "center", padding: "3px 4px", color: "var(--text-muted)" }}>{s.min}{unit}</td>
                            <td style={{ textAlign: "center", padding: "3px 4px", color: "var(--text-muted)" }}>{s.max}{unit}</td>
                            <td style={{ textAlign: "right", padding: "3px 4px", color: "var(--text-muted)", fontSize: 9 }}>{req}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Apply / Reset Buttons */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={applyMinMax}
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#7E22CE",
                      background: "#F3E8FF",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                    title="Set thresholds to min/max of your reference images so all pass"
                  >
                    <FiCheckCircle size={13} /> Apply Min/Max
                  </button>
                  <button
                    type="button"
                    onClick={resetToDefaults}
                    style={{
                      padding: "6px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#64748B",
                      background: "#F1F5F9",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                    title="Reset all thresholds to default values"
                  >
                    <FiRefreshCw size={13} /> Reset Defaults
                  </button>
                </div>
              </>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "1px dashed var(--border)",
                  borderRadius: 8,
                  padding: "16px 10px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: 11,
                  cursor: "pointer",
                  background: "white",
                }}
              >
                Upload sample document images to test & tune thresholds. Supports multi-select.
              </div>
            )}
          </div>
        </>
      )}

      {/* Mode 4: Object Detection */}
      {currentMode === "object_detection" && (
        <Field
          label="Source Image Key"
          hint="Context key containing the image path or base64 to inspect."
        >
          <Input
            value={data.vision_id_image_key || "latest_file_path"}
            onChange={(v) => update({ vision_id_image_key: stripBraces(v) })}
            placeholder="latest_file_path"
          />
        </Field>
      )}

      {/* Common Output Key */}
      <Field
        label="Output Destination Key"
        hint="Context key where the result object will be saved in workflow state."
      >
        <Input
          value={data.vision_output_key || "vision_result"}
          onChange={(v) => update({ vision_output_key: stripBraces(v) })}
          placeholder="vision_result"
        />
      </Field>

      <AdvancedSection
        hitlSection={<HitlConfigSection data={data} update={update} />}
        nodes={nodes}
        selectedNodeId={selectedNodeId}
        onErrorValue={data.on_error}
        onErrorChange={(v) => update({ on_error: v })}
      />
    </>
  );
}
