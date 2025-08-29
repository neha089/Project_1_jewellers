// TransactionCategories.js
import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Coins,
  Gem,
  CreditCard,
  Banknote,
  FileText
} from 'lucide-react';

// Transaction categories
const incomeCategories = [
  { id: 'gold-sell', label: 'Gold Sale', icon: Coins, color: 'amber' },
  { id: 'silver-sell', label: 'Silver Sale', icon: Gem, color: 'slate' },
  { id: 'interest-received', label: 'Interest Received', icon: TrendingUp, color: 'green' },
  { id: 'loan-repayment', label: 'Loan Repayment', icon: CreditCard, color: 'blue' },
  { id: 'udhari-received', label: 'Udhari Payment Received', icon: Banknote, color: 'emerald' }
];

const expenseCategories = [
  { id: 'gold-loan', label: 'Gold Loan Given', icon: Coins, color: 'amber' },
  { id: 'udhari-given', label: 'Udhari Given to Customer', icon: Banknote, color: 'red' },
  { id: 'business-loan-taken', label: 'Business Loan Taken', icon: CreditCard, color: 'orange' },
  { id: 'business-loan-given', label: 'Business Loan Given', icon: CreditCard, color: 'purple' },
  { id: 'gold-purchase', label: 'Gold Purchase on Credit', icon: Gem, color: 'indigo' },
  { id: 'silver-purchase', label: 'Silver Purchase on Credit', icon: Gem, color: 'gray' },
  { id: 'business-expense', label: 'Business Expense', icon: FileText, color: 'slate' }
];

const TransactionTypeSelection = ({ selectedCustomer, onSelectType, onBack, onCancel }) => (
  <div className="space-y-6">
    <div className="text-center">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Transaction for: {selectedCustomer?.name}
      </h3>
      <p className="text-gray-500">Select transaction type</p>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={() => onSelectType('income')}
        className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-xl hover:border-emerald-300 transition-all group"
      >
        <TrendingUp size={32} className="mx-auto text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
        <h4 className="font-semibold text-emerald-900 mb-2">Income</h4>
        <p className="text-sm text-emerald-700">Sales, interest, loan repayments</p>
      </button>

      <button
        onClick={() => onSelectType('expense')}
        className="p-6 bg-gradient-to-br from-rose-50 to-rose-100 border-2 border-rose-200 rounded-xl hover:border-rose-300 transition-all group"
      >
        <TrendingDown size={32} className="mx-auto text-rose-600 mb-3 group-hover:scale-110 transition-transform" />
        <h4 className="font-semibold text-rose-900 mb-2">Expense</h4>
        <p className="text-sm text-rose-700">Loans given, purchases, udhari</p>
      </button>
    </div>

    <div className="flex justify-between items-center mt-6">
      <button
        onClick={onBack}
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

const CategorySelection = ({ transactionType, onSelectCategory, onBack, onCancel }) => {
  const categories = transactionType === 'income' ? incomeCategories : expenseCategories;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Select {transactionType === 'income' ? 'Income' : 'Expense'} Category
        </h3>
        <p className="text-gray-500">Choose the type of transaction</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(category => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category)}
              className={`p-4 bg-${category.color}-50 border-2 border-${category.color}-200 rounded-xl hover:border-${category.color}-300 transition-all group text-left`}
            >
              <Icon size={24} className={`text-${category.color}-600 mb-3 group-hover:scale-110 transition-transform`} />
              <h4 className={`font-semibold text-${category.color}-900 mb-1`}>{category.label}</h4>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between items-center mt-6">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          ← Back to Transaction Type
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

export { TransactionTypeSelection, CategorySelection, incomeCategories, expenseCategories };