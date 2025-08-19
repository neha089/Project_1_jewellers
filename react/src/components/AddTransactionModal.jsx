import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Calculator,
  User,
  Building,
  Users,
  Coins,
  DollarSign
} from 'lucide-react';

const AddTransactionModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    type: 'loan_payment',
    category: 'Loan Payment',
    description: '',
    customerName: '',
    customerId: '',
    loanId: '',
    employeeName: '',
    employeeId: '',
    vendorName: '',
    amount: '',
    method: 'Cash',
    reference: '',
    notes: '',
    branch: 'Main Branch'
  });

  const [errors, setErrors] = useState({});

  const transactionTypes = [
    { value: 'loan_payment', label: 'Loan Payment', category: 'Loan Payment', icon: Coins },
    { value: 'gold_purchase', label: 'Gold Purchase', category: 'Gold Purchase', icon: Coins },
    { value: 'office_rent', label: 'Office Rent', category: 'Office Rent', icon: Building },
    { value: 'cash_deposit', label: 'Cash Deposit', category: 'Cash Deposit', icon: DollarSign },
    { value: 'staff_salary', label: 'Staff Salary', category: 'Staff Salary', icon: Users },
    { value: 'loan_interest', label: 'Loan Interest', category: 'Loan Interest', icon: Coins }
  ];

  const paymentMethods = ['Cash', 'Bank Transfer', 'UPI', 'Card', 'Cheque'];
  const branches = ['Main Branch', 'North Branch', 'South Branch', 'East Branch', 'West Branch'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-update category when type changes
      if (name === 'type') {
        const selectedType = transactionTypes.find(type => type.value === value);
        if (selectedType) {
          updated.category = selectedType.category;
        }
      }
      
      return updated;
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.amount || parseFloat(formData.amount) === 0) newErrors.amount = 'Valid amount is required';
    
    // Validate entity based on transaction type
    if (['loan_payment', 'gold_purchase', 'cash_deposit', 'loan_interest'].includes(formData.type)) {
      if (!formData.customerName.trim()) newErrors.customerName = 'Customer name is required';
    } else if (formData.type === 'staff_salary') {
      if (!formData.employeeName.trim()) newErrors.employeeName = 'Employee name is required';
    } else if (formData.type === 'office_rent') {
      if (!formData.vendorName.trim()) newErrors.vendorName = 'Vendor name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const now = new Date();
    const transactionData = {
      ...formData,
      id: `TXN${String(Date.now()).slice(-3).padStart(3, '0')}`,
      amount: parseFloat(formData.amount),
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
      status: 'completed',
      balance: parseFloat(formData.amount),
      tags: [formData.category],
      processedBy: 'Admin'
    };
    
    onSave(transactionData);
    handleReset();
  };

  const handleReset = () => {
    setFormData({
      type: 'loan_payment',
      category: 'Loan Payment',
      description: '',
      customerName: '',
      customerId: '',
      loanId: '',
      employeeName: '',
      employeeId: '',
      vendorName: '',
      amount: '',
      method: 'Cash',
      reference: '',
      notes: '',
      branch: 'Main Branch'
    });
    setErrors({});
  };

  const renderEntityFields = () => {
    const selectedType = transactionTypes.find(type => type.value === formData.type);
    const EntityIcon = selectedType?.icon || User;

    if (['loan_payment', 'gold_purchase', 'cash_deposit', 'loan_interest'].includes(formData.type)) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <EntityIcon className="text-amber-600" size={20} />
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
              placeholder="Enter customer name"
            />
            {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
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

          {(formData.type === 'loan_payment' || formData.type === 'loan_interest') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan ID (Optional)
              </label>
              <input
                type="text"
                name="loanId"
                value={formData.loanId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                placeholder="Associated loan ID"
              />
            </div>
          )}
        </div>
      );
    } else if (formData.type === 'staff_salary') {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-amber-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Employee Information</h3>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee Name *
            </label>
            <input
              type="text"
              name="employeeName"
              value={formData.employeeName}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${
                errors.employeeName ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter employee name"
            />
            {errors.employeeName && <p className="text-red-500 text-xs mt-1">{errors.employeeName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee ID (Optional)
            </label>
            <input
              type="text"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
              placeholder="Employee ID"
            />
          </div>
        </div>
      );
    } else if (formData.type === 'office_rent') {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Building className="text-amber-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Vendor Information</h3>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor Name *
            </label>
            <input
              type="text"
              name="vendorName"
              value={formData.vendorName}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${
                errors.vendorName ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter vendor name"
            />
            {errors.vendorName && <p className="text-red-500 text-xs mt-1">{errors.vendorName}</p>}
          </div>
        </div>
      );
    }

    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center text-white">
              <DollarSign size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Add New Transaction</h2>
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
            
            {/* Transaction Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="text-amber-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                >
                  {transactionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${
                    errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter transaction description"
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${
                      errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="0"
                  />
                  {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    name="method"
                    value={formData.method}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  >
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number (Optional)
                </label>
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  placeholder="Transaction reference"
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

            {/* Entity Information */}
            {renderEntityFields()}
          </div>

          {/* Additional Notes */}
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
                placeholder="Any additional notes about the transaction..."
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
              <Save size={16} />
              Add Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;