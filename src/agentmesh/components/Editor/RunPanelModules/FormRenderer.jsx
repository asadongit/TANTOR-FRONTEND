import React from 'react';
import { FiStar } from 'react-icons/fi';
import CustomSelect from './CustomSelect';
import FileUploadField from './FileUploadField';
import { THEME_ACCENT, THEME_SECONDARY, THEME_TEXT } from './constants';

export default function FormRenderer({ config, context, onSubmit, isLoading }) {
  const [formData, setFormData] = React.useState({});
  const [errors, setErrors] = React.useState({});
  const [clickedDecision, setClickedDecision] = React.useState(null);

  const finalConfig = React.useMemo(() => {
    let baseConfig = config;
    if (config.form_use_context_schema && context.form_schema && Array.isArray(context.form_schema)) {
      baseConfig = { ...config, form_fields: context.form_schema };
    }
    const activeFields = (baseConfig.form_fields || []).filter(f => f.enabled !== false);
    return { ...baseConfig, form_fields: activeFields };
  }, [config, context.form_schema]);

  const validate = () => {
    const newErrors = {};
    const fields = finalConfig.form_fields || [];
    fields.forEach(f => {
      const val = formData[f.id];
      const isEmpty = !val || (Array.isArray(val) && val.length === 0);
      if (f.type !== 'remark' && f.required && isEmpty) {
        newErrors[f.id] = 'This field is required';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        decision: clickedDecision || finalConfig.form_submit_label || 'Submit'
      });
    }
  };

  const updateField = (id, val) => {
    setFormData(prev => ({ ...prev, [id]: val }));
    if (errors[id]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const resolveValue = React.useCallback((val) => {
    if (typeof val !== 'string') return val;
    return val.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
      const trimmedPath = path.trim();
      
      const parts = trimmedPath.split('.');
      let current = context;
      for (const part of parts) {
        if (current === null || current === undefined) break;
        current = current[part];
      }
      
      if ((current === undefined || current === null) && context.latest_api_result) {
        let tempVal = context.latest_api_result;
        for (const part of parts) {
          if (tempVal === null || tempVal === undefined) {
            tempVal = undefined;
            break;
          }
          tempVal = tempVal[part];
        }
        if (tempVal !== undefined && tempVal !== null) {
          current = tempVal;
        }
      }

      if (current !== undefined && current !== null) {
        return typeof current === 'object' ? JSON.stringify(current) : String(current);
      }
      
      if (context[trimmedPath] !== undefined && context[trimmedPath] !== null) {
        const directVal = context[trimmedPath];
        return typeof directVal === 'object' ? JSON.stringify(directVal) : String(directVal);
      }
      
      return `{{${trimmedPath}}}`;
    });
  }, [context]);

  const resolveOptions = React.useCallback((rawOptions) => {
    console.log("[resolveOptions] rawOptions:", rawOptions, "context:", context);
    if (!Array.isArray(rawOptions)) return [];
    
    let resolved = [];
    rawOptions.forEach(opt => {
      const optStr = typeof opt === 'string' ? opt : (opt.value || '');
      const match = optStr.match(/^{{(.+)}}$/);
      if (match) {
        const varName = match[1].trim();
        
        const parts = varName.split('.');
        let value = context;
        for (const part of parts) {
          if (value === null || value === undefined) {
            value = undefined;
            break;
          }
          value = value[part];
        }

        if (value === undefined && context.latest_api_result) {
          let tempVal = context.latest_api_result;
          for (const part of parts) {
            if (tempVal === null || tempVal === undefined) {
              tempVal = undefined;
              break;
            }
            tempVal = tempVal[part];
          }
          if (tempVal !== undefined) {
            value = tempVal;
          }
        }

        if (value === undefined && context[varName] !== undefined) {
          value = context[varName];
        }

        if (Array.isArray(value)) {
          resolved = [...resolved, ...value];
        } else if (value !== undefined && value !== null) {
          if (typeof value === 'string' && value.trim().startsWith('[') && value.trim().endsWith(']')) {
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed)) {
                resolved = [...resolved, ...parsed];
              } else {
                resolved.push(value);
              }
            } catch {
              resolved.push(value);
            }
          } else {
            resolved.push(value);
          }
        } else {
          resolved.push(opt);
        }
      } else {
        resolved.push(opt);
      }
    });
    return [...new Set(resolved)].filter(v => v !== null && v !== undefined && String(v).trim() !== '');
  }, [context]);

  React.useEffect(() => {
    const initial = {};
    const fields = finalConfig.form_fields || [];
    fields.forEach(f => {
      if (f.default_value !== undefined && f.default_value !== null && f.default_value !== '') {
        initial[f.id] = resolveValue(f.default_value);
      } 
      else if (f.type === 'select' && f.required) {
        const options = resolveOptions(f.options);
        if (options.length > 0) {
          const firstOpt = options[0];
          initial[f.id] = typeof firstOpt === 'string' ? firstOpt : (firstOpt.value || '');
        }
      }
      else if (f.type === 'multiselect' || f.type === 'checkbox') {
        initial[f.id] = f.default_value || [];
      }
      else if (f.type === 'boolean') {
        initial[f.id] = f.default_value !== undefined && f.default_value !== null ? (f.default_value === 'true' || f.default_value === true) : false;
      }
    });
    setFormData(initial);
  }, [finalConfig, resolveOptions, resolveValue]);

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {finalConfig.form_description && (
        <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 4 }}>
          {resolveValue(finalConfig.form_description)}
        </div>
      )}

      {(finalConfig.form_fields || []).map((f) => {
        const resolvedLabel = resolveValue(f.label);
        const resolvedPlaceholder = resolveValue(f.placeholder);
        return (
          <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {f.type !== 'remark' && (
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
                {resolvedLabel} {f.required && <span style={{ color: '#EF4444' }}>*</span>}
              </label>
            )}

            {f.type === 'textarea' ? (
              <textarea
                value={formData[f.id] || ''}
                onChange={(e) => updateField(f.id, e.target.value)}
                placeholder={resolvedPlaceholder || `Enter ${resolvedLabel?.toLowerCase() || ''}...`}
                disabled={isLoading}
                style={{
                  width: '100%', minHeight: 100, padding: '12px 14px', borderRadius: 10,
                  border: `1px solid ${errors[f.id] ? '#EF4444' : '#E2E8F0'}`,
                  background: '#FFFFFF', fontSize: 13, fontFamily: 'inherit', outline: 'none',
                  resize: 'vertical'
                }}
              />
            ) : f.type === 'select' ? (
              <CustomSelect
                value={formData[f.id] || ''}
                options={resolveOptions(f.options)}
                required={f.required}
                disabled={isLoading}
                placeholder={resolvedPlaceholder || '— Select an option —'}
                hasError={!!errors[f.id]}
                onChange={(val) => updateField(f.id, val)}
              />
            ) : f.type === 'multiselect' ? (
              <div 
                className="modern-scrollbar"
                style={{
                  display: 'flex', flexDirection: 'column', gap: 10,
                  background: '#FFFFFF', padding: '12px 14px', borderRadius: 10,
                  border: `1px solid ${errors[f.id] ? '#EF4444' : '#E2E8F0'}`,
                  maxHeight: '190px', overflowY: 'auto'
                }}
              >
                {resolveOptions(f.options).map(opt => {
                  const optValue = typeof opt === 'string' ? opt : opt.value;
                  const optLabel = typeof opt === 'string' ? opt : opt.label;
                  const isChecked = (formData[f.id] || []).includes(optValue);
                  return (
                    <label key={optValue} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'all 0.2s' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const current = formData[f.id] || [];
                          const next = e.target.checked
                            ? [...current, optValue]
                            : current.filter(v => v !== optValue);
                          updateField(f.id, next);
                        }}
                        disabled={isLoading}
                        style={{ width: 17, height: 17, accentColor: THEME_SECONDARY, cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 13, color: isChecked ? THEME_TEXT : '#6B7280', fontWeight: isChecked ? 600 : 400 }}>{resolveValue(optLabel)}</span>
                    </label>
                  );
                })}
              </div>
            ) : f.type === 'boolean' ? (
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!formData[f.id]}
                  onChange={(e) => updateField(f.id, e.target.checked)}
                  disabled={isLoading}
                  style={{ width: 18, height: 18, accentColor: THEME_SECONDARY }}
                />
                <span style={{ fontSize: 13, color: '#4B5563' }}>{resolvedLabel}</span>
              </label>
            ) : f.type === 'rating' ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0' }}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const isSelected = star <= (formData[f.id] || 0);
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => updateField(f.id, star)}
                      disabled={isLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        padding: 0,
                        color: isSelected ? '#F59E0B' : '#D1D5DB',
                        transition: 'transform 0.1s ease, color 0.1s ease',
                        outline: 'none'
                      }}
                      onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(1.2)'; }}
                      onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(1.0)'; }}
                    >
                      <FiStar size={26} fill={isSelected ? '#F59E0B' : 'none'} strokeWidth={2} />
                    </button>
                  );
                })}
                {formData[f.id] > 0 && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', marginLeft: 8 }}>
                    {formData[f.id]} / 5
                  </span>
                )}
              </div>
            ) : f.type === 'email' || f.type === 'password' || f.type === 'number' ? (
              <input
                type={f.type}
                value={formData[f.id] || ''}
                onChange={(e) => updateField(f.id, e.target.value)}
                placeholder={resolvedPlaceholder || `Enter ${resolvedLabel?.toLowerCase() || ''}...`}
                disabled={isLoading}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  border: `1px solid ${errors[f.id] ? '#EF4444' : '#E2E8F0'}`,
                  background: '#FFFFFF', fontSize: 13, fontFamily: 'inherit', outline: 'none'
                }}
              />
            ) : f.type === 'remark' ? (
              <div style={{
                fontSize: 13,
                color: '#4B5563',
                lineHeight: 1.6,
                background: '#F8FAFC',
                padding: '12px 14px',
                borderRadius: 10,
                borderLeft: `4px solid ${THEME_ACCENT}`,
                whiteSpace: 'pre-wrap'
              }}>
                {resolveValue(f.content) || '...'}
              </div>
            ) : f.type === 'file' ? (
              <FileUploadField
                field={f}
                value={formData[f.id]}
                onChange={(val) => updateField(f.id, val)}
                isLoading={isLoading}
                threadId={context?.thread_id || 'default_thread'}
              />
            ) : (
              <input
                type={f.type || 'text'}
                value={formData[f.id] || ''}
                onChange={(e) => updateField(f.id, e.target.value)}
                placeholder={resolvedPlaceholder || `Enter ${resolvedLabel?.toLowerCase() || ''}...`}
                disabled={isLoading}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: `1px solid ${errors[f.id] ? '#EF4444' : '#E2E8F0'}`,
                  background: '#FFFFFF', fontSize: 13, outline: 'none'
                }}
              />
            )}

            {f.type !== 'remark' && errors[f.id] && (
              <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }}>{errors[f.id]}</div>
            )}
          </div>
        );
      })}

      <div style={{ marginTop: 12, paddingTop: 20, borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {finalConfig.form_decisions && finalConfig.form_decisions.length > 0 ? (
          finalConfig.form_decisions.map((dec) => {
            const decId = dec && typeof dec === 'object' ? dec.id : dec;
            const decLabel = dec && typeof dec === 'object' ? dec.label : dec;
            const isDanger = decId.toLowerCase() === 'cancel' || decId.toLowerCase() === 'reject';
            return (
              <button
                key={decId}
                type="submit"
                disabled={isLoading}
                onClick={() => setClickedDecision(decId)}
                style={{
                  flex: 1, minWidth: '120px', padding: '12px 18px', borderRadius: 10,
                  background: isDanger ? 'rgba(239, 68, 68, 0.08)' : 'rgba(99, 102, 241, 0.08)',
                  color: isDanger ? '#EF4444' : 'var(--theme-primary, #6366F1)',
                  border: `1px solid ${isDanger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)'}`,
                  fontWeight: '700', fontSize: 13,
                  cursor: isLoading ? 'wait' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (isLoading) return;
                  e.currentTarget.style.background = isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)';
                  e.currentTarget.style.borderColor = isDanger ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.4)';
                }}
                onMouseLeave={(e) => {
                  if (isLoading) return;
                  e.currentTarget.style.background = isDanger ? 'rgba(239, 68, 68, 0.08)' : 'rgba(99, 102, 241, 0.08)';
                  e.currentTarget.style.borderColor = isDanger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)';
                }}
              >
                {decLabel.toUpperCase()}
              </button>
            );
          })
        ) : (
          <button
            type="submit"
            disabled={isLoading}
            onClick={() => setClickedDecision(finalConfig.form_submit_label || 'Submit')}
            style={{
              width: '100%', padding: '12px 18px', borderRadius: 10,
              background: isLoading ? 'rgba(229, 231, 235, 0.5)' : 'rgba(99, 102, 241, 0.08)',
              color: isLoading ? '#9CA3AF' : 'var(--theme-primary, #6366F1)',
              border: `1px solid ${isLoading ? 'rgba(229, 231, 235, 0.8)' : 'rgba(99, 102, 241, 0.2)'}`,
              fontWeight: '700', fontSize: 13,
              cursor: isLoading ? 'wait' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (isLoading) return;
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
            }}
            onMouseLeave={(e) => {
              if (isLoading) return;
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
            }}
          >
            {(finalConfig.form_submit_label || 'SUBMIT').toUpperCase()}
          </button>
        )}
      </div>

      {isLoading && (
        <div style={{
          position: 'absolute',
          top: -24,
          left: -24,
          right: -24,
          bottom: -24,
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(4px)',
          borderRadius: 24,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12
        }}>
          <div style={{
            width: 38,
            height: 38,
            border: '3px solid rgba(99, 102, 241, 0.2)',
            borderTopColor: '#6366F1',
            borderRadius: '50%',
            animation: 'formModalSpin 0.8s linear infinite'
          }} />
          <style>{`
            @keyframes formModalSpin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', letterSpacing: '0.02em' }}>
            Processing Submission...
          </div>
        </div>
      )}
    </form>
  );
}
