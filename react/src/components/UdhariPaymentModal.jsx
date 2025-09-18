import React, { useState, useEffect } from 'react';
import { X, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import ApiService from '../services/api.js';

const UdhariPaymentModal = ({ isOpen, udhari, onClose, onSuccess }) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
   console.log('UdhariPaymentModal props:', { isOpen, udhari });
  useEffect(() => {
    if (isOpen && udhari) {
      console.log('Payment modal opened with udhari:', udhari);
      resetForm();
    }
  }, [isOpen, udhari]);

  const resetForm = () => {
    setPaymentAmount('');
    setPaymentNote('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('CASH');
    setPaymentReference('');
    setError(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getOutstandingAmount = () => {
    // Try different property names that might contain the outstanding amount
    return udhari?.outstandingAmount || 
           udhari?.outstandingRupees || 
           udhari?.principalRupees ||
           udhari?.amount || 
           0;
  };

  const getOriginalAmount = () => {
    return udhari?.originalAmount || 
           udhari?.principalRupees ||
           udhari?.amount || 
           0;
  };

  const isReceivableTransaction = () => {
    // Check different ways to determine if this is receivable
    return udhari?.udharType === 'GIVEN' || 
           udhari?.type === 'GIVEN' ||
           udhari?.direction === -1;
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    const transactionId = udhari?._id || udhari?.id;
    if (!transactionId) {
      setError('Transaction ID is missing');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    const outstandingAmount = getOutstandingAmount();
    if (amount > outstandingAmount) {
      setError(`Payment cannot exceed outstanding amount of ${formatCurrency(outstandingAmount)}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Different payload structure based on transaction type
      let paymentData;
      
      if (isReceivableTransaction()) {
        // For receiving payments (collecting from customers)
        paymentData = {
          udharId: transactionId,
          principalPaise: Math.round(amount * 100), // Convert to paise
          paymentMethod: paymentMethod,
          paymentDate: paymentDate,
          note: paymentNote.trim() || undefined,
          reference: paymentReference.trim() || undefined,
          installmentNumber: 1
        };
      } else {
        // For making payments (paying to customers)
        paymentData = {
          udharId: transactionId,
          principalPaise: Math.round(amount * 100), // Convert to paise
           customerId: udhari?.customer?._id || udhari?.customer?.id,
          transactionId: transactionId,
          amount: amount,
          paymentMethod: paymentMethod,
          paymentDate: paymentDate,
          note: paymentNote.trim() || undefined,
          reference: paymentReference.trim() || undefined
        };
      }

      console.log('Making udhari payment with data:', paymentData);
      console.log('Is receivable transaction:', isReceivableTransaction());

      // Determine which API to call based on transaction type
      
      const response = isReceivableTransaction() 
        ? await ApiService.receiveUdhariPayment(paymentData)
        : await ApiService.makeUdhariPayment(paymentData);

      console.log('Payment API response:', response);

      if (response.success) {
        console.log('Udhari payment successful!');
        onSuccess();
        onClose();
      } else {
        throw new Error(response.message || response.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (percentage) => {
    const outstandingAmount = getOutstandingAmount();
    const amount = (outstandingAmount * percentage / 100).toFixed(2);
    setPaymentAmount(amount);
  };

  if (!isOpen || !udhari) return null;

  const customer = udhari.customer || {};
  const isReceivable = isReceivableTransaction();
  const outstandingAmount = getOutstandingAmount();
  const originalAmount = getOriginalAmount();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
              isReceivable ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-green-500 to-green-600'
            }`}>
              <span className="text-white text-sm font-bold">{getInitials(customer.name)}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isReceivable ? 'Receive Udhari Payment' : 'Make Udhari Payment'}
              </h2>
              <p className="text-sm text-slate-600">{customer.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Transaction Summary */}
          <div className="bg-slate-50 p-4 rounded-xl">
            <h3 className="font-semibold text-slate-900 mb-3">Transaction Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Outstanding Amount</p>
                <p className="font-bold text-slate-900">{formatCurrency(outstandingAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Original Amount</p>
                <p className="text-slate-700">{formatCurrency(originalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Payments Made</p>
                <p className="text-slate-700">{udhari.paymentHistory?.length || udhari.paidInstallments || 0}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Transaction Date</p>
                <p className="text-slate-700">
                  {new Date(udhari.takenDate || udhari.createdAt || udhari.date).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>
            {udhari.note && (
              <div className="mt-3">
                <p className="text-sm text-slate-600">Note</p>
                <p className="text-slate-900">{udhari.note}</p>
              </div>
            )}
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Amount *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                max={outstandingAmount}
              />
            </div>
            {outstandingAmount > 0 && (
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => handleQuickAmount(25)}
                  className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAmount(50)}
                  className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAmount(75)}
                  className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAmount(100)}
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                >
                  Full Payment ({formatCurrency(outstandingAmount)})
                </button>
              </div>
            )}
          </div>

          {/* Payment Summary */}
          {paymentAmount && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Payment Amount:</span>
                <span className="font-medium text-slate-900">{formatCurrency(parseFloat(paymentAmount || 0))}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t pt-1">
                <span className="text-slate-700">Remaining Balance:</span>
                <span className="text-orange-600">
                  {formatCurrency(Math.max(0, outstandingAmount - parseFloat(paymentAmount)))}
                </span>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
            <select
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="GPAY">Google Pay</option>
              <option value="PHONEPE">PhonePe</option>
              <option value="PAYTM">Paytm</option>
              <option value="CHEQUE">Cheque</option>
              <option value="CARD">Card</option>
              <option value="ONLINE">Online</option>
            </select>
          </div>

          {/* Payment Reference */}
          {paymentMethod !== 'CASH' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Payment Reference / Transaction ID</label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Enter transaction ID or reference"
              />
            </div>
          )}

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Date *</label>
            <input
              type="date"
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Payment Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Note (Optional)</label>
            <textarea
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="Add a note about this payment..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePayment}
              disabled={loading || !paymentAmount}
              className={`flex-1 px-6 py-3 text-white rounded-xl transition-colors font-medium ${
                isReceivable ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <CreditCard size={18} />
                  {isReceivable ? 'Receive Payment' : 'Make Payment'}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UdhariPaymentModal;
