import React, { useState, useEffect } from 'react';
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
  Percent,
  History,
  Receipt,
  CreditCard,
  ChevronDown,
  ChevronUp,
  FileText,
  Filter,
  TrendingUp
} from 'lucide-react';
import ApiService from '../../services/api';
import InterestPaymentModal from './InterestPaymentModal';
import ItemRepaymentModal from './ItemRepaymentModal.jsx';

export const GoldLoanCard = ({ loan, onEdit, onView, onPayment, onSendReminder }) => {
  const [showModal, setShowModal] = useState(false);
  const [showInterestPaymentModal, setShowInterestPaymentModal] = useState(false);
  const [showItemRepaymentModal, setShowItemRepaymentModal] = useState(false);

  const getStatusConfig = (status) => {
    const configs = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Active' },
      OVERDUE: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle, label: 'Overdue' },
      PARTIALLY_PAID: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Partial' },
      CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle, label: 'Closed' },
      DEFAULTED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Defaulted' }
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
  const isOverdue = false
  const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0;

  const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN') : 'N/A';
  const formatDateTime = (date) => date ? new Date(date).toLocaleString('en-IN', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  }) : 'N/A';

  const totalWeight = loan.items?.reduce((sum, item) => sum + (item.weightGram || 0), 0) || 0;
  const loanAmount = loan.totalLoanAmount || 0; 
  const outstandingAmount = loan.currentLoanAmount || 0;

  // Calculate payment summaries from the payments array
  const interestPayments = loan.payments?.filter(p => p.type === 'INTEREST') || [];
  const principalPayments = loan.payments?.filter(p => p.type === 'PRINCIPAL') || [];
  
  const totalInterestPaid = interestPayments.reduce((sum, p) => sum + (p.interestAmount || 0), 0);
  const totalPrincipalPaid = principalPayments.reduce((sum, p) => sum + (p.principalAmount || 0), 0);
  const totalItemsReturned = principalPayments.reduce((sum, p) => sum + (p.totalItemsReturned || 0), 0);

  const handleInterestPaymentSuccess = (result) => {
    console.log('Interest payment successful:', result);
    if (onPayment) {
      onPayment(loan);
    }
    // Refresh the page to reflect updated data
    window.location.reload();
  };

  const handleItemRepaymentSuccess = (result) => {
    console.log('Item repayment successful:', result);
    if (onPayment) {
      onPayment(loan);
    }
  };

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
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{loan.loanNumber || loan._id}</h3>
                <p className="text-xs sm:text-sm text-amber-700 font-medium truncate">
                  {loan.items?.length || 0} items • {totalWeight.toFixed(1)}g
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
                {totalWeight.toFixed(1)}g • {loan.interestRateMonthlyPct || 0}% /month
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-600">Due: {formatDate(loan.dueDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600 ml-6 sm:ml-0">
              <TrendingUp size={14} className="sm:w-4 sm:h-4" />
              <span>₹{totalPrincipalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })} paid</span>
            </div>
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
            
            {loan.status !== "CLOSED" && (
              <div className="relative group">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white 
                            bg-gradient-to-r from-green-500 to-green-600 
                            hover:from-green-600 hover:to-green-700 
                            rounded-lg shadow-sm transition-all"
                >
                  <DollarSign size={16} />
                  Payment
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-9" />
                  </svg>
                </button>
              
                <div className="absolute bottom-full left-0 mb-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowInterestPaymentModal(true);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      Interest Payment
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowItemRepaymentModal(true);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-green-50 rounded-md transition-colors"
                    >
                      Item Repayment
                    </button>
                  </div>
                </div>
              </div>
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
          if (loan.type === 'INTEREST') {
            setShowInterestPaymentModal(true);
          } else {
            setShowItemRepaymentModal(true);
          }
        }}
        onSendReminder={(loan) => {
          setShowModal(false);
          onSendReminder && onSendReminder(loan);
        }}
      />

      <InterestPaymentModal
        isOpen={showInterestPaymentModal}
        onClose={() => setShowInterestPaymentModal(false)}
        loan={loan}
        onPaymentSuccess={handleInterestPaymentSuccess}
      />
      <ItemRepaymentModal
        isOpen={showItemRepaymentModal}
        onClose={() => setShowItemRepaymentModal(false)}
        loan={loan}
        onRepaymentSuccess={handleItemRepaymentSuccess}
      />
    </>
  );
};

const GoldLoanDetailModal = ({ loan, isOpen, onClose, onEdit, onPayment, onSendReminder }) => {
  const [loading, setLoading] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(true);
  const [showItemHistory, setShowItemHistory] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'interest', 'principal'

  // Extract payments from the loan object
  const allPayments = loan.payments || [];
  const isOverdue=false
  // Filter payments based on active tab
  const filteredPayments = activeTab === 'all' 
    ? allPayments 
    : allPayments.filter(p => p.type.toLowerCase().includes(activeTab));

  // Sort payments by date (newest first)
  const sortedPayments = [...filteredPayments].sort((a, b) => 
    new Date(b.date) - new Date(a)
  );

  // Separate interest and principal payments for summaries
  const interestPayments = allPayments.filter(p => p.type === 'INTEREST');
  const principalPayments = allPayments.filter(p => p.type === 'PRINCIPAL');

  const totalInterestPaid = interestPayments.reduce((sum, p) => sum + (p.interestAmount || 0), 0);
  const totalPrincipalPaid = principalPayments.reduce((sum, p) => sum + (p.principalAmount || 0), 0);
  const totalItemsReturned = principalPayments.reduce((sum, p) => sum + (p.totalItemsReturned || 0), 0);
  const totalWeightReturned = principalPayments.reduce((sum, p) => sum + (p.totalWeightReturned || 0), 0);

  if (!isOpen || !loan) return null;

  const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN') : 'N/A';
  const formatDateTime = (date) => date ? new Date(date).toLocaleString('en-IN', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  }) : 'N/A';

  const getStatusConfig = (status) => {
    const configs = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Active' },
      OVERDUE: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle, label: 'Overdue' },
      PARTIALLY_PAID: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Partial' },
      CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle, label: 'Closed' },
      DEFAULTED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Defaulted' }
    };
    return configs[status] || configs.ACTIVE;
  };

  const getPaymentTypeConfig = (type) => {
    const configs = {
      INTEREST: { 
        bg: 'bg-blue-50', 
        text: 'text-blue-800', 
        icon: Percent, 
        label: 'Interest Payment',
        color: 'blue'
      },
      PRINCIPAL: { 
        bg: 'bg-green-50', 
        text: 'text-green-800', 
        icon: DollarSign, 
        label: 'Principal Repayment',
        color: 'green'
      },
      PRINCIPAL_AND_INTEREST: { 
        bg: 'bg-purple-50', 
        text: 'text-purple-800', 
        icon: TrendingUp, 
        label: 'Full Payment',
        color: 'purple'
      },
      PROCESSING_FEE: { 
        bg: 'bg-gray-50', 
        text: 'text-gray-800', 
        icon: FileText, 
        label: 'Processing Fee',
        color: 'gray'
      },
      LATE_FEE: { 
        bg: 'bg-red-50', 
        text: 'text-red-800', 
        icon: AlertTriangle, 
        label: 'Late Fee',
        color: 'red'
      }
    };
    return configs[type] || configs.INTEREST;
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      'CASH': '💵',
      'CHEQUE': '📝',
      'BANK_TRANSFER': '🏦',
      'UPI': '💳',
      'CARD': '💳',
      'NET_BANKING': '🏦'
    };
    return icons[method] || '💰';
  };

  const getItemNamesFromIds = (itemIds) => {
    if (!itemIds || itemIds.length === 0) return 'None';
    return loan.items
      ?.filter(item => itemIds.includes(item._id.toString()))
      .map(item => item.name || 'Gold Item')
      .slice(0, 2)
      .join(', ') || 'Unknown items';
  };

  const statusConfig = getStatusConfig(loan.status);
  const StatusIcon = statusConfig.icon;
  const totalWeight = loan.items?.reduce((sum, item) => sum + (item.weightGram || 0), 0) || 0;
  const loanAmount = loan.totalLoanAmount || 0;
  const outstandingAmount = loan.currentLoanAmount || loan.totalLoanAmount || 0;

  const getAppreciationStatus = (appreciation) => {
    if (appreciation > 0) return { text: `+${appreciation.toFixed(0)}`, className: 'text-green-600' };
    if (appreciation < 0) return { text: `${appreciation.toFixed(0)}`, className: 'text-red-600' };
    return { text: '0', className: 'text-gray-500' };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-2xl w-full max-w-6xl h-full sm:max-h-[95vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-6 border-b border-amber-100 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white shadow-lg ring-2 sm:ring-4 ring-amber-100 flex-shrink-0">
                <Coins size={24} className="sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {loan.loanNumber || loan._id?.substring(loan._id.length - 8).toUpperCase()}
                </h2>
                <p className="text-sm sm:text-base text-amber-700 font-medium truncate">
                  {loan.items?.length || 0} items • {totalWeight.toFixed(1)}g • {loan.customer?.name}
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
          {/* Customer Details */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <User size={18} />
              Customer Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-3 sm:space-y-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-gray-500 block">Name</span>
                    <span className="font-semibold text-gray-900 text-sm sm:text-base truncate block">
                      {loan.customer?.name || 'Unknown Customer'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Phone size={20} className="text-green-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-gray-500 block">Phone</span>
                    <span className="font-semibold text-gray-900 text-sm sm:text-base">
                      {loan.customer?.phone || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <MapPin size={20} className="text-purple-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-gray-500 block">Email</span>
                    <span className="font-semibold text-gray-900 text-sm sm:text-base">
                      {loan.customer?.email || 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <DollarSign size={18} />
              Financial Information
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="text-lg sm:text-2xl font-bold text-blue-600 mb-1">
                  {formatCurrency(loanAmount)}
                </div>
                <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                  Principal Amount
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="text-lg sm:text-2xl font-bold text-red-600 mb-1">
                  {formatCurrency(outstandingAmount)}
                </div>
                <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                  Outstanding
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="text-lg sm:text-2xl font-bold text-green-600 mb-1">
                  {loan.interestRateMonthlyPct || 0}%
                </div>
                <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                  Monthly Interest
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div className="text-lg sm:text-2xl font-bold text-purple-600 mb-1">
                  {totalWeight.toFixed(1)}g
                </div>
                <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                  Total Weight
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <History size={18} />
                Payment History
                <span className={`text-sm px-2 py-1 rounded-full font-medium ${
                  sortedPayments.length > 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {sortedPayments.length} payments
                </span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {showPaymentHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {showPaymentHistory ? 'Hide' : 'Show'} History
                </button>
              </div>
            </div>

            {showPaymentHistory && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                {/* Payment Type Tabs */}
                <div className="flex border-b border-gray-200 mb-4 -mx-4 px-4">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'all'
                        ? 'border-green-500 text-green-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    All ({allPayments.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('interest')}
                    className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'interest'
                        ? 'border-blue-500 text-blue-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Interest ({interestPayments.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('principal')}
                    className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'principal'
                        ? 'border-green-500 text-green-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Principal ({principalPayments.length})
                  </button>
                </div>

                {/* Payment Summary Cards */}
                {sortedPayments.length > 0 && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {interestPayments.length}
                      </div>
                      <div className="text-xs text-gray-600 uppercase tracking-wide">Interest Payments</div>
                      <div className="text-sm font-medium text-blue-600 mt-1">
                        {formatCurrency(totalInterestPaid)}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {principalPayments.length}
                      </div>
                      <div className="text-xs text-gray-600 uppercase tracking-wide">Principal Payments</div>
                      <div className="text-sm font-medium text-green-600 mt-1">
                        {formatCurrency(totalPrincipalPaid)}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {totalItemsReturned}
                      </div>
                      <div className="text-xs text-gray-600 uppercase tracking-wide">Items Returned</div>
                      <div className="text-sm font-medium text-purple-600 mt-1">
                        {totalWeightReturned.toFixed(1)}g
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                      <div className="text-2xl font-bold text-gray-600 mb-1">
                        {sortedPayments.length}
                      </div>
                      <div className="text-xs text-gray-600 uppercase tracking-wide">Total Transactions</div>
                      <div className="text-sm font-medium text-gray-900 mt-1">
                        {formatCurrency(
                          sortedPayments.reduce((sum, p) => 
                            sum + ((p.principalAmount || 0) + (p.interestAmount || 0)), 0
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment List */}
                {sortedPayments.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {sortedPayments.map((payment, index) => {
                      const paymentConfig = getPaymentTypeConfig(payment.type);
                      const PaymentIcon = paymentConfig.icon;
                      const isPrincipalPayment = payment.type === 'PRINCIPAL';
                      
                      return (
                        <div 
                          key={payment._id || index}
                          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                        >
                          {/* Payment Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${paymentConfig.bg}`}>
                                <PaymentIcon size={18} className={`${paymentConfig.text}`} />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-sm sm:text-base">
                                  {paymentConfig.label}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDateTime(payment.date)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-bold ${
                                paymentConfig.color === 'green' ? 'text-green-600' : 
                                paymentConfig.color === 'blue' ? 'text-blue-600' : 'text-gray-600'
                              }`}>
                                {formatCurrency((payment.principalAmount || 0) + (payment.interestAmount || 0))}
                              </div>
                              {payment.repaymentType && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {payment.repaymentType.replace('_', ' ').toLowerCase()}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Payment Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-3">
                            {/* Payment Breakdown */}
                            {(payment.interestAmount > 0 || payment.principalAmount > 0) && (
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">Principal:</span>
                                  <span className="font-medium text-green-600">
                                    {formatCurrency(payment.principalAmount)}
                                  </span>
                                </div>
                                {payment.interestAmount > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Interest:</span>
                                    <span className="font-medium text-blue-600">
                                      {formatCurrency(payment.interestAmount)}
                                    </span>
                                  </div>
                                )}
                                {payment.processingFee > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Processing Fee:</span>
                                    <span className="font-medium text-gray-600">
                                      {formatCurrency(payment.processingFee)}
                                    </span>
                                  </div>
                                )}
                                {payment.lateFee > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Late Fee:</span>
                                    <span className="font-medium text-red-600">
                                      {formatCurrency(payment.lateFee)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Payment Method & Reference */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                  {getPaymentMethodIcon(payment.paymentMethod)}
                                </span>
                                <span className="text-gray-700 font-medium">
                                  {payment.paymentMethod?.replace('_', ' ') || 'Cash'}
                                </span>
                              </div>
                              {(payment.referenceNumber || payment.chequeNumber) && (
                                <div className="text-xs text-gray-500 space-y-1">
                                  {payment.referenceNumber && (
                                    <div>Ref: {payment.referenceNumber}</div>
                                  )}
                                  {payment.chequeNumber && (
                                    <div>Cheque: {payment.chequeNumber}</div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Items Returned (for principal payments) */}
                            {isPrincipalPayment && payment.totalItemsReturned > 0 && (
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">Items Returned:</span>
                                  <span className="font-medium text-purple-600">
                                    {payment.totalItemsReturned}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">Weight:</span>
                                  <span className="font-medium text-purple-600">
                                    {payment.totalWeightReturned?.toFixed(1)}g
                                  </span>
                                </div>
                                {payment.itemsReturned?.length > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {payment.itemsReturned.map(item => item.name).slice(0, 2).join(', ')}
                                    {payment.itemsReturned.length > 2 && ` +${payment.itemsReturned.length - 2}`}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Loan Balance Change */}
                            {(payment.currentLoanAmountAtPayment !== undefined || payment.currentLoanAmountAfterPayment !== undefined) && (
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">Before:</span>
                                  <span className="text-sm font-medium">
                                    {formatCurrency(payment.currentLoanAmountAtPayment)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">After:</span>
                                  <span className={`text-sm font-medium ${
                                    payment.isFullRepayment ? 'text-green-600' : 'text-gray-900'
                                  }`}>
                                    {payment.isFullRepayment ? 'LOAN CLOSED' : formatCurrency(payment.currentLoanAmountAfterPayment)}
                                  </span>
                                </div>
                                {payment.isFullRepayment && (
                                  <div className="text-xs text-green-600 font-medium mt-1">
                                    ✓ Loan Successfully Closed
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Additional Details */}
                          {(payment.notes || payment.photos?.length > 0 || payment.adjustmentReason) && (
                            <div className="pt-3 border-t border-gray-100">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {payment.notes && (
                                  <div className="sm:col-span-2">
                                    <span className="text-xs text-gray-500 block mb-1">Notes:</span>
                                    <p className="text-sm text-gray-700 leading-relaxed">{payment.notes}</p>
                                  </div>
                                )}
                                {payment.adjustmentReason && (
                                  <div>
                                    <span className="text-xs text-gray-500 block mb-1">Adjustment:</span>
                                    <div className="text-sm text-gray-700">
                                      <span className={`font-medium ${
                                        payment.adjustmentAmount > 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {payment.adjustmentAmount > 0 ? '+' : ''}{formatCurrency(payment.adjustmentAmount)}
                                      </span>
                                      <div className="text-xs text-gray-500 mt-1">{payment.adjustmentReason}</div>
                                    </div>
                                  </div>
                                )}
                                {(payment.photos?.length > 0) && (
                                  <div>
                                    <span className="text-xs text-gray-500 block mb-1">
                                      Attachments: {payment.photos.length}
                                    </span>
                                    <div className="flex gap-1 flex-wrap">
                                      {payment.photos.slice(0, 4).map((photo, photoIndex) => (
                                        <div 
                                          key={photoIndex}
                                          className="w-10 h-10 bg-gray-100 rounded overflow-hidden relative group cursor-pointer"
                                          onClick={() => window.open(photo, '_blank')}
                                        >
                                          <img 
                                            src={photo} 
                                            alt={`Payment photo ${photoIndex + 1}`}
                                            className="w-full h-full object-cover"
                                          />
                                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                            <Eye size={14} className="text-white" />
                                          </div>
                                        </div>
                                      ))}
                                      {payment.photos.length > 4 && (
                                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                                          +{payment.photos.length - 4}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <History size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Payments Recorded</h3>
                    <p className="text-gray-500 mb-4">This loan has no payment history yet.</p>
                    {loan.status === 'ACTIVE' && (
                      <div className="space-y-2">
                        <button
                          onClick={() => onPayment({ ...loan, type: "INTEREST" })}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium transition-colors"
                        >
                          Record Interest Payment
                        </button>
                        <button
                          onClick={() => onPayment({ ...loan, type: "REPAYMENT" })}
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium transition-colors"
                        >
                          Record Item Repayment
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Gold Items */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <Coins size={18} />
              Gold Items ({loan.items?.length || 0})
            </h3>
            {loan.items && loan.items.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {loan.items.map((item, index) => (
                  <div key={item._id || index} className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${
                            item.returnDate 
                              ? 'bg-green-500' 
                              : item.returnDate === null 
                              ? 'bg-gray-500' 
                              : 'bg-amber-500'
                          }`} />
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                            {item.name || `Gold Item ${index + 1}`}
                          </h4>
                          {item.returnDate && (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Returned
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-600 block text-xs mb-1">Weight</span>
                            <span className="font-medium text-gray-900">{item.weightGram?.toFixed(1)}g</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block text-xs mb-1">Purity</span>
                            <span className="font-medium text-gray-900">{item.purityK}K</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block text-xs mb-1">Loan Value</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(item.loanAmount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 block text-xs mb-1">Status</span>
                            <span className={`font-medium text-xs px-2 py-1 rounded-full ${
                              item.returnDate 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.returnDate ? `Returned ${formatDate(item.returnDate)}` : 'Active'}
                            </span>
                          </div>
                        </div>
                        {item.returnValue && (
                          <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-blue-700">Return Value:</span>
                              <span className="font-semibold text-blue-700">
                                {formatCurrency(item.returnValue)}
                              </span>
                            </div>
                            {item.goldPriceAtReturn && (
                              <div className="flex justify-between items-center text-xs mt-1">
                                <span className="text-blue-600">Gold Price:</span>
                                <span className="text-blue-600">₹{item.goldPriceAtReturn}/g</span>
                              </div>
                            )}
                            {item.appreciation !== undefined && (
                              <div className="flex justify-between items-center text-xs mt-1">
                                <span className="text-gray-600">Appreciation:</span>
                                <span className={`font-semibold ${
                                  item.appreciation >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {item.appreciation >= 0 ? '+' : ''}{formatCurrency(item.appreciation)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Item Photos */}
                      {item.images && item.images.length > 0 && (
                        <div className="flex-shrink-0 ml-4">
                          <div className="flex gap-1">
                            {item.images.slice(0, 3).map((image, imgIndex) => (
                              <div 
                                key={imgIndex}
                                className="w-12 h-12 rounded overflow-hidden border border-amber-200 relative group cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(image, '_blank');
                                }}
                              >
                                <img 
                                  src={image} 
                                  alt={`${item.name} ${imgIndex + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                  <Eye size={14} className="text-white" />
                                </div>
                              </div>
                            ))}
                            {item.images.length > 3 && (
                              <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                                +{item.images.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Item Notes */}
                    {(item.description || item.returnNotes) && (
                      <div className="mt-3 pt-3 border-t border-amber-100">
                        <div className="text-xs text-gray-600">
                          {item.description && (
                            <div className="mb-2">
                              <span className="font-medium">Description:</span> {item.description}
                            </div>
                          )}
                          {item.returnNotes && (
                            <div className="text-green-700">
                              <span className="font-medium">Return Notes:</span> {item.returnNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <Coins size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-sm">No gold items found for this loan</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <Clock size={18} />
              Timeline
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
                <Calendar size={18} className="sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-gray-500 block">Start Date</span>
                  <span className="font-medium text-gray-900 text-sm sm:text-base">
                    {formatDate(loan.startDate)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <Clock size={18} className="sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-gray-500 block">Due Date</span>
                  <span className={`font-medium text-sm sm:text-base ${
                    isOverdue ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {formatDate(loan.dueDate)}
                    {isOverdue && (
                      <span className="ml-1 text-red-600 text-xs"> (Overdue)</span>
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-200">
                <Percent size={18} className="sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-gray-500 block">Monthly Interest</span>
                  <span className="font-medium text-gray-900 text-sm sm:text-base">
                    {loan.interestRateMonthlyPct || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
            <button
              onClick={() => onEdit(loan)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-all duration-200"
            >
              <Edit3 size={16} />
              Edit Loan Details
            </button>
            
            {loan.status === "ACTIVE" && (
              <>
                <button
                  onClick={() => onPayment({ ...loan, type: "INTEREST" })}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <DollarSign size={16} />
                  Record Interest
                </button>
                <button
                  onClick={() => onPayment({ ...loan, type: "REPAYMENT" })}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <DollarSign size={16} />
                  Item Repayment
                </button>
              </>
            )}
            
            <button
              onClick={() => onSendReminder(loan)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all duration-200 border border-purple-200"
            >
              <MessageSquare size={16} />
              Send Reminder
            </button>
            
            <a
              href={`tel:${loan.customer?.phone}`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 border border-blue-200"
            >
              <Phone size={16} />
              Call Customer
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};