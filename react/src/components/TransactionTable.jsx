// The provided TransactionTable.js is already reusable as it handles both buy/sell generically.
// No changes needed, but including it for completeness.
import React from 'react';
import { TrendingUp, TrendingDown, User, Weight, Calendar, Eye, Edit, Trash2 } from 'lucide-react';

const TransactionTable = ({ 
  transactions, 
  onView, 
  onDelete, 
  currentPage, 
  totalPages, 
  onPageChange 
}) => {
  // Helper function to get customer/supplier name from transaction
  const getPersonName = (transaction) => {
    if (transaction.transactionType === 'SELL' && transaction.customer) {
      return transaction.customer.name || 'N/A';
    }
    if (transaction.transactionType === 'BUY' && transaction.supplier) {
      return transaction.supplier.name || 'N/A';
    }
    return 'N/A';
  };

  // Helper function to get customer/supplier phone from transaction
  const getPersonPhone = (transaction) => {
    if (transaction.transactionType === 'SELL' && transaction.customer) {
      return transaction.customer.phone || '';
    }
    if (transaction.transactionType === 'BUY' && transaction.supplier) {
      return transaction.supplier.phone || '';
    }
    return '';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer/Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${
                      transaction.transactionType === 'BUY' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {transaction.transactionType === 'BUY' ? 
                        <TrendingUp className="w-4 h-4 text-green-600" /> :
                        <TrendingDown className="w-4 h-4 text-blue-600" />
                      }
                    </div>
                    <div className="ml-3">
                      <span className={`text-sm font-medium capitalize ${
                        transaction.transactionType === 'BUY' ? 'text-green-700' : 'text-blue-700'
                      }`}>
                        {transaction.transactionType.toLowerCase()}
                      </span>
                      {transaction.invoiceNumber && (
                        <div className="text-xs text-gray-500">#{transaction.invoiceNumber}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm text-gray-900">{getPersonName(transaction)}</div>
                      {getPersonPhone(transaction) && (
                        <div className="text-xs text-gray-500">{getPersonPhone(transaction)}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    ₹{transaction.totalAmount?.toLocaleString() || '0'}
                  </div>
                  {transaction.advanceAmount > 0 && (
                    <div className="text-xs text-gray-500">
                      Advance: ₹{transaction.advanceAmount}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    transaction.paymentStatus === 'PAID' 
                      ? 'bg-green-100 text-green-800' 
                      : transaction.paymentStatus === 'PARTIAL'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.paymentStatus || 'PENDING'}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">{transaction.paymentMode}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    {transaction.formattedDate || new Date(transaction.date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => onView(transaction)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button 
                      onClick={() => onDelete(transaction.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onPageChange(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => onPageChange(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;