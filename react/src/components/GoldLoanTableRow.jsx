// components/GoldLoanTableRow.jsx
import React from 'react';
import { 
  Edit, 
  Eye, 
  Coins, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  DollarSign,
  Image as ImageIcon
} from 'lucide-react';

const GoldLoanTableRow = ({ loan, onEdit, onView, onPayment }) => {
  const getStatusConfig = (status) => {
   const configs = {
      active: { 
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        icon: CheckCircle,
        label: 'Active' 
      },
      overdue: { 
        bg: 'bg-red-100', 
        text: 'text-red-800', 
        icon: AlertTriangle,
        label: 'Overdue' 
      },
      completed: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-800', 
        icon: CheckCircle,
        label: 'Completed' 
      }
    };
    return configs[status] || configs.active;
  };

  const statusConfig = getStatusConfig(loan.status);
  const StatusIcon = statusConfig.icon;

  const formatCurrency = (amount) => `₹${amount.toLocaleString()}`;
  
  return (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      {/* Loan ID & Gold Item */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
            <Coins size={16} />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{loan.id}</div>
            <div className="text-sm text-gray-500">{loan.goldItem}</div>
          </div>
        </div>
      </td>
      
      {/* Customer Info */}
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">{loan.customerName}</div>
        <div className="text-sm text-gray-500">{loan.customerPhone}</div>
      </td>
      
      {/* Gold Details */}
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">
          <div className="font-medium">{loan.goldWeight}g • {loan.goldType}</div>
          <div className="text-gray-500">Purity: {loan.purity}</div>
        </div>
      </td>
      
      {/* Loan Amount */}
      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
        {formatCurrency(loan.loanAmount)}
      </td>
      
      {/* Outstanding */}
      <td className="px-6 py-4 text-sm font-semibold text-amber-600">
        {formatCurrency(loan.outstandingAmount)}
      </td>
      
      {/* Due Date */}
      <td className="px-6 py-4 text-sm text-gray-900">
        {loan.dueDate}
      </td>
      
      {/* Photos */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-1">
          <ImageIcon size={16} className="text-gray-400" />
          <span className="text-sm text-gray-600">{loan.photos?.length || 0}</span>
        </div>
      </td>
      
      {/* Status */}
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
          <StatusIcon size={12} />
          {statusConfig.label}
        </span>
      </td>
      
      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex gap-2">
          {loan.status === 'active' && (
            <button
              onClick={() => onPayment(loan)}
              className="w-8 h-8 border border-blue-300 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:border-blue-500 hover:bg-blue-100 transition-all duration-200"
              title="Make Payment"
            >
              <DollarSign size={14} />
            </button>
          )}
          <button
            onClick={() => onEdit(loan)}
            className="w-8 h-8 border border-gray-300 rounded-lg bg-white text-gray-600 flex items-center justify-center hover:border-amber-500 hover:text-amber-500 hover:bg-amber-50 transition-all duration-200"
            title="Edit Loan"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onView(loan)}
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

export default GoldLoanTableRow;
