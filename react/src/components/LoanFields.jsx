import React from "react";

const LoanFields = ({ transactionData, loading, onChange }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Loan Details</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Interest Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interest Rate (% per month)
          </label>
          <input
            type="number"
            name="interestRate"
            value={transactionData.interestRate}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            placeholder="2.5"
            min="0"
            max="10"
            step="0.1"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Monthly interest rate (e.g., 2.5% per month)
          </p>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (months)
          </label>
          <select
            name="durationMonths"
            value={transactionData.durationMonths}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            disabled={loading}
          >
            <option value="3">3 Months</option>
            <option value="6">6 Months</option>
            <option value="9">9 Months</option>
            <option value="12">12 Months</option>
            <option value="18">18 Months</option>
            <option value="24">24 Months</option>
            <option value="36">36 Months</option>
            <option value="48">48 Months</option>
            <option value="60">60 Months</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Loan duration for reference
          </p>
        </div>
      </div>

      {/* Loan Summary */}
      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
        <h5 className="text-sm font-medium text-indigo-800 mb-2">Loan Summary</h5>
        <div className="space-y-1 text-xs text-indigo-700">
          <div className="flex justify-between">
            <span>Principal Amount:</span>
            <span>₹{transactionData.amount ? parseFloat(transactionData.amount).toFixed(2) : '0.00'}</span>
          </div>
          <div className="flex justify-between">
            <span>Monthly Interest ({transactionData.interestRate}%):</span>
            <span>
              ₹{transactionData.amount && transactionData.interestRate ? 
                (parseFloat(transactionData.amount) * parseFloat(transactionData.interestRate) / 100).toFixed(2) : 
                '0.00'
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span>Duration:</span>
            <span>{transactionData.durationMonths} months</span>
          </div>
          <div className="flex justify-between font-medium border-t border-indigo-300 pt-1">
            <span>Total Interest (approx.):</span>
            <span>
              ₹{transactionData.amount && transactionData.interestRate && transactionData.durationMonths ? 
                (parseFloat(transactionData.amount) * parseFloat(transactionData.interestRate) * parseInt(transactionData.durationMonths) / 100).toFixed(2) : 
                '0.00'
              }
            </span>
          </div>
        </div>
        
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          <strong>Note:</strong> Interest is calculated monthly on the outstanding principal amount. 
          Partial payments will reduce the principal, and future interest will be calculated on the reduced amount.
        </div>
      </div>
    </div>
  );
};

export default LoanFields;
