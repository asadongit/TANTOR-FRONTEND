import React from 'react';
import { FiFileText, FiClock, FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function WorkflowTemplateController() {
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
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>Template Approval Queue</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Review and approve submitted agent-mesh templates for the global marketplace.</p>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, padding: '32px 48px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            background: 'white', 
            borderRadius: 16, 
            padding: '48px 32px', 
            textAlign: 'center', 
            maxWidth: 480, 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16
          }}
        >
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--theme-primary-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--theme-primary)',
            marginBottom: 8
          }}>
            <FiFileText size={32} />
          </div>
          
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>No Pending Template Approvals</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            All template approval requests have been processed. When users submit new workflow/agent templates, they will appear here for review.
          </p>

          <div style={{ display: 'flex', gap: 24, marginTop: 12, width: '100%', borderTop: '1px solid #F1F5F9', paddingTop: 20 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Processed</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1E1B4B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <FiCheckCircle color="#10B981" size={18} />
                <span>12</span>
              </div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', borderLeft: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Avg. Response</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1E1B4B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <FiClock color="#F59E0B" size={18} />
                <span>1.4h</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
