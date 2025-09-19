import React from 'react';

const MetalRatesDisplay = ({ rates, metal }) => {
  if (!rates || Object.keys(rates).length === 0) {
    return null;
  }

  // Conditionally set background color based on the metal type
  const bgColor = metal.toLowerCase() === 'silver' ? 'bg-gray-700' : 'bg-amber-600';

  return (
    <div className={`${bgColor} to-gray-900 rounded-lg p-6 mb-6 text-white`}>
      <h3 className="text-lg font-semibold mb-4">Today's {metal} Rates</h3>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {Object.entries(rates).map(([type, rate]) => (
          <div key={type} className="text-center">
            <p className="text-sm opacity-80">{type}</p>
            <p className="text-xl font-bold">₹{rate}/g</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MetalRatesDisplay;
