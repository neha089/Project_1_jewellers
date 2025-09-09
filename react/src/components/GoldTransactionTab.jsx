// GoldBuySellTab.jsx
import React, { useState } from 'react';
import { 
  Plus, 
  ShoppingCart, 
  TrendingUp,
  TrendingDown,
  Coins,
  Weight,
  Calendar,
  User,
  Receipt,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const GoldTransactionTab = ({ 
  goldTransactions = [], 
  customers = [], 
  onAddTransaction, 
  onUpdateTransaction, 
  onDeleteTransaction 
}) => {
  const [activeTab, setActiveTab] = useState('buy');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [purityFilter, setPurityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    type: 'buy',
    customerId: '',
    customerName: '',
    weight: '',
    purity: '24K',
    rate: '',
    amount: '',
    makingCharges: '',
    tax: '',
    finalAmount: '',
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    items: []
  });

  // Filter transactions based on active tab and filters
  const filteredTransactions = goldTransactions.filter(transaction => {
    const typeMatch = transaction.type === activeTab;
    const searchMatch = searchTerm === '' || 
      transaction.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const purityMatch = purityFilter === 'all' || transaction.purity === purityFilter;
    
    let dateMatch = true;
    if (dateFilter !== 'all') {
      const transactionDate = new Date(transaction.date);
      const today = new Date();
      
      switch (dateFilter) {
        case '7days':
          dateMatch = (today - transactionDate) <= 7 * 24 * 60 * 60 * 1000;
          break;
        case '30days':
          dateMatch = (today - transactionDate) <= 30 * 24 * 60 * 60 * 1000;
          break;
        case '90days':
          dateMatch = (today - transactionDate) <= 90 * 24 * 60 * 60 * 1000;
          break;
      }
    }
    
    return typeMatch && searchMatch && purityMatch && dateMatch;
  });

  // Calculate summary statistics
  const summary = {
    buy: {
      count: goldTransactions.filter(t => t.type === 'buy').length,
      totalWeight: goldTransactions.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.weight, 0),
      totalAmount: goldTransactions.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.finalAmount, 0),
      avgRate: goldTransactions.filter(t => t.type === 'buy').length > 0 ? 
        goldTransactions.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.rate, 0) / 
        goldTransactions.filter(t => t.type === 'buy').length : 0
    },
    sell: {
      count: goldTransactions.filter(t => t.type === 'sell').length,
      totalWeight: goldTransactions.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.weight, 0),
      totalAmount: goldTransactions.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.finalAmount, 0),
      avgRate: goldTransactions.filter(t => t.type === 'sell').length > 0 ? 
        goldTransactions.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.rate, 0) / 
        goldTransactions.filter(t => t.type === 'sell').length : 0
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Calculate final amount when weight, rate, making charges, or tax changes
      if (['weight', 'rate', 'makingCharges', 'tax'].includes(name)) {
        const weight = parseFloat(updated.weight) || 0;
        const rate = parseFloat(updated.rate) || 0;
        const makingCharges = parseFloat(updated.makingCharges) || 0;
        const tax = parseFloat(updated.tax) || 0;
        
        updated.amount = weight * rate;
        updated.finalAmount = updated.amount + makingCharges + tax;
      }
      
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const transactionData = {
      ...formData,
      id: editingTransaction ? editingTransaction.id : Date.now(),
      weight: parseFloat(formData.weight),
      rate: parseFloat(formData.rate),
      amount: parseFloat(formData.amount),
      makingCharges: parseFloat(formData.makingCharges) || 0,
      tax: parseFloat(formData.tax) || 0,
      finalAmount: parseFloat(formData.finalAmount)
    };

    if (editingTransaction) {
      onUpdateTransaction(transactionData);
    } else {
      onAddTransaction(transactionData);
    }

    // Reset form
    setFormData({
      type: activeTab,
      customerId: '',
      customerName: '',
      weight: '',
      purity: '24K',
      rate: '',
      amount: '',
      makingCharges: '',
      tax: '',
      finalAmount: '',
      invoiceNumber: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      items: []
    });
    setShowAddForm(false);
    setEditingTransaction(null);
  };

  const getPurityColor = (purity) => {
    switch (purity) {
      case '24K': return 'bg-yellow-100 text-yellow-800';
      case '22K': return 'bg-orange-100 text-orange-800';
      case '18K': return 'bg-amber-100 text-amber-800';
      case '14K': return 'bg-yellow-50 text-yellow-700';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const TransactionCard = ({ transaction }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${transaction.type === 'buy' ? 'bg-green-50' : 'bg-red-50'}`}>
            {transaction.type === 'buy' ? (
              <ArrowDownRight size={20} className="text-green-600" />
            ) : (
              <ArrowUpRight size={20} className="text-red-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {transaction.customerName || 'Walk-in Customer'}
            </h3>
            <p className="text-sm text-gray-500">
              Invoice: {transaction.invoiceNumber}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPurityColor(transaction.purity)}`}>
          {transaction.purity}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Final Amount</p>
          <p className="font-semibold text-green-600">₹{transaction.finalAmount?.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <Calendar size={14} />
          {new Date(transaction.date).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-1">
          <Weight size={14} />
          {transaction.weight}g {transaction.purity}
        </div>
      </div>

      {transaction.notes && (
        <div className="mb-4">
          <p className="text-sm text-gray-500">Notes</p>
          <p className="text-sm text-gray-900">{transaction.notes}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt size={14} className="text-gray-400" />
          <span className="text-sm text-gray-600">
            {transaction.type === 'buy' ? 'Purchase' : 'Sale'} Transaction
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedTransaction(transaction)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => {
              setEditingTransaction(transaction);
              setFormData({...transaction, date: transaction.date.split('T')[0]});
              setShowAddForm(true);
            }}
            className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDeleteTransaction(transaction.id)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  const TransactionForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {editingTransaction ? 'Edit' : 'Add'} Gold {activeTab === 'buy' ? 'Purchase' : 'Sale'}
            </h2>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingTransaction(null);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter customer name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Number
              </label>
              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter invoice number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (grams)
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purity
              </label>
              <select
                name="purity"
                value={formData.purity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="24K">24K</option>
                <option value="22K">22K</option>
                <option value="18K">18K</option>
                <option value="14K">14K</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate per gram (₹)
              </label>
              <input
                type="number"
                name="rate"
                value={formData.rate}
                onChange={handleInputChange}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Making Charges (₹)
              </label>
              <input
                type="number"
                name="makingCharges"
                value={formData.makingCharges}
                onChange={handleInputChange}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax (₹)
              </label>
              <input
                type="number"
                name="tax"
                value={formData.tax}
                onChange={handleInputChange}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Amount Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Amount Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Base Amount:</span>
                <span className="text-gray-900">₹{(parseFloat(formData.amount) || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Making Charges:</span>
                <span className="text-gray-900">₹{(parseFloat(formData.makingCharges) || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax:</span>
                <span className="text-gray-900">₹{(parseFloat(formData.tax) || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-gray-900">Final Amount:</span>
                <span className="text-green-600">₹{(parseFloat(formData.finalAmount) || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any additional notes..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium"
            >
              {editingTransaction ? 'Update' : 'Add'} Transaction
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingTransaction(null);
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const TransactionDetailModal = ({ transaction, onClose }) => {
    if (!transaction) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${transaction.type === 'buy' ? 'bg-green-50' : 'bg-red-50'}`}>
                  {transaction.type === 'buy' ? (
                    <ArrowDownRight size={20} className="text-green-600" />
                  ) : (
                    <ArrowUpRight size={20} className="text-red-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Gold {transaction.type === 'buy' ? 'Purchase' : 'Sale'} Details
                  </h2>
                  <p className="text-gray-600">{transaction.customerName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Weight</p>
                <p className="text-2xl font-bold text-gray-900">{transaction.weight}g</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Purity</p>
                <p className="text-2xl font-bold text-yellow-600">{transaction.purity}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Rate/gram</p>
                <p className="text-2xl font-bold text-blue-600">₹{transaction.rate?.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Final Amount</p>
                <p className="text-2xl font-bold text-green-600">₹{transaction.finalAmount?.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Transaction Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer:</span>
                    <span className="text-gray-900">{transaction.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Invoice:</span>
                    <span className="text-gray-900">{transaction.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="text-gray-900">{new Date(transaction.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className={`font-medium ${transaction.type === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'buy' ? 'Purchase' : 'Sale'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Financial Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Base Amount:</span>
                    <span className="text-gray-900">₹{transaction.amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Making Charges:</span>
                    <span className="text-gray-900">₹{transaction.makingCharges?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax:</span>
                    <span className="text-gray-900">₹{transaction.tax?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span className="text-gray-900">Final Amount:</span>
                    <span className="text-green-600">₹{transaction.finalAmount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {transaction.notes && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Notes</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-900">{transaction.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white border border-gray-200 rounded-xl p-2">
        <div className="flex">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'buy'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ArrowDownRight size={18} />
              Gold Purchase
            </div>
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'sell'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ArrowUpRight size={18} />
              Gold Sale
            </div>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${activeTab === 'buy' ? 'bg-green-50' : 'bg-red-50'}`}>
              <Receipt size={20} className={activeTab === 'buy' ? 'text-green-600' : 'text-red-600'} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{summary[activeTab].count}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Weight size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Weight</p>
              <p className="text-2xl font-bold text-gray-900">{summary[activeTab].totalWeight.toFixed(2)}g</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Coins size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{summary[activeTab].totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg. Rate</p>
              <p className="text-2xl font-bold text-gray-900">₹{summary[activeTab].avgRate.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <select
              value={purityFilter}
              onChange={(e) => setPurityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Purity</option>
              <option value="24K">24K</option>
              <option value="22K">22K</option>
              <option value="18K">18K</option>
              <option value="14K">14K</option>
            </select>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
            
            <button
              onClick={() => {
                setFormData({...formData, type: activeTab});
                setShowAddForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={20} />
              Add {activeTab === 'buy' ? 'Purchase' : 'Sale'}
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction, index) => (
            <TransactionCard key={index} transaction={transaction} />
          ))
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Coins size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Gold {activeTab === 'buy' ? 'Purchase' : 'Sale'} Records
            </h3>
            <p className="text-gray-500 mb-6">
              Get started by adding your first gold {activeTab === 'buy' ? 'purchase' : 'sale'} transaction
            </p>
            <button
              onClick={() => {
                setFormData({...formData, type: activeTab});
                setShowAddForm(true);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add First Transaction
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddForm && <TransactionForm />}
      {selectedTransaction && (
        <TransactionDetailModal 
          transaction={selectedTransaction} 
          onClose={() => setSelectedTransaction(null)} 
        />
      )}
    </div>
  );
};

export default GoldTransactionTab;