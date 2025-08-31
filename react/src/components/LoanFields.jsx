import React from "react";

const LoanFields = ({ transactionData, loading, onChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Interest Rate (% per month)
        </label>
        <input
          type="number"
          step="0.1"
          name="interestRate"
          value={transactionData.interestRate}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="2.5"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Duration (months)
        </label>
        <select
          name="durationMonths"
          value={transactionData.durationMonths}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="3">3 Months</option>
          <option value="6">6 Months</option>
          <option value="9">9 Months</option>
          <option value="12">12 Months</option>
          <option value="18">18 Months</option>
          <option value="24">24 Months</option>
        </select>
      </div>
    </div>
  );
};

export default LoanFields;