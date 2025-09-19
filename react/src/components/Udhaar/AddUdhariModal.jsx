
import React, { useState, useEffect } from 'react';
import { X, Search, Plus, User, DollarSign, AlertCircle, Loader2, Phone, Mail } from 'lucide-react';
import ApiService from '../../services/api.js';
import CreateCustomerForm from '../CreateCustomerForm';

const AddUdharModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    type: 'given',
    amount: '',
    note: '',
    returnDate: '',
    totalInstallments: 1,
    paymentMethod: 'CASH',
  });

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(
        (customer) =>
          customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone?.includes(searchTerm) ||
          customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.getAllCustomers();
      if (response.success && response.data?.customers) {
        setCustomers(response.data.customers);
        setFilteredCustomers(response.data.customers);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setStep(2);
    setError(null);
  };

  const handleCustomerCreated = (newCustomer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
    setSelectedCustomer(newCustomer);
    setShowCreateCustomer(false);
    setStep(2);
    setError(null);
  };

  const handleSubmitUdhar = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (!selectedCustomer || !selectedCustomer._id) {
        throw new Error('Please select a customer');
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const udharData = {
        customer: selectedCustomer._id,
        principalPaise: Math.round(parseFloat(formData.amount) * 100),
        note: formData.note.trim() || '',
        totalInstallments: parseInt(formData.totalInstallments) || 1,
        dueDate: formData.returnDate || null,
        paymentMethod: formData.paymentMethod || 'CASH',
      };

      const response =
        formData.type === 'given'
          ? await ApiService.giveUdhar(udharData)
          : await ApiService.takeUdhar(udharData);

      if (response.success) {
        onSuccess();
        onClose();
        resetForm();
      } else {
        throw new Error(response.error || response.message || 'Failed to create udhar');
      }
    } catch (error) {
      console.error('Udhar error:', error);
      setError(error.message || 'Failed to create udhar');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedCustomer(null);
    setSearchTerm('');
    setShowCreateCustomer(false);
    setError(null);
    setFormData({
      type: 'given',
      amount: '',
      note: '',
      returnDate: '',
      totalInstallments: 1,
      paymentMethod: 'CASH',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white rounded-xl w-full max-w-md sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {step === 1 ? 'Select Customer' : 'Add Udhar'}
          </h2>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {error && (
          <div className="mx-4 sm:mx-6 mt-4 flex items-center gap-2 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {step === 1 && (
          <div className="p-4 sm:p-6">
            {!showCreateCustomer ? (
              <>
                <div className="relative mb-4 sm:mb-6">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search customers by name, phone, or email..."
                    className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <button
                  onClick={() => setShowCreateCustomer(true)}
                  className="w-full flex items-center gap-3 p-3 sm:p-4 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors mb-4 sm:mb-6 text-sm sm:text-base"
                >
                  <Plus size={20} />
                  <span className="font-medium">Add New Customer</span>
                </button>

                <div className="space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8">
                      <Loader2 className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto" />
                      <p className="text-gray-500 mt-2 text-sm sm:text-base">Loading customers...</p>
                    </div>
                  ) : filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <div
                        key={customer._id}
                        onClick={() => handleCustomerSelect(customer)}
                        className="flex items-center gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">{getInitials(customer.name)}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{customer.name}</h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mt-1">
                            {customer.phone && (
                              <div className="flex items-center gap-1">
                                <Phone size={14} />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                            {customer.email && (
                              <div className="flex items-center gap-1">
                                <Mail size={14} />
                                <span className="truncate">{customer.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <User size={40} className="text-gray-300 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">No customers found</h3>
                      <p className="text-gray-500 mb-4 text-sm sm:text-base">Try adjusting your search or create a new customer</p>
                      <button
                        onClick={() => setShowCreateCustomer(true)}
                        className="px-4 py-2 sm:px-6 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                      >
                        Create New Customer
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <CreateCustomerForm
                onCancel={() => {
                  setShowCreateCustomer(false);
                  setError(null);
                }}
                onBack={() => {
                  setShowCreateCustomer(false);
                  setError(null);
                }}
                onCustomerCreated={handleCustomerCreated}
              />
            )}
          </div>
        )}

        {step === 2 && selectedCustomer && (
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">{getInitials(selectedCustomer.name)}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{selectedCustomer.name}</h3>
                <p className="text-xs sm:text-sm text-gray-500">{selectedCustomer.phone}</p>
              </div>
              <button
                onClick={() => {
                  setStep(1);
                  setError(null);
                }}
                className="ml-auto text-blue-600 hover:bg-white hover:bg-opacity-50 p-2 rounded-lg transition-colors text-sm sm:text-base"
              >
                Change
              </button>
            </div>

            <form onSubmit={handleSubmitUdhar} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">Udhar Type *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: 'given' }))}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-sm sm:text-base ${
                      formData.type === 'given'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <DollarSign
                        size={20}
                        className={`mx-auto mb-2 ${formData.type === 'given' ? 'text-red-500' : 'text-gray-400'}`}
                      />
                      <p className="font-semibold">Give Udhar</p>
                      <p className="text-xs sm:text-sm text-gray-500">Lend money to customer</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: 'taken' }))}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-sm sm:text-base ${
                      formData.type === 'taken'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <DollarSign
                        size={20}
                        className={`mx-auto mb-2 ${formData.type === 'taken' ? 'text-green-500' : 'text-gray-400'}`}
                      />
                      <p className="font-semibold">Take Udhar</p>
                      <p className="text-xs sm:text-sm text-gray-500">Borrow money from customer</p>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Principal Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    value={formData.amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                {formData.amount && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Amount: {formatCurrency(parseFloat(formData.amount) || 0)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="GPAY">Google Pay</option>
                  <option value="PHONEPE">PhonePe</option>
                  <option value="PAYTM">Paytm</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CARD">Card</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note / Description</label>
                <textarea
                  className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  rows="3"
                  value={formData.note}
                  onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="Enter udhar details..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Return Date (Optional)</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  value={formData.returnDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, returnDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Installments</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  value={formData.totalInstallments}
                  onChange={(e) => setFormData((prev) => ({ ...prev, totalInstallments: e.target.value }))}
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Number of payments expected for this udhar</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2 sm:px-6 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  disabled={submitting}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.amount || !selectedCustomer}
                  className={`flex-1 px-4 py-2 sm:px-6 sm:py-3 text-white rounded-lg transition-colors font-medium text-sm sm:text-base ${
                    formData.type === 'given'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Creating...
                    </div>
                  ) : formData.type === 'given' ? 'Give Udhar' : 'Take Udhar'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddUdharModal;
