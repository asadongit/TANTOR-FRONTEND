import React from 'react';
import BatchIcon from '../../../../../assets/ai/workspace_premium.svg';
import { aithemestyle, tw } from '../../../../../components/themeContext';

const cardBase = "bg-white rounded-xl px-4 py-3 border border-[#e5e7eb] overflow-hidden";
const cardStyle = { flex: '1 1 0', minWidth: 0, maxWidth: '33.333%' };

const BestModelCard = ({ bestModel }) => {
  const metricName = bestModel?.metricName || 'Accuracy';

  return (
    <div
      className={`rounded-2xl p-4 flex items-stretch gap-3 mb-6`}
      style={{ display: 'flex', gap: '12px', alignItems: 'stretch', background: aithemestyle.statsCardGradient}}
    >
      {/* Col 1: Best Model label */}
      <div className={`${cardBase} flex items-center gap-3`} style={cardStyle}>
        <div
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: '#FFF8F2' }}
        >
          <img
  src={BatchIcon}
  alt="Best Model"
  className="w-4 h-4"
  style={{ filter: 'brightness(0) saturate(100%) invert(62%) sepia(67%) saturate(487%) hue-rotate(346deg) brightness(97%) contrast(89%)' }}
/>
        </div>
        <div className="min-w-0">
          <p className={`${tw.sectionHeading} text-[#E08E40]`}>Best Model</p>
          <p className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">
            Based on {metricName.toLowerCase() === 'log loss' ? 'lowest' : 'highest'} train {metricName.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Col 2: Model name */}
      <div className={`${cardBase} flex items-center`} style={cardStyle}>
        <div style={{ minWidth: 0, width: '100%' }}>
          <p className="text-xs text-gray-500 mb-0.5">Model</p>
          <p
            className="text-sm font-medium text-gray-800"
            title={bestModel?.name}
            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
          >
            {bestModel?.name || 'N/A'}
          </p>
        </div>
      </div>

      {/* Col 3: Metric value */}
      <div className={`${cardBase} flex items-center`} style={cardStyle}>
        <div style={{ minWidth: 0, width: '100%' }}>
          <p className="text-xs text-gray-500 mb-1">{metricName}</p>
          <p className={`${tw.sectionHeading} text-2xl text-gray-900`}>{bestModel?.value || '0%'}</p>
        </div>
      </div>
    </div>
  );
};

export default BestModelCard;