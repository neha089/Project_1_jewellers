import React, { useState, useEffect } from 'react';
import { Users, X, Save } from 'lucide-react';
import { customerService } from '../services/customerService';

const CustomerForm = ({ onSave, onCancel, existingCustomer, searchTerm = '' }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: 'Gujarat',
      pincode: ''
    },
    city: '',
    state: 'Gujarat',
    pincode: '',
    adhaarNumber: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingCustomer) {
      setFormData(existingCustomer);
    } else if (searchTerm) {
      // Pre-fill name if search term looks like a name
      if (searchTerm && !searchTerm.includes('+91') && searchTerm.length > 2) {
        setFormData(prev => ({
          ...prev,
          name: searchTerm
        }));
      }
    }
  }, [existingCustomer, searchTerm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested fields like address.street
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    if (!formData.adhaarNumber.trim()) {
      newErrors.adhaarNumber = 'Aadhaar number is required';
    } else if (!/^[0-9]{12}$/.test(formData.adhaarNumber.replace(/\D/g, ''))) {
      newErrors.adhaarNumber = 'Aadhaar number must be 12 digits';
    }
    
    if (!formData.address.street.trim()) newErrors['address.street'] = 'Street address is required';
    if (!formData.address.city.trim()) newErrors['address.city'] = 'City is required';
    if (!formData.address.state.trim()) newErrors['address.state'] = 'State is required';
    if (!formData.address.pincode.trim()) {
      newErrors['address.pincode'] = 'Pincode is required';
    } else if (!/^[0-9]{6}$/.test(formData.address.pincode)) {
      newErrors['address.pincode'] = 'Pincode must be 6 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // Clean phone number and aadhaar number
      const customerData = {
        ...formData,
        phone: formData.phone.replace(/\D/g, ''),
        adhaarNumber: formData.adhaarNumber.replace(/\D/g, ''),
        city: formData.address.city,
        state: formData.address.state,
        pincode: formData.address.pincode
      };
      
      const response = existingCustomer 
        ? await customerService.updateCustomer(existingCustomer._id, customerData)
        : await customerService.createCustomer(customerData);
        
      if (response.success) {
        onSave(response.data);
      } else {
        throw new Error(response.error || 'Failed to save customer');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      alert(error.message || 'Failed to save customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="text-blue-600" size={20} />
          {existingCustomer ? 'Edit Customer' : 'Create New Customer'}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter full name"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="9876543210"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="customer@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number *</label>
            <input
              type="text"
              name="adhaarNumber"
              value={formData.adhaarNumber}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.adhaarNumber ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="123456789012"
              maxLength="12"
            />
            {errors.adhaarNumber && <p className="text-red-500 text-xs mt-1">{errors.adhaarNumber}</p>}
          </div>
        </div>

        {/* Address Information */}
        <div className="border-t pt-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Address Information</h4>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['address.street'] ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="House/Plot number, Road name"
              />
              {errors['address.street'] && <p className="text-red-500 text-xs mt-1">{errors['address.street']}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors['address.city'] ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="City name"
                />
                {errors['address.city'] && <p className="text-red-500 text-xs mt-1">{errors['address.city']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <select
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors['address.state'] ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="Gujarat">Gujarat</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                </select>
                {errors['address.state'] && <p className="text-red-500 text-xs mt-1">{errors['address.state']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                <input
                  type="text"
                  name="address.pincode"
                  value={formData.address.pincode}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors['address.pincode'] ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="380001"
                  maxLength="6"
                />
                {errors['address.pincode'] && <p className="text-red-500 text-xs mt-1">{errors['address.pincode']}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-3 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            ← Back to Search
          </button>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save size={16} />
              )}
              {loading ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
