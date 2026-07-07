import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Download } from 'lucide-react';
import { useSLADashboard, useSLAConfiguration } from '../../../../../hooks/mdm/slaDashboard';
import DataTable from '../../../../../components/DataTable';
import Breadcrumb from '../../../../../components/Breadcrumb';
import ReportIcon from '../../../../../assets/mdm/report.svg';
import DeterministicIcon from '../../../../../assets/mdm/check_circle_unread.svg';
import AlarmIcon from '../../../../../assets/mdm/alarm_2.svg';
import WarningIcon from '../../../../../assets/mdm/warning.svg';
import ConfigureSLAModal from './modals/ConfigureSLAModal';

const Skeleton = ({ className }) => (
    <span className={`inline-block bg-gray-200 rounded animate-pulse ${className}`} />
);

const StatusBadge = ({ status }) => {
    const map = {
        'on track': { label: 'On Track', color: '#069B68', bg: '#2AC79240' },
        'at risk': { label: 'At Risk', color: '#E08E40', bg: '#FFC93F40' },
        'breached': { label: 'Breached', color: '#EF4D5F', bg: '#F276A74D' },
    };
    const key = status?.toLowerCase() ?? '';
    const cfg = map[key] ?? { label: status, color: '#818181', bg: '#D9D9D980' };
    return (
        <span
            className="px-2 py-1.5 text-xs font-normal rounded inline-block whitespace-nowrap"
            style={{ color: cfg.color, backgroundColor: cfg.bg }}
        >
            {cfg.label}
        </span>
    );
};

const ComplianceText = ({ value }) => {
    const num = parseFloat(value);
    const color = num >= 90 ? '#069B68' : num >= 75 ? '#E08E40' : '#EF4D5F';
    return <span className="text-sm font-medium" style={{ color }}>{value}</span>;
};

const TrendIcon = ({ trend }) => {
    if (trend === 'up') return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#098C60" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
        </svg>
    );
    if (trend === 'down') return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#D01616" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="7" x2="17" y2="17" />
            <polyline points="17 7 17 17 7 17" />
        </svg>
    );
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#818181" strokeWidth={2} strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
};


const MetricCard = ({ iconSrc, label, value, delta, deltaPositive, isLoading, iconBg }) => (
    <div className="bg-white rounded-xl p-3.5 shadow-sm flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-3">
            <div
                className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
                style={{ backgroundColor: iconBg }}
            >
                <img src={iconSrc} alt={label} className="w-5 h-5" />
            </div>
            <span className="text-lg font-medium text-[#332849]">{label}</span>
        </div>
        <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-[#282F49]">
                {isLoading ? <Skeleton className="h-7 w-20 inline-block" /> : value}
            </p>
            {delta && !isLoading && (
                <TrendIcon trend={deltaPositive ? 'up' : 'down'} />
            )}
        </div>
    </div>
);

const SLADashboard = () => {
    const {
        isLoading, isError,
        summary, slaByTaskType, stewardPerformance, stewardLeaderboard,
        fetchData,
    } = useSLADashboard();

    const {
        isLoading: configLoading,
        isError: configError,
        slaConfig,
        fetchSLAConfig,
        updateSLAConfig,
        isUpdating,
        toastError,
        setToastError,
    } = useSLAConfiguration();

    const [configureModalOpen, setConfigureModalOpen] = useState(false);

    const handleOpenConfigure = () => {
        setConfigureModalOpen(true);
        fetchSLAConfig();
    };

    const taskColumns = useMemo(() => [
        {
            key: 'task_type',
            label: 'Task Type',
            render: (row) => <span className="text-sm font-normal text-[#23252D]">{row.task_type}</span>,
        },
        {
            key: 'sla_target',
            label: 'SLA Target',
            render: (row) => <span className="text-sm text-gray-600">{row.sla_target}</span>,
        },
        {
            key: 'compliance',
            label: 'Compliance',
            render: (row) => <ComplianceText value={row.compliance} />,
        },
        {
            key: 'avg_time',
            label: 'Avg Time',
            render: (row) => <span className="text-sm text-gray-600">{row.avg_time}</span>,
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusBadge status={row.status} />,
        },
    ], []);

    const perfColumns = useMemo(() => [
        {
            key: 'steward',
            label: 'Steward',
            render: (row) => <span className="text-sm font-normal text-[#23252D]">{row.steward}</span>,
        },
        {
            key: 'tasks',
            label: 'Tasks',
            render: (row) => <span className="text-sm text-gray-600">{row.tasks}</span>,
        },
        {
            key: 'compliance',
            label: 'Compliance',
            render: (row) => <ComplianceText value={row.compliance} />,
        },
        {
            key: 'avg_time',
            label: 'Avg Time',
            render: (row) => <span className="text-sm text-gray-600">{row.avg_time}</span>,
        },
    ], []);

    const leaderboardColumns = useMemo(() => [
        {
            key: 'rank',
            label: 'Rank',
            render: (row) => <span className="text-sm font-normal text-[#23252D]">{row.rank}</span>,
        },
        {
            key: 'steward',
            label: 'Steward',
            render: (row) => <span className="text-sm font-normal text-[#23252D]">{row.steward}</span>,
        },
        {
            key: 'tasks_completed',
            label: 'Tasks Completed',
            render: (row) => <span className="text-sm text-gray-600">{row.tasks_completed}</span>,
        },
        {
            key: 'avg_time',
            label: 'Avg Time',
            render: (row) => <span className="text-sm text-gray-600">{row.avg_time}</span>,
        },
        {
            key: 'sla_pct',
            label: 'SLA %',
            render: (row) => <ComplianceText value={row.sla_pct} />,
        },
        {
            key: 'trend',
            label: 'Trend',
            render: (row) => <TrendIcon trend={row.trend} />,
        },
    ], []);

    const METRICS = [
        {
            key: 'sla_compliance',
            label: 'SLA Compliance',
            value: summary?.sla_compliance ?? '—',
            iconSrc: DeterministicIcon,
            iconBg: '#2AC79240',
            delta: true,
            deltaPositive: summary?.sla_compliance_trend === 'up',  // ← up = improving
        },
        {
            key: 'avg_resolution',
            label: 'Avg Resolution',
            value: summary?.avg_resolution ?? '—',
            iconSrc: AlarmIcon,
            iconBg: '#16ABC240',
            delta: true,
            deltaPositive: summary?.avg_resolution_trend === 'down',  // ← down = improving
        },
        {
            key: 'at_risk',
            label: 'At Risk',
            value: summary?.at_risk ?? '—',
            iconSrc: WarningIcon,
            iconBg: '#FFC93F40',
        },
        {
            key: 'breached',
            label: 'Breached',
            value: summary?.breached ?? '—',
            iconSrc: ReportIcon,
            iconBg: '#F276A74D',
        },
    ];

    return (
        <div className="p-4 m-4 bg-white min-h-screen">
            <Breadcrumb />

            <div className="flex items-start justify-between mb-4 mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-[#282F49]">SLA Dashboard</h1>
                    <p className="text-sm text-[#818181] mt-0.5">Monitor performance. Ensure compliance. Act before breach.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleOpenConfigure}
                        className="flex items-center gap-2 px-4 py-2 bg-[#8E77BB] text-white rounded-lg hover:bg-[#7a67a0] text-sm font-medium transition-colors"
                    >
                        Configure SLA
                    </button>
                </div>
            </div>

            <div className="rounded-2xl p-4 mb-6" style={{ background: 'linear-gradient(270deg, #EFE7FF 17.24%, #8E77BB 93.06%, #2B125C 141.05%)' }}>
                <div className="grid grid-cols-4 gap-3">
                    {METRICS.map((m) => (
                        <MetricCard
                            key={m.key}
                            iconSrc={m.iconSrc}
                            label={m.label}
                            value={String(m.value)}
                            delta={!!m.delta}
                            deltaPositive={m.deltaPositive}
                            isLoading={isLoading}
                            iconBg={m.iconBg}
                        />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p className="text-lg font-medium text-[#332849]">SLA by Task Type</p>
                    <DataTable
                        columns={taskColumns}
                        data={slaByTaskType}
                        isLoading={isLoading}
                        isError={isError}
                        refetch={fetchData}
                        title=""
                    />
                </div>
                <div>
                    <p className="text-lg font-medium text-[#332849]">Steward Performance</p>
                    <DataTable
                        columns={perfColumns}
                        data={stewardPerformance}
                        isLoading={isLoading}
                        isError={isError}
                        refetch={fetchData}
                        title=""
                    />
                </div>
            </div>

            <div>
                <p className="text-lg font-medium text-[#332849]">Steward Leaderboard</p>
                <DataTable
                    columns={leaderboardColumns}
                    data={stewardLeaderboard}
                    isLoading={isLoading}
                    isError={isError}
                    refetch={fetchData}
                    title=""
                />
            </div>

            <ConfigureSLAModal
                isOpen={configureModalOpen}
                onClose={() => setConfigureModalOpen(false)}
                slaConfig={slaConfig}
                isLoading={configLoading}
                isError={configError}
                refetch={fetchSLAConfig}
                updateSLAConfig={updateSLAConfig}
                isUpdating={isUpdating}
                toastError={toastError}
                setToastError={setToastError}
            />
        </div>
    );
};

export default SLADashboard;