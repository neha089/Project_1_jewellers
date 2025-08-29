import React from 'react';
import { 
  Coins, 
  Gem, 
  TrendingUp, 
  CreditCard, 
  Banknote, 
  ShoppingCart,
  Calculator
} from 'lucide-react';

// Define categories based on your backend models
const incomeCategories = [
  {
    id: 'GOLD_SALE',
    label: 'Gold Sale',
    icon: Coins,
    color: 'amber',
    description: 'Sell gold jewelry to customer',
    hasGoldDetails: true
  },
  {
    id: 'SILVER_SALE',
    label: 'Silver Sale',
    icon: Gem,
    color: 'slate',
    description: 'Sell silver jewelry to customer',
    hasGoldDetails: true,
    metal: 'SILVER'
  },
  {
    id: 'GOLD_LOAN_PAYMENT',
    label: 'Gold Loan Interest',
    icon: Calculator,
    color: 'green',
    description: 'Interest received from gold loans'
  },
  {
    id: 'LOAN_PAYMENT',
    label: 'Cash Loan Interest',
    icon: TrendingUp,
    color: 'emerald',
    description: 'Interest from cash loans given'
  },
  {
    id: 'GOLD_LOAN_CLOSURE',
    label: 'Gold Loan Repayment',
    icon: CreditCard,
    color: 'blue',
    description: 'Principal repayment of gold loans'
  },
  {
    id: 'LOAN_CLOSURE',
    label: 'Cash Loan Repayment',
    icon: CreditCard,
    color: 'indigo',
    description: 'Principal repayment of cash loans'
  },
  {
    id: 'UDHARI_RECEIVED',
    label: 'Udhari Return',
    icon: Banknote,
    color: 'purple',
    description: 'Money received back from udhari'
  }
];

const expenseCategories = [
  {
    id: 'GOLD_LOAN_DISBURSEMENT',
    label: 'Gold Loan Given',
    icon: Coins,
    color: 'amber',
    description: 'Give loan against gold pledge',
    hasGoldDetails: true,
    isLoan: true
  },
  {
    id: 'LOAN_DISBURSEMENT',
    label: 'Cash Loan Given',
    icon: CreditCard,
    color: 'blue',
    description: 'Give cash loan with monthly interest',
    isLoan: true
  },
  {
    id: 'UDHARI_GIVEN',
    label: 'Udhari Given',
    icon: Banknote,
    color: 'red',
    description: 'Give money without interest (udhari)',
    isUdhari: true
  },
  {
    id: 'GOLD_PURCHASE',
    label: 'Gold Purchase',
    icon: ShoppingCart,
    color: 'yellow',
    description: 'Purchase gold items',
    hasGoldDetails: true,
    isPurchase: true
  },
  {
    id: 'SILVER_PURCHASE',
    label: 'Silver Purchase',
    icon: ShoppingCart,
    color: 'gray',
    description: 'Purchase silver items',
    hasGoldDetails: true,
    isPurchase: true,
    metal: 'SILVER'
  },
  {
    id: 'INTEREST_PAID',
    label: 'Interest Paid',
    icon: TrendingUp,
    color: 'orange',
    description: 'Interest paid to suppliers/other jewelers'
  }
];

const CategorySelection = ({ transactionType, onCategorySelect, onBack, onCancel }) => {
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
              onClick={() => onCategorySelect(category)}
              className={`p-6 bg-${category.color}-50 border-2 border-${category.color}-200 rounded-xl hover:border-${category.color}-300 transition-all group text-left hover:shadow-md`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 bg-${category.color}-100 rounded-lg group-hover:scale-110 transition-transform`}>
                  <Icon size={24} className={`text-${category.color}-600`} />
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold text-${category.color}-900 mb-2`}>
                    {category.label}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {category.description}
                  </p>
                  {category.isLoan && (
                    <div className="mt-2 text-xs text-gray-500 bg-gray-100 rounded px-2 py-1 inline-block">
                      With Interest
                    </div>
                  )}
                  {category.isUdhari && (
                    <div className="mt-2 text-xs text-gray-500 bg-gray-100 rounded px-2 py-1 inline-block">
                      Without Interest
                    </div>
                  )}
                  {category.hasGoldDetails && (
                    <div className="mt-2 text-xs text-gray-500 bg-gray-100 rounded px-2 py-1 inline-block">
                      Weight & Purity
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between items-center mt-8">
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

export default CategorySelection;

