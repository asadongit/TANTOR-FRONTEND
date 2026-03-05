import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Pin, Eye, Trash2, Plus, Send, X, MoreVertical, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../../context/AuthContext';
import DataTable from '../../../../../components/DataTable';
import AddCommentModal from './AddCommentModal';
import CommentDetailModal from './CommentDetailModal';
import CustomDropdown from '../../../../../components/CustomDropdown';
import { aithemestyle } from '../../../../../components/themeContext';
import Searchicon from '../../../../../assets/governance/search.svg';
import keep from '../../../../../assets/ai/keep.svg';

const CommentsTab = ({ projectData }) => {
    const { token, decodedToken } = useAuth();
    const hostnameAI = window._env_?.VITE_AI_API;

    const projectId = projectData?.id;

    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [refreshTick, setRefreshTick] = useState(0);

    const defaultFilters = useMemo(
        () => ({
            fromDate: '',
            toDate: '',
            sortBy: 'date',
            q: '',
            component: '',
        }),
        []
    );
    const [filters, setFilters] = useState(defaultFilters);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const today = useMemo(() => new Date().toISOString().split('T')[0], []);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [addForm, setAddForm] = useState({
        subject: '',
        type: '',
        pinned: 0,
        comment: '',
        component: 'Project',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [addCommentError, setAddCommentError] = useState(null);
    const [subjectError, setSubjectError] = useState('');
    const [isRepliesOpen, setIsRepliesOpen] = useState(false);
    const [activeCommentId, setActiveCommentId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [showOnlyPinned, setShowOnlyPinned] = useState(false);

    const activeComment = useMemo(() => {
        if (!activeCommentId) return null;
        return (Array.isArray(comments) ? comments : []).find((c) => String(c?.id) === String(activeCommentId)) || null;
    }, [comments, activeCommentId]);

    const doRefresh = () => setRefreshTick((x) => x + 1);

    useEffect(() => {
        if (!projectId) return;

        const fetchComments = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const url = `${hostnameAI}/canvas/comments/by-project-all-components?project_id=${encodeURIComponent(projectId)}`;
                const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) throw new Error('Failed to fetch comments');
                const data = await res.json();
                setComments(Array.isArray(data) ? data : []);
            } catch (e) {
                setError(e?.message || 'Failed to fetch comments');
                setComments([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchComments();
    }, [projectId, hostnameAI, token, refreshTick]);

    const fmt = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB');
    };

    const fmtFull = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-GB');
    };

    const parseLocalDateRange = (fromDate, toDate) => {
        const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
        const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null;
        return { from, to };
    };

    const filteredSortedComments = useMemo(() => {
        const arr = Array.isArray(comments) ? [...comments] : [];
        let out = arr;

        const { from, to } = parseLocalDateRange(filters.fromDate, filters.toDate);
        if (from || to) {
            out = out.filter((c) => {
                const t = new Date(c?.created_at || 0).getTime();
                if (!t) return false;
                if (from && t < from.getTime()) return false;
                if (to && t > to.getTime()) return false;
                return true;
            });
        }

        if (filters.component) {
            out = out.filter((c) => (c?.component || '').toLowerCase() === filters.component.toLowerCase());
        }

        const q = (filters.q || '').trim().toLowerCase();
        if (q) {
            out = out.filter((c) => {
                const hay = [c?.subject, c?.comment, c?.user_name, c?.user_id, c?.component]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                return hay.includes(q);
            });
        }

        out.sort((a, b) => {
            if (showOnlyPinned) {
                const ap = Number(a?.pinned || 0);
                const bp = Number(b?.pinned || 0);
                if (bp !== ap) return bp - ap;
            }

            const s = filters.sortBy || 'date';
            if (s === 'replies') {
                const ar = Array.isArray(a?.replies) ? a.replies.length : 0;
                const br = Array.isArray(b?.replies) ? b.replies.length : 0;
                if (br !== ar) return br - ar;
                const at = new Date(a?.updated_at || a?.created_at || 0).getTime();
                const bt = new Date(b?.updated_at || b?.created_at || 0).getTime();
                return bt - at;
            }

            if (s === 'user') return (a?.user_name || a?.user_id || '').localeCompare(b?.user_name || b?.user_id || '');
            if (s === 'subject') return (a?.subject || '').localeCompare(b?.subject || '');
            if (s === 'component') return (a?.component || '').localeCompare(b?.component || '');

            const at = new Date(a?.updated_at || a?.created_at || 0).getTime();
            const bt = new Date(b?.updated_at || b?.created_at || 0).getTime();
            return bt - at;
        });

        return out;
    }, [comments, filters, showOnlyPinned]);

    const openReplies = (rawComment) => {
        setActiveCommentId(rawComment?.id ?? null);
        setReplyText('');
        setIsRepliesOpen(true);
    };

    const closeReplies = () => {
        setIsRepliesOpen(false);
        setActiveCommentId(null);
        setReplyText('');
    };

    const [componentType, setComponentType] = useState('Project');
    const [componentName, setComponentName] = useState('');
    const [componentOptions, setComponentOptions] = useState([]);
    const [isComponentNameDisabled, setIsComponentNameDisabled] = useState(true);
    const [componentId, setComponentId] = useState(projectData?.id || '');

    const wordCount = (str) => {
        if (!str || !str.trim()) return 0;
        return str.trim().split(/\s+/).filter(Boolean).length;
    };

    const trimToWords = (str, maxWords) => {
        if (!str) return '';
        const words = str.trim().split(/\s+/).filter(Boolean);
        return words.slice(0, maxWords).join(' ');
    };


    useEffect(() => {
        if (!isAddOpen) return;
        if (componentType === 'Project') {
            setComponentOptions([]);
            setComponentName('');
            setIsComponentNameDisabled(true);
            setComponentId(projectId);
        } else if (componentType === 'Data' || componentType === 'Model') {
            setIsComponentNameDisabled(false);
            setComponentName('');
            setComponentOptions([]);
            setComponentId('');
            const fetchOptions = async () => {
                try {
                    const apiPath =
                        componentType === 'Data'
                            ? `/canvas/projects/${encodeURIComponent(projectData?.name)}/datasets`
                            : `/canvas/projects/${encodeURIComponent(projectData?.name)}/models`;
                    const url = `${hostnameAI}${apiPath}`;
                    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                    if (!res.ok) throw new Error('Failed to fetch component options');
                    const data = await res.json();
                    if (componentType === 'Data') {
                        setComponentOptions(data.datasets || []);
                    } else {
                        setComponentOptions(data.models || []);
                    }
                } catch (e) {
                    setComponentOptions([]);
                }
            };
            fetchOptions();
        }
    }, [componentType, isAddOpen, projectData, hostnameAI, token, projectId]);

    useEffect(() => {
        if (componentType === 'Project') {
            setComponentId(projectId);
        } else if (componentType === 'Data') {
            const found = componentOptions.find((d) => d.dataset_name === componentName);
            setComponentId(found?.dataset_id || '');
        } else if (componentType === 'Model') {
            const found = componentOptions.find((m) => m.model_name === componentName);
            setComponentId(found?.model_id || '');
        }
    }, [componentType, componentName, componentOptions, projectId]);

    const openAdd = () => {
        setAddForm({ subject: '', type: '', pinned: 0, comment: '', component: 'Project' });
        setComponentType('Project');
        setComponentName('');
        setComponentOptions([]);
        setIsComponentNameDisabled(true);
        setComponentId(projectId);
        setIsAddOpen(true);
    };

    const closeAdd = () => {
        setIsAddOpen(false);
        setAddForm({ subject: '', type: '', pinned: 0, comment: '', component: 'Project' });
        setComponentType('Project');
        setComponentName('');
        setComponentOptions([]);
        setIsComponentNameDisabled(true);
        setComponentId(projectId);
        setAddCommentError(null);
        setSubjectError('');
    };

    const canCallApis = Boolean(hostnameAI && token && decodedToken?.sub && projectId);

    const submitAddComment = async () => {
        if (!canCallApis) {
            setAddCommentError('Missing required context (token/user/project).');
            return;
        }
        if (!addForm.subject.trim() || !addForm.comment.trim()) {
            setAddCommentError('Subject and Comment are required.');
            return;
        }
        if (addForm.subject.length > 120) {
            setAddCommentError('Subject cannot exceed 120 characters.');
            return;
        }
        if (addForm.comment.length > 500) {
            setAddCommentError('Comment cannot exceed 500 characters.');
            return;
        }
        if (!componentId) {
            setAddCommentError('Please select a valid component name.');
            return;
        }

        setIsSubmitting(true);
        setAddCommentError(null);
        try {
            const payload = {
                user_id: decodedToken.sub,
                subject: addForm.subject.trim(),
                component: componentType,
                component_id: componentId,
                pinned: Number(addForm.pinned) ? 1 : 0,
                comment: addForm.comment.trim(),
                project_id: projectId,
                type: addForm.type?.trim() || 'general',
            };

            const res = await fetch(`${hostnameAI}/canvas/add_comment`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Failed to add comment');

            toast.success('Comment added successfully!');
            closeAdd();
            setRefreshTick((x) => x + 1);
        } catch (e) {
            setAddCommentError(e?.message || 'Failed to add comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitReply = async () => {
        if (!canCallApis) {
            setError('Missing required context (token/user/project).');
            return;
        }
        if (!activeCommentId) {
            setError('No comment selected.');
            return;
        }
        if (!replyText.trim()) return;

        setIsSubmitting(true);
        setError(null);
        try {
            const payload = {
                user_id: decodedToken.sub,
                comment_id: activeCommentId,
                comment: replyText.trim(),
            };

            const res = await fetch(`${hostnameAI}/canvas/reply_to_comment`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Failed to add reply');

            toast.success('Reply added successfully!');
            setReplyText('');
            setRefreshTick((x) => x + 1);
        } catch (e) {
            setError(e?.message || 'Failed to add reply');
        } finally {
            setIsSubmitting(false);
        }
    };

    const tableRows = useMemo(() => {
        return filteredSortedComments.map((c) => ({
            id: c.id,
            user_name: c.user_name || c.user_id || 'Unknown',
            component: c.component || 'project',
            component_name: c.component_name || '',
            subject: c.subject || 'No subject',
            comment: c.comment || '',
            post_date: c.created_at || '',
            last_date: c.updated_at || c.created_at || '',
            repliesCount: Array.isArray(c.replies) ? c.replies.length : 0,
            replies: Array.isArray(c.replies) ? c.replies : [],
            __raw: c,
            rowClassName: showOnlyPinned && Number(c?.pinned) ? 'bg-blue-50' : '',
        }));
    }, [filteredSortedComments, showOnlyPinned]);

    const columns = useMemo(
        () => [
            { key: 'user_name', label: 'User Name', sortable: true, width: '130px' },
            { key: 'component', label: 'Component', sortable: true, width: '100px' },
            { key: 'component_name', label: 'Component Name', sortable: false, width: '180px' },

            {
                key: 'subject',
                label: 'Subject',
                sortable: false,
                width: '160px',
                render: (row) => (
                    <span className="text-gray-900 font-medium truncate block" title={row.subject}>
                        {row.subject}
                    </span>
                ),
            },
            {
                key: 'comment',
                label: 'Comment',
                sortable: false,
                width: '150px',
                render: (row) => (
                    <span className="text-gray-700 line-clamp-2 block" title={row.comment}>
                        {row.comment}
                    </span>
                ),
            },
            { key: 'post_date', label: 'Post Date', sortable: true, width: '120px', render: (row) => <span title={fmtFull(row.post_date)}>{fmt(row.post_date)}</span> },
            { key: 'last_date', label: 'Last Date', sortable: true, width: '120px', render: (row) => <span title={fmtFull(row.last_date)}>{fmt(row.last_date)}</span> },
            {
                key: 'repliesCount',
                label: '',
                sortable: false,
                width: '100px',
                render: (row) => (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            openReplies(row.__raw);
                        }}
                        className="text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ color: aithemestyle.iconColor }}
                    >
                        {String(row.repliesCount).padStart(2, '0')} Replies
                    </button>
                ),
            },
        ],
        []
    );

    const actions = useMemo(
        () => [
            { label: 'View', icon: <Eye className="w-4 h-4" />, onClick: (row) => openReplies(row.__raw), tooltip: 'View' },
            { label: 'Pin', icon: <Pin className="w-4 h-4" />, onClick: (row) => console.log('Pin/unpin:', row.__raw), tooltip: 'Pin/Unpin' },
            { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: (row) => console.log('Delete comment:', row.__raw), tooltip: 'Delete' },
        ],
        []
    );

    if (!projectId) {
        return (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-center py-12 text-gray-500">Project not found.</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl">
            <div className="flex items-end gap-3 mb-4 p-4">
                <div className="min-w-[140px]">
                    <CustomDropdown
                        label="Component"
                        value={filters.component || ''}
                        onChange={(e) => setFilters((s) => ({ ...s, component: e.target.value }))}
                        options={[
                            { value: '', label: 'All' },
                            { value: 'Project', label: 'Project' },
                            { value: 'Data', label: 'Data' },
                            { value: 'Model', label: 'Model' },
                        ]}
                        placeholder="All"
                        rounded="lg"
                    />
                </div>

                <div className="w-px h-9 bg-gray-300"></div>

                <div className="min-w-[140px]">
                    <label className="block satoshi-14 mb-1">From Date</label>
                    <input
                        type="date"
                        value={filters.fromDate}
                        onChange={(e) => setFilters((s) => ({ ...s, fromDate: e.target.value }))}
                        max={today}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8e78b7]"
                    />
                </div>

                <div className="min-w-[140px]">
                    <label className="block satoshi-14 mb-1">To Date</label>
                    <input
                        type="date"
                        value={filters.toDate}
                        onChange={(e) => setFilters((s) => ({ ...s, toDate: e.target.value }))}
                        max={today}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8e78b7]"
                    />
                </div>

                <div className="w-px h-9 bg-gray-300"></div>

                <div className="min-w-[140px]">
                    <CustomDropdown
                        label="Sort by"
                        value={filters.sortBy || 'date'}
                        onChange={(e) => setFilters((s) => ({ ...s, sortBy: e.target.value }))}
                        options={[
                            { value: 'date', label: 'Date' },
                            { value: 'replies', label: 'Replies' },
                            { value: 'user', label: 'User' },
                            { value: 'subject', label: 'Subject' },
                            { value: 'component', label: 'Component' },
                        ]}
                        placeholder="Date"
                        rounded="lg"
                    />
                </div>

                {/* <div className="w-px h-9 bg-gray-300"></div> */}

                <div style={{ width: '205px' }}>
                    <label className="block text-xs text-gray-600 mb-1">&nbsp;</label>
                    <div className="relative">
                        <img src={Searchicon} alt="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-5 text-gray-400 pointer-events-none" />
                        <input
                            value={filters.q}
                            onChange={(e) => setFilters((s) => ({ ...s, q: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8e78b7]"
                            placeholder="Search Comments"
                        />
                    </div>
                </div>

                <div className="w-px h-9 bg-gray-300"></div>

                <div>
                    <label className="block text-xs text-gray-600 mb-1">&nbsp;</label>
                    <button
                        onClick={() => setShowOnlyPinned(!showOnlyPinned)}
                        className={`inline-flex items-center justify-center gap-2 px-3 py-2 border rounded-lg font-medium text-sm ${
                            showOnlyPinned 
                                ? 'border-[#8E77BB] text-[#8E77BB]' 
                                : 'border-gray-300 text-[#818181] hover:bg-gray-50'
                        }`}
                        title={showOnlyPinned ? 'Stop highlighting pinned comments' : 'Highlight pinned comments'}
                    >
                        <Pin className="w-4 h-4" />
                        <span>Pinned</span>
                        {showOnlyPinned && <X className="w-4 h-4" style={{ color: '#818181' }} />}
                    </button>
                </div>

                <button
                    onClick={openAdd}
                    style={{
                        width: '119px',
                        height: '40px',
                        borderRadius: '8px',
                        paddingTop: '10px',
                        paddingRight: '16px',
                        paddingBottom: '10px',
                        paddingLeft: '12px',
                        gap: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#8E77BB',
                        color: 'white',
                        border: '1px solid #8E77BB',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        opacity: 1,
                        marginLeft: 'auto',
                    }}
                >
                    <Plus className="w-4 h-4" />
                     Comment
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
            )}

            <div className=" text-xs text-gray-500">
                {showOnlyPinned ? 'Pinned comments are highlighted and shown at top.' : ''}
            </div>

            <DataTable
                columns={columns}
                data={tableRows}
                actions={actions}
                isLoading={isLoading}
                isError={!!error}
                refetch={doRefresh}
                resetSortTrigger={refreshTick}
                onRowClick={(row) => openReplies(row.__raw)}
            />

            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-2xl rounded-xl bg-white border border-gray-200 shadow-lg">
                        <div className="flex items-center justify-between px-5 py-4 border-b">
                            <div>
                                <div className="text-base font-semibold text-gray-900">Add Comment</div>
                                <div className="text-xs text-gray-500">Project: {projectData?.name || projectId}</div>
                            </div>
                            <button className="p-2 hover:bg-gray-50 rounded-lg" onClick={closeAdd} title="Close">
                                <X className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Component Type */}
                                <div>
                                    <CustomDropdown
                                        label="Component Type"
                                        value={componentType}
                                        onChange={(e) => {
                                            setComponentType(e.target.value);
                                            setAddForm((s) => ({ ...s, component: e.target.value }));
                                        }}
                                        options={[
                                            { value: 'Project', label: 'Project' },
                                            { value: 'Data', label: 'Data' },
                                            { value: 'Model', label: 'Model' },
                                        ]}
                                        placeholder="Select"
                                        rounded="lg"
                                    />
                                </div>
                                {/* Component Name */}
                                <div>
                                    <CustomDropdown
                                        label="Component Name"
                                        value={componentName}
                                        onChange={(e) => setComponentName(e.target.value)}
                                        options={[
                                            { value: '', label: 'Select' },
                                            ...(componentType === 'Data'
                                                ? componentOptions.map((d) => ({
                                                    value: d.dataset_name,
                                                    label: d.dataset_name,
                                                }))
                                                : []),
                                            ...(componentType === 'Model'
                                                ? componentOptions.map((m) => ({
                                                    value: m.model_name,
                                                    label: m.model_name,
                                                }))
                                                : []),
                                        ]}
                                        placeholder="Select"
                                        disabled={isComponentNameDisabled}
                                        rounded="lg"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <CustomDropdown
                                        label="Category"
                                        value={addForm.type}
                                        onChange={(e) => setAddForm((s) => ({ ...s, type: e.target.value }))}
                                        options={[
                                            { value: '', label: 'Select' },
                                            { value: 'accuracy', label: 'Accuracy' },
                                            { value: 'data per-processing', label: 'Data Pre-Processing' },
                                            { value: 'modelling', label: 'Modelling' },
                                            { value: 'training data', label: 'Training Data' },
                                        ]}
                                        placeholder="Select"
                                        rounded="lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Subject</label>
                                    <input
                                        value={addForm.subject}
                                        onChange={(e) => {
                                            const input = e.target.value;
                                            const cleaned = input.replace(/[^a-zA-Z0-9\s\/\-]/g, '');
                                            if (cleaned !== input) {
                                                setSubjectError('Only letters, numbers, spaces, / and - are allowed');
                                            } else {
                                                setSubjectError('');
                                            }
                                            let value = cleaned;
                                            if (value.length <= 120) {
                                                setAddForm((s) => ({ ...s, subject: value }));
                                            } else {
                                                setAddForm((s) => ({ ...s, subject: value.substring(0, 120) }));
                                            }
                                        }}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        placeholder="Subject"
                                    />
                                    <div className="text-xs text-gray-400 text-right">{addForm.subject.length}/120 characters</div>
                                    {subjectError && <p className="text-red-500 text-xs mt-2">{subjectError}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Add Comment</label>
                                <textarea
                                    value={addForm.comment}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value.length <= 500) {
                                            setAddForm((s) => ({ ...s, comment: value }));
                                        } else {
                                            setAddForm((s) => ({ ...s, comment: value.substring(0, 500) }));
                                        }
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[80px]"
                                    placeholder="Add Comment"
                                />
                                <div className="text-xs text-gray-400 text-right">{addForm.comment.length}/500 characters</div>
                            </div>
                            {addCommentError && <p className="text-red-500 text-xs mt-2">{addCommentError}</p>}

                            <div className="flex items-center gap-2">
                                <input
                                    id="pinned_project"
                                    type="checkbox"
                                    checked={Number(addForm.pinned) === 1}
                                    onChange={(e) => setAddForm((s) => ({ ...s, pinned: e.target.checked ? 1 : 0 }))}
                                />
                                <label htmlFor="pinned_project" className="text-sm text-gray-700">
                                    Pinned
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 px-5 py-4 border-t">
                            <button
                                className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
                                onClick={closeAdd}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-3 py-2 text-sm rounded-lg bg-[#8e78b7] text-white hover:opacity-90 disabled:opacity-50"
                                onClick={submitAddComment}
                                disabled={isSubmitting || !addForm.subject.trim() || !addForm.comment.trim()}
                            >
                                {isSubmitting ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isRepliesOpen && (
                <div className="fixed inset-0 z-50 flex bg-black/30" onClick={closeReplies}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'absolute', right: 0, top: 0,
                            width: '100%', maxWidth: '760px', height: '100%',
                            background: '#FFFFFF',
                            boxShadow: '0px -4px 14px rgba(0,0,0,0.17)',
                            fontFamily: 'Satoshi, Avenir, sans-serif',
                            display: 'flex', flexDirection: 'column',
                        }}
                    >
                        {/* Header */}
                        <div style={{ height: '56px', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #CCCCCC', flexShrink: 0 }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#332849' }}>
                                    Component : {activeComment?.component_name || activeComment?.component || 'Project'}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 500 }}>
                                    <span style={{ color: '#818181' }}>
                                        {String(Array.isArray(activeComment?.replies) ? activeComment.replies.length : 0).padStart(2, '0')} Total Replies
                                    </span>

                                </div>
                            </div>
                            <button onClick={closeReplies} style={{ fontSize: '20px', cursor: 'pointer', background: 'none', border: 'none', color: '#515561', lineHeight: 1, padding: '4px' }}>✕</button>
                        </div>

                        {/* Subject / Component row */}
                        <div style={{ padding: '10px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0, flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="satoshi-14" style={{ lineHeight: '100%' }}>Subject :</span>
                                <span style={{ fontSize: '13px', fontWeight: 500, color: '#818181', lineHeight: '100%', wordBreak: 'break-word', whiteSpace: 'pre-wrap', maxWidth: '320px', display: 'inline-block' }}>{activeComment?.subject || '—'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="satoshi-14" style={{ lineHeight: '100%' }}>Component :</span>
                                <span style={{ fontSize: '13px', fontWeight: 500, color: '#818181', lineHeight: '100%', wordBreak: 'break-word', whiteSpace: 'pre-wrap', maxWidth: '220px', display: 'inline-block' }}>{activeComment?.component_name || activeComment?.component || 'Project'}</span>
                            </div>
                        </div>

                        {/* Comment list */}
                        <div style={{ padding: '16px', margin: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, background: '#FAFAFA', borderRadius: '8px' }}>
                            {/* Original comment */}
                            {activeComment && (
                                <div style={{ paddingTop: '12px', paddingBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid #E0E0E0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F2EBFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: '13px', color: '#8E77BB', flexShrink: 0 }}>
                                            {(activeComment.user_name || activeComment.user_id || '?').slice(0, 1).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '15px', fontWeight: 500, color: '#332849' }}>{activeComment.user_name || activeComment.user_id || 'Unknown'}</div>
                                            <div style={{ fontSize: '11px', color: '#818181' }}>{activeComment.created_at ? fmtFull(activeComment.created_at) : ''}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#515561' }}>{activeComment.comment || ''}</div>
                                    {Array.isArray(activeComment.replies) && activeComment.replies.length > 0 && (
                                        <div style={{ fontSize: '12px', fontWeight: 500, color: '#8E77BB' }}>
                                            {activeComment.replies.length} {activeComment.replies.length === 1 ? 'reply' : 'replies'}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Replies */}
                            {(activeComment?.replies || []).length === 0 ? (
                                <div style={{ fontSize: '13px', color: '#818181', textAlign: 'center', paddingTop: '8px' }}>No replies yet.</div>
                            ) : (
                                activeComment.replies.map((r, idx) => (
                                    <div key={r.id} style={{ paddingTop: '12px', paddingBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: idx < activeComment.replies.length - 1 ? '1px solid #E0E0E0' : 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F2EBFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: '13px', color: '#8E77BB', flexShrink: 0 }}>
                                                {(r.user_name || r.user_id || '?').slice(0, 1).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '15px', fontWeight: 500, color: '#332849' }}>{r.user_name || r.user_id || 'Unknown'}</div>
                                                <div style={{ fontSize: '11px', color: '#818181' }}>{r.created_at ? fmtFull(r.created_at) : ''}</div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#515561' }}>{r.comment || ''}</div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Reply input */}
                        <div style={{ padding: '12px 16px', borderTop: '1px solid #CCCCCC', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => { if (e.target.value.length <= 500) setReplyText(e.target.value); }}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && replyText.trim()) { e.preventDefault(); submitReply(); } }}
                                    placeholder="Add Reply"
                                    style={{ flex: 1, height: '44px', border: '1px solid #CCCCCC', borderRadius: '8px', padding: '0 16px', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
                                />
                                <button
                                    onClick={submitReply}
                                    disabled={isSubmitting || !replyText.trim()}
                                    style={{ height: '44px', width: '44px', borderRadius: '8px', background: '#8E77BB', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (isSubmitting || !replyText.trim()) ? 0.4 : 1, flexShrink: 0 }}
                                    title="Send"
                                >
                                    {isSubmitting
                                        ? <RefreshCw style={{ width: '16px', height: '16px', color: '#fff' }} />
                                        : <Send style={{ width: '16px', height: '16px', color: '#fff' }} />
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommentsTab;