import React, { useState } from 'react';
import { 
  Edit3, 
  Eye, 
  Phone, 
  Calendar, 
  Coins, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  MessageSquare,
  X,
  Camera,
  MapPin,
  Clock,
  Percent
} from 'lucide-react';

export const GoldLoanCard = ({ 
  loan, 
  onEdit, 
  onView, 
  onPayment, 
  onSendReminder,
  compact = false 
}) => {
  const [showModal, setShowModal] = useState(false);

  const getStatusConfig = (status) => {
    const configs = {
      active: { 
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        border: 'border-green-200',
        icon: CheckCircle,
        label: 'Active' 
      },
      overdue: { 
        bg: 'bg-red-100', 
        text: 'text-red-800', 
        border: 'border-red-200',
        icon: AlertTriangle,
        label: 'Overdue' 
      },
      completed: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-800', 
        border: 'border-blue-200',
        icon: CheckCircle,
        label: 'Completed' 
      },
      pending: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800', 
        border: 'border-yellow-200',
        icon: Clock,
        label: 'Pending' 
      }
    };
    return configs[status] || configs.pending;
  };

  const getDaysUntilDue = () => {
    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const statusConfig = getStatusConfig(loan.status);
  const StatusIcon = statusConfig.icon;
  const daysUntilDue = getDaysUntilDue();
  const isOverdue = daysUntilDue < 0;
  const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0;

  const formatCurrency = (amount) => `₹${amount?.toLocaleString() || '0'}`;
  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');

  return (
    <>
      <div 
        className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-amber-300 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer w-full"
        onClick={() => setShowModal(true)}
      >
        {/* Header with Golden Icon - Responsive */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 sm:p-5 border-b border-amber-100">
          <div className="flex items-start justify-between flex-wrap gap-2 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white shadow-lg ring-2 sm:ring-4 ring-amber-100 flex-shrink-0">
                <Coins size={20} className="sm:w-6 sm:h-6 drop-shadow-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{loan.id}</h3>
                <p className="text-xs sm:text-sm text-amber-700 font-medium truncate">{loan.goldItem}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {(isOverdue || isDueSoon) && (
                <AlertTriangle size={16} className={`sm:w-[18px] sm:h-[18px] ${isOverdue ? 'text-red-500' : 'text-yellow-500'}`} />
              )}
              <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-xs font-semibold rounded-full border whitespace-nowrap ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                <StatusIcon size={10} className="sm:w-3 sm:h-3" />
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>

        {/* Alert Section - Responsive */}
        {(isOverdue || isDueSoon) && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-red-800">
                {isOverdue 
                  ? `Payment overdue by ${Math.abs(daysUntilDue)} days`
                  : `Payment due in ${daysUntilDue} days`
                }
              </span>
            </div>
          </div>
        )}

        {/* Essential Information - Responsive */}
        <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
          {/* Customer Info - Stack on mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <User size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
              <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">{loan.customerName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 ml-6 sm:ml-0">
              <Phone size={12} className="sm:w-[14px] sm:h-[14px] text-gray-400 flex-shrink-0" />
              <span className="truncate">{loan.customerPhone}</span>
            </div>
          </div>

          {/* Key Financial Info - Always 2 columns but responsive sizing */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg sm:rounded-xl">
              <div className="text-sm sm:text-lg font-bold text-gray-900 mb-1">
                {formatCurrency(loan.loanAmount)}
              </div>
              <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                Loan Amount
              </div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg sm:rounded-xl border border-red-100">
              <div className="text-sm sm:text-lg font-bold text-red-600 mb-1">
                {formatCurrency(loan.outstandingAmount)}
              </div>
              <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                Outstanding
              </div>
            </div>
          </div>

          {/* Gold Info - Responsive text */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-3 border border-amber-100">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 text-xs sm:text-sm">
              <span className="text-gray-600">Weight & Purity:</span>
              <span className="font-semibold text-gray-900">{loan.goldWeight}g • {loan.purity}</span>
            </div>
          </div>

          {/* Due Date - Stack on mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-600">Due: {formatDate(loan.dueDate)}</span>
            </div>
            {loan.photos && loan.photos.length > 0 && (
              <div className="flex items-center gap-1 text-xs sm:text-sm text-amber-600 ml-6 sm:ml-0">
                <Camera size={12} className="sm:w-[14px] sm:h-[14px]" />
                <span>{loan.photos.length} photos</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Responsive wrapping */}
        <div className="px-3 sm:px-5 pb-3 sm:pb-5">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <Eye size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">View Details</span>
              <span className="xs:hidden">View</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit && onEdit(loan);
              }}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <Edit3 size={14} className="sm:w-4 sm:h-4" />
              Edit
            </button>
            {loan.status === 'active' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPayment && onPayment(loan);
                }}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
              >
                <DollarSign size={14} className="sm:w-4 sm:h-4" />
                Payment
              </button>
            )}
            {(isOverdue || isDueSoon) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSendReminder && onSendReminder(loan);
                }}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all duration-200 hover:scale-105"
              >
                <MessageSquare size={14} className="sm:w-4 sm:h-4" />
                Remind
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal */}
      <GoldLoanDetailModal
        loan={loan}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onEdit={(loan) => {
          setShowModal(false);
          onEdit && onEdit(loan);
        }}
        onPayment={(loan) => {
          setShowModal(false);
          onPayment && onPayment(loan);
        }}
        onSendReminder={(loan) => {
          setShowModal(false);
          onSendReminder && onSendReminder(loan);
        }}
      />
    </>
  );
};

// Detailed View Modal with Full Responsiveness
export const GoldLoanDetailModal = ({ loan, isOpen, onClose, onEdit, onPayment, onSendReminder }) => {
  if (!isOpen || !loan) return null;

  const formatCurrency = (amount) => `₹${amount?.toLocaleString() || '0'}`;
  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-2xl w-full max-w-4xl h-full sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Sticky Modal Header - Responsive */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-6 border-b border-amber-100 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white shadow-lg ring-2 sm:ring-4 ring-amber-100 flex-shrink-0">
                <Coins size={24} className="sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{loan.id}</h2>
                <p className="text-sm sm:text-base text-amber-700 font-medium truncate">{loan.goldItem}</p>
                <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-xs font-semibold rounded-full mt-2 ${statusConfig.bg} ${statusConfig.text}`}>
                  <StatusIcon size={10} className="sm:w-3 sm:h-3" />
                  {statusConfig.label}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center transition-all flex-shrink-0"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content - Responsive */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Customer Information */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Customer Details</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm text-gray-500 block">Name</span>
                    <span className="font-medium text-gray-900 text-sm sm:text-base truncate block">{loan.customerName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm text-gray-500 block">Phone</span>
                    <span className="font-medium text-gray-900 text-sm sm:text-base">{loan.customerPhone}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm text-gray-500 block">Address</span>
                    <span className="font-medium text-gray-900 text-sm sm:text-base">{loan.customerAddress || 'Not provided'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm text-gray-500 block">Customer ID</span>
                    <span className="font-medium text-gray-900 text-sm sm:text-base">{loan.customerId || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loan Financial Details - Responsive Grid */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Financial Information</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-xl">
                <div className="text-lg sm:text-2xl font-bold text-blue-600 mb-1">
                  {formatCurrency(loan.loanAmount)}
                </div>
                <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                  Principal Amount
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-red-50 rounded-xl">
                <div className="text-lg sm:text-2xl font-bold text-red-600 mb-1">
                  {formatCurrency(loan.outstandingAmount)}
                </div>
                <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                  Outstanding
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-xl">
                <div className="text-lg sm:text-2xl font-bold text-green-600 mb-1">
                  {loan.interestRate || 12}%
                </div>
                <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                  Interest Rate
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-xl">
                <div className="text-lg sm:text-2xl font-bold text-purple-600 mb-1">
                  ₹{((loan.outstandingAmount - loan.loanAmount) || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                  Interest Due
                </div>
              </div>
            </div>
          </div>

          {/* Gold Details - Responsive */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Gold Item Details</h3>
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-xl p-4 sm:p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center sm:text-left">
                  <span className="text-gray-600 block mb-1 text-sm sm:text-base">Weight</span>
                  <span className="text-lg sm:text-xl font-bold text-gray-900">{loan.goldWeight}g</span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-gray-600 block mb-1 text-sm sm:text-base">Purity</span>
                  <span className="text-lg sm:text-xl font-bold text-gray-900">{loan.purity}</span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-gray-600 block mb-1 text-sm sm:text-base">Type</span>
                  <span className="text-lg sm:text-xl font-bold text-gray-900">{loan.goldType || 'Jewelry'}</span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-gray-600 block mb-1 text-sm sm:text-base">Market Rate</span>
                  <span className="text-lg sm:text-xl font-bold text-gray-900">₹{loan.goldRate || '5,500'}/g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Date Information - Responsive */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Timeline</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                <Calendar size={18} className="sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-gray-500 block">Start Date</span>
                  <span className="font-medium text-gray-900 text-sm sm:text-base">{formatDate(loan.startDate)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-yellow-50 rounded-xl">
                <Clock size={18} className="sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-gray-500 block">Due Date</span>
                  <span className="font-medium text-gray-900 text-sm sm:text-base">{formatDate(loan.dueDate)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-blue-50 rounded-xl">
                <Percent size={18} className="sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-gray-500 block">Term</span>
                  <span className="font-medium text-gray-900 text-sm sm:text-base">{loan.loanTerm || '6'} months</span>
                </div>
              </div>
            </div>
          </div>

          {/* Photos - Responsive Grid */}
          {loan.photos && loan.photos.length > 0 && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Item Photos ({loan.photos.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {loan.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Gold item ${index + 1}`}
                      className="w-full h-24 sm:h-32 object-cover rounded-lg border-2 border-amber-200 cursor-pointer hover:border-amber-400 transition-colors"
                      onClick={() => window.open(photo, '_blank')}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <Eye size={18} className="sm:w-5 sm:h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons - Responsive */}
          <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-100">
            <button
              onClick={() => onEdit(loan)}
              className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Edit3 size={14} className="sm:w-4 sm:h-4" />
              Edit Loan
            </button>
            {loan.status === 'active' && (
              <button
                onClick={() => onPayment(loan)}
                className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg transition-all shadow-sm"
              >
                <DollarSign size={14} className="sm:w-4 sm:h-4" />
                Make Payment
              </button>
            )}
            <button
              onClick={() => onSendReminder(loan)}
              className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <MessageSquare size={14} className="sm:w-4 sm:h-4" />
              Send Reminder
            </button>
            <button
              onClick={() => window.location.href = `tel:${loan.customerPhone}`}
              className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Phone size={14} className="sm:w-4 sm:h-4" />
              Call Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Demo Component with Sample Data
const GoldLoanDemo = () => {
  const sampleLoan = {
    id: "GL2024001",
    customerName: "Rajesh Kumar",
    customerPhone: "+91 98765 43210",
    customerAddress: "123 MG Road, Bangalore, Karnataka",
    customerId: "CUST001",
    goldItem: "Gold Necklace Set",
    goldWeight: 45.5,
    purity: "22K",
    goldType: "Jewelry",
    goldRate: 5500,
    loanAmount: 180000,
    outstandingAmount: 195000,
    interestRate: 12,
    startDate: "2024-01-15",
    dueDate: "2024-08-15",
    loanTerm: 6,
    status: "active",
    photos: [
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300",
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=300",
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=300"
    ]
  };

  const handleEdit = (loan) => {
    console.log('Edit loan:', loan.id);
  };

  const handlePayment = (loan) => {
    console.log('Make payment for loan:', loan.id);
  };

  const handleSendReminder = (loan) => {
    console.log('Send reminder for loan:', loan.id);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Gold Loan Management</h1>
          <p className="text-gray-600 text-sm sm:text-base">Responsive design for all devices</p>
        </div>
        
        {/* Grid Layout - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          <GoldLoanCard
            loan={sampleLoan}
            onEdit={handleEdit}
            onPayment={handlePayment}
            onSendReminder={handleSendReminder}
          />
          
          {/* Additional sample cards with different statuses */}
          <GoldLoanCard
            loan={{
              ...sampleLoan,
              id: "GL2024002",
              customerName: "Priya Sharma",
              status: "overdue",
              dueDate: "2024-08-10",
              outstandingAmount: 125000,
              goldItem: "Gold Bangles"
            }}
            onEdit={handleEdit}
            onPayment={handlePayment}
            onSendReminder={handleSendReminder}
          />
          
          <GoldLoanCard
            loan={{
              ...sampleLoan,
              id: "GL2024003",
              customerName: "Mohammed Ali",
              status: "completed",
              dueDate: "2024-07-15",
              outstandingAmount: 0,
              goldItem: "Gold Chain"
            }}
            onEdit={handleEdit}
            onPayment={handlePayment}
            onSendReminder={handleSendReminder}
          />
        </div>
      </div>
    </div>
  );
};

export default GoldLoanDemo;