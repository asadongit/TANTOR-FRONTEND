import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { buildCronExpressionString } from '../../../../../utils/cronUtilsMDM';
const RequiredLabel = ({ children }) => (
  <label className="text-sm font-medium text-[#332849] flex items-center gap-0.5">
    {children}
    <span className="text-red-500 ml-0.5">*</span>
  </label>
);

const FREQUENCY_OPTIONS = ['Daily', 'Twice Daily', 'Weekly'];
const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const bannerText = {
  Daily: 'Runs once every day at the selected time.',
  'Twice Daily': 'Runs twice a day at the two selected times.',
  Weekly: 'Runs once a week on the selected day and time.',
};

const Scheduler = ({ open, onClose, onSave }) => {
  const [frequency, setFrequency] = useState(null);
  const [frequencyOpen, setFrequencyOpen] = useState(false);
  const frequencyRef = useRef(null);

  const [time, setTime] = useState('');
  const [timeTwo, setTimeTwo] = useState('');

  const [selectedDay, setSelectedDay] = useState(null);
  const [dayOpen, setDayOpen] = useState(false);
  const dayRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (frequencyRef.current && !frequencyRef.current.contains(e.target)) setFrequencyOpen(false);
      if (dayRef.current && !dayRef.current.contains(e.target)) setDayOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open) {
      setFrequencyOpen(false);
      setDayOpen(false);
    }
  }, [open]);

  const resetState = () => {
    setFrequency(null);
    setTime('');
    setTimeTwo('');
    setSelectedDay(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const allSelected =
    frequency === 'Daily' ? !!time
    : frequency === 'Twice Daily' ? !!time && !!timeTwo
    : frequency === 'Weekly' ? !!selectedDay && !!time
    : false;

  const handleSave = () => {
    const cronExpression = buildCronExpressionString({
      frequency,
      time,
      ...(frequency === 'Twice Daily' && { timeTwo }),
      ...(frequency === 'Weekly' && { day: selectedDay }),
    });

    onSave({
      frequency,
      time,
      ...(frequency === 'Twice Daily' && { timeTwo }),
      ...(frequency === 'Weekly' && { day: selectedDay }),
      cronExpression,
    });
    resetState();
  };

  const renderFrequencyDropdown = () => (
    <div className="space-y-1.5" ref={frequencyRef}>
      <RequiredLabel>Frequency</RequiredLabel>
      <div className="relative">
        <button
          type="button"
          onClick={() => setFrequencyOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-4 h-10 border border-[#CCCCCC] rounded-lg bg-white hover:border-[#8E77BB] transition-colors"
        >
          <span className={`text-sm ${frequency ? 'text-[#332849]' : 'text-[#818181]'}`}>
            {frequency ?? 'Select frequency'}
          </span>
          <ChevronDown
            size={16}
            className={`text-[#818181] transition-transform duration-200 ${frequencyOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {frequencyOpen && (
          <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-[#CCCCCC] rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
            {FREQUENCY_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setFrequency(opt);
                  setFrequencyOpen(false);
                  setTime('');
                  setTimeTwo('');
                  setSelectedDay(null);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-[#332849] hover:bg-[#F2EBFF] transition-colors text-left"
              >
                <span>{opt}</span>
                {frequency === opt && <Check size={14} className="text-[#8E77BB] shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderDayDropdown = () => (
    <div className="space-y-1.5 flex-1" ref={dayRef}>
      <RequiredLabel>Day of Week</RequiredLabel>
      <div className="relative">
        <button
          type="button"
          onClick={() => setDayOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-4 h-10 border border-[#CCCCCC] rounded-lg bg-white hover:border-[#8E77BB] transition-colors"
        >
          <span className={`text-sm ${selectedDay ? 'text-[#332849]' : 'text-[#818181]'}`}>
            {selectedDay ?? 'Select day'}
          </span>
          <ChevronDown
            size={16}
            className={`text-[#818181] transition-transform duration-200 ${dayOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {dayOpen && (
          <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-[#CCCCCC] rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
            {DAY_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { setSelectedDay(opt); setDayOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-[#332849] hover:bg-[#F2EBFF] transition-colors text-left"
              >
                <span>{opt}</span>
                {selectedDay === opt && <Check size={14} className="text-[#8E77BB] shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderTimeField = (label, value, setValue) => (
    <div className="space-y-1.5 flex-1">
      <RequiredLabel>{label}</RequiredLabel>
      <input
        type="time"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full px-4 h-10 border border-[#CCCCCC] rounded-lg bg-white text-sm text-[#332849] hover:border-[#8E77BB] transition-colors focus:outline-none focus:border-[#8E77BB]"
      />
    </div>
  );

  const renderSubFields = () => {
    if (!frequency) return null;

    if (frequency === 'Daily') {
      return <div className="flex gap-4">{renderTimeField('Time', time, setTime)}</div>;
    }

    if (frequency === 'Twice Daily') {
      return (
        <div className="flex gap-4">
          {renderTimeField('First Run Time', time, setTime)}
          {renderTimeField('Second Run Time', timeTwo, setTimeTwo)}
        </div>
      );
    }

    if (frequency === 'Weekly') {
      return (
        <div className="flex gap-4">
          {renderDayDropdown()}
          {renderTimeField('Time', time, setTime)}
        </div>
      );
    }

    return null;
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={handleClose} />

      <div
        className="fixed z-50 flex flex-col bg-white border border-[#CCCCCC] rounded-2xl"
        style={{
          width: '690px',
          left: 'calc(50% - 690px/2)',
          top: 'calc(50% - 422px/2)',
        }}
      >
        {/* Header */}
        <div className="flex items-center px-6 h-[72px] shrink-0 rounded-t-2xl bg-white">
          <span className="flex-1 text-[#282F49] font-medium text-lg">Create Schedule</span>
          <button onClick={handleClose} className="text-[#818181] hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-6 px-6 pt-2 pb-6">
          {renderFrequencyDropdown()}
          {renderSubFields()}

          {frequency && (
            <div className="flex flex-col justify-center items-center px-4 py-4 gap-2 bg-[#FAF8FF] rounded-lg">
              <p className="text-base font-medium text-[#8E77BB] text-center">
                {bannerText[frequency]}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center gap-4 px-6 h-[72px] bg-white shadow-[0_-4px_9px_rgba(0,0,0,0.1)] shrink-0 mt-auto rounded-b-2xl relative z-10">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 border border-[#8E77BB] text-[#8E77BB] rounded-lg text-sm font-medium hover:bg-[#F2EBFF]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!allSelected}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors ${
              allSelected
                ? 'bg-[#8E77BB] hover:bg-[#7a6aa6] cursor-pointer'
                : 'bg-[#C4B8DC] cursor-not-allowed'
            }`}
          >
            Create Schedule
          </button>
        </div>
      </div>
    </>
  );
};

export default Scheduler;