import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, TrendingUp, TrendingDown, Calendar, User, Weight, DollarSign, Eye, Edit, Trash2, RefreshCw, AlertCircle, CheckCircle, X } from 'lucide-react';
import ApiService from '../services/api';
import CustomerSearch from '../components/CustomerSearch';// Import the CustomerSearch component

const SilverBuySell = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [viewingTransaction, setViewingTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [silverRates, setSilverRates] = useState({});
  const [summary, setSummary] = useState({ totalBuy: 0, totalSell: 0, netProfit: 0 });
  
  // Customer search states - simplified for CustomerSearch component
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCreateCustomerForm, setShowCreateCustomerForm] = useState(false);

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
    silverDetails: {
      purity: '925',
      weight: '',
      ratePerGram: '',
      wastage: 0,
      makingCharges: 0,
      taxAmount: 0
    },
    advanceAmount: 0,
    paymentMode: 'CASH',
    items: [],
    notes: '',
    billNumber: ''
  });

  // Helper function to get customer/supplier name from transaction
  const getPersonName = (transaction) => {
    if (transaction.transactionType === 'SELL' && transaction.customer) {
      return transaction.customer.name || 'N/A';
    }
    if (transaction.transactionType === 'BUY' && transaction.supplier) {
      return transaction.supplier.name || 'N/A';
    }
    return 'N/A';
  };

  // Helper function to get customer/supplier phone from transaction
  const getPersonPhone = (transaction) => {
    if (transaction.transactionType === 'SELL' && transaction.customer) {
      return transaction.customer.phone || '';
    }
    if (transaction.transactionType === 'BUY' && transaction.supplier) {
      return transaction.supplier.phone || '';
    }
    return '';
  };

  // Helper function to get customer/supplier email from transaction
  const getPersonEmail = (transaction) => {
    if (transaction.transactionType === 'SELL' && transaction.customer) {
      return transaction.customer.email || '';
    }
    if (transaction.transactionType === 'BUY' && transaction.supplier) {
      return transaction.supplier.email || '';
    }
    return '';
  };

  // Helper function to get customer/supplier address from transaction
  const getPersonAddress = (transaction) => {
    if (transaction.transactionType === 'SELL' && transaction.customer) {
      return transaction.customer.address || '';
    }
    if (transaction.transactionType === 'BUY' && transaction.supplier) {
      return transaction.supplier.address || '';
    }
    return '';
  };

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load transactions when filters change
  useEffect(() => {
    loadTransactions();
  }, [searchTerm, filterBy, currentPage]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadTransactions(),
        loadSilverRates(),
        loadSummary()
      ]);
    } catch (error) {
      setError('Failed to load initial data');
      console.error('Error loading initial data:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(filterBy !== 'all' && { transactionType: filterBy.toUpperCase() }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await ApiService.getTransactions(params);
      
      if (response.success) {
        setTransactions(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      setError('Failed to load transactions');
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSilverRates = async () => {
    try {
      const response = await ApiService.getCurrentRates();
      if (response.success) {
        setSilverRates(response.data);
      }
    } catch (error) {
      console.error('Error loading silver rates:', error);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await ApiService.getAnalytics();
      if (response.success && response.analytics) {
        const buyData = response.analytics.find(item => item.transactionType === 'BUY');
        const sellData = response.analytics.find(item => item.transactionType === 'SELL');
        
        setSummary({
          totalBuy: buyData?.overallAmount || 0,
          totalSell: sellData?.overallAmount || 0,
          netProfit: (sellData?.overallAmount || 0) - (buyData?.overallAmount || 0)
        });
      }
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  // Handle customer selection from CustomerSearch component
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer.name);
    
    if (formData.transactionType === 'SELL') {
      setFormData(prev => ({
        ...prev,
        customerId: customer._id,
        customerData: {
          name: customer.name,
          phone: customer.phone || '',
          email: customer.email || '',
          address: customer.address?.street ? 
            [customer.address.street, customer.address.city, customer.address.state, customer.address.pincode]
              .filter(Boolean).join(', ') : customer.address || ''
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        supplierId: customer._id,
        supplierData: {
          name: customer.name,
          phone: customer.phone || '',
          email: customer.email || '',
          address: customer.address?.street ? 
            [customer.address.street, customer.address.city, customer.address.state, customer.address.pincode]
              .filter(Boolean).join(', ') : customer.address || ''
        }
      }));
    }
    setShowCreateCustomerForm(false);
  };

  // Handle create new customer from CustomerSearch component
  const handleCreateCustomer = () => {
    setShowCreateCustomerForm(true);
    const newCustomerData = {
      name: customerSearchTerm || '',
      phone: '',
      email: '',
      address: ''
    };

    if (formData.transactionType === 'SELL') {
      setFormData(prev => ({
        ...prev,
        customerId: '',
        customerData: newCustomerData
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        supplierId: '',
        supplierData: newCustomerData
      }));
    }
    setSelectedCustomer(null);
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
      
      // Auto-update rate when purity changes
      if (name === 'silverDetails.purity' && silverRates[`${value} Silver`]) {
        setFormData(prev => ({
          ...prev,
          silverDetails: {
            ...prev.silverDetails,
            ratePerGram: silverRates[`${value} Silver`]
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const calculateTotal = () => {
    const { weight, ratePerGram, wastage, makingCharges, taxAmount } = formData.silverDetails;
    const weightNum = parseFloat(weight) || 0;
    const rateNum = parseFloat(ratePerGram) || 0;
    const wastageNum = parseFloat(wastage) || 0;
    const makingChargesNum = parseFloat(makingCharges) || 0;
    const taxAmountNum = parseFloat(taxAmount) || 0;
    
    const baseAmount = weightNum * rateNum;
    const wastageAmount = (baseAmount * wastageNum) / 100;
    const total = baseAmount + wastageAmount + makingChargesNum + taxAmountNum;
    
    return total.toFixed(2);
  };

  const resetForm = () => {
    setFormData({
      transactionType: 'BUY',
      customerId: '',
      supplierId: '',
      customerData: { name: '', phone: '', email: '', address: '' },
      supplierData: { name: '', phone: '', email: '', address: '' },
      silverDetails: { purity: '925', weight: '', ratePerGram: '', wastage: 0, makingCharges: 0, taxAmount: 0 },
      advanceAmount: 0,
      paymentMode: 'CASH',
      items: [],
      notes: '',
      billNumber: ''
    });
    setSelectedCustomer(null);
    setCustomerSearchTerm('');
    setShowCreateCustomerForm(false);
    setEditingTransaction(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!formData.silverDetails.weight || !formData.silverDetails.ratePerGram) {
        setError('Please fill in all required silver details');
        return;
      }

      const currentData = formData.transactionType === 'SELL' ? formData.customerData : formData.supplierData;
      if (!currentData.name) {
        setError('Please select or enter customer/supplier details');
        return;
      }

      // Prepare the data according to API structure
      const transactionData = {
        transactionType: formData.transactionType,
        ...(formData.transactionType === 'SELL' && {
          customerId: formData.customerId || null,
          customer: formData.customerData
        }),
        ...(formData.transactionType === 'BUY' && {
          supplierId: formData.supplierId || null,
          supplier: formData.supplierData
        }),
        silverDetails: {
          purity: formData.silverDetails.purity,
          weight: parseFloat(formData.silverDetails.weight),
          ratePerGram: parseFloat(formData.silverDetails.ratePerGram),
          wastage: parseFloat(formData.silverDetails.wastage) || 0,
          makingCharges: parseFloat(formData.silverDetails.makingCharges) || 0,
          taxAmount: parseFloat(formData.silverDetails.taxAmount) || 0
        },
        advanceAmount: parseFloat(formData.advanceAmount) || 0,
        paymentMode: formData.paymentMode,
        items: formData.items,
        notes: formData.notes,
        billNumber: formData.billNumber
      };

      let response;
      if (editingTransaction) {
        // Use the correct ID field from the API response
        response = await ApiService.updateTransaction(editingTransaction.id, transactionData);
      } else {
        response = await ApiService.createTransaction(transactionData);
      }
      
      if (response.success) {
        resetForm();
        setShowForm(false);
        setError(null);
        
        // Reload data
        await Promise.all([loadTransactions(), loadSummary()]);
      }
    } catch (error) {
      setError(editingTransaction ? 'Failed to update transaction' : 'Failed to create transaction');
      console.error('Error saving transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    
    // Populate form with existing data using the correct field mappings
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
      silverDetails: {
        purity: transaction.silverDetails?.purity || '925',
        weight: transaction.silverDetails?.weight || '',
        ratePerGram: transaction.silverDetails?.ratePerGram || '',
        wastage: transaction.silverDetails?.wastage || 0,
        makingCharges: transaction.silverDetails?.makingCharges || 0,
        taxAmount: transaction.silverDetails?.taxAmount || 0
      },
      advanceAmount: transaction.advanceAmount || 0,
      paymentMode: transaction.paymentMode || 'CASH',
      items: transaction.items || [],
      notes: transaction.notes || '',
      billNumber: transaction.invoiceNumber || ''
    });
    
    // Set customer search
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
    
    setShowForm(true);
  };

  const handleView = (transaction) => {
    setViewingTransaction(transaction);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        setLoading(true);
        // Use the correct ID field from the API response
        const response = await ApiService.deleteTransaction(id);
        
        if (response.success) {
          await Promise.all([loadTransactions(), loadSummary()]);
        }
      } catch (error) {
        setError('Failed to delete transaction');
        console.error('Error deleting transaction:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const refreshData = async () => {
    await loadInitialData();
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-600" />
          <span className="text-gray-600">Loading silver transactions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Silver Buy/Sell</h1>
            <p className="text-gray-600">Manage your silver transactions</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={refreshData}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Transaction
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <span className="text-red-700">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold text-gray-900">₹{summary.totalBuy.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">₹{summary.totalSell.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-gray-700" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold text-gray-900">₹{summary.netProfit.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Silver Rates Display */}
        {Object.keys(silverRates).length > 0 && (
          <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-lg p-6 mb-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Today's Silver Rates</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(silverRates).map(([type, rate]) => (
                <div key={type} className="text-center">
                  <p className="text-sm opacity-80">{type}</p>
                  <p className="text-xl font-bold">₹{rate}/g</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer name, bill number..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
              >
                <option value="all">All Transactions</option>
                <option value="buy">Buy Only</option>
                <option value="sell">Sell Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer/Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Silver Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg ${
                          transaction.transactionType === 'BUY' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          {transaction.transactionType === 'BUY' ? 
                            <TrendingUp className="w-4 h-4 text-green-600" /> :
                            <TrendingDown className="w-4 h-4 text-blue-600" />
                          }
                        </div>
                        <div className="ml-3">
                          <span className={`text-sm font-medium capitalize ${
                            transaction.transactionType === 'BUY' ? 'text-green-700' : 'text-blue-700'
                          }`}>
                            {transaction.transactionType.toLowerCase()}
                          </span>
                          {transaction.invoiceNumber && (
                            <div className="text-xs text-gray-500">#{transaction.invoiceNumber}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm text-gray-900">{getPersonName(transaction)}</div>
                          {getPersonPhone(transaction) && (
                            <div className="text-xs text-gray-500">{getPersonPhone(transaction)}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{transaction.silverDetails?.purity || 'N/A'} Purity</div>
                        <div className="text-gray-500 flex items-center">
                          <Weight className="w-3 h-3 mr-1" />
                          {transaction.silverDetails?.weight || 0}g @ ₹{transaction.silverDetails?.ratePerGram || 0}/g
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₹{transaction.totalAmount?.toLocaleString() || '0'}</div>
                      {transaction.advanceAmount > 0 && (
                        <div className="text-xs text-gray-500">Advance: ₹{transaction.advanceAmount}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.paymentStatus === 'PAID' 
                          ? 'bg-green-100 text-green-800' 
                          : transaction.paymentStatus === 'PARTIAL'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.paymentStatus || 'PENDING'}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">{transaction.paymentMode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {transaction.formattedDate || new Date(transaction.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleView(transaction)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEdit(transaction)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit Transaction"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(transaction.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transaction Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingTransaction ? 'Edit' : 'New'} Silver Transaction
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Transaction Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                    <div className="flex rounded-lg border border-gray-300">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, transactionType: 'BUY' }));
                          setCustomerSearchTerm('');
                          setSelectedCustomer(null);
                          setShowCreateCustomerForm(false);
                        }}
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg ${
                          formData.transactionType === 'BUY'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Buy Silver
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, transactionType: 'SELL' }));
                          setCustomerSearchTerm('');
                          setSelectedCustomer(null);
                          setShowCreateCustomerForm(false);
                        }}
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg ${
                          formData.transactionType === 'SELL'
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Sell Silver
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer/Supplier Search using CustomerSearch Component */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {formData.transactionType === 'SELL' ? 'Customer' : 'Supplier'} Details
                      </h3>
                      
                      {/* Use CustomerSearch Component */}
                      {!showCreateCustomerForm ? (
                        <CustomerSearch
                          onCustomerSelect={handleCustomerSelect}
                          onCreateCustomer={handleCreateCustomer}
                          searchTerm={customerSearchTerm}
                          setSearchTerm={setCustomerSearchTerm}
                        />
                      ) : (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-medium text-blue-900">
                              Create New {formData.transactionType === 'SELL' ? 'Customer' : 'Supplier'}
                            </h4>
                            <button
                              type="button"
                              onClick={() => {
                                setShowCreateCustomerForm(false);
                                setCustomerSearchTerm('');
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm text-blue-700 mb-4">
                            Fill in the details below to create a new {formData.transactionType === 'SELL' ? 'customer' : 'supplier'}.
                          </p>
                        </div>
                      )}

                      {/* Customer/Supplier Details Form - Always show when creating new or editing */}
                      {(showCreateCustomerForm || selectedCustomer) && (
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <input
                              type="tel"
                              name={formData.transactionType === 'SELL' ? 'customerData.phone' : 'supplierData.phone'}
                              value={formData.transactionType === 'SELL' ? formData.customerData.phone : formData.supplierData.phone}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                              type="email"
                              name={formData.transactionType === 'SELL' ? 'customerData.email' : 'supplierData.email'}
                              value={formData.transactionType === 'SELL' ? formData.customerData.email : formData.supplierData.email}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                            <textarea
                              name={formData.transactionType === 'SELL' ? 'customerData.address' : 'supplierData.address'}
                              value={formData.transactionType === 'SELL' ? formData.customerData.address : formData.supplierData.address}
                              onChange={handleInputChange}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Silver Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Silver Details</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Purity *</label>
                        <select
                          name="silverDetails.purity"
                          value={formData.silverDetails.purity}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                          required
                        >
                          <option value="800">800 Silver</option>
                          <option value="925">925 Sterling</option>
                          <option value="950">950 Silver</option>
                          <option value="999">999 Fine</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Weight (grams) *</label>
                        <input
                          type="number"
                          name="silverDetails.weight"
                          value={formData.silverDetails.weight}
                          onChange={handleInputChange}
                          step="0.1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rate per gram (₹) *</label>
                        <input
                          type="number"
                          name="silverDetails.ratePerGram"
                          value={formData.silverDetails.ratePerGram}
                          onChange={handleInputChange}
                          step="0.1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Wastage (%)</label>
                        <input
                          type="number"
                          name="silverDetails.wastage"
                          value={formData.silverDetails.wastage}
                          onChange={handleInputChange}
                          step="0.1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Making Charges (₹)</label>
                        <input
                          type="number"
                          name="silverDetails.makingCharges"
                          value={formData.silverDetails.makingCharges}
                          onChange={handleInputChange}
                          step="0.1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tax Amount (₹)</label>
                        <input
                          type="number"
                          name="silverDetails.taxAmount"
                          value={formData.silverDetails.taxAmount}
                          onChange={handleInputChange}
                          step="0.1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  {/* Total Calculation */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Base Amount: ₹{((parseFloat(formData.silverDetails.weight) || 0) * (parseFloat(formData.silverDetails.ratePerGram) || 0)).toFixed(2)}</div>
                      <div>Wastage: ₹{(((parseFloat(formData.silverDetails.weight) || 0) * (parseFloat(formData.silverDetails.ratePerGram) || 0) * (parseFloat(formData.silverDetails.wastage) || 0)) / 100).toFixed(2)}</div>
                      <div>Making Charges: ₹{parseFloat(formData.silverDetails.makingCharges) || 0}</div>
                      <div>Tax: ₹{parseFloat(formData.silverDetails.taxAmount) || 0}</div>
                    </div>
                    <hr className="my-3" />
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-700">Total Amount:</span>
                      <span className="text-2xl font-bold text-gray-900">₹{calculateTotal()}</span>
                    </div>
                    {parseFloat(formData.advanceAmount) > 0 && (
                      <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                        <span>Remaining Amount:</span>
                        <span>₹{(parseFloat(calculateTotal()) - parseFloat(formData.advanceAmount)).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        resetForm();
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          {editingTransaction ? 'Updating...' : 'Saving...'}
                        </>
                      ) : (
                        editingTransaction ? 'Update Transaction' : 'Save Transaction'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Transaction Modal */}
        {viewingTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
                  <button
                    onClick={() => setViewingTransaction(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Transaction Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Info</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-500">Type:</span>
                          <div className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ml-2 ${
                            viewingTransaction.transactionType === 'BUY' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {viewingTransaction.transactionType}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Invoice Number:</span>
                          <span className="ml-2 text-sm text-gray-900">{viewingTransaction.invoiceNumber || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Date:</span>
                          <span className="ml-2 text-sm text-gray-900">{viewingTransaction.formattedDate || new Date(viewingTransaction.date).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Payment Mode:</span>
                          <span className="ml-2 text-sm text-gray-900">{viewingTransaction.paymentMode}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Payment Status:</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                            viewingTransaction.paymentStatus === 'PAID' 
                              ? 'bg-green-100 text-green-800' 
                              : viewingTransaction.paymentStatus === 'PARTIAL'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {viewingTransaction.paymentStatus || 'PENDING'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {viewingTransaction.transactionType === 'SELL' ? 'Customer' : 'Supplier'} Details
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-500">Name:</span>
                          <span className="ml-2 text-sm text-gray-900">{getPersonName(viewingTransaction)}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Phone:</span>
                          <span className="ml-2 text-sm text-gray-900">{getPersonPhone(viewingTransaction) || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Email:</span>
                          <span className="ml-2 text-sm text-gray-900">{getPersonEmail(viewingTransaction) || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Address:</span>
                          <span className="ml-2 text-sm text-gray-900">{getPersonAddress(viewingTransaction) || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Silver Details */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Silver Details</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Purity:</span>
                          <span className="ml-2 font-medium">{viewingTransaction.silverDetails?.purity || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Weight:</span>
                          <span className="ml-2 font-medium">{viewingTransaction.silverDetails?.weight || 0}g</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Rate:</span>
                          <span className="ml-2 font-medium">₹{viewingTransaction.silverDetails?.ratePerGram || 0}/g</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Wastage:</span>
                          <span className="ml-2 font-medium">{viewingTransaction.silverDetails?.wastage || 0}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Making Charges:</span>
                          <span className="ml-2 font-medium">₹{viewingTransaction.silverDetails?.makingCharges || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Tax:</span>
                          <span className="ml-2 font-medium">₹{viewingTransaction.silverDetails?.taxAmount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amount Details */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Amount Details</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="text-xl font-bold text-gray-900">₹{viewingTransaction.totalAmount?.toLocaleString() || '0'}</span>
                      </div>
                      {viewingTransaction.advanceAmount > 0 && (
                        <>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">Advance Paid:</span>
                            <span className="text-green-600 font-medium">₹{viewingTransaction.advanceAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Remaining:</span>
                            <span className="text-red-600 font-medium">₹{(viewingTransaction.totalAmount - viewingTransaction.advanceAmount).toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  {viewingTransaction.items && viewingTransaction.items.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Items</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        {viewingTransaction.items.map((item, index) => (
                          <div key={item.id || index} className="border-b border-gray-200 pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">{item.name}</h4>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                )}
                                <div className="text-sm text-gray-500 mt-1">
                                  Weight: {item.formattedWeight || item.weight + 'g'} | 
                                  Purity: {item.purity} | 
                                  Making: ₹{item.makingCharges || 0}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-medium text-gray-900">
                                  {item.formattedValue || '₹' + (item.itemValue || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {viewingTransaction.notes && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700">{viewingTransaction.notes}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-4 pt-4">
                    <button
                      onClick={() => setViewingTransaction(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setViewingTransaction(null);
                        handleEdit(viewingTransaction);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Edit Transaction
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && transactions.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <DollarSign className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first silver transaction.</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Transaction
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SilverBuySell;