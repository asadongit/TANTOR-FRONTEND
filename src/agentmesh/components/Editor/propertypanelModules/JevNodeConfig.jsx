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
  FiChevronRight
} from 'react-icons/fi';

const JEV_MODELS = [
  { label: 'jev-latest (Calibrated, Recommended)', value: 'jev-latest' },
  { label: 'jev-1.14 (Stable)', value: 'jev-1.14' },
  { label: 'jev-fast (High Throughput)', value: 'jev-fast' },
  { label: 'Custom Model...', value: 'custom-model' }
];

const DEFAULT_VAPT_ITEM_FIELDS = [
  'Vulnerability Name',
  'Plugin Name',
  'Synopsis',
  'Description',
  'Plugin Family',
  'Affected Package',
  'OS',
  'OS Falvour',
  'Plugin Output'
];

const DEFAULT_VAPT_CRITERIA = {
  OS: 'The vulnerable component is the operating system or OS-managed package: Linux/Windows/Unix kernel, OS packages and system utilities (glibc, openssh, sudo, system openssl, microcode_ctl, systemd), CPU microcode updates delivered via OS packages, OS vendor security advisories (RHEL/RHSA, Ubuntu/USN, Debian/DSA, Microsoft KB), OS services, missing OS patches, or OS misconfiguration.',
  Network: 'The vulnerable component is network infrastructure or transport layer: network devices (routers, switches, firewalls, load balancers), network protocols (BGP, OSPF, SNMP, NTP, DNS), TLS/SSL ciphers, VPNs, or perimeter open ports and routing.',
  Database: 'The vulnerable component is a database engine or DB-specific component: Oracle Database, MySQL, PostgreSQL, SQL Server, listener, DB patches or DB configuration.',
  Application: 'The vulnerable component is application-layer software: web/app servers, middleware, agents, frameworks, or third-party libraries bundled in an application (Java jars, Tomcat, Apache httpd, WebLogic).',
  'Other/General': 'A genuine vulnerability finding that fits none of the four layers (OS, Database, Application, Network), such as physical security, standalone out-of-band IPMI / iLO / BIOS hardware chip flash (not updated via OS package), or broad organizational compliance and governance policy findings.',
  insufficient_info: 'The row is not a usable vulnerability record: blank, header, summary or notes row, or it lacks enough detail (no plugin name, description, or path) to decide.'
};

export default function JevNodeConfig({ data, update }) {
  const [editorMode, setEditorMode] = useState({}); // { [qKey]: 'criteria' | 'simple' }
  const [expandedQuestions, setExpandedQuestions] = useState({}); // { [qKey]: bool }

  // Resolve questions dictionary (dynamic multi-question support)
  const questions = data.jev_questions && Object.keys(data.jev_questions).length > 0
    ? data.jev_questions
    : {
        category: {
          type: 'choice',
          instructions:
            'The state is one row from a vulnerability scan spreadsheet; column names may vary and some columns may be irrelevant. Decide which layer the vulnerable component belongs to, judging by the component that is actually vulnerable (plugin name, description, path, port), not by the host it runs on. Ignore columns about tracking, dates, ownership, or status.',
          criteria: DEFAULT_VAPT_CRITERIA,
          options: Object.keys(DEFAULT_VAPT_CRITERIA)
        }
      };

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
    if (questionEntries.length <= 1) {
      alert('At least one question is required for Jev evaluation.');
      return;
    }
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

  const knownModelValues = JEV_MODELS.map((m) => m.value).filter((v) => v !== 'custom-model');
  const currentModel = data.jev_model || 'jev-latest';
  const isCustomModel = !knownModelValues.includes(currentModel) || currentModel === 'custom-model';
  const itemFields = data.jev_item_fields || DEFAULT_VAPT_ITEM_FIELDS;

  return (
    <>
      <InfoBanner
        type="info"
        title="TypeSafe AI Jev (System One)"
        message="Jev evaluates typed questions (Choice, Noul, Score) simultaneously against each finding row in a single calibrated round-trip. Question keys are stamped directly into output records without generative hallucination."
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
              backgroundColor: '#EFF6FF',
              color: '#1D4ED8',
              border: '1px solid #BFDBFE',
              cursor: 'pointer'
            }}
          >
            <FiPlus size={12} /> Add Question
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {questionEntries.map(([qKey, qObj]) => {
            const isExpanded = expandedQuestions[qKey] !== false; // expanded by default
            const qType = qObj.type || 'choice';
            const criteria = qObj.criteria || {};
            const isCriteriaMode = (editorMode[qKey] || 'criteria') === 'criteria';

            return (
              <div
                key={qKey}
                style={{
                  border: '1px solid var(--border, #E2E8F0)',
                  borderRadius: 8,
                  backgroundColor: 'var(--bg-main, #FFFFFF)',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                {/* QUESTION ACCORDION HEADER */}
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-secondary, #F8FAFC)',
                    borderBottom: isExpanded ? '1px solid var(--border, #E2E8F0)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleExpand(qKey)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isExpanded ? <FiChevronDown size={14} color="#64748B" /> : <FiChevronRight size={14} color="#64748B" />}
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
                      {qKey}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        textTransform: 'uppercase',
                        backgroundColor:
                          qType === 'choice' ? '#EFF6FF' : qType === 'noul' ? '#ECFDF5' : '#FEF3C7',
                        color:
                          qType === 'choice' ? '#1D4ED8' : qType === 'noul' ? '#047857' : '#B45309'
                      }}
                    >
                      {qType}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteQuestion(qKey);
                    }}
                    title="Delete Question"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#EF4444',
                      cursor: 'pointer',
                      padding: 4
                    }}
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>

                {/* QUESTION ACCORDION BODY */}
                {isExpanded && (
                  <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <Field
                        label="Question ID (Output Key)"
                        hint="Attribute name stamped on each JSON row (e.g. category, is_false_positive)."
                      >
                        <input
                          type="text"
                          defaultValue={qKey}
                          onBlur={(e) => handleRenameQuestionKey(qKey, e.target.value)}
                          style={{
                            width: '100%',
                            fontSize: 12,
                            fontWeight: 600,
                            padding: '6px 8px',
                            borderRadius: 6,
                            border: '1px solid #CBD5E1',
                            color: '#0F172A'
                          }}
                          placeholder="e.g. category"
                        />
                      </Field>

                      <Field
                        label="Question Type"
                        hint="Primitive formulation."
                      >
                        <Select
                          value={qType}
                          onChange={(v) => {
                            let newCriteria = qObj.criteria;
                            if (v === 'choice' && (!newCriteria || Array.isArray(newCriteria))) {
                              newCriteria = { Option1: 'Rule 1', Option2: 'Rule 2' };
                            } else if (v === 'score' && (!Array.isArray(newCriteria))) {
                              newCriteria = ['Low impact', 'Medium impact', 'Critical impact'];
                            }
                            updateQuestion(qKey, {
                              ...qObj,
                              type: v,
                              criteria: newCriteria,
                              options: v === 'choice' && typeof newCriteria === 'object' ? Object.keys(newCriteria) : undefined
                            });
                          }}
                          options={[
                            { label: 'Choice (Categorical Selection)', value: 'choice' },
                            { label: 'Noul (Boolean / Fact Check)', value: 'noul' },
                            { label: 'Score (Ordinal Rating Scale)', value: 'score' }
                          ]}
                        />
                      </Field>
                    </div>

                    <Field
                      label="Instructions / Prompt"
                      hint="Evaluation criteria question sent to Jev for this dimension."
                    >
                      <Textarea
                        rows={2}
                        value={qObj.instructions || ''}
                        onChange={(v) => updateQuestion(qKey, { ...qObj, instructions: v })}
                        placeholder="State the prompt or question to judge..."
                      />
                    </Field>

                    {/* CHOICE SPECIFIC CRITERIA */}
                    {qType === 'choice' && (
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
                            {'Choices & Explanations (' + Object.keys(criteria).length + ')'}
                          </label>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              type="button"
                              onClick={() =>
                                setEditorMode((prev) => ({ ...prev, [qKey]: 'criteria' }))
                              }
                              style={{
                                padding: '2px 7px',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 600,
                                cursor: 'pointer',
                                border: isCriteriaMode ? '1px solid #2563EB' : '1px solid #E2E8F0',
                                backgroundColor: isCriteriaMode ? '#EFF6FF' : 'transparent',
                                color: isCriteriaMode ? '#1D4ED8' : '#64748B'
                              }}
                            >
                              Detailed
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setEditorMode((prev) => ({ ...prev, [qKey]: 'simple' }))
                              }
                              style={{
                                padding: '2px 7px',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 600,
                                cursor: 'pointer',
                                border: !isCriteriaMode ? '1px solid #2563EB' : '1px solid #E2E8F0',
                                backgroundColor: !isCriteriaMode ? '#EFF6FF' : 'transparent',
                                color: !isCriteriaMode ? '#1D4ED8' : '#64748B'
                              }}
                            >
                              List
                            </button>
                          </div>
                        </div>

                        {isCriteriaMode ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {Object.entries(criteria).map(([cName, cDesc], cIdx) => (
                              <div
                                key={cName + '-' + cIdx}
                                style={{
                                  padding: 8,
                                  borderRadius: 6,
                                  border: '1px solid #E2E8F0',
                                  backgroundColor: '#F8FAFC',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 4
                                }}
                              >
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                  <input
                                    type="text"
                                    defaultValue={cName}
                                    onBlur={(e) =>
                                      handleUpdateChoiceKey(qKey, qObj, cName, e.target.value)
                                    }
                                    style={{
                                      fontWeight: 700,
                                      fontSize: 12,
                                      padding: '3px 6px',
                                      borderRadius: 4,
                                      border: '1px solid #CBD5E1',
                                      backgroundColor: '#FFFFFF',
                                      flex: 1
                                    }}
                                    placeholder="Option Label"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveChoice(qKey, qObj, cName)}
                                    title="Remove Option"
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
                                <textarea
                                  rows={2}
                                  value={cDesc}
                                  onChange={(e) =>
                                    handleUpdateChoiceExplanation(qKey, qObj, cName, e.target.value)
                                  }
                                  style={{
                                    fontSize: 11,
                                    lineHeight: '1.4',
                                    padding: '4px 6px',
                                    borderRadius: 4,
                                    border: '1px solid #E2E8F0',
                                    backgroundColor: '#FFFFFF',
                                    fontFamily: 'inherit'
                                  }}
                                  placeholder={'Boundary guideline for ' + cName + '...'}
                                />
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => handleAddChoice(qKey, qObj)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 5,
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                                border: '1px dashed #93C5FD',
                                backgroundColor: '#EFF6FF',
                                color: '#1D4ED8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4
                              }}
                            >
                              <FiPlus size={12} /> Add Choice Option
                            </button>
                          </div>
                        ) : (
                          <CommaArrayEditor
                            value={Object.keys(criteria)}
                            onChange={(opts) => {
                              const list = Array.isArray(opts)
                                ? opts
                                : String(opts).split(',').map((s) => s.trim()).filter(Boolean);
                              const newC = {};
                              list.forEach((opt) => {
                                newC[opt] = criteria[opt] || 'Criteria description for ' + opt;
                              });
                              commitChoiceCriteria(qKey, qObj, newC);
                            }}
                            placeholder="Option1, Option2, Option3..."
                          />
                        )}
                      </div>
                    )}

                    {/* NOUL SPECIFIC */}
                    {qType === 'noul' && (
                      <div
                        style={{
                          padding: 10,
                          borderRadius: 6,
                          backgroundColor: '#F0FDF4',
                          border: '1px solid #BBF7D0',
                          fontSize: 11,
                          color: '#166534',
                          lineHeight: '1.5'
                        }}
                      >
                        <strong>Noul Primitive:</strong> Evaluates condition against state and returns calibrated probability of yes (0.0 to 1.0). The resulting float is stamped directly onto <code>row['{qKey}']</code>.
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
                          {(Array.isArray(criteria) ? criteria : ['Level 0', 'Level 1']).map(
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
            hint="Context key containing tabular findings (default: excel_json_data)."
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
            hint="Context key where tagged findings are saved (default: excel_json_data)."
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
          hint="Column headers serialized into state context for Jev to evaluate."
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

      {/* MODEL & API SETTINGS */}
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
          <FiCpu size={13} /> Model & Performance
        </div>

        <Field
          label="Jev Model"
          hint="TypeSafe AI model version, or custom System 1 model."
        >
          <Select
            value={isCustomModel ? 'custom-model' : currentModel}
            onChange={(v) => {
              if (v === 'custom-model') {
                update({ jev_model: 'custom-model' });
              } else {
                update({ jev_model: v });
              }
            }}
            options={JEV_MODELS}
          />
        </Field>

        {isCustomModel && (
          <Field
            label="Custom Model Identifier"
            hint="Enter your custom System 1 / Jev model checkpoint identifier."
          >
            <Input
              value={currentModel === 'custom-model' ? '' : currentModel}
              onChange={(v) => update({ jev_model: v || 'custom-model' })}
              placeholder="e.g. jev-custom-v1 or laya-checkpoint-v1"
            />
          </Field>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field
            label="Concurrency"
            hint="Simultaneous HTTP calls"
          >
            <Input
              type="number"
              value={data.jev_concurrency ?? 25}
              onChange={(v) => update({ jev_concurrency: Number(v) || 1 })}
              placeholder="25"
            />
          </Field>

          <Field
            label="Timeout (seconds)"
            hint="Per-request timeout"
          >
            <Input
              type="number"
              value={data.jev_timeout_seconds ?? 15}
              onChange={(v) => update({ jev_timeout_seconds: Number(v) || 15 })}
              placeholder="15"
            />
          </Field>
        </div>

        <Field
          label="API Endpoint URL"
          hint="System One API endpoint URL."
        >
          <Input
            value={
              !data.jev_api_url || data.jev_api_url.includes('/chat/completions')
                ? 'https://api.typesafe.ai/v1/systemone'
                : data.jev_api_url
            }
            onChange={(v) => update({ jev_api_url: v })}
            placeholder="https://api.typesafe.ai/v1/systemone"
          />
        </Field>

        <Field
          label="API Key Environment Variable"
          hint="Environment variable containing your TypeSafe AI token (e.g. TYPESAFE_API_KEY)."
        >
          <Input
            value={
              !data.jev_api_key_env || data.jev_api_key_env === 'OPENAI_API_KEY'
                ? 'TYPESAFE_API_KEY'
                : data.jev_api_key_env
            }
            onChange={(v) => update({ jev_api_key_env: v })}
            placeholder="TYPESAFE_API_KEY"
          />
        </Field>

        <Field
          label="Direct API Key Override (Optional)"
          hint="Optional: override the backend environment variable directly."
        >
          <Input
            type="password"
            value={data.jev_api_key ?? ''}
            onChange={(v) => update({ jev_api_key: v })}
            placeholder="ts-..."
          />
        </Field>
      </div>
    </>
  );
}
