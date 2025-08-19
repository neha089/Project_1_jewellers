import React from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Coins,
  Building,
  DollarSign,
  FileText,
  Users
} from 'lucide-react';

const TransactionCard = ({ transaction, onClick }) => {
  const getTransactionIcon = (type) => {
    const icons = {
      loan_payment: Coins,
      gold_purchase: TrendingUp,
      office_rent: Building,
      cash_deposit: DollarSign,
      staff_salary: Users,
      loan_interest: FileText
    };
    return icons[type] || FileText;
  };

  const getAmountColor = (amount) => {
    return amount > 0 ? 'text-green-600' : 'text-red-600';
  };

  const formatCurrency = (amount) => {
    const absAmount = Math.abs(amount);
    return `${amount < 0 ? '-' : '+'}₹${absAmount.toLocaleString()}`;
  };

  const TransactionIcon = getTransactionIcon(transaction.type);

  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-amber-300 transition-all duration-200 cursor-pointer"
      onClick={() => onClick(transaction)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white shadow-md">
            <TransactionIcon size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{transaction.id}</h3>
            <p className="text-sm text-gray-500">{transaction.category}</p>
          </div>
        </div>
        <div className={`text-xl font-bold ${getAmountColor(transaction.amount)}`}>
          {formatCurrency(transaction.amount)}
        </div>
      </div>

      {/* Customer/Entity Info */}
      <div className="space-y-2 mb-4">
        {transaction.customerName && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User size={14} className="text-gray-400" />
            <span className="font-medium">{transaction.customerName}</span>
          </div>
        )}
        {transaction.employeeName && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users size={14} className="text-gray-400" />
            <span className="font-medium">{transaction.employeeName}</span>
          </div>
        )}
        {transaction.vendorName && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building size={14} className="text-gray-400" />
            <span className="font-medium">{transaction.vendorName}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={14} className="text-gray-400" />
          <span>{transaction.date} at {transaction.time}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CreditCard size={14} className="text-gray-400" />
          <span>{transaction.method}</span>
        </div>
      </div>

      {/* Description */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="text-sm text-gray-700">{transaction.description}</p>
        {transaction.reference && (
          <p className="text-xs text-gray-500 mt-1">Ref: {transaction.reference}</p>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {transaction.tags.map((tag, index) => (
          <span key={index} className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TransactionCard;