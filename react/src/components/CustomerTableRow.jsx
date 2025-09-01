import React from 'react';
import { Edit, Eye, CreditCard } from 'lucide-react';

const CustomerTableRow = ({ customer, onEdit, onView }) => {
  const initials = customer.firstName && customer.lastName ? 
    `${customer.firstName[0]}${customer.lastName[0]}` : 
    customer.firstName ? customer.firstName[0] : 'U';
  
  // Format amount display
  const formatAmount = (amount) => {
    if (!amount || amount === 0) return '₹0';
    return `₹${amount.toLocaleString()}`;
  };

  // Format phone number for display
  const formatPhone = (phone) => {
    if (!phone) return 'No phone';
    // Basic formatting for Indian numbers
    if (phone.length === 10) {
      return `${phone.slice(0, 5)} ${phone.slice(5)}`;
    }
    return phone;
  };

  // Format address for table display
  const formatAddress = (customer) => {
    const parts = [];
    if (customer.city) parts.push(customer.city);
    if (customer.state) parts.push(customer.state);
    if (customer.pinCode) parts.push(customer.pinCode);
    
    if (parts.length > 0) {
      return parts.join(', ');
    }
    
    return customer.address || 'No address';
  };
  
  return (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
            {initials}
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {customer.firstName} {customer.lastName}
            </div>
            <div className="text-sm text-gray-500">{customer.id}</div>
            {customer.adhaarNumber && (
              <div className="flex items-center gap-1 mt-1">
                <CreditCard size={12} className="text-gray-400" />
                <span className="text-xs text-gray-500">
                  {customer.adhaarNumber.toString().replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')}
                </span>
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">{formatPhone(customer.phone)}</div>
        {customer.email && (
          <div className="text-sm text-gray-500 truncate max-w-48">{customer.email}</div>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 max-w-48 truncate">
          {formatAddress(customer)}
        </div>
      </td>
      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
        {customer.totalLoans || 0}
      </td>
      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
        {formatAmount(customer.totalAmount)}
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
          customer.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {customer.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(customer)}
            className="w-8 h-8 border border-gray-300 rounded-lg bg-white text-gray-600 flex items-center justify-center hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all duration-200"
            title="Edit Customer"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onView(customer)}
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

export default CustomerTableRow;