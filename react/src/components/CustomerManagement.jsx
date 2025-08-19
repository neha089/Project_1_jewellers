import { useState,useEffect } from "react";
import { mockCustomers } from "../data/mockCustomers";
import CustomerCard from "./CustomerCard";
import SearchFilterBar from "./SearchFilterBar";
import StatsCard from "./StatsCard";
import AddCustomerModal from "./AddCustomerModal";
import CustomerTableRow from "./CustomerTableRow";
import { 
  Download, 
  UserPlus, 
  Users,
  TrendingUp,
  DollarSign,
  FileText
} from 'lucide-react';
const CustomerManagement = () => {
  const [customers, setCustomers] = useState(mockCustomers);
  const [filteredCustomers, setFilteredCustomers] = useState(mockCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');
  const [showAddModal, setShowAddModal] = useState(false);

  // Calculate stats
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    totalLoans: customers.reduce((sum, c) => sum + c.totalLoans, 0),
    totalAmount: customers.reduce((sum, c) => sum + c.totalAmount, 0)
  };

  // Filter and sort customers
  useEffect(() => {
    let filtered = [...customers];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(customer =>
        `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(term) ||
        customer.phone.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.id.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'date':
          return new Date(b.joinDate) - new Date(a.joinDate);
        case 'loans':
          return b.totalLoans - a.totalLoans;
        default:
          return 0;
      }
    });

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, statusFilter, sortBy]);

  const handleAddCustomer = (formData) => {
    const newCustomer = {
      ...formData,
      id: `CUS${String(customers.length + 1).padStart(3, '0')}`,
      joinDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      totalLoans: 0,
      totalAmount: 0,
      status: 'active',
      address: formData.address || `${formData.city}${formData.city && formData.state ? ', ' : ''}${formData.state}`
    };
    setCustomers(prev => [...prev, newCustomer]);
    setShowAddModal(false);
  };

  const handleEdit = (customer) => {
    alert(`Edit functionality for ${customer.firstName} ${customer.lastName} will be implemented in the next phase`);
  };

  const handleView = (customer) => {
    alert(`Detailed view for ${customer.firstName} ${customer.lastName} will be implemented in the next phase`);
  };

  const handleExport = () => {
    // Simple CSV export functionality
    const csvContent = [
      ['ID', 'Name', 'Phone', 'Email', 'Address', 'Total Loans', 'Total Amount', 'Status'],
      ...filteredCustomers.map(c => [
        c.id,
        `${c.firstName} ${c.lastName}`,
        c.phone,
        c.email,
        c.address,
        c.totalLoans,
        c.totalAmount,
        c.status
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-row sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-row sm:flex-row gap-3">
            <button
              onClick={handleExport}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-sm"
            >
              <Download size={16} />
              Export Data
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg"
            >
              <UserPlus size={16} />
              Add Customer
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            icon={Users}
            title="Total Customers"
            value={stats.total}
            subtitle={`${stats.active} active`}
            color="blue"
          />
          <StatsCard
            icon={TrendingUp}
            title="Active Customers"
            value={stats.active}
            subtitle={`${((stats.active / stats.total) * 100).toFixed(1)}% of total`}
            color="green"
          />
          <StatsCard
            icon={FileText}
            title="Total Loans"
            value={stats.totalLoans}
            subtitle="Across all customers"
            color="purple"
          />
          <StatsCard
            icon={DollarSign}
            title="Total Amount"
            value={`₹${(stats.totalAmount / 100000).toFixed(1)}L`}
            subtitle="Total loan amount"
            color="orange"
          />
        </div>

        {/* Search and Filter Bar */}
        <SearchFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredCustomers.length} of {customers.length} customers
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Customer Grid/Table View */}
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Users size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Get started by adding your first customer'}
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
          <div className="grid grid-cols-3 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
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
                  {filteredCustomers.map((customer) => (
                    <CustomerTableRow
                      key={customer.id}
                      customer={customer}
                      onEdit={handleEdit}
                      onView={handleView}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Customer Modal */}
        <AddCustomerModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddCustomer}
        />
      </div>
    </div>
  );
};

export default CustomerManagement;