import React, { useState, useEffect } from 'react';
import { X, Coins, Calculator } from 'lucide-react';
import CustomerSearch from './CustomerSearch';
import GoldLoanItems from './GoldLoanItems';
import ApiService from '../services/api';

const AddGoldLoanModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    interestRate: '2.5',
    durationMonths: '6',
    branch: 'Main Branch',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [items, setItems] = useState([{
    id: Date.now(),
    name: '',
    weight: '',
    amount: '',
    purity: '22',
    images: []
  }]);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState({});
  const [currentGoldPrice, setCurrentGoldPrice] = useState(null);
  const [loading, setLoading] = useState(false);

  const branches = [
    'Main Branch', 'North Branch', 'South Branch', 
    'East Branch', 'West Branch'
  ];

  // Fetch current gold price
  useEffect(() => {
    const fetchGoldPrice = async () => {
      try {
        // Assuming there's an API endpoint for gold price
        const response = await ApiService.get('/api/gold-price');
        if (response.success) {
          setCurrentGoldPrice({
            pricePerGram: response.data.pricePerGram,
            lastUpdated: response.data.lastUpdated
          });
        }
      } catch (error) {
        console.error('Failed to fetch gold price:', error);
      }
    };
    fetchGoldPrice();
  }, []);

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
    // Implement new customer creation logic if needed
    console.log('Create new customer');
  };

  const handleItemsChange = (updatedItems) => {
    setItems(updatedItems);
    if (errors.items) {
      setErrors(prev => ({ ...prev, items: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedCustomer) newErrors.customer = 'Please select a customer';
    if (items.length === 0) newErrors.items = 'At least one gold item is required';
    
    items.forEach((item, index) => {
      if (!item.name.trim()) newErrors[`item_${index}_name`] = 'Item name is required';
      if (!item.weight || parseFloat(item.weight) <= 0) newErrors[`item_${index}_weight`] = 'Valid weight is required';
      if (!item.amount || parseFloat(item.amount) <= 0) newErrors[`item_${index}_amount`] = 'Valid loan amount is required';
      if (item.images.length === 0) newErrors[`item_${index}_images`] = 'At least one photo is required';
    });

    if (!formData.interestRate || parseFloat(formData.interestRate) <= 0) {
      newErrors.interestRate = 'Valid interest rate is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("click submit");
    
    // if (!validateForm()) return;

    // setLoading(true);
    try {
      const totalAmount = items.reduce(
        (total, item) => total + (parseFloat(item.amount) || 0),
        0
      );

      const loanData = {
        customerId: selectedCustomer._id,
        items: items.map(item => ({
          name: item.name,
          weightGram: parseFloat(item.weight),
          amountPaise: Math.round(parseFloat(item.amount) * 100),
          purityK: parseInt(item.purity),
          images: item.images.map(img => img.dataUrl)
        })),
        totalAmount,
        interestRate: parseFloat(formData.interestRate),
        durationMonths: parseInt(formData.durationMonths),
        date: formData.date,
        branch: formData.branch,
        notes: formData.notes
      };
      console.log("call api");
      const response = await ApiService.createGoldLoan(loanData);
      console.log("called");

      if (response.success) {
        onSave({
          ...loanData,
          startDate: formData.date,
          dueDate: new Date(new Date(formData.date).setMonth(
            new Date(formData.date).getMonth() + parseInt(formData.durationMonths)
          )).toISOString().split('T')[0],
          createdDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          maturityDate: new Date(new Date(formData.date).setMonth(
            new Date(formData.date).getMonth() + parseInt(formData.durationMonths)
          )).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          outstandingAmount: totalAmount,
          totalPaid: 0,
          interestEarned: 0,
          status: 'active'
        });
        handleReset();
      } else {
        setErrors({ submit: response.message || 'Failed to create gold loan' });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to create gold loan. Please try again.' });
      console.error('Error creating gold loan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      interestRate: '2.5',
      durationMonths: '6',
      branch: 'Main Branch',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
    setItems([{
      id: Date.now(),
      name: '',
      weight: '',
      amount: '',
      purity: '22',
      images: []
    }]);
    setSelectedCustomer(null);
    setSearchTerm('');
    setErrors({});
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
            <h2 className="text-xl font-bold text-gray-900">Create New Gold Loan</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
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
              {errors.customer && <p className="text-red-500 text-xs mt-2">{errors.customer}</p>}
              {selectedCustomer && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                  <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                  <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                </div>
              )}
            </div>

            {/* Gold Items */}
            <GoldLoanItems
              items={items}
              errors={errors}
              loading={loading}
              onItemsChange={handleItemsChange}
              currentGoldPrice={currentGoldPrice}
            />

            {/* Loan Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-200">
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
                  disabled={loading}
                />
                {errors.interestRate && <p className="text-red-500 text-xs mt-1">{errors.interestRate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (months)
                </label>
                <select
                  name="durationMonths"
                  value={formData.durationMonths}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  disabled={loading}
                >
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="9">9 Months</option>
                  <option value="12">12 Months</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch
                </label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  disabled={loading}
                >
                  {branches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div className="pt-6 border-t border-gray-200">
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
                disabled={loading}
              />
            </div>

            {/* Submission Error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {errors.submit}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 hover:border-amber-400 transition-all duration-200 font-medium"
              disabled={loading}
            >
              Reset Form
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all duration-200 font-medium shadow-lg flex items-center gap-2"
              disabled={loading}
            >
              <Coins size={16} />
              {loading ? 'Creating...' : 'Create Gold Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGoldLoanModal;
