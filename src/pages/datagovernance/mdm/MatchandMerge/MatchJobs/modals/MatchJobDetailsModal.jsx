import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useMatchJobDetails } from '../../../../../../hooks/mdm/matchJobs';

const Skeleton = ({ className = '' }) => (
    <span className={`inline-block bg-gray-200 rounded animate-pulse ${className}`} />
);

const StatusBadge = ({ status }) => {
    const map = {
        COMPLETED: { label: 'Completed', color: '#069B68', bg: '#CAF1E4'},
        APPROVED: { label: 'Approved', color: '#069B68', bg: '#CAF1E4'},
        ACTIVE: { label: 'Active', color: '#069B68', bg: '#CAF1E4'},
        RUNNING: { label: 'Running', color: '#16ABC2', bg: '#C5EAF0'},
        FAILED: { label: 'Failed', color: '#EF4D5F', bg: '#FBD6E5'},
        PENDING: { label: 'Pending', color: '#E08E40', bg: '#FFF1CF'},
        INACTIVE: { label: 'Inactive', color: '#EF4D5F', bg: '#FBD6E5'},
    };
    const cfg = map[status?.toUpperCase()] ?? { label: status, color: '#818181', bg: '#F3F4F6' };
    return (
        <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg"
            style={{ color: cfg.color, backgroundColor: cfg.bg }}
        >
            {cfg.label}
        </span>
    );
};

const InfoCard = ({ children }) => (
    <div
        className="rounded-lg px-4 py-[10px] bg-[#FAFAFA]"
    >
        {children}
    </div>
);

const DistributionBar = ({ label, value, total, color }) => {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div
            className="rounded-lg p-3 bg-white mb-4 last:mb-0"
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#332849]">{label}</span>
                <span className="text-xs font-medium text-[#332849]">{value.toLocaleString()}</span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#E5E5E5' }}>
                <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
};

const ModalSkeleton = () => (
    <div className="p-6 space-y-5">
        <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: '#FAFAFA' }}>
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg p-4" style={{ backgroundColor: '#FAFAFA' }}>
                    <Skeleton className="h-3 w-16 mb-2" />
                    <Skeleton className="h-6 w-20" />
                </div>
            ))}
        </div>
        <div>
            <Skeleton className="h-5 w-32 mb-3" />
            <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-lg p-4" style={{ backgroundColor: '#FAFAFA' }}>
                        <Skeleton className="h-3 w-16 mb-2" />
                        <Skeleton className="h-5 w-24" />
                    </div>
                ))}
            </div>
        </div>
        <div>
            <Skeleton className="h-5 w-36 mb-3" />
            <div className="rounded-lg p-4 space-y-4" style={{ backgroundColor: '#FAFAFA' }}>
                {[1, 2, 3].map((i) => (
                    <div key={i}>
                        <div className="flex justify-between mb-1.5">
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-3 w-8" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const MatchJobDetailsModal = ({ isOpen, matchJobId, onClose }) => {
    const { details, isLoading, isError, fetchDetails, reset } = useMatchJobDetails();

    useEffect(() => {
        if (isOpen && matchJobId) {
            fetchDetails(matchJobId);
        }
        if (!isOpen) {
            reset();
        }
    }, [isOpen, matchJobId, fetchDetails, reset]);

    if (!isOpen) return null;

    const dist = details?.match_distribution ?? {};
    const distTotal =
        (dist['auto merged'] ?? 0) + (dist['review'] ?? 0) + (dist['rejected'] ?? 0);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000099]"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[800px] mx-4 overflow-hidden"
                style={{ maxHeight: '97vh', overflowY: 'auto' }}
            >
                <div className="flex items-center justify-between px-6 pt-4">
                    <h2 className="text-lg font-medium text-[#282F49]">
                        Match Job Details
                        {matchJobId && (
                            <span className="ml-2 text-[#8E77BB] text-lg font-medium">
                                — {matchJobId}
                            </span>
                        )}
                    </h2>
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-gray-100 transition-colors text-[#818181] hover:text-[#282F49]"
                    >
                        <X size={16} />
                    </button>
                </div>

                {isLoading && <ModalSkeleton />}

                {isError && !isLoading && (
                    <div className="p-10 text-center text-sm text-[#EF4D5F]">
                        Failed to load job details. Please try again.
                    </div>
                )}

                {details && !isLoading && (
                    <div className="px-6 pt-4 pb-4 space-y-4">

                        <InfoCard>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[#332849]">Status</span>
                                <StatusBadge status={details.status} />
                            </div>
                        </InfoCard>

                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { label: 'Records', value: (details.records ?? 0).toLocaleString() },
                                { label: 'Matches', value: (details.matches ?? 0).toLocaleString() },
                                { label: 'Duration', value: details.duration ?? '—' },
                            ].map(({ label, value }) => (
                                <InfoCard key={label}>
                                    <p className="text-sm font-normal text-[#818181] mb-1">{label}</p>
                                    <p className="text-sm font-medium text-[#332849]">{value}</p>
                                </InfoCard>
                            ))}
                        </div>

                        <div>
                            <p className="text-lg font-medium text-[#332849] mb-3">
                                Job Information
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                {[
                                    { label: 'Domain', value: details.domain ?? '—' },
                                    { label: 'Started', value: details.started ?? '—' },
                                    { label: 'Auto-Merged', value: `${(details.auto_merged ?? 0).toLocaleString()} records` },
                                    { label: 'Pending Review', value: `${(details.pending_review ?? 0).toLocaleString()} records` },
                                ].map(({ label, value }) => (
                                    <InfoCard key={label}>
                                        <p className="text-sm font-normal text-[#818181] mb-1">{label}</p>
                                        <p className="text-sm font-medium text-[#332849]">{value}</p>
                                    </InfoCard>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-lg font-medium text-[#332849] mb-3">
                                Match Distribution
                            </p>
                            <div className="rounded-lg px-4 py-4 bg-[#FAFAFA]">
                                <DistributionBar
                                    label="95–100% (Auto-Merged)"
                                    value={dist['auto merged'] ?? 0}
                                    total={distTotal}
                                    color="#8E77BB"
                                />
                                <DistributionBar
                                    label="75–95% (Review)"
                                    value={dist['review'] ?? 0}
                                    total={distTotal}
                                    color="#8E77BB"
                                />
                                <DistributionBar
                                    label="<75% (Rejected)"
                                    value={dist['rejected'] ?? 0}
                                    total={distTotal}
                                    color="#8E77BB"
                                />
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchJobDetailsModal;