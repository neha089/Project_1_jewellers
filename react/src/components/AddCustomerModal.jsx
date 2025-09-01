import React, { useState } from 'react';
import { X, Save, Users, MapPin, FileText, Loader2, AlertCircle } from 'lucide-react';

const AddCustomerModal = ({ isOpen, onClose, onSave, loading = false }) => {
  const [formData, setFormData] = useState({
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

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\+]?[0-9\s\-\(\)]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Validate PIN Code if provided
    if (formData.pinCode && !/^[0-9]{6}$/.test(formData.pinCode)) {
      newErrors.pinCode = 'PIN code must be 6 digits';
    }
    
    // Validate Adhaar number if provided
    if (formData.idProofType === 'aadhar' && formData.idProofNumber && !/^[0-9]{12}$/.test(formData.idProofNumber.replace(/\s/g, ''))) {
      newErrors.idProofNumber = 'Aadhar number must be 12 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Transform form data to match the API structure
      const customerData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state,
        pinCode: formData.pinCode.trim(),
        idProofType: formData.idProofType,
        idProofNumber: formData.idProofNumber.trim(),
        notes: formData.notes.trim()
      };
      
      await onSave(customerData);
      
      // Reset form on successful save
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
    } catch (error) {
      console.error('Error saving customer:', error);
      setErrors({ submit: error.message || 'Failed to save customer. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form when closing
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
      onClose();
    }
  };

  if (!isOpen) return null;

  const inputClasses = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200";
  const errorInputClasses = "w-full px-4 py-3 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200";
  const disabledInputClasses = "w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed";

  const isFormDisabled = isSubmitting || loading;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
          <h3 className="text-xl font-bold text-gray-900">Add New Customer</h3>
          <button
            onClick={handleClose}
            disabled={isFormDisabled}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {/* Submit Error Display */}
          {errors.submit && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle size={20} className="text-red-500" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="md:col-span-2">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                Personal Information
              </h4>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={isFormDisabled}
                className={errors.firstName ? errorInputClasses : isFormDisabled ? disabledInputClasses : inputClasses}
                placeholder="Enter first name"
              />
              {errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={isFormDisabled}
                className={errors.lastName ? errorInputClasses : isFormDisabled ? disabledInputClasses : inputClasses}
                placeholder="Enter last name"
              />
              {errors.lastName && <p className="text-sm text-red-600">{errors.lastName}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={isFormDisabled}
                className={errors.phone ? errorInputClasses : isFormDisabled ? disabledInputClasses : inputClasses}
                placeholder="+91 98765 43210"
              />
              {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isFormDisabled}
                className={errors.email ? errorInputClasses : isFormDisabled ? disabledInputClasses : inputClasses}
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
              <label className="block text-sm font-semibold text-gray-700">Street Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={isFormDisabled}
                placeholder="Enter street address"
                className={isFormDisabled ? disabledInputClasses : inputClasses}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                disabled={isFormDisabled}
                placeholder="Enter city"
                className={isFormDisabled ? disabledInputClasses : inputClasses}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">State</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                disabled={isFormDisabled}
                className={isFormDisabled ? disabledInputClasses : inputClasses}
              >
                <option value="">Select State</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                <option value="Assam">Assam</option>
                <option value="Bihar">Bihar</option>
                <option value="Chhattisgarh">Chhattisgarh</option>
                <option value="Delhi">Delhi</option>
                <option value="Goa">Goa</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Haryana">Haryana</option>
                <option value="Himachal Pradesh">Himachal Pradesh</option>
                <option value="Jharkhand">Jharkhand</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Kerala">Kerala</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Manipur">Manipur</option>
                <option value="Meghalaya">Meghalaya</option>
                <option value="Mizoram">Mizoram</option>
                <option value="Nagaland">Nagaland</option>
                <option value="Odisha">Odisha</option>
                <option value="Punjab">Punjab</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Sikkim">Sikkim</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Telangana">Telangana</option>
                <option value="Tripura">Tripura</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Uttarakhand">Uttarakhand</option>
                <option value="West Bengal">West Bengal</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">PIN Code</label>
              <input
                type="text"
                name="pinCode"
                value={formData.pinCode}
                onChange={handleChange}
                disabled={isFormDisabled}
                placeholder="Enter 6-digit PIN code"
                maxLength="6"
                className={errors.pinCode ? errorInputClasses : isFormDisabled ? disabledInputClasses : inputClasses}
              />
              {errors.pinCode && <p className="text-sm text-red-600">{errors.pinCode}</p>}
            </div>
            
            {/* ID Proof Information */}
            <div className="md:col-span-2 mt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-purple-600" />
                ID Proof Information
              </h4>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">ID Proof Type</label>
              <select
                name="idProofType"
                value={formData.idProofType}
                onChange={handleChange}
                disabled={isFormDisabled}
                className={isFormDisabled ? disabledInputClasses : inputClasses}
              >
                <option value="aadhar">Aadhar Card</option>
                <option value="pan">PAN Card</option>
                <option value="voter">Voter ID</option>
                <option value="passport">Passport</option>
                <option value="driving">Driving License</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                ID Proof Number
                {formData.idProofType === 'aadhar' && <span className="text-xs text-gray-500 ml-2">(12 digits)</span>}
              </label>
              <input
                type="text"
                name="idProofNumber"
                value={formData.idProofNumber}
                onChange={handleChange}
                disabled={isFormDisabled}
                placeholder={
                  formData.idProofType === 'aadhar' ? 'Enter 12-digit Aadhar number' :
                  formData.idProofType === 'pan' ? 'Enter PAN number' :
                  'Enter ID proof number'
                }
                className={errors.idProofNumber ? errorInputClasses : isFormDisabled ? disabledInputClasses : inputClasses}
              />
              {errors.idProofNumber && <p className="text-sm text-red-600">{errors.idProofNumber}</p>}
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Additional Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={isFormDisabled}
                rows="4"
                placeholder="Any additional notes about the customer..."
                className={`${isFormDisabled ? disabledInputClasses : inputClasses} resize-none`}
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={isFormDisabled}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isFormDisabled}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Customer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCustomerModal;