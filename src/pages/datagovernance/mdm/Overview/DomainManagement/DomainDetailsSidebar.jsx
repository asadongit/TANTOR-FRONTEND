import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Plus, MoreVertical, ChevronLeft } from 'lucide-react';
import EditIcon from '../../../../../assets/mdm/edit.svg';
import DeleteIcon from '../../../../../assets/mdm/delete.svg';
import MDMDataTable from '../../../../../components/MDMDataTable.jsx';
import EditAttributeModal from './modals/EditAttributeModal.jsx';
import AddAttributeModal from './modals/AddAttributeModal.jsx';
import { toast } from 'react-hot-toast';
import {
    useDomainDetails,
    useDeleteAttribute,
} from '../../../../../hooks/mdm/domainManagement.jsx';

/* ─────────────────────────────────────────────
   Badges
───────────────────────────────────────────── */
const DQScoreBadge = ({ score }) => {
    const num = parseFloat(score);
    const colorClass =
        num < 70 ? 'text-[#EF4D5F]' : num < 85 ? 'text-[#E08E40]' : 'text-[#36AD8F]';
    return <span className={`${colorClass} text-sm font-medium`}>{score}%</span>;
};

const StatusBadge = ({ status }) => {
    const lower = status?.toLowerCase();
    const classes =
        lower === 'active'
            ? 'text-[#069B68] bg-[#2AC79240]'
            : lower === 'draft'
            ? 'text-[#EF4D5F] bg-[#F276A74D]'
            : 'text-[#6B7280] bg-[#F3F4F6]';
    return (
        <span className={`${classes} px-2 py-1.5 text-xs font-normal rounded-md`}>
            {status}
        </span>
    );
};

/* ─────────────────────────────────────────────
   Attribute action menu
───────────────────────────────────────────── */
const AttributeActionMenu = ({ row, onEdit, onDelete, isMultiSelected, selectedCount }) => {
    const [isOpen, setIsOpen]   = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

    const handleOpen = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 4, left: rect.right - 140 });
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
                    <div
                        className="fixed inset-0 z-[1000]"
                        onClick={() => setIsOpen(false)}
                    />
                    <div
                        className="fixed z-[9999] bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.15)] p-2 min-w-[140px] flex flex-col gap-1"
                        style={{ top: menuPos.top, left: menuPos.left }}
                    >
                        {!isMultiSelected && (
                            <button
                                onClick={() => { onEdit?.(row); setIsOpen(false); }}
                                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] border-none cursor-pointer bg-[#F3EFFF] w-full"
                            >
                                <img src={EditIcon} alt="Edit" className="w-3.5 h-3.5" />
                                <span className="text-[#8e78b7] text-sm font-medium">Edit</span>
                            </button>
                        )}
                        <button
                            onClick={() => { onDelete?.(row); setIsOpen(false); }}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] border-none cursor-pointer bg-white w-full"
                        >
                            <img src={DeleteIcon} alt="Delete" className="w-3.5 h-3.5" />
                            <span className="text-[#E05252] text-sm font-medium">
                                {isMultiSelected ? `Delete (${selectedCount})` : 'Delete'}
                            </span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────
   Sidebar
───────────────────────────────────────────── */
const DomainDetailsSidebar = ({ domain, onClose, onEdit }) => {
    const [view, setView]                   = useState('detail');
    const [searchTerm, setSearchTerm]       = useState('');
    const [editAttrModalOpen, setEditAttrModalOpen] = useState(false);
    const [addAttrModalOpen, setAddAttrModalOpen]   = useState(false);
    const [selectedAttr, setSelectedAttr]   = useState(null);
    const [selectedAttrIds, setSelectedAttrIds] = useState([]);

    /* ── Hooks ── */
    const { attrData, domainId, isLoading: attrLoading, fetchDetails } = useDomainDetails();
    const { deleteAttribute } = useDeleteAttribute(() => fetchDetails(domain?.id));

    /* ── Effects ── */
    useEffect(() => {
        if (!domain?.id) return;
        fetchDetails(domain.id);
    }, [domain?.id, fetchDetails]);

    useEffect(() => {
        setView('detail');
        setSearchTerm('');
        setSelectedAttrIds([]);
    }, [domain?.id]);

    if (!domain) return null;

    /* ── Helpers ── */
    const formatDate = (iso) => {
        if (!iso) return '-';
        const d = new Date(iso);
        if (isNaN(d)) return '-';
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const description = domain.description || '--';

    const detailPairs = [
        ['Domain Name', domain.domainName, 'Records', domain.records?.toLocaleString() ?? '-'],
        ['Domain Code', domain.domainCode, 'DQ Score', <DQScoreBadge score={domain.dqScore} />],
        ['Table Name',  domain.tableName,  'Status',   <StatusBadge status={domain.status} />],
        ['Type',        domain.type,       'Created',  formatDate(domain.createdAt)],
        ['Attributes',  String(domain.attributes ?? '-'), 'Last Update', formatDate(domain.updatedAt)],
    ];

    const handleToggleSelect = (id) =>
        setSelectedAttrIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );

    const handleEditAttr = (row) => { setSelectedAttr(row); setEditAttrModalOpen(true); };

    const handleDeleteAttr = async (row) => {
        const idsToDelete = selectedAttrIds.length > 1 ? selectedAttrIds : [row.attribute_id];
        const result = await deleteAttribute(domainId, idsToDelete, 'admin_user');
        if (result.ok) {
            toast.success('Attributes deleted successfully.');
            setSelectedAttrIds([]);
        } else {
            toast.error(result.message);
        }
    };

    const filteredAttrs = attrData.filter((row) =>
        Object.values(row).some((v) =>
            String(v).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    /* ── Column configs ── */
    const previewColumns = [
        { key: 'attributeName', label: 'Attribute' },
        { key: 'dataType',      label: 'Type' },
        { key: 'required',      label: 'Required' },
        { key: 'dqRule',        label: 'DQ Rule' },
    ];

    const fullAttributeColumns = [
        {
            label: '',
            key: 'checkbox',
            sortable: false,
            maxWidth: '50px',
            minWidth: '50px',
            render: (row) => (
                <input
                    type="checkbox"
                    checked={selectedAttrIds.includes(row.attribute_id)}
                    onChange={() => handleToggleSelect(row.attribute_id)}
                    onClick={(e) => e.stopPropagation()}
                    className="accent-[#8E77BB] w-3.5 h-3.5 cursor-pointer"
                />
            ),
        },
        { key: 'attributeName', label: 'Attribute Name', maxWidth: '150px' },
        { key: 'dataType',      label: 'Data Type',      maxWidth: '130px' },
        { key: 'required',      label: 'Required',       maxWidth: '90px' },
        { key: 'dqRule',        label: 'DQ Rule',        maxWidth: '160px' },
        {
            label: 'Action',
            sortable: false,
            maxWidth: '70px',
            render: (row) => (
                <AttributeActionMenu
                    row={row}
                    onEdit={handleEditAttr}
                    onDelete={handleDeleteAttr}
                    isMultiSelected={
                        selectedAttrIds.length > 1 && selectedAttrIds.includes(row.attribute_id)
                    }
                    selectedCount={selectedAttrIds.length}
                />
            ),
        },
    ];

    return (
        <>
            <div className="fixed inset-0 z-30" onClick={onClose} />

            <div className="fixed top-16 bottom-0 right-0 z-40 w-[745px] bg-white flex flex-col shadow-[-8px_0px_10px_0px_rgba(0,0,0,0.1)] overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-[18px] bg-white border-b border-[#CCCCCC] shrink-0">
                    <span className="text-lg font-medium text-[#332849] leading-none">
                        {domain.domainName}
                    </span>
                    <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 transition-colors">
                        <X size={20} className="text-[#818181]" />
                    </button>
                </div>

                {/* ── Detail view ── */}
                {view === 'detail' && (
                    <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
                        <div className="bg-[#FAFAFA] rounded-md px-5 py-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-base font-medium text-[#332849] leading-none">
                                    Domain Details
                                </span>
                                <button
                                    onClick={() => onEdit?.(domain)}
                                    className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-white border border-[#8E77BB] text-[#8E77BB] text-sm font-medium hover:bg-[#ede8ff] transition-colors leading-none"
                                >
                                    <img src={EditIcon} alt="Edit" className="w-3 h-3" />
                                    Edit
                                </button>
                            </div>

                            <div className="flex flex-col gap-0">
                                {detailPairs.map(([lLabel, lVal, rLabel, rVal], i) => (
                                    <div key={i} className="grid grid-cols-2 gap-x-4 py-2.5">
                                        <div className="flex items-center justify-between pr-2">
                                            <span className="text-sm font-normal text-[#818181] shrink-0">{lLabel}</span>
                                            <span className="text-sm font-normal text-[#332849] text-right">{lVal ?? '-'}</span>
                                        </div>
                                        <div className="flex items-center justify-between pl-2">
                                            <span className="text-sm font-normal text-[#818181] shrink-0">{rLabel}</span>
                                            <span className="text-sm font-normal text-[#332849] text-right">{rVal ?? '-'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-3">
                                <p className="text-sm font-normal text-[#818181] mb-1 leading-none">Description</p>
                                <p className="text-sm font-normal text-[#332849] leading-relaxed mt-2">{description}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-medium text-[#332849] leading-none">
                                    Key Attributes ({attrLoading ? '…' : `${attrData.length} Fields`})
                                </span>
                                <button
                                    onClick={() => setView('attributes')}
                                    className="text-sm font-medium text-[#8E77BB] hover:underline leading-none"
                                >
                                    View all
                                </button>
                            </div>

                            <MDMDataTable
                                columns={previewColumns}
                                data={attrData}
                                isLoading={attrLoading}
                                className="w-full"
                                maxHeight="340px"
                            />
                        </div>
                    </div>
                )}

                {/* ── Attributes view ── */}
                {view === 'attributes' && (
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between px-6 py-4 shrink-0">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { setView('detail'); setSearchTerm(''); }}
                                    className="p-0.5 rounded hover:bg-gray-100 transition-colors"
                                >
                                    <ChevronLeft size={20} className="text-[#818181]" />
                                </button>
                                <span className="text-lg font-medium text-[#332849] leading-none">
                                    Attributes
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-[200px] rounded-lg border border-gray-200 py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                                    />
                                </div>

                                {selectedAttrIds.length > 1 && (
                                    <button
                                        onClick={() => handleDeleteAttr(null)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-[#E05252] hover:bg-[#c94444] text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        <img
                                            src={DeleteIcon}
                                            alt="Delete"
                                            className="w-3.5 h-3.5 brightness-[10]"
                                        />
                                        Delete ({selectedAttrIds.length})
                                    </button>
                                )}

                                <button
                                    onClick={() => setAddAttrModalOpen(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-[#8E77BB] hover:bg-[#7a67a0] text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    <Plus size={15} />
                                    Attribute
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 px-4 pb-2">
                            <MDMDataTable
                                columns={fullAttributeColumns}
                                data={filteredAttrs}
                                isLoading={attrLoading}
                                className="w-full h-full"
                                maxHeight="100%"
                                horizontalScroll
                            />
                        </div>
                    </div>
                )}
            </div>

            <EditAttributeModal
                isOpen={editAttrModalOpen}
                onClose={() => { setEditAttrModalOpen(false); setSelectedAttr(null); }}
                onComplete={() => { fetchDetails(domain?.id); setEditAttrModalOpen(false); }}
                attributeData={selectedAttr}
                domainName={domain?.domainName}
                domainId={domain?.id}
            />
            <AddAttributeModal
                isOpen={addAttrModalOpen}
                onClose={() => setAddAttrModalOpen(false)}
                onComplete={() => { fetchDetails(domain?.id); setAddAttrModalOpen(false); }}
                domainName={domain?.domainName}
                domainId={domain?.id}
            />
        </>
    );
};

export default DomainDetailsSidebar;