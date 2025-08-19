import React from 'react';
import { ArrowUp, AlertTriangle } from 'lucide-react';

const StatsCard = ({ title, value, change, icon: Icon, iconBg, changeType }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${iconBg}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className={`flex items-center gap-1 text-sm font-medium ${
        changeType === 'positive' ? 'text-green-600' : 
        changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
      }`}>
        {changeType === 'positive' && <ArrowUp size={14} />}
        {changeType === 'negative' && <AlertTriangle size={14} />}
        <span>{change}</span>
      </div>
    </div>
  );
};

export default StatsCard;