import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { FiChevronRight, FiChevronLeft, FiSkipForward, FiCheck, FiBox, FiZap, FiAlertCircle, FiPlus, FiEdit3, FiBookOpen, FiCompass, FiDatabase } from "react-icons/fi";
import { VscVariableGroup } from "react-icons/vsc";
import { HugeiconsIcon } from "@hugeicons/react";
import { AiMagicIcon } from "@hugeicons/core-free-icons";
import { useUIStore } from "../../store";

// Match the navbar's actual Architect icon (HugeiconsIcon + AiMagicIcon)
const ArchitectIcon = (props) => <HugeiconsIcon icon={AiMagicIcon} size={props.size || 18} />;

const TOUR_STEPS = [
  { id: "welcome",    title: "Welcome to Agent Mesh", description: "Let's take a quick tour of the canvas. You'll learn how to build, connect, and run AI agent workflows.", target: null, icon: FiZap, position: "center" },
  { id: "new",        title: "New Workflow", description: "Create a fresh workflow canvas to start building your AI agent from scratch.", target: "navbar-new-btn", icon: FiPlus, position: "bottom" },
  { id: "edit-meta",  title: "Workflow Settings", description: "Click the workflow name here to edit details, description, group, and advanced options.", target: "navbar-meta-btn", icon: FiEdit3, position: "bottom" },
  { id: "architect",  title: "AI Architect", description: "Describe your workflow in plain English and let AI build it for you automatically.", target: "navbar-architect-btn", icon: ArchitectIcon, position: "bottom" },
  { id: "notes",      title: "Workflow Notes", description: "Add documentation and notes to your workflow for better team collaboration.", target: "navbar-notes-btn", icon: FiBookOpen, position: "bottom" },
  { id: "actions",    title: "Actions Menu", description: "Import/export workflows, save templates, publish use cases, and access keyboard shortcuts.", target: "canvas-actions-btn", icon: FiBox, position: "bottom" },
  { id: "compile",    title: "Compile & Run", description: "Once your workflow is ready, click Compile to validate, then Run to execute it.", target: "canvas-compile-btn", icon: FiZap, position: "bottom" },
  { id: "pilot",      title: "Pilot Console", description: "Monitor, debug, and inspect your running workflow in real time.", target: "canvas-pilot-btn", icon: FiCompass, position: "left" },
  { id: "variables",  title: "Workflow Variables", description: "Manage and inspect key-value variables used across your workflow.", target: "canvas-variables-btn", icon: VscVariableGroup, position: "left" },
  { id: "data-explorer", title: "Data Explorer", description: "Browse and search through your connected data sources and schemas.", target: "canvas-data-explorer-btn", icon: FiDatabase, position: "left" },
  { id: "add-node",   title: "Add Nodes", description: "Click the + button to open the Node Library. Search and drag agents, tools, and logic nodes onto your workflow.", target: "canvas-add-node-btn", icon: FiPlus, position: "bottom" },
  { id: "complete",   title: "You're All Set!", description: "Now start dragging nodes onto the canvas to build your first AI workflow.", target: null, icon: FiCheck, position: "center" },
];

function useTourState() {
  const STORAGE_KEY = "agentmesh_tour_completed";
  const [hasSeenTour, setHasSeenTour] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const markTourCompleted = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {}
    setHasSeenTour(true);
  }, []);

  const resetTour = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setHasSeenTour(false);
  }, []);

  return { hasSeenTour, markTourCompleted, resetTour };
}

function getTargetRect(targetId) {
  if (!targetId) return null;
  const el = document.getElementById(targetId) || document.querySelector(`[data-tour="${targetId}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    bottom: rect.bottom,
    right: rect.right,
    centerX: rect.left + rect.width / 2,
    centerY: rect.top + rect.height / 2,
  };
}

function CoachMarkBeacon({ targetRect, position }) {
  if (!targetRect) return null;

  const positions = {
    top: { x: targetRect.centerX, y: targetRect.top - 16 },
    bottom: { x: targetRect.centerX, y: targetRect.bottom + 16 },
    left: { x: targetRect.left - 16, y: targetRect.centerY },
    right: { x: targetRect.right + 16, y: targetRect.centerY },
  };

  const pos = positions[position] || positions.bottom;

  return (
    <div
      style={{
        position: "fixed",
        left: pos.x - 8,
        top: pos.y - 8,
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "#8E77BB",
        zIndex: 100002,
        pointerEvents: "none",
        animation: "tourPulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

function TourTooltip({ step, stepIndex, totalSteps, onNext, onPrev, onSkip, onDone, targetRect }) {
  const tooltipRef = useRef(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  const isCenter = step.position === "center";
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  // Measure and position tooltip relative to target
  const measurePosition = useCallback(() => {
    if (isCenter || !tooltipRef.current || !targetRect) return false;

    const el = tooltipRef.current;
    const tw = el.offsetWidth;
    const th = el.offsetHeight;

    let top, left;
    const gap = 20;
    const padding = 16;

    switch (step.position) {
      case "top":
        top = targetRect.top - th - gap;
        left = targetRect.centerX - tw / 2;
        break;
      case "bottom":
        top = targetRect.bottom + gap;
        left = targetRect.centerX - tw / 2;
        break;
      case "left":
        top = targetRect.centerY - th / 2;
        left = targetRect.left - tw - gap;
        break;
      case "right":
        top = targetRect.centerY - th / 2;
        left = targetRect.right + gap;
        break;
      default:
        top = targetRect.bottom + gap;
        left = targetRect.centerX - tw / 2;
    }

    const maxLeft = window.innerWidth - tw - padding;
    const maxTop = window.innerHeight - th - padding;
    top = Math.max(padding, Math.min(top, maxTop));
    left = Math.max(padding, Math.min(left, maxLeft));

    setTooltipPos({ top, left });
    return true;
  }, [targetRect, step.position, isCenter]);

  useLayoutEffect(() => {
    measurePosition();
  }, [measurePosition]);

  const Icon = step.icon;

  // ── Center card (welcome / complete steps) ──
  if (isCenter) {
    return (
      <div
        style={{
          position: "fixed", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100002, pointerEvents: "none",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 20, padding: 40,
            maxWidth: 440, width: "90%",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            border: "1px solid #E2E8F0",
            pointerEvents: "auto", textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56, height: 56, borderRadius: 16,
              background: "linear-gradient(135deg, #8E77BB, #6D5BA3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px", color: "white",
            }}
          >
            <Icon size={28} />
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#1E293B" }}>{step.title}</h3>
          <p style={{ margin: 0, fontSize: 14, color: "#64748B", lineHeight: 1.6 }}>{step.description}</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24 }}>
            {isLast ? (
              <button onClick={onDone} style={doneBtnStyle}>
                <FiCheck size={16} /> Get Started
              </button>
            ) : (
              <button onClick={onNext} style={nextBtnStyle}>
                Start Tour <FiChevronRight size={16} />
              </button>
            )}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#94A3B8" }}>
            {stepIndex + 1} / {totalSteps}
          </div>
        </div>
      </div>
    );
  }

  // ── Tooltip card (target steps) ──
  return (
    <div
      ref={tooltipRef}
      style={{
        position: "fixed",
        top: targetRect ? tooltipPos.top : "50%",
        left: targetRect ? tooltipPos.left : "50%",
        transform: targetRect ? "none" : "translate(-50%, -50%)",
        background: "white",
        borderRadius: 16,
        padding: 20,
        maxWidth: 340,
        width: "90%",
        boxShadow: "0 20px 40px -8px rgba(0,0,0,0.2)",
        border: "1px solid #E2E8F0",
        zIndex: 100002,
        pointerEvents: "auto",
      }}
    >
      {targetRect && (
        <div
          style={{
            position: "absolute",
            width: 12, height: 12,
            background: "white",
            borderLeft: "1px solid #E2E8F0",
            borderTop: "1px solid #E2E8F0",
            transform: "rotate(45deg)",
            ...arrowPosition(step.position, targetRect, tooltipPos),
          }}
        />
      )}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #8E77BB, #6D5BA3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, color: "white",
          }}
        >
          <Icon size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#1E293B" }}>{step.title}</h3>
          <p style={{ margin: 0, fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>{step.description}</p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
        {!isFirst && (
          <button onClick={onPrev} style={smBtnStyle}>
            <FiChevronLeft size={14} /> Back
          </button>
        )}
        {isLast ? (
          <button onClick={onDone} style={primaryBtnStyle}>
            Done <FiCheck size={14} />
          </button>
        ) : (
          <button onClick={onNext} style={primaryBtnStyle}>
            Next <FiChevronRight size={14} />
          </button>
        )}
        <button onClick={onSkip} style={ghostBtnStyle} title="Skip tour">
          <FiSkipForward size={14} />
        </button>
      </div>

      {!targetRect && (
        <div style={{ marginTop: 8, fontSize: 11, color: "#F59E0B", textAlign: "center" }}>
          <FiAlertCircle size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
          Target element not found — click Next to continue
        </div>
      )}
    </div>
  );
}

function arrowPosition(position, targetRect, tooltipPos) {
  switch (position) {
    case "top":
      return { bottom: -7, left: Math.max(12, Math.min(targetRect.centerX - tooltipPos.left - 6, 300)) };
    case "bottom":
      return { top: -7, left: Math.max(12, Math.min(targetRect.centerX - tooltipPos.left - 6, 300)) };
    case "left":
      return { right: -7, top: Math.max(12, Math.min(targetRect.centerY - tooltipPos.top - 6, 300)) };
    case "right":
      return { left: -7, top: Math.max(12, Math.min(targetRect.centerY - tooltipPos.top - 6, 300)) };
    default:
      return { top: -7, left: 24 };
  }
}

export default function GuidedTour({ isOpen, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRects, setTargetRects] = useState({});
  const { markTourCompleted } = useTourState();

  const activePage = useUIStore((s) => s.activePage);
  const setActivePage = useUIStore((s) => s.setActivePage);

  // Auto setup target page when tour is active
  useEffect(() => {
    if (isOpen && activePage !== 'canvas') {
      setActivePage('canvas');
    }
  }, [isOpen, activePage, setActivePage]);

  const step = TOUR_STEPS[currentStep];

  // Synchronously measure current step's target if missing
  let targetRect = step.target ? targetRects[step.target] : null;
  if (!targetRect && step.target && isOpen) {
    const r = getTargetRect(step.target);
    if (r) targetRect = r;
  }

  const measureTargets = useCallback(() => {
    const rects = {};
    TOUR_STEPS.forEach((s) => {
      if (s.target) {
        const r = getTargetRect(s.target);
        if (r) rects[s.target] = r;
      }
    });
    setTargetRects(rects);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    let rafId, retries = 0;
    const tryMeasure = () => {
      measureTargets();
      const currentTarget = TOUR_STEPS[currentStep].target;
      if (currentTarget && !getTargetRect(currentTarget) && retries < 10) {
        retries++;
        rafId = requestAnimationFrame(tryMeasure);
      }
    };
    rafId = requestAnimationFrame(tryMeasure);
    const onResize = () => measureTargets();
    window.addEventListener("resize", onResize);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, [isOpen, measureTargets, currentStep]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") handleSkipRef.current();
      if (e.key === "ArrowRight") handleNextRef.current();
      if (e.key === "ArrowLeft") handlePrevRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const handleNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, TOUR_STEPS.length - 1));
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleSkip = useCallback(() => {
    setCurrentStep(0);
    onClose?.();
  }, [onClose]);

  const handleDone = useCallback(() => {
    markTourCompleted();
    setCurrentStep(0);
    onComplete?.();
    onClose?.();
  }, [markTourCompleted, onComplete, onClose]);

  // Keep refs so keyboard handler always calls latest versions
  const handleNextRef = useRef(handleNext);
  handleNextRef.current = handleNext;
  const handlePrevRef = useRef(handlePrev);
  handlePrevRef.current = handlePrev;
  const handleSkipRef = useRef(handleSkip);
  handleSkipRef.current = handleSkip;

  if (!isOpen) return null;

  const hasTarget = step.target && targetRect;

  return (
    <>
      {/* Overlay — blocks ALL clicks during target steps (invisible but click-capturing); on center cards it's dark + dismisses on click */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100000,
          background: hasTarget ? "transparent" : "rgba(15, 23, 42, 0.4)",
          backdropFilter: hasTarget ? "none" : "blur(2px)",
          pointerEvents: "auto",
          animation: "tourFadeIn 0.25s ease-out",
        }}
        onClick={hasTarget ? undefined : handleSkip}
      />

      {/* Cutout highlight — blocks clicks on the highlighted element + darkens outside area via box-shadow */}
      {hasTarget && (
        <div
          style={{
            position: "fixed",
            left: targetRect.left - 8,
            top: targetRect.top - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            borderRadius: 12,
            zIndex: 100001,
            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.5)",
            border: "2px solid #8E77BB",
            pointerEvents: "auto",
          }}
        />
      )}

      {/* Coach mark beacon */}
      {hasTarget && <CoachMarkBeacon targetRect={targetRect} position={step.position} />}

      {/* Tooltip */}
      <TourTooltip
        step={step}
        stepIndex={currentStep}
        totalSteps={TOUR_STEPS.length}
        targetRect={targetRect}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleSkip}
        onDone={handleDone}
      />

      <style>{`
        @keyframes tourFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes tourPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 0 0 rgba(142,119,187,0.4); }
          50% { transform: scale(1.3); opacity: 1; box-shadow: 0 0 0 8px rgba(142,119,187,0); }
        }
      `}</style>
    </>
  );
}

const nextBtnStyle = {
  padding: "10px 24px",
  background: "linear-gradient(135deg, #8E77BB, #6D5BA3)",
  color: "white",
  border: "none",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontFamily: "inherit",
};

const doneBtnStyle = {
  ...nextBtnStyle,
  background: "linear-gradient(135deg, #22C55E, #16A34A)",
};

const primaryBtnStyle = {
  padding: "8px 16px",
  background: "linear-gradient(135deg, #8E77BB, #6D5BA3)",
  color: "white",
  border: "none",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};

const smBtnStyle = {
  padding: "8px 12px",
  background: "#F1F5F9",
  color: "#475569",
  border: "none",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 4,
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};

const ghostBtnStyle = {
  padding: "8px",
  background: "transparent",
  color: "#94A3B8",
  border: "none",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "inherit",
};
