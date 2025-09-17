import React, { useState, useEffect } from 'react';
import { X, DollarSign, Coins, Upload, Camera, Calendar, CreditCard, ArrowLeft } from 'lucide-react';
import ApiService from '../services/api';

const PaymentModal = ({ isOpen, onClose, loan, onPaymentComplete }) => {
  const [paymentType, setPaymentType] = useState(null); // 'interest' or 'repayment'
  const [formData, setFormData] = useState({
    interestAmount: '',
    repaymentAmount: '',
    selectedItemIds: [],
    currentGoldPrice: '',
    forMonth: '',
    notes: '',
    photos: []
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentGoldPrice, setCurrentGoldPrice] = useState(6500); // Default gold price

  // Calculate monthly interest due
  const monthlyInterestDue = loan ? (loan.currentLoanAmount * (loan.interestRateMonthlyPct || 0)) / 100 : 0;
  
  // Get current month for interest payment
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isOpen && loan) {
      setFormData(prev => ({
        ...prev,
        interestAmount: monthlyInterestDue.toString(),
        currentGoldPrice: currentGoldPrice.toString(),
        forMonth: getCurrentMonth()
      }));
    }
  }, [isOpen, loan, monthlyInterestDue, currentGoldPrice]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'selectedItemIds') {
      const itemId = value;
      setFormData(prev => ({
        ...prev,
        selectedItemIds: checked 
          ? [...prev.selectedItemIds, itemId]
          : prev.selectedItemIds.filter(id => id !== itemId)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear related errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, {
            name: file.name,
            dataUrl: event.target.result,
            size: file.size
          }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const validateInterestPayment = () => {
    const newErrors = {};
    
    if (!formData.interestAmount || parseFloat(formData.interestAmount) <= 0) {
      newErrors.interestAmount = 'Valid interest amount is required';
    }
    
    if (!formData.forMonth) {
      newErrors.forMonth = 'Please select the month for this payment';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRepayment = () => {
    const newErrors = {};
    
    if (!formData.repaymentAmount || parseFloat(formData.repaymentAmount) <= 0) {
      newErrors.repaymentAmount = 'Valid repayment amount is required';
    }
    
    if (formData.selectedItemIds.length === 0) {
      newErrors.selectedItemIds = 'Please select at least one item to return';
    }
    
    if (!formData.currentGoldPrice || parseFloat(formData.currentGoldPrice) <= 0) {
      newErrors.currentGoldPrice = 'Current gold price is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInterestPayment = async () => {
    if (!validateInterestPayment()) return;

    setLoading(true);
    try {
      const response = await ApiService.addInterestPayment(loan._id, {
        interestAmount: parseFloat(formData.interestAmount),
        forMonth: formData.forMonth,
        notes: formData.notes,
        photos: formData.photos.map(photo => photo.dataUrl)
      });

      if (response.success) {
        onPaymentComplete && onPaymentComplete(response.data);
        alert(`Interest payment of ₹${formData.interestAmount} recorded successfully!`);
        handleClose();
      } else {
        setErrors({ submit: response.error || 'Failed to process interest payment' });
      }
    } catch (error) {
      setErrors({ submit: `Error processing payment: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleRepayment = async () => {
    if (!validateRepayment()) return;

    setLoading(true);
    try {
      const response = await ApiService.processItemRepayment(loan._id, {
        repaymentAmount: parseFloat(formData.repaymentAmount),
        selectedItemIds: formData.selectedItemIds,
        currentGoldPrice: parseFloat(formData.currentGoldPrice),
        notes: formData.notes,
        photos: formData.photos.map(photo => photo.dataUrl)
      });

      if (response.success) {
        onPaymentComplete && onPaymentComplete(response.data);
        const summary = response.repaymentSummary;
        alert(`Repayment processed successfully!\n${summary.itemsReturned} items returned.\nRemaining loan: ₹${summary.remainingLoanAmount}`);
        handleClose();
      } else {
        setErrors({ submit: response.error || 'Failed to process repayment' });
      }
    } catch (error) {
      setErrors({ submit: `Error processing repayment: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPaymentType(null);
    setFormData({
      interestAmount: '',
      repaymentAmount: '',
      selectedItemIds: [],
      currentGoldPrice: '',
      forMonth: '',
      notes: '',
      photos: []
    });
    setErrors({});
    onClose();
  };

  const formatCurrency = (amount) => `₹${amount?.toLocaleString() || '0'}`;

  // Get active (unreturned) items
  const activeItems = loan?.items?.filter(item => !item.returnDate) || [];

  if (!isOpen || !loan) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-green-50">
          <div className="flex items-center gap-3">
            {paymentType && (
              <button
                onClick={() => setPaymentType(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {!paymentType ? 'Payment Options' : paymentType === 'interest' ? 'Interest Payment' : 'Item Repayment'}
              </h2>
              <p className="text-sm text-gray-600">
                Loan ID: {loan._id} • Outstanding: {formatCurrency(loan.currentLoanAmount)}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {!paymentType ? (
            /* Payment Type Selection */
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Payment Type</h3>
                <p className="text-gray-600">Select how you want to process the payment</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentType('interest')}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group text-left"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <CreditCard size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Interest Payment</h4>
                      <p className="text-sm text-gray-600">Monthly interest payment</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Interest Due:</span>
                      <span className="font-medium text-blue-600">{formatCurrency(monthlyInterestDue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interest Rate:</span>
                      <span className="font-medium">{loan.interestRateMonthlyPct}% per month</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentType('repayment')}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-200 group text-left"
                  disabled={activeItems.length === 0}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <Coins size={24} className="text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Item Repayment</h4>
                      <p className="text-sm text-gray-600">Return specific items</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Items:</span>
                      <span className="font-medium text-green-600">{activeItems.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Outstanding Amount:</span>
                      <span className="font-medium">{formatCurrency(loan.currentLoanAmount)}</span>
                    </div>
                  </div>
                  {activeItems.length === 0 && (
                    <p className="text-xs text-red-500 mt-2">No active items available for return</p>
                  )}
                </button>
              </div>
            </div>
          ) : paymentType === 'interest' ? (
            /* Interest Payment Form */
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Interest Payment Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Current Outstanding:</span>
                    <p className="font-semibold text-blue-900">{formatCurrency(loan.currentLoanAmount)}</p>
                  </div>
                  <div>
                    <span className="text-blue-700">Monthly Interest Due:</span>
                    <p className="font-semibold text-blue-900">{formatCurrency(monthlyInterestDue)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interest Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="interestAmount"
                    value={formData.interestAmount}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.interestAmount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    disabled={loading}
                  />
                  {errors.interestAmount && <p className="text-red-500 text-sm mt-1">{errors.interestAmount}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment For Month *
                  </label>
                  <input
                    type="month"
                    name="forMonth"
                    value={formData.forMonth}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.forMonth ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  />
                  {errors.forMonth && <p className="text-red-500 text-sm mt-1">{errors.forMonth}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Optional notes about this payment..."
                  disabled={loading}
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Photos (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="interest-photo-upload"
                    disabled={loading}
                  />
                  <label
                    htmlFor="interest-photo-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <Upload size={40} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Click to upload photos</span>
                  </label>
                  
                  {formData.photos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                      {formData.photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={photo.dataUrl}
                            alt={`Payment photo ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {errors.submit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  <strong>Error:</strong> {errors.submit}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentType(null)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleInterestPayment}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : `Pay ${formatCurrency(parseFloat(formData.interestAmount) || 0)}`}
                </button>
              </div>
            </div>
          ) : (
            /* Repayment Form */
            <div className="space-y-6">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">Repayment Details</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-green-700">Outstanding:</span>
                    <p className="font-semibold text-green-900">{formatCurrency(loan.currentLoanAmount)}</p>
                  </div>
                  <div>
                    <span className="text-green-700">Active Items:</span>
                    <p className="font-semibold text-green-900">{activeItems.length}</p>
                  </div>
                  <div>
                    <span className="text-green-700">Total Weight:</span>
                    <p className="font-semibold text-green-900">
                      {activeItems.reduce((sum, item) => sum + (item.weightGram || 0), 0)}g
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Repayment Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="repaymentAmount"
                    value={formData.repaymentAmount}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      errors.repaymentAmount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    disabled={loading}
                  />
                  {errors.repaymentAmount && <p className="text-red-500 text-sm mt-1">{errors.repaymentAmount}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Gold Price (per gram) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="currentGoldPrice"
                    value={formData.currentGoldPrice}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      errors.currentGoldPrice ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="6500"
                    disabled={loading}
                  />
                  {errors.currentGoldPrice && <p className="text-red-500 text-sm mt-1">{errors.currentGoldPrice}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Items to Return * ({formData.selectedItemIds.length} selected)
                </label>
                <div className="space-y-3 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {activeItems.map(item => (
                    <label key={item._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        name="selectedItemIds"
                        value={item._id}
                        checked={formData.selectedItemIds.includes(item._id)}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.weightGram}g • {item.purityK}K • {formatCurrency(item.loanAmount)}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.selectedItemIds && <p className="text-red-500 text-sm mt-1">{errors.selectedItemIds}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repayment Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Optional notes about this repayment..."
                  disabled={loading}
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Return Photos (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="repayment-photo-upload"
                    disabled={loading}
                  />
                  <label
                    htmlFor="repayment-photo-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <Camera size={40} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Click to upload photos of returned items</span>
                  </label>
                  
                  {formData.photos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                      {formData.photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={photo.dataUrl}
                            alt={`Return photo ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {errors.submit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  <strong>Error:</strong> {errors.submit}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentType(null)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleRepayment}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors font-medium"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : `Process Repayment`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
