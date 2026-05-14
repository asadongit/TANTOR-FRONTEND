import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Download, Plus, X, MoreVertical } from 'lucide-react';
import DataTable from '../../../../../components/DataTable.jsx';
import Breadcrumb from '../../../../../components/Breadcrumb.jsx';
import CreateGoldenRecordModal from './modals/AddGoldenRecord.jsx';
import EditGoldenRecordModal from './modals/EditGoldenRecord.jsx';
import { useGoldenRecordsHomepage, useListAllDomains } from '../../../../../hooks/mdm/goldenRecords.jsx';
import EditIcon from '../../../../../assets/mdm/edit.svg';
import ReplayIcon from '../../../../../assets/mdm/replay.svg';
import { useNavigate } from 'react-router-dom';
import SearchableDropdown from '../../components/SearchableDropdown.jsx';
import * as XLSX from 'xlsx';

const HIDDEN_COLUMNS = [
    'created_by', 'updated_by', 'created_date', 'updated_date', 'version',
    'status', 'trust_score',
];

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'merged', label: 'Merged' },
    { value: 'expired', label: 'Expired' },
];

const formatColumnLabel = (key) =>
    key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const ActionMenu = ({ row, onEdit }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

    const handleOpen = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 4, left: rect.right - 160 });
        setIsOpen((prev) => !prev);
    };

    return (
        <div className="relative inline-block">
            <button
                onClick={handleOpen}
                className="bg-transparent border-none cursor-pointer p-1 rounded-full flex items-center"
            >
                <MoreVertical size={18} className="text-[#818181]" />
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[1000]" onClick={() => setIsOpen(false)} />
                    <div
                        className="fixed z-[9999] bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.15)] p-2 min-w-[160px] flex flex-col gap-1"
                        style={{ top: menuPos.top, left: menuPos.left }}
                    >
                        <button
                            onClick={() => { onEdit?.(row); setIsOpen(false); }}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-none cursor-pointer bg-[#F3EFFF] w-full"
                        >
                            <img src={EditIcon} alt="Edit" className="w-4 h-4" />
                            <span className="text-[#8e78b7] text-sm font-medium">Edit</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

const StatusBadge = ({ value }) => {
    const v = String(value).toLowerCase();
    const styleMap = {
        active: 'text-[#069B68] bg-[#2AC79240]',
        inactive: 'text-[#EF4D5F] bg-[#F276A74D]',
        merged: 'text-[#E08E40] bg-[#FFF1CF]',
        expired: 'text-[#818181] bg-[#D9D9D980]',
    };
    const cls = styleMap[v] || 'text-[#818181] bg-[#D9D9D980]';
    return (
        <span className={`${cls} px-2.5 py-1 text-xs rounded-md inline-block whitespace-nowrap`}>
            {value}
        </span>
    );
};

const buildColumns = (records, onEdit, onView360) => {
    if (!records?.length) return [];
    const keys = Object.keys(records[0]).filter(
        (k) => !['created_by', 'updated_by', 'created_date', 'updated_date', 'version'].includes(k)
    );
    const ordered = ['golden_id', ...keys.filter((k) => k !== 'golden_id')];

    const cols = ordered.map((key) => {
        const col = { key, label: formatColumnLabel(key) };

        if (key === 'golden_id') {
            col.render = (row) => (
                <span className="text-[#8E77BB] font-medium whitespace-nowrap">{row[key]}</span>
            );
        } else if (key === 'status') {
            col.render = (row) => row[key]
                ? <StatusBadge value={row[key]} />
                : <span className="text-[#ccc]">—</span>;
        } else if (key === 'trust_score') {
            col.render = (row) => {
                const score = parseFloat(row[key]);
                const colorClass = score >= 90 ? 'text-[#069B68]' : score >= 75 ? 'text-[#E08E40]' : 'text-[#EF4D5F]';
                return row[key] != null
                    ? <span className={`${colorClass} font-semibold`}>{score}%</span>
                    : <span className="text-[#ccc]">—</span>;
            };
        } else if (key === 'pep_flag') {
            col.render = (row) => (
                <span className={`text-xs ${row[key] ? 'text-[#069B68]' : 'text-[#818181]'}`}>
                    {row[key] ? 'Yes' : 'No'}
                </span>
            );
        }

        return col;
    });

    cols.push({
        key: '__360view',
        label: '',
        sortable: false,
        render: (row) => (
            <button
                onClick={() => onView360(row)}
                className="text-[#8E77BB] text-sm font-medium underline whitespace-nowrap px-1 satoshi-regular"
            >
                360° View
            </button>
        ),
    });

    cols.push({
        label: '',
        sortable: false,
        render: (row) => <ActionMenu row={row} onEdit={onEdit} />,
    });

    return cols;
};

const GoldenRecordsHomepage = () => {
    const {
        records,
        isLoading: tableLoading,
        isError: tableError,
        defaultDomainId,
        goldenTable,
        fetchRecords,
    } = useGoldenRecordsHomepage();

    const { domains, isLoading: domainsLoading } = useListAllDomains();

    const [selectedDomainId, setSelectedDomainId] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [globalSearch, setGlobalSearch] = useState('');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [columns, setColumns] = useState([]);
    const [editingRecord, setEditingRecord] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        if (defaultDomainId && !selectedDomainId) {
            setSelectedDomainId(defaultDomainId);
        }
    }, [defaultDomainId]);

    const handleDomainChange = (id) => {
        setSelectedDomainId(id);
        fetchRecords(id);
        setGlobalSearch('');
        setSelectedStatus('');
    };

    const handleView360 = useCallback((row) => {
        navigate('entity-view', {
            state: {
                domain_id: selectedDomainId,
                golden_id: row.golden_id,
                golden_table: goldenTable,
            },
        });
    }, [navigate, selectedDomainId, goldenTable]);

    const handleEdit = (row) => setEditingRecord(row);

    useEffect(() => {
        setColumns(buildColumns(records, handleEdit, handleView360));
    }, [records, handleView360]);

    const filteredRecords = useMemo(() => {
        return records.filter((row) => {
            if (globalSearch) {
                const term = globalSearch.toLowerCase();
                const matched = Object.keys(row).some((col) =>
                    String(row[col] ?? '').toLowerCase().includes(term)
                );
                if (!matched) return false;
            }

            if (selectedStatus) {
                const rowStatus = String(row.status ?? '').toLowerCase();
                if (rowStatus !== selectedStatus.toLowerCase()) return false;
            }

            return true;
        });
    }, [records, globalSearch, selectedStatus]);

    const handleExport = useCallback(() => {
        const exportData = filteredRecords.map((row) => {
            const cleaned = {};
            Object.keys(row)
                .filter((k) => !HIDDEN_COLUMNS.includes(k))
                .forEach((k) => {
                    cleaned[formatColumnLabel(k)] = row[k] ?? '';
                });
            return cleaned;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Golden Records');

        const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
            wch: Math.max(key.length, ...exportData.map((r) => String(r[key] ?? '').length)) + 2,
        }));
        worksheet['!cols'] = colWidths;

        XLSX.writeFile(workbook, `golden_records_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }, [filteredRecords]);

    return (
        <div className="p-4 m-4 bg-white min-h-screen satoshi-regular">
            <Breadcrumb />

            <div className="flex items-start justify-between mb-4 mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-[#282F49]">Golden Records</h1>
                    <p className="text-sm text-[#818181] mt-0.5">
                        Browse, search, and manage consolidated master records
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        disabled={!filteredRecords.length}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#CCCCCC] text-sm font-medium text-[#332849] bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Download size={15} />
                        Export
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#8E77BB] text-white rounded-lg hover:bg-[#7a67a0] transition-colors text-sm font-medium"
                    >
                        <Plus size={15} />
                        Create record
                    </button>
                </div>
            </div>

            {/* Filter bar */}
            <div className="flex items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-[160px]">
                        <SearchableDropdown
                            options={domainsLoading ? [] : domains}
                            value={selectedDomainId}
                            onChange={handleDomainChange}
                            placeholder={domainsLoading ? 'Loading...' : 'Domain'}
                        />
                    </div>

                    <div className="w-[160px]">
                        <SearchableDropdown
                            options={STATUS_OPTIONS}
                            value={selectedStatus}
                            onChange={setSelectedStatus}
                            placeholder="Status"
                        />
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search Record"
                            value={globalSearch}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                            className="rounded-lg border border-[#CCCCCC] py-[9px] pl-9 pr-8 text-sm focus:outline-none w-[250px]"
                        />
                        {globalSearch && (
                            <button
                                onClick={() => setGlobalSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredRecords}
                isLoading={tableLoading || domainsLoading}
                isError={tableError}
                refetch={() => fetchRecords(selectedDomainId || null)}
            />

            <CreateGoldenRecordModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => fetchRecords(selectedDomainId || null)}
                domainId={selectedDomainId}
            />
            <EditGoldenRecordModal
                isOpen={!!editingRecord}
                onClose={() => setEditingRecord(null)}
                recordData={editingRecord}
                domainId={selectedDomainId}
                onSuccess={() => { setEditingRecord(null); fetchRecords(selectedDomainId || null); }}
            />
        </div>
    );
};

export default GoldenRecordsHomepage;