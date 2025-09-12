import React, { useState, useEffect } from 'react';
import { Clock, User, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import ApiService from '../services/api';

const UdhariSelector = ({ 
  customerId,
  selectedUdhariId, 
  loading, 
  errors, 
  onUdhariSelect,
  onAmountSuggestion, // New prop to suggest amount to parent
  transactionType // 'receive' or 'pay'
}) => {
  const [availableUdharis, setAvailableUdharis] = useState([]);
  const [loadingUdharis, setLoadingUdharis] = useState(false);
  const [showDetails, setShowDetails] = useState({});

  useEffect(() => {
    if (customerId) {
      fetchCustomerUdharis();
    }
  }, [customerId, transactionType]);

  const fetchCustomerUdharis = async () => {
    setLoadingUdharis(true);
    try {
      const response = await ApiService.getCustomerUdhariSummary(customerId);
      console.log('Raw API Response:', response);
      
      // Extract the correct data based on your API structure
      let udhariTransactions = [];
      
      if (response.success && response.data && response.data.transactions) {
        const { transactions } = response.data;
        
        if (transactionType === 'receive') {
          // Show udharis we gave (from 'given' array) that have outstanding balance
          udhariTransactions = transactions.given || [];
        } else if (transactionType === 'pay') {
          // Show udharis we took (from 'taken' array) that have outstanding balance
          udhariTransactions = transactions.taken || [];
        }
        
        // Filter only transactions with outstanding balance > 0
        udhariTransactions = udhariTransactions.filter(udhari => 
          udhari.outstandingBalance > 0 && !udhari.isCompleted
        );
      }
      
      console.log('Filtered transactions:', udhariTransactions);
      setAvailableUdharis(udhariTransactions);

    } catch (error) {
      console.error('Failed to fetch customer udharis:', error);
      setAvailableUdharis([]);
    } finally {
      setLoadingUdharis(false);
    }
  };

  const toggleDetails = (udhariId) => {
    setShowDetails(prev => ({
      ...prev,
      [udhariId]: !prev[udhariId]
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (outstanding) => {
    if (outstanding <= 0) return 'text-green-600';
    return 'text-orange-600';
  };

  const getStatusIcon = (outstanding) => {
    if (outstanding <= 0) return <CheckCircle2 size={16} className="text-green-600" />;
    return <AlertCircle size={16} className="text-orange-600" />;
  };

  const handleUdhariSelect = (udhariId) => {
    onUdhariSelect(udhariId);
    
    // Suggest the outstanding amount to the parent component
    const selectedUdhari = availableUdharis.find(u => u._id === udhariId);
    if (selectedUdhari && onAmountSuggestion) {
      // Use outstandingBalance (in paise) and convert to rupees
      const outstandingRupees = selectedUdhari.outstandingBalance / 100;
      onAmountSuggestion(outstandingRupees.toString());
    }
  };

  if (loadingUdharis) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading udhari transactions...</p>
        </div>
      </div>
    );
  }

  if (!availableUdharis || availableUdharis.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Outstanding {transactionType === 'receive' ? 'Udhari Given' : 'Udhari Taken'}
        </h3>
        <p className="text-gray-600">
          {transactionType === 'receive' 
            ? 'You haven\'t given any udhari to this customer that needs to be collected.'
            : 'You haven\'t taken any udhari from this customer that needs to be paid back.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User size={20} className="text-blue-600" />
          <h4 className="text-lg font-medium text-gray-900">
            Select {transactionType === 'receive' ? 'Udhari to Collect' : 'Udhari to Pay Back'}
          </h4>
        </div>
        <button
          onClick={fetchCustomerUdharis}
          disabled={loadingUdharis}
          className="text-blue-600 hover:text-blue-800 p-1 rounded"
          title="Refresh"
        >
          <RefreshCw size={16} className={loadingUdharis ? 'animate-spin' : ''} />
        </button>
      </div>

      {errors.selectedUdhariId && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {errors.selectedUdhariId}
        </div>
      )}

      <div className="space-y-3">
        {availableUdharis.map((udhari) => (
          <div
            key={udhari._id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedUdhariId === udhari._id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handleUdhariSelect(udhari._id)}
          >
            <div className="flex items-start justify-between">
              {/* Main Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="radio"
                    name="udhari"
                    value={udhari._id}
                    checked={selectedUdhariId === udhari._id}
                    onChange={(e) => handleUdhariSelect(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    {getStatusIcon(udhari.outstandingBalance)}
                    <span className="font-medium text-gray-900">
                      ₹{(udhari.principalPaise / 100).toFixed(2)} - {udhari.kind}
                    </span>
                  </div>
                </div>

                {/* Outstanding Amount */}
                <div className="ml-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Outstanding Amount:</span>
                    <span className={`font-semibold ${getStatusColor(udhari.outstandingBalance)}`}>
                      ₹{(udhari.outstandingBalance / 100).toFixed(2)}
                    </span>
                  </div>

                  {/* Date and Note */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>Given: {formatDate(udhari.takenDate)}</span>
                    </div>
                    {udhari.returnDate && (
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>Due: {formatDate(udhari.returnDate)}</span>
                      </div>
                    )}
                  </div>

                  {udhari.note && (
                    <div className="text-sm text-gray-600 italic">
                      "{udhari.note}"
                    </div>
                  )}

                  {/* Installment Info */}
                  {udhari.totalInstallments > 1 && (
                    <div className="text-xs text-gray-500">
                      Installment {udhari.installmentNumber || 1} of {udhari.totalInstallments}
                    </div>
                  )}
                </div>
              </div>

              {/* Amount Display */}
              <div className="text-right ml-4">
                <div className="text-lg font-bold text-gray-900">
                  ₹{(udhari.outstandingBalance / 100).toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  Outstanding
                </div>
              </div>
            </div>

            {/* Expandable Details */}
            {showDetails[udhari._id] && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Original Amount:</span>
                    <span className="ml-2 font-medium">₹{(udhari.principalPaise / 100).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="ml-2 font-medium">
                      ₹{((udhari.principalPaise - udhari.outstandingBalance) / 100).toFixed(2)}
                    </span>
                  </div>
                  {udhari.direction && (
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-2 font-medium">
                        {udhari.direction === 1 ? 'Given' : 'Taken'}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 font-medium ${getStatusColor(udhari.outstandingBalance)}`}>
                      {udhari.outstandingBalance <= 0 ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Toggle Details Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleDetails(udhari._id);
              }}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              {showDetails[udhari._id] ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
        ))}
      </div>

      {/* Selected Udhari Summary */}
      {selectedUdhariId && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 className="font-medium text-green-800 mb-2">Selected Transaction</h5>
          {(() => {
            const selectedUdhari = availableUdharis.find(u => u._id === selectedUdhariId);
            if (!selectedUdhari) return null;
            
            return (
              <div className="text-sm text-green-700">
                <p>
                  <strong>Outstanding Amount:</strong> ₹{(selectedUdhari.outstandingBalance / 100).toFixed(2)}
                </p>
                <p className="text-xs mt-1 text-green-600">
                  You can {transactionType === 'receive' ? 'receive' : 'pay'} partial or full amount. 
                  Any remaining amount will be tracked automatically.
                </p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default UdhariSelector;