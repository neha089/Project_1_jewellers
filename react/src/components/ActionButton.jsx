import React from 'react';

const ActionButton = ({ icon: Icon, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-gray-50 hover:bg-blue-500 hover:text-white text-gray-700 p-4 rounded-lg text-center transition-all border border-gray-200 hover:border-blue-500 text-sm font-medium"
    >
      <Icon className="mx-auto mb-2" size={20} />
      <div>{label}</div>
    </button>
  );
};

export default ActionButton;