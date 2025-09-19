import { useState, useEffect } from "react";
import CustomerCard from "./CustomerCard";
import SearchFilterBar from "./SearchFilterBar";
import StatsCard from "./StatsCard";
import AddCustomerModal from "./AddCustomerModal";
import CustomerTableRow from "./CustomerTableRow";
import CustomerDetailView from "./CustomerDetailView";
import CustomerSearch from "./CustomerSearch"; 

// Fix the import - add .js extension and ensure correct path
import ApiService from "../services/api.js";
import {
  Download,
  UserPlus,
  Users,
  TrendingUp,
  DollarSign,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react';




const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Customer detail view state
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [showDetailView, setShowDetailView] = useState(false);




  // Calculate stats
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    totalLoans: customers.reduce((sum, c) => sum + (c.totalLoans || 0), 0),
    totalAmount: customers.reduce((sum, c) => sum + (c.totalAmount || 0), 0)
  };




  // Enhanced load customers with better error handling and debugging
  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
     
      // Add debugging
      console.log('ApiService object:', ApiService);
      console.log('getAllCustomers method:', typeof ApiService.getAllCustomers);
     
      // Check if the method exists
      if (typeof ApiService.getAllCustomers !== 'function') {
        throw new Error('ApiService.getAllCustomers is not available. Check your API service import.');
      }
     
      const response = await ApiService.getAllCustomers(1, 1000);
      console.log('Raw API response:', response);
     
      // More flexible response handling
      let customersData = [];
     
      if (response && response.success && response.data) {
        // Handle different possible response structures
        if (Array.isArray(response.data.customers)) {
          customersData = response.data.customers;
        } else if (Array.isArray(response.data)) {
          customersData = response.data;
        } else if (Array.isArray(response.customers)) {
          customersData = response.customers;
        } else {
          console.warn('Unexpected response structure:', response);
          throw new Error('Invalid response structure from API');
        }
      } else if (response && Array.isArray(response)) {
        // Direct array response
        customersData = response;
      } else {
        console.error('API response:', response);
        throw new Error(response?.message || 'Invalid response from server');
      }




      console.log('Customers data to transform:', customersData);




      // Transform API data to match frontend structure
      const transformedCustomers = customersData.map(customer => {
        // Handle different customer data structures
        const name = customer.name || '';
        const nameParts = name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';




        return {
          id: customer._id || customer.id,
          firstName,
          lastName,
          phone: customer.phone || '',
          email: customer.email || '',
          address: customer.address ?
            `${customer.address.street || ''} ${customer.address.city || ''} ${customer.address.state || ''}`.trim() :
            `${customer.city || ''} ${customer.state || ''}`.trim(),
          city: customer.address?.city || customer.city || '',
          state: customer.address?.state || customer.state || '',
          pinCode: customer.address?.pincode || customer.pincode || '',
          joinDate: customer.createdAt ?
            new Date(customer.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }) : 'Unknown',
          totalLoans: customer.totalLoans || 0,
          totalAmount: (customer.totalAmountTakenByUs || 0) / 100, // Convert paise to rupees
          status: customer.status || 'active',
          adhaarNumber: customer.adhaarNumber || '',
          rawData: customer // Keep original data for reference
        };
      });
     
      console.log('Transformed customers:', transformedCustomers);
      setCustomers(transformedCustomers);
     
    } catch (error) {
      console.error('Error loading customers:', error);
      setError(error.message || 'Failed to load customers');
     
      // Set empty array to prevent further errors
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };




  // Search customers with API
  const searchCustomersAPI = async (searchQuery, status = 'active') => {
    try {
      setIsSearching(true);
     
      // Check if search method exists
      if (typeof ApiService.searchCustomers !== 'function') {
        console.warn('ApiService.searchCustomers not available, falling back to local search');
        return customers.filter(customer => {
          const searchLower = searchQuery.toLowerCase();
          return (
            customer.firstName.toLowerCase().includes(searchLower) ||
            customer.lastName.toLowerCase().includes(searchLower) ||
            customer.phone.includes(searchQuery) ||
            customer.email.toLowerCase().includes(searchLower) ||
            customer.address.toLowerCase().includes(searchLower)
          );
        });
      }
     
      const response = await ApiService.searchCustomers(searchQuery, 1, 1000, status);
     
      if (response && response.success && response.data?.customers) {
        const transformedCustomers = response.data.customers.map(customer => {
          const name = customer.name || '';
          const nameParts = name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';




          return {
            id: customer._id || customer.id,
            firstName,
            lastName,
            phone: customer.phone || '',
            email: customer.email || '',
            address: customer.address ?
              `${customer.address.street || ''} ${customer.address.city || ''} ${customer.address.state || ''}`.trim() :
              `${customer.city || ''} ${customer.state || ''}`.trim(),
            city: customer.address?.city || customer.city || '',
            state: customer.address?.state || customer.state || '',
            pinCode: customer.address?.pincode || customer.pincode || '',
            joinDate: customer.createdAt ?
              new Date(customer.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }) : 'Unknown',
            totalLoans: customer.totalLoans || 0,
            totalAmount: (customer.totalAmountTakenByUs || 0) / 100,
            status: customer.status || 'active',
            adhaarNumber: customer.adhaarNumber || '',
            rawData: customer
          };
        });
       
        return transformedCustomers;
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      // Fallback to local search if API search fails
      return customers.filter(customer => {
        const searchLower = searchQuery.toLowerCase();
        return (
          customer.firstName.toLowerCase().includes(searchLower) ||
          customer.lastName.toLowerCase().includes(searchLower) ||
          customer.phone.includes(searchQuery) ||
          customer.email.toLowerCase().includes(searchLower) ||
          customer.address.toLowerCase().includes(searchLower)
        );
      });
    } finally {
      setIsSearching(false);
    }
  };




  // Filter and sort customers
  useEffect(() => {
    const filterAndSort = async () => {
      let filtered = [...customers];




      // If there's a search term, use API search
      if (searchTerm.trim()) {
        const searchResults = await searchCustomersAPI(searchTerm, statusFilter === 'all' ? 'active' : statusFilter);
        filtered = searchResults;
      } else {
        // Apply status filter locally
        if (statusFilter !== 'all') {
          filtered = filtered.filter(customer => customer.status === statusFilter);
        }
      }




      // Apply sorting
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          case 'date':
            return new Date(b.rawData?.createdAt || 0) - new Date(a.rawData?.createdAt || 0);
          case 'loans':
            return (b.totalLoans || 0) - (a.totalLoans || 0);
          default:
            return 0;
        }
      });




      setFilteredCustomers(filtered);
    };




    filterAndSort();
  }, [customers, searchTerm, statusFilter, sortBy]);




  // Load customers on component mount
  useEffect(() => {
    // Add a small delay to ensure ApiService is properly loaded
    const timer = setTimeout(() => {
      loadCustomers();
    }, 100);




    return () => clearTimeout(timer);
  }, []);




  const handleAddCustomer = async (formData) => {
    try {
      setLoading(true);
      setError(null);
     
      // Check if create method exists
      if (typeof ApiService.createCustomer !== 'function') {
        throw new Error('ApiService.createCustomer is not available');
      }
     
      // Transform form data to API format
      const customerData = {
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        email: formData.email,
        address: {
          street: formData.address || '',
          city: formData.city || '',
          state: formData.state || '',
          pinCode: formData.pinCode || '',
        },
        idProof: {
          type: formData.idProofType || 'aadhar',
          number: formData.idProofNumber || '',
        }
      };




      console.log('Creating customer with data:', customerData);
      const response = await ApiService.createCustomer(customerData);
     
      if (response && response.success) {
        // Reload customers to get the updated list
        await loadCustomers();
        setShowAddModal(false);
      } else {
        throw new Error(response?.message || 'Failed to create customer');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      setError(error.message || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };




  const handleEdit = (customer) => {
    alert(`Edit functionality for ${customer.firstName} ${customer.lastName} will be implemented in the next phase`);
  };




  const handleView = (customer) => {
    setSelectedCustomerId(customer.id);
    setShowDetailView(true);
  };


  const handleBackFromDetail = () => {
    setShowDetailView(false);
    setSelectedCustomerId(null);
  };




  const handleExport = () => {
    try {
      // Enhanced CSV export with real data
      const csvContent = [
        ['ID', 'Name', 'Phone', 'Email', 'Address', 'City', 'State', 'PIN Code', 'Total Loans', 'Total Amount', 'Status', 'Join Date'],
        ...filteredCustomers.map(c => [
          c.id,
          `${c.firstName} ${c.lastName}`,
          c.phone,
          c.email,
          c.address,
          c.city,
          c.state,
          c.pinCode,
          c.totalLoans,
          c.totalAmount,
          c.status,
          c.joinDate
        ])
      ].map(row => row.join(',')).join('\n');
     
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };




  const handleRefresh = () => {
    loadCustomers();
  };




  // Debug component - shows API service status
  const debugApiService = () => {
    console.log('=== API Service Debug ===');
    console.log('ApiService:', ApiService);
    console.log('Type of ApiService:', typeof ApiService);
    console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(ApiService)));
    console.log('getAllCustomers method:', typeof ApiService.getAllCustomers);
    console.log('========================');
  };




  // Call debug on component mount
  useEffect(() => {
    debugApiService();
  }, []);


  // Show customer detail view if selected
  if (showDetailView && selectedCustomerId) {
    return (
      <CustomerDetailView 
        customerId={selectedCustomerId} 
        onBack={handleBackFromDetail}
      />
    );
  }




  if (loading && customers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Customers</h3>
          <p className="text-gray-600">Please wait while we fetch your customer data...</p>
          <button
            onClick={debugApiService}
            className="mt-4 px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Debug API Service
          </button>
        </div>
      </div>
    );
  }




  if (error && customers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Customers</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
            >
              Try Again
            </button>
            <button
              onClick={debugApiService}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
            >
              Debug API Service
            </button>
          </div>
        </div>
      </div>
    );
  }




  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-row sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-row sm:flex-row gap-3">
            <button
              onClick={handleExport}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-sm"
              disabled={loading}
            >
              <Download size={16} />
              Export Data
            </button>
            <button
              onClick={handleRefresh}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-sm"
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
              Refresh
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




        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              ×
            </button>
          </div>
        )}




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
            subtitle={stats.total > 0 ? `${((stats.active / stats.total) * 100).toFixed(1)}% of total` : '0% of total'}
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
            value={stats.totalAmount > 100000 ? `₹${(stats.totalAmount / 100000).toFixed(1)}L` : `₹${(stats.totalAmount / 1000).toFixed(1)}K`}
            subtitle="Total loan amount"
            color="orange"
          />
        </div>



        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredCustomers.length} of {customers.length} customers
            {isSearching && <Loader2 size={16} className="inline ml-2 animate-spin" />}
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

         {/* Customer Search Bar */}
          <div className="md:block w-full">
            <CustomerSearch
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onCustomerSelect={(customer) => {
                console.log("Selected customer:", customer);
                // 👉 you can navigate or open modal with customer details here
              }}
              onCreateCustomer={() => {
                 setShowAddModal(true)
              }}
            />
          </div>

        {/* Customer Grid/Table View */}
        {filteredCustomers.length === 0 && !loading ? (
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
          <div className="grid grid-cols md:grid-cols-2 xl:grid-cols-3 gap-6">
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
          loading={loading}
        />
      </div>
    </div>
  );
};




export default CustomerManagement;
