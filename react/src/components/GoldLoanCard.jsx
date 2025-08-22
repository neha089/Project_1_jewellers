// components/GoldLoanCard.jsx
import React from 'react';
import { Edit3, Eye, DollarSign, Phone, Calendar, Coins, AlertTriangle, CheckCircle, MessageSquare } from 'lucide-react';

const GoldLoanCard = ({ loan, onEdit, onView, onPayment, onSendReminder }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDaysUntilDue = () => {
    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue();
  const isOverdue = daysUntilDue < 0;
  const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{loan.id}</h3>
            <p className="text-sm text-gray-600">{loan.customerName}</p>
          </div>
          <div className="flex items-center gap-2">
            {(isOverdue || isDueSoon) && (
              <AlertTriangle size={16} className={isOverdue ? 'text-red-500' : 'text-yellow-500'} />
            )}
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(loan.status)}`}>
              {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Gold Information */}
        <div className="flex items-center gap-2 text-sm">
          <Coins size={16} className="text-amber-600" />
          <span className="text-gray-600">{loan.goldItem}</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">{loan.goldWeight}g</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">{loan.purity}</span>
        </div>

        {/* Amount Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Loan Amount</p>
            <p className="text-sm font-medium text-gray-900">₹{loan.loanAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Outstanding</p>
            <p className="text-sm font-medium text-red-600">₹{loan.outstandingAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Due Date */}
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <span className="text-sm text-gray-600">Due: {loan.dueDate}</span>
          {isOverdue && (
            <span className="text-xs text-red-600 font-medium">
              ({Math.abs(daysUntilDue)} days overdue)
            </span>
          )}
          {isDueSoon && !isOverdue && (
            <span className="text-xs text-yellow-600 font-medium">
              ({daysUntilDue} days left)
            </span>
          )}
        </div>

        {/* Contact Information */}
        <div className="flex items-center gap-2">
          <Phone size={16} className="text-gray-400" />
          <span className="text-sm text-gray-600">{loan.customerPhone}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onView(loan)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Eye size={14} />
            View
          </button>
          <button
            onClick={() => onEdit(loan)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Edit3 size={14} />
            Edit
          </button>
          <button
            onClick={() => onPayment(loan)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <DollarSign size={14} />
            Payment
          </button>
          {(isOverdue || isDueSoon) && (
            <button
              onClick={() => onSendReminder(loan)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <MessageSquare size={14} />
              Remind
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoldLoanCard;