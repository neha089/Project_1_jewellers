import React, { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import TransactionModal from './TransactionModal';

const QuickTransactionEntry = ({ onAddTransaction }) => {
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  return (
    <>
      <div className="bg-white mx-6 rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center mb-6">
          <div className="bg-slate-100 p-2.5 rounded-full mr-3">
            <Plus className="text-slate-600" size={18} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Quick Transaction Entry</h3>
        </div>
        
        <div className="grid grid-cols-12 gap-4 items-end">
          {/* Customer/Description Field */}
          <div className="col-span-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Customer/Description
            </label>
            <input
              type="text"
              placeholder="Enter customer name or description"
              className="w-full p-3 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
              disabled
            />
          </div>
          
          {/* Amount Field */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Amount (₹)
            </label>
            <input
              type="text"
              placeholder="0.00"
              className="w-full p-3 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
              disabled
            />
          </div>
          
          {/* Category Field */}
          <div className="col-span-3">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Category
            </label>
            <div className="relative">
              <select 
                className="w-full p-3 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-400 cursor-not-allowed appearance-none" 
                disabled
              >
                <option>Loan Payment</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="col-span-3 flex gap-3">
            {/* Income Button */}
            <button
              onClick={() => setShowIncomeModal(true)}
              className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
              title="Add Income"
            >
              <TrendingUp size={18} />
            </button>
            
            {/* Expense Button */}
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex-1 h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
              title="Add Expense"
            >
              <TrendingDown size={18} />
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <span className="font-medium">Note:</span> Use the action buttons to open detailed forms for adding income or expense transactions.
        </div>
      </div>

      <TransactionModal
        isOpen={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        type="income"
        onAddTransaction={onAddTransaction}
      />

      <TransactionModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        type="expense"
        onAddTransaction={onAddTransaction}
      />
    </>
  );
};

export default QuickTransactionEntry;
