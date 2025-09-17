// components/GoldLoanTableRow.jsx
import React from 'react';
import { 
  Edit3, 
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
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Active' },
      OVERDUE: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle, label: 'Overdue' },
      COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle, label: 'Completed' },
      CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle, label: 'Closed' }
    };
    return configs[status] || configs.ACTIVE;
  };

  const statusConfig = getStatusConfig(loan.status);
  const StatusIcon = statusConfig.icon;
  const formatCurrency = (amount) => `₹${amount?.toLocaleString() || '0'}`;
  const loanAmount = loan.principalPaise ? loan.principalPaise / 100 : 0;
  const outstandingAmount = loan.currentPrincipalPaise ? loan.currentPrincipalPaise / 100 : loanAmount;
  const totalWeight = loan.items?.reduce((sum, item) => sum + (item.weightGram || 0), 0) || 0;
  const totalPhotos = loan.items?.reduce((sum, item) => sum + (item.images?.length || 0), 0) || 0;
  
  return (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
            <Coins size={16} />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{loan._id}</div>
            <div className="text-sm text-gray-500">{loan.items?.length || 0} items</div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">{loan.customer?.name || 'Unknown'}</div>
        <div className="text-sm text-gray-500">{loan.customer?.phone || 'N/A'}</div>
      </td>
      
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">
          <div className="font-medium">{totalWeight}g</div>
          <div className="text-gray-500">Interest: {loan.interestRateMonthlyPct || 0}%</div>
        </div>
      </td>
      
      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
        {formatCurrency(loanAmount)}
      </td>
      
      <td className="px-6 py-4 text-sm font-semibold text-amber-600">
        {formatCurrency(outstandingAmount)}
      </td>
      
      <td className="px-6 py-4 text-sm text-gray-900">
        {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString('en-IN') : 'N/A'}
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center gap-1">
          <ImageIcon size={16} className="text-gray-400" />
          <span className="text-sm text-gray-600">{totalPhotos}</span>
        </div>
      </td>
      
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
          <StatusIcon size={12} />
          {statusConfig.label}
        </span>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex gap-2">
          {loan.status === 'ACTIVE' && (
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
            <Edit3 size={14} />
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
