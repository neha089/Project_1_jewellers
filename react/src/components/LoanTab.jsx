import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, 
  Calendar, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Plus,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  CreditCard,
  Percent
} from 'lucide-react';
import ApiService from '../services/api';
import AddLoanModal from './AddLoanModal';
import LoanDetailModal from './Loan/LoanDetailModal';
import LoanPaymentModal from './Loan/LoanPaymentModal';
import LInterestPaymentModal from './Loan/LInterestPaymentModal';

const LoanTab = ({ customerId, onRefresh }) => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [showLoanDetail, setShowLoanDetail] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [loanDetailData, setLoanDetailData] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLoans();
  }, [customerId]);

  const loadLoans = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load customer loans (both given and taken)
      const [givenResponse, takenResponse] = await Promise.all([
        customerId 
          ? ApiService.getCustomerGivenLoans(customerId)
          : ApiService.getGivenLoans(),
        customerId 
          ? ApiService.getCustomerTakenLoans(customerId) 
          : ApiService.getTakenLoans()
      ]);

      let allLoans = [];

      // Process given loans (receivable)
      if (givenResponse.success && givenResponse.data) {
        const givenLoans = Array.isArray(givenResponse.data) 
          ? givenResponse.data 
          : givenResponse.data.customers || [];
        
        givenLoans.forEach(customerData => {
          if (customerData.loans && customerData.loans.length > 0) {
            customerData.loans.forEach(loan => {
              allLoans.push({
                ...loan,
                type: 'given',
                loanType: 'GIVEN',
                customer: customerData.customer,
                status: loan.status || 'ACTIVE',
                amount: loan.originalAmount || 0,
                interestRate: loan.interestRateMonthlyPct || 0,
                remainingAmount: loan.outstandingAmount || loan.originalAmount || 0,
                totalPaid: loan.totalPrincipalPaid ? loan.totalPrincipalPaid / 100 : 0,
                startDate: loan.takenDate,
                dueDate: loan.dueDate,
                purpose: loan.note || 'Loan Given',
                collateral: '',
                interestReceived: 0,
                payments: loan.paymentHistory || []
              });
            });
          }
        });
      }

      // Process taken loans (payable)
      if (takenResponse.success && takenResponse.data) {
        const takenLoans = Array.isArray(takenResponse.data)
          ? takenResponse.data
          : takenResponse.data.customers || [];
        
        takenLoans.forEach(customerData => {
          if (customerData.loans && customerData.loans.length > 0) {
            customerData.loans.forEach(loan => {
              allLoans.push({
                ...loan,
                type: 'taken',
                loanType: 'TAKEN',
                customer: customerData.customer,
                status: loan.status || 'ACTIVE',
                amount: loan.originalAmount || 0,
                interestRate: loan.interestRateMonthlyPct || 0,
                remainingAmount: loan.outstandingAmount || loan.originalAmount || 0,
                totalPaid: loan.totalPrincipalPaid ? loan.totalPrincipalPaid / 100 : 0,
                startDate: loan.takenDate,
                dueDate: loan.dueDate,
                purpose: loan.note || 'Loan Taken',
                collateral: '',
                interestPaid: 0,
                payments: loan.paymentHistory || []
              });
            });
          }
        });
      }

      setLoans(allLoans);
    } catch (error) {
      console.error('Error loading loans:', error);
      setError('Failed to load loan data');
    } finally {
      setLoading(false);
    }
  };

  // Filter loans based on status, type, and search term
  const filteredLoans = loans.filter(loan => {
    const statusMatch = statusFilter === 'all' || loan.status.toLowerCase() === statusFilter.toLowerCase();
    const typeMatch = typeFilter === 'all' || loan.type === typeFilter;
    const searchMatch = searchTerm === '' || 
      loan.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && typeMatch && searchMatch;
  });

  // Calculate summary statistics
  const summary = {
    totalGiven: loans.filter(l => l.type === 'given').reduce((sum, l) => sum + l.amount, 0),
    totalTaken: loans.filter(l => l.type === 'taken').reduce((sum, l) => sum + l.amount, 0),
    activeLoans: loans.filter(l => l.status === 'ACTIVE').length,
    completedLoans: loans.filter(l => l.status === 'PAID' || l.status === 'COMPLETED').length,
    overdueLoans: loans.filter(l => l.status === 'OVERDUE').length,
    totalInterestEarned: loans.filter(l => l.type === 'given').reduce((sum, l) => sum + (l.interestReceived || 0), 0),
    totalInterestPaid: loans.filter(l => l.type === 'taken').reduce((sum, l) => sum + (l.interestPaid || 0), 0)
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed':
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'defaulted': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'given': return 'text-green-600';
      case 'taken': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeIcon = (type) => {
    return type === 'given' ? ArrowUpRight : ArrowDownRight;
  };

  const handleView = (loan) => {
    const loanData = {
      customer: loan.customer,
      loans: [loan]
    };
    setLoanDetailData(loanData);
    setShowLoanDetail(true);
  };

  const handlePrincipalPayment = (loan) => {
    setSelectedLoan(loan);
    setShowPaymentModal(true);
  };

  const handleInterestPayment = (loan) => {
    setSelectedLoan(loan);
    setShowInterestModal(true);
  };

  const handlePaymentSuccess = () => {
    loadLoans();
    if (onRefresh) onRefresh();
    setShowPaymentModal(false);
    setShowInterestModal(false);
    setSelectedLoan(null);
  };

  const handleAddLoanSuccess = () => {
    loadLoans();
    if (onRefresh) onRefresh();
    setShowAddLoan(false);
  };

  const LoanCard = ({ loan }) => {
    const TypeIcon = getTypeIcon(loan.type);
    const remainingAmount = loan.remainingAmount || 0;
    const totalInterest = loan.type === 'given' ? (loan.interestReceived || 0) : (loan.interestPaid || 0);
    
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${loan.type === 'given' ? 'bg-green-50' : 'bg-red-50'}`}>
              <TypeIcon size={20} className={getTypeColor(loan.type)} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{loan.purpose || 'General Loan'}</h3>
              <p className="text-sm text-gray-500">
                {loan.type === 'given' ? 'Loan Given to' : 'Loan Taken from'} {loan.customer?.name || 'Unknown'}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(loan.status)}`}>
            {loan.status}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Principal Amount</p>
            <p className="font-semibold text-gray-900">₹{loan.amount?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Interest Rate</p>
            <p className="font-semibold text-gray-900">{loan.interestRate}% /month</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Remaining</p>
            <p className="font-semibold text-gray-900">₹{remainingAmount?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Payments Made</p>
            <p className="font-semibold text-gray-900">{loan.payments?.length || 0}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            Started: {new Date(loan.startDate).toLocaleDateString()}
          </div>
          {loan.dueDate && (
            <div className="flex items-center gap-1">
              <Clock size={14} />
              Due: {new Date(loan.dueDate).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building size={14} className="text-gray-400" />
            <span className="text-sm text-gray-600">
              {loan.customer?.name || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleView(loan)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Eye size={14} />
              View
            </button>
            {remainingAmount > 0 && (
              <>
                <button
                  onClick={() => handlePrincipalPayment(loan)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    loan.type === 'given' 
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <CreditCard size={14} />
                  {loan.type === 'given' ? 'Collect' : 'Pay'}
                </button>
                <button
                  onClick={() => handleInterestPayment(loan)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Percent size={14} />
                  Interest
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-600" />
          <span className="text-gray-600">Loading loan data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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

      {/* Header with Action Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Loan Management</h3>
          <p className="text-sm text-gray-500">
            {customerId ? 'Customer loan history' : 'All loan transactions'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadLoans}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddLoan(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Loan
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <ArrowUpRight size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Loans Given</p>
              <p className="text-2xl font-bold text-gray-900">₹{summary.totalGiven.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Interest Earned: ₹{summary.totalInterestEarned.toLocaleString()}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <ArrowDownRight size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Loans Taken</p>
              <p className="text-2xl font-bold text-gray-900">₹{summary.totalTaken.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Interest Paid: ₹{summary.totalInterestPaid.toLocaleString()}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Loans</p>
              <p className="text-2xl font-bold text-gray-900">{summary.activeLoans}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Completed: {summary.completedLoans}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <AlertCircle size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{summary.overdueLoans}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Needs attention</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search loans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="defaulted">Defaulted</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="given">Loans Given</option>
              <option value="taken">Loans Taken</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loans List */}
      <div className="space-y-4">
        {filteredLoans.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <IndianRupee size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Loans Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                ? 'No loans match your current filters.' 
                : customerId 
                  ? 'No loan records available for this customer.'
                  : 'No loan records available.'}
            </p>
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => setShowAddLoan(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Loan
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredLoans.map(loan => (
              <LoanCard key={loan._id || loan.id} loan={loan} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddLoan && (
        <AddLoanModal 
          isOpen={showAddLoan}
          onClose={() => setShowAddLoan(false)}
          onSuccess={handleAddLoanSuccess}
        />
      )}

      {showLoanDetail && loanDetailData && (
        <LoanDetailModal 
          isOpen={showLoanDetail}
          loanData={loanDetailData}
          loanType={loanDetailData.loans[0]?.type === 'given' ? 'receivable' : 'payable'}
          onClose={() => {
            setShowLoanDetail(false);
            setLoanDetailData(null);
          }}
          onPrincipalPayment={handlePrincipalPayment}
          onInterestPayment={handleInterestPayment}
        />
      )}

      {showPaymentModal && selectedLoan && (
        <LoanPaymentModal 
          isOpen={showPaymentModal}
          loan={selectedLoan}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedLoan(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {showInterestModal && selectedLoan && (
        <LInterestPaymentModal 
          isOpen={showInterestModal}
          loan={selectedLoan}
          onClose={() => {
            setShowInterestModal(false);
            setSelectedLoan(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default LoanTab;
