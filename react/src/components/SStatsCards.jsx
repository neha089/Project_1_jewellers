import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const SStatsCards = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <div className="p-3 bg-green-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">Total Purchases</p>
            <p className="text-2xl font-bold text-gray-900">₹{summary.totalBuy.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <div className="p-3 bg-blue-100 rounded-lg">
            <TrendingDown className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">Total Sales</p>
            <p className="text-2xl font-bold text-gray-900">₹{summary.totalSell.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <div className="p-3 bg-gray-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-gray-700" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">Net Profit</p>
            <p className={`text-2xl font-bold ${
              summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ₹{summary.netProfit.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SStatsCards;