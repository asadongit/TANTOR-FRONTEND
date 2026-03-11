import { useEffect, useRef, useState } from 'react';
import FinishIcon from '../../../assets/ai/sports_score.svg';
import FlagIconSvg from '../../../assets/ai/icon-race.svg';

const TRACK_D =
    'M 200 320 ' +
    'C 100 320, 60 265, 60 200 ' +
    'C 60 130, 115 80, 205 72 ' +
    'L 655 72 ' +
    'C 745 80, 800 130, 800 200 ' +
    'C 800 265, 760 320, 660 320 ' +
    'L 200 320 Z';

const T_OFFSETS = [0.00, 0.12, 0.22, 0.32, 0.42, 0.52, 0.62, 0.71, 0.78];
const LABELS = ['Start', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'Finish'];
const TOTAL_STOPS = 9;

const R = 26;
const CLR_FUTURE = '#D54B49';
const CLR_PASSED = '#380604';
const BDR_COLOR = '#E78583';

const PROGRESS_TO_NODE = { 38: 1, 42: 2, 58: 3, 67: 4, 76: 5, 85: 6, 90: 7, 100: 8 };

function FlagIcon({ cx, cy }) {
    const iconSize = 28;
    const pinW = 44;
    const pinH = 52;
    const fx = cx - pinW / 2;
    const fy = cy - 80;
    const gradId = `flagGrad_${cx}`;

    return (
        <g>
            <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#BA0000" />
                    <stop offset="60%" stopColor="#B30101" />
                    <stop offset="100%" stopColor="#8D0000" />
                </linearGradient>
            </defs>
            <line
                x1={cx} y1={fy + pinH}
                x2={cx} y2={cy - R}
                stroke="rgba(230,230,230,0.75)" strokeWidth="1.8"
            />
            <path
                d={`
                    M ${fx + 8} ${fy}
                    H ${fx + pinW - 8}
                    Q ${fx + pinW} ${fy} ${fx + pinW} ${fy + 8}
                    V ${fy + pinH - 14}
                    Q ${fx + pinW} ${fy + pinH - 6} ${fx + pinW / 2 + 6} ${fy + pinH - 6}
                    L ${fx + pinW / 2} ${fy + pinH}
                    L ${fx + pinW / 2 - 6} ${fy + pinH - 6}
                    Q ${fx} ${fy + pinH - 6} ${fx} ${fy + pinH - 14}
                    V ${fy + 8}
                    Q ${fx} ${fy} ${fx + 8} ${fy}
                    Z
                `}
                fill={`url(#${gradId})`}
                filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.4))"
            />
            <path
                d={`
                    M ${fx + 8} ${fy}
                    H ${fx + pinW - 8}
                    Q ${fx + pinW} ${fy} ${fx + pinW} ${fy + 8}
                    V ${fy + 16}
                    Q ${fx} ${fy + 16} ${fx} ${fy + 8}
                    Q ${fx} ${fy} ${fx + 8} ${fy}
                    Z
                `}
                fill="rgba(255,231,231,0.15)"
            />
            <image
                href={FlagIconSvg}
                x={cx - iconSize / 2}
                y={fy + (pinH - 14) / 2 - iconSize / 2}
                width={iconSize}
                height={iconSize}
            />
        </g>
    );
}

function NodeTooltip({ cx, cy, data, visible }) {
    if (!visible || !data) return null;

    const { step_time, completed, message } = data;
    const hasCompleted = completed && (Array.isArray(completed) ? completed.length > 0 : completed.trim() !== '');
    const completedList = Array.isArray(completed) ? completed : completed?.split(',').map(s => s.trim()).filter(Boolean);

    const W = 180;
    const H = hasCompleted ? Math.min(20 + (completedList?.length || 0) * 18 + 44, 160) : 60;

    const tx = cx > 650 ? cx - W - 10 : cx - W / 2;
    const ty = cy - H - R - 14;

    return (
        <foreignObject x={tx} y={ty} width={W} height={H + 20} style={{ overflow: 'visible', pointerEvents: 'none' }}>
            <div
                xmlns="http://www.w3.org/1999/xhtml"
                style={{
                    background: 'rgba(10, 2, 2, 0.92)',
                    border: '1px solid rgba(189, 102, 101, 0.6)',
                    borderRadius: 8,
                    padding: '8px 10px',
                    color: '#fff',
                    fontFamily: 'Satoshi, sans-serif',
                    fontSize: 12,
                    lineHeight: 1.5,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    width: W,
                    pointerEvents: 'none',
                }}
            >
                {/* Step time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: hasCompleted ? 5 : 0 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(231,133,131,0.9)" strokeWidth="2.2">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span style={{ color: 'rgba(255,255,255,0.55)', marginRight: 3 }}>Step time:</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>
                        {typeof step_time === 'number' ? `${step_time.toFixed(2)}s` : '—'}
                    </span>
                </div>

                {/* Completed items */}
                {hasCompleted && (
                    <div>
                        <div style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 3, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Completed
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {completedList.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{
                                        width: 5, height: 5, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #D30101, #6D0101)',
                                        flexShrink: 0,
                                    }} />
                                    <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </foreignObject>
    );
}

export function RaceTrack({ activeNodeIndex = 0, isFinished = false, stageData = {} }) {
    const measRef = useRef(null);
    const [checkpoints, setCheckpoints] = useState([]);
    const [hoveredNode, setHoveredNode] = useState(null);

    useEffect(() => {
        const path = measRef.current;
        if (!path) return;
        const len = path.getTotalLength();
        setCheckpoints(
            T_OFFSETS.map((t, i) => {
                const pt = path.getPointAtLength(t * len);
                return { x: pt.x, y: pt.y, label: LABELS[i] };
            })
        );
    }, []);

    const renderNode = (node, i) => {
        const isStart = i === 0;
        const isFinishNode = i === TOTAL_STOPS - 1;
        const isActive = i === activeNodeIndex;
        const isPassed = i < activeNodeIndex;
        const hasData = !!stageData[i];
        const isInteractable = (isPassed || isActive) && hasData;

        const iconSize = 28;

        const hoverHandlers = isInteractable ? {
            onMouseEnter: () => setHoveredNode(i),
            onMouseLeave: () => setHoveredNode(null),
        } : {};

        const tooltipVisible = hoveredNode === i;

        if (isFinishNode) {
            return (
                <g key={i}>
                    <image
                        href={FinishIcon}
                        x={node.x - iconSize / 2}
                        y={node.y - iconSize / 2}
                        width={iconSize}
                        height={iconSize}
                    />
                    <text x={node.x} y={node.y + iconSize / 2 + 16} textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="12" fontWeight="500">Finish</text>
                </g>
            );
        }

        if (isStart) return (
            <g key={i} style={{ cursor: 'default' }}>
                <line
                    x1={node.x} y1={node.y - 12}
                    x2={node.x} y2={node.y + 12}
                    stroke="rgba(255,255,255,0.85)" strokeWidth="3.5"
                />
                <text x={node.x} y={node.y + 32} textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="12" fontWeight="500">Start</text>
            </g>
        );

        if (isActive) return (
            <g key={i} {...hoverHandlers} style={{ cursor: isInteractable ? 'pointer' : 'default' }}>
                <FlagIcon cx={node.x} cy={node.y} />
                <circle
                    cx={node.x} cy={node.y} r={R}
                    fill={CLR_PASSED} stroke={BDR_COLOR} strokeWidth="2.5"
                />
                {isInteractable && (
                    <circle cx={node.x} cy={node.y} r={R + 4} fill="rgba(231,133,131,0.12)" stroke="transparent" />
                )}
                <text x={node.x} y={node.y + 5} textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontSize="12" fontWeight="600">{node.label}</text>
                <NodeTooltip cx={node.x} cy={node.y} data={stageData[i]} visible={tooltipVisible} />
            </g>
        );

        if (isPassed) return (
            <g key={i} {...hoverHandlers} style={{ cursor: isInteractable ? 'pointer' : 'default' }}>
                <circle
                    cx={node.x} cy={node.y} r={R}
                    fill={CLR_PASSED} stroke={BDR_COLOR} strokeWidth="2.5"
                />
                {isInteractable && hoveredNode === i && (
                    <circle cx={node.x} cy={node.y} r={R + 4} fill="rgba(231,133,131,0.12)" stroke="transparent" />
                )}
                <text
                    x={node.x} y={node.y + 5}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="#ffffff"
                    fontSize="15" fontWeight="600"
                >
                    {node.label}
                </text>
                <NodeTooltip cx={node.x} cy={node.y} data={stageData[i]} visible={tooltipVisible} />
            </g>
        );

        return (
            <g key={i}>
                <circle
                    cx={node.x} cy={node.y} r={R}
                    fill={CLR_FUTURE} stroke={BDR_COLOR} strokeWidth="2.5"
                />
                <text
                    x={node.x} y={node.y + 5}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="#ffffff"
                    fontSize="15" fontWeight="600"
                >
                    {node.label}
                </text>
            </g>
        );
    };

    return (
        <svg viewBox="0 0 860 360" width="100%" className="block overflow-visible">
            <path ref={measRef} d={TRACK_D} style={{ display: 'none' }} />
            <path
                d={TRACK_D}
                fill="none"
                stroke="#8D1718"
                strokeWidth="24"
                strokeLinejoin="round"
            />
            {checkpoints.map((node, i) => renderNode(node, i))}
        </svg>
    );
}

export default RaceTrack;