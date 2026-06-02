import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  const adjustedStart = Math.max(1, endPage - 4);

  for (let i = adjustedStart; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 32, paddingBottom: 32 }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 8, border: '1px solid #E5E7EB',
          background: 'white', color: '#374151', cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          opacity: currentPage === 1 ? 0.5 : 1, transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => { if (currentPage !== 1) e.currentTarget.style.background = '#F3F4F6'; }}
        onMouseLeave={(e) => { if (currentPage !== 1) e.currentTarget.style.background = 'white'; }}
      >
        <FiChevronLeft size={18} />
      </button>

      {adjustedStart > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            style={{
              width: 36, height: 36, borderRadius: 8, border: '1px solid #E5E7EB',
              background: 'white', color: '#374151', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            1
          </button>
          {adjustedStart > 2 && <span style={{ color: '#9CA3AF' }}>...</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          style={{
            width: 36, height: 36, borderRadius: 8,
            border: p === currentPage ? '1px solid #111827' : '1px solid #E5E7EB',
            background: p === currentPage ? '#111827' : 'white',
            color: p === currentPage ? 'white' : '#374151',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { if (p !== currentPage) e.currentTarget.style.background = '#F3F4F6'; }}
          onMouseLeave={(e) => { if (p !== currentPage) e.currentTarget.style.background = 'white'; }}
        >
          {p}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span style={{ color: '#9CA3AF' }}>...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            style={{
              width: 36, height: 36, borderRadius: 8, border: '1px solid #E5E7EB',
              background: 'white', color: '#374151', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 8, border: '1px solid #E5E7EB',
          background: 'white', color: '#374151', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          opacity: currentPage === totalPages ? 0.5 : 1, transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => { if (currentPage !== totalPages) e.currentTarget.style.background = '#F3F4F6'; }}
        onMouseLeave={(e) => { if (currentPage !== totalPages) e.currentTarget.style.background = 'white'; }}
      >
        <FiChevronRight size={18} />
      </button>
    </div>
  );
};

export default Pagination;
