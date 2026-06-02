import React from 'react';
import { useUIStore } from '../../../store';
import AgentsPage from './AgentsPage';
import ToolsPage from './ToolsPage';
import APIsPage from './APIsPage';
import SkillsPage from './SkillsPage';

export default function LibraryPage() {
  const { activeLibraryTab } = useUIStore();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      background: 'var(--bg-canvas)',
      overflow: 'hidden'
    }}>
      {/* Tab Content */}
      <div style={{
        flex: 1,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        position: 'relative'
      }}>
        <div style={{ width: '100%', height: '100%' }}>
          {activeLibraryTab === 'agents' && <AgentsPage />}
          {activeLibraryTab === 'tools' && <ToolsPage />}
          {activeLibraryTab === 'apis' && <APIsPage />}
          {activeLibraryTab === 'skills' && <SkillsPage />}
        </div>
      </div>
    </div>
  );
}
