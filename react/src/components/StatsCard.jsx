// components/StatsCard.jsx
import React from 'react';

const StatsCard = ({ title, value, icon: IconComponent, iconColor = 'text-gray-600', trend, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {IconComponent && <IconComponent className={iconColor} size={20} />}
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        </div>
      </div>
      
      <div className="mb-1">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      
      {trend && (
        <p className="text-xs text-gray-500">{trend}</p>
      )}
    </div>
  );
};

export default StatsCard;