// components/GoldLoanTableRow.jsx
import React, { useState } from 'react';

import { 
  Edit3, 
  Eye, 
  Coins, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  DollarSign,
  Image as ImageIcon,
  X,
  Phone,
  User,
  MapPin,
  Calendar,
  Clock,
  Percent,
  MessageSquare
} from 'lucide-react';

const GoldLoanDetailModal = ({ loan, isOpen, onClose, onEdit, onPayment, onSendReminder }) => {
  if (!isOpen || !loan) return null;

  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
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

  const totalWeight = loan.items?.reduce((sum, item) => sum + (item.weightGram || 0), 0) || 0;
  const loanAmount = loan.totalLoanAmount || 0;
  const outstandingAmount = loan.currentLoanAmount || loan.totalLoanAmount || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-2xl w-full max-w-4xl h-full sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-6 border-b border-amber-100 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white shadow-lg">
                <Coins size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{loan._id}</h2>
                <p className="text-sm sm:text-base text-amber-700 font-medium truncate">
                  {loan.items?.length || 0} items • {totalWeight}g
                </p>
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full mt-2 ${statusConfig.bg} ${statusConfig.text}`}>
                  <StatusIcon size={12} />
                  {statusConfig.label}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Customer Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User size={16} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{loan.customer?.name || "Unknown"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone size={16} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{loan.customer?.phone || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin size={16} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{loan.customer?.email || "Not provided"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Financial Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 text-center rounded-lg">
                <p className="text-lg font-bold text-blue-600">{formatCurrency(loanAmount)}</p>
                <p className="text-xs text-gray-600">Principal</p>
              </div>
              <div className="bg-red-50 p-4 text-center rounded-lg">
                <p className="text-lg font-bold text-red-600">{formatCurrency(outstandingAmount)}</p>
                <p className="text-xs text-gray-600">Outstanding</p>
              </div>
              <div className="bg-green-50 p-4 text-center rounded-lg">
                <p className="text-lg font-bold text-green-600">{loan.interestRateMonthlyPct || 0}%</p>
                <p className="text-xs text-gray-600">Interest</p>
              </div>
              <div className="bg-purple-50 p-4 text-center rounded-lg">
                <p className="text-lg font-bold text-purple-600">{totalWeight}g</p>
                <p className="text-xs text-gray-600">Weight</p>
              </div>
            </div>
          </div>

          {/* Items */}
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
                          {formatCurrency(item.loanAmount ? item.loanAmount : 0)}
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


          {/* Timeline */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg flex gap-2 items-center">
                <Calendar size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Start</p>
                  <p className="font-medium">{formatDate(loan.startDate)}</p>
                </div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg flex gap-2 items-center">
                <Clock size={16} className="text-yellow-600" />
                <div>
                  <p className="text-xs text-gray-500">Due</p>
                  <p className="font-medium">{formatDate(loan.dueDate)}</p>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg flex gap-2 items-center">
                <Percent size={16} className="text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Interest</p>
                  <p className="font-medium">{loan.interestRateMonthlyPct || 0}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
<div className="flex flex-wrap gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-100">
            <button
              onClick={() => onEdit(loan)}
              className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Edit3 size={14} className="sm:w-4 sm:h-4" />
              Edit Loan
            </button>
{loan.status === "ACTIVE" && (
            <div className="relative">
              {!showPaymentOptions ? (
                <button
                  onClick={() => setShowPaymentOptions(true)}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
                >
                  <DollarSign size={16} />
                  Make Payment
                </button>
              ) : (
                <div className="w-full bg-white border rounded-lg shadow-md p-4 flex flex-col gap-3">
                  <p className="font-medium text-gray-700 text-sm mb-1">Choose Payment Type</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg 
                                text-blue-600 font-semibold hover:bg-blue-100"
                      onClick={() => {
                        setShowPaymentOptions(false);
                        onPayment && onPayment({ ...loan, type: "INTEREST" });
                      }}
                    >
                      Interest
                    </button>
                    <button
                      className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg 
                                text-green-600 font-semibold hover:bg-green-100"
                      onClick={() => {
                        setShowPaymentOptions(false);
                        onPayment && onPayment({ ...loan, type: "REPAYMENT" });
                      }}
                    >
                      Repayment
                    </button>
                  </div>
                  <button
                    className="mt-2 text-xs text-gray-500 underline hover:text-gray-700"
                    onClick={() => setShowPaymentOptions(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
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
  );
};

const GoldLoanTableRow = ({ loan, onEdit, onView, onPayment }) => {
  const [showModal, setShowModal] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  
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
  const totalWeight = loan.items?.reduce((sum, item) => sum + (item.weightGram || 0), 0) || 0;
  const loanAmount = loan.totalLoanAmount || 0; 
  const outstandingAmount = loan.currentLoanAmount || loan.totalLoanAmount || 0; 
  const totalPhotos = loan.items?.reduce((sum, item) => sum + (item.images?.length || 0), 0) || 0;
  
  return (
    <>
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
        {loan.status === "ACTIVE" && (
          <div className="relative">
            {!showPaymentOptions ? (
              <button
                onClick={() => setShowPaymentOptions(true)}
                className="w-8 h-8 border border-blue-300 rounded-lg bg-blue-50 text-blue-600 
                          flex items-center justify-center hover:border-blue-500 hover:bg-blue-100 
                          transition-all duration-200"
                title="Make Payment"
              >
                <DollarSign size={14} />
              </button>
            ) : (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 
                              rounded-lg shadow-lg p-4 z-50">
                <p className="font-medium text-gray-700 text-sm mb-2">Choose Payment Type</p>
                <div className="flex flex-col gap-2">
                  <button
                    className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg 
                              text-blue-600 font-semibold hover:bg-blue-100"
                    onClick={() => {
                      setShowPaymentOptions(false);
                      onPayment && onPayment({ ...loan, type: "INTEREST" });
                    }}
                  >
                    Interest
                  </button>
                  <button
                    className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg 
                              text-green-600 font-semibold hover:bg-green-100"
                    onClick={() => {
                      setShowPaymentOptions(false);
                      onPayment && onPayment({ ...loan, type: "REPAYMENT" });
                    }}
                  >
                    Repayment
                  </button>
                </div>
                <button
                  className="mt-2 text-xs text-gray-500 underline hover:text-gray-700"
                  onClick={() => setShowPaymentOptions(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

          <button
            onClick={() => onEdit(loan)}
            className="w-8 h-8 border border-gray-300 rounded-lg bg-white text-gray-600 flex items-center justify-center hover:border-amber-500 hover:text-amber-500 hover:bg-amber-50 transition-all duration-200"
            title="Edit Loan"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="w-8 h-8 border border-gray-300 rounded-lg bg-white text-gray-600 flex items-center justify-center hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all duration-200"
            title="View Details"
          >
            <Eye size={14} />
          </button>
        </div>
      </td>
    </tr>

    {/* Modal */}
    <GoldLoanDetailModal 
        loan={loan}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onEdit={(l) => { setShowModal(false); onEdit && onEdit(l); }}
        onPayment={(l) => { setShowModal(false); onPayment && onPayment(l); }}
        onSendReminder={(l) => { setShowModal(false); onSendReminder && onSendReminder(l); }}
    />
    </>
  );
};

export default GoldLoanTableRow;
