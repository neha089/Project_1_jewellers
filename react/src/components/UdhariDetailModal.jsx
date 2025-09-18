import React, { useState, useEffect } from 'react';
import { X, CreditCard, Phone, FileText, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const UdhariDetailModal = ({ isOpen, customerData, udhariType, onClose, onPayment }) => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    if (isOpen && customerData && customerData.transactions && customerData.transactions.length > 0) {
      // Select the first transaction by default
      setSelectedTransaction(customerData.transactions[0]);
    }
  }, [isOpen, customerData]);

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

  const handlePayment = () => {
    if (selectedTransaction) {
      onPayment(selectedTransaction);
    }
  };

  if (!isOpen || !customerData) return null;

  const customer = customerData.customer || {};
  const transactions = customerData.transactions || [];
  const isReceivable = udhariType === 'receivable';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              isReceivable ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-green-500 to-green-600'
            }`}>
              <span className="text-white text-xl font-bold">{getInitials(customer.name)}</span>
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
                  <span>{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</span>
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

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="text-slate-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-slate-900 mb-2">No Active Transactions</h4>
            <p className="text-slate-500">No active udhari records found for this customer</p>
          </div>
        ) : (
          <>
            {/* Transaction Selection Tabs */}
            {transactions.length > 1 && (
              <div className="p-6 border-b border-slate-200 bg-slate-50">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Select Transaction</h3>
                <div className="flex gap-2 overflow-x-auto">
                  {transactions.map((transaction, index) => (
                    <button
                      key={transaction._id || transaction.id}
                      onClick={() => setSelectedTransaction(transaction)}
                      className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedTransaction?._id === transaction._id || selectedTransaction?.id === transaction.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Transaction #{index + 1} - {formatCurrency(transaction.originalAmount || transaction.amount)}
                      <span className="ml-2 text-xs opacity-75">
                        {formatDate(transaction.takenDate || transaction.date)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedTransaction && (
              <>
                {/* Transaction Summary Cards */}
                <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isReceivable ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          <DollarSign size={20} className={isReceivable ? 'text-red-600' : 'text-green-600'} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600">Outstanding</p>
                          <p className={`text-2xl font-bold ${
                            isReceivable ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {formatCurrency(selectedTransaction.outstandingAmount || selectedTransaction.amount)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500">
                        {isReceivable ? 'Amount to collect' : 'Amount to pay'}
                      </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <CheckCircle size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600">Total Paid</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(selectedTransaction.totalPaid || 0)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500">
                        Payments received
                      </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
                      <button
                        onClick={handlePayment}
                        className={`py-3 px-6 text-white font-semibold rounded-xl transition-colors ${
                          isReceivable ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <CreditCard size={16} />
                          {isReceivable ? 'Receive Payment' : 'Make Payment'}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="p-6">
                  <div className="bg-slate-50 rounded-2xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Transaction Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Original Amount</p>
                        <p className="font-bold text-slate-900">
                          {formatCurrency(selectedTransaction.originalAmount || selectedTransaction.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Transaction Date</p>
                        <p className="font-medium text-slate-900">
                          {formatDate(selectedTransaction.takenDate || selectedTransaction.date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Status</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          selectedTransaction.status === 'ACTIVE' || selectedTransaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          selectedTransaction.status === 'PARTIALLY_PAID' ? 'bg-orange-100 text-orange-800' :
                          selectedTransaction.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedTransaction.status || 'ACTIVE'}
                        </span>
                      </div>
                      {selectedTransaction.note && (
                        <div className="md:col-span-3">
                          <p className="text-sm text-slate-600 mb-1">Note</p>
                          <p className="text-slate-900">{selectedTransaction.note}</p>
                        </div>
                      )}
                      {selectedTransaction.description && !selectedTransaction.note && (
                        <div className="md:col-span-3">
                          <p className="text-sm text-slate-600 mb-1">Description</p>
                          <p className="text-slate-900">{selectedTransaction.description}</p>
                        </div>
                      )}
                      {selectedTransaction.dueDate && (
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Due Date</p>
                          <p className="font-medium text-slate-900">
                            {formatDate(selectedTransaction.dueDate)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                      <div className="flex justify-between text-sm text-slate-600 mb-2">
                        <span>Payment Progress</span>
                        <span>
                          {Math.round(((selectedTransaction.totalPaid || 0) / (selectedTransaction.originalAmount || selectedTransaction.amount || 1)) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min(Math.round(((selectedTransaction.totalPaid || 0) / (selectedTransaction.originalAmount || selectedTransaction.amount || 1)) * 100), 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Payment History */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Payment History</h3>
                    
                    {selectedTransaction.paymentHistory && selectedTransaction.paymentHistory.length > 0 ? (
                      <div className="space-y-4">
                        {selectedTransaction.paymentHistory.map((payment, index) => (
                          <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                  <CheckCircle size={16} className="text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">
                                    Payment #{payment.installmentNumber || (index + 1)}
                                  </p>
                                  <p className="text-sm text-slate-500">
                                    {formatDate(payment.date || payment.paymentDate)} • {getTimeAgo(payment.date || payment.paymentDate)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-green-600">
                                  {formatCurrency(payment.amount || (payment.principalAmount || 0) / 100)}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {payment.paymentMethod || 'CASH'} {payment.paymentReference && `• ${payment.paymentReference}`}
                                </p>
                              </div>
                            </div>
                            {payment.note && (
                              <div className="mt-3 pt-3 border-t border-slate-200">
                                <p className="text-sm text-slate-600">{payment.note}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Clock size={32} className="text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No payments recorded yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              Close
            </button>
            {selectedTransaction && (
              <button
                onClick={handlePayment}
                className={`flex-1 px-6 py-3 text-white rounded-xl transition-colors font-medium ${
                  isReceivable ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <CreditCard size={18} />
                  {isReceivable ? 'Receive Payment' : 'Make Payment'}
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UdhariDetailModal;
