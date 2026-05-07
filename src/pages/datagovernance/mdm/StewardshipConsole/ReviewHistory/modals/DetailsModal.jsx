import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useReviewHistoryDetails } from '../../../../../../hooks/mdm/reviewHistory.jsx';
import AlarmIcon from '../../../../../../assets/mdm/alarm.svg';
import CheckCircleIcon from '../../../../../../assets/mdm/check_circle_full.svg';

const DECISION_STYLES = {
    merged:          { color: '#069B68', bg: 'rgba(42, 199, 146, 0.25)' },
    'not duplicate': { color: '#818181', bg: 'rgba(217, 217, 217, 0.5)' },
};

const InfoCard = ({ label, value }) => (
    <div className="flex flex-col items-start p-[10px_16px] gap-[6px] bg-[#FAFAFA] rounded-lg flex-1">
        <span className="text-sm font-normal text-[#818181] font-[Satoshi] w-full">{label}</span>
        <span className="text-sm font-medium text-[#332849] font-[Satoshi] w-full">{value ?? '—'}</span>
    </div>
);

const DetailsModal = ({ isOpen, onClose, row }) => {
    const { details, isLoading, fetchDetails } = useReviewHistoryDetails();

    useEffect(() => {
        if (isOpen && row?.actual_task_id) {
            fetchDetails(row.actual_task_id);
        }
    }, [isOpen, row?.actual_task_id]);

    if (!isOpen) return null;

    const decisionStyle = DECISION_STYLES[details?.decision?.toLowerCase()] || { color: '#6B7280', bg: '#F3F4F6' };
    const decisionText  = details?.decision?.toLowerCase() === 'merged'
        ? 'Records were confirmed as duplicates and merged.'
        : details?.decision?.toLowerCase() === 'not duplicate'
        ? 'Records were confirmed as not duplicates.'
        : '—';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="bg-white border border-[#CCCCCC] rounded-2xl flex flex-col mx-4"
                style={{ width: '789px' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex flex-row items-center px-6 py-0 rounded-t-2xl bg-white" style={{ height: '72px' }}>
                    <div className="flex flex-row items-center gap-2 flex-1">
                        <span className="text-lg font-medium text-[#282F49] font-[Satoshi]">
                            Review Details
                        </span>
                        {row?.task_id && (
                            <span className="text-lg font-medium text-[#8E77BB] font-[Satoshi]">
                                - {row.task_id}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1 text-[#818181] flex items-center">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                {isLoading ? (
                    <div className="px-6 py-10 text-center text-sm text-[#818181] font-[Satoshi]">Loading...</div>
                ) : (
                    <div className="flex flex-col items-start px-6 pt-2 pb-6 gap-6 bg-white rounded-b-2xl">

                        {/* Decision + Resolution Time */}
                        <div className="flex flex-row items-center gap-4 w-full" style={{ height: '64px' }}>

                            {/* Decision */}
                            <div className="flex flex-row items-center p-[10px_16px] gap-[10px] bg-[#FAFAFA] rounded-lg flex-1 h-full">
                                <div className="flex flex-col gap-[6px]">
                                    <div className="flex flex-row items-center gap-[2px]">
                                        <span className="text-base font-normal text-[#818181] font-[Satoshi]">
                                            Decision -
                                        </span>
                                        {details?.decision && (
                                            <span
                                                className="flex items-center gap-1 text-base font-normal px-1 font-[Satoshi]"
                                                style={{ color: decisionStyle.color }}
                                            >
                                                {details.decision}
                                                {details?.decision?.toLowerCase() === 'merged' && (
                                                    <img src={CheckCircleIcon} alt="merged" className="w-5 h-5" />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-[#332849] font-[Satoshi]">
                                        {decisionText}
                                    </span>
                                </div>
                            </div>

                            {/* Resolution Time */}
                            <div className="flex flex-row items-center p-[10px_16px] gap-[10px] bg-[#FAFAFA] rounded-lg flex-1 h-full">
                                <div className="flex flex-col gap-[6px]">
                                    <div className="flex flex-row items-center gap-1">
                                        <img src={AlarmIcon} alt="alarm" className="w-5 h-5" />
                                        <span className="text-base font-normal text-[#818181] font-[Satoshi]">Resolution Time</span>
                                    </div>
                                    <span className="text-sm font-medium text-[#332849] font-[Satoshi]">
                                        {details?.resolution_time ?? '—'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Review Timeline */}
                        <div className="flex flex-col gap-4 w-full">
                            <span className="text-base font-medium text-[#332849] font-[Satoshi]">Review Timeline</span>
                            <div className="flex flex-col gap-4 w-full">
                                {/* Row 1 */}
                                <div className="flex flex-row gap-4 w-full">
                                    <InfoCard label="Task ID"    value={details?.timeline?.task_id}   />
                                    <InfoCard label="Match Pair" value={details?.timeline?.match_pair} />
                                </div>
                                {/* Row 2 */}
                                <div className="flex flex-row gap-4 w-full">
                                    <InfoCard label="Entity"   value={details?.timeline?.entity}   />
                                    <InfoCard label="Reviewer" value={details?.timeline?.reviewer} />
                                </div>
                                {/* Row 3 */}
                                <div className="flex flex-row gap-4 w-full">
                                    <InfoCard label="Review Date" value={details?.timeline?.review_date} />
                                    <InfoCard label="Match Score" value={details?.timeline?.match_score != null ? `${details.timeline.match_score}%` : '—'} />
                                </div>
                            </div>
                        </div>

                        {/* Reviewer Notes */}
                        <div className="flex flex-col gap-2 w-full">
                            <span className="text-lg font-medium text-[#332849] font-[Satoshi]">Reviewer Notes</span>
                            <div className="flex items-center justify-center p-4 bg-[#FAFAFA] rounded-lg w-full" style={{ minHeight: '98px' }}>
                                <p className="text-base font-medium text-[#332849] font-[Satoshi] leading-[22px] w-full">
                                    {details?.reviewer_notes ?? '—'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DetailsModal;