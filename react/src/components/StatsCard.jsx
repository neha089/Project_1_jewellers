// components/StatsCard.jsx
import React from 'react';

const StatsCard = ({ title, value, icon: IconComponent, iconColor, trend, subtitle, 
  color = "blue", 
  className = ''  }) => {
   const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    red: "bg-red-50 text-red-600 border-red-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200"
  };
   
  const getIconElement = () => {
    if (!IconComponent) return null;
    
    if (iconColor) {
      return <IconComponent className={iconColor} size={24} />;
    } else {
      return <IconComponent size={24} />;
    }
  };
   
  const getIconContainerClasses = () => {
    if (iconColor) {
      return "p-3 rounded-lg";
    } else {
      return `p-3 rounded-lg border ${colorClasses[color] || colorClasses.gray}`;
    }
  };
  
  return (
   <div className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {(subtitle || trend) && (
            <p className="text-xs text-gray-500 mt-1">{subtitle || trend}</p>
          )}
        </div>
        {IconComponent && (
          <div className={getIconContainerClasses()}>
            {getIconElement()}
          </div>
        )}
      </div>
    </div>
  );
};



export default StatsCard;
