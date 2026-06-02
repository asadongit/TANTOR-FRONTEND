/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { NODE_TYPES } from './NodePalette';

export default function NodeSearch({ onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Filter nodes based on search query
  const filteredNodes = NODE_TYPES.filter(n =>
    n.label.toLowerCase().includes(search.toLowerCase()) ||
    n.desc.toLowerCase().includes(search.toLowerCase()) ||
    n.category.toLowerCase().includes(search.toLowerCase())
  );

  // Reset active index when search changes
  useEffect(() => {
    setActiveIndex(0);
  }, [search]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, filteredNodes.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredNodes[activeIndex]) {
          onSelect(filteredNodes[activeIndex].type);
        }
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [filteredNodes, activeIndex, onClose, onSelect]);

  // Scroll active item into view
  useEffect(() => {
    if (resultsRef.current) {
      const activeEl = resultsRef.current.children[activeIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.18)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: '12vh',
        transition: 'all 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '90%',
          maxWidth: '600px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Box */}
        <motion.div
          initial={{ opacity: 0, y: -25, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: '16px',
            padding: '14px 20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05), inset 0 2px 4px rgba(255,255,255,1)',
            position: 'relative',
          }}
        >
          <FiSearch size={20} style={{ color: 'var(--theme-primary)', marginRight: '14px', filter: 'drop-shadow(0 2px 4px rgba(142, 119, 187, 0.25))' }} />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type to search and add nodes..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '16px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              background: 'transparent',
            }}
          />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  borderRadius: '50%',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FiX size={16} />
              </button>
            )}
            
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                padding: '3px 7px',
                borderRadius: '6px',
                letterSpacing: '0.02em',
                userSelect: 'none',
              }}
            >
              ESC
            </span>
          </div>
        </motion.div>

        {/* Bottom Search Results Box */}
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: '16px',
            maxHeight: '400px',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.01)',
            display: 'flex',
            flexDirection: 'column',
            padding: '8px',
          }}
          className="msg-scrollbar"
        >
          {filteredNodes.length > 0 ? (
            <div ref={resultsRef} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {filteredNodes.map((node, index) => {
                const Icon = node.icon;
                const isSelected = index === activeIndex;
                return (
                  <div
                    key={node.type}
                    onClick={() => onSelect(node.type)}
                    onMouseEnter={() => setActiveIndex(index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '11px 16px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: isSelected 
                        ? 'linear-gradient(90deg, var(--bg-hover) 0%, rgba(245, 245, 243, 0.4) 100%)' 
                        : 'transparent',
                      border: isSelected 
                        ? '1px solid rgba(142, 119, 187, 0.15)' 
                        : '1px solid transparent',
                      boxShadow: isSelected 
                        ? '0 4px 12px rgba(142, 119, 187, 0.05)' 
                        : 'none',
                      transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                      transform: isSelected ? 'translateX(2px)' : 'none',
                    }}
                  >
                    {/* Beautiful Icon Container */}
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: node.bg,
                        color: node.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: isSelected 
                          ? `0 4px 10px ${node.bg}80` 
                          : 'none',
                        transition: 'all 0.2s',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      <Icon size={18} strokeWidth={2.2} />
                    </div>

                    {/* Node Details (Label & Description) */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '14.5px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {node.label}
                        </span>
                        
                        {/* Soft elegant Category Pill */}
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            color: node.color,
                            background: `${node.bg}b0`,
                            padding: '2px 7px',
                            borderRadius: '9999px',
                            border: `1px solid ${node.bg}`,
                          }}
                        >
                          {node.category}
                        </span>
                      </div>
                      
                      <span
                        style={{
                          fontSize: '11.5px',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.4',
                        }}
                      >
                        {node.desc}
                      </span>
                    </div>

                    {/* macOS/Linear Style Keycap Badge */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {isSelected ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          style={{
                            fontSize: '10px',
                            color: 'var(--theme-primary)',
                            fontWeight: 600,
                            background: 'white',
                            border: '1px solid var(--theme-primary-light)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 5px rgba(142, 119, 187, 0.1)',
                            userSelect: 'none',
                          }}
                        >
                          <span>Add</span>
                          <span style={{ fontSize: '12px', lineHeight: 1 }}>↵</span>
                        </motion.div>
                      ) : (
                        <span style={{ width: '40px' }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              <div style={{ fontSize: '32px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.05))' }}>🔍</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No nodes found</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '280px', lineHeight: 1.5 }}>
                We couldn't find any nodes matching "<strong>{search}</strong>". Try checking the spelling.
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
