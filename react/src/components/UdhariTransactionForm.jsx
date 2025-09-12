import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import ApiService from '../services/api';
import UdhariSelector from './UdhariSelector';

const UdhariTransactionForm = ({
  selectedCustomer,
  selectedCategory,
  onSuccess,
  onCancel
}) => {
  const [transactionData, setTransactionData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    returnDate: '',
    totalInstallments: '1',
    installmentNumber: '1',
    selectedUdhariId: '',
    paymentMode: 'CASH'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [transactionSummary, setTransactionSummary] = useState(null);

  const getTransactionType = () => {
    switch (selectedCategory.id) {
      case 'udhari-given':
        return 'give';
      case 'udhari-taken':
        return 'take';
      case 'udhari-received':
        return 'receive';
      case 'udhari-paid':
        return 'pay';
      default:
        return 'give';
    }
  };

  const isPaymentTransaction = () => {
    return selectedCategory.id === 'udhari-received' || selectedCategory.id === 'udhari-paid';
  };

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setTransactionData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific error when field is updated
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAmountSuggestion = (suggestedAmount) => {
    setTransactionData(prev => ({ ...prev, amount: suggestedAmount }));
  };

  const handleUdhariSelect = (udhariId) => {
    setTransactionData(prev => ({ ...prev, selectedUdhariId: udhariId }));
    if (errors.selectedUdhariId) {
      setErrors(prev => ({ ...prev, selectedUdhariId: '' }));
    }
  };

  const validateForm = () => {
  const newErrors = {};

  if (!transactionData.amount || parseFloat(transactionData.amount) <= 0) {
    newErrors.amount = 'Valid amount is required';
  }

  if (isPaymentTransaction() && !transactionData.selectedUdhariId) {
    newErrors.selectedUdhariId = 'Please select an udhari transaction to make payment against';
  }

  if (!isPaymentTransaction() && selectedCategory.id === 'udhari-given' && !transactionData.returnDate) {
    newErrors.returnDate = 'Return date is required for given udhari';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};


  const calculateTransactionSummary = () => {
    const amount = parseFloat(transactionData.amount) || 0;
    
    if (isPaymentTransaction() && transactionData.selectedUdhariId) {
      // For payment transactions, show remaining amount after this payment
      // This would be calculated based on the selected udhari's outstanding amount
      setTransactionSummary({
        paymentAmount: amount,
        // Note: In a real implementation, you'd fetch the selected udhari details
        // and calculate remaining amount = outstanding - payment amount
      });
    } else {
      // For new udhari transactions
      setTransactionSummary({
        totalAmount: amount,
        installmentAmount: amount / parseInt(transactionData.totalInstallments || 1)
      });
    }
  };

  useEffect(() => {
    if (transactionData.amount) {
      calculateTransactionSummary();
    }
  }, [transactionData.amount, transactionData.totalInstallments, transactionData.selectedUdhariId]);

 const submitTransaction = async () => {
  if (!validateForm()) return;

  setLoading(true);
  setErrors({});
  
  try {
    console.log('Submitting transaction:', transactionData);
    
    let response;
    const transactionType = getTransactionType();

    switch (transactionType) {
      case 'receive':
        response = await ApiService.receiveUdhariPayment({
          customerId: selectedCustomer._id,
          amount: transactionData.amount,
          description: transactionData.description,
          sourceRef: transactionData.selectedUdhariId, // This is the key field
          installmentNumber: parseInt(transactionData.installmentNumber || 1)
        });
        break;

      case 'pay':
        response = await ApiService.makeUdhariPayment({
          customerId: selectedCustomer._id,
          amount: transactionData.amount,
          description: transactionData.description,
          sourceRef: transactionData.selectedUdhariId,
          installmentNumber: parseInt(transactionData.installmentNumber || 1)
        });
        break;

        case 'give':
          response = await ApiService.giveUdhari({
            customerId: selectedCustomer._id,
            amount: transactionData.amount,
            description: transactionData.description,
            returnDate: transactionData.returnDate,
            totalInstallments: parseInt(transactionData.totalInstallments)
          });
          break;

        case 'take':
          response = await ApiService.takeUdhari({
            customerId: selectedCustomer._id,
            amount: transactionData.amount,
            description: transactionData.description,
            returnDate: transactionData.returnDate,
            totalInstallments: parseInt(transactionData.totalInstallments)
          });
          break;

        
        default:
          throw new Error('Invalid transaction type');
      }

      if (response && !response.error) {
        onSuccess();
      } else {
        throw new Error(response?.error || 'Transaction failed');
      }

    } catch (error) {
      console.error('Transaction failed:', error);
      setErrors({ submit: error.message || 'Failed to save transaction. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTitle = () => {
    switch (selectedCategory.id) {
      case 'udhari-given':
        return 'Give Udhari';
      case 'udhari-taken':
        return 'Take Udhari';
      case 'udhari-received':
        return 'Receive Udhari Payment';
      case 'udhari-paid':
        return 'Make Udhari Payment';
      default:
        return 'Udhari Transaction';
    }
  };

  const getTransactionDescription = () => {
    switch (selectedCategory.id) {
      case 'udhari-given':
        return 'Record money you are giving to this customer';
      case 'udhari-taken':
        return 'Record money you are borrowing from this customer';
      case 'udhari-received':
        return 'Record payment received from customer for previously given udhari';
      case 'udhari-paid':
        return 'Record payment you are making to customer for previously taken udhari';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 bg-${selectedCategory.color}-100 rounded-xl flex items-center justify-center`}>
            <selectedCategory.icon size={24} className={`text-${selectedCategory.color}-600`} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {getTransactionTitle()}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Customer: {selectedCustomer.name}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {getTransactionDescription()}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {errors.submit}
          </div>
        )}

        {/* Udhari Selection for Payment Transactions */}
        {isPaymentTransaction() && (
          <div className="mb-6">
            <UdhariSelector
              customerId={selectedCustomer._id}
              selectedUdhariId={transactionData.selectedUdhariId}
              loading={loading}
              errors={errors}
              onUdhariSelect={handleUdhariSelect}
              onAmountSuggestion={handleAmountSuggestion}
              transactionType={selectedCategory.id === 'udhari-received' ? 'receive' : 'pay'}
            />
          </div>
        )}

        {/* Transaction Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Amount Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={transactionData.amount}
              onChange={handleDataChange}
              min="0"
              step="0.01"
              placeholder="0.00"
              disabled={loading}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          {/* Date Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                name="date"
                value={transactionData.date}
                onChange={handleDataChange}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Calendar className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Return Date (for Give/Take Udhari) */}
          {!isPaymentTransaction() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Return Date {selectedCategory.id === 'udhari-given' && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="returnDate"
                  value={transactionData.returnDate}
                  onChange={handleDataChange}
                  disabled={loading}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.returnDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <Calendar className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
              {errors.returnDate && (
                <p className="mt-1 text-sm text-red-600">{errors.returnDate}</p>
              )}
            </div>
          )}

          {/* Total Installments (for Give/Take Udhari) */}
          {!isPaymentTransaction() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Installments
              </label>
              <input
                type="number"
                name="totalInstallments"
                value={transactionData.totalInstallments}
                onChange={handleDataChange}
                min="1"
                max="12"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Installment Number (for Payment Transactions) */}
          {isPaymentTransaction() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Installment Number
              </label>
              <input
                type="number"
                name="installmentNumber"
                value={transactionData.installmentNumber}
                onChange={handleDataChange}
                min="1"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Payment Mode (for Payment Transactions) */}
          {isPaymentTransaction() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Mode
              </label>
              <select
                name="paymentMode"
                value={transactionData.paymentMode}
                onChange={handleDataChange}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CARD">Card</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          )}
        </div>

        {/* Description Field */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description/Notes
          </label>
          <div className="relative">
            <textarea
              name="description"
              value={transactionData.description}
              onChange={handleDataChange}
              rows={3}
              placeholder="Enter additional details..."
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <FileText className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Transaction Summary */}
        {transactionSummary && transactionData.amount && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
              <CheckCircle2 size={16} />
              Transaction Summary
            </h4>
            <div className="text-sm text-blue-700 space-y-1">
              {!isPaymentTransaction() ? (
                <>
                  <p><strong>Total Amount:</strong> ₹{transactionData.amount}</p>
                  {parseInt(transactionData.totalInstallments) > 1 && (
                    <p><strong>Per Installment:</strong> ₹{(parseFloat(transactionData.amount) / parseInt(transactionData.totalInstallments)).toFixed(2)}</p>
                  )}
                  {transactionData.returnDate && (
                    <p><strong>Due Date:</strong> {new Date(transactionData.returnDate).toLocaleDateString('en-IN')}</p>
                  )}
                </>
              ) : (
                <>
                  <p><strong>Payment Amount:</strong> ₹{transactionData.amount}</p>
                  <p className="text-blue-600">
                    This will be recorded as installment #{transactionData.installmentNumber}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          
          <button
            onClick={submitTransaction}
            disabled={loading || !transactionData.amount}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-medium"
          >
            <Save size={16} />
            {loading ? 'Saving...' : 'Save Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UdhariTransactionForm;