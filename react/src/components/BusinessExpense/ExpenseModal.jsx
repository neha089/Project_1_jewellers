// components/BusinessExpense/ExpenseModal.js
import React, { useState, useEffect } from 'react';
import { Plus, Edit2 } from 'lucide-react';
import { CATEGORIES, PAYMENT_METHODS, PAYMENT_STATUS_OPTIONS, getCategoryIcon } from './constants';

const ExpenseModal = ({ isEdit, editingExpense, onAdd, onUpdate, onClose }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        category: '',
        subcategory: '',
        title: '',
        description: '',
        amount: '',
        vendor: '',
        vendorCode: '',
        vendorPhone: '',
        vendorEmail: '',
        vendorGst: '',
        paymentMethod: '',
        status: 'PAID',
        reference: '',
        taxAmount: '',
        netAmount: '',
        dueDate: '',
        notes: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Initialize form data when editing
    useEffect(() => {
        if (isEdit && editingExpense) {
            // Handle different ID field names (MongoDB uses _id, some APIs use id)
            const expenseId = editingExpense.id || editingExpense._id;
            
            if (!expenseId) {
                console.warn('Warning: Expense ID not found in editing expense:', editingExpense);
            }

            // Handle nested vendor structure
            const vendorName = typeof editingExpense.vendor === 'string' 
                ? editingExpense.vendor 
                : editingExpense.vendor?.name || '';
            
            const vendorCode = typeof editingExpense.vendor === 'object' 
                ? editingExpense.vendor?.code || '' 
                : '';
                
            const vendorPhone = typeof editingExpense.vendor === 'object' 
                ? editingExpense.vendor?.contact?.phone || '' 
                : '';
                
            const vendorEmail = typeof editingExpense.vendor === 'object' 
                ? editingExpense.vendor?.contact?.email || '' 
                : '';

            const vendorGst = typeof editingExpense.vendor === 'object' 
                ? editingExpense.vendor?.gstNumber || editingExpense.vendor?.gst || '' 
                : '';

            // Handle different date field formats
            let expenseDate = editingExpense.date || editingExpense.expenseDate;
            if (expenseDate) {
                // Convert ISO date to YYYY-MM-DD format for input[type="date"]
                expenseDate = new Date(expenseDate).toISOString().split('T')[0];
            } else {
                expenseDate = new Date().toISOString().split('T')[0];
            }

            let dueDate = editingExpense.dueDate;
            if (dueDate) {
                dueDate = new Date(dueDate).toISOString().split('T')[0];
            } else {
                dueDate = '';
            }

            // Handle different amount field names
            const grossAmount = editingExpense.amount || editingExpense.grossAmount || 0;
            const taxAmount = editingExpense.taxAmount || editingExpense.taxDetails?.totalTax || 0;

            setFormData({
                id: expenseId, // Store the ID in formData
                date: expenseDate,
                category: editingExpense.category || '',
                subcategory: editingExpense.subcategory || '',
                title: editingExpense.title || '',
                description: editingExpense.description || '',
                amount: grossAmount.toString(),
                vendor: vendorName,
                vendorCode: vendorCode,
                vendorPhone: vendorPhone,
                vendorEmail: vendorEmail,
                vendorGst: vendorGst,
                paymentMethod: editingExpense.paymentMethod || '',
                status: editingExpense.status || editingExpense.paymentStatus || 'PENDING',
                reference: editingExpense.reference || editingExpense.referenceNumber || '',
                taxAmount: taxAmount.toString(),
                netAmount: editingExpense.netAmount ? editingExpense.netAmount.toString() : '',
                dueDate: dueDate,
                notes: editingExpense.metadata?.notes || editingExpense.notes || ''
            });
        } else {
            // Reset form for new expense
            setFormData({
                date: new Date().toISOString().split('T')[0],
                category: '',
                subcategory: '',
                title: '',
                description: '',
                amount: '',
                vendor: '',
                vendorCode: '',
                vendorPhone: '',
                vendorEmail: '',
                vendorGst: '',
                paymentMethod: '',
                status: 'PENDING',
                reference: '',
                taxAmount: '',
                netAmount: '',
                dueDate: '',
                notes: ''
            });
        }
    }, [isEdit, editingExpense]);

    // Calculate net amount when gross amount or tax changes
    useEffect(() => {
        const grossAmount = parseFloat(formData.amount) || 0;
        const taxAmount = parseFloat(formData.taxAmount) || 0;
        const netAmount = grossAmount - taxAmount;
        
        if (grossAmount > 0) {
            setFormData(prev => ({
                ...prev,
                netAmount: netAmount.toFixed(2)
            }));
        }
    }, [formData.amount, formData.taxAmount]);

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.vendor.trim()) newErrors.vendor = 'Vendor name is required';
        if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Valid amount is required';
        if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';
        if (!formData.date) newErrors.date = 'Date is required';
        
        // Validate tax amount doesn't exceed gross amount
        const grossAmount = parseFloat(formData.amount) || 0;
        const taxAmount = parseFloat(formData.taxAmount) || 0;
        if (taxAmount > grossAmount) {
            newErrors.taxAmount = 'Tax amount cannot exceed gross amount';
        }
        
        // For edit mode, ensure we have an ID
        if (isEdit && !formData.id) {
            newErrors.general = 'Cannot update expense: ID is missing';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setLoading(true);
        
        const expenseData = {
            category: formData.category,
            subcategory: formData.subcategory || undefined,
            title: formData.title.trim(),
            description: formData.description.trim(),
            vendor: {
                name: formData.vendor.trim(),
                code: formData.vendorCode.trim() || undefined,
                contact: {
                    phone: formData.vendorPhone.trim() || undefined,
                    email: formData.vendorEmail.trim() || undefined
                },
                gstNumber: formData.vendorGst.trim() || undefined
            },
            grossAmount: parseFloat(formData.amount),
            taxDetails: {
                totalTax: parseFloat(formData.taxAmount) || 0,
                cgst: 0,
                sgst: 0,
                igst: 0,
                cess: 0
            },
            paymentMethod: formData.paymentMethod,
            expenseDate: formData.date,
            referenceNumber: formData.reference.trim() || undefined,
            paymentStatus: formData.status,
            dueDate: formData.dueDate || undefined,
            metadata: {
                notes: formData.notes.trim() || undefined
            }
        };

        try {
            let result;
            if (isEdit) {
                // Pass the expense ID along with the data
                console.log('Sending update data:', expenseData);
                console.log('Expense ID:', formData.id);
                result = await onUpdate(formData.id, expenseData);
            } else {
                console.log('Sending create data:', expenseData);
                result = await onAdd(expenseData);
            }
            
            if (result && result.success) {
                resetForm();
            } else {
                alert('Failed to save expense: ' + (result?.error || result?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving expense:', error);
            alert('Failed to save expense: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            category: '',
            subcategory: '',
            title: '',
            description: '',
            amount: '',
            vendor: '',
            vendorCode: '',
            vendorPhone: '',
            vendorEmail: '',
            vendorGst: '',
            paymentMethod: '',
            status: 'PENDING',
            reference: '',
            taxAmount: '',
            netAmount: '',
            dueDate: '',
            notes: ''
        });
        setErrors({});
        onClose();
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const selectedCategory = CATEGORIES.find(cat => cat.name === formData.category);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white">
                                {isEdit ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {isEdit ? 'Edit Expense' : 'Add New Expense'}
                                </h2>
                                <p className="text-sm text-slate-600">
                                    {isEdit ? 'Update expense details' : 'Enter comprehensive expense information'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={resetForm}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                            disabled={loading}
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Show general error if any */}
                    {errors.general && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-600 text-sm">{errors.general}</p>
                        </div>
                    )}

                    {/* Debug info - remove in production */}
                    {isEdit && process.env.NODE_ENV === 'development' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-blue-600 text-xs">
                                Debug: Editing expense ID: {formData.id || 'NOT FOUND'}
                            </p>
                        </div>
                    )}

                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                            Basic Information
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Transaction Date *
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => handleChange('date', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 ${
                                        errors.date ? 'border-red-300' : 'border-slate-300'
                                    }`}
                                    required
                                />
                                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Reference Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.reference}
                                    onChange={(e) => handleChange('reference', e.target.value)}
                                    placeholder="PO-2024-001, INV-001, etc."
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Category *
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => {
                                        handleChange('category', e.target.value);
                                        handleChange('subcategory', ''); // Reset subcategory
                                    }}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 ${
                                        errors.category ? 'border-red-300' : 'border-slate-300'
                                    }`}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {CATEGORIES.map(category => (
                                        <option key={category.name} value={category.name}>
                                            {getCategoryIcon(category.name)} {category.name.replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Subcategory
                                </label>
                                <select
                                    value={formData.subcategory}
                                    onChange={(e) => handleChange('subcategory', e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                                    disabled={!formData.category}
                                >
                                    <option value="">Select Subcategory</option>
                                    {selectedCategory?.subcategories?.map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Expense Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="Brief title for the expense"
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 ${
                                    errors.title ? 'border-red-300' : 'border-slate-300'
                                }`}
                                required
                            />
                            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Expense Description *
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Detailed description of the expense..."
                                rows="3"
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 resize-none ${
                                    errors.description ? 'border-red-300' : 'border-slate-300'
                                }`}
                                required
                            />
                            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                        </div>
                    </div>

                    {/* Financial Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                            Financial Details
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Gross Amount (₹) *
                                </label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => handleChange('amount', e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 ${
                                        errors.amount ? 'border-red-300' : 'border-slate-300'
                                    }`}
                                    required
                                />
                                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Tax Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    value={formData.taxAmount}
                                    onChange={(e) => handleChange('taxAmount', e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 ${
                                        errors.taxAmount ? 'border-red-300' : 'border-slate-300'
                                    }`}
                                />
                                {errors.taxAmount && <p className="text-red-500 text-xs mt-1">{errors.taxAmount}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Net Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    value={formData.netAmount}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 text-slate-900"
                                    readOnly
                                />
                                <p className="text-xs text-slate-500 mt-1">Auto-calculated</p>
                            </div>
                        </div>
                    </div>

                    {/* Vendor & Payment Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                            Vendor & Payment Information
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Vendor Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.vendor}
                                    onChange={(e) => handleChange('vendor', e.target.value)}
                                    placeholder="Enter vendor/supplier name"
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 ${
                                        errors.vendor ? 'border-red-300' : 'border-slate-300'
                                    }`}
                                    required
                                />
                                {errors.vendor && <p className="text-red-500 text-xs mt-1">{errors.vendor}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Vendor Code
                                </label>
                                <input
                                    type="text"
                                    value={formData.vendorCode}
                                    onChange={(e) => handleChange('vendorCode', e.target.value)}
                                    placeholder="VND001, SUP001, etc."
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Vendor Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.vendorPhone}
                                    onChange={(e) => handleChange('vendorPhone', e.target.value)}
                                    placeholder="+91 98765 43210"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Vendor Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.vendorEmail}
                                    onChange={(e) => handleChange('vendorEmail', e.target.value)}
                                    placeholder="vendor@example.com"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                GST Number (Optional)
                            </label>
                            <input
                                type="text"
                                value={formData.vendorGst}
                                onChange={(e) => handleChange('vendorGst', e.target.value)}
                                placeholder="27AAACW3775K1ZJ"
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Payment Method *
                                </label>
                                <select
                                    value={formData.paymentMethod}
                                    onChange={(e) => handleChange('paymentMethod', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 ${
                                        errors.paymentMethod ? 'border-red-300' : 'border-slate-300'
                                    }`}
                                    required
                                >
                                    <option value="">Select Payment Method</option>
                                    {PAYMENT_METHODS.map(method => (
                                        <option key={method} value={method}>
                                            {method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </option>
                                    ))}
                                </select>
                                {errors.paymentMethod && <p className="text-red-500 text-xs mt-1">{errors.paymentMethod}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Payment Status *
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => handleChange('status', e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                                    required
                                >
                                    {PAYMENT_STATUS_OPTIONS.map(status => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => handleChange('dueDate', e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Notes
                                </label>
                                <input
                                    type="text"
                                    value={formData.notes}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    placeholder="Additional notes..."
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 rounded-b-2xl -mx-6">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={resetForm}
                                disabled={loading}
                                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors font-semibold disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors font-semibold shadow-lg disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : (isEdit ? 'Update Expense' : 'Add Expense')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseModal;