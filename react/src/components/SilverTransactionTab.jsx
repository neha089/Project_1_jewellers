// SilverTransactionTab.jsx - Complete File
import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Plus,
  Search,
  Filter,
  Calendar,
  Weight,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  CircleDot,
  BarChart3,
  Zap,
  Download,
  FileText
} from 'lucide-react';

const SilverTransactionTab = ({ transactions = [], customerId, onRefresh }) => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all');

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const typeMatch = typeFilter === 'all' || transaction.type === typeFilter;
    const searchMatch = searchTerm === '' || 
      transaction.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let dateMatch = true;
    if (dateRange !== 'all') {
      const transactionDate = new Date(transaction.date);
      const today = new Date();
      
      switch (dateRange) {
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
    
    return typeMatch && searchMatch && dateMatch;
  });

  // Calculate summary statistics
  const summary = {
    totalBought: transactions.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.weight, 0),
    totalSold: transactions.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.weight, 0),
    totalBuyAmount: transactions.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.amount, 0),
    totalSellAmount: transactions.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.amount, 0),
    netWeight: transactions.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.weight, 0) - 
               transactions.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.weight, 0),
    transactionCount: transactions.length,
    avgBuyRate: transactions.filter(t => t.type === 'buy').length > 0 ? 
                transactions.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.rate, 0) / 
                transactions.filter(t => t.type === 'buy').length : 0,
    avgSellRate: transactions.filter(t => t.type === 'sell').length > 0 ? 
                 transactions.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.rate, 0) / 
                 transactions.filter(t => t.type === 'sell').length : 0
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'buy': return 'text-green-600';
      case 'sell': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeIcon = (type) => {
    return type === 'buy' ? ArrowDownRight : ArrowUpRight;
  };

  const TransactionCard = ({ transaction }) => {
    const TypeIcon = getTypeIcon(transaction.type);
    const profit = transaction.type === 'sell' ? 
      transaction.amount - (transaction.costPrice || transaction.amount * 0.95) : 0;
    
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${transaction.type === 'buy' ? 'bg-green-50' : 'bg-red-50'}`}>
              <TypeIcon size={20} className={getTypeColor(transaction.type)} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {transaction.type === 'buy' ? 'Silver Purchase' : 'Silver Sale'}
              </h3>
              <p className="text-sm text-gray-500">
                Invoice: {transaction.invoiceNumber}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
              Silver 999
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Weight</p>
            <p className="font-semibold text-gray-900">{transaction.weight}g</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Rate per gram</p>
            <p className="font-semibold text-gray-900">₹{transaction.rate?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="font-semibold text-gray-900">₹{transaction.amount?.toLocaleString()}</p>
          </div>
          {transaction.type === 'sell' && profit > 0 && (
            <div>
              <p className="text-sm text-gray-500">Profit/Loss</p>
              <p className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{Math.abs(profit)?.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            {new Date(transaction.date).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <Receipt size={14} />
            {transaction.invoiceNumber}
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
            <Weight size={14} className="text-gray-400" />
            <span className="text-sm text-gray-600">
              {transaction.weight}g of Pure Silver
            </span>
          </div>
          <button
            onClick={() => setSelectedTransaction(transaction)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye size={14} />
            View Details
          </button>
        </div>
      </div>
    );
  };

  const TransactionDetailModal = ({ transaction, onClose }) => {
    if (!transaction) return null;

    const profit = transaction.type === 'sell' ? 
      transaction.amount - (transaction.costPrice || transaction.amount * 0.95) : 0;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${transaction.type === 'buy' ? 'bg-green-50' : 'bg-red-50'}`}>
                  {React.createElement(getTypeIcon(transaction.type), { 
                    size: 20, 
                    className: getTypeColor(transaction.type) 
                  })}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {transaction.type === 'buy' ? 'Silver Purchase' : 'Silver Sale'}
                  </h2>
                  <p className="text-gray-600">Invoice: {transaction.invoiceNumber}</p>
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
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Purity</p>
                <p className="text-2xl font-bold text-gray-600">999</p>
                <p className="text-xs text-gray-500">Silver</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Rate/gram</p>
                <p className="text-2xl font-bold text-blue-600">₹{transaction.rate?.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">₹{transaction.amount?.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Transaction Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="text-gray-900">{new Date(transaction.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className={`font-medium ${getTypeColor(transaction.type)}`}>
                      {transaction.type === 'buy' ? 'Purchase' : 'Sale'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Invoice Number:</span>
                    <span className="text-gray-900">{transaction.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Silver Type:</span>
                    <span className="text-gray-900">999 Fine Silver</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Financial Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Base Amount:</span>
                    <span className="text-gray-900">₹{transaction.amount?.toLocaleString()}</span>
                  </div>
                  {transaction.makingCharges && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Making Charges:</span>
                      <span className="text-gray-900">₹{transaction.makingCharges?.toLocaleString()}</span>
                    </div>
                  )}
                  {transaction.tax && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tax:</span>
                      <span className="text-gray-900">₹{transaction.tax?.toLocaleString()}</span>
                    </div>
                  )}
                  {transaction.type === 'sell' && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Profit/Loss:</span>
                      <span className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profit >= 0 ? '+' : ''}₹{profit?.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {transaction.notes && (
              <div className="mb-6">
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
      {/* Summary Cards */}
      <div className="grid grid-cols md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <ArrowDownRight size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Bought</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalBought.toFixed(2)}g</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Amount: ₹{summary.totalBuyAmount.toLocaleString()}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <ArrowUpRight size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Sold</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalSold.toFixed(2)}g</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Amount: ₹{summary.totalSellAmount.toLocaleString()}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Weight size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Net Silver</p>
              <p className="text-2xl font-bold text-gray-900">{summary.netWeight.toFixed(2)}g</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Current Holdings</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <BarChart3 size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{summary.transactionCount}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">All time</p>
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
                placeholder="Search by invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="buy">Purchase</option>
              <option value="sell">Sale</option>
            </select>
            
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
            
            <button
              onClick={() => setShowAddTransaction(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={20} />
              Add Transaction
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
            <CircleDot size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Silver Transactions</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first silver transaction</p>
            <button
              onClick={() => setShowAddTransaction(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add First Transaction
            </button>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal 
          transaction={selectedTransaction} 
          onClose={() => setSelectedTransaction(null)} 
        />
      )}
    </div>
  );
};

export default SilverTransactionTab;