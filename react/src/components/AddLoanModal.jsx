import React, { useState, useEffect } from 'react';
import { X, Search, User, Phone, Mail, Plus, DollarSign, AlertCircle, Loader2 } from 'lucide-react';
import ApiService from '../services/api.js';

const AddLoanModal = ({ isOpen, onClose, onSuccess }) => {
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
    interestRate: '',
    note: '',
    returnDate: '',
    totalInstallments: 1,
    paymentMethod: 'CASH'
  });

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(customer =>
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

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      
      if (!newCustomer.name.trim()) {
        throw new Error('Customer name is required');
      }
      
      const customerData = {
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.trim() || '',
        email: newCustomer.email.trim() || '',
        address: newCustomer.address.trim() || ''
      };
      
      const response = await ApiService.createCustomer(customerData);
      
      if (response.success) {
        const createdCustomer = response.data;
        setCustomers(prev => [createdCustomer, ...prev]);
        setSelectedCustomer(createdCustomer);
        setShowCreateCustomer(false);
        setNewCustomer({ name: '', phone: '', email: '', address: '' });
        setStep(2);
      } else {
        throw new Error(response.message || 'Failed to create customer');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      setError(error.message || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitLoan = async (e) => {
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
      
      if (!formData.interestRate || parseFloat(formData.interestRate) < 0) {
        throw new Error('Please enter a valid interest rate');
      }
      
      const loanData = {
        customer: selectedCustomer._id,
        principalPaise: Math.round(parseFloat(formData.amount) * 100),
        interestRateMonthlyPct: parseFloat(formData.interestRate),
        note: formData.note.trim() || '',
        totalInstallments: parseInt(formData.totalInstallments) || 1,
        dueDate: formData.returnDate || null,
        paymentMethod: formData.paymentMethod || 'CASH'
      };
      
      console.log('Creating loan:', { formData, selectedCustomer, loanData });
      
      const response = formData.type === 'given' 
        ? await ApiService.giveLoan(loanData)
        : await ApiService.takeLoan(loanData);
      
      if (response.success) {
        onSuccess();
        onClose();
        resetForm();
      } else {
        throw new Error(response.error || response.message || 'Failed to create loan');
      }
    } catch (error) {
      console.error('Loan error:', error);
      setError(error.message || 'Failed to create loan');
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
      interestRate: '',
      note: '',
      returnDate: '',
      totalInstallments: 1,
      paymentMethod: 'CASH'
    });
    setNewCustomer({ name: '', phone: '', email: '', address: '' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">
            {step === 1 ? 'Select Customer' : 'Add Loan'}
          </h2>
          <button
            onClick={() => { onClose(); resetForm(); }}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {step === 1 && (
          <div className="p-6">
            {!showCreateCustomer ? (
              <>
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search customers by name, phone, or email..."
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <button
                  onClick={() => setShowCreateCustomer(true)}
                  className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors mb-6"
                >
                  <Plus size={20} />
                  <span className="font-medium">Add New Customer</span>
                </button>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8">
                      <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto" />
                      <p className="text-slate-500 mt-2">Loading customers...</p>
                    </div>
                  ) : filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <div
                        key={customer._id}
                        onClick={() => handleCustomerSelect(customer)}
                        className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {getInitials(customer.name)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{customer.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                            {customer.phone && (
                              <div className="flex items-center gap-1">
                                <Phone size={14} />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                            {customer.email && (
                              <div className="flex items-center gap-1">
                                <Mail size={14} />
                                <span>{customer.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <User size={48} className="text-slate-300 mx-auto mb-4" />
                      <h3 className="font-semibold text-slate-900 mb-2">No customers found</h3>
                      <p className="text-slate-500">Try adjusting your search or create a new customer</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Create New Customer</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Customer Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                  <textarea
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter address"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowCreateCustomer(false); setError(null); }}
                    className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !newCustomer.name.trim()}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        Creating...
                      </div>
                    ) : 'Create Customer'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {step === 2 && selectedCustomer && (
          <div className="p-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-bold">{getInitials(selectedCustomer.name)}</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{selectedCustomer.name}</h3>
                <p className="text-sm text-slate-500">{selectedCustomer.phone}</p>
              </div>
              <button
                onClick={() => { setStep(1); setError(null); }}
                className="ml-auto text-blue-600 hover:bg-white hover:bg-opacity-50 p-2 rounded-lg transition-colors"
              >
                Change
              </button>
            </div>

            <form onSubmit={handleSubmitLoan} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Loan Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'given' }))}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.type === 'given'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-center">
                      <DollarSign size={24} className={`mx-auto mb-2 ${formData.type === 'given' ? 'text-red-500' : 'text-slate-400'}`} />
                      <p className="font-semibold">Give Loan</p>
                      <p className="text-sm text-slate-500">Lend money to customer</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'taken' }))}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.type === 'taken'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-center">
                      <DollarSign size={24} className={`mx-auto mb-2 ${formData.type === 'taken' ? 'text-green-500' : 'text-slate-400'}`} />
                      <p className="font-semibold">Take Loan</p>
                      <p className="text-sm text-slate-500">Borrow money from customer</p>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Principal Amount *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                {formData.amount && (
                  <p className="text-sm text-slate-500 mt-1">Amount: {formatCurrency(parseFloat(formData.amount) || 0)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Interest Rate (% per month) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500">%</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.interestRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, interestRate: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                {formData.interestRate && (
                  <p className="text-sm text-slate-500 mt-1">
                    Monthly interest rate: {formData.interestRate}% (Annual: {(parseFloat(formData.interestRate) * 12).toFixed(2)}%)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                <select
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Note / Description</label>
                <textarea
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Enter loan details..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Expected Return Date (Optional)</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.returnDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Total Installments</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.totalInstallments}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalInstallments: e.target.value }))}
                />
                <p className="text-sm text-slate-500 mt-1">Number of payments expected for this loan</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(null); }}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                  disabled={submitting}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.amount || !formData.interestRate || !selectedCustomer}
                  className={`flex-1 px-6 py-3 text-white rounded-xl transition-colors font-medium ${
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
                  ) : formData.type === 'given' ? 'Give Loan' : 'Take Loan'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
export default AddLoanModal;
