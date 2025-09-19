import React, { useState, useEffect } from 'react';
import ApiService from '../../services/api';

import {
  X,
  DollarSign,
  Camera,
  Upload,
  CheckCircle,
  AlertTriangle,
  Calendar,
  CreditCard,
  Coins,
  User,
  Phone,
  FileText,
  Calculator,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Percent,
  Weight,
  Clock,
  TrendingDown
} from 'lucide-react';

const ItemRepaymentModal = ({
  isOpen,
  onClose,
  loan,
  onRepaymentSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
 
  // Form state
  const [formData, setFormData] = useState({
    repaymentAmount: '',
    paymentMethod: 'CASH',
    repaymentDate: new Date().toISOString().split('T')[0],
    repaymentType: 'PARTIAL_PRINCIPAL', // Changed default
    currentGoldPrice: '',
    referenceNumber: '',
    chequeNumber: '',
    bankName: '',
    chequeDate: '',
    selectedItemIds: [],
    photos: [],
    notes: '',
    processingFee: '0',
    lateFee: '0',
    adjustmentAmount: '0',
    adjustmentReason: '',
    interestPaidWithRepayment: '0',
    interestPeriodCovered: ''
  });

  const [calculations, setCalculations] = useState({
    totalItemValue: 0,
    totalMarketValue: 0,
    remainingLoanAmount: 0,
    totalWeight: 0,
    netRepaymentAmount: 0,
    canReturnItems: false,
    partialPaymentAmount: 0
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && loan) {
      resetForm();
      loadCurrentGoldPrice();
    }
  }, [isOpen, loan]);

  // Calculate values when selections change
  useEffect(() => {
    calculateRepaymentValues();
  }, [formData.selectedItemIds, formData.currentGoldPrice, formData.repaymentAmount, formData.processingFee, formData.lateFee, formData.adjustmentAmount, formData.repaymentType, loan]);

  const loadCurrentGoldPrice = async () => {
    try {
      setLoading(true);
      console.log('Loading current gold price...');
     
      const result = await ApiService.getCurrentGoldPrice();
      console.log('Gold price result:', result);
     
      if (result.success && result.data) {
        setFormData(prev => ({
          ...prev,
          currentGoldPrice: result.data.pricePerGram.toString()
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          currentGoldPrice: '5000'
        }));
      }
    } catch (error) {
      console.error('Failed to load gold price:', error);
      setFormData(prev => ({
        ...prev,
        currentGoldPrice: '5000'
      }));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      repaymentAmount: '',
      paymentMethod: 'CASH',
      repaymentDate: new Date().toISOString().split('T')[0],
      repaymentType: 'PARTIAL_PRINCIPAL',
      currentGoldPrice: '',
      referenceNumber: '',
      chequeNumber: '',
      bankName: '',
      chequeDate: '',
      selectedItemIds: [],
      photos: [],
      notes: '',
      processingFee: '0',
      lateFee: '0',
      adjustmentAmount: '0',
      adjustmentReason: '',
      interestPaidWithRepayment: '0',
      interestPeriodCovered: ''
    });
    setSelectedItems([]);
    setError('');
    setSuccess('');
  };

  const calculateRepaymentValues = () => {
    if (!loan) return;

    const selectedItemsData = loan.items?.filter(item =>
      formData.selectedItemIds.includes(item._id?.toString())
    ) || [];

    const totalItemValue = selectedItemsData.reduce((sum, item) => sum + (item.loanAmount || 0), 0);
    const totalWeight = selectedItemsData.reduce((sum, item) => sum + (item.weightGram || 0), 0);
   
    const currentGoldPrice = parseFloat(formData.currentGoldPrice) || 0;
    const totalMarketValue = selectedItemsData.reduce((sum, item) => {
      return sum + ((item.weightGram * currentGoldPrice * item.purityK) / 24);
    }, 0);

    const currentLoanAmount = loan.currentLoanAmount || loan.totalLoanAmount || 0;
    const repaymentAmount = parseFloat(formData.repaymentAmount) || 0;
    const processingFee = parseFloat(formData.processingFee) || 0;
    const lateFee = parseFloat(formData.lateFee) || 0;
    const adjustmentAmount = parseFloat(formData.adjustmentAmount) || 0;
    const netRepaymentAmount = repaymentAmount - processingFee - lateFee + adjustmentAmount;

    // Calculate remaining amount after this payment
    const remainingLoanAmount = Math.max(0, currentLoanAmount - netRepaymentAmount);

    // Determine if items can be returned based on repayment type and amount
    let canReturnItems = false;
    if (formData.repaymentType === 'ITEM_RETURN' && selectedItemsData.length > 0) {
      // For item return, payment must cover the full value of selected items
      canReturnItems = netRepaymentAmount >= totalItemValue;
    } else if (formData.repaymentType === 'FULL_PRINCIPAL') {
      // For full payment, must pay the entire remaining loan amount
      canReturnItems = netRepaymentAmount >= currentLoanAmount && selectedItemsData.length > 0;
    }

    setCalculations({
      totalItemValue,
      totalMarketValue,
      remainingLoanAmount,
      totalWeight,
      netRepaymentAmount,
      canReturnItems,
      partialPaymentAmount: netRepaymentAmount
    });

    setSelectedItems(selectedItemsData);

    // Auto-adjust repayment type based on amount and selection
    if (repaymentAmount > 0) {
      if (netRepaymentAmount >= currentLoanAmount) {
        // Full payment - can return all remaining items
        if (formData.repaymentType !== 'FULL_PRINCIPAL') {
          setFormData(prev => ({ ...prev, repaymentType: 'FULL_PRINCIPAL' }));
        }
      } else if (selectedItemsData.length > 0 && netRepaymentAmount >= totalItemValue) {
        // Can return selected items
        if (formData.repaymentType !== 'ITEM_RETURN') {
          setFormData(prev => ({ ...prev, repaymentType: 'ITEM_RETURN' }));
        }
      } else {
        // Partial payment only
        if (formData.repaymentType !== 'PARTIAL_PRINCIPAL') {
          setFormData(prev => ({ ...prev, repaymentType: 'PARTIAL_PRINCIPAL' }));
        }
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleItemSelection = (itemId) => {
    setFormData(prev => ({
      ...prev,
      selectedItemIds: prev.selectedItemIds.includes(itemId)
        ? prev.selectedItemIds.filter(id => id !== itemId)
        : [...prev.selectedItemIds, itemId]
    }));
  };

  const handleRepaymentTypeChange = (newType) => {
    setFormData(prev => ({
      ...prev,
      repaymentType: newType,
      // Clear item selection for partial payments
      selectedItemIds: newType === 'PARTIAL_PRINCIPAL' ? [] : prev.selectedItemIds
    }));
  };

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files);
    const photoUrls = files.map(file => URL.createObjectURL(file));
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...photoUrls]
    }));
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    // e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      console.log('Submitting repayment with formData:', formData); // Log formData to inspect repaymentType

      if (!formData.repaymentAmount || parseFloat(formData.repaymentAmount) <= 0) {
        throw new Error('Please enter a valid repayment amount');
      }

      if (formData.repaymentType === 'ITEM_RETURN') {
        if (formData.selectedItemIds.length === 0) {
          throw new Error('Please select at least one item to return');
        }
        if (!calculations.canReturnItems) {
          throw new Error(`Payment amount (₹${calculations.netRepaymentAmount.toLocaleString()}) is insufficient to return selected items (₹${calculations.totalItemValue.toLocaleString()} required)`);
        }
      }

      if (formData.repaymentType === 'FULL_PRINCIPAL') {
        const currentLoanAmount = loan.currentLoanAmount || loan.totalLoanAmount || 0;
        if (calculations.netRepaymentAmount < currentLoanAmount) {
          throw new Error(`Payment amount (₹${calculations.netRepaymentAmount.toLocaleString()}) is insufficient for full payment (₹${currentLoanAmount.toLocaleString()} required)`);
        }
      }

      if (!formData.currentGoldPrice || parseFloat(formData.currentGoldPrice) <= 0) {
        throw new Error('Please enter current gold price');
      }

      const repaymentData = {
        ...formData,
        items: loan.items // Include items for weightGrams calculation in api.js
      };

      console.log('Sending repaymentData to API:', repaymentData); // Log the payload

      const result = await ApiService.processItemRepayment(loan._id, repaymentData);

      if (result.success) {
        const message = formData.repaymentType === 'PARTIAL_PRINCIPAL'
          ? `Partial payment of ₹${parseFloat(formData.repaymentAmount).toLocaleString()} processed successfully! Remaining: ₹${calculations.remainingLoanAmount.toLocaleString()}`
          : formData.repaymentType === 'ITEM_RETURN'
          ? `Payment processed and ${selectedItems.length} items returned successfully!`
          : 'Loan fully paid and closed successfully!';
       
        setSuccess(message);
        setTimeout(() => {
          onRepaymentSuccess?.(result);
          onClose();
        }, 3000);
      } else {
        throw new Error(result.error || 'Failed to process repayment');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => `₹${amount?.toLocaleString() || '0'}`;
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN') : 'N/A';

  if (!isOpen || !loan) return null;

  const currentLoanAmount = loan.currentLoanAmount || loan.totalLoanAmount || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-2xl w-full max-w-6xl h-full sm:max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 border-b border-blue-100 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg ring-2 sm:ring-4 ring-blue-100 flex-shrink-0">
                <DollarSign size={24} className="sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Loan Repayment</h2>
                <p className="text-sm sm:text-base text-blue-700 font-medium truncate">
                  Loan ID: {loan._id} • {loan.customer?.name}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Outstanding: {formatCurrency(currentLoanAmount)}
                </p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Loan Status Summary */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={18} />
                Current Loan Status
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(currentLoanAmount)}
                  </div>
                  <div className="text-xs text-gray-600">Outstanding Amount</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-lg font-bold text-purple-600">
                    {loan.items?.filter(item => !item.returnDate).length || 0}
                  </div>
                  <div className="text-xs text-gray-600">Items Remaining</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(loan.payments?.reduce((sum, payment) => sum + (payment.principalAmount || 0), 0) || 0)}
                  </div>
                  <div className="text-xs text-gray-600">Total Paid</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-lg font-bold text-red-600">
                    {loan.interestRateMonthlyPct || 0}%
                  </div>
                  <div className="text-xs text-gray-600">Monthly Interest</div>
                </div>
              </div>
            </div>

            {/* Repayment Type Selection */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingDown size={18} />
                Repayment Type
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.repaymentType === 'PARTIAL_PRINCIPAL'
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-200'
                  }`}
                  onClick={() => handleRepaymentTypeChange('PARTIAL_PRINCIPAL')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      formData.repaymentType === 'PARTIAL_PRINCIPAL'
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.repaymentType === 'PARTIAL_PRINCIPAL' && (
                        <div className="w-full h-full rounded-full bg-blue-500"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Partial Payment</div>
                      <div className="text-sm text-gray-600">Pay any amount without item return</div>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.repaymentType === 'ITEM_RETURN'
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-green-200'
                  }`}
                  onClick={() => handleRepaymentTypeChange('ITEM_RETURN')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      formData.repaymentType === 'ITEM_RETURN'
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.repaymentType === 'ITEM_RETURN' && (
                        <div className="w-full h-full rounded-full bg-green-500"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Item Return</div>
                      <div className="text-sm text-gray-600">Pay item value and get items back</div>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.repaymentType === 'FULL_PRINCIPAL'
                      ? 'border-purple-300 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-purple-200'
                  }`}
                  onClick={() => handleRepaymentTypeChange('FULL_PRINCIPAL')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      formData.repaymentType === 'FULL_PRINCIPAL'
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.repaymentType === 'FULL_PRINCIPAL' && (
                        <div className="w-full h-full rounded-full bg-purple-500"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Full Payment</div>
                      <div className="text-sm text-gray-600">Close loan and get all items</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Item Selection - Only for Item Return and Full Payment */}
            {(formData.repaymentType === 'ITEM_RETURN' || formData.repaymentType === 'FULL_PRINCIPAL') && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle size={18} />
                  {formData.repaymentType === 'FULL_PRINCIPAL' ? 'All Items to Return' : 'Select Items to Return'}
                  ({loan.items?.filter(item => !item.returnDate).length || 0} available)
                </h3>
               
                {loan.items && loan.items.filter(item => !item.returnDate).length > 0 ? (
                  <div className="space-y-3">
                    {loan.items.filter(item => !item.returnDate).map((item, index) => {
                      const isSelected = formData.repaymentType === 'FULL_PRINCIPAL' ||
                                        formData.selectedItemIds.includes(item._id?.toString());
                      const isDisabled = formData.repaymentType === 'FULL_PRINCIPAL';
                     
                      return (
                        <div
                          key={item._id || index}
                          className={`border rounded-lg p-4 transition-all ${
                            isSelected
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-200 bg-white hover:border-amber-300'
                          } ${!isDisabled ? 'cursor-pointer' : ''}`}
                          onClick={() => !isDisabled && handleItemSelection(item._id?.toString())}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-1 ${
                              isSelected
                                ? 'border-green-500 bg-green-500'
                                : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <CheckCircle size={14} className="text-white" />
                              )}
                            </div>
                            <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                              <div>
                                <span className="text-sm text-gray-600 block">Item</span>
                                <span className="font-medium">{item.name || 'Gold Item'}</span>
                              </div>
                              <div>
                                <span className="text-sm text-gray-600 block">Weight</span>
                                <span className="font-medium">{item.weightGram}g</span>
                              </div>
                              <div>
                                <span className="text-sm text-gray-600 block">Purity</span>
                                <span className="font-medium">{item.purityK}K</span>
                              </div>
                              <div>
                                <span className="text-sm text-gray-600 block">Loan Amount</span>
                                <span className="font-medium text-green-600">
                                  {formatCurrency(item.loanAmount)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No items available for return
                  </div>
                )}
              </div>
            )}

            {/* Calculations Summary */}
            {(selectedItems.length > 0 || formData.repaymentType === 'PARTIAL_PRINCIPAL') && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calculator size={18} />
                  Payment Calculation
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {formData.repaymentType !== 'PARTIAL_PRINCIPAL' && (
                    <>
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="text-lg font-bold text-blue-600">
                          {selectedItems.length}
                        </div>
                        <div className="text-xs text-gray-600">Items Selected</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(calculations.totalItemValue)}
                        </div>
                        <div className="text-xs text-gray-600">Required Amount</div>
                      </div>
                    </>
                  )}
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      {formatCurrency(calculations.netRepaymentAmount)}
                    </div>
                    <div className="text-xs text-gray-600">Net Payment</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-lg font-bold text-amber-600">
                      {formatCurrency(calculations.remainingLoanAmount)}
                    </div>
                    <div className="text-xs text-gray-600">Remaining Loan</div>
                  </div>
                </div>
               
                {/* Payment Status Indicator */}
                {formData.repaymentAmount && (
                  <div className="mt-4 p-3 rounded-lg border-l-4 bg-white">
                    {formData.repaymentType === 'PARTIAL_PRINCIPAL' && (
                      <div className="border-l-blue-500">
                        <div className="flex items-center gap-2 text-blue-700">
                          <Clock size={16} />
                          <span className="font-medium">Partial Payment</span>
                        </div>
                        <p className="text-sm text-blue-600 mt-1">
                          Loan will remain active. Remaining balance: {formatCurrency(calculations.remainingLoanAmount)}
                        </p>
                      </div>
                    )}
                    {formData.repaymentType === 'ITEM_RETURN' && calculations.canReturnItems && (
                      <div className="border-l-green-500">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle size={16} />
                          <span className="font-medium">Items Can Be Returned</span>
                        </div>
                        <p className="text-sm text-green-600 mt-1">
                          Payment covers selected items. Remaining balance: {formatCurrency(calculations.remainingLoanAmount)}
                        </p>
                      </div>
                    )}
                    {formData.repaymentType === 'ITEM_RETURN' && !calculations.canReturnItems && selectedItems.length > 0 && (
                      <div className="border-l-red-500">
                        <div className="flex items-center gap-2 text-red-700">
                          <AlertTriangle size={16} />
                          <span className="font-medium">Insufficient Payment</span>
                        </div>
                        <p className="text-sm text-red-600 mt-1">
                          Need {formatCurrency(calculations.totalItemValue)} to return selected items. Current: {formatCurrency(calculations.netRepaymentAmount)}
                        </p>
                      </div>
                    )}
                    {formData.repaymentType === 'FULL_PRINCIPAL' && calculations.remainingLoanAmount === 0 && (
                      <div className="border-l-purple-500">
                        <div className="flex items-center gap-2 text-purple-700">
                          <CheckCircle size={16} />
                          <span className="font-medium">Loan Will Be Closed</span>
                        </div>
                        <p className="text-sm text-purple-600 mt-1">
                          All items will be returned and loan will be marked as completed.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Repayment Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Repayment Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign size={18} />
                  Payment Details
                </h3>
               
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Gold Price (per gram) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Weight size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      value={formData.currentGoldPrice}
                      onChange={(e) => handleInputChange('currentGoldPrice', e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="5000"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount *
                    {formData.repaymentType === 'FULL_PRINCIPAL' && (
                      <span className="text-sm text-purple-600 ml-2">(Min: {formatCurrency(currentLoanAmount)})</span>
                    )}
                    {formData.repaymentType === 'ITEM_RETURN' && selectedItems.length > 0 && (
                      <span className="text-sm text-green-600 ml-2">(Min: {formatCurrency(calculations.totalItemValue)})</span>
                    )}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      value={formData.repaymentAmount}
                      onChange={(e) => handleInputChange('repaymentAmount', e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                      required
                      min="1"
                    />
                  </div>
                  {calculations.netRepaymentAmount !== parseFloat(formData.repaymentAmount || 0) && (
                    <p className="text-xs text-blue-600 mt-1">
                      Net Amount: {formatCurrency(calculations.netRepaymentAmount)}
                    </p>
                  )}
                 
                  {/* Quick Amount Buttons */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.repaymentType === 'PARTIAL_PRINCIPAL' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleInputChange('repaymentAmount', Math.ceil(currentLoanAmount * 0.25).toString())}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                        >
                          25% ({formatCurrency(Math.ceil(currentLoanAmount * 0.25))})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInputChange('repaymentAmount', Math.ceil(currentLoanAmount * 0.5).toString())}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                        >
                          50% ({formatCurrency(Math.ceil(currentLoanAmount * 0.5))})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInputChange('repaymentAmount', Math.ceil(currentLoanAmount * 0.75).toString())}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                        >
                          75% ({formatCurrency(Math.ceil(currentLoanAmount * 0.75))})
                        </button>
                      </>
                    )}
                    {formData.repaymentType === 'ITEM_RETURN' && selectedItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleInputChange('repaymentAmount', calculations.totalItemValue.toString())}
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                      >
                        Item Value ({formatCurrency(calculations.totalItemValue)})
                      </button>
                    )}
                    {formData.repaymentType === 'FULL_PRINCIPAL' && (
                      <button
                        type="button"
                        onClick={() => handleInputChange('repaymentAmount', currentLoanAmount.toString())}
                        className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                      >
                        Full Amount ({formatCurrency(currentLoanAmount)})
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={formData.repaymentDate}
                      onChange={(e) => handleInputChange('repaymentDate', e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard size={18} />
                  Payment Method
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="NET_BANKING">Net Banking</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>

                {/* Conditional fields based on payment method */}
                {(formData.paymentMethod === 'CHEQUE' ||
                  formData.paymentMethod === 'NET_BANKING' ||
                  formData.paymentMethod === 'BANK_TRANSFER') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={formData.bankName}
                        onChange={(e) => handleInputChange('bankName', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Bank name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reference Number
                      </label>
                      <input
                        type="text"
                        value={formData.referenceNumber}
                        onChange={(e) => handleInputChange('referenceNumber', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Transaction reference"
                      />
                    </div>
                  </>
                )}

                {formData.paymentMethod === 'CHEQUE' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cheque Number
                      </label>
                      <input
                        type="text"
                        value={formData.chequeNumber}
                        onChange={(e) => handleInputChange('chequeNumber', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Cheque number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cheque Date
                      </label>
                      <input
                        type="date"
                        value={formData.chequeDate}
                        onChange={(e) => handleInputChange('chequeDate', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </>
                )}

                {formData.paymentMethod === 'UPI' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      UPI Transaction ID
                    </label>
                    <input
                      type="text"
                      value={formData.referenceNumber}
                      onChange={(e) => handleInputChange('referenceNumber', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="UPI transaction ID"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Photo Upload */}
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Camera size={18} />
                Upload Photos (Optional)
              </h3>
             
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="photo-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-purple-300 border-dashed rounded-lg cursor-pointer bg-purple-50 hover:bg-purple-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload size={24} className="text-purple-400 mb-2" />
                      <p className="mb-2 text-sm text-purple-600">
                        <span className="font-semibold">Click to upload</span> payment photos
                      </p>
                      <p className="text-xs text-purple-500">PNG, JPG or JPEG (MAX. 10MB each)</p>
                    </div>
                    <input
                      id="photo-upload"
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                </div>

                {/* Photo Preview */}
                {formData.photos.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Options */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
              >
                {showAdvanced ? <EyeOff size={16} /> : <Eye size={16} />}
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </button>

              {showAdvanced && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Advanced Settings</h3>
                 
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Processing Fee
                      </label>
                      <input
                        type="number"
                        value={formData.processingFee}
                        onChange={(e) => handleInputChange('processingFee', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Late Fee
                      </label>
                      <input
                        type="number"
                        value={formData.lateFee}
                        onChange={(e) => handleInputChange('lateFee', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adjustment Amount
                      </label>
                      <input
                        type="number"
                        value={formData.adjustmentAmount}
                        onChange={(e) => handleInputChange('adjustmentAmount', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adjustment Reason
                    </label>
                    <input
                      type="text"
                      value={formData.adjustmentReason}
                      onChange={(e) => handleInputChange('adjustmentReason', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Reason for adjustment (if any)"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Interest Paid with Payment
                      </label>
                      <input
                        type="number"
                        value={formData.interestPaidWithRepayment}
                        onChange={(e) => handleInputChange('interestPaidWithRepayment', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Interest Period Covered
                      </label>
                      <input
                        type="text"
                        value={formData.interestPeriodCovered}
                        onChange={(e) => handleInputChange('interestPeriodCovered', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Jan 2024 - Mar 2024"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any additional notes about this payment..."
              />
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-800">Success</p>
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            )}

            {/* Final Summary */}
            {formData.repaymentAmount && parseFloat(formData.repaymentAmount) > 0 && (
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText size={18} />
                  Transaction Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">Payment Type</span>
                    <span className="font-semibold text-blue-600">{formData.repaymentType.replace(/_/g, ' ')}</span>
                  </div>
                  {formData.repaymentType !== 'PARTIAL_PRINCIPAL' && selectedItems.length > 0 && (
                    <div className="bg-white p-3 rounded-lg">
                      <span className="text-gray-600 block">Items Returning</span>
                      <span className="font-semibold text-green-600">{selectedItems.length} items</span>
                    </div>
                  )}
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">Payment Amount</span>
                    <span className="font-semibold text-blue-600">{formatCurrency(parseFloat(formData.repaymentAmount) || 0)}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">Net Amount</span>
                    <span className="font-semibold text-green-600">{formatCurrency(calculations.netRepaymentAmount)}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">After Payment</span>
                    <span className={`font-semibold ${calculations.remainingLoanAmount === 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {calculations.remainingLoanAmount === 0 ? 'LOAN CLOSED' : formatCurrency(calculations.remainingLoanAmount)}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">Payment Method</span>
                    <span className="font-semibold text-gray-900">{formData.paymentMethod.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer - Action Buttons */}
        <div className="bg-gray-50 p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !formData.repaymentAmount || loading}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {formData.repaymentType === 'PARTIAL_PRINCIPAL' ? 'Record Payment' :
                   formData.repaymentType === 'ITEM_RETURN' ? 'Return Items' :
                   'Close Loan'}
                </>
              )}
            </button>
          </div>
         
          {/* Quick Stats Footer */}
          {formData.repaymentAmount && parseFloat(formData.repaymentAmount) > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-center text-sm text-gray-600">
                {formData.repaymentType === 'PARTIAL_PRINCIPAL' && (
                  <>
                    Processing partial payment of <span className="font-semibold text-blue-600">{formatCurrency(parseFloat(formData.repaymentAmount))}</span> •
                    Remaining: <span className="font-semibold text-red-600">{formatCurrency(calculations.remainingLoanAmount)}</span>
                  </>
                )}
                {formData.repaymentType === 'ITEM_RETURN' && (
                  <>
                    Returning <span className="font-semibold">{selectedItems.length} items</span> •
                    Payment: <span className="font-semibold text-green-600">{formatCurrency(parseFloat(formData.repaymentAmount))}</span> •
                    Remaining: <span className="font-semibold text-red-600">{formatCurrency(calculations.remainingLoanAmount)}</span>
                  </>
                )}
                {formData.repaymentType === 'FULL_PRINCIPAL' && (
                  <>
                    <span className="font-semibold text-purple-600">Full Payment</span> •
                    Amount: <span className="font-semibold text-green-600">{formatCurrency(parseFloat(formData.repaymentAmount))}</span> •
                    <span className="font-semibold text-green-600">LOAN WILL BE CLOSED</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemRepaymentModal;