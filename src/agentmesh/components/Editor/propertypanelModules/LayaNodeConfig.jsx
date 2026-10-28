import React, { useState } from 'react';
import {
  Field,
  Input,
  Textarea,
  Select,
  Toggle,
  CommaArrayEditor,
  InfoBanner
} from './SharedComponents';
import {
  FiCpu,
  FiHelpCircle,
  FiLayers,
  FiPlus,
  FiTrash2,
  FiList,
  FiSliders,
  FiCheckCircle,
  FiActivity,
  FiChevronDown,
  FiChevronRight,
  FiServer
} from 'react-icons/fi';

export default function LayaNodeConfig({ data, update }) {
  const [editorMode, setEditorMode] = useState({}); // { [qKey]: 'criteria' | 'simple' }
  const [expandedQuestions, setExpandedQuestions] = useState({}); // { [qKey]: bool }

  // Resolve questions dictionary strictly from node data (generic, non-opinionated)
  const questions = data.jev_questions || {};
  const questionEntries = Object.entries(questions);

  const toggleExpand = (qKey) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qKey]: prev[qKey] === undefined ? false : !prev[qKey]
    }));
  };

  const updateQuestion = (qKey, updatedObj) => {
    update({
      jev_questions: {
        ...questions,
        [qKey]: updatedObj
      }
    });
  };

  const handleRenameQuestionKey = (oldKey, newKey) => {
    const trimmed = newKey.trim();
    if (!trimmed || trimmed === oldKey) return;
    const newQuestions = {};
    for (const [k, v] of Object.entries(questions)) {
      if (k === oldKey) {
        newQuestions[trimmed] = v;
      } else {
        newQuestions[k] = v;
      }
    }
    update({ jev_questions: newQuestions });
  };

  const handleDeleteQuestion = (qKey) => {
    const newQuestions = { ...questions };
    delete newQuestions[qKey];
    update({ jev_questions: newQuestions });
  };

  const handleAddQuestion = () => {
    const newKey = 'question_' + (questionEntries.length + 1);
    update({
      jev_questions: {
        ...questions,
        [newKey]: {
          type: 'choice',
          instructions: 'Instructions or prompt for this question...',
          criteria: {
            Yes: 'Condition holds or applies directly.',
            No: 'Condition does not apply.'
          },
          options: ['Yes', 'No']
        }
      }
    });
    setExpandedQuestions((prev) => ({ ...prev, [newKey]: true }));
  };

  // Choice criteria operations per question
  const commitChoiceCriteria = (qKey, qObj, newCriteria) => {
    updateQuestion(qKey, {
      ...qObj,
      criteria: newCriteria,
      options: Object.keys(newCriteria)
    });
  };

  const handleUpdateChoiceKey = (qKey, qObj, oldChoice, newChoice) => {
    if (!newChoice.trim() || newChoice === oldChoice) return;
    const current = qObj.criteria || {};
    const newCriteria = {};
    for (const [k, v] of Object.entries(current)) {
      if (k === oldChoice) {
        newCriteria[newChoice.trim()] = v;
      } else {
        newCriteria[k] = v;
      }
    }
    commitChoiceCriteria(qKey, qObj, newCriteria);
  };

  const handleUpdateChoiceExplanation = (qKey, qObj, choiceKey, explanation) => {
    const current = qObj.criteria || {};
    commitChoiceCriteria(qKey, qObj, { ...current, [choiceKey]: explanation });
  };

  const handleRemoveChoice = (qKey, qObj, choiceToRemove) => {
    const current = { ...(qObj.criteria || {}) };
    delete current[choiceToRemove];
    commitChoiceCriteria(qKey, qObj, current);
  };

  const handleAddChoice = (qKey, qObj) => {
    const current = qObj.criteria || {};
    const newName = 'Option ' + (Object.keys(current).length + 1);
    commitChoiceCriteria(qKey, qObj, {
      ...current,
      [newName]: 'Criteria and boundary guidelines for this option.'
    });
  };

  // Score levels operations per question
  const commitScoreLevels = (qKey, qObj, newLevels) => {
    updateQuestion(qKey, {
      ...qObj,
      criteria: newLevels
    });
  };

  const handleAddScoreLevel = (qKey, qObj) => {
    const levels = Array.isArray(qObj.criteria) ? [...qObj.criteria] : ['Level 0', 'Level 1'];
    levels.push('Level ' + levels.length + ': Description...');
    commitScoreLevels(qKey, qObj, levels);
  };

  const handleUpdateScoreLevel = (qKey, qObj, idx, text) => {
    const levels = Array.isArray(qObj.criteria) ? [...qObj.criteria] : [];
    levels[idx] = text;
    commitScoreLevels(qKey, qObj, levels);
  };

  const handleRemoveScoreLevel = (qKey, qObj, idx) => {
    const levels = Array.isArray(qObj.criteria) ? [...qObj.criteria] : [];
    levels.splice(idx, 1);
    commitScoreLevels(qKey, qObj, levels);
  };

  const itemFields = data.jev_item_fields || [];

  return (
    <>
      <InfoBanner
        type="info"
        title="Laya Decision Model (On-Prem / Local Sidecar)"
        message="Laya evaluates typed questions (Choice, Noul, Score) against unstructured state or tabular rows using your local or on-premise Laya service. All question criteria are configured directly on this canvas."
      />

      {/* DYNAMIC QUESTIONS SECTION */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-muted, #64748B)',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <FiHelpCircle size={13} /> Configured Questions ({questionEntries.length})
          </div>
          <button
            type="button"
            onClick={handleAddQuestion}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 5,
              fontSize: 11,
              fontWeight: 600,
              backgroundColor: '#FAF5FF',
              color: '#9333EA',
              border: '1px solid #E9D5FF',
              cursor: 'pointer'
            }}
          >
            <FiPlus size={12} /> Add Question
          </button>
        </div>

        {questionEntries.length === 0 ? (
          <div
            style={{
              padding: '16px',
              border: '1px dashed #CBD5E1',
              borderRadius: 8,
              textAlign: 'center',
              color: 'var(--text-muted, #64748B)',
              fontSize: 12,
              backgroundColor: '#F8FAFC'
            }}
          >
            No evaluation questions configured. Click <strong>+ Add Question</strong> above to configure questions for this node.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {questionEntries.map(([qKey, qObj]) => {
              const isExpanded = expandedQuestions[qKey] ?? true;
              const qType = qObj.type || 'choice';

              return (
                <div
                  key={qKey}
                  style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    backgroundColor: '#FFFFFF',
                    overflow: 'hidden'
                  }}
                >
                  {/* Accordion header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: '#F8FAFC',
                      borderBottom: isExpanded ? '1px solid #E2E8F0' : 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleExpand(qKey)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                      {isExpanded ? <FiChevronDown size={14} color="#64748B" /> : <FiChevronRight size={14} color="#64748B" />}
                      <input
                        type="text"
                        defaultValue={qKey}
                        onBlur={(e) => handleRenameQuestionKey(qKey, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontWeight: 700,
                          fontSize: 12,
                          color: '#0F172A',
                          backgroundColor: 'transparent',
                          border: '1px dashed transparent',
                          borderRadius: 3,
                          padding: '1px 4px',
                          outline: 'none'
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#9333EA')}
                      />
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: 4,
                          backgroundColor: '#F3E8FF',
                          color: '#7E22CE',
                          textTransform: 'uppercase'
                        }}
                      >
                        {qType}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(qKey)}
                        title="Delete Question"
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: 4,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Accordion body */}
                  {isExpanded && (
                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <Field label="Question Type" hint="Question primitive for Laya to resolve.">
                        <Select
                          value={qType}
                          onChange={(v) => {
                            const base = { ...qObj, type: v };
                            if (v === 'choice' && !base.criteria) {
                              base.criteria = { Yes: 'Applies', No: 'Does not apply' };
                              base.options = ['Yes', 'No'];
                            } else if (v === 'score' && !Array.isArray(base.criteria)) {
                              base.criteria = ['Level 0: Minimum', 'Level 1: Medium', 'Level 2: Maximum'];
                            }
                            updateQuestion(qKey, base);
                          }}
                          options={[
                            { label: 'Choice (Categorical Classification)', value: 'choice' },
                            { label: 'Score (Ordinal Multi-level Ranking)', value: 'score' },
                            { label: 'Noul (Direct Calibrated Probability 0-1)', value: 'noul' }
                          ]}
                        />
                      </Field>

                      <Field
                        label="Instructions / System Intent"
                        hint="Guidelines instructing Laya how to interpret state data and determine the answer."
                      >
                        <Textarea
                          rows={3}
                          value={qObj.instructions || ''}
                          onChange={(v) => updateQuestion(qKey, { ...qObj, instructions: v })}
                          placeholder="Instructions for evaluating this question against the input state..."
                        />
                      </Field>

                      {/* CHOICE SPECIFIC CRITERIA */}
                      {qType === 'choice' && (
                        <div style={{ marginTop: 4 }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 8
                            }}
                          >
                            <label
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: 'var(--text-muted, #64748B)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.8px'
                              }}
                            >
                              Choice Options & Descriptions
                            </label>
                            <button
                              type="button"
                              onClick={() => handleAddChoice(qKey, qObj)}
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 4,
                                backgroundColor: '#FAF5FF',
                                color: '#9333EA',
                                border: '1px solid #E9D5FF',
                                cursor: 'pointer'
                              }}
                            >
                              + Add Option
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {Object.entries(qObj.criteria || {}).map(([cKey, cVal]) => (
                              <div
                                key={cKey}
                                style={{
                                  padding: 8,
                                  borderRadius: 6,
                                  border: '1px solid #E2E8F0',
                                  backgroundColor: '#F8FAFC'
                                }}
                              >
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                                  <input
                                    type="text"
                                    defaultValue={cKey}
                                    onBlur={(e) => handleUpdateChoiceKey(qKey, qObj, cKey, e.target.value)}
                                    style={{
                                      fontWeight: 700,
                                      fontSize: 11,
                                      color: '#1E293B',
                                      border: '1px solid #CBD5E1',
                                      borderRadius: 4,
                                      padding: '2px 6px',
                                      width: 140
                                    }}
                                    placeholder="Option Name"
                                  />
                                  <span style={{ flex: 1 }} />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveChoice(qKey, qObj, cKey)}
                                    style={{
                                      border: 'none',
                                      background: 'transparent',
                                      color: '#EF4444',
                                      cursor: 'pointer',
                                      padding: 2
                                    }}
                                  >
                                    <FiTrash2 size={12} />
                                  </button>
                                </div>
                                <textarea
                                  rows={2}
                                  value={typeof cVal === 'string' ? cVal : ''}
                                  onChange={(e) =>
                                    handleUpdateChoiceExplanation(qKey, qObj, cKey, e.target.value)
                                  }
                                  style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    fontSize: 11,
                                    color: '#334155',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: 4,
                                    padding: '4px 6px',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                  }}
                                  placeholder="Describe when to choose this option (Laya matches state against this description)..."
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SCORE SPECIFIC */}
                      {qType === 'score' && (
                        <div style={{ marginTop: 6 }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 8
                            }}
                          >
                            <label
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: 'var(--text-muted, #64748B)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.8px'
                              }}
                            >
                              Ordered Level Definitions
                            </label>
                            <button
                              type="button"
                              onClick={() => handleAddScoreLevel(qKey, qObj)}
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 4,
                                backgroundColor: '#FEF3C7',
                                color: '#B45309',
                                border: '1px solid #FDE68A',
                                cursor: 'pointer'
                              }}
                            >
                              + Add Level
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {(Array.isArray(qObj.criteria) ? qObj.criteria : ['Level 0', 'Level 1']).map(
                              (lvlText, lvlIdx) => (
                                <div
                                  key={lvlIdx}
                                  style={{ display: 'flex', gap: 6, alignItems: 'center' }}
                                >
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: '#B45309',
                                      minWidth: 50
                                    }}
                                  >
                                    Level {lvlIdx}:
                                  </span>
                                  <input
                                    type="text"
                                    value={lvlText}
                                    onChange={(e) =>
                                      handleUpdateScoreLevel(qKey, qObj, lvlIdx, e.target.value)
                                    }
                                    style={{
                                      flex: 1,
                                      fontSize: 11,
                                      padding: '4px 8px',
                                      borderRadius: 4,
                                      border: '1px solid #CBD5E1'
                                    }}
                                    placeholder={'Description for level ' + lvlIdx}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveScoreLevel(qKey, qObj, lvlIdx)}
                                    style={{
                                      border: 'none',
                                      background: 'transparent',
                                      color: '#EF4444',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <FiTrash2 size={12} />
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LAYA SERVICE & PERFORMANCE */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-muted, #64748B)',
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <FiServer size={13} /> Laya Service & Performance
        </div>

        <Field
          label="Laya Endpoint URL"
          hint="Host & port of the local or on-prem Laya inference service."
        >
          <Input
            value={data.laya_endpoint || 'http://127.0.0.1:8770'}
            onChange={(v) => update({ laya_endpoint: v })}
            placeholder="http://127.0.0.1:8770"
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field
            label="Concurrency"
            hint="Parallel in-flight requests to Laya."
          >
            <Input
              type="number"
              value={data.laya_concurrency ?? data.jev_concurrency ?? 10}
              onChange={(v) => {
                const num = Number(v) || 1;
                update({ laya_concurrency: num, jev_concurrency: num });
              }}
              placeholder="10"
            />
          </Field>

          <Field
            label="Timeout (seconds)"
            hint="Per-request timeout (seconds)."
          >
            <Input
              type="number"
              value={data.laya_timeout_seconds ?? 60}
              onChange={(v) => update({ laya_timeout_seconds: Number(v) || 60 })}
              placeholder="60"
            />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <Field
            label="Max State Chars"
            hint="Max characters per row (budget for 512 tokens)."
          >
            <Input
              type="number"
              value={data.laya_max_state_chars ?? 1200}
              onChange={(v) => update({ laya_max_state_chars: Number(v) || 1200 })}
              placeholder="1200"
            />
          </Field>

          <Field
            label="Language"
            hint="Language checkpoint hint ('en')."
          >
            <Input
              value={data.laya_lang || 'en'}
              onChange={(v) => update({ laya_lang: v })}
              placeholder="en"
            />
          </Field>
        </div>

        <Field
          label="API Token Environment Variable"
          hint="Env variable holding bearer token if service is authenticated (default: LAYA_API_TOKEN)."
        >
          <Input
            value={data.laya_api_token_env || 'LAYA_API_TOKEN'}
            onChange={(v) => update({ laya_api_token_env: v })}
            placeholder="LAYA_API_TOKEN"
          />
        </Field>

        <Field
          label="API Key / Bearer Token (Direct Canvas Override)"
          hint="Directly configure the Laya bearer token on canvas. Overrides .env variable."
        >
          <Input
            type="password"
            value={data.laya_api_token ?? data.laya_api_key ?? ''}
            onChange={(v) => update({ laya_api_token: v, laya_api_key: v })}
            placeholder="e.g. bearer_token_abc123"
          />
        </Field>
      </div>

      {/* DATA & CONTEXT MAPPING */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-muted, #64748B)',
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <FiLayers size={13} /> Data & Context Mapping
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field
            label="Input Context Key"
            hint="Context key containing tabular findings (e.g. excel_json_data)."
          >
            <Input
              stripBraces
              value={data.jev_input_key ?? 'excel_json_data'}
              onChange={(v) => update({ jev_input_key: v })}
              placeholder="excel_json_data"
            />
          </Field>

          <Field
            label="Output Context Key"
            hint="Context key where tagged findings are saved (e.g. excel_json_data)."
          >
            <Input
              stripBraces
              value={data.jev_output_key ?? 'excel_json_data'}
              onChange={(v) => update({ jev_output_key: v })}
              placeholder="excel_json_data"
            />
          </Field>
        </div>

        <Field
          label="Inspection Column Fields"
          hint="Column headers serialized into state context for Laya to evaluate."
        >
          <CommaArrayEditor
            isTextarea
            rows={2}
            value={itemFields}
            onChange={(v) => update({ jev_item_fields: v })}
            placeholder="Plugin Name, Synopsis, Description, Plugin Family"
          />
        </Field>
      </div>

      {/* STREAMING & BATCH PROGRESS */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-muted, #64748B)',
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <FiActivity size={13} /> Batching & Real-Time Streaming
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field
            label="Batch Progress Size"
            hint="Number of rows evaluated per live SSE progress chunk (default: 100)."
          >
            <Input
              type="number"
              value={data.jev_batch_progress_size ?? 100}
              onChange={(v) => update({ jev_batch_progress_size: Number(v) || 50 })}
              placeholder="100"
            />
          </Field>

          <Field
            label="Stream Progress"
            hint="Emit live progress events during execution."
          >
            <div style={{ marginTop: 6 }}>
              <Toggle
                checked={Boolean(data.jev_stream_progress)}
                onChange={(v) => update({ jev_stream_progress: v })}
                label="Enable SSE Stream"
              />
            </div>
          </Field>
        </div>
      </div>
    
      {/* DECISION GATING & REVIEW THRESHOLDS */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-muted, #64748B)',
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <FiSliders size={13} /> Decision Gating & Review Thresholds
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field
            label="Confidence Threshold"
            hint="Model confidence threshold (e.g. 0.60 or 60). Below this flags for review."
          >
            <Input
              type="number"
              step="0.05"
              value={data.jev_confidence_gate ?? 0.60}
              onChange={(v) => update({ jev_confidence_gate: v === '' ? 0.60 : Number(v) > 1 ? Number(v) / 100 : Number(v) })}
              placeholder="0.60"
            />
          </Field>

          <Field
            label="Top Probability Threshold"
            hint="Top choice probability threshold (e.g. 0.60 or 60). Below this flags for review."
          >
            <Input
              type="number"
              step="0.05"
              value={data.jev_top_prob_gate ?? 0.60}
              onChange={(v) => update({ jev_top_prob_gate: v === '' ? 0.60 : Number(v) > 1 ? Number(v) / 100 : Number(v) })}
              placeholder="0.60"
            />
          </Field>
        </div>
      </div>

</>
  );
}
