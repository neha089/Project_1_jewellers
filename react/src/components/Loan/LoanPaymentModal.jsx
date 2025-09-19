import React, { useState, useEffect } from 'react';
import { X, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import ApiService from '../../services/api.js';

const LoanPaymentModal = ({ isOpen, loan, onClose, onSuccess }) => {
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestAmount, setInterestAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setPrincipalAmount('');
    setInterestAmount('');
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
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getOutstandingAmount = () => {
    return loan?.outstandingAmount || 0;
  };

  const getMonthlyInterest = () => {
    const outstanding = loan?.outstandingPrincipal || 0;
    const interestRate = loan?.interestRateMonthlyPct || 0;
    return (outstanding * interestRate) / 100 / 100; // Convert paise to rupees
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!loan?._id) {
      setError('Loan ID is missing');
      return;
    }

    const principalPaise = principalAmount ? parseInt(parseFloat(principalAmount) * 100) : 0;
    const interestPaise = interestAmount ? parseInt(parseFloat(interestAmount) * 100) : 0;

    if (principalPaise <= 0 && interestPaise <= 0) {
      setError('Please enter at least one payment amount');
      return;
    }

    const outstandingAmount = getOutstandingAmount();
    if (principalPaise > 0 && principalPaise / 100 > outstandingAmount) {
      setError(`Principal payment cannot exceed outstanding amount of ${formatCurrency(outstandingAmount)}`);
      return;
    }

    const expectedInterest = getMonthlyInterest() * 100; // Convert back to paise for validation
    if (interestPaise > 0 && interestPaise > expectedInterest) {
      setError(`Interest payment cannot exceed expected amount of ${formatCurrency(expectedInterest / 100)}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const paymentData = {
        loanId: loan._id,
        principalPaise,
        interestPaise,
        note: paymentNote.trim() || undefined,
        paymentDate,
        paymentMethod,
        reference: paymentReference.trim() || '',
        transactionId: paymentReference.trim() || '',
      };
      console.log('Submitting payment data:', paymentData);
      const isGivenLoan = loan.loanType === 'GIVEN';
      console.log('Is given loan (receivable):', isGivenLoan);
      const response = isGivenLoan
        ? await ApiService.receiveLoanPayment(paymentData)
        : await ApiService.makeLoanPayment(paymentData);
      console.log(response);
      if (response.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(response.message || response.error || 'Payment failed');
      }
    } catch (error) {
      setError(error.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrincipalAmount = (percentage) => {
    const outstandingAmount = getOutstandingAmount();
    const amount = (outstandingAmount * percentage / 100).toFixed(2);
    setPrincipalAmount(amount);
  };

  const handleQuickInterestAmount = (percentage) => {
    const expectedInterest = getMonthlyInterest();
    const amount = (expectedInterest * percentage / 100).toFixed(2);
    setInterestAmount(amount);
  };

  if (!isOpen || !loan || !loan._id) {
    return null;
  }

  const customer = loan.customer || {};
  const isReceivable = loan.loanType === 'GIVEN';
  const outstandingAmount = getOutstandingAmount();
  const monthlyInterest = getMonthlyInterest();

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
                {isReceivable ? 'Receive Loan Payment' : 'Make Loan Payment'}
              </h2>
              <p className="text-sm text-slate-600">{customer.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p /

System: -2 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl">
            <h3 className="font-semibold text-slate-900 mb-3">Loan Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Outstanding Principal</p>
                <p className="font-bold text-slate-900">{formatCurrency(outstandingAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Monthly Interest ({loan.interestRateMonthlyPct}%)</p>
                <p className="font-bold text-purple-600">{formatCurrency(monthlyInterest)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Original Amount</p>
                <p className="text-slate-700">{formatCurrency(loan.originalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Payments Made</p>
                <p className="text-slate-700">{loan.paymentHistory?.length || 0}</p>
              </div>
            </div>
            {loan.note && (
              <div className="mt-3">
                <p className="text-sm text-slate-600">Loan Note</p>
                <p className="text-slate-900">{loan.note}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Principal Payment</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                placeholder="0.00"
                max={outstandingAmount}
              />
            </div>
            {outstandingAmount > 0 && (
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => handleQuickPrincipalAmount(25)}
                  className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPrincipalAmount(50)}
                  className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPrincipalAmount(100)}
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                >
                  Full Payment
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Interest Payment</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={interestAmount}
                onChange={(e) => setInterestAmount(e.target.value)}
                placeholder="0.00"
                max={monthlyInterest}
              />
            </div>
            {monthlyInterest > 0 && (
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => handleQuickInterestAmount(100)}
                  className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
                >
                  Current Month ({formatCurrency(monthlyInterest)})
                </button>
              </div>
            )}
          </div>

          {(principalAmount || interestAmount) && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Principal Payment:</span>
                <span className="font-medium text-slate-900">{formatCurrency(parseFloat(principalAmount || 0))}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Interest Payment:</span>
                <span className="font-medium text-slate-900">{formatCurrency(parseFloat(interestAmount || 0))}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t pt-1">
                <span className="text-slate-700">Total Payment:</span>
                <span className="text-slate-900">{formatCurrency((parseFloat(principalAmount || 0) + parseFloat(interestAmount || 0)))}</span>
              </div>
              {principalAmount && (
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-600">Remaining Principal:</span>
                  <span className="font-medium text-orange-600">
                    {formatCurrency(Math.max(0, outstandingAmount - parseFloat(principalAmount)))}
                  </span>
                </div>
              )}
            </div>
          )}

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
              disabled={loading || (!principalAmount && !interestAmount)}
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

export default LoanPaymentModal;