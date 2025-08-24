import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MessageSquare, 
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  User,
  Phone,
  ChevronRight,
  Filter,
  Plus,
  FileText,
  AlertCircle
} from 'lucide-react';

// Mock data
let mockTransactions = [
  {
    id: 1,
    customerId: 'CUST001',
    customerName: 'Neha Patel',
    customerPhone: '+91 9876543210',
    type: 'borrowed',
    amount: 100000,
    date: '2024-06-24',
    description: 'Gold jewelry purchase - wedding order'
  },
  {
    id: 2,
    customerId: 'CUST001',
    customerName: 'Neha Patel',
    customerPhone: '+91 9876543210',
    type: 'borrowed',
    amount: 50000,
    date: '2024-08-23',
    description: 'Additional jewelry items'
  },
  {
    id: 3,
    customerId: 'CUST001',
    customerName: 'Neha Patel',
    customerPhone: '+91 9876543210',
    type: 'borrowed',
    amount: 20000,
    date: '2024-08-24',
    description: 'Emergency gold loan'
  },
  {
    id: 4,
    customerId: 'CUST001',
    customerName: 'Neha Patel',
    customerPhone: '+91 9876543210',
    type: 'returned',
    amount: 25000,
    date: '2024-08-20',
    description: 'Partial payment'
  },
  {
    id: 5,
    customerId: 'CUST002',
    customerName: 'Raj Shah',
    customerPhone: '+91 9876543211',
    type: 'borrowed',
    amount: 75000,
    date: '2024-08-15',
    description: 'Gold loan for business'
  },
  {
    id: 6,
    customerId: 'CUST002',
    customerName: 'Raj Shah',
    customerPhone: '+91 9876543211',
    type: 'returned',
    amount: 30000,
    date: '2024-08-22',
    description: 'First installment payment'
  },
  {
    id: 7,
    customerId: 'CUST003',
    customerName: 'Priya Sharma',
    customerPhone: '+91 9876543212',
    type: 'lent',
    amount: 40000,
    date: '2024-08-10',
    description: 'Advance payment for custom jewelry order'
  },
  {
    id: 8,
    customerId: 'CUST004',
    customerName: 'Amit Kumar',
    customerPhone: '+91 9876543213',
    type: 'borrowed',
    amount: 25000,
    date: '2024-08-20',
    description: 'Gold purchase'
  }
];

// Utility functions
const getCustomerBalances = () => {
  const customerMap = {};
  
  mockTransactions.forEach(transaction => {
    if (!customerMap[transaction.customerId]) {
      customerMap[transaction.customerId] = {
        customerId: transaction.customerId,
        customerName: transaction.customerName,
        customerPhone: transaction.customerPhone,
        totalBorrowed: 0,
        totalReturned: 0,
        totalLent: 0,
        netBalance: 0,
        transactions: [],
        lastTransactionDate: null
      };
    }
    
    customerMap[transaction.customerId].transactions.push(transaction);
    
    if (transaction.type === 'borrowed') {
      customerMap[transaction.customerId].totalBorrowed += transaction.amount;
    } else if (transaction.type === 'returned') {
      customerMap[transaction.customerId].totalReturned += transaction.amount;
    } else if (transaction.type === 'lent') {
      customerMap[transaction.customerId].totalLent += transaction.amount;
    }
    
    const transactionDate = new Date(transaction.date);
    if (!customerMap[transaction.customerId].lastTransactionDate || 
        transactionDate > new Date(customerMap[transaction.customerId].lastTransactionDate)) {
      customerMap[transaction.customerId].lastTransactionDate = transaction.date;
    }
  });
  
  Object.values(customerMap).forEach(customer => {
    customer.netBalance = (customer.totalBorrowed - customer.totalReturned) - customer.totalLent;
    customer.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  });
  
  return Object.values(customerMap);
};

const getCustomerTransactionHistory = (customerId) => {
  const customer = getCustomerBalances().find(c => c.customerId === customerId);
  if (!customer) return [];
  
  const sortedTransactions = [...customer.transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  let runningBalance = 0;
  return sortedTransactions.map(transaction => {
    if (transaction.type === 'borrowed') {
      runningBalance += transaction.amount;
    } else if (transaction.type === 'returned') {
      runningBalance -= transaction.amount;
    } else if (transaction.type === 'lent') {
      runningBalance -= transaction.amount;
    }
    
    return {
      ...transaction,
      runningBalance
    };
  });
};

const getBusinessSummary = () => {
  const customers = getCustomerBalances();
  
  return {
    totalCustomers: customers.length,
    customersWithBalance: customers.filter(c => Math.abs(c.netBalance) > 0).length,
    totalMoneyOut: customers.reduce((sum, c) => sum + (c.netBalance > 0 ? c.netBalance : 0), 0),
    totalMoneyIn: customers.reduce((sum, c) => sum + (c.netBalance < 0 ? Math.abs(c.netBalance) : 0), 0),
    totalTransactions: mockTransactions.length
  };
};

const sendReminder = (customerPhone, amount, customerName) => {
  const message = `Dear ${customerName}, your outstanding balance is ₹${amount.toLocaleString()}. Please arrange for payment. Thank you!`;
  alert(`📱 Message sent to ${customerName}:\n\n${message}`);
  return { success: true, message: 'Reminder sent successfully' };
};

const getTimeAgo = (date) => {
  const now = new Date();
  const transactionDate = new Date(date);
  const diffTime = Math.abs(now - transactionDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return `${diffDays} days ago`;
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months ago`;
  return `${Math.ceil(diffDays / 365)} years ago`;
};

const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};

const Balances = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [businessSummary, setBusinessSummary] = useState({});

  useEffect(() => {
    loadCustomers();
    loadBusinessSummary();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, filterType]);

  const loadCustomers = () => {
    const customerBalances = getCustomerBalances();
    setCustomers(customerBalances);
  };

  const loadBusinessSummary = () => {
    const summary = getBusinessSummary();
    setBusinessSummary(summary);
  };

  const filterCustomers = () => {
    let filtered = customers.filter(customer =>
      customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customerPhone.includes(searchTerm)
    );

    if (filterType === 'receivable') {
      filtered = filtered.filter(customer => customer.netBalance > 0);
    } else if (filterType === 'payable') {
      filtered = filtered.filter(customer => customer.netBalance < 0);
    }

    filtered.sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance));
    setFilteredCustomers(filtered);
  };

  const handleSendReminder = (customer, e) => {
    e.stopPropagation();
    const amount = Math.abs(customer.netBalance);
    sendReminder(customer.customerPhone, amount, customer.customerName);
  };

  const handleCustomerClick = (customer) => {
    const history = getCustomerTransactionHistory(customer.customerId);
    setTransactionHistory(history);
    setSelectedCustomer(customer);
    setShowCustomerDetail(true);
  };

  // Customer Detail Page
  if (showCustomerDetail) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCustomerDetail(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">
                  {getInitials(selectedCustomer?.customerName)}
                </span>
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-slate-900">{selectedCustomer?.customerName}</h1>
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <Phone size={14} />
                  <span>{selectedCustomer?.customerPhone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Summary */}
        <div className="p-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Account Summary</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <TrendingUp size={16} className="text-white" />
                </div>
                <p className="text-red-700 text-xs font-medium mb-1">Total Borrowed</p>
                <p className="font-bold text-red-700 text-lg">{formatCurrency(selectedCustomer?.totalBorrowed)}</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <TrendingDown size={16} className="text-white" />
                </div>
                <p className="text-green-700 text-xs font-medium mb-1">Total Returned</p>
                <p className="font-bold text-green-700 text-lg">{formatCurrency(selectedCustomer?.totalReturned)}</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <DollarSign size={16} className="text-white" />
                </div>
                <p className="text-blue-700 text-xs font-medium mb-1">Net Balance</p>
                <p className={`font-bold text-lg ${selectedCustomer?.netBalance > 0 ? 'text-red-700' : selectedCustomer?.netBalance < 0 ? 'text-green-700' : 'text-slate-700'}`}>
                  {formatCurrency(Math.abs(selectedCustomer?.netBalance))}
                </p>
              </div>
            </div>

            {selectedCustomer?.netBalance > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={(e) => handleSendReminder(selectedCustomer, e)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare size={16} />
                  Send Reminder
                </button>
              </div>
            )}

            {selectedCustomer?.netBalance !== 0 && (
              <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className={selectedCustomer?.netBalance > 0 ? 'text-red-500' : 'text-green-500'} />
                  <span className="text-sm font-medium text-slate-700">
                    {selectedCustomer?.netBalance > 0 ? 
                      `Customer owes ${formatCurrency(selectedCustomer?.netBalance)}` : 
                      `You owe customer ${formatCurrency(Math.abs(selectedCustomer?.netBalance))}`
                    }
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FileText size={18} />
                Transaction History
              </h2>
            </div>
            
            <div className="divide-y divide-slate-100">
              {transactionHistory.map((transaction, index) => (
                <div key={transaction.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-3 h-3 rounded-full ${
                          transaction.type === 'borrowed' ? 'bg-red-500' :
                          transaction.type === 'returned' ? 'bg-green-500' : 'bg-blue-500'
                        }`}></div>
                        <span className="font-semibold text-slate-900">
                          {transaction.type === 'borrowed' ? 'Money Borrowed' :
                           transaction.type === 'returned' ? 'Payment Received' : 'Advance Given'}
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                          {transaction.type.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className={`text-xl font-bold mb-2 ${
                        transaction.type === 'borrowed' ? 'text-red-600' :
                        transaction.type === 'returned' ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {formatCurrency(transaction.amount)}
                      </p>
                      
                      <p className="text-slate-600 mb-2">{transaction.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{new Date(transaction.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{getTimeAgo(transaction.date)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <p className="text-xs text-slate-500 mb-1">Running Balance</p>
                      <p className={`font-bold text-lg ${
                        transaction.runningBalance > 0 ? 'text-red-600' : 
                        transaction.runningBalance < 0 ? 'text-green-600' : 'text-slate-600'
                      }`}>
                        {formatCurrency(Math.abs(transaction.runningBalance))}
                      </p>
                      <p className="text-xs text-slate-500">
                        {transaction.runningBalance > 0 ? 'Receivable' : 
                         transaction.runningBalance < 0 ? 'Payable' : 'Settled'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main List View
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
     
          
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-xl shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
                <span className="text-xs font-medium opacity-90">RECEIVABLE</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(businessSummary.totalMoneyOut || 0)}</p>
              <p className="text-xs opacity-90">Money to collect</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <TrendingDown size={16} />
                </div>
                <span className="text-xs font-medium opacity-90">PAYABLE</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(businessSummary.totalMoneyIn || 0)}</p>
              <p className="text-xs opacity-90">Money to pay</p>
            </div>
          </div>

      <div className="p-4">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by name, phone, or ID..."
            className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              filterType === 'all' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Customers ({customers.length})
          </button>
          <button
            onClick={() => setFilterType('receivable')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              filterType === 'receivable' 
                ? 'bg-red-500 text-white shadow-md' 
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Receivable ({customers.filter(c => c.netBalance > 0).length})
          </button>
          <button
            onClick={() => setFilterType('payable')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              filterType === 'payable' 
                ? 'bg-green-500 text-white shadow-md' 
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Payable ({customers.filter(c => c.netBalance < 0).length})
          </button>
        </div>

        {/* Customer List */}
        <div className="space-y-3">
          {filteredCustomers.map((customer) => (
            <div 
              key={customer.customerId}
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => handleCustomerClick(customer)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white text-sm font-bold">
                      {getInitials(customer.customerName)}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {customer.customerName}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span>{customer.customerId}</span>
                      <span>•</span>
                      <span>{getTimeAgo(customer.lastTransactionDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      customer.netBalance > 0 ? 'text-red-600' : 
                      customer.netBalance < 0 ? 'text-green-600' : 'text-slate-600'
                    }`}>
                      {formatCurrency(Math.abs(customer.netBalance))}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      {customer.netBalance > 0 ? 'TO COLLECT' : 
                       customer.netBalance < 0 ? 'TO PAY' : 'SETTLED'}
                    </p>
                  </div>
                  
                  {customer.netBalance > 0 && (
                    <button
                      onClick={(e) => handleSendReminder(customer, e)}
                      className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      title="Send Reminder"
                    >
                      <MessageSquare size={18} />
                    </button>
                  )}
                  
                  <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={24} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No customers found</h3>
            <p className="text-slate-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Balances;