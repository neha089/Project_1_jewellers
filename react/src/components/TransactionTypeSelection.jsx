import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const TransactionTypeSelection = ({ customer, onTypeSelect, onCancel }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Transaction for: {customer?.name}
        </h3>
        <p className="text-gray-500">Select transaction type</p>
      </div>

      <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
        <button
          onClick={() => onTypeSelect('income')}
          className="p-8 bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-xl hover:border-emerald-300 transition-all group"
        >
          <TrendingUp size={48} className="mx-auto text-emerald-600 mb-4 group-hover:scale-110 transition-transform" />
          <h4 className="font-semibold text-emerald-900 mb-2 text-lg">Income</h4>
          <p className="text-sm text-emerald-700">Money coming in</p>
          <div className="text-xs text-emerald-600 mt-3 space-y-1">
            <div>• Gold/Silver Sales</div>
            <div>• Loan Repayments</div>
            <div>• Interest Received</div>
            <div>• Udhari Returns</div>
          </div>
        </button>

        <button
          onClick={() => onTypeSelect('expense')}
          className="p-8 bg-gradient-to-br from-rose-50 to-rose-100 border-2 border-rose-200 rounded-xl hover:border-rose-300 transition-all group"
        >
          <TrendingDown size={48} className="mx-auto text-rose-600 mb-4 group-hover:scale-110 transition-transform" />
          <h4 className="font-semibold text-rose-900 mb-2 text-lg">Expense</h4>
          <p className="text-sm text-rose-700">Money going out</p>
          <div className="text-xs text-rose-600 mt-3 space-y-1">
            <div>• Gold Loans Given</div>
            <div>• Cash Loans Given</div>
            <div>• Udhari Given</div>
            <div>• Purchases</div>
          </div>
        </button>
      </div>

      <div className="flex justify-between items-center mt-8">
        <button
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          ← Back to Search
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default TransactionTypeSelection;

