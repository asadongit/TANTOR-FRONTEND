import React, { useState, useRef } from 'react';
import InfoIcons from '../../../../assets/ai/infoIcon.svg';

const FieldTooltip = ({ lines, position = 'right' }) => {
  const [visible, setVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);

  const TOOLTIP_WIDTH = 288;

  const showTooltip = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const rawLeft = position === 'left' ? rect.right - TOOLTIP_WIDTH : rect.left;
      const maxLeft = Math.max(8, window.innerWidth - TOOLTIP_WIDTH - 8);
      const clampedLeft = Math.min(Math.max(8, rawLeft), maxLeft);

      setTooltipPos({
        top: rect.bottom + 8,
        left: clampedLeft,
      });
    }
    setVisible(true);
  };

  const arrowStyle = position === 'left'
    ? { right: '0.375rem', top: '-0.375rem' }
    : { left: '0.75rem', top: '-0.375rem' };

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={buttonRef}
        type="button"
        className="ml-1.5 text-gray-400 hover:text-gray-500 focus:outline-none flex-shrink-0"
        onMouseEnter={showTooltip}
        onMouseLeave={() => setVisible(false)}
        tabIndex={-1}
        aria-label="Field information"
      >
        <img
          src={InfoIcons}
          alt="info"
          style={{
            width: 12,
            height: 12,
            filter: 'brightness(0) saturate(100%) invert(54%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(88%)'
          }}
        />
      </button>

      {visible && (
        <div
          className="fixed w-72 bg-[#332849] text-white text-xs p-3 rounded-lg shadow-xl z-[10000] space-y-1.5"
          style={{ top: `${tooltipPos.top}px`, left: `${tooltipPos.left}px`, pointerEvents: 'none' }}
        >
          {lines.map((line, i) =>
            line.bold
              ? <p key={i}><strong>{line.bold}</strong>{line.rest}</p>
              : <p key={i}>{line}</p>
          )}
          <div
            className="absolute w-3 h-3 bg-[#332849] rotate-45 rounded-sm"
            style={arrowStyle}
          />
        </div>
      )}
    </div>
  );
};

export default FieldTooltip;
