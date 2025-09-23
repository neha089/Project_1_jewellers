// ItemRepaymentModal.jsx - NEW: MANUAL REPAYMENT AMOUNT FOR SELECTED ITEMS
import React, { useState, useEffect } from 'react';
import { X, DollarSign, AlertCircle, Loader2, CheckCircle, Coins } from 'lucide-react';
import ApiService from '../../services/api.js';

const ItemRepaymentModal = ({ isOpen, loan, onClose, onRepaymentSuccess }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [processingFee, setProcessingFee] = useState('');
  const [lateFee, setLateFee] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [activeItems, setActiveItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [itemDetails, setItemDetails] = useState({});

  useEffect(() => {
    if (isOpen && loan?._id) {
      fetchActiveItems();
      resetForm();
    }
  }, [isOpen, loan?._id]);

  const resetForm = () => {
    setSelectedItems([]);
    setRepaymentAmount('');
    setPaymentNote('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('CASH');
    setPaymentReference('');
    setChequeNumber('');
    setBankName('');
    setChequeDate('');
    setProcessingFee('');
    setLateFee('');
    setAdjustmentAmount('');
    setAdjustmentReason('');
    setError(null);
    setValidationErrors({});
    setItemDetails({});
  };

  const fetchActiveItems = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getActiveItemsForReturn(loan._id);
      if (response.success) {
        setActiveItems(response.data.activeItems || []);
      } else {
        setError(response.error || 'Failed to fetch active items');
      }
    } catch (error) {
      setError('Failed to load active items: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (itemId, isSelected) => {
    setSelectedItems(prev => 
      isSelected 
        ? [...prev, itemId]
        : prev.filter(id => id !== itemId)
    );
  };

  const handleItemDetailChange = (itemId, field, value) => {
    setItemDetails(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        [field]: value
      }
    }));
    if (validationErrors[itemId]) {
      setValidationErrors(prev => ({
        ...prev,
        [itemId]: undefined
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (selectedItems.length === 0) {
      newErrors.selectedItems = 'Please select at least one item to return';
    }

    selectedItems.forEach(itemId => {
      const details = itemDetails[itemId] || {};
      if (!details.weight || parseFloat(details.weight) <= 0) {
        newErrors[itemId] = 'Valid returned weight is required';
      }
      if (!details.returnPrice || parseFloat(details.returnPrice) <= 0) {
        newErrors[itemId] = 'Valid return amount is required';
      }
    });

    if (!repaymentAmount || parseFloat(repaymentAmount) <= 0) {
      newErrors.repaymentAmount = 'Valid repayment amount is required';
    }

    if (!paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRepayment = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const repaymentData = {
        selectedItems: selectedItems.map(itemId => ({
          itemId,
          weight: parseFloat(itemDetails[itemId]?.weight || 0),
          returnPrice: parseFloat(itemDetails[itemId]?.returnPrice || 0),
          condition: itemDetails[itemId]?.condition || 'good',
          returnPhotos: itemDetails[itemId]?.returnPhotos || [],
          returnNotes: itemDetails[itemId]?.returnNotes || ''
        })),
        repaymentAmount: parseFloat(repaymentAmount),
        paymentDate,
        paymentMethod,
        referenceNumber: paymentReference.trim() || undefined,
        chequeNumber: chequeNumber.trim() || undefined,
        bankName: bankName.trim() || undefined,
        chequeDate: chequeDate || undefined,
        photos: [], // Add photo handling if needed
        notes: paymentNote.trim() || '',
        recordedBy: 'Admin', // Or get from auth
        processingFee: parseFloat(processingFee) || 0,
        lateFee: parseFloat(lateFee) || 0,
        adjustmentAmount: parseFloat(adjustmentAmount) || 0,
        adjustmentReason: adjustmentReason.trim() || undefined
      };

      const response = await ApiService.processItemReturn(loan._id, repaymentData);

      if (response.success) {
        onRepaymentSuccess?.(response);
        onClose();
      } else {
        throw new Error(response.error || 'Repayment failed');
      }
    } catch (error) {
      setError(error.message || 'Failed to process repayment');
    } finally {
      setLoading(false);
    }
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

  if (!isOpen || !loan || !loan._id) {
    return null;
  }

  const customer = loan.customer || {};
  const outstandingAmount = loan.outstandingAmount || loan.currentPrincipal || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br from-green-500 to-green-600">
              <span className="text-white text-sm font-bold">{getInitials(customer.name)}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Process Item Repayment
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
          <div className="bg-slate-50 p-4 rounded-xl">
            <h3 className="font-semibold text-slate-900 mb-3">Loan Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Outstanding Amount</p>
                <p className="font-bold text-slate-900">{formatCurrency(outstandingAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Interest Rate</p>
                <p className="font-bold text-slate-900">{loan.interestRateMonthlyPct}% monthly</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Next Due Date</p>
                <p className="text-slate-700">
                  {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString('en-IN') : 'N/A'}
                </p>
              </div>
            </div>
            {loan.notes && (
              <div className="mt-3">
                <p className="text-sm text-slate-600">Loan Note</p>
                <p className="text-slate-900">{loan.notes}</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Select Items to Return *</h3>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {activeItems.map(item => (
                <div key={item._id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selectedItems.includes(item._id)}
                      onChange={(e) => handleItemSelect(item._id, e.target.checked)}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name || 'Gold Item'}</h4>
                      <p className="text-sm text-gray-600">
                        Weight: {item.weightGram}g | Purity: {item.purityK}K
                      </p>
                      {selectedItems.includes(item._id) && (
                        <div className="mt-2 space-y-2">
                          <div>
                            <label className="text-xs text-gray-600">Returned Weight *</label>
                            <input
                              type="number"
                              step="0.01"
                              className="w-full mt-1 p-2 border rounded"
                              value={itemDetails[item._id]?.weight || ''}
                              onChange={(e) => handleItemDetailChange(item._id, 'weight', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Return Amount *</label>
                            <input
                              type="number"
                              className="w-full mt-1 p-2 border rounded"
                              value={itemDetails[item._id]?.returnPrice || ''}
                              onChange={(e) => handleItemDetailChange(item._id, 'returnPrice', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Condition</label>
                            <select
                              className="w-full mt-1 p-2 border rounded"
                              value={itemDetails[item._id]?.condition || 'good'}
                              onChange={(e) => handleItemDetailChange(item._id, 'condition', e.target.value)}
                            >
                              <option value="good">Good</option>
                              <option value="fair">Fair</option>
                              <option value="poor">Poor</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Return Notes</label>
                            <textarea
                              className="w-full mt-1 p-2 border rounded"
                              rows="2"
                              value={itemDetails[item._id]?.returnNotes || ''}
                              onChange={(e) => handleItemDetailChange(item._id, 'returnNotes', e.target.value)}
                            />
                          </div>
                          {/* Add photo upload if needed */}
                        </div>
                      )}
                    </div>
                  </div>
                  {validationErrors[item._id] && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors[item._id]}</p>
                  )}
                </div>
              ))}
            </div>
            {validationErrors.selectedItems && (
              <p className="text-red-500 text-sm mt-2">{validationErrors.selectedItems}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Repayment Amount *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500">₹</span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={repaymentAmount}
                onChange={(e) => setRepaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            {validationErrors.repaymentAmount && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.repaymentAmount}</p>
            )}
            {repaymentAmount && (
              <div className="mt-2 p-3 bg-green-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Repayment:</span>
                  <span className="font-medium text-slate-900">{formatCurrency(parseFloat(repaymentAmount))}</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Processing Fee</label>
              <input
                type="number"
                min="0"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={processingFee}
                onChange={(e) => setProcessingFee(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Late Fee</label>
              <input
                type="number"
                min="0"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={lateFee}
                onChange={(e) => setLateFee(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Adjustment Amount</label>
              <input
                type="number"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Adjustment Reason</label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Reason for adjustment"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
            <select
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Enter transaction ID or reference"
              />
            </div>
          )}

          {paymentMethod === 'CHEQUE' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cheque Number</label>
                <input
                  type="text"
                  value={chequeNumber}
                  onChange={(e) => setChequeNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter cheque number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter bank name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cheque Date</label>
                <input
                  type="date"
                  value={chequeDate}
                  onChange={(e) => setChequeDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Date *</label>
            <input
              type="date"
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            {validationErrors.paymentDate && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.paymentDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Note (Optional)</label>
            <textarea
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows="3"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="Add a note about this repayment..."
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
              onClick={handleRepayment}
              disabled={loading || selectedItems.length === 0}
              className="flex-1 px-6 py-3 text-white rounded-xl transition-colors font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <DollarSign size={18} />
                  Process Repayment
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemRepaymentModal;