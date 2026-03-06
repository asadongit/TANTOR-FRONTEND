import { Handle, Position } from '@xyflow/react';
import { useMigrationContext } from '../MigrationContext';
import { Calendar, X } from "lucide-react";
import { useState, useEffect, useRef } from 'react';

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dayAbbreviations = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const getCurrentDateTimeLocal = () => {
  const tzoffset = (new Date()).getTimezoneOffset() * 60000;
  return new Date(Date.now() - tzoffset).toISOString().slice(0, 16);
};

const getISTDateTimeLocal = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().slice(0, 16);
};

export default function Scheduler({ id }) {
  const { migrationData, setMigrationData } = useMigrationContext();
  const savedData = migrationData[id] || {};
  // Support both old flat shape and new nested shape for edit-mode prefill
  const savedScheduled = savedData.scheduled || {};

  const [selectedOption, setSelectedOption] = useState(savedData.mode === 'scheduled' ? 'auto' : (savedData.mode || 'manual'));
  const [flowType, setFlowType] = useState(savedScheduled.flow_type || savedData.flow_type || 'single_run');
  const [intervalValue, setIntervalValue] = useState(savedScheduled.intervalValue || savedData.intervalValue || '');
  const [frequency, setFrequency] = useState(savedScheduled.frequency || savedData.frequency || '');
  const [runningDays, setRunningDays] = useState(savedScheduled.runningDays || savedData.runningDays || []);

  // Full-replace helper so stale keys never bleed through when switching modes
  const persistData = (data) => {
    setMigrationData((prev) => ({ ...prev, [id]: data }));
  };

  const buildPayload = (overrides = {}) => {
    const mode = overrides.mode ?? selectedOption;
    if (mode === 'manual') {
      return { mode: 'manual', scheduled: {} };
    }
    return {
      mode: 'scheduled',
      scheduled: {
        flow_type: overrides.flow_type ?? flowType,
        endDateTime: '',
        frequency: overrides.frequency ?? frequency,
        intervalType: 'cron',
        intervalValue: overrides.intervalValue ?? intervalValue,
        mode: 'auto',
        runningDays: overrides.runningDays ?? runningDays,
        startDateTime: getISTDateTimeLocal(),
        timeZone: 'ist',
      },
    };
  };

  const persist = (overrides = {}) => persistData(buildPayload(overrides));

  // Push default state into context on mount (so payload is never empty)
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      persist();
    }
  }, []);

  // Sync from context on edit-mode prefill
  useEffect(() => {
    const d = migrationData[id] || {};
    if (!d.mode) return;
    const sched = d.scheduled || {};
    const m = d.mode === 'scheduled' ? 'auto' : d.mode;
    if (m !== selectedOption) setSelectedOption(m);
    const ft = sched.flow_type || d.flow_type;
    if (ft !== undefined && ft !== flowType) setFlowType(ft);
    const iv = sched.intervalValue || d.intervalValue;
    if (iv !== undefined && iv !== intervalValue) setIntervalValue(iv);
    const fr = sched.frequency || d.frequency;
    if (fr !== undefined && fr !== frequency) setFrequency(fr);
    const rd = sched.runningDays || d.runningDays;
    if (rd !== undefined && JSON.stringify(rd) !== JSON.stringify(runningDays)) setRunningDays(rd);
  }, [migrationData[id]]);

  const handleModeChange = (newMode) => {
    setSelectedOption(newMode);
    persist({ mode: newMode });
  };

  const handleFlowTypeChange = (newFlowType) => {
    setFlowType(newFlowType);
    const reset = { flow_type: newFlowType };
    if (newFlowType === 'single_run') {
      setFrequency(''); setRunningDays([]);
      reset.frequency = ''; reset.runningDays = [];
    } else if (newFlowType === 'periodic') {
      setFrequency(''); setRunningDays([]);
      reset.frequency = ''; reset.runningDays = [];
    } else if (newFlowType === 'recurring') {
      setFrequency('');
      reset.frequency = '';
    }
    persist(reset);
  };

  const handleDayToggle = (day) => {
    const newDays = runningDays.includes(day)
      ? runningDays.filter(d => d !== day)
      : [...runningDays, day];
    setRunningDays(newDays);
    persist({ runningDays: newDays });
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[320px] max-w-[320px] relative group">
      <button onClick={() => window.deleteNode?.(id)} className="absolute top-1.5 right-2 p-1">
        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
      </button>

      <Handle type="target" position={Position.Left} style={{ width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ width: 10, height: 10 }} />

      <div className="flex items-center space-x-3 mb-3">
        <Calendar className="w-5 h-5 text-[#8E77BB]" />
        <h3 className="text-black font-medium">Scheduler</h3>
      </div>

      {/* Mode */}
      <div className="mb-3">
        <label className="block text-sm font-semibold text-gray-700 mb-1">Mode</label>
        <div className="flex space-x-4">
          {['manual', 'auto'].map(m => (
            <div className="flex items-center" key={m}>
              <input
                type="radio"
                id={`${m}-${id}`}
                value={m}
                checked={selectedOption === m}
                onChange={() => handleModeChange(m)}
              />
              <label htmlFor={`${m}-${id}`} className="ml-2 text-sm text-gray-700 capitalize">{m}</label>
            </div>
          ))}
        </div>
      </div>

      {selectedOption === 'manual' ? (
        <div className="text-sm text-gray-500 mt-2">Workflow will be triggered manually.</div>
      ) : (
        <div className="mt-4">
          {/* Flow Type */}
          <label className="block text-sm font-semibold text-gray-700 mb-2">Flow Type</label>
          <div className="flex flex-col space-y-2 mb-4">
            {[
              { value: 'single_run', label: 'Single run' },
              { value: 'periodic', label: 'Periodic' },
              { value: 'recurring', label: 'Recurring' },
            ].map(({ value, label }) => (
              <div className="flex items-center" key={value}>
                <input
                  type="radio"
                  id={`${value}-${id}`}
                  value={value}
                  checked={flowType === value}
                  onChange={() => handleFlowTypeChange(value)}
                  className="w-4 h-4"
                  style={{ accentColor: '#8E77BB' }}
                />
                <label htmlFor={`${value}-${id}`} className="ml-2 text-sm text-gray-700">{label}</label>
              </div>
            ))}
          </div>

          {/* Periodic → Frequency */}
          {flowType === 'periodic' && (
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Frequency</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8E77BB]"
                value={frequency}
                onChange={(e) => { setFrequency(e.target.value); persist({ frequency: e.target.value }); }}
              >
                <option value="">Select Frequency</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="half_yearly">Half Yearly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}

          {/* Recurring → Run Days */}
          {flowType === 'recurring' && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Run Days</label>
              <div className="flex gap-2 justify-between">
                {dayAbbreviations.map((abbr, idx) => {
                  const full = dayNames[idx];
                  const isSelected = runningDays.includes(full);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleDayToggle(full)}
                      className={`w-8 h-8 rounded-full text-xs font-medium transition-colors border ${isSelected
                        ? 'bg-[#8E77BB] text-white border-[#8E77BB]'
                        : 'bg-white text-gray-500 border-gray-300 hover:border-[#8E77BB] hover:text-[#8E77BB]'
                        }`}
                    >
                      {abbr}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Schedule Date & Time */}
          <div className="mb-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Schedule Date &amp; Time</label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#8E77BB]"
              value={intervalValue}
              min={getCurrentDateTimeLocal()}
              onChange={(e) => { setIntervalValue(e.target.value); persist({ intervalValue: e.target.value }); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}