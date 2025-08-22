// components/AddGoldLoanModal.jsx
import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Trash2, 
  Coins,
  User,
  FileImage,
  Calculator
} from 'lucide-react';

const AddGoldLoanModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerId: '',
    goldItem: '',
    goldType: '22K',
    goldWeight: '',
    purity: '916',
    loanAmount: '',
    interestRate: '2.5',
    durationMonths: '6',
    pledgedBy: 'Customer',
    branch: 'Main Branch',
    notes: ''
  });

  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});

  const goldTypes = [
    { value: '24K', label: '24K Gold (999 Purity)', purity: '999' },
    { value: '22K', label: '22K Gold (916 Purity)', purity: '916' },
    { value: '18K', label: '18K Gold (750 Purity)', purity: '750' },
    { value: '14K', label: '14K Gold (585 Purity)', purity: '585' }
  ];

  const goldItems = [
    'Gold Chain', 'Gold Necklace', 'Gold Earrings', 'Gold Bangles',
    'Gold Bracelet', 'Gold Ring', 'Gold Coins', 'Gold Bar',
    'Gold Pendant', 'Gold Anklets', 'Other'
  ];

  const branches = [
    'Main Branch', 'North Branch', 'South Branch', 
    'East Branch', 'West Branch'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-update purity when gold type changes
      if (name === 'goldType') {
        const selectedType = goldTypes.find(type => type.value === value);
        if (selectedType) {
          updated.purity = selectedType.purity;
        }
      }
      
      return updated;
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    files.forEach(file => {
      if (file.size > maxSize) {
        alert('File size should be less than 5MB');
        return;
      }
      
      if (photos.length < 5) { // Max 5 photos
        const reader = new FileReader();
        reader.onload = (e) => {
          setPhotos(prev => [...prev, {
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            dataUrl: e.target.result
          }]);
        };
        reader.readAsDataURL(file);
      } else {
        alert('Maximum 5 photos allowed');
      }
    });
  };

  const removePhoto = (photoId) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (!formData.customerPhone.trim()) newErrors.customerPhone = 'Phone number is required';
    if (!formData.goldItem.trim()) newErrors.goldItem = 'Gold item description is required';
    if (!formData.goldWeight || parseFloat(formData.goldWeight) <= 0) newErrors.goldWeight = 'Valid gold weight is required';
    if (!formData.loanAmount || parseFloat(formData.loanAmount) <= 0) newErrors.loanAmount = 'Valid loan amount is required';
    if (photos.length === 0) newErrors.photos = 'At least one photo is required for proof';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateLoanAmount = () => {
    const weight = parseFloat(formData.goldWeight) || 0;
    const goldRate = {
      '24K': 6200,
      '22K': 5700,
      '18K': 4600,
      '14K': 3600
    };
    
    const rate = goldRate[formData.goldType] || 5700;
    const estimatedValue = weight * rate;
    const loanAmount = Math.floor(estimatedValue * 0.75); // 75% of gold value
    
    setFormData(prev => ({ ...prev, loanAmount: loanAmount.toString() }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setMonth(dueDate.getMonth() + parseInt(formData.durationMonths));
    
    const loanData = {
      ...formData,
      loanAmount: parseFloat(formData.loanAmount),
      goldWeight: parseFloat(formData.goldWeight),
      interestRate: parseFloat(formData.interestRate),
      startDate: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      createdDate: today.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      maturityDate: dueDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      outstandingAmount: parseFloat(formData.loanAmount),
      totalPaid: 0,
      interestEarned: 0,
      status: 'active',
      photos: photos.map(photo => photo.dataUrl)
    };
    
    onSave(loanData);
    handleReset();
  };

  const handleReset = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      customerId: '',
      goldItem: '',
      goldType: '22K',
      goldWeight: '',
      purity: '916',
      loanAmount: '',
      interestRate: '2.5',
      durationMonths: '6',
      pledgedBy: 'Customer',
      branch: 'Main Branch',
      notes: ''
    });
    setPhotos([]);
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
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
                >
                  {branches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Gold Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Coins className="text-amber-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Gold Information</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gold Item *
                </label>
                <select
                  name="goldItem"
                  value={formData.goldItem}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${
                    errors.goldItem ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select gold item</option>
                  {goldItems.map(item => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                {errors.goldItem && <p className="text-red-500 text-xs mt-1">{errors.goldItem}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gold Type *
                  </label>
                  <select
                    name="goldType"
                    value={formData.goldType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  >
                    {goldTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purity
                  </label>
                  <input
                    type="text"
                    name="purity"
                    value={formData.purity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder="916"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gold Weight (grams) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    name="goldWeight"
                    value={formData.goldWeight}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${
                      errors.goldWeight ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="15.5"
                  />
                  <button
                    type="button"
                    onClick={calculateLoanAmount}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-amber-600 hover:bg-amber-50 rounded transition-all duration-200"
                    title="Calculate loan amount"
                  >
                    <Calculator size={16} />
                  </button>
                </div>
                {errors.goldWeight && <p className="text-red-500 text-xs mt-1">{errors.goldWeight}</p>}
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
                  Loan Amount (₹) *
                </label>
                <input
                  type="number"
                  name="loanAmount"
                  value={formData.loanAmount}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${
                    errors.loanAmount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="250000"
                />
                {errors.loanAmount && <p className="text-red-500 text-xs mt-1">{errors.loanAmount}</p>}
              </div>
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <FileImage className="text-amber-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Proof Photos *</h3>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-amber-400 transition-all duration-200">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  <label className="cursor-pointer bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-all duration-200 flex items-center gap-2">
                    <Upload size={16} />
                    Upload Photos
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-sm text-gray-500">or drag and drop</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">PNG, JPG up to 5MB each (Max 5 photos)</p>
              </div>
            </div>

            {errors.photos && <p className="text-red-500 text-xs mt-2">{errors.photos}</p>}

            {/* Photo Preview */}
            {photos.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Photos ({photos.length}/5)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.dataUrl}
                        alt={photo.name}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600"
                      >
                        <Trash2 size={12} />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                        {photo.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="mt-6 pt-6 border-t border-gray-200">
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
                placeholder="Any additional notes about the gold item or loan..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 hover:border-amber-400 transition-all duration-200 font-medium"
            >
              Reset Form
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all duration-200 font-medium shadow-lg flex items-center gap-2"
            >
              <Coins size={16} />
              Create Gold Loan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGoldLoanModal;