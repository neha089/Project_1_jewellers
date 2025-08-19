import React from 'react';
import { Edit, Eye } from 'lucide-react';

const CustomerTableRow = ({ customer, onEdit, onView }) => {
  const initials = `${customer.firstName[0]}${customer.lastName[0]}`;
  
  return (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
            {initials}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{customer.firstName} {customer.lastName}</div>
            <div className="text-sm text-gray-500">{customer.id}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">{customer.phone}</div>
        <div className="text-sm text-gray-500 truncate max-w-48">{customer.email}</div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">{customer.address}</td>
      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{customer.totalLoans}</td>
      <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{customer.totalAmount.toLocaleString()}</td>
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