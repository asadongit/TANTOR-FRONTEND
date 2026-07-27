import React, { useEffect, useState } from 'react';
import { listTools, syncMCPTools, listMCPServers, deleteMCPServer, listToolPackages } from '../../../api/agentmesh';
import { useUIStore, useWorkflowStore } from '../../../store';
import Pagination from '../../Common/Pagination';
import {
  FiTool, FiServer, FiTrash, FiSearch, FiCode, FiTerminal,
  FiGlobe, FiDatabase, FiFileText, FiCpu, FiZap, FiMail,
  FiHardDrive, FiBarChart2, FiCalendar, FiRss,
  FiCompass, FiMessageSquare, FiPieChart, FiClock, FiImage,
  FiVideo, FiMusic, FiUser, FiSettings, FiLock, FiUnlock,
  FiTrash2, FiEdit3, FiPlus, FiMinus, FiCheckCircle,
  FiAlertTriangle, FiInfo, FiMapPin, FiPhone, FiSend,
  FiDownload, FiUpload, FiRefreshCw, FiCloud, FiMonitor,
  FiFolder, FiArchive, FiList, FiGrid, FiLayers, FiBook,
  FiShoppingCart, FiCreditCard, FiDollarSign, FiActivity,
  FiGithub, FiEye, FiBox, FiChevronDown
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import MCPConnectorModal from './mcpConnectorModal';
import AddToolModal from './addToolModal';
import LibraryHeader from '../../Common/LibraryHeader';
import LibraryListRow from '../../Common/LibraryListRow';

const TOOL_COLORS = ['#C9DEFF', '#FFE4B8', '#E5D9FF', '#C9F5E0', '#FFD9EE', '#FFF3B8', '#C9F5F5', '#FFE4E6'];
const TOOL_TEXT = ['#1A56DB', '#B45309', '#7C3AED', '#065F46', '#9D174D', '#92400E', '#065555', '#BE123C'];

const ICON_RULES = [
  { keywords: ['search', 'find', 'google', 'duckduckgo', 'bing', 'query'], icon: FiSearch },
  { keywords: ['browser', 'nav', 'open', 'web', 'url', 'link', 'http', 'https', 'fetch', 'request', 'scrap', 'crawl'], icon: FiGlobe },
  { keywords: ['file', 'read', 'write', 'pdf', 'doc', 'docx', 'txt', 'csv', 'excel', 'sheet', 'content'], icon: FiFileText },
  { keywords: ['code', 'python', 'js', 'javascript', 'typescript', 'ts', 'py', 'script', 'compile', 'bash', 'sh', 'shell', 'terminal', 'exec'], icon: FiCode },
  { keywords: ['db', 'sql', 'postgres', 'mysql', 'mongo', 'redis', 'database', 'store', 'json'], icon: FiDatabase },
  { keywords: ['ai', 'llm', 'gpt', 'model', 'anthropic', 'openai', 'claude', 'gemini', 'llama', 'brain', 'intelligence', 'thought'], icon: FiCpu },
  { keywords: ['mail', 'email', 'smtp', 'sendgrid', 'mailbox'], icon: FiMail },
  { keywords: ['chat', 'slack', 'discord', 'whatsapp', 'talk', 'conversation', 'message', 'msg'], icon: FiMessageSquare },
  { keywords: ['chart', 'graph', 'plot', 'analytics', 'stat', 'metrics', 'visualize', 'dashboard', 'trend'], icon: FiBarChart2 },
  { keywords: ['pie', 'segment', 'portion'], icon: FiPieChart },
  { keywords: ['date', 'time', 'calendar', 'clock', 'schedule', 'cron', 'today', 'tomorrow', 'month', 'year', 'timing'], icon: FiCalendar },
  { keywords: ['news', 'rss', 'feed', 'article', 'post', 'blog', 'journal'], icon: FiRss },
  { keywords: ['image', 'img', 'photo', 'picture', 'gallery', 'camera', 'screenshot', 'canvas', 'draw'], icon: FiImage },
  { keywords: ['video', 'movie', 'film', 'youtube', 'stream', 'play', 'media'], icon: FiVideo },
  { keywords: ['music', 'audio', 'sound', 'voice', 'speech', 'mp3', 'wave', 'record'], icon: FiMusic },
  { keywords: ['user', 'profile', 'account', 'auth', 'login', 'signup', 'identity', 'person', 'people', 'member'], icon: FiUser },
  { keywords: ['setting', 'config', 'preference', 'option', 'control', 'manage', 'setup'], icon: FiSettings },
  { keywords: ['lock', 'secure', 'crypto', 'password', 'key', 'private', 'encrypt', 'protection'], icon: FiLock },
  { keywords: ['unlock', 'public', 'decrypt', 'reveal'], icon: FiUnlock },
  { keywords: ['trash', 'delete', 'remove', 'clear', 'destroy', 'wipe'], icon: FiTrash2 },
  { keywords: ['edit', 'modify', 'update', 'rename', 'fix', 'patch', 'input'], icon: FiEdit3 },
  { keywords: ['plus', 'add', 'new', 'create', 'insert', 'append'], icon: FiPlus },
  { keywords: ['minus', 'remove', 'subtract', 'delete'], icon: FiMinus },
  { keywords: ['check', 'done', 'verify', 'ok', 'correct', 'success', 'complete', 'id', 'validate'], icon: FiCheckCircle },
  { keywords: ['error', 'warn', 'alert', 'danger', 'fail', 'bug', 'issue', 'problem'], icon: FiAlertTriangle },
  { keywords: ['info', 'help', 'about', 'question', 'hint', 'guide'], icon: FiInfo },
  { keywords: ['map', 'location', 'geo', 'gps', 'place', 'address', 'city', 'country', 'nav', 'coord'], icon: FiMapPin },
  { keywords: ['phone', 'call', 'mobile', 'sms', 'contact', 'tele'], icon: FiPhone },
  { keywords: ['send', 'submit', 'push', 'publish', 'dispatch', 'forward'], icon: FiSend },
  { keywords: ['download', 'save', 'export', 'pull', 'write'], icon: FiDownload },
  { keywords: ['upload', 'import', 'push', 'load'], icon: FiUpload },
  { keywords: ['sync', 'refresh', 'reload', 'update', 'loop', 'cycle'], icon: FiRefreshCw },
  { keywords: ['cloud', 'aws', 'gcp', 'azure', 'server', 'deploy', 'remote', 'hosting'], icon: FiCloud },
  { keywords: ['monitor', 'screen', 'display', 'desktop', 'view', 'watch'], icon: FiMonitor },
  { keywords: ['memory', 'ram', 'cache', 'storage', 'harddrive', 'disk', 'ssd', 'save'], icon: FiHardDrive },
  { keywords: ['folder', 'directory', 'path', 'tree', 'root'], icon: FiFolder },
  { keywords: ['archive', 'zip', 'tar', 'compress', 'bundle'], icon: FiArchive },
  { keywords: ['list', 'table', 'rows', 'index', 'collection'], icon: FiList },
  { keywords: ['grid', 'layout', 'tiles', 'pattern'], icon: FiGrid },
  { keywords: ['layers', 'stack', 'pile', 'overlay'], icon: FiLayers },
  { keywords: ['book', 'read', 'learn', 'education', 'library', 'documentation', 'manual', 'know'], icon: FiBook },
  { keywords: ['cart', 'shop', 'buy', 'purchase', 'order', 'ecommerce', 'checkout'], icon: FiShoppingCart },
  { keywords: ['credit', 'card', 'payment', 'billing', 'transaction'], icon: FiCreditCard },
  { keywords: ['money', 'cash', 'dollar', 'price', 'cost', 'currency', 'fund', 'wallet', 'tax'], icon: FiDollarSign },
  { keywords: ['activity', 'pulse', 'vital', 'health', 'heart', 'rate', 'active'], icon: FiActivity },
  { keywords: ['git', 'github', 'repo', 'branch', 'commit', 'merge', 'pull', 'push', 'fork'], icon: FiGithub },
  { keywords: ['zap', 'fast', 'quick', 'power', 'lightning', 'energy', 'boost'], icon: FiZap },
  { keywords: ['compass', 'navigate', 'find', 'direction', 'explore', 'discover'], icon: FiCompass },
  { keywords: ['eye', 'view', 'visibility', 'watch', 'observe', 'peek'], icon: FiEye },
  { keywords: ['clock', 'time', 'watch', 'duration', 'timer', 'wait', 'delay'], icon: FiClock },
];

const getToolIcon = (tool, size = 24) => {
  const n = (tool.display_name || tool.name || '').toLowerCase();

  for (const rule of ICON_RULES) {
    if (rule.keywords.some(k => n.includes(k))) {
      const Icon = rule.icon;
      return <Icon size={size} strokeWidth={1.5} />;
    }
  }

  return <FiTool size={size} strokeWidth={1.5} />;
};

function PackageGroup({ name, version, tools, idx, onAddTool }) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Group tools by category within the package
  const categories = {};
  tools.forEach(t => {
    const cat = t.category || 'General';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(t);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
      style={{
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '20px 24px',
          background: '#F9FAFB',
          borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: 'var(--bg-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-primary)'
          }}>
            <FiBox size={20} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {name.toUpperCase()}
              <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', background: '#DBEAFE', color: '#1E40AF', borderRadius: 4 }}>
                {version || '1.0.0'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {tools.length} Tools in this package
            </div>
          </div>
        </div>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
          <FiChevronDown size={20} color="var(--text-muted)" />
        </motion.div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '24px' }}>
              {Object.keys(categories).map(cat => (
                <div key={cat} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FiLayers size={12} /> {cat}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {categories[cat].map((t, i) => (
                      <div key={t.name || i} style={{
                        padding: '12px 16px', border: '1px solid #F3F4F6', borderRadius: 12, background: 'white',
                        display: 'flex', alignItems: 'center', gap: 12, position: 'relative', group: 'true'
                      }}>
                        <div style={{ color: 'var(--theme-primary)' }}>{getToolIcon(t, 18)}</div>
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{t.display_name || t.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{t.description}</div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); onAddTool(t); }}
                          title="Add to Canvas"
                          style={{
                            width: 28, height: 28, borderRadius: 8, background: 'var(--bg-primary)', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            color: 'var(--theme-primary)', transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--theme-primary)'; e.currentTarget.style.color = 'white'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--theme-primary)'; }}
                        >
                          <FiPlus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ToolCard({ tool, idx, onAddTool }) {
  const [expanded, setExpanded] = useState(false);
  const bg = TOOL_COLORS[idx % TOOL_COLORS.length];
  const text = TOOL_TEXT[idx % TOOL_TEXT.length];
  const params = Object.keys(tool.args_schema?.properties || {});

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.23, 1, 0.32, 1] }}
      style={{
        background: 'white',
        border: '1px solid #F0F0EE',
        borderRadius: 16,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)';
        e.currentTarget.style.borderColor = '#E5E7EB';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.02)';
        e.currentTarget.style.borderColor = '#F0F0EE';
      }}
    >
      <div style={{ padding: '24px', flex: 1 }}>
        {/* Header: Icon + Title + Category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            color: text,
            border: '1px solid rgba(255,255,255,0.4)',
            boxShadow: `0 8px 16px -4px ${bg}66`,
          }}>
            {getToolIcon(tool, 24)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 17,
              fontWeight: 600,
              color: '#111827',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.02em'
            }}>
              {tool.display_name || tool.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              {tool.category && (
                <div style={{
                  fontSize: 11,
                  color: '#6B7280',
                  fontWeight: 600,
                  letterSpacing: '0.01em',
                  textTransform: 'uppercase',
                }}>
                  {tool.category}
                </div>
              )}
              {tool.package && (
                <div style={{
                  fontSize: 10,
                  background: '#F3F4F6',
                  color: '#4B5563',
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontWeight: 700,
                }}>
                  {tool.package}
                </div>
              )}
              {tool.version && (
                <div style={{
                  fontSize: 10,
                  background: '#E0E7FF',
                  color: '#4F46E5',
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontWeight: 700,
                }}>
                  {tool.version}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{
          fontSize: 14,
          color: '#4B5563',
          lineHeight: 1.6,
          marginBottom: 16,
          minHeight: '2.8em',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {tool.description || "Powerful utility to expand agent capabilities with custom functions."}
        </div>

        {/* Parameters Preview */}
        {!expanded && params.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {params.slice(0, 3).map((k) => (
              <span key={k} style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 20,
                background: '#F3F4F6',
                color: '#4B5563',
                fontWeight: 600,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}>
                {k}
              </span>
            ))}
            {params.length > 3 && (
              <span style={{ fontSize: 10, color: '#9CA3AF', alignSelf: 'center' }}>
                +{params.length - 3}
              </span>
            )}
          </div>
        )}

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ paddingTop: 12 }}>
                {params.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {params.map((k) => (
                      <div key={k} style={{
                        background: '#F9FAFB',
                        border: '1px solid #F3F4F6',
                        padding: '8px 12px',
                        borderRadius: 10
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'Roboto Mono, monospace', color: text }}>{k}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>No parameters</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{
        padding: '12px 20px',
        background: '#F9FAFB',
        borderTop: '1px solid #F3F4F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: 10 }}>
        </div>

        <button
          onClick={() => onAddTool(tool)}
          title="Add to Canvas"
          style={{
            width: 32,
            height: 32,
            background: 'var(--bg-primary)',
            border: 'none',
            borderRadius: 10,
            color: 'var(--theme-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--theme-primary)';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-primary)';
            e.currentTarget.style.color = 'var(--theme-primary)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <FiPlus size={20} />
        </button>
      </div>
    </motion.div>
  );
}

function ToolListRow({ tool, idx, onAddTool }) {
  const tags = [];
  if (tool.package) tags.push({ label: tool.package, type: 'Package' });
  if (tool.category) tags.push({ label: tool.category, type: 'Category' });
  if (tool.version) tags.push({ label: tool.version, type: 'Version' });

  return (
    <LibraryListRow
      icon={getToolIcon(tool, 22)}
      title={tool.display_name || tool.name}
      description={tool.description || "Powerful utility to expand agent capabilities."}
      tags={tags}
      primaryAction={{ label: '+ Add', onClick: () => onAddTool(tool) }}
      idx={idx}
    />
  );
}

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'packages' | 'servers'
  const [tools, setTools] = useState([]);
  const [packages, setPackages] = useState([]);
  const [mcpServers, setMcpServers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingServer, setEditingServer] = useState(null);
  const [addToolModalTool, setAddToolModalTool] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'list'

  // Filtering States
  const [categories, setCategories] = useState(['All']);
  const [packagesList, setPackagesList] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPackage, setSelectedPackage] = useState('All');
  // const [filterOpen, setFilterOpen] = useState(false);
  // const filterPanelRef = useRef(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTools, setTotalTools] = useState(0);
  const [totalPackages, setTotalPackages] = useState(0);
  const itemsPerPage = 12;
  const packagesPerPage = 10;

  const { managementSearch, refreshTrigger, showManagementModal: showMCP, setShowManagementModal: setShowMCP } = useUIStore();
  // const [searchOpen, setSearchOpen] = useState(managementSearch?.length > 0);
  // const searchInputRef = React.useRef(null);

  const handleAddToWorkflow = (tool) => {
    setAddToolModalTool(tool);
  };

  const load = async () => {
    setLoading(true); setError(null);
    try {
      // Always fetch MCP servers for the connections tab
      const mcpRes = await listMCPServers();
      setMcpServers(mcpRes.servers || []);

      if (activeTab === 'library') {
        const toolRes = await listTools({
          search: managementSearch,
          page: currentPage,
          limit: itemsPerPage,
          category: selectedCategory === 'All' ? undefined : selectedCategory,
          package: selectedPackage === 'All' ? undefined : selectedPackage
        });
        setTools(toolRes.tools || []);
        setTotalTools(toolRes.total || 0);
      } else if (activeTab === 'packages') {
        const pkgRes = await listToolPackages({ search: managementSearch, page: currentPage, limit: packagesPerPage });
        setPackages(pkgRes.packages || []);
        setTotalPackages(pkgRes.total || 0);
      }
    }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleDeleteServer = async (name) => {
    if (!window.confirm(`Are you sure you want to remove MCP server "${name}"?`)) return;
    try {
      await deleteMCPServer(name);
      await syncMCPTools();
      load();
    } catch (e) {
      alert("Failed to delete server: " + e.message);
    }
  };

  const handleEditServer = (server) => {
    setEditingServer(server);
    setShowMCP(true);
  };

  // Fetch unique categories and packages from all tools (limit 1000)
  useEffect(() => {
    listTools({ limit: 1000 })
      .then(res => {
        const toolsList = res.tools || [];
        const cSet = new Set();
        const pSet = new Set();
        toolsList.forEach(t => {
          if (t.category) cSet.add(t.category);
          if (t.package) pSet.add(t.package);
        });
        setCategories(['All', ...Array.from(cSet).sort()]);
        setPackagesList(['All', ...Array.from(pSet).sort()]);
      })
      .catch(e => console.error("Failed to load unique filters:", e));
  }, [refreshTrigger]);

  // Cleaned up old filter/search handlers (now managed inside LibraryHeader)

  // Reset page when tab changes or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedCategory, selectedPackage]);

  // Debounced search: reset to page 1 which triggers the load effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
      else load();
    }, 400);
    return () => clearTimeout(timer);
  }, [managementSearch]);

  useEffect(() => { load(); }, [refreshTrigger, currentPage, activeTab, selectedCategory, selectedPackage]);

  const filtered = tools;

  // Pagination Logic
  const activeTotal = activeTab === 'library' ? totalTools : totalPackages;
  const activeLimit = activeTab === 'library' ? itemsPerPage : packagesPerPage;
  const totalPages = Math.ceil(activeTotal / activeLimit);

  const paginatedTools = tools;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary)', fontFamily: "'Google Sans','Roboto',sans-serif" }}>

      {/* ── MCP Modal ── */}
      <MCPConnectorModal
        isOpen={showMCP}
        onClose={() => { setShowMCP(false); setEditingServer(null); }}
        onSuccess={load}
        initialData={editingServer}
      />

      <AddToolModal
        isOpen={!!addToolModalTool}
        onClose={() => setAddToolModalTool(null)}
        tool={addToolModalTool}
      />

      <LibraryHeader
        title="Tools"
        description="Register local tools and MCP (Model Context Protocol) server connections to extend agent capabilities."
        search={managementSearch}
        onSearchChange={(val) => useUIStore.getState().setManagementSearch(val)}
        placeholder="Search tools..."
        showFilters={activeTab === 'library'}
        showSearch={activeTab !== 'servers'}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        tags={packagesList}
        selectedTag={selectedPackage}
        onTagChange={setSelectedPackage}
        tagLabel="Package"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showViewToggle={activeTab === 'library'}
        actions={
          activeTab === 'servers' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setShowMCP(true)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px',
                  background: 'white', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                Connect MCP
              </button>

              <button
                onClick={async () => {
                  const pulse = useUIStore.getState().setRefreshTrigger;
                  await syncMCPTools();
                  pulse(Date.now());
                }}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px',
                  background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)', border: 'none', borderRadius: 8,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.95)'}
                onMouseLeave={e => e.currentTarget.style.filter = 'none'}
              >
                <FiRefreshCw size={14} /> Sync Registry
              </button>
            </div>
          )
        }
      />

      {/* ── Tabs ── */}
      <div style={{
        padding: '0 40px',
        background: 'white',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', gap: 32 }}>
          {[
            { id: 'library', label: 'Available Tools' },
            { id: 'packages', label: 'Tool Packages' },
            { id: 'servers', label: 'MCP Connections' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 4px',
                fontSize: 14,
                fontWeight: 600,
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'color 0.2s'
              }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
                    background: 'var(--accent-btn)',
                    boxShadow: '0 0 8px var(--accent-glow)'
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 12, color: 'var(--text-muted)' }}>
            <div className="loading-spinner" /> <span style={{ fontSize: 14 }}>Loading...</span>
          </div>
        )}

        {error && <div style={{ padding: '16px 20px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, color: '#DC2626', fontSize: 13 }}>{error}</div>}

        {!loading && !error && (
          <>
            {activeTab === 'library' && (
              <>
                {filtered.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    minHeight: '300px',
                    gap: 16,
                    color: '#64748B'
                  }}>
                    <FiTool size={48} strokeWidth={1} />
                    <div style={{ fontSize: 14, fontWeight: 500 }}>No tools found</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                    {viewMode === 'cards' ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                        {paginatedTools.map((t, i) => <ToolCard key={t.name || i} tool={t} idx={i} onAddTool={handleAddToWorkflow} />)}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {paginatedTools.map((t, i) => <ToolListRow key={t.name || i} tool={t} idx={i} onAddTool={handleAddToWorkflow} />)}
                      </div>
                    )}

                    {/* Pagination Controller */}
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}

            {activeTab === 'packages' && (
              <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                {packages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <FiBox size={40} color="var(--text-muted)" style={{ marginBottom: 16 }} />
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>No packages identified</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {packages.map((pkg, i) => (
                        <PackageGroup key={pkg.name} name={pkg.name} version={pkg.version} tools={pkg.tools} idx={i} onAddTool={handleAddToWorkflow} />
                      ))}
                    </div>

                    {/* Pagination Controller for Packages */}
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'servers' && (
              <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FiServer size={14} /> Registered Servers ({mcpServers.length})
                  </div>
                </div>

                {mcpServers.length === 0 ? (
                  <div style={{
                    padding: '80px 60px',
                    minHeight: 450,
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderStyle: 'dashed',
                    textAlign: 'center'
                  }}>
                    <FiServer size={32} color="var(--text-muted)" style={{ marginBottom: 16 }} />
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>No MCP servers connected</div>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>Register a server to import external tools into AgentMesh.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {mcpServers.map((s) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={s.name}
                        style={{
                          background: 'white',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          padding: '20px 24px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 20,
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <div style={{
                          width: 48, height: 48, borderRadius: 12,
                          background: 'var(--bg-primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--text-secondary)'
                        }}>
                          <FiServer size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                            <div style={{
                              fontSize: 10, padding: '2px 8px', borderRadius: 20,
                              background: s.enabled ? '#E1F9EB' : '#FEE2E2',
                              color: s.enabled ? '#15803D' : '#DC2626',
                              fontWeight: 700,
                              textTransform: 'uppercase'
                            }}>
                              {s.enabled ? 'Active' : 'Offline'}
                            </div>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 4, background: 'var(--bg-canvas)', padding: '4px 8px', borderRadius: 4, display: 'inline-block' }}>
                            {s.command} {s.args?.join(' ')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleEditServer(s)}
                            style={{
                              background: 'white', border: '1px solid var(--border)',
                              cursor: 'pointer', color: 'var(--text-secondary)',
                              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteServer(s.name)}
                            style={{
                              background: 'none', border: 'none',
                              cursor: 'pointer', color: 'var(--text-muted)',
                              padding: '8px', borderRadius: 8, display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = '#FFF5F5'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                          >
                            <FiTrash size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
