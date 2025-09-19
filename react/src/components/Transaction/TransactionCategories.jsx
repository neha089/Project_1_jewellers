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
   {
    id: "business-loan-taken",
    label: "Business Loan Taken",
    icon: CreditCard,
    color: "orange",
    shortLabel: "Loan Taken"
  }
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
  }
];

const TransactionTypeSelection = ({
  selectedCustomer,
  onSelectType,
  onBack,
  onCancel,
}) => (
  <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8">
    <div className="max-w-4xl mx-auto">
      {/* Header with navigation */}
      <div className="flex flex-col-2 sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm sm:text-base"
        >
          ← Back to Search
        </button>
        <button
          onClick={onCancel}
          className="px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
        >
          Cancel
        </button>
      </div>

      {/* Title Section */}
      <div className="text-center mb-6 sm:mb-8">
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 px-2">
          Transaction for: {selectedCustomer?.name}
        </h3>
        <p className="text-sm sm:text-base text-gray-600 px-2">Select transaction type to continue</p>
      </div>

      {/* Transaction Type Cards */}
      <div className="flex flex-col-2 sm:grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Income Card */}
        <button
          onClick={() => onSelectType("income")}
          className="group relative p-6 sm:p-8 bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 border-2 border-emerald-200 rounded-xl sm:rounded-2xl hover:border-emerald-400 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 w-full"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-green-500/10 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          <div className="relative">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
              <TrendingUp size={24} className="sm:w-8 sm:h-8 text-white" />
            </div>
            <h4 className="text-lg sm:text-xl font-bold text-emerald-900 mb-2">Income</h4>
            <p className="text-emerald-700 text-xs sm:text-sm px-2">
              Money received from sales, interest, repayments
            </p>
          </div>
        </button>

        {/* Expense Card */}
        <button
          onClick={() => onSelectType("expense")}
          className="group relative p-6 sm:p-8 bg-gradient-to-br from-rose-50 via-red-50 to-rose-100 border-2 border-rose-200 rounded-xl sm:rounded-2xl hover:border-rose-400 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 w-full"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-rose-400/10 to-red-500/10 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          <div className="relative">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-rose-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
              <TrendingDown size={24} className="sm:w-8 sm:h-8 text-white" />
            </div>
            <h4 className="text-lg sm:text-xl font-bold text-rose-900 mb-2">Expense</h4>
            <p className="text-rose-700 text-xs sm:text-sm px-2">
              Money spent on loans, purchases, udhari
            </p>
          </div>
        </button>
      </div>
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
    <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with navigation */}
        <div className="flex flex-col-2 sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm sm:text-base"
          >
            ← Back to Transaction Type
          </button>
          <button
            onClick={onCancel}
            className="px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-6 sm:mb-8">
          <h4 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 capitalize">
            {transactionType} Categories
          </h4>
          <p className="text-sm sm:text-base text-gray-600">Choose the category that best describes your transaction</p>
        </div>

        {/* Categories Grid - Flexible responsive columns */}
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const colors = getColorClasses(category.color);
            
            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category)}
                className={`flex-1 min-w-[280px] sm:min-w-[320px] lg:min-w-[350px] xl:min-w-[300px] flex items-center p-3 sm:p-4 ${colors.bg} border ${colors.border} ${colors.hoverBorder} rounded-lg sm:rounded-xl transition-all duration-200 hover:shadow-md text-left`}
              >
                {/* Icon Container */}
                <div className={`w-10 h-10 sm:w-12 sm:h-12 mr-3 sm:mr-4 ${colors.gradient} rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200 flex-shrink-0`}>
                  <Icon size={20} className="sm:w-6 sm:h-6 text-white" />
                </div>
                
                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold ${colors.text} text-sm sm:text-base leading-tight truncate`}>
                    {category.shortLabel}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 line-clamp-2 leading-tight">
                    {category.label}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom spacing */}
        <div className="h-6 sm:h-8"></div>
      </div>
    </div>
  );
};

export {
  TransactionTypeSelection,
  CategorySelection,
  incomeCategories,
  expenseCategories,
};
