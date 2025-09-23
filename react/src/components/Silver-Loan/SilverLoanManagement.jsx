import { useState, useEffect } from "react";
import { SilverLoanCard } from "./SilverLoanCard";
import SilverLoanSearchFilterBar from "./SilverLoanSearchFilterBar";
import StatsCard from "../StatsCard";
import AddSilverLoanModal from "./AddSilverLoanModal.jsx";
import SilverLoanTableRow from "./SilverLoanTableRow";
import NotificationBell from "../Gold-Loan/NotificationBell";
import PaymentReminderModal from "../Gold-Loan/PaymentReminderModal";
import InterestPaymentModal from "./SilverInterestPaymentModal";
import ItemRepaymentModal from "./SilverItemRepaymentModal.jsx";
import { useNotifications } from "../useNotifications";
import ApiService from "../../services/api";
import {
  Download,
  Plus,
  Coins,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  FileText,
  Bell,
  RefreshCw,
  Calendar,
  Clock,
  Filter,
  Grid,
  List
} from 'lucide-react';

const SilverLoanManagement = () => {
  const [silverLoans, setSilverLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('loanId');
  const [viewMode, setViewMode] = useState('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showInterestPaymentModal, setShowInterestPaymentModal] = useState(false);
  const [showItemRepaymentModal, setShowItemRepaymentModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [activeTab, setActiveTab] = useState('loans');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    overdue: 0,
    completed: 0,
    totalAmount: 0,
    totalOutstanding: 0,
    totalWeight: 0,
    dueTomorrow: 0,
    dueToday: 0,
    urgentActions: 0
  });
  const [silverTypeFilter, setSilverTypeFilter] = useState('all');
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(silverLoans);

  const calculateDueDate = (loan) => {
    if (!loan.startDate) return null;
    const startDate = new Date(loan.startDate);
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + 1);
    return dueDate;
  };

  const loadSilverLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.getAllSilverLoans({
        page: 1,
        limit: 100,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      if (response.success) {
        const loansWithDueDates = response.data.map(loan => ({
          ...loan,
          dueDate: calculateDueDate(loan)
        }));
        setSilverLoans(loansWithDueDates);
        calculateStats(loansWithDueDates);
      } else {
        throw new Error(response.error || 'Failed to fetch silver loans');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading silver loans:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (loans) => {
    const newStats = {
      total: loans.length,
      active: loans.filter(loan => loan.status === 'ACTIVE').length,
      overdue: loans.filter(loan => {
        if (loan.status !== 'ACTIVE') return false;
        const today = new Date();
        const dueDate = new Date(loan.dueDate);
        return dueDate < today;
      }).length,
      completed: loans.filter(loan => loan.status === 'COMPLETED').length,
      closed: loans.filter(loan => loan.status === 'CLOSED').length,
      totalAmount: loans.reduce((sum, loan) => sum + (loan.totalLoanAmount || 0), 0),
      totalOutstanding: loans.reduce((sum, loan) => sum + (loan.outstandingAmount || loan.currentPrincipal || 0), 0),
      totalWeight: loans.reduce((sum, loan) => {
        const weight = loan.items?.reduce((itemSum, item) => itemSum + (item.weightGram || 0), 0) || 0;
        return sum + weight;
      }, 0)
    };

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    newStats.dueToday = loans.filter(loan => {
      if (loan.status !== 'ACTIVE') return false;
      const dueDate = new Date(loan.dueDate);
      return dueDate.toDateString() === today.toDateString();
    }).length;

    newStats.dueTomorrow = loans.filter(loan => {
      if (loan.status !== 'ACTIVE') return false;
      const dueDate = new Date(loan.dueDate);
      return dueDate.toDateString() === tomorrow.toDateString();
    }).length;

    newStats.urgentActions = newStats.overdue + newStats.dueToday;

    setStats(newStats);
  };

  useEffect(() => {
    let filtered = [...silverLoans];

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

    if (silverTypeFilter !== 'all') {
      filtered = filtered.filter(loan =>
        loan.items?.some(item => String(item.purityK) === silverTypeFilter)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(loan => loan.status === statusFilter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'customer':
          return (a.customer?.name || '').localeCompare(b.customer?.name || '');
        case 'loanAmount':
          return (b.totalLoanAmount || 0) - (a.totalLoanAmount || 0);
        case 'dueDate':
          return new Date(a.dueDate) - new Date(b.dueDate);
        default:
          return 0;
      }
    });

    setFilteredLoans(filtered);
  }, [silverLoans, searchTerm, statusFilter, silverTypeFilter, sortBy]);

  useEffect(() => {
    loadSilverLoans();
  }, []);

  const handleAddLoan = async (formData) => {
    try {
      const response = await ApiService.createSilverLoan(formData);
      if (response.success) {
        await loadSilverLoans();
      }
    } catch (error) {
      alert('Error creating silver loan: ' + error.message);
      throw error;
    }
  };

  const handleEdit = (loan) => {
    alert(`Edit functionality for ${loan._id} will be implemented`);
  };

  const handleView = (loan) => {
    console.log('Viewing loan:', loan._id);
  };

  const handlePayment = async (loan) => {
    if (loan.type === 'INTEREST') {
      setSelectedLoan(loan);
      setShowInterestPaymentModal(true);
    } else if (loan.type === 'REPAYMENT') {
      setSelectedLoan(loan);
      setShowItemRepaymentModal(true);
    }
    window.location.reload();
  };

  const [refreshing, setRefreshing] = useState(false);

  const handleInterestPaymentSuccess = async (result) => {
    console.log('Interest payment successful:', result);
    try {
      setRefreshing(true);
      await loadSilverLoans();
      alert(`Interest payment recorded successfully! Receipt: ${result.data?.receiptNumber || 'Generated'}`);
    } catch (error) {
      console.error('Error refreshing loan data:', error);
      alert(`Interest payment recorded successfully, but failed to refresh data. Please refresh manually.`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleItemRepaymentSuccess = async (result) => {
    console.log('Item repayment successful:', result);
    await loadSilverLoans();
    alert(`Repayment processed successfully! Receipt: ${result.data?.receiptNumber || 'Generated'}`);
  };

  const handleSendReminder = (loan) => {
    setSelectedLoan(loan);
    setShowReminderModal(true);
  };

  const handleReminderAction = (actionData) => {
    console.log('Reminder sent:', actionData);
    setShowReminderModal(false);
  };

  const handleExport = () => {
    const csvContent = [
      [
        'Loan ID', 'Customer', 'Phone', 'Items Count', 'Weight (g)',
        'Loan Amount', 'Outstanding', 'Interest Rate', 'Start Date', 'Due Date', 'Status'
      ],
      ...filteredLoans.map(loan => [
        loan._id,
        loan.customer?.name || 'Unknown',
        loan.customer?.phone || 'N/A',
        loan.items?.length || 0,
        loan.items?.reduce((sum, item) => sum + (item.weightGram || 0), 0) || 0,
        loan.totalLoanAmount || 0,
        loan.outstandingAmount || 0,
        loan.interestRateMonthlyPct || 0,
        loan.startDate ? new Date(loan.startDate).toLocaleDateString() : '',
        loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : '',
        loan.status
      ])
    ].map(row => row.join(',')).join('\n');
   
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `silver-loans-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount) => `₹${amount?.toLocaleString() || '0'}`;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md w-full text-center">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadSilverLoans();
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Silver Loan Management</h1>
            <p className="text-gray-600 mt-1">Manage your silver loans, payments, and customer relationships</p>
          </div>
         
          <div className="flex items-center gap-3">
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onToggle={() => setActiveTab('notifications')}
            />
           
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center gap-2 font-medium shadow-sm"
            >
              <Download size={16} />
              Export
            </button>
           
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-lg"
            >
              <Plus size={16} />
              New Loan
            </button>
          </div>
        </div>

        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'loans'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Grid size={16} />
            Loans ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all relative flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bell size={16} />
            Notifications
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatsCard
            title="Total Loans"
            value={stats.total}
            icon={FileText}
            iconColor="text-blue-600"
            trend="All time"
            className="bg-blue-50 border-blue-200"
          />
          <StatsCard
            title="Active Loans"
            value={stats.active}
            icon={TrendingUp}
            iconColor="text-green-600"
            trend="Currently active"
            className="bg-green-50 border-green-200"
          />
          <StatsCard
            title="Overdue"
            value={stats.overdue}
            icon={AlertTriangle}
            iconColor="text-red-600"
            trend="Needs attention"
            className="bg-red-50 border-red-200"
          />
          <StatsCard
            title="Due Today"
            value={stats.dueToday}
            icon={Clock}
            iconColor="text-yellow-600"
            trend="Immediate action"
            className="bg-yellow-50 border-yellow-200"
          />
          <StatsCard
            title="Total Amount"
            value={formatCurrency(stats.totalAmount)}
            icon={DollarSign}
            iconColor="text-purple-600"
            trend="Disbursed"
            className="bg-purple-50 border-purple-200"
          />
          <StatsCard
            title="Silver Weight"
            value={`${stats.totalWeight.toFixed(0)}g`}
            icon={Coins}
            iconColor="text-gray-600"
            trend="Total pledged"
            className="bg-gray-50 border-gray-200"
          />
        </div>

        {activeTab === 'loans' && (
          <>
            <SilverLoanSearchFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              silverTypeFilter={silverTypeFilter}
              onSilverTypeFilterChange={setSilverTypeFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onRefresh={loadSilverLoans}
              loading={loading}
            />

            {loading ? (
              <div className="text-center py-12">
                <RefreshCw size={48} className="mx-auto text-gray-300 mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Silver Loans</h3>
                <p className="text-gray-600">Please wait while we fetch your data...</p>
              </div>
            ) : filteredLoans.length === 0 ? (
              <div className="text-center py-12">
                <Coins size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Silver Loans Found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first silver loan'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Create First Loan
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLoans.map(loan => (
                  <SilverLoanCard
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
                  <h3 className="text-lg font-semibold text-gray-900">Loan Directory ({filteredLoans.length})</h3>
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
                          Silver Details
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
                          Photos
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLoans.map((loan) => (
                        <SilverLoanTableRow
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
          </>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Payment Notifications</h2>
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Mark All as Read
              </button>
            </div>
           
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
                  <p className="text-gray-600">All payments are up to date!</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${
                      !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">{notification.customerName}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                            notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {notification.message}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.loanId} • ₹{notification.outstandingAmount?.toLocaleString()} • Due: {
                            new Date(notification.dueDate).toLocaleDateString('en-IN')
                          }
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.location.href = `tel:${notification.customerPhone}`}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-full hover:bg-green-700 transition-colors"
                          >
                            Call
                          </button>
                          <button
                            onClick={() => {
                              const loan = silverLoans.find(l => l._id === notification.loanId);
                              if (loan) {
                                setSelectedLoan(loan);
                                setShowInterestPaymentModal(true);
                              }
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition-colors"
                          >
                            Record Payment
                          </button>
                          <button
                            onClick={() => {
                              const loan = silverLoans.find(l => l._id === notification.loanId);
                              if (loan) handleSendReminder(loan);
                            }}
                            className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full hover:bg-purple-700 transition-colors"
                          >
                            Send Reminder
                          </button>
                        </div>
                      </div>
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm ml-4"
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {showAddModal && (
          <AddSilverLoanModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSave={handleAddLoan}
          />
        )}

        {showReminderModal && selectedLoan && (
          <PaymentReminderModal
            isOpen={showReminderModal}
            onClose={() => setShowReminderModal(false)}
            loan={selectedLoan}
            onAction={handleReminderAction}
          />
        )}

        {showInterestPaymentModal && selectedLoan && (
          <InterestPaymentModal
            isOpen={showInterestPaymentModal}
            onClose={() => {
              setShowInterestPaymentModal(false);
              setSelectedLoan(null);
            }}
            loan={selectedLoan}
            onPaymentSuccess={handleInterestPaymentSuccess}
          />
        )}

        {showItemRepaymentModal && selectedLoan && (
          <ItemRepaymentModal
            isOpen={showItemRepaymentModal}
            onClose={() => {
              setShowItemRepaymentModal(false);
              setSelectedLoan(null);
            }}
            loan={selectedLoan}
            onRepaymentSuccess={handleItemRepaymentSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default SilverLoanManagement;