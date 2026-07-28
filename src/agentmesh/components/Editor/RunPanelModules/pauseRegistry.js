/**
 * Central registry for all pause-time node types.
 * Single source of truth — add a new pause node here instead of touching 6 files.
 *
 * Field guide:
 *   hidesInput        — hide the bottom input bar when paused at this node
 *   showsHitl         — show Approve/Rework/Reject buttons (false = custom renderer)
 *   isStartingTrigger — can be a starting node connected to START (pre-chat UI)
 *   autoInject        — backend auto-injects pre_gate_ regardless of interrupt_before flag
 */
export const PAUSE_NODE_TYPES = {
  form_node:           { hidesInput: true,  showsHitl: false, isStartingTrigger: false, autoInject: true  },
  multi_file_ingestion:{ hidesInput: true,  showsHitl: false, isStartingTrigger: true,  autoInject: false },
  camera:              { hidesInput: true,  showsHitl: false, isStartingTrigger: true,  autoInject: true  },
  ocr_node:            { hidesInput: true,  showsHitl: false, isStartingTrigger: true,  autoInject: true  },
  stt_trigger:         { hidesInput: true,  showsHitl: false, isStartingTrigger: true,  autoInject: true  },
  followup_form:       { hidesInput: true,  showsHitl: false, isStartingTrigger: false, autoInject: false },
  followup_selection:  { hidesInput: false, showsHitl: false, isStartingTrigger: false, autoInject: false },
  breakpoint:          { hidesInput: false, showsHitl: true,  isStartingTrigger: false, autoInject: false },
};



/** Starting trigger node types (connected to START, pre-chat UI) */
export const STARTING_TRIGGER_TYPES = Object.entries(PAUSE_NODE_TYPES)
  .filter(([_, cfg]) => cfg.isStartingTrigger)
  .map(([type]) => type);

/** Node types that auto-inject pre_gate_ (gate shows without interrupt_before flag) */
export const AUTO_INJECT_TYPES = Object.entries(PAUSE_NODE_TYPES)
  .filter(([_, cfg]) => cfg.autoInject)
  .map(([type]) => type);


