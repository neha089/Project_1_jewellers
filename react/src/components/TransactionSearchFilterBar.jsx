import React from 'react';
import { Search, Filter, SortAsc, Grid3X3, List, Calendar, ChevronDown } from 'lucide-react';

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

  const sortOptions = [
    { value: 'date', label: 'Sort by Date' },
    { value: 'amount', label: 'Amount' },
    { value: 'customer', label: 'Customer' },
    { value: 'type', label: 'Type' },
    { value: 'method', label: 'Method' }
  ];

  const hasActiveFilters = searchTerm || 
    categoryFilter !== 'all' || 
    methodFilter !== 'all' || 
    dateFilter !== 'all' || 
    sortBy !== 'date';

  const clearAllFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setMethodFilter('all');
    setDateFilter('all');
    setSortBy('date');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Search & Filter</h3>
            <p className="text-sm text-slate-600 mt-1">Find and organize transactions efficiently</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            <span>Real-time search</span>
          </div>
        </div>
      </div>

      {/* Search and Filters - All on one horizontal line */}
      <div className="p-6">
        <div className="flex items-end gap-4 flex-wrap lg:flex-nowrap">
          {/* Search Input */}
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by transaction ID, customer name, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg bg-white text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors text-lg"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="min-w-40">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Category
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 z-10" size={16} />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={16} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer hover:border-slate-400"
              >
                {categories.map(category => (
                  <option key={category} value={category === 'All Categories' ? 'all' : category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Method Filter */}
          <div className="min-w-36">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Method
            </label>
            <div className="relative">
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={16} />
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer hover:border-slate-400"
              >
                {methods.map(method => (
                  <option key={method} value={method === 'All Methods' ? 'all' : method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Filter */}
          <div className="min-w-36">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date Range
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 z-10" size={16} />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={16} />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer hover:border-slate-400"
              >
                {dateFilters.map(filter => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort Filter */}
          <div className="min-w-40">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Sort By
            </label>
            <div className="relative">
              <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 z-10" size={16} />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={16} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer hover:border-slate-400"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700 whitespace-nowrap">
              View:
            </label>
            <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center justify-center gap-1 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium ${
                  viewMode === 'grid' 
                    ? 'bg-white shadow-sm text-blue-600 border border-slate-200' 
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title="Grid View"
              >
                <Grid3X3 size={16} />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center justify-center gap-1 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium ${
                  viewMode === 'table' 
                    ? 'bg-white shadow-sm text-blue-600 border border-slate-200' 
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title="Table View"
              >
                <List size={16} />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100">
            <span className="text-sm font-medium text-slate-600">Active filters:</span>
            <div className="flex gap-2 flex-wrap">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:text-blue-900 transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}
              {categoryFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                  Category: {categoryFilter}
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className="ml-1 hover:text-emerald-900 transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}
              {methodFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                  Method: {methodFilter}
                  <button
                    onClick={() => setMethodFilter('all')}
                    className="ml-1 hover:text-purple-900 transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}
              {dateFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                  Date: {dateFilters.find(f => f.value === dateFilter)?.label}
                  <button
                    onClick={() => setDateFilter('all')}
                    className="ml-1 hover:text-amber-900 transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}
              {sortBy !== 'date' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                  Sort: {sortOptions.find(s => s.value === sortBy)?.label}
                  <button
                    onClick={() => setSortBy('date')}
                    className="ml-1 hover:text-indigo-900 transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-slate-500 hover:text-slate-700 underline transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionSearchFilterBar;
