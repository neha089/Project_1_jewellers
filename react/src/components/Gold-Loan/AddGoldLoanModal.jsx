import React, { useState, useEffect } from "react";
import { X, Coins, Calculator } from 'lucide-react';
import CustomerSearch from '../CustomerSearch';
import GoldLoanItems from '../GoldLoanItems';
import ApiService from '../../services/api';

const AddGoldLoanModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    totalLoanAmount: '',
    interestRate: '2.5',
    branch: 'Main Branch',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [items, setItems] = useState([{
    id: Date.now(),
    name: '',
    weight: '',
    purity: '22',
    images: []
  }]);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('Main Branch');
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // ADDED: Prevent double submission

  const branches = [
    'Main Branch', 'North Branch', 'South Branch',
    'East Branch', 'West Branch'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
   
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setSearchTerm('');
    if (errors.customer) {
      setErrors(prev => ({ ...prev, customer: '' }));
    }
  };

  const handleCreateCustomer = () => {
    console.log('Create new customer functionality to be implemented');
  };

  const handleItemsChange = (updatedItems) => {
    setItems(updatedItems);
    // Clear item-related errors when items change
    const newErrors = { ...errors };
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith('item_')) {
        delete newErrors[key];
      }
    });
    setErrors(newErrors);
  };

  const validateForm = () => {
    const newErrors = {};

    // Customer validation
    if (!selectedCustomer) {
      newErrors.customer = 'Please select a customer';
    }

    // Items validation
    if (items.length === 0) {
      newErrors.items = 'At least one gold item is required';
    } else {
      items.forEach((item, index) => {
        if (!item.name.trim()) {
          newErrors[`item_${index}_name`] = 'Item name is required';
        }
        if (!item.weight || parseFloat(item.weight) <= 0) {
          newErrors[`item_${index}_weight`] = 'Valid weight is required';
        }
        if (!item.purity || parseInt(item.purity) <= 0) {
          newErrors[`item_${index}_purity`] = 'Valid purity is required';
        }
        if (item.images.length === 0) {
          newErrors[`item_${index}_images`] = 'At least one photo is required';
        }
      });
    }

    // Form data validation
    if (!formData.totalLoanAmount || parseFloat(formData.totalLoanAmount) <= 0) {
      newErrors.totalLoanAmount = 'Valid loan amount is required';
    }
    if (!formData.interestRate || parseFloat(formData.interestRate) <= 0) {
      newErrors.interestRate = 'Valid interest rate is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submit button clicked");
    
    // FIXED: Prevent double submission
    if (isSubmitting) {
      console.log("Already submitting, ignoring duplicate click");
      return;
    }
   
    // if (!validateForm()) {
    //   console.log("Validation failed:", errors);
    //   return;
    // }

    setIsSubmitting(true); // FIXED: Set submitting state
    setLoading(true);
    
    try {
      // Prepare the payload to match backend expectations exactly
      const loanData = {
        customer: selectedCustomer._id, // Backend expects 'customer' field with customer ID
        totalLoanAmount: parseFloat(formData.totalLoanAmount),
        items: items.map(item => ({
          name: item.name,
          weightGram: parseFloat(item.weight), // Backend expects 'weightGram'
          purityK: parseInt(item.purity), // Backend expects 'purityK'
          images: item.images.map(img => img.dataUrl || img) // Handle both objects and strings
        })),
        interestRateMonthlyPct: parseFloat(formData.interestRate), // Backend expects 'interestRateMonthlyPct'
        startDate: formData.date, // Backend expects 'startDate'
        notes: formData.notes || '' // Optional notes
      };

      console.log("Sending loan data to onSave:", loanData);
     
      await onSave(loanData); // Call parent handler for API and refresh
      
      // Calculate totals for UI feedback
      const totalWeight = items.reduce((sum, item) => sum + parseFloat(item.weight), 0);
     
      handleReset();
      
      onClose();
      
    } catch (error) {
      console.error('Error creating gold loan:', error);
      setErrors({ submit: `Failed to create gold loan: ${error.message}` });
    } finally {
      setLoading(false);
      setIsSubmitting(false); // FIXED: Reset submitting state
    }
  };

  const handleReset = () => {
    setFormData({
      totalLoanAmount: '',
      interestRate: '2.5',
      branch: 'Main Branch',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
    setItems([{
      id: Date.now(),
      name: '',
      weight: '',
      purity: '22',
      images: []
    }]);
    setSelectedCustomer(null);
    setSearchTerm('');
    setErrors({});
  };

  // FIXED: Prevent modal close during submission
  const handleClose = () => {
    if (isSubmitting) {
      return; // Don't allow closing during submission
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center text-white">
              <Coins size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create New Gold Loan</h2>
            </div>
          </div>
          <button
            onClick={handleClose} // FIXED: Use handleClose instead of onClose
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
            disabled={isSubmitting} // FIXED: Disable during submission
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Customer Search */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Selection *</h3>
              <CustomerSearch
                onCustomerSelect={handleCustomerSelect}
                onCreateCustomer={handleCreateCustomer}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
              {errors.customer && <p className="text-red-500 text-sm mt-2">{errors.customer}</p>}
              {selectedCustomer && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                  <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                  {selectedCustomer.email && (
                    <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                  )}
                </div>
              )}
            </div>

            {/* Gold Items */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gold Items *</h3>
              <GoldLoanItems
                items={items}
                errors={errors}
                loading={isSubmitting} // FIXED: Use isSubmitting
                onItemsChange={handleItemsChange}
              />
              {errors.items && <p className="text-red-500 text-sm mt-2">{errors.items}</p>}
            </div>

            {/* Loan Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Details *</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Loan Amount *
                  </label>
                  <input
                    type="number"
                    name="totalLoanAmount"
                    value={formData.totalLoanAmount}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${
                      errors.totalLoanAmount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="50000"
                    disabled={isSubmitting} // FIXED: Use isSubmitting
                  />
                  {errors.totalLoanAmount && <p className="text-red-500 text-sm mt-1">{errors.totalLoanAmount}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interest Rate (% per month) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="interestRate"
                    value={formData.interestRate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${
                      errors.interestRate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="2.5"
                    disabled={isSubmitting} // FIXED: Use isSubmitting
                  />
                  {errors.interestRate && <p className="text-red-500 text-sm mt-1">{errors.interestRate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${
                      errors.date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    disabled={isSubmitting} // FIXED: Use isSubmitting
                  />
                  {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch
                  </label>
                  <select
                    name="branch"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    disabled={isSubmitting} // FIXED: Use isSubmitting
                  >
                    {branches.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                placeholder="Any additional notes about the gold loan..."
                disabled={isSubmitting} // FIXED: Use isSubmitting
              />
            </div>

            {/* Submission Error */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <strong>Error:</strong> {errors.submit}
              </div>
            )}

            {/* Summary */}
            {items.length > 0 && items.some(item => item.weight) && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Loan Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Items:</span>
                    <p className="font-medium">{items.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Weight:</span>
                    <p className="font-medium">
                      {items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0).toFixed(2)}g
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Amount:</span>
                    <p className="font-medium text-amber-600">
                      ₹{formData.totalLoanAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Interest Rate:</span>
                    <p className="font-medium">{formData.interestRate}% per month</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose} // FIXED: Use handleClose
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              disabled={isSubmitting} // FIXED: Disable during submission
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 hover:border-amber-400 transition-all duration-200 font-medium"
              disabled={isSubmitting} // FIXED: Disable during submission
            >
              Reset Form
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-amber-400 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg flex items-center gap-2"
              disabled={isSubmitting} // FIXED: Use isSubmitting instead of loading
            >
              <Coins size={16} />
              {isSubmitting ? 'Creating...' : 'Create Gold Loan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddGoldLoanModal;