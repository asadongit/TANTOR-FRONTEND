import React from "react";
import PropTypes from "prop-types";
import { useWorkflowStore, useRunStore, useUIStore } from "../../store";
import {
  explainWorkflow,
  chatArchitect,
  createWorkflowNote,
  createSkill,
} from "../../api/agentmesh";
import {
  FiX,
  FiAlertTriangle,
  FiCopy,
  FiCheck,
  FiBookOpen,
  FiZap,
  FiLoader,
  FiMaximize2,
  FiMinimize2,
  FiSend,
  FiRotateCcw,
  FiCode,
  FiFileText,
} from "react-icons/fi";
import { HugeiconsIcon } from "@hugeicons/react";
import { AiMagicIcon } from "@hugeicons/core-free-icons";
import { formatMessage } from "../Common/messageFormatting";
import { copyToClipboard } from "../../utils/copyToClipboard";

export default function ArchitectBot({ isOpen, onClose }) {
  const { workflowName, workflowDescription, workflowId, nodes, edges } =
    useWorkflowStore();

  const { selectedNodeId } = useUIStore();
  const setNodeData = useWorkflowStore((s) => s.setNodeData);

  const [mode, setMode] = React.useState("none"); // 'none' | 'explain' | 'explorer' | 'write_skill' | 'write_prompt'
  const [architectExpanded, setArchitectExpanded] = React.useState(false);
  const [architectExplanation, setArchitectExplanation] = React.useState("");
  const [explaining, setExplaining] = React.useState(false);
  const [architectError, setArchitectError] = React.useState("");
  const [copiedExplanation, setCopiedExplanation] = React.useState(false);
  const [savedToNotes, setSavedToNotes] = React.useState(false);
  const [savingNote, setSavingNote] = React.useState(false);
  const [architectMessages, setArchitectMessages] = React.useState([]);
  const [architectInput, setArchitectInput] = React.useState("");
  const [sendingMessage, setSendingMessage] = React.useState(false);

  // Skill Write States
  const [skillInput, setSkillInput] = React.useState("");
  const [skillGenerating, setSkillGenerating] = React.useState(false);
  const [skillName, setSkillName] = React.useState("");
  const [skillDesc, setSkillDesc] = React.useState("");
  const [skillTags, setSkillTags] = React.useState("");
  const [skillContent, setSkillContent] = React.useState("");
  const [skillSaved, setSkillSaved] = React.useState(false);

  // Prompt Write States
  const [promptInput, setPromptInput] = React.useState("");
  const [promptGenerating, setPromptGenerating] = React.useState(false);
  const [promptResult, setPromptResult] = React.useState("");
  const [promptApplied, setPromptApplied] = React.useState(false);

  const handleReset = () => {
    setMode("none");
    setArchitectExplanation("");
    setArchitectError("");
    setArchitectMessages([]);
    setArchitectInput("");
    setSavedToNotes(false);
    // Skill states
    setSkillInput("");
    setSkillName("");
    setSkillDesc("");
    setSkillTags("");
    setSkillContent("");
    setSkillSaved(false);
    // Prompt states
    setPromptInput("");
    setPromptResult("");
    setPromptApplied(false);
  };

  React.useEffect(() => {
    handleReset();
  }, [workflowId]);

  const hasNodes = nodes.some(
    (n) => n.id !== "__start__" && n.id !== "__end__",
  );
  const targetNode = nodes.find((n) => n.id === selectedNodeId);

  const handleGenerateExplanation = async () => {
    setMode("explain");
    setExplaining(true);
    setArchitectError("");
    setArchitectExplanation("");
    setArchitectMessages([]);
    setSavedToNotes(false);

    const workflowPayload = {
      id: workflowId,
      name: workflowName,
      description: workflowDescription,
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type,
        data: {
          type: n.data?.type,
          label: n.data?.label,
          task: n.data?.task,
          description: n.data?.description,
          tools: n.data?.tools,
          poller_tool: n.data?.poller_tool,
          cron_expression: n.data?.cron_expression,
          webhook_path: n.data?.webhook_path,
        },
      })),
      edges: (edges || []).map((e) => ({
        source: e.source,
        target: e.target,
        data: {
          condition: e.data?.condition,
        },
      })),
    };

    try {
      const cachedProvider =
        localStorage.getItem("architect_provider") || "groq";
      const cachedModel =
        localStorage.getItem("architect_model") || "llama-3.3-70b-versatile";
      const cachedTemp = localStorage.getItem("architect_temperature") || "0.2";
      const cachedKey = localStorage.getItem("architect_api_key") || "";
      const activeLlm = {
        provider: cachedProvider,
        model: cachedModel,
        temperature: Number.parseFloat(cachedTemp),
        api_key_override: cachedKey,
      };
      const res = await explainWorkflow(workflowPayload, activeLlm);
      if (res.status === "success") {
        setArchitectExplanation(res.explanation);
        setArchitectMessages([{ role: "assistant", content: res.explanation }]);
      } else {
        setArchitectError(res.message || "Failed to generate summary.");
      }
    } catch (err) {
      setArchitectError(err.message || "Failed to connect to backend.");
    } finally {
      setExplaining(false);
    }
  };

  const handleExploreData = async () => {
    setMode("explorer");
    setExplaining(true);
    setArchitectError("");
    setArchitectExplanation("");
    setArchitectMessages([]);
    setSavedToNotes(false);

    const liveContext = useRunStore.getState().latestContext || {};

    if (!liveContext || Object.keys(liveContext).length === 0) {
      setArchitectMessages([
        {
          role: "assistant",
          content:
            "I am ready to explore your live execution variables. Currently, there is no active runtime context. Please execute your workflow first (e.g. run a test or execute a node), then I can assist you with explaining and querying your run variables!",
        },
      ]);
      setArchitectExplanation("No context available.");
      setExplaining(false);
      return;
    }

    const workflowPayload = {
      id: workflowId,
      name: workflowName,
      description: workflowDescription,
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type,
        data: {
          type: n.data?.type,
          label: n.data?.label,
          task: n.data?.task,
          description: n.data?.description,
        },
      })),
      edges: (edges || []).map((e) => ({
        source: e.source,
        target: e.target,
        data: {
          condition: e.data?.condition,
        },
      })),
    };

    const initialMessages = [
      {
        role: "user",
        content:
          "Analyze the current execution variables and summarize what data is flowing through this workflow.",
      },
    ];

    try {
      const cachedProvider =
        localStorage.getItem("architect_provider") || "groq";
      const cachedModel =
        localStorage.getItem("architect_model") || "llama-3.3-70b-versatile";
      const cachedTemp = localStorage.getItem("architect_temperature") || "0.2";
      const cachedKey = localStorage.getItem("architect_api_key") || "";
      const activeLlm = {
        provider: cachedProvider,
        model: cachedModel,
        temperature: Number.parseFloat(cachedTemp),
        api_key_override: cachedKey,
      };

      const res = await chatArchitect(
        workflowPayload,
        liveContext,
        initialMessages,
        activeLlm,
      );
      if (res.status === "success") {
        setArchitectExplanation(res.reply);
        setArchitectMessages([{ role: "assistant", content: res.reply }]);
      } else {
        setArchitectError(res.message || "Failed to analyze variables.");
      }
    } catch (err) {
      setArchitectError(err.message || "Failed to connect to backend.");
    } finally {
      setExplaining(false);
    }
  };

  // Generate Skill SOP with AI
  const handleGenerateSkill = async () => {
    if (!skillInput.trim()) return;
    setSkillGenerating(true);
    setArchitectError("");
    try {
      const activeLlm = {
        provider: localStorage.getItem("architect_provider") || "groq",
        model:
          localStorage.getItem("architect_model") || "llama-3.3-70b-versatile",
        temperature: 0.2,
      };

      const payloadPrompt = `Create a new Agent Skill based on this request: "${skillInput}".
You must structure your response EXACTLY as follows, using the exact tags shown below to separate the sections. Do not use JSON.

---NAME---
[A unique identifier matching ^[a-z0-9][a-z0-9-]*[a-z0-9]$ (lowercase letters, digits, and single hyphens only, e.g. "email-validator")]

---DESCRIPTION---
[A concise explanation of what the skill does, minimum 20 characters, maximum 1024 characters]

---TAGS---
[A comma-separated list of tags for this skill, e.g. "database, clean, process"]

---CONTENT---
[The detailed professional step-by-step SOP or Python script content for this skill]`;

      const res = await chatArchitect(
        {
          id: workflowId,
          name: workflowName,
          description: workflowDescription,
          nodes: [],
          edges: [],
        },
        {},
        [{ role: "user", content: payloadPrompt }],
        activeLlm,
      );

      if (res.status === "success") {
        const text = res.reply.trim();
        let name = "";
        let desc = "";
        let tags = "";
        let content = "";

        if (
          text.includes("---NAME---") &&
          text.includes("---DESCRIPTION---") &&
          text.includes("---TAGS---") &&
          text.includes("---CONTENT---")
        ) {
          const namePart = text
            .split("---NAME---")[1]
            ?.split("---DESCRIPTION---")[0];
          const descPart = text
            .split("---DESCRIPTION---")[1]
            ?.split("---TAGS---")[0];
          const tagsPart = text
            .split("---TAGS---")[1]
            ?.split("---CONTENT---")[0];
          const contentPart = text.split("---CONTENT---")[1];

          name = namePart ? namePart.trim() : "";
          desc = descPart ? descPart.trim() : "";
          tags = tagsPart ? tagsPart.trim() : "";
          content = contentPart ? contentPart.trim() : "";
        } else if (
          text.includes("---NAME---") &&
          text.includes("---DESCRIPTION---") &&
          text.includes("---CONTENT---")
        ) {
          const namePart = text
            .split("---NAME---")[1]
            ?.split("---DESCRIPTION---")[0];
          const descPart = text
            .split("---DESCRIPTION---")[1]
            ?.split("---CONTENT---")[0];
          const contentPart = text.split("---CONTENT---")[1];

          name = namePart ? namePart.trim() : "";
          desc = descPart ? descPart.trim() : "";
          content = contentPart ? contentPart.trim() : "";
        } else {
          // Fallback to JSON parse in case the LLM returned JSON
          try {
            let jsonText = text;
            if (jsonText.startsWith("```")) {
              jsonText = jsonText
                .replace(/^```(json)?/, "")
                .replace(/```$/, "")
                .trim();
            }
            const parsed = JSON.parse(jsonText);
            name = parsed.name || "";
            desc = parsed.description || "";
            content = parsed.content || "";
            if (parsed.tags) {
              tags = Array.isArray(parsed.tags)
                ? parsed.tags.join(", ")
                : parsed.tags;
            }
          } catch (jsonErr) {
            throw new Error(
              "Could not parse the generated skill format. Please try again.",
            );
          }
        }

        // Clean name to comply with strict backend validation regex: ^[a-z0-9][a-z0-9-]*[a-z0-9]$
        const cleanedName = name
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
          .substring(0, 64);

        setSkillName(cleanedName);
        setSkillDesc(desc);
        setSkillTags(tags);
        setSkillContent(content);
      } else {
        setArchitectError(res.message || "Failed to generate skill.");
      }
    } catch (err) {
      setArchitectError("Failed to parse generated skill: " + err.message);
    } finally {
      setSkillGenerating(false);
    }
  };

  const handleSaveSkill = async () => {
    if (!skillName.trim() || !skillDesc.trim() || !skillContent.trim()) {
      alert("Please fill out all fields.");
      return;
    }
    setSavingNote(true);
    try {
      const generatedTags = skillTags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const finalTags = Array.from(new Set([...generatedTags, "architect"]));

      await createSkill({
        name: skillName,
        description: skillDesc,
        content: skillContent,
        tags: finalTags,
      });
      setSkillSaved(true);
      setTimeout(() => {
        handleReset();
      }, 1500);
    } catch (err) {
      alert("Failed to save skill: " + err.message);
    } finally {
      setSavingNote(false);
    }
  };

  // Generate Prompt with AI
  const handleGeneratePrompt = async () => {
    if (!promptInput.trim()) return;
    setPromptGenerating(true);
    setArchitectError("");
    try {
      const activeLlm = {
        provider: localStorage.getItem("architect_provider") || "groq",
        model:
          localStorage.getItem("architect_model") || "llama-3.3-70b-versatile",
        temperature: 0.2,
      };

      const nodeContext = targetNode
        ? `\nTarget Node: ${targetNode.data?.label || targetNode.id} (${targetNode.data?.type})\nCurrent Prompt/Task: "${targetNode.data?.task || targetNode.data?.ocr_prompt || ""}"`
        : "";

      const payloadPrompt = `Optimize and write a highly detailed, professional instruction prompt for an AI agent to perform this task: "${promptInput}".${nodeContext}
Include clear guidelines, input/output structures, and agent behavior constraints. Return only the optimized prompt.`;

      const res = await chatArchitect(
        {
          id: workflowId,
          name: workflowName,
          description: workflowDescription,
          nodes: [],
          edges: [],
        },
        {},
        [{ role: "user", content: payloadPrompt }],
        activeLlm,
      );

      if (res.status === "success") {
        setPromptResult(res.reply);
      } else {
        setArchitectError(res.message || "Failed to generate prompt.");
      }
    } catch (err) {
      setArchitectError(err.message || "Failed to generate prompt.");
    } finally {
      setPromptGenerating(false);
    }
  };

  const handleApplyPrompt = () => {
    if (!selectedNodeId || !promptResult) return;
    const type = targetNode.data?.type;
    let field = "task";
    if (type === "ocr_node") field = "ocr_prompt";
    else if (type === "set_data") field = "message";
    else if (type === "template_node") field = "template_content";

    setNodeData(selectedNodeId, { [field]: promptResult });
    setPromptApplied(true);
    setTimeout(() => setPromptApplied(false), 2000);
  };

  const handleRegenerate = () => {
    if (mode === "explain") {
      handleGenerateExplanation();
    } else if (mode === "explorer") {
      handleExploreData();
    }
  };

  const handleSendArchitectMessage = async (e) => {
    if (e) e.preventDefault();
    if (!architectInput.trim() || sendingMessage) return;

    const userMsg = { role: "user", content: architectInput };
    const newMessages = [...architectMessages, userMsg];
    setArchitectMessages(newMessages);
    setArchitectInput("");
    setSendingMessage(true);
    setArchitectError("");

    const workflowPayload = {
      id: workflowId,
      name: workflowName,
      description: workflowDescription,
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type,
        data: {
          type: n.data?.type,
          label: n.data?.label,
          task: n.data?.task,
          description: n.data?.description,
          tools: n.data?.tools,
          poller_tool: n.data?.poller_tool,
          cron_expression: n.data?.cron_expression,
          webhook_path: n.data?.webhook_path,
        },
      })),
      edges: (edges || []).map((e) => ({
        source: e.source,
        target: e.target,
        data: {
          condition: e.data?.condition,
        },
      })),
    };

    const liveContext = useRunStore.getState().latestContext || {};

    try {
      const cachedProvider =
        localStorage.getItem("architect_provider") || "groq";
      const cachedModel =
        localStorage.getItem("architect_model") || "llama-3.3-70b-versatile";
      const cachedTemp = localStorage.getItem("architect_temperature") || "0.2";
      const cachedKey = localStorage.getItem("architect_api_key") || "";
      const activeLlm = {
        provider: cachedProvider,
        model: cachedModel,
        temperature: Number.parseFloat(cachedTemp),
        api_key_override: cachedKey,
      };

      const res = await chatArchitect(
        workflowPayload,
        liveContext,
        newMessages,
        activeLlm,
      );
      if (res.status === "success") {
        setArchitectMessages([
          ...newMessages,
          { role: "assistant", content: res.reply },
        ]);
        setArchitectExplanation(res.reply);
      } else {
        setArchitectError(res.message || "Failed to get reply.");
      }
    } catch (err) {
      setArchitectError(err.message || "Failed to connect to backend.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCopyExplanation = () => {
    copyToClipboard(architectExplanation);
    setCopiedExplanation(true);
    setTimeout(() => setCopiedExplanation(false), 2000);
  };

  const handleSaveToNotes = async () => {
    setSavingNote(true);
    try {
      await createWorkflowNote(workflowId, architectExplanation, "Architect");
      setSavedToNotes(true);
    } catch (err) {
      alert("Failed to save to notes: " + err.message);
    } finally {
      setSavingNote(false);
    }
  };

  ArchitectBot.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 10000,
        fontFamily: "inherit",
        width: architectExpanded ? 750 : 480,
        maxWidth: "92vw",
        height: architectExpanded ? "85vh" : "620px",
        maxHeight: "90vh",
        background: "rgba(255, 255, 255, 0.98)",
        backdropFilter: "blur(20px)",
        borderRadius: 20,
        border: "1px solid #E2E8F0",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style>{`
        @keyframes subtle-fade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-subtle {
          animation: subtle-fade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .modern-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .modern-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .modern-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 99px;
        }
        .modern-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
        .orb-loading {
          width: 6px;
          height: 6px;
          background: var(--theme-primary);
          border-radius: 50%;
          animation: bounce 0.6s infinite alternate;
        }
        .orb-loading-2 { animation-delay: 0.2s; }
        .orb-loading-3 { animation-delay: 0.4s; }
        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-6px); }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #F1F5F9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#FCFDFE",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "var(--theme-primary-glow)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--theme-primary)",
              flexShrink: 0,
            }}
          >
            <HugeiconsIcon icon={AiMagicIcon} size={14} />
          </div>
          <div>
            <h3
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#0F172A",
                margin: 0,
              }}
            >
              Architect AI
            </h3>
            <p
              style={{
                fontSize: 10,
                color: "#64748B",
                margin: "2px 0 0",
                fontWeight: 500,
              }}
            >
              {mode === "explain"
                ? "Workflow Walkthrough"
                : mode === "explorer"
                  ? "Context Explorer"
                  : mode === "write_skill"
                    ? "Write Skill"
                    : mode === "write_prompt"
                      ? "Write Prompt"
                      : "AI Assistant"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {mode !== "none" && (
            <button
              onClick={handleReset}
              title="Reset Session"
              style={{
                background: "none",
                border: "none",
                color: "#64748B",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 600,
                gap: 4,
                transition: "all 0.2s",
                border: "1px solid #E2E8F0",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F8FAFC";
                e.currentTarget.style.color = "#0F172A";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = "#64748B";
              }}
            >
              <FiRotateCcw size={11} /> Reset
            </button>
          )}
          <button
            onClick={() => setArchitectExpanded(!architectExpanded)}
            title={architectExpanded ? "Collapse" : "Expand"}
            style={{
              background: "none",
              border: "none",
              color: "#64748B",
              cursor: "pointer",
              padding: 5,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            {architectExpanded ? (
              <FiMinimize2 size={15} />
            ) : (
              <FiMaximize2 size={15} />
            )}
          </button>
          <button
            onClick={onClose}
            title="Close"
            style={{
              background: "none",
              border: "none",
              color: "#64748B",
              cursor: "pointer",
              padding: 5,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <FiX size={15} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          padding: "20px",
          overflowY: "auto",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
        className="modern-scrollbar"
      >
        {mode === "none" ? (
          <div
            className="animate-subtle"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              gap: 20,
            }}
          >
            <div
              style={{ textAlign: "center", maxWidth: 360, marginBottom: 4 }}
            >
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#0F172A",
                  margin: "0 0 6px 0",
                }}
              >
                Workspace AI
              </h3>
              <p
                style={{
                  fontSize: 11,
                  color: "#64748B",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Select a task to analyze, explore, generate custom skills, or
                write prompts.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                width: "100%",
                maxWidth: 440,
              }}
            >
              {/* Explain Workflow */}
              <button
                onClick={handleGenerateExplanation}
                disabled={!hasNodes}
                style={{
                  padding: "16px",
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 12,
                  cursor: hasNodes ? "pointer" : "not-allowed",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 10,
                  transition: "all 0.2s",
                  opacity: !hasNodes ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (hasNodes) {
                    e.currentTarget.style.borderColor = "var(--theme-primary)";
                    e.currentTarget.style.background = "white";
                  }
                }}
                onMouseLeave={(e) => {
                  if (hasNodes) {
                    e.currentTarget.style.borderColor = "#E2E8F0";
                    e.currentTarget.style.background = "#F8FAFC";
                  }
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: "var(--theme-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                  }}
                >
                  <FiZap size={14} />
                </div>
                <div>
                  <div
                    style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}
                  >
                    Explain Workflow
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "#64748B",
                      marginTop: 2,
                      lineHeight: 1.3,
                    }}
                  >
                    Walkthrough route overview.
                  </div>
                </div>
              </button>

              {/* Explore Data */}
              <button
                onClick={handleExploreData}
                style={{
                  padding: "16px",
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 12,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 10,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--theme-primary)";
                  e.currentTarget.style.background = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.background = "#F8FAFC";
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: "#06B6D4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                  }}
                >
                  <FiBookOpen size={14} />
                </div>
                <div>
                  <div
                    style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}
                  >
                    Explore Data
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "#64748B",
                      marginTop: 2,
                      lineHeight: 1.3,
                    }}
                  >
                    Inspect live variables.
                  </div>
                </div>
              </button>

              {/* Write Skill */}
              <button
                onClick={() => setMode("write_skill")}
                style={{
                  padding: "16px",
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 12,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 10,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--theme-primary)";
                  e.currentTarget.style.background = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.background = "#F8FAFC";
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: "#10B981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                  }}
                >
                  <FiCode size={14} />
                </div>
                <div>
                  <div
                    style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}
                  >
                    Write Skill
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "#64748B",
                      marginTop: 2,
                      lineHeight: 1.3,
                    }}
                  >
                    Generate a custom SOP skill.
                  </div>
                </div>
              </button>

              {/* Write Prompt */}
              <button
                onClick={() => setMode("write_prompt")}
                style={{
                  padding: "16px",
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 12,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 10,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--theme-primary)";
                  e.currentTarget.style.background = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.background = "#F8FAFC";
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: "#F59E0B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                  }}
                >
                  <FiFileText size={14} />
                </div>
                <div>
                  <div
                    style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}
                  >
                    Write Prompt
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "#64748B",
                      marginTop: 2,
                      lineHeight: 1.3,
                    }}
                  >
                    Optimize & write agent tasks.
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : mode === "write_skill" ? (
          <div
            className="animate-subtle"
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: 12,
            }}
          >
            {/* Error Message */}
            {architectError && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  borderRadius: 10,
                  color: "#991B1B",
                  fontSize: 11,
                  fontWeight: 550,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <FiAlertTriangle size={14} /> {architectError}
              </div>
            )}

            {!skillName ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  flex: 1,
                }}
              >
                <div
                  style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}
                >
                  Generate Custom Skill SOP
                </div>
                <textarea
                  placeholder="Describe what expertise skill you want to create (e.g. 'excel data cleaner', 'postgres database integrity auditor')..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  style={{
                    width: "100%",
                    height: 120,
                    border: "1px solid #E2E8F0",
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 12,
                    outline: "none",
                    background: "#F8FAFC",
                    color: "#1E293B",
                    resize: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={handleGenerateSkill}
                  disabled={skillGenerating || !skillInput.trim()}
                  style={{
                    background: "var(--theme-primary)",
                    color: "white",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor:
                      skillGenerating || !skillInput.trim()
                        ? "not-allowed"
                        : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "all 0.2s",
                  }}
                >
                  {skillGenerating ? (
                    <FiLoader className="spin" size={12} />
                  ) : (
                    <FiCode size={12} />
                  )}
                  {skillGenerating
                    ? "Writing Skill SOP..."
                    : "Generate Skill SOP"}
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  flex: 1,
                }}
              >
                <div
                  style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}
                >
                  Review Generated SOP Skill
                </div>

                <div>
                  <label
                    style={{
                      fontSize: 10,
                      color: "#64748B",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    SKILL ID / NAME (lowercase, dashes only)
                  </label>
                  <input
                    type="text"
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      fontSize: 12,
                      outline: "none",
                      background: "#F8FAFC",
                      color: "#1E293B",
                      fontFamily: "monospace",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: 10,
                      color: "#64748B",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    DESCRIPTION (min 20 chars)
                  </label>
                  <input
                    type="text"
                    value={skillDesc}
                    onChange={(e) => setSkillDesc(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      fontSize: 12,
                      outline: "none",
                      background: "#F8FAFC",
                      color: "#1E293B",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: 10,
                      color: "#64748B",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    TAGS (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={skillTags}
                    onChange={(e) => setSkillTags(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      fontSize: 12,
                      outline: "none",
                      background: "#F8FAFC",
                      color: "#1E293B",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div
                  style={{ flex: 1, display: "flex", flexDirection: "column" }}
                >
                  <label
                    style={{
                      fontSize: 10,
                      color: "#64748B",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    SOP CONTENT (script / code / text)
                  </label>
                  <textarea
                    value={skillContent}
                    onChange={(e) => setSkillContent(e.target.value)}
                    style={{
                      width: "100%",
                      flex: 1,
                      minHeight: 180,
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 11,
                      outline: "none",
                      background: "#F8FAFC",
                      color: "#1E293B",
                      fontFamily: "monospace",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      setSkillName("");
                      setSkillDesc("");
                      setSkillContent("");
                    }}
                    style={{
                      padding: "8px 16px",
                      background: "white",
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#64748B",
                      cursor: "pointer",
                      flex: 1,
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSaveSkill}
                    disabled={savingNote}
                    style={{
                      background: "var(--theme-primary)",
                      color: "white",
                      border: "none",
                      padding: "8px 24px",
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      flex: 1,
                    }}
                  >
                    {skillSaved ? <FiCheck size={12} /> : <FiCheckCircleIcon />}
                    {skillSaved
                      ? "Saved successfully!"
                      : "Save Skill to Gallery"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : mode === "write_prompt" ? (
          <div
            className="animate-subtle"
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: 12,
            }}
          >
            {/* Error Message */}
            {architectError && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  borderRadius: 10,
                  color: "#991B1B",
                  fontSize: 11,
                  fontWeight: 550,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <FiAlertTriangle size={14} /> {architectError}
              </div>
            )}

            {/* Selected Node Status */}
            <div
              style={{
                padding: "8px 12px",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                fontSize: 11,
                color: "#475569",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <FiFileText size={12} />
              {targetNode ? (
                <span>
                  Selected Node:{" "}
                  <strong>{targetNode.data?.label || targetNode.id}</strong> (
                  {targetNode.data?.type})
                </span>
              ) : (
                <span>
                  No node selected on canvas. (Prompts will generate
                  independently)
                </span>
              )}
            </div>

            {!promptResult ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  flex: 1,
                }}
              >
                <div
                  style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}
                >
                  Optimize Agent Instructions / Prompt
                </div>
                <textarea
                  placeholder="What is the objective of this node? Describe what you want it to accomplish, or paste a rough prompt draft to optimize..."
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  style={{
                    width: "100%",
                    height: 120,
                    border: "1px solid #E2E8F0",
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 12,
                    outline: "none",
                    background: "#F8FAFC",
                    color: "#1E293B",
                    resize: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={handleGeneratePrompt}
                  disabled={promptGenerating || !promptInput.trim()}
                  style={{
                    background: "var(--theme-primary)",
                    color: "white",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor:
                      promptGenerating || !promptInput.trim()
                        ? "not-allowed"
                        : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "all 0.2s",
                  }}
                >
                  {promptGenerating ? (
                    <FiLoader className="spin" size={12} />
                  ) : (
                    <FiZap size={12} />
                  )}
                  {promptGenerating
                    ? "Optimizing Prompt..."
                    : "Optimize Prompt with AI"}
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  flex: 1,
                }}
              >
                <div
                  style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}
                >
                  Optimized Prompt Result
                </div>
                <textarea
                  value={promptResult}
                  onChange={(e) => setPromptResult(e.target.value)}
                  style={{
                    width: "100%",
                    flex: 1,
                    minHeight: 220,
                    border: "1px solid #E2E8F0",
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 11,
                    outline: "none",
                    background: "#F8FAFC",
                    color: "#1E293B",
                    fontFamily: "monospace",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      copyToClipboard(promptResult);
                      setCopiedExplanation(true);
                      setTimeout(() => setCopiedExplanation(false), 2000);
                    }}
                    style={{
                      padding: "8px 16px",
                      background: "white",
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#475569",
                      cursor: "pointer",
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    {copiedExplanation ? (
                      <FiCheck color="#16A34A" size={12} />
                    ) : (
                      <FiCopy size={12} />
                    )}
                    {copiedExplanation ? "Copied" : "Copy"}
                  </button>
                  {targetNode && (
                    <button
                      onClick={handleApplyPrompt}
                      style={{
                        background: "var(--theme-primary)",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      {promptApplied ? (
                        <FiCheck size={12} />
                      ) : (
                        <FiZap size={12} />
                      )}
                      {promptApplied ? "Applied to Node!" : "Apply to Node"}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setPromptResult("")}
                  style={{
                    padding: "8px",
                    background: "transparent",
                    border: "none",
                    fontSize: 11,
                    color: "#64748B",
                    cursor: "pointer",
                  }}
                >
                  Write another prompt
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            className="animate-subtle"
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
            }}
          >
            {/* Error Message */}
            {architectError && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  borderRadius: 10,
                  color: "#991B1B",
                  fontSize: 11,
                  fontWeight: 550,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <FiAlertTriangle size={14} /> {architectError}
              </div>
            )}

            {/* Thinking Visualizer */}
            {explaining && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "60px 20px",
                  gap: 12,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    height: 20,
                    alignItems: "center",
                  }}
                >
                  <div className="orb-loading" />
                  <div className="orb-loading orb-loading-2" />
                  <div className="orb-loading orb-loading-3" />
                </div>
                <span
                  style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}
                >
                  Analyzing workspace context...
                </span>
              </div>
            )}

            {/* Messages */}
            {architectExplanation && !explaining && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  flex: 1,
                  minHeight: 0,
                }}
              >
                {/* Micro Actions Bar */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0 4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: "#94A3B8",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {mode === "explain" ? "WALKTHROUGH" : "VARIABLES ANALYSIS"}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={handleCopyExplanation}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: "2px 4px",
                        fontSize: 10,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        color: "#64748B",
                        fontWeight: 600,
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#0F172A")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#64748B")
                      }
                    >
                      {copiedExplanation ? (
                        <FiCheck color="#16A34A" size={11} />
                      ) : (
                        <FiCopy size={11} />
                      )}
                      {copiedExplanation ? "Copied" : "Copy"}
                    </button>
                    <button
                      onClick={handleSaveToNotes}
                      disabled={savingNote}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: "2px 4px",
                        fontSize: 10,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        color: "var(--theme-primary)",
                        fontWeight: 600,
                        transition: "opacity 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.opacity = 0.8)
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = 1)}
                    >
                      {savedToNotes ? (
                        <FiCheck color="#16A34A" size={11} />
                      ) : (
                        <FiBookOpen size={11} />
                      )}
                      {savedToNotes ? "Saved!" : "Save Notes"}
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    flex: 1,
                    minHeight: 200,
                    paddingRight: 6,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                  className="modern-scrollbar"
                >
                  {architectMessages.map((msg, index) => (
                    /* eslint-disable-next-line react/no-array-index-key */
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems:
                          msg.role === "user" ? "flex-end" : "flex-start",
                        width: "100%",
                        animation: "subtle-fade 0.2s ease-out",
                      }}
                    >
                      <div
                        style={{
                          padding: "10px 14px",
                          background:
                            msg.role === "user"
                              ? "var(--theme-primary)"
                              : "#F1F5F9",
                          color: msg.role === "user" ? "white" : "#1E293B",
                          borderRadius:
                            msg.role === "user"
                              ? "14px 14px 2px 14px"
                              : "14px 14px 14px 2px",
                          fontSize: 12,
                          lineHeight: 1.5,
                          maxWidth: "85%",
                          wordBreak: "break-word",
                        }}
                      >
                        {formatMessage(msg.content)}
                      </div>
                    </div>
                  ))}
                  {sendingMessage && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 8px",
                        color: "#64748B",
                        fontSize: 11,
                      }}
                    >
                      <FiLoader className="spin" size={11} /> typing...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Combined Bubble Action Footer */}
      {(mode === "explain" || mode === "explorer") && (
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid #F1F5F9",
            background: "#FCFDFE",
          }}
        >
          {architectExplanation && !explaining ? (
            <form
              onSubmit={handleSendArchitectMessage}
              style={{
                display: "flex",
                alignItems: "center",
                background: "#F1F5F9",
                borderRadius: 20,
                padding: "4px 6px 4px 12px",
                gap: 4,
              }}
            >
              <input
                type="text"
                placeholder={
                  mode === "explain"
                    ? "Ask about workflow..."
                    : "Ask about variables..."
                }
                value={architectInput}
                onChange={(e) => setArchitectInput(e.target.value)}
                disabled={sendingMessage}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "#1E293B",
                  fontSize: 12,
                  fontFamily: "inherit",
                }}
              />
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={explaining || (mode === "explain" && !hasNodes)}
                title="Regenerate"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748B",
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#E2E8F0";
                  e.currentTarget.style.color = "#0F172A";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#64748B";
                }}
              >
                <FiRotateCcw size={13} />
              </button>
              <button
                type="submit"
                disabled={sendingMessage || !architectInput.trim()}
                title="Send Message"
                style={{
                  background: !architectInput.trim()
                    ? "transparent"
                    : "var(--theme-primary)",
                  color: !architectInput.trim() ? "#94A3B8" : "white",
                  border: "none",
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor:
                    sendingMessage || !architectInput.trim()
                      ? "not-allowed"
                      : "pointer",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                <FiSend size={13} />
              </button>
            </form>
          ) : (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                onClick={handleRegenerate}
                disabled={explaining || (mode === "explain" && !hasNodes)}
                style={{
                  background: "var(--theme-primary)",
                  color: "white",
                  border: "none",
                  padding: "8px 18px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.9)}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = 1)}
              >
                <FiZap size={12} />
                {explaining
                  ? "Analyzing..."
                  : mode === "explain"
                    ? "Explain Workflow"
                    : "Analyze Explorer Data"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Minimal check icon
const FiCheckCircleIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);
