import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Icon } from '@iconify-icon/react';

export const StatCard = ({
  title,
  value,
  icon = 'material-symbols:description-outline',
  trend,
  trendValue,
  onClick,
  isSelected = false,
  variant = 'default',  // 'default' | 'bordered' | 'minimal'
  className = '',
}) => {
  const baseStyles = 'bg-white rounded-xl px-5 py-4 transition-all';

  const variantStyles = {
    default: 'shadow-sm',
    bordered: 'border border-purple-200 shadow-sm',
    minimal: '',
  };

  const selectedStyles = isSelected
    ? 'ring-2 ring-purple-500 shadow-md'
    : 'hover:shadow-md';

  return (
    <div
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${onClick ? `cursor-pointer ${selectedStyles}` : ''} ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={variant === 'bordered' ? 'p-2 bg-purple-50 rounded-lg' : ''}>
            <Icon icon={icon} className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-gray-700 text-sm font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-800">{value}</span>
          {trend && trendValue && (
            <span
              className={`flex items-center text-xs font-medium ${
                trend === 'up' ? 'text-green-600' : 'text-orange-500'
              }`}
            >
              {trend === 'up' ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              )}
              {trendValue}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const LinkCard = ({
  title,
  icon = 'material-symbols:description-outline',
  onClick,
  className = '',
}) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl px-4 py-4 border border-purple-100 shadow-sm flex items-center gap-2 cursor-pointer hover:bg-purple-50 transition-colors whitespace-nowrap ${className}`}
  >
    <Icon icon={icon} className="w-5 h-5 text-purple-600" />
    <span className="text-purple-600 text-sm font-medium">{title}</span>
  </div>
);

export const StatsContainer = ({
  children,
  gradient = 'from-purple-400 via-purple-300 to-purple-200',
  padding = 'p-4',
  className = '',
}) => (
  <div className={`bg-gradient-to-r ${gradient} rounded-2xl ${padding} ${className}`}>
    {children}
  </div>
);

export const StatsGrid = ({
  columns = 5,
  gap = 4,
  children,
  className = '',
}) => (
  <div className={`grid grid-cols-${columns} gap-${gap} ${className}`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
    {children}
  </div>
);

export const StatsRow = ({
  statsCards = [],
  linkCards = [],
  statsGridCols = 'auto',
  variant = 'default',
  gap = 4,
  className = '',
}) => (
  <div className={`flex gap-${gap} items-center ${className}`}>
    {statsCards.length > 0 && (
      <div className={`flex gap-${gap} ${statsGridCols === 'auto' ? 'flex-1' : ''}`}>
        {statsCards.map((card, index) => (
          <StatCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            trend={card.trend}
            trendValue={card.trendValue}
            onClick={card.onClick}
            isSelected={card.isSelected}
            variant={variant}
            className={card.className || 'flex-1'}
          />
        ))}
      </div>
    )}
    {linkCards.length > 0 && (
      <div className={`flex gap-${gap}`}>
        {linkCards.map((card, index) => (
          <LinkCard
            key={index}
            title={card.title}
            icon={card.icon}
            onClick={card.onClick}
            className={card.className}
          />
        ))}
      </div>
    )}
  </div>
);

export default StatCard;
