import React from 'react';

const GoldRatesDisplay = ({ silverRates }) => {
  if (!silverRates || Object.keys(silverRates).length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-700 to-amber-900 rounded-lg p-6 mb-6 text-white">
      <h3 className="text-lg font-semibold mb-4">Today's Silver Rates</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(silverRates).map(([type, rate]) => (
          <div key={type} className="text-center">
            <p className="text-sm opacity-80">{type}</p>
            <p className="text-xl font-bold">₹{rate}/g</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GoldRatesDisplay;