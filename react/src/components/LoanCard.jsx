import React from 'react';
import { Eye, CreditCard, Phone, User, Calendar, ChevronRight } from 'lucide-react';

const UdhariCard = ({ udhari, type, onView, onPayment }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
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
    if (!udhari.transactions || udhari.transactions.length === 0) {
      return null;
    }
    
    // Find the most recent transaction date
    const dates = udhari.transactions
      .map(txn => txn.takenDate || txn.date)
      .filter(date => date)
      .sort((a, b) => new Date(b) - new Date(a));
    
    return dates[0] || null;
  };

  const customer = udhari.customer || {};
  const totalOutstanding = udhari.totalOutstanding || 0;
  const transactionCount = udhari.transactions?.length || 0;
  const latestDate = getLatestTransactionDate();

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all group">
      <div className="flex items-center justify-between">
        {/* Customer Info */}
        <div className="flex items-center gap-4 flex-1">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
            type === 'receivable' 
              ? 'bg-gradient-to-br from-red-500 to-red-600' 
              : 'bg-gradient-to-br from-green-500 to-green-600'
          }`}>
            <span className="text-white text-lg font-bold">
              {getInitials(customer.name)}
            </span>
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
              {customer.name || 'Unknown Customer'}
            </h3>
            
            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
              {customer.phone && (
                <div className="flex items-center gap-1">
                  <Phone size={14} />
                  <span>{customer.phone}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <User size={14} />
                <span>{transactionCount} transaction{transactionCount !== 1 ? 's' : ''}</span>
              </div>
              
              {latestDate && (
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{getTimeAgo(latestDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Amount and Actions */}
        <div className="flex items-center gap-4">
          {/* Outstanding Amount */}
          <div className="text-right">
            <p className={`text-2xl font-bold ${
              type === 'receivable' ? 'text-red-600' : 'text-green-600'
            }`}>
              {formatCurrency(totalOutstanding)}
            </p>
            <p className="text-sm text-slate-500 font-medium">
              {type === 'receivable' ? 'TO COLLECT' : 'TO PAY'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onView}
              className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-blue-200"
              title="View Details"
            >
              <Eye size={18} />
            </button>
            
            <button
              onClick={onPayment}
              className={`p-3 text-white rounded-xl transition-colors ${
                type === 'receivable' 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
              title={type === 'receivable' ? 'Receive Payment' : 'Make Payment'}
            >
              <CreditCard size={18} />
            </button>
            
            <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
          </div>
        </div>
      </div>

      {/* Transaction Summary */}
      {udhari.transactions && udhari.transactions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              Latest: {udhari.transactions[0]?.note || 'No description'}
            </span>
            <span className="text-slate-500">
              {formatCurrency(udhari.transactions[0]?.originalAmount || udhari.transactions[0]?.principalPaise / 100 || 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UdhariCard;
