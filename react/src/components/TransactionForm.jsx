// TransactionForm.js
import React, { useState } from 'react';
import { X, Save, Upload, Trash2 } from 'lucide-react';
import ApiService from '../services/api';

const TransactionForm = ({ 
  selectedCustomer, 
  selectedCategory, 
  transactionType,
  onBack, 
  onCancel, 
  onSuccess 
}) => {
  const [transactionData, setTransactionData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    // Gold specific fields
    goldWeight: '',
    goldType: '22K',
    goldPurity: '916',
    goldRate: '6500',
    // Loan specific fields
    interestRate: '2.5',
    durationMonths: '6',
    // Photos
    photos: []
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setTransactionData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (transactionData.photos.length < 3) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setTransactionData(prev => ({
            ...prev,
            photos: [...prev.photos, {
              id: Date.now() + Math.random(),
              name: file.name,
              dataUrl: e.target.result
            }]
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removePhoto = (photoId) => {
    setTransactionData(prev => ({
      ...prev,
      photos: prev.photos.filter(photo => photo.id !== photoId)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!transactionData.amount.trim() || parseFloat(transactionData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    
    const isGoldTransaction = selectedCategory?.id.includes('gold') || selectedCategory?.id.includes('silver');
    if (isGoldTransaction && !transactionData.goldWeight.trim()) {
      newErrors.goldWeight = 'Weight is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitTransaction = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      let response;
      const commonData = {
        customerId: selectedCustomer._id,
        amount: transactionData.amount,
        description: transactionData.description,
        date: new Date(transactionData.date).toISOString(),
        photos: transactionData.photos
      };

      switch (selectedCategory.id) {
        case 'gold-sell':
        case 'silver-sell':
          response = await ApiService.createMetalSale({
            ...commonData,
            metal: selectedCategory.id.includes('gold') ? 'GOLD' : 'SILVER',
            weight: transactionData.goldWeight,
            rate: transactionData.goldRate,
            purity: transactionData.goldPurity
          });
          break;

        case 'gold-loan':
          response = await ApiService.createGoldLoan({
            ...commonData,
            goldWeight: transactionData.goldWeight,
            goldType: transactionData.goldType,
            interestRate: transactionData.interestRate,
            durationMonths: transactionData.durationMonths
          });
          break;

        case 'business-loan-taken':
          response = await ApiService.createLoan({
            ...commonData,
            interestRate: transactionData.interestRate,
            durationMonths: transactionData.durationMonths
          }, 1); // direction 1 for taken
          break;

        case 'business-loan-given':
          response = await ApiService.createLoan({
            ...commonData,
            interestRate: transactionData.interestRate,
            durationMonths: transactionData.durationMonths
          }, -1); // direction -1 for given
          break;

        case 'udhari-given':
          response = await ApiService.giveUdhari({
            ...commonData,
            installments: 3 // Default installments
          });
          break;

        case 'gold-purchase':
        case 'silver-purchase':
          response = await ApiService.createGoldPurchase({
            ...commonData,
            partyName: selectedCustomer.name,
            goldWeight: transactionData.goldWeight,
            goldType: transactionData.goldType,
            metal: selectedCategory.id.includes('gold') ? 'GOLD' : 'SILVER'
          });
          break;

        // For other categories, create a simple transaction record
        default:
          // This would need a generic transaction API endpoint
          console.log('Transaction data:', commonData);
          response = { success: true }; // Placeholder
          break;
      }

      if (response?.success !== false) {
        onSuccess();
      } else {
        throw new Error(response?.message || 'Transaction failed');
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      setErrors({ submit: error.message || 'Failed to save transaction. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const isGoldTransaction = selectedCategory?.id.includes('gold') || selectedCategory?.id.includes('silver');
  const isLoanTransaction = selectedCategory?.id.includes('loan');
  const metalType = selectedCategory?.id.includes('silver') ? 'Silver' : 'Gold';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-${selectedCategory.color}-100 rounded-lg flex items-center justify-center`}>
            <selectedCategory.icon size={20} className={`text-${selectedCategory.color}-600`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{selectedCategory.label}</h3>
            <p className="text-sm text-gray-500">{selectedCustomer.name}</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      {errors.submit && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {errors.submit}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
          <input
            type="number"
            name="amount"
            value={transactionData.amount}
            onChange={handleDataChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.amount ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter amount"
            disabled={loading}
          />
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            name="date"
            value={transactionData.date}
            onChange={handleDataChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        {isGoldTransaction && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{metalType} Weight (grams) *</label>
              <input
                type="number"
                step="0.1"
                name="goldWeight"
                value={transactionData.goldWeight}
                onChange={handleDataChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.goldWeight ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter weight"
                disabled={loading}
              />
              {errors.goldWeight && <p className="text-red-500 text-xs mt-1">{errors.goldWeight}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{metalType} Type</label>
              <select
                name="goldType"
                value={transactionData.goldType}
                onChange={handleDataChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="24K">24K {metalType}</option>
                <option value="22K">22K {metalType}</option>
                <option value="18K">18K {metalType}</option>
                <option value="14K">14K {metalType}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{metalType} Rate (₹/gram)</label>
              <input
                type="number"
                name="goldRate"
                value={transactionData.goldRate}
                onChange={handleDataChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Current ${metalType.toLowerCase()} rate`}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purity</label>
              <input
                type="text"
                name="goldPurity"
                value={transactionData.goldPurity}
                onChange={handleDataChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="916"
                disabled={loading}
              />
            </div>
          </>
        )}

        {isLoanTransaction && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (% per month)</label>
              <input
                type="number"
                step="0.1"
                name="interestRate"
                value={transactionData.interestRate}
                onChange={handleDataChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2.5"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (months)</label>
              <select
                name="durationMonths"
                value={transactionData.durationMonths}
                onChange={handleDataChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="9">9 Months</option>
                <option value="12">12 Months</option>
              </select>
            </div>
          </>
        )}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={transactionData.description}
            onChange={handleDataChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter transaction details..."
            disabled={loading}
          />
        </div>

        {(isGoldTransaction || isLoanTransaction) && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Photos (Optional)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Upload Photos
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={loading}
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">Max 3 photos</p>
            </div>

            {transactionData.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                {transactionData.photos.map(photo => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.dataUrl}
                      alt={photo.name}
                      className="w-full h-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={loading}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between gap-3 mt-6">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          disabled={loading}
        >
          ← Back to Category
        </button>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={submitTransaction}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {loading ? 'Saving...' : 'Save Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;