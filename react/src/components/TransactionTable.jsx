import React from 'react';
import { Eye, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCustomerName, getCustomerPhone, getPersonDetailsFromTransaction } from '../utils/customerUtils';

const TransactionTable = ({
  transactions,
  onView,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  onPageChange,
  loading = false
}) => {
  const formatCurrency = (amount) => {
    // Handle amount conversion from paise to rupees if needed
    const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    const displayAmount = numericAmount > 10000 ? numericAmount : numericAmount;
    return `₹${displayAmount.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const getTransactionPerson = (transaction) => {
    const personDetails = getPersonDetailsFromTransaction(transaction);
    
    if (!personDetails) {
      return {
        name: 'N/A',
        phone: 'N/A',
        type: transaction.transactionType === 'SELL' ? 'customer' : 'supplier'
      };
    }
    
    return {
      name: personDetails.name || 'N/A',
      phone: personDetails.phone || 'N/A',
      type: personDetails.type
    };
  };

  const getTotalWeight = (items) => {
    if (!items || !Array.isArray(items)) return '0.00';
    const total = items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
    return total.toFixed(2);
  };

  const getTotalAmount = (transaction) => {
    if (transaction.totalAmount) {
      return formatCurrency(transaction.totalAmount);
    }
    
    // Calculate from items if totalAmount is not available
    if (!transaction.items || !Array.isArray(transaction.items)) {
      return formatCurrency(0);
    }
    
    const total = transaction.items.reduce((sum, item) => {
      const weight = parseFloat(item.weight) || 0;
      const rate = parseFloat(item.ratePerGram) || 0;
      const making = parseFloat(item.makingCharges) || 0;
      const wastage = parseFloat(item.wastage) || 0;
      const tax = parseFloat(item.taxAmount) || 0;
      
      const baseAmount = weight * rate;
      const wastageAmount = (baseAmount * wastage) / 100;
      const itemTotal = baseAmount + wastageAmount + making + tax;
      
      return sum + itemTotal;
    }, 0);
    
    return formatCurrency(total);
  };

  const getAdvanceAmount = (transaction) => {
    const advance = transaction.advanceAmount || 0;
    return formatCurrency(advance);
  };

  const getTransactionStatus = (transaction) => {
    const totalAmount = transaction.totalAmount || 0;
    const advanceAmount = transaction.advanceAmount || 0;
    
    if (advanceAmount >= totalAmount) {
      return { status: 'Paid', className: 'bg-green-100 text-green-800' };
    } else if (advanceAmount > 0) {
      return { status: 'Partial', className: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'Pending', className: 'bg-red-100 text-red-800' };
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-500">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer/Supplier
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Weight (g)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Advance
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction, index) => {
              const person = getTransactionPerson(transaction);
              const status = 'PAID'
              
              return (
                <tr key={transaction._id || transaction.id || index} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(transaction.createdAt || transaction.date)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      transaction.transactionType === 'BUY'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {transaction.transactionType}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{person.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{person.type}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {person.phone}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.items?.length || 0}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getTotalWeight(transaction.items)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {getTotalAmount(transaction)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getAdvanceAmount(transaction)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${status.className}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onView(transaction)}
                        className="text-indigo-600 hover:text-indigo-900 p-1"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => onDelete(transaction._id || transaction.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete Transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === currentPage
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;