import React, { useState, useCallback, useMemo } from 'react';
import { Plus, ChevronDown, Trash2 } from 'lucide-react';
import EditIcon from '../../../../../assets/mdm/edit.svg';
import DeleteIcon from '../../../../../assets/mdm/delete.svg';
import CaptivePortalIcon from '../../../../../assets/mdm/captive_portal.svg';
import CDCIcon from '../../../../../assets/mdm/CDC 1.svg';
import ComplianceIcon from '../../../../../assets/mdm/Compliance.svg';
import DataTable from '../../../../../components/DataTable';
import SearchableDropdown from '../../components/SearchableDropdown';
import Breadcrumb from '../../../../../components/Breadcrumb';
import CreateRelationshipTypeModal from './modals/CreateRelationshipTypeModal';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import { toast } from 'react-hot-toast';
import CreateCrossDomainLinkModal from './modals/CreateCrossDomainLinkModal';
import {
    useCrossDomainCounts,
    useRelationshipTypes,
    useActiveLinks,
    useDeleteLinks,
    useDeleteRelationshipType,
} from '../../../../../hooks/mdm/crossDomainLink';

/* ── Sub-components ── */
const StatusBadge = ({ status }) => {
    const isActive = status?.toLowerCase() === 'active';
    return (
        <span className={`px-2 py-1.5 text-xs font-normal rounded inline-block ${isActive ? 'text-[#069B68] bg-[#2AC79240]' : 'text-[#EF4D5F] bg-[#F276A74D]'}`}>
            {isActive ? 'Active' : 'Inactive'}
        </span>
    );
};

const CardinalityBadge = ({ value }) => (
    <span className="text-[#818181] bg-[#D9D9D980] px-2 py-1 text-xs font-normal rounded inline-block">
        {value}
    </span>
);

const RowActions = ({ row, onEdit, onDelete }) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });

    const handleOpen = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setPos({ top: rect.bottom + 4, left: rect.right - 160 });
        setOpen(p => !p);
    };

    return (
        <div className="relative inline-block">
            <button
                onClick={handleOpen}
                className="bg-transparent border-none cursor-pointer p-1 rounded-full flex items-center"
            >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#818181">
                    <circle cx="12" cy="5" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="19" r="1.5" />
                </svg>
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-[1000]" onClick={() => setOpen(false)} />
                    <div
                        className="fixed z-[9999] bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.15)] p-2 min-w-[160px] flex flex-col gap-1"
                        style={{ top: pos.top, left: pos.left }}
                    >
                        <button
                            onClick={() => { onEdit?.(row); setOpen(false); }}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-none cursor-pointer bg-[#F3EFFF] w-full"
                        >
                            <img src={EditIcon} alt="Edit" className="w-4 h-4" />
                            <span className="text-[#8e78b7] text-sm font-medium">Edit</span>
                        </button>
                        <button
                            onClick={() => { onDelete?.(row); setOpen(false); }}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-none cursor-pointer bg-white w-full"
                        >
                            <img src={DeleteIcon} alt="Delete" className="w-4 h-4" />
                            <span className="text-[#EF4D5F] text-sm font-medium">Delete</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

const METRIC_CONFIG = [
    { key: 'total_links',         title: 'Total Links',          icon: CaptivePortalIcon, bgcolor: '#C5EAF0' },
    { key: 'active_links',        title: 'Active Links',         icon: CDCIcon,           bgcolor: '#FFC93F40' },
    { key: 'relationship_types',  title: 'Relationship Types',   icon: ComplianceIcon,    bgcolor: '#FEE4FF' },
];

const CrossDomainLinkHomepage = () => {
    const [activeTab, setActiveTab] = useState('relationship_types');

    /* ── Data hooks ── */
    const { counts, isLoading: countsLoading, fetchCounts } = useCrossDomainCounts();
    const { relTypes, isLoading: relLoading, isError: relError, fetchRelTypes } = useRelationshipTypes();
    const { activeLinks, isLoading: linksLoading, isError: linksError, fetchActiveLinks } = useActiveLinks();

    /* ── Filters ── */
    const [relStatusFilter,   setRelStatusFilter]   = useState('');
    const [relSearch,         setRelSearch]         = useState('');
    const [linksStatusFilter, setLinksStatusFilter] = useState('');
    const [linksSearch,       setLinksSearch]       = useState('');

    /* ── Selection ── */
    const [selectedLinkIds, setSelectedLinkIds] = useState(new Set());

    /* ── Modals ── */
    const [deleteModal,    setDeleteModal]    = useState({ open: false, ids: [], count: 0 });
    const [relDeleteModal, setRelDeleteModal] = useState({ open: false, id: null, type_code: '' });
    const [isRelModalOpen, setIsRelModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

    /* ── Delete hooks ── */
    const { isDeleting, deleteLinks } = useDeleteLinks(async () => {
        toast.success('Links deleted successfully');
        setSelectedLinkIds(prev => {
            const next = new Set(prev);
            deleteModal.ids.forEach(id => next.delete(id));
            return next;
        });
        setDeleteModal({ open: false, ids: [], count: 0 });
        fetchCounts();
        fetchActiveLinks();
    });

    const { isDeleting: isRelDeleting, deleteRelType } = useDeleteRelationshipType(() => {
        toast.success('Relationship type deleted successfully');
        setRelDeleteModal({ open: false, id: null, type_code: '' });
        fetchCounts();
        fetchRelTypes();
    });

    /* ── Filtered data ── */
    const filteredRelTypes = useMemo(() => relTypes.filter(r => {
        const matchesStatus = !relStatusFilter || r.status === relStatusFilter;
        const matchesSearch = !relSearch ||
            r.relationship_name?.toLowerCase().includes(relSearch.toLowerCase()) ||
            r.type_code?.toLowerCase().includes(relSearch.toLowerCase()) ||
            r.description?.toLowerCase().includes(relSearch.toLowerCase());
        return matchesStatus && matchesSearch;
    }), [relTypes, relStatusFilter, relSearch]);

    const filteredActiveLinks = useMemo(() => activeLinks.filter(r => {
        const matchesStatus = !linksStatusFilter || r.status === linksStatusFilter;
        const matchesSearch = !linksSearch ||
            r.source_golden_id?.toLowerCase().includes(linksSearch.toLowerCase()) ||
            r.target_golden_id?.toLowerCase().includes(linksSearch.toLowerCase()) ||
            r.type?.toLowerCase().includes(linksSearch.toLowerCase());
        return matchesStatus && matchesSearch;
    }), [activeLinks, linksStatusFilter, linksSearch]);

    /* ── Selection helpers ── */
    const allFilteredIds = useMemo(() => filteredActiveLinks.map(r => r.relationship_id), [filteredActiveLinks]);
    const allSelected  = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedLinkIds.has(id));
    const someSelected = allFilteredIds.some(id => selectedLinkIds.has(id));

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedLinkIds(prev => { const n = new Set(prev); allFilteredIds.forEach(id => n.delete(id)); return n; });
        } else {
            setSelectedLinkIds(prev => { const n = new Set(prev); allFilteredIds.forEach(id => n.add(id)); return n; });
        }
    };

    const toggleSelectRow = (id) => {
        setSelectedLinkIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    };

    /* ── Delete handlers ── */
    const openDeleteModal    = (ids)           => setDeleteModal({ open: true, ids, count: ids.length });
    const closeDeleteModal   = ()              => { if (!isDeleting) setDeleteModal({ open: false, ids: [], count: 0 }); };
    const openRelDeleteModal = (id, type_code) => setRelDeleteModal({ open: true, id, type_code });
    const closeRelDeleteModal = ()             => { if (!isRelDeleting) setRelDeleteModal({ open: false, id: null, type_code: '' }); };

    const handleConfirmDelete    = () => deleteLinks(deleteModal.ids);
    const handleConfirmRelDelete = () => deleteRelType(relDeleteModal.id);

    const statusOptions = [
        { value: '',         label: 'All Status' },
        { value: 'Active',   label: 'Active' },
        { value: 'Inactive', label: 'Inactive' },
    ];

    /* ── Columns ── */
    const relTypeColumns = useMemo(() => [
        {
            key: 'type_code',
            label: 'Type Code',
            render: (row) => (
                <button className="text-[#8E77BB] hover:underline font-normal text-left text-sm">
                    {row.type_code}
                </button>
            ),
        },
        {
            key: 'description',
            label: 'Description',
            render: (row) => <span className="text-sm text-[#23252D]">{row.description}</span>,
        },
        {
            key: 'from',
            label: 'From',
            render: (row) => <span className="text-sm text-[#23252D]">{row.from}</span>,
        },
        {
            key: 'to',
            label: 'To',
            render: (row) => <span className="text-sm text-[#23252D]">{row.to}</span>,
        },
        {
            key: 'cardinality',
            label: 'Cardinality',
            render: (row) => <CardinalityBadge value={row.cardinality} />,
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: 'actions',
            label: '',
            sortable: false,
            render: (row) => (
                <RowActions
                    row={row}
                    onEdit={(r) => console.log('edit', r)}
                    onDelete={(r) => openRelDeleteModal(r.xref_type_id, r.type_code)}
                />
            ),
        },
    ], []);

    const activeLinksColumns = useMemo(() => [
        {
            key: 'checkbox',
            label: (
                <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                    onChange={toggleSelectAll}
                    className="cursor-pointer w-[15px] h-[15px] accent-[#8E77BB]"
                />
            ),
            sortable: false,
            render: (row) => (
                <input
                    type="checkbox"
                    checked={selectedLinkIds.has(row.relationship_id)}
                    onChange={() => toggleSelectRow(row.relationship_id)}
                    onClick={e => e.stopPropagation()}
                    className="cursor-pointer w-[15px] h-[15px] accent-[#8E77BB]"
                />
            ),
        },
        {
            key: 'source_golden_id',
            label: 'From Entity',
            render: (row) => <span className="text-sm text-[#23252D]">{row.source_golden_id}</span>,
        },
        {
            key: 'target_golden_id',
            label: 'To Entity',
            render: (row) => <span className="text-sm text-[#23252D]">{row.target_golden_id}</span>,
        },
        {
            key: 'type',
            label: 'Type',
            render: (row) => (
                <span className="text-[#818181] bg-[#D9D9D980] px-2 py-1 text-xs rounded inline-block">
                    {row.type}
                </span>
            ),
        },
        {
            key: 'relationship_role',
            label: 'Role',
            render: (row) => <span className="text-sm text-[#23252D]">{row.relationship_role}</span>,
        },
        {
            key: 'ownership_percentage',
            label: 'Ownership',
            render: (row) => <span className="text-sm text-[#23252D]">{row.ownership_percentage}</span>,
        },
        {
            key: 'effective_from',
            label: 'Since',
            render: (row) => <span className="text-sm text-[#23252D]">{row.effective_from}</span>,
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: 'actions',
            label: '',
            sortable: false,
            render: (row) => (
                <RowActions
                    row={row}
                    onEdit={(r) => console.log('edit link', r)}
                    onDelete={(r) => openDeleteModal([r.relationship_id])}
                />
            ),
        },
    ], [selectedLinkIds, allSelected, someSelected, filteredActiveLinks]);

    const selectedCount = selectedLinkIds.size;

    return (
        <div className="p-4 m-4 bg-white min-h-screen">
            <Breadcrumb />

            {/* Header */}
            <div className="flex items-start justify-between mb-4 mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-[#282F49]">Cross - Domain Links</h1>
                    <p className="text-sm text-[#818181] mt-0.5">
                        Link golden records between domains using specific roles and cardinality.
                    </p>
                </div>
                {/* <button className="flex items-center gap-2 px-4 py-2 bg-[#8E77BB] text-white rounded-lg hover:bg-[#7a67a0] transition-colors text-sm font-medium">
                    <Plus className="h-4 w-4" />
                    Create
                    <ChevronDown className="h-4 w-4" />
                </button> */}
            </div>

            {/* Metric Cards */}
            <div
                className="rounded-2xl p-4 mb-6"
                style={{ background: 'linear-gradient(270deg, #EFE7FF 17.24%, #8E77BB 93.06%, #2B125C 141.05%)' }}
            >
                <div className="grid grid-cols-3 gap-3">
                    {METRIC_CONFIG.map(metric => (
                        <div key={metric.key} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: metric.bgcolor }}
                                >
                                    <img src={metric.icon} alt={metric.title} className="w-5 h-5" />
                                </div>
                                <span className="text-base font-medium text-[#332849]">{metric.title}</span>
                            </div>
                            <span className="text-2xl font-bold text-[#282F49]">
                                {countsLoading ? '—' : counts[metric.key]?.toLocaleString() ?? '0'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div>
                <div className="flex items-end justify-between mb-3">
                    {/* Tab buttons */}
                    <div className="flex gap-6">
                        {[
                            { key: 'relationship_types', label: 'Relationships Types' },
                            { key: 'active_links',       label: 'Active Links' },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => { setActiveTab(tab.key); setSelectedLinkIds(new Set()); }}
                                className={`py-1.5 px-4 rounded-t-md text-base font-bold transition-colors ${
                                    activeTab === tab.key
                                        ? 'text-[#8E77BB] border-b-[3px] border-[#8E77BB] bg-[#FAF8FF]'
                                        : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 mb-1">

                        {/* Bulk delete */}
                        {activeTab === 'active_links' && selectedCount > 0 && (
                            <button
                                onClick={() => openDeleteModal([...selectedLinkIds])}
                                className="flex items-center gap-1.5 px-3.5 py-[7px] bg-[#FEE2E2] text-[#EF4D5F] border border-[#FECACA] rounded-lg text-[13px] font-medium cursor-pointer hover:bg-[#FECACA] transition-colors"
                            >
                                <Trash2 size={14} />
                                Delete ({selectedCount})
                            </button>
                        )}

                        {/* Search */}
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search Record"
                                value={activeTab === 'relationship_types' ? relSearch : linksSearch}
                                onChange={e =>
                                    activeTab === 'relationship_types'
                                        ? setRelSearch(e.target.value)
                                        : setLinksSearch(e.target.value)
                                }
                                className="pl-8 pr-3 py-[7px] text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#8E77BB] text-[#374151] bg-white w-[200px]"
                            />
                        </div>

                        {/* Status filter */}
                        <div className="w-[150px]">
                            <SearchableDropdown
                                value={activeTab === 'relationship_types' ? relStatusFilter : linksStatusFilter}
                                onChange={v =>
                                    activeTab === 'relationship_types'
                                        ? setRelStatusFilter(v)
                                        : setLinksStatusFilter(v)
                                }
                                options={statusOptions}
                                placeholder="Status"
                            />
                        </div>

                        {/* Action button */}
                        {activeTab === 'relationship_types' ? (
                            <button
                                className="flex items-center gap-2 px-4 py-2 bg-[#8E77BB] text-white rounded-lg hover:bg-[#7a67a0] transition-colors text-sm font-medium"
                                onClick={() => setIsRelModalOpen(true)}
                            >
                                <Plus className="h-4 w-4" />
                                Relationship
                            </button>
                        ) : (
                            <button
                                className="flex items-center gap-2 px-4 py-2 bg-[#8E77BB] text-white rounded-lg hover:bg-[#7a67a0] transition-colors text-sm font-medium"
                                onClick={() => setIsLinkModalOpen(true)}
                            >
                                <Plus className="h-4 w-4" />
                                New Link
                            </button>
                        )}
                    </div>
                </div>

                {activeTab === 'relationship_types' && (
                    <DataTable
                        columns={relTypeColumns}
                        data={filteredRelTypes}
                        isLoading={relLoading}
                        isError={relError}
                        refetch={fetchRelTypes}
                        title=""
                    />
                )}

                {activeTab === 'active_links' && (
                    <DataTable
                        columns={activeLinksColumns}
                        data={filteredActiveLinks}
                        isLoading={linksLoading}
                        isError={linksError}
                        refetch={fetchActiveLinks}
                        title=""
                    />
                )}

                <CreateRelationshipTypeModal
                    isOpen={isRelModalOpen}
                    onClose={() => setIsRelModalOpen(false)}
                    onSuccess={() => { fetchRelTypes(); fetchCounts(); }}
                />
            </div>

            <CreateCrossDomainLinkModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                onSuccess={() => { fetchActiveLinks(); fetchCounts(); }}
                relTypes={relTypes}
            />

            <DeleteConfirmModal
                isOpen={deleteModal.open}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
                title={`Delete ${deleteModal.count > 1 ? 'Links' : 'Link'}`}
                message={`Are you sure you want to delete ${deleteModal.count > 1 ? `${deleteModal.count} selected links` : 'the selected link'}? This action cannot be undone.`}
            />

            <DeleteConfirmModal
                isOpen={relDeleteModal.open}
                onClose={closeRelDeleteModal}
                onConfirm={handleConfirmRelDelete}
                count={1}
                isDeleting={isRelDeleting}
                title="Delete Relationship Type"
                message={`Are you sure you want to delete relationship type ${relDeleteModal.type_code}? This action cannot be undone.`}
                note="Deleting relationship type will also delete the links linked to this relationship type"
            />
        </div>
    );
};

export default CrossDomainLinkHomepage;