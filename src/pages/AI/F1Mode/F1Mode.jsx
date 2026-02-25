import React, { useState, useEffect, useRef } from 'react';
import flagIcon from '../../../assets/flag.png';
import { Icon } from '@iconify/react';
import { X } from 'lucide-react';
import F1SelectDataModal from './modals/F1SelectDataModal';
import { useAIPlayground } from '../../../context/AIPlaygroundContext';
import ArrowDownIcon from '../../../assets/ai/keyboard_arrow_down.svg';
import SpeedIcon from '../../../assets/ai/speed.svg';
import RaceTrack from './RaceTrack';
import BackupIcon from '../../../assets/ai/backup.svg';
import ArrowBackIcon from '../../../assets/ai/arrow_back.svg';
import F1ModelInferencing from './F1ModelInferencing';
import F1XAI from './F1xai';
import FlagIconSvg from '../../../assets/ai/icon-race.svg';
import TableRowsIcon from '../../../assets/ai/table_rows.svg';
import TuneIcon from '../../../assets/ai/tune.svg';
import CrownIcon from '../../../assets/ai/crown.svg';

const API_URL = `${window._env_?.VITE_AI_API}/data/f1/launch`;


const getBarColor = (score) => {
  if (score === null) return '#D9D9D9';
  const pct = score * 100;
  if (pct >= 80) return '#34BB64';
  if (pct >= 60) return '#FF990A';
  return '#DB3665';
};

const TASK_OPTIONS = ['binary', 'multiclass', 'regression', 'timeseries'];
const METRIC_OPTIONS = ['accuracy', 'log_loss', 'precision', 'recall', 'f1'];

const formatLabel = (value) => {
  if (!value) return '';
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

function Dropdown({ label, options, value, onChange, disabled, multiple, searchable }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const isAllSelected = multiple && value.length === options.length;

  const filteredOptions = searchable
    ? options.filter(opt => formatLabel(opt).toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggleOption = (opt) => {
    if (!multiple) { onChange(opt); setOpen(false); return; }
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  };

  const handleSelectAll = () => {
    if (isAllSelected) onChange([]);
    else onChange(options);
  };

  const displayValue = multiple
    ? (value.length ? `${value.length} selected` : 'Select')
    : (value ? formatLabel(value) : 'Select');

  return (
    <div className="flex flex-col gap-1" ref={ref}>
      <label className="text-white text-sm">{label}</label>
      <div className="relative">
        <button
          onClick={() => !disabled && setOpen((o) => !o)}
          className="w-full flex items-center justify-between rounded-lg px-3 py-[0.45rem] text-sm font-light text-white"
          style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.2) 104.43%)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.15)',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <span className="truncate">{displayValue}</span>
          <svg
            width="11" height="7" viewBox="0 0 11 7" fill="none"
            style={{
              marginLeft: 6, opacity: 0.8, flexShrink: 0,
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <path d="M1 1L5.5 6L10 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <div
            className="absolute z-50 w-full mt-1 rounded-lg overflow-hidden"
            style={{
              background: 'rgba(20,2,2,0.97)',
              border: '1px solid rgba(160,30,30,0.5)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {searchable && (
              <div style={{ padding: '0.5rem', borderBottom: '1px solid rgba(160,30,30,0.3)' }}>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  autoFocus
                  className="w-full rounded outline-none text-white text-xs"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '0.3rem 0.6rem',
                  }}
                />
              </div>
            )}
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {multiple && (
                <button onClick={handleSelectAll} className="w-full text-left px-3 py-2 font-semibold text-white text-sm"
                  style={{ background: 'rgba(141,23,24,0.35)' }}>
                  {isAllSelected ? 'Unselect All' : 'Select All'}
                </button>
              )}
              {filteredOptions.map((opt) => {
                const selected = multiple ? value.includes(opt) : value === opt;
                return (
                  <button key={opt} onClick={() => toggleOption(opt)} className="w-full text-left px-3 py-2 flex items-center gap-2 text-sm transition-all duration-150"
                    style={{
                      background: selected ? 'rgba(141,23,24,0.35)' : 'transparent',
                      color: selected ? '#fff' : 'rgba(255,255,255,0.7)',
                    }}>
                    {multiple && (
                      <span style={{
                        width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                        border: selected ? 'none' : '1.5px solid rgba(255,255,255,0.3)',
                        background: selected ? 'linear-gradient(135deg, #D30101, #6D0101)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {selected && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                    )}
                    {formatLabel(opt)}
                  </button>
                );
              })}
              {filteredOptions.length === 0 && (
                <p className="text-xs px-4 py-3" style={{ color: 'rgba(255,255,255,0.3)' }}>No results</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, icon, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-5 rounded-xl"
      style={{ background: '#FFFFFF1A', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
        {icon && (
          <img src={icon} alt="" className="w-[18px] h-[18px] opacity-70 flex-shrink-0 brightness-0 invert" />
        )}
        {label}
      </div>
      <span className="text-white font-bold text-xl tracking-wide">{value}</span>
    </div>
  );
}

function AlgorithmRow({ name, status, score }) {
  const isCompleted = status === 'completed';
  const scorePct = score !== null ? Math.min(Math.max(score * 100, 0), 100) : 0;
  const barColor = getBarColor(score);

  return (
    <div className="flex items-center gap-3 py-2">
      <img src={SpeedIcon} alt="" style={{ width: 19, height: 15, flexShrink: 0 }} />
      <p className="truncate flex-1 text-white text-sm font-light" style={{ fontFamily: 'Satoshi, sans-serif', fontStyle: 'normal' }}>
        {name}
      </p>
      <div className="rounded flex-shrink-0 overflow-hidden" style={{ width: 70, height: 5, background: '#D9D9D9' }}>
        <div style={{
          height: '100%',
          width: `${scorePct}%`,
          background: barColor,
          borderRadius: 4,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span className="text-xs text-right flex-shrink-0 w-[38px]"
        style={{ color: isCompleted ? '#fff' : 'rgba(255,255,255,0.3)' }}>
        {score !== null ? `${scorePct.toFixed(1)}%` : '—'}
      </span>
    </div>
  );
}

function StandingsPage({ onBack }) {
  const [activeTab, setActiveTab] = useState('model_inferencing');

  const tabs = [
    { key: 'model_inferencing', label: 'Model Inferencing' },
    { key: 'xai', label: 'XAI' },
  ];

  return (
    <div className="w-full p-4">
      {/* Header banner */}
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(205.53deg, #8D1718 0.09%, #010200 156.48%)' }}
      >
        <img
          src={flagIcon}
          alt=""
          aria-hidden="true"
          className="absolute pointer-events-none select-none"
          style={{
            width: '38%',
            height: '300%',
            opacity: 0.13,
            mixBlendMode: 'screen',
            objectFit: 'cover',
            top: '-60px',
            right: '-10px',
            transform: 'rotate(180deg)',
            zIndex: 1,
          }}
        />

        {/* Back button row */}
        <div className="relative flex items-center gap-3 px-6 pt-5 pb-3" style={{ zIndex: 10 }}>
          <button
            onClick={onBack}
            className="flex items-center gap-1 hover:opacity-70 transition-opacity text-white text-lg font-bold tracking-wide"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <img
              src={ArrowBackIcon}
              alt=""
              className="brightness-0 invert"
              style={{ width: '12px', height: '16px', marginRight: '2px' }}
            />
            Standings
          </button>
        </div>

        {/* Tabs */}
        <div className="relative flex gap-0 px-6 pb-0" style={{ zIndex: 10 }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="text-sm tracking-wide transition-all duration-150"
                style={{
                  background: isActive ? '#7A2727' : 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2.5px solid #ffffff' : '2.5px solid transparent',
                  borderRadius: '0.5rem 0.5rem 0 0',
                  padding: '0.5rem 1.35rem',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  letterSpacing: '0.01em',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content area */}
      <div
        className="w-full rounded-b-2xl"
        style={{
          background: 'linear-gradient(0deg, #FFFFFF, #FFFFFF), linear-gradient(144.28deg, rgba(141, 23, 24, 0.4) 20.92%, rgba(255, 255, 255, 0.4) 75.9%)',
          minHeight: 400,
        }}
      >
        {activeTab === 'model_inferencing' && <F1ModelInferencing />}
        {activeTab === 'xai' && <F1XAI />}
      </div>
    </div>
  );
}

function F1Mode() {
  const { F1Mode: F1ModeCtx, setF1Mode } = useAIPlayground();
  const hostnameAI = window._env_?.VITE_AI_API;
  const WebSocketURL = window._env_?.VITE_AI_WEBSOCKET;
  console.log("f1 mode is @@@ ", F1ModeCtx)

  const sessionId = F1ModeCtx?.session_id ?? null;
  const columnNames = F1ModeCtx?.column_names ?? [];
  const wsUrl = sessionId
    ? `${WebSocketURL}/data/f1/launch/progress/${sessionId}`
    : null;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ingestedTable, setIngestedTable] = useState(null);
  const [task, setTask] = useState('');
  const [metric, setMetric] = useState([]);
  const [target, setTarget] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [rowsSampled, setRowsSampled] = useState(null);
  const [featuresCount, setFeaturesCount] = useState(null);
  const [modelsTested, setModelsTested] = useState(null);
  const [bestScoreStat, setBestScoreStat] = useState(null);

  const [launchSuccess, setLaunchSuccess] = useState(false);
  const [showStandings, setShowStandings] = useState(false);

  const [isLaunching, setIsLaunching] = useState(false);
  const [isRaceRunning, setIsRaceRunning] = useState(false);
  const [isRaceFinished, setIsRaceFinished] = useState(false);
  const [activeFlagNode, setActiveFlagNode] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [algorithmStatus, setAlgorithmStatus] = useState({});
  const [bestScore, setBestScore] = useState(null);
  const [completedAlgs, setCompletedAlgs] = useState(0);
  const [totalAlgs, setTotalAlgs] = useState(0);

  const wsRef = useRef(null);
  const isFinishedRef = useRef(false);

  useEffect(() => {
    if (F1ModeCtx?.selected_table && !ingestedTable) {
      setIngestedTable(F1ModeCtx.selected_table);
    }
  }, [F1ModeCtx?.selected_table]);

  useEffect(() => {
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, []);

  const formatTime = (secs) => {
    if (!secs && secs !== 0) return '00:00.000';
    const totalMs = Math.floor(secs * 1000);
    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const milliseconds = totalMs % 1000;
    return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0') + ':' + String(milliseconds).padStart(3, '0');
  };

  const isRunning = overallProgress > 0 && overallProgress < 100;
  const isLaunchReady = !!ingestedTable && !!task && metric.length > 0 && !!target;

  const handleWsMessage = (data) => {
    setOverallProgress(data.progress || 0);
    if (typeof data.time_elapsed_seconds === 'number') setElapsed(data.time_elapsed_seconds);
    if (data.stage === 'connected') return;

    const progressToNodeMap = { 38: 1, 42: 2, 58: 3, 67: 4, 76: 5, 85: 6, 90: 7, 100: 8 };
    if (progressToNodeMap[data.progress] !== undefined) setActiveFlagNode(progressToNodeMap[data.progress]);

    if (data.algorithm_status) {
      setAlgorithmStatus(data.algorithm_status);
      setCompletedAlgs(data.completed_algorithms || 0);
      setTotalAlgs(data.total_algorithms || 0);
      const scores = Object.values(data.algorithm_status).map(a => a.score).filter(s => s !== null);
      if (scores.length) setBestScore(Math.max(...scores));
    }

    if (data.progress >= 100) {
      isFinishedRef.current = true;
      setIsRaceFinished(true);
      setIsRaceRunning(false);
      setActiveFlagNode(8);
      if (wsRef.current) wsRef.current.close();
    }
  };

  const handleLaunch = async () => {
    if (!sessionId) { alert('No session found. Please fetch data first.'); return; }
    if (!task || !metric || !target) { alert('Please select Task, Metric and Target before launching.'); return; }
    if (isLaunching || isRaceRunning) return;

    isFinishedRef.current = false;
    setIsLaunching(true);
    setIsRaceFinished(false);
    setIsRaceRunning(false);
    setActiveFlagNode(0);
    setOverallProgress(0);
    setAlgorithmStatus({});
    setBestScore(null);
    setCompletedAlgs(0);
    setTotalAlgs(0);
    setElapsed(0);
    setRowsSampled(null);
    setFeaturesCount(null);
    setModelsTested(null);
    setBestScoreStat(null);
    setLaunchSuccess(false);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = async () => {
      try {
        setIsRaceRunning(true);
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, task, metric, target, test_size: 0.2, random_state: 42 }),
        });
        if (!res.ok) throw new Error(`Launch API error: ${res.status}`);
        const launchData = await res.json();

        setF1Mode((prev) => ({ ...prev, launch: launchData }));

        if (launchData.raw_data_shape) {
          setRowsSampled(launchData.raw_data_shape[0]);
          setFeaturesCount(launchData.raw_data_shape[1]);
        }
        setModelsTested(launchData.total_models_trained);
        setBestScoreStat(launchData.best_score);
        setLaunchSuccess(true);
        setIsLaunching(false);
      } catch (err) {
        setIsLaunching(false);
        setIsRaceRunning(false);
        ws.close();
      }
    };

    ws.onmessage = (event) => {
      try { handleWsMessage(JSON.parse(event.data)); } catch (_) { }
    };

    ws.onerror = () => { setIsLaunching(false); setIsRaceRunning(false); };
    ws.onclose = () => { if (!isFinishedRef.current) setIsRaceRunning(false); };
  };

  const algoEntries = Object.entries(algorithmStatus);

  if (showStandings) {
    return <StandingsPage onBack={() => setShowStandings(false)} />;
  }

  return (
    <div className="w-full p-4">
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <div className="relative w-full rounded-2xl"
        style={{ background: 'linear-gradient(233.1deg, #8D1718 4.93%, #010200 61.21%)' }}>

        <img src={flagIcon} alt="" aria-hidden="true" className="absolute pointer-events-none select-none"
          style={{ width: '38%', height: '45%', opacity: 0.13, mixBlendMode: 'screen', objectFit: 'cover', top: '-100px', right: '-10px', transform: 'rotate(180deg)', zIndex: 1 }} />

        <div className="relative flex flex-col" style={{ zIndex: 10 }}>
          {/* Header */}
          <div className="flex items-center gap-2 px-6 pt-6 pb-4 flex-shrink-0">
            <img src={FlagIconSvg} alt="" className="w-7 h-7" />
            <h1 className="text-white text-[1.375rem] font-bold tracking-wide">F1 Mode</h1>
          </div>

          <div className="px-6 pb-6">
            <div
              className="grid gap-5"
              style={{ gridTemplateColumns: '40% 60%' }}
            >

              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-white/85 text-[0.95rem] font-semibold mb-[0.6rem]">
                    Qualifying Analysis
                  </p>

                  <div className="flex flex-col gap-4">

                    {/* Data Ingestion Box */}
                    <div
                      className="relative flex flex-col items-center justify-center py-7 rounded-xl"
                      style={{
                        background: 'linear-gradient(180deg, #671212 0%, rgba(129,0,0,0) 100%)',
                        border: '1px solid #BD6665',
                        minHeight: 130,
                      }}
                    >
                      {ingestedTable ? (
                        <>
                          <button
                            onClick={() => {
                              setIngestedTable(null);
                              setTask('');
                              setMetric([]);
                              setTarget('');
                              setOverallProgress(0);
                              setIsRaceFinished(false);
                              setIsRaceRunning(false);
                              setActiveFlagNode(0);
                              setElapsed(0);
                              setRowsSampled(null);
                              setFeaturesCount(null);
                              setModelsTested(null);
                              setBestScoreStat(null);
                              setAlgorithmStatus({});
                              setCompletedAlgs(0);
                              setTotalAlgs(0);
                              setBestScore(null);
                              setLaunchSuccess(false);
                              if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
                              isFinishedRef.current = false;
                            }}
                            className="absolute hover:scale-110 transition-all flex items-center justify-center text-white cursor-pointer"
                            style={{ top: 10, right: 10, width: 24, height: 24 }}>
                            <X width={18} height={18} />
                          </button>

                          <p className="text-white text-sm font-semibold text-center mb-[0.2rem]"
                            style={{ maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ingestedTable}
                          </p>

                          <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            Table ready · Ingested
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-white text-sm font-normal mb-[0.2rem]" style={{ fontFamily: 'Satoshi, sans-serif', fontStyle: 'normal' }}>
                            Fetch Data from Table
                          </p>
                          <p className="text-xs font-normal mb-4" style={{ fontFamily: 'Satoshi, sans-serif', color: 'rgba(255,255,255,0.38)' }}>
                            Fetch Data from Table to start the race
                          </p>
                          <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all rounded-lg text-white text-sm font-normal"
                            style={{
                              background: 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255,255,255,0.25)',
                              padding: '0.4rem 1.2rem',
                            }}>
                            <img src={BackupIcon} alt="" className="w-4 h-4 opacity-85" />
                            Upload
                          </button>
                        </>
                      )}
                    </div>

                    {/* Dropdowns */}
                    <div className="grid grid-cols-3 gap-3">
                      <Dropdown label="Task" options={TASK_OPTIONS} value={task} onChange={setTask} disabled={isRaceRunning} />
                      <Dropdown label="Metric" options={METRIC_OPTIONS} value={metric} onChange={setMetric} disabled={isRaceRunning} multiple />
                      <Dropdown label="Target" options={columnNames} value={target} onChange={setTarget} disabled={isRaceRunning} searchable />
                    </div>

                    {/* Launch button */}
                    <button
                      onClick={handleLaunch}
                      disabled={isLaunching || isRaceRunning || !isLaunchReady}
                      className="w-full hover:brightness-110 active:scale-95 transition-all rounded-xl py-[0.7rem] text-white font-bold text-[0.95rem] tracking-[0.06em]"
                      style={{
                        background: 'linear-gradient(270deg, #D30101 0%, #6D0101 117.78%)',
                        border: 'none',
                        opacity: (isLaunching || (isRaceRunning && overallProgress < 100) || !isLaunchReady) ? 0.6 : 1,
                        cursor: (isLaunching || (isRaceRunning && overallProgress < 100) || !isLaunchReady) ? 'not-allowed' : 'pointer',
                      }}>
                      {isLaunching ? 'Race in Progress…' : isRunning ? 'Race in Progress…' : overallProgress === 100 ? 'Launch Again' : 'Launch'}
                    </button>

                  </div>
                </div>

                <div>
                  <div
                    className="rounded-2xl p-5"
                    style={{
                      background: 'linear-gradient(180deg, #671212 0%, rgba(129,0,0,0) 100%)',
                      border: '1px solid #BD6665',
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-white text-base font-bold" style={{ fontFamily: 'Satoshi, sans-serif', fontStyle: 'normal' }}>
                        View Standings
                      </p>
                      <button
                        onClick={() => launchSuccess && setShowStandings(true)}
                        disabled={!launchSuccess}
                        className={launchSuccess ? 'hover:opacity-80 transition-opacity' : ''}
                        style={{
                          color: launchSuccess ? '#fff' : 'rgba(255,255,255,0.3)',
                          fontSize: '14px',
                          fontWeight: 400,
                          fontFamily: 'Satoshi, sans-serif',
                          fontStyle: 'normal',
                          background: 'none',
                          border: 'none',
                          cursor: launchSuccess ? 'pointer' : 'not-allowed',
                          padding: 0,
                          transition: 'color 0.15s, opacity 0.15s',
                        }}
                      >
                        View All
                      </button>
                    </div>

                    <div>
                      {algoEntries.length === 0 ? (
                        <div className="flex items-center gap-3 py-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(141,23,24,0.35)', border: '1px solid rgba(180,40,40,0.4)' }}>
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="rgba(255,120,120,0.85)" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                            </svg>
                          </div>
                          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Waiting for launch…</p>
                        </div>
                      ) : (
                        [...algoEntries]
                          .sort(([, a], [, b]) => {
                            if (a.status === 'completed' && b.status !== 'completed') return -1;
                            if (b.status === 'completed' && a.status !== 'completed') return 1;
                            if (a.score !== null && b.score !== null) return b.score - a.score;
                            return 0;
                          })
                          .map(([name, info]) => (
                            <AlgorithmRow key={name} name={name} status={info.status} progress={info.progress} score={info.score} />
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-5">

                {/* Live Run Status */}
                <div>
                  <p className="text-white/85 text-[0.95rem] font-semibold mb-[0.6rem]">Live Run Status</p>

                  <div
                    className="rounded-2xl p-3"
                    style={{
                      background: 'linear-gradient(180deg, #671212 0%, rgba(129,0,0,0) 100%)',
                      border: '1px solid #BD6665',
                    }}
                  >
                    {/* Timer badge */}
                    <div className="flex justify-end mb-1">
                      <div className="flex items-center gap-2 font-mono rounded-lg px-3 py-[0.3rem] text-sm font-normal"
                        style={{
                          fontFamily: 'Satoshi, sans-serif',
                          fontStyle: 'normal',
                          background: 'rgba(0, 0, 0, 0.25)',
                          border: '1px solid rgba(80,10,10,0.6)',
                          color: isRaceRunning ? '#fff' : 'rgba(255,255,255,0.55)',
                        }}>
                        {isRaceRunning && (
                          <span className="inline-block rounded-full bg-red-500 flex-shrink-0"
                            style={{ width: '7px', height: '7px', boxShadow: '0 0 5px #ef4444', animation: 'pulse 1s infinite' }} />
                        )}
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {formatTime(elapsed)}
                      </div>
                    </div>

                    <RaceTrack activeNodeIndex={activeFlagNode} isFinished={isRaceFinished} />
                  </div>
                </div>

                {/* Stats */}
                <div
                  className="rounded-2xl p-3"
                  style={{
                    background: 'linear-gradient(180deg, #671212 0%, rgba(129,0,0,0) 100%)',
                    border: '1px solid #BD6665',
                  }}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <StatCard
                      label="Rows Sampled"
                      icon={TableRowsIcon}
                      value={rowsSampled !== null ? rowsSampled.toLocaleString() : '—'}
                    />
                    <StatCard
                      label="Features"
                      icon={TuneIcon}
                      value={featuresCount !== null ? featuresCount : '—'}
                    />
                    <StatCard
                      label="Models Tested"
                      icon={SpeedIcon}
                      value={modelsTested !== null ? modelsTested : '—'}
                    />
                    <StatCard
                      label="Best Score"
                      icon={CrownIcon}
                      value={bestScoreStat !== null ? bestScoreStat.toFixed(3) : '—'}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <F1SelectDataModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={setIngestedTable} />
    </div>
  );
}

export default F1Mode;