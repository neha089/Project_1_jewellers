import React, { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, Lock } from 'lucide-react';
import ApiService from '../services/api';
import MetalPriceService from '../services/metalPriceService';
import CustomerSearch from './CustomerSearch';
import MetalItemsManager from './MetalItemsManager';
import CreateCustomerForm from './CreateCustomerForm';

const SilverTransactionForm = ({ 
  editingTransaction, 
  silverRates, 
  onClose, 
  onSuccess, 
  onError 
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [createCustomerInitialData, setCreateCustomerInitialData] = useState({});
  const [currentPrices, setCurrentPrices] = useState(null);
  const [items, setItems] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    transactionType: 'BUY',
    customerId: '',
    supplierId: '',
    customerData: {
      name: '',
      phone: '',
      email: '',
      address: ''
    },
    supplierData: {
      name: '',
      phone: '',
      email: '',
      address: ''
    },
    advanceAmount: 0,
    paymentMode: 'CASH',
    notes: '',
    billNumber: '',
    originalAdvanceAmount: 0,
    additionalPayment: 0,
    additionalPaymentMode: 'CASH'
  });

  useEffect(() => {
    loadCurrentPrices();
  }, []);

  useEffect(() => {
    if (editingTransaction) {
      setIsEditing(true);
      populateEditForm();
    } else {
      setIsEditing(false);
    }
  }, [editingTransaction]);

  const loadCurrentPrices = async () => {
    try {
      const prices = await MetalPriceService.getCurrentPrices();
      setCurrentPrices(prices.silver);
    } catch (error) {
      console.error('Error loading current prices:', error);
    }
  };

  const populateEditForm = () => {
    const transaction = editingTransaction;
    
    const originalAdvance = transaction.advanceAmount ? transaction.advanceAmount / 100 : 0;
    
    setFormData({
      transactionType: transaction.transactionType,
      customerId: transaction.customer?._id || '',
      supplierId: transaction.supplier?._id || '',
      customerData: {
        name: getPersonName(transaction),
        phone: getPersonPhone(transaction),
        email: getPersonEmail(transaction),
        address: getPersonAddress(transaction)
      },
      supplierData: {
        name: getPersonName(transaction),
        phone: getPersonPhone(transaction),
        email: getPersonEmail(transaction),
        address: getPersonAddress(transaction)
      },
      advanceAmount: originalAdvance,
      originalAdvanceAmount: originalAdvance,
      additionalPayment: 0,
      additionalPaymentMode: 'CASH',
      paymentMode: transaction.paymentMode || 'CASH',
      notes: transaction.notes || '',
      billNumber: transaction.invoiceNumber || ''
    });

    const personName = getPersonName(transaction);
    if (personName && personName !== 'N/A') {
      setCustomerSearchTerm(personName);
      setSelectedCustomer({
        _id: transaction.transactionType === 'SELL' ? transaction.customer?._id : transaction.supplier?._id,
        name: personName,
        phone: getPersonPhone(transaction),
        email: getPersonEmail(transaction),
        address: getPersonAddress(transaction)
      });
    }

    if (transaction.items && transaction.items.length > 0) {
      const transactionItems = transaction.items.map(item => ({
        id: item.id || Date.now() + Math.random(),
        itemName: item.name || item.itemName || '',
        description: item.description || '',
        purity: item.purity || '925',
        weight: item.weight ? item.weight.toString() : '',
        ratePerGram: item.ratePerGram ? (item.ratePerGram / 100).toString() : '',
        makingCharges: item.makingCharges ? (item.makingCharges / 100).toString() : '0',
        wastage: item.wastage ? item.wastage.toString() : '0',
        taxAmount: item.taxAmount ? (item.taxAmount / 100).toString() : '0',
        photos: item.photos || [],
        hallmarkNumber: item.hallmarkNumber || '',
        certificateNumber: item.certificateNumber || ''
      }));
      setItems(transactionItems);
    }
  };

  const getPersonName = (transaction) => {
    if (transaction.transactionType === 'SELL' && transaction.customer) {
      return transaction.customer.name || (transaction.customer.firstName + ' ' + (transaction.customer.lastName || '')) || 'N/A';
    }
    if (transaction.transactionType === 'BUY' && transaction.supplier) {
      return transaction.supplier.name || (transaction.supplier.firstName + ' ' + (transaction.supplier.lastName || '')) || 'N/A';
    }
    return 'N/A';
  };

  const getPersonPhone = (transaction) => {
    if (transaction.transactionType === 'SELL' && transaction.customer) {
      return transaction.customer.phone || transaction.customer.phoneNumber || '';
    }
    if (transaction.transactionType === 'BUY' && transaction.supplier) {
      return transaction.supplier.phone || transaction.supplier.phoneNumber || '';
    }
    return '';
  };

  const getPersonEmail = (transaction) => {
    if (transaction.transactionType === 'SELL' && transaction.customer) {
      return transaction.customer.email || '';
    }
    if (transaction.transactionType === 'BUY' && transaction.supplier) {
      return transaction.supplier.email || '';
    }
    return '';
  };

  const getPersonAddress = (transaction) => {
    if (transaction.transactionType === 'SELL' && transaction.customer) {
      const address = transaction.customer.address;
      if (typeof address === 'string') return address;
      if (address && typeof address === 'object') {
        return [address.street, address.city, address.state, address.pincode]
          .filter(Boolean).join(', ');
      }
      return '';
    }
    if (transaction.transactionType === 'BUY' && transaction.supplier) {
      const address = transaction.supplier.address;
      if (typeof address === 'string') return address;
      if (address && typeof address === 'object') {
        return [address.street, address.city, address.state, address.pincode]
          .filter(Boolean).join(', ');
      }
      return '';
    }
    return '';
  };

  const handleCustomerSelect = (customer) => {
    if (isEditing) return;
    
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer.name || `${customer.firstName} ${customer.lastName || ''}`.trim());
    
    const customerName = customer.name || `${customer.firstName} ${customer.lastName || ''}`.trim();
    const customerPhone = customer.phone || customer.phoneNumber || '';
    const customerEmail = customer.email || '';
    const customerAddress = typeof customer.address === 'string' 
      ? customer.address 
      : customer.address?.street 
        ? [customer.address.street, customer.address.city, customer.address.state, customer.address.pincode]
          .filter(Boolean).join(', ') 
        : '';

    if (formData.transactionType === 'SELL') {
      setFormData(prev => ({
        ...prev,
        customerId: customer._id,
        customerData: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          address: customerAddress
        }
      }));
    }
    setShowCreateCustomer(false);
  };

  const handleCreateCustomer = useCallback(() => {
    if (isEditing) return;
    
    let initialData = {};

    if (customerSearchTerm && !customerSearchTerm.includes("+91") && customerSearchTerm.length > 2) {
      const nameParts = customerSearchTerm.trim().split(" ");
      initialData = {
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
      };
    }

    setCreateCustomerInitialData(initialData);
    setShowCreateCustomer(true);
  }, [customerSearchTerm, isEditing]);

  const handleCustomerCreated = (newCustomer) => {
    setSelectedCustomer(newCustomer);
    setShowCreateCustomer(false);
    
    handleCustomerSelect(newCustomer);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const calculateTotals = () => {
    if (items.length === 0) {
      return { totalWeight: 0, totalAmount: 0 };
    }

    const totalWeight = items.reduce((sum, item) => {
      return sum + (parseFloat(item.weight) || 0);
    }, 0);

    const totalAmount = items.reduce((total, item) => {
      const weight = parseFloat(item.weight) || 0;
      const rate = parseFloat(item.ratePerGram) || 0;
      const making = parseFloat(item.makingCharges) || 0;
      const wastage = parseFloat(item.wastage) || 0;
      const tax = parseFloat(item.taxAmount) || 0;
      
      const baseAmount = weight * rate;
      const wastageAmount = (baseAmount * wastage) / 100;
      const itemTotal = baseAmount + wastageAmount + making + tax;
      
      return total + itemTotal;
    }, 0);

    return { totalWeight, totalAmount };
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('=== SUBMIT HANDLER TRIGGERED ===');
    console.log('isEditing:', isEditing);
    console.log('editingTransaction:', editingTransaction);
    console.log('formData:', formData);
    console.log('selectedCustomer:', selectedCustomer);
    console.log('items:', items);
    console.log('loading:', loading);

    try {
      setLoading(true);
      onError(null);

      if (items.length === 0) {
        console.error('Validation failed: No items');
        onError('Please add at least one item');
        return;
      }

      const hasValidItems = items.some(item => 
        item.itemName && parseFloat(item.weight) > 0 && parseFloat(item.ratePerGram) > 0
      );
      
      if (!hasValidItems) {
        console.error('Validation failed: Invalid items');
        onError('Please add at least one valid item with name, weight, and rate');
        return;
      }

      if (isEditing) {
        console.log('=== HANDLING UPDATE ===');
        
        if (!formData.customerId && !formData.supplierId) {
          console.error('Validation failed: No customer/supplier ID for editing');
          onError('Missing customer/supplier information for update');
          return;
        }
        
        const originalAdvance = parseFloat(formData.originalAdvanceAmount) || 0;
        const additionalPayment = parseFloat(formData.additionalPayment) || 0;
        const newTotalAdvance = originalAdvance + additionalPayment;
        
        console.log('Payment calculation:', {
          originalAdvance,
          additionalPayment,
          newTotalAdvance
        });
        
        const updateData = {
          transactionType: formData.transactionType,
          
          ...(formData.transactionType === 'SELL' && formData.customerId && { 
            customer: formData.customerId 
          }),
          ...(formData.transactionType === 'BUY' && formData.supplierId && { 
            supplier: formData.supplierId 
          }),
          
          items: items.map(item => ({
            name: item.itemName,
            itemName: item.itemName,
            description: item.description || "",
            weight: parseFloat(item.weight) || 0,
            purity: item.purity || "925",
            ratePerGram: parseFloat(item.ratePerGram) || 0,
            makingCharges: parseFloat(item.makingCharges) || 0,
            wastage: parseFloat(item.wastage) || 0,
            taxAmount: parseFloat(item.taxAmount) || 0,
            photos: item.photos || [],
            hallmarkNumber: item.hallmarkNumber || '',
            certificateNumber: item.certificateNumber || ''
          })),
          
          advanceAmount: newTotalAdvance,
          paymentMode: additionalPayment > 0 ? formData.additionalPaymentMode : formData.paymentMode,
          notes: formData.notes || "",
          billNumber: formData.billNumber || "",
          additionalPayment: additionalPayment,
          additionalPaymentMode: formData.additionalPaymentMode,
          originalAdvanceAmount: originalAdvance
        };

        console.log('=== SENDING UPDATE DATA ===');
        console.log('Transaction ID:', editingTransaction.id || editingTransaction._id);
        console.log('Update payload:', JSON.stringify(updateData, null, 2));

        const transactionId = editingTransaction.id || editingTransaction._id;
        if (!transactionId) {
          console.error('No transaction ID found');
          onError('Transaction ID is missing');
          return;
        }

        console.log('Calling ApiService.updateSilverTransaction...');
        const response = await ApiService.updateSilverTransaction(transactionId, updateData);
        
        console.log('=== UPDATE RESPONSE ===');
        console.log('Response:', response);
        
        if (response && (response.success !== false) && !response.error) {
          console.log('✅ Update successful');
          onSuccess();
        } else {
          const errorMessage = response?.message || response?.error || response?.data?.message || 'Failed to update transaction';
          console.error('❌ Update failed:', errorMessage);
          onError(errorMessage);
        }
      } else {
        console.log('=== HANDLING CREATE ===');
        
        const currentData = formData.transactionType === 'SELL' ? formData.customerData : formData.supplierData;
        if (!currentData.name) {
          console.error('Validation failed: No customer/supplier name');
          onError(`Please enter ${formData.transactionType === 'SELL' ? 'customer' : 'supplier'} name`);
          return;
        }
        
        const transactionData = {
          transactionType: formData.transactionType,
          items: items.map(item => ({
            itemName: item.itemName,
            description: item.description || '',
            purity: item.purity,
            weight: parseFloat(item.weight),
            ratePerGram: parseFloat(item.ratePerGram),
            makingCharges: parseFloat(item.makingCharges) || 0,
            wastage: parseFloat(item.wastage) || 0,
            taxAmount: parseFloat(item.taxAmount) || 0,
            hallmarkNumber: item.hallmarkNumber || '',
            certificateNumber: item.certificateNumber || '',
            photos: item.photos || []
          })),
          advanceAmount: parseFloat(formData.advanceAmount) || 0,
          paymentMode: formData.paymentMode,
          notes: formData.notes,
          billNumber: formData.billNumber,
          fetchCurrentRates: true
        };

        if (formData.transactionType === 'SELL') {
          if (selectedCustomer && selectedCustomer._id) {
            transactionData.customer = selectedCustomer._id;
          } else {
            transactionData.customer = formData.customerData;
          }
        } else {
          transactionData.supplier = formData.supplierData;
        }

        console.log('=== SENDING CREATE DATA ===');
        console.log('Create payload:', JSON.stringify(transactionData, null, 2));

        const response = await ApiService.createSilverTransaction(transactionData);
        
        console.log('=== CREATE RESPONSE ===');
        console.log('Response:', response);
        
        if (response && (response.success !== false) && !response.error) {
          console.log('✅ Create successful');
          onSuccess();
        } else {
          const errorMessage = response?.message || response?.error || response?.data?.message || 'Failed to create transaction';
          console.error('❌ Create failed:', errorMessage);
          onError(errorMessage);
        }
      }
    } catch (error) {
      console.error('=== EXCEPTION IN SUBMIT ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      const errorMessage = isEditing ? 'Failed to update transaction' : 'Failed to create transaction';
      onError(`${errorMessage}: ${error.message}`);
    } finally {
      console.log('=== SUBMIT HANDLER COMPLETE ===');
      setLoading(false);
    }
  };

  const handleButtonClick = (e) => {
    console.log('=== BUTTON CLICKED ===');
    console.log('Event:', e);
    console.log('Button disabled?', loading || items.length === 0);
    console.log('Items length:', items.length);
    console.log('Loading state:', loading);
    
    handleSubmit(e);
  };

  const handleTransactionTypeChange = (type) => {
    if (isEditing) return;
    
    setFormData(prev => ({
      ...prev,
      transactionType: type,
      customerId: '',
      supplierId: '',
      customerData: { name: '', phone: '', email: '', address: '' },
      supplierData: { name: '', phone: '', email: '', address: '' }
    }));
    setCustomerSearchTerm('');
    setSelectedCustomer(null);
    setShowCreateCustomer(false);
  };

  const { totalWeight, totalAmount } = calculateTotals();
  const totalPaidAmount = parseFloat(formData.originalAdvanceAmount) + parseFloat(formData.additionalPayment);
  const remainingAmount = totalAmount - totalPaidAmount;

  if (showCreateCustomer) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <CreateCustomerForm
            onCancel={() => {
              setShowCreateCustomer(false);
              setCreateCustomerInitialData({});
            }}
            onCustomerCreated={handleCustomerCreated}
            initialData={createCustomerInitialData}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit' : 'New'} Silver Transaction
              {isEditing && <span className="text-sm text-gray-500 ml-2">({formData.transactionType === 'SELL' ? 'Customer' : 'Supplier'} details are locked)</span>}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
              <div className="flex rounded-lg border border-gray-300">
                <button
                  type="button"
                  onClick={() => handleTransactionTypeChange('BUY')}
                  disabled={isEditing}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg ${
                    formData.transactionType === 'BUY'
                      ? 'bg-green-100 text-green-700 border-green-300'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isEditing && <Lock className="w-4 h-4 inline mr-1" />}
                  Buy Silver
                </button>
                <button
                  type="button"
                  onClick={() => handleTransactionTypeChange('SELL')}
                  disabled={isEditing}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg ${
                    formData.transactionType === 'SELL'
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isEditing && <Lock className="w-4 h-4 inline mr-1" />}
                  Sell Silver
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {formData.transactionType === 'SELL' ? 'Customer' : 'Supplier'} Details
                  {isEditing && <Lock className="w-4 h-4 inline ml-2 text-gray-500" />}
                </h3>
                
                {formData.transactionType === 'SELL' && !isEditing && (
                  <div className="relative">
                    <CustomerSearch
                      onCustomerSelect={handleCustomerSelect}
                      onCreateCustomer={handleCreateCustomer}
                      searchTerm={customerSearchTerm}
                      setSearchTerm={setCustomerSearchTerm}
                      disabled={isEditing}
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.transactionType === 'SELL' ? 'Customer' : 'Supplier'} Name *
                    </label>
                    <input
                      type="text"
                      name={formData.transactionType === 'SELL' ? 'customerData.name' : 'supplierData.name'}
                      value={formData.transactionType === 'SELL' ? formData.customerData.name : formData.supplierData.name}
                      onChange={handleInputChange}
                      disabled={isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent ${isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder={`Enter ${formData.transactionType === 'SELL' ? 'customer' : 'supplier'} name`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      name={formData.transactionType === 'SELL' ? 'customerData.phone' : 'supplierData.phone'}
                      value={formData.transactionType === 'SELL' ? formData.customerData.phone : formData.supplierData.phone}
                      onChange={handleInputChange}
                      disabled={isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent ${isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name={formData.transactionType === 'SELL' ? 'customerData.email' : 'supplierData.email'}
                      value={formData.transactionType === 'SELL' ? formData.customerData.email : formData.supplierData.email}
                      onChange={handleInputChange}
                      disabled={isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent ${isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <textarea
                      name={formData.transactionType === 'SELL' ? 'customerData.address' : 'supplierData.address'}
                      value={formData.transactionType === 'SELL' ? formData.customerData.address : formData.supplierData.address}
                      onChange={handleInputChange}
                      rows={3}
                      disabled={isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent ${isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Transaction Summary</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Items:</span>
                    <span className="font-medium">{items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Weight:</span>
                    <span className="font-medium">{totalWeight.toFixed(2)} grams</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm text-gray-600">Total Amount:</span>
                    <span className="font-bold text-lg">₹{totalAmount.toFixed(2)}</span>
                  </div>
                  
                  {isEditing && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Original Advance:</span>
                        <span className="font-medium">₹{formData.originalAdvanceAmount.toFixed(2)}</span>
                      </div>
                      {parseFloat(formData.additionalPayment) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Additional Payment:</span>
                          <span className="font-medium text-green-600">₹{parseFloat(formData.additionalPayment).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm text-gray-600">Total Paid:</span>
                        <span className="font-bold">₹{totalPaidAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Remaining:</span>
                        <span className={`font-bold ${remainingAmount <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{remainingAmount.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div>
              <MetalItemsManager
                items={items}
                onItemsChange={setItems}
                metalType="Silver"
                currentPrices={currentPrices}
                loading={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Payment (₹)</label>
                    <input
                      type="number"
                      name="additionalPayment"
                      value={formData.additionalPayment}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                      placeholder="Enter additional payment amount"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Payment Mode</label>
                    <select
                      name="additionalPaymentMode"
                      value={formData.additionalPaymentMode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                    >
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Original Advance</label>
                    <input
                      type="number"
                      value={formData.originalAdvanceAmount}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Advance Amount (₹)</label>
                    <input
                      type="number"
                      name="advanceAmount"
                      value={formData.advanceAmount}
                      onChange={handleInputChange}
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                    <select
                      name="paymentMode"
                      value={formData.paymentMode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                    >
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bill Number</label>
                    <input
                      type="text"
                      name="billNumber"
                      value={formData.billNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                    />
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                placeholder="Additional notes about the transaction..."
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-700">Total Amount:</span>
                <span className="text-2xl font-bold text-gray-900">₹{totalAmount.toFixed(2)}</span>
              </div>
              
              {isEditing ? (
                <>
                  <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                    <span>Original Advance:</span>
                    <span>₹{formData.originalAdvanceAmount.toFixed(2)}</span>
                  </div>
                  {parseFloat(formData.additionalPayment) > 0 && (
                    <div className="flex justify-between items-center mt-1 text-sm text-green-600">
                      <span>Additional Payment:</span>
                      <span>₹{parseFloat(formData.additionalPayment).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-1 text-sm font-medium text-gray-700 border-t pt-2">
                    <span>Total Paid:</span>
                    <span>₹{totalPaidAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-600">Remaining:</span>
                    <span className={`font-bold ${remainingAmount <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{remainingAmount.toFixed(2)}
                      {remainingAmount <= 0 && <span className="text-xs ml-1">(PAID)</span>}
                    </span>
                  </div>
                </>
              ) : (
                parseFloat(formData.advanceAmount) > 0 && (
                  <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                    <span>Remaining Amount:</span>
                    <span>₹{(totalAmount - parseFloat(formData.advanceAmount)).toFixed(2)}</span>
                  </div>
                )
              )}
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleButtonClick}
                disabled={loading || items.length === 0}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {isEditing ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  isEditing ? 'Update Transaction' : 'Save Transaction'
                )}
              </button>
            </div>

            {isEditing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Update Instructions:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• {formData.transactionType === 'SELL' ? 'Customer' : 'Supplier'} details are locked and cannot be modified</li>
                  <li>• You can modify items, quantities, rates, and other transaction details</li>
                  <li>• Add additional payments to complete remaining balance</li>
                  <li>• Transaction type cannot be changed</li>
                  <li>• All changes will be saved when you click "Update Transaction"</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SilverTransactionForm;