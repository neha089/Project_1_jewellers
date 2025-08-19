import React from 'react';
import { Search, Filter, SortAsc, Grid3X3, List, Calendar } from 'lucide-react';

const TransactionSearchFilterBar = ({ 
  searchTerm, 
  setSearchTerm, 
  categoryFilter, 
  setCategoryFilter, 
  methodFilter,
  setMethodFilter,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  sortBy, 
  setSortBy,
  viewMode,
  setViewMode 
}) => {
  const categories = [
    'All Categories',
    'Loan Payment',
    'Gold Purchase', 
    'Office Rent',
    'Cash Deposit',
    'Staff Salary',
    'Loan Interest'
  ];

  const methods = [
    'All Methods',
    'Cash',
    'Bank Transfer',
    'UPI',
    'Card',
    'Cheque'
  ];

  const dateFilters = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_30_days', label: 'Last 30 Days' }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by transaction ID, customer name, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent focus:bg-white transition-all duration-200"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 appearance-none min-w-40"
            >
              {categories.map(category => (
                <option key={category} value={category === 'All Categories' ? 'all' : category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Method Filter */}
          <div className="relative">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 appearance-none min-w-36"
            >
              {methods.map(method => (
                <option key={method} value={method === 'All Methods' ? 'all' : method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 appearance-none min-w-36"
            >
              {dateFilters.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="relative">
            <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 appearance-none min-w-40"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Amount</option>
              <option value="customer">Customer</option>
              <option value="type">Type</option>
              <option value="method">Method</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'grid' 
                  ? 'bg-white shadow-sm text-amber-600 border border-gray-200' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              title="Grid View"
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'table' 
                  ? 'bg-white shadow-sm text-amber-600 border border-gray-200' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              title="Table View"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionSearchFilterBar;