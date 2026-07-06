import React, { useState } from 'react';

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8,
  fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff',
  transition: 'border-color 0.15s',
};

const selectStyle = {
  ...inputStyle, cursor: 'pointer', appearance: 'auto',
};

const questionCardStyle = {
  border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 18px',
  marginBottom: 12, background: '#fafbfc',
};

export default function FollowupRenderer({ config, isLoading, onSubmit }) {
  const questions = config?.questions || [];
  const title = config?.title || 'Additional Information Required';
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});

  const total = questions.length;

  const setAnswer = (qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
    if (errors[qId]) {
      setErrors(prev => { const copy = { ...prev }; delete copy[qId]; return copy; });
    }
  };

  const validate = () => {
    const newErrors = {};
    questions.forEach((q, idx) => {
      if (q.required !== false && idx < total - 1) {
        const val = answers[q.id];
        if (val === undefined || val === null || String(val).trim() === '') {
          newErrors[q.id] = 'This field is required';
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const filtered = {};
    questions.forEach(q => {
      if (answers[q.id] !== undefined && answers[q.id] !== null && String(answers[q.id]).trim() !== '') {
        filtered[q.id] = answers[q.id];
      }
    });
    onSubmit({ followup_answers: filtered });
  };

  const handleSkip = () => {
    const filtered = {};
    questions.forEach(q => {
      const idx = questions.indexOf(q);
      if (idx < total - 1 && answers[q.id] !== undefined && answers[q.id] !== null && String(answers[q.id]).trim() !== '') {
        filtered[q.id] = answers[q.id];
      }
    });
    onSubmit({ followup_answers: filtered, skipped: true });
  };

  const renderField = (q) => {
    const type = q.type || 'text';
    const val = answers[q.id] ?? '';

    if (type === 'select') {
      return (
        <select
          style={selectStyle}
          value={val}
          onChange={e => setAnswer(q.id, e.target.value)}
          onFocus={e => (e.target.style.borderColor = '#6366f1')}
          onBlur={e => (e.target.style.borderColor = '#d1d5db')}
        >
          <option value="">-- Select --</option>
          {(q.suggestions || q.options || []).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (type === 'boolean') {
      return (
        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          {['Yes', 'No'].map(opt => (
            <label key={opt} style={{
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              fontSize: 13, padding: '6px 14px', borderRadius: 8,
              border: val === opt ? '2px solid #6366f1' : '1px solid #d1d5db',
              background: val === opt ? '#eef2ff' : '#fff', fontWeight: val === opt ? 600 : 400,
            }}>
              <input
                type="radio" name={q.id} value={opt}
                checked={val === opt}
                onChange={() => setAnswer(q.id, opt)}
                style={{ margin: 0, accentColor: '#6366f1' }}
              />
              {opt}
            </label>
          ))}
        </div>
      );
    }

    if (type === 'number') {
      return (
        <input
          type="number" style={inputStyle}
          value={val} placeholder="Enter a number..."
          onChange={e => setAnswer(q.id, e.target.value)}
          onFocus={e => (e.target.style.borderColor = '#6366f1')}
          onBlur={e => (e.target.style.borderColor = '#d1d5db')}
        />
      );
    }

    const isLast = questions.indexOf(q) === total - 1;
    return (
      <div>
        <textarea
          style={{ ...inputStyle, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }}
          value={val} placeholder={isLast ? 'Optional — or click Skip below' : 'Type your answer...'}
          onChange={e => setAnswer(q.id, e.target.value)}
          onFocus={e => (e.target.style.borderColor = '#6366f1')}
          onBlur={e => (e.target.style.borderColor = '#d1d5db')}
        />
        {isLast && (
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
            Last question — leave blank and click Skip to move on
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px', lineHeight: 1.5 }}>
        {title}
      </p>

      {questions.map((q, idx) => (
        <div key={q.id} style={questionCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', lineHeight: 1.4, flex: 1 }}>
              {idx + 1}. {q.question}
              {q.required !== false && idx < total - 1 && (
                <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>
              )}
              {idx === total - 1 && (
                <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6, fontSize: 12 }}>
                  (optional)
                </span>
              )}
            </label>
          </div>
          {renderField(q)}
          {errors[q.id] && (
            <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>
              {errors[q.id]}
            </div>
          )}
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          style={{
            flex: 1, padding: '11px 16px', background: '#065F46', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
            cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? 'Submitting...' : 'Submit Answers'}
        </button>
        {total > 0 && (
          <button
            onClick={handleSkip}
            disabled={isLoading}
            style={{
              padding: '11px 20px', background: '#fff', color: '#6b7280',
              border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1,
            }}
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
