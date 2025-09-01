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
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import ApiService from '../services/api.js';

const Balances = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [businessSummary, setBusinessSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, filterType]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([loadCustomers(), loadBusinessSummary()]);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      // Get all customers
      const customersResponse = await ApiService.getAllCustomers(1, 1000);
      
      if (!customersResponse.success || !customersResponse.data?.customers) {
        throw new Error('Failed to load customers');
      }

      const customersData = customersResponse.data.customers;
      
      // Calculate balances for each customer by getting their loans and payments
      const customerBalances = await Promise.all(
        customersData.map(async (customer) => {
          try {
            // Get gold loans and regular loans for this customer
            const [goldLoansResponse, loansResponse] = await Promise.all([
              ApiService.getGoldLoansByCustomer(customer._id).catch(() => ({ data: { loans: [] } })),
              ApiService.getLoansByCustomer(customer._id).catch(() => ({ data: { loans: [] } }))
            ]);

            const goldLoans = goldLoansResponse.data?.loans || [];
            const regularLoans = loansResponse.data?.loans || [];

            // Calculate totals from gold loans
            let totalBorrowed = 0;
            let totalReturned = 0;
            let totalLent = 0;
            let lastTransactionDate = customer.createdAt;

            // Process gold loans
            goldLoans.forEach(loan => {
              const principal = (loan.principalPaise || 0) / 100;
              const totalPaid = (loan.totalPaidPaise || 0) / 100;
              
              totalBorrowed += principal;
              totalReturned += totalPaid;
              
              if (loan.updatedAt && new Date(loan.updatedAt) > new Date(lastTransactionDate)) {
                lastTransactionDate = loan.updatedAt;
              }
            });

            // Process regular loans
            regularLoans.forEach(loan => {
              const principal = (loan.principalPaise || 0) / 100;
              const totalPaid = (loan.totalPaidPaise || 0) / 100;
              
              if (loan.direction === 'INCOMING') {
                totalBorrowed += principal;
                totalReturned += totalPaid;
              } else if (loan.direction === 'OUTGOING') {
                totalLent += principal;
                // For outgoing loans, payments reduce what they owe us
                totalLent -= totalPaid;
              }
              
              if (loan.updatedAt && new Date(loan.updatedAt) > new Date(lastTransactionDate)) {
                lastTransactionDate = loan.updatedAt;
              }
            });

            const netBalance = totalBorrowed - totalReturned - totalLent;

            return {
              customerId: customer._id,
              customerName: customer.name || 'Unknown Customer',
              customerPhone: customer.phone || '',
              customerEmail: customer.email || '',
              totalBorrowed,
              totalReturned,
              totalLent,
              netBalance,
              lastTransactionDate,
              goldLoansCount: goldLoans.length,
              regularLoansCount: regularLoans.length,
              rawData: customer,
              goldLoans,
              regularLoans
            };
          } catch (error) {
            console.error(`Error processing customer ${customer._id}:`, error);
            // Return customer with zero balances if there's an error
            return {
              customerId: customer._id,
              customerName: customer.name || 'Unknown Customer',
              customerPhone: customer.phone || '',
              customerEmail: customer.email || '',
              totalBorrowed: 0,
              totalReturned: 0,
              totalLent: 0,
              netBalance: 0,
              lastTransactionDate: customer.createdAt,
              goldLoansCount: 0,
              regularLoansCount: 0,
              rawData: customer,
              goldLoans: [],
              regularLoans: []
            };
          }
        })
      );

      setCustomers(customerBalances);
    } catch (error) {
      console.error('Error loading customers:', error);
      throw error;
    }
  };

  const loadBusinessSummary = async () => {
    try {
      // Try to get dashboard stats from API
      const dashboardResponse = await ApiService.getDashboardStats().catch(() => null);
      
      if (dashboardResponse && dashboardResponse.success) {
        setBusinessSummary({
          totalCustomers: dashboardResponse.data.totalCustomers || 0,
          customersWithBalance: dashboardResponse.data.customersWithOutstanding || 0,
          totalMoneyOut: (dashboardResponse.data.totalOutstandingPaise || 0) / 100,
          totalMoneyIn: (dashboardResponse.data.totalAdvancesPaise || 0) / 100,
          totalTransactions: dashboardResponse.data.totalTransactions || 0
        });
      } else {
        // Calculate from customer data if API doesn't provide dashboard stats
        const summary = {
          totalCustomers: customers.length,
          customersWithBalance: customers.filter(c => Math.abs(c.netBalance) > 0).length,
          totalMoneyOut: customers.reduce((sum, c) => sum + (c.netBalance > 0 ? c.netBalance : 0), 0),
          totalMoneyIn: customers.reduce((sum, c) => sum + (c.netBalance < 0 ? Math.abs(c.netBalance) : 0), 0),
          totalTransactions: customers.reduce((sum, c) => sum + c.goldLoansCount + c.regularLoansCount, 0)
        };
        setBusinessSummary(summary);
      }
    } catch (error) {
      console.error('Error loading business summary:', error);
      // Set default values
      setBusinessSummary({
        totalCustomers: 0,
        customersWithBalance: 0,
        totalMoneyOut: 0,
        totalMoneyIn: 0,
        totalTransactions: 0
      });
    }
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

  const getCustomerTransactionHistory = (customer) => {
    const transactions = [];
    
    // Add gold loan transactions
    customer.goldLoans.forEach(loan => {
      transactions.push({
        id: `gl-${loan._id}`,
        type: 'borrowed',
        amount: (loan.principalPaise || 0) / 100,
        date: loan.startDate || loan.createdAt,
        description: `Gold Loan - ${loan.items?.length || 0} items`,
        loanId: loan._id,
        loanType: 'gold'
      });

      // Add payment records if available
      if (loan.payments && loan.payments.length > 0) {
        loan.payments.forEach(payment => {
          transactions.push({
            id: `glp-${payment._id}`,
            type: 'returned',
            amount: ((payment.principalPaise || 0) + (payment.interestPaise || 0)) / 100,
            date: payment.createdAt,
            description: `Payment for Gold Loan`,
            loanId: loan._id,
            loanType: 'gold'
          });
        });
      }
    });

    // Add regular loan transactions
    customer.regularLoans.forEach(loan => {
      const amount = (loan.principalPaise || 0) / 100;
      transactions.push({
        id: `rl-${loan._id}`,
        type: loan.direction === 'INCOMING' ? 'borrowed' : 'lent',
        amount,
        date: loan.startDate || loan.createdAt,
        description: loan.note || `${loan.direction === 'INCOMING' ? 'Regular Loan' : 'Advance Given'}`,
        loanId: loan._id,
        loanType: 'regular'
      });

      // Add payment records
      if (loan.payments && loan.payments.length > 0) {
        loan.payments.forEach(payment => {
          transactions.push({
            id: `rlp-${payment._id}`,
            type: loan.direction === 'INCOMING' ? 'returned' : 'received',
            amount: ((payment.principalPaise || 0) + (payment.interestPaise || 0)) / 100,
            date: payment.createdAt,
            description: `Payment for ${loan.direction === 'INCOMING' ? 'Loan' : 'Advance'}`,
            loanId: loan._id,
            loanType: 'regular'
          });
        });
      }
    });

    // Sort by date and calculate running balance
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let runningBalance = 0;
    return transactions.map(transaction => {
      if (transaction.type === 'borrowed') {
        runningBalance += transaction.amount;
      } else if (transaction.type === 'returned') {
        runningBalance -= transaction.amount;
      } else if (transaction.type === 'lent') {
        runningBalance -= transaction.amount;
      } else if (transaction.type === 'received') {
        runningBalance += transaction.amount;
      }
      
      return {
        ...transaction,
        runningBalance
      };
    });
  };

  const handleSendReminder = async (customer, e) => {
    e.stopPropagation();
    const amount = Math.abs(customer.netBalance);
    const message = `Dear ${customer.customerName}, your outstanding balance is ₹${amount.toLocaleString()}. Please arrange for payment. Thank you!`;
    
    // For now, show alert - in production, integrate with SMS service
    alert(`📱 Message would be sent to ${customer.customerName}:\n\n${message}`);
  };

  const handleCustomerClick = (customer) => {
    const history = getCustomerTransactionHistory(customer);
    setTransactionHistory(history);
    setSelectedCustomer(customer);
    setShowCustomerDetail(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadAllData();
    } finally {
      setIsRefreshing(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Loading Balances</h3>
          <p className="text-slate-600">Calculating customer balances...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Balances</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={loadAllData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
                <p className="font-bold text-red-700 text-lg">{formatCurrency(selectedCustomer?.totalBorrowed || 0)}</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <TrendingDown size={16} className="text-white" />
                </div>
                <p className="text-green-700 text-xs font-medium mb-1">Total Returned</p>
                <p className="font-bold text-green-700 text-lg">{formatCurrency(selectedCustomer?.totalReturned || 0)}</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <DollarSign size={16} className="text-white" />
                </div>
                <p className="text-blue-700 text-xs font-medium mb-1">Net Balance</p>
                <p className={`font-bold text-lg ${selectedCustomer?.netBalance > 0 ? 'text-red-700' : selectedCustomer?.netBalance < 0 ? 'text-green-700' : 'text-slate-700'}`}>
                  {formatCurrency(Math.abs(selectedCustomer?.netBalance || 0))}
                </p>
              </div>
            </div>

            {/* Loan Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-amber-700 text-xs font-medium">Gold Loans</p>
                <p className="font-bold text-amber-700">{selectedCustomer?.goldLoansCount || 0}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-purple-700 text-xs font-medium">Regular Loans</p>
                <p className="font-bold text-purple-700">{selectedCustomer?.regularLoansCount || 0}</p>
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
              {transactionHistory.length > 0 ? transactionHistory.map((transaction, index) => (
                <div key={transaction.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-3 h-3 rounded-full ${
                          transaction.type === 'borrowed' ? 'bg-red-500' :
                          transaction.type === 'returned' ? 'bg-green-500' : 
                          transaction.type === 'lent' ? 'bg-blue-500' : 'bg-purple-500'
                        }`}></div>
                        <span className="font-semibold text-slate-900">
                          {transaction.type === 'borrowed' ? 'Money Borrowed' :
                           transaction.type === 'returned' ? 'Payment Received' : 
                           transaction.type === 'lent' ? 'Advance Given' : 'Payment Received'}
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                          {transaction.loanType?.toUpperCase() || transaction.type.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className={`text-xl font-bold mb-2 ${
                        transaction.type === 'borrowed' ? 'text-red-600' :
                        transaction.type === 'returned' ? 'text-green-600' : 
                        transaction.type === 'lent' ? 'text-blue-600' : 'text-purple-600'
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
              )) : (
                <div className="p-6 text-center">
                  <FileText size={24} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">No transactions found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main List View
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-4">
        {/* Header with refresh button */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Customer Balances</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-600 hover:bg-white hover:text-slate-900 rounded-xl transition-colors border border-slate-200"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
          
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