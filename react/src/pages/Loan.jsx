import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus,
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  User,
  Phone,
  ChevronRight,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  CreditCard,
  Receipt,
  Bell,
  Eye,
  Calculator,
  FileText,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

const Loan = () => {
    
  // State Management
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, loansList, addLoan, loanDetail, addPayment
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all'); // all, given, taken

  // Form States
  const [loanForm, setLoanForm] = useState({
    customerName: '',
    customerPhone: '',
    amount: '',
    interestRate: '',
    loanType: 'given', // given or taken
    startDate: new Date().toISOString().split('T')[0],
    description: '',
    interestType: 'monthly' // monthly, yearly
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentType: 'principal', // principal, interest, both
    principalAmount: '',
    interestAmount: '',
    note: ''
  });

  // Initialize with sample data
  useEffect(() => {
    initializeSampleData();
  }, []);

  const initializeSampleData = () => {
    const sampleLoans = [
      {
        id: '1',
        customerName: 'Raj Patel',
        customerPhone: '+91 98765 43210',
        principalAmount: 100000,
        currentPrincipal: 75000,
        interestRate: 2, // 2% per month
        interestType: 'monthly',
        loanType: 'given',
        startDate: '2024-01-15',
        lastPaymentDate: '2024-02-15',
        status: 'active',
        description: 'Business loan for shop expansion',
        payments: [
          {
            id: 'p1',
            date: '2024-02-15',
            principalAmount: 25000,
            interestAmount: 2000,
            totalAmount: 27000,
            note: 'First EMI payment'
          }
        ],
        interestHistory: [
          { month: '2024-01', amount: 2000, status: 'paid', paidDate: '2024-02-15' },
          { month: '2024-02', amount: 1500, status: 'paid', paidDate: '2024-02-15' },
          { month: '2024-03', amount: 1500, status: 'pending' }
        ]
      },
      {
        id: '2',
        customerName: 'Priya Shah',
        customerPhone: '+91 87654 32109',
        principalAmount: 50000,
        currentPrincipal: 50000,
        interestRate: 1.5,
        interestType: 'monthly',
        loanType: 'given',
        startDate: '2024-03-01',
        lastPaymentDate: null,
        status: 'active',
        description: 'Personal emergency loan',
        payments: [],
        interestHistory: [
          { month: '2024-03', amount: 750, status: 'pending' }
        ]
      },
      {
        id: '3',
        customerName: 'Amit Singh Bank',
        customerPhone: '+91 76543 21098',
        principalAmount: 200000,
        currentPrincipal: 180000,
        interestRate: 12,
        interestType: 'yearly',
        loanType: 'taken',
        startDate: '2024-01-01',
        lastPaymentDate: '2024-02-01',
        status: 'active',
        description: 'Business expansion loan from bank',
        payments: [
          {
            id: 'p3',
            date: '2024-02-01',
            principalAmount: 20000,
            interestAmount: 2000,
            totalAmount: 22000,
            note: 'Monthly EMI payment'
          }
        ],
        interestHistory: [
          { month: '2024-01', amount: 2000, status: 'paid', paidDate: '2024-02-01' },
          { month: '2024-02', amount: 1800, status: 'paid', paidDate: '2024-02-01' },
          { month: '2024-03', amount: 1800, status: 'pending' }
        ]
      }
    ];

    setLoans(sampleLoans);
    
    // Extract unique customers
    const uniqueCustomers = [];
    sampleLoans.forEach(loan => {
      if (!uniqueCustomers.find(c => c.phone === loan.customerPhone)) {
        uniqueCustomers.push({
          name: loan.customerName,
          phone: loan.customerPhone
        });
      }
    });
    setCustomers(uniqueCustomers);
  };

  // Utility Functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getMonthlyInterest = (loan) => {
    if (loan.interestType === 'monthly') {
      return (loan.currentPrincipal * loan.interestRate) / 100;
    } else {
      return (loan.currentPrincipal * loan.interestRate) / (100 * 12);
    }
  };

  const getPendingInterest = (loan) => {
    return loan.interestHistory
      .filter(h => h.status === 'pending')
      .reduce((sum, h) => sum + h.amount, 0);
  };

  const getDaysOverdue = (loan) => {
    if (!loan.interestHistory.find(h => h.status === 'pending')) return 0;
    
    const lastPaymentDate = loan.lastPaymentDate ? new Date(loan.lastPaymentDate) : new Date(loan.startDate);
    const today = new Date();
    const diffTime = today - lastPaymentDate;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // Dashboard Calculations
  const getDashboardStats = () => {
    const givenLoans = loans.filter(loan => loan.loanType === 'given' && loan.status === 'active');
    const takenLoans = loans.filter(loan => loan.loanType === 'taken' && loan.status === 'active');
    
    const totalGiven = givenLoans.reduce((sum, loan) => sum + loan.currentPrincipal, 0);
    const totalTaken = takenLoans.reduce((sum, loan) => sum + loan.currentPrincipal, 0);
    const pendingInterestToReceive = givenLoans.reduce((sum, loan) => sum + getPendingInterest(loan), 0);
    const pendingInterestToPay = takenLoans.reduce((sum, loan) => sum + getPendingInterest(loan), 0);
    
    const overdueLoans = loans.filter(loan => {
      const daysOverdue = getDaysOverdue(loan);
      return daysOverdue > 30 && loan.status === 'active';
    });

    return {
      totalGiven,
      totalTaken,
      netPosition: totalGiven - totalTaken,
      pendingInterestToReceive,
      pendingInterestToPay,
      activeLoans: loans.filter(l => l.status === 'active').length,
      overdueCount: overdueLoans.length
    };
  };

  // Form Handlers
  const handleLoanFormSubmit = (e) => {
    e.preventDefault();
    
    const newLoan = {
      id: Date.now().toString(),
      customerName: loanForm.customerName,
      customerPhone: loanForm.customerPhone,
      principalAmount: parseFloat(loanForm.amount),
      currentPrincipal: parseFloat(loanForm.amount),
      interestRate: parseFloat(loanForm.interestRate),
      interestType: loanForm.interestType,
      loanType: loanForm.loanType,
      startDate: loanForm.startDate,
      lastPaymentDate: null,
      status: 'active',
      description: loanForm.description,
      payments: [],
      interestHistory: [{
        month: new Date().toISOString().substr(0, 7),
        amount: loanForm.interestType === 'monthly' 
          ? (parseFloat(loanForm.amount) * parseFloat(loanForm.interestRate)) / 100
          : (parseFloat(loanForm.amount) * parseFloat(loanForm.interestRate)) / (100 * 12),
        status: 'pending'
      }]
    };

    setLoans([...loans, newLoan]);
    
    // Add customer if not exists
    if (!customers.find(c => c.phone === loanForm.customerPhone)) {
      setCustomers([...customers, {
        name: loanForm.customerName,
        phone: loanForm.customerPhone
      }]);
    }

    // Reset form
    setLoanForm({
      customerName: '',
      customerPhone: '',
      amount: '',
      interestRate: '',
      loanType: 'given',
      startDate: new Date().toISOString().split('T')[0],
      description: '',
      interestType: 'monthly'
    });

    setCurrentView('loansList');
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    
    const principalAmount = parseFloat(paymentForm.principalAmount) || 0;
    const interestAmount = parseFloat(paymentForm.interestAmount) || 0;
    const totalAmount = principalAmount + interestAmount;

    const newPayment = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      principalAmount,
      interestAmount,
      totalAmount,
      note: paymentForm.note
    };

    const updatedLoans = loans.map(loan => {
      if (loan.id === selectedLoan.id) {
        const updatedLoan = {
          ...loan,
          currentPrincipal: Math.max(0, loan.currentPrincipal - principalAmount),
          lastPaymentDate: new Date().toISOString().split('T')[0],
          payments: [...loan.payments, newPayment],
          status: (loan.currentPrincipal - principalAmount) <= 0 ? 'completed' : 'active'
        };

        // Update interest history
        let remainingInterest = interestAmount;
        const updatedInterestHistory = loan.interestHistory.map(interest => {
          if (interest.status === 'pending' && remainingInterest > 0) {
            if (remainingInterest >= interest.amount) {
              remainingInterest -= interest.amount;
              return {
                ...interest,
                status: 'paid',
                paidDate: new Date().toISOString().split('T')[0]
              };
            } else {
              const updatedAmount = interest.amount - remainingInterest;
              remainingInterest = 0;
              return {
                ...interest,
                amount: updatedAmount
              };
            }
          }
          return interest;
        });

        updatedLoan.interestHistory = updatedInterestHistory;
        return updatedLoan;
      }
      return loan;
    });

    setLoans(updatedLoans);
    setSelectedLoan(updatedLoans.find(l => l.id === selectedLoan.id));
    
    // Reset payment form
    setPaymentForm({
      amount: '',
      paymentType: 'principal',
      principalAmount: '',
      interestAmount: '',
      note: ''
    });

    setCurrentView('loanDetail');
  };

  // Filter Functions
  const getFilteredLoans = () => {
    let filtered = loans.filter(loan => {
      const matchesSearch = loan.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           loan.customerPhone.includes(searchTerm) ||
                           loan.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || loan.status === filterStatus;
      const matchesType = filterType === 'all' || loan.loanType === filterType;
      
      return matchesSearch && matchesStatus && matchesType;
    });

    return filtered.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  };

  // Dashboard Component
  const DashboardView = () => {
    const stats = getDashboardStats();
    const upcomingPayments = loans.filter(loan => {
      const daysOverdue = getDaysOverdue(loan);
      return daysOverdue >= 25 && loan.status === 'active';
    }).slice(0, 5);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">Loan Management</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView('addLoan')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
            >
              <Plus size={16} />
              New Loan
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp size={24} />
              <span className="text-xs font-medium opacity-80">GIVEN</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalGiven)}</p>
            <p className="text-xs opacity-80">Money lent out</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown size={24} />
              <span className="text-xs font-medium opacity-80">TAKEN</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalTaken)}</p>
            <p className="text-xs opacity-80">Money borrowed</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <DollarSign size={24} />
              <span className="text-xs font-medium opacity-80">NET</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(Math.abs(stats.netPosition))}</p>
            <p className="text-xs opacity-80">
              {stats.netPosition >= 0 ? 'Net receivable' : 'Net payable'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <Receipt size={24} />
              <span className="text-xs font-medium opacity-80">ACTIVE</span>
            </div>
            <p className="text-2xl font-bold">{stats.activeLoans}</p>
            <p className="text-xs opacity-80">Active loans</p>
          </div>
        </div>

        {/* Interest Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Calculator className="text-green-600" size={20} />
              Interest to Receive
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Pending Interest</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(stats.pendingInterestToReceive)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">From Loans</span>
                <span className="text-slate-600">
                  {loans.filter(l => l.loanType === 'given' && l.status === 'active').length} loans
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Calculator className="text-red-600" size={20} />
              Interest to Pay
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Pending Interest</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(stats.pendingInterestToPay)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">From Loans</span>
                <span className="text-slate-600">
                  {loans.filter(l => l.loanType === 'taken' && l.status === 'active').length} loans
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity & Reminders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Payments */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Bell className="text-orange-600" size={20} />
              Payment Reminders
            </h3>
            {upcomingPayments.length > 0 ? (
              <div className="space-y-3">
                {upcomingPayments.map(loan => (
                  <div key={loan.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <div>
                      <p className="font-medium text-slate-900">{loan.customerName}</p>
                      <p className="text-sm text-slate-600">
                        {loan.loanType === 'given' ? 'Should pay' : 'You need to pay'} {formatCurrency(getPendingInterest(loan))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-orange-600 font-medium">
                        {getDaysOverdue(loan)} days overdue
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">All payments are up to date!</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setCurrentView('addLoan')}
                className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors text-left"
              >
                <Plus className="text-blue-600 mb-2" size={20} />
                <p className="font-medium text-slate-900">New Loan</p>
                <p className="text-xs text-slate-600">Add loan record</p>
              </button>
              
              <button
                onClick={() => setCurrentView('loansList')}
                className="p-4 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-colors text-left"
              >
                <FileText className="text-green-600 mb-2" size={20} />
                <p className="font-medium text-slate-900">View Loans</p>
                <p className="text-xs text-slate-600">All loan records</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loans List Component
  const LoansListView = () => {
    const filteredLoans = getFilteredLoans();

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">All Loans</h1>
          <button
            onClick={() => setCurrentView('addLoan')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            New Loan
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search loans..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="given">Given Loans</option>
            <option value="taken">Taken Loans</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Loans List */}
        <div className="space-y-4">
          {filteredLoans.map(loan => {
            const pendingInterest = getPendingInterest(loan);
            const daysOverdue = getDaysOverdue(loan);
            
            return (
              <div
                key={loan.id}
                className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  setSelectedLoan(loan);
                  setCurrentView('loanDetail');
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${
                        loan.loanType === 'given' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <h3 className="font-semibold text-slate-900">{loan.customerName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        loan.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {loan.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                      <span>{formatDate(loan.startDate)}</span>
                      <span>•</span>
                      <span>{loan.interestRate}% {loan.interestType}</span>
                      <span>•</span>
                      <span>{loan.customerPhone}</span>
                    </div>
                    
                    <p className="text-sm text-slate-600">{loan.description}</p>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="mb-2">
                      <p className="text-lg font-bold text-slate-900">
                        {formatCurrency(loan.currentPrincipal)}
                      </p>
                      <p className="text-xs text-slate-500">
                        of {formatCurrency(loan.principalAmount)}
                      </p>
                    </div>
                    
                    {pendingInterest > 0 && (
                      <div className={`text-sm ${
                        daysOverdue > 30 ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        <p className="font-medium">Interest: {formatCurrency(pendingInterest)}</p>
                        {daysOverdue > 0 && (
                          <p className="text-xs">{daysOverdue} days overdue</p>
                        )}
                      </div>
                    )}
                    
                    <ChevronRight className="text-slate-400 mt-2" size={20} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredLoans.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No loans found</h3>
            <p className="text-slate-500 mb-4">Try adjusting your search or filters</p>
            <button
              onClick={() => setCurrentView('addLoan')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors"
            >
              Add First Loan
            </button>
          </div>
        )}
      </div>
    );
  };

  // Add Loan Component
  const AddLoanView = () => {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Add New Loan</h1>
        </div>

        <form onSubmit={handleLoanFormSubmit} className="bg-white rounded-xl p-6 border border-slate-200 space-y-6">
          {/* Loan Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Loan Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLoanForm({...loanForm, loanType: 'given'})}
                className={`p-4 rounded-xl border-2 transition-all ${
                  loanForm.loanType === 'given'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <TrendingUp className="mx-auto mb-2" size={24} />
                <p className="font-medium">Money Given</p>
                <p className="text-xs opacity-70">I am lending money</p>
              </button>
              
              <button
                type="button"
                onClick={() => setLoanForm({...loanForm, loanType: 'taken'})}
                className={`p-4 rounded-xl border-2 transition-all ${
                  loanForm.loanType === 'taken'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <TrendingDown className="mx-auto mb-2" size={24} />
                <p className="font-medium">Money Taken</p>
                <p className="text-xs opacity-70">I am borrowing money</p>
              </button>
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {loanForm.loanType === 'given' ? 'Customer Name' : 'Lender Name'}
              </label>
              <input
                type="text"
                required
                value={loanForm.customerName}
                onChange={(e) => setLoanForm({...loanForm, customerName: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
              <input
                type="tel"
                required
                value={loanForm.customerPhone}
                onChange={(e) => setLoanForm({...loanForm, customerPhone: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          {/* Loan Amount and Interest */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Loan Amount</label>
              <input
                type="number"
                required
                value={loanForm.amount}
                onChange={(e) => setLoanForm({...loanForm, amount: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="₹ 100,000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Interest Rate (%)</label>
              <input
                type="number"
                step="0.1"
                required
                value={loanForm.interestRate}
                onChange={(e) => setLoanForm({...loanForm, interestRate: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2.0"
              />
            </div>
          </div>

          {/* Interest Type and Start Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Interest Type</label>
              <select
                value={loanForm.interestType}
                onChange={(e) => setLoanForm({...loanForm, interestType: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
              <input
                type="date"
                required
                value={loanForm.startDate}
                onChange={(e) => setLoanForm({...loanForm, startDate: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={loanForm.description}
              onChange={(e) => setLoanForm({...loanForm, description: e.target.value})}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Purpose of loan, terms, etc..."
            />
          </div>

          {/* Interest Preview */}
          {loanForm.amount && loanForm.interestRate && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Interest Calculation Preview</h4>
              <div className="text-sm text-blue-700">
                <p>
                  {loanForm.interestType === 'monthly' ? 'Monthly' : 'Monthly (from yearly)'} interest: {' '}
                  <span className="font-semibold">
                    {formatCurrency(
                      loanForm.interestType === 'monthly'
                        ? (parseFloat(loanForm.amount || 0) * parseFloat(loanForm.interestRate || 0)) / 100
                        : (parseFloat(loanForm.amount || 0) * parseFloat(loanForm.interestRate || 0)) / (100 * 12)
                    )}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setCurrentView('dashboard')}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
            >
              Add Loan
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Loan Detail Component
  const LoanDetailView = () => {
    if (!selectedLoan) return null;

    const pendingInterest = getPendingInterest(selectedLoan);
    const monthlyInterest = getMonthlyInterest(selectedLoan);
    const daysOverdue = getDaysOverdue(selectedLoan);
    const totalPaid = selectedLoan.payments.reduce((sum, payment) => sum + payment.totalAmount, 0);

    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setCurrentView('loansList')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{selectedLoan.customerName}</h1>
            <div className="flex items-center gap-2 text-slate-600">
              <Phone size={14} />
              <span>{selectedLoan.customerPhone}</span>
            </div>
          </div>
          
          {selectedLoan.status === 'active' && (
            <button
              onClick={() => setCurrentView('addPayment')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
            >
              <Plus size={16} />
              Add Payment
            </button>
          )}
        </div>

        {/* Loan Summary */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Loan Summary</h2>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                selectedLoan.loanType === 'given' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium text-slate-600">
                {selectedLoan.loanType === 'given' ? 'Money Given' : 'Money Taken'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-blue-700 text-sm font-medium mb-1">Principal Amount</p>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(selectedLoan.principalAmount)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-green-700 text-sm font-medium mb-1">Amount Paid</p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <p className="text-orange-700 text-sm font-medium mb-1">Current Balance</p>
              <p className="text-2xl font-bold text-orange-700">
                {formatCurrency(selectedLoan.currentPrincipal)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <p className="text-red-700 text-sm font-medium mb-1">Pending Interest</p>
              <p className="text-2xl font-bold text-red-700">
                {formatCurrency(pendingInterest)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-slate-600 text-sm">Interest Rate</p>
              <p className="font-semibold">{selectedLoan.interestRate}% {selectedLoan.interestType}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-slate-600 text-sm">Monthly Interest</p>
              <p className="font-semibold">{formatCurrency(monthlyInterest)}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-slate-600 text-sm">Start Date</p>
              <p className="font-semibold">{formatDate(selectedLoan.startDate)}</p>
            </div>
          </div>

          {selectedLoan.description && (
            <div className="p-4 bg-slate-50 rounded-lg mb-4">
              <p className="text-slate-600 text-sm">Description</p>
              <p className="text-slate-900">{selectedLoan.description}</p>
            </div>
          )}

          {daysOverdue > 0 && pendingInterest > 0 && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20} />
                <p className="text-red-700 font-medium">
                  {daysOverdue} days overdue • {formatCurrency(pendingInterest)} pending interest
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Interest History */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Interest History</h3>
          <div className="space-y-3">
            {selectedLoan.interestHistory.map((interest, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                interest.status === 'paid' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-900">
                      {new Date(interest.month + '-01').toLocaleDateString('en-IN', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    {interest.paidDate && (
                      <p className="text-sm text-slate-600">
                        Paid on {formatDate(interest.paidDate)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      interest.status === 'paid' ? 'text-green-700' : 'text-orange-700'
                    }`}>
                      {formatCurrency(interest.amount)}
                    </p>
                    <div className="flex items-center gap-1 text-sm">
                      {interest.status === 'paid' ? (
                        <>
                          <CheckCircle className="text-green-500" size={14} />
                          <span className="text-green-700">Paid</span>
                        </>
                      ) : (
                        <>
                          <Clock className="text-orange-500" size={14} />
                          <span className="text-orange-700">Pending</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment History</h3>
          {selectedLoan.payments.length > 0 ? (
            <div className="space-y-4">
              {selectedLoan.payments.map((payment) => (
                <div key={payment.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-900 mb-1">
                        Payment on {formatDate(payment.date)}
                      </p>
                      <div className="text-sm text-slate-600 space-y-1">
                        {payment.principalAmount > 0 && (
                          <p>Principal: {formatCurrency(payment.principalAmount)}</p>
                        )}
                        {payment.interestAmount > 0 && (
                          <p>Interest: {formatCurrency(payment.interestAmount)}</p>
                        )}
                        {payment.note && <p>Note: {payment.note}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(payment.totalAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No payments recorded yet</p>
          )}
        </div>
      </div>
    );
  };

  // Add Payment Component
  const AddPaymentView = () => {
    if (!selectedLoan) return null;

    const pendingInterest = getPendingInterest(selectedLoan);
    const handlePaymentTypeChange = (type) => {
      setPaymentForm({...paymentForm, paymentType: type});
      
      if (type === 'interest') {
        setPaymentForm({
          ...paymentForm,
          paymentType: type,
          principalAmount: '0',
          interestAmount: pendingInterest.toString()
        });
      } else if (type === 'principal') {
        setPaymentForm({
          ...paymentForm,
          paymentType: type,
          principalAmount: '',
          interestAmount: '0'
        });
      } else {
        setPaymentForm({
          ...paymentForm,
          paymentType: type,
          principalAmount: '',
          interestAmount: pendingInterest.toString()
        });
      }
    };

    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setCurrentView('loanDetail')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Add Payment</h1>
            <p className="text-slate-600">{selectedLoan.customerName}</p>
          </div>
        </div>

        <form onSubmit={handlePaymentSubmit} className="bg-white rounded-xl p-6 border border-slate-200 space-y-6">
          {/* Current Status */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h3 className="font-medium text-slate-900 mb-3">Current Status</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Outstanding Principal</p>
                <p className="font-semibold text-lg">{formatCurrency(selectedLoan.currentPrincipal)}</p>
              </div>
              <div>
                <p className="text-slate-600">Pending Interest</p>
                <p className="font-semibold text-lg text-red-600">{formatCurrency(pendingInterest)}</p>
              </div>
            </div>
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Payment Type</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handlePaymentTypeChange('principal')}
                className={`p-3 rounded-xl border-2 transition-all text-sm ${
                  paymentForm.paymentType === 'principal'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                Principal Only
              </button>
              
              <button
                type="button"
                onClick={() => handlePaymentTypeChange('interest')}
                className={`p-3 rounded-xl border-2 transition-all text-sm ${
                  paymentForm.paymentType === 'interest'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                Interest Only
              </button>
              
              <button
                type="button"
                onClick={() => handlePaymentTypeChange('both')}
                className={`p-3 rounded-xl border-2 transition-all text-sm ${
                  paymentForm.paymentType === 'both'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                Both
              </button>
            </div>
          </div>

          {/* Payment Amounts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Principal Amount
              </label>
              <input
                type="number"
                value={paymentForm.principalAmount}
                onChange={(e) => setPaymentForm({...paymentForm, principalAmount: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                max={selectedLoan.currentPrincipal}
                disabled={paymentForm.paymentType === 'interest'}
              />
              <p className="text-xs text-slate-500 mt-1">
                Max: {formatCurrency(selectedLoan.currentPrincipal)}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Interest Amount
              </label>
              <input
                type="number"
                value={paymentForm.interestAmount}
                onChange={(e) => setPaymentForm({...paymentForm, interestAmount: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                disabled={paymentForm.paymentType === 'principal'}
              />
              <p className="text-xs text-slate-500 mt-1">
                Pending: {formatCurrency(pendingInterest)}
              </p>
            </div>
          </div>

          {/* Payment Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Note</label>
            <input
              type="text"
              value={paymentForm.note}
              onChange={(e) => setPaymentForm({...paymentForm, note: e.target.value})}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional note about this payment"
            />
          </div>

          {/* Payment Summary */}
          {(paymentForm.principalAmount || paymentForm.interestAmount) && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-3">Payment Summary</h4>
              <div className="space-y-2 text-sm">
                {parseFloat(paymentForm.principalAmount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">Principal Payment:</span>
                    <span className="font-semibold text-blue-900">
                      {formatCurrency(parseFloat(paymentForm.principalAmount))}
                    </span>
                  </div>
                )}
                {parseFloat(paymentForm.interestAmount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">Interest Payment:</span>
                    <span className="font-semibold text-blue-900">
                      {formatCurrency(parseFloat(paymentForm.interestAmount))}
                    </span>
                  </div>
                )}
                <hr className="border-blue-200" />
                <div className="flex justify-between font-semibold">
                  <span className="text-blue-900">Total Payment:</span>
                  <span className="text-blue-900">
                    {formatCurrency(
                      parseFloat(paymentForm.principalAmount || 0) + 
                      parseFloat(paymentForm.interestAmount || 0)
                    )}
                  </span>
                </div>
                
                {parseFloat(paymentForm.principalAmount || 0) > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-600">Remaining Principal:</span>
                    <span className="text-blue-600">
                      {formatCurrency(
                        selectedLoan.currentPrincipal - parseFloat(paymentForm.principalAmount || 0)
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setCurrentView('loanDetail')}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !paymentForm.principalAmount && !paymentForm.interestAmount ||
                (parseFloat(paymentForm.principalAmount || 0) + parseFloat(paymentForm.interestAmount || 0)) <= 0
              }
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
            >
              Add Payment
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Main Render
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-4 max-w-7xl mx-auto">
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'loansList' && <LoansListView />}
        {currentView === 'addLoan' && <AddLoanView />}
        {currentView === 'loanDetail' && <LoanDetailView />}
        {currentView === 'addPayment' && <AddPaymentView />}
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:hidden">
        <div className="flex justify-around">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              currentView === 'dashboard' ? 'text-blue-600 bg-blue-50' : 'text-slate-600'
            }`}
          >
            <DollarSign size={20} />
            <span className="text-xs">Dashboard</span>
          </button>
          
          <button
            onClick={() => setCurrentView('loansList')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              currentView === 'loansList' ? 'text-blue-600 bg-blue-50' : 'text-slate-600'
            }`}
          >
            <FileText size={20} />
            <span className="text-xs">Loans</span>
          </button>
          
          <button
            onClick={() => setCurrentView('addLoan')}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-white bg-blue-600"
          >
            <Plus size={20} />
            <span className="text-xs">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Loan;