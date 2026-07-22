import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { use360View } from '../../../../../hooks/mdm/goldenRecords';
import DataTable from '../../../../../components/DataTable';

const formatValue = (val) => {
    if (val === null || val === undefined || val === '') return '—';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    return String(val);
};

const formatLabel = (key) =>
    key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const SCORE_KEYS = ['trust_score', 'dq_score'];

const SidebarField = ({ label, value }) => {
    const isScore = SCORE_KEYS.includes(label.toLowerCase());
    const formatted = formatValue(value);
    return (
        <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-[#494747] shrink-0">{formatLabel(label)}</span>
            <span
                className="text-sm font-medium truncate"
                style={{ color: isScore ? '#36AD8F' : '#282F49' }}
                title={formatted}
            >
                {formatted}
            </span>
        </div>
    );
};

const TabContent = ({ groupData }) => {
    const entries = Object.entries(groupData || {});
    const rows = [];
    for (let i = 0; i < entries.length; i += 2) {
        rows.push([entries[i], entries[i + 1] || null]);
    }
    return (
        <div className="bg-[#FAFAFA] rounded-[8px] py-3 px-4">
            <div className="flex items-stretch gap-0 py-2">
                <div className="flex flex-col flex-1 min-w-0 gap-3">
                    {rows.map(([left], rowIdx) => (
                        <div key={rowIdx} className="flex items-center justify-between pr-6">
                            <span className="text-base font-normal text-[#818181] tracking-wide truncate mr-3">
                                {formatLabel(left[0])}
                            </span>
                            <span className="text-base font-normal text-[#332849] text-right shrink-0 truncate max-w-[45%]" title={formatValue(left[1])}>
                                {formatValue(left[1])}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="w-px bg-[#CCCCCC] self-stretch shrink-0 mx-2" />
                <div className="flex flex-col flex-1 min-w-0 gap-3">
                    {rows.map(([, right], rowIdx) => (
                        <div key={rowIdx} className="flex items-center justify-between pl-6">
                            {right ? (
                                <>
                                    <span className="text-base font-normal text-[#818181] tracking-wide truncate mr-3">
                                        {formatLabel(right[0])}
                                    </span>
                                    <span className="text-base font-normal text-[#332849] text-right shrink-0 truncate max-w-[45%]" title={formatValue(right[1])}>
                                        {formatValue(right[1])}
                                    </span>
                                </>
                            ) : null}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const isActive = String(status).toLowerCase() === 'active';
    return (
        <span
            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-normal ${isActive ? 'bg-[#2AC79240] text-[#069B68]' : 'bg-[#FEE2E2] text-[#991B1B]'
                }`}
        >
            {formatValue(status)}
        </span>
    );
};

const RelationshipsTab = ({ data }) => {
    const columns = [
        { key: 'related_entity', label: 'Related Entity' },
        { key: 'domain', label: 'Domain' },
        { key: 'relationship', label: 'Relationship' },
        { key: 'since', label: 'Since' },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusBadge status={row.status} />,
        },
    ];

    return (
        <div>
            <p className="text-base font-medium text-[#332849] -mb-1">Cross-Domain Relationships</p>
            <DataTable
                columns={columns}
                data={data || []}
                isLoading={false}
                isError={false}
            />
        </div>
    );
};

const HistoryTab = ({ data }) => {
    const formatDate = (val) => {
        if (!val) return '—';
        const d = new Date(val);
        if (isNaN(d)) return val;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    const columns = [
        { key: 'version', label: 'Version' },
        { key: 'changed', label: 'Changed' },
        { key: 'by', label: 'By' },
        {
            key: 'date',
            label: 'Date',
            render: (row) => formatDate(row.date),
        },
        { key: 'reason', label: 'Reason' },
    ];

    return (
        <div>
            <p className="text-base font-medium text-[#332849] -mb-1">Change History</p>
            <DataTable
                columns={columns}
                data={data || []}
                isLoading={false}
                isError={false}
            />
        </div>
    );
};

const SkeletonSidebar = () => (
    <div className="animate-pulse flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-purple-100" />
            <div>
                <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
        </div>
        {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded" />
        ))}
    </div>
);

const SPECIAL_TABS = ['Relationships', 'History'];

const EntityView = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { domain_id, golden_id, golden_table } = location.state || {};

    const { data, isLoading, isError, fetch360View } = use360View();
    const [activeTab, setActiveTab] = useState(null);

    useEffect(() => {
        if (domain_id && golden_id && golden_table) {
            fetch360View({ domain_id, golden_id, golden_table });
        }
    }, [domain_id, golden_id, golden_table]);

    useEffect(() => {
        if (data) {
            const groupedTabs = Object.keys(data?.grouped_record || {});
            const specialTabs = SPECIAL_TABS.filter((t) => Array.isArray(data[t]) && data[t].length >= 0);
            const allTabs = [...groupedTabs, ...specialTabs];
            if (allTabs.length > 0) setActiveTab(allTabs[0]);
        }
    }, [data]);

    const summary = data?.summary || {};
    const grouped = data?.grouped_record || {};
    const groupedTabs = Object.keys(grouped);
    const specialTabs = SPECIAL_TABS.filter((t) => Array.isArray(data?.[t]));
    const tabs = [...groupedTabs, ...specialTabs];

    const summaryEntries = Object.entries(summary);
    const displayValue = summaryEntries[0]?.[1];
    const subKey = summaryEntries[1]?.[0];
    const subValue = summaryEntries[1]?.[1];
    const restSummary = summaryEntries.slice(2);

    const sortedSummary = [...restSummary].sort(([a], [b]) => {
        const aIsScore = SCORE_KEYS.includes(a.toLowerCase());
        const bIsScore = SCORE_KEYS.includes(b.toLowerCase());
        if (aIsScore && !bIsScore) return -1;
        if (!aIsScore && bIsScore) return 1;
        return 0;
    });

    const initials = displayValue
        ? String(displayValue).split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
        : '?';

    const renderTabContent = () => {
        if (!activeTab) return null;
        if (activeTab === 'Relationships') return <RelationshipsTab data={data?.Relationships} />;
        if (activeTab === 'History') return <HistoryTab data={data?.History} />;
        return grouped[activeTab] ? <TabContent groupData={grouped[activeTab]} /> : null;
    };

    return (
        <>
            <div className="py-3 px-5 m-4 bg-white flex items-center justify-between rounded-md">
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => navigate('/datagovernance/mdm/overview/golden-records')}
                        className="flex items-center hover:text-[#8E77BB] transition-colors"
                    >
                        <ChevronLeft size={24} className="text-[#818181]" />
                    </button>
                    <span className="text-2xl font-bold text-[#282F49]">
                        360° Entity View
                    </span>
                </div>
            </div>

            <div className="p-5 m-4 bg-white satoshi-regular">
                <div className="flex gap-5 items-stretch">
                    <div
                        className="w-[320px] shrink-0 rounded-md border"
                        style={{
                            background: 'linear-gradient(360deg, #FFFFFF 59.29%, #E0D0FF 146.47%)',
                            borderColor: '#E2D3FF',
                            minHeight: '70vh',
                        }}
                    >
                        {isLoading ? (
                            <SkeletonSidebar />
                        ) : (
                            <div className="p-5 flex flex-col gap-0">
                                <div className="flex flex-col gap-2 mb-4">
                                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-[#8E77BB] font-bold text-[20px]">
                                        {initials}
                                    </div>
                                    <p className="text-lg font-medium text-[#282F49] leading-tight mt-1">
                                        {displayValue || '—'}
                                    </p>
                                    {subKey && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-normal text-[#494747]">
                                                {formatLabel(subKey)}: {subValue}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="border-t border-[#CCCCCC] mb-4" />
                                <div className="flex flex-col gap-[16px]">
                                    {sortedSummary.map(([key, val]) => (
                                        <SidebarField key={key} label={key} value={val} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        {isLoading ? (
                            <div className="animate-pulse">
                                <div className="flex gap-4 mb-5">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="h-8 w-24 bg-gray-100 rounded" />
                                    ))}
                                </div>
                                <div className="h-64 bg-gray-50 rounded-xl" />
                            </div>
                        ) : isError ? (
                            <div className="text-sm text-red-500 p-4">Failed to load entity data.</div>
                        ) : (
                            <>
                                <div className="flex gap-1 border-b border-[#CCCCCC] mb-4 overflow-x-auto scrollbar-hide">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-8 py-2 text-base font-bold transition-colors border-b-[3px] -mb-px ${activeTab === tab
                                                ? 'border-[#8E77BB] text-[#8E77BB] bg-[#FAF8FF] rounded-t-md'
                                                : 'border-transparent text-[#818181] hover:text-[#332849]'
                                                }`}
                                        >
                                            {formatLabel(tab)}
                                        </button>
                                    ))}
                                </div>
                                {renderTabContent()}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default EntityView;