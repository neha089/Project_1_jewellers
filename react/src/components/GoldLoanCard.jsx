// components/GoldLoanCard.jsx
import React, { useState } from 'react';
import { 
  Edit, 
  Eye, 
  Phone, 
  Calendar, 
  Coins, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  User
} from 'lucide-react';

const GoldLoanCard = ({ loan, onEdit, onView, onPayment }) => {
  const [imageError, setImageError] = useState({});

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
      closed: { 
        bg: 'bg-gray-100', 
        text: 'text-gray-800', 
        icon: XCircle,
        label: 'Closed' 
      }
    };
    return configs[status] || configs.active;
  };

  const statusConfig = getStatusConfig(loan.status);
  const StatusIcon = statusConfig.icon;

  const handleImageError = (index) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  const formatCurrency = (amount) => `₹${amount.toLocaleString()}`;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-amber-300 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white text-lg font-semibold shadow-md">
            <Coins size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{loan.id}</h3>
            <p className="text-sm text-gray-500">{loan.goldItem}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(loan);
            }}
            className="w-8 h-8 border border-gray-300 rounded-lg bg-white text-gray-600 flex items-center justify-center hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all duration-200"
            title="Edit Loan"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(loan);
            }}
            className="w-8 h-8 border border-gray-300 rounded-lg bg-white text-gray-600 flex items-center justify-center hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all duration-200"
            title="View Details"
          >
            <Eye size={14} />
          </button>
        </div>
      </div>

      {/* Customer Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User size={14} className="text-gray-400" />
          <span className="font-medium">{loan.customerName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone size={14} className="text-gray-400" />
          <span>{loan.customerPhone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={14} className="text-gray-400" />
          <span>Due: {loan.dueDate}</span>
        </div>
      </div>

      {/* Gold Details */}
      <div className="bg-amber-50 rounded-lg p-3 mb-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Weight:</span>
            <span className="font-medium text-gray-900 ml-1">{loan.goldWeight}g</span>
          </div>
          <div>
            <span className="text-gray-500">Type:</span>
            <span className="font-medium text-gray-900 ml-1">{loan.goldType}</span>
          </div>
          <div>
            <span className="text-gray-500">Purity:</span>
            <span className="font-medium text-gray-900 ml-1">{loan.purity}</span>
          </div>
          <div>
            <span className="text-gray-500">Rate:</span>
            <span className="font-medium text-gray-900 ml-1">{loan.interestRate}%</span>
          </div>
        </div>
      </div>

      {/* Photos Section */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Proof Photos ({loan.photos.length})
        </h4>
        <div className="flex gap-2 overflow-x-auto">
          {loan.photos.map((photo, index) => (
            <div key={index} className="flex-shrink-0">
              {imageError[index] ? (
                <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                  <ImageIcon size={16} className="text-gray-400" />
                </div>
              ) : (
                <img
                  src={photo}
                  alt={`Gold item ${index + 1}`}
                  className="w-16 h-12 object-cover rounded-lg border border-gray-200 hover:scale-105 transition-transform cursor-pointer"
                  onError={() => handleImageError(index)}
                  onClick={() => {
                    // You can implement a modal to show full-size image here
                    window.open(photo, '_blank');
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Financial Info */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{formatCurrency(loan.loanAmount)}</div>
          <div className="text-xs text-gray-500">Principal</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-amber-600">{formatCurrency(loan.outstandingAmount)}</div>
          <div className="text-xs text-gray-500">Outstanding</div>
        </div>
      </div>

      {/* Status and Action */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
          <StatusIcon size={12} />
          {statusConfig.label}
        </span>
        
        {loan.status === 'active' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPayment(loan);
            }}
            className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-1"
          >
            <DollarSign size={12} />
            Payment
          </button>
        )}
      </div>
    </div>
  );
};

export default GoldLoanCard;