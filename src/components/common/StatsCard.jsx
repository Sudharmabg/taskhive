import React from 'react';

/**
 * Reusable StatsCard component for displaying metrics
 * Used in dashboard and analytics pages
 */
const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  trend,
  onClick,
  className = '' 
}) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-600 bg-blue-50',
    green: 'bg-green-500 text-green-600 bg-green-50',
    yellow: 'bg-yellow-500 text-yellow-600 bg-yellow-50',
    red: 'bg-red-500 text-red-600 bg-red-50',
    purple: 'bg-purple-500 text-purple-600 bg-purple-50'
  };

  const [bgColor, textColor, lightBg] = colorClasses[color].split(' ');

  return (
    <div 
      className={`bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 ${onClick ? 'cursor-pointer hover:bg-gray-750 transition-colors' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-300">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.isPositive ? '↗' : '↘'} {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-full" style={{ backgroundColor: '#ffc44d20' }}>
            <Icon className="h-6 w-6" style={{ color: '#ffc44d' }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;