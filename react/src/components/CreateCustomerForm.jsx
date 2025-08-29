// CreateCustomerForm.js
import React, { useState, useEffect } from 'react';
import { X, Save, ArrowLeft } from 'lucide-react';
import ApiService from '../services/api';

const CreateCustomerForm = ({ onCancel, onBack, onCustomerCreated, initialData = {} }) => {
  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: 'Gujarat',
    pinCode: '',
    idProofType: 'aadhar',
    idProofNumber: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize form with initial data
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setCustomerData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear submit error when user makes changes
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required field validation
    if (!customerData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!customerData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!customerData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    // Format validation
    if (customerData.phone && !/^\+?[\d\s-()]+$/.test(customerData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    
    if (customerData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (customerData.pinCode && !/^\d{6}$/.test(customerData.pinCode)) {
      newErrors.pinCode = 'PIN code must be exactly 6 digits';
    }
    
    // Phone number length validation (Indian phone numbers)
    if (customerData.phone) {
      const cleanPhone = customerData.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 12) {
        newErrors.phone = 'Phone number must be 10-12 digits';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveCustomer = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      const customerPayload = {
        name: `${customerData.firstName.trim()} ${customerData.lastName.trim()}`,
        phone: customerData.phone.trim(),
        email: customerData.email.trim() || undefined,
        address: {
          street: customerData.address.trim() || undefined,
          city: customerData.city.trim() || undefined,
          state: customerData.state,
          pinCode: customerData.pinCode.trim() || undefined
        },
        idProof: {
          type: customerData.idProofType,
          number: customerData.idProofNumber.trim() || undefined
        }
      };

      // Remove undefined fields to avoid sending empty data
      if (!customerPayload.email) delete customerPayload.email;
      if (!customerPayload.address.street && !customerPayload.address.city && !customerPayload.address.pinCode) {
        customerPayload.address = { state: customerData.state };
      }
      if (!customerPayload.idProof.number) delete customerPayload.idProof;

      const response = await ApiService.createCustomer(customerPayload);
      
      if (response.success && response.data) {
        const newCustomer = {
          _id: response.data._id,
          name: response.data.name,
          phone: response.data.phone,
          email: response.data.email,
          address: response.data.address
        };
        
        onCustomerCreated(newCustomer);
      } else {
        throw new Error(response.message || 'Failed to create customer');
      }
    } catch (error) {
      console.error('Create customer failed:', error);
      
      // Handle different types of errors
      if (error.message.includes('duplicate') || error.message.includes('already exists')) {
        setErrors({ submit: 'A customer with this phone number already exists.' });
      } else if (error.message.includes('validation')) {
        setErrors({ submit: 'Please check the form data and try again.' });
      } else {
        setErrors({ submit: error.message || 'Failed to create customer. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      saveCustomer();
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Create New Customer</h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          disabled={loading}
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6">
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm font-medium">Error</p>
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        )}

        <form onKeyPress={handleKeyPress} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={customerData.firstName}
                onChange={handleDataChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter first name"
                disabled={loading}
                autoComplete="given-name"
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={customerData.lastName}
                onChange={handleDataChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter last name"
                disabled={loading}
                autoComplete="family-name"
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={customerData.phone}
                onChange={handleDataChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="+91 98765 43210"
                disabled={loading}
                autoComplete="tel"
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={customerData.email}
                onChange={handleDataChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="customer@email.com"
                disabled={loading}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={customerData.address}
              onChange={handleDataChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter street address"
              disabled={loading}
              autoComplete="street-address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                value={customerData.city}
                onChange={handleDataChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter city"
                disabled={loading}
                autoComplete="address-level2"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                name="state"
                value={customerData.state}
                onChange={handleDataChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="Gujarat">Gujarat</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                {/* Add more states as needed */}
              </select>
            </div>

            {/* PIN Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PIN Code
              </label>
              <input
                type="text"
                name="pinCode"
                value={customerData.pinCode}
                onChange={handleDataChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.pinCode ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="395007"
                disabled={loading}
                maxLength="6"
                autoComplete="postal-code"
              />
              {errors.pinCode && (
                <p className="text-red-500 text-xs mt-1">{errors.pinCode}</p>
              )}
            </div>
          </div>

          {/* ID Proof Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ID Proof Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Proof Type
              </label>
              <select
                name="idProofType"
                value={customerData.idProofType}
                onChange={handleDataChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="aadhar">Aadhar Card</option>
                <option value="pan">PAN Card</option>
                <option value="passport">Passport</option>
                <option value="driving_license">Driving License</option>
                <option value="voter_id">Voter ID</option>
              </select>
            </div>

            {/* ID Proof Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Proof Number
              </label>
              <input
                type="text"
                name="idProofNumber"
                value={customerData.idProofNumber}
                onChange={handleDataChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter ID proof number"
                disabled={loading}
              />
            </div>
          </div>
        </form>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2 transition-colors"
          disabled={loading}
        >
          <ArrowLeft size={16} />
          Back to Search
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={saveCustomer}
            disabled={loading || !customerData.firstName.trim() || !customerData.lastName.trim() || !customerData.phone.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Save size={16} />
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              'Save Customer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCustomerForm;
