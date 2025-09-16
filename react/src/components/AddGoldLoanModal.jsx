import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Trash2, 
  Coins,
  User,
  FileImage,
  Calculator,
  Plus
} from 'lucide-react';

// GoldLoanItems component integrated
const GoldLoanItems = ({ items, errors, loading, onItemsChange, currentGoldPrice }) => {
  const addItem = () => {
    const newItem = {
      id: Date.now(),
      name: "",
      weight: "",
      amount: "",
      purity: "22",
      images: [],
    };
    onItemsChange([...items, newItem]);
  };

  const removeItem = (itemId) => {
    onItemsChange(items.filter((item) => item.id !== itemId));
  };

  const updateItem = (itemId, field, value) => {
    const updatedItems = items.map((item) => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };

        // Auto-calculate amount based on weight, purity, and current gold price
        if ((field === "weight" || field === "purity") && currentGoldPrice) {
          const weight = parseFloat(field === "weight" ? value : item.weight) || 0;
          const purity = parseFloat(field === "purity" ? value : item.purity) || 22;

          if (weight > 0) {
            // Calculate market value: weight * purity ratio * current price
            const marketValue = weight * (purity / 24) * currentGoldPrice.pricePerGram;
            // Loan amount is typically 70-80% of market value
            const loanAmount = marketValue * 0.75;
            updatedItem.amount = loanAmount.toFixed(2);
          }
        }

        // Ensure images is always an array
        updatedItem.images = updatedItem.images || [];

        return updatedItem;
      }
      return item;
    });
    onItemsChange(updatedItems);
  };

  const handleItemImageUpload = (itemId, e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const updatedItems = items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                images: [
                  ...item.images,
                  {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    dataUrl: e.target.result,
                  },
                ],
              }
            : item
        );
        onItemsChange(updatedItems);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeItemImage = (itemId, imageId) => {
    const updatedItems = items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            images: item.images.filter((img) => img.id !== imageId),
          }
        : item
    );
    onItemsChange(updatedItems);
  };

  const calculateTotalAmount = () => {
    return items.reduce((total, item) => total + (parseFloat(item.amount) || 0), 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium text-gray-900">Gold Items</h4>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-2 px-3 py-1 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700"
          disabled={loading}
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {currentGoldPrice && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-yellow-800 text-sm">
            <span className="font-medium">Current Gold Price:</span>
            <span>₹{currentGoldPrice.pricePerGram.toFixed(2)}/gram (24K)</span>
            <span className="text-xs text-yellow-600">
              Last updated: {new Date(currentGoldPrice.lastUpdated).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {items.map((item, index) => (
        <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="font-medium text-gray-800">Item {index + 1}</h5>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:text-red-700"
                disabled={loading}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateItem(item.id, "name", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  errors[`item_${index}_name`] ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="e.g., Gold Chain, Ring, etc."
                disabled={loading}
              />
              {errors[`item_${index}_name`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_name`]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (grams) *
              </label>
              <input
                type="number"
                step="0.1"
                value={item.weight}
                onChange={(e) => updateItem(item.id, "weight", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  errors[`item_${index}_weight`] ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="0.0"
                disabled={loading}
              />
              {errors[`item_${index}_weight`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_weight`]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purity (K)
              </label>
              <select
                value={item.purity}
                onChange={(e) => updateItem(item.id, "purity", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                disabled={loading}
              >
                <option value="24">24K</option>
                <option value="22">22K</option>
                <option value="18">18K</option>
                <option value="14">14K</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loan Amount (₹) *
                {currentGoldPrice && (
                  <span className="text-xs text-amber-600 block">Auto-calculated</span>
                )}
              </label>
              <input
                type="number"
                value={item.amount}
                onChange={(e) => updateItem(item.id, "amount", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  errors[`item_${index}_amount`] ? "border-red-300" : "border-gray-300"
                } ${currentGoldPrice ? "bg-amber-50" : ""}`}
                placeholder="0"
                disabled={loading}
              />
              {errors[`item_${index}_amount`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_amount`]}</p>
              )}
              {currentGoldPrice && item.weight && item.purity && (
                <p className="text-xs text-amber-600 mt-1">
                  Market value: ₹{(parseFloat(item.weight || 0) * (parseFloat(item.purity || 22) / 24) * currentGoldPrice.pricePerGram).toFixed(2)}
                </p>
              )}
            </div>
          </div>

          {/* Item Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Photos
            </label>
            <div className="border border-dashed border-gray-300 rounded-lg p-3">
              <label className="cursor-pointer bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200 transition-colors">
                <Upload size={14} className="inline mr-1" />
                Add Photos
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleItemImageUpload(item.id, e)}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>

            {Array.isArray(item.images) && item.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {item.images.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.dataUrl}
                      alt={image.name}
                      className="w-full h-16 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeItemImage(item.id, image.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={loading}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {errors.items && (
        <p className="text-red-500 text-sm">{errors.items}</p>
      )}

      {/* Total Amount Display */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Total Loan Amount:</span>
          <span className="text-xl font-bold text-amber-600">
            ₹{calculateTotalAmount().toFixed(2)}
          </span>
        </div>
        {currentGoldPrice && (
          <div className="text-xs text-gray-500 mt-1">
            Based on current gold price: ₹{currentGoldPrice.pricePerGram.toFixed(2)}/gram (24K)
          </div>
        )}
      </div>
    </div>
  );
};

// Mock API Service - Replace with your actual API
const ApiService = {
  createGoldLoan: async (data) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, id: 'GL' + Date.now() });
      }, 1000);
    });
  },
  getCurrentGoldPrice: async () => {
    // Mock current gold price
    return {
      pricePerGram: 6200, // ₹6200 per gram for 24K gold
      lastUpdated: new Date().toISOString()
    };
  }
};

const AddGoldLoanModal = ({ isOpen, onClose, onSave, selectedCustomer }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerId: '',
    interestRate: '2.5',
    durationMonths: '6',
    pledgedBy: 'Customer',
    branch: 'Main Branch',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [goldItems, setGoldItems] = useState([
    {
      id: Date.now(),
      name: '',
      weight: '',
      amount: '',
      purity: '22',
      images: []
    }
  ]);

  const [currentGoldPrice, setCurrentGoldPrice] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const branches = [
    'Main Branch', 'North Branch', 'South Branch', 
    'East Branch', 'West Branch'
  ];

  // Fetch current gold price on component mount
  useEffect(() => {
    const fetchGoldPrice = async () => {
      try {
        const price = await ApiService.getCurrentGoldPrice();
        setCurrentGoldPrice(price);
      } catch (error) {
        console.error('Failed to fetch gold price:', error);
      }
    };

    if (isOpen) {
      fetchGoldPrice();
    }
  }, [isOpen]);

  // Pre-populate customer data if selectedCustomer is provided
  useEffect(() => {
    if (selectedCustomer) {
      setFormData(prev => ({
        ...prev,
        customerName: selectedCustomer.name || '',
        customerPhone: selectedCustomer.phone || '',
        customerId: selectedCustomer._id || ''
      }));
    }
  }, [selectedCustomer]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Customer validation
    if (!formData.customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (!formData.customerPhone.trim()) newErrors.customerPhone = 'Phone number is required';
    
    // Gold items validation
    goldItems.forEach((item, index) => {
      if (!item.name.trim()) newErrors[`item_${index}_name`] = 'Item name is required';
      if (!item.weight || parseFloat(item.weight) <= 0) newErrors[`item_${index}_weight`] = 'Valid weight is required';
      if (!item.amount || parseFloat(item.amount) <= 0) newErrors[`item_${index}_amount`] = 'Valid amount is required';
    });

    if (goldItems.length === 0) newErrors.items = 'At least one gold item is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const totalAmount = goldItems.reduce(
        (total, item) => total + (parseFloat(item.amount) || 0),
        0
      );

      const loanData = {
        customerId: selectedCustomer?._id || formData.customerId,
        items: goldItems.map((item) => ({
          name: item.name,
          weightGram: parseFloat(item.weight),
          amountPaise: Math.round(parseFloat(item.amount) * 100),
          purityK: parseInt(item.purity),
          images: item.images.map(img => img.dataUrl),
        })),
        totalAmount: totalAmount,
        interestRate: parseFloat(formData.interestRate),
        durationMonths: parseInt(formData.durationMonths),
        date: formData.date,
        branch: formData.branch,
        pledgedBy: formData.pledgedBy,
        notes: formData.notes,
        // Additional computed fields for compatibility
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        goldWeight: goldItems.reduce((total, item) => total + parseFloat(item.weight || 0), 0),
        loanAmount: totalAmount,
        status: 'active',
        outstandingAmount: totalAmount,
        totalPaid: 0,
        interestEarned: 0,
        startDate: formData.date,
        dueDate: new Date(new Date(formData.date).setMonth(new Date(formData.date).getMonth() + parseInt(formData.durationMonths))).toISOString().split('T')[0],
        createdDate: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        maturityDate: new Date(new Date(formData.date).setMonth(new Date(formData.date).getMonth() + parseInt(formData.durationMonths))).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        photos: goldItems.flatMap(item => item.images.map(img => img.dataUrl))
      };

      const response = await ApiService.createGoldLoan(loanData);
      
      if (response.success) {
        onSave(loanData);
        handleReset();
        alert('Gold loan created successfully!');
      }
    } catch (error) {
      console.error('Error creating gold loan:', error);
      alert('Failed to create gold loan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      customerId: '',
      interestRate: '2.5',
      durationMonths: '6',
      pledgedBy: 'Customer',
      branch: 'Main Branch',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
    setGoldItems([{
      id: Date.now(),
      name: '',
      weight: '',
      amount: '',
      purity: '22',
      images: []
    }]);
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
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
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            
            {/* Customer Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="text-amber-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${
                    errors.customerName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter customer full name"
                  disabled={loading}
                />
                {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${
                    errors.customerPhone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="+91 98765 43210"
                  disabled={loading}
                />
                {errors.customerPhone && <p className="text-red-500 text-xs mt-1">{errors.customerPhone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer ID (Optional)
                </label>
                <input
                  type="text"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  placeholder="Existing customer ID"
                  disabled={loading}
                />
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
            </div>

            {/* Loan Terms */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="text-amber-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Loan Terms</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder="2.5"
                    disabled={loading}
                  />
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Date
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  placeholder="Any additional notes about the loan..."
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Gold Items Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Coins className="text-amber-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Gold Items</h3>
            </div>
            
            <GoldLoanItems 
              items={goldItems}
              errors={errors}
              loading={loading}
              onItemsChange={setGoldItems}
              currentGoldPrice={currentGoldPrice}
            />
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
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all duration-200 font-medium shadow-lg flex items-center gap-2 disabled:opacity-50"
              disabled={loading}
            >
              <Coins size={16} />
              {loading ? 'Creating...' : 'Create Gold Loan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddGoldLoanModal;
