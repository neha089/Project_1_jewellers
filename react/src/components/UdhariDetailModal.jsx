
import React, { useState, useEffect } from 'react';
import { X, CreditCard, Phone, FileText, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const UdhariDetailModal = ({ isOpen, customerData, udhariType, onClose, onPayment }) => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    if (isOpen && customerData && customerData.transactions && customerData.transactions.length > 0) {
      setSelectedTransaction(customerData.transactions[0]);
    }
  }, [isOpen, customerData]);

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

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white rounded-xl w-full max-w-md sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center shadow-md ${
              isReceivable ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-green-500 to-green-600'
            }`}>
              <span className="text-white text-base sm:text-lg font-bold">{getInitials(customer.name)}</span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">{customer.name || 'Unknown Customer'}</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-600 mt-1 text-xs sm:text-sm">
                {customer.phone && (
                  <div className="flex items-center gap-1">
                    <Phone size={14} />
                    <span>{customer.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <FileText size={14} />
                  <span>{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={40} className="text-gray-300 mx-auto mb-4" />
            <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No Active Transactions</h4>
            <p className="text-gray-500 text-sm sm:text-base">No active udhari records found for this customer</p>
          </div>
        ) : (
          <>
            {transactions.length > 1 && (
              <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Select Transaction</h3>
                <div className="flex flex-wrap gap-2 sm:gap-3 overflow-x-auto">
                  {transactions.map((transaction, index) => (
                    <button
                      key={transaction._id || transaction.id}
                      onClick={() => setSelectedTransaction(transaction)}
                      className={`flex-shrink-0 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        selectedTransaction?._id === transaction._id || selectedTransaction?.id === transaction.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Transaction #{index + 1} - {formatCurrency(transaction.originalAmount || transaction.amount)}
                      <span className="ml-2 text-xs opacity-75">{formatDate(transaction.takenDate || transaction.date)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedTransaction && (
              <>
                <div className="p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                          isReceivable ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          <DollarSign size={20} className={isReceivable ? 'text-red-600' : 'text-green-600'} />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-600">Outstanding</p>
                          <p className={`text-lg sm:text-xl font-bold ${isReceivable ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(selectedTransaction.outstandingAmount || selectedTransaction.amount)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500">{isReceivable ? 'Amount to collect' : 'Amount to pay'}</p>
                    </div>

                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <CheckCircle size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-600">Total Paid</p>
                          <p className="text-lg sm:text-xl font-bold text-blue-600">
                            {formatCurrency(selectedTransaction.originalAmount - selectedTransaction.outstandingAmount || 0)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500">Payments received</p>
                    </div>

                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 flex items-center justify-center">
                      <button
                        onClick={handlePayment}
                        className={`py-2 sm:py-3 px-4 sm:px-6 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base ${
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

                <div className="p-4 sm:p-6">
                  <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Transaction Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Original Amount</p>
                        <p className="font-bold text-gray-900 text-sm sm:text-base">
                          {formatCurrency(selectedTransaction.originalAmount || selectedTransaction.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Transaction Date</p>
                        <p className="font-medium text-gray-900 text-sm sm:text-base">
                          {formatDate(selectedTransaction.takenDate || selectedTransaction.date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Status</p>
                        <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                          selectedTransaction.status === 'ACTIVE' || selectedTransaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          selectedTransaction.status === 'PARTIALLY_PAID' ? 'bg-orange-100 text-orange-800' :
                          selectedTransaction.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedTransaction.status || 'ACTIVE'}
                        </span>
                      </div>
                      {(selectedTransaction.note || selectedTransaction.description) && (
                        <div className="sm:col-span-2 lg:col-span-3">
                          <p className="text-xs sm:text-sm text-gray-600 mb-1">{selectedTransaction.note ? 'Note' : 'Description'}</p>
                          <p className="text-gray-900 text-sm sm:text-base">{selectedTransaction.note || selectedTransaction.description}</p>
                        </div>
                      )}
                      {selectedTransaction.dueDate && (
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600 mb-1">Due Date</p>
                          <p className="font-medium text-gray-900 text-sm sm:text-base">{formatDate(selectedTransaction.dueDate)}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 sm:mt-6">
                      <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
                        <span>Payment Progress</span>
                        <span>{selectedTransaction.completionPercentage || '0%'}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 sm:h-3 rounded-full transition-all duration-500"
                          style={{ width: `${selectedTransaction.completionPercentage || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6">Payment History</h3>
                    {selectedTransaction.paymentHistory && selectedTransaction.paymentHistory.length > 0 ? (
                      <div className="space-y-4">
                        {selectedTransaction.paymentHistory.map((payment, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                  <CheckCircle size={16} className="text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm sm:text-base">
                                    Payment #{payment.installmentNumber || (index + 1)}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-500">
                                    {formatDate(payment.date || payment.paymentDate)} • {getTimeAgo(payment.date || payment.paymentDate)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-left sm:text-right">
                                <p className="font-medium text-green-600 text-sm sm:text-base">
                                  {formatCurrency(payment.amount || (payment.principalAmount || 0) / 100)}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  {payment.paymentMethod || 'CASH'} {payment.paymentReference && `• ${payment.paymentReference}`}
                                </p>
                              </div>
                            </div>
                            {payment.note && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs sm:text-sm text-gray-600">{payment.note}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Clock size={32} className="text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm sm:text-base">No payments recorded yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 sm:px-6 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
            >
              Close
            </button>
            {selectedTransaction && (
              <button
                onClick={handlePayment}
                className={`flex-1 px-4 py-2 sm:px-6 sm:py-3 text-white rounded-lg transition-colors font-medium text-sm sm:text-base ${
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
