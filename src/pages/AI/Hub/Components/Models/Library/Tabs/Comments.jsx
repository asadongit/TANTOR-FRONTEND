import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Pin, Eye, Trash2, Plus, MessageSquare, X, MoreVertical, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../../../../context/AuthContext';
import DataTable from '../../../../../../../components/DataTable';
import { aithemestyle } from '../../../../../../../components/themeContext';

const Comments = (modelData) => {
    const { token, decodedToken } = useAuth();
    const hostnameAI = window._env_?.VITE_AI_API;

    const modelId = modelData?.modelData?.id;
    const projectId = modelData?.modelData?.project_id;

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
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        if (!modelId) return;

        const fetchComments = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const url = `${hostnameAI}/canvas/comments/by-component?component=model&component_id=${encodeURIComponent(modelId)}`;
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
    }, [modelId, hostnameAI, token, refreshTick]);

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

    const openAdd = () => {
        setAddForm({ subject: '', type: '', pinned: 0, comment: '' });
        setIsAddOpen(true);
    };

    const closeAdd = () => {
        setIsAddOpen(false);
        setAddForm({ subject: '', type: '', pinned: 0, comment: '' });
    };

    const canCallApis = Boolean(hostnameAI && token && decodedToken?.sub && modelId && projectId);

    const wordCount = (str) => {
        if (!str || !str.trim()) return 0;
        return str.trim().split(/\s+/).filter(Boolean).length;
    };

    const trimToWords = (str, maxWords) => {
        if (!str) return '';
        const words = str.trim().split(/\s+/).filter(Boolean);
        return words.slice(0, maxWords).join(' ');
    };

    const submitAddComment = async () => {
        if (!canCallApis) {
            setError('Missing required context (token/user/model/project).');
            return;
        }
        if (!addForm.subject.trim() || !addForm.comment.trim()) {
            setError('Subject and Comment are required.');
            return;
        }
        if (wordCount(addForm.subject) > 120) {
            setError('Subject cannot exceed 120 words.');
            return;
        }
        if (wordCount(addForm.comment) > 500) {
            setError('Comment cannot exceed 500 words.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const payload = {
                user_id: decodedToken.sub,
                subject: addForm.subject.trim(),
                component: 'Model',
                component_id: modelId,
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

            closeAdd();
            setRefreshTick((x) => x + 1);
        } catch (e) {
            setError(e?.message || 'Failed to add comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitReply = async () => {
        if (!canCallApis) {
            setError('Missing required context (token/user/model/project).');
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

            setReplyText('');
            toast.success('Reply added successfully!');
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
            component: c.component || 'model',
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
                    <span
                        className="text-xs font-medium"
                        style={{ color: aithemestyle.iconColor }}
                    >
                        {String(row.repliesCount).padStart(2, '0')} Replies
                    </span>
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

    if (!modelId) {
        return (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-center py-12 text-gray-500">Model not found.</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl">
            <div className="flex flex-col gap-3 mb-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[140px]">
                        <label className="block text-xs text-gray-600 mb-1">From Date</label>
                        <input
                            type="date"
                            value={filters.fromDate}
                            onChange={(e) => setFilters((s) => ({ ...s, fromDate: e.target.value }))}
                            max={today}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="min-w-[140px]">
                        <label className="block text-xs text-gray-600 mb-1">To Date</label>
                        <input
                            type="date"
                            value={filters.toDate}
                            onChange={(e) => setFilters((s) => ({ ...s, toDate: e.target.value }))}
                            max={today}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="w-1/2 max-w-[270px]">
                        <label className="block text-xs text-gray-600 mb-1">&nbsp;</label>
                        <div className="relative">
                            <input
                                value={filters.q}
                                onChange={(e) => setFilters((s) => ({ ...s, q: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg pl-3 pr-3 py-2 text-sm"
                                placeholder="Search Comments"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600 mb-1">&nbsp;</label>
                        <button
                            onClick={() => setShowOnlyPinned(!showOnlyPinned)}
                            className={`inline-flex items-center justify-center w-10 h-10 border rounded-lg ${
                                showOnlyPinned ? 'bg-[#8e78b7] text-white border-[#8e78b7]' : 'border-gray-300 hover:bg-gray-50'
                            }`}
                            title={showOnlyPinned ? 'Stop highlighting pinned comments' : 'Highlight pinned comments'}
                        >
                            <Pin className="w-4 h-4" />
                        </button>
                    </div>
                </div>
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
                                <div className="text-xs text-gray-500">Model: {modelId}</div>
                            </div>
                            <button className="p-2 hover:bg-gray-50 rounded-lg" onClick={closeAdd} title="Close">
                                <X className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Subject</label>
                                    <input
                                        value={addForm.subject}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (wordCount(value) <= 120) {
                                                setAddForm((s) => ({ ...s, subject: value }));
                                            } else {
                                                setAddForm((s) => ({ ...s, subject: trimToWords(value, 120) }));
                                            }
                                        }}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        placeholder="Model status"
                                    />
                                    <div className="text-xs text-gray-400 text-right">{wordCount(addForm.subject)}/120 words</div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Type</label>
                                    <input
                                        value={addForm.type}
                                        onChange={(e) => setAddForm((s) => ({ ...s, type: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        placeholder="general"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    id="pinned_model"
                                    type="checkbox"
                                    checked={Number(addForm.pinned) === 1}
                                    onChange={(e) => setAddForm((s) => ({ ...s, pinned: e.target.checked ? 1 : 0 }))}
                                />
                                <label htmlFor="pinned_model" className="text-sm text-gray-700">
                                    Pinned
                                </label>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Comment</label>
                                <textarea
                                    value={addForm.comment}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (wordCount(value) <= 500) {
                                            setAddForm((s) => ({ ...s, comment: value }));
                                        } else {
                                            setAddForm((s) => ({ ...s, comment: trimToWords(value, 500) }));
                                        }
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[120px]"
                                    placeholder="Write your comment..."
                                />
                                <div className="text-xs text-gray-400 text-right">{wordCount(addForm.comment)}/500 words</div>
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
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isRepliesOpen && (
                <div className="fixed inset-0 z-50 flex bg-black/30" onClick={closeReplies}>
                    <div className="ml-auto w-full max-w-4xl h-full bg-white shadow-2xl border-l border-gray-200 flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between px-6 py-4 border-b">
                            <div className="space-y-1">
                                <div className="text-sm text-gray-900 font-semibold flex items-center gap-2 flex-wrap">
                                    <span>Model Comments</span>
                                    <span className="text-gray-400">• {Array.isArray(activeComment?.replies) ? String(activeComment.replies.length).padStart(2, '0') : '00'} Total Replies</span>
                                </div>
                            </div>
                            <button className="p-2 hover:bg-gray-50 rounded-lg" onClick={closeReplies} title="Close">
                                <X className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>

                        <div className="px-6 py-3 border-b flex items-center gap-6 text-sm text-gray-700">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900">Subject :</span>
                                <span>{activeComment?.subject || 'Comment'}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900">Component :</span>
                                <span>{activeComment?.component_name || 'Model'}</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#8e78b7]/15 text-[#8e78b7] font-semibold flex items-center justify-center text-sm">
                                        {(activeComment?.user_name || activeComment?.user_id || '?').slice(0, 1).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900">{activeComment?.user_name || activeComment?.user_id || 'Unknown'}</div>
                                                {activeComment?.created_at ? (
                                                    <div className="text-xs text-gray-500">{fmt(activeComment.created_at)}</div>
                                                ) : null}
                                            </div>
                                        </div>
                                        <div className="mt-3 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                            {activeComment?.comment || ''}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-[#8e78b7] font-semibold cursor-pointer">{Array.isArray(activeComment?.replies) ? `${activeComment.replies.length} replies` : 'Replies'}</div>
                            </div>

                            <div className="space-y-5">
                                {(activeComment?.replies || []).length === 0 ? (
                                    <div className="text-sm text-gray-500">No replies yet.</div>
                                ) : (
                                    activeComment.replies.map((r) => (
                                        <div key={r.id} className="border-b pb-4 last:border-b-0 bg-gray-50 rounded-lg p-3">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-semibold flex items-center justify-center text-xs">
                                                    {(r.user_name || r.user_id || '?').slice(0, 1).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div>
                                                            <div className="text-sm font-semibold text-gray-900">{r.user_name || r.user_id || 'Unknown'}</div>
                                                            {r.created_at ? (
                                                                <div className="text-xs text-gray-500">{fmt(r.created_at)}</div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{r.comment || ''}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="border-t px-6 py-4 bg-white">
                            <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value.length <= 500) {
                                                setReplyText(value);
                                            } else {
                                                setReplyText(value.substring(0, 500));
                                            }
                                        }}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-vertical min-h-[40px] max-h-[120px]"
                                        placeholder="Add Reply"
                                        rows={1}
                                        style={{ overflow: 'hidden' }}
                                        onInput={(e) => {
                                            e.target.style.height = 'auto';
                                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                        }}
                                    />
                                    <div className="text-xs text-gray-400 text-right mt-1">{replyText.length}/500 characters</div>
                                </div>
                                <button
                                    className="px-3 py-2 text-sm rounded-lg bg-[#8e78b7] text-white hover:opacity-90 disabled:opacity-50 h-fit"
                                    onClick={submitReply}
                                    disabled={isSubmitting || !replyText.trim()}
                                    title="Send"
                                >
                                    {isSubmitting ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Comments;