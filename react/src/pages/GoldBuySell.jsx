import React, { useState } from 'react';
import { Plus, Search, Filter, TrendingUp, TrendingDown, Calendar, User, Weight, DollarSign, Eye, Edit, Trash2, Crown } from 'lucide-react';

const GoldBuySell = () => {
  const [activeTab, setActiveTab] = useState('buy');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');

  // Mock data for gold transactions
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      type: 'buy',
      customerName: 'Rajesh Patel',
      goldType: '22K',
      weight: 25.5,
      rate: 5850,
      amount: 149175,
      date: '2024-03-15',
      status: 'completed'
    },
    {
      id: 2,
      type: 'sell',
      customerName: 'Priya Sharma',
      goldType: '24K',
      weight: 15.2,
      rate: 6200,
      amount: 94240,
      date: '2024-03-14',
      status: 'completed'
    },
    {
      id: 3,
      type: 'buy',
      customerName: 'Amit Kumar',
      goldType: '18K',
      weight: 30.0,
      rate: 4800,
      amount: 144000,
      date: '2024-03-13',
      status: 'pending'
    }
  ]);

  const [formData, setFormData] = useState({
    type: 'buy',
    customerName: '',
    phoneNumber: '',
    goldType: '22K',
    weight: '',
    rate: '',
    makingCharges: '',
    discount: '',
    notes: ''
  });

  const goldTypes = ['18K', '22K', '24K'];
  const goldRates = {
    '18K': 4800,
    '22K': 5850,
    '24K': 6200
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'goldType' && { rate: goldRates[value] })
    }));
  };

  const calculateTotal = () => {
    const weight = parseFloat(formData.weight) || 0;
    const rate = parseFloat(formData.rate) || 0;
    const makingCharges = parseFloat(formData.makingCharges) || 0;
    const discount = parseFloat(formData.discount) || 0;
    
    const baseAmount = weight * rate;
    const total = baseAmount + makingCharges - discount;
    return total.toFixed(2);
  };

  const handleSubmit = () => {
    const newTransaction = {
      id: transactions.length + 1,
      type: formData.type,
      customerName: formData.customerName,
      goldType: formData.goldType,
      weight: parseFloat(formData.weight),
      rate: parseFloat(formData.rate),
      amount: parseFloat(calculateTotal()),
      date: new Date().toISOString().split('T')[0],
      status: 'completed'
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    setFormData({
      type: activeTab,
      customerName: '',
      phoneNumber: '',
      goldType: '22K',
      weight: '',
      rate: goldRates['22K'],
      makingCharges: '',
      discount: '',
      notes: ''
    });
    setShowForm(false);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterBy === 'all' || transaction.type === filterBy;
    return matchesSearch && matchesFilter;
  });

  const totalBuyAmount = transactions.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.amount, 0);
  const totalSellAmount = transactions.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className=" p-6 mb-6">
           
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Transaction
            </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalBuyAmount.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-gray-900">₹{totalSellAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold text-gray-900">₹{(totalSellAmount - totalBuyAmount).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Gold Rates Display */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-700 rounded-lg p-6 mb-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Today's Silver Rates</h3>
          <div className="grid grid-cols md:grid-cols-4 gap-4">
            {Object.entries(goldRates).map(([type, rate]) => (
              <div key={type} className="text-center">
                <p className="text-sm opacity-80">{type}</p>
                <p className="text-xl font-bold">₹{rate}/g</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gold Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg ${
                          transaction.type === 'buy' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          {transaction.type === 'buy' ? 
                            <TrendingUp className={`w-4 h-4 ${transaction.type === 'buy' ? 'text-green-600' : 'text-blue-600'}`} /> :
                            <TrendingDown className="w-4 h-4 text-blue-600" />
                          }
                        </div>
                        <span className={`ml-3 text-sm font-medium capitalize ${
                          transaction.type === 'buy' ? 'text-green-700' : 'text-blue-700'
                        }`}>
                          {transaction.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{transaction.customerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{transaction.goldType}</div>
                        <div className="text-gray-500 flex items-center">
                          <Weight className="w-3 h-3 mr-1" />
                          {transaction.weight}g @ ₹{transaction.rate.toLocaleString()}/g
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">₹{transaction.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(transaction.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Crown className="w-6 h-6 text-yellow-600 mr-2" />
                    New Gold Transaction
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Transaction Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                    <div className="flex rounded-lg border border-gray-300">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: 'buy' }))}
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg ${
                          formData.type === 'buy'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Buy Gold
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: 'sell' }))}
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg ${
                          formData.type === 'sell'
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Sell Gold
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Details */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                      <input
                        type="text"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                    </div>

                    {/* Gold Details */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gold Type *</label>
                      <select
                        name="goldType"
                        value={formData.goldType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        required
                      >
                        {goldTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Weight (grams) *</label>
                      <input
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rate per gram (₹) *</label>
                      <input
                        type="number"
                        name="rate"
                        value={formData.rate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Making Charges (₹)</label>
                      <input
                        type="number"
                        name="makingCharges"
                        value={formData.makingCharges}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Discount (₹)</label>
                      <input
                        type="number"
                        name="discount"
                        value={formData.discount}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="Additional notes about the transaction..."
                    />
                  </div>

                  {/* Total Calculation */}
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-700">Total Amount:</span>
                      <span className="text-2xl font-bold text-yellow-600">₹{calculateTotal()}</span>
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Save Transaction
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoldBuySell;