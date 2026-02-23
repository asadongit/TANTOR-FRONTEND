import React from 'react';
import flagIcon from '../../../assets/flag.png';
import { Icon } from '@iconify/react';

// Track node positions as percentages of the SVG viewBox
const TRACK_NODES = [
  { id: 'L1', x: 80,  y: 195 },
  { id: 'L2', x: 195, y: 105 },
  { id: 'L3', x: 330, y: 80  },
  { id: 'L4', x: 470, y: 80  },
  { id: 'L5', x: 600, y: 105 },
  { id: 'L6', x: 680, y: 195 },
  { id: 'L7', x: 600, y: 295 },
];

function RaceTrack() {
  const trackPath =
    'M 80 195 C 80 130, 130 80, 195 105 L 330 80 L 470 80 L 600 105 C 660 130, 700 160, 680 195 C 660 240, 640 270, 600 295 L 470 310 L 330 310 C 200 310, 80 265, 80 195 Z';

  return (
    <div className="relative w-full flex flex-col items-center">
      <svg
        viewBox="0 0 760 400"
        className="w-full"
        style={{ maxHeight: 320 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={trackPath}
          fill="none"
          stroke="rgba(141,23,24,0.25)"
          strokeWidth="36"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={trackPath}
          fill="none"
          stroke="#8D1718"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="300" y1="295" x2="300" y2="330" stroke="white" strokeWidth="3" />
        <text x="290" y="350" fill="#aaa" fontSize="14" textAnchor="middle">Start</text>
        {[0,1,2,3,4,5].map(i => (
          <rect
            key={i}
            x={452 + (i % 2 === 0 ? 0 : 6)}
            y={i < 2 ? 295 : i < 4 ? 301 : 307}
            width="6" height="6"
            fill={i % 2 === 0 ? 'white' : '#333'}
          />
        ))}
        <line x1="455" y1="295" x2="455" y2="318" stroke="white" strokeWidth="2" />
        <text x="455" y="340" fill="#aaa" fontSize="14" textAnchor="middle">Finish</text>
        {TRACK_NODES.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={22}
              fill="#8D1718"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
            />
            <text
              x={node.x}
              y={node.y + 5}
              textAnchor="middle"
              fill="white"
              fontSize="13"
              fontWeight="600"
            >
              {node.id}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function StatCard({ label, icon, value }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-5 rounded-xl"
      style={{
        background: 'rgba(90,12,12,0.6)',
        border: '1px solid rgba(130,22,22,0.35)',
      }}
    >
      <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{icon}</span>
        {label}
      </div>
      <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '0.01em' }}>{value}</span>
    </div>
  );
}

function StandingItem({ name, subtitle, percent, color }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(141,23,24,0.35)', border: '1px solid rgba(180,40,40,0.4)' }}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="rgba(255,120,120,0.85)" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500 }} className="truncate">{name}</p>
        <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.72rem' }} className="truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0" style={{ minWidth: '100px' }}>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${percent}%`, background: color }}
          />
        </div>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', width: '2rem', textAlign: 'right' }}>{percent}%</span>
      </div>
    </div>
  );
}

function F1Mode() {
  return (
    <div className="w-full h-[102%] p-4">
      <div
        className="relative w-full h-full rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0a0000 0%, #1a0000 40%, #6b0e0e 100%)',
        }}
      >
        {/* Checkered flag watermark top-right */}
        <img
          src={flagIcon}
          alt=""
          aria-hidden="true"
          className="absolute pointer-events-none select-none"
          style={{
            width: '38%',
            height: '45%',
            opacity: 0.13,
            mixBlendMode: 'screen',
            objectFit: 'cover',
            top: '-100px',
            right: '-10px',
            transform: 'rotate(180deg)',
            zIndex: 1,
          }}
        />

        {/* Inner scrollable container */}
        <div
          className="relative h-full flex flex-col"
          style={{ zIndex: 10 }}
        >
          {/* Sticky Header — does not scroll */}
          <div
            className="flex items-center gap-2 px-6 pt-6 pb-4 flex-shrink-0"
            style={{
              background: 'linear-gradient(180deg, rgba(10,0,0,0.95) 70%, transparent 100%)',
              position: 'sticky',
              top: 0,
              zIndex: 20,
            }}
          >
            <Icon icon="mdi:flag-checkered" style={{ fontSize: '1.75rem', color: '#fff' }} />
            <h1 style={{ color: '#fff', fontSize: '1.375rem', fontWeight: 700, letterSpacing: '0.02em' }}>F1 Mode</h1>
          </div>

          {/* Scrollable content */}
          <div
            className="flex-1 overflow-y-auto px-6 pb-6"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(141,23,24,0.6) transparent',
            }}
          >
            {/* Custom scrollbar for WebKit */}
            <style>{`
              .f1-scroll::-webkit-scrollbar {
                width: 4px;
              }
              .f1-scroll::-webkit-scrollbar-track {
                background: transparent;
              }
              .f1-scroll::-webkit-scrollbar-thumb {
                background: rgba(141,23,24,0.6);
                border-radius: 2px;
              }
              .f1-scroll::-webkit-scrollbar-thumb:hover {
                background: rgba(200,30,30,0.8);
              }
            `}</style>

            <div
              className="f1-scroll grid grid-cols-1 lg:grid-cols-2 gap-5"
            >
              {/* LEFT COLUMN */}
              <div className="flex flex-col gap-5">

                {/* Qualifying Analysis section */}
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.6rem' }}>
                    Qualifying Analysis
                  </p>
                  <div
                    className="rounded-2xl p-5 flex flex-col gap-4"
                    style={{
                      background: 'rgba(60,5,5,0.7)',
                      border: '1px solid rgba(160,30,30,0.3)',
                    }}
                  >
                    {/* Data Ingestion drop zone */}
                    <div
                      className="rounded-xl flex flex-col items-center justify-center py-7"
                      style={{
                        background: 'rgba(100,10,10,0.35)',
                        border: '1px solid rgba(160,30,30,0.25)',
                      }}
                    >
                      <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Data Ingestion</p>
                      <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.75rem', marginBottom: '1rem' }}>Drop your dataset to start the race</p>
                      <button
                        className="flex items-center gap-2 transition-all hover:brightness-110 active:scale-95"
                        style={{
                          background: 'rgba(80,15,15,0.8)',
                          border: '1px solid rgba(160,40,40,0.5)',
                          borderRadius: '0.5rem',
                          padding: '0.4rem 1.1rem',
                          color: 'rgba(255,255,255,0.75)',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="16 16 12 12 8 16" />
                          <line x1="12" y1="12" x2="12" y2="21" />
                          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                        </svg>
                        Upload
                      </button>
                    </div>

                    {/* Dropdowns */}
                    <div className="grid grid-cols-3 gap-3">
                      {['Task', 'Metric', 'Target'].map((lbl) => (
                        <div key={lbl} className="flex flex-col gap-1">
                          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{lbl}</label>
                          <button
                            className="flex items-center justify-between transition-all hover:brightness-110"
                            style={{
                              background: 'rgba(80,10,10,0.6)',
                              border: '1px solid rgba(140,30,30,0.4)',
                              borderRadius: '0.5rem',
                              padding: '0.45rem 0.75rem',
                              color: 'rgba(255,255,255,0.45)',
                              fontSize: '0.85rem',
                            }}
                          >
                            Select
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Launch button */}
                    <button
                      className="w-full transition-all hover:brightness-110 active:scale-95"
                      style={{
                        background: 'linear-gradient(90deg, #9b1c1c, #dc2626)',
                        borderRadius: '0.75rem',
                        padding: '0.7rem',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        letterSpacing: '0.06em',
                        border: 'none',
                      }}
                    >
                      Launch
                    </button>
                  </div>
                </div>

                {/* View Standings section */}
                <div>
                  <div
                    className="rounded-2xl p-5"
                    style={{
                      background: 'rgba(60,5,5,0.7)',
                      border: '1px solid rgba(160,30,30,0.3)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>View Standings</p>
                      <button style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }} className="hover:text-white transition-colors">View all</button>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '0.25rem' }}>
                      <StandingItem name="Main loop"           subtitle="Product launch · My projects"          percent={33} color="linear-gradient(90deg,#4ade80,#22c55e)" />
                      <StandingItem name="User feedback"       subtitle="Feature updates · Team collaboration"  percent={58} color="linear-gradient(90deg,#facc15,#f59e0b)" />
                      <StandingItem name="Market analysis"     subtitle="Competitor review · Strategy planning" percent={72} color="linear-gradient(90deg,#f97316,#ef4444)" />
                      <StandingItem name="Performance metrics" subtitle="Revenue goals · Success stories"       percent={45} color="linear-gradient(90deg,#ec4899,#a855f7)" />
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="flex flex-col gap-5">

                {/* Live Run Status section */}
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.6rem' }}>
                    Live Run Status
                  </p>
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      background: 'rgba(60,5,5,0.7)',
                      border: '1px solid rgba(160,30,30,0.3)',
                    }}
                  >
                    {/* Timer top-right */}
                    <div className="flex justify-end mb-2">
                      <div
                        className="flex items-center gap-2 font-mono"
                        style={{
                          background: 'rgba(20,3,3,0.75)',
                          border: '1px solid rgba(130,20,20,0.45)',
                          borderRadius: '0.6rem',
                          padding: '0.3rem 0.75rem',
                          color: 'rgba(255,255,255,0.8)',
                          fontSize: '0.875rem',
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        00:00:00
                      </div>
                    </div>
                    <RaceTrack />
                  </div>
                </div>

                {/* Stats grid */}
                <div
                  className="rounded-2xl p-3"
                  style={{
                    background: 'rgba(40,3,3,0.75)',
                    border: '1px solid rgba(140,25,25,0.35)',
                  }}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <StatCard
                      label="Rows Sampled"
                      icon={
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <line x1="3" y1="9" x2="21" y2="9" />
                          <line x1="3" y1="15" x2="21" y2="15" />
                          <line x1="9" y1="3" x2="9" y2="21" />
                        </svg>
                      }
                      value="12,500"
                    />
                    <StatCard
                      label="Features"
                      icon={
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="4" y1="6" x2="20" y2="6" />
                          <line x1="4" y1="12" x2="20" y2="12" />
                          <line x1="4" y1="18" x2="16" y2="18" />
                          <polyline points="14 4 16 6 14 8" />
                        </svg>
                      }
                      value="48"
                    />
                    <StatCard
                      label="Models Tested"
                      icon={
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                        </svg>
                      }
                      value="18"
                    />
                    <StatCard
                      label="Best Score"
                      icon={
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                          <path d="M4 22h16" />
                          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                          <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
                        </svg>
                      }
                      value="0.91"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default F1Mode;