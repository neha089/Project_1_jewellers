import React, { useState, useEffect } from 'react';
import { X, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import ApiService from '../services/api.js';

const LoanPaymentModal = ({ isOpen, loan, onClose, onSuccess }) => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && loan && loan.transactions && loan.transactions.length > 0) {
      if (loan.transactions.length === 1) {
        setSelectedTransaction(loan.transactions[0]);
      }
      setPaymentAmount('');
      setPaymentNote('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('CASH');
      setPaymentReference('');
      setError(null);
    }
  }, [isOpen, loan]);

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

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getOutstandingAmount = (transaction) => {
    if (transaction.outstandingBalance !== undefined) {
      return transaction.outstandingBalance / 100;
    }
    const originalAmount = transaction.principalPaise ? transaction.principalPaise / 100 : 0;
    const paidAmount = transaction.summary?.totalPaid || 0;
    return Math.max(0, originalAmount - paidAmount);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!selectedTransaction) {
      setError('Please select a transaction');
      return;
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    const outstandingAmount = getOutstandingAmount(selectedTransaction);
    if (parseFloat(paymentAmount) > outstandingAmount) {
      setError(`Payment amount cannot exceed outstanding amount of ${formatCurrency(outstandingAmount)}`);
      return;
    }

    if (!loan.customer || !loan.customer._id) {
      setError('Customer information is missing');
      return;
    }

    if (!selectedTransaction._id) {
      setError('Transaction ID is missing');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const paymentData = {
        customer: String(loan.customer._id),
        principalPaise: parseInt(parseFloat(paymentAmount) * 100),
        sourceRef: String(selectedTransaction._id),
        note: paymentNote.trim() || undefined,
        installmentNumber: 1,
        paymentDate: paymentDate,
        paymentMethod: paymentMethod,
        reference: paymentReference.trim() || '',
        transactionId: paymentReference.trim() || ''
      };

      console.log('Making principal payment:', { loan, selectedTransaction, paymentData });

      const response = loan.type === 'receivable' 
        ? await ApiService.receiveLoanPayment(paymentData)
        : await ApiService.makeLoanPayment(paymentData);

      if (response.success) {
        console.log('Principal payment successful!');
        onSuccess();
        onClose();
      } else {
        throw new Error(response.message || response.error || 'Principal payment failed');
      }
    } catch (error) {
      console.error('Principal payment error:', error);
      setError(error.message || 'Failed to process principal payment');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (percentage) => {
    if (selectedTransaction) {
      const outstandingAmount = getOutstandingAmount(selectedTransaction);
      const amount = (outstandingAmount * percentage / 100).toFixed(2);
      setPaymentAmount(amount);
    }
  };

  if (!isOpen || !loan) return null;

  const customer = loan.customer || {};
  const isReceivable = loan.type === 'receivable';
  const transactions = loan.transactions || [];

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
              <h2 className="text-xl font-bold text-slate-900">{isReceivable ? 'Receive Principal Payment' : 'Make Principal Payment'}</h2>
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
          {transactions.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Select Transaction *</label>
              <div className="space-y-2">
                {transactions.map((transaction, index) => {
                  const originalAmount = transaction.principalPaise ? transaction.principalPaise / 100 : 0;
                  const outstandingAmount = getOutstandingAmount(transaction);
                  
                  return (
                    <div
                      key={transaction._id || index}
                      onClick={() => setSelectedTransaction(transaction)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedTransaction?._id === transaction._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{transaction.note || 'Loan Transaction'}</p>
                          <p className="text-sm text-slate-500">{formatDate(transaction.takenDate || transaction.date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">{formatCurrency(outstandingAmount)}</p>
                          <p className="text-sm text-slate-500">of {formatCurrency(originalAmount)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedTransaction && (
            <div className="bg-slate-50 p-4 rounded-xl">
              <h3 className="font-semibold text-slate-900 mb-3">Selected Transaction</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Original Principal</p>
                  <p className="font-bold text-slate-900">
                    {formatCurrency(selectedTransaction.principalPaise ? selectedTransaction.principalPaise / 100 : 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Outstanding Principal</p>
                  <p className="font-bold text-red-600">{formatCurrency(getOutstandingAmount(selectedTransaction))}</p>
                </div>
              </div>
              {selectedTransaction.note && (
                <div className="mt-3">
                  <p className="text-sm text-slate-600">Note</p>
                  <p className="text-slate-900">{selectedTransaction.note}</p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Amount *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500">₹</span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                max={selectedTransaction ? getOutstandingAmount(selectedTransaction) : undefined}
              />
            </div>
            {selectedTransaction && (
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
                  Full Payment
                </button>
              </div>
            )}
            {paymentAmount && selectedTransaction && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Payment Amount:</span>
                  <span className="font-medium text-slate-900">{formatCurrency(parseFloat(paymentAmount))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Remaining After Payment:</span>
                  <span className="font-medium text-orange-600">
                    {formatCurrency(Math.max(0, getOutstandingAmount(selectedTransaction) - parseFloat(paymentAmount)))}
                  </span>
                </div>
              </div>
            )}
          </div>

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

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

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
              disabled={loading || !selectedTransaction || !paymentAmount}
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
                  {isReceivable ? 'Receive Principal' : 'Pay Principal'}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoanPaymentModal;