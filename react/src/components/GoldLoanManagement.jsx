// components/GoldLoanManagement.jsx - Complete Implementation with Notification System
import { useState, useEffect } from "react";
import { mockGoldLoans } from "../data/mockGoldLoans";
import GoldLoanCard from "./GoldLoanCard";
import GoldLoanSearchFilterBar from "./GoldLoanSearchFilterBar";
import StatsCard from "./StatsCard";
import AddGoldLoanModal from "./AddGoldLoanModal";
import GoldLoanTableRow from "./GoldLoanTableRow";
import NotificationBell from "./NotificationBell";
import PaymentReminderModal from "./PaymentReminderModal";
import DueDateCalendar from "./DueDateCalendar";
import { useNotifications } from "./useNotifications";
import { 
  Download, 
  Plus, 
  Coins,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  FileText,
  Bell,
  Calendar,
  Clock,
  Filter,
  Grid,
  List
} from 'lucide-react';

const GoldLoanManagement = () => {
  const [goldLoans, setGoldLoans] = useState(mockGoldLoans);
  const [filteredLoans, setFilteredLoans] = useState(mockGoldLoans);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [goldTypeFilter, setGoldTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('loanId');
  const [viewMode, setViewMode] = useState('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [activeTab, setActiveTab] = useState('loans'); // 'loans', 'notifications', 'calendar'

  // Use notifications hook
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(goldLoans);

  // Calculate stats
  const stats = {
    total: goldLoans.length,
    active: goldLoans.filter(loan => loan.status === 'active').length,
    overdue: goldLoans.filter(loan => loan.status === 'overdue').length,
    totalAmount: goldLoans.reduce((sum, loan) => sum + loan.loanAmount, 0),
    totalOutstanding: goldLoans.reduce((sum, loan) => sum + loan.outstandingAmount, 0),
    totalWeight: goldLoans.reduce((sum, loan) => sum + loan.goldWeight, 0),
    // New notification stats
    dueTomorrow: notifications.filter(n => n.daysDiff === 1).length,
    dueToday: notifications.filter(n => n.daysDiff === 0).length,
    urgentActions: notifications.filter(n => n.priority === 'high').length
  };

  // Filter and sort loans
  useEffect(() => {
    let filtered = [...goldLoans];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(loan =>
        loan.id.toLowerCase().includes(term) ||
        loan.customerName.toLowerCase().includes(term) ||
        loan.customerPhone.toLowerCase().includes(term) ||
        loan.goldItem.toLowerCase().includes(term) ||
        loan.goldType.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(loan => loan.status === statusFilter);
    }

    // Apply gold type filter
    if (goldTypeFilter !== 'all') {
      filtered = filtered.filter(loan => loan.goldType === goldTypeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'loanId':
          return a.id.localeCompare(b.id);
        case 'customer':
          return a.customerName.localeCompare(b.customerName);
        case 'amount':
          return b.loanAmount - a.loanAmount;
        case 'dueDate':
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'createdDate':
          return new Date(b.startDate) - new Date(a.startDate);
        case 'weight':
          return b.goldWeight - a.goldWeight;
        default:
          return 0;
      }
    });

    setFilteredLoans(filtered);
  }, [goldLoans, searchTerm, statusFilter, goldTypeFilter, sortBy]);

  const handleAddLoan = (formData) => {
    const newLoan = {
      ...formData,
      id: `LOAN${String(goldLoans.length + 1).padStart(3, '0')}`,
      customerId: formData.customerId || `CUS${String(goldLoans.length + 1).padStart(3, '0')}`
    };
    setGoldLoans(prev => [...prev, newLoan]);
    setShowAddModal(false);
  };

  const handleEdit = (loan) => {
    alert(`Edit functionality for ${loan.id} will be implemented in the next phase`);
  };

  const handleView = (loan) => {
    alert(`Detailed view for ${loan.id} will be implemented in the next phase`);
  };

  const handlePayment = (loan) => {
    alert(`Payment functionality for ${loan.id} will be implemented in the next phase`);
  };

  const handleSendReminder = (loan) => {
    setSelectedLoan(loan);
    setShowReminderModal(true);
  };

  const handleReminderAction = (actionData) => {
    console.log('Reminder sent:', actionData);
    // Here you can implement the logic to track reminder history
  };

  const handleCalendarLoanClick = (loansForDay) => {
    // Show loans for selected day in a modal or filter the main view
    console.log('Loans for selected day:', loansForDay);
  };

  const handleExport = () => {
    // Enhanced CSV export with notification data
    const csvContent = [
      [
        'Loan ID', 'Customer', 'Phone', 'Gold Item', 'Weight (g)', 'Type', 'Purity', 
        'Loan Amount', 'Outstanding', 'Interest Rate', 'Start Date', 'Due Date', 'Status',
        'Days Until Due', 'Notification Priority'
      ],
      ...filteredLoans.map(loan => {
        const notification = notifications.find(n => n.loanId === loan.id);
        return [
          loan.id,
          loan.customerName,
          loan.customerPhone,
          loan.goldItem,
          loan.goldWeight,
          loan.goldType,
          loan.purity,
          loan.loanAmount,
          loan.outstandingAmount,
          loan.interestRate,
          loan.startDate,
          loan.dueDate,
          loan.status,
          notification ? notification.daysDiff : '',
          notification ? notification.priority : ''
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Header with Notification Bell */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gold Loan Management</h1>
            <p className="text-gray-600">Manage loans, track payments, and send reminders</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <NotificationBell loans={goldLoans} />
            
            {/* Quick Action Buttons */}
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
            Loans
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
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'calendar'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar size={16} />
            Calendar
          </button>
        </div>

        {/* Enhanced Stats Cards with Notification Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatsCard
            title="Total Loans"
            value={stats.total}
            icon={FileText}
            iconColor="text-blue-600"
            trend="+12 this month"
            className="bg-blue-50 border-blue-200"
          />
          <StatsCard
            title="Active Loans"
            value={stats.active}
            icon={TrendingUp}
            iconColor="text-green-600"
            trend="85% active rate"
            className="bg-green-50 border-green-200"
          />
          <StatsCard
            title="Overdue"
            value={stats.overdue}
            icon={AlertTriangle}
            iconColor="text-red-600"
            trend="-2 from last week"
            className="bg-red-50 border-red-200"
          />
          <StatsCard
            title="Due Today"
            value={stats.dueToday}
            icon={Clock}
            iconColor="text-yellow-600"
            trend="Immediate attention"
            className="bg-yellow-50 border-yellow-200"
          />
          <StatsCard
            title="Total Amount"
            value={formatCurrency(stats.totalAmount)}
            icon={DollarSign}
            iconColor="text-purple-600"
            trend="+18% growth"
            className="bg-purple-50 border-purple-200"
          />
          <StatsCard
            title="Gold Weight"
            value={`${stats.totalWeight}g`}
            icon={Coins}
            iconColor="text-amber-600"
            trend="Total pledged"
            className="bg-amber-50 border-amber-200"
          />
        </div>

        {/* Main Content Area */}
        {activeTab === 'loans' && (
          <>
            {/* Search and Filter Bar */}
            <GoldLoanSearchFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              goldTypeFilter={goldTypeFilter}
              onGoldTypeFilterChange={setGoldTypeFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {/* Loans Display */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLoans.map(loan => (
                  <GoldLoanCard
                    key={loan.id}
                    loan={loan}
                    onEdit={handleEdit}
                    onView={handleView}
                    onPayment={handlePayment}
                    onSendReminder={handleSendReminder}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Loan Details</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Customer</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Gold Info</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLoans.map(loan => (
                        <GoldLoanTableRow
                          key={loan.id}
                          loan={loan}
                          onEdit={handleEdit}
                          onView={handleView}
                          onPayment={handlePayment}
                          onSendReminder={handleSendReminder}
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
                          {notification.loanId} • ₹{notification.outstandingAmount.toLocaleString()} • Due: {notification.dueDate}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.location.href = `tel:${notification.customerPhone}`}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-full hover:bg-green-700 transition-colors"
                          >
                            Call
                          </button>
                          <button
                            onClick={() => handleSendReminder(goldLoans.find(l => l.id === notification.loanId))}
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

        {activeTab === 'calendar' && (
          <DueDateCalendar loans={goldLoans} onLoanClick={handleCalendarLoanClick} />
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddGoldLoanModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddLoan}
        />
      )}

      {showReminderModal && (
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