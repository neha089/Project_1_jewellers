// The provided TransactionViewModal.js is already reusable.
// No changes needed.
import React from 'react';
import { X, Edit, Eye } from 'lucide-react';

const TransactionViewModal = ({ transaction, onClose, onEdit }) => {
  // Helper functions to get person details
  const getPersonName = (transaction) => {
    if (transaction.transactionType === 'SELL' && transaction.customer) {
      return transaction.customer.name || 'N/A';
    }
    if (transaction.transactionType === 'BUY' && transaction.supplier) {
      return transaction.supplier.name || 'N/A';
    }
    return 'N/A';
  };

  const getPersonPhone = (transaction) => {
    if (transaction.transactionType === 'SELL' && transaction.customer) {
      return transaction.customer.phone || '';
    }
    if (transaction.transactionType === 'BUY' && transaction.supplier) {
      return transaction.supplier.phone || '';
    }
    return '';
  };

  const getPersonEmail = (transaction) => {
    if (transaction.transactionType === 'SELL' && transaction.customer) {
      return transaction.customer.email || '';
    }
    if (transaction.transactionType === 'BUY' && transaction.supplier) {
      return transaction.supplier.email || '';
    }
    return '';
  };

  const getPersonAddress = (transaction) => {
    if (transaction.transactionType === 'SELL' && transaction.customer) {
      return transaction.customer.address || '';
    }
    if (transaction.transactionType === 'BUY' && transaction.supplier) {
      return transaction.supplier.address || '';
    }
    return '';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
            <div className="flex items-center gap-2">
            
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {/* Transaction Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Info</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Type:</span>
                    <div className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ml-2 ${
                      transaction.transactionType === 'BUY' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {transaction.transactionType}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Invoice Number:</span>
                    <span className="ml-2 text-sm text-gray-900">{transaction.invoiceNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Date:</span>
                    <span className="ml-2 text-sm text-gray-900">
                      {transaction.formattedDate || new Date(transaction.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Payment Mode:</span>
                    <span className="ml-2 text-sm text-gray-900">{transaction.paymentMode || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Payment Status:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                      transaction.paymentStatus === 'PAID' 
                        ? 'bg-green-100 text-green-800' 
                        : transaction.paymentStatus === 'PARTIAL'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.paymentStatus || 'PAID'}
                    </span>
                  </div>
                  {transaction.notes && (
                    <div>
                      <span className="text-sm text-gray-500">Notes:</span>
                      <div className="ml-2 text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">
                        {transaction.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {transaction.transactionType === 'SELL' ? 'Customer' : 'Supplier'} Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Name:</span>
                    <span className="ml-2 text-sm text-gray-900">{getPersonName(transaction)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Phone:</span>
                    <span className="ml-2 text-sm text-gray-900">{getPersonPhone(transaction) || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Email:</span>
                    <span className="ml-2 text-sm text-gray-900">{getPersonEmail(transaction) || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Address:</span>
                    <div className="ml-2 text-sm text-gray-900 mt-1">
                      {getPersonAddress(transaction) || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Details */}
            {transaction.items && transaction.items.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Items</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight (g)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate (₹/g)</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transaction.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.itemName || 'Gold Item'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.purity || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.weight || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">₹{item.rate || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {formatCurrency((item.weight || 0) * (item.rate || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Subtotal</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {formatCurrency(transaction.subtotal || transaction.totalAmount || 0)}
                  </div>
                </div>
                
                {transaction.tax && transaction.tax > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Tax</div>
                    <div className="text-xl font-semibold text-gray-900">
                      {formatCurrency(transaction.tax)}
                    </div>
                  </div>
                )}
                
                {transaction.discount && transaction.discount > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Discount</div>
                    <div className="text-xl font-semibold text-red-600">
                      -{formatCurrency(transaction.discount)}
                    </div>
                  </div>
                )}
                
                <div className={`p-4 rounded-lg ${
                  transaction.transactionType === 'BUY' 
                    ? 'bg-green-50' 
                    : 'bg-blue-50'
                }`}>
                  <div className="text-sm text-gray-500">Total Amount</div>
                  <div className={`text-xl font-semibold ${
                    transaction.transactionType === 'BUY' 
                      ? 'text-green-800' 
                      : 'text-blue-800'
                  }`}>
                    {formatCurrency(transaction.totalAmount || 0)}
                  </div>
                </div>
              </div>
              
              {/* Payment Details */}
              {(transaction.paidAmount || transaction.pendingAmount) && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {transaction.paidAmount && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Paid Amount</div>
                      <div className="text-xl font-semibold text-green-800">
                        {formatCurrency(transaction.paidAmount)}
                      </div>
                    </div>
                  )}
                  
                  {transaction.pendingAmount && transaction.pendingAmount > 0 && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Pending Amount</div>
                      <div className="text-xl font-semibold text-red-800">
                        {formatCurrency(transaction.pendingAmount)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Timestamps */}
            {(transaction.createdAt || transaction.updatedAt) && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {transaction.createdAt && (
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {transaction.updatedAt && (
                    <div>
                      <span className="text-gray-500">Last Updated:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(transaction.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionViewModal;