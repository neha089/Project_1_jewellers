import React from 'react';
import { Edit, Eye, Phone, Mail, MapPin, Calendar } from 'lucide-react';

const CustomerCard = ({ customer, onEdit, onView }) => {
  const initials = `${customer.firstName[0]}${customer.lastName[0]}`;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-semibold shadow-md">
            {initials}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{customer.firstName} {customer.lastName}</h3>
            <p className="text-sm text-gray-500">{customer.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(customer);
            }}
            className="w-8 h-8 border border-gray-300 rounded-lg bg-white text-gray-600 flex items-center justify-center hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all duration-200"
            title="Edit Customer"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(customer);
            }}
            className="w-8 h-8 border border-gray-300 rounded-lg bg-white text-gray-600 flex items-center justify-center hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all duration-200"
            title="View Details"
          >
            <Eye size={14} />
          </button>
        </div>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone size={14} className="text-gray-400" />
          <span>{customer.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail size={14} className="text-gray-400" />
          <span className="truncate">{customer.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={14} className="text-gray-400" />
          <span>{customer.address}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={14} className="text-gray-400" />
          <span>Joined: {customer.joinDate}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{customer.totalLoans}</div>
          <div className="text-xs text-gray-500">Loans</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">₹{(customer.totalAmount / 1000).toFixed(0)}K</div>
          <div className="text-xs text-gray-500">Amount</div>
        </div>
        <div className="text-center">
          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
            customer.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {customer.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CustomerCard;