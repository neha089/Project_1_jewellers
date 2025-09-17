import React, { useState, useEffect } from 'react';
import { 
  X, 
  User,
  Phone,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import ApiService from '../services/api.js';

const UdhariDetailModal = ({ isOpen, udhari, onClose, onPayment }) => {
  const [transactionDetails, setTransactionDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && udhari) {
      loadTransactionDetails();
    }
  }, [isOpen, udhari]);

  const loadTransactionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get detailed customer summary with payment history
      const response = await ApiService.getCustomerUdhariSummary(udhari.customer._id);
      
      if (response.success) {
        // Filter transactions based on type (receivable/payable)
        const customerData = response.data;
        let relevantTransactions = [];
        
        if (udhari.type === 'receivable') {
          // Show GIVEN transactions (money lent out)
          relevantTransactions = customerData.transactions.given || [];
        } else {
          // Show TAKEN transactions (money borrowed)
          relevantTransactions = customerData.transactions.taken || [];
        }
        
        setTransactionDetails(relevantTransactions);
      } else {
        setError('Failed to load transaction details');
      }
    } catch (error) {
      console.error('Error loading transaction details:', error);
      setError(error.message || 'Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  };

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

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
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

  if (!isOpen || !udhari) return null;

  const customer = udhari.customer || {};
  const totalOutstanding = udhari.totalOutstanding || 0;
  const isReceivable = udhari.type === 'receivable';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              isReceivable 
                ? 'bg-gradient-to-br from-red-500 to-red-600' 
                : 'bg-gradient-to-br from-green-500 to-green-600'
            }`}>
              <span className="text-white text-xl font-bold">
                {getInitials(customer.name)}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{customer.name || 'Unknown Customer'}</h2>
              <div className="flex items-center gap-4 text-slate-600 mt-1">
                {customer.phone && (
                  <div className="flex items-center gap-1">
                    <Phone size={16} />
                    <span>{customer.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <FileText size={16} />
                  <span>{transactionDetails.length} transaction{transactionDetails.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Summary Section */}
        <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Outstanding */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isReceivable ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  <DollarSign size={20} className={isReceivable ? 'text-red-600' : 'text-green-600'} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Outstanding</p>
                  <p className={`text-2xl font-bold ${isReceivable ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(totalOutstanding)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                {isReceivable ? 'Amount to collect' : 'Amount to pay'}
              </p>
            </div>

            {/* Transaction Count */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Transactions</p>
                  <p className="text-2xl font-bold text-blue-600">{transactionDetails.length}</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">Outstanding udhari records</p>
            </div>

            {/* Action Button */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
              <button
                onClick={onPayment}
                className={`w-full py-3 px-6 text-white font-semibold rounded-xl transition-colors ${
                  isReceivable 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <CreditCard size={18} />
                  {isReceivable ? 'Receive Payment' : 'Make Payment'}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Transaction History</h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <span className="ml-3 text-slate-600">Loading transaction details...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <AlertCircle size={24} className="text-red-500" />
              <span className="ml-3 text-red-600">{error}</span>
            </div>
          ) : transactionDetails.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="text-slate-300 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-slate-900 mb-2">No Transactions</h4>
              <p className="text-slate-500">No transaction history available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {transactionDetails.map((transaction, index) => {
                const originalAmount = transaction.principalPaise ? transaction.principalPaise / 100 : 0;
                const outstandingAmount = transaction.outstandingBalance ? transaction.outstandingBalance / 100 : 0;
                const paidAmount = originalAmount - outstandingAmount;
                const paymentHistory = transaction.paymentHistory || [];

                return (
                  <div key={transaction._id || index} className="bg-slate-50 rounded-2xl p-6">
                    {/* Transaction Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <FileText size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-slate-900">
                            {transaction.note || 'Udhari Transaction'}
                          </h4>
                          <p className="text-sm text-slate-500">
                            Created on {formatDate(transaction.takenDate || transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">
                          {formatCurrency(originalAmount)}
                        </p>
                        <p className="text-sm text-slate-500">Original Amount</p>
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-white p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle size={16} className="text-green-600" />
                          <span className="text-sm font-medium text-slate-600">Paid</span>
                        </div>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(paidAmount)}
                        </p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock size={16} className="text-orange-600" />
                          <span className="text-sm font-medium text-slate-600">Remaining</span>
                        </div>
                        <p className="text-xl font-bold text-orange-600">
                          {formatCurrency(outstandingAmount)}
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp size={16} className="text-blue-600" />
                          <span className="text-sm font-medium text-slate-600">Progress</span>
                        </div>
                        <p className="text-xl font-bold text-blue-600">
                          {originalAmount > 0 ? Math.round((paidAmount / originalAmount) * 100) : 0}%
                        </p>
                      </div>
                    </div>

                    {/* Payment Progress Bar */}
                    {originalAmount > 0 && (
                      <div className="mb-6">
                        <div className="flex justify-between text-sm text-slate-600 mb-2">
                          <span>Payment Progress</span>
                          <span>{Math.round((paidAmount / originalAmount) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((paidAmount / originalAmount) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Payment History */}
                    {paymentHistory.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-slate-900 mb-4">Payment History</h5>
                        <div className="space-y-3">
                          {paymentHistory.map((payment, payIndex) => (
                            <div key={payment._id || payIndex} className="bg-white p-4 rounded-xl border border-slate-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <CheckCircle size={14} className="text-green-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-900">
                                      {formatCurrency(payment.amount / 100)}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                      {formatDate(payment.date)} • {getTimeAgo(payment.date)}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {payment.paymentMethod && (
                                    <p className="text-sm font-medium text-slate-600">
                                      {payment.paymentMethod}
                                    </p>
                                  )}
                                  {payment.note && (
                                    <p className="text-sm text-slate-500">{payment.note}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No Payments Yet */}
                    {paymentHistory.length === 0 && (
                      <div className="text-center py-8">
                        <Clock size={32} className="text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No payments received yet</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>      

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              Close
            </button>
            <button
              onClick={onPayment}
              className={`flex-1 px-6 py-3 text-white rounded-xl transition-colors font-medium ${
                isReceivable 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <CreditCard size={18} />
                {isReceivable ? 'Receive Payment' : 'Make Payment'}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
    );
};

  export default UdhariDetailModal;