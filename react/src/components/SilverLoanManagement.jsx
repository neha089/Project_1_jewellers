
import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Plus, 
  TrendingUp,
  DollarSign,
  AlertTriangle,
  FileText,
  Bell,
  Calendar,
  Clock,
  Grid,
  List,
  Search,
  Filter,
  SortAsc,
  ChevronDown,
  Edit3,
  Eye,
  Phone,
  User,
  MessageSquare,
  X,
  Upload,
  Trash2,
  Calculator,
  MapPin,
  Percent,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Camera,
  FileImage,
  Edit,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Mock data for silver loans
const mockSilverLoans = [
  {
    id: 'SLV001',
    customerId: 'CUS001',
    customerName: 'Rajesh Kumar',
    customerPhone: '+91 98765 43210',
    customerAddress: '123 Silver Street, Mumbai',
    silverItem: 'Silver Jewelry Set',
    silverType: '925 Sterling',
    silverWeight: 150.5,
    purity: '925',
    loanAmount: 45000,
    outstandingAmount: 47250,
    interestRate: 2.0,
    startDate: '2024-08-01',
    dueDate: '2025-02-01',
    loanTerm: '6',
    status: 'active',
    silverRate: 85,
    pledgedBy: 'Customer',
    branch: 'Main Branch',
    photos: ['https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=300&h=300&fit=crop']
  },
  {
    id: 'SLV002',
    customerId: 'CUS002',
    customerName: 'Priya Sharma',
    customerPhone: '+91 87654 32109',
    customerAddress: '456 Sterling Road, Delhi',
    silverItem: 'Silver Coins',
    silverType: '999 Pure',
    silverWeight: 50.0,
    purity: '999',
    loanAmount: 20000,
    outstandingAmount: 21000,
    interestRate: 1.8,
    startDate: '2024-09-15',
    dueDate: '2024-12-15',
    loanTerm: '3',
    status: 'overdue',
    silverRate: 90,
    pledgedBy: 'Customer',
    branch: 'North Branch',
    photos: ['https://images.unsplash.com/photo-1605792657660-596af9009426?w=300&h=300&fit=crop']
  },
  {
    id: 'SLV003',
    customerId: 'CUS003',
    customerName: 'Amit Patel',
    customerPhone: '+91 76543 21098',
    customerAddress: '789 Metal Avenue, Pune',
    silverItem: 'Silver Utensils',
    silverType: '925 Sterling',
    silverWeight: 200.0,
    purity: '925',
    loanAmount: 55000,
    outstandingAmount: 58300,
    interestRate: 2.2,
    startDate: '2024-07-20',
    dueDate: '2025-01-20',
    loanTerm: '6',
    status: 'active',
    silverRate: 82,
    pledgedBy: 'Customer',
    branch: 'South Branch',
    photos: ['https://images.unsplash.com/photo-1594736797933-d0800ba87cd8?w=300&h=300&fit=crop', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop']
  }
];

// Silver icon component (similar to Coins but for silver)
const SilverIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
    <circle cx="12" cy="12" r="6" fill="currentColor"/>
    <text x="12" y="16" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">Ag</text>
  </svg>
);

// StatsCard Component (reused from your existing code but adapted for silver)
const StatsCard = ({ title, value, icon: IconComponent, iconColor, trend, subtitle, 
  color = "blue", 
  className = ''  }) => {
   const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    red: "bg-red-50 text-red-600 border-red-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200",
    silver: "bg-gray-100 text-gray-700 border-gray-300"
  };
   
  const getIconElement = () => {
    if (!IconComponent) return null;
    
    if (iconColor) {
      return <IconComponent className={iconColor} size={24} />;
    } else {
      return <IconComponent size={24} />;
    }
  };
   
  const getIconContainerClasses = () => {
    if (iconColor) {
      return "p-3 rounded-lg";
    } else {
      return `p-3 rounded-lg border ${colorClasses[color] || colorClasses.gray}`;
    }
  };
  
  return (
   <div className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {(subtitle || trend) && (
            <p className="text-xs text-gray-500 mt-1">{subtitle || trend}</p>
          )}
        </div>
        {IconComponent && (
          <div className={getIconContainerClasses()}>
            {getIconElement()}
          </div>
        )}
      </div>
    </div>
  );
};

// Silver Loan Card Component
const SilverLoanCard = ({ 
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
        className="bg-white rounded-xl lg:rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-gray-400 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer w-full max-w-full"
        onClick={() => setShowModal(true)}
      >
        {/* Header with Silver Icon */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-3 md:p-4 lg:p-5 border-b border-gray-200">
          <div className="flex items-start justify-between gap-2 md:gap-3 lg:gap-4">
            <div className="flex items-center gap-2 md:gap-3 lg:gap-4 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white shadow-lg ring-2 lg:ring-4 ring-gray-100 flex-shrink-0">
                <SilverIcon size={16} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6 drop-shadow-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate leading-tight">{loan.id}</h3>
                <p className="text-xs sm:text-sm lg:text-sm text-gray-700 font-medium truncate mt-0.5">{loan.silverItem}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              {(isOverdue || isDueSoon) && (
                <AlertTriangle 
                  size={14} 
                  className={`sm:w-4 sm:h-4 lg:w-[18px] lg:h-[18px] ${isOverdue ? 'text-red-500' : 'text-yellow-500'}`} 
                />
              )}
              <span className={`inline-flex items-center gap-1 px-2 sm:px-2.5 lg:px-3 py-1 text-xs font-semibold rounded-full border whitespace-nowrap ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                <StatusIcon size={10} className="sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">{statusConfig.label}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Alert Section */}
        {(isOverdue || isDueSoon) && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 p-2.5 md:p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={12} className="sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-red-800">
                {isOverdue 
                  ? `Overdue by ${Math.abs(daysUntilDue)} days`
                  : `Due in ${daysUntilDue} days`
                }
              </span>
            </div>
          </div>
        )}

        {/* Essential Information */}
        <div className="p-3 md:p-4 lg:p-5 space-y-3 md:space-y-4">
          {/* Customer Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <User size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
              <span className="font-semibold text-gray-900 text-sm md:text-base truncate">{loan.customerName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 sm:ml-0 ml-6">
              <Phone size={12} className="sm:w-[14px] sm:h-[14px] text-gray-400 flex-shrink-0" />
              <span className="truncate">{loan.customerPhone}</span>
            </div>
          </div>

          {/* Key Financial Info */}
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
            <div className="text-center p-2.5 md:p-3 lg:p-4 bg-gray-50 rounded-lg lg:rounded-xl">
              <div className="text-sm md:text-base lg:text-lg font-bold text-gray-900 mb-1 leading-tight">
                {formatCurrency(loan.loanAmount)}
              </div>
              <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                Loan Amount
              </div>
            </div>
            <div className="text-center p-2.5 md:p-3 lg:p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg lg:rounded-xl border border-red-100">
              <div className="text-sm md:text-base lg:text-lg font-bold text-red-600 mb-1 leading-tight">
                {formatCurrency(loan.outstandingAmount)}
              </div>
              <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                Outstanding
              </div>
            </div>
          </div>

          {/* Silver Info */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-2.5 md:p-3 border border-gray-200">
            <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-1 text-xs md:text-sm">
              <span className="text-gray-600">Weight & Purity:</span>
              <span className="font-semibold text-gray-900">{loan.silverWeight}g • {loan.purity}</span>
            </div>
          </div>

          {/* Due Date and Photos */}
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs md:text-sm text-gray-600">Due: {formatDate(loan.dueDate)}</span>
            </div>
            {loan.photos && loan.photos.length > 0 && (
              <div className="flex items-center gap-1 text-xs md:text-sm text-gray-600 xs:ml-0 ml-6">
                <Camera size={12} className="sm:w-[14px] sm:h-[14px]" />
                <span>{loan.photos.length} photos</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-3 md:px-4 lg:px-5 pb-3 md:pb-4 lg:pb-5">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
              className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md lg:rounded-lg transition-all duration-200 hover:scale-105"
            >
              <Eye size={12} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">View Details</span>
              <span className="xs:hidden">View</span>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit && onEdit(loan);
              }}
              className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md lg:rounded-lg transition-all duration-200 hover:scale-105"
            >
              <Edit3 size={12} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Edit</span>
              <span className="sm:hidden">Edit</span>
            </button>
            
            {loan.status === 'active' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPayment && onPayment(loan);
                }}
                className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-md lg:rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
              >
                <DollarSign size={12} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Payment</span>
                <span className="sm:hidden">Pay</span>
              </button>
            )}
            
            {(isOverdue || isDueSoon) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSendReminder && onSendReminder(loan);
                }}
                className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md lg:rounded-lg transition-all duration-200 hover:scale-105"
              >
                <MessageSquare size={12} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Remind</span>
                <span className="sm:hidden">Remind</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Detail Modal */}
      {showModal && (
        <SilverLoanDetailModal
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
      )}
    </>
  );
};
// Silver Loan Detail Modal
const SilverLoanDetailModal = ({ loan, isOpen, onClose, onEdit, onPayment, onSendReminder }) => {
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
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white shadow-lg ring-2 sm:ring-4 ring-gray-100 flex-shrink-0">
                <SilverIcon size={24} className="sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{loan.id}</h2>
                <p className="text-sm sm:text-base text-gray-700 font-medium truncate">{loan.silverItem}</p>
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

        {/* Scrollable Modal Content */}
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
              </div>
            </div>
          </div>

          {/* Financial Details */}
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
                  {loan.interestRate || 2.0}%
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

          {/* Silver Details */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Silver Item Details</h3>
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-4 sm:p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center sm:text-left">
                  <span className="text-gray-600 block mb-1 text-sm sm:text-base">Weight</span>
                  <span className="text-lg sm:text-xl font-bold text-gray-900">{loan.silverWeight}g</span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-gray-600 block mb-1 text-sm sm:text-base">Purity</span>
                  <span className="text-lg sm:text-xl font-bold text-gray-900">{loan.purity}</span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-gray-600 block mb-1 text-sm sm:text-base">Type</span>
                  <span className="text-lg sm:text-xl font-bold text-gray-900">{loan.silverType || 'Sterling'}</span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-gray-600 block mb-1 text-sm sm:text-base">Market Rate</span>
                  <span className="text-lg sm:text-xl font-bold text-gray-900">₹{loan.silverRate || '85'}/g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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

// Search and Filter Bar for Silver Loans
const SilverLoanSearchFilterBar = ({ 
  searchTerm, 
  setSearchTerm, 
  statusFilter, 
  setStatusFilter, 
  silverTypeFilter,
  setSilverTypeFilter,
  sortBy, 
  setSortBy,
  viewMode,
  setViewMode 
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Silver Loan Search & Filter</h3>
            <p className="text-sm text-gray-600 mt-1">Find and organize your silver loan data efficiently</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span>Real-time search</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-end gap-4 flex-wrap lg:flex-nowrap">
          {/* Search Input */}
          <div className="flex-1 min-w-72">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by loan ID, customer name, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-lg"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="min-w-40">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={16} />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={16} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="overdue">Overdue</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Silver Type Filter */}
          <div className="min-w-36">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Silver Type
            </label>
            <div className="relative">
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={16} />
              <select
                value={silverTypeFilter}
                onChange={(e) => setSilverTypeFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400"
              >
                <option value="all">All Silver</option>
                <option value="999 Pure">999 Pure Silver</option>
                <option value="925 Sterling">925 Sterling Silver</option>
                <option value="900 Coin">900 Coin Silver</option>
              </select>
            </div>
          </div>

          {/* Sort Filter */}
          <div className="min-w-44">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <div className="relative">
              <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={16} />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={16} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400"
              >
                <option value="loanId">Sort by Loan ID</option>
                <option value="customer">Customer Name</option>
                <option value="amount">Loan Amount</option>
                <option value="dueDate">Due Date</option>
                <option value="createdDate">Created Date</option>
                <option value="weight">Silver Weight</option>
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              View:
            </label>
            <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center justify-center gap-1 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium ${
                  viewMode === 'grid' 
                    ? 'bg-white shadow-sm text-blue-600 border border-gray-200' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Grid size={16} />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center justify-center gap-1 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium ${
                  viewMode === 'table' 
                    ? 'bg-white shadow-sm text-blue-600 border border-gray-200' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <List size={16} />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || statusFilter !== 'all' || silverTypeFilter !== 'all' || sortBy !== 'loanId') && (
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-600">Active filters:</span>
            <div className="flex gap-2 flex-wrap">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Search: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-blue-900">×</button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-green-900">×</button>
                </span>
              )}
              {silverTypeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  Silver: {silverTypeFilter}
                  <button onClick={() => setSilverTypeFilter('all')} className="ml-1 hover:text-gray-900">×</button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSilverTypeFilter('all');
                  setSortBy('loanId');
                }}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Add Silver Loan Modal
const AddSilverLoanModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerId: '',
    silverItem: '',
    silverType: '925 Sterling',
    silverWeight: '',
    purity: '925',
    loanAmount: '',
    interestRate: '2.0',
    durationMonths: '6',
    pledgedBy: 'Customer',
    branch: 'Main Branch',
    notes: ''
  });

  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});

  const silverTypes = [
    { value: '999 Pure', label: '999 Pure Silver', purity: '999' },
    { value: '925 Sterling', label: '925 Sterling Silver', purity: '925' },
    { value: '900 Coin', label: '900 Coin Silver', purity: '900' },
    { value: '800 Standard', label: '800 Standard Silver', purity: '800' }
  ];

  const silverItems = [
    'Silver Jewelry', 'Silver Coins', 'Silver Bars', 'Silver Utensils',
    'Silver Ornaments', 'Silver Vessels', 'Silver Artifacts', 'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      if (name === 'silverType') {
        const selectedType = silverTypes.find(type => type.value === value);
        if (selectedType) {
          updated.purity = selectedType.purity;
        }
      }
      
      return updated;
    });
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const calculateLoanAmount = () => {
    const weight = parseFloat(formData.silverWeight) || 0;
    const silverRate = {
      '999 Pure': 90,
      '925 Sterling': 83,
      '900 Coin': 81,
      '800 Standard': 72
    };
    
    const rate = silverRate[formData.silverType] || 83;
    const estimatedValue = weight * rate;
    const loanAmount = Math.floor(estimatedValue * 0.70); // 70% of silver value
    
    setFormData(prev => ({ ...prev, loanAmount: loanAmount.toString() }));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024;
    
    files.forEach(file => {
      if (file.size > maxSize) {
        alert('File size should be less than 5MB');
        return;
      }
      
      if (photos.length < 5) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPhotos(prev => [...prev, {
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            dataUrl: e.target.result
          }]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removePhoto = (photoId) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (!formData.customerPhone.trim()) newErrors.customerPhone = 'Phone number is required';
    if (!formData.silverItem.trim()) newErrors.silverItem = 'Silver item description is required';
    if (!formData.silverWeight || parseFloat(formData.silverWeight) <= 0) newErrors.silverWeight = 'Valid silver weight is required';
    if (!formData.loanAmount || parseFloat(formData.loanAmount) <= 0) newErrors.loanAmount = 'Valid loan amount is required';
    if (photos.length === 0) newErrors.photos = 'At least one photo is required for proof';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setMonth(dueDate.getMonth() + parseInt(formData.durationMonths));
    
    const loanData = {
      ...formData,
      loanAmount: parseFloat(formData.loanAmount),
      silverWeight: parseFloat(formData.silverWeight),
      interestRate: parseFloat(formData.interestRate),
      startDate: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      outstandingAmount: parseFloat(formData.loanAmount),
      status: 'active',
      photos: photos.map(photo => photo.dataUrl),
      silverRate: 85
    };
    
    onSave(loanData);
    handleReset();
  };

  const handleReset = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      customerId: '',
      silverItem: '',
      silverType: '925 Sterling',
      silverWeight: '',
      purity: '925',
      loanAmount: '',
      interestRate: '2.0',
      durationMonths: '6',
      pledgedBy: 'Customer',
      branch: 'Main Branch',
      notes: ''
    });
    setPhotos([]);
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center text-white">
              <SilverIcon size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Create New Silver Loan</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Customer Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="text-gray-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 ${errors.customerName ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                  placeholder="Enter customer full name"
                />
                {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 ${errors.customerPhone ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                  placeholder="+91 98765 43210"
                />
                {errors.customerPhone && <p className="text-red-500 text-xs mt-1">{errors.customerPhone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer ID (Optional)</label>
                <input
                  type="text"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="Existing customer ID"
                />
              </div>
            </div>

            {/* Silver Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <SilverIcon size={20} className="text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Silver Information</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Silver Item *</label>
                <select
                  name="silverItem"
                  value={formData.silverItem}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 ${errors.silverItem ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">Select silver item</option>
                  {silverItems.map(item => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                {errors.silverItem && <p className="text-red-500 text-xs mt-1">{errors.silverItem}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Silver Type *</label>
                  <select
                    name="silverType"
                    value={formData.silverType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    {silverTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Purity</label>
                  <input
                    type="text"
                    name="purity"
                    value={formData.purity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="925"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Silver Weight (grams) *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    name="silverWeight"
                    value={formData.silverWeight}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 ${errors.silverWeight ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                    placeholder="150.5"
                  />
                  <button
                    type="button"
                    onClick={calculateLoanAmount}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-600 hover:bg-gray-50 rounded"
                    title="Calculate loan amount"
                  >
                    <Calculator size={16} />
                  </button>
                </div>
                {errors.silverWeight && <p className="text-red-500 text-xs mt-1">{errors.silverWeight}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (% per month) *</label>
                  <input
                    type="number"
                    step="0.1"
                    name="interestRate"
                    value={formData.interestRate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="2.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (months)</label>
                  <select
                    name="durationMonths"
                    value={formData.durationMonths}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="9">9 Months</option>
                    <option value="12">12 Months</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loan Amount (₹) *</label>
                <input
                  type="number"
                  name="loanAmount"
                  value={formData.loanAmount}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 ${errors.loanAmount ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                  placeholder="45000"
                />
                {errors.loanAmount && <p className="text-red-500 text-xs mt-1">{errors.loanAmount}</p>}
              </div>
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <FileImage className="text-gray-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Proof Photos *</h3>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-all duration-200">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  <label className="cursor-pointer bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200 flex items-center gap-2">
                    <Upload size={16} />
                    Upload Photos
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-sm text-gray-500">or drag and drop</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">PNG, JPG up to 5MB each (Max 5 photos)</p>
              </div>
            </div>

            {errors.photos && <p className="text-red-500 text-xs mt-2">{errors.photos}</p>}

            {/* Photo Preview */}
            {photos.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Photos ({photos.length}/5)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.dataUrl}
                        alt={photo.name}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
            >
              Reset Form
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium shadow-lg flex items-center gap-2"
            >
              <SilverIcon size={16} />
              Create Silver Loan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Table Row Component for Silver Loans
const SilverLoanTableRow = ({ loan, onEdit, onView, onPayment }) => {
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
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
            <SilverIcon size={16} />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{loan.id}</div>
            <div className="text-sm text-gray-500">{loan.silverItem}</div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">{loan.customerName}</div>
        <div className="text-sm text-gray-500">{loan.customerPhone}</div>
      </td>
      
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">
          <div className="font-medium">{loan.silverWeight}g • {loan.silverType}</div>
          <div className="text-gray-500">Purity: {loan.purity}</div>
        </div>
      </td>
      
      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
        {formatCurrency(loan.loanAmount)}
      </td>
      
      <td className="px-6 py-4 text-sm font-semibold text-gray-600">
        {formatCurrency(loan.outstandingAmount)}
      </td>
      
      <td className="px-6 py-4 text-sm text-gray-900">
        {loan.dueDate}
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center gap-1">
          <ImageIcon size={16} className="text-gray-400" />
          <span className="text-sm text-gray-600">{loan.photos?.length || 0}</span>
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
            className="w-8 h-8 border border-gray-300 rounded-lg bg-white text-gray-600 flex items-center justify-center hover:border-gray-500 hover:text-gray-500 hover:bg-gray-50 transition-all duration-200"
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

// Notification Hook for Silver Loans
const useNotifications = (loans) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const generateNotifications = () => {
      const today = new Date();
      const notifs = [];

      loans.forEach(loan => {
        const dueDate = new Date(loan.dueDate);
        const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        if (daysDiff <= 7 || daysDiff < 0) {
          let priority = 'low';
          let message = '';
          
          if (daysDiff < 0) {
            priority = 'high';
            message = `Overdue by ${Math.abs(daysDiff)} days`;
          } else if (daysDiff === 0) {
            priority = 'high';
            message = 'Due today';
          } else if (daysDiff === 1) {
            priority = 'medium';
            message = 'Due tomorrow';
          } else if (daysDiff <= 7) {
            priority = 'low';
            message = `Due in ${daysDiff} days`;
          }

          notifs.push({
            id: `silver-notif-${loan.id}`,
            loanId: loan.id,
            customerName: loan.customerName,
            customerPhone: loan.customerPhone,
            priority,
            message,
            dueDate: loan.dueDate,
            outstandingAmount: loan.outstandingAmount,
            daysDiff,
            isRead: false,
            timestamp: new Date()
          });
        }
      });

      notifs.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (b.priority === 'high' && a.priority !== 'high') return 1;
        if (a.priority === 'medium' && b.priority === 'low') return -1;
        if (b.priority === 'medium' && a.priority === 'low') return 1;
        return a.daysDiff - b.daysDiff;
      });

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    };

    generateNotifications();
  }, [loans]);

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead };
};

// Main Silver Loan Management Component
const SilverLoanManagement = () => {
  const [silverLoans, setSilverLoans] = useState(mockSilverLoans);
  const [filteredLoans, setFilteredLoans] = useState(mockSilverLoans);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [silverTypeFilter, setSilverTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('loanId');
  const [viewMode, setViewMode] = useState('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('loans');

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(silverLoans);

  // Calculate stats
  const stats = {
    total: silverLoans.length,
    active: silverLoans.filter(loan => loan.status === 'active').length,
    overdue: silverLoans.filter(loan => loan.status === 'overdue').length,
    totalAmount: silverLoans.reduce((sum, loan) => sum + loan.loanAmount, 0),
    totalOutstanding: silverLoans.reduce((sum, loan) => sum + loan.outstandingAmount, 0),
    totalWeight: silverLoans.reduce((sum, loan) => sum + loan.silverWeight, 0),
    dueToday: notifications.filter(n => n.daysDiff === 0).length,
    dueTomorrow: notifications.filter(n => n.daysDiff === 1).length,
    urgentActions: notifications.filter(n => n.priority === 'high').length
  };

  // Filter and sort loans
  useEffect(() => {
    let filtered = [...silverLoans];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(loan =>
        loan.id.toLowerCase().includes(term) ||
        loan.customerName.toLowerCase().includes(term) ||
        loan.customerPhone.toLowerCase().includes(term) ||
        loan.silverItem.toLowerCase().includes(term) ||
        loan.silverType.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(loan => loan.status === statusFilter);
    }

    if (silverTypeFilter !== 'all') {
      filtered = filtered.filter(loan => loan.silverType === silverTypeFilter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'loanId':
          return a.id.localeCompare(b.id);
        case 'customer':
          return a.customerName.localeCompare(b.customerName);
        case 'amount':
          return b.loanAmount - a.loanAmount;
        case 'dueDate':
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'createdDate':
          return new Date(b.startDate) - new Date(a.startDate);
        case 'weight':
          return b.silverWeight - a.silverWeight;
        default:
          return 0;
      }
    });

    setFilteredLoans(filtered);
  }, [silverLoans, searchTerm, statusFilter, silverTypeFilter, sortBy]);

  const handleAddLoan = (formData) => {
    const newLoan = {
      ...formData,
      id: `SLV${String(silverLoans.length + 1).padStart(3, '0')}`,
      customerId: formData.customerId || `CUS${String(silverLoans.length + 1).padStart(3, '0')}`
    };
    setSilverLoans(prev => [...prev, newLoan]);
    setShowAddModal(false);
  };

  const handleEdit = (loan) => {
    alert(`Edit functionality for ${loan.id} will be implemented in the next phase`);
  };

  const handleView = (loan) => {
    alert(`Detailed view for ${loan.id} will be implemented in the next phase`);
  };

  const handlePayment = (loan) => {
    alert(`Payment functionality for ${loan.id} will be implemented in the next phase`);
  };

  const handleSendReminder = (loan) => {
    alert(`Reminder sent to ${loan.customerName} for loan ${loan.id}`);
  };

  const handleExport = () => {
    const csvContent = [
      [
        'Loan ID', 'Customer', 'Phone', 'Silver Item', 'Weight (g)', 'Type', 'Purity', 
        'Loan Amount', 'Outstanding', 'Interest Rate', 'Start Date', 'Due Date', 'Status'
      ],
      ...filteredLoans.map(loan => [
        loan.id,
        loan.customerName,
        loan.customerPhone,
        loan.silverItem,
        loan.silverWeight,
        loan.silverType,
        loan.purity,
        loan.loanAmount,
        loan.outstandingAmount,
        loan.interestRate,
        loan.startDate,
        loan.dueDate,
        loan.status
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `silver-loans-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount) => `₹${(amount / 100000).toFixed(1)}L`;

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items sm:justify-between gap-4">
          
          
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                <Bell size={24} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
            
            {/* Export Button */}
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center gap-2 font-medium shadow-sm"
            >
              <Download size={16} />
              Export
            </button>
            
            {/* Add New Loan Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-lg"
            >
              <Plus size={16} />
              New Loan
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'loans'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Grid size={16} />
            Loans
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all relative flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bell size={16} />
            Notifications
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'calendar'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar size={16} />
            Calendar
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatsCard
            title="Total Loans"
            value={stats.total}
            icon={FileText}
            iconColor="text-blue-600"
            trend="+8 this month"
            className="bg-blue-50 border-blue-200"
          />
          <StatsCard
            title="Active Loans"
            value={stats.active}
            icon={TrendingUp}
            iconColor="text-green-600"
            trend="80% active rate"
            className="bg-green-50 border-green-200"
          />
          <StatsCard
            title="Overdue"
            value={stats.overdue}
            icon={AlertTriangle}
            iconColor="text-red-600"
            trend="Needs attention"
            className="bg-red-50 border-red-200"
          />
          <StatsCard
            title="Due Today"
            value={stats.dueToday}
            icon={Clock}
            iconColor="text-yellow-600"
            trend="Immediate action"
            className="bg-yellow-50 border-yellow-200"
          />
          <StatsCard
            title="Total Amount"
            value={formatCurrency(stats.totalAmount)}
            icon={DollarSign}
            iconColor="text-purple-600"
            trend="+15% growth"
            className="bg-purple-50 border-purple-200"
          />
          <StatsCard
            title="Silver Weight"
            value={`${stats.totalWeight}g`}
            icon={SilverIcon}
            iconColor="text-gray-600"
            trend="Total pledged"
            className="bg-gray-50 border-gray-200"
          />
        </div>

        {/* Main Content Area */}
        {activeTab === 'loans' && (
          <>
            <div className="mb-6">
              <SilverLoanSearchFilterBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                silverTypeFilter={silverTypeFilter}
                setSilverTypeFilter={setSilverTypeFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLoans.map(loan => (
                  <SilverLoanCard
                    key={loan.id}
                    loan={loan}
                    onEdit={handleEdit}
                    onView={handleView}
                    onPayment={handlePayment}
                    onSendReminder={handleSendReminder}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Silver Loan Directory</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Loan Details
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Silver Details
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Loan Amount
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Outstanding
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Photos
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLoans.map((loan) => (
                        <SilverLoanTableRow
                          key={loan.id}
                          loan={loan}
                          onEdit={handleEdit}
                          onView={handleView}
                          onPayment={handlePayment}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Payment Notifications</h2>
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Mark All as Read
              </button>
            </div>
            
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
                  <p className="text-gray-600">All payments are up to date!</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${
                      !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">{notification.customerName}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                            notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {notification.message}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.loanId} • ₹{notification.outstandingAmount.toLocaleString()} • Due: {notification.dueDate}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.location.href = `tel:${notification.customerPhone}`}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-full hover:bg-green-700 transition-colors"
                          >
                            Call
                          </button>
                          <button
                            onClick={() => handleSendReminder(silverLoans.find(l => l.id === notification.loanId))}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition-colors"
                          >
                            Send Reminder
                          </button>
                        </div>
                      </div>
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm ml-4"
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar View</h3>
              <p className="text-gray-600">Calendar functionality will be available in the next update</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddSilverLoanModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddLoan}
        />
      )}
    </div>
  );
};

export default SilverLoanManagement;