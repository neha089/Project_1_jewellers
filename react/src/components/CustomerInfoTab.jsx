import { useState } from "react";
import { User, Phone, Mail, MapPin, CreditCard, Calendar, IndianRupee, Edit3, Save, X } from 'lucide-react';

const CustomerInfoTab = ({ customer, onRefresh }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleEdit = () => {
    setEditData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      adhaarNumber: customer.adhaarNumber
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    // Here you would call API to update customer
    console.log('Updating customer:', editData);
    // ApiService.updateCustomer(customer._id, editData);
    setIsEditing(false);
    onRefresh();
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEditData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Customer Information</h2>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
          >
            <Edit3 size={16} />
            Edit Details
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200"
            >
              <Save size={16} />
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User size={20} className="text-blue-600" />
            Personal Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 font-medium">{customer.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <Phone size={16} className="text-gray-500" />
                  {customer.phone}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <Mail size={16} className="text-gray-500" />
                  {customer.email}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.adhaarNumber || ''}
                  onChange={(e) => handleInputChange('adhaarNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <CreditCard size={16} className="text-gray-500" />
                  {customer.adhaarNumber}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-blue-600" />
            Address Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.address?.street || ''}
                  onChange={(e) => handleInputChange('address.street', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 font-medium">{customer.address?.street}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.address?.city || ''}
                    onChange={(e) => handleInputChange('address.city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{customer.address?.city}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.address?.state || ''}
                    onChange={(e) => handleInputChange('address.state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{customer.address?.state}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.address?.pincode || ''}
                  onChange={(e) => handleInputChange('address.pincode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 font-medium">{customer.address?.pincode}</p>
              )}
            </div>
          </div>
        </div>

        {/* Account Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <IndianRupee size={20} className="text-blue-600" />
            Account Summary
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Amount Taken From Jewellers</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(customer.totalAmountTakenFromJewellers / 100)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Amount Taken By Us</span>
              <span className="text-lg font-semibold text-green-600">
                {formatCurrency(customer.totalAmountTakenByUs / 100)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 font-medium">Net Balance</span>
              <span className="text-xl font-bold text-blue-600">
                {formatCurrency((customer.totalAmountTakenFromJewellers - customer.totalAmountTakenByUs) / 100)}
              </span>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" />
            Account Details
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID</label>
              <p className="text-gray-900 font-mono text-sm bg-gray-50 px-3 py-2 rounded">{customer._id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Created</label>
              <p className="text-gray-900 font-medium">{formatDate(customer.createdAt)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
              <p className="text-gray-900 font-medium">{formatDate(customer.updatedAt)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                customer.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerInfoTab;
