import React from 'react';

const DataListItem = ({ icon: Icon, iconBg, primary, secondary, amount, time, badge }) => {
  return (
    <div className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white ${iconBg}`}>
        <Icon size={14} />
      </div>
      <div className="flex-1">
        <div className="font-medium text-gray-900 text-sm mb-0.5">{primary}</div>
        <div className="text-xs text-gray-600">{secondary}</div>
      </div>
      <div className="text-right">
        {amount && <div className="font-semibold text-gray-900 text-sm">{amount}</div>}
        {time && <div className="text-xs text-gray-500">{time}</div>}
        {badge && (
          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
            badge.type === 'overdue' ? 'bg-red-100 text-red-800' :
            badge.type === 'active' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
};

export default DataListItem;