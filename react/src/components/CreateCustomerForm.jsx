// CreateCustomerForm.js
import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import ApiService from '../services/api';

const CreateCustomerForm = ({ onCancel, onBack, onCustomerCreated, initialData = {} }) => {
  const [customerData, setCustomerData] = useState({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    address: initialData.address || '',
    city: initialData.city || '',
    state: initialData.state || 'Gujarat',
    pinCode: initialData.pinCode || '',
    idProofType: initialData.idProofType || 'aadhar',
    idProofNumber: initialData.idProofNumber || ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!customerData.firstName.trim()) newErrors.firstName = 'Required';
    if (!customerData.lastName.trim()) newErrors.lastName = 'Required';
    if (!customerData.phone.trim()) newErrors.phone = 'Required';
    if (customerData.phone && !/^\+?[\d\s-]+$/.test(customerData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }
    if (customerData.email && !/\S+@\S+\.\S+/.test(customerData.email)) {
      newErrors.email = 'Invalid email';
    }
    if (customerData.pinCode && !/^\d{6}$/.test(customerData.pinCode)) {
      newErrors.pinCode = 'PIN code must be 6 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveCustomer = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const customerPayload = {
        name: `${customerData.firstName.trim()} ${customerData.lastName.trim()}`,
        phone: customerData.phone.trim(),
        email: customerData.email.trim(),
        address: customerData.address.trim(),
        city: customerData.city.trim(),
        state: customerData.state,
        pinCode: customerData.pinCode.trim(),
        idProofNumber: customerData.idProofNumber.trim()
      };

      const response = await ApiService.createCustomer(customerPayload);
      
      if (response.success) {
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
      setErrors({ submit: error.message || 'Failed to create customer. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Create New Customer</h3>
        <button
          onClick={onCancel}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
          <input
            type="text"
            name="firstName"
            value={customerData.firstName}
            onChange={handleDataChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.firstName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter first name"
            disabled={loading}
          />
          {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
          <input
            type="text"
            name="lastName"
            value={customerData.lastName}
            onChange={handleDataChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.lastName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter last name"
            disabled={loading}
          />
          {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
          <input
            type="tel"
            name="phone"
            value={customerData.phone}
            onChange={handleDataChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.phone ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="+91 98765 43210"
            disabled={loading}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={customerData.email}
            onChange={handleDataChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="customer@email.com"
            disabled={loading}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            name="address"
            value={customerData.address}
            onChange={handleDataChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter address"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            type="text"
            name="city"
            value={customerData.city}
            onChange={handleDataChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter city"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
          <input
            type="text"
            name="pinCode"
            value={customerData.pinCode}
            onChange={handleDataChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.pinCode ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter PIN code"
            disabled={loading}
          />
          {errors.pinCode && <p className="text-red-500 text-xs mt-1">{errors.pinCode}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof Type</label>
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
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof Number</label>
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

      <div className="flex justify-between gap-3 mt-6">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2"
          disabled={loading}
        >
          ← Back to Search
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
            onClick={saveCustomer}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {loading ? 'Saving...' : 'Save Customer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCustomerForm;