import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Edit, Trash2, User, Calendar, FileText } from 'lucide-react';
import ApiService from '../services/api';

const RecentTransactions = ({ onEdit, onDelete, refreshTrigger }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchRecentTransactions();
  }, [refreshTrigger]);

  const fetchRecentTransactions = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getAllTransactions();
      if (response.success && response.data) {
        // Fixed: response.data is already the array of transactions
        setTransactions(response.data);
      } else {
        throw new Error('Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError('Failed to load recent transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amountInPaise) => {
    const amountInRupees = ApiService.paiseToRupees(amountInPaise);
    
    if (amountInRupees >= 10000000) { // 1 Crore or more
      return `₹${(amountInRupees / 10000000).toFixed(1)}Cr`;
    } else if (amountInRupees >= 100000) { // 1 Lakh or more
      return `₹${(amountInRupees / 100000).toFixed(1)}L`;
    } else if (amountInRupees >= 1000) { // 1 Thousand or more
      return `₹${(amountInRupees / 1000).toFixed(1)}K`;
    } else {
      return `₹${amountInRupees.toFixed(0)}`;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'GOLD_LOAN_GIVEN':
      case 'GOLD_LOAN_DISBURSEMENT':
      case 'LOAN_DISBURSEMENT':
      case 'UDHARI_GIVEN':
      case 'GOLD_PURCHASE':
      case 'BUSINESS_LOAN_TAKEN':
        return TrendingDown;
      case 'GOLD_LOAN_PAYMENT':
      case 'GOLD_LOAN_INTEREST_RECEIVED':
      case 'INTEREST_RECEIVED':
      case 'GOLD_SALE':
      case 'SILVER_SALE':
      case 'UDHARI_RECEIVED':
        return TrendingUp;
      default:
        return FileText;
    }
  };

  const getTransactionColor = (category) => {
    return category === 'INCOME' ? 'emerald' : 'red';
  };

  const getTransactionTypeLabel = (type) => {
    const typeMap = {
      'GOLD_LOAN_GIVEN': 'Gold Loan Given',
      'GOLD_LOAN_DISBURSEMENT': 'Gold Loan Given',
      'GOLD_LOAN_PAYMENT': 'Loan Repayment',
      'GOLD_LOAN_INTEREST_RECEIVED': 'Gold Loan Interest',
      'INTEREST_RECEIVED': 'Interest Received',
      'GOLD_SALE': 'Gold Sale',
      'SILVER_SALE': 'Silver Sale',
      'GOLD_PURCHASE': 'Gold Purchase',
      'LOAN_DISBURSEMENT': 'Loan Given',
      'UDHARI_GIVEN': 'Udhari Given',
      'UDHARI_RECEIVED': 'Udhari Received',
      'BUSINESS_LOAN_TAKEN': 'Business Loan Taken',
      'BUSINESS_LOAN_GIVEN': 'Business Loan Given'
    };
    return typeMap[type] || type.replace(/_/g, ' ');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div>
                  <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-24 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="w-20 h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchRecentTransactions}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        <button 
          onClick={fetchRecentTransactions}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Refresh
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No recent transactions found</p>
        </div>
      ) : (
        <div className={`space-y-3 ${showAll ? 'max-h-96 overflow-y-auto' : ''}`}>
          {(showAll ? transactions : transactions.slice(0, 5)).map((transaction) => {
            const Icon = getTransactionIcon(transaction.type);
            const color = getTransactionColor(transaction.category);
            
            return (
              <div
                key={transaction._id}
                className="flex flex-wrap items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`w-10 h-10 ${color === 'emerald' ? 'bg-emerald-100' : 'bg-red-100'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon size={20} className={color === 'emerald' ? 'text-emerald-600' : 'text-red-600'} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {getTransactionTypeLabel(transaction.type)}
                    </h4>
                    <div className="flex flex-wrap items-center space-x-3 text-sm text-gray-500">
                      {transaction.customer && (
                        <div className="flex items-center space-x-1 truncate max-w-xs">
                          <User size={14} />
                          <span className="truncate">{transaction.customer.name}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>{formatDate(transaction.date)}</span>
                      </div>
                    </div>
                    {transaction.description && (
                      <p className="text-xs text-gray-400 mt-1 truncate max-w-xs">
                        {transaction.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 mt-2 sm:mt-0">
                  <div className="text-right min-w-[80px]">
                    <span className={`font-semibold ${
                      transaction.category === 'INCOME' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {transaction.category === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEdit && onEdit(transaction)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit Transaction"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete && onDelete(transaction._id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete Transaction"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {transactions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium w-full sm:w-auto"
          >
            {showAll ? 'Show Less' : `View All Transactions (${transactions.length} total)`}
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;