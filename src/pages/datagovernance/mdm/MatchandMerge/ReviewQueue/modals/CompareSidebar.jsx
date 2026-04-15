import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../../../context/AuthContext';
import DataTable from '../../../../../../components/DataTable';
import { useCompare, useMergeResponse } from '../../../../../../hooks/mdm/reviewQueue';

// ─── Match Score Badge ────────────────────────────────────────────────────────

const MatchScoreBadge = ({ score }) => (
    <span className="text-[#069B68] bg-[#2AC79240] text-xs font-normal px-3 py-1.5 rounded-md whitespace-nowrap">
        Match Score – {score}
    </span>
);

// ─── Attribute match-score pill ───────────────────────────────────────────────

const ScorePill = ({ score }) => {
    const num = parseFloat(score);
    let cls = 'text-[#069B68] bg-[#2AC79240]';
    if (num < 50)      cls = 'text-[#EF4D5F] bg-[#F276A74D]';
    else if (num < 90) cls = 'text-[#E08E40] bg-[#FFC93F40]';
    return (
        <span className={`${cls} px-2 py-1 rounded-md text-xs font-medium inline-block`}>
            {score}
        </span>
    );
};

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

const CompareSidebar = ({ row, onClose, onResolved }) => {
    const { decodedToken } = useAuth();
    const { data, isLoading, isError, fetchCompare } = useCompare(row.pairId);
    const { submitting, resolve } = useMergeResponse();

    const handleResolution = async (resolution) => {
        const { ok } = await resolve({
            pairId:     row.pairId,
            resolution,
            resolvedBy: decodedToken?.preferred_username ?? 'admin',
        });

        if (ok) {
            if (resolution === 'MERGED') {
                toast.success('Records merged successfully into a single Golden Record.');
            } else {
                toast.error('Records marked as unique. They will no longer appear as a match pair.');
            }
            onResolved?.();
            onClose();
        } else {
            toast.error('Something went wrong. Please try again.');
        }
    };

    const domainLabel = data?.domain
        ? data.domain.charAt(0).toUpperCase() + data.domain.slice(1).toLowerCase() + ' Master'
        : row.record1 || 'Compare Records';

    const rec1 = data?.record1_id ?? 'Record 1';
    const rec2 = data?.record2_id ?? 'Record 2';

    const tableData = useMemo(() =>
        (data?.attributes ?? []).map((attr, i) => ({
            id:            i,
            attribute:     attr.attribute,
            record1_value: attr.record1_value,
            record2_value: attr.record2_value,
            match_score:   attr.match_score,
        })),
        [data]
    );

    const columns = useMemo(() => [
        {
            key: 'attribute',
            label: 'Attribute',
            render: (row) => <span className="text-sm text-[#374151]">{row.attribute}</span>,
        },
        {
            key: 'record1_value',
            label: <span className="text-[#8E77BB]">Record 1: {rec1}</span>,
            render: (row) => (
                <span className="text-sm text-[#23252D]">
                    {row.record1_value ?? <span className="text-[#A0AEC0]">null</span>}
                </span>
            ),
        },
        {
            key: 'record2_value',
            label: <span className="text-[#8E77BB]">Record 2: {rec2}</span>,
            render: (row) => (
                <span className="text-sm text-[#23252D]">
                    {row.record2_value ?? <span className="text-[#A0AEC0]">null</span>}
                </span>
            ),
        },
        {
            key: 'match_score',
            label: 'Match',
            sortable: false,
            render: (row) => <ScorePill score={row.match_score} />,
        },
    ], [rec1, rec2]);

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-30" onClick={onClose} />

            {/* Sidebar panel */}
            <div className="fixed top-16 bottom-0 right-0 z-40 w-[888px] bg-white flex flex-col shadow-[-8px_0px_10px_0px_rgba(0,0,0,0.1)] overflow-hidden">

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 py-[18px] bg-white border-b border-[#CCCCCC] shrink-0">
                    <span className="text-[18px] font-medium text-[#332849] leading-none">
                        {isLoading ? '…' : domainLabel}
                    </span>
                    <div className="flex items-center gap-3">
                        <MatchScoreBadge score={row.score ?? '—'} />
                        <button
                            onClick={onClose}
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                        >
                            <X size={20} className="text-[#818181]" />
                        </button>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
                    <div className="bg-[#FAFAFA] rounded-md px-3 py-2 text-sm text-[#332849] leading-relaxed">
                        <span className="font-medium text-[#8E77BB]">Note:</span> Compare these records to verify if they belong to the same entity.
                        Use Confirm Match to merge them into a single profile or{' '}
                        Reject Match to keep them separate.
                    </div>

                    <DataTable
                        columns={columns}
                        data={tableData}
                        isLoading={isLoading}
                        isError={isError}
                        refetch={fetchCompare}
                        title=""
                    />
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#EBEBEB] shrink-0">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="px-5 py-2 rounded-lg border border-[#D1D5DB] bg-white text-sm font-medium text-[#374151] hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleResolution('REJECTED')}
                        disabled={submitting || isLoading}
                        className="px-5 py-2 rounded-lg border border-[#EF4D5F] bg-white text-sm font-medium text-[#EF4D5F] hover:bg-[#FFF5F5] transition-colors disabled:opacity-50 disabled:cursor-wait"
                    >
                        Reject Match
                    </button>
                    <button
                        onClick={() => handleResolution('MERGED')}
                        disabled={submitting || isLoading}
                        className="px-5 py-2 rounded-lg border-none bg-[#8E77BB] text-sm font-medium text-white hover:bg-[#7a67a0] transition-colors disabled:opacity-50 disabled:cursor-wait"
                    >
                        {submitting ? 'Processing…' : 'Confirm Match'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default CompareSidebar;