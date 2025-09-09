import React, { useState } from 'react';
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
  ArrowDownRight
} from 'lucide-react';

const LoanTab = ({ loans = [], customerId, onRefresh }) => {
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // given or taken
  const [searchTerm, setSearchTerm] = useState('');

  // Filter loans based on status, type, and search term
  const filteredLoans = loans.filter(loan => {
    const statusMatch = statusFilter === 'all' || loan.status === statusFilter;
    const typeMatch = typeFilter === 'all' || loan.type === typeFilter;
    const searchMatch = searchTerm === '' || 
      loan.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.collateral?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && typeMatch && searchMatch;
  });

  // Calculate summary statistics
  const summary = {
    totalGiven: loans.filter(l => l.type === 'given').reduce((sum, l) => sum + l.amount, 0),
    totalTaken: loans.filter(l => l.type === 'taken').reduce((sum, l) => sum + l.amount, 0),
    activeLoans: loans.filter(l => l.status === 'active').length,
    completedLoans: loans.filter(l => l.status === 'completed').length,
    overdueLoans: loans.filter(l => l.status === 'overdue').length,
    totalInterestEarned: loans.filter(l => l.type === 'given').reduce((sum, l) => sum + (l.interestReceived || 0), 0),
    totalInterestPaid: loans.filter(l => l.type === 'taken').reduce((sum, l) => sum + (l.interestPaid || 0), 0)
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
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

  const LoanCard = ({ loan }) => {
    const TypeIcon = getTypeIcon(loan.type);
    const remainingAmount = loan.amount - (loan.principalPaid || 0);
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
                {loan.type === 'given' ? 'Loan Given' : 'Loan Taken'}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(loan.status)}`}>
            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
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
            <p className="text-sm text-gray-500">
              {loan.type === 'given' ? 'Interest Received' : 'Interest Paid'}
            </p>
            <p className="font-semibold text-gray-900">₹{totalInterest?.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            Started: {new Date(loan.startDate).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            Due: {new Date(loan.dueDate).toLocaleDateString()}
          </div>
        </div>

        {loan.collateral && (
          <div className="mb-4">
            <p className="text-sm text-gray-500">Collateral</p>
            <p className="text-sm font-medium text-gray-900">{loan.collateral}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Building size={14} className="text-gray-400" />
              <span className="text-sm text-gray-600">
                {loan.lenderName || loan.borrowerName || 'Unknown'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setSelectedLoan(loan)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye size={14} />
            View Details
          </button>
        </div>
      </div>
    );
  };

  const LoanDetailModal = ({ loan, onClose }) => {
    if (!loan) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${loan.type === 'given' ? 'bg-green-50' : 'bg-red-50'}`}>
                  {React.createElement(getTypeIcon(loan.type), { 
                    size: 20, 
                    className: getTypeColor(loan.type) 
                  })}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{loan.purpose || 'General Loan'}</h2>
                  <p className="text-gray-600">{loan.type === 'given' ? 'Loan Given' : 'Loan Taken'}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <XCircle size={20} />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Loan Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Principal Amount</p>
                <p className="text-2xl font-bold text-gray-900">₹{loan.amount?.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Interest Rate</p>
                <p className="text-2xl font-bold text-blue-600">{loan.interestRate}%</p>
                <p className="text-xs text-gray-500">per month</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Remaining</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ₹{(loan.amount - (loan.principalPaid || 0))?.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">
                  {loan.type === 'given' ? 'Interest Received' : 'Interest Paid'}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{(loan.type === 'given' ? loan.interestReceived : loan.interestPaid)?.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Payment History */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {loan.payments?.map((payment, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(payment.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              payment.type === 'principal' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            ₹{payment.amount?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <CheckCircle size={16} className="text-green-600" />
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                            No payments recorded yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Loan Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Start Date:</span>
                    <span className="text-gray-900">{new Date(loan.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Due Date:</span>
                    <span className="text-gray-900">{new Date(loan.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration:</span>
                    <span className="text-gray-900">
                      {Math.ceil((new Date(loan.dueDate) - new Date(loan.startDate)) / (1000 * 60 * 60 * 24 * 30))} months
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(loan.status)}`}>
                      {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {loan.collateral && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Collateral Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-900">{loan.collateral}</p>
                  </div>
                </div>
              )}
            </div>
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
        <div className="flex flex-col-3 lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col-3 sm:flex-row gap-4 flex-1">
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

          <button
            onClick={() => setShowAddLoan(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Add Loan
          </button>
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
                : 'No loan records available for this customer.'}
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
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        )}
      </div>

      {/* Loan Detail Modal */}
      {selectedLoan && (
        <LoanDetailModal 
          loan={selectedLoan} 
          onClose={() => setSelectedLoan(null)} 
        />
      )}
    </div>
  );
};

export default LoanTab;