import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { FiSearch, FiUsers, FiLoader, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { getObservabilitySessions } from '../../../../api/agentmesh';
import {
  fmtNumber, fmtUsd, fmtTime,
  gridTemplate, gridMinWidth, HeaderRow, PaginationBar
} from './observabilityShared';

const USER_COLUMNS = [
  { key: 'userId', label: 'User ID', w: '1fr', hint: 'Unique user identifier attributed to traces and sessions.', render: (u) => (
    <span style={{ fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
      {u.userId || '(anonymous / default)'}
    </span>
  ) },
  { key: 'sessionCount', label: 'Sessions', w: 100, align: 'center', hint: 'Number of distinct active sessions attributed to this user.', render: (u) => (
    <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', textAlign: 'center', display: 'block' }}>{u.sessionCount}</span>
  ) },
  { key: 'traceCount', label: 'Traces', w: 100, align: 'center', hint: 'Total workflow traces executed by this user.', render: (u) => (
    <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', textAlign: 'center', display: 'block' }}>{u.traceCount}</span>
  ) },
  { key: 'totalTokens', label: 'Tokens', w: 110, align: 'center', hint: 'Total LLM tokens consumed across all user traces.', render: (u) => (
    <span style={{ color: '#475569', textAlign: 'center', display: 'block' }}>{fmtNumber(u.totalTokens)}</span>
  ) },
  { key: 'totalCost', label: 'Total Cost', w: 110, align: 'center', hint: 'Estimated LLM spend for this user.', render: (u) => (
    <span style={{ color: '#475569', textAlign: 'center', display: 'block' }}>{fmtUsd(u.totalCost)}</span>
  ) },
  { key: 'lastActivity', label: 'Last Active', w: 160, hint: 'Timestamp of the user’s most recent activity.', render: (u) => (
    <span style={{ color: '#475569' }}>{fmtTime(u.lastActivity)}</span>
  ) },
];

const USER_MINWIDTH = gridMinWidth(USER_COLUMNS);

export default function UsersTab({ range, onSelectUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const fetchUsers = useCallback(async () => {
    setRefreshing(true);
    try {
      // Fetch sessions to aggregate user-level metrics
      const res = await getObservabilitySessions({
        fromTimestamp: range.fromTimestamp,
        toTimestamp: range.toTimestamp,
        limit: 200,
      });

      const sessionList = res.data || [];
      const userMap = {};

      sessionList.forEach((s) => {
        const uid = s.userId || '(anonymous / default)';
        if (!userMap[uid]) {
          userMap[uid] = {
            userId: uid,
            sessionCount: 0,
            traceCount: 0,
            totalTokens: 0,
            totalCost: 0,
            lastActivity: s.lastActivity || s.startTime,
          };
        }

        userMap[uid].sessionCount += 1;
        userMap[uid].traceCount += s.traceCount || 1;
        userMap[uid].totalTokens += s.totalTokens || 0;
        userMap[uid].totalCost += s.totalCost || 0;

        if (s.lastActivity && new Date(s.lastActivity) > new Date(userMap[uid].lastActivity)) {
          userMap[uid].lastActivity = s.lastActivity;
        }
      });

      const aggregatedUsers = Object.values(userMap).sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
      setUsers(aggregatedUsers);
      setError(null);
    } catch (e) {
      setError(e.message || 'Failed to load user analytics');
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    setLoading(true);
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((u) => {
    if (!searchInput) return true;
    return (u.userId || '').toLowerCase().includes(searchInput.toLowerCase());
  });

  const totalPages = Math.ceil(filteredUsers.length / limit);
  const paginatedUsers = filteredUsers.slice((page - 1) * limit, page * limit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', minHeight: 0 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
              placeholder="Search users by ID…"
              style={{
                width: 280, padding: '8px 12px 8px 36px', background: '#FFFFFF',
                border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 13.5,
                color: '#111827', outline: 'none', fontFamily: 'inherit'
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={fetchUsers}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
              border: '1px solid #E5E7EB', borderRadius: 10, background: '#FFFFFF',
              color: '#111827', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s ease'
            }}
          >
            <FiRefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none', color: '#8E77BB' }} />
            Refresh
          </button>
          <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 600 }}>
            {filteredUsers.length} user{filteredUsers.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECDD3', borderRadius: 12,
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
          color: '#BE123C', fontSize: 13, fontWeight: 500
        }}>
          <FiAlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Users table */}
      <div style={{ flex: 1, minHeight: 0, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, minHeight: 0, overflowX: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ minWidth: USER_MINWIDTH, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <HeaderRow columns={USER_COLUMNS} />

            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 48, color: '#64748B', fontSize: 13 }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'flex' }}
              >
                <FiLoader size={20} />
              </motion.div>
              Loading user analytics…
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', color: '#64748B', fontSize: 13.5 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F1F5F9', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <FiUsers size={26} />
              </div>
              <div style={{ maxWidth: 460, color: '#475569', fontWeight: 500, lineHeight: 1.5 }}>
                {searchInput ? 'No users match your search query.' : 'No users found in this period. User activity appears when workflows run with user ID metadata.'}
              </div>
            </div>
          ) : (
            paginatedUsers.map((u) => (
              <div
                key={u.userId}
                onClick={() => onSelectUser && onSelectUser(u.userId)}
                title="Click to view sessions for this user"
                style={{
                  display: 'grid', gridTemplateColumns: gridTemplate(USER_COLUMNS), minWidth: USER_MINWIDTH,
                  alignItems: 'center', gap: 10, padding: '12px 16px', cursor: 'pointer',
                  borderBottom: '1px solid #F1F5F9', background: '#FFFFFF',
                  fontSize: 12.5, transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
              >
                {USER_COLUMNS.map((c, i) => (
                  <span key={c.key || i} style={{ minWidth: 0 }}>{c.render(u)}</span>
                ))}
              </div>
            ))
          )}
            </div>
          </div>
        </div>

        {!loading && paginatedUsers.length > 0 && (
          <PaginationBar
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(p - 1, 1))}
            onNext={() => setPage((p) => Math.min(p + 1, totalPages))}
            limit={limit}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
            rangeText={`${filteredUsers.length} user${filteredUsers.length === 1 ? '' : 's'}`}
          />
        )}
      </div>
    </div>
  );
}

UsersTab.propTypes = {
  range: PropTypes.shape({
    fromTimestamp: PropTypes.string.isRequired,
    toTimestamp: PropTypes.string.isRequired,
  }).isRequired,
  onSelectUser: PropTypes.func,
};
