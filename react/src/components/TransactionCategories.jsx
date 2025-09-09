// TransactionCategories.js
import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Coins,
  Gem,
  CreditCard,
  Banknote,
  FileText,
} from "lucide-react";

// Transaction categories
const incomeCategories = [
  { id: "gold-sell", label: "Gold Sale", icon: Coins, color: "amber", shortLabel: "Gold Sale" },
  { id: "silver-sell", label: "Silver Sale", icon: Gem, color: "slate", shortLabel: "Silver Sale" },
  {
    id: "interest-received-gl",
    label: "Interest Received GoldLoan",
    icon: TrendingUp,
    color: "green",
    shortLabel: "Gold Interest"
  },
  {
    id: "interest-received-l",
    label: "Interest Received Loan",
    icon: TrendingUp,
    color: "pink",
    shortLabel: "Loan Interest"
  },
  {
    id: "loan-repayment",
    label: "Loan Repayment",
    icon: CreditCard,
    color: "blue",
    shortLabel: "Loan Repay"
  },
  {
    id: "gold-loan-repayment",
    label: "Gold Loan Repayment",
    icon: CreditCard,
    color: "purple",
    shortLabel: "Gold Repay"
  },
  {
    id: "udhari-received",
    label: "Udhari Payment Received",
    icon: Banknote,
    color: "emerald",
    shortLabel: "Udhari Received"
  },
];

const expenseCategories = [
  { id: "gold-loan", label: "Gold Loan Given", icon: Coins, color: "amber", shortLabel: "Gold Loan" },
  {
    id: "udhari-given",
    label: "Udhari Given to Customer",
    icon: Banknote,
    color: "red",
    shortLabel: "Udhari Given"
  },
  {
    id: "business-loan-taken",
    label: "Business Loan Taken",
    icon: CreditCard,
    color: "orange",
    shortLabel: "Loan Taken"
  },
  {
    id: "business-loan-given",
    label: "Business Loan Given",
    icon: CreditCard,
    color: "purple",
    shortLabel: "Loan Given"
  },
  {
    id: "gold-purchase",
    label: "Gold Purchase on Credit",
    icon: Gem,
    color: "indigo",
    shortLabel: "Gold Purchase"
  },
  {
    id: "silver-purchase",
    label: "Silver Purchase on Credit",
    icon: Gem,
    color: "gray",
    shortLabel: "Silver Purchase"
  },
  {
    id: "business-expense",
    label: "Business Expense",
    icon: FileText,
    color: "slate",
    shortLabel: "Expense"
  },
];

const TransactionTypeSelection = ({
  selectedCustomer,
  onSelectType,
  onBack,
  onCancel,
}) => (
  <div className="max-w-2xl mx-auto">
     <div className="flex justify-between items-center">
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
      >
        ← Back to Search
      </button>
      <button
        onClick={onCancel}
        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
    </div>
    <div className="text-center mb-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        Transaction for: {selectedCustomer?.name}
      </h3>
      <p className="text-gray-600">Select transaction type to continue</p>
    </div>

    <div className="grid grid-cols-2 gap-6 mb-8">
      <button
        onClick={() => onSelectType("income")}
        className="group relative p-8 bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 border-2 border-emerald-200 rounded-2xl hover:border-emerald-400 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-green-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        <div className="relative">
          <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
            <TrendingUp size={32} className="text-white" />
          </div>
          <h4 className="text-xl font-bold text-emerald-900 mb-2">Income</h4>
          <p className="text-emerald-700 text-sm">
            Money received from sales, interest, repayments
          </p>
        </div>
      </button>

      <button
        onClick={() => onSelectType("expense")}
        className="group relative p-8 bg-gradient-to-br from-rose-50 via-red-50 to-rose-100 border-2 border-rose-200 rounded-2xl hover:border-rose-400 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-rose-400/10 to-red-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        <div className="relative">
          <div className="w-16 h-16 mx-auto mb-4 bg-rose-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
            <TrendingDown size={32} className="text-white" />
          </div>
          <h4 className="text-xl font-bold text-rose-900 mb-2">Expense</h4>
          <p className="text-rose-700 text-sm">
            Money spent on loans, purchases, udhari
          </p>
        </div>
      </button>
    </div>

   
  </div>
);

const CategorySelection = ({
  transactionType,
  onSelectCategory,
  onBack,
  onCancel,
}) => {
  const categories =
    transactionType === "income" ? incomeCategories : expenseCategories;

  const getColorClasses = (color) => ({
    bg: `bg-${color}-50`,
    border: `border-${color}-200`,
    hoverBorder: `hover:border-${color}-400`,
    text: `text-${color}-900`,
    icon: `text-${color}-600`,
    gradient: `bg-gradient-to-br from-${color}-500 to-${color}-600`
  });

  return (
    <div className="max-w-6xl mx-auto">
      
         <div className="flex justify-between items-center mt-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ← Back to Transaction Type
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
          
        

      {/* All Categories - Compact List */}
      {categories.length > 4 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4">All Categories</h4>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              const colors = getColorClasses(category.color);
              
              return (
                <button
                  key={category.id}
                  onClick={() => onSelectCategory(category)}
                  className={`group flex items-center p-3 ${colors.bg} border ${colors.border} ${colors.hoverBorder} rounded-lg transition-all duration-200 hover:shadow-sm text-left`}
                >
                  <div className={`w-10 h-10 mr-3 ${colors.gradient} rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className={`font-medium ${colors.text} text-sm`}>
                      {category.shortLabel}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {category.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

     
    </div>
  );
};

export {
  TransactionTypeSelection,
  CategorySelection,
  incomeCategories,
  expenseCategories,
};