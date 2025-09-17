// components/GoldLoanManagement.jsx - Complete Implementation with Fixed Layout
import { useState, useEffect } from "react";
import {GoldLoanCard} from "./GoldLoanCard";
import GoldLoanSearchFilterBar from "./GoldLoanSearchFilterBar";
import StatsCard from "./StatsCard";
import AddGoldLoanModal from "./AddGoldLoanModal";
import GoldLoanTableRow from "./GoldLoanTableRow";
import NotificationBell from "./NotificationBell";
import PaymentReminderModal from "./PaymentReminderModal";
import DueDateCalendar from "./DueDateCalendar";
import { useNotifications } from "./useNotifications";
import ApiService from "../services/api";
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

const GoldLoanManagement = () => {
  const [goldLoans, setGoldLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [viewMode, setViewMode] = useState('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
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

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(goldLoans);

  // Load gold loans data
  const loadGoldLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.getAllGoldLoans({
        page: 1,
        limit: 100, // Adjust as needed
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      
      if (response.success) {
        setGoldLoans(response.data);
        calculateStats(response.data);
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

  // Calculate dashboard statistics
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
      totalAmount: loans.reduce((sum, loan) => sum + (loan.principalPaise ? loan.principalPaise / 100 : 0), 0),
      totalOutstanding: loans.reduce((sum, loan) => {
        const outstanding = loan.currentPrincipalPaise ? loan.currentPrincipalPaise / 100 : 
                          loan.principalPaise ? loan.principalPaise / 100 : 0;
        return sum + outstanding;
      }, 0),
      totalWeight: loans.reduce((sum, loan) => {
        const weight = loan.items?.reduce((itemSum, item) => itemSum + (item.weightGram || 0), 0) || 0;
        return sum + weight;
      }, 0)
    };

    // Calculate due dates
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
          const amountA = a.principalPaise || 0;
          const amountB = b.principalPaise || 0;
          return amountB - amountA;
        case 'dueDate':
          return new Date(a.dueDate) - new Date(b.dueDate);
        default:
          return 0;
      }
    });

    setFilteredLoans(filtered);
  }, [goldLoans, searchTerm, statusFilter, sortBy]);

  // Load data on component mount and when filters change
  useEffect(() => {
    loadGoldLoans();
  }, []);

  // Handle form submissions and actions
  const handleAddLoan = async (formData) => {
    try {
      const response = await ApiService.createGoldLoan(formData);
      if (response.success) {
        setShowAddModal(false);
        await loadGoldLoans(); // Refresh the list
        alert('Gold loan created successfully!');
      }
    } catch (error) {
      alert('Error creating gold loan: ' + error.message);
    }
  };

  const handleEdit = (loan) => {
    // For now, just show an alert. You can implement edit modal later
    alert(`Edit functionality for ${loan._id} will be implemented`);
  };

  const handleView = (loan) => {
    // This is handled by the modal in GoldLoanCard
    console.log('Viewing loan:', loan._id);
  };

  const handlePayment = async (loan) => {
    try {
      // Get payment options first
      const options = await ApiService.getRepaymentOptions(loan._id);
      // Show payment modal with options
      alert(`Payment options for ${loan._id}:\n${JSON.stringify(options.data?.preFilledAmounts, null, 2)}`);
    } catch (error) {
      alert('Error getting payment options: ' + error.message);
    }
  };

  const handleSendReminder = (loan) => {
    setSelectedLoan(loan);
    setShowReminderModal(true);
  };

  const handleReminderAction = (actionData) => {
    console.log('Reminder sent:', actionData);
    setShowReminderModal(false);
    // Implement reminder sending logic here
  };

  const handleExport = () => {
    // Enhanced CSV export
    const csvContent = [
      [
        'Loan ID', 'Customer', 'Phone', 'Items Count', 'Weight (g)', 
        'Loan Amount', 'Outstanding', 'Interest Rate', 'Start Date', 'Due Date', 'Status'
      ],
      ...filteredLoans.map(loan => {
        const loanAmount = loan.principalPaise ? loan.principalPaise / 100 : 0;
        const outstanding = loan.currentPrincipalPaise ? loan.currentPrincipalPaise / 100 : loanAmount;
        const totalWeight = loan.items?.reduce((sum, item) => sum + (item.weightGram || 0), 0) || 0;
        
        return [
          loan._id,
          loan.customer?.name || 'Unknown',
          loan.customer?.phone || 'N/A',
          loan.items?.length || 0,
          totalWeight,
          loanAmount,
          outstanding,
          loan.interestRateMonthlyPct || 0,
          loan.startDate ? new Date(loan.startDate).toLocaleDateString() : '',
          loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : '',
          loan.status
        ];
      })
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gold-loans-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount) => `₹${(amount / 100000).toFixed(1)}L`;

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
              loadGoldLoans();
            }}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
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
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gold Loan Management</h1>
            <p className="text-gray-600 mt-1">Manage your gold loans, payments, and customer relationships</p>
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
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-lg"
            >
              <Plus size={16} />
              New Loan
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
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

        {/* Stats Cards */}
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
            value={formatCurrency(stats.totalAmount * 100000)}
            icon={DollarSign}
            iconColor="text-purple-600"
            trend="Disbursed"
            className="bg-purple-50 border-purple-200"
          />
          <StatsCard
            title="Gold Weight"
            value={`${stats.totalWeight.toFixed(0)}g`}
            icon={Coins}
            iconColor="text-amber-600"
            trend="Total pledged"
            className="bg-amber-50 border-amber-200"
          />
        </div>

        {/* Main Content Area */}
        {activeTab === 'loans' && (
          <>
            <GoldLoanSearchFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onRefresh={loadGoldLoans}
              loading={loading}
            />

            {loading ? (
              <div className="text-center py-12">
                <RefreshCw size={48} className="mx-auto text-gray-300 mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Gold Loans</h3>
                <p className="text-gray-600">Please wait while we fetch your data...</p>
              </div>
            ) : filteredLoans.length === 0 ? (
              <div className="text-center py-12">
                <Coins size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Gold Loans Found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first gold loan'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Create First Loan
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
                              const loan = goldLoans.find(l => l._id === notification.loanId);
                              if (loan) handleSendReminder(loan);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition-colors"
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
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddGoldLoanModal
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
    </div>
  );
};


export default GoldLoanManagement;
