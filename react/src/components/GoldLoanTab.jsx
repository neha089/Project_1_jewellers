import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Calendar, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Percent,
  DollarSign,
  Weight,
  Grid,
  List,
  AlertTriangle
} from 'lucide-react';
import ApiService from '../services/api';
import AddGoldLoanModal from './Gold-Loan/AddGoldLoanModal';
import {GoldLoanCard} from './Gold-Loan/GoldLoanCard';
import GoldLoanTableRow from './Gold-Loan/GoldLoanTableRow';
import InterestPaymentModal from './Gold-Loan/InterestPaymentModal';
import ItemRepaymentModal from './Gold-Loan/ItemRepaymentModal';
import PaymentReminderModal from './Gold-Loan/PaymentReminderModal';

const GoldLoanTab = ({ customerId, onRefresh }) => {
  const [goldLoans, setGoldLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [goldTypeFilter, setGoldTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    loadGoldLoans();
  }, [customerId, statusFilter]);

  // Calculate due date based on start date (assuming monthly interest payments)
  const calculateDueDate = (loan) => {
    if (!loan.startDate) return null;
    const startDate = new Date(loan.startDate);
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + 1); // Add 1 month for monthly payment
    return dueDate;
  };

  const loadGoldLoans = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await ApiService.getAllGoldLoans({
        page: 1,
        limit: 100,
        customerId: customerId || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });

      if (response.success) {
        // Add calculated due dates to loans and filter by customer if needed
        let loansWithDueDates = response.data.map(loan => ({
          ...loan,
          dueDate: calculateDueDate(loan)
        }));

        // Filter by customerId if provided
        if (customerId) {
          loansWithDueDates = loansWithDueDates.filter(loan => 
            loan.customer?._id === customerId
          );
        }

        setGoldLoans(loansWithDueDates);
      } else {
        throw new Error(response.error || 'Failed to fetch gold loans');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading gold loans:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort loans
  useEffect(() => {
    let filtered = [...goldLoans];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(loan =>
        loan._id?.toLowerCase().includes(term) ||
        loan.customer?.name?.toLowerCase().includes(term) ||
        loan.customer?.phone?.toLowerCase().includes(term) ||
        loan.items?.some(item =>
          item.name?.toLowerCase().includes(term)
        )
      );
    }

    // Apply gold type filter
    if (goldTypeFilter !== 'all') {
      filtered = filtered.filter(loan =>
        loan.items?.some(item => String(item.purityK) === goldTypeFilter)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(loan => loan.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'customer':
          return (a.customer?.name || '').localeCompare(b.customer?.name || '');
        case 'loanAmount':
          const amountA = a.totalLoanAmount || 0;
          const amountB = b.totalLoanAmount || 0;
          return amountB - amountA;
        case 'dueDate':
          return new Date(a.dueDate) - new Date(b.dueDate);
        default:
          return 0;
      }
    });

    setFilteredLoans(filtered);
  }, [goldLoans, searchTerm, statusFilter, goldTypeFilter, sortBy]);

  // Calculate summary statistics
  const summary = {
    totalLoans: goldLoans.length,
    activeLoans: goldLoans.filter(l => l.status === 'ACTIVE').length,
    completedLoans: goldLoans.filter(l => l.status === 'COMPLETED' || l.status === 'CLOSED').length,
    overdueLoans: goldLoans.filter(l => {
      if (l.status !== 'ACTIVE') return false;
      const today = new Date();
      const dueDate = new Date(l.dueDate);
      return dueDate < today;
    }).length,
    totalAmount: goldLoans.reduce((sum, l) => sum + (l.totalLoanAmount || 0), 0),
    totalOutstanding: goldLoans.reduce((sum, l) => sum + (l.currentLoanAmount || l.totalLoanAmount || 0), 0),
    totalWeight: goldLoans.reduce((sum, l) => 
      sum + (l.items?.reduce((itemSum, item) => itemSum + (item.weightGram || 0), 0) || 0), 0
    )
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'COMPLETED':
      case 'CLOSED': return 'bg-blue-100 text-blue-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatWeight = (weight) => `${(parseFloat(weight) || 0).toFixed(0)}g`;

  const handleAddLoan = async (formData) => {
    try {
      const response = await ApiService.createGoldLoan(formData);
      if (response.success) {
        await loadGoldLoans(); // Refresh the list
        if (onRefresh) onRefresh();
        setShowAddLoan(false);
      } else {
        throw new Error(response.error || 'Failed to create gold loan');
      }
    } catch (error) {
      console.error('Error creating gold loan:', error);
      throw error; // Re-throw to let modal handle it
    }
  };

  const handleView = (loan) => {
    console.log('Viewing loan:', loan._id);
  };

  const handleEdit = (loan) => {
    console.log('Edit functionality for', loan._id, 'will be implemented');
  };

  const handlePayment = (loan) => {
    setSelectedLoan(loan);
    if (loan.type === 'INTEREST') {
      setShowInterestModal(true);
    } else if (loan.type === 'REPAYMENT') {
      setShowRepaymentModal(true);
    }
  };

  const handleSendReminder = (loan) => {
    setSelectedLoan(loan);
    setShowReminderModal(true);
  };

  const handleInterestPaymentSuccess = async (result) => {
    console.log('Interest payment successful:', result);
    await loadGoldLoans();
    if (onRefresh) onRefresh();
    setShowInterestModal(false);
    setSelectedLoan(null);
  };

  const handleRepaymentSuccess = async (result) => {
    console.log('Repayment successful:', result);
    await loadGoldLoans();
    if (onRefresh) onRefresh();
    setShowRepaymentModal(false);
    setSelectedLoan(null);
  };

  const handleReminderAction = (actionData) => {
    console.log('Reminder sent:', actionData);
    setShowReminderModal(false);
    setSelectedLoan(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-600" />
          <span className="text-gray-600">Loading gold loan data...</span>
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
          <h3 className="text-lg font-medium text-gray-900">Gold Loan Management</h3>
          <p className="text-sm text-gray-500">
            {customerId ? 'Customer gold loan history' : 'All gold loan transactions'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadGoldLoans}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddLoan(true)}
            className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Gold Loan
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Coins size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Loans</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalLoans}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Active: {summary.activeLoans}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalAmount)}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Disbursed loans</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <TrendingUp size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Outstanding</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalOutstanding)}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Pending repayment</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Weight size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Weight</p>
              <p className="text-2xl font-bold text-yellow-600">{formatWeight(summary.totalWeight)}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Gold pledged</p>
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
                placeholder="Search gold loans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CLOSED">Closed</option>
              <option value="OVERDUE">Overdue</option>
            </select>

            <select
              value={goldTypeFilter}
              onChange={(e) => setGoldTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Purity</option>
              <option value="24">24K</option>
              <option value="22">22K</option>
              <option value="18">18K</option>
              <option value="14">14K</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="createdAt">Latest First</option>
              <option value="customer">Customer Name</option>
              <option value="loanAmount">Loan Amount</option>
              <option value="dueDate">Due Date</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-amber-100 text-amber-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-amber-100 text-amber-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Gold Loans List */}
      <div className="space-y-4">
        {filteredLoans.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Coins size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Gold Loans Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || goldTypeFilter !== 'all' 
                ? 'No gold loans match your current filters.' 
                : customerId 
                  ? 'No gold loan records available for this customer.'
                  : 'No gold loan records available.'}
            </p>
            {searchTerm || statusFilter !== 'all' || goldTypeFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setGoldTypeFilter('all');
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => setShowAddLoan(true)}
                className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Add First Gold Loan
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLoans.map(loan => (
              <GoldLoanCard
                key={loan._id}
                loan={loan}
                onEdit={handleEdit}
                onView={handleView}
                onPayment={handlePayment}
                onSendReminder={handleSendReminder}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Gold Loan Directory ({filteredLoans.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Loan Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Gold Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Loan Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Outstanding
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semiboral text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLoans.map((loan) => (
                    <GoldLoanTableRow
                      key={loan._id}
                      loan={loan}
                      onEdit={handleEdit}
                      onView={handleView}
                      onPayment={handlePayment}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddLoan && (
        <AddGoldLoanModal
          isOpen={showAddLoan}
          onClose={() => setShowAddLoan(false)}
          onSave={handleAddLoan}
        />
      )}

      {showInterestModal && selectedLoan && (
        <InterestPaymentModal
          isOpen={showInterestModal}
          onClose={() => {
            setShowInterestModal(false);
            setSelectedLoan(null);
          }}
          loan={selectedLoan}
          onPaymentSuccess={handleInterestPaymentSuccess}
        />
      )}

      {showRepaymentModal && selectedLoan && (
        <ItemRepaymentModal
          isOpen={showRepaymentModal}
          onClose={() => {
            setShowRepaymentModal(false);
            setSelectedLoan(null);
          }}
          loan={selectedLoan}
          onRepaymentSuccess={handleRepaymentSuccess}
        />
      )}

      {showReminderModal && selectedLoan && (
        <PaymentReminderModal
          isOpen={showReminderModal}
          onClose={() => {
            setShowReminderModal(false);
            setSelectedLoan(null);
          }}
          loan={selectedLoan}
          onAction={handleReminderAction}
        />
      )}
    </div>
  );
};

export default GoldLoanTab;
