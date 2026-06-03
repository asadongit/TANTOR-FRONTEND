import React from 'react';
import { motion } from 'framer-motion';
import { FiLayout } from 'react-icons/fi';

export default function TemplatesPage() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F8FAFC', height: '100%', overflow: 'hidden', fontFamily: "'Google Sans','Roboto',sans-serif" }}>
      {/* Header */}
      <div style={{ 
        padding: '16px 32px', 
        background: 'white', 
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        zIndex: 10
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>Templates</h1>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          style={{ 
            textAlign: 'center', 
            background: 'white', 
            padding: '48px 32px', 
            borderRadius: '16px', 
            border: '1px dashed #CBD5E1', 
            maxWidth: '480px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#F5F3FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#7C3AED'
          }}>
            <FiLayout size={32} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1E1B4B', margin: '0 0 10px 0' }}>No Templates Available</h2>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0, lineHeight: '1.5' }}>
            Agent studio templates are currently empty. Check back later to load pre-configured agent meshes.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
