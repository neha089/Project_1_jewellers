
const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }
    
    onSave(formData);
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pinCode: '',
      idProofType: 'aadhar',
      idProofNumber: '',
      notes: ''
    });
    setErrors({});
  };

  if (!isOpen) return null;

  const inputClasses = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200";
  const errorInputClasses = "w-full px-4 py-3 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
          <h3 className="text-xl font-bold text-gray-900">Add New Customer</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="md:col-span-2">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                Personal Information
              </h4>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={errors.firstName ? errorInputClasses : inputClasses}
                placeholder="Enter first name"
              />
              {errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={errors.lastName ? errorInputClasses : inputClasses}
                placeholder="Enter last name"
              />
              {errors.lastName && <p className="text-sm text-red-600">{errors.lastName}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={errors.phone ? errorInputClasses : inputClasses}
                placeholder="+91 98765 43210"
              />
              {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? errorInputClasses : inputClasses}
                placeholder="customer@email.com"
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
            </div>
            
            {/* Address Information */}
            <div className="md:col-span-2 mt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-green-600" />
                Address Information
              </h4>
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-semibold text-gray-700">Street Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter street address"
                className={inputClasses}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Enter city"
                className={inputClasses}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">State</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={inputClasses}
              >
                <option value="">Select State</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Delhi">Delhi</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">PIN Code</label>
              <input
                type="text"
                name="pinCode"
                value={formData.pinCode}
                onChange={handleChange}
                placeholder="Enter PIN code"
                className={inputClasses}
              />
            </div>
            
            {/* ID Proof Information */}
            <div className="md:col-span-2 mt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-purple-600" />
                ID Proof Information
              </h4>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">ID Proof Type</label>
              <select
                name="idProofType"
                value={formData.idProofType}
                onChange={handleChange}
                className={inputClasses}
              >
                <option value="aadhar">Aadhar Card</option>
                <option value="pan">PAN Card</option>
                <option value="voter">Voter ID</option>
                <option value="passport">Passport</option>
                <option value="driving">Driving License</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">ID Proof Number</label>
              <input
                type="text"
                name="idProofNumber"
                value={formData.idProofNumber}
                onChange={handleChange}
                placeholder="Enter ID proof number"
                className={inputClasses}
              />
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-semibold text-gray-700">Additional Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                placeholder="Any additional notes about the customer..."
                className={`${inputClasses} resize-none`}
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg"
            >
              <Save size={16} />
              Save Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCustomerModal;
