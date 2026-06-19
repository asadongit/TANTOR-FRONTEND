import React, { useState, useRef, memo } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { Field, Select, Input, Textarea } from './primitives';
import { KeyValueEditor } from './KeyValueEditor';

export const ApiConfigSection = memo(function ApiConfigSection({ data, update, prefix = 'api_', urlKey }) {
  const [activeTab, setActiveTab] = useState('endpoint');
  const scrollRef = useRef(null);

  const tabs = [
    { id: 'endpoint', label: 'Endpoint' },
    { id: 'headers', label: 'Headers' },
    { id: 'auth', label: 'Auth' },
    { id: 'body', label: 'Body' }
  ];

  const method = data[`${prefix}method`] || 'POST';
  const actualUrlKey = urlKey || `${prefix}url`;

  const scrollTabs = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 80, behavior: 'smooth' });
    }
  };

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden mb-5 bg-white">
      <div className="flex items-center bg-slate-50 border-b border-[var(--border)]">
        <button onClick={() => scrollTabs(-1)} className="bg-transparent border-none cursor-pointer p-2.5 text-[var(--text-muted)] text-[10px]">◀</button>
        <div ref={scrollRef} className="scrollbar-none flex flex-1 overflow-x-auto select-none touch-pan-x" style={{ scrollbarWidth: 'none' }}>
          {tabs.map(t => (
            <div
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`py-2.5 px-4 text-xs cursor-pointer flex-1 text-center transition-all duration-200 ${activeTab === t.id ? 'font-bold text-[var(--accent-btn)] border-b-2 border-[var(--accent-btn)]' : 'font-medium text-[var(--text-muted)] border-b-2 border-transparent'}`}
            >
              {t.label}
            </div>
          ))}
        </div>
        <button onClick={() => scrollTabs(1)} className="bg-transparent border-none cursor-pointer p-2.5 text-[var(--text-muted)] text-[10px]">▶</button>
      </div>

      <div className="p-4">
        {activeTab === 'endpoint' && (
          <div className="flex gap-2.5">
            <div className="w-[120px]">
              <Field label="Method">
                <Select
                  value={method}
                  onChange={(v) => update({ [`${prefix}method`]: v })}
                  options={['GET', 'POST', 'PUT', 'DELETE', 'PATCH']}
                />
              </Field>
            </div>
            <div className="flex-1">
              <Field label="Endpoint URL" hint="Supports {{key}} interpolation">
                <Input
                  value={data[actualUrlKey] || ''}
                  onChange={(v) => update({ [actualUrlKey]: v })}
                  placeholder="https://api.example.com/..."
                />
              </Field>
            </div>
          </div>
        )}

        {activeTab === 'headers' && (
          <>
            <KeyValueEditor
              label="Headers"
              value={data[`${prefix}headers`] || {}}
              onChange={(v) => update({ [`${prefix}headers`]: v })}
              hint="e.g. Content-Type: application/json"
            />
            <KeyValueEditor
              label="Query Params"
              value={data[`${prefix}params`] || {}}
              onChange={(v) => update({ [`${prefix}params`]: v })}
              hint="Appended to the URL"
            />
          </>
        )}

        {activeTab === 'auth' && (
          <>
            {data.connection_id ? (
              <div className="p-3 bg-slate-100 rounded-lg text-xs text-[#64748B] text-center">
                Authentication is automatically handled by the Enterprise Connector (<strong>{data.connection_id}</strong>).
              </div>
            ) : (
              <>
                <Field label="Auth Type">
                  <Select
                    value={data[`${prefix}auth_type`] || 'None'}
                    onChange={(v) => update({ [`${prefix}auth_type`]: v })}
                    options={['None', 'Basic', 'Bearer']}
                  />
                </Field>

                {data[`${prefix}auth_type`] === 'Basic' && (
                  <div className="flex gap-2">
                    <Field label="Username">
                      <Input value={data[`${prefix}auth_config`]?.username} onChange={(v) => update({ [`${prefix}auth_config`]: { ...data[`${prefix}auth_config`], username: v } })} placeholder="user" />
                    </Field>
                    <Field label="Password">
                      <Input value={data[`${prefix}auth_config`]?.password} onChange={(v) => update({ [`${prefix}auth_config`]: { ...data[`${prefix}auth_config`], password: v } })} placeholder="pass" type="password" />
                    </Field>
                  </div>
                )}

                {data[`${prefix}auth_type`] === 'Bearer' && (
                  <Field label="Token">
                    <Input value={data[`${prefix}auth_config`]?.token} onChange={(v) => update({ [`${prefix}auth_config`]: { ...data[`${prefix}auth_config`], token: v } })} placeholder="Bearer token…" type="password" />
                  </Field>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'body' && (
          <>
            {!['POST', 'PUT', 'PATCH'].includes(method) && (
              <div className="p-3 bg-slate-100 rounded-lg text-xs text-[#64748B] text-center">
                Request Body is typically not used with {method} requests.
              </div>
            )}
            {['POST', 'PUT', 'PATCH'].includes(method) && (
              <Field label="Request Body" hint="JSON or raw text. Supports {{interpolation}}.">
                <Textarea
                  value={data[`${prefix}body`] || ''}
                  onChange={(v) => update({ [`${prefix}body`]: v })}
                  placeholder='{"id": "{{item.id}}"}'
                  rows={6}
                />
              </Field>
            )}
          </>
        )}
      </div>
    </div>
  );
});

export const CollapsibleApiConfig = memo(function CollapsibleApiConfig({ data, update, idx, onRemove }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-4 border border-[var(--border)] rounded-lg overflow-hidden bg-white">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 px-3.5 flex justify-between items-center cursor-pointer transition-colors duration-200 ${isOpen ? 'bg-slate-50 border-b border-[var(--border)]' : 'bg-white'}`}
      >
        <div className="text-[11px] font-bold text-[var(--text-primary)] flex items-center gap-2">
          <span className="text-[var(--text-muted)] text-[10px]">{isOpen ? '▼' : '▶'}</span>
          Additional API #{idx + 1}
          {data.url && <span className="font-normal text-[var(--text-muted)]">- {data.url}</span>}
        </div>
        <div
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="flex items-center justify-center w-6 h-6 rounded cursor-pointer transition-colors duration-200 hover:bg-red-100"
        >
          <FiTrash2 size={14} className="text-red-500" />
        </div>
      </div>
      {isOpen && (
        <div className="p-3.5">
          <ApiConfigSection data={data} update={update} prefix="" urlKey="url" />
        </div>
      )}
    </div>
  );
});

export const CustomCollapsibleApiConfig = memo(function CustomCollapsibleApiConfig({ apiDef, index, list, keyName, update, providerOptions = [] }) {
  const [isOpen, setIsOpen] = useState(true);

  const localUpdate = (changes) => {
    const next = [...list];
    next[index] = { ...next[index], ...changes };
    update({ [keyName]: next });
  };

  const isCustom = apiDef.provider === 'custom' || !apiDef.provider;

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-white mt-3">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 px-4 flex justify-between items-center cursor-pointer transition-colors duration-200 ${isOpen ? 'bg-slate-50 border-b border-[var(--border)]' : 'bg-slate-100'}`}
      >
        <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
          <span className="text-[var(--text-muted)] text-[10px] mr-1 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>{isOpen ? '▼' : '▶'}</span>
          <div className={`w-2 h-2 rounded-full ${isCustom ? 'bg-[#8B5CF6]' : 'bg-[#10B981]'}`} />

          <select
            value={apiDef.provider || 'custom'}
            onChange={(e) => localUpdate({ provider: e.target.value })}
            className="px-2 py-1 rounded-md border border-[var(--border)] bg-white text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer min-w-[160px]"
          >
            {providerOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          {isCustom && (
            <input
              placeholder="API Name..."
              value={apiDef.name || ''}
              onChange={(e) => localUpdate({ name: e.target.value })}
              className="border-none bg-transparent font-medium text-xs outline-none text-[var(--text-primary)] flex-1 ml-2"
            />
          )}
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            const next = list.filter((_, i) => i !== index);
            update({ [keyName]: next });
          }}
          className="flex items-center justify-center w-7 h-7 rounded cursor-pointer transition-colors duration-200 hover:bg-red-100"
        >
          <FiTrash2 size={15} className="text-red-500" />
        </div>
      </div>
      {isOpen && (
        <div className="p-4">
          {isCustom ? (
            <ApiConfigSection data={apiDef} update={localUpdate} prefix="" urlKey="url" />
          ) : (
            <div className="p-3 px-4 bg-green-50 border border-dashed border-[#86EFAC] rounded-lg text-green-800 text-xs font-medium flex items-center gap-2">
              <span className="text-base">✨</span> Built-in Mock Integration. Simulated JSON response will be automatically injected.
            </div>
          )}
        </div>
      )}
    </div>
  );
});
