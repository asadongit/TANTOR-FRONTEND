import React, { useState, useRef, useEffect  } from 'react';
import DataTable from '../../../../components/DataTable.jsx';
import { Play, ChevronDown  } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import {
  useRecentRuns,
  useScheduledRuns,
  useActiveRules, 
  useTriggerMdmDag,
  useTriggerWorkflow,
  useCheckDagStatus,
  useCreateSchedule
} from '../../../../hooks/mdm/processingCenter';
import RunScopeDrawer from './modals/RunScopeDrawer';
import toast from 'react-hot-toast';
import Scheduler from './modals/scheduler';

const ENGINE_STEP_KEY = {
  1: 'data_quality',
  2: 'match',
  3: 'survivorship',
};
const ENGINE_RULES_KEY = {
  1: 'dq_engine',
  2: 'match_engine',
  3: 'survivorship_engine',
};

const FALLBACK_ENGINES = [
  {
    id: 1,
    name: 'DQ Engine',
    label: 'Engine 1',
    description: 'Scores every staged record using hybrid weighted-proportional scoring with partial credit.',
  },
  {
    id: 2,
    name: 'Match Engine',
    label: 'Engine 2',
    description: 'Compares records to surface duplicate pairs.',
  },
  {
    id: 3,
    name: 'Survivorship & Merge',
    label: 'Engine 3',
    description: 'Applies survivorship rules to auto-merge high-confidence pairs and write the surviving golden record.',
  },
];

const PIPELINE_TABS = ['Full Pipeline', 'Custom Selection', 'Single Engine'];

const ProcessingCenterHomepage = () => {
  const { decodedToken } = useAuth();
  const { createSchedule } = useCreateSchedule();
  const [activeTab, setActiveTab] = useState('recent-run');
  const [pipelineMode, setPipelineMode] = useState('Full Pipeline');
  // const [dryRunEnabled, setDryRunEnabled] = useState(false);
  const [runScopeOpen, setRunScopeOpen] = useState(false);
  // Single Engine: only one can be active at a time, none selected by default
  const [singleSelected, setSingleSelected] = useState(null);

  const {
  runs: recentRuns = [],
  isLoading: runsLoading,
  isError: runsError,
  fetchRecentRuns: refetchRecentRuns,
} = useRecentRuns();
  const {
  schedules: scheduledRuns = [],
  isLoading: schedulesLoading,
  isError: schedulesError,
  fetchScheduledRuns: fetchSchedules,
} = useScheduledRuns();
  const recentRunsRef = useRef(null);
  const engines = FALLBACK_ENGINES;
  const [scopeApplied, setScopeApplied] = useState(false);
  const { activeRules } = useActiveRules();
  const [customEnabled, setCustomEnabled] = useState({ 1: false, 2: false, 3: false });
  const isEngineEnabled = (engine) => {
    if (pipelineMode === 'Full Pipeline') return true;
    if (pipelineMode === 'Custom Selection') return !!customEnabled[engine.id];
    if (pipelineMode === 'Single Engine') return singleSelected === engine.id;
    return false;
  };
  const { triggerDag, isTriggering: isTriggeringDag } = useTriggerMdmDag();
  const { triggerWorkflow, isTriggering: isTriggeringWorkflow } = useTriggerWorkflow();
  const { checkDagExists } = useCheckDagStatus();
  const isTriggering = isTriggeringDag || isTriggeringWorkflow;


  const activeSteps = engines
    .filter((engine) => isEngineEnabled(engine))
    .map((engine) => ENGINE_STEP_KEY[engine.id]);

  
  const [executeOpen, setExecuteOpen] = useState(false);
  const executeRef = useRef(null);
  const [appliedScope, setAppliedScope] = useState(null);
  const [runStatusMessage, setRunStatusMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [runResetSignal, setRunResetSignal] = useState(0);
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const TriggerTypeBadge = ({ type }) => {
    return (
      <span
        className="inline-block px-2 py-1 rounded text-xs font-normal"
        style={{
          color: '#8E77BB',
          backgroundColor: 'rgba(142, 119, 187, 0.2)',
        }}
      >
        {type}
      </span>
    );
  };

const runHistoryColumns = [
  {
    key: 'run_id',
    label: 'Run ID',
    render: (row) => (
      <div style={{ width: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {row.run_id}
      </div>
    ),
  },
  {
    key: 'type',
    label: 'Type',
    render: (row) => (
      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
        {row.type?.replace(/_/g, ' ')}
      </span>
    ),
  },
  {
    key: 'trigger_type',
    label: 'Trigger',
    render: (row) => <TriggerTypeBadge type={row.trigger_type} />,
  },
  { key: 'domain', label: 'Domain' },
  { key: 'records', label: 'Records' },
  { key: 'result', label: 'Result' },
  { key: 'duration', label: 'Duration' },
  {
    key: 'status',
    label: 'Status',
    render: (row) => <RunStatusBadge status={row.status} />,
  },
];
  const RunStatusBadge = ({ status }) => {
    const STATUS_STYLES = {
      QUEUED: { color: '#B98900', backgroundColor: 'rgba(255, 193, 7, 0.25)' },
      RUNNING: { color: '#069B68', backgroundColor: 'rgba(42, 199, 146, 0.25)' },
      COMPLETED: { color: '#069B68', backgroundColor: 'rgba(42, 199, 146, 0.25)' },
      FAILED: { color: '#EF4D5F', backgroundColor: 'rgba(242, 118, 167, 0.3)' },
      CANCELLED: { color: '#16ABC2', backgroundColor: 'rgba(22, 171, 194, 0.25)' },
      PARTIAL: { color: '#16ABC2', backgroundColor: 'rgba(22, 171, 194, 0.25)' },
    };
    const style = STATUS_STYLES[status] || { color: '#818181', backgroundColor: 'rgba(217, 217, 217, 0.5)' };

    return (
      <span
        className="inline-block px-2 py-1 rounded text-xs font-normal"
        style={style}
      >
        {status}
      </span>
    );
  };

  const waitForDagRegistered = async (dagId, { maxAttempts = 20, delayMs = 5000, onAttempt } = {}) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const exists = await checkDagExists(dagId);
      if (exists) return true;
      if (attempt === maxAttempts) throw new Error(`DAG '${dagId}' did not register in time`);
      onAttempt?.(attempt, maxAttempts);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
};


  const handleRunNow = async () => {
    if (!appliedScope) return;
    setIsProcessing(true);
    setExecuteOpen(false);
    setAppliedScope(null);
    setScopeApplied(false);
    setRunResetSignal((n) => n + 1);
    try {
      setRunStatusMessage('Triggering pipeline...');
      const dagResponse = await triggerDag({
        connectionName: appliedScope.connection,
        domainName: appliedScope.domain,
        steps: appliedScope.steps,
        recordSelection: appliedScope.recordSelection,
        createdBy: decodedToken?.sub,
      });

      setRunStatusMessage('Waiting for workflow to register...');
      await waitForDagRegistered(dagResponse.workflow_name);

      setRunStatusMessage('Starting workflow...');
      await triggerWorkflow({ dagId: dagResponse.workflow_name });

      setRunStatusMessage('');
      setExecuteOpen(false);
      refetchRecentRuns();
      toast.success('Pipeline run started successfully.')
    } catch (err) {
      setRunStatusMessage('');
      const message =
        err?.response?.data?.detail?.message
        || err?.response?.data?.detail
        || err?.message
        || 'Failed to run the pipeline. Please try again.';
      toast.error(typeof message === 'string' ? message : 'Failed to run the pipeline. Please try again.');
    } finally {
      setIsProcessing(false);
    }
};

  useEffect(() => {
    const handler = (e) => {
      if (executeRef.current && !executeRef.current.contains(e.target)) setExecuteOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggle = (engine) => {
    if (pipelineMode === 'Full Pipeline') return;
    if (pipelineMode === 'Custom Selection') {
      const currentlyEnabled = Object.values(customEnabled).filter(Boolean).length;
      const isOn = customEnabled[engine.id];
      if (!isOn && currentlyEnabled >= 2) return;
      setCustomEnabled((prev) => ({ ...prev, [engine.id]: !prev[engine.id] }));
    }
    if (pipelineMode === 'Single Engine') {
      setSingleSelected((prev) => (prev === engine.id ? null : engine.id));
    }
  };

  const isToggleDisabled = (engine) => pipelineMode === 'Full Pipeline';


  const bannerText = {
    'Full Pipeline': 'Runs all three engines in sequence — DQ → Match → Survivorship & Merge with one click. Recommended for daily processing.',
    'Custom Selection': 'Choose which engines to include. Enable the ones you want to run — order is always DQ → Match → Merge.',
    'Single Engine': 'Run exactly one engine using the most recent output of the engine before it as its input.',
  };

  const runButtonLabel = {
    'Full Pipeline': 'Run Full Pipeline',
    'Custom Selection': 'Run Selected',
    'Single Engine': 'Run Engine',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-600 font-medium">
        <span>Data Governance</span>
        <span className="text-gray-400">›</span>
        <span>MDM</span>
        <span className="text-gray-400">›</span>
        <span className="text-[#8E77BB]">Processing Center</span>
      </div>

      <div className="bg-white rounded-lg p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#282F49] mb-2">Processing Center</h1>
            <p className="text-sm text-gray-600 font-medium">
              Run the DQ, Match and Survivorship & Merge engines individually, as a custom subset, or end-to-end in one click.
            </p>
          </div>
          <div className="flex items-center gap-2">
          <button
            onClick={() => recentRunsRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 bg-[#8E77BB] text-white rounded-lg text-sm font-medium hover:bg-[#7a6aa6]"
            style={{ padding: '10px 16px 10px 12px', height: '40px' }}
          >
            <img src="/src/assets/mdm/history_2.svg" alt="Run History" className="w-4 h-4 brightness-0 invert" />
            Run History
          </button>
        </div>
        </div>

        {/* Pipeline Mode Tabs */}
        <div className="flex items-center border border-[#CCCCCC] rounded-lg w-fit mb-6 overflow-hidden">
          {PIPELINE_TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => { setPipelineMode(tab); setScopeApplied(false); }}
              className={`px-4 py-2 text-base font-medium transition-colors ${
                pipelineMode === tab
                  ? 'bg-[#F2EBFF] text-[#8E77BB]'
                  : 'bg-white text-[#818181] hover:text-gray-700'
              } ${i !== PIPELINE_TABS.length - 1 ? 'border-r border-[#CCCCCC]' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Banner */}
        <div className="bg-[#DEF0D6] text-[#0C5E6B] px-4 py-2 rounded-lg mb-6 text-sm font-medium">
          {bannerText[pipelineMode]}
        </div>

        {/* Engine Cards Section */}
        <div
            className="rounded-2xl p-4 mb-6"
            style={{ background: 'linear-gradient(270deg, #EFE7FF 17.24%, #8E77BB 93.06%, #2B125C 141.05%)' }}
          >
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Processing Pipeline</h2>
                <p className="text-sm font-medium text-white">Data flows left to right. Each engine consumes the output of the one before it.</p>
              </div>
            </div>
          </div>

          {/* Engine Cards */}
          <div className="flex items-stretch gap-2 mb-4">
            {engines.map((engine, index) => {
              const enabled = isEngineEnabled(engine);
              const disabled = isToggleDisabled(engine);
              return (
                <React.Fragment key={engine.id}>
                  <div
                    className={`bg-white rounded-lg p-4 flex flex-col flex-1 ${
                      !enabled ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-2">
                        <div className="w-10 h-10 rounded-full bg-[#FEE4FF] flex items-center justify-center shrink-0">
                          <img src="/src/assets/mdm/target.svg" alt="engine" className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[10px] font-medium text-[#332849]">{engine.label}</p>
                          <h3 className="text-base font-medium text-[#332849]">{engine.name}</h3>
                        </div>
                      </div>
                      <label className={`flex items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => handleToggle(engine)}
                          disabled={disabled}
                          className="sr-only"
                        />
                        <div
                          className={`w-8 h-[18px] rounded-full transition-colors flex items-center px-[1.5px] ${
                            enabled ? 'bg-[#8E77BB] justify-end' : 'bg-gray-400 justify-start'
                          } ${disabled ? 'opacity-70' : ''}`}
                        >
                          <div className="w-[15px] h-[15px] rounded-full bg-white shadow" />
                        </div>
                      </label>
                    </div>

                    <p className="text-xs text-[#818181] flex-1">{engine.description}</p>

                    <hr className="border-[#CCCCCC] mt-4 mb-4" />

                    {/* Stats */}
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-medium text-[#332849]">Active Rules</span>
                      <span className="text-xs font-bold text-[#332849]">
                      {activeRules[ENGINE_RULES_KEY[engine.id]]?.toLocaleString() ?? '—'}
                      </span>
                    </div>
                  </div>

                  {/* Arrow between cards */}
                  {index < engines.length - 1 && (
                    <img
                      src="/src/assets/mdm/arrow_forward.svg"
                      alt="flow"
                      className="w-6 h-6 shrink-0 brightness-0 invert self-center"
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          {/* Separator */}
          <hr className="border-t border-white/50 mb-4" />

          {/* Run Bar */}
          <div className="flex justify-between items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer h-[40px]">
              {/* <div
                onClick={() => setDryRunEnabled(!dryRunEnabled)}
                className={`relative flex items-center w-[33px] h-[18px] rounded-full border transition-colors px-[1.5px] ${
                  dryRunEnabled
                    ? 'bg-[#8E77BB] border-[#8E77BB]'
                    : 'bg-[#ADADAD] border-[#ADADAD]'
                }`}
              >
                <div
                  className={`w-[15px] h-[15px] rounded-full bg-white transition-transform ${
                    dryRunEnabled ? 'translate-x-[15px]' : 'translate-x-0'
                  }`}
                />
              </div> */}
              {/* <span className="text-sm font-medium text-white">Dry Run</span> */}
            </label>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setRunScopeOpen(true)}
                className="flex items-center gap-2 bg-[#8E77BB] text-white rounded-lg text-sm font-medium hover:bg-[#7a6aa6] transition-colors"
                style={{ padding: '10px 16px 10px 12px', height: '40px' }}
              >
                <img src="/src/assets/mdm/bookmark_manager.svg" alt="Run Scope" className="w-4 h-4 brightness-0 invert"/>
                Run Scope
              </button>

              <div className="relative" ref={executeRef}>
              <button
                disabled={!scopeApplied}
                onClick={() => setExecuteOpen((prev) => !prev)}
                className="flex items-center gap-2 bg-[#8E77BB] text-white rounded-lg text-sm font-medium hover:bg-[#7a6aa6] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ padding: '10px 16px 10px 12px', height: '40px' }}
              >
                <Play size={16} />
                Execute
                <ChevronDown size={14} className={`transition-transform duration-200 ${executeOpen ? 'rotate-180' : ''}`} />
              </button>

              {executeOpen && scopeApplied && (
                <div className="absolute bottom-[calc(100%+4px)] right-0 min-w-full bg-white border border-[#CCCCCC] rounded-lg shadow-lg z-10 overflow-hidden">
                <button
                  onClick={handleRunNow}
                  disabled={isProcessing}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#332849] hover:bg-[#F2EBFF] transition-colors text-left disabled:opacity-50"
                >
                  <Play size={14} className="text-[#8E77BB] shrink-0" />
                  {isProcessing ? (runStatusMessage || 'Starting...') : 'Run Now'}
                </button>
                <button
                  onClick={() => { setExecuteOpen(false); setSchedulerOpen(true); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#332849] hover:bg-[#F2EBFF] transition-colors text-left"
                >
                  <img src="/src/assets/mdm/calendar_clock.svg" alt="" className="w-[14px] h-[14px] shrink-0" style={{ filter: 'invert(47%) sepia(40%) saturate(400%) hue-rotate(220deg)' }} />
                  Schedule
                </button>
              </div>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* Dependencies Note */}
        <div className="flex items-center gap-6 px-3 py-2 bg-[#FAF8FF] rounded-lg mb-6">
          <p className="flex-1 text-sm font-medium text-[#8E77BB]">
            <span className="font-bold">Engine dependencies:</span> Each engine feeds the next: DQ scores drive Match tie-breaks, and Match pairs are the input to Merge. Running an engine alone uses the most recent output of the engine before it.
          </p>
        </div>

        {/* Recent Run / Schedule Run Tabs */}
        <div ref={recentRunsRef}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 border-b border-[#CCCCCC]">
              <button
                onClick={() => setActiveTab('recent-run')}
                className={`px-4 py-2 text-base font-bold transition-colors ${
                  activeTab === 'recent-run'
                    ? 'text-[#8E77BB] border-b-[3px] border-[#8E77BB] bg-[#FAF8FF] rounded-tl-lg rounded-tr-lg'
                    : 'text-[#818181]'
                }`}
              >
                Recent Run
              </button>
      <button
        onClick={() => setActiveTab('schedule-run')}
        className={`px-4 py-2 text-base font-bold transition-colors ${
          activeTab === 'schedule-run'
            ? 'text-[#8E77BB] border-b-[3px] border-[#8E77BB] bg-[#FAF8FF] rounded-tl-lg rounded-tr-lg'
            : 'text-[#818181]'
        }`}
      >
        Schedule Run
      </button>
    </div>
    <select className="px-4 py-2 w-[142px] h-[40px] border border-[#CCCCCC] rounded-lg text-sm text-[#332849] bg-[#FAFAFA]">
      <option>All run types</option>
    </select>
  </div>

  {activeTab === 'recent-run' && (
    <DataTable
      columns={runHistoryColumns}
      data={recentRuns}
      isLoading={runsLoading}
      isError={runsError}
      refetch={refetchRecentRuns}
      title=""
    />
  )}
  {activeTab === 'schedule-run' && (
    <DataTable
      columns={[
        { key: 'id', label: 'Schedule ID' },
        { key: 'schedule_name', label: 'Name' },
        { key: 'frequency', label: 'Frequency' },
        { key: 'next_run_at', label: 'Next Run' },
      ]}
      data={scheduledRuns}
      isLoading={schedulesLoading}
      isError={schedulesError}
      refetch={fetchSchedules}
      title=""
    />
  )}
</div>

      </div>
        <RunScopeDrawer
          open={runScopeOpen}
          onClose={() => { setScopeApplied(false); setRunScopeOpen(false); }}
          onApply={(scope) => {
            setAppliedScope({ ...scope, steps: activeSteps });
            setScopeApplied(true);
            setRunScopeOpen(false);
          }}
          pipelineMode={pipelineMode}
          engines={engines}
          customEnabled={customEnabled}
          singleSelected={singleSelected}
          resetSignal={runResetSignal}
        />
        <Scheduler
          open={schedulerOpen}
          onClose={() => setSchedulerOpen(false)}
          onSave={async (schedule) => {
            try {
              await createSchedule({
                // Run Now 
                connection_name: appliedScope.connection,
                domain_name: appliedScope.domain,
                steps: appliedScope.steps,
                record_selection: appliedScope.recordSelection,
                created_by: decodedToken?.sub,

                // Scheduler fields
                schedule_name: schedule.scheduleName,
                run_type: pipelineMode,
                frequency: schedule.frequency,
                cron_expression: schedule.cronExpression,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                is_enabled: true,
              });
              toast.success('Schedule created successfully.');
              setSchedulerOpen(false);
              // Reset Run Scope
              setAppliedScope(null);
              setScopeApplied(false);
              setRunResetSignal((n) => n + 1);
              fetchSchedules();
              refetchRecentRuns();
            } catch (err) {
              toast.error('Failed to create schedule.');
            }
          }}
        />
    </div>

  );
};

export default ProcessingCenterHomepage;