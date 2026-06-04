import React, { useState, useMemo } from 'react';
import DataTable from '../../../../../../components/DataTable.jsx';

const CLASSIFICATION_CONFIG = {
    AUTO_MATCH: {
        label: 'Match Found',
        bannerBg: '#F0FFF8',
        bannerBorder: '#36AD8F',
        scoreColor: '#069B68',
        badgeBg: '#2AC79240',
        badgeColor: '#069B68',
        badgeLabel: 'Auto-Merge',
    },
    REVIEW: {
        label: 'Review Required',
        bannerBg: '#FFFBF0',
        bannerBorder: '#E08E40',
        scoreColor: '#E08E40',
        badgeBg: '#FFC93F40',
        badgeColor: '#E08E40',
        badgeLabel: 'Review',
    },
    NO_MATCH: {
        label: 'No Match',
        bannerBg: '#FAFAFA',
        bannerBorder: '#CCCCCC',
        scoreColor: '#818181',
        badgeBg: '#D9D9D980',
        badgeColor: '#818181',
        badgeLabel: 'No Match',
    },
};

const ALGO_CONFIG = {
    EXACT: { bg: '#DBE0FC', color: '#8491F7' },
    JARO_WINKLER: { bg: '#e7ddf8', color: '#8E77BB' },
    LEVENSHTEIN: { color: '#E08E40', bg: '#FFF1CF' },
    FUZZY_ADDRESS: { color: '#16ABC2', bg: '#C5EAF0' },
    EXACT_DOMAIN: { bg: '#FEE3FF', color: '#D989DC' },
    NORMALIZED_EXACT_MATCH: { bg: '#2AC79240', color: '#069B68' },
};

const AlgoBadge = ({ algo }) => {
    const cfg = ALGO_CONFIG[algo?.toUpperCase()] ?? { bg: '#F3F4F6', color: '#6B7280' };
    return (
        <span
            className="inline-block px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}
        >
            {algo}
        </span>
    );
};

const ClassificationBadge = ({ classification }) => {
    const cfg = CLASSIFICATION_CONFIG[classification?.toUpperCase()] ?? CLASSIFICATION_CONFIG.NO_MATCH;
    return (
        <span
            className="inline-block px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap"
            style={{ backgroundColor: cfg.badgeBg, color: cfg.badgeColor }}
        >
            {cfg.badgeLabel}
        </span>
    );
};

const BannerIcon = ({ classification }) => {
    if (classification === 'AUTO_MATCH') return (
        <svg viewBox="0 0 20 20" width="15" height="15" fill="none">
            <circle cx="10" cy="10" r="9" stroke="#069B68" strokeWidth="1.5" />
            <path d="M6 10l3 3 5-5" stroke="#069B68" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
    if (classification === 'REVIEW') return (
        <svg viewBox="0 0 20 20" width="15" height="15" fill="none">
            <circle cx="10" cy="10" r="9" stroke="#E08E40" strokeWidth="1.5" />
            <path d="M10 6v4.5M10 13.5v.5" stroke="#E08E40" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
    return (
        <svg viewBox="0 0 20 20" width="15" height="15" fill="none">
            <circle cx="10" cy="10" r="9" stroke="#818181" strokeWidth="1.5" />
            <path d="M7 7l6 6M13 7l-6 6" stroke="#818181" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
};


const AttributeBreakdown = ({ ruleSet }) => {
    if (!ruleSet?.attributes?.length) return null;
    const cfg = CLASSIFICATION_CONFIG[ruleSet.classification?.toUpperCase()] ?? CLASSIFICATION_CONFIG.NO_MATCH;

    const columns = useMemo(() => [
        {
            key: 'attribute',
            label: 'Attribute',
            render: (row) => (
                <span className={`font-medium whitespace-nowrap ${row.skipped ? 'text-[#AAAAAA]' : 'text-[#282F49]'}`}>
                    {!row.skipped && row.skip_reason?.startsWith('MANDATORY FAIL') && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#EF4D5F] mr-1.5 mb-px" />
                    )}
                    {row.attribute}
                </span>
            ),
        },
        {
            key: 'algorithm',
            label: 'Algorithm',
            render: (row) => <AlgoBadge algo={row.algorithm} />,
        },
        {
            key: 'value_a',
            label: 'Value A',
            render: (row) => {
                if (row.skipped) {
                    return (
                        <span
                            className="text-[#AAAAAA] whitespace-nowrap"
                            title={row.skip_reason}
                        >
                            null
                        </span>
                    );
                }
                return (
                    <span className="text-[#282F49] block max-w-[130px] truncate" title={row.value_a ?? ''}>
                        {row.value_a ?? <span className="text-[#CCCCCC]">—</span>}
                    </span>
                );
            },
        },
        {
            key: 'value_b',
            label: 'Value B',
            render: (row) => {
                if (row.skipped) {
                    return (
                        <span
                            className="text-[#AAAAAA] whitespace-nowrap"
                            title={row.skip_reason}
                        >
                            null
                        </span>
                    );
                }
                return (
                    <span className="text-[#282F49] block max-w-[130px] truncate" title={row.value_b ?? ''}>
                        {row.value_b ?? <span className="text-[#CCCCCC]">—</span>}
                    </span>
                );
            },
        },
        {
            key: 'score',
            label: 'Score',
            render: (row) => {
                if (row.skipped) return null;
                const isMandatoryFail = row.skip_reason?.startsWith('MANDATORY FAIL');
                const scoreColor =
                    isMandatoryFail || row.passed_threshold === false
                        ? '#EF4D5F'
                        : (row.score ?? 0) >= 90
                            ? '#069B68'
                            : (row.score ?? 0) >= 70
                                ? '#E08E40'
                                : '#EF4D5F';
                return (
                    <span className="whitespace-nowrap">
                        <span className="font-semibold" style={{ color: scoreColor }}>
                            {row.score !== null && row.score !== undefined ? `${row.score}%` : '—'}
                        </span>
                        {isMandatoryFail && (
                            <span className="ml-1.5 text-[10px] font-semibold text-[#EF4D5F] bg-[#FFF0F0] px-1 py-0.5 rounded">
                                FAIL
                            </span>
                        )}
                    </span>
                );
            },
        },
        {
            key: 'weight',
            label: 'Weight',
            render: (row) =>
                row.skipped ? null : (
                    <span className="text-[#818181] whitespace-nowrap">
                        {row.weight !== null && row.weight !== undefined ? `${row.weight}%` : '—'}
                    </span>
                ),
        },
        {
            key: 'contribution',
            label: 'Contribution',
            render: (row) => {
                if (row.skipped) return null;
                const isMandatoryFail = row.skip_reason?.startsWith('MANDATORY FAIL');
                const contribColor = isMandatoryFail
                    ? '#EF4D5F'
                    : (row.contribution ?? 0) >= 20
                        ? '#069B68'
                        : (row.contribution ?? 0) >= 10
                            ? '#E08E40'
                            : '#818181';
                return row.contribution !== null && row.contribution !== undefined ? (
                    <span className="font-semibold whitespace-nowrap" style={{ color: contribColor }}>
                        {row.contribution}%
                    </span>
                ) : (
                    <span className="text-[#CCCCCC]">—</span>
                );
            },
        },
    ], []);

    return (
        <div className="mt-5">
            <div className="flex items-center gap-2">
                <p className="text-md font-medium text-[#282F49] m-0 font-[Satoshi]">
                    Attribute Score Breakdown
                    <span className="mx-1.5 text-gray-300">—</span>
                    <span style={{ color: cfg.scoreColor }}>
                        {ruleSet.rule_set_name}
                        {ruleSet.score !== null && ruleSet.score !== undefined ? ` (${ruleSet.score}%)` : ''}
                    </span>
                </p>
            </div>

            <DataTable
                columns={columns}
                data={ruleSet.attributes}
                isLoading={false}
                isError={false}
                title=""
            />
        </div>
    );
};

const RuleSetRow = ({ rs, isSelected, onClick, isWinner }) => {
    const isSkipped = rs.status === 'SKIPPED';
    const hasTable = rs.attributes?.length > 0;

    const iconBg = isSkipped
        ? '#F3F4F6'
        : rs.classification === 'AUTO_MATCH'
            ? '#2AC79240'
            : rs.classification === 'REVIEW'
                ? '#FFC93F40'
                : '#F276A74D';

    return (
        <div
            onClick={hasTable ? onClick : undefined}
            className={[
                'flex items-center justify-between px-4 py-3 rounded-xl border transition-all',
                hasTable ? 'cursor-pointer' : 'cursor-default',
                isSelected
                    ? 'border-[#8E77BB] bg-[#FAF8FF] shadow-sm'
                    : isSkipped
                        ? 'border-gray-100 bg-white opacity-80'
                        : 'border-gray-100 bg-white hover:border-[#D4C8F0] hover:bg-[#FAF8FF]',
            ].join(' ')}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-semibold m-0 font-[Satoshi] ${isSkipped ? 'text-[#AAAAAA]' : 'text-[#282F49]'}`}>
                            {rs.rule_set_name}
                        </p>
                    </div>
                    <p className={`text-xs m-0 mt-0.5 font-[Satoshi] ${isSkipped ? 'text-[#CCCCCC] italic' : 'text-[#818181]'}`}>
                        {isSkipped
                            ? rs.skip_reason
                            : `${rs.match_type?.charAt(0) + rs.match_type?.slice(1).toLowerCase()} · ${rs.attributes?.length ?? 0} attr${rs.attributes?.length !== 1 ? 's' : ''}`}
                    </p>
                </div>
            </div>

            <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-4">
                {isSkipped ? (
                    <>
                        <span className="text-sm font-semibold text-[#AAAAAA]">N/A</span>
                        <span className="text-[11px] text-[#818181] bg-gray-100 px-2 py-0.5 rounded">Skipped</span>
                    </>
                ) : (
                    <>
                        <span className="text-sm font-semibold" style={{
                            color: rs.classification === 'AUTO_MATCH' ? '#069B68'
                                : rs.classification === 'REVIEW' ? '#E08E40'
                                    : '#EF4D5F',
                        }}>
                            {rs.score !== null && rs.score !== undefined ? `${rs.score}%` : '—'}
                        </span>
                        <ClassificationBadge classification={rs.classification} />
                    </>
                )}
            </div>
        </div>
    );
};

const TestResultsPanel = ({ results }) => {
    const [selectedRuleSetId, setSelectedRuleSetId] = useState(null);

    React.useEffect(() => {
        if (!results) return;
        const winner = results.rule_sets?.find((rs) => rs.rule_set_id === results.winning_rule_set_id && rs.attributes?.length > 0);
        if (winner) { setSelectedRuleSetId(winner.rule_set_id); return; }
        const first = results.rule_sets?.find((rs) => rs.attributes?.length > 0);
        if (first) setSelectedRuleSetId(first.rule_set_id);
    }, [results]);

    const cfg = useMemo(
        () => CLASSIFICATION_CONFIG[results?.classification?.toUpperCase()] ?? CLASSIFICATION_CONFIG.NO_MATCH,
        [results]
    );

    const triggeredMatchCount = useMemo(
        () => (results?.rule_sets ?? []).filter((rs) => rs.status === 'TRIGGERED' && rs.classification !== 'NO_MATCH').length,
        [results]
    );

    const selectedRuleSet = useMemo(
        () => results?.rule_sets?.find((rs) => rs.rule_set_id === selectedRuleSetId) ?? null,
        [results, selectedRuleSetId]
    );

    if (!results) return null;

    return (
        <div className="flex flex-col gap-4 font-[Satoshi]">
            {/* Summary banner */}
            <div className="rounded-xl px-5 py-4 border" style={{ backgroundColor: cfg.bannerBg, borderColor: cfg.bannerBorder }}>
                <div className="flex items-start gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl font-semibold" style={{ color: cfg.scoreColor }}>{results.overall_score}%</span>
                            <div className="flex items-center gap-1.5">
                                <BannerIcon classification={results.classification} />
                                <span className="text-sm font-semibold" style={{ color: cfg.scoreColor }}>{cfg.label}</span>
                            </div>
                        </div>
                        <p className="text-xs text-[#818181] m-0">
                            {triggeredMatchCount} of {results.rule_sets?.length ?? 0} rule sets triggered a match
                        </p>
                        {results.winning_rule_set_name && (
                            <p className="text-xs m-0 mt-0.5" style={{ color: cfg.scoreColor }}>
                                Best match via <span className="font-semibold">{results.winning_rule_set_name}</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Rule sets list */}
            <div>
                <p className="text-md font-medium text-[#282F49] mb-2 font-[Satoshi]">Rule Sets Evaluated</p>
                <div className="flex flex-col gap-2">
                    {(results.rule_sets ?? []).map((rs) => (
                        <RuleSetRow
                            key={rs.rule_set_id}
                            rs={rs}
                            isSelected={selectedRuleSetId === rs.rule_set_id}
                            isWinner={rs.rule_set_id === results.winning_rule_set_id}
                            onClick={() => setSelectedRuleSetId(selectedRuleSetId === rs.rule_set_id ? null : rs.rule_set_id)}
                        />
                    ))}
                </div>
            </div>

            {/* Attribute breakdown */}
            {selectedRuleSet?.attributes?.length > 0 && (
                <AttributeBreakdown ruleSet={selectedRuleSet} />
            )}
        </div>
    );
};

export default TestResultsPanel;