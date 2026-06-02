import React, { useState } from 'react';
import { useUIStore } from '../../store';
import tantorWordmark from '../../assets/data/Tantor Wordmark.png';
import tantorOldLogo from '../../assets/data/Tantor old logo.png';
import {
  FiGrid, FiGitBranch, FiBarChart2, FiBox, FiBookOpen,
  FiSettings, FiLifeBuoy, FiChevronLeft, FiChevronRight, FiBell, FiMessageSquare,
  FiList, FiActivity, FiLink, FiCpu
} from 'react-icons/fi';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: FiBarChart2 },
  { id: 'canvas', label: 'Canvas', icon: FiGrid },
  { id: 'workflows', label: 'Workflows', icon: FiGitBranch },
  { id: 'library', label: 'Library', icon: FiBox },
  { id: 'marketplace', label: 'Marketplace', icon: FiMessageSquare },
  { id: 'logs', label: 'Logs', icon: FiList },
  { id: 'rag', label: 'Knowledge', icon: FiBookOpen },
  { id: 'observability', label: 'Observability', icon: FiActivity },
  { id: 'connections', label: 'Connections', icon: FiLink },
];

export default function Sidebar() {
  const { activePage, setActivePage, activeLibraryTab, setActiveLibraryTab, sidebarCollapsed, setSidebarCollapsed, setShowNotifications, unreadCount } = useUIStore();
  const [libraryExpanded, setLibraryExpanded] = useState(true);

  const width = sidebarCollapsed ? 64 : 220;

  return (
    <div style={{
      width,
      height: '100%',
      background: 'white',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      zIndex: 30,
      transition: 'width 0.2s ease',
      overflow: 'hidden',
      fontFamily: "'Google Sans', sans-serif",
    }}>
      {/* Brand */}
      <div style={{
        padding: sidebarCollapsed ? '20px 8px 16px' : '20px 16px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        minHeight: 64,
        justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
      }}>
        {sidebarCollapsed ? (
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden'
          }}>
            <img
              src={tantorWordmark}
              alt="Tantor"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: 0 }}>
            <img
              src={tantorOldLogo}
              alt="Tantor Logo"
              style={{ height: 32, maxWidth: '100%', objectFit: 'contain' }}
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;
          const isLibrary = item.id === 'library';

          // Library sub-items
          const LIBRARY_SUBS = [
            { id: 'agents', label: 'Agents', icon: FiCpu },
            { id: 'tools', label: 'Tools', icon: FiBox },
            { id: 'apis', label: 'APIs', icon: FiLink },
            { id: 'skills', label: 'Skills', icon: FiBookOpen },
          ];

          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (isLibrary) {
                    if (activePage === 'library') {
                      setLibraryExpanded(!libraryExpanded);
                    } else {
                      setActivePage('library');
                      setLibraryExpanded(true);
                    }
                  } else {
                    setActivePage(item.id);
                  }
                }}
                title={sidebarCollapsed ? item.label : ''}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: sidebarCollapsed ? '10px' : '8px 12px', borderRadius: 8, border: 'none',
                  background: active ? 'var(--bg-hover)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: 13.5, fontWeight: active ? 500 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                  textAlign: 'left', width: '100%',
                  fontFamily: 'inherit',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
              >
                <Icon size={18} strokeWidth={active ? 2 : 1.5} style={{ flexShrink: 0 }} />
                {!sidebarCollapsed && (
                  <>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {isLibrary && (
                      <FiChevronRight
                        size={16}
                        style={{
                          transition: 'transform 0.2s ease',
                          transform: libraryExpanded && active ? 'rotate(90deg)' : 'rotate(0deg)',
                          opacity: 0.6
                        }}
                      />
                    )}
                  </>
                )}
              </button>

              {/* Library Sub-items */}
              {isLibrary && active && libraryExpanded && !sidebarCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6, marginBottom: 6 }}>
                  {LIBRARY_SUBS.map((sub) => {
                    const SubIcon = sub.icon;
                    const subActive = activeLibraryTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setActiveLibraryTab(sub.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '8px 12px 8px 36px', borderRadius: 6, border: 'none',
                          background: subActive ? 'var(--theme-primary-glow)' : 'transparent',
                          color: subActive ? 'var(--theme-primary)' : 'var(--text-muted)',
                          fontSize: 12.5, fontWeight: subActive ? 600 : 400,
                          cursor: 'pointer', transition: 'all 0.15s',
                          textAlign: 'left', width: '100%',
                          fontFamily: 'inherit',
                        }}
                        onMouseEnter={(e) => {
                          if (!subActive) {
                            e.currentTarget.style.background = 'var(--bg-hover)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!subActive) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-muted)';
                          }
                        }}
                      >
                        <SubIcon size={16} strokeWidth={subActive ? 2 : 1.5} style={{ flexShrink: 0 }} />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ height: 1, background: 'var(--border-light)', margin: '8px 4px' }} />

        {/* Notifications Trigger */}
        <button
          onClick={() => setShowNotifications(true)}
          title={sidebarCollapsed ? "Notifications" : ''}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: sidebarCollapsed ? '10px' : '8px 12px', borderRadius: 8, border: 'none',
            background: 'transparent',
            color: unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: 13.5, fontWeight: unreadCount > 0 ? 500 : 400,
            cursor: 'pointer', transition: 'all 0.15s',
            textAlign: 'left', width: '100%',
            fontFamily: 'inherit',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            position: 'relative'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-muted)'; }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiBell size={18} strokeWidth={unreadCount > 0 ? 2 : 1.5} style={{ flexShrink: 0 }} />
            {unreadCount > 0 && sidebarCollapsed && (
              <span style={{
                position: 'absolute', top: -2, right: -2, background: '#EF4444',
                color: 'white', minWidth: 8, height: 8,
                borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid white'
              }} />
            )}
          </div>
          {!sidebarCollapsed && <span>Notifications</span>}
          {!sidebarCollapsed && unreadCount > 0 && (
            <span style={{
              marginLeft: 'auto', background: '#EF4444', color: 'white',
              fontSize: 10, fontWeight: 700, minWidth: 18, height: 18,
              borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px'
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Settings Trigger */}
        <button
          onClick={() => setActivePage('settings')}
          title={sidebarCollapsed ? "Settings" : ''}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: sidebarCollapsed ? '10px' : '8px 12px', borderRadius: 8, border: 'none',
            background: activePage === 'settings' ? 'var(--bg-hover)' : 'transparent',
            color: activePage === 'settings' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: 13.5, fontWeight: activePage === 'settings' ? 500 : 400,
            cursor: 'pointer', transition: 'all 0.15s',
            textAlign: 'left', width: '100%',
            fontFamily: 'inherit',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          }}
          onMouseEnter={(e) => { if (activePage !== 'settings') e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { if (activePage !== 'settings') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
        >
          <FiSettings size={18} strokeWidth={activePage === 'settings' ? 2 : 1.5} style={{ flexShrink: 0 }} />
          {!sidebarCollapsed && <span>Settings</span>}
        </button>
      </nav>

      {/* Footer Actions */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border-light)' }}>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: sidebarCollapsed ? '10px' : '8px 12px', borderRadius: 8, border: 'none',
            background: 'transparent', color: 'var(--text-muted)',
            fontSize: 13, fontWeight: 400, cursor: 'pointer',
            width: '100%', textAlign: 'left', fontFamily: 'inherit',
            transition: 'all 0.15s',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          {sidebarCollapsed ? <FiChevronRight size={18} /> : <><FiChevronLeft size={18} /> <span>Collapse</span></>}
        </button>
      </div>

      {/* User Area */}
      <div style={{
        padding: sidebarCollapsed ? '12px 8px' : '12px 16px',
        borderTop: '1px solid var(--border-light)',
        display: 'flex', alignItems: 'center',
        gap: 12,
        minHeight: 64,
        background: '#FAFAF8'
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: '#E8E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#4848CC',
          flexShrink: 0,
        }}>
          LU
        </div>
        {!sidebarCollapsed && (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Local User</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Administrator</div>
          </div>
        )}
      </div>
    </div>
  );
}
