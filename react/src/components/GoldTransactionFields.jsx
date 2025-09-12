import React from 'react';
import { TrendingUp, Info } from 'lucide-react';

const GoldTransactionFields = ({ 
  transactionData, 
  errors, 
  loading, 
  onChange, 
  metalType = "Gold",
  currentGoldPrice,
  showRateField = false 
}) => {
  
  // Get purity options based on metal type
  const getPurityOptions = () => {
    if (metalType === "Silver") {
      return [
        { value: "999", label: "999 (99.9%)" },
        { value: "925", label: "925 (92.5%)" },
        { value: "800", label: "800 (80%)" },
      ];
    } else {
      return [
        { value: "24K", label: "24K (99.9%)" },
        { value: "22K", label: "22K (91.6%)" },
        { value: "20K", label: "20K (83.3%)" },
        { value: "18K", label: "18K (75%)" },
        { value: "16K", label: "16K (66.7%)" },
        { value: "14K", label: "14K (58.3%)" },
      ];
    }
  };

  const purityOptions = getPurityOptions();

  // Calculate current market value
  const calculateMarketValue = () => {
    const weight = parseFloat(transactionData.goldWeight) || 0;
    const rate = currentGoldPrice || parseFloat(transactionData.goldRate) || 0;
    return weight * rate;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-6 h-6 ${metalType === 'Silver' ? 'bg-gray-100' : 'bg-yellow-100'} rounded-full flex items-center justify-center`}>
          <div className={`w-3 h-3 ${metalType === 'Silver' ? 'bg-gray-400' : 'bg-yellow-500'} rounded-full`}></div>
        </div>
        <h4 className="text-lg font-semibold text-gray-800">
          {metalType} Transaction Details
        </h4>
      </div>

      {/* Current Price Alert */}
      {currentGoldPrice && (
        <div className={`p-3 rounded-lg border ${metalType === 'Silver' ? 'bg-gray-50 border-gray-200' : 'bg-yellow-50 border-yellow-200'} flex items-center gap-2`}>
          <TrendingUp size={16} className={metalType === 'Silver' ? 'text-gray-600' : 'text-yellow-600'} />
          <span className="text-sm font-medium text-gray-700">
            Current {metalType} Price: ₹{currentGoldPrice.toLocaleString()}/gram
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Weight Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weight (grams) *
          </label>
          <div className="relative">
            <input
              type="number"
              name="goldWeight"
              value={transactionData.goldWeight}
              onChange={onChange}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Enter weight"
              min="0"
              step="0.001"
              disabled={loading}
            />
            <span className="absolute right-3 top-2 text-xs text-gray-500">g</span>
          </div>
          {errors.goldWeight && (
            <p className="text-red-500 text-xs mt-1">{errors.goldWeight}</p>
          )}
        </div>

        {/* Purity Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purity *
          </label>
          <select
            name="goldType"
            value={transactionData.goldType}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={loading}
          >
            {purityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.goldType && (
            <p className="text-red-500 text-xs mt-1">{errors.goldType}</p>
          )}
        </div>

        {/* Rate Field - Only show for sales */}
        {showRateField && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rate per gram (₹) *
            </label>
            <div className="relative">
              <input
                type="number"
                name="goldRate"
                value={transactionData.goldRate}
                onChange={onChange}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Enter rate"
                min="0"
                step="0.01"
                disabled={loading}
              />
              <span className="absolute right-3 top-2 text-xs text-gray-500">₹/g</span>
            </div>
            {errors.goldRate && (
              <p className="text-red-500 text-xs mt-1">{errors.goldRate}</p>
            )}
            
            {/* Rate comparison with current market price */}
            {currentGoldPrice && transactionData.goldRate && (
              <div className="mt-1">
                {parseFloat(transactionData.goldRate) > currentGoldPrice ? (
                  <p className="text-xs text-green-600">
                    ₹{(parseFloat(transactionData.goldRate) - currentGoldPrice).toFixed(2)} above market
                  </p>
                ) : parseFloat(transactionData.goldRate) < currentGoldPrice ? (
                  <p className="text-xs text-red-600">
                    ₹{(currentGoldPrice - parseFloat(transactionData.goldRate)).toFixed(2)} below market
                  </p>
                ) : (
                  <p className="text-xs text-blue-600">At market price</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Market Value Information */}
      {transactionData.goldWeight && currentGoldPrice && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 mb-1">
                Market Value Calculation
              </p>
              <div className="text-xs text-blue-700 space-y-1">
                <div className="flex justify-between">
                  <span>Weight:</span>
                  <span>{transactionData.goldWeight}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Market Rate:</span>
                  <span>₹{currentGoldPrice.toLocaleString()}/g</span>
                </div>
                <div className="flex justify-between font-semibold pt-1 border-t border-blue-300">
                  <span>Market Value:</span>
                  <span>₹{calculateMarketValue().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Notes for Different Transaction Types */}
      <div className="text-xs text-gray-600 space-y-1">
        <p>• Weight should be entered in grams with up to 3 decimal places</p>
        {showRateField && (
          <p>• Rate per gram will be used to calculate the total transaction amount</p>
        )}
        {metalType === "Silver" && (
          <p>• Silver purity is typically measured in parts per thousand (999 = 99.9% pure)</p>
        )}
        {metalType === "Gold" && (
          <p>• Gold purity in karats: 24K is pure gold, 22K is standard jewelry gold</p>
        )}
      </div>
    </div>
  );
};

export default GoldTransactionFields;