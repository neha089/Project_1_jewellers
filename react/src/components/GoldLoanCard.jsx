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


export const GoldLoanCard = ({ loan, onEdit, onView, onPayment, onSendReminder }) => {
  const [showModal, setShowModal] = useState(false);

  const getStatusConfig = (status) => {
    const configs = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Active' },
      OVERDUE: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle, label: 'Overdue' },
      COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle, label: 'Completed' },
      CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle, label: 'Closed' }
    };
    return configs[status] || configs.ACTIVE;
  };

  const getDaysUntilDue = () => {
    if (!loan.dueDate) return 0;
    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    const diffTime = dueDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const statusConfig = getStatusConfig(loan.status);
  const StatusIcon = statusConfig.icon;
  const daysUntilDue = getDaysUntilDue();
  const isOverdue = daysUntilDue < 0;
  const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0;

  const formatCurrency = (amount) => `₹${amount?.toLocaleString() || '0'}`;
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN') : 'N/A';

  // Calculate current values from items
  const totalWeight = loan.items?.reduce((sum, item) => sum + (item.weightGram || 0), 0) || 0;
  const loanAmount = loan.principalPaise ? loan.principalPaise / 100 : 0;
  const outstandingAmount = loan.currentPrincipalPaise ? loan.currentPrincipalPause / 100 : loanAmount;

  return (
    <>
      <div 
        className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-amber-300 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer w-full"
        onClick={() => setShowModal(true)}
      >
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 sm:p-5 border-b border-amber-100">
          <div className="flex items-start justify-between flex-wrap gap-2 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white shadow-lg ring-2 sm:ring-4 ring-amber-100 flex-shrink-0">
                <Coins size={20} className="sm:w-6 sm:h-6 drop-shadow-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{loan._id}</h3>
                <p className="text-xs sm:text-sm text-amber-700 font-medium truncate">
                  {loan.items?.length || 0} items • {totalWeight}g
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {(isOverdue || isDueSoon) && (
                <AlertTriangle size={16} className={`sm:w-[18px] sm:h-[18px] ${isOverdue ? 'text-red-500' : 'text-yellow-500'}`} />
              )}
              <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-xs font-semibold rounded-full border whitespace-nowrap ${statusConfig.bg} ${statusConfig.text}`}>
                <StatusIcon size={10} className="sm:w-3 sm:h-3" />
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>

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

        <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <User size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
              <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                {loan.customer?.name || 'Unknown Customer'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 ml-6 sm:ml-0">
              <Phone size={12} className="sm:w-[14px] sm:h-[14px] text-gray-400 flex-shrink-0" />
              <span className="truncate">{loan.customer?.phone || 'N/A'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg sm:rounded-xl">
              <div className="text-sm sm:text-lg font-bold text-gray-900 mb-1">
                {formatCurrency(loanAmount)}
              </div>
              <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                Loan Amount
              </div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg sm:rounded-xl border border-red-100">
              <div className="text-sm sm:text-lg font-bold text-red-600 mb-1">
                {formatCurrency(outstandingAmount)}
              </div>
              <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                Outstanding
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-3 border border-amber-100">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 text-xs sm:text-sm">
              <span className="text-gray-600">Weight & Interest:</span>
              <span className="font-semibold text-gray-900">
                {totalWeight}g • {loan.interestRateMonthlyPct || 0}% /month
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-600">Due: {formatDate(loan.dueDate)}</span>
            </div>
            {loan.items && loan.items.length > 0 && (
              <div className="flex items-center gap-1 text-xs sm:text-sm text-amber-600 ml-6 sm:ml-0">
                <Camera size={12} className="sm:w-[14px] sm:h-[14px]" />
                <span>{loan.items.reduce((sum, item) => sum + (item.images?.length || 0), 0)} photos</span>
              </div>
            )}
          </div>
        </div>

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
            {loan.status === 'ACTIVE' && (
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
const GoldLoanDetailModal = ({ loan, isOpen, onClose, onEdit, onPayment, onSendReminder }) => {
  if (!isOpen || !loan) return null;

  const formatCurrency = (amount) => `₹${amount?.toLocaleString() || '0'}`;
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN') : 'N/A';

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
  const loanAmount = loan.principalPaise ? loan.principalPaise / 100 : 0;
  const outstandingAmount = loan.currentPrincipalPaise ? loan.currentPrincipalPaise / 100 : loanAmount;
  const totalWeight = loan.items?.reduce((sum, item) => sum + (item.weightGram || 0), 0) || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-2xl w-full max-w-4xl h-full sm:max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-6 border-b border-amber-100 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white shadow-lg ring-2 sm:ring-4 ring-amber-100 flex-shrink-0">
                <Coins size={24} className="sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{loan._id}</h2>
                <p className="text-sm sm:text-base text-amber-700 font-medium truncate">
                  {loan.items?.length || 0} items • {totalWeight}g
                </p>
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Customer Details</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm text-gray-500 block">Name</span>
                    <span className="font-medium text-gray-900 text-sm sm:text-base truncate block">
                      {loan.customer?.name || 'Unknown Customer'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm text-gray-500 block">Phone</span>
                    <span className="font-medium text-gray-900 text-sm sm:text-base">
                      {loan.customer?.phone || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm text-gray-500 block">Email</span>
                    <span className="font-medium text-gray-900 text-sm sm:text-base">
                      {loan.customer?.email || 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Financial Information</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-xl">
                <div className="text-lg sm:text-2xl font-bold text-blue-600 mb-1">
                  {formatCurrency(loanAmount)}
                </div>
                <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                  Principal Amount
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-red-50 rounded-xl">
                <div className="text-lg sm:text-2xl font-bold text-red-600 mb-1">
                  {formatCurrency(outstandingAmount)}
                </div>
                <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                  Outstanding
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-xl">
                <div className="text-lg sm:text-2xl font-bold text-green-600 mb-1">
                  {loan.interestRateMonthlyPct || 0}%
                </div>
                <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                  Interest Rate
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-xl">
                <div className="text-lg sm:text-2xl font-bold text-purple-600 mb-1">
                  {totalWeight}g
                </div>
                <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                  Total Weight
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Gold Items ({loan.items?.length || 0})</h3>
            {loan.items && loan.items.length > 0 ? (
              <div className="space-y-3">
                {loan.items.map((item, index) => (
                  <div key={index} className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-xl p-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <span className="text-gray-600 block mb-1 text-sm">Item Name</span>
                        <span className="text-base font-medium text-gray-900">{item.name || 'Gold Item'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1 text-sm">Weight</span>
                        <span className="text-base font-medium text-gray-900">{item.weightGram}g</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1 text-sm">Purity</span>
                        <span className="text-base font-medium text-gray-900">{item.purityK}K</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1 text-sm">Amount</span>
                        <span className="text-base font-medium text-gray-900">
                          {formatCurrency(item.amountPaise ? item.amountPaise / 100 : 0)}
                        </span>
                      </div>
                    </div>
                    {item.images && item.images.length > 0 && (
                      <div className="mt-3">
                        <span className="text-gray-600 text-sm mb-2 block">Photos ({item.images.length})</span>
                        <div className="flex gap-2 flex-wrap">
                          {item.images.slice(0, 3).map((image, imgIndex) => (
                            <div key={imgIndex} className="w-16 h-16 rounded-lg overflow-hidden border border-amber-200">
                              <img 
                                src={image} 
                                alt={`${item.name} ${imgIndex + 1}`}
                                className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => window.open(image, '_blank')}
                              />
                            </div>
                          ))}
                          {item.images.length > 3 && (
                            <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                              <span className="text-xs text-gray-500">+{item.images.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No items found</p>
            )}
          </div>

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
                  <span className="text-xs sm:text-sm text-gray-500 block">Monthly Interest</span>
                  <span className="font-medium text-gray-900 text-sm sm:text-base">{loan.interestRateMonthlyPct || 0}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-100">
            <button
              onClick={() => onEdit(loan)}
              className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Edit3 size={14} className="sm:w-4 sm:h-4" />
              Edit Loan
            </button>
            {loan.status === 'ACTIVE' && (
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
              onClick={() => window.location.href = `tel:${loan.customer?.phone}`}
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
