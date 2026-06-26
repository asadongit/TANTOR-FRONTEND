import React from 'react';
import { useUIStore } from '../../../store';
import AgentsPage from './AgentsPage';
import NodesPage from './NodesPage';
import ToolsPage from './ToolsPage';
import APIsPage from './APIsPage';
import SkillsPage from './SkillsPage';
import TemplatesPage from './TemplatesPage';

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
        display: 'flex',
        flex: 1,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{ width: '100%', height: '100%' }}>
          {activeLibraryTab === 'agents' && <AgentsPage />}
          {activeLibraryTab === 'nodes' && <NodesPage />}
          {activeLibraryTab === 'tools' && <ToolsPage />}
          {activeLibraryTab === 'apis' && <APIsPage />}
          {activeLibraryTab === 'skills' && <SkillsPage />}
          {activeLibraryTab === 'templates' && <TemplatesPage />}
        </div>
      </div>
    </div>
  );
}
