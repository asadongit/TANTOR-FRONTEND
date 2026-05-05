import React, { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import CheckCircleIcon from '../../../../../assets/mdm/check_circle_unread.svg';
import SettingsIcon from '../../../../../assets/mdm/settings.svg';
import PersonSearchIcon from '../../../../../assets/mdm/person_search.svg';
import MergeTypeIcon from '../../../../../assets/mdm/merge_type.svg';
import ReportIcon from '../../../../../assets/mdm/report.svg';
import RerunIcon from '../../../../../assets/mdm/replay.svg';
import PauseIcon from '../../../../../assets/mdm/pause_circle.svg';
import Breadcrumb from '../../../../../components/Breadcrumb';
import SearchableDropdown from '../../components/SearchableDropdown';
import DataTable from '../../../../../components/DataTable';
import { useDomains, useMatchJobsList, useMatchJobsSummary, useRunningJobs } from '../../../../../hooks/mdm/matchJobs';
import CreateMatchJobModal from './modals/CreateMatchJobModal';
import MatchJobDetailsModal from './modals/MatchJobDetailsModal';


const Skeleton = ({ className = '' }) => (
    <span className={`inline-block bg-gray-200 rounded animate-pulse ${className}`} />
);

const StatusBadge = ({ status }) => {
    const map = {
        COMPLETED: { label: 'Completed', color: '#069B68', bg: '#CAF1E4' },
        ACTIVE:    { label: 'Active',    color: '#069B68', bg: '#CAF1E4' },
        RUNNING:   { label: 'Running',   color: '#16ABC2', bg: '#C5EAF0' },
        FAILED:    { label: 'Failed',    color: '#EF4D5F', bg: '#FBD6E5' },
        PENDING:   { label: 'Pending',   color: '#E08E40', bg: '#FFF1CF' },
        INACTIVE:  { label: 'Inactive',  color: '#EF4D5F', bg: '#FBD6E5' },
    };
    const cfg = map[status?.toUpperCase()] ?? { label: status, color: '#818181', bg: '#F3F4F6' };
    return (
        <span
            className="px-2 py-1.5 text-xs font-normal rounded inline-block"
            style={{ color: cfg.color, backgroundColor: cfg.bg }}
        >
            {cfg.label}
        </span>
    );
};

const METRIC_CONFIG = [
    { key: 'completed',     label: 'Completed',     icon: CheckCircleIcon,  iconBg: '#CAF1E4' },
    { key: 'running',       label: 'Running',        icon: SettingsIcon,     iconBg: '#C5EAF0' },
    { key: 'matches_found', label: 'Matches Found',  icon: PersonSearchIcon, iconBg: '#FFF1CF' },
    { key: 'auto_merged',   label: 'Auto-Merged',    icon: MergeTypeIcon,    iconBg: '#F2EBFF' },
    { key: 'failed',        label: 'Failed',         icon: ReportIcon,       iconBg: '#FBD6E5' },
];

const SummaryCards = ({ summary, isLoading }) => (
    <div className="rounded-2xl p-4 mb-6" style={{ background: 'linear-gradient(270deg, #EFE7FF 17.24%, #8E77BB 93.06%, #2B125C 141.05%)' }}>
        <div className="grid grid-cols-5 gap-3">
            {METRIC_CONFIG.map(({ key, label, icon, iconBg }) => (
                <div key={key} className="bg-white rounded-lg p-4 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div
                            className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0"
                            style={{ backgroundColor: iconBg }}
                        >
                            <img src={icon} alt={label} className="w-4 h-4" />
                        </div>
                        <span className="text-lg font-medium text-[#332849] leading-tight">{label}</span>
                    </div>
                    <p className="text-2xl font-bold text-[#282F49]">
                        {isLoading
                            ? <Skeleton className="h-7 w-12" />
                            : (summary?.[key] ?? 0).toLocaleString()}
                    </p>
                </div>
            ))}
        </div>
    </div>
);

const RunningJobCard = ({ job }) => (
    <div
        className="rounded-lg border border-[#CCCCCC] p-4 mb-3"
        style={{ background: 'linear-gradient(360deg, #FFFFFF 59.29%, #E0D0FF 146.47%)' }}
    >
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[#282F49]">{job.job_name}</span>
                <span className="ml-4 px-2 py-1 text-xs font-normal rounded text-[#8E77BB] bg-[#8E77BB33]">
                    {job.domain}
                </span>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#8E77BB] border border-[#8E77BB] rounded-md hover:bg-[#f5f0ff] transition-colors">
                <img src={PauseIcon} alt="Pause" className="w-4 h-4" />
                Pause
            </button>
        </div>

        <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#818181]">Progress</span>
            <span className="text-sm font-medium text-[#282F49]">{job.progress_percent}%</span>
        </div>

        <div className="w-full h-2 rounded-full mb-2" style={{ backgroundColor: '#D9D9D9' }}>
            <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${job.progress_percent}%`, backgroundColor: '#098C60' }}
            />
        </div>

        <p className="text-sm text-[#818181]">
            Processed: <span className="text-[#23252D] font-medium">{job.processed} / {job.total}</span>
            {'  '}|{'  '}
            Matches: <span className="text-[#E08E40] font-semibold">{(job.matches ?? 0).toLocaleString()}</span>
        </p>
    </div>
);

const RunningJobsSkeleton = () => (
    <div
        className="rounded-lg border border-[#CCCCCC] p-4 mb-3"
        style={{ background: 'linear-gradient(360deg, #FFFFFF 59.29%, #E0D0FF 146.47%)' }}
    >
        <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-2 w-full rounded-full mb-2" />
        <Skeleton className="h-4 w-56" />
    </div>
);

const STATUS_OPTIONS = [
    { value: 'All Status', label: 'All Status' },
    { value: 'COMPLETED',  label: 'Completed' },
    { value: 'FAILED',     label: 'Failed' },
    { value: 'PENDING',    label: 'Pending' },
];

const MatchJobs = () => {
    const { summary, isLoading: summaryLoading, refetch: refetchSummary } = useMatchJobsSummary();
    const { runningJobs, isLoading: runningLoading, refetch: refetchRunning } = useRunningJobs();
    const { domains } = useDomains(true);

    const [selectedDomainId, setSelectedDomainId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Details modal state
    const [detailsJobId, setDetailsJobId] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    useEffect(() => {
        if (domains.length > 0 && !selectedDomainId) {
            setSelectedDomainId(domains[0].domain_id ?? domains[0].id);
        }
    }, [domains, selectedDomainId]);

    const selectedDomain = useMemo(
        () => domains.find((d) => (d.domain_id ?? d.id) === selectedDomainId) ?? null,
        [domains, selectedDomainId]
    );

    const domainOptions = useMemo(
        () => domains.map((d) => ({ value: d.domain_id ?? d.id, label: d.domain_name ?? d.name ?? '' })),
        [domains]
    );

    const { jobs, isLoading: jobsLoading, isError: jobsError, refetch: refetchJobs } = useMatchJobsList(selectedDomainId);

    const isReloading = summaryLoading || runningLoading || jobsLoading;

    const handleReload = () => {
        refetchSummary();
        refetchRunning();
        refetchJobs();
    };

    const handleJobCreated = () => {
        refetchSummary();
        refetchRunning();
        refetchJobs();
    };

    const handleOpenDetails = (jobId) => {
        setDetailsJobId(jobId);
        setIsDetailsModalOpen(true);
    };

    const handleCloseDetails = () => {
        setIsDetailsModalOpen(false);
        setDetailsJobId(null);
    };

    const filteredJobs = useMemo(() => {
        if (statusFilter === 'All Status') return jobs;
        return jobs.filter((j) => j.status?.toUpperCase() === statusFilter.toUpperCase());
    }, [jobs, statusFilter]);

    const columns = useMemo(() => [
        {
            key: 'match_job_name',
            label: 'Job Name',
            render: (row) => (
                <button
                    className="text-[#8E77BB] hover:underline font-normal text-sm"
                    onClick={() => handleOpenDetails(row.match_job_id ?? row.match_job_name)}
                >
                    {row.match_job_name}
                </button>
            ),
        },
        {
            key: 'description',
            label: 'Description',
            render: (row) => (
                <span className="text-sm text-[#23252D] truncate block max-w-[200px]" title={row.description}>
                    {row.description ?? '—'}
                </span>
            ),
        },
        {
            key: 'scope',
            label: 'Type',
            render: (row) => <span className="text-sm text-gray-600">{row.scope ?? '—'}</span>,
        },
        {
            key: 'domain',
            label: 'Domain',
            render: (row) => <span className="text-sm text-gray-600">{row.domain ?? '—'}</span>,
        },
        {
            key: 'records',
            label: 'Records',
            render: (row) => <span className="text-sm text-gray-600">{row.records ?? '—'}</span>,
        },
        {
            key: 'matches',
            label: 'Matches',
            render: (row) => (
                <span className="text-sm text-gray-600">
                    {row.matches != null ? row.matches.toLocaleString() : '—'}
                </span>
            ),
        },
        {
            key: 'duration',
            label: 'Duration',
            render: (row) => <span className="text-sm text-gray-600">{row.duration ?? '—'}</span>,
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusBadge status={row.status} />,
        },
    ], []);

    return (
        <div className="p-4 m-4 bg-white min-h-screen">
            <Breadcrumb />

            <div className="flex items-start justify-between mb-4 mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-[#282F49]">Match Jobs</h1>
                    <p className="text-sm text-[#818181] mt-0.5">Schedule, monitor, and manage match job executions</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleReload}
                        disabled={isReloading}
                        title="Reload"
                        className="flex items-center justify-center w-9 h-9 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <img
                            src={RerunIcon}
                            alt="Reload"
                            className={`w-4 h-4 ${isReloading ? 'animate-spin' : ''}`}
                            style={isReloading ? { animationDirection: 'reverse' } : {}}
                        />
                    </button>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#8E77BB] text-white rounded-lg hover:bg-[#7a67a0] text-sm font-medium transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        New Job
                    </button>
                </div>
            </div>

            <SummaryCards summary={summary} isLoading={summaryLoading} />

            {(runningLoading || runningJobs.length > 0) && (
                <div className="mb-6">
                    <p className="text-lg font-medium text-[#332849] mb-3">Running Jobs</p>
                    {runningLoading
                        ? <RunningJobsSkeleton />
                        : runningJobs.map((job) => <RunningJobCard key={job.match_job_id} job={job} />)
                    }
                </div>
            )}

            <div>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-lg font-medium text-[#332849]">
                        {selectedDomain
                            ? `${selectedDomain.domain_name ?? selectedDomain.name ?? ''} - Match Jobs`
                            : 'Match Jobs'}
                    </p>
                    <div className="flex items-center gap-2">
                        <div className="min-w-[160px]">
                            <SearchableDropdown
                                value={selectedDomainId}
                                onChange={setSelectedDomainId}
                                options={domainOptions}
                                placeholder="All Domains"
                            />
                        </div>
                        <div className="min-w-[140px]">
                            <SearchableDropdown
                                value={statusFilter}
                                onChange={setStatusFilter}
                                options={STATUS_OPTIONS}
                                placeholder="All Status"
                            />
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredJobs}
                    isLoading={jobsLoading}
                    isError={jobsError}
                    refetch={refetchJobs}
                    title=""
                />
            </div>

            <CreateMatchJobModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleJobCreated}
            />

            <MatchJobDetailsModal
                isOpen={isDetailsModalOpen}
                matchJobId={detailsJobId}
                onClose={handleCloseDetails}
            />
        </div>
    );
};

export default MatchJobs;