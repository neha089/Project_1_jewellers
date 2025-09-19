import React from 'react';
import { Eye, CreditCard, Phone, User, Calendar, ChevronRight } from 'lucide-react';

const UdhariCard = ({ udhari, type, onView, onPayment }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getTimeAgo = (date) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const transactionDate = new Date(date);
    const diffTime = Math.abs(now - transactionDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  const getLatestTransactionDate = () => {
    if (!udhari.transactions || udhari.transactions.length === 0) return null;
    const dates = udhari.transactions
      .map(txn => txn.takenDate || txn.date || txn.createdAt)
      .filter(date => date)
      .sort((a, b) => new Date(b) - new Date(a));
    return dates[0] || null;
  };

  const customer = udhari.customer || {};
  const totalOutstanding = udhari.totalOutstanding || 0;
  const transactionCount = udhari.transactions?.length || 0;
  const latestDate = getLatestTransactionDate();

  return (
    <div className="w-full min-h-[150px] bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all group">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        {/* Customer Info */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1">
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shadow-sm ${
              type === 'receivable' ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-green-500 to-green-600'
            }`}
          >
            <span className="text-white text-sm font-bold">{getInitials(customer.name)}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-blue-600 transition-colors truncate">
              {customer.name || 'Unknown Customer'}
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-gray-500 mt-1">
              {customer.phone && (
                <div className="flex items-center gap-1">
                  <Phone size={12} />
                  <span className="truncate">{customer.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <User size={12} />
                <span>{transactionCount} transaction{transactionCount !== 1 ? 's' : ''}</span>
              </div>
              {latestDate && (
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{getTimeAgo(latestDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Amount and Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <div className="text-left sm:text-right">
            <p className={`text-base sm:text-lg font-bold ${type === 'receivable' ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(totalOutstanding)}
            </p>
            <p className="text-xs text-gray-500 font-medium">
              {type === 'receivable' ? 'TO COLLECT' : 'TO PAY'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onView}
              className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
              title="View Details"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={onPayment}
              className={`p-1.5 sm:p-2 text-white rounded-lg transition-colors ${
                type === 'receivable' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              }`}
              title={type === 'receivable' ? 'Receive Payment' : 'Make Payment'}
            >
              <CreditCard size={16} />
            </button>
            <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
        </div>
      </div>

      {udhari.transactions && udhari.transactions.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between text-xs">
            <span className="text-gray-600 line-clamp-1">
              Latest: {udhari.transactions[0]?.note || udhari.transactions[0]?.description || 'No description'}
            </span>
            <span className="text-gray-500 mt-1 sm:mt-0">
              {formatCurrency(udhari.transactions[0]?.originalAmount || udhari.transactions[0]?.amount || 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UdhariCard;