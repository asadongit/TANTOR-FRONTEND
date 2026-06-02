import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiActivity,
    FiBox,
    FiLayers,
    FiCheckCircle,
    FiClock,
    FiZap,
    FiTrendingUp,
    FiTarget,
    FiBarChart,
    FiArrowUpRight,
    FiExternalLink,
    FiMessageSquare,
    FiPlay,
    FiUser,
    FiTag
} from 'react-icons/fi';
import { getDashboardStats, getWorkflow } from '../../../api/agentmesh';
import bannerImage from '../../../assets/data/Stack-p-2000.png';
import PropTypes from 'prop-types';
import { useUIStore, useWorkflowStore, useRunStore } from '../../../store';

// Glassmorphism constants
const glassStyles = {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
};

const cardStyles = {
    borderRadius: '24px',
    padding: '24px',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};


export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const setActivePage = useUIStore(s => s.setActivePage);
    const setRunOpen = useUIStore(s => s.setRunOpen);
    const setTargetNodeId = useUIStore(s => s.setTargetNodeId);
    const setInitialRunInput = useUIStore(s => s.setInitialRunInput);
    const loadWorkflowIntoEditor = useWorkflowStore(s => s.loadWorkflowIntoEditor);
    const startRun = useRunStore(s => s.startRun);
    const resetRunStore = useRunStore(s => s.reset);

    const handleOpenChat = async (wfId, threadId) => {
        try {
            setLoading(true);
            const res = await getWorkflow(wfId);
            if (res && res.id) {
                loadWorkflowIntoEditor(res);
                // Set the threadId and clear previous events to trigger history loading in RunPanel
                useRunStore.setState({ 
                    threadId: threadId, 
                    streamEvents: [], 
                    running: false,
                    runOutput: null,
                    runError: null
                });
                setRunOpen(true);
            }
        } catch (err) {
            console.error("Failed to open chat:", err);
            alert("Could not open chat session.");
        } finally {
            setLoading(false);
        }
    };

    const handleLaunchAgent = async (wfId) => {
        try {
            setLoading(true);
            const res = await getWorkflow(wfId);
            if (res && res.id) {
                loadWorkflowIntoEditor(res);
                resetRunStore();
                setRunOpen(true);
            }
        } catch (err) {
            console.error("Failed to launch agent:", err);
            alert("Could not launch agent.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const res = await getDashboardStats();
                if (res.status === 'success') {
                    setStats(res.data);
                } else {
                    setError('Failed to load dashboard data');
                }
            } catch (err) {
                setError(err.message || 'An error occurred');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();

        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []);


    if (loading && !stats) {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-canvas)' }}>
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="loading-spinner"
                    style={{ width: 60, height: 60, borderWidth: 4, borderColor: 'var(--theme-primary)', borderTopColor: 'transparent' }}
                />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-canvas)', color: 'var(--red)' }}>
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                    <FiActivity size={64} style={{ marginBottom: 24, opacity: 0.2 }} />
                </motion.div>
                <h2 style={{ fontWeight: 700, fontSize: '24px', letterSpacing: '-0.02em' }}>Analytics Offline</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: 8, maxWidth: '300px', textAlign: 'center' }}>{error}</p>
                <button onClick={() => window.location.reload()} className="btn-primary" style={{ marginTop: 32, padding: '12px 32px', borderRadius: '12px' }}>Retry Connection</button>
            </div>
        );
    }

    const {
        total_workflows,
        active_workflows,
        inactive_workflows,
        total_tools,
        workflows_per_category,
        agents_per_category,
        executions_per_hr,
        sla_compliance,
        recent_workflows
    } = stats;



    return (
        <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
            padding: '40px',
            position: 'relative',
            boxSizing: 'border-box'
        }}>
            {/* Decorative background blobs */}
            <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(142, 119, 187, 0.1) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'absolute', bottom: '10%', left: '-50px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(52, 199, 89, 0.05) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none', zIndex: 0 }} />

            {/* Hero Dashboard Banner */}
            <div style={{
                position: 'relative',
                width: '100%',
                background: 'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)',
                borderRadius: '32px',
                padding: '48px 60px',
                marginBottom: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '60px',
                overflow: 'hidden',
                boxShadow: '0 24px 70px -12px rgba(30, 27, 75, 0.35)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                {/* Visual Decorative Layer */}
                <img
                    src={bannerImage}
                    alt="Network Mesh"
                    style={{
                        position: 'absolute',
                        right: '-10%',
                        top: '-10%',
                        width: '80%',
                        height: '140%',
                        objectFit: 'cover',
                        opacity: 0.1,
                        pointerEvents: 'none',
                        filter: 'hue-rotate(240deg) saturate(2) brightness(1.2)',
                    }}
                />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at 10% 20%, rgba(142, 119, 187, 0.15) 0%, transparent 60%)',
                    pointerEvents: 'none'
                }} />

                {/* Left Side: Inspiration Content */}
                <div style={{ flex: 1, position: 'relative', zIndex: 2 }}>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 style={{
                            fontSize: '48px',
                            fontWeight: 900,
                            color: 'white',
                            lineHeight: 1.1,
                            marginBottom: '16px',
                            letterSpacing: '-0.04em'
                        }}>
                            Operational<br />Intelligence Hub
                        </h1>
                        <p style={{
                            fontSize: '18px',
                            color: 'rgba(255,255,255,0.6)',
                            fontWeight: 500,
                            lineHeight: 1.6,
                            maxWidth: '440px'
                        }}>
                            Monitor metrics, orchestrate hybrid agent meshes, and track real-time pipeline performance.
                        </p>
                    </motion.div>
                </div>

                {/* Right Side: Integrated Grid Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '20px',
                    position: 'relative',
                    zIndex: 2,
                    width: '520px'
                }}>
                    <StatCard
                        icon={<FiLayers size={20} />}
                        label="Total Workflows"
                        value={total_workflows}
                        sublabel="AI Service Pipelines"
                        theme="glass"
                        index={0}
                    />
                    <StatCard
                        icon={<FiCheckCircle size={20} />}
                        label="Active"
                        value={active_workflows}
                        sublabel="Currently Running"
                        theme="glass_green"
                        index={1}
                    />
                    <StatCard
                        icon={<FiBox size={20} />}
                        label="Total Tools"
                        value={total_tools}
                        sublabel="Local + MCP Registry"
                        theme="glass"
                        index={2}
                    />
                    <StatCard
                        icon={<FiTarget size={20} />}
                        label="SLA Compliance"
                        value={`${sla_compliance}%`}
                        sublabel="Success Threshold"
                        theme="glass_blue"
                        index={3}
                    />
                </div>
            </div>


            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '32px',
                position: 'relative'
            }}>
                {/* Recent Activity */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    style={{
                        ...glassStyles,
                        borderRadius: 32,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            Recent Activity
                        </h3>
                    </div>

                    <div style={{ flex: 1, overflowX: 'auto', padding: '16px' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', minWidth: '400px' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '8px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Agent Name</th>
                                    <th style={{ padding: '8px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Group</th>
                                    <th style={{ padding: '8px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Category</th>
                                    <th style={{ padding: '8px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Execution</th>
                                    <th style={{ padding: '8px 24px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                    <th style={{ padding: '8px 24px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent_workflows.length > 0 ? recent_workflows.map((wf) => {
                                    const isError = wf.status === 'error' || wf.status === 'failed';
                                    const isRunning = wf.status === 'running' || wf.status === 'in_progress';
                                    
                                    return (
                                        <tr 
                                            key={`${wf.id}-${wf.thread_id}`} 
                                            className="hover-row"
                                            onClick={() => handleOpenChat(wf.id, wf.thread_id)}
                                        >
                                            <td style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.4)', borderRadius: '16px 0 0 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start' }}>
                                                    <div style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '10px',
                                                        background: 'var(--theme-primary-glow)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'var(--theme-primary)',
                                                        border: '1px solid var(--border-light)'
                                                    }}>
                                                        <FiUser size={18} />
                                                    </div>
                                                    <div style={{ textAlign: 'left' }}>
                                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>{wf.name}</div>
                                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'Roboto Mono', marginTop: '2px' }}>{wf.id.split('-')[0]}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>
                                                {wf.group || 'Default'}
                                            </td>
                                            <td style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>
                                                {wf.category || 'General'}
                                            </td>
                                            <td style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.4)', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span>{new Date(wf.last_run).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                                    <span style={{ fontSize: '10px', opacity: 0.6 }}>{new Date(wf.last_run).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                                                <span style={{
                                                    fontSize: '11px',
                                                    color: isError ? '#ef4d5f' : (isRunning ? '#F59E0B' : '#098c60'),
                                                    fontWeight: 800,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    justifyContent: 'center'
                                                }}>
                                                    <div style={{ 
                                                        width: 6, height: 6, borderRadius: '50%', 
                                                        background: isError ? '#ef4d5f' : (isRunning ? '#F59E0B' : '#098c60') 
                                                    }} />
                                                    {isError ? 'FAILED' : (isRunning ? 'RUNNING' : 'COMPLETED')}
                                                </span>
                                            </td>
                                            <td style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.4)', textAlign: 'center', borderRadius: '0 16px 16px 0' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleOpenChat(wf.id, wf.thread_id); }}
                                                    style={{
                                                        background: 'var(--theme-primary-glow)',
                                                        color: 'var(--theme-primary)',
                                                        border: '1px solid var(--theme-primary-glow)',
                                                        padding: '8px 18px',
                                                        borderRadius: '10px',
                                                        fontSize: '11px',
                                                        fontWeight: 800,
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        boxShadow: '0 2px 4px rgba(142, 119, 187, 0.05)'
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.background = 'var(--theme-primary)';
                                                        e.currentTarget.style.color = 'white';
                                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(142, 119, 187, 0.2)';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.background = 'var(--theme-primary-glow)';
                                                        e.currentTarget.style.color = 'var(--theme-primary)';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(142, 119, 187, 0.05)';
                                                    }}
                                                >
                                                    <FiPlay size={12} fill="currentColor" /> Launch session
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="3" style={{ padding: '100px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            <FiBarChart size={48} style={{ marginBottom: 16, opacity: 0.1 }} />
                                            <div style={{ fontWeight: 600 }}>No recent pipeline activity.</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.section>

                {/* Categories breakdown */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    style={{
                        ...glassStyles,
                        borderRadius: 32,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            Category Distribution
                        </h3>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                        {Object.keys(workflows_per_category).length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {Object.entries(workflows_per_category).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                                    const percentage = (count / total_workflows) * 100;
                                    const agentCount = agents_per_category[cat] || 0;
                                    return (
                                        <div key={cat}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>{cat}</span>
                                                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--theme-primary)', background: 'var(--node-purple)', padding: '2px 8px', borderRadius: '6px' }}>
                                                        {agentCount} {agentCount === 1 ? 'AGENT' : 'AGENTS'}
                                                    </span>
                                                </div>
                                                <span style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '14px' }}>{count}</span>
                                            </div>
                                            <div style={{ height: '10px', background: 'rgba(0,0,0,0.05)', borderRadius: '20px', overflow: 'hidden' }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    transition={{ duration: 1.5, ease: "circOut" }}
                                                    style={{
                                                        height: '100%',
                                                        background: `linear-gradient(90deg, var(--theme-primary) 0%, var(--theme-primary-light) 100%)`,
                                                        borderRadius: '20px',
                                                        boxShadow: '0 0 12px rgba(142, 119, 187, 0.2)'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No classification data available.</div>
                        )}
                    </div>
                </motion.section>
            </div>

            <style>{`
        .hover-row { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-row:hover td { background: rgba(255,255,255,0.7) !important; cursor: pointer; }
        .quick-action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15) !important;
            border-color: var(--theme-primary) !important;
            color: var(--theme-primary) !important;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
      `}</style>
        </div>
    );
}

function SectionCard({ icon, title, children, index }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (index * 0.1) }}
            style={{
                ...glassStyles,
                ...cardStyles,
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: 'var(--theme-primary)', background: 'var(--node-purple)', padding: '10px', borderRadius: '14px', display: 'flex', alignItems: 'center' }}>
                        {React.cloneElement(icon, { size: 20 })}
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{title}</h3>
                </div>
                <FiExternalLink style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {children}
            </div>
        </motion.section>
    );
}

SectionCard.propTypes = {
    icon: PropTypes.node.isRequired,
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    index: PropTypes.number.isRequired,
};

function StatCard({ icon, label, value, sublabel, theme, index }) {
    const isGlass = theme.startsWith('glass');
    const colorMap = {
        glass: 'rgba(255,255,255,1)',
        glass_green: '#10B981',
        glass_blue: '#3B82F6',
        purple: 'var(--theme-primary)',
        green_tint: 'var(--green)',
        orange: '#F59E0B',
        blue: '#2563EB'
    };

    const activeColor = colorMap[theme] || colorMap.glass;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (index * 0.1), duration: 0.5 }}
            whileHover={{ y: -5, background: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.3)' }}
            style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '24px',
                padding: '24px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '130px'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                    width: 36, height: 36, borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: activeColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${activeColor}33`
                }}>
                    {icon}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {label}
                </div>
            </div>

            <div>
                <div style={{
                    fontSize: typeof value === 'string' && value.length > 8 ? '22px' : '28px',
                    fontWeight: 900,
                    color: 'white',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    marginBottom: '4px'
                }}>
                    {value}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                    {sublabel}
                </div>
            </div>
        </motion.div>
    );
}

StatCard.propTypes = {
    icon: PropTypes.node.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    sublabel: PropTypes.string,
    theme: PropTypes.string,
    index: PropTypes.number.isRequired,
};
