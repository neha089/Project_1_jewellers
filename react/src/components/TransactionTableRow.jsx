import React from 'react';
import { 
  Edit, 
  Eye, 
  Coins, 
  Building, 
  DollarSign, 
  FileText, 
  Users,
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react';

const TransactionTableRow = ({ transaction, onEdit, onView }) => {
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

  const getEntityName = () => {
    if (transaction.customerName) return transaction.customerName;
    if (transaction.employeeName) return transaction.employeeName;
    if (transaction.vendorName) return transaction.vendorName;
    return 'N/A';
  };

  const TransactionIcon = getTransactionIcon(transaction.type);

  return (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      {/* Transaction Info */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white shadow-md">
            <TransactionIcon size={16} />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{transaction.id}</div>
            <div className="text-sm text-gray-500">{transaction.category}</div>
          </div>
        </div>
      </td>
      
      {/* Description */}
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
        {transaction.reference && (
          <div className="text-xs text-gray-500">Ref: {transaction.reference}</div>
        )}
      </td>
      
      {/* Entity */}
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">{getEntityName()}</div>
        {transaction.customerId && (
          <div className="text-xs text-gray-500">{transaction.customerId}</div>
        )}
        {transaction.employeeId && (
          <div className="text-xs text-gray-500">{transaction.employeeId}</div>
        )}
      </td>
      
      {/* Date & Time */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-1 text-sm text-gray-900 mb-1">
          <Calendar size={12} className="text-gray-400" />
          {transaction.date}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock size={12} className="text-gray-400" />
          {transaction.time}
        </div>
      </td>
      
      {/* Method */}
      <td className="px-6 py-4">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
          {transaction.method}
        </span>
      </td>
      
      {/* Amount */}
      <td className="px-6 py-4">
        <div className={`text-lg font-bold ${getAmountColor(transaction.amount)}`}>
          {formatCurrency(transaction.amount)}
        </div>
      </td>
      
      {/* Status */}
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
          transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {transaction.status === 'completed' ? 'Completed' : 'Pending'}
        </span>
      </td>
      
      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(transaction);
            }}
            className="w-8 h-8 border border-gray-300 rounded-lg bg-white text-gray-600 flex items-center justify-center hover:border-amber-500 hover:text-amber-500 hover:bg-amber-50 transition-all duration-200"
            title="Edit Transaction"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(transaction);
            }}
            className="w-8 h-8 border border-gray-300 rounded-lg bg-white text-gray-600 flex items-center justify-center hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all duration-200"
            title="View Details"
          >
            <Eye size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default TransactionTableRow;
