import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const SStatsCards = ({ summary }) => {
  // Function to format large numbers (K, L, Cr)
  const formatAmount = (amount) => {
    const absAmount = Math.abs(amount);
    
    if (absAmount >= 10000000) { // 1 crore
      return `${(amount / 10000000).toFixed(2)}Cr`;
    } else if (absAmount >= 100000) { // 1 lakh
      return `${(amount / 100000).toFixed(2)}L`;
    } else if (absAmount >= 1000) { // 1 thousand
      return `${(amount / 1000).toFixed(1)}K`;
    } else {
      return amount.toFixed(2);
    }
  };

  // Function to get full formatted amount with currency symbol
  const getFormattedAmount = (amount) => {
    return `₹${formatAmount(amount || 0)}`;
  };

  // Function to get tooltip with exact amount
  const getTooltipAmount = (amount) => {
    return `₹${(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="grid grid-cols-3 md:grid-cols-3 gap-6 mb-6">
      {/* Total Purchases */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <div className="p-3 bg-green-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm text-gray-600">Total Purchases</p>
            <p 
              className="text-2xl font-bold text-gray-900"
              title={getTooltipAmount(summary.totalBuy)}
            >
              {getFormattedAmount(summary.totalBuy)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Total Sales */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <div className="p-3 bg-blue-100 rounded-lg">
            <TrendingDown className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm text-gray-600">Total Sales</p>
            <p 
              className="text-2xl font-bold text-gray-900"
              title={getTooltipAmount(summary.totalSell)}
            >
              {getFormattedAmount(summary.totalSell)}
            </p>
          </div>
        </div>
      </div>

      {/* Net Profit */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <div className="p-3 bg-gray-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-gray-700" />
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm text-gray-600">Net Profit</p>
            <p 
              className={`text-2xl font-bold ${
                (summary.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
              title={getTooltipAmount(summary.netProfit)}
            >
              {getFormattedAmount(summary.netProfit)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SStatsCards;
