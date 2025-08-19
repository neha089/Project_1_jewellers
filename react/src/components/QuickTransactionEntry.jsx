import React, { useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import TransactionModal from './TransactionModal';
const QuickTransactionEntry = ({ onAddTransaction }) => {
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  return (
    <>
      <div className="bg-white mx-6 rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className="bg-gray-100 p-2 rounded-full mr-3">
            <Plus className="text-gray-600" size={16} />
          </div>
          <h3 className="text-base font-semibold text-gray-800">Quick Transaction Entry</h3>
        </div>
        
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4">
            <input
              type="text"
              placeholder="Enter customer name or description"
              className="w-full p-3 border border-gray-300 rounded-lg text-sm"
              disabled
            />
          </div>
          
          <div className="col-span-2">
            <input
              type="text"
              placeholder="0.00"
              className="w-full p-3 border border-gray-300 rounded-lg text-sm"
              disabled
            />
          </div>
          
          <div className="col-span-3">
            <div className="relative">
              <select className="w-full p-3 border border-gray-300 rounded-lg text-sm appearance-none" disabled>
                <option>Loan Payment</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>
          
          <div className="col-span-2">
            <button
              onClick={() => setShowIncomeModal(true)}
              className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
            >
              + Income
            </button>
          </div>
          
          <div className="col-span-1">
            <button
              onClick={() => setShowExpenseModal(true)}
              className="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium"
            >
              - Expense
            </button>
          </div>
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