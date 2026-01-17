import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Pin, Eye, Trash2, Plus, MessageSquare, X, MoreVertical } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';
import DataTable from '../../../../../components/DataTable';

const CommentsTab = ({ datasetId, projectId }) => {
    const { token, decodedToken } = useAuth();
    const hostnameAI = window._env_?.VITE_AI_API;

    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [refreshTick, setRefreshTick] = useState(0);

    // Top filters (UI like screenshot)
    const defaultFilters = useMemo(
        () => ({
            fromDate: '',
            toDate: '',
            sortBy: 'date', // 'date' | 'user' | 'subject' | 'component' | 'replies'
            q: '',
        }),
        []
    );
    const [filters, setFilters] = useState(defaultFilters);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // modals + forms
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [addForm, setAddForm] = useState({
        subject: '',
        type: '',
        pinned: 0,
        comment: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isRepliesOpen, setIsRepliesOpen] = useState(false);
    const [activeCommentId, setActiveCommentId] = useState(null); // <-- was activeComment object
    const [replyText, setReplyText] = useState('');

    const activeComment = useMemo(() => {
        if (!activeCommentId) return null;
        return (Array.isArray(comments) ? comments : []).find((c) => String(c?.id) === String(activeCommentId)) || null;
    }, [comments, activeCommentId]);

    const doRefresh = () => setRefreshTick((x) => x + 1);

    useEffect(() => {
        if (!datasetId) return;

        const fetchComments = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const url = `${hostnameAI}/canvas/comments/by-component?component=dataset&component_id=${encodeURIComponent(datasetId)}`;
                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });
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
    }, [datasetId, hostnameAI, token, refreshTick]);

    const fmt = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-GB');
    };

    const parseLocalDateRange = (fromDate, toDate) => {
        // fromDate/toDate are "YYYY-MM-DD" from <input type="date" />
        const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
        const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null;
        return { from, to };
    };

    const filteredSortedComments = useMemo(() => {
        const arr = Array.isArray(comments) ? [...comments] : [];

        // REMOVE: component filtering (component is always dataset here)
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
                const hay = [
                    c?.subject,
                    c?.comment,
                    c?.user_name,
                    c?.user_id,
                    c?.component,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                return hay.includes(q);
            });
        }

        out.sort((a, b) => {
            const ap = Number(a?.pinned || 0);
            const bp = Number(b?.pinned || 0);
            if (bp !== ap) return bp - ap;

            const s = filters.sortBy || 'date';
            if (s === 'replies') {
                const ar = Array.isArray(a?.replies) ? a.replies.length : 0;
                const br = Array.isArray(b?.replies) ? b.replies.length : 0;
                if (br !== ar) return br - ar; // more replies first
                // tie-breaker: newest first
                const at = new Date(a?.created_at || 0).getTime();
                const bt = new Date(b?.created_at || 0).getTime();
                return bt - at;
            }

            if (s === 'user') return (a?.user_name || a?.user_id || '').localeCompare(b?.user_name || b?.user_id || '');
            if (s === 'subject') return (a?.subject || '').localeCompare(b?.subject || '');
            if (s === 'component') return (a?.component || '').localeCompare(b?.component || '');

            const at = new Date(a?.created_at || 0).getTime();
            const bt = new Date(b?.created_at || 0).getTime();
            return bt - at; // date desc
        });

        return out;
    }, [comments, filters]);

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

    const canCallApis = Boolean(hostnameAI && token && decodedToken?.sub && datasetId && projectId);

    const submitAddComment = async () => {
        if (!canCallApis) {
            setError('Missing required context (token/user/dataset/project).');
            return;
        }
        if (!addForm.subject.trim() || !addForm.comment.trim()) {
            setError('Subject and Comment are required.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const payload = {
                user_id: decodedToken.sub,
                subject: addForm.subject.trim(),
                component: 'Dataset',
                component_id: datasetId,
                pinned: Number(addForm.pinned) ? 1 : 0,
                comment: addForm.comment.trim(),
                project_id: projectId,
                type: addForm.type?.trim() || 'general',
            };

            const res = await fetch(`${hostnameAI}/canvas/add_comment`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
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
            setError('Missing required context (token/user/dataset/project).');
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
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Failed to add reply');

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
            component: c.component || 'dataset',
            subject: c.subject || 'No subject',
            comment: c.comment || '',
            post_date: c.created_at || '',
            last_date: c.updated_at || c.created_at || '',
            repliesCount: Array.isArray(c.replies) ? c.replies.length : 0,
            replies: Array.isArray(c.replies) ? c.replies : [],
            __raw: c,
        }));
    }, [filteredSortedComments]);

    const columns = useMemo(
        () => [
            { key: 'user_name', label: 'User Name', sortable: true, width: '160px' },
            { key: 'component', label: 'Component', sortable: true, width: '180px' },
            {
                key: 'subject',
                label: 'Subject',
                sortable: true,
                width: '240px',
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
                render: (row) => (
                    <span className="text-gray-700 line-clamp-2 block" title={row.comment}>
                        {row.comment}
                    </span>
                ),
            },
            {
                key: 'post_date',
                label: 'Post Date',
                sortable: true,
                width: '130px',
                render: (row) => fmt(row.post_date),
            },
            {
                key: 'last_date',
                label: 'Last Date',
                sortable: true,
                width: '130px',
                render: (row) => fmt(row.last_date),
            },
            {
                key: 'repliesCount',
                label: '',
                sortable: true,
                width: '130px',
                render: (row) => (
                    <button
                        type="button"
                        onClick={() => openReplies(row.__raw)}
                        className="inline-flex items-center gap-2 px-2.5 py-1 border border-gray-200 rounded-lg text-xs hover:bg-gray-50"
                        title="View replies"
                    >
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        {String(row.repliesCount).padStart(2, '0')} Replies
                    </button>
                ),
            },
        ],
        []
    );

    const actions = useMemo(
        () => [
            {
                label: 'View',
                icon: <Eye className="w-4 h-4" />,
                onClick: (row) => openReplies(row.__raw),
                tooltip: 'View',
            },
            {
                label: 'Pin',
                icon: <Pin className="w-4 h-4" />,
                onClick: (row) => console.log('Pin/unpin:', row.__raw),
                tooltip: 'Pin/Unpin',
            },
            {
                label: 'Delete',
                icon: <Trash2 className="w-4 h-4" />,
                onClick: (row) => console.log('Delete comment:', row.__raw),
                tooltip: 'Delete',
            },
        ],
        []
    );

    if (!datasetId) {
        return (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-center py-12 text-gray-500">Select a dataset to view comments.</div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            {/* Top bar (like screenshot) */}
            <div className="flex flex-col gap-3 mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">Comments</h2>
                        <p className="text-xs text-gray-500">Dataset discussions and replies</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={openAdd}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-[#8e78b7] text-white hover:opacity-90 disabled:opacity-50"
                            title="Add Comment"
                            disabled={!projectId || isLoading}
                        >
                            <Plus className="w-4 h-4" />
                            Comment
                        </button>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsMenuOpen((v) => !v)}
                                className="inline-flex items-center justify-center w-9 h-9 border border-gray-300 rounded-lg hover:bg-gray-50"
                                title="More"
                            >
                                <MoreVertical className="w-4 h-4 text-gray-700" />
                            </button>

                            {isMenuOpen && (
                                <div
                                    className="absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-lg z-10"
                                    onMouseLeave={() => setIsMenuOpen(false)}
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            doRefresh();
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                                        disabled={isLoading}
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                        Refresh
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            setFilters(defaultFilters);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Reset filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[140px]">
                        <label className="block text-xs text-gray-600 mb-1">From Date</label>
                        <input
                            type="date"
                            value={filters.fromDate}
                            onChange={(e) => setFilters((s) => ({ ...s, fromDate: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="min-w-[140px]">
                        <label className="block text-xs text-gray-600 mb-1">To Date</label>
                        <input
                            type="date"
                            value={filters.toDate}
                            onChange={(e) => setFilters((s) => ({ ...s, toDate: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="min-w-[160px]">
                        <label className="block text-xs text-gray-600 mb-1">Sort by</label>
                        <select
                            value={filters.sortBy}
                            onChange={(e) => setFilters((s) => ({ ...s, sortBy: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                        >
                            <option value="date">Date</option>
                            <option value="user">User</option>
                            <option value="subject">Subject</option>
                            <option value="component">Component</option>
                            <option value="replies">Replies</option>
                        </select>
                    </div>

                    <div className="flex-1 min-w-[220px]">
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
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
                    {error}
                </div>
            )}

            <div className=" text-xs text-gray-500">
                Pinned comments will be at top.
            </div>

            <DataTable
                columns={columns}
                data={tableRows}
                actions={actions}
                isLoading={isLoading}
                isError={!!error}
                refetch={doRefresh}
                resetSortTrigger={refreshTick}
            />

            {/* Add Comment Modal */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-2xl rounded-xl bg-white border border-gray-200 shadow-lg">
                        <div className="flex items-center justify-between px-5 py-4 border-b">
                            <div>
                                <div className="text-base font-semibold text-gray-900">Add Comment</div>
                                <div className="text-xs text-gray-500">Dataset: {datasetId}</div>
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
                                        onChange={(e) => setAddForm((s) => ({ ...s, subject: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        placeholder="Project status"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Type</label>
                                    <input
                                        value={addForm.type}
                                        onChange={(e) => setAddForm((s) => ({ ...s, type: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        placeholder="data processing"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    id="pinned"
                                    type="checkbox"
                                    checked={Number(addForm.pinned) === 1}
                                    onChange={(e) => setAddForm((s) => ({ ...s, pinned: e.target.checked ? 1 : 0 }))}
                                />
                                <label htmlFor="pinned" className="text-sm text-gray-700">
                                    Pinned
                                </label>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Comment</label>
                                <textarea
                                    value={addForm.comment}
                                    onChange={(e) => setAddForm((s) => ({ ...s, comment: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[120px]"
                                    placeholder="data is working fine"
                                />
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

            {/* Replies Modal */}
            {isRepliesOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-3xl rounded-xl bg-white border border-gray-200 shadow-lg">
                        <div className="flex items-start justify-between px-5 py-4 border-b">
                            <div className="min-w-0">
                                <div className="text-base font-semibold text-gray-900 truncate">
                                    {activeComment?.subject || 'Comment'}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                    By <span className="font-medium">{activeComment?.user_name || activeComment?.user_id || 'Unknown'}</span>
                                    {activeComment?.created_at ? <> • {fmt(activeComment.created_at)}</> : null}
                                </div>
                            </div>
                            <button className="p-2 hover:bg-gray-50 rounded-lg" onClick={closeReplies} title="Close">
                                <X className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                <div className="text-sm text-gray-800 whitespace-pre-wrap">{activeComment?.comment || ''}</div>
                            </div>

                            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                                {(activeComment?.replies || []).length === 0 ? (
                                    <div className="text-sm text-gray-500">No replies yet.</div>
                                ) : (
                                    activeComment.replies.map((r) => (
                                        <div key={r.id} className="rounded-lg border border-gray-200 p-3">
                                            <div className="text-xs text-gray-500">
                                                Reply by <span className="font-medium">{r.user_name || r.user_id || 'Unknown'}</span>
                                                {r.created_at ? <> • {fmt(r.created_at)}</> : null}
                                            </div>
                                            <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{r.comment || ''}</div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="border-t pt-4">
                                <label className="block text-xs text-gray-600 mb-1">Add Reply</label>
                                <div className="flex gap-2">
                                    <input
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        placeholder="Write a reply..."
                                    />
                                    <button
                                        className="px-3 py-2 text-sm rounded-lg bg-[#8e78b7] text-white hover:opacity-90 disabled:opacity-50"
                                        onClick={submitReply}
                                        disabled={isSubmitting || !replyText.trim()}
                                    >
                                        {isSubmitting ? 'Sending...' : 'Reply'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 px-5 py-4 border-t">
                            <button
                                className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
                                onClick={closeReplies}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommentsTab;