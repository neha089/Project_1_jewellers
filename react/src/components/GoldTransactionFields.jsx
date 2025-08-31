import React, { useEffect } from "react";

const GoldTransactionFields = ({ 
  transactionData, 
  errors, 
  loading, 
  onChange, 
  metalType,
  currentGoldPrice 
}) => {
  
  // Auto-calculate amount when weight, rate, or purity changes
  useEffect(() => {
    if (transactionData.goldWeight && transactionData.goldRate && currentGoldPrice) {
      const weight = parseFloat(transactionData.goldWeight) || 0;
      const rate = parseFloat(transactionData.goldRate) || currentGoldPrice.pricePerGram;
      const purity = parseFloat(transactionData.goldPurity) || 916;
      
      // Calculate amount: weight * rate * purity factor
      const purityFactor = purity / 1000; // Convert 916 to 0.916
      const calculatedAmount = weight * rate * purityFactor;
      
      // Update amount if it's significantly different
      const currentAmount = parseFloat(transactionData.amount) || 0;
      if (Math.abs(calculatedAmount - currentAmount) > 1) {
        const event = {
          target: {
            name: 'amount',
            value: calculatedAmount.toFixed(2)
          }
        };
        onChange(event);
      }
    }
  }, [transactionData.goldWeight, transactionData.goldRate, transactionData.goldPurity, currentGoldPrice]);

  // Update gold rate when current price is available
  useEffect(() => {
    if (currentGoldPrice && !transactionData.goldRate) {
      const event = {
        target: {
          name: 'goldRate',
          value: currentGoldPrice.pricePerGram.toFixed(2)
        }
      };
      onChange(event);
    }
  }, [currentGoldPrice]);

  return (
    <div className="space-y-4">
      {currentGoldPrice && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-yellow-800">Current {metalType} Price:</span>
            <span className="text-yellow-700">₹{currentGoldPrice.pricePerGram.toFixed(2)}/gram (24K)</span>
          </div>
          <div className="text-xs text-yellow-600 mt-1">
            Last updated: {new Date(currentGoldPrice.lastUpdated).toLocaleString()}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {metalType} Weight (grams) *
          </label>
          <input
            type="number"
            step="0.1"
            name="goldWeight"
            value={transactionData.goldWeight}
            onChange={onChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.goldWeight ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="Enter weight"
            disabled={loading}
          />
          {errors.goldWeight && (
            <p className="text-red-500 text-xs mt-1">{errors.goldWeight}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {metalType} Type
          </label>
          <select
            name="goldType"
            value={transactionData.goldType}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="24K">24K {metalType}</option>
            <option value="22K">22K {metalType}</option>
            <option value="18K">18K {metalType}</option>
            <option value="14K">14K {metalType}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {metalType} Rate (₹/gram)
            {currentGoldPrice && (
              <span className="text-xs text-blue-600 block">Live rate applied</span>
            )}
          </label>
          <input
            type="number"
            name="goldRate"
            value={transactionData.goldRate}
            onChange={onChange}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              currentGoldPrice ? "bg-blue-50" : ""
            }`}
            placeholder={`Current ${metalType.toLowerCase()} rate`}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Purity
          </label>
          <input
            type="text"
            name="goldPurity"
            value={transactionData.goldPurity}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="916"
            disabled={loading}
          />
        </div>
      </div>

      {transactionData.goldWeight && transactionData.goldRate && (
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-sm text-blue-800">
            <strong>Calculated Value:</strong> {transactionData.goldWeight}g × ₹{transactionData.goldRate}/g × {(parseFloat(transactionData.goldPurity) || 916) / 1000} = ₹{((parseFloat(transactionData.goldWeight) || 0) * (parseFloat(transactionData.goldRate) || 0) * ((parseFloat(transactionData.goldPurity) || 916) / 1000)).toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoldTransactionFields;