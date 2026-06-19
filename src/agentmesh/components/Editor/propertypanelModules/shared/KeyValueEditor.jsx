import React, { memo, useState, useEffect, useRef } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { Input } from './primitives';

export const KeyValueEditor = memo(function KeyValueEditor({ value = {}, onChange, label, hint }) {
  const [list, setList] = useState([]);
  const prevValueRef = useRef(null);

  useEffect(() => {
    const currentJson = JSON.stringify(value);
    if (prevValueRef.current !== currentJson) {
      const newList = Object.entries(value).map(([k, v], idx) => ({
        id: `kv-${idx}-${k}-${Math.random().toString(36).substring(2, 6)}`,
        key: k,
        value: v
      }));
      setList(newList);
      prevValueRef.current = currentJson;
    }
  }, [value]);

  const propagate = (newList) => {
    const nextObj = {};
    newList.forEach(item => {
      if (item.key) {
        nextObj[item.key] = item.value;
      }
    });
    prevValueRef.current = JSON.stringify(nextObj);
    onChange(nextObj);
  };

  const updateKey = (id, newKey) => {
    const newList = list.map(item => item.id === id ? { ...item, key: newKey } : item);
    setList(newList);
    propagate(newList);
  };

  const updateVal = (id, newVal) => {
    const newList = list.map(item => item.id === id ? { ...item, value: newVal } : item);
    setList(newList);
    propagate(newList);
  };

  const removeEntry = (id) => {
    const newList = list.filter(item => item.id !== id);
    setList(newList);
    propagate(newList);
  };

  const addEntry = () => {
    const newId = `kv-new-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newList = [...list, { id: newId, key: `key_${list.length + 1}`, value: '' }];
    setList(newList);
    propagate(newList);
  };

  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">{label}</label>
      <div className="flex flex-col gap-1.5">
        {list.map((item) => (
          <div key={item.id} className="flex gap-1.5 items-center">
            <Input
              style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}
              value={item.key}
              onChange={(newKey) => updateKey(item.id, newKey)}
              placeholder="Key"
            />
            <Input
              style={{ flex: 2, padding: '6px 10px', fontSize: 12 }}
              value={item.value}
              onChange={(newVal) => updateVal(item.id, newVal)}
              placeholder="Value"
            />
            <button
              onClick={() => removeEntry(item.id)}
              className="bg-transparent border-none text-red-500 cursor-pointer p-1"
            >
              <FiTrash2 size={12} />
            </button>
          </div>
        ))}
        <button
          onClick={addEntry}
          className="p-2 bg-slate-50 border border-dashed border-[var(--border)] rounded-lg text-[11px] text-[var(--accent-btn)] cursor-pointer font-semibold mt-1"
        >
          + Add Field
        </button>
      </div>
      {hint && <div className="text-[11px] text-[var(--text-muted)] mt-1.5">{hint}</div>}
    </div>
  );
});
