import React, { useState, useEffect } from 'react';
import { X, Percent, AlertCircle, Loader2 } from 'lucide-react';
import ApiService from '../services/api.js';

const InterestPaymentModal = ({ isOpen, loan, onClose, onSuccess }) => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [interestAmount, setInterestAmount] = useState('');
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
      setInterestAmount('');
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

  const getInterestDue = (transaction) => {
    return transaction.interestDue ? transaction.interestDue / 100 : 0;
  };

  const handleInterestPayment = async (e) => {
    e.preventDefault();
    
    if (!selectedTransaction) {
      setError('Please select a transaction');
      return;
    }

    if (!interestAmount || parseFloat(interestAmount) <= 0) {
      setError('Please enter a valid interest amount');
      return;
    }

    const interestDue = getInterestDue(selectedTransaction);
    if (parseFloat(interestAmount) > interestDue) {
      setError(`Interest payment cannot exceed due amount of ${formatCurrency(interestDue)}`);
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

      const interestData = {
        customer: String(loan.customer._id),
        interestPaise: parseInt(parseFloat(interestAmount) * 100),
        sourceRef: String(selectedTransaction._id),
        note: paymentNote.trim() || undefined,
        paymentDate: paymentDate,
        paymentMethod: paymentMethod,
        reference: paymentReference.trim() || '',
        transactionId: paymentReference.trim() || ''
      };

      console.log('Making interest payment:', { loan, selectedTransaction, interestData });

      const response = loan.type === 'receivable' 
        ? await ApiService.receiveInterestPayment(interestData)
        : await ApiService.payInterest(interestData);

      if (response.success) {
        console.log('Interest payment successful!');
        onSuccess();
        onClose();
      } else {
        throw new Error(response.message || response.error || 'Interest payment failed');
      }
    } catch (error) {
      console.error('Interest payment error:', error);
      setError(error.message || 'Failed to process interest payment');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (percentage) => {
    if (selectedTransaction) {
      const interestDue = getInterestDue(selectedTransaction);
      const amount = (interestDue * percentage / 100).toFixed(2);
      setInterestAmount(amount);
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
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br from-purple-500 to-purple-600`}>
              <span className="text-white text-sm font-bold">{getInitials(customer.name)}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{isReceivable ? 'Receive Interest Payment' : 'Make Interest Payment'}</h2>
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
                  const interestDue = getInterestDue(transaction);
                  
                  return (
                    <div
                      key={transaction._id || index}
                      onClick={() => setSelectedTransaction(transaction)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedTransaction?._id === transaction._id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{transaction.note || 'Loan Transaction'}</p>
                          <p className="text-sm text-slate-500">{formatDate(transaction.takenDate || transaction.date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-600">{formatCurrency(interestDue)}</p>
                          <p className="text-sm text-slate-500">Interest Due</p>
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
                  <p className="text-sm text-slate-600">Principal Outstanding</p>
                  <p className="font-bold text-slate-900">
                    {formatCurrency((selectedTransaction.outstandingBalance || selectedTransaction.principalPaise || 0) / 100)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Interest Due</p>
                  <p className="font-bold text-purple-600">{formatCurrency(getInterestDue(selectedTransaction))}</p>
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Interest Amount *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500">₹</span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={interestAmount}
                onChange={(e) => setInterestAmount(e.target.value)}
                placeholder="0.00"
                max={selectedTransaction ? getInterestDue(selectedTransaction) : undefined}
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
                  className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
                >
                  Full Payment
                </button>
              </div>
            )}
            {interestAmount && selectedTransaction && (
              <div className="mt-2 p-3 bg-purple-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Interest Payment:</span>
                  <span className="font-medium text-slate-900">{formatCurrency(parseFloat(interestAmount))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Remaining Interest Due:</span>
                  <span className="font-medium text-purple-600">
                    {formatCurrency(Math.max(0, getInterestDue(selectedTransaction) - parseFloat(interestAmount)))}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
            <select
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Note (Optional)</label>
            <textarea
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows="3"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="Add a note about this interest payment..."
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
              onClick={handleInterestPayment}
              disabled={loading || !selectedTransaction || !interestAmount}
              className="flex-1 px-6 py-3 text-white rounded-xl transition-colors font-medium bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Percent size={18} />
                  {isReceivable ? 'Receive Interest' : 'Pay Interest'}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterestPaymentModal;