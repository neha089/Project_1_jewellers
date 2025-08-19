// components/GoldLoanManagement.jsx
import { useState, useEffect } from "react";
import { mockGoldLoans } from "../data/mockGoldLoans";
import GoldLoanCard from "./GoldLoanCard";
import GoldLoanSearchFilterBar from "./GoldLoanSearchFilterBar";
import StatsCard from "./StatsCard";
import AddGoldLoanModal from "./AddGoldLoanModal";
import GoldLoanTableRow from "./GoldLoanTableRow";
import { 
  Download, 
  Plus, 
  Coins,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  FileText
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

  // Calculate stats
  const stats = {
    total: goldLoans.length,
    active: goldLoans.filter(loan => loan.status === 'active').length,
    overdue: goldLoans.filter(loan => loan.status === 'overdue').length,
    totalAmount: goldLoans.reduce((sum, loan) => sum + loan.loanAmount, 0),
    totalOutstanding: goldLoans.reduce((sum, loan) => sum + loan.outstandingAmount, 0),
    totalWeight: goldLoans.reduce((sum, loan) => sum + loan.goldWeight, 0)
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

  const handleExport = () => {
    // Simple CSV export functionality
    const csvContent = [
      ['Loan ID', 'Customer', 'Phone', 'Gold Item', 'Weight (g)', 'Type', 'Purity', 'Loan Amount', 'Outstanding', 'Interest Rate', 'Start Date', 'Due Date', 'Status'],
      ...filteredLoans.map(loan => [
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
        loan.status
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gold-loans.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount) => `₹${(amount / 100000).toFixed(1)}L`;

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-row gap-3">
            <button
              onClick={handleExport}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-sm"
            >
              <Download size={16} />
              Export Data
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg"
            >
              <Plus size={16} />
              New Gold Loan
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            icon={FileText}
            title="Total Loans"
            value={stats.total}
            subtitle={`${stats.active} active`}
            color="blue"
          />
          <StatsCard
            icon={TrendingUp}
            title="Active Loans"
            value={stats.active}
            subtitle={`${((stats.active / stats.total) * 100).toFixed(1)}% of total`}
            color="green"
          />
          <StatsCard
            icon={AlertTriangle}
            title="Overdue Loans"
            value={stats.overdue}
            subtitle={stats.overdue > 0 ? "Needs attention" : "All up to date"}
            color={stats.overdue > 0 ? "orange" : "gray"}
          />
          <StatsCard
            icon={DollarSign}
            title="Total Amount"
            value={formatCurrency(stats.totalAmount)}
            subtitle="Total loan value"
            color="purple"
          />
          <StatsCard
            icon={Coins}
            title="Gold Weight"
            value={`${stats.totalWeight.toFixed(1)}g`}
            subtitle="Total pledged gold"
            color="yellow"
          />
        </div>

        {/* Search and Filter Bar */}
        <GoldLoanSearchFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          goldTypeFilter={goldTypeFilter}
          setGoldTypeFilter={setGoldTypeFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredLoans.length} of {goldLoans.length} gold loans
          </p>
          {(searchTerm || statusFilter !== 'all' || goldTypeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setGoldTypeFilter('all');
              }}
              className="text-sm text-amber-600 hover:text-amber-800 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Gold Loan Grid/Table View */}
        {filteredLoans.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Coins size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No gold loans found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || goldTypeFilter !== 'all'
                ? 'Try adjusting your search or filter criteria' 
                : 'Get started by creating your first gold loan'}
            </p>
                     {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 mx-auto font-medium"
              >
                <UserPlus size={16} />
                Add Your First Customer
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLoans.map((loan) => (
              <GoldLoanCard
                key={loan.id}
                loan={loan}
                onEdit={handleEdit}
                onView={handleView}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Customer Directory</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Loans
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Amount
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
                      key={loan.id}
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

        {/* Add Customer Modal */}
        <AddGoldLoanModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddLoan}
        />
      </div>
    </div>
  );
};

export default GoldLoanManagement;
