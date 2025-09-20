import React, { useState, useEffect } from 'react';
import ApiService from '../../services/api';

import {
  X,
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
  Ruler,
  Image,
  Info,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';

const SilverItemRepaymentModal = ({
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
    paymentMethod: 'CASH',
    returnDate: new Date().toISOString().split('T')[0],
    photos: [],
    notes: '',
    processingFee: '0',
    lateFee: '0',
    adjustmentAmount: '0',
    adjustmentReason: '',
    showAdvanced: false
  });

  // Items state
  const [activeItems, setActiveItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  // Calculations
  const [calculations, setCalculations] = useState({
    totalReturnValue: 0,
    totalWeight: 0,
    totalOriginalValue: 0,
    totalAppreciation: 0,
    netRepaymentAmount: 0,
    remainingLoanAmount: 0
  });

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen && loan) {
      initializeForm();
    }
  }, [isOpen, loan]);

  // Recalculate when items change
  useEffect(() => {
    calculateTotals();
  }, [selectedItems, formData.processingFee, formData.lateFee, formData.adjustmentAmount]);

  const initializeForm = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Reset form
      setFormData({
        paymentMethod: 'CASH',
        returnDate: new Date().toISOString().split('T')[0],
        photos: [],
        notes: '',
        processingFee: '0',
        lateFee: '0',
        adjustmentAmount: '0',
        adjustmentReason: '',
        showAdvanced: false
      });

      // Load active items
      console.log('Loading active items for loan:', loan._id);
      const result = await ApiService.getActiveItemsForReturn(loan._id.toString());
      
      if (result.success) {
        console.log('Active items loaded:', result.data.activeItems);
        setActiveItems(result.data.activeItems || []);
        setSelectedItems([]);
        setCurrentItemIndex(0);
      } else {
        throw new Error(result.error || 'Failed to load active items');
      }
    } catch (error) {
      console.error('Error initializing form:', error);
      setError(error.error || error.message || 'Failed to load active items');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    if (!selectedItems.length || !loan) {
      setCalculations({
        totalReturnValue: 0,
        totalWeight: 0,
        totalOriginalValue: 0,
        totalAppreciation: 0,
        netRepaymentAmount: 0,
        remainingLoanAmount: loan?.currentLoanAmount || 0
      });
      return;
    }

    const totalReturnValue = selectedItems.reduce((sum, item) => sum + (parseFloat(item.returnPrice) || 0), 0);
    const totalWeight = selectedItems.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
    const totalOriginalValue = selectedItems.reduce((sum, item) => sum + (parseFloat(item.originalLoanAmount) || 0), 0);
    const totalAppreciation = selectedItems.reduce((sum, item) => {
      const appreciation = (parseFloat(item.returnValue) || 0) - (parseFloat(item.originalLoanAmount) || 0);
      return sum + appreciation;
    }, 0);
    
    const processingFee = parseFloat(formData.processingFee) || 0;
    const lateFee = parseFloat(formData.lateFee) || 0;
    const adjustmentAmount = parseFloat(formData.adjustmentAmount) || 0;
    const netRepaymentAmount = totalReturnValue - processingFee - lateFee + adjustmentAmount;
    
    const currentLoanAmount = parseFloat(loan.currentLoanAmount) || 0;
    const remainingLoanAmount = Math.max(0, currentLoanAmount - totalOriginalValue);

    setCalculations({
      totalReturnValue,
      totalWeight,
      totalOriginalValue,
      totalAppreciation,
      netRepaymentAmount,
      remainingLoanAmount
    });
  };

  const handleItemSelection = (itemId) => {
    // Check if item is already selected
    const existingItem = selectedItems.find(item => item.itemId === itemId);
    if (existingItem) {
      // Update current item index to the existing one
      const index = selectedItems.findIndex(item => item.itemId === itemId);
      setCurrentItemIndex(index);
      return;
    }

    // Find the original item
    const originalItem = activeItems.find(item => item._id?.toString() === itemId);
    if (originalItem) {
      // Calculate initial return value
      const purityFactor = parseFloat(originalItem.purityK) / 1000;
      const defaultSilverPrice = 85;
      const initialReturnValue = originalItem.weightGram * purityFactor * defaultSilverPrice;
      const initialAppreciation = initialReturnValue - originalItem.loanAmount;

      // Create new item with default return details
      const newItem = {
        itemId: itemId,
        name: originalItem.name || 'Silver Item',
        originalWeightGram: parseFloat(originalItem.weightGram) || 0,
        originalLoanAmount: parseFloat(originalItem.loanAmount) || 0,
        purityK: parseFloat(originalItem.purityK) || 925,
        images: originalItem.images || [],
        weight: parseFloat(originalItem.weightGram) || 0,
        returnPrice: parseFloat(originalItem.loanAmount) || 0,
        currentSilverPrice: defaultSilverPrice.toString(),
        returnValue: initialReturnValue,
        returnPhotos: [],
        returnNotes: '',
        condition: 'good',
        appreciation: initialAppreciation,
        weightDifference: 0,
        weightDifferencePct: 0
      };
      
      const updatedItems = [...selectedItems, newItem];
      setSelectedItems(updatedItems);
      setCurrentItemIndex(updatedItems.length - 1);
    }
  };

  const updateCurrentItemDetail = (field, value) => {
    if (currentItemIndex >= 0 && currentItemIndex < selectedItems.length) {
      const updatedItems = [...selectedItems];
      const currentItem = { ...updatedItems[currentItemIndex] };
      
      // Update the field
      if (field === 'weight') {
        currentItem[field] = parseFloat(value) || 0;
        currentItem.weightDifference = currentItem.weight - currentItem.originalWeightGram;
        currentItem.weightDifferencePct = currentItem.originalWeightGram > 0 
          ? ((currentItem.weight - currentItem.originalWeightGram) / currentItem.originalWeightGram) * 100 
          : 0;
      } else if (field === 'currentSilverPrice') {
        currentItem[field] = value;
      } else {
        currentItem[field] = value;
      }
      
      // Calculate return value if silver price or weight changed
      if (field === 'currentSilverPrice' || field === 'weight') {
        const purityFactor = parseFloat(currentItem.purityK) / 1000;
        const silverPrice = parseFloat(currentItem.currentSilverPrice) || 0;
        const weight = parseFloat(currentItem.weight) || 0;
        currentItem.returnValue = weight * purityFactor * silverPrice;
        currentItem.appreciation = currentItem.returnValue - currentItem.originalLoanAmount;
        
        // Auto-update return price if not manually set
        if (!currentItem.returnPrice || currentItem.returnPrice === currentItem.originalLoanAmount) {
          currentItem.returnPrice = currentItem.returnValue;
        }
      }
      
      updatedItems[currentItemIndex] = currentItem;
      setSelectedItems(updatedItems);
    }
  };

  const removeCurrentItem = () => {
    if (currentItemIndex >= 0 && currentItemIndex < selectedItems.length) {
      const updatedItems = selectedItems.filter((_, index) => index !== currentItemIndex);
      setSelectedItems(updatedItems);
      
      // Adjust current item index
      const newIndex = Math.max(0, Math.min(currentItemIndex, updatedItems.length - 1));
      setCurrentItemIndex(newIndex);
    }
  };

  const handlePhotoUpload = (event, itemIndex = null) => {
    const files = Array.from(event.target.files);
    const photoUrls = files.map(file => URL.createObjectURL(file));
    
    if (itemIndex !== null && itemIndex >= 0 && itemIndex < selectedItems.length) {
      // Upload to specific item
      const updatedItems = [...selectedItems];
      updatedItems[itemIndex].returnPhotos = [...(updatedItems[itemIndex].returnPhotos || []), ...photoUrls];
      setSelectedItems(updatedItems);
    } else {
      // Upload to general payment photos
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...photoUrls]
      }));
    }
  };

  const removePhoto = (index, itemIndex = null, photoIndex) => {
    if (itemIndex !== null && itemIndex >= 0 && itemIndex < selectedItems.length) {
      // Remove from specific item
      const updatedItems = [...selectedItems];
      const itemPhotos = [...(updatedItems[itemIndex].returnPhotos || [])];
      itemPhotos.splice(photoIndex, 1);
      updatedItems[itemIndex].returnPhotos = itemPhotos;
      setSelectedItems(updatedItems);
    } else {
      // Remove from general photos
      setFormData(prev => ({
        ...prev,
        photos: prev.photos.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async () => {
    console.log('Submit button clicked');
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (selectedItems.length === 0) {
        throw new Error('Please select at least one item to return');
      }

      // Validate all selected items
      for (const item of selectedItems) {
        if (!item.weight || item.weight <= 0) {
          throw new Error(`Please enter weight for item: ${item.name}`);
        }
        if (!item.returnPrice || item.returnPrice <= 0) {
          throw new Error(`Please enter return price for item: ${item.name}`);
        }
        if (!item.currentSilverPrice || parseFloat(item.currentSilverPrice) <= 0) {
          throw new Error(`Please enter current silver price for item: ${item.name}`);
        }
      }

      // Prepare data for submission
      const submitData = {
        selectedItems: selectedItems.map(item => ({
          itemId: item.itemId,
          weight: parseFloat(item.weight),
          returnPrice: parseFloat(item.returnPrice),
          currentSilverPrice: parseFloat(item.currentSilverPrice),
          returnPhotos: item.returnPhotos || [],
          returnNotes: item.returnNotes || '',
          condition: item.condition || 'good'
        })),
        paymentMethod: formData.paymentMethod,
        repaymentDate: formData.returnDate,
        photos: formData.photos,
        notes: formData.notes,
        processingFee: parseFloat(formData.processingFee) || 0,
        lateFee: parseFloat(formData.lateFee) || 0,
        adjustmentAmount: parseFloat(formData.adjustmentAmount) || 0,
        adjustmentReason: formData.adjustmentReason
      };

      console.log('Submitting data:', submitData);

      const result = await ApiService.processItemReturn(loan._id.toString(), submitData);

      console.log('API Response:', result);

      if (result.success) {
        const message = calculations.remainingLoanAmount === 0
          ? `All ${selectedItems.length} items returned successfully! Loan closed.`
          : `${selectedItems.length} items returned successfully! ₹${calculations.remainingLoanAmount.toLocaleString()} remaining.`;
        
        setSuccess(message);
        onRepaymentSuccess?.(result);
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        throw new Error(result.error || 'Failed to process item return');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || err.error || 'Failed to process item return');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => `₹${(parseFloat(amount) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const formatWeight = (weight) => `${(parseFloat(weight) || 0).toFixed(2)}g`;

  if (!isOpen || !loan) return null;

  const currentLoanAmount = parseFloat(loan.currentLoanAmount) || 0;
  const hasActiveItems = activeItems.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-2xl w-full max-w-7xl h-full sm:max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 sm:p-6 border-b border-blue-100 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg ring-2 sm:ring-4 ring-blue-100 flex-shrink-0">
                <CheckCircle size={24} className="sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Silver Item Return & Repayment</h2>
                <p className="text-sm sm:text-base text-blue-700 font-medium truncate">
                  Loan ID: {loan._id} • {loan.customer?.name}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Outstanding: {formatCurrency(currentLoanAmount)} • Available Items: {activeItems.length}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center transition-all flex-shrink-0"
              disabled={submitting || loading}
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form id="return-form" className="space-y-6">
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600 mt-2">Loading items...</p>
              </div>
            )}

            {/* Active Items Selection */}
            {!loading && hasActiveItems && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Coins size={18} />
                  Select Silver Items to Return ({activeItems.length} available)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-48 overflow-y-auto">
                  {activeItems.map((item) => {
                    const isSelected = selectedItems.some(s => s.itemId === item._id?.toString());
                    return (
                      <div
                        key={item._id?.toString() || Math.random()}
                        className={`border rounded-lg p-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-300 bg-blue-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                        }`}
                        onClick={() => handleItemSelection(item._id?.toString())}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && <CheckCircle size={12} className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{item.name}</div>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <Weight size={10} /> {formatWeight(item.weightGram)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Percent size={10} /> {item.purityK}
                              </span>
                              <span className="flex items-center gap-1 text-blue-600">
                                {formatCurrency(item.loanAmount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {selectedItems.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <CheckCircle size={14} className="inline ml-1" /> 
                      {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected for return
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Show message if no active items */}
            {!loading && !hasActiveItems && (
              <div className="text-center py-12">
                <Info size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Items Available</h3>
                <p className="text-gray-600">All items have been returned or the loan is closed.</p>
              </div>
            )}

            {/* Item Details Collection */}
            {selectedItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Ruler size={18} />
                    Silver Item Return Details
                  </h3>
                  <div className="text-sm text-gray-600">
                    Item {currentItemIndex + 1} of {selectedItems.length}
                  </div>
                </div>

                {/* Item Navigation */}
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => setCurrentItemIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentItemIndex === 0}
                    className="px-4 py-2 text-sm bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentItemIndex(prev => Math.min(selectedItems.length - 1, prev + 1))}
                    disabled={currentItemIndex === selectedItems.length - 1}
                    className="px-4 py-2 text-sm bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                  >
                    Next →
                  </button>
                </div>

                {/* Current Item Details */}
                {currentItemIndex < selectedItems.length && (
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Info size={16} />
                        {selectedItems[currentItemIndex].name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Original: {formatWeight(selectedItems[currentItemIndex].originalWeightGram)} • 
                        {formatCurrency(selectedItems[currentItemIndex].originalLoanAmount)}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Weight Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Weight size={16} />
                          Returned Weight *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={selectedItems[currentItemIndex].weight?.toString() || ''}
                          onChange={(e) => updateCurrentItemDetail('weight', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          required
                        />
                        {selectedItems[currentItemIndex].weight && (
                          <p className={`text-xs mt-1 ${
                            selectedItems[currentItemIndex].weightDifference < 0
                              ? 'text-red-600' 
                              : selectedItems[currentItemIndex].weightDifference > 0
                              ? 'text-blue-600'
                              : 'text-gray-500'
                          }`}>
                            {selectedItems[currentItemIndex].weightDifference 
                              ? `${selectedItems[currentItemIndex].weightDifference >= 0 ? '+' : ''}${selectedItems[currentItemIndex].weightDifference.toFixed(2)}g (${selectedItems[currentItemIndex].weightDifferencePct?.toFixed(1)}%)`
                              : 'Same as original'
                            }
                          </p>
                        )}
                      </div>

                      {/* Current Silver Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <TrendingUp size={16} />
                          Silver Price Today *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={selectedItems[currentItemIndex].currentSilverPrice || ''}
                          onChange={(e) => updateCurrentItemDetail('currentSilverPrice', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="85"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">₹/gram</p>
                      </div>

                      {/* Return Value Calculation */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Calculator size={16} />
                          Current Market Value
                        </label>
                        <input
                          type="number"
                          value={selectedItems[currentItemIndex].returnValue?.toFixed(0) || '0'}
                          readOnly
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-blue-600 font-medium"
                        />
                      </div>

                      {/* Return Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <DollarSign size={16} />
                          Return Price *
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={selectedItems[currentItemIndex].returnPrice?.toString() || ''}
                          onChange={(e) => updateCurrentItemDetail('returnPrice', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                          required
                        />
                        {selectedItems[currentItemIndex].appreciation !== undefined && (
                          <p className={`text-xs mt-1 ${
                            selectedItems[currentItemIndex].appreciation >= 0
                              ? 'text-blue-600'
                              : 'text-red-600'
                          }`}>
                            Appreciation: {formatCurrency(selectedItems[currentItemIndex].appreciation)} 
                            ({((selectedItems[currentItemIndex].appreciation / selectedItems[currentItemIndex].originalLoanAmount) * 100 || 0).toFixed(1)}%)
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Condition and Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                        <select
                          value={selectedItems[currentItemIndex].condition || 'good'}
                          onChange={(e) => updateCurrentItemDetail('condition', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="excellent">Excellent</option>
                          <option value="good">Good</option>
                          <option value="fair">Fair</option>
                          <option value="poor">Poor</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Return Notes</label>
                        <textarea
                          value={selectedItems[currentItemIndex].returnNotes || ''}
                          onChange={(e) => updateCurrentItemDetail('returnNotes', e.target.value)}
                          rows={2}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Any notes about item condition..."
                        />
                      </div>
                    </div>

                    {/* Return Photos */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Image size={16} />
                        Return Photos (Recommended)
                      </label>
                      <div className="flex items-center justify-center w-full">
                        <label htmlFor={`item-photo-${currentItemIndex}`} className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100">
                          <div className="flex flex-col items-center justify-center pt-3 pb-4">
                            <Camera size={20} className="text-blue-400 mb-2" />
                            <p className="mb-1 text-xs text-blue-600">
                              <span className="font-semibold">Click to add photos</span>
                            </p>
                            <p className="text-xs text-blue-500">Current item condition</p>
                          </div>
                          <input
                            id={`item-photo-${currentItemIndex}`}
                            type="file"
                            className="hidden"
                            multiple
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(e, currentItemIndex)}
                          />
                        </label>
                      </div>

                      {/* Item Photo Preview */}
                      {selectedItems[currentItemIndex]?.returnPhotos?.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {selectedItems[currentItemIndex].returnPhotos.map((photo, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={photo}
                                alt={`Return photo ${index + 1}`}
                                className="w-full h-16 object-cover rounded border"
                              />
                              <button
                                type="button"
                                onClick={() => removePhoto(null, currentItemIndex, index)}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Remove Item Button */}
                    <div className="flex justify-center mt-4">
                      <button
                        type="button"
                        onClick={removeCurrentItem}
                        className="px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Remove This Item from Return
                      </button>
                    </div>
                  </div>
                )}

                {/* Selected Items Summary */}
                {selectedItems.length > 1 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Selected Items Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {selectedItems.map((item, index) => (
                        <div
                          key={item.itemId}
                          className={`p-2 rounded text-center cursor-pointer hover:bg-gray-100 ${
                            index === currentItemIndex ? 'bg-blue-100 border border-blue-300' : ''
                          }`}
                          onClick={() => setCurrentItemIndex(index)}
                        >
                          <div className="font-medium truncate">{item.name}</div>
                          <div className="text-xs text-gray-600">{formatWeight(item.weight)}</div>
                          <div className={`text-xs ${
                            item.appreciation >= 0 ? 'text-blue-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(item.appreciation)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Details */}
            {selectedItems.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Method */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard size={18} />
                    Payment Details
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="CASH">Cash</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="UPI">UPI</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CARD">Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar size={16} />
                      Return Date *
                    </label>
                    <input
                      type="date"
                      value={formData.returnDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Payment Photos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Camera size={16} />
                      Payment Photos (Recommended)
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label htmlFor="payment-photos" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-3 pb-4">
                          <Upload size={20} className="text-gray-400 mb-2" />
                          <p className="mb-1 text-xs text-gray-600">
                            <span className="font-semibold">Click to add</span> payment proof
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG or JPEG (Max 10MB)</p>
                        </div>
                        <input
                          id="payment-photos"
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*"
                          onChange={handlePhotoUpload}
                        />
                      </label>
                    </div>

                    {formData.photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {formData.photos.map((photo, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={photo}
                              alt={`Payment photo ${index + 1}`}
                              className="w-full h-16 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Calculations Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calculator size={18} />
                    Return Summary
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white p-3 rounded-lg border">
                      <div className="text-xs text-gray-600">Items Returning</div>
                      <div className="font-semibold text-blue-600">{selectedItems.length}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <div className="text-xs text-gray-600">Total Weight</div>
                      <div className="font-semibold">{formatWeight(calculations.totalWeight)}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <div className="text-xs text-gray-600">Original Value</div>
                      <div className="font-semibold text-gray-900">{formatCurrency(calculations.totalOriginalValue)}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <div className="text-xs text-gray-600">Market Value</div>
                      <div className={`font-semibold ${
                        calculations.totalAppreciation >= 0 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(calculations.totalReturnValue)}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <div className="text-xs text-gray-600">Appreciation</div>
                      <div className={`font-semibold ${
                        calculations.totalAppreciation >= 0 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(calculations.totalAppreciation)}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <div className="text-xs text-gray-600">Total Payment</div>
                      <div className="font-semibold text-blue-600">{formatCurrency(calculations.totalReturnValue)}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border md:col-span-2">
                      <div className="text-xs text-gray-600">Remaining Loan</div>
                      <div className={`font-semibold ${
                        calculations.remainingLoanAmount === 0 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {calculations.remainingLoanAmount === 0 ? 'LOAN CLOSED' : formatCurrency(calculations.remainingLoanAmount)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Options */}
            {selectedItems.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, showAdvanced: !prev.showAdvanced }))}
                  className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
                >
                  {formData.showAdvanced ? <EyeOff size={16} /> : <Eye size={16} />}
                  {formData.showAdvanced ? 'Hide' : 'Show'} Advanced Options
                </button>

                {formData.showAdvanced && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Additional Charges</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Processing Fee</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.processingFee}
                          onChange={(e) => setFormData(prev => ({ ...prev, processingFee: e.target.value }))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Late Fee</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.lateFee}
                          onChange={(e) => setFormData(prev => ({ ...prev, lateFee: e.target.value }))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.adjustmentAmount}
                          onChange={(e) => setFormData(prev => ({ ...prev, adjustmentAmount: e.target.value }))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Reason</label>
                      <input
                        type="text"
                        value={formData.adjustmentReason}
                        onChange={(e) => setFormData(prev => ({ ...prev, adjustmentReason: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Reason for adjustment (if any)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Additional notes about this return..."
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle size={20} className="text-blue-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-800">Success</p>
                  <p className="text-sm text-blue-700">{success}</p>
                </div>
              </div>
            )}

            {/* Final Summary */}
            {selectedItems.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText size={18} />
                  Final Transaction Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">Items Returning</span>
                    <span className="font-semibold text-blue-600">{selectedItems.length}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">Total Payment</span>
                    <span className="font-semibold text-blue-600">{formatCurrency(calculations.totalReturnValue)}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">Net Amount</span>
                    <span className="font-semibold text-purple-600">{formatCurrency(calculations.netRepaymentAmount)}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">After Return</span>
                    <span className={`font-semibold ${
                      calculations.remainingLoanAmount === 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {calculations.remainingLoanAmount === 0 ? 'LOAN CLOSED' : formatCurrency(calculations.remainingLoanAmount)}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">Payment Method</span>
                    <span className="font-semibold text-gray-900">{formData.paymentMethod.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg md:col-span-2 lg:col-span-1">
                    <span className="text-gray-600 block">Status</span>
                    <span className={`font-semibold ${
                      calculations.remainingLoanAmount === 0 ? 'text-blue-600' : 'text-blue-600'
                    }`}>
                      {calculations.remainingLoanAmount === 0 ? 'FULL CLOSURE' : 'PARTIAL RETURN'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedItems.length > 0 
                ? `Returning ${selectedItems.length} items • Total: ${formatCurrency(calculations.netRepaymentAmount)}`
                : 'Select items to begin return process'
              }
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting || loading}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || selectedItems.length === 0 || loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : calculations.remainingLoanAmount === 0 ? (
                  <>
                    <CheckCircle size={18} />
                    Complete Return & Close Loan
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Process Return ({selectedItems.length} items)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SilverItemRepaymentModal;
