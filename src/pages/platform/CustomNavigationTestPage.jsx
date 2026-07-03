import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCompass, FiCheckCircle, FiLayers } from 'react-icons/fi';

export default function CustomNavigationTestPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc', // slate-50
      color: '#0f172a', // slate-900
      fontFamily: "'Outfit', 'Inter', sans-serif",
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background glow circles */}
      <div style={{
        position: 'absolute', top: '10%', left: '15%', width: 300, height: 300,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', right: '10%', width: 400, height: 400,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)',
        filter: 'blur(50px)', pointerEvents: 'none'
      }} />

      {/* Main Card */}
      <div style={{
        width: '100%',
        maxWidth: 580,
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(16px)',
        border: '1px solid #e2e8f0', // slate-200
        borderRadius: 28,
        padding: '48px 40px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        {/* Animated Icon Circle */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25)',
          marginBottom: 28,
          position: 'relative'
        }}>
          <FiCompass size={38} color="white" />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          margin: '0 0 12px 0',
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Navigation Link Successful
        </h1>

        {/* Subtitle / Description */}
        <p style={{
          fontSize: 15,
          color: '#475569', // slate-600
          lineHeight: 1.6,
          margin: '0 0 36px 0',
          maxWidth: '90%'
        }}>
          Awesome! You have successfully bound this React SPA page to your launch button. The application routed you here client-side without any page refreshes.
        </p>

        {/* Info Grid */}
        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 40
        }}>
          {/* Item 1 */}
          <div style={{
            background: '#f1f5f9', // slate-100
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 6
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4f46e5', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <FiCheckCircle size={14} /> Status
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Fully Active</div>
          </div>

          {/* Item 2 */}
          <div style={{
            background: '#f1f5f9', // slate-100
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 6
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#7c3aed', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <FiLayers size={14} /> Target Page
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }} title="/custom-navigation-test">
              /custom-navigation-test
            </div>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 28px',
            borderRadius: 12,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            color: '#475569',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f8fafc';
            e.currentTarget.style.color = '#0f172a';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.color = '#475569';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <FiArrowLeft size={16} />
          Go Back
        </button>
      </div>
    </div>
  );
}
