import React from 'react';

const DataCard = ({ title, viewAllHref, children }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <a href={viewAllHref} className="text-blue-500 hover:text-blue-700 text-sm font-medium">
          View All
        </a>
      </div>
      <div>
        {children}
      </div>
    </div>
  );
};

export default DataCard;