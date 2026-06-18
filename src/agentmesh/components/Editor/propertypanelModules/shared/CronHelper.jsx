import React, { useState, useEffect, useRef, memo } from 'react';
import { Field, Input, Select } from './primitives';

export const CronHelper = memo(function CronHelper({ value, onChange }) {
  const getInitialState = () => {
    let mode = 'simple';
    let freq = 'daily';
    let hour = '09';
    let min = '00';
    let days = ['1', '2', '3', '4', '5'];

    if (!value || value === '* * * * *' || value === '*/1 * * * *') {
      return { mode, freq: 'minute', hour, min, days };
    }

    const dailyMatch = value.match(/^(\d{1,2}) (\d{1,2}) \* \* \*$/);
    if (dailyMatch) {
      return { mode, freq: 'daily', hour: dailyMatch[2].padStart(2, '0'), min: dailyMatch[1].padStart(2, '0'), days };
    }

    const weeklyMatch = value.match(/^(\d{1,2}) (\d{1,2}) \* \* ([\d,]+)$/);
    if (weeklyMatch) {
      return { mode, freq: 'weekly', hour: weeklyMatch[2].padStart(2, '0'), min: weeklyMatch[1].padStart(2, '0'), days: weeklyMatch[3].split(',') };
    }

    if (value === '0 * * * *') {
      return { mode, freq: 'hourly', hour, min, days };
    }

    return { mode: 'advanced', freq, hour, min, days };
  };

  const initialState = getInitialState();

  const [mode, setMode] = useState(initialState.mode);
  const [freq, setFreq] = useState(initialState.freq);
  const [hour, setHour] = useState(initialState.hour);
  const [min, setMin] = useState(initialState.min);
  const [days, setDays] = useState(initialState.days);

  const lastInternalValue = useRef(value);

  useEffect(() => {
    if (!value || value === lastInternalValue.current) return;

    const trySetSimple = (f, h, m, d) => {
      setMode('simple');
      setFreq(f);
      if (h !== undefined) setHour(h);
      if (m !== undefined) setMin(m);
      if (d !== undefined) setDays(d);
    };

    const dailyMatch = value.match(/^(\d{1,2}) (\d{1,2}) \* \* \*$/);
    if (dailyMatch) return trySetSimple('daily', dailyMatch[2].padStart(2, '0'), dailyMatch[1].padStart(2, '0'));

    const weeklyMatch = value.match(/^(\d{1,2}) (\d{1,2}) \* \* ([\d,]+)$/);
    if (weeklyMatch) return trySetSimple('weekly', weeklyMatch[2].padStart(2, '0'), weeklyMatch[1].padStart(2, '0'), weeklyMatch[3].split(','));

    if (value === '0 * * * *') return trySetSimple('hourly');
    if (value === '*/1 * * * *' || value === '* * * * *') return trySetSimple('minute');

    setMode('advanced');
  }, [value]);

  useEffect(() => {
    if (mode === 'advanced') return;
    let cron = '* * * * *';
    if (freq === 'daily') cron = `${parseInt(min)} ${parseInt(hour)} * * *`;
    else if (freq === 'weekly') cron = `${parseInt(min)} ${parseInt(hour)} * * ${days.join(',')}`;
    else if (freq === 'hourly') cron = `0 * * * *`;
    else if (freq === 'minute') cron = `* * * * *`;

    if (cron !== value) {
      lastInternalValue.current = cron;
      onChange(cron);
    }
  }, [freq, hour, min, days, mode, value, onChange]);

  const btnClass = (active) => 
    `px-2.5 py-1.5 rounded-md text-[11px] font-semibold cursor-pointer transition-all duration-150 border border-solid ${active ? 'bg-[var(--accent-glow)] border-[var(--accent-btn)] text-[var(--accent-btn)]' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`;

  return (
    <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[var(--border)]">
      <div className="flex gap-1 mb-3 bg-slate-100 p-1 rounded-lg">
        <button onClick={() => setMode('simple')} className={`${btnClass(mode === 'simple')} flex-1 border-none shadow-none`}>Simple</button>
        <button onClick={() => setMode('advanced')} className={`${btnClass(mode === 'advanced')} flex-1 border-none shadow-none`}>Advanced</button>
      </div>

      {mode === 'advanced' ? (
        <Field label="Raw Cron Expression" hint="Standard 5-column crontab format.">
          <Input value={value} onChange={onChange} placeholder="* * * * *" />
        </Field>
      ) : (
        <>
          <Field label="Frequency">
            <div className="flex flex-wrap gap-1.5">
              {['daily', 'weekly', 'hourly', 'minute'].map(f => (
                <button key={f} onClick={() => setFreq(f)} className={btnClass(freq === f)}>{f.toUpperCase()}</button>
              ))}
            </div>
          </Field>

          {(freq === 'daily' || freq === 'weekly') && (
            <Field label="At Time (24h)">
              <div className="flex items-center gap-2">
                <Select value={hour} onChange={setHour} options={Array.from({ length: 24 }, (_, i) => ({ value: i.toString().padStart(2, '0'), label: i.toString().padStart(2, '0') }))} />
                <span className="font-bold">:</span>
                <Select value={min} onChange={setMin} options={Array.from({ length: 60 }, (_, i) => ({ value: i.toString().padStart(2, '0'), label: i.toString().padStart(2, '0') }))} />
              </div>
            </Field>
          )}

          {freq === 'weekly' && (
            <Field label="On Days">
              <div className="flex flex-wrap gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => {
                  const active = days.includes(i.toString());
                  return (
                    <button key={d} onClick={() => setDays(active ? days.filter(x => x !== i.toString()) : [...days, i.toString()])}
                      className={`${btnClass(active)} w-9 py-1.5 text-center`}>{d[0]}</button>
                  );
                })}
              </div>
            </Field>
          )}

          <div className="text-[11px] text-slate-500 mt-2 italic font-semibold">
            Generated Cron: <code className="text-[#0F172A] bg-slate-200 px-1 py-0.5 rounded">{value}</code>
          </div>
        </>
      )}
    </div>
  );
});
